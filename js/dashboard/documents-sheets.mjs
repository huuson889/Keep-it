/* One presentation/gesture adapter for the real Documents controls.
 * Data, OCR jobs, page navigation and translation remain owned by their controllers. */
export function bindDocumentSheets({closeResults,closeSettings,closeMore,closeRegion,refreshNotice}){
 const id=n=>document.getElementById(n),portrait=()=>matchMedia('(orientation:portrait)').matches,viewer=id('viewer'),live=()=>viewer.classList.contains('show');
 const rail=id('rail'),railHome=document.createComment('Documents rail home');rail.before(railHome);
 function closePages(){if(!id('docsPagesSheet').hidden)id('docsPagesSheet').hidden=true;if(!id('docsPageScrim').hidden)id('docsPageScrim').hidden=true;if(portrait()){id('vRailToggle').setAttribute('aria-expanded','false');id('vRailToggle').classList.remove('on');}}
 function beforeOpen(kind){
  if(kind!=='pages')closePages();if(kind!=='more')closeMore();
  if(portrait()){
   if(!['results','settings'].includes(kind))id('ko-trPanel').classList.remove('open');
   if(kind!=='translation'&&viewer.classList.contains('transOpen'))id('trClose').click();
   if(kind!=='progress')id('ko-ocrProg').classList.remove('show');
  }
 }
 function togglePages(){const open=id('docsPagesSheet').hidden;if(open){beforeOpen('pages');id('docsPagesSheet').hidden=false;id('docsPageScrim').hidden=false;id('vRailToggle').setAttribute('aria-expanded','true');id('vRailToggle').classList.add('on');requestAnimationFrame(()=>id('docsPagesClose').focus());}else closePages();sync();}
 id('docsPagesClose').onclick=id('docsPageScrim').onclick=closePages;
 const sheetEntries=[
  {el:id('ko-ocrModal'),open:()=>portrait()&&live()&&id('ko-ocrModal').classList.contains('show'),close:closeSettings},
  {el:id('docsPagesSheet'),open:()=>portrait()&&live()&&!id('docsPagesSheet').hidden,close:closePages},
  {el:id('vMorePanel'),open:()=>portrait()&&live()&&!id('vMorePanel').hidden,close:closeMore},
  {el:id('ko-trPanel'),open:()=>portrait()&&live()&&id('ko-trPanel').classList.contains('open'),close:closeResults},
  {el:id('trPanel'),watch:viewer,open:()=>portrait()&&live()&&viewer.classList.contains('transOpen'),close:()=>id('trClose').click()},
  {el:id('ko-ocrProg'),open:()=>portrait()&&live()&&id('ko-ocrProg').classList.contains('show'),close:()=>id('ko-progClose').click()},
  {el:id('ko-regionEditor'),open:()=>portrait()&&live()&&!id('ko-regionEditor').hidden,close:closeRegion}
 ];
 const style=document.createElement('style');style.textContent=LHN_THEME.css(':root');document.head.append(style);
 for(const entry of sheetEntries){
  entry.el.classList.add('kpSheet','kpSurface');const grip=document.createElement('div');grip.className='kpSheetGrip';grip.setAttribute('aria-hidden','true');entry.el.prepend(grip);
  const nested=entry.el.closest('#viewer'),host=entry.el.parentElement.classList.contains('keepitOcr')?entry.el.parentElement:entry.el,home=nested?document.createComment('Keepit sheet home '+entry.el.id):null;if(home)host.before(home);
  const portal=()=>{if(home){if(portrait())document.body.append(host);else home.after(host);}};portal();addEventListener('resize',portal);
  LHN_SHEET.attach(entry.el,{isOpen:entry.open,close:entry.close,watch:entry.watch||entry.el,onDrag:on=>entry.el.classList.toggle('kpDragging',on)});
  const paint=()=>{const on=entry.open();if(entry.el.classList.contains('kpSheetOpen')!==on)entry.el.classList.toggle('kpSheetOpen',on);entry.el.setAttribute('aria-hidden',String(!on&&portrait()));};
  new MutationObserver(()=>{paint();sync();}).observe(entry.watch||entry.el,{attributes:true,attributeFilter:['class','hidden']});addEventListener('resize',paint);paint();
 }
 for(const name of ['ko-ocrScrim','docsPageScrim','moreScrim','docsSheetScrim']){
  const el=id(name);el.classList.add('kpScrim');const paint=()=>{const on=name==='ko-ocrScrim'?el.classList.contains('show'):!el.hidden;if(el.classList.contains('kpScrimOpen')!==on)el.classList.toggle('kpScrimOpen',on);};new MutationObserver(paint).observe(el,{attributes:true,attributeFilter:['class','hidden']});paint();
 }
 id('ko-ocrModal').classList.add('kpGlass');for(const el of [document.querySelector('.pager'),id('ko-vBanner'),id('ko-vBulb')])el.classList.add('kpSurface');
 function sync(){
  const modal=id('ko-ocrModal').classList.contains('show'),result=id('ko-trPanel').classList.contains('open');id('ko-trPanel').inert=modal;
  if(id('ko-vOcr').classList.contains('on')!==result)id('ko-vOcr').classList.toggle('on',result);
  for(const name of ['ko-vOcr','ko-openResults','ko-pResults'])id(name).setAttribute('aria-expanded',String(result));
  const dim=portrait()&&live()&&!modal&&sheetEntries.slice(3).some(e=>e.open());if(id('docsSheetScrim').hidden===dim)id('docsSheetScrim').hidden=!dim;
  if(!live())closePages();refreshNotice();
 }
 id('docsSheetScrim').onclick=()=>sheetEntries.find(e=>e.open())?.close();
 function layout(){if(portrait())id('docsPageStrip').append(rail);else{closePages();railHome.after(rail);}sync();}
 addEventListener('resize',layout);layout();
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!id('docsPagesSheet').hidden){e.preventDefault();closePages();}});
// Mouse input adapter: same threshold and release lifecycle as LHN_SHEET; keep the offscreen pose until the close class is painted.
let mouseSheet=null,suppressSheetClickUntil=0;
document.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('textarea,select,input:not([type=checkbox]):not([type=radio]),[contenteditable=true]'))return;
 const path=e.composedPath(),entry=sheetEntries.find(s=>s.open()&&path.includes(s.el));if(!entry)return;
 const chain=path.slice(0,path.indexOf(entry.el)+1).filter(n=>n instanceof Element),scrollers=chain.filter(n=>n.scrollHeight>n.clientHeight+1&&/auto|scroll/.test(getComputedStyle(n).overflowY));
 mouseSheet={entry,id:e.pointerId,x:e.clientX,y:e.clientY,dy:0,mode:null,scrollers,samples:[],k:1/(entry.el.currentCSSZoom||1)};
},true);
function mousePose(g){g.raf=0;if(g.mode==='drag')g.entry.el.style.setProperty('translate','0 '+Math.max(0,g.dy)+'px','important');}
document.addEventListener('pointermove',e=>{
 const g=mouseSheet;if(!g||g.id!==e.pointerId)return;if(!(e.buttons&1)){endMouseSheet({pointerId:g.id,type:'pointercancel'});return;}const dx=e.clientX-g.x,raw=e.clientY-g.y;
 if(!g.mode){if(Math.hypot(dx,raw)<6)return;if(Math.abs(dx)>Math.abs(raw)){mouseSheet=null;return;}
  const sc=g.scrollers.find(s=>raw>0?s.scrollTop>0:s.scrollTop+s.clientHeight<s.scrollHeight-1);g.mode=sc?'scroll':raw>0?'drag':'block';g.sc=sc;g.top=sc?.scrollTop||0;g.y0=e.clientY;
  if(e.isTrusted)g.entry.el.setPointerCapture(e.pointerId);
  if(g.mode==='drag'){g.entry.el.classList.add('kpDragging');g.entry.el.style.setProperty('transition','none','important');}
 }
 e.preventDefault();g.dy=(e.clientY-g.y0)*g.k;g.samples.push({t:performance.now(),y:g.dy});g.samples=g.samples.filter(p=>performance.now()-p.t<100);
 if(g.mode==='scroll')g.sc.scrollTop=g.top-raw;if(g.mode==='drag'&&!g.raf)g.raf=requestAnimationFrame(()=>mousePose(g));
},{capture:true,passive:false});
function endMouseSheet(e){
 const g=mouseSheet;if(!g||e.pointerId!==g.id)return;mouseSheet=null;if(!g.mode)return;if(g.raf)cancelAnimationFrame(g.raf);mousePose(g);
 suppressSheetClickUntil=Date.now()+300;const el=g.entry.el;if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);if(g.mode!=='drag')return;
 const distance=Math.max(0,g.dy),h=el.getBoundingClientRect().height*g.k,a=g.samples[0],b=g.samples.at(-1),v=a&&b&&b.t>a.t?(b.y-a.y)/(b.t-a.t):0,close=e.type==='pointerup'&&(distance>Math.min(110,h*.3)||(distance>24&&v>.6));
 el.style.setProperty('transition',close?'translate .18s ease-in':'translate .2s ease','important');el.style.setProperty('translate',close?'0 '+(h+40)+'px':'0 0','important');
 setTimeout(()=>{
  if(close){el.style.setProperty('transition','none','important');g.entry.close();}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.removeProperty('translate');el.style.removeProperty('transition');el.classList.remove('kpDragging');}));
 },close?180:220);
}
document.addEventListener('pointerup',endMouseSheet,true);document.addEventListener('pointercancel',endMouseSheet,true);document.addEventListener('lostpointercapture',endMouseSheet,true);addEventListener('blur',()=>{if(mouseSheet)endMouseSheet({pointerId:mouseSheet.id,type:'pointercancel'});});
document.addEventListener('click',e=>{if(Date.now()<suppressSheetClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);


 const api=Object.freeze({togglePages,closePages,beforeOpen,sync});globalThis.KeepitDocumentSheets=api;return api;
}
