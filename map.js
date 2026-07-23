"use strict";


/* ==================================================
   Movin' On
   Self Discovery Map
   Auto-expanding Scroll Canvas
================================================== */


/* ==================================================
   1. DOM
================================================== */

const mapViewport =
  document.getElementById("mapViewport");

const mapCanvas =
  document.getElementById("mapCanvas");

const nodeLayer =
  document.getElementById("nodeLayer");

const connections =
  document.getElementById("connections");

const connectionLayer =
  document.getElementById("connectionLayer");


const editorPanel =
  document.getElementById("editorPanel");

const panelBackdrop =
  document.getElementById("panelBackdrop");

const closeEditorBtn =
  document.getElementById("closeEditorBtn");


const editorHeading =
  document.getElementById("editorHeading");

const nodeTitleInput =
  document.getElementById("nodeTitleInput");

const nodeMemoInput =
  document.getElementById("nodeMemoInput");

const memoCount =
  document.getElementById("memoCount");

const nodeDepth =
  document.getElementById("nodeDepth");

const childCount =
  document.getElementById("childCount");


const saveNodeBtn =
  document.getElementById("saveNodeBtn");

const openChildDialogBtn =
  document.getElementById("openChildDialogBtn");

const deleteNodeBtn =
  document.getElementById("deleteNodeBtn");


const childDialog =
  document.getElementById("childDialog");

const childForm =
  document.getElementById("childForm");

const childTitleInput =
  document.getElementById("childTitleInput");

const closeChildDialogBtn =
  document.getElementById(
    "closeChildDialogBtn"
  );

const cancelChildBtn =
  document.getElementById("cancelChildBtn");


const resetDialog =
  document.getElementById("resetDialog");

const resetMapBtn =
  document.getElementById("resetMapBtn");

const cancelResetBtn =
  document.getElementById("cancelResetBtn");

const confirmResetBtn =
  document.getElementById("confirmResetBtn");


const zoomOutBtn =
  document.getElementById("zoomOutBtn");

const zoomInBtn =
  document.getElementById("zoomInBtn");

const zoomValue =
  document.getElementById("zoomValue");

const fitMapBtn =
  document.getElementById("fitMapBtn");

const centerMapBtn =
  document.getElementById("centerMapBtn");


const toast =
  document.getElementById("toast");


/* ==================================================
   2. Constants
================================================== */

const STORAGE_KEY =
  "movinon-self-discovery-map-v1";

const DATA_VERSION =
  1;

const ROOT_ID =
  "self";


const PRIMARY_NODE_IDS = [
  "hobby",
  "study",
  "future",
  "other",
  "relation"
];


const PROTECTED_NODE_IDS =
  new Set([
    ROOT_ID,
    ...PRIMARY_NODE_IDS
  ]);


const SVG_NAMESPACE =
  "http://www.w3.org/2000/svg";


const MIN_ZOOM =
  0.2;

const MAX_ZOOM =
  1.6;

const ZOOM_STEP =
  0.1;


/*
  固定5項目を配置する角度。

  -90度が上方向。
*/
const PRIMARY_ANGLES = {
  hobby: -90,
  study: -18,
  future: 54,
  other: 126,
  relation: 198
};


const PRIMARY_RADIUS =
  270;

const CHILD_LEVEL_DISTANCE =
  185;

const BRANCH_SECTOR =
  58;

const MIN_CHILD_ANGLE_GAP =
  12;


/*
  ノードのおおよその半分の大きさ。

  キャンバス範囲と
  全体表示の計算に使用する。
*/
const NODE_HALF_WIDTH =
  105;

const NODE_HALF_HEIGHT =
  58;


/*
  キャンバス外周に確保する余白。
*/
const CANVAS_PADDING_X =
  260;

const CANVAS_PADDING_Y =
  220;


/*
  「全体表示」の余白。
*/
const FIT_PADDING_X =
  100;

const FIT_PADDING_Y =
  90;


/* ==================================================
   3. State
================================================== */

let appData =
  loadData();

let selectedNodeId =
  null;

let toastTimer =
  null;

let zoomLevel =
  1;


/*
  ズーム前の論理キャンバスサイズ。
*/
let baseCanvasWidth =
  1;

let baseCanvasHeight =
  1;


/*
  キャンバスへ移動した後の
  現在のノード座標。
*/
let currentPositions =
  {};


/*
  0,0を「自分」とした
  移動前のノード座標。
*/
let currentRawPositions =
  {};


/*
  実際にノードが存在する範囲。
*/
let currentContentBounds =
  null;


/*
  ドラッグスクロール用。
*/
let isDraggingViewport =
  false;

let dragPointerId =
  null;

let dragStartX =
  0;

let dragStartY =
  0;

let dragStartScrollLeft =
  0;

let dragStartScrollTop =
  0;


/* ==================================================
   4. Default Data
================================================== */

function createDefaultData() {
  const now =
    new Date().toISOString();


  return {
    version:
      DATA_VERSION,

    nodes: {
      self: {
        id:
          "self",

        title:
          "自分",

        memo:
          "",

        parentId:
          null,

        children: [
          "hobby",
          "study",
          "future",
          "other",
          "relation"
        ],

        type:
          "root",

        createdAt:
          now,

        updatedAt:
          now
      },


      hobby: {
        id:
          "hobby",

        title:
          "趣味",

        memo:
          "",

        parentId:
          "self",

        children:
          [],

        type:
          "primary",

        createdAt:
          now,

        updatedAt:
          now
      },


      study: {
        id:
          "study",

        title:
          "学業",

        memo:
          "",

        parentId:
          "self",

        children:
          [],

        type:
          "primary",

        createdAt:
          now,

        updatedAt:
          now
      },


      future: {
        id:
          "future",

        title:
          "将来",

        memo:
          "",

        parentId:
          "self",

        children:
          [],

        type:
          "primary",

        createdAt:
          now,

        updatedAt:
          now
      },


      other: {
        id:
          "other",

        title:
          "その他",

        memo:
          "",

        parentId:
          "self",

        children:
          [],

        type:
          "primary",

        createdAt:
          now,

        updatedAt:
          now
      },


      relation: {
        id:
          "relation",

        title:
          "人間関係",

        memo:
          "",

        parentId:
          "self",

        children:
          [],

        type:
          "primary",

        createdAt:
          now,

        updatedAt:
          now
      }
    }
  };
}


/* ==================================================
   5. LocalStorage
================================================== */

function loadData() {
  const savedData =
    localStorage.getItem(
      STORAGE_KEY
    );


  if (!savedData) {
    const defaultData =
      createDefaultData();


    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultData
      )
    );


    return defaultData;
  }


  try {
    const parsedData =
      JSON.parse(
        savedData
      );


    if (
      !parsedData ||
      typeof parsedData !== "object" ||
      !parsedData.nodes
    ) {
      throw new Error(
        "保存データの形式が不正です。"
      );
    }


    const repairedData =
      repairData(
        parsedData
      );


    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        repairedData
      )
    );


    return repairedData;

  } catch (error) {
    console.error(
      "保存データの読み込みに失敗しました。",
      error
    );


    const defaultData =
      createDefaultData();


    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultData
      )
    );


    return defaultData;
  }
}


function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      appData
    )
  );
}


/*
  保存データに欠損があった場合、
  可能な範囲で補修する。
*/
function repairData(data) {
  const defaults =
    createDefaultData();


  data.version =
    DATA_VERSION;

  data.nodes ??=
    {};


  /*
    固定項目が消えていた場合は復元。
  */
  for (
    const fixedId
    of Object.keys(
      defaults.nodes
    )
  ) {
    if (!data.nodes[fixedId]) {
      data.nodes[fixedId] =
        defaults.nodes[fixedId];
    }
  }


  for (
    const [nodeId, node]
    of Object.entries(
      data.nodes
    )
  ) {
    node.id =
      nodeId;


    node.title =
      typeof node.title === "string" &&
      node.title.trim()

        ? node.title.trim()

        : "無題";


    node.memo =
      typeof node.memo === "string"

        ? node.memo

        : "";


    node.children =
      Array.isArray(
        node.children
      )

        ? [
            ...new Set(
              node.children.filter(
                childId =>
                  childId !== nodeId &&
                  Boolean(
                    data.nodes[childId]
                  )
              )
            )
          ]

        : [];


    node.createdAt ??=
      new Date().toISOString();

    node.updatedAt ??=
      node.createdAt;


    if (
      nodeId === ROOT_ID
    ) {
      node.parentId =
        null;

      node.type =
        "root";

    } else if (
      PRIMARY_NODE_IDS.includes(
        nodeId
      )
    ) {
      node.parentId =
        ROOT_ID;

      node.type =
        "primary";

    } else {
      node.type =
        "custom";


      if (
        !node.parentId ||
        !data.nodes[node.parentId]
      ) {
        node.parentId =
          ROOT_ID;
      }
    }
  }


  /*
    子側のparentIdを基準に、
    親側childrenの不足を補う。
  */
  for (
    const node
    of Object.values(
      data.nodes
    )
  ) {
    if (!node.parentId) {
      continue;
    }


    const parent =
      data.nodes[
        node.parentId
      ];


    if (
      parent &&
      !parent.children.includes(
        node.id
      )
    ) {
      parent.children.push(
        node.id
      );
    }
  }


  /*
    固定5項目をルート直下の先頭へ置く。
    ルートへ直接追加したカスタム項目は残す。
  */
  const customRootChildren =
    Object.values(
      data.nodes
    )
      .filter(
        node =>
          node.parentId === ROOT_ID &&
          !PRIMARY_NODE_IDS.includes(
            node.id
          )
      )
      .map(
        node => node.id
      );


  data.nodes[
    ROOT_ID
  ].children = [
    ...PRIMARY_NODE_IDS,
    ...customRootChildren
  ];


  return data;
}


/* ==================================================
   6. Utility
================================================== */

function generateNodeId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return (
      `node-${crypto.randomUUID()}`
    );
  }


  return (
    `node-${Date.now()}-` +
    Math.random()
      .toString(16)
      .slice(2)
  );
}


function degreesToRadians(
  degrees
) {
  return (
    degrees *
    Math.PI /
    180
  );
}


function polarToCartesian(
  centerX,
  centerY,
  radius,
  angle
) {
  const radians =
    degreesToRadians(
      angle
    );


  return {
    x:
      centerX +
      Math.cos(
        radians
      ) *
      radius,

    y:
      centerY +
      Math.sin(
        radians
      ) *
      radius
  };
}


function getNode(id) {
  return (
    appData.nodes[id] ??
    null
  );
}


function getNodeDepth(id) {
  let depth =
    0;

  let current =
    getNode(id);

  const visited =
    new Set();


  while (
    current?.parentId &&
    !visited.has(
      current.id
    )
  ) {
    visited.add(
      current.id
    );

    depth +=
      1;

    current =
      getNode(
        current.parentId
      );
  }


  return depth;
}


function getDescendantIds(
  id,
  visited = new Set()
) {
  if (
    visited.has(id)
  ) {
    return [];
  }


  visited.add(id);


  const node =
    getNode(id);


  if (!node) {
    return [];
  }


  const result =
    [];


  for (
    const childId
    of node.children
  ) {
    if (
      visited.has(
        childId
      )
    ) {
      continue;
    }


    result.push(
      childId
    );


    result.push(
      ...getDescendantIds(
        childId,
        visited
      )
    );
  }


  return result;
}


function getAncestorIds(id) {
  const result =
    [];

  const visited =
    new Set();

  let current =
    getNode(id);


  while (
    current?.parentId &&
    !visited.has(
      current.id
    )
  ) {
    visited.add(
      current.id
    );


    result.push(
      current.parentId
    );


    current =
      getNode(
        current.parentId
      );
  }


  return result;
}


function truncateText(
  text,
  maxLength = 22
) {
  if (
    text.length <= maxLength
  ) {
    return text;
  }


  return (
    `${text.slice(
      0,
      maxLength - 1
    )}…`
  );
}


function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}


function clampZoom(value) {
  return clamp(
    value,
    MIN_ZOOM,
    MAX_ZOOM
  );
}


/* ==================================================
   7. Automatic Layout
================================================== */

/*
  「自分」を0,0として、
  正負を含む座標で配置する。
*/
function calculateRawLayout() {
  const positions = {
    [ROOT_ID]: {
      x:
        0,

      y:
        0,

      angle:
        0,

      depth:
        0
    }
  };


  for (
    const primaryId
    of PRIMARY_NODE_IDS
  ) {
    if (
      !getNode(primaryId)
    ) {
      continue;
    }


    const angle =
      PRIMARY_ANGLES[
        primaryId
      ];


    positions[
      primaryId
    ] = {
      ...polarToCartesian(
        0,
        0,
        PRIMARY_RADIUS,
        angle
      ),

      angle,

      depth:
        1
    };


    layoutChildren({
      parentId:
        primaryId,

      branchAngle:
        angle,

      sectorStart:
        angle -
        BRANCH_SECTOR / 2,

      sectorEnd:
        angle +
        BRANCH_SECTOR / 2,

      depth:
        2,

      positions,

      visited:
        new Set([
          ROOT_ID
        ])
    });
  }


  /*
    ルートから直接追加された
    固定項目以外の枝にも対応する。
  */
  const rootNode =
    getNode(
      ROOT_ID
    );


  const extraRootChildren =
    rootNode

      ? rootNode.children.filter(
          childId =>
            !PRIMARY_NODE_IDS.includes(
              childId
            ) &&
            getNode(
              childId
            )
        )

      : [];


  extraRootChildren.forEach(
    (
      childId,
      index
    ) => {
      const angle =
        -90 +
        (
          360 /
          Math.max(
            extraRootChildren.length,
            1
          )
        ) *
        index;


      positions[
        childId
      ] = {
        ...polarToCartesian(
          0,
          0,
          PRIMARY_RADIUS + 70,
          angle
        ),

        angle,

        depth:
          1
      };


      layoutChildren({
        parentId:
          childId,

        branchAngle:
          angle,

        sectorStart:
          angle -
          BRANCH_SECTOR / 2,

        sectorEnd:
          angle +
          BRANCH_SECTOR / 2,

        depth:
          2,

        positions,

        visited:
          new Set([
            ROOT_ID
          ])
      });
    }
  );


  return positions;
}


/*
  子項目を外側へ扇状に配置する。
*/
function layoutChildren({
  parentId,
  branchAngle,
  sectorStart,
  sectorEnd,
  depth,
  positions,
  visited
}) {
  if (
    visited.has(
      parentId
    )
  ) {
    return;
  }


  const nextVisited =
    new Set(
      visited
    );


  nextVisited.add(
    parentId
  );


  const parent =
    getNode(
      parentId
    );


  if (
    !parent ||
    parent.children.length === 0
  ) {
    return;
  }


  const children =
    parent.children.filter(
      childId =>
        getNode(
          childId
        ) &&
        !nextVisited.has(
          childId
        )
    );


  if (
    children.length === 0
  ) {
    return;
  }


  const availableWidth =
    sectorEnd -
    sectorStart;


  let angleGap =
    children.length === 1

      ? 0

      : availableWidth /
        (
          children.length -
          1
        );


  angleGap =
    Math.max(
      Math.min(
        angleGap,
        24
      ),
      MIN_CHILD_ANGLE_GAP
    );


  const totalSpread =
    children.length === 1

      ? 0

      : angleGap *
        (
          children.length -
          1
        );


  const firstAngle =
    branchAngle -
    totalSpread / 2;


  children.forEach(
    (
      childId,
      index
    ) => {
      const angle =
        children.length === 1

          ? branchAngle

          : firstAngle +
            angleGap *
            index;


      const radius =
        PRIMARY_RADIUS +
        (
          depth -
          1
        ) *
        CHILD_LEVEL_DISTANCE;


      positions[
        childId
      ] = {
        ...polarToCartesian(
          0,
          0,
          radius,
          angle
        ),

        angle,

        depth
      };


      const childSectorWidth =
        Math.max(
          16,

          Math.min(
            42,

            angleGap ||
            availableWidth *
            0.7
          )
        );


      layoutChildren({
        parentId:
          childId,

        branchAngle:
          angle,

        sectorStart:
          angle -
          childSectorWidth / 2,

        sectorEnd:
          angle +
          childSectorWidth / 2,

        depth:
          depth + 1,

        positions,

        visited:
          nextVisited
      });
    }
  );
}


/* ==================================================
   8. Canvas Calculation
================================================== */

/*
  0,0を中心とした項目の実際の範囲を取得する。
*/
function calculateRawBounds(
  rawPositions
) {
  const visiblePositions =
    Object.values(
      rawPositions
    );


  const xValues =
    visiblePositions.map(
      position =>
        position.x
    );


  const yValues =
    visiblePositions.map(
      position =>
        position.y
    );


  return {
    minX:
      Math.min(
        ...xValues
      ) -
      NODE_HALF_WIDTH,

    maxX:
      Math.max(
        ...xValues
      ) +
      NODE_HALF_WIDTH,

    minY:
      Math.min(
        ...yValues
      ) -
      NODE_HALF_HEIGHT,

    maxY:
      Math.max(
        ...yValues
      ) +
      NODE_HALF_HEIGHT
  };
}


/*
  「自分」を常にキャンバスの中央へ置く。

  例えば右側へ項目が大きく伸びた場合、
  左側にも同じ幅を確保する。

  これにより項目が増えても、
  「自分」のキャンバス上の位置は中央からずれない。
*/
function normalizeLayout(
  rawPositions
) {
  const bounds =
    calculateRawBounds(
      rawPositions
    );


  /*
    表示領域より小さすぎない
    最低限の半径を確保する。
  */
  const minimumHalfWidth =
    mapViewport.clientWidth /
    Math.max(
      zoomLevel,
      0.01
    ) /
    2 +
    80;


  const minimumHalfHeight =
    mapViewport.clientHeight /
    Math.max(
      zoomLevel,
      0.01
    ) /
    2 +
    80;


  /*
    左右で必要な幅のうち、
    大きい方を両側へ使用する。
  */
  const halfWidth =
    Math.max(
      Math.abs(
        bounds.minX
      ),

      Math.abs(
        bounds.maxX
      ),

      minimumHalfWidth
    ) +
    CANVAS_PADDING_X;


  /*
    上下も同様に、
    大きい方を両側へ使用する。
  */
  const halfHeight =
    Math.max(
      Math.abs(
        bounds.minY
      ),

      Math.abs(
        bounds.maxY
      ),

      minimumHalfHeight
    ) +
    CANVAS_PADDING_Y;


  const normalizedPositions =
    {};


  /*
    0,0だった「自分」は
    halfWidth, halfHeightへ移動する。

    つまりキャンバスの完全な中央になる。
  */
  for (
    const [nodeId, position]
    of Object.entries(
      rawPositions
    )
  ) {
    normalizedPositions[
      nodeId
    ] = {
      ...position,

      x:
        position.x +
        halfWidth,

      y:
        position.y +
        halfHeight
    };
  }


  return {
    positions:
      normalizedPositions,

    width:
      halfWidth *
      2,

    height:
      halfHeight *
      2,

    rawBounds:
      bounds
  };
}


/*
  キャンバスと各描画レイヤーを
  現在のサイズ・倍率へ合わせる。
*/
function applyCanvasGeometry() {
  const scaledWidth =
    Math.max(
      1,
      baseCanvasWidth *
      zoomLevel
    );


  const scaledHeight =
    Math.max(
      1,
      baseCanvasHeight *
      zoomLevel
    );


  /*
    mapCanvasはスクロール領域を作る。
  */
  mapCanvas.style.width =
    `${scaledWidth}px`;

  mapCanvas.style.height =
    `${scaledHeight}px`;

  mapCanvas.style.transform =
    "none";

  mapCanvas.style.transformOrigin =
    "top left";


  /*
    ノードレイヤーのみを拡大縮小する。
  */
  nodeLayer.style.width =
    `${baseCanvasWidth}px`;

  nodeLayer.style.height =
    `${baseCanvasHeight}px`;

  nodeLayer.style.transform =
    `scale(${zoomLevel})`;

  nodeLayer.style.transformOrigin =
    "top left";


  /*
    SVGも同じ倍率で拡大縮小する。
  */
  connections.style.width =
    `${baseCanvasWidth}px`;

  connections.style.height =
    `${baseCanvasHeight}px`;

  connections.style.transform =
    `scale(${zoomLevel})`;

  connections.style.transformOrigin =
    "top left";


  connections.setAttribute(
    "width",
    String(
      baseCanvasWidth
    )
  );


  connections.setAttribute(
    "height",
    String(
      baseCanvasHeight
    )
  );


  connections.setAttribute(
    "viewBox",
    (
      `0 0 ` +
      `${baseCanvasWidth} ` +
      `${baseCanvasHeight}`
    )
  );
}


/* ==================================================
   9. Rendering
================================================== */

function renderMap(
  options = {}
) {
  const {
    animateNodeId = null,
    keepSelected = true,
    preserveView = true
  } = options;


  /*
    再描画前の「自分」が
    画面上のどこにあったかを記録する。
  */
  const oldRootPosition =
    currentPositions[
      ROOT_ID
    ];


  const oldRootScreenX =
    oldRootPosition

      ? oldRootPosition.x *
        zoomLevel -
        mapViewport.scrollLeft

      : null;


  const oldRootScreenY =
    oldRootPosition

      ? oldRootPosition.y *
        zoomLevel -
        mapViewport.scrollTop

      : null;


  nodeLayer.innerHTML =
    "";

  connectionLayer.innerHTML =
    "";


  currentRawPositions =
    calculateRawLayout();


  const layout =
    normalizeLayout(
      currentRawPositions
    );


  currentPositions =
    layout.positions;

  currentContentBounds =
    layout.rawBounds;

  baseCanvasWidth =
    layout.width;

  baseCanvasHeight =
    layout.height;


  applyCanvasGeometry();


  renderConnections(
    currentPositions
  );


  renderNodes(
    currentPositions,
    animateNodeId
  );


  if (
    keepSelected &&
    selectedNodeId
  ) {
    updateSelectionAppearance();
  }


  /*
    項目追加などでキャンバスが広がっても、
    「自分」の画面上の位置を維持する。
  */
  if (
    preserveView &&
    oldRootPosition &&
    oldRootScreenX !== null &&
    oldRootScreenY !== null
  ) {
    const newRootPosition =
      currentPositions[
        ROOT_ID
      ];


    mapViewport.scrollLeft =
      newRootPosition.x *
      zoomLevel -
      oldRootScreenX;


    mapViewport.scrollTop =
      newRootPosition.y *
      zoomLevel -
      oldRootScreenY;
  }
}


function renderNodes(
  positions,
  animateNodeId
) {
  const fragment =
    document.createDocumentFragment();


  for (
    const node
    of Object.values(
      appData.nodes
    )
  ) {
    const position =
      positions[
        node.id
      ];


    if (!position) {
      continue;
    }


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";

    button.className =
      "map-node";


    button.dataset.nodeId =
      node.id;

    button.dataset.type =
      node.type;


    button.style.left =
      `${position.x}px`;

    button.style.top =
      `${position.y}px`;


    button.setAttribute(
      "aria-label",
      `${node.title}を編集`
    );


    if (
      animateNodeId ===
      node.id
    ) {
      button.classList.add(
        "is-new"
      );
    }


    const content =
      document.createElement(
        "span"
      );

    content.className =
      "node-content";


    const title =
      document.createElement(
        "span"
      );

    title.className =
      "node-title";

    title.textContent =
      truncateText(
        node.title
      );


    const meta =
      document.createElement(
        "span"
      );

    meta.className =
      "node-meta";


    if (
      node.memo.trim()
    ) {
      const memoMark =
        document.createElement(
          "span"
        );


      memoMark.className =
        "node-memo-mark";


      meta.appendChild(
        memoMark
      );
    }


    if (
      node.children.length > 0
    ) {
      const childrenText =
        document.createElement(
          "span"
        );


      childrenText.textContent =
        `${node.children.length} BRANCH`;


      meta.appendChild(
        childrenText
      );

    } else if (
      node.memo.trim()
    ) {
      const memoText =
        document.createElement(
          "span"
        );


      memoText.textContent =
        "MEMO";


      meta.appendChild(
        memoText
      );
    }


    content.append(
      title,
      meta
    );


    button.appendChild(
      content
    );


    button.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        openEditor(
          node.id
        );
      }
    );


    fragment.appendChild(
      button
    );
  }


  nodeLayer.appendChild(
    fragment
  );
}


function renderConnections(
  positions
) {
  for (
    const node
    of Object.values(
      appData.nodes
    )
  ) {
    if (
      !node.parentId
    ) {
      continue;
    }


    const parentPosition =
      positions[
        node.parentId
      ];


    const childPosition =
      positions[
        node.id
      ];


    if (
      !parentPosition ||
      !childPosition
    ) {
      continue;
    }


    const path =
      document.createElementNS(
        SVG_NAMESPACE,
        "path"
      );


    path.dataset.parentId =
      node.parentId;

    path.dataset.childId =
      node.id;


    path.setAttribute(
      "d",
      createConnectionPath(
        parentPosition,
        childPosition
      )
    );


    connectionLayer.appendChild(
      path
    );
  }
}


function createConnectionPath(
  parent,
  child
) {
  const differenceX =
    child.x -
    parent.x;


  const differenceY =
    child.y -
    parent.y;


  const control1 = {
    x:
      parent.x +
      differenceX *
      0.42,

    y:
      parent.y +
      differenceY *
      0.18
  };


  const control2 = {
    x:
      parent.x +
      differenceX *
      0.74,

    y:
      parent.y +
      differenceY *
      0.76
  };


  return (
    `M ${parent.x} ${parent.y} ` +
    `C ${control1.x} ${control1.y} ` +
    `${control2.x} ${control2.y} ` +
    `${child.x} ${child.y}`
  );
}


/* ==================================================
   10. Selection
================================================== */

function updateSelectionAppearance() {
  nodeLayer
    .querySelectorAll(
      ".map-node"
    )
    .forEach(
      element => {
        element.classList.toggle(
          "is-selected",

          element.dataset.nodeId ===
          selectedNodeId
        );
      }
    );


  connectionLayer
    .querySelectorAll(
      "path"
    )
    .forEach(
      path => {
        path.classList.remove(
          "is-active"
        );
      }
    );


  if (!selectedNodeId) {
    return;
  }


  const relatedIds =
    new Set([
      selectedNodeId,

      ...getAncestorIds(
        selectedNodeId
      ),

      ...getDescendantIds(
        selectedNodeId
      )
    ]);


  connectionLayer
    .querySelectorAll(
      "path"
    )
    .forEach(
      path => {
        const parentId =
          path.dataset.parentId;

        const childId =
          path.dataset.childId;


        if (
          relatedIds.has(
            parentId
          ) &&
          relatedIds.has(
            childId
          )
        ) {
          path.classList.add(
            "is-active"
          );
        }
      }
    );
}


/* ==================================================
   11. Editor Panel
================================================== */

function openEditor(nodeId) {
  const node =
    getNode(
      nodeId
    );


  if (!node) {
    return;
  }


  selectedNodeId =
    nodeId;


  editorHeading.textContent =
    node.title;

  nodeTitleInput.value =
    node.title;

  nodeMemoInput.value =
    node.memo;


  updateMemoCounter();


  updateNodeInformation(
    nodeId
  );


  deleteNodeBtn.disabled =
    PROTECTED_NODE_IDS.has(
      nodeId
    );


  editorPanel.classList.add(
    "is-open"
  );


  panelBackdrop.classList.add(
    "is-visible"
  );


  editorPanel.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "panel-open"
  );


  updateSelectionAppearance();


  window.setTimeout(
    () => {
      nodeTitleInput.focus();

      nodeTitleInput.select();
    },
    240
  );
}


function closeEditor() {
  editorPanel.classList.remove(
    "is-open"
  );


  panelBackdrop.classList.remove(
    "is-visible"
  );


  editorPanel.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "panel-open"
  );
}


function updateNodeInformation(
  nodeId
) {
  const node =
    getNode(
      nodeId
    );


  if (!node) {
    return;
  }


  nodeDepth.textContent =
    String(
      getNodeDepth(
        nodeId
      )
    );


  childCount.textContent =
    String(
      node.children.length
    );
}


function updateMemoCounter() {
  memoCount.textContent =
    `${nodeMemoInput.value.length} / 2000`;
}


/* ==================================================
   12. Save
================================================== */

function saveSelectedNode() {
  const node =
    getNode(
      selectedNodeId
    );


  if (!node) {
    return;
  }


  const newTitle =
    nodeTitleInput.value.trim();


  if (!newTitle) {
    showToast(
      "項目名を入力してください"
    );


    nodeTitleInput.focus();

    return;
  }


  node.title =
    newTitle;

  node.memo =
    nodeMemoInput.value;

  node.updatedAt =
    new Date().toISOString();


  saveData();


  renderMap();


  editorHeading.textContent =
    node.title;


  updateNodeInformation(
    node.id
  );


  showToast(
    "変更を保存しました"
  );
}


/* ==================================================
   13. Child Nodes
================================================== */

function openChildDialog() {
  if (!selectedNodeId) {
    return;
  }


  childTitleInput.value =
    "";


  if (
    typeof childDialog.showModal ===
    "function"
  ) {
    childDialog.showModal();

  } else {
    childDialog.setAttribute(
      "open",
      ""
    );
  }


  window.setTimeout(
    () => {
      childTitleInput.focus();
    },
    80
  );
}


function closeChildDialog() {
  if (
    typeof childDialog.close ===
    "function"
  ) {
    childDialog.close();

  } else {
    childDialog.removeAttribute(
      "open"
    );
  }
}


function createChildNode(title) {
  const parent =
    getNode(
      selectedNodeId
    );


  if (!parent) {
    return null;
  }


  const id =
    generateNodeId();


  const now =
    new Date().toISOString();


  appData.nodes[id] = {
    id,

    title,

    memo:
      "",

    parentId:
      parent.id,

    children:
      [],

    type:
      "custom",

    createdAt:
      now,

    updatedAt:
      now
  };


  parent.children.push(
    id
  );


  parent.updatedAt =
    now;


  saveData();


  renderMap({
    animateNodeId:
      id
  });


  return id;
}


/* ==================================================
   14. Delete
================================================== */

function deleteSelectedNode() {
  const node =
    getNode(
      selectedNodeId
    );


  if (!node) {
    return;
  }


  if (
    PROTECTED_NODE_IDS.has(
      node.id
    )
  ) {
    showToast(
      "基本項目は削除できません"
    );

    return;
  }


  const descendantIds =
    getDescendantIds(
      node.id
    );


  const totalDeleteCount =
    descendantIds.length +
    1;


  const message =
    totalDeleteCount > 1

      ? (
          `「${node.title}」と、` +
          `その下にある` +
          `${descendantIds.length}件の項目を` +
          `削除しますか？`
        )

      : (
          `「${node.title}」を` +
          `削除しますか？`
        );


  if (
    !window.confirm(
      message
    )
  ) {
    return;
  }


  const parent =
    getNode(
      node.parentId
    );


  if (parent) {
    parent.children =
      parent.children.filter(
        childId =>
          childId !==
          node.id
      );


    parent.updatedAt =
      new Date().toISOString();
  }


  for (
    const descendantId
    of descendantIds
  ) {
    delete appData.nodes[
      descendantId
    ];
  }


  delete appData.nodes[
    node.id
  ];


  selectedNodeId =
    null;


  saveData();


  closeEditor();


  renderMap({
    keepSelected:
      false
  });


  showToast(
    totalDeleteCount > 1

      ? (
          `${totalDeleteCount}件の` +
          `項目を削除しました`
        )

      : "項目を削除しました"
  );
}


/* ==================================================
   15. Reset
================================================== */

function openResetDialog() {
  if (
    typeof resetDialog.showModal ===
    "function"
  ) {
    resetDialog.showModal();

  } else {
    resetDialog.setAttribute(
      "open",
      ""
    );
  }
}


function closeResetDialog() {
  if (
    typeof resetDialog.close ===
    "function"
  ) {
    resetDialog.close();

  } else {
    resetDialog.removeAttribute(
      "open"
    );
  }
}


function resetMap() {
  appData =
    createDefaultData();


  selectedNodeId =
    null;


  zoomLevel =
    1;


  saveData();


  closeEditor();


  closeResetDialog();


  renderMap({
    keepSelected:
      false,

    preserveView:
      false
  });


  window.requestAnimationFrame(
    () => {
      showInitialView(
        false
      );
    }
  );


  showToast(
    "マップを初期化しました"
  );
}


/* ==================================================
   16. Zoom
================================================== */

function updateZoomDisplay() {
  zoomValue.textContent =
    `${Math.round(
      zoomLevel *
      100
    )}%`;


  zoomOutBtn.disabled =
    zoomLevel <=
    MIN_ZOOM +
    0.001;


  zoomInBtn.disabled =
    zoomLevel >=
    MAX_ZOOM -
    0.001;
}


/*
  指定された画面位置を基準に
  拡大縮小する。
*/
function applyZoom(
  newZoom,

  focusX =
    mapViewport.clientWidth /
    2,

  focusY =
    mapViewport.clientHeight /
    2
) {
  const previousZoom =
    zoomLevel;


  const nextZoom =
    Number(
      clampZoom(
        newZoom
      ).toFixed(2)
    );


  if (
    Math.abs(
      nextZoom -
      previousZoom
    ) <
    0.001
  ) {
    return;
  }


  const canvasPointX =
    (
      mapViewport.scrollLeft +
      focusX
    ) /
    previousZoom;


  const canvasPointY =
    (
      mapViewport.scrollTop +
      focusY
    ) /
    previousZoom;


  zoomLevel =
    nextZoom;


  applyCanvasGeometry();


  updateZoomDisplay();


  mapViewport.scrollLeft =
    canvasPointX *
    zoomLevel -
    focusX;


  mapViewport.scrollTop =
    canvasPointY *
    zoomLevel -
    focusY;
}


function zoomIn() {
  applyZoom(
    zoomLevel +
    ZOOM_STEP
  );
}


function zoomOut() {
  applyZoom(
    zoomLevel -
    ZOOM_STEP
  );
}


/* ==================================================
   17. Fit / Center / Reveal
================================================== */

function centerMap(
  smooth = true
) {
  const rootPosition =
    currentPositions[
      ROOT_ID
    ];


  if (!rootPosition) {
    return;
  }


  mapViewport.scrollTo({
    left:
      Math.max(
        0,

        rootPosition.x *
        zoomLevel -
        mapViewport.clientWidth /
        2
      ),

    top:
      Math.max(
        0,

        rootPosition.y *
        zoomLevel -
        mapViewport.clientHeight /
        2
      ),

    behavior:
      smooth
        ? "smooth"
        : "auto"
  });
}


function revealNode(
  nodeId,
  smooth = true
) {
  const position =
    currentPositions[
      nodeId
    ];


  if (!position) {
    return;
  }


  mapViewport.scrollTo({
    left:
      Math.max(
        0,

        position.x *
        zoomLevel -
        mapViewport.clientWidth /
        2
      ),

    top:
      Math.max(
        0,

        position.y *
        zoomLevel -
        mapViewport.clientHeight /
        2
      ),

    behavior:
      smooth
        ? "smooth"
        : "auto"
  });
}


/*
  実際にノードが存在する範囲だけを基準に
  全体表示用の倍率を計算する。

  キャンバスの反対側に確保した空白は
  倍率計算へ含めない。
*/
function calculateFittedZoom() {
  if (
    !currentContentBounds
  ) {
    return 1;
  }


  const contentWidth =
    currentContentBounds.maxX -
    currentContentBounds.minX +
    FIT_PADDING_X *
    2;


  const contentHeight =
    currentContentBounds.maxY -
    currentContentBounds.minY +
    FIT_PADDING_Y *
    2;


  return Number(
    clampZoom(
      Math.min(
        mapViewport.clientWidth /
        contentWidth,

        mapViewport.clientHeight /
        contentHeight
      )
    ).toFixed(2)
  );
}


/*
  マップ全体を表示する。

  こちらは内容全体の中央を画面中央へ置く。
*/
function fitMapToView(
  smooth = true
) {
  if (
    !currentContentBounds
  ) {
    return;
  }


  zoomLevel =
    calculateFittedZoom();


  applyCanvasGeometry();


  updateZoomDisplay();


  /*
    raw座標における内容の中央。
  */
  const rawCenterX =
    (
      currentContentBounds.minX +
      currentContentBounds.maxX
    ) /
    2;


  const rawCenterY =
    (
      currentContentBounds.minY +
      currentContentBounds.maxY
    ) /
    2;


  /*
    キャンバス上のルート座標へ
    raw座標を加えて変換する。
  */
  const rootPosition =
    currentPositions[
      ROOT_ID
    ];


  const canvasCenterX =
    rootPosition.x +
    rawCenterX;


  const canvasCenterY =
    rootPosition.y +
    rawCenterY;


  mapViewport.scrollTo({
    left:
      Math.max(
        0,

        canvasCenterX *
        zoomLevel -
        mapViewport.clientWidth /
        2
      ),

    top:
      Math.max(
        0,

        canvasCenterY *
        zoomLevel -
        mapViewport.clientHeight /
        2
      ),

    behavior:
      smooth
        ? "smooth"
        : "auto"
  });
}


/*
  初回表示専用。

  全体が収まる倍率へ変更した後、
  必ず「自分」を画面中央へ置く。
*/
function showInitialView(
  smooth = false
) {
  zoomLevel =
    calculateFittedZoom();


  applyCanvasGeometry();


  updateZoomDisplay();


  centerMap(
    smooth
  );
}


/* ==================================================
   18. Toast
================================================== */

function showToast(message) {
  toast.textContent =
    message;


  toast.classList.add(
    "is-visible"
  );


  window.clearTimeout(
    toastTimer
  );


  toastTimer =
    window.setTimeout(
      () => {
        toast.classList.remove(
          "is-visible"
        );
      },
      1900
    );
}


/* ==================================================
   19. Drag Scrolling
================================================== */

function startViewportDrag(event) {
  if (
    event.pointerType === "mouse" &&
    event.button !== 0
  ) {
    return;
  }


  const interactiveElement =
    event.target.closest(
      "button, input, textarea, a, dialog"
    );


  if (
    interactiveElement
  ) {
    return;
  }


  isDraggingViewport =
    true;


  dragPointerId =
    event.pointerId;


  dragStartX =
    event.clientX;

  dragStartY =
    event.clientY;


  dragStartScrollLeft =
    mapViewport.scrollLeft;

  dragStartScrollTop =
    mapViewport.scrollTop;


  mapViewport.setPointerCapture(
    event.pointerId
  );
}


function moveViewportDrag(event) {
  if (
    !isDraggingViewport ||
    event.pointerId !==
    dragPointerId
  ) {
    return;
  }


  const differenceX =
    event.clientX -
    dragStartX;


  const differenceY =
    event.clientY -
    dragStartY;


  mapViewport.scrollLeft =
    dragStartScrollLeft -
    differenceX;


  mapViewport.scrollTop =
    dragStartScrollTop -
    differenceY;
}


function stopViewportDrag(event) {
  if (
    !isDraggingViewport ||
    event.pointerId !==
    dragPointerId
  ) {
    return;
  }


  isDraggingViewport =
    false;


  dragPointerId =
    null;


  if (
    mapViewport
      .hasPointerCapture?.(
        event.pointerId
      )
  ) {
    mapViewport
      .releasePointerCapture(
        event.pointerId
      );
  }
}


/* ==================================================
   20. Events
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


    const title =
      childTitleInput
        .value
        .trim();


    if (!title) {
      childTitleInput.focus();

      return;
    }


    const newNodeId =
      createChildNode(
        title
      );


    closeChildDialog();


    if (
      newNodeId
    ) {
      openEditor(
        newNodeId
      );


      window.setTimeout(
        () => {
          revealNode(
            newNodeId,
            true
          );
        },
        100
      );


      showToast(
        "新しい枝を追加しました"
      );
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


zoomInBtn.addEventListener(
  "click",
  zoomIn
);


zoomOutBtn.addEventListener(
  "click",
  zoomOut
);


fitMapBtn.addEventListener(
  "click",
  () => {
    fitMapToView(
      true
    );
  }
);


centerMapBtn.addEventListener(
  "click",
  () => {
    centerMap(
      true
    );
  }
);


/*
  CtrlまたはCommandを押しながら
  ホイールするとズームする。

  通常のホイール操作はスクロールとして使う。
*/
mapViewport.addEventListener(
  "wheel",
  event => {
    if (
      !event.ctrlKey &&
      !event.metaKey
    ) {
      return;
    }


    event.preventDefault();


    const viewportRect =
      mapViewport
        .getBoundingClientRect();


    const focusX =
      event.clientX -
      viewportRect.left;


    const focusY =
      event.clientY -
      viewportRect.top;


    const zoomDirection =
      event.deltaY < 0

        ? ZOOM_STEP

        : -ZOOM_STEP;


    applyZoom(
      zoomLevel +
      zoomDirection,

      focusX,
      focusY
    );
  },

  {
    passive:
      false
  }
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


mapViewport.addEventListener(
  "lostpointercapture",
  event => {
    if (
      event.pointerId ===
      dragPointerId
    ) {
      isDraggingViewport =
        false;

      dragPointerId =
        null;
    }
  }
);


document.addEventListener(
  "keydown",
  event => {
    if (
      event.key !== "Escape"
    ) {
      return;
    }


    if (
      childDialog.open
    ) {
      closeChildDialog();

      return;
    }


    if (
      resetDialog.open
    ) {
      closeResetDialog();

      return;
    }


    closeEditor();
  }
);


/*
  リサイズ中に何度も描画されないよう、
  少し待ってから再計算する。
*/
let resizeTimer =
  null;


window.addEventListener(
  "resize",
  () => {
    window.clearTimeout(
      resizeTimer
    );


    resizeTimer =
      window.setTimeout(
        () => {
          renderMap({
            preserveView:
              true
          });
        },
        100
      );
  }
);


/* ==================================================
   21. Initialisation
================================================== */

function initialiseApplication() {
  /*
    以前のカメラ版で設定された可能性のある
    インラインスタイルを解除する。
  */
  mapViewport.style.overflow =
    "auto";

  mapViewport.style.touchAction =
    "";

  mapViewport.style.backgroundPosition =
    "";


  mapCanvas.style.position =
    "relative";

  mapCanvas.style.left =
    "";

  mapCanvas.style.top =
    "";

  mapCanvas.style.overflow =
    "visible";

  mapCanvas.style.transform =
    "none";


  nodeLayer.style.position =
    "absolute";

  nodeLayer.style.left =
    "0";

  nodeLayer.style.top =
    "0";

  nodeLayer.style.right =
    "auto";

  nodeLayer.style.bottom =
    "auto";


  connections.style.position =
    "absolute";

  connections.style.left =
    "0";

  connections.style.top =
    "0";

  connections.style.right =
    "auto";

  connections.style.bottom =
    "auto";


  updateZoomDisplay();


  renderMap({
    preserveView:
      false
  });


  /*
    初回表示では、
    全体が収まる倍率にしたうえで
    「自分」を画面中央へ置く。
  */
  window.requestAnimationFrame(
    () => {
      showInitialView(
        false
      );
    }
  );
}


initialiseApplication();