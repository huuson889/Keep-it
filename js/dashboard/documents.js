/* Rendered inside the dashboard shell: the dashboard owns the scroll root and the top bar. */
const EMBEDDED=parent!==window;
if(EMBEDDED){document.documentElement.classList.add('dash-embedded','dash-embedded-library');addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin)return;const data=event.data||{};if(data.type==='KEEPIT_DOCUMENTS_VIEWPORT'&&typeof data.top==='number')document.documentElement.style.setProperty('--dash-vp-top',Math.round(data.top)+'px');});}
// Document library and v13 viewer. All file data is local; external tools are explicit user actions.
(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], api=globalThis.browser, Store=KeepitDocumentsStore;
const PREF_KEY='lhnDocumentsPrefs', FLOW_KEY='lhnDocumentsFlow', PAGER_KEY='lhnDocumentsPager', TOP_COMPACT_KEY='lhnDocumentsCompactTop', RAIL_KEY='lhnDocumentsRail', FLOWS=['continuous','single','facing','facingContinuous'], PAGER_MODES=['dim','show','auto','hide'], MB=1048576;
let settings={},lang='en',docs=[],filter='all',q='',sort='recent',activeEngine=null,viewCycle=0,importCycle=0,loading=false;
const panelPrefs={widths:{},follow:true,language:'vi'};
let lastFlow='continuous',pagerMode='dim',V={doc:null,page:1,mode:'orig',flow:'continuous',zoom:'fit',tools:new Set(),panel:null};
const t=(key,vars={})=>LHN_LANGUAGES.t(key.startsWith('docs_')?key:'docs_'+key,vars,lang), esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TYPE={pdf:{label:'PDF',color:'var(--pdf)'},docx:{label:'Word',color:'var(--docx)'},pptx:{label:'PowerPoint',color:'var(--pptx)'},image:{get label(){return t('image');},color:'var(--green)'}};
const unit=d=>t(d.image?'image':d.type==='pptx'?'slides':'pages'),U=()=>t(V.doc?.image?'image':V.doc?.type==='pptx'?'slide':'page');
const isText=()=>!!V.doc&&!V.doc.image&&!!activeEngine?.pages.some((_,i)=>sourceEntries(i+1).length);
const fmtSize=n=>n>=MB?(n/MB).toLocaleString(lang,{maximumFractionDigits:1})+' MB':Math.max(1,Math.round(n/1024))+' KB';
const date=n=>n?new Date(n).toLocaleDateString(lang):'';
const svg=(path,style='')=>`<svg class="i" viewBox="0 0 24 24" style="${style}" aria-hidden="true">${path}</svg>`;
const ICON={trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',page:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5M8 13h8M8 17h6"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',play:'<path d="m7 4 13 8-13 8Z"/>',moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>'};
const ic=k=>svg(ICON[k]||ICON.page);
function notifyParent(open){if(parent!==window)parent.postMessage({type:'KEEPIT_DOCUMENTS_VIEWER',open,sourceKey:V.doc?.sourceKey||''},location.origin);}
// Khi nhúng trong Dashboard, toast dùng chung toast của Dashboard (cùng kiểu/vị trí/Hoàn tác + Ctrl+Z).
let toastRunSeq=0;const toastRuns=new Map();
function toast(message,action){if(EMBEDDED&&parent!==window){const id=action?++toastRunSeq:0;if(action)toastRuns.set(id,action.run);try{parent.postMessage({type:'KEEPIT_DOCUMENTS_TOAST',message:String(message??''),action:action?{label:action.label,id}:null},location.origin);}catch{}return;}const el=$('#toast');el.textContent=message;el.classList.toggle('hasAction',!!action);if(action){const b=document.createElement('button');b.type='button';b.className='toastAction';b.textContent=action.label;b.onclick=()=>{el.classList.remove('show','hasAction');clearTimeout(toast.timer);void action.run();};el.append(b);try{if(parent!==window)parent.KeepitUndo?.register(action.run,action.label);}catch{}}el.style.top=$('#viewer').classList.contains('show')?($('#stage').getBoundingClientRect().top+12)+'px':'';el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show','hasAction'),action?6000:2200);}
function showModal(id,on){$(id).classList.toggle('show',on);}
function errorMessage(error){const value=String(error?.message||error||'');if(/cancel/i.test(value))return '';if(/ArchiveLimit/.test(value))return t('archiveLimit');if(/PageLimit/.test(value))return t('pageLimit');if(/DatabaseBlocked/.test(value))return t('dbBlocked');if(/quota|storage|database|indexeddb/i.test(value))return t('storageFailed');return t('badFile');}
function showError(error,name=''){const message=errorMessage(error);if(!message)return;$('#errModal').classList.remove('pdfAccessModal');$('#errAccessSteps').hidden=true;$('#errChoose').hidden=true;$('#errOk').classList.remove('btnP');$('#errOk').classList.add('btnG');$('#errOk span').textContent=t('understood');$('#errHint').hidden=false;$('#errTitle').textContent=t('error');$('#errMsg').textContent=name?name+' — '+message:message;$('#errHint').textContent=t('fileLimit');showModal('#errWrap',true);}
function showPdfFallback(fileAccess=false){const modal=$('#errModal');modal.classList.toggle('pdfAccessModal',fileAccess);$('#errTitle').textContent=t(fileAccess?'pdfFileAccessTitle':'pdfOpenFailedTitle');$('#errMsg').textContent=t(fileAccess?'pdfFileAccessMessage':'pdfOpenFailedMessage');$('#errAccessSteps').hidden=!fileAccess;$('#errHint').hidden=true;$('#errHint').textContent='';$('#errChoose').hidden=false;$('#errChoose').classList.toggle('btnG',fileAccess);$('#errChoose').classList.toggle('btnP',!fileAccess);$('#errOk').classList.toggle('btnP',fileAccess);$('#errOk').classList.toggle('btnG',!fileAccess);$('#errOk span').textContent=t(fileAccess?'pdfAccessAction':'understood');showModal('#errWrap',true);}
let pdfAccessWatchId=0,pdfAccessWatchTimer=0,pdfAccessOpening=false,pdfAccessCheckPending=false;
async function checkPdfAccessPermission(watchId){if(watchId!==pdfAccessWatchId||pdfAccessCheckPending||!$('#errModal').classList.contains('pdfAccessModal'))return;pdfAccessCheckPending=true;let allowed=false;try{if(typeof api.extension?.isAllowedFileSchemeAccess==='function')allowed=await api.extension.isAllowedFileSchemeAccess();}catch{}pdfAccessCheckPending=false;if(allowed){clearTimeout(pdfAccessWatchTimer);pdfAccessWatchId++;pdfAccessOpening=false;showModal('#errWrap',false);return;}if(watchId===pdfAccessWatchId){clearTimeout(pdfAccessWatchTimer);pdfAccessWatchTimer=setTimeout(()=>void checkPdfAccessPermission(watchId),1000);}}
function watchPdfAccessPermission(){clearTimeout(pdfAccessWatchTimer);const watchId=++pdfAccessWatchId;void checkPdfAccessPermission(watchId);}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&pdfAccessWatchId)void checkPdfAccessPermission(pdfAccessWatchId);});
$('#errOk').onclick=async()=>{if(!$('#errModal').classList.contains('pdfAccessModal')){showModal('#errWrap',false);return;}if(pdfAccessOpening)return;pdfAccessOpening=true;try{await api.tabs.create({url:`chrome://extensions/?id=${encodeURIComponent(api.runtime.id)}`});watchPdfAccessPermission();}catch{pdfAccessOpening=false;toast(t('pdfAccessOpenFailed'));}};$('#errChoose').onclick=()=>{showModal('#errWrap',false);$('#file').click();};
async function savePanelPrefs(){try{await api.storage.local.set({[PREF_KEY]:{...panelPrefs,flow:lastFlow}});}catch{toast(t('storageFailed'));}}
function localize(){document.documentElement.lang=lang;document.title='Keepit — '+t('title');for(const el of $$('[data-doc-label]'))el.textContent=t(el.dataset.docLabel);for(const [attr,key]of[['title','docTitle'],['aria-label','docAria'],['placeholder','docPlaceholder']]){const selector='[data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+']';for(const el of $$(selector))el.setAttribute(attr,t(el.dataset[key]));}$('#q').placeholder=t('search');$('#sort option[value="recent"]').textContent=t('recent');$('#sort option[value="name"]').textContent=t('sortName');$('#sort option[value="progress"]').textContent=t('progress');$('#vBack').setAttribute('aria-label',t('back')+' Keepit');updateDocLabels();updateTranslationControls();updateFullscreenButton();}
async function syncSettings(){const data=await api.storage.local.get('lhnSettings');settings={...LHN_CONFIG.DEFAULT_SETTINGS,...(data.lhnSettings||{})};lang=LHN_LANGUAGES.languageFor(settings);const dark=settings.sidebarTheme==='dark'||(!['light','dark'].includes(settings.sidebarTheme)&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',dark);for(const sel of['#vThemeIco','#libraryTheme svg'])$(sel).innerHTML=ICON[dark?'sun':'moon'];localize();if(V.doc){applyTools();paintPanels();if(settings.translateEnabled===false){V.tools.delete('translate');if(V.panel==='translation')V.panel=null;paintPanels();$('#viewer').classList.remove('translate');}}renderLibrary();}
async function toggleTheme(){const data=await api.storage.local.get('lhnSettings');await api.storage.local.set({lhnSettings:{...(data.lhnSettings||{}),sidebarTheme:document.documentElement.classList.contains('dark')?'light':'dark'}});await syncSettings();}
$('#vTheme').onclick=$('#libraryTheme').onclick=()=>void toggleTheme();
function typeChip(d){return `<span class="type"><i style="background:${TYPE[d.type].color}"></i>${esc(TYPE[d.type].label)}</span>`;}
function thumb(d){return d.thumbnail?`<img src="${esc(d.thumbnail)}" alt="" loading="lazy">`:`<span class="fileFallback">${esc(TYPE[d.type].label)}</span>`;}
function renderLibrary(){
 const current=[...docs].filter(d=>!d.image&&!d.scan&&d.at<d.pages).sort((a,b)=>b.opened-a.opened)[0];
 $('#continueCard').innerHTML=current?`<div class="cBody"><div class="cEyebrow">${ic('play')}${t('continue')}</div><h2>${esc(current.title)}</h2><div class="desc">${t('atPage',{page:current.at,total:current.pages})}</div><div class="pills"><span class="pill">${esc(TYPE[current.type].label)}</span><span class="pill">${t('notesCount',{count:current.notes})}</span></div><button class="btnP" data-open="${current.id}">${ic('play')}${t('continue')}</button> <button class="btnL" data-open="${current.id}" data-mode="read">${t('readMode')}</button></div><div class="cThumb">${thumb(current)}</div>`:`<div class="cBody"><div class="cEyebrow">${t('library')}</div><h2>${t('noContinue')}</h2><div class="desc">${t('noContinueSub')}</div><button class="btnP fileSelectButton" data-choose>${t('choose')}</button></div>`;
 $('#filters').innerHTML=[['all',t('all')],['pdf','PDF'],['docx','Word'],['pptx','PowerPoint'],['image',t('images')]].map(([key,label])=>`<button type="button" data-f="${key}" class="${filter===key?'on':''}">${esc(label)}<i>${key==='all'?docs.length:docs.filter(d=>d.type===key).length}</i></button>`).join('');
 $('#countPill').textContent=t('filesCount',{count:docs.length});let list=docs.filter(d=>(filter==='all'||d.type===filter)&&d.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()));list.sort(sort==='name'?(a,b)=>a.name.localeCompare(b.name):sort==='progress'?(a,b)=>b.at/b.pages-a.at/a.pages:(a,b)=>b.opened-a.opened);
 $('#grid').innerHTML=list.length?list.map(d=>`<article class="card" data-open="${d.id}" tabindex="0" role="button" aria-label="${esc(t('open')+' '+d.name)}"><div class="thumb ${d.type}">${typeChip(d)}<div class="pg">${thumb(d)}</div></div><div class="cardBody"><h4>${esc(d.title)}</h4><div class="meta">${ic('page')}${d.image?`${d.format} · ${d.width} × ${d.height} px`:`${d.pages} ${unit(d)}`} · ${fmtSize(d.bytes)}</div>${d.image||d.scan?`<div class="imageMeta">${t(d.image?'originalImage':'noText')}</div>`:`<div class="prog"><div class="lbl"><span>${t('progress')}</span><strong>${d.at} / ${d.pages}</strong></div><div class="track"><div class="fill" style="width:${Math.round(d.at/d.pages*100)}%"></div></div></div>`}<div class="foot"><span class="stats">${date(d.opened)} · ${t('notesCount',{count:d.notes||0})}</span><button class="cardDel" type="button" data-del="${d.id}" title="${t('trashMove')}" aria-label="${t('trashMove')}">${ic('trash')}</button><button class="go" data-open="${d.id}">${t(d.at>1?'resume':'open')} ${ic('arrow')}</button></div></div></article>`).join(''):`<div class="empty">${t(docs.length?'noMatch':'empty')}</div>`;
 const stats=[['title',docs.length],['readPages',docs.reduce((n,d)=>n+(d.image||d.scan?0:d.at),0)],['highlights',docs.reduce((n,d)=>n+(d.hl||0),0)],['notes',docs.reduce((n,d)=>n+(d.notes||0),0)]];$('#stats').innerHTML=stats.map(([key,n])=>`<div><small>${t(key)}</small><b>${n}</b></div>`).join('');
}
async function refreshLibrary(){const result=await Store.all('meta');try{const records=await LHN_MESSAGING.sendMessage({type:'GET_ALL'});if(Array.isArray(records))for(const d of result){if(!d.nativeNotesMigrated)continue;const current=records.filter(n=>n.documentAnchor?.documentId===d.id),hl=current.filter(n=>!n.dictionaryOnly&&!n.documentAnchor?.fileLevel).length,notes=current.filter(n=>String(n.note||'').trim()).length;if(d.hl!==hl||d.notes!==notes){d.hl=hl;d.notes=notes;void Store.patch(d.id,{hl,notes});}}}catch{}docs=result.filter(d=>!d.deletedAt).sort((a,b)=>b.opened-a.opened);renderLibrary();}
$('#filters').onclick=e=>{const b=e.target.closest('[data-f]');if(b){filter=b.dataset.f;renderLibrary();}};$('#q').oninput=e=>{q=e.target.value;renderLibrary();};$('#sort').onchange=e=>{sort=e.target.value;renderLibrary();};
document.addEventListener('click',e=>{const choose=e.target.closest('[data-choose]');if(choose){$('#file').click();return;}const del=e.target.closest('[data-del]');if(del){e.preventDefault();e.stopPropagation();void moveToTrash(del.dataset.del);return;}const open=e.target.closest('[data-open]');if(open&&!open.closest('#viewer'))void openViewer(open.dataset.open,open.dataset.mode);});
$('#grid').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('.card')){e.preventDefault();void openViewer(e.target.dataset.open);}});
async function moveToTrash(id){const doc=docs.find(d=>d.id===id);if(!doc)return;if(!confirm(`${t('trashMove')}: ${doc.title}?`))return;try{await Store.softDelete(id);toast(t('trashMoved'),{label:t('trashUndo'),run:async()=>{try{await Store.restore(id);toast(t('trashRestored'));}catch{toast(t('storageFailed'));}void refreshLibrary();}});void refreshLibrary();}catch{toast(t('storageFailed'));}}
addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin)return;const data=event.data||{};if(data.type==='KEEPIT_DOCUMENTS_TOAST_RUN'&&data.id){const run=toastRuns.get(data.id);toastRuns.delete(data.id);if(run)void run();return;}if(data.type==='KEEPIT_DOCUMENTS_REFRESH')void refreshLibrary();if(data.type==='KEEPIT_DOCUMENTS_REVEAL'){revealLibrary();return;}});
/* Ctrl+Z inside the documents frame undoes the same action the toast offers. */
addEventListener('keydown',event=>{if(!(event.ctrlKey||event.metaKey)||event.altKey||event.shiftKey||String(event.key).toLowerCase()!=='z')return;if(event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;try{if(parent!==window&&parent.KeepitUndo?.run())event.preventDefault();}catch{}});
let passwordResolve=null,passwordForViewer=false;
function askPassword(reason,name,forViewer=false){passwordForViewer=forViewer;$('#pwName').textContent=name;$('#pwIn').value='';$('#pwErr').style.visibility=reason===2?'visible':'hidden';showModal('#pwWrap',true);requestAnimationFrame(()=>$('#pwIn').focus());return new Promise(resolve=>{passwordResolve=resolve;});}
function finishPassword(value){const resolve=passwordResolve;passwordResolve=null;showModal('#pwWrap',false);resolve?.(value);}
$('#pwOk').onclick=()=>{if(!$('#pwIn').value){$('#pwErr').style.visibility='visible';return;}finishPassword($('#pwIn').value);};$('#pwCancel').onclick=()=>{if(passwordForViewer)void closeViewer();else ++importCycle;finishPassword(null);};$('#pwIn').onkeydown=e=>{if(e.key==='Enter')$('#pwOk').click();if(e.key==='Escape')$('#pwCancel').click();};
const extOf=name=>String(name).split('.').pop().toLowerCase();
function kindOf(name){const ext=extOf(name);return ['jpg','jpeg','png','webp'].includes(ext)?'image':['pdf','docx','pptx'].includes(ext)?ext:null;}
// v3.5.479: có tệp tới tay khung mà mất đuôi tên (chỉ còn MIME) → vẫn nhận đúng loại
function kindByMime(mime){const m=String(mime||'').toLowerCase();if(m==='application/pdf')return 'pdf';if(/wordprocessingml/.test(m))return 'docx';if(/presentationml/.test(m))return 'pptx';if(m.startsWith('image/'))return 'image';return null;}
function pdfSourceUrl(value){try{const u=new URL(value);return ['http:','https:','file:'].includes(u.protocol)&&/\.pdf$/i.test(decodeURIComponent(u.pathname))?(u.hash='',u.href):'';}catch{return '';}}
function pdfFileName(url){try{const part=decodeURIComponent(new URL(url).pathname.split('/').pop()||'');return part&&/\.pdf$/i.test(part)?part:'document.pdf';}catch{return 'document.pdf';}}
async function boundedPdfBlob(response){
 const length=Number(response.headers.get('content-length'));if(Number.isFinite(length)&&length>50*MB)throw new Error('PDF fileLimit');
 const reader=response.body?.getReader();if(!reader){const blob=await response.blob();if(blob.size>50*MB)throw new Error('PDF fileLimit');return blob;}
 const chunks=[];let total=0;
 try{while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>50*MB){await reader.cancel();throw new Error('PDF fileLimit');}chunks.push(value);}return new Blob(chunks,{type:'application/pdf'});}finally{reader.releaseLock();}
}
async function openPdfFromUrl(url,fileAccessDenied=false){
 const source=pdfSourceUrl(url);if(!source){showPdfFallback(false);return;}
 const local=source.startsWith('file:');
 if(local&&fileAccessDenied){showPdfFallback(true);return;}
 if(local&&typeof api.extension?.isAllowedFileSchemeAccess==='function'){
  try{if(!(await api.extension.isAllowedFileSchemeAccess())){showPdfFallback(true);return;}}catch{}
 }
 try{
  const response=await fetch(source,{credentials:'include'});if(!response.ok)throw new Error(`PDF HTTP ${response.status}`);
  const blob=await boundedPdfBlob(response);if(!blob.size)throw new Error('PDF fileLimit');
  await importFiles([new File([blob],pdfFileName(source),{type:'application/pdf',lastModified:Date.now()})]);
 }catch(error){console.warn('Could not import PDF from the active tab',error);showPdfFallback(local);}
}
/* v3.5.481: khi nhúng, khung là iframe ẩn → popup "Đang mở tệp" do Dashboard vẽ,
   khung chỉ báo từng bước. */
function importNote(payload){if(!EMBEDDED||parent===window)return;try{parent.postMessage({type:'KEEPIT_DOCUMENTS_IMPORT_STEP',...payload},location.origin);}catch{}}
async function importFiles(files){
 const outcome={added:0,skipped:0,error:''};
 if(loading){outcome.error='documentsBusy';return outcome;}
 loading=true;ttsStop();const cycle=++importCycle;let first=null,firstEngine=null;
 try{
  for(const file of [...files]){
   if(cycle!==importCycle)break;
   const type=kindOf(file.name)||kindByMime(file.type);if(!type){outcome.error=outcome.error||'unsupported';showError(new Error('unsupported'),file.name);$('#errMsg').textContent=t('unsupported');continue;}
   if(!file.size||file.size>(type==='image'?30:50)*MB){outcome.error=outcome.error||'fileLimit';showError(new Error('fileLimit'),file.name);$('#errMsg').textContent=t('fileLimit');continue;}
   let engine=null;try{
    importNote({phase:'start',name:file.name,bytes:file.size,kind:type});
    $('#oName').textContent=file.name;$('#oIco').textContent=TYPE[type].label;$('#oIco').style.background=TYPE[type].color;$('#oMeta').textContent=fmtSize(file.size);$('#oSteps').innerHTML=`<li class="run"><i></i>${t('opening')}</li>`;$('#oFill').style.width='0%';showModal('#openWrap',true);
    const id=await Store.fingerprint(file);check();const old=await Store.get('meta',id);if(old){first||=id;outcome.skipped++;continue;}
    engine=await KeepitDocumentRenderers.prepare(file,type,{password:reason=>{importNote({phase:'password'});return askPassword(reason,file.name);},check,progress:n=>{$('#oFill').style.width=Math.round(n*95)+'%';importNote({phase:'progress',percent:Math.round(n*95)});}});check();
    let thumbnail='';try{if(!engine.passwordProtected)thumbnail=await engine.thumbnail();}catch{}
    const pages=engine.pages,meta={id,name:file.name,title:file.name.replace(/\.[^.]+$/,''),type,image:type==='image',format:extOf(file.name).toUpperCase(),bytes:file.size,pages:pages.length,at:1,opened:Date.now(),imported:Date.now(),width:pages[0].width,height:pages[0].height,scan:type!=='image'&&!pages.some(p=>p.texts.length),hl:0,notes:0,thumbnail};
    importNote({phase:'save'});$('#oSteps').innerHTML=`<li class="done"><i>✓</i>${t('saving')}</li>`;check();await Store.importFile(meta,file);outcome.added++;check();if(!first){first=id;firstEngine=engine;engine=null;}$('#oFill').style.width='100%';
   }catch(error){if(cycle===importCycle){const raw=String(error?.message||error||'');if(!/cancel/i.test(raw))outcome.error=outcome.error||raw||'documentsBadFile';showError(error,file.name);}}finally{engine?.dispose();showModal('#openWrap',false);}
  }
  if(first&&cycle===importCycle){await refreshLibrary();filter='all';renderLibrary();const prepared=firstEngine;firstEngine=null;await openViewer(first,'orig',prepared);}
 }finally{firstEngine?.dispose();loading=false;showModal('#openWrap',false);try{await refreshLibrary();}catch{}}
 return outcome;
 function check(){if(cycle!==importCycle)throw new Error('cancelled');}
}
$('#oCancel').onclick=()=>{++importCycle;finishPassword(null);showModal('#openWrap',false);};$('#file').onchange=e=>{const files=[...e.target.files];e.target.value='';void importFiles(files);};
let dragN=0;addEventListener('dragenter',e=>{if(![...(e.dataTransfer?.types||[])].includes('Files'))return;e.preventDefault();dragN++;$('#dropAll').classList.add('show');});addEventListener('dragover',e=>e.preventDefault());addEventListener('dragleave',()=>{if(--dragN<=0){dragN=0;$('#dropAll').classList.remove('show');}});addEventListener('drop',e=>{e.preventDefault();dragN=0;$('#dropAll').classList.remove('show');if(e.dataTransfer?.files?.length)void importFiles(e.dataTransfer.files);});
let pageObserver=null,thumbnailObserver=null,thumbnailJobs=new Map(),drawn=new Map(),noteList=[],savePositionTimer=0;
/* v3.5.483: mở tệp quá sớm (lúc boot() còn đang chạy) làm bộ công cụ chọn chữ trong khung
   chưa được gắn → bôi đen không có thanh Tô sáng/Dịch/AI, phải reload mới được.
   Mọi lần mở tệp giờ đợi khung khởi tạo xong. */
let bootResolve; const bootReady=new Promise(resolve=>{bootResolve=resolve;});
async function openViewer(id,mode='orig',prepared=null){
 const cycle=++viewCycle;$('#viewer').dataset.nativeReady='false';LHN_READER_API.reset();LHN_CONTENT_TOOLS.close();ttsStop();hideSel();endPanelResize();setMore(false,false);resetPagerFade();
 try{
  await bootReady;if(cycle!==viewCycle)return;   // chờ khung khởi tạo xong mới dựng bộ xem
  const meta=await Store.get('meta',id),file=await Store.get('files',id);if(!meta||!file?.blob)throw new Error('documentsBadFile');if(cycle!==viewCycle)return;await ensureDocumentKey(meta);
  activeEngine?.dispose();activeEngine=null;V={doc:meta,page:Math.max(1,Math.min(meta.pages,meta.at||1)),mode:meta.image?'orig':mode,flow:lastFlow,zoom:'fit',tools:new Set(),panel:null};
  $('#viewer').dataset.nativeReady='false';$('#viewer').setAttribute('aria-busy','true');$('#viewer').classList.add('show');
  try{lockSelectionUntilQuiet(cycle);}catch{ /* không được làm hỏng việc mở tệp */ }$('#viewer').classList.remove('notesOpen','aiOpen','transOpen','translate','ttsOn');$('#viewer').classList.toggle('imageMode',!!meta.image);notifyParent(true);$('#stage').innerHTML=`<div class="docsViewerBusy">${t('loading')}</div>`;$('#vName').textContent=meta.name;$('#vName').title=meta.name;$('#vType').innerHTML=`<i style="background:${TYPE[meta.type].color}"></i>${esc(TYPE[meta.type].label)}`;
  const engine=prepared||await KeepitDocumentRenderers.prepare(file.blob,meta.type,{password:reason=>askPassword(reason,meta.name,true),check:()=>{if(cycle!==viewCycle)throw new Error('cancelled');}});if(cycle!==viewCycle){engine.dispose();return;}activeEngine=engine;V.doc.pages=engine.pages.length;V.page=Math.min(V.page,engine.pages.length);V.flow=V.doc.pages===1?'single':lastFlow;if(cycle!==viewCycle)return;
  for(const el of[$('.pageNav'),$('#flowGroup')])el.style.display=meta.image?'none':'';applyRail();document.body.style.overflow='hidden';$('#legend').classList.remove('on');$('#toast').classList.remove('show');nativeCards.clear();translationView.doc=null;applyTools();renderViewer();layoutPanelWidths();await ensurePage(V.page);await migrateDocumentNotes();await refreshNativeSource();$('#viewer').dataset.nativeReady='true';$('#viewer').setAttribute('aria-busy','false');if(EMBEDDED){try{parent.postMessage({type:'KEEPIT_DOCUMENTS_VIEWER_READY'},location.origin);}catch{}}$('#stage').setAttribute('tabindex','-1');$('#stage').setAttribute('aria-label',meta.name);$('#stage').focus({preventScroll:true});await Store.patch(id,{opened:Date.now()});
 }catch(error){prepared?.dispose();if(cycle===viewCycle){$('#viewer').classList.remove('show');notifyParent(false);showError(error);}}
}
/* v3.5.491: khoá chọn chữ cho tới khi #stage không còn đổi DOM trong 500 ms (tối đa 8 giây).
   Lý do: khi mở tệp, khung còn gỡ/dựng lại #pageStack và lớp chữ PDF → vùng chọn tạo trong lúc đó
   bị xoá ngay nên thanh Tô sáng/Dịch/AI không bao giờ hiện (lỗi "mở tệp đầu tiên"). */
function lockSelectionUntilQuiet(cycle){
 const viewer=$('#viewer'),stage=$('#stage');
 if(!viewer||!stage)return;
 viewer.dataset.selectLocked='true';
 const start=Date.now();let last=Date.now(),done=false;
 const mo=new MutationObserver(()=>{last=Date.now();});
 mo.observe(stage,{childList:true,subtree:true});
 const release=()=>{if(done)return;done=true;mo.disconnect();viewer.dataset.selectLocked='false';};
 const tick=()=>{
  if(done)return;
  if(cycle!==viewCycle){done=true;mo.disconnect();viewer.dataset.selectLocked='false';return;} /* v3.5.494: trước đây thoát mà không mở khoá → user-select:none kẹt vĩnh viễn */
  if(Date.now()-last>500||Date.now()-start>8000)release();else setTimeout(tick,120);
 };
 setTimeout(tick,120);
}
function applyTools(){
 if(!V.doc)return;$('#viewer').classList.toggle('wcOn',V.tools.has('wc'));const text=isText(),anyText=!V.doc.image&&activeEngine?.pages.some((_,i)=>sourceEntries(i+1).length);$('#vMode').style.display=anyText?'':'none';if(!anyText)V.mode='orig';
 for(const b of $$('#viewer [data-t]')){const k=b.dataset.t,off=(k==='notes'&&settings.notesEnabled===false)||(k==='translate'&&settings.translateEnabled===false)||(k==='ai'&&settings.askAIEnabled===false);b.disabled=off||(!text&&!['notes'].includes(k));b.style.display=V.doc.image&&k!=='notes'?'none':'';b.style.opacity=b.disabled?'.4':'';b.title=off?t('masterOff'):!text&&k!=='notes'?t('noText'):t({notes:'notes',translate:'translate',tts:'readAloud',wc:'wordClass',ai:'askAI'}[k]);b.classList.toggle('on',k==='notes'?nativeNotesOpen:k==='tts'?LHN_READER_API.state.reading:V.tools.has(k));}

 const message=V.doc.image?t('imageHint'):!text?t('scan'):['docx','pptx'].includes(V.doc.type)?t('officeHint'):'';$('#vBanner').textContent=message;$('#vBanner').classList.toggle('show',!!message);

}
function sourceTexts(page=V.page){return activeEngine?.pages[page-1]?.texts||[];}
function sourceEntries(page=V.page){return sourceTexts(page).map((text,index)=>({text,index,isTable:activeEngine?.pages[page-1]?.paragraphs?.[index]?.isTable===true})).filter(({text})=>Array.from(String(text??'').trim()).length>1);}
const isFacing=()=>V.mode==='orig'&&['facing','facingContinuous'].includes(V.flow)&&!V.doc?.image;
const pairStart=page=>Math.floor((page-1)/2)*2+1;
function navigateStep(direction){const page=isFacing()?pairStart(V.page)+(direction*2):V.page+direction;if(page>=1&&page<=V.doc.pages)void setPage(page);}
function updatePaging(keepRail=false){if(!V.doc)return;$('#pLbl').textContent=U();$('#pTotal').textContent='/ '+V.doc.pages;$('#pNum').max=V.doc.pages;if(document.activeElement!==$('#pNum'))$('#pNum').value=V.page;$('#pPrev').disabled=(isFacing()?pairStart(V.page):V.page)<=1;$('#pNext').disabled=isFacing()?pairStart(V.page)+2>V.doc.pages:V.page>=V.doc.pages;for(const b of $$('#rail [data-p]'))b.classList.toggle('on',+b.dataset.p===V.page);if(!keepRail)$('#rail .on')?.scrollIntoView({block:'nearest'});wakePager();}
let pdfRasterTimer = null;
function schedulePdfRaster() {
  clearTimeout(pdfRasterTimer);
  if (V.doc?.type !== 'pdf' || V.mode !== 'orig' || !activeEngine?.refreshRaster) return;
  const engine = activeEngine, cycle = viewCycle;
  pdfRasterTimer = setTimeout(() => {
    if (engine !== activeEngine || cycle !== viewCycle) return;
    const stage = $('#stage').getBoundingClientRect();
    for (const source of $$('#pageStack .docsSource')) {
      const rect = source.getBoundingClientRect();
      if (rect.bottom < stage.top - 700 || rect.top > stage.bottom + 700 || !drawn.has(source)) continue;
      Promise.resolve(drawn.get(source)).then(() => {
        if (engine === activeEngine && cycle === viewCycle && source.isConnected) return engine.refreshRaster(source, +source.dataset.page).then(()=>{if(engine===activeEngine&&cycle===viewCycle&&source.isConnected)return engine.refreshDetail(source,+source.dataset.page,$('#stage'));});
      }).catch(() => {});
    }
  }, 250);
}
function sizePages(preserve=true){if(!activeEngine||!V.doc)return;const st=$('#stage'),stack=$('#pageStack');if(!stack)return;const frame=stack.querySelector(`[data-page="${V.page}"]`),oldHeight=frame?.offsetHeight||1,relative=frame?(st.scrollTop-frame.offsetTop)/oldHeight:0;const available=Math.max(1,st.clientWidth-parseFloat(getComputedStyle(st).paddingLeft)-parseFloat(getComputedStyle(st).paddingRight));const first=activeEngine.pages[V.page-1];let width=V.mode==='read'?Math.min(700,available):V.zoom==='fit'?Math.min(V.doc.type==='pptx'?960:760,isFacing()?Math.max(1,(available-16)/2):available):first.width*(+V.zoom/100);if(V.doc.image&&V.zoom==='fitImage'){const h=Math.max(40,st.clientHeight-parseFloat(getComputedStyle(st).paddingTop)-parseFloat(getComputedStyle(st).paddingBottom)-30);width=Math.max(1,Math.min(first.width,available,h*first.width/first.height));}stack.style.setProperty('--pageW',width+'px');stack.style.setProperty('--displayW',(isFacing()?width*2+16:width)+'px');for(const f of stack.children){const spec=activeEngine.pages[+f.dataset.page-1],surface=f.querySelector('.docSurface'),source=f.querySelector('.docsSource');if(surface)surface.style.aspectRatio=spec.width+'/'+spec.height;if(source){source.style.width=spec.width+'px';source.style.height=spec.height+'px';source.style.setProperty('--source-scale',width/spec.width);}}if(preserve&&frame)st.scrollTop=frame.offsetTop+relative*frame.offsetHeight;schedulePdfRaster();}
function scrollToPage(page){const frame=$(`#pageStack>[data-page="${page}"]`);if(frame)$('#stage').scrollTop=Math.max(0,frame.offsetTop-parseFloat(getComputedStyle($('#stage')).paddingTop));}
async function ensurePage(page){const target=$(`#pageStack>[data-page="${page}"] .docsSource`);if(!target||!activeEngine)return;if(drawn.has(target))return drawn.get(target);const engine=activeEngine,cycle=viewCycle;const work=engine.render(target,page).then(()=>{if(cycle!==viewCycle||!target.isConnected)return;restoreMarks(target,page);const sourceCanvas=target.querySelector('canvas'),thumb=$(`#rail [data-p="${page}"] .mini-pg`);if(sourceCanvas&&thumb&&!thumb.querySelector('img')){try{const c=document.createElement('canvas');c.width=100;c.height=Math.max(1,Math.round(100*sourceCanvas.height/sourceCanvas.width));c.getContext('2d').drawImage(sourceCanvas,0,0,c.width,c.height);const img=document.createElement('img');img.src=c.toDataURL('image/png');img.alt='';thumb.replaceChildren(img);}catch{}}requestTranslationSync();queueMicrotask(()=>{if(V.tools.has('wc'))scheduleWordClass();});fillTextLayerGaps();schedulePdfRaster();}).catch(error=>{if(cycle===viewCycle&&target.isConnected&&!/cancel/i.test(error?.message||'')){const message=document.createElement('div');message.className='surfaceError';message.textContent=t('badFile');target.replaceChildren(message);}});drawn.set(target,work);return work;}
function ensureThumbnail(page){
 const engine=activeEngine,cycle=viewCycle,docId=V.doc?.id,key=`${docId}:${cycle}:${page}`,slot=$(`#rail [data-p="${page}"] .mini-pg`);
 if(!engine||!slot||slot.querySelector('img')||typeof engine.thumbnail!=='function')return Promise.resolve();
 if(thumbnailJobs.has(key))return thumbnailJobs.get(key);
 const job=Promise.resolve().then(()=>engine.thumbnail(page)).then(data=>{
  if(!data||cycle!==viewCycle||engine!==activeEngine)return;
  const target=$(`#rail [data-p="${page}"] .mini-pg`);if(!target||target.querySelector('img'))return;
  const img=document.createElement('img');img.src=data;img.alt='';target.replaceChildren(img);
 }).catch(()=>{}).finally(()=>{if(thumbnailJobs.get(key)===job)thumbnailJobs.delete(key);});
 thumbnailJobs.set(key,job);return job;
}
function renderViewer(){
 if(!V.doc||!activeEngine)return;pdfSpeakerHoverKey='';pageObserver?.disconnect();thumbnailObserver?.disconnect();drawn=new Map();const d=V.doc;applyTools();$('#viewer').classList.toggle('original',V.mode==='orig');$('#viewer').classList.toggle('translate',V.mode==='read'&&V.tools.has('translate'));$('#zoomWrap').style.display=V.mode==='orig'?'':'none';for(const b of $$('#vMode button'))b.classList.toggle('on',b.dataset.m===V.mode);
 $('#rail').classList.toggle('slides',d.type==='pptx');$('#rail').innerHTML=d.image?'':Array.from({length:d.pages},(_,i)=>`<button type="button" data-p="${i+1}" aria-label="${U()} ${i+1}"><span class="mini-pg">${i===0&&d.thumbnail?`<img src="${esc(d.thumbnail)}" alt="">`:`<span class="miniLabel">${i+1}</span>`}</span>${i+1}</button>`).join('');
 const pages=(V.mode==='read'||V.flow==='continuous'||V.flow==='facingContinuous')&&!d.image?Array.from({length:d.pages},(_,i)=>i+1):isFacing()?[pairStart(V.page),pairStart(V.page)+1].filter(n=>n<=d.pages):[V.page];$('#stage').innerHTML=`<div class="pageStack ${isFacing()?'facing':''}" id="pageStack">${pages.map(page=>{const spec=activeEngine.pages[page-1],entries=sourceEntries(page),cap=`<div class="pageCap"><b>${d.image?`${esc(d.format)} · ${spec.width} × ${spec.height} px`:`${U()} ${page} / ${d.pages}`}</b><span class="flowtip">${d.image?t('originalImage'):pages.length>1&&(V.mode==='read'||['continuous','facingContinuous'].includes(V.flow))?'↓ '+t('continuousShort'):''}</span></div>`;if(V.mode==='read')return `<section class="pageFrame readFrame" data-page="${page}">${cap}<article class="reflow">${entries.length?entries.map(({text,index,isTable})=>`<p class="para" data-page="${page}" data-i="${index}" data-paragraph-index="${index}" data-paragraph-start="true"${isTable?' data-pdf-table="true"':''}><span class="en">${esc(text)}</span></p>`).join(''):`<p>${t('noText')}</p>`}</article></section>`;return `<section class="pageFrame ${d.type==='pptx'?'slideFrame':''}" data-page="${page}">${cap}<div class="docSurface"><div class="docsSource" data-page="${page}"></div></div>${spec.notes?`<details class="speakerNote"><summary>${t('speakerNotes')}</summary><div>${esc(spec.notes)}</div></details>`:''}</section>`;}).join('')}</div>`;
 applyPagerMode();fitToolbar();sizePages(false);scrollToPage(V.page);updateZoomControls();updatePaging();if(!d.image){if(typeof IntersectionObserver==='function'){thumbnailObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){thumbnailObserver.unobserve(entry.target);void ensureThumbnail(+entry.target.dataset.p);}},{root:$('#rail'),rootMargin:'120px 0px'});for(const button of $$('#rail [data-p]'))thumbnailObserver.observe(button);}else for(const button of $$('#rail [data-p]').slice(0,4))void ensureThumbnail(+button.dataset.p);}if(V.mode==='orig'){pageObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)void ensurePage(+e.target.dataset.page);},{root:$('#stage'),rootMargin:'700px 0px'});for(const frame of $$('#pageStack>.pageFrame'))pageObserver.observe(frame);void ensurePage(V.page);}else for(const frame of $$('#pageStack>.pageFrame'))restoreMarks(frame,+frame.dataset.page);
 if(V.panel==='translation')renderTranslation();if(V.tools.has('translate'))LHN_READER_API.setTranslation(true);scheduleWordClass();queueMicrotask(()=>{LHN_READER_API.refreshSource();void LHN_CONTENT_TOOLS.restore();});
}
function savePosition(){if(!V.doc)return;const id=V.doc.id,at=V.page;V.doc.at=at;clearTimeout(savePositionTimer);savePositionTimer=setTimeout(()=>void Store.patch(id,{at,opened:Date.now()}).catch(()=>toast(t('storageFailed'))),250);}
function setActivePage(page){if(!V.doc||page===V.page||page<1||page>V.doc.pages)return;V.page=page;applyTools();updatePaging();savePosition();scheduleWordClass();LHN_READER_API.refreshSource();if(V.panel==='translation')renderTranslation();}
async function setPage(value,fromReader=false){if(!V.doc)return;const page=Math.max(1,Math.min(V.doc.pages,Math.round(+value)||1));if(!fromReader)ttsStop();hideSel();getSelection()?.removeAllRanges();V.page=page;if(V.mode!=='read'&&(V.flow==='single'||(V.flow==='facing'&&!$(`#pageStack>[data-page="${page}"]`))))renderViewer();else{scrollToPage(page);updatePaging();void ensurePage(page);applyTools();if(V.panel==='translation')renderTranslation();}savePosition();await ensurePage(page);LHN_READER_API.refreshSource();void LHN_CONTENT_TOOLS.restore();}
function setFlow(value,persist=true){if(!FLOWS.includes(value))return;if(persist&&V.doc?.pages===1)return;lastFlow=value;if(persist){void api.storage.local.set({[FLOW_KEY]:value});void savePanelPrefs();}if(V.doc?.pages===1)value='single';if(V.flow===value)return;V.flow=value;if(V.mode==='read'){updateDocLabels();return;}ttsStop();hideSel();if(V.doc)renderViewer();}
/* Zoom tự do đến ít nhất 6400%. Chỉ khung tệp ở giữa đổi kích thước (--displayW/--source-scale);
   thanh trên, dải trang, panel dịch và thanh .pager đứng yên.
   v3.5.562: bỏ lưới 10% cho con lăn — zoom LIÊN TỤC bám tay: mỗi pixel lăn/pinch đổi đúng 1% (1:1 với
   khoảng cách 2 ngón), mỗi event kẹp tối đa ±15% để nấc chuột thô không nhảy cóc, và mọi event trong
   cùng một khung hình được gộp lại (rAF) nên không phụ thuộc số trang. Nút − / + và phím nhảy 10 điểm %, trên 400% dùng bước khoảng 10% tương đối. */
const ZOOM_STEPS=[50,75,100,125,150,175,200],ZOOM_MIN=10,ZOOM_MAX=6400,ZOOM_STEP=10,ZOOM_GAIN=0.01,ZOOM_NOTCH_PX=40,ZOOM_NOTCH_STEP=0.15,ZOOM_EVENT_CAP=0.6;
function maxZoom(){
  const spec=activeEngine?.pages[V.page-1],st=$('#stage');
  if(!spec||!st)return ZOOM_MAX;
  const style=getComputedStyle(st),available=Math.max(1,st.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
  const fit=Math.min(V.doc?.type==='pptx'?960:760,isFacing()?Math.max(1,(available-16)/2):available)/spec.width*100;
  return Math.max(ZOOM_MAX,fit*2);
}
const clampZoom=value=>Math.max(ZOOM_MIN,Math.min(maxZoom(),Number.isFinite(+value)?+value:100));
const roundZoom=value=>Math.round(clampZoom(value)*10)/10;
function zoomPercent(){if(V.zoom!=='fit'&&V.zoom!=='fitImage')return +V.zoom;const surface=$('#stage .docSurface'),spec=activeEngine?.pages[V.page-1];return surface&&spec?surface.getBoundingClientRect().width/spec.width*100:100;}
function zoomAnchorAt(clientX,clientY){
  const frame=$$('#pageStack>.pageFrame').find(f=>{const r=f.getBoundingClientRect();return clientY>=r.top&&clientY<=r.bottom;});
  if(!frame)return null;
  const r=frame.getBoundingClientRect();
  return{frame,x:clientX,y:clientY,relX:(clientX-r.left)/Math.max(1,r.width),relY:(clientY-r.top)/Math.max(1,r.height)};
}
function stageCenterAnchor(){const r=$('#stage').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}
/* Giữ điểm đang nhìn đứng yên: đo vị trí tương đối trong trang trước khi đổi cỡ, bù cuộn sau khi đổi. */
function applyZoom(next,anchor){
  if(!V.doc||!activeEngine||$('#viewer').classList.contains('show')===false)return;
  if(next!=='fit'&&next!=='fitImage'){if(String(next).trim()===''||!Number.isFinite(+next))return;next=String(roundZoom(next));}
  const st=$('#stage'),spot=anchor&&next!=='fit'&&next!=='fitImage'?zoomAnchorAt(anchor.clientX??anchor.x,anchor.clientY??anchor.y):null;
  V.zoom=next;
  sizePages(false);
  if(spot&&spot.frame?.isConnected){
    const r=spot.frame.getBoundingClientRect();
    st.scrollTop+=Math.round(r.top+spot.relY*r.height-spot.y);
    st.scrollLeft+=Math.round(r.left+spot.relX*r.width-spot.x);
  }
  hideSel();updateZoomControls();wakePager();
}
function syncZoomSelect(){
  const select=$('#vZoom');if(!select)return;
  const p=Math.round(zoomPercent());
  let live=select.querySelector('option[data-live="1"]');
  if(!live){live=document.createElement('option');live.dataset.live='1';select.insertBefore(live,select.firstElementChild);}
  live.value=String(p);live.dataset.full=p+'%';live.dataset.short=p+'%';live.textContent=p+'%';
  select.value=V.zoom==='fit'||V.zoom==='fitImage'?V.zoom:String(p);
}
function updateZoomControls(){if(!V.doc)return;syncZoomSelect();$('#vZoom option[value="fitImage"]').hidden=!V.doc.image;updateDocLabels();const p=zoomPercent();$('#zOut').disabled=p<=ZOOM_MIN+.5;$('#zIn').disabled=p>=maxZoom()-.5;}
function setZoom(value){
  if(String(value).trim()==='')return;
  if(value!=='fit'&&!(value==='fitImage'&&V.doc?.image)&&!Number.isFinite(+value))return;
  setMore(false,false);applyZoom(value,null);scrollToPage(V.page);
}
function stepZoom(direction){const p=zoomPercent(),step=p>400?Math.max(ZOOM_STEP,Math.round(p*.1/10)*10):ZOOM_STEP,next=roundZoom(p+direction*step);if(Math.abs(next-p)<.4)return;setMore(false,false);applyZoom(next,{...stageCenterAnchor()});}
async function closeViewer(){if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});++viewCycle;const old=V.doc,engine=activeEngine;LHN_READER_API.reset();LHN_CONTENT_TOOLS.close();ttsStop();pageObserver?.disconnect();thumbnailObserver?.disconnect();translationView.observer?.disconnect();nativeCards.clear();V.tools.clear();V.panel=null;endPanelResize();setMore(false,false);hideSel();getSelection()?.removeAllRanges();finishPassword(null);clearTimeout(savePositionTimer);$('#viewer').dataset.nativeReady='false';$('#viewer').classList.remove('show');resetPagerFade();document.body.style.overflow='';notifyParent(false);$('#stage').replaceChildren();drawn.clear();activeEngine=null;document.documentElement.classList.add('documents-native-inactive');await LHN_DOCUMENT_CONTEXT.refresh();engine?.dispose();if(old)await Store.patch(old.id,{at:V.page,opened:Date.now()}).catch(()=>toast(t('storageFailed')));await refreshLibrary();/* v3.5.521: bấm ← về thư viện thì chạy lại hiệu ứng hiện dần y như lần đầu mở tab Tài liệu. */revealLibrary();}
$('#vBack').onclick=()=>void closeViewer();$('#vFlow').onchange=e=>{setMore(false,false);setFlow(e.target.value);};$('#vZoom').onchange=e=>setZoom(e.target.value);$('#zOut').onclick=()=>stepZoom(-1);$('#zIn').onclick=()=>stepZoom(1);$('#pPrev').onclick=()=>navigateStep(-1);$('#pNext').onclick=()=>navigateStep(1);$('#pNum').onchange=e=>{setPage(e.target.value);e.target.value=V.page;};$('#pNum').onfocus=e=>e.target.select();$('#pNum').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();setPage(e.target.value);e.target.blur();}if(e.key==='Escape'){e.target.value=V.page;e.target.blur();e.stopPropagation();}};$('#rail').onclick=e=>{const b=e.target.closest('[data-p]');if(b)setPage(+b.dataset.p);};$('#vMode').onclick=e=>{const b=e.target.closest('[data-m]');if(!b||V.mode===b.dataset.m||!activeEngine?.pages.some((_,i)=>sourceEntries(i+1).length))return;ttsStop();setMore(false,false);hideSel();V.mode=b.dataset.m;if(V.panel==='translation')V.panel=null;paintPanels();renderViewer();void (async()=>{await ensurePage(V.page);await refreshNativeSource();})();};
let scrollRAF=0;$('#stage').addEventListener('scroll',()=>{if(scrollRAF)return;scrollRAF=requestAnimationFrame(()=>{scrollRAF=0;if(!V.doc||!activeEngine)return;if(V.doc.type==='pdf')schedulePdfRaster();if(!['continuous','facingContinuous'].includes(V.flow)&&V.mode!=='read')return;const st=$('#stage'),edge=st.getBoundingClientRect().top+Math.min(135,st.clientHeight*.22);let page=1;for(const f of $$('#pageStack>.pageFrame')){if(f.getBoundingClientRect().top<=edge){const n=+f.dataset.page;if(!isFacing()||n%2===1)page=n;}else break;}if(st.scrollHeight>st.clientHeight+4&&st.scrollTop+st.clientHeight>=st.scrollHeight-4)page=isFacing()?pairStart(V.doc.pages):V.doc.pages;if(isFacing()&&pairStart(V.page)===page)page=V.page;setActivePage(page);if(V.doc.type==='pdf'){const box=st.getBoundingClientRect(),margin=st.clientHeight*2;for(const source of $$('#pageStack .docsSource')){const r=source.getBoundingClientRect();if((r.bottom<box.top-margin||r.top>box.bottom+margin)&&drawn.has(source)&&!source.querySelector('.docsReaderParagraphHighlight')){for(const c of source.querySelectorAll('canvas'))c.width=c.height=0;source.replaceChildren();drawn.delete(source);}}schedulePdfRaster();}runTranslate();});},{passive:true});new ResizeObserver(()=>{if($('#viewer').classList.contains('show')){sizePages();updateZoomControls();}}).observe($('#stage'));

/* v3.5.560: cử chỉ zoom tự do — Ctrl/⌘ + lăn chuột & pinch trackpad (wheel kèm ctrlKey), pinch 2 ngón,
   phím Ctrl+= / Ctrl+- / Ctrl+0. Không can thiệp khi đang ở chế độ Đọc hoặc khi có hộp thoại. */
let zoomPulse=null,zoomPulseRAF=0;
function flushZoomPulse(){
  zoomPulseRAF=0;
  const pulse=zoomPulse;zoomPulse=null;
  if(!pulse||!V.doc||V.mode!=='orig')return;
  const base=zoomPercent(),next=roundZoom(base*pulse.factor);
  if(Math.abs(next-base)<.15)return;
  setMore(false,false);
  applyZoom(next,{clientX:pulse.x,clientY:pulse.y});
}
$('#stage').addEventListener('wheel', event => {
  if(!(event.ctrlKey||event.metaKey)||event.altKey||!V.doc||V.mode!=='orig'||$('.modalWrap.show'))return;
  event.preventDefault();
  if(!event.deltaY)return;
  /* Pinch trackpad/cảm ứng: |deltaY| nhỏ và dày → 1 px ≈ 1% (đúng tỉ lệ ngón tay, không kẹp).
     Nấc chuột rời: |deltaY| ≥ 40 → mỗi nấc +15%, lăn mạnh 300 px = 3 nấc = +45%. */
  const magnitude=Math.abs(event.deltaY);
  const logStep=magnitude>=ZOOM_NOTCH_PX
    ? Math.max(1,Math.round(magnitude/100))*ZOOM_NOTCH_STEP
    : magnitude*ZOOM_GAIN;
  const factor=Math.exp(Math.sign(-event.deltaY)*Math.min(logStep,ZOOM_EVENT_CAP));
  if(!zoomPulse)zoomPulse={factor,x:event.clientX,y:event.clientY};
  else zoomPulse.factor*=factor;
  zoomPulse.x=event.clientX;zoomPulse.y=event.clientY;
  if(zoomPulse.factor!==1&&!zoomPulseRAF)zoomPulseRAF=requestAnimationFrame(flushZoomPulse);
},{passive:false});
(() => {
  let pinch=null;
  const dist=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  const mid=touches=>({clientX:(touches[0].clientX+touches[1].clientX)/2,clientY:(touches[0].clientY+touches[1].clientY)/2});
  $('#stage').addEventListener('touchstart', event => {
    if(event.touches.length!==2||!V.doc||V.mode!=='orig'||$('.modalWrap.show')){pinch=null;return;}
    pinch={base:zoomPercent(),distance:Math.max(1,dist(event.touches))};
  },{passive:true});
  $('#stage').addEventListener('touchmove', event => {
    if(!pinch||event.touches.length!==2)return;
    event.preventDefault();
    applyZoom(pinch.base*dist(event.touches)/pinch.distance,mid(event.touches));
  },{passive:false});
  const end=event => { if(!event.touches||event.touches.length<2)pinch=null; };
  $('#stage').addEventListener('touchend',end,{passive:true});
  $('#stage').addEventListener('touchcancel',end,{passive:true});
})();
document.addEventListener('keydown', event => {
  if(!(event.ctrlKey||event.metaKey)||event.altKey||event.shiftKey||event.isComposing)return;
  if(!$('#viewer').classList.contains('show')||!V.doc||V.mode!=='orig'||$('.modalWrap.show'))return;
  if(event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[id^="lhn-"],[data-lhn-bilingual-ui]'))return;
  const key=event.key;
  if(key!=='='&&key!=='+'&&key!=='-'&&key!=='_'&&key!=='0')return;
  event.preventDefault();
  if(key==='0')setZoom('fit'); else stepZoom(key==='-'||key==='_'?-1:1);
});

function applyTopCompact(value){$('#vBar').classList.toggle('size-compact',value===true);$('.pager').classList.toggle('size-compact',value===true);document.documentElement.style.setProperty('--docs-compact-scale',value===true?'.8':'1');positionDocumentReader();requestToolbarFit();}
function positionDocumentReader(){
 const stage=$('.stageWrap'),bar=$('#lhn-bilingual-reading-bar');if(!stage||!bar)return;
 const r=stage.getBoundingClientRect();if(r.width<1)return;
 const ui=globalThis.LHN_UI_ZOOM?.get?.()||1,wide=bar.classList.contains('lhn-br-wide'),design=wide?560:392,available=Math.max(1,r.width*ui-20),fit=Math.min(1,available/design),compact=$('#vBar').classList.contains('size-compact')?.8:1,z=fit*compact,physical=Math.min(wide?560:available,available)*compact,center=(r.left+r.width/2)*ui;
 const root=document.documentElement.style;root.setProperty('--docs-reader-zoom',String(z));root.setProperty('--docs-reader-left',((center-physical/2)/z)+'px');root.setProperty('--docs-reader-width',(physical/z)+'px');
}
new ResizeObserver(positionDocumentReader).observe($('.stageWrap'));
new MutationObserver(positionDocumentReader).observe($('#lhn-bilingual-reading-bar'),{attributes:true,attributeFilter:['class']});
addEventListener('resize',positionDocumentReader);
const flowControl=LHN_ICONS.createFlowSelect($('#vFlow'),'up'), zoomControl=LHN_ICONS.createFlowSelect($('#vZoom'),'up',false);

/* The page bar stays discoverable; fading never blocks its controls. */
const pageBar = $('.pager');
const PAGER_IDLE_MS = 1000;
let pagerTimer = 0, pagerNear = false;
function pagerHeld() { return pagerNear || pageBar.matches(':hover') || !!pageBar.querySelector('.flow-select-list:not([hidden]),input:focus,select:focus,:focus-visible'); }
function applyPagerMode(){
  clearTimeout(pagerTimer);pagerNear=false;pageBar.classList.remove('dimmed','pager-auto-hidden');
  pageBar.classList.toggle('pager-off',pagerMode==='hide');pageBar.inert=pagerMode==='hide';
  const settingsButton=$('#vDocumentsSettings');settingsButton.hidden=pagerMode!=='hide';
  if(pagerMode==='auto'&&$('#viewer').classList.contains('show')){pageBar.classList.add('pager-auto-hidden');pageBar.inert=true;}
  requestToolbarFit();if(pagerMode==='dim')armPagerFade();
}
function armPagerFade() {
  clearTimeout(pagerTimer);
  if (!$('#viewer').classList.contains('show') || $('#viewer').classList.contains('ttsOn') || document.hidden || !['dim','auto'].includes(pagerMode)) return;
  pagerTimer = setTimeout(() => { if (!pagerHeld()) {pageBar.classList.add(pagerMode==='dim'?'dimmed':'pager-auto-hidden');if(pagerMode==='auto')pageBar.inert=true;} }, PAGER_IDLE_MS);
}
function wakePager() {
  if (!$('#viewer').classList.contains('show') || $('#viewer').classList.contains('ttsOn') || pagerMode==='hide') return;
  if(pagerMode==='auto'&&!pagerHeld())return;
  pageBar.inert=false;pageBar.classList.remove('dimmed','pager-auto-hidden'); armPagerFade();
}
function resetPagerFade() { clearTimeout(pagerTimer); pagerNear = false; pageBar.classList.remove('dimmed','pager-auto-hidden');pageBar.inert=false; }
pageBar.addEventListener('pointerdown', wakePager, { passive:true });
pageBar.addEventListener('focusin', wakePager);
pageBar.addEventListener('focusout', () => requestAnimationFrame(wakePager));
pageBar.addEventListener('keydown', wakePager);
pageBar.addEventListener('document-select-visibility', event => { if(event.detail.open)wakePager();else armPagerFade(); });
$('.stageWrap').addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || $('#viewer').classList.contains('ttsOn')) return;
  const r = pageBar.getBoundingClientRect(), stage = $('.stageWrap').getBoundingClientRect();
  const near = pagerMode==='auto' ? e.clientX>=stage.left&&e.clientX<=stage.right&&e.clientY>=stage.bottom-70&&e.clientY<=stage.bottom : e.clientX >= r.left - 28 && e.clientX <= r.right + 28 && e.clientY >= r.top - 24 && e.clientY <= r.bottom + 24;
  if (near === pagerNear) return;
  pagerNear = near; if (near) wakePager(); else armPagerFade();
}, { passive:true });
$('.stageWrap').addEventListener('pointerleave', () => { pagerNear = false; armPagerFade(); });
$('#stage').addEventListener('scroll', wakePager, { passive:true });
$('.stageWrap').addEventListener('pointerdown', e => { if(e.pointerType!=='touch'||pagerMode!=='auto')return;const r=$('.stageWrap').getBoundingClientRect();if(e.clientY>=r.bottom-70){pagerNear=true;wakePager();setTimeout(()=>{pagerNear=false;armPagerFade();},2500);} }, { passive:true });
addEventListener('resize', () => { pagerNear = false; wakePager(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(pagerTimer); else wakePager(); });


let railPrefs={width:112,visible:null}, railDrag=null, railTimer=0, railVisible=null;
function railLimits(){const w=$('.vbody').clientWidth,max=Math.max(1,Math.min(360,Math.floor(w*.45),w-270));return {min:Math.min(80,max),max};}
function applyRail(){
 const rail=$('#rail'),handle=$('#railResize'),button=$('#vRailToggle'),image=!!V.doc?.image;
 const visible=!image&&(railPrefs.visible===null?!matchMedia('(orientation:portrait)').matches:railPrefs.visible);
 const {min,max}=railLimits(),width=Math.max(min,Math.min(max,railPrefs.width));
 const changed=railVisible!==visible,animate=changed&&railVisible!==null&&!image&&$('#viewer').classList.contains('show')&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
 railVisible=visible;button.hidden=image;button.setAttribute('aria-expanded',String(visible));button.classList.toggle('on',visible);handle.hidden=!visible;rail.inert=!visible;
 if(changed){clearTimeout(railTimer);rail.classList.remove('rail-animate');if(animate){if(visible&&rail.hidden){rail.hidden=false;rail.classList.add('rail-collapsed');void rail.offsetWidth;}rail.classList.add('rail-animate');rail.classList.toggle('rail-collapsed',!visible);railTimer=setTimeout(()=>{rail.hidden=!railVisible;rail.classList.remove('rail-animate');if(V.doc)layoutPanelWidths();},280);}else{rail.hidden=!visible;rail.classList.toggle('rail-collapsed',!visible);}}
 rail.style.setProperty('--rail-w',width+'px');handle.setAttribute('aria-valuemin',min);handle.setAttribute('aria-valuemax',max);handle.setAttribute('aria-valuenow',Math.round(width));handle.setAttribute('aria-valuetext',Math.round(width)+' px');
 if(V.doc)layoutPanelWidths();requestToolbarFit();
}
function saveRail(){void api.storage.local.set({[RAIL_KEY]:railPrefs}).catch(()=>toast(t('storageFailed')));}
$('#vRailToggle').onclick=()=>{railPrefs.visible=!railVisible;applyRail();saveRail();};
const railHandle=$('#railResize');
railHandle.addEventListener('pointerdown',e=>{if(e.button!==0)return;railDrag={id:e.pointerId,x:e.clientX,width:$('#rail').getBoundingClientRect().width};railHandle.setPointerCapture(e.pointerId);document.documentElement.classList.add('panelSizing');e.preventDefault();});
railHandle.addEventListener('pointermove',e=>{if(!railDrag||railDrag.id!==e.pointerId)return;const {min,max}=railLimits();railPrefs.width=Math.round(Math.max(min,Math.min(max,railDrag.width+e.clientX-railDrag.x)));applyRail();});
function endRailDrag(){if(!railDrag)return;const id=railDrag.id;railDrag=null;document.documentElement.classList.remove('panelSizing');if(railHandle.hasPointerCapture(id))railHandle.releasePointerCapture(id);saveRail();}
for(const type of ['pointerup','pointercancel','lostpointercapture'])railHandle.addEventListener(type,endRailDrag);
railHandle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const {min,max}=railLimits(),step=e.shiftKey?48:16,cur=$('#rail').getBoundingClientRect().width;railPrefs.width=Math.round(Math.max(min,Math.min(max,e.key==='Home'?min:e.key==='End'?max:cur+(e.key==='ArrowRight'?step:-step))));applyRail();saveRail();});
addEventListener('resize',()=>{endRailDrag();applyRail();});

let panelDrag = null;
function panelLimits(name) {
  const available = Math.max(1, $('.vbody').clientWidth - $('#rail').getBoundingClientRect().width);
  const required = name === 'translation' ? (matchMedia('(pointer:coarse)').matches ? 264 : 248) : 240;
  const min = Math.min(required, Math.floor(available / 2));
  const max = Math.max(min, Math.min(640, available - Math.min(280, available / 2)));
  return { min:Math.round(min), max:Math.round(max) };
}
function layoutPanelWidths() {
  if (!$('#viewer').classList.contains('show') || matchMedia('(orientation:portrait)').matches) return;
  for (const name of ['translation']) {
    const { min, max } = panelLimits(name);
    const panel = $(`[data-panel="${name}"]`), handle = panel.querySelector('.panelResize');
    const base = parseFloat(getComputedStyle(panel).getPropertyValue('--panel-base')) || 320;
    const w = Math.max(min, Math.min(max, panelPrefs.widths[name] ?? base));
    panel.style.setProperty('--panel-w', w + 'px');
    handle.setAttribute('aria-valuemin', min); handle.setAttribute('aria-valuemax', max); handle.setAttribute('aria-valuenow', w); handle.setAttribute('aria-valuetext', Math.round(w) + ' px');
  }
}
function resizePanel(name, width) {
  const { min, max } = panelLimits(name);
  panelPrefs.widths[name] = Math.round(Math.max(min, Math.min(max, width)));
  layoutPanelWidths(); wakePager();
}
function endPanelResize() {
  if (!panelDrag) return;
  const { handle, id } = panelDrag; panelDrag = null;
  document.documentElement.classList.remove('panelSizing');
  if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
  savePanelPrefs();
}
for (const handle of $$('.panelResize')) {
  handle.addEventListener('pointerdown', e => {
    if (e.button !== 0 || matchMedia('(orientation:portrait)').matches) return;
    const panel = handle.closest('[data-panel]');
    panelDrag = { handle, id:e.pointerId, name:panel.dataset.panel, x:e.clientX, width:panel.getBoundingClientRect().width };
    handle.setPointerCapture(e.pointerId); document.documentElement.classList.add('panelSizing'); e.preventDefault();
  });
  handle.addEventListener('pointermove', e => {
    if (panelDrag?.handle === handle && panelDrag.id === e.pointerId) resizePanel(panelDrag.name, panelDrag.width + panelDrag.x - e.clientX);
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) handle.addEventListener(type, () => { if (panelDrag?.handle === handle) endPanelResize(); });
  handle.addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key) || matchMedia('(orientation:portrait)').matches) return;
    e.preventDefault(); e.stopPropagation();
    const panel = handle.closest('[data-panel]'), { min, max } = panelLimits(panel.dataset.panel), step = e.shiftKey ? 48 : 16;
    const w = e.key === 'Home' ? min : e.key === 'End' ? max : panel.getBoundingClientRect().width + (e.key === 'ArrowLeft' ? step : -step);
    resizePanel(panel.dataset.panel, w); savePanelPrefs();
  });
}
addEventListener('resize', () => { endPanelResize(); layoutPanelWidths(); });
layoutPanelWidths();


function requestTranslationSync(force = false) {
  if (!$('#viewer').classList.contains('show') || V.panel !== 'translation' || translationView.doc !== V.doc || (!panelPrefs.follow && !force)) return;
  translationView.force ||= force;
  if (translationView.raf) return;
  translationView.raf = requestAnimationFrame(() => {
    const forced = translationView.force; translationView.raf = 0; translationView.force = false;
    if (!$('#viewer').classList.contains('show') || V.panel !== 'translation' || translationView.doc !== V.doc || (!panelPrefs.follow && !forced)) return;
    const st = $('#stage'), list = $('#transList'), frame = $(`#pageStack>[data-page="${V.page}"]`), targetPage = $(`#transList [data-trans-page="${V.page}"]`);
    if (!frame || !targetPage || !list.clientHeight) return;
    const focus = st.getBoundingClientRect().top + st.clientHeight / 2, groups = [], fallbackGroups = [];
    for (const block of frame.querySelectorAll('.para[data-paragraph-start="true"]')) {
      const index = block.dataset.paragraphIndex ?? block.dataset.i;
      const peers = block.dataset.paragraphIndex != null ? [...frame.querySelectorAll(`.para[data-paragraph-index="${index}"]`)] : [block];
      const rects = peers.map(el => el.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
      if (!rects.length) continue;
      const group = { index, top:Math.min(...rects.map(rect => rect.top)), bottom:Math.max(...rects.map(rect => rect.bottom)) };
      fallbackGroups.push(group);
      const text = peers.map(el => el.querySelector('.en')?.textContent || el.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
      if (Array.from(text).length > 1) groups.push(group);
    }
    if (!groups.length) groups.push(...fallbackGroups);
    if (!groups.length) return;
    const source = groups.reduce((best, group) => {
      const distance = focus < group.top ? group.top - focus : focus > group.bottom ? focus - group.bottom : 0;
      return !best || distance < best.distance ? { ...group, distance } : best;
    }, null);
    const target = targetPage.querySelector(`[data-trans-i="${source.index}"]`) || targetPage;
    const targetRect = target.getBoundingClientRect(), sourceCenter = (source.top + source.bottom) / 2, targetCenter = (targetRect.top + targetRect.bottom) / 2;
    list.scrollTop = Math.max(0, list.scrollTop + targetCenter - sourceCenter);
  });
}
$('#stage').addEventListener('scroll', () => requestTranslationSync(), { passive:true });
new ResizeObserver(() => requestTranslationSync()).observe($('#transList'));


/* toolbar */
/* Learning tools stay above; document controls stay below or in More. */
const toolbarItems = [...$$('#vControls > [data-dock], #vTools > [data-dock], #docControls > [data-dock]')];
const toolbarHomes = new Map(toolbarItems.map(el => {
  const anchor = document.createComment('toolbar ' + el.dataset.dock); el.after(anchor);
  return [el, anchor];
}));
const moreSlots = { mode:$('#moreMode'), flow:$('#moreFlow'), zoom:$('#moreZoom'), tools:$('#moreTools') };
const moveOrder = [ $('[data-t="wc"]'), $('[data-t="ai"]'), $('[data-t="notes"]'), $('#vMode'), $('[data-t="tts"]'), $('[data-t="translate"]') ];
let toolbarRAF = 0;
function moreFocusables() { return [...$('#vMorePanel').querySelectorAll('button,select')].filter(el => !el.disabled && el.getClientRects().length && getComputedStyle(el).display !== 'none'); }
function setMore(open, focus = true) {
  if (open && $('#vMore').hidden) return;
  $('#vMorePanel').hidden = !open; $('#moreScrim').hidden = !open;
  $('#vMore').setAttribute('aria-expanded', String(open)); $('#vMore').classList.toggle('on', open);
  if (open) { hideSel(); if (focus) moreFocusables()[0]?.focus({ preventScroll:true }); }
  else if (focus && $('#viewer').classList.contains('show') && !$('#vMore').hidden) $('#vMore').focus({ preventScroll:true });
}
function updateDocLabels() {
  const flow=$('#vFlow'); flow.value=V.flow;for(const option of flow.options)option.disabled=!!V.doc&&V.doc.pages===1&&option.value!=='single';
  for(const option of flow.options){const key={single:'single',continuous:'continuous',facing:'facing',facingContinuous:'facingContinuous'}[option.value];option.dataset.full=t(key);option.dataset.short=t(option.value==='continuous'?'continuousShort':key);}
  const fit=$('#vZoom option[value="fit"]');fit.dataset.full=t('fitWidth');fit.dataset.short=t('fitShort');const fitImage=$('#vZoom option[value="fitImage"]');fitImage.dataset.full=fitImage.dataset.short=t('fitImage');
  for(const select of[flow,$('#vZoom')]){const compact=!!select.closest('.pager');for(const option of select.options)option.textContent=compact&&option.dataset.short?option.dataset.short:option.dataset.full||option.textContent;select.title=select.selectedOptions[0]?.dataset.full||select.getAttribute('aria-label');}
  for(const control of [flowControl,zoomControl]){control.element.dataset.direction=control.element.closest('.pager')?'up':'down';control.refresh();}
}
function fitToolbar() {
  if (!$('#viewer').classList.contains('show')) return;
  const focused = document.activeElement;
  // Reparenting a focused native select dismisses its open option list.
  if (flowControl.element.contains(focused) || zoomControl.element.contains(focused)) return;
  const bar = $('#vBar'), title = $('.vtitle'), more = $('#vMore'), dock = $('#docControls');
  toolbarItems.forEach(el => toolbarHomes.get(el).before(el));
  dock.hidden = false; pageBar.classList.remove('simple');
  // Portrait and a narrow reading area keep navigation only. The same controls
  // move into More, including while the speech player occupies the bottom.
  const bottomFits = (V.doc.image || !matchMedia('(orientation:portrait)').matches) && !$('#viewer').classList.contains('ttsOn') && pageBar.scrollWidth <= $('.stageWrap').clientWidth - 24;
  if (!bottomFits) {
    moreSlots.flow.append($('#flowGroup'));
    if ($('#zoomWrap').style.display !== 'none') moreSlots.zoom.append($('#zoomWrap'));
  }
  dock.hidden = ![...dock.children].some(el => el.dataset.dock && el.style.display !== 'none');
  pageBar.classList.toggle('simple', dock.hidden);
  bar.classList.remove('compact');
  more.hidden = !toolbarItems.some(el => el.parentNode !== toolbarHomes.get(el).parentNode);
  const minTitle = Math.min(240, Math.max(100, bar.clientWidth * .18));
  const cramped = () => title.clientWidth < minTitle || bar.scrollWidth > bar.clientWidth + 1;
  if (cramped()) bar.classList.add('compact');
  if (cramped()) {
    more.hidden = false;
    for (const el of moveOrder) {
      if (!cramped()) break;
      if (el.style.display === 'none') continue;
      moreSlots[el.dataset.dock].append(el);
    }
  }
  toolbarItems.filter(el => el.parentNode === moreSlots.tools).forEach(el => moreSlots.tools.append(el));
  const moved = toolbarItems.some(el => el.parentNode !== toolbarHomes.get(el).parentNode);
  more.hidden = !moved;
  if (!moved) setMore(false, false);
  updateDocLabels();
  if (!$('#vMorePanel').hidden) { const L = moreFocusables(); (L.includes(focused) ? focused : L[0])?.focus({ preventScroll:true }); }
}
function requestToolbarFit() { cancelAnimationFrame(toolbarRAF); toolbarRAF = requestAnimationFrame(() => fitToolbar()); }
for (const select of [$('#vFlow'), $('#vZoom')]) select.addEventListener('blur', () => requestAnimationFrame(requestToolbarFit));
new ResizeObserver(requestToolbarFit).observe($('#vBar'));
new ResizeObserver(() => { requestToolbarFit(); wakePager(); }).observe($('.stageWrap'));
matchMedia('(pointer:coarse)').addEventListener('change', requestToolbarFit);
addEventListener('resize', requestToolbarFit);
async function openDocumentSettings(){if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});const single=V.doc?.pages===1;if(EMBEDDED)parent.postMessage({type:'KEEPIT_DOCUMENTS_SETTINGS',tab:'documents',singlePage:single},location.origin);else api.tabs.create({url:api.runtime.getURL('pages/dashboard.html?openSettings=1&openSettingsTab=documents'+(single?'&singlePage=1':''))});}
LHN_ICONS.applyIcons();$('#vDocumentsSettings').onclick=openDocumentSettings;
const FULLSCREEN_ICONS={enter:'<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/>',exit:'<path d="M8 3v5H3M16 3v5h5M8 21v-5H3m13 5v-5h5"/>'};
function updateFullscreenButton(){const button=$('#pageFullscreen'),active=!!document.fullscreenElement;button.hidden=!document.fullscreenEnabled;button.querySelector('svg').innerHTML=FULLSCREEN_ICONS[active?'exit':'enter'];const label=LHN_LANGUAGES.t(active?'exitFullscreen':'enterFullscreen',{},lang);button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(active));}
$('#pageFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast(t('fullscreenUnavailable'));}};
document.addEventListener('fullscreenchange',()=>{updateFullscreenButton();requestToolbarFit();wakePager();});
$('#vMore').onclick = () => setMore($('#vMorePanel').hidden);
async function requestMainSheet(toggle=false,focusReader=false){
 setMore(false,false);
 const rect=$('#pageMenu').getBoundingClientRect();
 const result=await globalThis.LHN_BAR_HOOKS?.openMainSheet?.(rect,{documents:true,toggle,focusReader});
 if(result?.ok){$('#pageMenu').setAttribute('aria-expanded',String(!!result.open));$('#pageMenu').classList.toggle('on',!!result.open);return result;}
 toast(t('mainSheetUnavailable'));return{ok:false};
}
$('#pageMenu').onclick=()=>void requestMainSheet(true,false);
document.addEventListener('lhn-main-sheet',event=>{const open=!!event.detail?.open;$('#pageMenu').setAttribute('aria-expanded',String(open));$('#pageMenu').classList.toggle('on',open);});
$('#moreClose').onclick = () => setMore(false);
$('#moreScrim').onclick = () => setMore(false);
let moreStartY = 0;
$('#moreHead').addEventListener('touchstart', e => { moreStartY = e.touches[0].clientY; }, { passive:true });
$('#moreHead').addEventListener('touchend', e => { if (matchMedia('(orientation:portrait)').matches && e.changedTouches[0].clientY - moreStartY > 55) setMore(false); }, { passive:true });
$('#vMorePanel').addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const L = moreFocusables(), first = L[0], last = L[L.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
});



/* Translation remains beside the file, but the cards and service flow are the app Reader's own. */
const translationView={doc:null,lang:null,raf:0,force:false,observer:null};
function updateTranslationControls(){const menu=$('#trLang');if(!menu.options.length)for(const item of LHN_LANGUAGES.LANGS){const o=document.createElement('option');o.value=item.code;o.textContent=item.name||item.label||item.code;menu.append(o);}if(![...menu.options].some(o=>o.value===panelPrefs.language)){const o=document.createElement('option');o.value=panelPrefs.language;o.textContent=panelPrefs.language;menu.append(o);}menu.value=panelPrefs.language;menu.title=menu.selectedOptions[0]?.textContent||t('trLanguage');$('#trFollow').classList.toggle('on',panelPrefs.follow);$('#trFollow').setAttribute('aria-pressed',String(panelPrefs.follow));$('#trFollow').title=t(panelPrefs.follow?'followOn':'followOff');}
$('#trFollow').onclick=()=>{panelPrefs.follow=!panelPrefs.follow;void savePanelPrefs();updateTranslationControls();cancelAnimationFrame(translationView.raf);translationView.raf=0;translationView.force=false;if(panelPrefs.follow)requestTranslationSync(true);};
$('#trLang').onchange=e=>{panelPrefs.language=e.target.value;void savePanelPrefs();updateTranslationControls();LHN_READER_API.refreshTranslations();if(V.panel==='translation')renderTranslation();runTranslate();};
function paintPanels(){$('#trPanel').inert=V.panel!=='translation';$('#viewer').classList.toggle('transOpen',V.panel==='translation');$('[data-t="translate"]').classList.toggle('on',V.tools.has('translate'));$('[data-t="notes"]').classList.toggle('on',nativeNotesOpen);}
function setPanel(name){if(name==='notes'){void openNativeNotes();return;}if(name==='ai'){void LHN_CONTENT_TOOLS.askAI();return;}if(name!=='translation'||!V.doc)return;if(!isText()||settings.translateEnabled===false)return;endPanelResize();layoutPanelWidths();const open=V.panel!=='translation';V.panel=open?'translation':null;open?V.tools.add('translate'):V.tools.delete('translate');paintPanels();LHN_READER_API.setTranslation(open);if(!open)nativeCards.clear();if(open)renderTranslation();}
function runViewerAction(action){if(action==='translate')return setPanel('translation');if(action==='read')return startNativeReader();}
$('#trClose').onclick=()=>setPanel('translation');
function fillTranslationPage(page){const section=$(`#transList [data-trans-page="${page}"]`);if(!section)return;if(!section.dataset.filled){section.dataset.filled='1';const entries=sourceEntries(page);section.insertAdjacentHTML('beforeend',entries.map(({text,index,isTable})=>`<div class="transItem${isTable?' tableItem':''}"${isTable?' data-pdf-table="true"':''} data-trans-i="${index}"><div class="source">${esc(text)}</div><div class="nativeTranslationSlot" data-page="${page}" data-i="${index}"></div></div>`).join('')||`<div class="imageMeta">${t('noText')}</div>`);}for(const [key,entry]of nativeCards){if(!key.startsWith(page+':'))continue;const slot=section.querySelector(`[data-trans-i="${key.split(':')[1]}"] .nativeTranslationSlot`);if(slot&&entry.card.parentElement!==slot&&V.mode==='orig')slot.replaceChildren(entry.card);}}
function renderTranslation(){if(!V.doc||!activeEngine)return;const list=$('#transList'),fresh=translationView.doc!==V.doc;if(fresh){translationView.observer?.disconnect();translationView.doc=V.doc;list.innerHTML=activeEngine.pages.map((_,i)=>`<section class="transPage" data-trans-page="${i+1}"><div class="transPageNo">${U()} ${i+1} / ${V.doc.pages}</div></section>`).join('');translationView.observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)fillTranslationPage(+e.target.dataset.transPage);},{root:list,rootMargin:'100px'});for(const el of list.children)translationView.observer.observe(el);}fillTranslationPage(V.page);for(const section of list.children)section.classList.toggle('on',+section.dataset.transPage===V.page);requestTranslationSync(fresh);runTranslate();}
function runTranslate(){if(!V.doc||!activeEngine||!V.tools.has('translate')||settings.translateEnabled===false)return;const blocks=nativeBlocks(),stage=$('#stage').getBoundingClientRect();for(const block of blocks){const r=block.getBoundingClientRect();if(r.bottom>=stage.top-100&&r.top<=stage.bottom+100)void LHN_READER_API.translate(block,true);}}
new MutationObserver(()=>requestTranslationSync()).observe($('#transList'),{childList:true,subtree:true,characterData:true});

/* Real, local model; never guessed labels. Original layout is not reflowed to label it. */
let wcToken=0,wcTimer=0;const wcCache=new Map(),wcJobs=new Map();
function scheduleWordClass(){clearTimeout(wcTimer);if(V.tools.has('wc'))wcTimer=setTimeout(()=>void paintWordClass(V.page).catch(()=>toast(t('wcError'))),180);}
async function paintWordClass(page){
 if(!V.tools.has('wc')||!isText()||page!==V.page)return;const cycle=viewCycle,token=wcToken,id=V.doc.id;await ensurePage(page);if(cycle!==viewCycle||token!==wcToken||page!==V.page)return;
 const elements=$$(`#pageStack>[data-page="${page}"] .para .en`),texts=elements.map(el=>plainText(el));if(!texts.length)return;const key=id+':'+page+':'+V.mode+':'+texts.join('\n');let results=wcCache.get(key);
 if(!results){let work=wcJobs.get(key);if(!work){work=(async()=>{const out=texts.map(()=>[]),chunks=[];texts.forEach((text,index)=>{let from=0;for(const part of LHN_TTS.splitChunks(text,16000)){const offset=text.indexOf(part,from);chunks.push({text:part,index,offset:Math.max(0,offset)});from=offset+part.length;}});for(let start=0;start<chunks.length;start+=50){if(cycle!==viewCycle||token!==wcToken)throw Error('cancelled');const batch=chunks.slice(start,start+50),result=await LHN_MESSAGING.sendMessage({type:'WORD_CLASS_TAG',texts:batch.map(x=>x.text)});if(!result?.ok)throw Error(result?.needDownload?'model':'tag');batch.forEach((chunk,i)=>out[chunk.index].push(...(result.results[i]||[]).map(([a,b,pos])=>[a+chunk.offset,b+chunk.offset,pos])));}wcCache.set(key,out);return out;})();wcJobs.set(key,work);work.finally(()=>wcJobs.delete(key)).catch(()=>{});}results=await work;}
 if(cycle!==viewCycle||token!==wcToken||page!==V.page||!V.tools.has('wc'))return;
 const core=LHN_WORD_CLASS_CORE,containers=new Map(),allTokens=[];
 for(let index=0;index<elements.length;index++){
  const en=elements[index];if(!en.isConnected||!Array.isArray(results[index]))continue;const source=en.closest('.docsSource')||en.closest('.reflow');if(!source)continue;
  let overlay=containers.get(source);if(!overlay){source.querySelector('.docsWcOverlay')?.remove();overlay=document.createElement('div');overlay.className='docsWcOverlay';overlay.setAttribute('aria-hidden','true');if(source.classList.contains('reflow'))source.style.position='relative';source.append(overlay);containers.set(source,overlay);}
  const original=source.classList.contains('docsSource'),dark=!original&&document.documentElement.classList.contains('dark'),text=texts[index],tokens=core.label(text,results[index]);allTokens.push(...tokens);const bounds=source.getBoundingClientRect(),scale=bounds.width/Math.max(1,source.offsetWidth);
  for(const unit of core.units(text,tokens)){
   const labelled=unit.tokens.filter(t=>t.pos);if(!labelled.length)continue;const first=unit.tokens[0],last=unit.tokens[unit.tokens.length-1],range=rangeForOffsets(en,first.start,last.end);if(!range)continue;
   const abbrs=unit.merged?core.nounUnit(unit.tokens).abbrs:[...new Set(labelled.map(t=>t.pos.abbr))],rects=[];
   for(const r of [...range.getClientRects()].filter(r=>r.width>.1&&r.height>.1).sort((a,b)=>a.top-b.top||a.left-b.left)){const prev=rects[rects.length-1];if(prev&&Math.abs(prev.top-r.top)<Math.min(prev.height,r.height)*.4&&r.left<=prev.right+2){prev.right=Math.max(prev.right,r.right);prev.bottom=Math.max(prev.bottom,r.bottom);}else rects.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height});}
   const pdfHover=V.doc?.type==='pdf',hint=core.tip(unit.tokens,upos=>LHN_LANGUAGES.t('wc_'+upos,{},lang),upos=>LHN_LANGUAGES.t('wc_'+upos,{},'en'));
   for(const r of rects){const mark=document.createElement('span');mark.className='docsWcMark'+(pdfHover?' docsWcHover':'');mark.style.left=(r.left-bounds.left)/scale+'px';mark.style.top=(r.bottom-bounds.top)/scale+'px';mark.style.width=(r.right-r.left)/scale+'px';mark.style.borderColor=core.color(abbrs[0],dark);if(pdfHover){mark.title=hint;mark.setAttribute('aria-label',hint);}const label=document.createElement('span');label.className='docsWcLabel';label.textContent=abbrs.join(' · ');label.style.color=core.color(abbrs[0],dark);mark.append(label);overlay.append(mark);}
  }
 }
 $('#wordClassLegend').innerHTML=core.legend(allTokens,u=>LHN_LANGUAGES.t('wc_'+u,{},lang),document.documentElement.classList.contains('dark'));$('#legend').classList.add('on');
}
async function toggleWordClass(){if(!isText())return;if(V.tools.has('wc')){V.tools.delete('wc');++wcToken;clearTimeout(wcTimer);for(const el of $$('#stage .docsWcOverlay'))el.remove();$('#legend').classList.remove('on');applyTools();return;}const status=await LHN_MESSAGING.sendMessage({type:'WORD_CLASS_STATUS'});if(!status?.downloaded){toast(t('modelNeeded'));return;}V.tools.add('wc');++wcToken;applyTools();toast(t('wcBusy'));try{await paintWordClass(V.page);}catch{V.tools.delete('wc');applyTools();toast(t('wcError'));}}
globalThis.LHN_DOCUMENTS_MAIN_ACTIONS=Object.freeze({
 openSettings:openDocumentSettings,
 scrollToTop(){if(!V.doc)return false;if(['single','facing'].includes(V.flow)&&V.mode!=='read')void setPage(1);else $('#stage').scrollTo({top:0,behavior:'smooth'});return true;},
 translate:()=>runViewerAction('translate'),read:()=>runViewerAction('read'),
 translateLabel:()=>t('translate'),readLabel:()=>t('readAloud'),
 available:()=>!!V.doc&&!V.doc.image,translateDisabled:()=>!isText()||settings.translateEnabled===false,readDisabled:()=>!isText(),
 translationOn:()=>V.panel==='translation',readOn:()=>!!LHN_READER_API.state.reading,
 toggleWordClass,wordClassOn:()=>V.tools.has('wc'),
 async toggleWordClassLegend(){if(!isText()){toast(t('noText'));return false;}if(!V.tools.has('wc')){await toggleWordClass();return V.tools.has('wc');}if(!$('#wordClassLegend').innerHTML.trim()){await paintWordClass(V.page);return true;}const open=!$('#legend').classList.contains('on');$('#legend').classList.toggle('on',open);return open;},
 wordClassLegendOn:()=>$('#legend').classList.contains('on')
});
$('#lgClose').onclick=()=>$('#legend').classList.remove('on');

/* The viewer supplies file identity, source text and geometry; all tool UI belongs to app modules. */
const nativeCards=new Map();let nativeNotesOpen=false,nativeNoteWidth=0;
const ownDocumentUrl=key=>{const url=new URL(api.runtime.getURL('pages/dashboard.html'));url.searchParams.set('document',key);return url.href;};
const validDocumentKey=value=>/^[a-zA-Z0-9-]{16,80}$/.test(value||'');
function documentUrl(){return V.doc?.sourceKey?ownDocumentUrl(V.doc.sourceKey):location.href;}
async function ensureDocumentKey(meta){if(validDocumentKey(meta.sourceKey))return meta.sourceKey;let sourceKey='';try{const all=await LHN_MESSAGING.sendMessage({type:'GET_ALL'}),existing=all?.find(n=>n.documentAnchor?.documentId===meta.id);if(existing){const url=new URL(existing.url);const key=url.searchParams.get('document');if(url.protocol===location.protocol&&url.host===location.host&&validDocumentKey(key))sourceKey=key;}}catch{}sourceKey||=crypto.randomUUID();await Store.patch(meta.id,{sourceKey});meta.sourceKey=sourceKey;return sourceKey;}
function textNodes(root){const nodes=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement?.closest('.kp-wc-a,.wcl,.tr,.lhn-bilingual-card,.lhn-bilingual-speaker')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});for(let node;node=walker.nextNode();)nodes.push(node);return nodes;}
function plainText(root){return root?textNodes(root).map(n=>n.nodeValue).join(''):'';}
function rangeForOffsets(root,start,end){const range=document.createRange();let at=0,found=false;for(const node of textNodes(root)){const next=at+node.length;if(!found&&start<=next){range.setStart(node,Math.max(0,start-at));found=true;}if(found&&end<=next){range.setEnd(node,Math.max(0,end-at));return range;}at=next;}return null;}
function rangesForCanonicalQuote(roots,quote){const ignored=/[\s\u00ad\u200b\ufeff\-\u2010-\u2014\u2212]/u,wanted=String(quote||'').split('').filter(char=>!ignored.test(char)).join('');if(!wanted)return[];let text='';const points=[];for(const root of roots)for(const node of textNodes(root)){for(let offset=0;offset<node.nodeValue.length;offset++){const char=node.nodeValue[offset];if(ignored.test(char))continue;text+=char;points.push({node,offset});}}const index=text.indexOf(wanted);if(index<0)return[];const selected=points.slice(index,index+wanted.length),groups=[];for(const point of selected){const previous=groups.at(-1);if(previous&&previous.node===point.node&&previous.end===point.offset)previous.end++;else groups.push({node:point.node,start:point.offset,end:point.offset+1});}return groups.map(group=>{const range=document.createRange();range.setStart(group.node,group.start);range.setEnd(group.node,group.end);return range;});}
function sourceAnchor(range,existing){
 if(!V.doc||!range)return existing;
 const segments=[];for(const en of $$('#stage .para .en')){try{if(!range.intersectsNode(en))continue;const r=document.createRange();r.selectNodeContents(en);if(en.contains(range.startContainer))r.setStart(range.startContainer,range.startOffset);if(en.contains(range.endContainer))r.setEnd(range.endContainer,range.endOffset);const before=document.createRange();before.selectNodeContents(en);before.setEnd(r.startContainer,r.startOffset);const start=before.toString().length,quote=r.toString();if(quote.trim()){const p=en.closest('.para'),logical=V.mode==='read';segments.push({page:+p.dataset.page,index:logical?paragraphIndex(p):+p.dataset.i,paragraphIndex:paragraphIndex(p),logicalParagraph:logical,start,end:start+quote.length,quote});}}catch{}}
 if(segments.length)return{documentId:V.doc.id,page:segments[0].page,segments};
 return existing||{documentId:V.doc.id,page:V.page,fileLevel:true,segments:[]};
}
function annotationRanges(item){
 const anchor=item.documentAnchor;if(!V.doc||anchor?.documentId!==V.doc.id||anchor.fileLevel||item.dictionaryOnly)return[];const ranges=[];
 for(const segment of anchor.segments||[]){
  if(segment.logicalParagraph){
   const index=segment.paragraphIndex??segment.index,roots=$$(`#pageStack>[data-page="${segment.page}"] .para[data-paragraph-index="${index}"] .en`);if(!roots.length)continue;
   let r=null;if(V.mode==='read'&&roots.length===1){const text=plainText(roots[0]);let start=segment.start,end=segment.end;if(text.slice(start,end)!==segment.quote){start=text.indexOf(segment.quote);if(start<0){ranges.push(...rangesForCanonicalQuote(roots,segment.quote));continue;}end=start+segment.quote.length;}r=rangeForOffsets(roots[0],start,end);}else{ranges.push(...rangesForCanonicalQuote(roots,segment.quote));continue;}if(r)ranges.push(r);continue;
  }
  const en=$(`#pageStack>[data-page="${segment.page}"] .para[data-i="${segment.index}"] .en`);
  if(en){const text=plainText(en);let start=segment.start,end=segment.end;if(text.slice(start,end)===segment.quote){const range=rangeForOffsets(en,start,end);if(range){ranges.push(range);continue;}}else{start=text.indexOf(segment.quote);if(start>=0){const range=rangeForOffsets(en,start,start+segment.quote.length);if(range){ranges.push(range);continue;}}}}
  if(V.mode==='read'){for(const candidate of $$(`#pageStack>[data-page="${segment.page}"] .para[data-paragraph-start="true"] .en`)){const found=rangesForCanonicalQuote([candidate],segment.quote);if(found.length){ranges.push(...found);break;}}}
 }
 return ranges;
}
async function syncAnnotationCounts(items){if(!V.doc||!Array.isArray(items))return;const id=V.doc.id,current=items.filter(n=>n.documentAnchor?.documentId===id),hl=current.filter(n=>!n.dictionaryOnly&&!n.documentAnchor?.fileLevel).length,notes=current.filter(n=>String(n.note||'').trim()).length;noteList=current;if(V.doc.hl!==hl||V.doc.notes!==notes){V.doc.hl=hl;V.doc.notes=notes;await Store.patch(id,{hl,notes}).catch(()=>{});}}
async function migrateDocumentNotes(){
 if(!V.doc||V.doc.nativeNotesMigrated)return;const doc=V.doc,id=doc.id,url=documentUrl(),legacy=await Store.all('notes',id),present=await LHN_MESSAGING.sendMessage({type:'GET_PAGE',url});
 for(const old of legacy){if(present.some(n=>n.documentAnchor?.legacyId===old.id)){await Store.forgetMigratedNote(old.id);continue;}const item=LHN_NOTE_COMPOSER.buildRecord({quote:old.quote||doc.name,note:old.note||'',contextNote:'',url,title:doc.name,hostname:'Keepit',thumbnailUrl:doc.thumbnail||'',prefix:'',suffix:'',tags:[],color:old.kind==='note'?'green':'yellow',createdAt:old.createdAt,documentAnchor:{documentId:id,page:old.page||1,segments:old.segments||[],fileLevel:!old.segments?.length,legacyId:old.id}});const saved=await LHN_MESSAGING.sendMessage({type:'ADD',item});if(!saved?.id)throw Error('documentsStorageFailed');if(old.createdAt)await LHN_MESSAGING.sendMessage({type:'UPDATE',item:{...saved,createdAt:old.createdAt}});await Store.forgetMigratedNote(old.id);present.push(saved);}
 await Store.patch(id,{nativeNotesMigrated:true});if(V.doc?.id===id){V.doc.nativeNotesMigrated=true;const items=await LHN_MESSAGING.sendMessage({type:'GET_PAGE',url});if(V.doc?.id===id)await syncAnnotationCounts(items);}
}
let edgeSkipEngine=null,edgeSkipCache=new Set();
function readerHeaderFooterSkips(){if(edgeSkipEngine===activeEngine)return edgeSkipCache;edgeSkipEngine=activeEngine;edgeSkipCache=new Set();const pages=activeEngine?.pages||[],groups=new Map();for(let pi=0;pi<pages.length;pi++){const page=pages[pi],texts=page.texts||[],edges=page.paragraphs||page.edgePositions||[];for(let i=0;i<texts.length;i++){const meta=edges[i]||{},text=String(texts[i]||'').normalize('NFKC').toLowerCase().replace(/\d+/g,'#').replace(/[^\p{L}\p{N}#]+/gu,' ').trim();if(meta.skip){edgeSkipCache.add(`${pi+1}:${i}`);continue;}if(text.length<5)continue;const top=Number(meta.edgeTop),bottom=Number(meta.edgeBottom),region=Number.isFinite(top)&&top<=.12?'h':Number.isFinite(bottom)&&bottom>=.88?'f':'';if(!region)continue;const position=Math.round((region==='h'?top:bottom)*20),key=`${region}:${position}:${text}`,items=groups.get(key)||[];items.push(`${pi+1}:${i}`);groups.set(key,items);}}
 const threshold=Math.max(2,Math.ceil(pages.length*.5));for(const items of groups.values())if(new Set(items.map(item=>item.split(':')[0])).size>=threshold)for(const item of items)edgeSkipCache.add(item);return edgeSkipCache;}
function shouldSkipReaderBlock(el){return el.dataset.readerSkip==='true'||readerHeaderFooterSkips().has(`${+el.dataset.page}:${paragraphIndex(el)}`);}
function nativeBlocks(){if(!$('#viewer').classList.contains('show')||!activeEngine)return[];const selector=V.mode==='read'?'#stage .para[data-paragraph-start="true"]':`#pageStack>[data-page="${V.page}"] .para[data-paragraph-start="true"]`;return $$(selector).filter(el=>!shouldSkipReaderBlock(el)&&el.querySelector('.en')&&Array.from(readerTextForBlock(el).trim()).length>1).sort((a,b)=>(+a.dataset.page-(+b.dataset.page))||paragraphIndex(a)-paragraphIndex(b));}
function nativeBlocksForTarget(target){if(!$('#viewer').classList.contains('show')||!activeEngine)return[];if(V.mode==='read')return nativeBlocks();const page=Number(target?.closest?.('.para[data-page]')?.dataset.page)||V.page,selector=`#pageStack>[data-page="${page}"] .para[data-paragraph-start="true"]`;return $$(selector).filter(el=>!shouldSkipReaderBlock(el)&&el.querySelector('.en')&&Array.from(readerTextForBlock(el).trim()).length>1).sort((a,b)=>(+a.dataset.page-(+b.dataset.page))||paragraphIndex(a)-paragraphIndex(b));}
function paragraphIndex(block){const value=Number(block?.dataset.paragraphIndex);return Number.isInteger(value)?value:+block?.dataset.i;}
function readerTextForBlock(block){const page=+block?.dataset.page,index=paragraphIndex(block);return sourceTexts(page)[index]||plainText(block?.querySelector('.en')||block).replace(/\s+/g,' ').trim();}
function cardKey(block){return block?.dataset.page+':'+paragraphIndex(block);}
function cardBlock(card){for(const [key,entry]of nativeCards)if(entry.card===card){const[page,i]=key.split(':');return $(`#pageStack>[data-page="${page}"] .para[data-paragraph-start="true"][data-paragraph-index="${i}"]`)||entry.block;}return null;}
function mountNativeCard(block,card){if(!V.doc)return;const key=cardKey(block),page=+block.dataset.page,index=paragraphIndex(block);nativeCards.set(key,{card,block});if(V.mode==='read'){block.append(card);return;}if(V.panel!=='translation'){V.panel='translation';V.tools.add('translate');paintPanels();layoutPanelWidths();renderTranslation();}fillTranslationPage(page);const target=$(`#transList [data-trans-page="${page}"] [data-trans-i="${index}"] .nativeTranslationSlot`);target?.replaceChildren(card);requestTranslationSync();}
function hideSel(){globalThis.LHN_CONTENT_TOOLS?.dismissSelection?.();}
function ttsStop(){globalThis.LHN_READER_API?.stop(true);}
async function startNativeReader(){if(!isText())return;await ensurePage(V.page);const blocks=nativeBlocks(),from=blocks.find(b=>+b.dataset.page===V.page)||blocks[0];LHN_READER_API.toggle(from);}
async function openNativeNotes(){if(settings.notesEnabled===false)return;if(V.doc.image||!isText()){const range=document.createRange();range.selectNodeContents($('#vName'));LHN_CONTENT_TOOLS.compose(range);return;}LHN_CONTENT_TOOLS.toggleNotes();}
async function restoreMarks(){if(globalThis.LHN_CONTENT_TOOLS&&$('#viewer').classList.contains('show'))await LHN_CONTENT_TOOLS.restore();}
/* v3.5.571: hộp chữ của lớp chữ PDF/PPTX chỉ cao bằng cỡ chữ, còn nhịp dòng rộng hơn nhiều, và phía sau chữ trên mỗi
   dòng là khoảng trống — con trỏ/ngón tay rơi vào những chỗ đó thì trình duyệt neo vùng chọn vào ranh giới khối nên
   vùng chọn nháy xuống dòng dưới (hoặc nhảy lên đầu đoạn) khi bôi đen nhiều đoạn.
   Cách chữa: (1) mỗi hộp chữ được đệm thêm phần khe phía dưới cho tới hộp kế tiếp; (2) cuối mỗi dòng có một đoạn
   "chữ đệm" trong suốt (khoảng trắng cứng, user-select:none, nằm ngoài .en) phủ hết bề ngang còn lại.
   Nhờ vậy cả chuột và cảm ứng đều chọn đúng như nhau — không phải chặn cử chỉ chạm của hệ điều hành.
   Chỉ chạy một lần sau khi vẽ trang: hình học trong lớp chữ tính theo đơn vị trang, .docsSource chỉ transform scale()
   nên zoom không làm nó đổi (đo lại mỗi bước zoom sẽ làm zoom bị khựng). */
const textBoxRect = el => (el?.querySelector?.('.en') || el).getBoundingClientRect();
function fillTextLayerGaps(){
  if(!V.doc||!$('#viewer').classList.contains('show')||V.mode!=='orig')return;
  for(const layer of $$('#pageStack .pdfTextLayer')){
    const paras=[...layer.querySelectorAll('.para')];
    if(!paras.length)continue;
    const signature=`${layer.clientWidth}x${layer.clientHeight}:${paras.length}`;
    if(layer.dataset.lhnGapSig===signature)continue;
    const layerRect=layer.getBoundingClientRect();
    const boxes=paras.map(p=>{                                       // đọc một lượt, không xen ghi
      const en=p.querySelector('.en'),r=p.getBoundingClientRect();
      return {p,en,r,text:en?en.getBoundingClientRect():r,ratio:r.height/Math.max(1,p.offsetHeight)};
    }).filter(b=>b.r.height>0&&b.r.width>0).sort((a,b)=>a.r.top-b.r.top);
    for(let i=0;i<boxes.length;i++){
      const box=boxes[i],ratio=Math.max(0.2,box.ratio);
      let next=null;
      for(let j=i+1;j<boxes.length;j++)if(boxes[j].r.top>=box.r.bottom-0.5){next=boxes[j].r;break;}
      const bottom=next?next.top:box.r.bottom;   /* v3.5.574: không kéo đệm đoạn cuối tới đáy trang —
        hộp đệm 174px rỗng đó là một đích caret rất lớn nằm cách xa dòng chữ, góp phần làm vùng chọn nháy. */
      const gap=bottom-box.r.bottom;
      const pad=gap>0.5?(gap/ratio).toFixed(2)+'px':'';
      if(box.p.style.paddingBottom!==pad)box.p.style.paddingBottom=pad;
      fillLineEnd(box,layerRect);
    }
    layer.dataset.lhnGapSig=signature;
  }
}
function fillLineEnd(box,layerRect){
  let filler=box.p.querySelector(':scope > .lhnLineFiller');
  if(!filler){filler=document.createElement('span');filler.className='lhnLineFiller';filler.setAttribute('aria-hidden','true');
    filler.style.cssText='color:transparent;-webkit-user-select:none;user-select:none;pointer-events:none;white-space:pre;position:static';
    box.p.append(filler);}
  const ratio=Math.max(0.2,box.ratio), remain=(layerRect.right-box.text.right)/ratio;
  if(remain<8){if(filler.textContent)filler.textContent='';return;}
  const textLength=box.en?.textContent?.length||0, perChar=textLength?box.text.width/textLength:0;
  if(!(perChar>0.5))return;
  const count=Math.max(1,Math.ceil((layerRect.right-box.text.right)/perChar)), next='\u00a0'.repeat(count);
  if(filler.textContent===next)return;
  filler.textContent=next;
  for(let pass=0;pass<2;pass++){                    // căn khít mép phải; chỉ một lần mỗi trang nên không ảnh hưởng zoom
    const width=filler.getBoundingClientRect().width/Math.max(1,filler.textContent.length);
    const need=Math.ceil((layerRect.right-filler.getBoundingClientRect().right)/Math.max(0.5,width));
    if(need===0)break;
    if(need<0&&filler.textContent.length+need<1)break;
    filler.textContent='\u00a0'.repeat(filler.textContent.length+need);
  }
}
function clearReaderParagraphHighlight(){for(const el of $$('#stage .docsReaderParagraphHighlight'))el.remove();}
function readerParagraphHighlightBox(rects,sourceRect,scale){
 const visible=rects.filter(rect=>rect.width>0&&rect.height>0);if(!visible.length||!Number.isFinite(scale)||scale<=0)return null;
 const left=Math.min(...visible.map(rect=>rect.left)),top=Math.min(...visible.map(rect=>rect.top)),right=Math.max(...visible.map(rect=>rect.right)),bottom=Math.max(...visible.map(rect=>rect.bottom));
 return{left:(left-sourceRect.left)/scale,top:(top-sourceRect.top)/scale,width:(right-left)/scale,height:(bottom-top)/scale};
}
let pdfSpeakerHoverKey='',pdfSpeakerPointerFrame=0,pdfSpeakerPointer=null;
function pdfSpeakerKeyFromTarget(value){const el=value?.nodeType===1?value:value?.parentElement;if(!el)return'';const text=el.closest('.pdfTextLayer .para[data-page][data-paragraph-index]');if(text)return `${text.dataset.page}:${text.dataset.paragraphIndex}`;return el.closest('.docsReaderSpeakerAnchor[data-reader-speaker-key]')?.dataset.readerSpeakerKey||'';}
function setPdfSpeakerHover(key,on){if(!key)return;const host=$(`#pageStack .docsReaderSpeakerAnchor[data-reader-speaker-key="${key}"]`);host?.toggleAttribute('data-source-hover',on);}
function pdfSpeakerKeyAtPoint(x,y,target){
 if(!V.doc||V.doc.type!=='pdf'||V.mode!=='orig'||!$('#viewer').classList.contains('show'))return'';
 const direct=pdfSpeakerKeyFromTarget(target);if(direct)return direct;
 const el=target?.nodeType===1?target:target?.parentElement;let frame=el?.closest('.pageFrame[data-page]');
 if(!frame)frame=$$('#pageStack>.pageFrame').find(item=>{const r=item.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;});
 if(!frame)return'';
 let best='',bestArea=Infinity;
 for(const block of frame.querySelectorAll('.pdfTextLayer .para[data-paragraph-start="true"]')){
  const index=block.dataset.paragraphIndex??block.dataset.i,spans=frame.querySelectorAll(`.pdfTextLayer .para[data-paragraph-index="${index}"]`),rects=[...spans].map(span=>textBoxRect(span)).filter(r=>r.width>0&&r.height>0);if(!rects.length)continue;
  const left=Math.min(...rects.map(r=>r.left)),top=Math.min(...rects.map(r=>r.top)),right=Math.max(...rects.map(r=>r.right)),bottom=Math.max(...rects.map(r=>r.bottom));
  if(x>=left&&x<=right&&y>=top&&y<=bottom){const area=(right-left)*(bottom-top);if(area<bestArea){bestArea=area;best=`${frame.dataset.page}:${index}`;}}
 }
 return best;
}
function updatePdfSpeakerHover(key){if(key===pdfSpeakerHoverKey)return;if(pdfSpeakerHoverKey)setPdfSpeakerHover(pdfSpeakerHoverKey,false);pdfSpeakerHoverKey=key;if(key)setPdfSpeakerHover(key,true);}
function pdfSpeakerPointerMove(event){if(event.pointerType==='touch')return;pdfSpeakerPointer={x:event.clientX,y:event.clientY,target:event.target};if(pdfSpeakerPointerFrame)return;pdfSpeakerPointerFrame=requestAnimationFrame(()=>{pdfSpeakerPointerFrame=0;const p=pdfSpeakerPointer;updatePdfSpeakerHover(pdfSpeakerKeyAtPoint(p.x,p.y,p.target));});}
function pdfSpeakerPointerOut(event){if(event.pointerType==='touch')return;pdfSpeakerPointer={x:event.clientX,y:event.clientY,target:event.relatedTarget};if(pdfSpeakerPointerFrame){cancelAnimationFrame(pdfSpeakerPointerFrame);pdfSpeakerPointerFrame=0;}updatePdfSpeakerHover(event.relatedTarget?pdfSpeakerKeyAtPoint(event.clientX,event.clientY,event.relatedTarget):'');}
document.addEventListener('pointermove',pdfSpeakerPointerMove,true);document.addEventListener('pointerout',pdfSpeakerPointerOut,true);addEventListener('blur',()=>updatePdfSpeakerHover(''));
/* v3.5.574: chốt hãm đầu mút vùng chọn.
   Log trên máy thật cho thấy đôi khi Chrome lấy một nút TRANG TRÍ (neo loa, khung tô đoạn, dòng đệm) hoặc
   ranh giới đoạn làm đầu mút vùng chọn. Những nút đó nằm ngoài dòng chữ nên vùng chọn phình hết phần còn lại
   của trang (2 000+ ký tự, khung tô cao bất thường) rồi bật lại ngay — đúng cái "nháy" người dùng thấy.
   Cách chữa: giữ nguyên đầu neo, chỉ kéo đầu kia về vị trí chữ hợp lệ gần nhất vừa thấy. Không chặn cử chỉ,
   không đụng tới thao tác chuột (chuột luôn neo vào chữ nên không bao giờ đi qua nhánh này). */
const SEL_DECORATION='.docsReaderSpeakerOverlay,.docsReaderSpeakerAnchor,.lhnLineFiller,.docsReaderParagraphHighlight,.lhnPdfHighlight,.lhn-br-fill,.lhn-bilingual-speaker';
let selectionGood=null,selectionRepairing=false,selectionRepairs=0,selectionRepairAt=0,selectionLenAt=0;
function endpointOnReaderText(node){return !!node&&node.nodeType===3&&!!node.parentElement?.closest?.('#pageStack .pdfTextLayer');}
function installSelectionEndpointGuard(){
 document.addEventListener('selectionchange',()=>{
  if(selectionRepairing)return;
  const sel=globalThis.getSelection?.();
  if(!sel||!sel.rangeCount||sel.isCollapsed){selectionGood=null;selectionRepairs=0;return;}
  const anchor=sel.anchorNode;
  if(!anchor||!anchor.parentElement?.closest?.('#pageStack')){selectionGood=null;selectionRepairs=0;return;}
  const focus=sel.focusNode,holder=focus?.nodeType===3?focus.parentElement:focus;
  if(endpointOnReaderText(focus)&&!holder.closest?.(SEL_DECORATION)){
   const stamp=performance.now();
   if(!selectionGood||selectionGood.anchor!==anchor){selectionGood={anchor,node:focus,offset:sel.focusOffset,len:sel.toString().length};selectionRepairs=0;selectionLenAt=stamp;}
   else if(stamp-selectionLenAt>300){selectionGood.node=focus;selectionGood.offset=sel.focusOffset;selectionGood.len=sel.toString().length;selectionLenAt=stamp;}
   else {selectionGood.node=focus;selectionGood.offset=sel.focusOffset;}
   return;
  }
  if(!selectionGood||selectionGood.anchor!==anchor)return;   // chưa có mốc tốt: để trình duyệt tự xử
  const stamp=performance.now();
  if(stamp-selectionRepairAt>900){selectionRepairs=0;selectionRepairAt=stamp;}
  if(selectionRepairs>=3)return;                             // đang phải sửa liên tục: nhường trình duyệt
  const onDecoration=!!holder.closest?.(SEL_DECORATION);
  if(!onDecoration&&sel.toString().length<=selectionGood.len+Math.max(80,selectionGood.len*0.5))return;  // ranh giới đoạn bình thường: không đụng
  selectionRepairing=true;selectionRepairs++;selectionRepairAt=stamp;
  try{sel.extend(selectionGood.node,selectionGood.offset);}                // giữ nguyên đầu neo, chỉ kéo đầu kia về chỗ cũ
  catch{try{sel.setBaseAndExtent(anchor,sel.anchorOffset,selectionGood.node,selectionGood.offset);}catch{}}
  setTimeout(()=>{selectionRepairing=false;},0);
 },true);
}
installSelectionEndpointGuard();
function nativeSpeakerHost(block){
 if(V.mode!=='orig'||V.doc?.type!=='pdf'||!block)return null;
 const source=block.closest('.docsSource'),surface=source?.parentElement;if(!surface)return null;
 let overlay=surface.querySelector(':scope > .docsReaderSpeakerOverlay');if(!overlay){overlay=document.createElement('div');overlay.className='docsReaderSpeakerOverlay';surface.append(overlay);}
 const page=+block.dataset.page,index=paragraphIndex(block),key=`${page}:${index}`;let anchor=overlay.querySelector(`[data-reader-speaker-key="${key}"]`);
 if(!anchor){anchor=document.createElement('span');anchor.className='docsReaderSpeakerAnchor';anchor.dataset.readerSpeakerKey=key;overlay.append(anchor);}
 anchor.toggleAttribute('data-source-hover',pdfSpeakerHoverKey===key);
 return anchor;
}
function positionNativeSpeaker(block,speaker,geometry){
 if(V.mode!=='orig'||V.doc?.type!=='pdf'||!geometry?.anchor?.rect)return false;
 const anchor=geometry.anchor,host=speaker.parentElement,overlay=host?.parentElement;if(!host?.classList.contains('docsReaderSpeakerAnchor')||!overlay?.classList.contains('docsReaderSpeakerOverlay'))return false;
 const bounds=overlay.getBoundingClientRect(),width=18,height=18,gap=3,text=anchor.rect;
 let left=anchor.direction==='rtl'?text.left-width-gap:text.right+gap,top=text.top+(text.height-height)/2;
 left=Math.max(bounds.left,Math.min(bounds.right-width,left));top=Math.max(bounds.top,Math.min(bounds.bottom-height,top));
 host.style.left=(left-bounds.left+overlay.scrollLeft-overlay.clientLeft)+'px';host.style.top=(top-bounds.top+overlay.scrollTop-overlay.clientTop)+'px';
 speaker.style.left='0px';speaker.style.top='0px';return true;
}
function nativeSpeakerGeometry(block){
 if(V.mode!=='orig'||V.doc?.type!=='pdf'||!block)return null;
 const page=+block.dataset.page,index=paragraphIndex(block),spans=$$(`#pageStack>[data-page="${page}"] .docsSource .para[data-paragraph-index="${index}"]`),rects=spans.map(el=>textBoxRect(el)).filter(rect=>rect.width>0&&rect.height>0);if(!rects.length)return null;
 let last=null;
 for(const span of spans){const root=span.querySelector('.en');if(!root)continue;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode,text=node.textContent||'';let end=text.length;while(end>0&&/\s/u.test(text[end-1]))end--;if(!end)continue;let start=end-1;if(start>0&&/[\uDC00-\uDFFF]/u.test(text[start])&&/[\uD800-\uDBFF]/u.test(text[start-1]))start--;const range=document.createRange();range.setStart(node,start);range.setEnd(node,end);const rect=range.getBoundingClientRect();if(rect.width||rect.height)last={rect,direction:getComputedStyle(node.parentElement||span).direction};}}
 if(!last)return null;
 const left=Math.min(...rects.map(rect=>rect.left)),top=Math.min(...rects.map(rect=>rect.top)),right=Math.max(...rects.map(rect=>rect.right)),bottom=Math.max(...rects.map(rect=>rect.bottom));
 return{anchor:last,bounds:{left,top,right,bottom,width:right-left,height:bottom-top}};
}
function showReaderParagraphHighlight(block){
 clearReaderParagraphHighlight();if(V.mode!=='orig'||V.doc?.type!=='pdf'||!block)return;
 const page=+block.dataset.page,index=paragraphIndex(block),source=block.closest('.docsSource');if(!page||!source)return;
 const spans=$$(`#pageStack>[data-page="${page}"] .docsSource .para[data-paragraph-index="${index}"]`),sourceRect=source.getBoundingClientRect(),scale=sourceRect.width/Math.max(1,source.offsetWidth),box=readerParagraphHighlightBox(spans.map(el=>textBoxRect(el)),sourceRect,scale);if(!box)return;
 const highlight=document.createElement('div');highlight.className='docsReaderParagraphHighlight';highlight.setAttribute('aria-hidden','true');
 highlight.style.left=box.left+'px';highlight.style.top=box.top+'px';highlight.style.width=box.width+'px';highlight.style.height=box.height+'px';source.append(highlight);
}
let nativeReaderVisible=false;
function nativeReaderState(state){
 if(!V.doc)return;
 const visible=!!state.visible,visibilityChanged=visible!==nativeReaderVisible;
 nativeReaderVisible=visible;
 $('#viewer').classList.toggle('ttsOn',visible);$('[data-t="tts"]').classList.toggle('on',!!state.reading);
 const padding=visible?(matchMedia('(pointer:coarse)').matches?'120px':'170px'):'';
 if($('#stage').style.paddingBottom!==padding)$('#stage').style.paddingBottom=padding;
 if(visibilityChanged){fitToolbar();if(!visible)wakePager();}
 if(!state.reading)clearReaderParagraphHighlight();
}
async function refreshNativeSource(){if(!V.doc)return;await LHN_DOCUMENT_CONTEXT.refresh();}
LHN_DOCUMENT_CONTEXT.attach({
 active:()=>!!activeEngine&&$('#viewer').classList.contains('show'),url:documentUrl,title:()=>V.doc?.name||document.title,hostname:()=> 'Keepit',thumbnail:()=>V.doc?.thumbnail||'',root:()=>$('#stage'),
 containsRange:range=>{if(!activeEngine||!$('#viewer').classList.contains('show')||!$('#stage').contains(range.commonAncestorContainer))return false;
  /* v3.5.485: PDF có span chữ nằm thẳng dưới .pdfTextLayer (không có .en/.para) → vẫn phải cho chọn chữ. */
  const node=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;
  return !!node?.closest('.en')||!!node?.closest('[data-page]');},
 sentenceContext:range=>{const el=range?.startContainer?.nodeType===1?range.startContainer:range?.startContainer?.parentElement;return readerTextForBlock(el?.closest('.para'));},
 anchorFor:sourceAnchor,findRanges:annotationRanges,onAnnotations:items=>void syncAnnotationCounts(items),
 async revealAnnotation(item){const page=item?.documentAnchor?.page;if(page&&V.doc?.id===item.documentAnchor.documentId){await setPage(page);await ensurePage(page);}},
 applyPageShrink(width){if(!matchMedia('(pointer:coarse) and (hover:none)').matches){nativeNoteWidth=width;$('#viewer').style.right=width+'px';}},
 restorePageWidth(){nativeNoteWidth=0;$('#viewer').style.right='';},
 onSidebar(element,open,width,close){nativeNotesOpen=!!open;$('[data-t="notes"]').classList.toggle('on',!!open);if(element&&matchMedia('(pointer:coarse) and (hover:none)').matches)LHN_SIDEBAR.attachTouchSheet(element,{close});},
 readerBlocks:nativeBlocks,readerBlocksForTarget:nativeBlocksForTarget,readerText:readerTextForBlock,readerSpeakerGeometry:nativeSpeakerGeometry,readerSpeakerHost:nativeSpeakerHost,positionReaderSpeaker:positionNativeSpeaker,readerFontAllowed:()=>V.mode==='read',readerSpeakersAllowed:()=>V.mode==='read'||(V.doc?.type==='pdf'&&V.mode==='orig'),
 readerCard(block){const entry=nativeCards.get(cardKey(block));if(entry){entry.block=block;if(V.mode==='read'&&entry.card.parentElement!==block)mountNativeCard(block,entry.card);else if(V.mode==='orig'&&V.tools.has('translate')&&!entry.card.closest('#transList'))mountNativeCard(block,entry.card);}return entry?.card||null;},readerBlockForCard:cardBlock,mountReaderCard:mountNativeCard,readerTargetLanguage:()=>panelPrefs.language,
 async readerNextPage(direction,reference){if(!activeEngine||V.mode==='read')return false;const from=+(reference?.dataset.page||V.page);let page=from+Math.sign(direction);while(page>=1&&page<=V.doc.pages&&!sourceEntries(page).length)page+=Math.sign(direction);if(page<1||page>V.doc.pages)return false;await setPage(page,true);await ensurePage(page);return true;},
 onReaderBlock(block){const page=+block.dataset.page;if(page&&page!==V.page){V.page=page;updatePaging();savePosition();applyTools();}showReaderParagraphHighlight(block);},onReaderState:nativeReaderState,
 openSettings:()=>parent.postMessage({type:'KEEPIT_DOCUMENTS_SETTINGS',tab:'bilingualReader'},location.origin)
});
// Reuse the real Keepit main sheet in the Documents page; only adapt its anchor and document-context options.
const keepitBarHooks=globalThis.LHN_BAR_HOOKS||{};
globalThis.LHN_BAR_HOOKS=Object.freeze({...keepitBarHooks,openMainSheet:(fromRect,options={})=>keepitBarHooks.openMainSheet?.(fromRect,{...options,documents:true,focusReader:options.focusReader??true}),translateOffline:()=>toast(t('trError'))});

$('#stage').addEventListener('pointerdown',e=>{if(!isFacing())return;const frame=e.target.closest('.pageFrame[data-page]');if(frame&&+frame.dataset.page!==V.page)setActivePage(+frame.dataset.page);},{passive:true});
$('#viewer').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b||b.disabled)return;setMore(false,false);if(b.dataset.t==='notes'){void openNativeNotes();return;}if(b.dataset.t==='ai'){void LHN_CONTENT_TOOLS.askAI();return;}if(b.dataset.t==='tts'){void runViewerAction('read');return;}if(b.dataset.t==='wc'){void toggleWordClass().catch(()=>toast(t('wcError')));return;}if(b.dataset.t==='translate')runViewerAction('translate');});
for(const header of $$('.side2 header')){let y=null;header.addEventListener('touchstart',e=>{y=e.target.closest('button,select,input')?null:e.touches[0].clientY;},{passive:true});header.addEventListener('touchend',e=>{if(y!==null&&matchMedia('(orientation:portrait)').matches&&e.changedTouches[0].clientY-y>55&&V.panel)setPanel(V.panel);y=null;},{passive:true});}
$('#lgClose').onclick=()=>$('#legend').classList.remove('on');
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.fullscreenElement){e.preventDefault();void document.exitFullscreen();return;}if(['ArrowLeft','ArrowRight'].includes(e.key)&&$('#viewer').classList.contains('show')&&V.doc&&!e.defaultPrevented&&!e.isComposing&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&$('#vMorePanel').hidden&&!$('.modalWrap.show')&&!e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="separator"],[role="slider"],[role="spinbutton"],[id^="lhn-"],[data-lhn-bilingual-ui]')){e.preventDefault();navigateStep(e.key==='ArrowRight'?1:-1);wakePager();return;}if(e.key==='Escape'&&!$('#vMorePanel').hidden){e.preventDefault();setMore(false);return;}if(e.key!=='Escape'||e.target.closest('input,textarea,[id^="lhn-"],[data-lhn-bilingual-ui]')||$('.modalWrap.show'))return;if($('#viewer').classList.contains('show')){if(V.panel)setPanel(V.panel);else void closeViewer();}});

/* v3.5.520: gọi hiệu ứng hiện dần của Dashboard (định nghĩa duy nhất ở css/shared/dashboard-reveal.css)
   cho 3 khối lớn của thư viện. Gỡ class → ép tính lại → gắn lại, nên mỗi lần mở tab là chạy lại một lần. */
function revealLibrary(){
  const blocks=[...document.querySelectorAll('.main>.row,.main>.panel.drop,.main>.lib')];
  if(!blocks.length)return;
  for(const block of blocks){
    block.classList.remove('dashboard-reveal');
    block.style.removeProperty('--ov-reveal-delay');
  }
  void document.body.offsetWidth;
  blocks.forEach((block,index)=>{
    block.style.setProperty('--ov-reveal-delay',`${100+index*80}ms`);
    block.classList.add('dashboard-reveal');
  });
}

async function boot(){
 try{const data=await api.storage.local.get([PREF_KEY,FLOW_KEY,PAGER_KEY,TOP_COMPACT_KEY,RAIL_KEY,'lhnSettings']),pref=data[PREF_KEY]||{};const savedRail=data[RAIL_KEY];if(savedRail&&typeof savedRail.visible==='boolean')railPrefs.visible=savedRail.visible;if(Number.isFinite(savedRail?.width))railPrefs.width=Math.max(1,Math.min(360,savedRail.width));applyRail();if(FLOWS.includes(data[FLOW_KEY]||pref.flow))lastFlow=data[FLOW_KEY]||pref.flow;if(PAGER_MODES.includes(data[PAGER_KEY]))pagerMode=data[PAGER_KEY];applyPagerMode();applyTopCompact(data[TOP_COMPACT_KEY]);if(typeof pref.follow==='boolean')panelPrefs.follow=pref.follow;if(typeof pref.language==='string'&&/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$/.test(pref.language))panelPrefs.language=pref.language;else panelPrefs.language=LHN_LANGUAGES.languageFor(data.lhnSettings||{});for(const key of['translation','notes'])if(Number.isFinite(pref.widths?.[key])&&pref.widths[key]>=100&&pref.widths[key]<=640)panelPrefs.widths[key]=pref.widths[key];await syncSettings();await Store.open();await Store.clearObsoleteTranslationCache();await refreshLibrary();revealLibrary();
 /* Bộ công cụ chọn chữ (content.js) có thể gắn sau boot: đợi nó có mặt rồi mới cho mở tệp. */
 if(globalThis.LHN_CONTENT_TOOLS)requestAnimationFrame(()=>requestAnimationFrame(bootResolve));
 else{const t0=Date.now();const waitTools=()=>{if(globalThis.LHN_CONTENT_TOOLS||Date.now()-t0>1500)requestAnimationFrame(()=>requestAnimationFrame(bootResolve));else setTimeout(waitTools,20);};waitTools();}
 const params=new URL(location.href).searchParams,key=params.get('document'),pdfUrl=params.get('openPdf'),pdfHelp=params.get('pdfHelp');if(pdfUrl||pdfHelp){const clean=new URL(location.href);clean.searchParams.delete('openPdf');clean.searchParams.delete('pdfHelp');history.replaceState(history.state,'',clean.href);if(pdfHelp==='file-access')showPdfFallback(true);else await openPdfFromUrl(pdfUrl||'',false);}else if(validDocumentKey(key)){const file=docs.find(d=>d.sourceKey===key||d.id===key);if(file){await openViewer(file.id);const note=params.get('highlight');if(note){const item=await LHN_MESSAGING.sendMessage({type:'GET_ONE',id:note});await LHN_PAGE_CONTEXT.revealAnnotation(item);await LHN_CONTENT_TOOLS.restore();}}}}catch(error){showError(error);}finally{document.documentElement.classList.remove('documents-loading');bootResolve();}
}
LHN_MESSAGING.onMessage.addListener(message=>{if(message?.type==='ANNOTATIONS_CHANGED'&&!$('#viewer').classList.contains('show'))void refreshLibrary();});
api.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.lhnSettings)void syncSettings();if(area==='local'&&changes[FLOW_KEY]&&FLOWS.includes(changes[FLOW_KEY].newValue))setFlow(changes[FLOW_KEY].newValue,false);if(area==='local'&&changes[RAIL_KEY]){const r=changes[RAIL_KEY].newValue;railPrefs={width:Number.isFinite(r?.width)?Math.max(1,Math.min(360,r.width)):112,visible:typeof r?.visible==='boolean'?r.visible:null};applyRail();}if(area==='local'&&changes[TOP_COMPACT_KEY])applyTopCompact(changes[TOP_COMPACT_KEY].newValue);if(area==='local'&&changes[PAGER_KEY]){pagerMode=PAGER_MODES.includes(changes[PAGER_KEY].newValue)?changes[PAGER_KEY].newValue:'dim';applyPagerMode();}});matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>void syncSettings());Store.changes?.addEventListener('message',()=>{if(!$('#viewer').classList.contains('show'))void refreshLibrary();});
addEventListener('message',event=>{if(event.source===parent&&event.origin===location.origin&&event.data?.type==='KEEPIT_DOCUMENTS_SUSPEND'){ttsStop();if($('#viewer').classList.contains('show'))void closeViewer();}});
addEventListener('pagehide',()=>{ttsStop();clearTimeout(savePositionTimer);if(V.doc)void Store.patch(V.doc.id,{at:V.page,opened:Date.now()});activeEngine?.dispose();});
globalThis.KeepitDocuments=Object.freeze({importFiles,open:openViewer,close:closeViewer,get state(){return {documentId:V.doc?.id,page:V.page,mode:V.mode,flow:V.flow,zoom:V.zoom,panel:V.panel,files:docs.length};}});
/* v3.5.431: Dashboard vẽ thư viện và ra lệnh; khung chỉ mở tệp và nhập tệp. */
if(EMBEDDED)addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin)return;
 const data=event.data||{};
 if(data.type==='KEEPIT_DOCUMENTS_OPEN'&&typeof data.id==='string'&&data.id){
  void openViewer(data.id,data.mode==='read'?'read':'orig').catch(()=>toast(t('storageFailed')));
  return;
 }
 if(data.type==='KEEPIT_DOCUMENTS_IMPORT_CANCEL'){++importCycle;showModal('#openWrap',false);return;}
 if(data.type==='KEEPIT_DOCUMENTS_IMPORT_FILES'&&Array.isArray(data.files)&&data.files.length){
  void (async()=>{
   // v3.5.478: importFiles tự đếm số tài liệu mới / bị trùng / lỗi — không nuốt lỗi nữa,
   // để Dashboard báo đúng "vì sao 0 tài liệu" thay vì chỉ hiện con số 0.
   let result={added:0,skipped:0,error:''};
   try{result=(await importFiles(data.files))||result;}
   catch(error){result={added:0,skipped:0,error:String(error?.message||'')};}
   /* v3.5.498: gửi kèm id tệp vừa mở để Dashboard mở lại bằng ?document= (đường lớp chữ dựng đúng). */try{parent.postMessage({type:'KEEPIT_DOCUMENTS_IMPORTED',count:result.added||0,skipped:result.skipped||0,error:result.error||'',documentId:(V.doc&&V.doc.id)||''},location.origin);}catch{}
  })();
 }
});
void boot();
})();
