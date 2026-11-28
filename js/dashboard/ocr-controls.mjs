/* Document numeric faces and OCR fields share Keepit's native list renderer.
 * Original numeric inputs remain the authoritative models used by the viewer/engine. */
export function bindDocumentControls({total,clamp}){
 const id=n=>document.getElementById(n),components=[],$=s=>document.querySelector(s);
 const range=input=>{
  if(!['ko-from','ko-to'].includes(input.id))return;
  const radio=$('[name="ko-scopePick"][value="range"]');
  if(!radio.checked){radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}
 };
 function numeric(input){
  input.classList.add('editablePageInput');input.inputMode='numeric';input.autocomplete='off';
  const model=document.createElement('select');model.id=input.id+'ListModel';model.setAttribute('aria-label',input.getAttribute('aria-label')||'');input.before(model);
  const native=LHN_ICONS.createFlowSelect(model,input.id==='pNum'?'up':'down',false),wrap=native.element;wrap.classList.add('editablePage');wrap.append(input);
  const button=wrap.querySelector('button');button.setAttribute('role','button');let count=0,committed=input.value;
  input.setAttribute('role','combobox');input.setAttribute('aria-haspopup','listbox');input.setAttribute('aria-controls',model.id+'-options');
  for(const type of ['pointerdown','focusin','click'])wrap.addEventListener(type,()=>range(input),true);
  const sync=()=>{
   const n=Math.max(1,total());if(count!==n){const frag=document.createDocumentFragment();for(let k=1;k<=n;k++)frag.append(new Option(String(k),String(k)));model.replaceChildren(frag);count=n;}
   model.value=String(input.value);model.disabled=input.disabled;model.setAttribute('aria-label',input.getAttribute('aria-label')||'');native.refresh();button.disabled=input.disabled;
   committed=input.value;input.setAttribute('aria-expanded',button.getAttribute('aria-expanded'));input.removeAttribute('aria-invalid');
  };
  const commit=normalize=>{
   if(input.value===committed)return;
   const raw=input.value.trim(),value=Number(raw),n=total();range(input);
   if(!raw||!Number.isInteger(value)||value<1||value>n){if(!normalize){input.setAttribute('aria-invalid','true');return;}input.value=raw&&Number.isFinite(value)?String(Math.max(1,Math.min(n,Math.round(value)))):committed;}
   if(input.id!=='pNum')clamp(input.id==='ko-from');
   input.dispatchEvent(new Event('change',{bubbles:true}));sync();
  };
  input.addEventListener('input',()=>commit(false));input.addEventListener('blur',()=>commit(true));input.addEventListener('focus',()=>input.select());
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit(true);native.close();}if(e.key==='Escape'){input.value=committed;input.removeAttribute('aria-invalid');}});
  model.addEventListener('change',()=>{range(input);input.value=model.value;if(input.id!=='pNum')clamp(input.id==='ko-from');input.dispatchEvent(new Event('change',{bubbles:true}));sync();});
  new MutationObserver(()=>input.setAttribute('aria-expanded',button.getAttribute('aria-expanded'))).observe(button,{attributes:true,attributeFilter:['aria-expanded']});
  components.push({...native,refresh:sync});sync();
 }
 for(const name of ['ko-from','ko-to','pNum'])numeric(id(name));
 for(const name of ['ko-ocrOutput','ko-ocrRes','ko-ppScale','ko-threads','ko-fusorMethod']){
  const select=id(name),native=LHN_ICONS.createFlowSelect(select,'down',false);native.element.classList.add('ocrResultSelect');
  const refresh=()=>{select.setAttribute('aria-label',document.querySelector('label[for="'+name+'"]').textContent.trim());native.refresh();const b=native.element.querySelector('button');b.disabled=select.disabled;native.element.inert=select.disabled;if(select.disabled)native.close();};
  components.push({...native,refresh});refresh();
 }
 document.addEventListener('document-select-visibility',e=>{
  if(!e.detail.open)return;for(const c of components)if(c.element!==e.target)c.close();
  const wrap=e.target,list=wrap.querySelector('.flow-select-list'),trigger=wrap.querySelector('.flow-select-trigger'),clip=wrap.closest('.ocrBody,.moreBody');if(!list||!clip)return;
  if(wrap.classList.contains('ocrResultSelect')){
   wrap.dataset.direction='down';const need=Math.min(224,list.scrollHeight),bottom=Math.min(innerHeight,clip.getBoundingClientRect().bottom),missing=need+6-(bottom-trigger.getBoundingClientRect().bottom);if(missing>0)clip.scrollTop+=missing;
   list.style.maxHeight=Math.max(36,Math.min(224,Math.min(innerHeight,clip.getBoundingClientRect().bottom)-trigger.getBoundingClientRect().bottom-6))+'px';
  }else{const r=trigger.getBoundingClientRect(),c=clip.getBoundingClientRect(),above=r.top-Math.max(0,c.top)-5,below=Math.min(innerHeight,c.bottom)-r.bottom-5;wrap.dataset.direction=above>below?'up':'down';list.style.maxHeight=Math.max(36,Math.min(224,above>below?above:below))+'px';}
 });
 const api=Object.freeze({refresh(){for(const c of components)c.refresh();},close(){for(const c of components)c.close();}});globalThis.KeepitDocumentControls=api;return api;
}
