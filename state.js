const AppState = {

  meta: {
    name: "XXX Taikai semi-final",
    date: "",
    members: 5
  },

editMode: false,

  teams: {
    red: { name:"", players:[] },
    white:{ name:"", players:[] }
  },
positions: [],

matches: [
  // { red:[], white:[], fouls:{red:0,white:0}, done:false }
],

activeId: null
};


function initMatches(memberCount){

  const pos = buildPositions(memberCount);

  AppState.positions = pos;

AppState.matches = pos.map(() => ({
  red: [],                 // ← 最初は空
  white: [],               // ← 最初は空
  seq: [],                 // ← ★追加（時系列ログ）
  fouls: { red:0, white:0 },
  done: false
}));
}
function buildPositions(count){

  const result = [];

  if(count < 3) count = 3;
  if(count > 20) count = 20;

  // 先頭
  result.push("Sempo");
  result.push("Jiho");

  // 3人制
  if(count === 3){
    result[1] = "Chuken";
    result.push("Taisho");
    result.push("Daihyo");   // ★追加
    return result;
  }

  // 4人制
  if(count === 4){
    result.push("Fukusho");
    result.push("Taisho");
    result.push("Daihyo");   // ★追加
    return result;
  }

  const mid = count - 4;
  const tail = ["Fukusho", "Taisho"];

  if(count % 2 === 0){
    let num = mid + 2;
    const mids = [];

    while(num >= 3){
      mids.push(num + "-Sho");
      num--;
    }

    result.push(...mids);
    result.push(...tail);
    result.push("Daihyo");   // ★追加
    return result;
  }
  else{
    const center = "Chuken";
    const half = Math.floor(mid / 2);

    const before = [];
    const after = [];

    let num = half + 3;
    for(let i=0;i<half;i++){
      after.unshift(num + "-Sho");
      num++;
    }

    num = num + 1;
    for(let i=0;i<half;i++){
      before.push(num + "-Sho");
      num += 2;
    }

    result.push(...before);
    result.push(center);
    result.push(...after);
    result.push(...tail);
    result.push("Daihyo");   // ★追加
    return result;
  }
}
