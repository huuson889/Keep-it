(()=>{
const colorNames={yellow:'Vàng',green:'Xanh lá',purple:'Tím',red:'Đỏ',blue:'Xanh dương',orange:'Cam'};
const labels={en:{dataBadge:'KEEPIT DATA',exportAll:'Export all',exportPage:'Export this page',favoriteNotes:'Favorites',emptyFilteredTitle:'No matching sources',emptyFilteredText:'Try adjusting or clearing the filters to see saved annotations.',emptyDataTitle:'No highlights yet',emptyDataText:'Highlights you save in Keepit will appear here.',noColorMatches:'No highlights match these filters.',noTags:'No tags in this selection.',noSources:'No source pages in this selection.',clearFilters:'Filters cleared.',chooseSource:'Select a source page first.',pageFavoriteAdded:'Page added to favorites.',pageFavoriteRemoved:'Page removed from favorites.',noteFavoriteAdded:'Note added to favorites.',noteFavoriteRemoved:'Note removed from favorites.',statsAll:'Based on your entire local library',statsFiltered:'Based on the filtered results',statsCaption:'LOCAL ANNOTATION SUMMARY',genericError:'Could not complete the action. Please try again.'},vi:{dataBadge:'DỮ LIỆU KEEPIT',exportAll:'Xuất toàn bộ',exportPage:'Xuất trang này',favoriteNotes:'Yêu thích',emptyFilteredTitle:'Không có trang phù hợp',emptyFilteredText:'Thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem các ghi chú đã lưu.',emptyDataTitle:'Chưa có highlight nào',emptyDataText:'Khi bạn lưu highlight trong Keepit, các ghi chú sẽ xuất hiện ở đây.',noColorMatches:'Không có highlight phù hợp bộ lọc.',noTags:'Chưa có thẻ trên dữ liệu đang chọn.',noSources:'Chưa có trang nguồn trong dữ liệu đang chọn.',clearFilters:'Đã xóa bộ lọc.',chooseSource:'Chọn trang nguồn trước.',pageFavoriteAdded:'Đã thêm trang vào yêu thích.',pageFavoriteRemoved:'Đã bỏ yêu thích trang.',noteFavoriteAdded:'Đã yêu thích ghi chú.',noteFavoriteRemoved:'Đã bỏ yêu thích ghi chú.',statsAll:'Tính trên toàn bộ thư viện cục bộ',statsFiltered:'Tính trên tập đang lọc',statsCaption:'TỔNG HỢP TỪ ANNOTATION CỤC BỘ',genericError:'Không thể hoàn tất thao tác. Vui lòng thử lại.'},ko:{dataBadge:'KEEPIT 데이터',exportAll:'모두 내보내기',exportPage:'이 페이지 내보내기',favoriteNotes:'즐겨찾기',emptyFilteredTitle:'일치하는 페이지가 없습니다',emptyFilteredText:'필터를 조정하거나 지워 저장된 주석을 확인하세요.',emptyDataTitle:'하이라이트가 없습니다',emptyDataText:'Keepit에 저장한 하이라이트가 여기에 표시됩니다.',noColorMatches:'필터와 일치하는 하이라이트가 없습니다.',noTags:'선택한 데이터에 태그가 없습니다.',noSources:'선택한 데이터에 소스 페이지가 없습니다.',clearFilters:'필터를 지웠습니다.',chooseSource:'먼저 소스 페이지를 선택하세요.',pageFavoriteAdded:'페이지를 즐겨찾기에 추가했습니다.',pageFavoriteRemoved:'페이지를 즐겨찾기에서 삭제했습니다.',noteFavoriteAdded:'메모를 즐겨찾기에 추가했습니다.',noteFavoriteRemoved:'메모를 즐겨찾기에서 삭제했습니다.',statsAll:'전체 로컬 라이브러리 기준',statsFiltered:'필터링된 결과 기준',statsCaption:'로컬 주석 데이터 요약',genericError:'작업을 완료할 수 없습니다. 다시 시도해 주세요.'}};
const iconPaths={
 file:'<path d="M5 3.5h9l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20z"/><path d="M14 3.5V9h5M8 13h8M8 16.5h8"/>',
 square:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>',
 list:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7M14 9h7M14 15h7M14 20h7"/>',
 external:'<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
 edit:'<path d="m16 4 4 4"/><path d="M4 20l4-.8L19.5 7.7a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
 volume:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
 heart:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>',
 export:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'
};
const icon=name=>`<svg class="lucide" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||''}</svg>`;
const $=id=>document.getElementById(id), sourceList=$('sourceList'), notesList=$('notesList'), pageCount=$('pageCount'), count=$('count'), toast=$('libraryDemoToast');
const text=key=>(labels[currentLanguage]||labels.vi)[key]||labels.vi[key]||key;
function applyNewLabels(){ document.documentElement.lang=currentLanguage;$('lrDataBadge').textContent=text('dataBadge');$('exportAllText').textContent=text('exportAll');$('exportAllDemoBtn').setAttribute('aria-label',text('exportAll'));$('exportAllDemoBtn').title=text('exportAll');$('statsDataCaption').textContent=text('statsCaption'); }
let pages=[], annotationRecords=[], favorites=[], favoriteNoteIds=new Set(), selected=null, noteColor='all', scope='filtered', period='365', distMode='tags', quickFilter='all', favoriteNotes=false, viewMode='grid', toastTimer, requestSequence=0, currentLanguage='vi';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validColors=['yellow','green','purple','red','blue','orange'];
const colorPalette=[['#9fd8c2','#4e9b80'],['#273c75','#876bd6'],['#f5c2a4','#be7ca7'],['#9ed4e7','#5d89c9'],['#a8a8ed','#655fa6'],['#a9d8c7','#508f9e']];
function playToolbarActionEffect(button,event,color,particleShape){
 if(!button||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const rect=button.getBoundingClientRect(),hasPoint=Number.isFinite(event?.clientX)&&(event.clientX||event.clientY),x=hasPoint?event.clientX:rect.left+rect.width/2,y=hasPoint?event.clientY:rect.top+rect.height/2;
 let layer=$('toolbarActionEffectLayer');
 if(!layer){layer=document.createElement('div');layer.id='toolbarActionEffectLayer';layer.setAttribute('aria-hidden','true');$('dashboardHighlightsNotesView').append(layer)}
 button.classList.remove('toolbar-action-pulse');void button.offsetWidth;button.classList.add('toolbar-action-pulse');
 button.addEventListener('animationend',e=>{if(e.animationName==='favorite-heartbeat')button.classList.remove('toolbar-action-pulse')},{once:true});
 for(let i=0;i<2;i++){const ring=document.createElement('span');ring.className='toolbar-action-ripple-ring';ring.style.setProperty('--effect-color',color);ring.style.left=`${x}px`;ring.style.top=`${y}px`;ring.style.setProperty('--delay',`${i*100}ms`);layer.append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true})}
 for(let i=0;i<10;i++){const particle=document.createElement('span'),angle=Math.PI*2*i/10+(Math.random()-.5)*.45,distance=34+Math.random()*42;particle.className=`toolbar-action-ripple-particle${particleShape==='sparkle'?' is-sparkle':''}`;particle.style.left=`${x}px`;particle.style.top=`${y}px`;particle.style.setProperty('--effect-color',color);particle.style.setProperty('--tx',`${Math.cos(angle)*distance}px`);particle.style.setProperty('--ty',`${Math.sin(angle)*distance}px`);particle.style.setProperty('--turn',`${Math.round((Math.random()-.5)*70)}deg`);particle.innerHTML=particleShape==='sparkle'?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';layer.append(particle);particle.addEventListener('animationend',()=>particle.remove(),{once:true})}
}
function dateMs(value){
 if(value instanceof Date)return value.getTime();
 if(typeof value==='number'&&Number.isFinite(value))return value;
 if(typeof value==='string'&&/^\d{10,}$/.test(value.trim()))return Number(value);
 const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:NaN;
}
function dateKey(value){const date=value instanceof Date?value:new Date(value);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function dateLabel(value){const time=dateMs(value);if(!Number.isFinite(time))return 'Không rõ ngày';const d=new Date(time);return `${d.getDate()} thg ${String(d.getMonth()+1).padStart(2,'0')}, ${d.getFullYear()}`}
function hostnameOf(url,fallback=''){let host='';try{host=new URL(url).hostname}catch{host=String(fallback||'nguồn không rõ')}return host?host[0].toLocaleUpperCase()+host.slice(1):'nguồn không rõ'}
function pageKeyOf(item){return String(item.__keepitPageKey||item.url||item.hostname||item.title||'unknown')}
function normalizedColor(value){return validColors.includes(String(value||'').toLowerCase())?String(value).toLowerCase():'yellow'}
function safeThumbnailUrl(value){if(typeof value!=='string'||!value)return '';try{const url=new URL(value,window.location.href);return ['http:','https:','data:'].includes(url.protocol)?url.href:''}catch{return ''}}
function safePageHref(value){try{const url=new URL(value);return ['http:','https:','file:'].includes(url.protocol)?url.href:'#'}catch{return '#'}}
function setSelectedFavicon(pageUrl){
 const host=$('selectedFavicon');host.innerHTML=icon('file');
 const fallback=host.firstElementChild,img=document.createElement('img');img.alt='';img.hidden=true;host.append(img);
 if(window.LHN_SITE_ICONS)void window.LHN_SITE_ICONS.load(img,pageUrl,{fallbackElement:fallback});
}
function tagsOf(item){const raw=Array.isArray(item.__keepitTags)?item.__keepitTags:Array.isArray(item.tags)?item.tags:typeof item.tags==='string'?item.tags.split(','):[];const seen=new Set();return raw.map(value=>String(value||'').trim()).filter(value=>{const key=value.toLocaleLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true})}
function hashText(text){let hash=0;for(const char of String(text||''))hash=(hash*31+char.charCodeAt(0))|0;return Math.abs(hash)}
function buildPages(items){
 const grouped=new Map();
 for(const item of items){
  if(!item||typeof item!=='object')continue;
  const key=String(item.__keepitPageKey||item.url||item.hostname||item.title||'unknown');
  let page=grouped.get(key);
  if(!page){const site=String(item.__keepitSite||hostnameOf(item.url,item.hostname||''));page={key,url:String(item.url||key),title:String(item.title||site||'Trang không có tiêu đề'),site,thumbnailUrl:safeThumbnailUrl(item.thumbnailUrl),notes:[],colors:[],tags:[],favorite:favorites.includes(key),createdAtMs:Infinity,editedAtMs:0,created:'',edited:'',date:'',thumb:null,highlights:0,noteCount:0};grouped.set(key,page)}
  if((!page.title||page.title===page.site)&&item.title)page.title=String(item.title);
  if(!page.thumbnailUrl&&item.thumbnailUrl)page.thumbnailUrl=safeThumbnailUrl(item.thumbnailUrl);
  const createdAt=dateMs(item.createdAt),updatedAt=dateMs(item.updatedAt);
  if(Number.isFinite(createdAt))page.createdAtMs=Math.min(page.createdAtMs,createdAt);
  if(Number.isFinite(updatedAt))page.editedAtMs=Math.max(page.editedAtMs,updatedAt);
  else if(Number.isFinite(createdAt))page.editedAtMs=Math.max(page.editedAtMs,createdAt);
  const noteTags=tagsOf(item);
  page.notes.push({id:String(item.id||''),quote:String(item.quote||''),note:String(item.note||''),context:String(item.contextNote||''),tags:noteTags,color:normalizedColor(item.color),favorite:favoriteNoteIds.has(String(item.id||'')),createdAt:item.createdAt,updatedAt:item.updatedAt,pageOrder:Number(item.pageOrder)||0});
 }
 for(const page of grouped.values()){
  page.notes.sort((a,b)=>(a.pageOrder-b.pageOrder)||(dateMs(a.createdAt)-dateMs(b.createdAt)));
  page.highlights=page.notes.length;
  page.noteCount=page.notes.filter(note=>note.note.trim()).length;
  page.colors=[...new Set(page.notes.map(note=>note.color))];
  page.tags=[...new Set(page.notes.flatMap(note=>note.tags))];
  page.created=Number.isFinite(page.createdAtMs)?dateLabel(page.createdAtMs):'Không rõ ngày';
  page.edited=page.editedAtMs?dateLabel(page.editedAtMs):page.created;
  page.date=Number.isFinite(page.createdAtMs)?dateKey(page.createdAtMs):'';
  const colors=colorPalette[hashText(page.key)%colorPalette.length];page.thumb=colors;
  page.favorite=favorites.includes(page.key);
 }
 return [...grouped.values()].sort((a,b)=>b.editedAtMs-a.editedAtMs||a.title.localeCompare(b.title));
}
function thumbSvg(page){const [a,b]=page.thumb||colorPalette[0];return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="280" height="150" fill="url(#g)"/><circle cx="221" cy="37" r="23" fill="#fff3cc" opacity=".9"/><path d="M0 117 64 62l49 46 54-57 113 92v7H0z" fill="#213c55" opacity=".55"/><path d="M0 134q55-28 110 0t170 0v16H0z" fill="#152c40" opacity=".55"/><rect x="24" y="25" width="64" height="72" rx="6" fill="#fff7e6" opacity=".92"/><path d="M35 43h41M35 54h35M35 65h39" stroke="#607187" stroke-width="4" stroke-linecap="round" opacity=".7"/></svg>`}
function thumbUrl(page){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(thumbSvg(page))}
function thumbnailSiteLabel(page){return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(page.site)?'YouTube':'Bài viết'}
function thumbnailCategoryLabel(page){return (page.tags.length?page.tags.slice(0,3).join(' · '):page.site).toUpperCase()}
function sourceDescription(page){const quote=page.notes.find(note=>note.quote)?.quote||'';return quote.length>112?`${quote.slice(0,109)}…`:quote}
function sourceDate(page){if(!page.date)return 'Không rõ ngày';const today=dateKey(new Date()),yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);if(page.date===today)return 'Hôm nay';if(page.date===dateKey(yesterday))return 'Hôm qua';const time=dateMs(page.date+'T12:00:00');return Number.isFinite(time)?dateLabel(time):'Không rõ ngày'}
function siteBadge(page){const site=page.site.toLocaleLowerCase();if(/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(site))return '<span class="source-site-icon youtube" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 6 10 6-10 6z"/></svg></span>';if(site==='medium.com')return '<span class="source-site-icon medium" aria-hidden="true">M</span>';if(site==='bbc.co.uk')return '<span class="source-site-icon bbc" aria-hidden="true">BBC</span>';if(site==='nationalgeographic.com')return '<span class="source-site-icon natgeo" aria-hidden="true"><i></i></span>';return `<span class="source-site-icon site-favicon" aria-hidden="true"><img alt="" hidden><span class="site-favicon-fallback">${esc(page.site.slice(0,1).toUpperCase())}</span></span>`}
function loadSiteBadgeFavicon(host,pageUrl){
 const image=host.querySelector('img'),fallback=host.querySelector('.site-favicon-fallback');
 if(!image||!fallback||!window.LHN_SITE_ICONS)return;
 void window.LHN_SITE_ICONS.load(image,pageUrl,{fallbackElement:fallback});
}
function filteredRecords(){
 const q=$('search').value.trim().toLocaleLowerCase('vi'),site=$('siteFilter').value,color=$('colorFilter').value,tag=$('tagFilter').value,date=$('dateFilter').value,now=Date.now();
 return annotationRecords.filter(item=>{
  const key=pageKeyOf(item),itemSite=hostnameOf(item.url,item.hostname||''),tags=tagsOf(item),isNoteFavorite=favoriteNoteIds.has(String(item.id||'')),isPageFavorite=favorites.includes(key);
  const text=[item.title,itemSite,item.url,...tags,item.quote,item.note,item.contextNote].map(value=>String(value||'')).join(' ').toLocaleLowerCase('vi');
  const createdAt=dateMs(item.createdAt),age=Number.isFinite(createdAt)?Math.floor((now-createdAt)/86400000):Infinity;
  const quickMatch=quickFilter==='all'||(quickFilter==='notes'?String(item.note||'').trim().length>0:isPageFavorite);
  return (!q||text.includes(q))&&(!site||itemSite===site)&&(!color||normalizedColor(item.color)===color)&&(!tag||tags.includes(tag))&&(!date||(date==='today'?age===0:age>=0&&age<=Number(date)))&&(!favoriteNotes||isNoteFavorite)&&quickMatch;
 });
}
function allFiltered(){return buildPages(filteredRecords())}
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2400)}
function renderSources(){
 const visible=allFiltered(),order=$('sortBy').value,previousKey=selected?.key;
 visible.sort((a,b)=>order==='count'?b.highlights-a.highlights:order==='edited'?b.editedAtMs-a.editedAtMs:b.createdAtMs-a.createdAtMs);
 selected=visible.find(page=>page.key===previousKey)||visible[0]||null;
 pageCount.textContent=`${visible.length} trang`;
 count.textContent=`${visible.reduce((sum,page)=>sum+page.highlights,0)} ghi chú`;
 sourceList.replaceChildren();
 visible.forEach(page=>{
  const row=document.createElement('article');row.className='source-item'+(page===selected?' active':'');row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',page.title);row.dataset.url=page.key;
  const colors=page.colors.map(color=>`<span class="color-dot ${color}" title="${colorNames[color]||color}"></span>`).join('');
  const tags=page.tags.map(tag=>`<span class="tag-chip">${esc(tag)}</span>`).join('');
  row.innerHTML=`<div class="source-thumb"><img alt="" loading="lazy"><span class="thumb-fallback" aria-hidden="true">${icon('file')}</span><span class="source-thumb-badge"><i class="${thumbnailSiteLabel(page)==='YouTube'?'video':'article'}"></i>${thumbnailSiteLabel(page)}</span><span class="source-thumb-label">${esc(thumbnailCategoryLabel(page))}</span></div><div class="source-info"><div class="source-title">${esc(page.title)}</div><div class="source-host">${siteBadge(page)}<span class="source-host-text">${esc(page.site)}</span></div><div class="source-description">${esc(sourceDescription(page))}</div><div class="source-tags tag-list">${tags}</div><div class="source-meta"><span class="source-date">${esc(sourceDate(page))}</span><span class="source-meta-count">${colors}<span class="source-count-number">${page.highlights}</span><span class="source-count-icon">${icon('square')}</span></span></div></div>`;
  const siteIcon=row.querySelector('.source-site-icon.site-favicon');if(siteIcon)loadSiteBadgeFavicon(siteIcon,page.url);
  const image=row.querySelector('.source-thumb img');image.src=page.thumbnailUrl||thumbUrl(page);image.addEventListener('load',()=>row.querySelector('.thumb-fallback')?.setAttribute('hidden',''),{once:true});image.addEventListener('error',()=>image.remove(),{once:true});if(image.complete&&image.naturalWidth>0)row.querySelector('.thumb-fallback')?.setAttribute('hidden','');
  const choose=()=>{selected=page;noteColor='all';renderSources();renderSelected()};row.addEventListener('click',choose);row.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose()}});sourceList.append(row);
 });
 updateStats(visible);
}
function renderSelected(){
 const header=$('notesHeader'),favoriteButton=$('favoritePageBtn'),exportButton=$('exportPageBtn'),deleteButton=$('deletePageBtn');
 if(!selected){
  $('selectedTitle').textContent='Chọn trang nguồn';$('selectedUrl').textContent='';$('selectedUrl').href='#';$('selectedMeta').textContent='';$('selectedFavicon').innerHTML=icon('file');notesList.replaceChildren();$('noteColorFilters').hidden=true;
  const hasData=annotationRecords.length>0;$('selectPrompt').hidden=true;$('empty').hidden=false;
  if(hasData){$('empty').querySelector('h2').textContent=text('emptyFilteredTitle');$('empty').querySelector('p').textContent=text('emptyFilteredText')}
  else{$('empty').querySelector('h2').textContent=text('emptyDataTitle');$('empty').querySelector('p').textContent=text('emptyDataText')}
  favoriteButton.disabled=true;exportButton.disabled=true;deleteButton.disabled=true;return;
 }
 header.classList.remove('no-selection');$('selectPrompt').hidden=true;$('empty').hidden=true;$('selectedTitle').textContent=selected.title;$('selectedUrl').textContent=selected.url;$('selectedUrl').href=safePageHref(selected.url);
 setSelectedFavicon(selected.url);
 $('selectedMeta').textContent=`Ngày tạo: ${selected.created} · Ngày sửa: ${selected.edited} · ${selected.highlights} highlights`;
 favoriteButton.disabled=false;favoriteButton.classList.toggle('is-favorite',selected.favorite);favoriteButton.setAttribute('aria-pressed',String(selected.favorite));favoriteButton.innerHTML=icon('heart');
 exportButton.disabled=false;deleteButton.disabled=selected.notes.length===0;$('noteColorFilters').hidden=false;renderColorFilters();
 let items=selected.notes.filter(note=>noteColor==='all'||note.color===noteColor);if(favoriteNotes)items=items.filter(note=>note.favorite);
 const q=$('search').value.trim().toLocaleLowerCase('vi');if(q)items=items.filter(note=>`${note.quote} ${note.note} ${note.context} ${note.tags.join(' ')}`.toLocaleLowerCase('vi').includes(q));
 notesList.replaceChildren();items.forEach(item=>{
  const card=document.createElement('article');card.className='lhn-sidebar-card card';card.dataset.noteId=item.id;card.classList.toggle('has-note-favorite',item.favorite);
  const tags=item.tags.map(tag=>`<span class="tag-chip">${esc(tag)}</span>`).join('');
  card.innerHTML=`${item.favorite?`<button class="note-favorite-corner" data-action="favorite-note" title="Bỏ yêu thích" aria-label="Bỏ yêu thích">${icon('heart')}</button>`:''}<div class="lhn-sidebar-quote-row"><span class="lhn-sidebar-swatch lhn-swatch-${esc(item.color)}"></span><div class="lhn-sidebar-quote">${esc(item.quote)}</div></div><div class="lhn-sidebar-note">${esc(item.note||'Chưa có ghi chú.')}</div>${item.context?`<div class="lhn-sidebar-context-note">${esc(item.context)}</div>`:''}${tags?`<div class="tag-list">${tags}</div>`:''}<div class="lhn-sidebar-actions card-actions"><button class="lhn-side-btn" data-action="jump" title="Đi tới highlight" aria-label="Đi tới highlight">${icon('external')}</button><button class="lhn-side-btn" data-action="edit" title="Sửa" aria-label="Sửa">${icon('edit')}</button><button class="lhn-side-btn" data-action="delete" title="Xóa" aria-label="Xóa">${icon('trash')}</button><button class="lhn-side-btn" data-action="speak" title="Đọc highlight" aria-label="Đọc highlight">${icon('volume')}</button><button class="lhn-side-btn note-favorite-btn${item.favorite?' is-favorite':''}" data-action="favorite-note" title="${item.favorite?'Bỏ yêu thích':'Yêu thích ghi chú'}" aria-label="${item.favorite?'Bỏ yêu thích':'Yêu thích ghi chú'}">${icon('heart')}</button></div>`;
  notesList.append(card);
 });
 if(!items.length&&selected.notes.length){const empty=document.createElement('div');empty.className='empty color-filter-empty';empty.textContent=text('noColorMatches');notesList.append(empty)}
 updateViewModeButton();
}
function renderColorFilters(){
 const host=$('noteColorFilters'),colors=['all',...validColors],counts=Object.fromEntries(validColors.map(color=>[color,selected.notes.filter(note=>note.color===color).length]));
 host.innerHTML=colors.map(color=>`<button type="button" class="note-color-filter${noteColor===color?' is-active':''}" data-filter="${color}" aria-pressed="${noteColor===color}">${color==='all'?'':`<span class="lhn-filter-swatch lhn-swatch-${color}"></span>`}<span>${color==='all'?'Tất cả':colorNames[color]}</span><span class="filter-count">${color==='all'?selected.notes.length:`${counts[color]||0}/${selected.notes.length}`}</span></button>`).join('')+`<button type="button" class="note-color-filter favorite-notes-filter${favoriteNotes?' is-active':''}" data-favorite-notes-filter aria-pressed="${favoriteNotes}"><span aria-hidden="true">♥</span><span>${text('favoriteNotes')}</span><span class="filter-count">${selected.notes.filter(note=>note.favorite).length}</span></button>`;
}
function updateViewModeButton(){const button=$('viewModeBtn'),grid=viewMode==='grid';button.innerHTML=icon(grid?'grid':'list');button.setAttribute('aria-pressed',String(grid));button.title=grid?'Chuyển sang dạng danh sách':'Chuyển sang dạng lưới';button.setAttribute('aria-label',button.title);notesList.classList.toggle('is-grid-view',grid)}
function activityWindowDays(selectedPages){
 if(period!=='all')return Number(period);
 let earliest=Infinity;for(const page of selectedPages)for(const note of page.notes){const time=dateMs(note.createdAt);if(Number.isFinite(time)&&time<earliest)earliest=time}
 if(!Number.isFinite(earliest))return 365;
 return Math.max(1,Math.min(1095,Math.floor((Date.now()-earliest)/86400000)+1));
}
function weekKey(date){const day=new Date(date);day.setHours(0,0,0,0);day.setDate(day.getDate()-((day.getDay()+6)%7));return dateKey(day)}
function updateStats(visible=allFiltered()){
 const selectedPages=scope==='all'?pages:visible,allNotes=selectedPages.flatMap(page=>page.notes),highlightTotal=allNotes.length,noteTotal=allNotes.filter(note=>note.note.trim()).length;
 $('demoMetricPages').textContent=selectedPages.length;$('demoMetricHighlights').textContent=highlightTotal;$('demoMetricNotes').textContent=noteTotal;$('demoActiveItems').textContent=highlightTotal;
 $('statsSubtitleOld').textContent=text(scope==='all'?'statsAll':'statsFiltered');drawDemoHeatmap(selectedPages);
}
function drawDemoHeatmap(selectedPages){
 const host=$('demoHeatmap');host.replaceChildren();const days=activityWindowDays(selectedPages),today=new Date();today.setHours(0,0,0,0);const perDay=new Map();
 selectedPages.flatMap(page=>page.notes).forEach(note=>{const time=dateMs(note.createdAt);if(!Number.isFinite(time))return;const key=dateKey(time);perDay.set(key,(perDay.get(key)||0)+1)});
 const first=new Date(today);first.setDate(first.getDate()-days+1);const rows=[];let maxCount=0,activeDays=0,totalItems=0;const activeWeeks=new Set();
 for(let i=0;i<days;i++){const date=new Date(first);date.setDate(first.getDate()+i);const key=dateKey(date),amount=perDay.get(key)||0;rows.push({date,key,amount});maxCount=Math.max(maxCount,amount);if(amount){activeDays++;totalItems+=amount;activeWeeks.add(weekKey(date))}}
 rows.forEach(({date,amount})=>{const cell=document.createElement('span'),level=amount?Math.max(1,Math.ceil(amount/Math.max(1,maxCount)*4)):0;cell.className='old-heat-cell';cell.dataset.level=level;cell.title=`${date.toLocaleDateString('vi-VN')} · ${amount?amount+' hoạt động':'Không có hoạt động'}`;host.append(cell)});
 $('demoActiveDays').textContent=`${activeDays} ngày`;$('demoTotalDays').textContent=activeDays;$('demoActiveWeeks').textContent=activeWeeks.size;$('demoActiveItems').textContent=totalItems;
}
function drawDemoDistribution(){
 const totals=new Map(),target=scope==='all'?pages:allFiltered();
 target.forEach(page=>{if(distMode==='tags'){page.notes.forEach(note=>note.tags.forEach(tag=>totals.set('#'+tag,(totals.get('#'+tag)||0)+1)))}else totals.set(page.site,(totals.get(page.site)||0)+page.highlights)});
 const rows=[...totals].sort((a,b)=>b[1]-a[1]).slice(0,4),max=Math.max(1,...rows.map(row=>row[1])),host=$('demoDistribution');host.replaceChildren();
 if(!rows.length){const empty=document.createElement('div');empty.className='old-dist-note';empty.textContent=text(distMode==='tags'?'noTags':'noSources');host.append(empty);return}
 rows.forEach(([label,value])=>{const row=document.createElement('div');row.className='old-dist-row';row.innerHTML='<span class="old-dist-label"></span><span class="old-dist-count"></span><div class="old-dist-track"><div class="old-dist-fill"></div></div>';row.querySelector('.old-dist-label').textContent=label;row.querySelector('.old-dist-count').textContent=value;row.querySelector('.old-dist-fill').style.width=`${Math.max(8,value/max*100)}%`;host.append(row)});
}
function refresh(){renderSources();renderSelected();drawDemoDistribution()}
function rebuildSelect(select,values,firstLabel){const previous=select.value,options=[...new Set(values)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));select.replaceChildren(new Option(firstLabel,''),...options.map(value=>new Option(value,value)));if(options.includes(previous))select.value=previous}
function populateFilters(){
 rebuildSelect($('siteFilter'),pages.map(page=>page.site),'Nguồn: Tất cả');rebuildSelect($('tagFilter'),pages.flatMap(page=>page.tags),'Thẻ: Tất cả');
 const colorSelect=$('colorFilter'),previous=colorSelect.value;colorSelect.innerHTML='<option value="">Màu: Tất cả</option>'+validColors.map(color=>`<option value="${color}">${colorNames[color]}</option>`).join('');if(validColors.includes(previous))colorSelect.value=previous;
}
function applyData(data){
 const previousKey=selected?.key,previousLanguage=currentLanguage;currentLanguage=['en','vi','ko'].includes(data.language)?data.language:'vi';applyNewLabels();if(previousLanguage!==currentLanguage)setExportMenus();annotationRecords=Array.isArray(data.items)?data.items:[];favorites=Array.isArray(data.favorites)?data.favorites:[];favoriteNoteIds=new Set(Array.isArray(data.favoriteNoteIds)?data.favoriteNoteIds:[]);pages=buildPages(annotationRecords);selected=pages.find(page=>page.key===previousKey)||pages[0]||null;populateFilters();refresh();
}
function sendParent(action,payload={}){const requestId=`lr-${Date.now()}-${++requestSequence}`;window.dispatchEvent(new CustomEvent('keepit:highlights-notes-action',{detail:{type:'HIGHLIGHTS_NOTES_ACTION',version:1,action,requestId,...payload}}));return requestId}
function exportMenuMarkup(scopeName){return ['txt','csv','md','json'].map(format=>`<button class="export-option" type="button" data-export="${format}" data-scope="${scopeName}"><span class="file-icon ${format}">${format.toUpperCase()}</span><span>${text(scopeName==='page'?'exportPage':'exportAll')} (.${format})</span></button>`).join('')}
function setExportMenus(){ $('exportPageMenu').innerHTML=exportMenuMarkup('page');$('exportAllDemoMenu').innerHTML=exportMenuMarkup('all') }
function toggleMenu(menu,button){const open=menu.hidden;closeExportMenus();menu.hidden=!open;button.setAttribute('aria-expanded',String(open))}
function closeExportMenus(){const root=$('dashboardHighlightsNotesView');root.querySelectorAll('.export-menu').forEach(menu=>menu.hidden=true);document.querySelector('#dashboardSharedTopbarActionsSlot .export-menu')?.setAttribute('hidden','');$('exportPageBtn').setAttribute('aria-expanded','false');$('exportAllDemoBtn').setAttribute('aria-expanded','false')}
function requestExport(button,format,scopeName){if(button)playToolbarActionEffect(button,null,'#3b82f6','sparkle');if(scopeName==='page'&&!selected)return;sendParent('export',{format,scope:scopeName,pageKey:scopeName==='page'?selected.key:null});closeExportMenus()}
function handleCardAction(button,event){
 const card=button.closest('.card'),note=selected?.notes.find(item=>item.id===card?.dataset.noteId);if(!note)return;
 if(button.dataset.action==='favorite-note'){playToolbarActionEffect(button,event,'#f43f5e','heart');note.favorite=!note.favorite;if(note.favorite)favoriteNoteIds.add(note.id);else favoriteNoteIds.delete(note.id);refresh();sendParent('toggle-note-favorite',{itemId:note.id});showToast(text(note.favorite?'noteFavoriteAdded':'noteFavoriteRemoved'));return}
 if(button.dataset.action==='edit'){sendParent('edit-note',{itemId:note.id});return}
 if(button.dataset.action==='delete'){sendParent('delete-note',{itemId:note.id});return}
 if(button.dataset.action==='jump'){sendParent('jump-to-highlight',{itemId:note.id});return}
 if(button.dataset.action==='speak'){sendParent('speak-highlight',{itemId:note.id});return}
}
function onDashboardData(event){const message=event.detail;if(message&&message.type==='KEEPIT_HIGHLIGHTS_NOTES_DATA')applyData(message)}
function onDashboardResult(event){const message=event.detail;if(message&&message.type==='KEEPIT_HIGHLIGHTS_NOTES_RESULT'){if(message.message)showToast(String(message.message));else if(message.ok===false)showToast(text('genericError'))}}
window.addEventListener('keepit:highlights-notes-data',onDashboardData);
window.addEventListener('keepit:highlights-notes-result',onDashboardResult);
setExportMenus();populateFilters();applyNewLabels();
$('viewModeBtn').setAttribute('aria-pressed','true');notesList.classList.add('is-grid-view');$('viewModeBtn').innerHTML=icon('grid');$('viewModeBtn').addEventListener('click',()=>{viewMode=viewMode==='grid'?'list':'grid';updateViewModeButton()});
$('noteColorFilters').addEventListener('click',event=>{const favoriteButton=event.target.closest('[data-favorite-notes-filter]');if(favoriteButton){favoriteNotes=!favoriteNotes;refresh();return}const button=event.target.closest('[data-filter]');if(!button)return;noteColor=button.dataset.filter;renderSelected()});
['siteFilter','colorFilter','tagFilter','dateFilter','sortBy'].forEach(id=>$(id).addEventListener('change',refresh));$('search').addEventListener('input',refresh);
$('clearFiltersBtn').addEventListener('click',event=>{playToolbarActionEffect(event.currentTarget,event,'#3b82f6','sparkle');$('search').value='';['siteFilter','colorFilter','tagFilter','dateFilter'].forEach(id=>$(id).value='');$('sortBy').value='created';quickFilter='all';$('dashboardHighlightsNotesView').querySelectorAll('[data-quick-filter]').forEach(button=>button.classList.toggle('active',button.dataset.quickFilter==='all'));noteColor='all';favoriteNotes=false;refresh();showToast(text('clearFilters'))});
$('dashboardHighlightsNotesView').querySelectorAll('[data-quick-filter]').forEach(button=>button.addEventListener('click',()=>{quickFilter=button.dataset.quickFilter;$('dashboardHighlightsNotesView').querySelectorAll('[data-quick-filter]').forEach(item=>item.classList.toggle('active',item===button));refresh()}));
$('favoritePageBtn').addEventListener('click',event=>{if(!selected)return;playToolbarActionEffect(event.currentTarget,event,'#f43f5e','heart');const key=selected.key,addingFavorite=!selected.favorite;favorites=addingFavorite?[...favorites,key]:favorites.filter(value=>value!==key);refresh();sendParent('toggle-page-favorite',{pageKey:key});showToast(text(addingFavorite?'pageFavoriteAdded':'pageFavoriteRemoved'))});
$('studyModeBtn').addEventListener('click',()=>selected?sendParent('study',{pageKey:selected.key}):showToast(text('chooseSource')));
$('exportPageBtn').addEventListener('click',event=>{event.stopPropagation();toggleMenu($('exportPageMenu'),event.currentTarget)});
$('exportAllDemoBtn').addEventListener('click',event=>{event.stopPropagation();toggleMenu($('exportAllDemoMenu'),event.currentTarget)});
document.addEventListener('click',event=>{const option=event.target.closest('button[data-export][data-scope]');if(option){requestExport(option,option.dataset.export,option.dataset.scope);return}if(!event.target.closest('.menu-wrap'))closeExportMenus()});
$('deletePageBtn').addEventListener('click',()=>{if(selected)sendParent('delete-page',{pageKey:selected.key})});$('notesList').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)handleCardAction(button,event)});
$('dashboardHighlightsNotesView').querySelectorAll('[data-stats-scope]').forEach(button=>button.addEventListener('click',()=>{scope=button.dataset.statsScope;$('dashboardHighlightsNotesView').querySelectorAll('[data-stats-scope]').forEach(item=>item.classList.toggle('active',item===button));updateStats();drawDemoDistribution()}));
$('dashboardHighlightsNotesView').querySelectorAll('[data-heat-period]').forEach(button=>button.addEventListener('click',()=>{period=button.dataset.heatPeriod;$('dashboardHighlightsNotesView').querySelectorAll('[data-heat-period]').forEach(item=>item.classList.toggle('active',item===button));updateStats()}));
$('dashboardHighlightsNotesView').querySelector('.old-stats-close').addEventListener('click',()=>showToast('Thống kê được giữ mở.'));
$('dashboardHighlightsNotesView').querySelectorAll('[data-demo-dist]').forEach(button=>button.addEventListener('click',()=>{distMode=button.dataset.demoDist;$('dashboardHighlightsNotesView').querySelectorAll('[data-demo-dist]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active))});drawDemoDistribution()}));
window.dispatchEvent(new CustomEvent('keepit:highlights-notes-ready',{detail:{version:1}}));
refresh();
})();
