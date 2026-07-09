// -----------------------------
// 要素取得
// -----------------------------

const panel = document.querySelector(".panel");
const title = document.getElementById("panel-title");
const memo = document.getElementById("memo");

const save = document.getElementById("save");
const close = document.getElementById("close");

const nodes = document.querySelectorAll(".node");

let currentNode = "";


// -----------------------------
// ノードを押したとき
// -----------------------------

nodes.forEach(node=>{

    node.addEventListener("click",()=>{

        currentNode=node.dataset.node;

        title.textContent=node.textContent;

        memo.value=
        localStorage.getItem(currentNode)||"";

        panel.classList.add("open");

    });

});


// -----------------------------
// 保存
// -----------------------------

save.addEventListener("click",()=>{

    localStorage.setItem(
        currentNode,
        memo.value
    );

    save.textContent="保存しました";

    setTimeout(()=>{

        save.textContent="保存";

    },1200);

});


// -----------------------------
// 閉じる
// -----------------------------

close.addEventListener("click",()=>{

    panel.classList.remove("open");

});


// -----------------------------
// ESCキーでも閉じる
// -----------------------------

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        panel.classList.remove("open");

    }

});

