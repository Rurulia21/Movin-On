"use strict";

/* ==================================================
   Movin' On
   Self Discovery Map
   map.js
================================================== */


/* ==================================================
   1. DOM
================================================== */

const mapViewport = document.getElementById("mapViewport");
const mapCanvas = document.getElementById("mapCanvas");
const nodeLayer = document.getElementById("nodeLayer");
const connectionLayer = document.getElementById("connectionLayer");

const editorPanel = document.getElementById("editorPanel");
const panelBackdrop = document.getElementById("panelBackdrop");
const closeEditorBtn = document.getElementById("closeEditorBtn");

const editorHeading = document.getElementById("editorHeading");
const nodeTitleInput = document.getElementById("nodeTitleInput");
const nodeMemoInput = document.getElementById("nodeMemoInput");
const memoCount = document.getElementById("memoCount");
const nodeDepth = document.getElementById("nodeDepth");
const childCount = document.getElementById("childCount");

const saveNodeBtn = document.getElementById("saveNodeBtn");
const openChildDialogBtn = document.getElementById("openChildDialogBtn");
const deleteNodeBtn = document.getElementById("deleteNodeBtn");

const childDialog = document.getElementById("childDialog");
const childForm = document.getElementById("childForm");
const childTitleInput = document.getElementById("childTitleInput");
const closeChildDialogBtn = document.getElementById(
  "closeChildDialogBtn"
);
const cancelChildBtn = document.getElementById("cancelChildBtn");

const resetDialog = document.getElementById("resetDialog");
const resetMapBtn = document.getElementById("resetMapBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");
const confirmResetBtn = document.getElementById("confirmResetBtn");

const centerMapBtn = document.getElementById("centerMapBtn");
const toast = document.getElementById("toast");


/* ==================================================
   2. Constants
================================================== */

const STORAGE_KEY = "movinon-self-discovery-map-v1";
const DATA_VERSION = 1;

const ROOT_ID = "self";

const PRIMARY_NODE_IDS = [
  "hobby",
  "study",
  "future",
  "other",
  "relation"
];

const PROTECTED_NODE_IDS = new Set([
  ROOT_ID,
  ...PRIMARY_NODE_IDS
]);

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 1200;

const MAP_CENTER = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2
};

/*
  5つの主題を均等な角度で配置する。
  -90度を上方向として時計回りに並ぶ。
*/
const PRIMARY_ANGLES = {
  hobby: -90,
  study: -18,
  future: 54,
  other: 126,
  relation: 198
};

const PRIMARY_RADIUS = 270;
const CHILD_LEVEL_DISTANCE = 185;

const BRANCH_SECTOR = 58;
const MIN_CHILD_ANGLE_GAP = 12;


/* ==================================================
   3. State
================================================== */

let appData = loadData();
let selectedNodeId = null;
let toastTimer = null;

let isDraggingViewport = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartScrollLeft = 0;
let dragStartScrollTop = 0;


/* ==================================================
   4. Default Data
================================================== */

function createDefaultData() {
  const now = new Date().toISOString();

  return {
    version: DATA_VERSION,

    nodes: {
      self: {
        id: "self",
        title: "自分",
        memo: "",
        parentId: null,
        children: [
          "hobby",
          "study",
          "future",
          "other",
          "relation"
        ],
        type: "root",
        createdAt: now,
        updatedAt: now
      },

      hobby: {
        id: "hobby",
        title: "趣味",
        memo: "",
        parentId: "self",
        children: [],
        type: "primary",
        createdAt: now,
        updatedAt: now
      },

      study: {
        id: "study",
        title: "学業",
        memo: "",
        parentId: "self",
        children: [],
        type: "primary",
        createdAt: now,
        updatedAt: now
      },

      future: {
        id: "future",
        title: "将来",
        memo: "",
        parentId: "self",
        children: [],
        type: "primary",
        createdAt: now,
        updatedAt: now
      },

      other: {
        id: "other",
        title: "その他",
        memo: "",
        parentId: "self",
        children: [],
        type: "primary",
        createdAt: now,
        updatedAt: now
      },

      relation: {
        id: "relation",
        title: "人間関係",
        memo: "",
        parentId: "self",
        children: [],
        type: "primary",
        createdAt: now,
        updatedAt: now
      }
    }
  };
}


/* ==================================================
   5. LocalStorage
================================================== */

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    const defaultData = createDefaultData();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultData)
    );
    return defaultData;
  }

  try {
    const parsedData = JSON.parse(savedData);

    if (
      !parsedData ||
      typeof parsedData !== "object" ||
      !parsedData.nodes
    ) {
      throw new Error("保存データの形式が不正です。");
    }

    return repairData(parsedData);
  } catch (error) {
    console.error("保存データの読み込みに失敗しました。", error);

    const defaultData = createDefaultData();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultData)
    );

    return defaultData;
  }
}


function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(appData)
  );
}


/*
  古いデータや一部欠けたデータを可能な範囲で補修する。
*/
function repairData(data) {
  const defaults = createDefaultData();

  data.version = DATA_VERSION;
  data.nodes ??= {};

  for (const fixedId of Object.keys(defaults.nodes)) {
    if (!data.nodes[fixedId]) {
      data.nodes[fixedId] = defaults.nodes[fixedId];
    }
  }

  for (const node of Object.values(data.nodes)) {
    node.title =
      typeof node.title === "string" && node.title.trim()
        ? node.title
        : "無題";

    node.memo =
      typeof node.memo === "string"
        ? node.memo
        : "";

    node.children = Array.isArray(node.children)
      ? node.children.filter(childId => data.nodes[childId])
      : [];

    node.createdAt ??= new Date().toISOString();
    node.updatedAt ??= node.createdAt;

    if (node.id === ROOT_ID) {
      node.parentId = null;
      node.type = "root";
    } else if (PRIMARY_NODE_IDS.includes(node.id)) {
      node.parentId = ROOT_ID;
      node.type = "primary";
    } else {
      node.type = "custom";
    }
  }

  /*
    ルート直下の5項目が欠けないようにする。
  */
  data.nodes.self.children = PRIMARY_NODE_IDS.filter(
    id => data.nodes[id]
  );

  return data;
}


/* ==================================================
   6. Utility
================================================== */

function generateNodeId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `node-${crypto.randomUUID()}`;
  }

  return `node-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}


function polarToCartesian(centerX, centerY, radius, angle) {
  const radians = degreesToRadians(angle);

  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY + Math.sin(radians) * radius
  };
}


function getNode(id) {
  return appData.nodes[id] ?? null;
}


function getNodeDepth(id) {
  let depth = 0;
  let current = getNode(id);

  while (current?.parentId) {
    depth += 1;
    current = getNode(current.parentId);
  }

  return depth;
}


function getDescendantIds(id) {
  const result = [];
  const node = getNode(id);

  if (!node) {
    return result;
  }

  for (const childId of node.children) {
    result.push(childId);
    result.push(...getDescendantIds(childId));
  }

  return result;
}


function getAncestorIds(id) {
  const ancestors = [];
  let current = getNode(id);

  while (current?.parentId) {
    ancestors.push(current.parentId);
    current = getNode(current.parentId);
  }

  return ancestors;
}


function getPrimaryAncestorId(id) {
  if (PRIMARY_NODE_IDS.includes(id)) {
    return id;
  }

  let current = getNode(id);

  while (current?.parentId) {
    if (PRIMARY_NODE_IDS.includes(current.parentId)) {
      return current.parentId;
    }

    current = getNode(current.parentId);
  }

  return null;
}


function truncateText(text, maxLength = 22) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}


/* ==================================================
   7. Automatic Layout
================================================== */

/*
  自動配置結果：
  {
    nodeId: { x, y, angle, depth }
  }
*/
function calculateLayout() {
  const positions = {};

  positions.self = {
    x: MAP_CENTER.x,
    y: MAP_CENTER.y,
    angle: 0,
    depth: 0
  };

  for (const primaryId of PRIMARY_NODE_IDS) {
    const primaryAngle = PRIMARY_ANGLES[primaryId];

    const primaryPosition = polarToCartesian(
      MAP_CENTER.x,
      MAP_CENTER.y,
      PRIMARY_RADIUS,
      primaryAngle
    );

    positions[primaryId] = {
      ...primaryPosition,
      angle: primaryAngle,
      depth: 1
    };

    layoutChildren({
      parentId: primaryId,
      branchAngle: primaryAngle,
      sectorStart: primaryAngle - BRANCH_SECTOR / 2,
      sectorEnd: primaryAngle + BRANCH_SECTOR / 2,
      depth: 2,
      positions
    });
  }

  return positions;
}


/*
  各主題から外側へ扇状に枝を伸ばす。
*/
function layoutChildren({
  parentId,
  branchAngle,
  sectorStart,
  sectorEnd,
  depth,
  positions
}) {
  const parent = getNode(parentId);

  if (!parent || parent.children.length === 0) {
    return;
  }

  const children = parent.children.filter(id => getNode(id));

  if (children.length === 0) {
    return;
  }

  const availableWidth = sectorEnd - sectorStart;

  let angleGap =
    children.length === 1
      ? 0
      : availableWidth / (children.length - 1);

  angleGap = Math.max(
    Math.min(angleGap, 24),
    MIN_CHILD_ANGLE_GAP
  );

  const totalSpread =
    children.length === 1
      ? 0
      : angleGap * (children.length - 1);

  const firstAngle = branchAngle - totalSpread / 2;

  children.forEach((childId, index) => {
    const angle =
      children.length === 1
        ? branchAngle
        : firstAngle + angleGap * index;

    const radius =
      PRIMARY_RADIUS +
      (depth - 1) * CHILD_LEVEL_DISTANCE;

    const position = polarToCartesian(
      MAP_CENTER.x,
      MAP_CENTER.y,
      radius,
      angle
    );

    positions[childId] = {
      ...position,
      angle,
      depth
    };

    const childSectorWidth = Math.max(
      16,
      Math.min(
        42,
        angleGap || availableWidth * 0.7
      )
    );

    layoutChildren({
      parentId: childId,
      branchAngle: angle,
      sectorStart: angle - childSectorWidth / 2,
      sectorEnd: angle + childSectorWidth / 2,
      depth: depth + 1,
      positions
    });
  });
}


/* ==================================================
   8. Rendering
================================================== */

function renderMap(options = {}) {
  const {
    animateNodeId = null,
    keepSelected = true
  } = options;

  nodeLayer.innerHTML = "";
  connectionLayer.innerHTML = "";

  const positions = calculateLayout();

  renderConnections(positions);
  renderNodes(positions, animateNodeId);

  if (keepSelected && selectedNodeId) {
    updateSelectionAppearance();
  }
}


function renderNodes(positions, animateNodeId) {
  const fragment = document.createDocumentFragment();

  for (const node of Object.values(appData.nodes)) {
    const position = positions[node.id];

    if (!position) {
      continue;
    }

    const button = document.createElement("button");

    button.type = "button";
    button.className = "map-node";
    button.dataset.nodeId = node.id;
    button.dataset.type = node.type;

    button.style.left = `${position.x}px`;
    button.style.top = `${position.y}px`;

    button.setAttribute(
      "aria-label",
      `${node.title}を編集`
    );

    if (animateNodeId === node.id) {
      button.classList.add("is-new");
    }

    const content = document.createElement("span");
    content.className = "node-content";

    const title = document.createElement("span");
    title.className = "node-title";
    title.textContent = truncateText(node.title);

    const meta = document.createElement("span");
    meta.className = "node-meta";

    if (node.memo.trim()) {
      const memoMark = document.createElement("span");
      memoMark.className = "node-memo-mark";
      meta.appendChild(memoMark);
    }

    if (node.children.length > 0) {
      const childrenText = document.createElement("span");
      childrenText.textContent =
        `${node.children.length} BRANCH`;

      meta.appendChild(childrenText);
    } else if (node.memo.trim()) {
      const memoText = document.createElement("span");
      memoText.textContent = "MEMO";
      meta.appendChild(memoText);
    }

    content.appendChild(title);
    content.appendChild(meta);
    button.appendChild(content);

    button.addEventListener("click", event => {
      event.stopPropagation();
      openEditor(node.id);
    });

    fragment.appendChild(button);
  }

  nodeLayer.appendChild(fragment);
}


function renderConnections(positions) {
  for (const node of Object.values(appData.nodes)) {
    if (!node.parentId) {
      continue;
    }

    const parentPosition = positions[node.parentId];
    const childPosition = positions[node.id];

    if (!parentPosition || !childPosition) {
      continue;
    }

    const path = document.createElementNS(
      SVG_NAMESPACE,
      "path"
    );

    path.dataset.parentId = node.parentId;
    path.dataset.childId = node.id;

    path.setAttribute(
      "d",
      createConnectionPath(parentPosition, childPosition)
    );

    connectionLayer.appendChild(path);
  }
}


function createConnectionPath(parent, child) {
  const horizontalDifference = child.x - parent.x;
  const verticalDifference = child.y - parent.y;

  const control1 = {
    x: parent.x + horizontalDifference * 0.42,
    y: parent.y + verticalDifference * 0.18
  };

  const control2 = {
    x: parent.x + horizontalDifference * 0.74,
    y: parent.y + verticalDifference * 0.76
  };

  return [
    `M ${parent.x} ${parent.y}`,
    `C ${control1.x} ${control1.y}`,
    `${control2.x} ${control2.y}`,
    `${child.x} ${child.y}`
  ].join(" ");
}


/* ==================================================
   9. Selection
================================================== */

function updateSelectionAppearance() {
  document
    .querySelectorAll(".map-node")
    .forEach(element => {
      const isSelected =
        element.dataset.nodeId === selectedNodeId;

      element.classList.toggle(
        "is-selected",
        isSelected
      );
    });

  document
    .querySelectorAll(".connections path")
    .forEach(path => {
      path.classList.remove("is-active");
    });

  if (!selectedNodeId) {
    return;
  }

  const relatedIds = new Set([
    selectedNodeId,
    ...getAncestorIds(selectedNodeId),
    ...getDescendantIds(selectedNodeId)
  ]);

  document
    .querySelectorAll(".connections path")
    .forEach(path => {
      const parentId = path.dataset.parentId;
      const childId = path.dataset.childId;

      if (
        relatedIds.has(parentId) &&
        relatedIds.has(childId)
      ) {
        path.classList.add("is-active");
      }
    });
}


/* ==================================================
   10. Editor Panel
================================================== */

function openEditor(nodeId) {
  const node = getNode(nodeId);

  if (!node) {
    return;
  }

  selectedNodeId = nodeId;

  editorHeading.textContent = node.title;
  nodeTitleInput.value = node.title;
  nodeMemoInput.value = node.memo;

  updateMemoCounter();
  updateNodeInformation(nodeId);

  deleteNodeBtn.disabled =
    PROTECTED_NODE_IDS.has(nodeId);

  editorPanel.classList.add("is-open");
  panelBackdrop.classList.add("is-visible");

  editorPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");

  updateSelectionAppearance();

  window.setTimeout(() => {
    nodeTitleInput.focus();
    nodeTitleInput.select();
  }, 240);
}


function closeEditor() {
  editorPanel.classList.remove("is-open");
  panelBackdrop.classList.remove("is-visible");

  editorPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("panel-open");
}


function updateNodeInformation(nodeId) {
  const node = getNode(nodeId);

  if (!node) {
    return;
  }

  nodeDepth.textContent = String(getNodeDepth(nodeId));
  childCount.textContent = String(node.children.length);
}


function updateMemoCounter() {
  memoCount.textContent =
    `${nodeMemoInput.value.length} / 2000`;
}


/* ==================================================
   11. Save / Rename
================================================== */

function saveSelectedNode() {
  const node = getNode(selectedNodeId);

  if (!node) {
    return;
  }

  const newTitle = nodeTitleInput.value.trim();

  if (!newTitle) {
    showToast("項目名を入力してください");
    nodeTitleInput.focus();
    return;
  }

  node.title = newTitle;
  node.memo = nodeMemoInput.value;
  node.updatedAt = new Date().toISOString();

  saveData();
  renderMap();

  editorHeading.textContent = node.title;
  updateNodeInformation(node.id);

  showToast("変更を保存しました");
}


/* ==================================================
   12. Child Nodes
================================================== */

function openChildDialog() {
  if (!selectedNodeId) {
    return;
  }

  childTitleInput.value = "";

  if (typeof childDialog.showModal === "function") {
    childDialog.showModal();
  } else {
    childDialog.setAttribute("open", "");
  }

  window.setTimeout(() => {
    childTitleInput.focus();
  }, 80);
}


function closeChildDialog() {
  if (typeof childDialog.close === "function") {
    childDialog.close();
  } else {
    childDialog.removeAttribute("open");
  }
}


function createChildNode(title) {
  const parent = getNode(selectedNodeId);

  if (!parent) {
    return null;
  }

  const id = generateNodeId();
  const now = new Date().toISOString();

  appData.nodes[id] = {
    id,
    title,
    memo: "",
    parentId: parent.id,
    children: [],
    type: "custom",
    createdAt: now,
    updatedAt: now
  };

  parent.children.push(id);
  parent.updatedAt = now;

  saveData();
  renderMap({
    animateNodeId: id
  });

  return id;
}


/* ==================================================
   13. Delete
================================================== */

function deleteSelectedNode() {
  const node = getNode(selectedNodeId);

  if (!node) {
    return;
  }

  if (PROTECTED_NODE_IDS.has(node.id)) {
    showToast("基本項目は削除できません");
    return;
  }

  const descendantIds = getDescendantIds(node.id);
  const totalDeleteCount = descendantIds.length + 1;

  const message =
    totalDeleteCount > 1
      ? `「${node.title}」と、その下にある${descendantIds.length}件の項目を削除しますか？`
      : `「${node.title}」を削除しますか？`;

  const confirmed = window.confirm(message);

  if (!confirmed) {
    return;
  }

  const parent = getNode(node.parentId);

  if (parent) {
    parent.children = parent.children.filter(
      childId => childId !== node.id
    );

    parent.updatedAt = new Date().toISOString();
  }

  for (const descendantId of descendantIds) {
    delete appData.nodes[descendantId];
  }

  delete appData.nodes[node.id];

  selectedNodeId = null;

  saveData();
  closeEditor();
  renderMap({
    keepSelected: false
  });

  showToast(
    totalDeleteCount > 1
      ? `${totalDeleteCount}件の項目を削除しました`
      : "項目を削除しました"
  );
}


/* ==================================================
   14. Reset
================================================== */

function openResetDialog() {
  if (typeof resetDialog.showModal === "function") {
    resetDialog.showModal();
  } else {
    resetDialog.setAttribute("open", "");
  }
}


function closeResetDialog() {
  if (typeof resetDialog.close === "function") {
    resetDialog.close();
  } else {
    resetDialog.removeAttribute("open");
  }
}


function resetMap() {
  appData = createDefaultData();
  selectedNodeId = null;

  saveData();
  closeEditor();
  closeResetDialog();

  renderMap({
    keepSelected: false
  });

  centerMap(false);

  showToast("マップを初期化しました");
}


/* ==================================================
   15. Map Centering
================================================== */

function centerMap(smooth = true) {
  const targetLeft =
    MAP_CENTER.x -
    mapViewport.clientWidth / 2;

  const targetTop =
    MAP_CENTER.y -
    mapViewport.clientHeight / 2;

  mapViewport.scrollTo({
    left: Math.max(0, targetLeft),
    top: Math.max(0, targetTop),
    behavior: smooth ? "smooth" : "auto"
  });
}


function revealNode(nodeId) {
  const element = document.querySelector(
    `.map-node[data-node-id="${nodeId}"]`
  );

  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center"
  });
}


/* ==================================================
   16. Toast
================================================== */

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(toastTimer);

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1900);
}


/* ==================================================
   17. Viewport Drag Scrolling
================================================== */

function startViewportDrag(event) {
  const interactiveElement = event.target.closest(
    "button, input, textarea, a"
  );

  if (interactiveElement) {
    return;
  }

  isDraggingViewport = true;

  dragStartX = event.clientX;
  dragStartY = event.clientY;

  dragStartScrollLeft = mapViewport.scrollLeft;
  dragStartScrollTop = mapViewport.scrollTop;

  mapViewport.setPointerCapture(event.pointerId);
}


function moveViewportDrag(event) {
  if (!isDraggingViewport) {
    return;
  }

  const differenceX = event.clientX - dragStartX;
  const differenceY = event.clientY - dragStartY;

  mapViewport.scrollLeft =
    dragStartScrollLeft - differenceX;

  mapViewport.scrollTop =
    dragStartScrollTop - differenceY;
}


function stopViewportDrag(event) {
  if (!isDraggingViewport) {
    return;
  }

  isDraggingViewport = false;

  if (
    typeof mapViewport.hasPointerCapture === "function" &&
    mapViewport.hasPointerCapture(event.pointerId)
  ) {
    mapViewport.releasePointerCapture(event.pointerId);
  }
}


/* ==================================================
   18. Events
================================================== */

saveNodeBtn.addEventListener(
  "click",
  saveSelectedNode
);

openChildDialogBtn.addEventListener(
  "click",
  openChildDialog
);

deleteNodeBtn.addEventListener(
  "click",
  deleteSelectedNode
);

closeEditorBtn.addEventListener(
  "click",
  closeEditor
);

panelBackdrop.addEventListener(
  "click",
  closeEditor
);

nodeMemoInput.addEventListener(
  "input",
  updateMemoCounter
);

nodeTitleInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" &&
      !event.isComposing
    ) {
      event.preventDefault();
      saveSelectedNode();
    }
  }
);


childForm.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const title = childTitleInput.value.trim();

    if (!title) {
      childTitleInput.focus();
      return;
    }

    const newNodeId = createChildNode(title);

    closeChildDialog();

    if (newNodeId) {
      openEditor(newNodeId);

      window.setTimeout(() => {
        revealNode(newNodeId);
      }, 100);

      showToast("新しい枝を追加しました");
    }
  }
);

closeChildDialogBtn.addEventListener(
  "click",
  closeChildDialog
);

cancelChildBtn.addEventListener(
  "click",
  closeChildDialog
);


resetMapBtn.addEventListener(
  "click",
  openResetDialog
);

cancelResetBtn.addEventListener(
  "click",
  closeResetDialog
);

confirmResetBtn.addEventListener(
  "click",
  resetMap
);


centerMapBtn.addEventListener(
  "click",
  () => centerMap(true)
);


mapViewport.addEventListener(
  "pointerdown",
  startViewportDrag
);

mapViewport.addEventListener(
  "pointermove",
  moveViewportDrag
);

mapViewport.addEventListener(
  "pointerup",
  stopViewportDrag
);

mapViewport.addEventListener(
  "pointercancel",
  stopViewportDrag
);


document.addEventListener(
  "keydown",
  event => {
    if (event.key !== "Escape") {
      return;
    }

    if (childDialog.open) {
      closeChildDialog();
      return;
    }

    if (resetDialog.open) {
      closeResetDialog();
      return;
    }

    closeEditor();
  }
);


window.addEventListener(
  "resize",
  () => {
    /*
      配置座標自体は固定だが、
      SVGと選択表示を念のため再描画する。
    */
    renderMap();
  }
);


/* ==================================================
   19. Initialisation
================================================== */

function initialiseApplication() {
  /*
    HTMLとCSSのキャンバスサイズを
    JavaScript側の値と揃える。
  */
  mapCanvas.style.width = `${CANVAS_WIDTH}px`;
  mapCanvas.style.height = `${CANVAS_HEIGHT}px`;

  renderMap();

  window.requestAnimationFrame(() => {
    centerMap(false);
  });
}


initialiseApplication();