/* Localization uses ONLY the common languages.js catalogue.
 * Canonical demo strings are retained so switching app language is reversible,
 * without translating document text, recognized words, or engine protocol status. */
export function bindOcrLocalization(){
 const catalog=globalThis.LHN_LANGUAGES,baseline=new WeakMap(),rendered=new WeakMap();
 const specs=Object.entries(catalog.MESSAGES.vi).filter(([key])=>key.startsWith('ocr_')).map(([key,text])=>{
  const fields=[];const pattern=String(text).split(/(\{\w+\})/).map(part=>{if(/^\{\w+\}$/.test(part)){fields.push(part.slice(1,-1));return '(.+?)';}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');
  return{key,text,fields,re:new RegExp('^'+pattern+'$')};
 }).sort((a,b)=>a.fields.length-b.fields.length);
 function translate(text,language,depth=0){
  if(language==='vi'||depth>2)return text;
  const value=text.trim();if(!value)return text;
  for(const spec of specs){const match=value.match(spec.re);if(!match)continue;const vars={};spec.fields.forEach((name,i)=>{vars[name]=name==='hint'?translate(match[i+1],language,depth+1):match[i+1];});return text.replace(value,catalog.t(spec.key,vars,language));}
  if(value.includes(' + '))return text.replace(value,value.split(' + ').map(x=>translate(x,language,depth+1)).join(' + '));
  return text;
 }
 let queued=false;
 function apply(){
  queued=false;const language=document.documentElement.lang||'en';
  const roots=[...document.querySelectorAll('[data-ocr-root]'),document.getElementById('ko-vOcr'),document.getElementById('ko-moreOcr'),document.getElementById('ko-moreResults'),document.getElementById('ko-selectRegion'),document.getElementById('toast')].filter(Boolean);
  for(const root of roots){
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode()){
    const node=walker.currentNode;if(node.parentElement?.closest('#ko-status,textarea,script,style'))continue;
    if(!baseline.has(node)||node.data!==rendered.get(node))baseline.set(node,node.data);
    const text=translate(baseline.get(node),language);if(node.data!==text)node.data=text;rendered.set(node,text);
   }
   for(const el of [root,...root.querySelectorAll('[title],[aria-label],[placeholder]')]){
    const attrs=baseline.get(el)||{},last=rendered.get(el)||{};
    for(const key of ['title','aria-label','placeholder'])if(el.hasAttribute(key)){
     const value=el.getAttribute(key);if(!(key in attrs)||value!==last[key])attrs[key]=value;
     const text=translate(attrs[key],language);if(value!==text)el.setAttribute(key,text);last[key]=text;
    }
    baseline.set(el,attrs);rendered.set(el,last);
   }
  }
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(apply);}}
 const observer=new MutationObserver(schedule);
 for(const root of document.querySelectorAll('[data-ocr-root],#toast'))observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});apply();return text=>translate(String(text),document.documentElement.lang||'en');
}
