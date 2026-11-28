// Direct OOXML -> first-party SVG/text DOM. Never insert document-provided HTML or SVG.
// HTML sanitizer in documents-renderers.js remains unchanged (including its foreignObject ban).
function buildSlide(source){const parse=s=>{const d=new DOMParser().parseFromString(s,'application/xml');if(d.querySelector('parsererror'))throw Error('documentsBadFile');return d;};const docs=Object.fromEntries(Object.entries(source.xml).map(([k,v])=>{const d=source.parsed?.[k]||parse(v);d._part=source.paths[k];return[k,d];}));
const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',S='http://www.w3.org/2000/svg',H='http://www.w3.org/1999/xhtml',EMU=9525;
const one=(e,n)=>[...e?.children||[]].find(c=>c.localName===n),all=(e,n)=>[...e?.children||[]].filter(c=>c.localName===n),desc=(e,n)=>e?.getElementsByTagNameNS('*',n)?.[0],num=(e,a,f=0)=>{const n=Number(e?.getAttribute(a)??f);if(!Number.isFinite(n)||Math.abs(n)>1e12)throw Error('documentsPageLimit');return n;},px=(e,a,f=0)=>num(e,a,f)/EMU;
const svg=(tag,attrs={},children=[])=>{const el=document.createElementNS(S,tag);for(const[k,v]of Object.entries(attrs))if(v!==undefined)el.setAttribute(k,v);el.append(...children);return el;};
const stats={pictures:0,customShapes:0,paths:0,curves:0,groups:0,textBoxes:0,unsupported:[]},theme={};for(const c of desc(docs.theme,'clrScheme')?.children||[])theme[c.localName]=c.children[0].getAttribute('val')||c.children[0].getAttribute('lastClr');
const clrmap=desc(docs.master,'clrMap')?.attributes;const colors={};if(clrmap)for(const a of clrmap)colors[a.name]=a.value;

function coord(value,w,h){const known={w,h,l:0,t:0,r:w,b:h,wd2:w/2,hd2:h/2};if(value in known)return known[value];const n=Number(value);return Number.isFinite(n)?n:NaN;}
function picture(node,doc){const sp=one(node,'spPr'),xf=one(sp,'xfrm'),off=one(xf,'off'),ext=one(xf,'ext'),w=px(ext,'cx'),h=px(ext,'cy'),rid=desc(node,'blip')?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed'),data=source.media?.[doc._part]?.[rid],g=svg('g',{transform:`translate(${px(off,'x')} ${px(off,'y')})`});if(!data){stats.unsupported.push('ảnh SVG/EMF/WMF hoặc ảnh ngoài tệp');return g;}const crop=desc(node,'srcRect'),left=num(crop,'l')/100000,right=num(crop,'r')/100000,top=num(crop,'t')/100000,bottom=num(crop,'b')/100000;let iw=w,ih=h,ix=0,iy=0;if(left+right<1&&top+bottom<1){iw=w/(1-left-right);ih=h/(1-top-bottom);ix=-left*iw;iy=-top*ih;}const nested=svg('svg',{width:w,height:h,overflow:'hidden',viewBox:`0 0 ${w} ${h}`});nested.append(svg('image',{href:data,x:ix,y:iy,width:iw,height:ih,preserveAspectRatio:'none'}));const rot=num(xf,'rot')/60000;if(rot||xf?.getAttribute('flipH')==='1'||xf?.getAttribute('flipV')==='1')nested.setAttribute('transform',`translate(${w/2} ${h/2}) rotate(${rot}) scale(${xf?.getAttribute('flipH')==='1'?-1:1} ${xf?.getAttribute('flipV')==='1'?-1:1}) translate(${-w/2} ${-h/2})`);g.append(nested);stats.pictures++;return g;}

function color(node,fallback='#003849'){
 if(!node)return fallback;const c=[...node.children].find(e=>['srgbClr','schemeClr','sysClr'].includes(e.localName));if(!c)return fallback;
 let hex=c.localName==='schemeClr'?theme[colors[c.getAttribute('val')]||c.getAttribute('val')]:(c.localName==='sysClr'?c.getAttribute('lastClr'):c.getAttribute('val'));hex=hex||fallback.replace('#','');if(!/^[0-9a-f]{6}$/i.test(hex))return fallback;let v=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
 for(const x of c.children){const f=num(x,'val')/100000;if(x.localName==='tint')v=v.map(n=>n+(255-n)*f);if(x.localName==='shade'||x.localName==='lumMod')v=v.map(n=>n*f);if(x.localName==='lumOff')v=v.map(n=>n+255*f);}
 const alpha=one(c,'alpha');return `rgba(${v.map(n=>Math.round(Math.max(0,Math.min(255,n)))).join(',')},${alpha?num(alpha,'val')/100000:1})`;
}
function xfrm(node,group=false){let p=one(node,group?'grpSpPr':'spPr'),x=one(p,'xfrm');if(!x&&!group){const ph=placeholder(node),inherited=matching(docs.layout,ph)||matching(docs.master,ph);p=one(inherited,'spPr');x=one(p,'xfrm');}if(!x)return{transform:'',w:0,h:0};const off=one(x,'off'),ext=one(x,'ext'),w=px(ext,'cx'),h=px(ext,'cy'),rot=num(x,'rot')/60000;let t=`translate(${px(off,'x')} ${px(off,'y')})`;
 if(rot||x.getAttribute('flipH')==='1'||x.getAttribute('flipV')==='1')t+=` translate(${w/2} ${h/2}) rotate(${rot}) scale(${x.getAttribute('flipH')==='1'?-1:1} ${x.getAttribute('flipV')==='1'?-1:1}) translate(${-w/2} ${-h/2})`;
 if(group){const chOff=one(x,'chOff'),chExt=one(x,'chExt');t+=` scale(${w/(px(chExt,'cx')||w||1)} ${h/(px(chExt,'cy')||h||1)}) translate(${-px(chOff,'x')} ${-px(chOff,'y')})`;}
 return{transform:t,w,h};}
function placeholder(node){return desc(node,'ph');}
function matching(doc,ph){if(!ph)return null;const type=ph.getAttribute('type')||'body',idx=ph.getAttribute('idx')||'0';return [...doc.getElementsByTagNameNS(P,'sp')].find(sp=>{const p=placeholder(sp);return p&&(p.getAttribute('idx')||'0')===idx&&((p.getAttribute('type')||'body')===type||ph.hasAttribute('idx'));})||null;}
function defaults(sp){const ph=placeholder(sp),type=ph?.getAttribute('type')||'body';const layout=matching(docs.layout,ph),master=[...docs.master.getElementsByTagNameNS(P,'sp')].find(s=>{const p=placeholder(s);return p&&(p.getAttribute('type')||'body')===(type==='ctrTitle'?'title':type==='subTitle'?'body':type);});
 const state={font:'Arial',size:18,color:color(desc(docs.theme,'dk1'),'#000000'),bold:false};
 for(const e of [desc(docs.master,type.includes('Title')||type==='title'?'titleStyle':'bodyStyle'),one(master,'txBody'),one(layout,'txBody'),one(sp,'txBody')]){const level=desc(e,'lvl1pPr'),r=one(level,'defRPr');applyRun(state,r);}
 return state;}
function family(name){if(name?.startsWith('+'))name=desc(desc(docs.theme,name.startsWith('+mj')?'majorFont':'minorFont'),'latin')?.getAttribute('typeface')||'Arial';name=(name||'Arial').replace(/[\"';()<>\n\r]/g,'');return name==='Pangolin'?'KeepitPangolin,Pangolin,sans-serif':JSON.stringify(name)+',sans-serif';}
function applyRun(s,r){if(!r)return;const latin=one(r,'latin');if(latin)s.font=latin.getAttribute('typeface');if(r.hasAttribute('sz'))s.size=num(r,'sz')/100;if(r.hasAttribute('b'))s.bold=r.getAttribute('b')==='1';if(one(r,'solidFill'))s.color=color(one(r,'solidFill'));}
function text(sp,g,w,h){const body=one(sp,'txBody');if(!body||![...body.getElementsByTagNameNS(A,'t')].some(n=>n.textContent.trim()))return;stats.textBoxes++;
 const fo=svg('foreignObject',{x:0,y:0,width:w,height:h,'data-selectable':'true'}),box=document.createElementNS(H,'div');box.classList.add('slide-text');const pr=one(body,'bodyPr'),base=defaults(sp);box.style.cssText=`width:100%;height:100%;box-sizing:border-box;overflow:hidden;padding:${px(pr,'tIns',91440)}px ${px(pr,'rIns',91440)}px ${px(pr,'bIns',91440)}px ${px(pr,'lIns',91440)}px;display:flex;flex-direction:column;justify-content:${pr?.getAttribute('anchor')==='ctr'?'center':pr?.getAttribute('anchor')==='b'?'flex-end':'flex-start'};font-family:${family(base.font)};`;
 for(const p of all(body,'p')){const para=document.createElementNS(H,'p'),pp=one(p,'pPr'),state={...base};applyRun(state,one(pp,'defRPr'));const line=one(one(pp,'lnSpc'),'spcPct');para.style.cssText=`font-family:${family(state.font)};font-size:${state.size*4/3}px;line-height:${line?num(line,'val')/100000:1.2};font-weight:${state.bold?700:400};color:${state.color};white-space:pre-wrap;overflow-wrap:normal;text-align:${({ctr:'center',r:'right',just:'justify'})[pp?.getAttribute('algn')]||'left'};flex:none;margin:0;padding:0;`;
  for(const run of p.children){if(run.localName==='br'){para.append(document.createTextNode('\n'));continue;}if(run.localName!=='r'&&run.localName!=='fld')continue;const st={...state};applyRun(st,one(run,'rPr'));const el=document.createElementNS(H,'span');el.style.cssText=`font-family:${family(st.font)};font-size:${st.size*4/3}px;font-weight:${st.bold?700:400};color:${st.color};`;el.textContent=one(run,'t')?.textContent||'';para.append(el);}box.append(para);}
 fo.append(box);g.append(fo);
}
function shape(sp){const{transform,w,h}=xfrm(sp),g=svg('g',{transform,'data-shape':desc(sp,'cNvPr')?.getAttribute('id')||''}),pr=one(sp,'spPr'),custom=one(pr,'custGeom'),preset=one(pr,'prstGeom'),style=one(sp,'style'),fillRef=one(style,'fillRef'),lnRef=one(style,'lnRef'),fill=one(pr,'noFill')?'none':color(one(pr,'solidFill'),num(fillRef,'idx')>0?color(fillRef,'none'):'none'),ln=one(pr,'ln'),stroke=one(ln,'noFill')?'none':color(one(ln,'solidFill'),num(lnRef,'idx')>0?color(lnRef,'none'):'none'),lw=ln?(ln.hasAttribute('w')?px(ln,'w'):1):0;
 if(custom){stats.customShapes++;for(const path of all(one(custom,'pathLst'),'path')){const sx=w/num(path,'w',w||1),sy=h/num(path,'h',h||1);if(!Number.isFinite(sx+sy)){stats.unsupported.push('kích thước đường vẽ');continue;}let d='';for(const c of path.children){const pts=[...c.children].map(p=>`${coord(p.getAttribute('x'),w/sx,h/sy)*sx},${coord(p.getAttribute('y'),w/sx,h/sy)*sy}`).join(' '),cmd={moveTo:'M',lnTo:'L',cubicBezTo:'C',quadBezTo:'Q',close:'Z'}[c.localName];if(cmd&&!pts.includes('NaN')){d+=cmd+pts+' ';if(cmd==='C')stats.curves++;}else stats.unsupported.push('đường vẽ '+c.localName+' / công thức chưa hỗ trợ');}
  const attrs={d,fill:path.getAttribute('fill')==='none'?'none':fill,stroke:path.getAttribute('stroke')==='0'?'none':stroke,'stroke-width':lw,'stroke-linejoin':one(ln,'miter')?'miter':'round','stroke-linecap':ln?.getAttribute('cap')==='rnd'?'round':'butt'};const dash=one(ln,'prstDash')?.getAttribute('val');if(dash&&dash!=='solid')attrs['stroke-dasharray']=`${lw*4} ${lw*3}`;g.append(svg('path',attrs));stats.paths++;}}
 else if(preset&&(fill!=='none'||stroke!=='none')){const kind=preset.getAttribute('prst'),attrs={fill,stroke,'stroke-width':lw};if(kind==='rect')g.append(svg('rect',{width:w,height:h,...attrs}));else if(kind==='roundRect')g.append(svg('rect',{width:w,height:h,rx:Math.min(w,h)*.16,...attrs}));else if(kind==='ellipse')g.append(svg('ellipse',{cx:w/2,cy:h/2,rx:w/2,ry:h/2,...attrs}));else if(kind==='line'||kind==='straightConnector1')g.append(svg('line',{x1:0,y1:0,x2:w,y2:h,...attrs}));else if(kind==='triangle')g.append(svg('polygon',{points:`${w/2},0 ${w},${h} 0,${h}`,...attrs}));else stats.unsupported.push('hình '+kind);}else if(pr&&one(pr,'gradFill'))stats.unsupported.push('gradient');
 text(sp,g,w,h);return g;}
function renderTree(doc,skipPlaceholders=false){const out=svg('g');const visit=(tree,parent,depth=0)=>{if(depth>64)throw Error('documentsPageLimit');for(const n of tree?.children||[]){if(n.localName==='grpSp'){stats.groups++;const t=xfrm(n,true),g=svg('g',{transform:t.transform});visit(n,g,depth+1);parent.append(g);}else if(n.localName==='sp'){if(skipPlaceholders&&placeholder(n))continue;parent.append(shape(n));}else if(n.localName==='cxnSp')parent.append(shape(n));else if(n.localName==='pic')parent.append(picture(n,doc));else if(!['nvGrpSpPr','grpSpPr'].includes(n.localName))stats.unsupported.push(n.localName);}};visit(desc(doc,'spTree'),out);return out;}
const root=svg('svg',{class:'docsPptx',width:source.width,height:source.height,viewBox:`0 0 ${source.width} ${source.height}`});const bg=one(desc(docs.slide,'bg')||desc(docs.layout,'bg')||desc(docs.master,'bg'),'bgPr');root.append(svg('rect',{width:source.width,height:source.height,fill:color(one(bg,'solidFill'),'#fff')}),...(docs.slide.documentElement.getAttribute('showMasterSp')==='0'?[]:[renderTree(docs.master,true),renderTree(docs.layout,true)]),renderTree(docs.slide));
return {node:root,stats};
}

const EMPTY='<empty/>',PPT='http://schemas.openxmlformats.org/presentationml/2006/main',REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function xmlParse(text){
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('documentsBadFile');
 const doc=new DOMParser().parseFromString(text,'application/xml');
 if(doc.querySelector('parsererror'))throw Error('documentsBadFile');return doc;
}
function resolve(base,target){
 if(!target||/^[a-z][a-z\d+.-]*:/i.test(target)||target.includes('\\'))throw Error('documentsBadFile');
 const parts=[];for(const p of (target.startsWith('/')?target:base.slice(0,base.lastIndexOf('/')+1)+target).split('/')){
  if(p==='..'){if(!parts.length)throw Error('documentsBadFile');parts.pop();}else if(p&&p!=='.')parts.push(p);
 }return parts.join('/');
}
function paragraphText(p){return [...p.children].map(n=>n.localName==='br'?'\n':['r','fld'].includes(n.localName)?[...n.getElementsByTagNameNS('*','t')].map(x=>x.textContent).join(''):'').join('').replace(/\s+/g,' ').trim();}
function sourceTexts(source){
 const out=[],docs=source.parsed||Object.fromEntries(Object.entries(source.xml).map(([k,v])=>[k,xmlParse(v)]));
 const visit=(tree,skip,depth=0)=>{if(depth>64)throw Error('documentsPageLimit');for(const n of tree?.children||[]){
  if(n.localName==='grpSp')visit(n,skip,depth+1);
  else if(['sp','cxnSp'].includes(n.localName)){
   if(skip&&n.getElementsByTagNameNS('*','ph').length)continue;
   const body=[...n.children].find(x=>x.localName==='txBody');
   for(const p of body?.children||[])if(p.localName==='p'){const text=paragraphText(p);if(text)out.push(text);}
  }
 }};
 if(docs.slide.documentElement.getAttribute('showMasterSp')!=='0')for(const key of ['master','layout'])visit(docs[key].getElementsByTagNameNS('*','spTree')[0],true);
 visit(docs.slide.getElementsByTagNameNS('*','spTree')[0],false);return out;
}
export async function preparePptx(initialZip,hooks,attachBlocks){
 let zip=initialZip,disposed=false;const textsCache=new Map(),imageCache=new Map(),parsedCache=new Map();
 const parse=text=>{if(parsedCache.has(text))return parsedCache.get(text);const doc=xmlParse(text);if(parsedCache.size>=32)parsedCache.delete(parsedCache.keys().next().value);parsedCache.set(text,doc);return doc;};
 const check=()=>{if(disposed)throw Error('cancel');hooks.check?.();};
 async function read(path,required=false){
  check();if(!path)return EMPTY;if(textsCache.has(path))return textsCache.get(path);
  const file=zip.file(path);if(!file){if(required)throw Error('documentsBadFile');return EMPTY;}
  if(file._data?.uncompressedSize>8*1024*1024)throw Error('documentsArchiveLimit');
  const text=await file.async('string');check();if(text.length>8*1024*1024)throw Error('documentsArchiveLimit');parse(text);
  if(textsCache.size>=48)textsCache.delete(textsCache.keys().next().value);textsCache.set(path,text);return text;
 }
 async function links(path){
  const ix=path.lastIndexOf('/'),doc=parse(await read(path.slice(0,ix+1)+'_rels/'+path.slice(ix+1)+'.rels')),map=Object.create(null);
  for(const r of doc.documentElement.children){if(r.getAttribute('TargetMode')?.toLowerCase()==='external')continue;
   const target=r.getAttribute('Target');if(target)map[r.getAttribute('Id')]={type:r.getAttribute('Type')?.split('/').pop(),path:resolve(path,target)};
  }return map;
 }
 async function related(path,type){return path?Object.values(await links(path)).find(r=>r.type===type)?.path||'':'';}
 const pres=parse(await read('ppt/presentation.xml',true)),rels=await links('ppt/presentation.xml'),size=pres.getElementsByTagNameNS('*','sldSz')[0];
 const width=Number(size?.getAttribute('cx'))/9525,height=Number(size?.getAttribute('cy'))/9525;
 if(!(width>0&&height>0&&width<20000&&height<20000))throw Error('documentsPageLimit');
 const slidePaths=[...pres.getElementsByTagNameNS('*','sldId')].map(n=>rels[n.getAttributeNS(REL,'id')]?.path);
 if(!slidePaths.length||slidePaths.length>2000||slidePaths.some(p=>!p||!zip.file(p)))throw Error('documentsPageLimit');
 async function source(index,withMedia=false){
  check();const slide=slidePaths[index],layout=await related(slide,'slideLayout'),master=await related(layout,'slideMaster'),theme=await related(master,'theme');
  const paths={slide,layout,master,theme},xml={},media={};for(const[k,p]of Object.entries(paths))xml[k]=await read(p,!!p);
  let count=0,points=0;
  for(const key of ['slide','layout','master']){
   const doc=parse(xml[key]);count+=doc.getElementsByTagNameNS('*','sp').length;points+=doc.getElementsByTagNameNS('*','pt').length;
   if(count>15000||points>300000)throw Error('documentsPageLimit');
   if(!withMedia||!paths[key])continue;const p=paths[key];media[p]=Object.create(null);
   for(const[rid,r]of Object.entries(await links(p))){
    const mime=({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'})[r.path.split('.').pop().toLowerCase()];
    if(r.type!=='image'||!mime)continue;const file=zip.file(r.path);if(!file)continue;
    let data=imageCache.get(r.path);if(!data){data='data:'+mime+';base64,'+await file.async('base64');check();if(data.length<4*1024*1024){if(imageCache.size>=8)imageCache.delete(imageCache.keys().next().value);imageCache.set(r.path,data);}}
    media[p][rid]=data;
   }
  }
  return{width,height,paths,xml,media,parsed:Object.fromEntries(Object.entries(xml).map(([k,v])=>[k,parse(v)]))};
 }
 async function notes(path){
  const note=await related(path,'notesSlide');if(!note)return '';
  const doc=parse(await read(note,true));return [...doc.getElementsByTagNameNS('*','sp')].filter(sp=>sp.getElementsByTagNameNS('*','ph')[0]?.getAttribute('type')==='body').map(sp=>[...sp.getElementsByTagNameNS('*','p')].map(paragraphText).join('\n')).join('\n').trim().slice(0,20000);
 }
 const pages=[];
 for(let i=0;i<slidePaths.length;i++){
  const data=await source(i);pages.push({width,height,texts:sourceTexts(data),edgePositions:[],notes:await notes(slidePaths[i]),warnings:[]});
  hooks.progress?.(.35+.58*(i+1)/slidePaths.length);if(i%8===7){await new Promise(r=>setTimeout(r,0));check();}
 }
 return{kind:'pptx',pages,
  async render(target,number){
   check();const spec=pages[number-1];if(!spec)throw Error('documentsPageLimit');const {node,stats}=buildSlide(await source(number-1,true));check();
   target.replaceChildren(node);const liveTexts=[];attachBlocks(node,number,liveTexts,spec.edgePositions);
   // Metadata and rendered paragraphs use the same XML order; fail closed if they diverge.
   if(JSON.stringify(liveTexts)!==JSON.stringify(spec.texts)){target.replaceChildren();throw Error('documentsBadFile');}
   spec.warnings=[...new Set(stats.unsupported)];node.dataset.unsupported=String(spec.warnings.length);
  },
  async thumbnail(number=1,{width:tw=960,height:th=1320}={}){
   check();const spec=pages[Math.max(0,Math.min(pages.length-1,Math.round(number)-1))],canvas=document.createElement('canvas'),scale=Math.min(tw/120,th/68);
   canvas.width=Math.ceil(120*scale);canvas.height=Math.ceil(68*scale);const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,120,68);ctx.fillStyle='#374151';ctx.font='6px sans-serif';let y=11;
   for(const text of spec.texts){let line='';for(const word of text.split(/\s+/)){if(ctx.measureText(line+' '+word).width>104){ctx.fillText(line,8,y);y+=8;line=word;}else line+=(line?' ':'')+word;if(y>58)break;}ctx.fillText(line,8,y);y+=10;if(y>58)break;}return canvas.toDataURL('image/png');
  },
  dispose(){disposed=true;zip=null;textsCache.clear();imageCache.clear();parsedCache.clear();}
 };
}
