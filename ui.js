// ui.js

document.addEventListener("DOMContentLoaded", () => {
console.log("ui.js start");

/* ===== LOCAL STORAGE LOAD ===== */
const savedState = localStorage.getItem("kendoScoreState");
if(savedState){
  Object.assign(AppState, JSON.parse(savedState));
}


function ensureMatchUIState(){
  (AppState.matches || []).forEach((m)=>{

    if(m.ui) return;

    m.ui = {
red: {
  ippon1: null,
  ippon2: null,
  foul: false,
  foulMark: ""   // ← 追加
},
white: {
  ippon1: null,
  ippon2: null,
  foul: false,
  foulMark: ""
},
result: {
  red: "",
  white: ""
},

    };

m.firstIpponTeam = null;
    m.done = false;

  });
}

// seq からuiを作り直したい場面用（起動直後/人数変更直後など）
function recalcAllMatchesFromSeq(){
  (AppState.matches || []).forEach((m)=> recalcMatch(m));
}

function recalcMatch(m){

  if(!m) return;


m.ui = {
  red: {
    ippon1: null,
    ippon2: null,
    foul: false,
    foulMark: "",
    extraWin: false   // ← 追加
  },
  white: {
    ippon1: null,
    ippon2: null,
    foul: false,
    foulMark: "",
    extraWin: false   // ← 追加
  },
  result: {
    red: "",
    white: ""
  }
};

m.firstIpponTeam = null;   // 追加：最初の一本のチーム
m.firstIpponAct  = null;   // 追加：最初の一本の種類（M/K/D/T/H）

  m.done = false;

  const ippon = { red:0, white:0 };

  // ===== seq から再構築 =====
   // ===== seq から再構築 =====
  for(const e of m.seq){

    const me  = m.ui[e.team];
    const opp = e.team === "red" ? "white" : "red";

    /* ===== Win by forfeit (WBF) ===== */
    if(e.act === "WBF"){

      // ルール：WBF は二本勝ち扱い
      // ただし相手が取っていた一本は seq に残っているので、そのまま表示/記録に残る

      if(ippon[e.team] >= 2){
        // 既に2本なら何もしない（通常ここには来ない）
      }else if(ippon[e.team] === 1){
        // 1本取っている状態 → 2本目（右下）に WBF を置く
        ippon[e.team] = 2;
        placeIppon(m, e.team, "WBF");
      }else{
        // 0本の状態 → 表示は「右下に WBF」だけを置く（あなたの指定どおり）
        // ippon は2として扱う（上段カウント用にも2になる）
        ippon[e.team] = 2;
        m.ui[e.team].ippon2 = "WBF";
      }

      // この時点で勝敗確定（以降の入力は無効にしたいので、再構築もここで終了）
      break;
    }

    /* ===== 反則 ===== */
    if(e.act === "F"){

      if(!me.foul){
        // 1回目反則
        me.foul = true;
        me.foulMark = "▲";
      }else{
        // 2回目反則 → 相手に一本(H)
        me.foul = false;
        me.foulMark = "";

ippon[opp]++;

if(!m.firstIpponTeam){
  m.firstIpponTeam = opp;
  m.firstIpponAct  = "H";
}

placeIppon(m, opp, "H");
      }

      continue;
    }

    /* ===== 一本（M/K/D/T/H など） ===== */
    ippon[e.team]++;
if(!m.firstIpponTeam){
  m.firstIpponTeam = e.team;
  m.firstIpponAct  = e.act;   // M/K/D/T など
}
    placeIppon(m, e.team, e.act);
  }


  // ===== 勝敗 =====

// Daihyoかどうか判定（positionsから判定）
const matchIndex = AppState.matches.indexOf(m);
const isDaihyo =
  AppState.positions &&
  AppState.positions[matchIndex] === "Daihyo";

// ===== Daihyo（一本勝負） =====
if(isDaihyo){

  if(ippon.red >= 1){
    m.done = true;
    m.ui.result.red   = "〇";
    m.ui.result.white = "×";
  }

  if(ippon.white >= 1){
    m.done = true;
    m.ui.result.white = "〇";
    m.ui.result.red   = "×";
  }
}

  // ===== 通常試合（二本勝負） =====
  if(ippon.red >= 2 || ippon.white >= 2){

    m.done = true;

    if(ippon.red >= 2){
      m.ui.result.red   = "〇";
      m.ui.result.white = "×";
    }

    if(ippon.white >= 2){
      m.ui.result.white = "〇";
      m.ui.result.red   = "×";
    }
  }
}

function placeIppon(m, color, act){

  const ui = m.ui[color];

if(!ui.ippon1){

  ui.ippon1 = act;

  // ★ 試合で最初の一本なら記録
if(m.firstIpponIndex === undefined){
  m.firstIpponIndex = m.seq.length;
}

  return;
}

  if(!ui.ippon2){
    ui.ippon2 = act;
  }
}
/* ===== LOCAL STORAGE SAVE ===== */
function saveState(){
  localStorage.setItem("kendoScoreState", JSON.stringify(AppState));
}

/* ===== SCORE CORE: ADD IPPON / FOUL ===== */
function addIppon(matchIndex, color, act){

  const m = AppState.matches[matchIndex];
  if(!m) return;

  if(m.done) return;

  // 履歴に積むだけ
  m.seq.push({
    team: color,
    act: act
  });

  // 再計算はここで一本化
  recalcMatch(m);
}


  const app = document.getElementById("app");

  /* =====================
     TOP PANEL
  ===================== */
const top = document.createElement("div");

  top.style.borderBottom = "none";  top.style.padding = "8px";

  top.style.background = "#fff";

  top.innerHTML = `

    <div style="display:flex; gap:6px; flex-wrap:wrap;">

      <input id="tName"
        placeholder="e.g. XXX Taikai semi-final"
        style="flex:1; padding:6px;"
      >

      <input id="tDate"
        type="date"
        style="padding:6px;"
      >

      <select id="memberCount"
        style="padding:6px;"
      ></select>

<button id="dlBtn" class="iconBtn" aria-label="Download" title="Download"> 
<svg viewBox="0 0 24 24" width="22" height="22">
  <path d="M12 3v12"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"/>

  <path d="M7 11l5 5 5-5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"/>

  <rect x="4" y="19" width="16" height="2" rx="1"
        fill="currentColor"/>
</svg>
</button> 
<button id="shareBtn" class="iconBtn" aria-label="Share" title="Share"> 
<svg viewBox="0 0 24 24" width="22" height="22">
  <circle cx="18" cy="5" r="2" fill="currentColor"/>
  <circle cx="6" cy="12" r="2" fill="currentColor"/>
  <circle cx="18" cy="19" r="2" fill="currentColor"/>

  <path d="M8 11l8-5M8 13l8 5"
        stroke="currentColor"
        stroke-width="1.4"
        fill="none"
        stroke-linecap="round"/>
</svg>

</button>

    </div>

    <div id="sumWrap" style="margin-top:8px; display:flex; gap:8px; align-items:flex-start;">

  <table id="sumTable">
    <colgroup>
      <col style="width:36px;">
      <col>
      <col style="width:56px;">
      <col style="width:56px;">
    </colgroup>

    <tr class="sumHeader">
      <th colspan="2">Team</th>
      <th>Win</th>
      <th>Ippon</th>
    </tr>

    <tr class="rowRed">
      <td><button id="editRed">✎</button></td>
      <td id="teamNameRed"></td>
      <td id="resRedWin">0</td>
      <td id="resRedIppon">0</td>
    </tr>

    <tr class="rowWhite">
      <td><button id="editWhite">✎</button></td>
      <td id="teamNameWhite"></td>
      <td id="resWhiteWin">0</td>
      <td id="resWhiteIppon">0</td>
    </tr>
  </table>

  <div id="resetBox">

    <button id="resetBtn">Reset</button>

    <div id="resetPanel" style="display:none;">
      <button data-reset="score">1. Reset (Scores Only)</button>
      <button data-reset="red">2. Reset (Red Team)</button>
      <button data-reset="white">3. Reset (White Team)</button>
      <button data-reset="all">4. Reset All</button>
    </div>

  </div>

</div>

    <!-- =====================
         MIDDLE: Position Nav
         ===================== -->
    <div id="midPanel">
      <div id="posNav" aria-label="Positions"></div>
    </div>

    <!-- =====================
         LOWER: Matches
         ===================== -->
    <div id="lowerPanel">
      <div id="lowerHeader">
        <div id="lowerTitle">Matches</div>
      </div>

      <div id="matchList"></div>
    </div>

    <!-- ===== Team Editor ===== -->
<div id="teamEditor">

  <div class="editorModal">

    <h3>Team Editor</h3>

      <div id="editorRed"></div>
      <div id="editorWhite"></div>

<button id="closeEditor">Done</button>

  </div>
</div>
  `;

  app.appendChild(top);

  /* =====================
     STYLE
  ===================== */

  const st = document.createElement("style");
st.textContent = `

#sumTable{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
}

#sumTable th,#sumTable td{
  border:none;
  padding:6px;
  text-align:center;
}

.rowRed td{ background:#ffd6d6; }
.rowWhite td{ background:#fff; }

#teamNameRed,
#teamNameWhite{
  text-align:left !important;   /* 中央指定を打ち消す */
  padding-left:6px;             /* 編集ボタンとの間隔 */
}

#sumTable button{
  border:0;
  background:transparent;
  font-size:18px;
  cursor:pointer;
}



#resetBtn:active{
transform:translateY(1px);
}

.iconBtn{
  width:40px;
  height:40px;
  border:1px solid #ddd;
  background:#fafafa;
  border-radius:8px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  padding:0;
}

.iconBtn:hover{
  background:#e9e9e9;
  border-color:#999;
}

.iconBtn svg{
  width:20px;
  height:20px;
}
.iconBtn:active{
transform:translateY(1px);
}

.editorTitle{
  margin:12px 0 8px;
  font-size:17px;
  font-weight:700;

  position:sticky;
  top:0;
  background:#fff;
  padding:8px 0;
  z-index:5;
}

.editorTitle.red{
color:#9b1c1c; /* 濃い赤 */
}

.editorTitle.white{
color:#111;
}

.editorRow.team label{
font-weight:700;
font-size:14px;
}

.editorRow.player label{
padding-left:10px; /* インデント */
font-size:13px;
color:#333;
}

.editorRow.player{
  margin-left:16px;
}

.editorRow.player input{
  margin-left:4px;
}

#teamNameRed,
#teamNameWhite{
  font-weight:700;
}

#resetPanel button{
  display:block;
  width:100%;
  margin:4px 0;
  padding:8px;
  border-radius:6px;
  border:0;
  background:#4d8fe0;
  color:#fff;
  font-weight:600;
}


#resetPanel button{
  display:block;
  width:100%;
  margin:10px 0;
  padding:14px 12px;
  border-radius:10px;
  border:0;
  background:#4d8fe0;
  color:#fff;
  font-weight:700;
  text-align:left;
}

/* =====================
   MIDDLE: Position Nav
===================== */

#midPanel{
  margin-top:10px;
  padding:8px 4px 10px;

  border-top:2px solid #2a6fb3;      /* 上の青線 */
  border-bottom:2px solid #2a6fb3;   /* 下の青線 ←これが本命 */

  background:#fff;

  position:relative;          /* ③フェード用 */
  --fadeL:0;
  --fadeR:0;
}

/* ③ 端フェード（クリックを邪魔しない） */
#midPanel::before,
#midPanel::after{
  content:"";
  position:absolute;
  top:0;
  width:18px;
  height:100%;
  pointer-events:none;
}

#midPanel::before{
  left:0;
  background:linear-gradient(to right, #fff, rgba(255,255,255,0));
  opacity:var(--fadeL);
}

#midPanel::after{
  right:0;
  background:linear-gradient(to left, #fff, rgba(255,255,255,0));
  opacity:var(--fadeR);
}

#posNav{
  display:flex;
  gap:14px;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
  padding:4px 2px;
  white-space:nowrap;
}

#posNav a{
  color:#111;
  text-decoration:underline;
  font-size:18px;

  padding:8px 10px;          /* ②タップ領域を拡大 */
  border-radius:8px;
}

/* ① 現在位置の強調（控えめ） */
#posNav a.active{
  font-weight:700;
  color:#2a6fb3;
  text-decoration:none;
  border-bottom:2px solid #2a6fb3;
}

#posNav a:active{
  transform:translateY(1px);
}


/* ===== Team Editor Layout ===== */

.editorTeam{
  margin-bottom:16px;
  padding-bottom:12px;
  border-bottom:1px solid #ddd;
}

.editorRow{
  display:grid;
  grid-template-columns:90px 1fr;
  gap:6px;
  align-items:center;
  margin-bottom:6px;
}

.editorRow label{
  font-size:13px;
}

.editorRow input{
  width:100%;
  box-sizing:border-box;
  padding:8px 10px;
  font-size:16px; /* ← これが重要 */
}

/* ===== Reset Button Layout ===== */

#resetBox{
  width:92px;
  margin-top:36px;   /* ヘッダ分ずらす */
  position:relative;
}

#resetBtn{
  width:100%;
  height:72px;       /* 赤＋白の2段分 */
  border:1px solid #1e5bd6;
  background:#2f6fed;
  color:#fff;
  border-radius:10px;
  font-weight:700;
}

#resetBtn:active{
  transform:translateY(1px);
}

#resetPanel{
  position:absolute;
  right:0;
  top:78px;
  width:240px;
  padding:12px;
  background:#cfeeff;
  border-radius:18px;
  box-shadow:0 8px 18px rgba(0,0,0,.15);
  z-index:10;
}

/* ===== LOWER PANEL ===== */

#lowerPanel{
  margin-top:12px;
}

.matchCard{
  border:1px solid #ddd;
  border-radius:10px;
  padding:10px;
  margin-bottom:14px;
  background:#fff;
}

.matchTitle{
  font-weight:700;
  font-size:16px;
  margin-bottom:6px;
}

.matchBody{
  display:flex;
  gap:10px;
}

/* 左：スコア（Table専用） */

.scoreBox{
  width:160px;
  border:1px solid #aaa;
  border-radius:6px;
  padding:4px;
  background:#fff;
}

/* gridは使わない */
.scoreGrid{
  display:none;
}

/* table用 cell */
/* ここが重要：td をテーブルセルに戻す */
.scoreTable{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
}

.scoreTable td{
  border:1px solid #444;
  text-align:center;
  vertical-align:middle;
  padding:0;
  height:32px;
  font-weight:700;
}

/* 念のため：過去の display:flex を確実に殺す */
.scoreTable td.cell{
  display:table-cell;
}

/* 名前行 */
.nameCell{
  height:36px;
  text-align:left;
  padding:0 8px;
}

/* 色（赤/白） */
.rowName.red td{ background:#ffd6d6; }
.rowName.white td{ background:#eee; }

/* 右：操作 */
.controlBox{
  flex:1;
}

.ctrlRow{
  margin-bottom:6px;
  padding:6px;
  border-radius:8px;
}

.ctrlRow.red{
  background:#f7c8c8;
}

.ctrlRow.white{
  background:#e0e0e0;
}

.btnRow{
  display:flex;
  gap:6px;
  margin-bottom:4px;
}

.btnRow button{
  width:36px;
  height:32px;
  border-radius:6px;
  border:0;
  background:#7a3b00;
  color:#fff;
  font-weight:700;
}

.ctrlRow.white .btnRow button{
  background:#888;
}

.ctrlCmd{
  display:flex;
  gap:6px;
}

.ctrlCmd button{
  flex:1;
  border:0;
  border-radius:6px;
  padding:6px;
  font-weight:600;
  background:#9b4a00;
  color:#fff;
}

.ctrlRow.white .ctrlCmd button{
  background:#777;
}

.completeBtn{
  margin:6px 0;
  width:100%;
  border:0;
  border-radius:6px;
  padding:6px;
  background:#174a73;
  color:#fff;
  font-weight:700;
}

/* ===== Score Table ===== */

.scoreTable{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  font-size:14px;
}

.scoreTable td{
  border:1px solid #444;
  text-align:center;
  padding:4px;
  font-weight:700;
  height:32px;
}

/* 選手名セル（自動省略 …） */
.scoreTable td.nameCell{
  height:36px;
  font-weight:700;

  text-align:left;       /* ← ここが効くようになる */
  padding:0 8px;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

/* 2本を同一ボックス内で 左上 / 右下 に固定配置 */
.cell.ipponBox{
  position:relative;
  padding:0;
  height:64px;        /* 32px x 2行分 */
  vertical-align:middle;
}

/* 最初の一本を丸で囲む */
.circle{
  display:inline-flex;
  align-items:center;
  justify-content:center;

  width:22px;
  height:22px;

  border:2px solid #000;
  border-radius:50%;

  font-size:14px;
  font-weight:700;

  line-height:1;
}

/* 2本を同一ボックス内で 左上 / 右下 / 左下 に固定配置 */
.cell.ipponBox{
  position:relative;
  padding:0;
  height:64px;
  vertical-align:middle;
}

.cell.ipponBox .tl,
.cell.ipponBox .br{
  position:absolute;
  line-height:1;
  font-size:24px;   /* ← これだけ追加 */
}

.cell.ipponBox .bl{
  position:absolute;
  line-height:1;
}

/* 左上：一本目 */
.cell.ipponBox .tl{
  top:6px;
  left:6px;
}

/* 右下：二本目 */
.cell.ipponBox .br{
  bottom:6px;
  right:6px;
}

/* 左下：反則 */
.cell.ipponBox .bl{
  bottom:6px;
  left:6px;
}

.cell.ipponBox .tl{
  top:6px;
  left:6px;
}

.cell.ipponBox .br{
  bottom:6px;
  right:6px;
}

/* ==== Ippon mark common box (ズレ防止用) ==== */

.ipponMark{
  display:flex;

  width:27px;
  height:27px;

  align-items:center;
  justify-content:center;

  box-sizing:border-box;
  border:2px solid transparent;
  border-radius:50%;
}

.ipponMark--circle{
  border-color:#111;
}

/* 勝敗セル */
.cell.result{
  width:36px;
  font-size:28px;   /* ← 16 → 24 に拡大 */
  font-weight:700;  /* ← 視認性向上（任意だが推奨） */
}

.rowName.red td{
  background:#ffd6d6;
}

.rowName.white td{
  background:#eee;
}

.rowIppon.red td{
  background:#fff;
}

.rowIppon.white td{
  background:#fff;
}

.cell.result{
  width:36px;
}

/* 延長一本勝ちマーク */
.extraWinBox{
  display:inline-flex;

  width:22px;
  height:22px;

  align-items:center;
  justify-content:center;

  border:2px solid #000;
  font-size:14px;
  font-weight:700;

  box-sizing:border-box;
}

/* ===== Team Editor Modal ===== */

#teamEditor{
  position:fixed;
  top:0;
  left:0;
  width:100vw;
  height:100dvh;

  background:#fff;

  display:none;
  flex-direction:column;

  z-index:9999;
}

#teamEditor > .editorModal{
  flex:1;
  overflow-y:auto;

  width:100%;
  max-width:none;
  max-height:none;

  padding:16px;
  border-radius:0;
}

/* ===== Team Winner Strong Highlight ===== */

#sumTable tr.winnerTeam.rowRed td{
  background:#ff9e9e;
}

#sumTable tr.winnerTeam.rowWhite td{
  background:#dcdcdc;
}

#sumTable tr.winnerTeam td:nth-child(2){
  position:relative;
}

#sumTable tr.winnerTeam td:nth-child(2)::after{
  content:"WIN";
  position:absolute;
  right:6px;
  top:50%;
  transform:translateY(-50%);
  font-size:11px;
  font-weight:700;
  color:#0a3d91;
  letter-spacing:1px;
}

/* ===== Winner Team Highlight (Summary only) ===== */

/* summary table の行を擬似要素の基準にする */
/* ===== Winner Team Highlight ===== */

/* 先頭セルを基準にする */
#sumTable tr.winnerTeam td:first-child{
  position:relative;
}

/* 縦バー */
#sumTable tr.winnerTeam td:first-child::before{
  content:"";
  position:absolute;
  left:-6px;
  top:-6px;
  bottom:-6px;
  width:6px;
  background:#2a6fb3;
  border-radius:3px;
}

`;
document.head.appendChild(st);


  /* =====================
     MEMBER SELECT
  ===================== */

  const sel = document.getElementById("memberCount");

  for(let i=3;i<=20;i++){
    const op = document.createElement("option");
    op.value = i;
    op.textContent = i;
    sel.appendChild(op);
  }


  /* =====================
     TOP BIND
  ===================== */

  const nameInput = document.getElementById("tName");
  const dateInput = document.getElementById("tDate");

  nameInput.value = AppState.meta.name || "";
  dateInput.value = AppState.meta.date || "";
  sel.value = String(AppState.meta.members || 5);

nameInput.oninput = ()=>{
  AppState.meta.name = nameInput.value;
  saveState();
};

dateInput.onchange = ()=>{
  AppState.meta.date = dateInput.value;
  saveState();
};

sel.onchange = ()=>{
  const n = Number(sel.value);

  AppState.meta.members = n;

  initMatches(n);

  ensureMatchUIState();        // ← 追加
  recalcAllMatchesFromSeq();   // ← 追加（seq は空でもOK）

  renderPosNav();
  renderMatches();

  if(AppState.editMode) renderTeamEditor();
};


console.log("matches:", AppState.matches);
console.log("posNav exists:", !!document.getElementById("posNav"));
console.log("posNav html:", document.getElementById("posNav")?.innerHTML);

/* ===== SUMMARY CALC ===== */
function updateSummary(){

  let redWin = 0;
  let whiteWin = 0;

  let redIppon = 0;
  let whiteIppon = 0;

  (AppState.matches || []).forEach(m=>{

    if(!m.ui) return;

    const r = m.ui.red;
    const w = m.ui.white;


/* Ippon集計（WBFは「2本勝ち確定」。足し算ではない） */

// Red
let rCnt = 0;
if(r.ippon2 === "WBF"){
  rCnt = 2;
}else{
  if(r.ippon1) rCnt++;
  if(r.ippon2) rCnt++;
}
redIppon += rCnt;

// White
let wCnt = 0;
if(w.ippon2 === "WBF"){
  wCnt = 2;
}else{
  if(w.ippon1) wCnt++;
  if(w.ippon2) wCnt++;
}
whiteIppon += wCnt;

    /* 勝敗集計 */
    if(m.ui.result.red === "〇") redWin++;
    if(m.ui.result.white === "〇") whiteWin++;

  });

document.getElementById("resRedWin").textContent   = redWin;
document.getElementById("resWhiteWin").textContent = whiteWin;

document.getElementById("resRedIppon").textContent   = redIppon;
document.getElementById("resWhiteIppon").textContent = whiteIppon;

/* ===== Winner Highlight (All matches finished only) ===== */

const rowRed = document.querySelector("#sumTable .rowRed");
const rowWhite = document.querySelector("#sumTable .rowWhite");

rowRed.classList.remove("winnerTeam");
rowWhite.classList.remove("winnerTeam");

/* 団体勝敗が確定した時点で表示する */
const majority = Math.floor((AppState.matches || []).length / 2) + 1;

if(redWin >= majority){
  rowRed.classList.add("winnerTeam");
}

if(whiteWin >= majority){
  rowWhite.classList.add("winnerTeam");
}
}

  /* =====================
     SUMMARY RENDER
  ===================== */

  function renderTop(){

    document.getElementById("teamNameRed").textContent =
      AppState.teams.red.name || "";

    document.getElementById("teamNameWhite").textContent =
      AppState.teams.white.name || "";
  }

  /* =====================
     POSITION NAV RENDER
  ===================== */

  // ① active付け替え（中段リンク）
  function setActivePos(id){

    const nav = document.getElementById("posNav");
    if(!nav) return;

    const links = nav.querySelectorAll("a");
    links.forEach((a)=> a.classList.remove("active"));

    const target = nav.querySelector(`a[data-posid="${CSS.escape(id)}"]`);
    if(target) target.classList.add("active");
  }

  // ③ 端フェード（左/右に続きがある時だけ表示）
  function updatePosNavFade(){

    const nav = document.getElementById("posNav");
    const panel = document.getElementById("midPanel");
    if(!nav || !panel) return;

    const max = nav.scrollWidth - nav.clientWidth;
    if(max <= 1){
      panel.style.setProperty("--fadeL", 0);
      panel.style.setProperty("--fadeR", 0);
      return;
    }

    panel.style.setProperty("--fadeL", nav.scrollLeft > 2 ? 1 : 0);
    panel.style.setProperty("--fadeR", nav.scrollLeft < (max - 2) ? 1 : 0);
  }

  // ①（下段ができたら効く）スクロール位置に応じてactive更新
  function bindSectionObserver(){

    // すでにバインド済みなら何もしない
    if(window.__posObserverBound) return;
    window.__posObserverBound = true;

    const onHash = ()=>{
      const h = (location.hash || "").replace("#","");
      if(h.startsWith("pos-")) setActivePos(h);
    };
    window.addEventListener("hashchange", onHash);
    onHash();

const ids = (AppState.matches || []).map((_, i) => "pos-" + i);
    const els = ids.map(id=>document.getElementById(id)).filter(Boolean);
    if(els.length === 0) return; // 下段がまだ無い → ここで終了（壊れない）

    const io = new IntersectionObserver((entries)=>{
      // 画面中央付近に入ったセクションをactiveにする
      const hit = entries
        .filter(e=>e.isIntersecting)
        .sort((a,b)=> b.intersectionRatio - a.intersectionRatio)[0];
      if(hit && hit.target && hit.target.id){
        setActivePos(hit.target.id);
        history.replaceState(null, "", "#" + hit.target.id);
      }
    }, { root:null, threshold:[0.15, 0.3, 0.5], rootMargin:"-35% 0px -55% 0px" });

    els.forEach(el=>io.observe(el));
  }

  function renderPosNav(){

    const nav = document.getElementById("posNav");
    if(!nav) return;

const pos = AppState.positions || [];
    nav.innerHTML = "";

pos.forEach((p,i)=>{
  const id = "pos-" + i;

      const a = document.createElement("a");
      a.href = "#" + id;
      a.textContent = p;
      a.dataset.posid = id; // ①active用

      a.addEventListener("click", (e)=>{
        e.preventDefault();

        // ① active反映
        setActivePos(id);

        // ④ 押した項目を中央に寄せる（中段内）
        a.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });

        // ④ 下段があるならそこへスムーズスクロール
        const target = document.getElementById(id);
        if(target){
          history.replaceState(null, "", "#" + id);
          target.scrollIntoView({ behavior:"smooth", block:"start" });
        }else{
          // 下段がまだ無い場合は hash だけ更新
          history.replaceState(null, "", "#" + id);
        }
      });

      nav.appendChild(a);
    });

    // 初期状態：hashがあればactiveに
    const h = (location.hash || "").replace("#","");
    if(h.startsWith("pos-")) setActivePos(h);

    // ③ フェード状態を更新
    updatePosNavFade();

    // ① 下段ができたら自動でactive追従
    bindSectionObserver();

    // ③ スクロール中もフェード更新（リスナーは一度だけ）
    if(!nav.__fadeBound){
      nav.__fadeBound = true;
      nav.addEventListener("scroll", ()=> requestAnimationFrame(updatePosNavFade), { passive:true });
      window.addEventListener("resize", ()=> requestAnimationFrame(updatePosNavFade));
    }
  }

/* =====================
   LOWER RENDER
===================== */



renderTop();
renderPosNav();

/* ===== INPUT BIND (CORRECT) ===== */

document.addEventListener("input", (e)=>{

  const t = e.target;
  if(!t.dataset.team) return;

  const team = t.dataset.team;

  // チーム名
  if(t.dataset.type === "name"){
    AppState.teams[team].name = t.value;
    renderTop();
  }

  // 選手名
  if(t.dataset.type === "player"){

    const idx = Number(t.dataset.index);

    AppState.teams[team].players[idx] = t.value;

    renderMatches();
  }

});

/* ===== BUTTON HANDLER ===== */

document.getElementById("matchList").addEventListener("click", (e)=>{

  const btn = e.target.closest("button");
  if(!btn) return;

  const act = btn.dataset.act;
  if(!act) return;

  const row = btn.closest(".ctrlRow");
  if(!row) return;

  const color = row.dataset.color;
  const index = Number(row.dataset.index);

  const m = AppState.matches[index];
  if(!m) return;

/* ===== Complete (Time Up) ===== */
if(act === "complete"){

  if(m.done) return;

  const r = m.ui.red;
  const w = m.ui.white;

  const rCnt = (r.ippon1 ? 1 : 0) + (r.ippon2 ? 1 : 0);
  const wCnt = (w.ippon1 ? 1 : 0) + (w.ippon2 ? 1 : 0);

  // 初期化
  r.extraWin = false;
  w.extraWin = false;

  /* 片方だけ1本 → 勝ち */
  if(rCnt === 1 && wCnt === 0){

    m.ui.result.red   = "〇";
    m.ui.result.white = "×";

    r.extraWin = true;
    m.done = true;
    renderMatches();
    return;
  }

  if(wCnt === 1 && rCnt === 0){

    m.ui.result.white = "〇";
    m.ui.result.red   = "×";

    w.extraWin = true;
    m.done = true;
    renderMatches();
    return;
  }

  /* 引き分け（0-0 / 1-1） */
  m.ui.result.red   = "×";
  m.ui.result.white = "×";

  m.done = true;
  renderMatches();
  return;
}

/* ===== Undo ===== */
if(act === "undo"){

  // Undo は「履歴があるなら必ず1つ戻す」。
  // Daihyo(一本勝負)・通常・反則・WBF すべてこれで戻ります。
  if(m.seq && m.seq.length > 0){
    m.seq.pop();
    recalcMatch(m);
    renderMatches();
    return;
  }

  // 履歴が空なのに done の場合は Complete（Time Up）由来。
  // seq を触れないので、確定表示だけ解除します。
  m.done = false;

  if(m.ui){
    m.ui.red.extraWin = false;
    m.ui.white.extraWin = false;
    m.ui.result.red = "";
    m.ui.result.white = "";
  }

  renderMatches();
  return;
}

  /* ===== Win by forfeit (WBF) ===== */
  if(act === "wbd"){

    if(m.done) return;

    // 履歴に積む（これで Undo 可能になる）
    m.seq.push({
      team: color,
      act: "WBF"
    });

    recalcMatch(m);
    renderMatches();
    return;
  }

  /* ===== Normal Ippon / Foul ===== */

  addIppon(index, color, act);
  renderMatches();

});

document.getElementById("teamEditor").style.display = "none";


/* ===== CELL VALUE ===== */
/* ===== IPPON CELL (DISPLAY) ===== */
function getIpponCell(matchIndex, team, slot){

  const m = AppState.matches[matchIndex];
  if(!m || !m.ui) return "";

  const ui = m.ui[team];

  let v = "";

  if(slot===0) v = ui.ippon1;
  if(slot===1) v = ui.ippon2;

  if(!v) return "";

// 「最初の一本」は recalcMatch() で確定した値を使う（途中で移動しない）
const isFirst =
  slot === 0 &&
  m.firstIpponTeam === team &&
  m.firstIpponAct === v;

// 丸も非丸も「同じ箱」で返す（ズレ防止）
return `<span class="ipponMark ${isFirst ? "ipponMark--circle" : ""}">${v}</span>`;
}

/* ===== EXTRA WIN MARK ===== */
function getExtraWinMark(matchIndex, team){

  const m = AppState.matches[matchIndex];
  if(!m || !m.ui) return "";

  if(m.ui[team].extraWin){
    return `<span class="extraWinBox">1</span>`;
  }

  return "";
}


/* ===== FOUL MARK ===== */
function getFoulMark(matchIndex, team){

  const m = AppState.matches[matchIndex];
  if(!m || !m.ui) return "";

  return m.ui[team].foulMark || "";
}

/* ===== RESULT MARK ===== */
function getResultMark(matchIndex, color){

  const m = AppState.matches[matchIndex];
  if(!m || !m.ui) return "";

  return m.ui.result[color] || "";
}


/* =====================
   LOWER: Matches Render
===================== */

function renderMatches(){
  const list = document.getElementById("matchList");
  if(!list) return;

  list.innerHTML = "";

  const pos = AppState.matches || [];

  pos.forEach((p,i)=>{

    const div = document.createElement("div");
    div.className = "matchCard";
    div.id = "pos-" + i;
    div.dataset.index = i;

div.innerHTML = `
  <div class="matchTitle">${AppState.positions[i] || ""}</div>

  <div class="matchBody">

    <div class="scoreBox">
<table class="scoreTable">
  <tr class="rowName red">
    <td colspan="2" class="nameCell">
      ${AppState.teams.red.players[i] || ""}
    </td>
  </tr>

  <tr class="rowIppon red">
    <td class="cell ipponBox" rowspan="2">
<span class="tl">${getIpponCell(i,"red",0)}</span>
<span class="br">${getIpponCell(i,"red",1)}</span>
<span class="br">${getExtraWinMark(i,"red")}</span>
<span class="bl">${getFoulMark(i,"red")}</span>
    </td>
    <td class="cell result" rowspan="2">${getResultMark(i,"red")}</td>
  </tr>
  <tr class="rowIppon red"></tr>

<tr class="rowIppon white">
  <td class="cell ipponBox" rowspan="2">
    <span class="tl">${getIpponCell(i,"white",0)}</span>
<span class="br">${getIpponCell(i,"white",1)}</span>
<span class="br">${getExtraWinMark(i,"white")}</span>
    <span class="bl">${getFoulMark(i,"white")}</span>
  </td>
  <td class="cell result" rowspan="2">${getResultMark(i,"white")}</td>
</tr>
  <tr class="rowIppon white"></tr>

  <tr class="rowName white">
    <td colspan="2" class="nameCell">
      ${AppState.teams.white.players[i] || ""}
    </td>
  </tr>
</table>

    </div>

<div class="controlBox">
  ${makeCtrl("red", i)}

  <div class="ctrlRow both" data-index="${i}">
    <button data-act="complete" class="completeBtn">Complete</button>
  </div>

  ${makeCtrl("white", i)}
</div>

  </div>
`;

    list.appendChild(div);

  });

  updateSummary();
  saveState();   // ← 追加

}

function makeCtrl(color,i){

  return `
  <div class="ctrlRow ${color}" data-color="${color}" data-index="${i}">

    <div class="btnRow">
      <button data-act="M">M</button>
      <button data-act="K">K</button>
      <button data-act="D">D</button>
      <button data-act="T">T</button>
      <button data-act="F">▲</button>
    </div>

    <div class="ctrlCmd">
      <button data-act="wbd">Win by forfeit</button>
      <button data-act="undo">Undo</button>
    </div>

  </div>
  `;
}

  /* =====================
     EDIT
  ===================== */
function renderTeamEditor(){

  const pos = AppState.positions || [];

  function makeTeam(team, color){

    let html = `<div class="editorTeam">`;

    html += `<div class="editorTitle ${color}">${color.toUpperCase()} Team</div>`;

    html += `
      <div class="editorRow team">
        <label>Team</label>
        <input data-team="${color}"
               data-type="name"
               value="${team.name || ""}">
      </div>
    `;

    pos.forEach((p, i) => {

      const label = (typeof p === "string" && p) ? p : ("Pos " + (i + 1));
      const v = team.players[i] || "";

      html += `
        <div class="editorRow player">
          <label>${label}</label>
          <input data-team="${color}"
                 data-type="player"
                 data-index="${i}"
                 value="${v}">
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  document.getElementById("editorRed").innerHTML =
    makeTeam(AppState.teams.red,"red");

  document.getElementById("editorWhite").innerHTML =
    makeTeam(AppState.teams.white,"white");
}


function toggleEdit(){

  AppState.editMode = !AppState.editMode;

  const editor = document.getElementById("teamEditor");

  if(AppState.editMode){
    renderTeamEditor();          // ← 開く時に生成
    editor.style.display = "block";
  }else{
    editor.style.display = "none";
  }

  renderTop();
}

document.addEventListener("input", (e)=>{

  const t = e.target;

  if(!t.dataset.team) return;

  const team = t.dataset.team;

  // チーム名
  if(t.dataset.type === "name"){

    AppState.teams[team].name = t.value;

    renderTop(); // 上段に即反映
  }

});

document.getElementById("editRed").onclick = toggleEdit;
document.getElementById("editWhite").onclick = toggleEdit;
document.getElementById("closeEditor").onclick = toggleEdit;

const resetBtn = document.getElementById("resetBtn");
const resetPanel = document.getElementById("resetPanel");

resetBtn.onclick = () => {
  resetPanel.style.display =
    (resetPanel.style.display === "none" || resetPanel.style.display === "")
      ? "block"
      : "none";
};

resetPanel.addEventListener("click", (e) => {

  const btn = e.target.closest("button");
  if(!btn || !btn.dataset.reset) return;

  const type = btn.dataset.reset;

  /* ===== 1. Scores Reset (共通処理) ===== */

  function resetScores(){
    (AppState.matches || []).forEach(m=>{
      m.seq = [];
      recalcMatch(m);
    });
  }

  /* ===== 2. Team Data Reset ===== */

  if(type === "score"){
    resetScores();
  }

  if(type === "red"){
    resetScores();
    AppState.teams.red.name = "";
    AppState.teams.red.players = [];
  }

  if(type === "white"){
    resetScores();
    AppState.teams.white.name = "";
    AppState.teams.white.players = [];
  }

  if(type === "all"){
    resetScores();
    AppState.teams.red.name = "";
    AppState.teams.white.name = "";
    AppState.teams.red.players = [];
    AppState.teams.white.players = [];
  }

  /* ===== 3. 再描画 ===== */

  renderTop();
  renderMatches();
  if(AppState.editMode) renderTeamEditor();

resetPanel.style.display = "none";
saveState();   // ← 追加
});

// ===== INIT =====

if(!savedState){
  initMatches(AppState.meta.members || 5);
}

ensureMatchUIState();
recalcAllMatchesFromSeq();
renderMatches();
renderPosNav();
renderTop();

/* =========================================================
   EXPORT PDF (Parent-friendly)  v1
   追加ブロック開始：ここだけ消せば完全に元に戻ります
========================================================= */

function escapeHTML(s){
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTeamTotals(){
  // updateSummary()と同じルールで集計（WBFは2本扱い）
  let redWin = 0, whiteWin = 0;
  let redIppon = 0, whiteIppon = 0;

  (AppState.matches || []).forEach(m=>{
    if(!m || !m.ui) return;

    const r = m.ui.red;
    const w = m.ui.white;

    // ippon count
    let rCnt = 0;
    if(r.ippon2 === "WBF"){
      rCnt = 2;
    }else{
      if(r.ippon1) rCnt++;
      if(r.ippon2) rCnt++;
    }
    redIppon += rCnt;

    let wCnt = 0;
    if(w.ippon2 === "WBF"){
      wCnt = 2;
    }else{
      if(w.ippon1) wCnt++;
      if(w.ippon2) wCnt++;
    }
    whiteIppon += wCnt;

    // win count
    if(m.ui.result.red === "〇") redWin++;
    if(m.ui.result.white === "〇") whiteWin++;
  });

  return { redWin, whiteWin, redIppon, whiteIppon };
}

function buildMarksHTML(m, team){
  if(!m || !m.ui) return "";

  const ui = m.ui[team];

  // WBFは見た目を簡潔にする（右下WBFだけで勝ち、という現在ロジックに合わせる）
  if(ui.ippon2 === "WBF"){
    return `<span class="mk">WBF</span>`;
  }

  const parts = [];

  // 一本目（最初の一本なら丸）
  if(ui.ippon1){
    const isFirst = (m.firstIpponTeam === team && m.firstIpponAct === ui.ippon1);
    if(isFirst){
      parts.push(`<span class="mk circle">${escapeHTML(ui.ippon1)}</span>`);
    }else{
      parts.push(`<span class="mk">${escapeHTML(ui.ippon1)}</span>`);
    }
  }

  // 二本目
  if(ui.ippon2){
    parts.push(`<span class="mk">${escapeHTML(ui.ippon2)}</span>`);
  }

  // 反則（表示上は▲だけ出す。あなたのUIは foulMark に▲が入る）
  if(ui.foulMark){
    parts.push(`<span class="mk">${escapeHTML(ui.foulMark)}</span>`);
  }

  // 延長一本勝ち（Complete由来）
  if(ui.extraWin){
    parts.push(`<span class="mk extra">1</span>`);
  }

  return parts.join("");
}

function getResultSymbol(m, team){

  // mが存在しない位置（Daihyoや人数変更直後）対策
  if(!m) return "";

  // ui未生成対策
  if(!m.ui) return "";

  // result未確定対策
  const r = m.ui.result?.[team];

  // undefined/null/空文字 をすべて安全なHTMLに変換
  if(r === "〇" || r === "×") return r;

  return ""; // ← HTMLを壊さないための重要ポイント
}


function buildParentPDFHTML(){
  // 念のため、seq→uiを最新化（画面表示と同一の根拠で出す）

  const title = AppState.meta?.name || "";
  const date  = AppState.meta?.date || "";

  const redTeamName = AppState.teams?.red?.name || "Red";
  const whiteTeamName = AppState.teams?.white?.name || "White";

  const pos = AppState.positions || [];
  const matches = AppState.matches || [];

const compactClass = (pos.length === 6) ? "page compact" : "page";

  const hasDaihyo = pos.includes("Daihyo");

  // 通常ポジション（Daihyoは別枠にする）
  const normalIndexes = pos
    .map((p,i)=>({p,i}))
    .filter(x=> x.p !== "Daihyo")
    .map(x=> x.i);

  // Daihyo index（あれば1つ想定）
  const daihyoIndex = hasDaihyo ? pos.findIndex(p=>p === "Daihyo") : -1;

  const totals = getTeamTotals();

  const rowsHTML = normalIndexes.map(i=>{
    const pLabel = escapeHTML(pos[i] || ("Pos " + (i+1)));

    const redPlayer = escapeHTML(AppState.teams?.red?.players?.[i] || "");
    const whitePlayer = escapeHTML(AppState.teams?.white?.players?.[i] || "");

    const m = matches[i];

    const redMarks = buildMarksHTML(m, "red");
    const whiteMarks = buildMarksHTML(m, "white");

    return `
      <div class="matchBlock">
        <div class="pos">${pLabel}</div>

<div class="line redLine">
  <div class="name">${redPlayer}</div>
  <div class="marks">${redMarks}</div>
<div class="res">${getResultSymbol(m,"red")}</div>
</div>

<div class="line whiteLine">
  <div class="name">${whitePlayer}</div>
  <div class="marks">${whiteMarks}</div>
<div class="res">${getResultSymbol(m,"white")}</div>
</div>
      </div>
    `;
  }).join("");

let daihyoHTML = "";
if(daihyoIndex >= 0 && matches[daihyoIndex] && matches[daihyoIndex].ui){

  const redPlayer = escapeHTML(AppState.teams?.red?.players?.[daihyoIndex] || "");
  const whitePlayer = escapeHTML(AppState.teams?.white?.players?.[daihyoIndex] || "");
  const m = matches[daihyoIndex];

  const redMarks = buildMarksHTML(m, "red");
  const whiteMarks = buildMarksHTML(m, "white");

  daihyoHTML = `
    <div class="sectionTitle">Daihyo</div>
    <div class="matchBlock">
      <div class="pos">Daihyo</div>

<div class="line redLine">
  <div class="name">${redPlayer}</div>
  <div class="marks">${redMarks}</div>
  <div class="res">${escapeHTML(getResultSymbol(m,"red"))}</div>
</div>

<div class="line whiteLine">
  <div class="name">${whitePlayer}</div>
  <div class="marks">${whiteMarks}</div>
  <div class="res">${escapeHTML(getResultSymbol(m,"white"))}</div>
</div>
    </div>
  `;
}

  // 親が最初に見たいのは「誰 vs 誰」と「最終結果」なので先に出す
  const header2 = `${escapeHTML(redTeamName)} vs ${escapeHTML(whiteTeamName)}`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title || "Kendo Score")}</title>
<style>
  @page { size: A4; margin: 12mm; }
  body{
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color:#111;
  }

  /* スマホでも読める“縦カード”幅に制限（A4中央配置） */
  .page{
    max-width: 520px;
    margin: 0 auto;
  }

  .topBar{
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    gap:12px;
    margin-bottom:10px;
  }
  .title{
    font-size:22px;
    font-weight:800;
    line-height:1.1;
  }
  .date{
    font-size:16px;
    font-weight:700;
    white-space:nowrap;
  }
  .subTitle{
    margin-top:6px;
    font-size:16px;
    font-weight:800;
    padding-bottom:10px;
    border-bottom:2px solid #111;
  }

  .summary{
    margin:14px 0 14px;
    padding:12px;
    border:1px solid #111;
    border-radius:10px;
  }
  .sumRow{
    display:flex;
    justify-content:space-between;
    gap:10px;
    padding:6px 0;
  }
  .sumRow + .sumRow{ border-top:1px solid #ddd; }
  .team{
    font-weight:800;
  }
  .nums{
    font-weight:800;
    white-space:nowrap;
  }

  .sectionTitle{
    margin:14px 0 8px;
    font-size:16px;
    font-weight:900;
  }

  .matchBlock{
    padding:10px 0;
    border-bottom:1px solid #ddd;
  }
/* ===== Compact mode (5 members) ===== */
.compact .matchBlock{
  padding:4px 0;
}

.compact .pos{
  margin-bottom:2px;
  font-size:13px;
}

.compact .line{
  padding:2px 0;
  grid-template-columns: 1fr 180px 44px;
}

.compact .name{
  font-size:15px;
}

.compact .marks{
  font-size:15px;
  gap:6px;
}

.compact .res{
  font-size:18px;
}

.compact .summary{
  padding:8px;
  margin:8px 0 10px;
}

.compact .sectionTitle{
  margin:8px 0 4px;
}

.compact .title{
  font-size:18px;
}

.compact .date{
  font-size:13px;
}

  .pos{
    font-size:14px;
    font-weight:900;
    margin-bottom:6px;
  }
.line{
  display:grid;
  grid-template-columns: 1fr 220px 60px; /* 名前 / 一本 / 勝敗 */
  align-items:center;
  gap:12px;
  padding:6px 0;
}

.name{
  font-size:18px;
  font-weight:700;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.marks{
  font-size:18px;
  font-weight:900;
  display:flex;
  gap:10px;
  align-items:center;
  justify-content:center; /* 真ん中固定 */
  white-space:nowrap;
}

.res{
  font-size:24px;
  font-weight:900;
  text-align:right; /* 右端固定 */
  white-space:nowrap;
}
  .mk{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-width: 20px;
  }
  .circle{
    width:24px;
    height:24px;
    border:2px solid #111;
    border-radius:50%;
    line-height:1;
  }
  .extra{
    width:24px;
    height:24px;
    border:2px solid #111;
    border-radius:6px;
    line-height:1;
  }

  /* 印刷時：余計な影等は無し。読みやすさ最優先 */
</style>
</head>
<body>
<div class="${compactClass}">

    <div class="topBar">
      <div class="title">${escapeHTML(title)}</div>
      <div class="date">${escapeHTML(date)}</div>
    </div>

    <div class="subTitle">${header2}</div>

    <div class="summary">
      <div class="sumRow">
        <div class="team">${escapeHTML(redTeamName)}</div>
        <div class="nums">${totals.redWin} Wins &nbsp; ${totals.redIppon} Ippon</div>
      </div>
      <div class="sumRow">
        <div class="team">${escapeHTML(whiteTeamName)}</div>
        <div class="nums">${totals.whiteWin} Wins &nbsp; ${totals.whiteIppon} Ippon</div>
      </div>
    </div>

    <div class="sectionTitle">Matches</div>
    ${rowsHTML}

    ${daihyoHTML}

  </div>

<script>
</script>
</body>
</html>`;
}

function downloadHTMLFile(){
  const html = buildParentPDFHTML();

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "kendo-score.html";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ボタンに紐付け（元に戻す時はこの2行を消すだけ） */
function openPrintWindow(){

  const html = buildParentPDFHTML();

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();

  w.focus();
  w.print();
}

const dlBtn = document.getElementById("dlBtn");

if(dlBtn){
  dlBtn.onclick = () => {

    if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){
      openPrintWindow();
    }else{
      downloadHTMLFile();
    }

  };
}

const shareBtn = document.getElementById("shareBtn");

if(shareBtn){
  shareBtn.onclick = async () => {

    const html = buildParentPDFHTML();
    const blob = new Blob([html], { type: "text/html" });
    const file = new File([blob], "kendo-score.html", { type: "text/html" });

    if(
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files:[file] })
    ){
      await navigator.share({
        title: "Kendo Score",
        files: [file]
      });
    }
    else if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){
      openPrintWindow();
    }
    else{
      downloadHTMLFile();
    }

  };
}
/* =========================================================
   追加ブロック終了
========================================================= */



});


