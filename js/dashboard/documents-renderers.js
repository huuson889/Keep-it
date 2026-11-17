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
  function attachBlocks(root, page, texts) {
    const candidates = [...root.querySelectorAll('p,td,h1,h2,h3,h4,h5,h6,li')].filter(el => !el.querySelector('p,td,li') && el.textContent.trim());
    if (!candidates.length) for (const el of root.querySelectorAll('div')) if (!el.querySelector('div,p,table,svg,img') && el.textContent.trim()) candidates.push(el);
    for (const el of candidates) {
      const text = el.textContent.replace(/\s+/g, ' ').trim(); if (!text) continue;
      el.classList.add('para'); el.dataset.page = page; el.dataset.i = texts.length;
      const en = document.createElement('span'); en.className = 'en'; while (el.firstChild) en.append(el.firstChild); el.append(en); texts.push(text);
    }
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
        pages.push({ width:viewport.width, height:viewport.height, texts:content.items.filter(x => typeof x.str === 'string' && x.str.trim()).map(x => x.str), textContent:content });
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
          await Promise.all([render.promise, textLayer.render()]); let i = 0;
          for (const el of textLayer.textDivs) {
            if (!el.textContent.trim()) continue; el.classList.add('para'); el.dataset.page = number; el.dataset.i = i++;
            // Keep PDF.js' positioned text span untouched; its child owns marks and selections.
            const en = window.document.createElement('span'); en.className = 'en'; en.textContent = el.textContent; el.replaceChildren(en);
          }
        } finally { jobs.delete(render); jobs.delete(textLayer); }
      },
      async thumbnail() { const page = await document.getPage(1), vp = page.getViewport({ scale:Math.min(240 / pages[0].width, 320 / pages[0].height) }), c = window.document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height); await page.render({ canvasContext:c.getContext('2d'), viewport:vp }).promise; return c.toDataURL('image/png'); },
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
          const spec = { width:px(rect.width || 794), height:px(Math.max(page.scrollHeight, rect.height, 1123)), texts:[] };
          attachBlocks(page, pages.length + 1, spec.texts); pages.push(spec); nodes.push(page);
        }
      } else {
        const presentation = zip.file('ppt/presentation.xml'); if (!presentation) throw new Error('documentsBadFile');
        const xml = new DOMParser().parseFromString(await presentation.async('string'), 'application/xml'), size = xml.getElementsByTagNameNS('*', 'sldSz')[0];
        const width = 960, height = Math.round(960 * ((Number(size?.getAttribute('cy')) || 5143500) / (Number(size?.getAttribute('cx')) || 9144000)));
        const notes = await speakerNotes(zip, xml);
        const html = await lib.pptxToHtml(await blob.arrayBuffer(), { width, height, scaleToFit:true, letterbox:false });
        for (const source of html) {
          hooks.check?.(); const page = document.createElement('div'); page.append(sanitizeOffice(source, lib.purify));
          const spec = { width, height, texts:[], notes:notes[pages.length]||'' }; attachBlocks(page, pages.length + 1, spec.texts); pages.push(spec); nodes.push(page);
        }
      }
      if (!pages.length || pages.length > MAX_PAGES) throw new Error('documentsPageLimit');
      hooks.progress?.(.95);
      const css = styles.textContent; holder.remove(); styles.remove();
      if (css) { styleNode = document.createElement('style'); styleNode.textContent = css; document.head.append(styleNode); }
      return { kind, pages,
        async render(target, page) { target.replaceChildren(nodes[page - 1].cloneNode(true)); },
        async thumbnail() {
          const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = kind === 'pptx' ? 135 : 320; const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#374151'; ctx.font = '11px sans-serif';
          let y = 22; for (const text of pages[0].texts) { let line = ''; for (const word of text.split(/\s+/)) { if (ctx.measureText(line + ' ' + word).width > 208) { ctx.fillText(line,16,y); y += 15; line = word; } else line += (line ? ' ' : '') + word; if (y > canvas.height - 20) break; } ctx.fillText(line,16,y); y += 19; if (y > canvas.height - 20) break; }
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
