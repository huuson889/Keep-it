import {bindDocumentControls} from './ocr-controls.mjs';
import {bindDocumentSheets} from './documents-sheets.mjs';
/* Clean integration: ONLY Keep-it 3.5.612 + approved OCR demo 2.9.7.33.
 * Viewer/storage/tools belong to Keepit. OCR UI/hover/region behaviour comes from the demo. */
import {bindOcrLocalization} from './ocr-localize.mjs';
import {imageVariant,preprocessV6,mergeImage} from '../../vendor/ocr/image-preprocess.mjs';
const host=globalThis.KeepitOcrDocumentHost,store=globalThis.KeepitDocumentsStore;
let ocrText=text=>text;
const asset=path=>new URL('../../vendor/ocr/'+path,import.meta.url).href;
const parked=document.createElement('div');parked.hidden=true;parked.className='keepitOcr';document.body.append(parked);
for(const name of ['regionSurface','regionMarks','regionRect','layer','hl']){const el=document.createElement('div');el.id='ko-'+name;parked.append(el);}
const overlay=page=>host.source(page)?.querySelector('.ocrCanvasOverlay');
const $=id=>{
 if(id==='stage'||id==='paper')return document.getElementById('stage');
 if(id==='pNum')return document.getElementById('pNum');
 const dynamic={layer:'.layer',hl:'.hl',regionSurface:'.regionSurface',regionMarks:'.regionMarks',regionRect:'.regionRect'};
 if(dynamic[id])return overlay(current)?.querySelector(dynamic[id])||document.getElementById('ko-'+id);
 return document.getElementById('ko-'+id);
};
const makeCanvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
let current=1,engineTotal=0,selectedFile=null,fileKind='',doc=null,busy=false,cancelled=false,mode='tess',tess=null,tessTerm=null,scanPage=0,job=0,abortJob=null,completion=Promise.resolve(),persistence=Promise.resolve();
let clock=null,runStart=0,statusBase='',flowMode='single',flowPages=new Map(),regionHistory=new Map(),syncRegion=null,demoHover,demoLineForBox,demoLineMap,demoNotice;
const drafts=new Map();
let results=new Map(),runStats={processed:0,failed:0},exporting=false;
function nowSec(t0){return ((performance.now()-t0)/1000).toFixed(1)}
function setStatus(s){statusBase=s;$('status').textContent=clock?`${s} · ${nowSec(runStart)} giây`:s;}
function startClock(){runStart=performance.now();clearInterval(clock);clock=setInterval(()=>{if(busy)$('status').textContent=`${statusBase} · ${nowSec(runStart)} giây`;},200);}
function stopClock(){clearInterval(clock);clock=null;}
function controls(){
 const has=!!selectedFile,can=has&&['pdf','image'].includes(fileKind);
 $('run').disabled=busy||!can;$('stop').disabled=!busy;
 document.querySelectorAll('#ko-ocrModal input,#ko-ocrModal select').forEach(e=>{e.disabled=busy;});
 document.querySelectorAll('#ko-ocrModes input:not([value="tess"]),#ko-folder,#ko-optTiny,#ko-optLoop,#ko-ocrModal [data-for] input,#ko-ocrModal [data-for] select,#ko-ocrModal [data-for] button').forEach(e=>{e.disabled=true;});
 $('copy').disabled=!results.get(current)?.text;$('save').disabled=busy||!results.size;$('savePdf').disabled=busy||!doc||!results.size;
 $('selectRegion').disabled=busy||!can;$('ocrRegion').disabled=busy||!can;$('cancelRegion').disabled=busy;
 $('applyRegion').disabled=busy||!String($('regionText').value).trim();
 globalThis.KeepitDocumentControls?.refresh();syncRegion?.();onState({busy:busy&&!exporting,current,total:engineTotal,has});
}
function grouped(result){
 const groups=[];
 for(const [index,box] of (result?.boxes||[]).entries()){
  const [l,t,r,b]=box.rect,cy=(t+b)/2;
  let line=groups.find(x=>Math.abs(x.cy-cy)<Math.max(.004,Math.min(x.height,b-t)*.55));
  if(!line){line={cy,height:b-t,items:[]};groups.push(line);}line.items.push({box,index});
 }
 groups.sort((a,b)=>a.cy-b.cy);for(const g of groups)g.items.sort((a,b)=>a.box.rect[0]-b.box.rect[0]);
 return groups;
}
function texts(page){const r=results.get(page);if(!r)return[];return r.edited?r.text.split(/\n+/).filter(Boolean):grouped(r).map(g=>g.items.map(i=>i.box.text).join(' '));}
function changed(page,result){
 drafts.delete(page);results.set(page,result);
 const documentId=host.state().document?.id;if(!documentId)return;
 const row={id:`${documentId}:${page}`,documentId,page,schema:1,engine:'tesseract',result:structuredClone(result),updatedAt:Date.now()};
 persistence=persistence.then(()=>store.put('ocr',row));
 return persistence;
}
function paint(target,page){
 if(!target||!target.isConnected||host.state().mode!=='orig')return;
 let root=target.querySelector(':scope>.keepitOcr');
 if(!root){root=document.createElement('div');root.className='keepitOcr';root.innerHTML='<div class="ocrCanvasOverlay paper"><div class="layer"></div><div class="ocrVisualSurface"><div class="scanFx fxDir"><i class="beam"><b class="tUp"></b><b class="tDn"></b><b class="ln"></b></i></div><div class="boxLayer" aria-hidden="true"></div><div class="hl" aria-hidden="true"></div><div class="regionSurface" hidden><div class="regionMarks"></div><div class="regionRect"></div></div></div></div>';target.append(root);bindRegionSurface(root.querySelector('.regionSurface'));}
 const cover=root.firstElementChild;Object.assign(cover.style,{width:'100%',height:'100%',minHeight:'0',border:0,borderRadius:0,boxShadow:'none',background:'none',overflow:'hidden'});
 cover.classList.toggle('scanning',busy&&scanPage===page);
 const layer=cover.querySelector('.layer');layer.classList.toggle('boxes',$('showBoxes').checked&&$('trPanel').classList.contains('open'));
 // Native text must bypass the OCR hit layer even before a result exists or on a cache hit.
 const native=!!host.state().engine?.pages[page-1]?.texts?.length;layer.classList.toggle('nativeText',native);
 const r=results.get(page);if(layer._ocrResult===r)return;layer._ocrResult=r;layer.replaceChildren();const boxes=cover.querySelector('.boxLayer');boxes.replaceChildren();if(!r)return;
 const grouping=grouped(r),mapping=new Map();grouping.forEach((g,line)=>g.items.forEach((item,i)=>mapping.set(item.index,{line,first:i===0})));
 const w=target.clientWidth,h=target.clientHeight,measure=makeCanvas(1,1).getContext('2d');
 for(const [i,box]of r.boxes.entries()){
  const [x0,y0,x1,y1]=box.rect;if(!box.text?.trim()||x1<=x0||y1<=y0)continue;
  const visibleBox=document.createElement('div');visibleBox.className='ocrWordBox';visibleBox.dataset.i=i;
  Object.assign(visibleBox.style,{left:x0*100+'%',top:y0*100+'%',width:(x1-x0)*100+'%',height:(y1-y0)*100+'%'});boxes.append(visibleBox);
  const span=document.createElement('span');span.dataset.i=i;
  if(!native){const map=mapping.get(i);span.className='para';span.dataset.page=page;span.dataset.paragraphIndex=map?.line||0;if(map?.first)span.dataset.paragraphStart='true';const en=document.createElement('span');en.className='en';en.textContent=box.text+' ';span.append(en);}else{span.textContent=box.text+' ';span.setAttribute('aria-hidden','true');}
  const height=Math.max(1,(y1-y0)*h),width=Math.max(1,(x1-x0)*w);measure.font=`${height}px sans-serif`;const raw=measure.measureText(box.text+' ').width||1;
  Object.assign(span.style,{left:x0*100+'%',top:y0*100+'%',fontSize:height+'px',transform:`scaleX(${width/raw})`});layer.append(span);
 }
}
function drawLayer(){
 document.querySelectorAll('#pageStack .docsSource').forEach(target=>paint(target,+target.dataset.page));
 const r=results.get(current);$('text').value=drafts.get(current)??r?.text??'';controls();host.refresh();
}
async function renderFor(n){return host.canvas(n);}
async function renderCanvas(n,longSide=2000){const c=await host.canvas(n),scale=Math.min(longSide/Math.max(c.width,c.height),1);if(scale===1)return c;const out=makeCanvas(Math.round(c.width*scale),Math.round(c.height*scale));out.getContext('2d').drawImage(c,0,0,out.width,out.height);c.width=c.height=1;return out;}
async function newTess(langs){const token=job;const worker=await globalThis.Tesseract.createWorker(langs,1,{workerPath:asset('tess-v9/worker.min.js'),corePath:asset('tess-v9/core/'),langPath:asset('tess-v9-data/'),workerBlobURL:false,cacheMethod:'none',gzip:false,logger:m=>{if(m.status==='recognizing text'&&!cancelled)setStatus(`Tesseract đang nhận dạng: ${Math.round((m.progress||0)*100)}%.`);}});if(cancelled||token!==job){await worker.terminate();throw Error('Đã dừng');}return worker;}
async function releaseEngines(){if(tess){const old=tess;tess=null;tessTerm=Promise.resolve(old.terminate()).catch(()=>{});await tessTerm;}}
function stop(){cancelled=true;++job;abortJob?.(Error('Đã dừng'));abortJob=null;void releaseEngines();setStatus('Đã dừng; giữ phần đã xử lý.');}
async function guarded(work){
 let timer;const limit=$('optTime').checked?90000:0;
 try{return await Promise.race([work,new Promise((_,reject)=>{abortJob=reject;if(limit)timer=setTimeout(()=>{reject(Error('Quá 90 giây'));void releaseEngines();},limit);})]);}finally{clearTimeout(timer);abortJob=null;}
}
async function run(){
 if(busy||!selectedFile||!['pdf','image'].includes(fileKind))return;
 const langs=[...document.querySelectorAll('.keepitOcr .lang:checked')].map(e=>e.value).join('+');if(!langs)return;
 const scope=$('scope').value,first=scope==='all'?1:scope==='range'?Number($('from').value):current,last=scope==='all'?engineTotal:scope==='range'?Number($('to').value):current;
 if(!Number.isInteger(first)||!Number.isInteger(last)||first<1||last<first||last>engineTotal){setStatus('Khoảng trang không hợp lệ.');return;}
 if(Array.from({length:last-first+1},(_,i)=>first+i).some(n=>results.has(n))&&!confirm(ocrText('Nhận dạng lại sẽ thay kết quả của các trang được chọn. Tiếp tục?')))return;
 let finish;completion=new Promise(resolve=>finish=resolve);const token=++job;busy=true;cancelled=false;runStats={processed:0,failed:0};startClock();$('progress').hidden=false;$('progress').value=0;controls();let done=0,firstFailure='';
 try{
  for(let n=first;n<=last;n++){
   if(token!==job)break;await host.goTo(n);if(token!==job)break;current=n;scanPage=n;setScanEffect(true,n);controls();
   setStatus(`Trang ${n}/${last}: đang chuẩn bị và nhận dạng…`);
   let result,error;
   // Approved demo retries a failed Tesseract page once, then continues the batch.
   for(let attempt=0;attempt<2&&token===job;attempt++){
    try{const canvas=await renderFor(n);try{result=await guarded(tessRun(canvas,langs,fileKind==='image'));}finally{canvas.width=canvas.height=1;}error=null;break;}
    catch(failure){error=failure;if(token!==job)break;await releaseEngines();}
   }
   if(token!==job)break;
   if(error){runStats.failed++;firstFailure ||= error?.message||String(error);}
   else{await changed(n,{...result,mode:'tess'});done++;runStats.processed=done;regionHistory.delete(n);}
   $('progress').value=(n-first+1)/(last-first+1);drawLayer();
  }
  stopClock();setStatus(cancelled?'Đã dừng; giữ phần đã xử lý.':runStats.failed?(done?`Xong ${done}/${last-first+1} trang · ${runStats.failed} trang chưa đọc được (đã bỏ qua): ${firstFailure}`:'Không hoàn tất: '+firstFailure):`Hoàn tất ${done} trang · ${nowSec(runStart)} giây. Kiểm tra nội dung và vị trí.`);
 }catch(error){setStatus(cancelled?'Đã dừng; giữ phần đã xử lý.':'Không hoàn tất: '+(error?.message||String(error)));}
 finally{await releaseEngines();stopClock();busy=false;scanPage=0;setScanEffect(false);controls();drawLayer();finish();}
}
$('run').onclick=run;$('stop').onclick=stop;$('showBoxes').onchange=drawLayer;
$('scope').onchange=()=>{};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('text').value);setStatus('Đã sao chép văn bản trang hiện tại.');}catch{$('text').select();setStatus('Nhấn Ctrl+C để sao chép.');}};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
$('save').onclick=()=>download(new Blob([[...results].sort((a,b)=>a[0]-b[0]).map(([n,r])=>`${ocrText(`--- Trang ${n} ---`)}\n${r.text}`).join('\n\n')],{type:'text/plain;charset=utf-8'}),'ket-qua-ocr.txt');
function setScanEffect(active,page=scanPage){document.querySelectorAll('.ocrCanvasOverlay').forEach(el=>el.classList.toggle('scanning',!!active&&el===overlay(page)));}
const hook=()=>({getCurrent:()=>current,getTotal:()=>engineTotal,getDoc:()=>doc,getResults:()=>results,getLayer:()=>overlay(current)?.querySelector('.layer'),getHighlightLayer:()=>overlay(current)?.querySelector('.hl'),getPaper:page=>overlay(page),isBusy:()=>busy,getMode:()=>mode,goTo:async n=>{await host.goTo(n);current=host.state().page;},releaseEngines,forceIdle:async()=>{stop();await completion;},applyText(n,text){
 const result=results.get(n);if(!result)return false;
 const stack=regionHistory.get(n)||[];stack.push(structuredClone(result));regionHistory.set(n,stack);
 void changed(n,{...result,text:String(text),edited:true,info:`Đã sửa tay · ${result.boxes?.length||0} khung chữ trên trang.`});
 drawLayer();return true;
}});
const closeMore=()=>host.closeMore();
let toastT;function toast(text){const el=document.getElementById('toast');el.textContent=ocrText(text);el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2500);}
function markRail(){for(const b of document.querySelectorAll('#rail [data-p]'))b.dataset.ocr=results.has(+b.dataset.p)?'done':'';}
function setDialogInert(open){
 document.documentElement.classList.toggle('ocrDialogOpen',open);document.getElementById('viewer').inert=open;$('trPanel').inert=open;
 if(open)requestAnimationFrame(()=>{if(modal.classList.contains('show'))$('ocrClose').focus({preventScroll:true});});
 else if($('trPanel').classList.contains('open'))requestAnimationFrame(()=>{if(!modal.classList.contains('show'))$('text').focus({preventScroll:true});});
 else{const button=$('vOcr');(button.getClientRects().length?button:document.getElementById('vMore')).focus({preventScroll:true});}
}

const textCache=new Map();async function pageHasText(n){return !!host.state().engine?.pages[n-1]?.texts?.length||!!results.get(n)?.text;}
let onState=()=>{};
function syncZoomControls(){}
function refreshHint(){void refreshPageHint();}
function boxRect(b,w,h){return [Math.max(0,b.x0/w),Math.max(0,b.y0/h),Math.min(1,b.x1/w),Math.min(1,b.y1/h)]}
function tesseractWords(data){if(data.words)return data.words;let words=[];for(let b of data.blocks||[])for(let p of b.paragraphs||[])for(let l of p.lines||[])for(let w of l.words||[])words.push(w);return words}
async function tessRun(c,langs,isImage=false){if(!tess){if(tessTerm){try{await tessTerm}catch{}tessTerm=null}tess=await newTess(langs,true)}await tess.setParameters({tessedit_pageseg_mode:'3'});let text,words;if(!isImage){let {data}=await tess.recognize(c,{}, {text:true,blocks:true});text=(data.text||'').trim();words=tesseractWords(data)}else{let attempts=[['raw','3'],['gray','11'],['mixed','3'],['v6','3']],outputs=[];for(let [i,[kind,psm]] of attempts.entries()){if(cancelled)break;setStatus(`Tesseract đang thử cách ${i+1}/4 cho ảnh…`);let v=kind==='v6'?await preprocessV6(c):imageVariant(c,kind);try{await tess.setParameters({tessedit_pageseg_mode:psm,preserve_interword_spaces:'1',user_defined_dpi:'300'});let data=(await tess.recognize(v,{}, {text:true,blocks:true})).data,sx=c.width/v.width,sy=c.height/v.height;data.words=tesseractWords(data).map(w=>({...w,bbox:{x0:w.bbox.x0*sx,y0:w.bbox.y0*sy,x1:w.bbox.x1*sx,y1:w.bbox.y1*sy}}));outputs.push(data)}finally{v.width=v.height=0}}if(cancelled)throw Error('Đã dừng.');let merged=mergeImage(outputs);text=merged.text;words=merged.words}let boxes=words.filter(w=>w.text&&w.bbox).map(w=>({text:w.text,rect:boxRect(w.bbox,c.width,c.height)}));return{text,boxes,info:`Tesseract · ${boxes.length} từ có vị trí. Kéo để chọn; vị trí có thể lệch.`}}
async function renderRegion(n,side,reg,kind=null){let full=kind?await renderFor(n,kind):await renderCanvas(n,side);if(!reg)return full;let [l,t,r,b]=reg,x=Math.floor(l*full.width),y=Math.floor(t*full.height),w=Math.max(1,Math.ceil(r*full.width)-x),h=Math.max(1,Math.ceil(b*full.height)-y),crop=makeCanvas(w,h);crop.getContext('2d').drawImage(full,x,y,w,h,0,0,w,h);full.width=full.height=1;return crop}
function mapRegion(box,reg){let [l,t,r,b]=reg,[x0,y0,x1,y1]=box.rect;return {...box,rect:[l+x0*(r-l),t+y0*(b-t),l+x1*(r-l),t+y1*(b-t)]}}
let region=null,startRegion=null,regionResult=null;
let regions=[],regionMarks=[],lastMergedText=null;
function activeRegionSurface(){return flowMode==='single'?$('regionSurface'):flowPages.get(current)?.region||$('regionSurface')}
function activeRegionRect(surface=activeRegionSurface()){return surface.querySelector('.regionRect')||$('regionRect')}
function activeRegionMarks(surface=activeRegionSurface()){return surface.querySelector('.regionMarks')||$('regionMarks')}
function markBox(r){let el=document.createElement('div');el.className='rMark';Object.assign(el.style,{left:r[0]*100+'%',top:r[1]*100+'%',width:(r[2]-r[0])*100+'%',height:(r[3]-r[1])*100+'%'});el.innerHTML='<i class="sw"><b class="ln"></b></i>';activeRegionMarks().append(el);regionMarks.push({r,el});return el}
function markOf(r){let m=regionMarks.find(x=>x.r===r);return m?m.el:null}
function dropMark(r){let el=markOf(r);if(el)el.remove();regionMarks=regionMarks.filter(x=>x.r!==r);regions=regions.filter(x=>x!==r)}
function clearMarks(){regionMarks=[];regions=[];for(const rec of flowPages.values())rec.region.querySelector('.regionMarks')?.replaceChildren();const box=$('regionMarks');if(box)box.replaceChildren()}
function pushRegionHistory(n){let prev=results.get(n),stack=regionHistory.get(n)||[];stack.push(prev?structuredClone(prev):null);regionHistory.set(n,stack)}
function appendRegionText(old,addText){
  const add=String(addText||'').trim();
  if(!add)return;
  const have=new Set(String(old.text||'').split('\n').map(x=>x.trim()).filter(Boolean));
  const lines=add.split('\n').map(x=>x.trim()).filter(x=>x&&!have.has(x));
  if(lines.length)old.text=[String(old.text||'').trim(),...lines].filter(Boolean).join('\n');
}
function mergeRegionBoxes(n,reg,r){let old=structuredClone(results.get(n))||{text:'',boxes:[],mode:'manual'},[x0,y0,x1,y1]=reg;old.boxes=old.boxes.filter(b=>{let x=(b.rect[0]+b.rect[2])/2,y=(b.rect[1]+b.rect[3])/2;return !(x>=x0&&x<=x1&&y>=y0&&y<=y1)});if(r?.boxes?.length)old.boxes.push(...r.boxes.map(b=>mapRegion(b,reg)));appendRegionText(old,r?.text);old.info=`Đã bổ sung ${r?.boxes?.length||0} khung chữ từ vùng đã chọn · ${old.boxes.length} khung trên trang.`;void changed(n,old)}
function closeRegion(){$('regionText').value='';syncRegion?.();activeRegionSurface().hidden=true;$('regionSurface').hidden=true;$('regionEditor').hidden=true;$('cancelRegion').hidden=true;$('selectRegion').hidden=false;activeRegionRect().style.display='none';$('regionRect').style.display='none';clearMarks();lastMergedText=null;region=null;startRegion=null;regionResult=null}
$('selectRegion').onclick=()=>{if(!selectedFile||busy)return;closeRegion();activeRegionSurface().hidden=false;$('cancelRegion').hidden=false;$('selectRegion').hidden=true;setStatus('Kéo trên trang để chọn vùng cần bổ sung chữ.')};$('cancelRegion').onclick=closeRegion;
function pos(e,surface=e.currentTarget){let r=surface.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}}
function bindRegionSurface(surface){surface.addEventListener('pointerdown',e=>{startRegion=pos(e,surface);surface.setPointerCapture(e.pointerId);activeRegionRect(surface).style.display='block'});surface.addEventListener('pointermove',e=>{if(!startRegion)return;let p=pos(e,surface),l=Math.min(p.x,startRegion.x),t=Math.min(p.y,startRegion.y),w=Math.abs(p.x-startRegion.x),h=Math.abs(p.y-startRegion.y);Object.assign(activeRegionRect(surface).style,{left:l*100+'%',top:t*100+'%',width:w*100+'%',height:h*100+'%'})});surface.addEventListener('pointerup',e=>{if(!startRegion)return;let p=pos(e,surface),r=[Math.min(p.x,startRegion.x),Math.min(p.y,startRegion.y),Math.max(p.x,startRegion.x),Math.max(p.y,startRegion.y)];startRegion=null;if(r[2]-r[0]<.005||r[3]-r[1]<.005){activeRegionRect(surface).style.display='none';return}region=r;regionResult=null;lastMergedText=null;regions.push(r);markBox(r);activeRegionRect(surface).style.display='none';$('regionEditor').hidden=false;$('regionText').value='';$('regionText').focus();setStatus('Nhập chữ theo từng dòng rồi bấm Áp dụng vùng.')})}
bindRegionSurface($('regionSurface'));
$('ocrRegion').onclick=async()=>{
  if(busy)return;
  const queue=[...regions];
  if(!queue.length){setStatus('Kéo trên trang để chọn ít nhất một vùng.');return}
  let langs=[...document.querySelectorAll('.lang:checked')].map(e=>e.value);
  if(mode==='tess'&&!langs.length){setStatus('Chọn ít nhất một ngôn ngữ.');return}
  busy=true;cancelled=false;controls();startClock();
  const start=performance.now();let texts=[],doneN=0,history=false;
  try{
    for(const reg of queue){
      if(cancelled)break;
      markOf(reg)?.classList.add('reading');
      setStatus(`Đang nhận dạng vùng ${doneN+1}/${queue.length}…`);
      let r;
      if(mode==='fusor')throw Error('Deferred');
      else{let c=await renderRegion(current,2000,reg,mode);try{r=await guarded(tessRun(c,langs.join('+'),true))}finally{c.width=c.height=1}}
      if(cancelled&&!r?.boxes?.length)break;
      if(!history){pushRegionHistory(current);history=true}
      mergeRegionBoxes(current,reg,r);      // ghép xong là khung xanh hiện ra
      dropMark(reg);                        // bỏ khung đỏ của vùng vừa đọc
      texts.push((r?.text||'').trim());doneN++;
      drawLayer();
    }
    lastMergedText=texts.join('\n');regionResult=null;
    $('regionText').value=lastMergedText;
    setStatus(cancelled?`Đã dừng sau ${doneN} vùng; phần đã đọc đã ghép vào lớp chữ.`:`Đã nhận dạng ${doneN} vùng · ${((performance.now()-start)/1000).toFixed(1)} giây. Khung xanh là chữ mới; gõ thêm nếu cần rồi bấm Áp dụng.`);
  }catch(e){setStatus(cancelled?'Đã dừng nhận dạng vùng.':'Không nhận dạng được vùng: '+e.message)}
  finally{if(tess){const d=tess;tess=null;try{tessTerm=Promise.resolve(d.terminate()).catch(()=>{})}catch{}}stopClock();busy=false;controls()}
};
$('applyRegion').onclick=()=>{
  if(busy||!region)return;
  const val=$('regionText').value;
  if(lastMergedText!==null&&val.trim()===lastMergedText.trim()){closeRegion();setStatus('Đã bổ sung vùng xong.');return}
  let lines=val.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length){setStatus('Nhập ít nhất một dòng chữ.');return}
  let previous=results.get(current),stack=regionHistory.get(current)||[];stack.push(previous?structuredClone(previous):null);regionHistory.set(current,stack);
  let old=structuredClone(previous)||{text:'',boxes:[],mode:'manual'},[x0,y0,x1,y1]=region;
  old.boxes=old.boxes.filter(b=>{let x=(b.rect[0]+b.rect[2])/2,y=(b.rect[1]+b.rect[3])/2;return !(x>=x0&&x<=x1&&y>=y0&&y<=y1)});
  let h=(y1-y0)/lines.length;lines.forEach((text,i)=>old.boxes.push({text,rect:[x0,y0+i*h,x1,y0+(i+1)*h]}));
  appendRegionText(old,lines.join('\n'));
  old.info=`Đã bổ sung vùng thủ công · ${old.boxes.length} khung chữ; vị trí dòng gần đúng.`;
  void changed(current,old);closeRegion();drawLayer();setStatus('Đã bổ sung vào lớp chữ. Văn bản kết quả bên dưới không đổi.')
};

const rawRegionRun=$('ocrRegion').onclick;
$('ocrRegion').onclick=()=>{completion=Promise.resolve(rawRegionRun());return completion;};
/* ---------- Document hints and OCR suggestion share the native notice/bulb. ---------- */
const NOTICE_KEY = 'keepit.ocrNoticeOff:';     // mỗi tệp một khoá riêng
let noticeFileKey = '', noticeCollapsed = false, noticeForcedOpen = false, noticeWasExpanded = false;

function noAskKey(){ return NOTICE_KEY + (noticeFileKey || 'unknown'); }
function noAskOn(){ try { return localStorage.getItem(noAskKey()) === '1'; } catch { return false; } }
/* hai bảng màu: mỗi lần popup hiện thì chọn ngẫu nhiên một trong hai */
function pickNoticeTheme(){
  const t = Math.random() < 0.5 ? 'amber' : 'violet';
  for (const el of [$('vBanner'), $('vBulb')]) if (el) el.dataset.nt = t;
}
const NOTICE_AUTO_HIDE = 10000;   // tự thu thành nút đèn sau 10s không tương tác
const NOTICE_NARROW = 640;        // vùng xem hẹp hơn mức này thì không bung popup
let noticeTimer = null, noticeNeeds = null,noticeWasScheduled=false;

function noticeNarrow(){ const st = $('stage'); return !!st && st.clientWidth > 0 && st.clientWidth < NOTICE_NARROW; }
function scheduleNoticeHide(){
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    if ($('vBanner')?.classList.contains('show')){ noticeCollapsed = true; refreshNotice(noticeNeeds); }
  }, NOTICE_AUTO_HIDE);
}
function refreshNotice(needsOcr){
  const banner = $('vBanner'), bulb = $('vBulb');
  if (!banner || !bulb) return;
  if (needsOcr !== undefined) noticeNeeds = !!needsOcr;
  const active = !!selectedFile && host.state().document?.id === selectedFile.id;
  const office = active && ['docx','pptx'].includes(fileKind);
  const hintKey = active ? (fileKind === 'image' ? 'imageHint' : office ? 'officeHint' : '') : '';
  const hint = $('fileHint');
  hint.hidden = !hintKey;
  if (hintKey) { hint.dataset.docLabel = hintKey; const text = LHN_LANGUAGES.t('docs_'+hintKey,{},document.documentElement.lang||'en'); if(hint.textContent!==text)hint.textContent=text; }
  else { delete hint.dataset.docLabel; if(hint.textContent)hint.textContent=''; }
  $('bannerText').hidden = !noticeNeeds;
  const action = $('bannerAct'), actionLabel = ocrText(office ? 'Thu gọn' : 'Nhận dạng chữ');
  action.hidden = !active || (!office && !noticeNeeds);
  if(action.textContent!==actionLabel)action.textContent=actionLabel;
  const needs = active && (!!noticeNeeds || !!hintKey);
  /* Covered surfaces, narrow viewers and user preferences keep the same notice behavior. */
  const covered=modal.classList.contains('show')||!document.getElementById('vMorePanel').hidden||!document.getElementById('docsPagesSheet').hidden||(matchMedia('(orientation:portrait)').matches&&($('trPanel').classList.contains('open')||!$('regionEditor').hidden));
  const expanded = needs && !covered && !noticeCollapsed && (noticeForcedOpen || (!noAskOn()&&!noticeNarrow()));
  if (expanded && !noticeWasExpanded) pickNoticeTheme();   // mỗi lần hiện là một trong 2 màu
  noticeWasExpanded = expanded;
  banner.classList.toggle('show', expanded);
  if (expanded&&!noticeWasScheduled) scheduleNoticeHide(); else if(!expanded)clearTimeout(noticeTimer);noticeWasScheduled=expanded;
  bulb.hidden = !(needs && !covered && !expanded);   // còn việc phải làm nhưng đang thu gọn / không tự hiện
  if ($('bannerNoAsk')) $('bannerNoAsk').checked = noAskOn();
}
/* rê chuột vào popup thì hoãn tự thu; ra khỏi thì đếm lại */
function holdNotice(hold){
  if (hold) clearTimeout(noticeTimer);
  else if ($('vBanner')?.classList.contains('show')) scheduleNoticeHide();
}
function collapseNotice(){
  noticeCollapsed = true; noticeForcedOpen = false;
  refreshNotice();
}
/* bấm nút đèn: LUÔN mở popup, kể cả tệp này đã tick “Không hiện lại” */
function expandNotice(){
  noticeForcedOpen = true; noticeCollapsed = false;
  refreshNotice();
}
function setNoAsk(on){
  try { on ? localStorage.setItem(noAskKey(), '1') : localStorage.removeItem(noAskKey()); } catch {}
  noticeForcedOpen = false;
  if (on) noticeCollapsed = true;
  refreshNotice();
}
/* mở tệp khác: trạng thái thông báo tính lại theo tệp đó */
function setNoticeFileKey(f){
  noticeFileKey = f ? `${f.name}|${f.size}` : '';
  noticeCollapsed = false; noticeForcedOpen = false; noticeWasExpanded = false;
}

/* ---------- gợi ý theo trang ---------- */
async function refreshPageHint(){
  const h = hook(); if (!h || !h.getTotal()) return;
  const n = h.getCurrent(), total = h.getTotal();
  const has = await pageHasText(n);
  $('ocrSub').textContent = `Trang ${n} · ${has ? 'đã có lớp chữ gốc' : 'chưa có lớp chữ'}`;
  $('scopePage').textContent = `trang ${n}`;
  $('scopeAll').textContent = `${total} trang`;
  $('ofTotal').textContent = total;
  const rangeTotal=$('rangeTotal'),totalLabel=LHN_LANGUAGES.t('ocr_rangeTotal',{total},'vi');rangeTotal.setAttribute('aria-label',totalLabel);rangeTotal.title=totalLabel;

  refreshNotice(!has);
  $('pNum').value = n;

}

/* ---------- trạng thái từ engine ---------- */
let wasBusy = false, runSeen = false, expectRun = false;
let stopSeq = 0;    // tăng mỗi lượt chạy mới (lớp UI); chặn mọi “buộc dừng” của lượt cũ
let stopHold = 0;   // trong khoảng này UI giữ "Đã dừng" (engine nhả muộn cũng không bật lại)
let stopRequested = false;  // người dùng bấm Dừng trong lượt này → lượt kết thúc KHÔNG được báo “xong”
function startRunUi(){
  runSeen = true;
  stopSeq++;                 // lượt mới
  stopHold = 0;              // bỏ cờ giữ “Đã dừng” của lượt trước
  stopRequested = false;
  const prog = $('ocrProg');
  prog.classList.add('show'); prog.classList.remove('done','stopped','error');
  $('progTitle').textContent = 'Đang nhận dạng chữ';
  $('pTitle').textContent = 'Đang chuẩn bị…';
  $('pClock').textContent = '0.0 giây';
  $('pLog').replaceChildren();
  $('pDone').classList.remove('show');
  $('pSum').textContent = '';              // không để dòng “Hoàn tất …” của lượt trước nằm lại
  $('pWarn').style.display = 'none';
  $('stop').hidden = false;
  $('pAgain').hidden = true;
  $('pRegion').hidden = true;
  $('pForce').hidden = true;
  /* KHÔNG bật hiệu ứng quét ở đây: còn hộp thoại xác nhận “Nhận dạng lại…” thì chưa quét.
     Hiệu ứng chỉ bật khi engine thật sự chạy (onKeepitState có busy=true). */
  lastMain = ''; lastSig = ''; followLast = 0;
}

/* dòng nhật ký trong thẻ (giữ 3 dòng, mới nhất lên trên) như v3.5 */
const LOG_SKIP = /^Tesseract đang nhận dạng: \d+%$/;
let lastMain = '';
function logLine(t){
  t = (t || '').trim();
  if (!t || LOG_SKIP.test(t)) return;
  const box = $('pLog');
  if (box.firstElementChild && box.firstElementChild.textContent === t) return;
  const d = document.createElement('div'); d.textContent = t;
  box.prepend(d);
  while (box.children.length > 3) box.lastElementChild.remove();
}

/* #status của engine dạng "… · 7.4 giây": tách thành dòng trạng thái + đồng hồ */
function splitStatus(){
  const raw = ($('status')?.textContent || '').trim();
  const m = raw.match(/(?:^|\s·\s)([\d.]+)\s*giây\b/);
  if (!m) return { main: raw, clock: '' };
  const clock = `${m[1]} giây`;
  let main = (raw.slice(0, m.index) + ' ' + raw.slice(m.index + m[0].length)).trim();
  main = main.replace(/\s*·\s*$/, '').replace(/^[·\s]+/, '')
             .replace(/\s+([.,;])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  return { main, clock };
}
function syncCard(){
  const { main, clock } = splitStatus();
  if (main && main !== lastMain){ lastMain = main; logLine(main); }
  if (main) $('pTitle').textContent = main;
  if (clock) $('pClock').textContent = clock;
  followRunPage(main);
}

/* Trang đang được nhận dạng thì khung xem nhảy tới trang đó (thấy hiệu ứng quét ngay) */
let followLast = 0;
function followRunPage(main){
  if (!hook()?.isBusy()) return;
  const m = (main || $('pTitle').textContent || '').match(/Trang\s+(\d+)\s*\//);
  if (!m) return;
  const n = Number(m[1]);
  if (!n || n === followLast) return;
  followLast = n;
  if (n !== hook().getCurrent()) hook().goTo(n, true);
  markRail(n);
}
const progEl = $('progress');
new MutationObserver(() => { if (!progEl.hidden && expectRun) startRunUi(); })
  .observe(progEl, { attributes: true, attributeFilter: ['hidden'] });

/* Bọc lại handler của engine để biết chắc lượt chạy này do người dùng bấm */
const engineRun = $('run').onclick;
$('run').onclick = ev => {
  /* kiểm tra như v3.5: thiếu ngôn ngữ thì báo, không đóng hộp thoại */
  if (currentMode() === 'tess' && !document.querySelector('.lang:checked'))
    return toast('Chọn ít nhất một ngôn ngữ');
  if (!pageCount()) return toast('Mở tệp trước đã');

  expectRun = true;
  $('trPanel').classList.add('open');globalThis.KeepitDocumentSheets?.beforeOpen('progress');   // native result state; portrait progress gets its own sheet
  $('ocrBody').scrollTop = 0;
  $('progress').value = 0;

  /* nhảy ngay tới trang đầu tiên sẽ nhận dạng (engine xử lý từ trang này) */
  const sc = $('scope').value;
  const firstTarget = sc === 'current' ? (hook()?.getCurrent?.() || 1)
    : sc === 'range' ? Math.max(1, Number($('from').value) || 1) : 1;
  followLast = firstTarget;

  /* (1) đóng hộp thoại + HIỆN THẺ TIẾN ĐỘ ngay trong nhịp bấm */
  closeOcr(true);
  startRunUi();
  $('progPage').textContent = `Trang ${hook()?.getCurrent?.() || 1}/${pageCount()}`;
  $('progClose').disabled = true;
  /* (2) TẮT POPUP CHỌN VÙNG ngay trong nhịp bấm */
  killRegionNow();

  /* (3) nhường 1 khung hình cho thẻ vẽ xong rồi mới nhảy trang + chạy engine */
  const bootT0 = Date.now();
  const boot = () => {
  /* Vừa bấm Dừng: engine còn nhả lượt cũ vài chục ms. Gọi engine lúc nó còn busy thì app bỏ qua
     lệnh chạy (nút Run đang disable) → đợi rảnh rồi chạy, tối đa 2 giây. */
  if (hook()?.isBusy()){
    if (Date.now() - bootT0 < 2000){ setTimeout(boot, 40); return; }
    toast('Engine chưa nhả lượt trước — thử lại sau 1 giây'); return;
  }
  if (firstTarget !== hook()?.getCurrent()) hook()?.goTo?.(firstTarget, true);
  markRail(firstTarget);

  if (engineRun) engineRun(ev);

  /* engine không chạy (vd. trang đã có lớp chữ) → trả hộp thoại lại như v3.5 */
  if (!hook()?.isBusy()){
    runSeen = false; expectRun = false;
    $('ocrProg').classList.remove('show');
    setScanEffect(false);
    $('progClose').disabled = false;
    $('pAgain').hidden = false;
    $('ocrModal').classList.add('show'); $('ocrScrim').classList.add('show');
    snapshotOcr();                      // mở lại hộp thoại thì lấy mốc mới cho ✕/Hủy
  }
  };   // hết boot()

  /* chờ trình duyệt vẽ xong thẻ tiến độ rồi mới nhảy trang + chạy engine */
  if (window.requestAnimationFrame) requestAnimationFrame(() => setTimeout(boot, 0));
  else setTimeout(boot, 0);
};
const engineRegionRun = $('ocrRegion').onclick;
let regionRun = false;   // đang/đã chạy nhận dạng vùng → không hiện thẻ “Đã nhận dạng xong”
$('ocrRegion').onclick = ev => { expectRun = true; runSeen = true; regionRun = true; if (engineRegionRun) engineRegionRun(ev); };

let statePage = 0;
onState = st => {
  /* vừa bấm Dừng: giữ nguyên UI "Đã dừng", không để state nhả muộn bật lại thẻ đang chạy */
  if (stopHold && Date.now() < stopHold){
    wasBusy = false;
    setScanEffect(false);
    const pg = $('ocrProg');
    pg.classList.add('show'); pg.classList.remove('done'); pg.classList.add('stopped');
    $('progTitle').textContent = 'Đã dừng nhận dạng';
    $('progPage').textContent = st.has ? `Trang ${st.current}/${st.total}` : 'Trang —/—';
    markRail(st.current);
    return;
  }
  const done = wasBusy && !st.busy;
  wasBusy = !!st.busy;
  if (!st.busy){ setScanEffect(false); if (!runSeen) expectRun = false; }

  if (st.current !== statePage){ statePage = st.current; clearHoverHighlight(); resetTextApply(); }
  markRail(st.current);

  if (st.busy && expectRun && !runSeen && !regionRun) startRunUi();
  /* Engine đang chạy mà thẻ còn tiêu đề “Đã nhận dạng xong / Đã dừng” của lượt trước
     → đưa thẻ về trạng thái đang chạy (tránh tiêu đề xanh mà dòng dưới vẫn “đang nhận dạng…”). */
  if (st.busy && !stopRequested && !regionRun){
    const pg0 = $('ocrProg');
    if (pg0.classList.contains('done') || pg0.classList.contains('stopped') || pg0.classList.contains('error')) startRunUi();
  }
  if (st.busy && scanPage) setScanEffect(true, scanPage);   // quét trang hiện hành trong cả chế độ cuộn liên tục
  if (st.busy) syncCard();
  if (st.busy && runSeen && !regionRun) $('ocrProg').classList.add('show');
  $('progPage').textContent = st.has ? `Trang ${st.current}/${st.total}` : 'Trang —/—';
  if (st.has) { $('pNum').max = st.total; $('ofTotal').textContent = st.total; }

  if (done && runSeen){
    runSeen = false; expectRun = false; followLast = 0; resetTextApply();
    /* nhận dạng vùng: chỉ cập nhật bảng Bổ sung vùng, KHÔNG bật thẻ “Đã nhận dạng xong” */
    if (regionRun){
      regionRun = false;
      $('ocrProg').classList.remove('show');
      $('ocrProg').classList.remove('done', 'stopped');
      $('progClose').disabled = false;
      $('stop').hidden = true;
      setScanEffect(false);
      syncCard();
      return;
    }
    $('progClose').disabled = false;
    const r = hook()?.getResults?.().get?.(st.current);
    /* có dòng “Không hoàn tất: …” (hoặc Lỗi) trong trạng thái/nhật ký → lượt này KHÔNG thành công */
    const errText = (($('status')?.textContent || '') + ' ' + ($('pTitle')?.textContent || '')).trim();
    const hadError = runStats.failed > 0 || /Không hoàn tất|Lỗi/i.test(errText);
    /* đã bấm Dừng (hoặc trạng thái engine ghi “Đã dừng”) ⇒ lượt này là DỪNG, không phải xong */
    const stoppedByUser = stopRequested || /Đã dừng|Đã buộc dừng/.test(errText);
    stopRequested = false;
    const ok = !!r && !hadError && !stoppedByUser;
    syncCard();
    const prog = $('ocrProg');
    prog.classList.toggle('done', ok);
    prog.classList.toggle('error', !ok && hadError);
    prog.classList.toggle('stopped', !ok && !hadError);
    $('progTitle').textContent = ok ? 'Đã nhận dạng xong'
      : hadError ? 'Nhận dạng chưa hoàn tất' : 'Đã dừng nhận dạng';
    $('stop').hidden = true;
    $('pAgain').hidden = false;
    $('pRegion').hidden = false;
    $('pForce').hidden = true;

    const { clock } = splitStatus();
    const sc = $('scope').value;
    const nTotal = hook()?.getTotal?.() || 1;
    const targets = sc === 'current' ? 1 : sc === 'range'
      ? Math.max(1, (Number($('to').value) || nTotal) - (Number($('from').value) || 1) + 1)
      : nTotal;
    const doneN = ok ? targets : Math.min(targets, runStats.processed);
    const sumWord = ok ? 'Hoàn tất' : (hadError ? 'Chưa hoàn tất' : 'Đã dừng');
    $('pSum').innerHTML = `${sumWord} <b>${ok ? targets : doneN}/${targets} trang</b>${clock ? ` · ${clock}` : ''}`;
    if (ok){ $('pWarn').style.display = 'none'; }
    else {
      $('pWarn').style.display = '';
      $('pWarn').textContent = hadError
        ? 'Lượt này dừng vì lỗi — kết quả có thể thiếu. Xem chi tiết ở nhật ký bên dưới, rồi bấm “Nhận dạng lại”.'
        : 'Kết quả có thể thiếu vì đã dừng giữa lượt. Các trang chưa chạy vẫn ở trạng thái ảnh quét.';
    }
    $('pDone').classList.add('show');
    if (r){ $('trPanel').classList.add('open'); }
    const st2 = ($('status')?.textContent || '').trim();
    const isErr = /không|lỗi|không mở|không nhận|không xuất/i.test(st2) && !r;
    toast(r ? 'Xong · kéo chuột trên trang để chọn chữ'
            : isErr ? st2.slice(0, 140) : 'Đã dừng nhận dạng');
  }
  $('from').disabled = $('to').disabled = !!st.busy;globalThis.KeepitDocumentControls?.refresh();
};

/* ---------- hộp thoại OCR ---------- */
const modal = $('ocrModal'), scrim = $('ocrScrim');
function currentMode(){ return $('ocrModes').querySelector('input:checked')?.value || 'tess'; }
function syncModeRadios(){
  const m = currentMode();
  [...$('ocrModes').children].forEach(l => l.classList.toggle('on', !!l.querySelector('input')?.checked));
  $('methodHint').textContent = m === 'pp'
    ? 'Nhanh: PP-OCR đọc cả trang một lượt, chạy trong worker nền nên giao diện vẫn bấm được và Dừng ăn ngay. Lần đầu phải nạp model ~32 MB (10–30 giây); thiếu nhiều dấu tiếng Việt.'
    : m === 'fusor'
      ? 'Viết tay: dùng Fusor — phải bấm “Chọn thư mục model” (~831 MB) xong mới bấm được Nhận dạng chữ; chạy chậm hơn hẳn.'
      : 'Chữ in: đọc thẳng cả trang một lượt, nhanh nhất với tài liệu in rõ.';
  [...$('ocrModal').querySelectorAll('[data-for]')].forEach(el => {
    el.classList.toggle('off', el.dataset.for !== m);
  });
}

/* Mỗi lần mở hộp thoại đều trả về đúng trạng thái như lần đầu */
function resetDialog(){
  closePageMenus();
  $('ocrBody').scrollTop = 0;
  $('ocrProg').classList.remove('show');     // thẻ tiến độ không đè lên hộp thoại
  renderLangs($('langSearch').value);
  $('langBox').scrollTop = 0;
  const picked = LANGS.filter(x => x.on).map(x => x.n);
  $('langSummary').textContent = picked.length ? picked.join(' + ') : 'chưa chọn';
  syncScopeRadios();
  syncModeRadios();
  $('ofTotal').textContent = pageCount();
  $('from').max = $('to').max = pageCount();
  clampPages(true);
  $('run').disabled = !hook()?.getTotal() || !!hook()?.isBusy() || !['pdf','image'].includes(fileKind);
}

function openOcr(){
  collapseNotice();   // bấm OCR là thu gợi ý thành bóng đèn
  if (!hook()?.getTotal()) return toast('Mở tệp trước đã');
  if (hook().isBusy() && !stalled) return toast('Đang nhận dạng, đợi lượt này xong');
  showTextResults(false);   // Keepit native flow opens BOTH the result panel and settings
  syncLayerBoxes();
  resetDialog(); refreshPageHint();
  snapshotOcr();                        // mốc để Hủy/✕ quay về
  modal.classList.add('show'); scrim.classList.add('show');$('ocrBody').scrollTop=0;setDialogInert(true);
}
/* Ảnh chụp trạng thái hộp thoại lúc mở — Hủy/✕ phải trả lại ĐÚNG như lúc mở */
let ocrSnap = null;
function snapshotOcr(){
  const fields = {};
  $('ocrModal').querySelectorAll('input,select,textarea').forEach(el => {
    if (el.type === 'radio'){ if (el.checked) fields['r:' + el.name] = el.value; return; }
    if (!el.id) return;
    fields[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  ocrSnap = { fields, langs: LANGS.map(l => l.on), search: $('langSearch').value };
}
function restoreOcr(){
  if (!ocrSnap) return;
  const { fields, langs, search } = ocrSnap; ocrSnap = null;
  LANGS.forEach((l, i) => { l.on = !!langs[i]; });
  $('langSearch').value = search || '';
  Object.keys(fields).forEach(k => {
    if (k.startsWith('r:')){
      const name = k.slice(2);
      const r = $('ocrModal').querySelector(`input[name="${name}"][value="${fields[k]}"]`);
      if (r) r.checked = true;
      return;
    }
    const el = document.getElementById(k); if (!el) return;
    if (el.type === 'checkbox') el.checked = !!fields[k]; else el.value = fields[k];
  });
  renderLangs($('langSearch').value);
  syncScopeRadios(); syncModeRadios();
  $('ofTotal').textContent = pageCount();
  $('from').max = $('to').max = pageCount();
  clampPages(true);
  $('scope').dispatchEvent(new Event('change'));      // app.js ẩn/hiện hàng khoảng trang
  $('optBoxes').dispatchEvent(new Event('change'));   // vẽ lại lớp khung theo lựa chọn cũ
  $('ocrModes').querySelector('input:checked')?.dispatchEvent(new Event('change', { bubbles: true }));
  const picked = LANGS.filter(x => x.on).map(x => x.n);
  $('langSummary').textContent = picked.length ? picked.join(' + ') : 'chưa chọn';
  if (typeof refreshPageHint === 'function') refreshPageHint();
  syncLayerBoxes();
  $('run').disabled = !hook()?.getTotal() || !!hook()?.isBusy() || !['pdf','image'].includes(fileKind);
}
/* Tắt chế độ chọn vùng NGAY LẬP TỨC: ẩn hộp + lớp chọn + khung đỏ trong cùng một nhịp,
   phần dọn sâu của app.js (xoá chữ, vẽ lại lớp khung) chạy ở nhịp sau để không chặn vẽ thẻ tiến độ */
function killRegionNow(){
  if ($('regionEditor').hidden && $('regionSurface').hidden) return false;
  progWasShown = false;
  $('regionEditor').hidden = true;
  $('regionSurface').hidden = true;
  $('cancelRegion').hidden = true;
  $('selectRegion').hidden = false;
  $('regionRect').style.display = 'none';
  setTimeout(() => { try { $('cancelRegion').click(); } catch {} }, 0);
  return true;
}

function closeOcr(commit){
  if (commit) ocrSnap = null; else restoreOcr();   // không bấm Nhận dạng chữ thì bỏ mọi thay đổi
  modal.classList.remove('show'); scrim.classList.remove('show'); setDialogInert(false); closePageMenus();
}
$('vOcr').onclick = openOcr;

$('pAgain').onclick = openOcr;
let regionBoxPrev = null;
function forceRegionBoxes(on){
  if (on){
    if (regionBoxPrev === null) regionBoxPrev = $('optBoxes').checked;
    if (!$('optBoxes').checked){ $('optBoxes').checked = true; $('optBoxes').dispatchEvent(new Event('change')); }
  } else if (regionBoxPrev !== null){
    const back = regionBoxPrev; regionBoxPrev = null;
    if ($('optBoxes').checked !== back){ $('optBoxes').checked = back; $('optBoxes').dispatchEvent(new Event('change')); }
  }
}
let progWasShown = false;   // popup tiến độ có đang hiện trước khi mở Bổ sung vùng không
function syncRegionButtons(){
  const hasText = !!String($('regionText')?.value || '').trim();
  /* kiểu nút chính do CSS (:has + :placeholder-shown) quyết định theo đúng nội dung ô;
     ở đây chỉ chặn bấm khi ô trống */
  if ($('applyRegion')) $('applyRegion').disabled = busy || !hasText;
  $('ocrRegion')?.classList.remove('primary');   // không dùng class nữa, tránh lệch trạng thái
}
function startRegionMode(){
  collapseNotice();   // bấm Chọn vùng là thu gợi ý thành bóng đèn
  progWasShown = $('ocrProg')?.classList.contains('show') || false;
  $('ocrProg').classList.remove('show');
  $('trPanel').classList.add('open');    // giữ thanh văn bản nhận dạng để xem chữ đã có
  if (!(hook()?.getTotal?.() > 0)) { toast('Mở tệp trước khi sửa vùng'); return; }
  if (hook()?.isBusy?.()) { toast('Đang nhận dạng — đợi xong rồi sửa vùng'); return; }
  globalThis.KeepitDocumentSheets?.beforeOpen('region');forceRegionBoxes(true);   // hiện hết khung đã nhận dạng để biết chọn chỗ nào
  $('selectRegion').click();
  $('regionSurface').hidden = false;        // chắc chắn vào chế độ chọn vùng
  $('regionEditor').hidden = false;         // hiện bảng ngay để còn Hủy chọn / Đóng
  $('cancelRegion').hidden = false;
  $('selectRegion').hidden = true;
  toast('Kéo trên trang để chọn vùng — chọn được nhiều vùng liền nhau');
}
$('pRegion').onclick = startRegionMode;
/* gõ chữ trong ô → đổi nút chính ngay */
syncRegion = syncRegionButtons;
$('regionText').addEventListener('input', syncRegionButtons);
$('regionText').addEventListener('change', syncRegionButtons);
/* đóng bảng Bổ sung vùng → nếu trước đó có popup tiến độ thì hiện lại */
new MutationObserver(() => {
  if ($('regionEditor').hidden){
    syncRegionButtons();
    if (progWasShown){ progWasShown = false; $('ocrProg')?.classList.add('show'); }
  } else syncRegionButtons();
}).observe($('regionEditor'), { attributes: true, attributeFilter: ['hidden'] });
syncRegionButtons();
$('trRegion').onclick = startRegionMode;
/* ra khỏi chế độ sửa vùng (Đóng / Hủy chọn / Áp dụng / Esc) thì trả lại trạng thái ô khung vùng */
document.addEventListener('click', e => {
  if (e.target?.closest?.('#ko-cancelRegion,#ko-applyRegion')) forceRegionBoxes(false);
});
$('ocrClose').onclick = () => closeOcr();
$('ocrCancel').onclick = () => closeOcr();
/* bấm ra ngoài = đóng và GIỮ thay đổi (đúng như 2.9.7.4); chỉ ✕ và Hủy mới bỏ thay đổi */
scrim.onclick = () => closeOcr(true);

/* phạm vi trang */
function syncScopeRadios(){
  const v = $('scope').value;
  [...$('ocrScopePick').querySelectorAll('input[name="ko-scopePick"]')].forEach(r => {
    r.checked = r.value === v;
    r.closest('label').classList.toggle('on', r.checked);
  });
  const busy = !!hook()?.isBusy();
  [ $('from'), $('to') ].forEach(inp => inp.disabled = busy);
  $('wrapFrom').classList.remove('disabled');$('wrapTo').classList.remove('disabled');
  $('ocrScopePick').querySelector('.rangeRow').classList.toggle('on',v==='range');
  globalThis.KeepitDocumentControls?.refresh();
}
$('ocrScopePick').addEventListener('change', e => {
  const r = e.target.closest('input[name="ko-scopePick"]'); if (!r) return;
  $('scope').value = r.value;
  $('scope').dispatchEvent(new Event('change'));   // app.js lo ẩn/hiện #rangeBox
  syncScopeRadios();
});

/* Native list controls retain the existing numeric input models. */
const pageCount=()=>hook()?.getTotal()||1;
function closePageMenus(){globalThis.KeepitDocumentControls?.close();}
function clampPages(fromChanged){
 const n=pageCount();let a=Number($('from').value)||1,b=Number($('to').value)||1;
 a=Math.min(Math.max(1,a),n);b=Math.min(Math.max(1,b),n);if(fromChanged&&a>b)b=a;if(!fromChanged&&b<a)a=b;
 $('from').value=a;$('to').value=b;globalThis.KeepitDocumentControls?.refresh();
}
/* ngôn ngữ: máy có 3 gói Tesseract */
const LANGS = [
  { c: 'eng', n: 'Anh', native: 'English', on: true },
  { c: 'vie', n: 'Việt', native: 'Tiếng Việt', on: true },
  { c: 'kor', n: 'Hàn', native: '한국어', on: false }
];
function renderLangs(filter = ''){
  const box = $('langBox'); box.replaceChildren();
  const q = filter.trim().toLowerCase();
  LANGS.filter(l => !q || l.n.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.c.includes(q))
    .forEach(l => {
      const lab = document.createElement('label');
      lab.className = 'kpick' + (l.on ? ' on' : '');
      lab.innerHTML = `<input type="checkbox" class="lang" value="${l.c}"${l.on ? ' checked' : ''}><span>${l.n}<small>${l.native}</small></span>`;
      lab.querySelector('input').addEventListener('change', ev => {
        l.on = ev.target.checked;
        lab.classList.toggle('on', l.on);
        const picked = LANGS.filter(x => x.on).map(x => x.n);
        $('langSummary').textContent = picked.length ? picked.join(' + ') : 'chưa chọn';
      });
      box.append(lab);
    });
  if (!box.children.length){ const p = document.createElement('div'); p.className = 'kpick'; p.textContent = 'Không có ngôn ngữ này'; box.append(p); }
}
$('langSearch').addEventListener('input', e => renderLangs(e.target.value));
$('langSearch').addEventListener('focus', () => $('langSearch').select());
renderLangs();

/* ---------- Trỏ vào dòng chữ ở bảng kết quả → tô sáng khối tương ứng trên trang ---------- */
const normText = t => (t || '').replace(/\s+/g, ' ').trim().toLowerCase();

/* Dòng logic thứ n của văn bản ↔ danh sách khung chữ của trang */
function boxesForLine(text, boxes, lineIdx, ratio){
  const lines = String(text || '').split('\n');
  if (lineIdx < 0 || lineIdx >= lines.length || !boxes?.length) return [];
  const target = normText(lines[lineIdx]);
  if (!target) return [];
  const direct = boxes.filter(b => normText(b.text) === target);
  if (direct.length) return direct;
  const part = boxes.filter(b => normText(b.text).includes(target));
  if (part.length) return part;
  // Region OCR appends replacement boxes: resolve a complete visual line before
  // the demo's character-offset fallback, which assumes the original box order.
  for(const cluster of clustersOf(boxes)){
    const indices=cluster.items.slice().sort((a,b)=>boxes[a].rect[0]-boxes[b].rect[0]);
    if(normText(indices.map(i=>boxes[i].text||'').join(' '))===target)return indices.map(i=>boxes[i]);
  }
  /* không khớp chữ: lấy mọi khung nằm cùng băng ngang với con trỏ (giống Paddle tô cả dòng) */
  if (typeof ratio === 'number'){
    const band = boxes.filter(b => {
      const r = b.rect || [];
      const cy = (r[1] + r[3]) / 2;
      return Math.abs(cy - ratio) <= 0.045;
    });
    if (band.length) return band;
    const nearest = boxes.reduce((best, b) => {
      const r = b.rect || [];
      return Math.abs((r[1] + r[3]) / 2 - ratio) < Math.abs((best.rect[1] + best.rect[3]) / 2 - ratio) ? b : best;
    }, boxes[0]);
    return [nearest];
  }
  /* ghép dồn: cộng dồn độ dài chữ của từng khung để biết dòng rơi vào khung nào */
  let head = 0;
  for (let i = 0; i < lineIdx; i++) head += String(lines[i] || '').length + 1;
  const mid = head + Math.floor(target.length / 2);
  let acc = 0;
  for (const b of boxes){
    const len = String(b.text || '').length;
    if (mid >= acc && mid < acc + len + 1) return [b];
    acc += len + 1;
  }
  const k = Math.min(boxes.length - 1, Math.round((lineIdx / Math.max(1, lines.length - 1)) * (boxes.length - 1)));
  return [boxes[k]];
}

function lineTopOf(ta, lineIdx){
  const mirror = mirrorOf(ta);
  const cs = getComputedStyle(ta);
  mirror.style.width = Math.max(20, ta.clientWidth) + 'px';
  const parts = (ta.value || '').split('\n');
  mirror.textContent = parts.slice(0, lineIdx).join('\n') + (lineIdx > 0 ? '\n' : '');
  const padTop = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
  const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 13) * 1.5;
  return { top: Math.max(0, mirror.scrollHeight - padTop - padB), lh, padTop, padB, cs };
}
function contentHeight(ta){
  const mirror = mirrorOf(ta);
  const cs = getComputedStyle(ta);
  mirror.style.width = Math.max(20, ta.clientWidth) + 'px';
  mirror.textContent = ta.value || '';
  const padTop = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
  return Math.max(1, mirror.scrollHeight - padTop - padB);
}
/* Chọn khung theo ĐỘ CAO con trỏ — luôn bám con trỏ, không phụ thuộc việc khớp chữ */
function boxesAtRatio(boxes, ratio, half){
  if (!boxes?.length) return [];
  const band = boxes.filter(b => {
    const r = b.rect || [];
    if (!(r.length === 4)) return false;
    const cy = (r[1] + r[3]) / 2;
    return Math.abs(cy - ratio) <= half;
  });
  if (band.length) return band;
  return [boxes.reduce((best, b) => {
    const r = b.rect || [], br = best.rect || [];
    return Math.abs((r[1] + r[3]) / 2 - ratio) < Math.abs((br[1] + br[3]) / 2 - ratio) ? b : best;
  }, boxes[0])];
}
/* Gom các khung chữ thành TỪNG DÒNG trên trang.
   Bỏ khung "dị thường" (cao gấp >3.5 lần trung vị) — Tesseract đôi khi trả khung phủ cả tranh,
   nếu giữ lại thì tô sáng sẽ phủ cả khoanh tranh thay vì đúng dòng chữ. */
function medianOf(arr){
  if (!arr.length) return 0;
  const a = arr.slice().sort((p, q) => p - q);
  return a[Math.floor(a.length / 2)];
}
function clustersOf(boxes){
  const raw = [];
  (boxes || []).forEach((b, i) => {
    const r = b?.rect || [];
    if (r.length !== 4) return;
    const h = r[3] - r[1];
    if (!(h > 0) || r[2] <= r[0]) return;
    raw.push({ i, x0: r[0], y0: r[1], x1: r[2], y1: r[3], h, cy: (r[1] + r[3]) / 2 });
  });
  const limit = medianOf(raw.map(o => o.h)) * 3.5;   // khung quá cao so với mặt bằng → loại
  const items = raw.filter(o => o.h <= Math.max(limit, 0.001));
  items.sort((p, q) => p.cy - q.cy);
  const out = [];
  for (const it of items){
    let target = null;
    for (let k = out.length - 1; k >= 0 && k >= out.length - 3; k--){   // chỉ so với 3 cụm cuối
      const g = out[k];
      const ov = Math.min(it.y1, g.y1) - Math.max(it.y0, g.y0);
      if (ov >= Math.min(it.h, g.y1 - g.y0) * 0.5){ target = g; break; }
    }
    if (target){
      target.items.push(it.i);
      target.y0 = Math.min(target.y0, it.y0); target.y1 = Math.max(target.y1, it.y1);
      target.x0 = Math.min(target.x0, it.x0); target.x1 = Math.max(target.x1, it.x1);
      target.cy = (target.y0 + target.y1) / 2;
    } else {
      out.push({ items: [it.i], x0: it.x0, y0: it.y0, x1: it.x1, y1: it.y1, cy: it.cy });
    }
  }
  return out;
}
/* Dòng thứ L trong bảng ↔ cụm khung trên trang (khớp theo số dòng, số chữ, rồi tỉ lệ) */
function clusterForLine(lines, clusters, lineIdx, ratio){
  if (!clusters?.length) return null;
  if (lineIdx < 0 || lineIdx >= lines.length) lineIdx = Math.max(0, Math.min(lines.length - 1, lineIdx));
  /* a) một khung/dòng (PP-OCR, Fusor, Tesseract 1 dòng) → đúng chỉ số */
  if (clusters.length === lines.length) return clusters[lineIdx];
  /* b) khớp theo số chữ tích luỹ (Tesseract trả về từ) */
  const wc = lines.map(l => { const t = String(l).trim(); return t ? t.split(/\s+/).length : 0; });
  const totalW = wc.reduce((a, b) => a + b, 0), totalC = clusters.reduce((a, c) => a + c.items.length, 0);
  if (totalW && Math.abs(totalW - totalC) <= Math.max(2, totalC * 0.15)){
    let target = 0;
    for (let k = 0; k <= lineIdx; k++) target += wc[k];
    let acc = 0;
    for (const c of clusters){ acc += c.items.length; if (target <= acc) return c; }
    return clusters[clusters.length - 1];
  }
  /* c) không khớp được chữ → gần nhất theo tỉ lệ dọc */
  let best = clusters[0], bd = 9;
  for (const c of clusters){ const d = Math.abs(c.cy - ratio); if (d < bd){ bd = d; best = c; } }
  return best;
}
function boxesOfCluster(cluster, boxes){ return cluster ? cluster.items.map(i => boxes[i]).filter(Boolean) : []; }

/* Khung chữ thứ i trên trang ↔ dòng chữ trong bảng */
function lineForBox(text, boxes, i){
  const lines = String(text || '').split('\n');
  const target = normText(boxes?.[i]?.text);
  if (target){
    for (let li = 0; li < lines.length; li++) if (normText(lines[li]) === target) return li;
  }
  // Region replacement appends boxes in the demo. Resolve by geometry before
  // its character-offset fallback, so an appended title still maps to its title line.
  const clusters = clustersOf(boxes), ci = clusters.findIndex(c => c.items.some(item => item === i));
  if (ci >= 0){
    const joined = clusters[ci].items.slice().sort((a,b)=>boxes[a].rect[0]-boxes[b].rect[0]).map(index => boxes[index]?.text || '').join(' ');
    const exact = lines.findIndex(line => normText(line) === normText(joined));
    if (exact >= 0) return exact;
    const nonempty = lines.map((line,index)=>({line,index})).filter(item=>item.line.trim());
    if (nonempty.length === clusters.length) return nonempty[ci].index;
  }
  let acc = 0;
  for (let k = 0; k < i; k++) acc += String(boxes[k]?.text || '').length + 1;
  const src = String(text || '');
  let li = 0;
  for (let c = 0; c < Math.min(acc, src.length); c++) if (src[c] === '\n') li++;
  return li;
}
function clearHoverHighlight(){
  overlay(current)?.querySelectorAll('.ocrWordBox.hover').forEach(el=>el.classList.remove('hover'));
  const hl = hook()?.getHighlightLayer?.() || $('hl'); if (hl) hl.replaceChildren();
  const line = $('trHover'); if (line) line.hidden = true;
}
function paintLineHover(ta, lineIdx){
  const box = $('trHover');
  if (!box || lineIdx < 0 || !ta.value){ if (box) box.hidden = true; return; }
  const { top: lineTop, lh, padTop } = lineTopOf(ta, lineIdx);
  const rect = ta.getBoundingClientRect();
  const host = ta.parentElement.getBoundingClientRect();
  Object.assign(box.style, {
    left: (rect.left - host.left + 4) + 'px',
    width: (rect.width - 8) + 'px',
    top: (rect.top - host.top + padTop - ta.scrollTop + lineTop) + 'px',
    height: lh + 'px'
  });
  box.hidden = false;
}
/* Sidebar văn bản nhận dạng: chỉ khi mở mới có khung xanh + tô sáng */
function trOpen(){ return !!$('trPanel')?.classList.contains('open'); }
function syncLayerBoxes(){
  const layer = hook()?.getLayer?.() || $('layer'); if (!layer) return;
  layer.classList.toggle('boxes', trOpen() && !!$('showBoxes')?.checked);
  if (!trOpen()) clearHoverHighlight();
}
function paintHoverHighlight(list){
  const active=new Set((list||[]).map(box=>box?.rect?.join(',')));
  overlay(current)?.querySelectorAll('.ocrWordBox').forEach(el=>el.classList.toggle('hover',active.has(results.get(current)?.boxes[Number(el.dataset.i)]?.rect?.join(','))));
  const hl = hook()?.getHighlightLayer?.() || $('hl'); if (!hl) return;
  hl.replaceChildren();
  /* mỗi khung chữ một khung tím ĐÚNG BẰNG khung xanh — không gộp thành khung bao */
  const seen = new Set();
  for (const box of (list || [])){
    const r = box?.rect || [];
    if (r.length !== 4 || !(r[2] > r[0] && r[3] > r[1])) continue;
    const key = r.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    /* chốt an toàn: khung phủ nửa trang hoặc >35% diện tích là khung rác → không vẽ */
    if ((r[3] - r[1]) > 0.5 || (r[2] - r[0]) * (r[3] - r[1]) > 0.35) continue;
    const [x0, y0, x1, y1] = r;
    const el = document.createElement('div');
    el.className = 'hlBox';
    Object.assign(el.style, { left: x0 * 100 + '%', top: y0 * 100 + '%', width: (x1 - x0) * 100 + '%', height: (y1 - y0) * 100 + '%' });
    hl.append(el);
  }
}

/* textarea không cho biết dòng đang trỏ → đo bằng bản sao ẩn để quy đổi toạ độ → vị trí ký tự */
let hoverMirror = null;
function mirrorOf(ta){
  if (hoverMirror && hoverMirror.parentNode) return hoverMirror;
  const cs = getComputedStyle(ta);
  const div = document.createElement('div');
  for (const p of ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing','textIndent'])
    div.style[p] = cs[p];
  Object.assign(div.style, { position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' });
  $('trPanel').append(div);
  hoverMirror = div;
  return div;
}
function charAtOffsetY(ta, y){
  const text = ta.value || '';
  if (!text) return -1;
  const mirror = mirrorOf(ta);
  mirror.style.width = Math.max(20, ta.clientWidth) + 'px';
  const cs = getComputedStyle(ta);
  const padTop = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
  let lo = 0, hi = text.length;
  while (lo < hi){
    const mid = Math.ceil((lo + hi) / 2);
    mirror.textContent = text.slice(0, mid);
    if (Math.max(0, mirror.scrollHeight - padTop - padB) <= y) lo = mid; else hi = mid - 1;
  }
  return lo;
}
function lineAtOffset(text, off){
  if (off < 0) return -1;
  return (text.slice(0, off).match(/\n/g) || []).length;
}

const resultText = $('text');
resultText.addEventListener('mousemove', e => {
  const live = hook()?.getResults?.()?.get?.(hook()?.getCurrent?.());
  if (!trOpen() || !live?.boxes?.length || hook()?.isBusy?.()) return clearHoverHighlight();
  const ta = resultText;
  const rect = ta.getBoundingClientRect();
  const cs = getComputedStyle(ta);
  const padTop = parseFloat(cs.paddingTop) || 0;
  const y = Math.max(0, e.clientY - rect.top - padTop) + ta.scrollTop;
  /* con trỏ ở khoảng trắng DƯỚI dòng cuối (hoặc bảng rỗng) → không tô sáng gì trên trang */
  if (!ta.value || y > contentHeight(ta)) return clearHoverHighlight();
  const off = charAtOffsetY(ta, y);
  const lineIdx = Math.max(0, lineAtOffset(ta.value, off));
  const { top: lineTop, lh } = lineTopOf(ta, lineIdx);
  const contentH = contentHeight(ta);
  const ratio = Math.min(1, Math.max(0, (lineTop + lh / 2) / contentH));
  const lines = String(ta.value || '').split('\n');
  /* 1) khớp chữ trước (chính xác nhất, không lan sang cột khác) */
  let picked = boxesForLine(ta.value, live.boxes, lineIdx, null);
  /* 2) không khớp chữ → dòng trên trang theo cụm */
  if (!picked.length) picked = boxesOfCluster(clusterForLine(lines, clustersOf(live.boxes), lineIdx, ratio), live.boxes);
  /* 3) vẫn không có → băng ngang theo tỉ lệ */
  if (!picked.length){
    const half = Math.min(0.12, Math.max(0.012, (lh / 2) / contentH + 0.01));
    picked = boxesAtRatio(live.boxes, ratio, half);
  }
  paintHoverHighlight(picked);
  if (picked.length) paintLineHover(ta, lineIdx); else $('trHover').hidden = true;
});
resultText.addEventListener('mouseleave', clearHoverHighlight);

/* Trỏ khung chữ trên trang → sáng đúng dòng trong bảng và cuộn tới dòng đó */
function onLayerMouseover(e){
  const span = e.target?.closest?.('span[data-i]');
  const live = hook()?.getResults?.()?.get?.(hook()?.getCurrent?.());
  if (!trOpen() || !live?.boxes?.length) return clearHoverHighlight();
  if (!span) return clearHoverHighlight();
  const idx = Number(span.dataset.i);
  if (!Number.isFinite(idx)) return;
  const li = lineForBox($('text').value, live.boxes, idx);
  const ta = $('text');
  const { top: lineTop, lh } = lineTopOf(ta, li);
  if (lineTop < ta.scrollTop || lineTop + lh > ta.scrollTop + ta.clientHeight)
    ta.scrollTop = Math.max(0, lineTop - Math.round(ta.clientHeight / 2));
  paintLineHover(ta, li);
  paintHoverHighlight([live.boxes[idx]]);
}
$('layer').addEventListener('mouseover', onLayerMouseover);
$('layer').addEventListener('mouseleave', clearHoverHighlight);
$('layer').addEventListener('mouseout', e => { const to=e.relatedTarget; if (!to || !to.closest?.('span[data-i]')) clearHoverHighlight(); });
$('stage').addEventListener('mouseover',e=>{if(e.target?.closest?.('.keepitOcr .layer'))onLayerMouseover(e)});
$('stage').addEventListener('mouseout',e=>{if(e.target?.closest?.('.keepitOcr .layer')&&!e.relatedTarget?.closest?.('.keepitOcr .layer'))clearHoverHighlight()});
$('paper').addEventListener('mouseleave', clearHoverHighlight);
demoHover = { clustersOf, clusterForLine, boxesOfCluster };
demoLineForBox = lineForBox;
resultText.addEventListener('scroll', clearHoverHighlight);
$('stage')?.addEventListener('scroll', clearHoverHighlight, {passive:true});
demoLineMap = boxesForLine;

/* ---------- Sửa chữ trong bảng rồi Áp dụng ---------- */
$('text').addEventListener('input', () => {drafts.set(current,$('text').value); $('textApply').disabled = false; });
$('textApply').onclick = () => {
  if (hook()?.isBusy?.()) return toast('Đang nhận dạng — đợi xong rồi lưu');
  const n = hook()?.getCurrent?.();
  const edited=$('text').value;drafts.delete(n);const ok = hook()?.applyText?.(n,edited);if(!ok)drafts.set(n,edited);
  if (!ok) return toast('Trang này chưa có kết quả để sửa');
  $('textApply').disabled = true;
  toast(`Đã lưu chữ đã sửa cho trang ${n}`);
};
function resetTextApply(){ $('textApply').disabled = !drafts.has(current); }

/* ---------- Kết quả trên tệp: điều khiển hiển thị ↔ điều khiển engine ---------- */
function syncFileOpts(){
  const res = $('ocrRes').value;
  for (const id of ['detLimit','regionLimit']){
    const sel = $(id);
    if (sel && [...sel.options].some(o => o.value === res)) sel.value = res;
  }
  $('regionPolicy').value = $('optTiny').checked ? 'main' : 'all';
  $('loopGuard').checked = $('optLoop').checked;
  $('regionTimeout').value = $('optTime').checked ? '90' : '0';
}
['ocrRes','optTiny','optLoop','optTime'].forEach(id => $(id).addEventListener('change', syncFileOpts));
$('showBoxes').checked = $('optBoxes').checked;   // khung vùng hiện ngay từ đầu
$('optBoxes').addEventListener('change', () => {
  $('showBoxes').checked = $('optBoxes').checked;
  $('showBoxes').dispatchEvent(new Event('change'));   // app.js vẽ lại lớp khung ngay
});
syncFileOpts();

/* cách đọc */
$('ocrModes').addEventListener('change', () => {
  syncModeRadios();
  if (currentMode() === 'fusor' && $('run').disabled)
    toast('Fusor cần chọn thư mục model (~831 MB) trước khi chạy');
});

/* bấm Nhận dạng: engine chạy, đóng hộp thoại, mở thẻ tiến độ */
$('run').addEventListener('click', () => {
  setTimeout(() => {
    if (hook()?.isBusy()){ closeOcr(); $('ocrProg').classList.add('show'); }
  }, 350);
});

/* A panel close hides the UI, not an unapplied draft. Drafts never write to the stored result. */
function closeTrPanel(){
 $('trPanel').classList.remove('open','resizing');$('trResize').classList.remove('drag');
 const button=$('vOcr');(button.getClientRects().length?button:document.getElementById('vMore')).focus({preventScroll:true});
}
function showTextResults(focus=true){
 closeMore();globalThis.KeepitDocumentSheets?.beforeOpen('results');$('trPanel').classList.add('open');
 $('text').value=drafts.get(current)??results.get(current)?.text??'';resetTextApply();syncLayerBoxes();
 if(focus)requestAnimationFrame(()=>{if(!modal.classList.contains('show'))$('text').focus({preventScroll:true});});
}
$('openResults').onclick=()=>{closeOcr();showTextResults();};$('pResults').onclick=()=>{ $('ocrProg').classList.remove('show');showTextResults();};
$('trClose').onclick = closeTrPanel;

/* hộp nổi phải: đáy 20px, thẻ tiến độ hiện thì hộp "Bổ sung vùng" xếp lên trên */
(function layoutSidePanels(){
  const prog = $('ocrProg'), ed = $('regionEditor');
  if (!prog || !ed) return;
  const place = () => {
    const on = prog.classList.contains('show');
    if (on) killRegionNow();            // thẻ tiến độ hiện → tắt chọn vùng ngay
    /* đáy hộp nổi = đường ngang dưới của sidebar phải (đo thật, không đoán) */
    const panel = $('trPanel');
    const bottomGap = panel ? Math.max(0, Math.round(window.innerHeight - panel.getBoundingClientRect().bottom)) : 0;
    document.body.style.setProperty('--sideBottom', bottomGap + 'px');
  };
  place();
  new MutationObserver(place).observe(prog, { attributes: true, attributeFilter: ['class', 'style'] });
  if (window.ResizeObserver) new ResizeObserver(place).observe(prog);
  window.addEventListener('resize', place);
})();

/* kéo mép trái để đổi độ rộng (nhớ theo máy) */
const TR_W_KEY = 'keepit.trWidth';
function trClampWidth(w){
  const max = Math.min(760, Math.max(320, window.innerWidth * 0.7));
  return Math.round(Math.max(280, Math.min(w, max)));
}
(function initTrResize(){
  const panel = $('trPanel'), grip = $('trResize');
  if (!panel || !grip) return;
  try {
    const saved = Number(localStorage.getItem(TR_W_KEY));
    if (saved >= 280) panel.style.setProperty('--trW', trClampWidth(saved) + 'px');
  } catch {}
  let dragging = false, startX = 0, startW = 0;
  grip.addEventListener('pointerdown', e => {
    dragging = true; startX = e.clientX; startW = panel.getBoundingClientRect().width;
    panel.classList.add('resizing'); grip.classList.add('drag');
    try { grip.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  });
  grip.addEventListener('pointermove', e => {
    if (!dragging) return;
    panel.style.setProperty('--trW', trClampWidth(startW + (startX - e.clientX)) + 'px');
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false; panel.classList.remove('resizing'); grip.classList.remove('drag');
    try { localStorage.setItem(TR_W_KEY, String(trClampWidth(panel.getBoundingClientRect().width))); } catch {}
  };
  grip.addEventListener('pointerup', stop);
  grip.addEventListener('pointercancel', stop);
  window.addEventListener('resize', () => {
    const cur = panel.style.getPropertyValue('--trW');
    if (cur) panel.style.setProperty('--trW', trClampWidth(parseFloat(cur)) + 'px');
  });
})();
/* mở/đóng sidebar → bật/tắt khung xanh + tô sáng ngay */
new MutationObserver(syncLayerBoxes).observe($('trPanel'), { attributes: true, attributeFilter: ['class'] });
$('showBoxes').addEventListener('change', syncLayerBoxes);
$('bannerAct').onclick = () => { collapseNotice(); if(!['docx','pptx'].includes(fileKind))openOcr(); };
$('bannerClose').onclick = () => collapseNotice();          // thu gọn thành nút đèn
$('vBulb').onclick = () => expandNotice();                  // bấm đèn → bung lại thông báo
['mouseenter','focusin'].forEach(ev => $('vBanner').addEventListener(ev, () => holdNotice(true)));
['mouseleave','focusout'].forEach(ev => $('vBanner').addEventListener(ev, () => holdNotice(false)));
/* đang chạy nhận dạng (thẻ tiến độ mở) → thu gợi ý để không tranh chỗ */
if ($('ocrProg')) new MutationObserver(() => {
  if ($('ocrProg').classList.contains('show') && $('vBanner')?.classList.contains('show')){
    noticeCollapsed = true; refreshNotice(noticeNeeds);
  }
}).observe($('ocrProg'), { attributes: true, attributeFilter: ['class'] });
/* vùng xem hẹp (panel phải mở rộng) → thu ngay, không đè lên nội dung */
try { new ResizeObserver(() => refreshNotice(noticeNeeds)).observe($('stage')); } catch {}
$('bannerNoAsk').addEventListener('change', e => setNoAsk(e.target.checked));
demoNotice = { refreshNotice, collapseNotice, expandNotice, setNoAsk, setNoticeFileKey, noAskKey };
/* ---------- canh gác: engine không phản hồi thì cho thoát ---------- */
let lastSig = '', lastBeat = Date.now(), stalled = false;
const stallMs = () => Number(window.__keepitStallMs) || 45000;
setInterval(() => {
  if (hook()?.isBusy() && !(stopHold && Date.now() < stopHold)) syncCard();
  const sig = `${$('status')?.textContent || ''}|${$('progress')?.value || 0}|${$('progPage')?.textContent || ''}`;
  if (sig !== lastSig){ lastSig = sig; lastBeat = Date.now(); if (stalled){ stalled = false; $('pForce').hidden = true; } }
  const busy = !!hook()?.isBusy();
  if (busy && !stalled && Date.now() - lastBeat > stallMs()){
    stalled = true;
    $('pForce').hidden = false;
    $('progClose').disabled = false;
    toast('Engine không phản hồi — bấm “Buộc dừng” để thoát');
  }
  if (!busy && stalled){ stalled = false; $('pForce').hidden = true; }
}, 900);

function markStopped(warn){
  runSeen = false; expectRun = false; stoppedFlag = false;
  lastBeat = Date.now();
  followLast = 0;
  setScanEffect(false);
  const prog = $('ocrProg');
  prog.classList.add('show'); prog.classList.remove('done','error'); prog.classList.add('stopped');
  $('progTitle').textContent = 'Đã dừng nhận dạng';
  $('pTitle').textContent = 'Đã dừng';
  $('stop').hidden = true;
  $('pDone').classList.add('show');
  $('pWarn').style.display = '';
  $('pWarn').textContent = warn;
  const kept = hook()?.getResults?.().size || 0;
  $('pSum').innerHTML = `Đã dừng <b>${kept} trang đã xử lý được</b>`;
  $('progClose').disabled = false;
  $('pAgain').hidden = false;
  $('pRegion').hidden = false;
  $('pForce').hidden = true;
}

$('pForce').onclick = async () => {
  try { await hook()?.forceIdle?.(undefined, true); } catch {}   // buộc dừng = cắt cứng (giải phóng engine)
  markStopped('Đã buộc dừng vì engine không phản hồi. Kết quả có thể thiếu; có thể chạy lại.');
  toast('Đã buộc dừng engine — có thể chạy lại');
};

/* Dừng: phản hồi ngay, engine không nhả trong 2,5 giây thì buộc dừng */
let stoppedFlag = false;
const engineStop = $('stop').onclick;
$('stop').onclick = ev => {
  if (engineStop) engineStop(ev);            // 1) bảo engine dừng (cancelled + terminate worker)
  stoppedFlag = true;
  stopRequested = true;                      // lượt này kết thúc là DỪNG (giữ kết quả), không phải “xong”
  stopHold = Date.now() + 4000;              // 2) UI "Đã dừng" hiện NGAY, giữ 4 giây
  markStopped('Đã dừng. Kết quả có thể thiếu vì dừng giữa lượt; các trang chưa chạy vẫn ở trạng thái ảnh quét.');
  toast('Đã dừng');
  /* 3) Engine đã tự dừng THẬT ngay: handler gốc ở trên đặt cancelled=true và terminate worker.
     KHÔNG gọi forceIdle() ở đây. forceIdle() terminate worker hiện tại; nếu người dùng bấm
     Nhận dạng lại ngay sau đó thì worker của LƯỢT MỚI bị giết giữa lúc recognize → lỗi
     “Cannot read properties of null (reading 'postMessage')” và “Không hoàn tất: undefined”.
     Lưới an toàn duy nhất: sau 1,5 giây, nếu engine VẪN busy (treo thật) và KHÔNG có lượt mới
     thì mới buộc dừng đúng một lần. */
  const mySeq = stopSeq;
  setTimeout(() => {
    if (stopSeq !== mySeq) return;              // đã có lượt mới → không đụng engine
    /* Chế độ Fusor: forceIdle() sẽ GIẢI PHÓNG model khỏi RAM (fusor=null, fusorReady=false)
       → lượt sau không chạy được nữa. Với Fusor chỉ dùng nút “Buộc dừng” khi thật sự treo. */
    if (hook()?.getMode?.() === 'fusor') return;
    if (!hook()?.isBusy()) return;              // engine đã nhả bình thường
    try { Promise.resolve(hook()?.forceIdle?.()).catch(() => {}); } catch {}
  }, 1500);
};

/* thẻ tiến độ */
$('progClose').onclick = () => {
  if (hook()?.isBusy()) return;
  $('ocrProg').classList.remove('show', 'done', 'stopped', 'error');
  $('progClose').disabled = false;
  /* ✕ = giải phóng engine/model khỏi RAM; lần chạy sau app tự nạp lại. */
  try { Promise.resolve(hook()?.releaseEngines?.()).catch(() => {}); } catch {}
  toast('Đã đóng thẻ và giải phóng engine khỏi RAM');
};

async function createPdf(bytes,overlays,outputKind='searchable'){
 const P=globalThis.PDFLib;if(!P||!globalThis.fontkit)throw Error('Không nạp được bộ tạo PDF.');const doc=await P.PDFDocument.load(bytes);doc.registerFontkit(globalThis.fontkit);const fontBytes=await (await fetch(asset('font.ttf'))).arrayBuffer();const font=await doc.embedFont(fontBytes,{subset:true});let count=0;const renderMode=outputKind==='visible'?P.TextRenderingMode.Fill:P.TextRenderingMode.Invisible;
 for(const [pageNo,overlay] of overlays){let page=doc.getPage(pageNo-1),key=page.node.newFontDictionary('OCR',font.ref);for(const m of overlay.matches){try{const [x,y]=m.p0,[xx,xy]=m.px,[yx,yy]=m.py;let wx=xx-x,wy=xy-y,hx=yx-x,hy=yy-y,width=Math.hypot(wx,wy),height=Math.hypot(hx,hy);if(width<=0||height<=0)continue;let size=height/font.heightAtSize(1),raw=font.widthOfTextAtSize(m.text+' ',size);if(!raw)continue;let sx=width/raw, ux=wx/width,uy=wy/width,vx=hx/height,vy=hy/height;page.pushOperators(P.pushGraphicsState(),P.beginText(),P.setTextRenderingMode(renderMode),P.setFontAndSize(key,size),P.setTextMatrix(ux*sx,uy*sx,vx,vy,x+hx*.15,y+hy*.15),P.showText(font.encodeText(m.text+' ')),P.endText(),P.popGraphicsState());count++}catch(e){throw Error('Không ghi được chữ vào PDF: '+e.message)}}}
 return {bytes:await doc.save(),count};
}

$('savePdf').onclick=async()=>{
 if(!doc||busy||!results.size)return;
 const identity=host.state().document?.id;busy=true;exporting=true;cancelled=false;controls();
 try{
  const overlays=new Map();for(const [n,result]of results){
   const page=await doc.getPage(n),tc=await page.getTextContent();if(tc.items.some(x=>x.str?.trim()))continue;
   const v=page.getViewport({scale:1});overlays.set(n,{matches:result.boxes.map(box=>{const[l,t,r,b]=box.rect;return{text:box.text,p0:v.convertToPdfPoint(l*v.width,b*v.height),px:v.convertToPdfPoint(r*v.width,b*v.height),py:v.convertToPdfPoint(l*v.width,t*v.height)};})});
  }
  const file=await host.file();if(identity!==host.state().document?.id)return;
  if(!overlays.size){setStatus('Không xuất: các trang có kết quả đều đã có lớp chữ gốc.');return;}
  const out=await createPdf(await file.arrayBuffer(),overlays,$('ocrOutput').value);if(identity!==host.state().document?.id||cancelled)return;download(new Blob([out.bytes],{type:'application/pdf'}),host.state().document.name.replace(/\.pdf$/i,'')+'-co-lop-chu.pdf');setStatus(`Đã xuất PDF: ${out.count} khung chữ. Hãy kiểm tra vị trí.`);
 }catch(error){setStatus('Không xuất được PDF: '+error.message);}finally{busy=false;exporting=false;controls();}
};
const exportPdf=$('savePdf').onclick;
$('savePdf').onclick=()=>{completion=Promise.resolve(exportPdf());return completion;};
async function reset(){
 if(busy){stop();await completion;}await persistence.catch(()=>{});await releaseEngines();
 closeRegion();closeOcr(true);closeTrPanel();clearTimeout(noticeTimer);setScanEffect(false);$('ocrProg').classList.remove('show','done','error','stopped');
 stopHold=0;stopRequested=false;runSeen=false;expectRun=false;wasBusy=false;regionRun=false;stoppedFlag=false;followLast=0;statePage=0;results=new Map();drafts.clear();$('text').value='';engineTotal=0;selectedFile=null;fileKind='';doc=null;regionHistory.clear();textCache.clear();scanPage=0;setDialogInert(false);refreshNotice(false);controls();
}
async function open(){
 const state=host.state();if(!state.document||!state.engine)return;
 selectedFile=state.document;fileKind=state.document.type;doc=state.engine.sourceDocument||null;engineTotal=state.engine.pages.length;current=state.page;
 const id=state.document.id;const rows=await store.all('ocr',id);if(host.state().document?.id!==id)return;
 results=new Map(rows.filter(row=>row.schema===1).map(row=>[row.page,row.result]));
 $('from').value='1';$('to').value=String(engineTotal);$('from').max=$('to').max=engineTotal;
 setNoticeFileKey({name:id,size:state.document.bytes});refreshHint();controls();
}
function pageChanged(){
 const state=host.state();if(!state.document)return;
 if(current!==state.page){closeRegion();current=state.page;$('text').value=drafts.get(current)??results.get(current)?.text??'';resetTextApply();}
 controls();refreshHint();
}
globalThis.KeepitOCR=Object.freeze({open,reset,paint,texts,pageChanged});
new MutationObserver(()=>{document.querySelectorAll('.ocrCanvasOverlay .layer').forEach(el=>el.classList.toggle('boxes',$('trPanel').classList.contains('open')&&$('showBoxes').checked));}).observe($('trPanel'),{attributes:true,attributeFilter:['class']});

document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 if(event.target.closest?.('.flow-select')?.querySelector('.flow-select-list:not([hidden])'))return;
 if(!$('regionEditor').hidden){$('cancelRegion').click();event.stopImmediatePropagation();return;}
 if(modal.classList.contains('show')){closeOcr();event.stopImmediatePropagation();return;}
 if(!document.getElementById('docsPagesSheet').hidden){globalThis.KeepitDocumentSheets.closePages();event.preventDefault();event.stopImmediatePropagation();return;}
 if($('ocrProg').classList.contains('show')){$('progClose').click();event.preventDefault();event.stopImmediatePropagation();return;}
 if($('trPanel').classList.contains('open')){closeTrPanel();event.preventDefault();event.stopImmediatePropagation();}
},true);
const modalObserver=new MutationObserver(()=>setDialogInert(modal.classList.contains('show')));modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
$('ocrVer').textContent='v'+globalThis.browser.runtime.getManifest().version;
bindDocumentControls({total:pageCount,clamp:clampPages});bindDocumentSheets({closeResults:closeTrPanel,closeSettings:closeOcr,closeMore,closeRegion:()=>$('cancelRegion').click(),refreshNotice:()=>refreshNotice()});
controls();if(host.state().engine)await open();

ocrText=bindOcrLocalization();

new ResizeObserver(()=>{if(host.state().engine)host.resize();}).observe(document.querySelector("#viewer .stageWrap"));

function syncOcrPanelTop(){const bar=document.getElementById('vBar'),viewer=document.getElementById('viewer');$('trPanel').style.setProperty('--ocr-body-top',Math.max(0,bar.getBoundingClientRect().bottom-viewer.getBoundingClientRect().top)+'px');}
new ResizeObserver(syncOcrPanelTop).observe(document.getElementById('vBar'));syncOcrPanelTop();
