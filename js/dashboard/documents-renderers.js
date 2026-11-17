// Local, read-only document renderers. Untrusted Office HTML/CSS is sanitised before it can reach the UI.
(() => {
  'use strict';
  const base = new URL('../../vendor/', document.currentScript.src), MAX_PAGES = 2000, MAX_EXPANDED = 160 * 1024 * 1024;
  let pdfModule, officeModule;
  const pdfLibrary = () => pdfModule ||= import(new URL('pdfjs/pdf.mjs', base).href).then(pdf => { pdf.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.mjs', base).href; return pdf; });
  const officeLibrary = () => officeModule ||= import(new URL('office/office.mjs', base).href);
  const px = value => { const n=Number(value);if(!Number.isFinite(n)||n<=0||n>4000000)throw new Error('documentsPageLimit');return n; };
  function cleanDeclarations(style) {
    for (const name of [...style]) {
      const value = style.getPropertyValue(name);
      if (/^(behavior|-moz-binding|cursor)$/i.test(name) || /expression\s*\(|@import|javascript:|https?:|\/\//i.test(value) || (/url\s*\(/i.test(value) && !/^\s*url\(["']?(?:data:(?:image|font|application\/(?:font|x-font|vnd\.ms-fontobject))|blob:)/i.test(value))) style.removeProperty(name);
      if (name === 'position' && !['relative', 'absolute', 'static'].includes(value)) style.setProperty(name, 'absolute');
    }
  }
  function safeStyles(text) {
    const sheet = new CSSStyleSheet();
    try { sheet.replaceSync(String(text).replace(/@import[^;]+;/gi, '')); } catch { return ''; }
    const output = [];
    for (const rule of sheet.cssRules) {
      if (rule.type === CSSRule.STYLE_RULE) {
        cleanDeclarations(rule.style);
        const selectors = rule.selectorText.split(',').filter(x => !/:has\(|:host|:root|html|body/i.test(x)).map(x => '.docsSource ' + x.trim());
        if (selectors.length) output.push(`${selectors.join(',')}{${rule.style.cssText}}`);
      } else if (rule.type === CSSRule.FONT_FACE_RULE) { cleanDeclarations(rule.style); if (/data:|blob:/.test(rule.style.getPropertyValue('src'))) output.push(rule.cssText); }
    }
    return output.join('\n');
  }
  function sanitizeOffice(html, purify) {
    const fragment = purify.sanitize(html, { RETURN_DOM_FRAGMENT:true, ALLOW_DATA_ATTR:false, USE_PROFILES:{ html:true, svg:true, svgFilters:false }, FORBID_TAGS:['script','iframe','object','embed','link','meta','form','input','button','textarea','select','audio','video','foreignObject','style'], FORBID_ATTR:['srcdoc','action','formaction','autofocus'] });
    for (const el of fragment.querySelectorAll('*')) {
      if (el.hasAttribute('style')) cleanDeclarations(el.style);
      el.removeAttribute('id');
      for (const attr of ['src','href','xlink:href']) {
        const value = el.getAttribute(attr); if (!value) continue;
        if (el.localName === 'a') { el.removeAttribute(attr); continue; }
        if (!/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(value) && !/^blob:/.test(value) && !/^#[\w-]+$/.test(value)) el.removeAttribute(attr);
      }
    }
    return fragment;
  }
  function attachBlocks(root, page, texts, edgePositions=[]) {
    const candidates = [...root.querySelectorAll('p,td,h1,h2,h3,h4,h5,h6,li')].filter(el => !el.querySelector('p,td,li') && el.textContent.trim());
    if (!candidates.length) for (const el of root.querySelectorAll('div')) if (!el.querySelector('div,p,table,svg,img') && el.textContent.trim()) candidates.push(el);
    const bounds=root.getBoundingClientRect(),height=Math.max(1,bounds.height);
    for (const el of candidates) {
      const text = el.textContent.replace(/\s+/g, ' ').trim(); if (!text) continue;
      const index = texts.length, rect=el.getBoundingClientRect(), skip=!!el.closest('header,footer,[class*="header" i],[class*="footer" i]');
      el.classList.add('para'); el.dataset.page = page; el.dataset.i = index; el.dataset.paragraphIndex = index; el.dataset.paragraphStart = 'true';
      if(skip)el.dataset.readerSkip='true';
      if(bounds.height>0){const edgeTop=Math.max(0,Math.min(1,(rect.top-bounds.top)/height)),edgeBottom=Math.max(0,Math.min(1,(rect.bottom-bounds.top)/height));el.dataset.edgeTop=edgeTop;el.dataset.edgeBottom=edgeBottom;edgePositions[index]={edgeTop,edgeBottom,skip};}
      const en = document.createElement('span'); en.className = 'en'; while (el.firstChild) en.append(el.firstChild); el.append(en); texts.push(text);
    }
  }
  const normPdfText = value => String(value || '').replace(/[\u00ad\u200b\ufeff]/g, '').replace(/\s+/g, ' ').trim();
  function reconstructPdfParagraphs(items, viewport, pageWidth) {
    const fragments = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index], rawText = String(item?.str || ''), text = normPdfText(rawText);
      if (!text) continue;
      const transform = item.transform || [1, 0, 0, 1, 0, 0], point = viewport.convertToViewportPoint(transform[4] || 0, transform[5] || 0);
      const fontSize = Math.max(1, Math.hypot(transform[2] || 0, transform[3] || 0) || item.height || 10);
      const width = Math.max(0, Math.abs(Number(item.width) || 0)), rtl = item.dir === 'rtl';
      const left = rtl ? point[0] - width : point[0], right = rtl ? point[0] : point[0] + width;
      fragments.push({ index, text, rawText, x:point[0], y:point[1], left, right, top:point[1] - fontSize, bottom:point[1] + fontSize * .2, fontSize, angle:Math.atan2(transform[1] || 0, transform[0] || 1), rtl });
    }
    if (!fragments.length) return { paragraphs:[], fragmentToParagraph:[] };
    const ordered = fragments.slice().sort((a,b) => a.y-b.y || a.left-b.left || a.index-b.index), lines = [];
    for (const part of ordered) {
      const tolerance = Math.max(2, part.fontSize * .35);
      let line = null, best = Infinity;
      for (const candidate of lines) {
        const delta = Math.abs(candidate.y - part.y), angle = Math.abs(candidate.angle - part.angle);
        const gap = part.left - candidate.right, lineGapLimit = Math.min(Math.max(16, part.fontSize * 2), pageWidth * .08);
        if (delta <= Math.max(tolerance, candidate.fontSize * .35) && angle < .12 && gap <= lineGapLimit && gap >= -Math.max(part.fontSize * 4, 24) && delta < best) { line=candidate;best=delta; }
      }
      if (!line) { line={parts:[],y:part.y,left:part.left,right:part.right,top:part.top,bottom:part.bottom,fontSize:part.fontSize,angle:part.angle,rtl:part.rtl};lines.push(line); }
      line.parts.push(part);line.left=Math.min(line.left,part.left);line.right=Math.max(line.right,part.right);line.top=Math.min(line.top,part.top);line.bottom=Math.max(line.bottom,part.bottom);line.fontSize=Math.max(line.fontSize,part.fontSize);
    }
    const lineText = line => {
      const parts=line.parts.slice().sort((a,b)=>line.rtl?b.left-a.left:a.left-b.left);let out='',previous=null;
      for(const part of parts){let value=part.text;if(previous&&out&&!/\s$/.test(out)&&!/^\s/.test(value)&&part.left-previous.right>Math.max(1.5,part.fontSize*.18))out+=' ';out+=value;previous=part;}
      return normPdfText(out);
    };
    for(const line of lines){line.parts.sort((a,b)=>a.left-b.left);line.text=lineText(line);line.x=line.left;line.top=Math.min(line.top,line.y-line.fontSize);line.bottom=Math.max(line.bottom,line.y+line.fontSize*.2);}
    // Repeated aligned narrow cells identify a table row more reliably than isolated x-gaps.
    const visualRows=[];
    for(const line of lines.slice().sort((a,b)=>a.y-b.y||a.left-b.left)){
      const tolerance=Math.max(3,line.fontSize*.6);let row=visualRows.at(-1);
      if(!row||Math.abs(row.y-line.y)>Math.max(tolerance,row.fontSize*.6)){row={y:line.y,top:line.top,bottom:line.bottom,fontSize:line.fontSize,lines:[]};visualRows.push(row);}
      row.lines.push(line);row.top=Math.min(row.top,line.top);row.bottom=Math.max(row.bottom,line.bottom);row.fontSize=Math.max(row.fontSize,line.fontSize);
    }
    function cellsForRow(row){
      const sourceParts=row.lines.flatMap(line=>line.parts),parts=[];
      for(const part of sourceParts){
        const raw=String(part.rawText||part.text||''),segments=raw.split(/[ \t]{2,}/).map(normPdfText).filter(Boolean),width=Math.max(0,part.right-part.left);
        if(segments.length<2){parts.push(part);continue;}
        let cursor=0;
        for(const text of segments){const start=raw.indexOf(text,cursor);if(start<0){parts.push(part);break;}const end=start+text.length,left=part.left+width*start/Math.max(1,raw.length),right=part.left+width*end/Math.max(1,raw.length);parts.push({...part,text,left,right,cellApprox:true});cursor=end;}
      }
      parts.sort((a,b)=>a.left-b.left);const groups=[];let group=[];
      for(const part of parts){const previous=group.at(-1);if(group.length&&part.left-previous.right>Math.max(24,part.fontSize*2.2)){groups.push(group);group=[];}group.push(part);}
      if(group.length)groups.push(group);
      return groups.map(parts=>({parts,text:lineText({parts,rtl:parts[0]?.rtl}),left:parts[0].left,right:parts.at(-1).right,approximate:parts.some(part=>part.cellApprox)}));
    }
    for(const row of visualRows){row.cells=cellsForRow(row);const first=row.cells[0],second=row.cells[1],secondWidth=second?second.right-second.left:Infinity,firstWidth=first?first.right-first.left:0;
      row.tableCandidate=row.cells.length>=3||(row.cells.length>=2&&secondWidth<=Math.max(pageWidth*.3,row.fontSize*8)&&secondWidth<=firstWidth*.85);
    }
    const tableRuns=[];const usedRows=new Set();
    for(let i=0;i<visualRows.length;i++){
      const first=visualRows[i];if(!first.tableCandidate||usedRows.has(first))continue;
      const run=[first];let last=first,evidence=1,missingCellRows=0;
      for(let j=i+1;j<visualRows.length;j++){
        const next=visualRows[j],gap=next.top-last.bottom,tolerance=Math.max(12,first.fontSize*1.5),cellTolerance=Math.max(18,first.fontSize*2);
        if(gap>Math.max(18,first.fontSize*2.6)||Math.abs(next.cells[0]?.left-first.cells[0].left)>tolerance)break;
        if(next.tableCandidate){
          if(!next.cells[1].approximate&&!first.cells[1].approximate&&Math.abs(next.cells[1].left-first.cells[1].left)>cellTolerance)break;
          run.push(next);last=next;evidence++;missingCellRows=0;
        }else if(next.cells.length===1&&missingCellRows===0){run.push(next);last=next;missingCellRows++;}
        else break;
      }
      if(evidence<2)continue;
      const tolerance=Math.max(12,first.fontSize*1.5),prefix=[];
      for(let j=i-1;j>=0&&prefix.length<2;j--){
        const row=visualRows[j],gap=(prefix[0]||first).top-row.bottom,cell=row.cells[0],text=cell?.text||'';
        const trailingCode=/^(.+?)\s+([A-Z][A-Z0-9-]{0,5}|-)$/u.test(text),aligned=cell&&Math.abs(cell.left-first.cells[0].left)<=tolerance;
        if(row.cells.length!==1||!aligned||!trailingCode||gap>Math.max(18,first.fontSize*2.6))break;
        prefix.unshift(row);
      }
      const complete=[...prefix,...run],tableId=tableRuns.length+1,secondColumnX=first.cells[1].left;
      for(const row of complete){
        if(row.cells.length===1&&prefix.includes(row)){
          const match=row.cells[0].text.match(/^(.+?)\s+([A-Z][A-Z0-9-]{0,5}|-)$/u);
          if(match){const left=row.cells[0],code=match[2];row.cells=[{...left,text:normPdfText(match[1])},{parts:[],text:code,left:secondColumnX,right:secondColumnX+Math.max(row.fontSize,code.length*row.fontSize*.55)}];}
        }
        row.tableId=tableId;row.tableText=row.cells.map(cell=>cell.text).filter(Boolean).join(' | ');usedRows.add(row);
      }
      tableRuns.push(complete);
    }
    const replacedLines=new Map();
    for(const run of tableRuns)for(const row of run){
      const parts=row.lines.flatMap(line=>line.parts),synthetic={parts,text:row.tableText,x:row.cells[0].left,left:row.cells[0].left,right:row.cells.at(-1).right,y:row.y,top:row.top,bottom:row.bottom,fontSize:row.fontSize,angle:row.lines[0]?.angle||0,rtl:false,tableId:row.tableId};
      for(const line of row.lines)replacedLines.set(line,synthetic);
    }
    const workingLines=[],seenTableRows=new Set();
    for(const line of lines){const replacement=replacedLines.get(line);if(!replacement)workingLines.push(line);else if(!seenTableRows.has(replacement)){workingLines.push(replacement);seenTableRows.add(replacement);}}
    // A wide, stable gutter plus vertically overlapping text lines is a stronger two-column signal than x-position alone.
    const starts=workingLines.map(line=>line.left).sort((a,b)=>a-b);let split=null,largest=0;
    for(let i=1;i<=starts.length-2;i++){const gap=starts[i]-starts[i-1];if(gap>largest&&gap>=Math.max(32,pageWidth*.12)){largest=gap;split=(starts[i]+starts[i-1])/2;}}
    let columns=null;
    if(split!=null){const left=workingLines.filter(line=>line.left<split),right=workingLines.filter(line=>line.left>=split);if(left.length>=2&&right.length>=2){const overlap=Math.min(Math.max(...left.map(x=>x.bottom)),Math.max(...right.map(x=>x.bottom)))-Math.max(Math.min(...left.map(x=>x.top)),Math.min(...right.map(x=>x.top)));if(overlap>Math.min(Math.max(...left.map(x=>x.bottom))-Math.min(...left.map(x=>x.top)),Math.max(...right.map(x=>x.bottom))-Math.min(...right.map(x=>x.top)))*.25)columns=[left,right];}}
    const readingLines=columns?columns.flatMap((column,columnIndex)=>column.sort((a,b)=>a.y-b.y||a.left-b.left).map(line=>({...line,columnIndex}))):workingLines.sort((a,b)=>a.y-b.y||a.left-b.left);
    const paragraphs=[];let current=null;
    const bullet=/^(?:[•◦▪‣*-]|\d{1,3}[.)]|\([a-z0-9]+\))\s/i;
    for(const line of readingLines){if(!line.text)continue;const previous=current?.lines.at(-1),gap=previous?line.top-previous.bottom:Infinity;
      const sameTable=Boolean(line.tableId&&current?.tableId===line.tableId),tableBoundary=Boolean(line.tableId)!==Boolean(current?.tableId)||(line.tableId&&current?.tableId&&line.tableId!==current.tableId);
      const fontBreak=previous&&Math.abs(line.fontSize-previous.fontSize)>Math.max(1.5,previous.fontSize*.2);
      const newParagraph=!sameTable&&(tableBoundary||!current||!previous||line.columnIndex!==previous.columnIndex||gap>Math.max(5,line.fontSize*.72)||fontBreak||bullet.test(line.text));
      if(newParagraph){current={text:line.text,lines:[line],items:[],tableId:line.tableId||0,rows:line.tableId?[line.text]:[]};paragraphs.push(current);}else{
        if(sameTable){current.text+='\n'+line.text;current.rows.push(line.text);}
        else{const last=current.text;if(/(?:[A-Za-z]{3,})[-\u2010\u00ad]$/.test(last)&&/^[a-z]/.test(line.text))current.text=last.slice(0,-1)+line.text;else current.text=normPdfText(last+' '+line.text);}
        current.lines.push(line);
      }
      current.items.push(...line.parts.map(part=>part.index));
    }
    const fragmentToParagraph=Array(items.length).fill(-1);
    const clean=paragraphs.map((paragraph,index)=>{for(const fragment of paragraph.items)fragmentToParagraph[fragment]=index;const text=paragraph.tableId?paragraph.rows.map(normPdfText).filter(Boolean).join('\n'):normPdfText(paragraph.text),top=Math.min(...paragraph.lines.map(line=>line.top)),bottom=Math.max(...paragraph.lines.map(line=>line.bottom)),height=Math.max(1,viewport.height);return {text,items:paragraph.items,edgeTop:Math.max(0,Math.min(1,top/height)),edgeBottom:Math.max(0,Math.min(1,bottom/height)),...(paragraph.tableId?{isTable:true,rows:paragraph.rows.map(normPdfText).filter(Boolean)}:{})};}).filter(paragraph=>paragraph.text);
    // Filtering is normally a no-op; rebuild indices defensively if an empty paragraph was discarded.
    if(clean.length!==paragraphs.length){fragmentToParagraph.fill(-1);clean.forEach((p,i)=>p.items.forEach(index=>fragmentToParagraph[index]=i));}
    return {paragraphs:clean,fragmentToParagraph};
  }
  function mapPdfTextDivs(divTexts, itemTexts, fragmentToParagraph, paragraphCount) {
    let itemCursor = 0;
    return divTexts.map((value, currentIndex) => {
      const text = normPdfText(value);
      let itemIndex = currentIndex;
      if (normPdfText(itemTexts[currentIndex]) !== text) {
        for (let candidate = itemCursor; candidate < itemTexts.length; candidate++) {
          if (normPdfText(itemTexts[candidate]) === text) { itemIndex = candidate; break; }
        }
      }
      let paragraphIndex = fragmentToParagraph[itemIndex];
      if (!Number.isInteger(paragraphIndex) || paragraphIndex < 0) {
        paragraphIndex = fragmentToParagraph[Math.min(currentIndex, fragmentToParagraph.length - 1)];
      }
      if (!Number.isInteger(paragraphIndex) || paragraphIndex < 0) paragraphIndex = Math.max(0, paragraphCount - 1);
      itemCursor = Math.max(itemCursor, itemIndex + 1);
      return { itemIndex, paragraphIndex };
    });
  }
  async function checkedZip(blob, lib) {
    const zip = await lib.JSZip.loadAsync(await blob.arrayBuffer()); let expanded = 0, count = 0;
    for (const item of Object.values(zip.files)) {
      if (++count > 12000 || (expanded += Number(item._data?.uncompressedSize) || 0) > MAX_EXPANDED || Number(item._data?.uncompressedSize) > 50 * 1024 * 1024) throw new Error('documentsArchiveLimit');
    }
    return zip;
  }
  async function image(blob) {
    const url = URL.createObjectURL(blob), img = new Image(); img.src = url;
    try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw new Error('documentsBadImage'); }
    const pages = [{ width:px(img.naturalWidth), height:px(img.naturalHeight), texts:[] }];
    return { pages, kind:'image', image:true, async render(target) { const el = img.cloneNode(); el.className = 'actualImage'; el.draggable = false; target.replaceChildren(el); }, async thumbnail() { return drawImageThumb(img); }, dispose() { URL.revokeObjectURL(url); } };
  }
  function drawImageThumb(img) {
    const canvas = document.createElement('canvas'), ratio = Math.min(240 / img.naturalWidth, 320 / img.naturalHeight, 1);
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/png');
  }
  async function pdf(blob, hooks) {
    const lib = await pdfLibrary();
    const task = lib.getDocument({ data:new Uint8Array(await blob.arrayBuffer()), cMapUrl:new URL('pdfjs/cmaps/', base).href, cMapPacked:true, standardFontDataUrl:new URL('pdfjs/standard_fonts/', base).href, wasmUrl:new URL('pdfjs/wasm/', base).href, isEvalSupported:false, enableXfa:false, stopAtErrors:false, useWasm:true });
    let passwordProtected=false;
    task.onPassword = (update, reason) => { passwordProtected=true; Promise.resolve(hooks.password(reason)).then(value => { if (value === null) task.destroy(); else update(value); }).catch(() => task.destroy()); };
    task.onProgress = info => hooks.progress?.(Math.min(.25, info.total ? info.loaded / info.total * .25 : .05));
    let document;
    try { document = await task.promise; } catch (e) { await task.destroy(); throw e; }
    if (document.numPages > MAX_PAGES) { await document.destroy(); throw new Error('documentsPageLimit'); }
    const pages = [];
    try {
      for (let index = 1; index <= document.numPages; index++) {
        hooks.check?.(); const page = await document.getPage(index), viewport = page.getViewport({ scale:1 }), content = await page.getTextContent();
        if(viewport.width>40000||viewport.height>40000)throw new Error('documentsPageLimit');
        const pdfItems = content.items.filter(x => typeof x?.str === 'string' && x.str.trim());
        const rebuilt = reconstructPdfParagraphs(pdfItems, viewport, viewport.width);
        pages.push({ width:viewport.width, height:viewport.height, texts:rebuilt.paragraphs.map(x => x.text), paragraphs:rebuilt.paragraphs, fragmentToParagraph:rebuilt.fragmentToParagraph, pdfItemTexts:pdfItems.map(x => x.str), textContent:content });
        hooks.progress?.(.25 + index / document.numPages * .7);
      }
    } catch (e) { await document.destroy(); throw e; }
    const jobs = new Set(); let disposed = false;
    return { kind:'pdf', pages, passwordProtected,
      async render(target, number) {
        if (disposed) return; const page = await document.getPage(number), spec = pages[number - 1], viewport = page.getViewport({ scale:1 });
        const canvas = window.document.createElement('canvas'), layer = window.document.createElement('div'); layer.className = 'textLayer pdfTextLayer';
        layer.style.setProperty('--total-scale-factor', 1); layer.style.setProperty('--scale-factor', 1);
        const dpr = Math.min(2, Math.max(1,devicePixelRatio||1)*2, 8192/spec.width, 8192/spec.height, Math.sqrt(3500000 / (spec.width * spec.height)));
        canvas.width = Math.ceil(spec.width * dpr); canvas.height = Math.ceil(spec.height * dpr); canvas.style.width = spec.width + 'px'; canvas.style.height = spec.height + 'px';
        target.replaceChildren(canvas, layer);
        const render = page.render({ canvasContext:canvas.getContext('2d'), viewport, transform:[dpr,0,0,dpr,0,0] }); jobs.add(render);
        const textLayer = new lib.TextLayer({ textContentSource:spec.textContent, container:layer, viewport }); jobs.add(textLayer);
        try {
          await Promise.all([render.promise, textLayer.render()]);
          const textDivs = textLayer.textDivs.filter(el => el.textContent.trim());
          const mapped = mapPdfTextDivs(textDivs.map(el => el.textContent), spec.pdfItemTexts, spec.fragmentToParagraph, spec.texts.length), seenParagraphs = new Set();
          for (let i = 0; i < textDivs.length; i++) {
            const el = textDivs[i], paragraphIndex = mapped[i].paragraphIndex;
            el.classList.add('para'); el.dataset.page = number; el.dataset.i = i; el.dataset.paragraphIndex = paragraphIndex;
            const paragraph=spec.paragraphs[paragraphIndex];if(Number.isFinite(paragraph?.edgeTop))el.dataset.edgeTop=paragraph.edgeTop;if(Number.isFinite(paragraph?.edgeBottom))el.dataset.edgeBottom=paragraph.edgeBottom;
            if (paragraph?.isTable) el.dataset.pdfTable = 'true';
            if (!seenParagraphs.has(paragraphIndex)) { el.dataset.paragraphStart = 'true'; seenParagraphs.add(paragraphIndex); }
            // Keep PDF.js' positioned text span untouched; its child owns marks and selections.
            const en = window.document.createElement('span'); en.className = 'en'; en.textContent = el.textContent; el.replaceChildren(en);
          }
        } finally { jobs.delete(render); jobs.delete(textLayer); }
      },
      async thumbnail(pageNumber = 1) { const index=Math.max(1,Math.min(pages.length,Math.round(+pageNumber)||1))-1,page=await document.getPage(index+1),spec=pages[index],vp=page.getViewport({scale:Math.min(120/spec.width,160/spec.height,1)}),c=window.document.createElement('canvas');c.width=Math.max(1,Math.ceil(vp.width));c.height=Math.max(1,Math.ceil(vp.height));const render=page.render({canvasContext:c.getContext('2d'),viewport:vp});jobs.add(render);try{await render.promise;return c.toDataURL('image/png');}finally{jobs.delete(render);} },
      dispose() { disposed = true; for (const job of jobs) { try { job.cancel(); } catch {} } jobs.clear(); void document.destroy(); }
    };
  }
  async function speakerNotes(zip, presentationXml) {
    const parse=text=>new DOMParser().parseFromString(text,'application/xml'), resolve=(dir,target)=>{if(!target||/^[a-z]+:/i.test(target))return '';const parts=[];for(const p of (target.startsWith('/')?target.slice(1):dir+'/'+target).split('/')){if(p==='..')parts.pop();else if(p&&p!=='.')parts.push(p);}return parts.join('/');};
    const relFile=zip.file('ppt/_rels/presentation.xml.rels'), paths=[];
    if(relFile){const rels=parse(await relFile.async('string'));for(const id of presentationXml.getElementsByTagNameNS('*','sldId')){const rid=id.getAttribute('r:id'),rel=[...rels.getElementsByTagNameNS('*','Relationship')].find(x=>x.getAttribute('Id')===rid);if(rel&&rel.getAttribute('TargetMode')!=='External')paths.push(resolve('ppt',rel.getAttribute('Target')));}}
    if(!paths.length)paths.push(...Object.keys(zip.files).filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})));
    const out=[];for(const path of paths){const dir=path.slice(0,path.lastIndexOf('/')),rels=zip.file(dir+'/_rels/'+path.slice(path.lastIndexOf('/')+1)+'.rels');let text='';if(rels){const xml=parse(await rels.async('string')),ref=[...xml.getElementsByTagNameNS('*','Relationship')].find(x=>x.getAttribute('Type')?.endsWith('/notesSlide')&&x.getAttribute('TargetMode')!=='External'),note=ref&&zip.file(resolve(dir,ref.getAttribute('Target')));if(note){const doc=parse(await note.async('string'));text=[...doc.getElementsByTagNameNS('*','sp')].filter(sp=>sp.getElementsByTagNameNS('*','ph')[0]?.getAttribute('type')==='body').map(sp=>[...sp.getElementsByTagNameNS('*','p')].map(p=>[...p.getElementsByTagNameNS('*','t')].map(t=>t.textContent).join('')).join('\n')).join('\n').trim().slice(0,20000);}}out.push(text);}return out;
  }
  async function office(blob, kind, hooks) {
    const lib = await officeLibrary(), zip = await checkedZip(blob, lib); hooks.check?.(); hooks.progress?.(.35);
    const holder = document.createElement('div'), styles = document.createElement('div'); holder.className = 'officeMeasure docsSource';
    Object.assign(holder.style, { position:'fixed', left:'-100000px', top:'0', visibility:'hidden', zIndex:'-1' }); document.body.append(holder, styles);
    const pages = [], nodes = []; let styleNode;
    try {
      if (kind === 'docx') {
        if (!zip.file('word/document.xml')) throw new Error('documentsBadFile');
        await lib.renderDocx(blob, holder, styles, { className:'keepitDocx', inWrapper:false, ignoreLastRenderedPageBreak:false, breakPages:true, useBase64URL:true, renderAltChunks:false, renderComments:false, experimental:false });
        const cleanCss = [...styles.querySelectorAll('style')].map(el => safeStyles(el.textContent)).join('\n');
        styles.replaceChildren(); styleNode = document.createElement('style'); styleNode.textContent = cleanCss; styles.append(styleNode);
        for (const section of [...holder.querySelectorAll('section.keepitDocx')]) {
          const clean = document.createElement('section'); clean.append(sanitizeOffice(section.outerHTML, lib.purify)); const page = clean.firstElementChild;
          section.replaceWith(page); const rect = page.getBoundingClientRect();
          const spec = { width:px(rect.width || 794), height:px(Math.max(page.scrollHeight, rect.height, 1123)), texts:[], edgePositions:[] };
          attachBlocks(page, pages.length + 1, spec.texts, spec.edgePositions); pages.push(spec); nodes.push(page);
        }
      } else {
        const presentation = zip.file('ppt/presentation.xml'); if (!presentation) throw new Error('documentsBadFile');
        const xml = new DOMParser().parseFromString(await presentation.async('string'), 'application/xml'), size = xml.getElementsByTagNameNS('*', 'sldSz')[0];
        const width = 960, height = Math.round(960 * ((Number(size?.getAttribute('cy')) || 5143500) / (Number(size?.getAttribute('cx')) || 9144000)));
        const notes = await speakerNotes(zip, xml);
        const html = await lib.pptxToHtml(await blob.arrayBuffer(), { width, height, scaleToFit:true, letterbox:false });
        for (const source of html) {
          hooks.check?.(); const page = document.createElement('div'); page.append(sanitizeOffice(source, lib.purify)); holder.append(page);
          const spec = { width, height, texts:[], notes:notes[pages.length]||'', edgePositions:[] }; attachBlocks(page, pages.length + 1, spec.texts, spec.edgePositions); pages.push(spec); nodes.push(page);
        }
      }
      if (!pages.length || pages.length > MAX_PAGES) throw new Error('documentsPageLimit');
      hooks.progress?.(.95);
      const css = styles.textContent; holder.remove(); styles.remove();
      if (css) { styleNode = document.createElement('style'); styleNode.textContent = css; document.head.append(styleNode); }
      return { kind, pages,
        async render(target, page) { target.replaceChildren(nodes[page - 1].cloneNode(true)); },
        async thumbnail(pageNumber = 1) {
          const spec=pages[Math.max(1,Math.min(pages.length,Math.round(+pageNumber)||1))-1]||pages[0];
          const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = kind === 'pptx' ? 68 : 160; const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#374151'; ctx.font = '6px sans-serif';
          let y = 11; for (const text of spec.texts) { let line = ''; for (const word of text.split(/\s+/)) { if (ctx.measureText(line + ' ' + word).width > 104) { ctx.fillText(line,8,y); y += 8; line = word; } else line += (line ? ' ' : '') + word; if (y > canvas.height - 10) break; } ctx.fillText(line,8,y); y += 10; if (y > canvas.height - 10) break; }
          return canvas.toDataURL('image/png');
        },
        dispose() { styleNode?.remove(); nodes.length = 0; }
      };
    } catch (error) { holder.remove(); styles.remove(); styleNode?.remove(); throw error; }
  }
  async function prepare(blob, kind, hooks = {}) {
    if (kind === 'image') return image(blob);
    if (kind === 'pdf') return pdf(blob, hooks);
    return office(blob, kind, hooks);
  }
  globalThis.KeepitDocumentRenderers = Object.freeze({ prepare });
})();
