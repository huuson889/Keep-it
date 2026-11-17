const $=id=>document.getElementById(id),LANGUAGES=globalThis.LHN_LANGUAGES;
const params=new URL(location.href).searchParams,sourceTabId=Number(params.get('sourceTabId')),pdfUrl=params.get('pdfUrl')||'';
function pdfSourceUrl(value,depth=0){try{const u=new URL(value);if(['http:','https:','file:'].includes(u.protocol)&&/\.pdf$/i.test(decodeURIComponent(u.pathname))){u.hash='';return u.href;}if(depth>=2||!['chrome-extension:','moz-extension:','chrome:'].includes(u.protocol))return '';for(const key of['src','file','url','originalUrl']){const inner=u.searchParams.get(key),found=inner&&pdfSourceUrl(inner,depth+1);if(found)return found;}}catch{}return '';}
function closeIfSourceChanged(tabId,url){if(tabId!==sourceTabId)return;if(pdfSourceUrl(url)!==pdfUrl)window.close();}
async function init(){
  if(!Number.isInteger(sourceTabId)||sourceTabId<0||!pdfSourceUrl(pdfUrl)){window.close();return;}
  let lang='en';
  try{const data=await browser.storage.local.get('lhnSettings'),settings=data.lhnSettings||{};lang=LANGUAGES.languageFor(settings);const dark=settings.sidebarTheme==='dark'||(settings.sidebarTheme!=='light'&&!!matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch{}
  document.documentElement.lang=lang;document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=LANGUAGES.t(el.dataset.i18n,{},lang));
  let filename='PDF';try{filename=decodeURIComponent(new URL(pdfUrl).pathname.split('/').pop()||'PDF');}catch{}
  $('pdfName').textContent=filename;$('pdfName').title=filename;$('pdfHint').setAttribute('aria-label',LANGUAGES.t('pdfFloatingTitle',{},lang)+' · '+filename);
  $('pdfHint').addEventListener('click',async()=>{
    let fileAccessDenied=false;
    if(pdfUrl.startsWith('file:')&&typeof browser.extension?.isAllowedFileSchemeAccess==='function')try{fileAccessDenied=!(await browser.extension.isAllowedFileSchemeAccess());}catch{}
    try{await browser.runtime.sendMessage({type:'OPEN_DASHBOARD_DOCUMENTS',sourceTabId,pdfUrl,fileAccessDenied});window.close();}
    catch(error){console.warn('Could not open PDF in Keepit',error);$('pdfHint').disabled=true;setTimeout(()=>window.close(),700);}
  });
  browser.tabs.onUpdated.addListener((tabId,changeInfo,tab)=>{if(tabId===sourceTabId)closeIfSourceChanged(tabId,changeInfo.url||tab?.url||'');});
  browser.tabs.onActivated.addListener(async({tabId})=>{if(tabId===sourceTabId)return;try{const tab=await browser.tabs.get(tabId),own=browser.runtime.getURL('pages/pdf-suggestion.html');if(tab.url?.split(/[?#]/,1)[0]!==own)window.close();}catch{window.close();}});
  setTimeout(()=>window.close(),18000);
}
void init();
