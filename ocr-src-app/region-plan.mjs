// Conservative heuristic: skip unusually small detections only when there is a strong
// scale hierarchy. Keep all boxes on documents with comparatively uniform text size.
export function planRegions(regions, pageWidth){
 if(!regions.length)return {regions:[],skipped:[],threshold:0};
 const heights=regions.map(b=>b.b-b.t).filter(h=>h>0).sort((a,b)=>a-b);
 if(!heights.length)return {regions:[],skipped:regions,threshold:0};
 const median=heights[Math.floor(heights.length/2)],max=heights[heights.length-1];
 const threshold=(heights.length>=8&&max>=median*3&&heights.filter(h=>h>=max*.4).length>=2)?max*.4:0;
 const selected=regions.filter(b=>b.b-b.t>=threshold).map(b=>({...b}));
 const skipped=regions.filter(b=>b.b-b.t<threshold);
 // Merge horizontally adjacent parts of the same line, but avoid joining distant columns.
 selected.sort((a,b)=>a.t-b.t||a.l-b.l);
 let changed=true;
 while(changed){changed=false;outer:for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++){
   let a=selected[i],b=selected[j],ha=a.b-a.t,hb=b.b-b.t,overlap=Math.min(a.b,b.b)-Math.max(a.t,b.t);
   if(overlap/Math.min(ha,hb)<.58||Math.max(ha,hb)/Math.min(ha,hb)>2.2)continue;
   let gap=Math.max(0,Math.max(a.l,b.l)-Math.min(a.r,b.r));
   let left=Math.min(a.l,b.l),right=Math.max(a.r,b.r);
   if(gap>Math.min(ha,hb)*.35 || right-left>pageWidth*.65)continue;
   selected[i]={l:left,t:Math.min(a.t,b.t),r:right,b:Math.max(a.b,b.b),score:Math.min(a.score??1,b.score??1)};
   selected.splice(j,1);changed=true;break outer;
 }}
 selected.sort((a,b)=>a.t-b.t||a.l-b.l);
 return {regions:selected,skipped,threshold};
}

// ---------------------------------------------------------------------------
// v2.4 · "Tự động": decide the Fusor run shape from the detected layout.
// Whole-page is one inference and keeps reading order, so it wins when the page has
// few boxes. Per-region costs one inference per box but survives pages where a single
// whole-page pass mixes very different text sizes; in that case tiny detections are
// dropped only when a strong size hierarchy exists (same rule as planRegions).
// ---------------------------------------------------------------------------
export const AUTO_LIMITS = {
  fullMaxRegions: 14,   // boxes at or below this → one whole-page run
  strongHierarchy: 3,   // max box >= 3× median height → mixed sizes (title vs. decoration)
  strongTinyShare: .3,  // >= 30% boxes far below the median
  tinyRatio: .4,        // "far below" = height < 40% of the largest box
  slowRegions: 60       // above this, warn that per-region runs can take minutes
};

export function regionStats(regions, pageWidth, pageHeight){
  const usable=(regions||[]).filter(b=>b&&b.r>b.l&&b.b>b.t);
  const n=usable.length;
  if(!n)return {count:0,median:0,max:0,hierarchy:0,tinyShare:0,coverage:0,pageWidth,pageHeight};
  const heights=usable.map(b=>b.b-b.t).sort((a,b)=>a-b);
  const median=heights[Math.floor(n/2)], max=heights[n-1];
  // "Tiny" is measured against the largest box (same 40% cut planRegions uses), because a
  // page whose minimum is the majority would otherwise report 0% tiny boxes.
  const tiny=heights.filter(h=>h<max*AUTO_LIMITS.tinyRatio).length;
  const area=usable.reduce((sum,b)=>{
    const w=Math.max(0,Math.min(pageWidth,b.r)-Math.max(0,b.l));
    const h=Math.max(0,Math.min(pageHeight,b.b)-Math.max(0,b.t));
    return sum+w*h;
  },0);
  return {count:n,median,max,hierarchy:median?max/median:0,tinyShare:tiny/n,coverage:Math.min(1,area/Math.max(1,pageWidth*pageHeight)),pageWidth,pageHeight};
}

export function planAuto(regions, pageWidth, pageHeight){
  const stats=regionStats(regions,pageWidth,pageHeight), n=stats.count;
  const base={stats,auto:true,limits:{...AUTO_LIMITS}};
  if(!n)return {...base,method:'full',policy:'all',reason:'no-regions',reasonText:'không thấy khung chữ nên đọc cả trang',warn:'Chữ viết tay có thể không được bộ tìm vùng phát hiện; nếu kết quả thiếu, khoanh vùng để nhận dạng lại.'};
  if(n<=AUTO_LIMITS.fullMaxRegions)return {...base,method:'full',policy:'all',reason:'few-regions',reasonText:`chỉ ${n} vùng chữ nên đọc cả trang một lượt`,warn:''};
  if(stats.hierarchy>=AUTO_LIMITS.strongHierarchy&&stats.tinyShare>=AUTO_LIMITS.strongTinyShare)return {...base,method:'regions',policy:'main',reason:'mixed-sizes',reasonText:`${n} vùng, cỡ chữ chênh tới ${stats.hierarchy.toFixed(1)}× và ${Math.round(stats.tinyShare*100)}% vùng rất nhỏ nên bỏ vùng nhỏ`,warn:`Có thể bỏ nhầm chữ quan trọng. Chọn “Từng vùng chữ · Mọi vùng” nếu cần đọc hết.`};
  return {...base,method:'regions',policy:'all',reason:'dense',reasonText:`${n} vùng, cỡ chữ tương đối đều nên đọc từng vùng và giữ mọi vùng`,warn:n>AUTO_LIMITS.slowRegions?`${n} vùng là nhiều: mỗi vùng chạy Fusor một lần nên có thể mất vài phút.`:'',slow:n>AUTO_LIMITS.slowRegions};
}
