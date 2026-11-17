/* Isolated DOM highlighter used by the page content controller. */
globalThis.LHNWebHighlighter = (() => {
  function create({ config, attachMarkEvents, restoreExcludedSelector }) {
    let previewSegments = null;
    const translationMutationShields = new WeakMap();
    const withTranslationMutationShield = (target, mutate) => {
      if (!target || target.nodeType !== Node.ELEMENT_NODE) { mutate(); return; }
      let shield = translationMutationShields.get(target);
      if (!shield) {
        shield = {
          hadNotranslate: target.classList.contains("notranslate"),
          translate: target.getAttribute("translate"),
          timer: 0
        };
        translationMutationShields.set(target, shield);
      } else if (shield.timer) clearTimeout(shield.timer);
      // Immersive Translate filters the mutation target (the text's parent), not the
      // inserted <mark>. Shield that exact target while its child list is changing.
      target.classList.add("notranslate");
      target.setAttribute("translate", "no");
      try { mutate(); }
      finally {
        shield.timer = setTimeout(() => {
          if (!shield.hadNotranslate) target.classList.remove("notranslate");
          if (shield.translate === null) target.removeAttribute("translate");
          else target.setAttribute("translate", shield.translate);
          translationMutationShields.delete(target);
        }, 500);
      }
    };
    const isWhiteTextColor = color => {
      const body = String(color).match(/rgba?\(([^)]+)\)/i)?.[1];
      if (!body) return false;
      const values = body.trim().split(/[,/\s]+/).filter(Boolean).map(Number);
      return values.length >= 3 && values[0] >= 230 && values[1] >= 230 && values[2] >= 230 && (values.length < 4 || values[3] >= 0.7);
    };
    const isWhiteTextElement = element => {
      const style = getComputedStyle(element || document.documentElement);
      return isWhiteTextColor(style.color) || isWhiteTextColor(style.webkitTextFillColor);
    };
    const nodeIsPdfText = node => {
      const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
      return !!element?.closest?.(".pdfTextLayer");
    };
    const collectSegments = range => {
      const segments = [];
      const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.parentElement?.closest(restoreExcludedSelector) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      if (range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer === range.endContainer) {
        segments.push({ node:range.startContainer, start:range.startOffset, end:range.endOffset });
      } else {
        let node;
        while ((node = walker.nextNode())) {
          try { if (!range.intersectsNode(node)) continue; } catch { continue; }
          const start = node === range.startContainer ? range.startOffset : 0;
          const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
          if (end > start) segments.push({ node, start, end });
        }
      }
      return segments;
    };
    function pdfRectsForSegments(segments) {
      const bySource = new Map();
      for (const {node,start,end} of segments) {
        const source=node?.parentElement?.closest?.('.docsSource');if(!source||!nodeIsPdfText(node)||end<=start)continue;
        const range=document.createRange();range.setStart(node,start);range.setEnd(node,end);
        if(!bySource.has(source))bySource.set(source,[]);
        for(const rect of range.getClientRects())if(rect.width>.1&&rect.height>.1)bySource.get(source).push({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom});
      }
      const merged=[];
      for(const [source,rects] of bySource){
        rects.sort((a,b)=>a.top-b.top||a.left-b.left);
        for(const rect of rects){
          const previous=merged.at(-1),height=rect.bottom-rect.top,previousHeight=previous?.bottom-previous?.top;
          const sameLine=previous?.source===source&&Math.abs((rect.top+rect.bottom-previous.top-previous.bottom)/2)<=Math.max(2,Math.min(height,previousHeight)*.35);
          const gap=previous?rect.left-previous.right:Infinity,bridge=Math.max(3,Math.min(height,previousHeight||height)*.32);
          if(sameLine&&gap<=bridge){previous.left=Math.min(previous.left,rect.left);previous.right=Math.max(previous.right,rect.right);previous.top=Math.min(previous.top,rect.top);previous.bottom=Math.max(previous.bottom,rect.bottom);}
          else merged.push({source,...rect});
        }
      }
      return merged;
    }
    function pdfHighlightOverlay(source) {
      let overlay=source.querySelector('.lhnPdfHighlightOverlay');
      if(!overlay){overlay=document.createElement('div');overlay.className='lhnPdfHighlightOverlay';overlay.setAttribute('aria-hidden','true');source.append(overlay);}
      return overlay;
    }
    function positionPdfRect(element, source, rect) {
      const bounds=source.getBoundingClientRect(),scale=bounds.width/Math.max(1,source.offsetWidth);
      element.style.left=((rect.left-bounds.left)/scale)+'px';element.style.top=((rect.top-bounds.top)/scale)+'px';
      element.style.width=((rect.right-rect.left)/scale)+'px';element.style.height=((rect.bottom-rect.top)/scale)+'px';
    }
    function decoratePdfMark(mark,item,index,total) {
      const color=config.normalizeColor(item.color);mark.className=`lhnPdfHighlightRect lhn-mark lhn-pdf-highlight lhn-${color} notranslate${total>1?' lhn-fragmented':''}`;
      mark.dataset.lhnId=item.id;mark.dataset.lhnParts=String(total);mark.dataset.lhnPart=String(index);mark.setAttribute('data-lhn-note',item.note||'');mark.setAttribute('translate','no');attachMarkEvents(mark,item.id);
    }
    function mergePdfAnnotationRects(id) {
      const marks=[...document.querySelectorAll(`.lhnPdfHighlightRect[data-lhn-id="${CSS.escape(id)}"]`)],bySource=new Map();
      for(const mark of marks){const source=mark.closest('.docsSource');if(!source)continue;if(!bySource.has(source))bySource.set(source,[]);const r=mark.getBoundingClientRect();bySource.get(source).push({mark,left:r.left,right:r.right,top:r.top,bottom:r.bottom});}
      const survivors=[];
      for(const [source,rects] of bySource){rects.sort((a,b)=>a.top-b.top||a.left-b.left);let group=[];
        for(const rect of rects){const previous=group.at(-1),height=rect.bottom-rect.top,previousHeight=previous?.bottom-previous?.top;
          const sameLine=previous&&Math.abs((rect.top+rect.bottom-previous.top-previous.bottom)/2)<=Math.max(2,Math.min(height,previousHeight)*.35),gap=previous?rect.left-previous.right:Infinity,bridge=Math.max(3,Math.min(height,previousHeight||height)*.32);
          if(sameLine&&gap<=bridge){previous.left=Math.min(previous.left,rect.left);previous.right=Math.max(previous.right,rect.right);previous.top=Math.min(previous.top,rect.top);previous.bottom=Math.max(previous.bottom,rect.bottom);rect.mark.remove();}
          else{if(previous)survivors.push(previous);group=[rect];}
        }
        if(group.length)survivors.push(group.at(-1));
      }
      survivors.forEach((rect,index)=>{positionPdfRect(rect.mark,rect.mark.closest('.docsSource'),rect);rect.mark.dataset.lhnParts=String(survivors.length);rect.mark.dataset.lhnPart=String(index);rect.mark.classList.toggle('lhn-fragmented',survivors.length>1);});
    }
    function drawPdfPreview(segments,color) {
      const rects=pdfRectsForSegments(segments),highlightColor=config.HIGHLIGHT_COLORS[config.normalizeColor(color)],out=[];
      rects.forEach(rect=>{const mark=document.createElement('span');mark.className='lhnPdfHighlightRect lhnPdfHighlightPreview lhn-selection-preview-mark notranslate';
        positionPdfRect(mark,rect.source,rect);mark.style.setProperty('background-color',highlightColor,'important');pdfHighlightOverlay(rect.source).append(mark);out.push({element:mark,pdf:true,whiteText:false});});
      return out;
    }
    function clearPreview() {
      for (const preview of previewSegments || []) if (preview.element.isConnected) {
        withTranslationMutationShield(preview.element.parentElement, () => preview.element.replaceWith(...preview.element.childNodes));
      }
      previewSegments = null;
      window.getSelection()?.removeAllRanges();
    }
    function drawPreview(range, color) {
      if (previewSegments?.some(preview => preview.element.isConnected)) return;
      clearPreview();
      if (!range) return;
      const segments = collectSegments(range);
      if(segments.length&&segments.every(segment=>nodeIsPdfText(segment.node)&&segment.node.parentElement?.closest?.('.docsSource'))){
        previewSegments=drawPdfPreview(segments,color);window.getSelection()?.removeAllRanges();return;
      }
      previewSegments = [];
      for (let i = segments.length - 1; i >= 0; i--) {
        const { node, start, end } = segments[i], pdf = nodeIsPdfText(node);
        if (!node.isConnected || end <= start || end > node.nodeValue.length) continue;
        try {
          const textStyle = getComputedStyle(node.parentElement || document.documentElement);
          const whiteText = isWhiteTextColor(textStyle.color) || isWhiteTextColor(textStyle.webkitTextFillColor);
          const part = document.createRange(); part.setStart(node, start); part.setEnd(node, end);
          const preview = document.createElement("mark"); preview.className = `lhn-selection-preview-mark notranslate${pdf ? " lhn-pdf-highlight" : ""}`; preview.setAttribute("translate", "no");
          const highlightColor = config.HIGHLIGHT_COLORS[config.normalizeColor(color)];
          preview.style.setProperty("background-color", highlightColor, "important");
          preview.style.setProperty("color", whiteText ? "#000" : textStyle.color, "important");
          preview.style.setProperty("border-radius", segments.length > 1 ? "0" : "2px");
          preview.style.setProperty("box-decoration-break", "clone");
          if (whiteText) preview.style.setProperty("-webkit-text-fill-color", "#000", "important");
          else if (textStyle.webkitTextFillColor && textStyle.webkitTextFillColor !== "currentcolor") preview.style.setProperty("-webkit-text-fill-color", textStyle.webkitTextFillColor, "important");
          withTranslationMutationShield(node.parentElement, () => {
            preview.appendChild(part.extractContents()); part.insertNode(preview);
          });
          previewSegments.push({ element: preview, whiteText, pdf });
        } catch (error) { console.warn("Highlight Notes: could not preview selected text", error); }
      }
      window.getSelection()?.removeAllRanges();
    }
    function updatePreviewColor(color) {
      const highlightColor = config.HIGHLIGHT_COLORS[config.normalizeColor(color)];
      for (const preview of previewSegments || []) preview.element.style.setProperty("background-color", highlightColor, "important");
    }
    function commitPreview(item) {
      const previews = previewSegments || [];
      previewSegments = null;
      const color = config.normalizeColor(item.color);
      const fragmented = previews.length > 1;
      previews.forEach((preview, index) => {
        const source = preview.element;
        if (!source.isConnected) return;
        if(preview.pdf){source.classList.remove('lhnPdfHighlightPreview','lhn-selection-preview-mark');source.style.removeProperty('background-color');decoratePdfMark(source,item,index,previews.length);return;}
        const mark = document.createElement("mark");
        withTranslationMutationShield(source.parentElement, () => {
          mark.append(...source.childNodes);
          source.replaceWith(mark);
        });
        mark.className = `lhn-mark lhn-${color} notranslate${preview.whiteText ? " lhn-black-text" : ""}${fragmented ? " lhn-fragmented" : ""}${preview.pdf ? " lhn-pdf-highlight" : ""}`; mark.setAttribute("translate", "no");
        mark.dataset.lhnId = item.id;
        mark.dataset.lhnParts = String(previews.length);
        mark.dataset.lhnPart = String(index);
        mark.setAttribute("data-lhn-note", item.note || "");
        if (preview.whiteText) {
          mark.style.setProperty("color", "#000", "important");
          mark.style.setProperty("-webkit-text-fill-color", "#000", "important");
        }
        attachMarkEvents(mark, item.id);
      });
      if(previews.some(preview=>preview.pdf))mergePdfAnnotationRects(item.id);
    }
    function setMarkColor(id, color) {
      if (!id) return;
      const normalized = config.normalizeColor(color);
      document.querySelectorAll(`[data-lhn-id="${CSS.escape(id)}"]`).forEach(mark => {
        config.COLORS.forEach(existingColor => mark.classList.remove(`lhn-${existingColor}`));
        mark.classList.add(`lhn-${normalized}`);
      });
    }
    function ensureTextReadable(mark) {
      if (!mark || !isWhiteTextElement(mark)) return;
      mark.classList.add("lhn-black-text");
      mark.style.setProperty("color", "#000", "important");
      mark.style.setProperty("-webkit-text-fill-color", "#000", "important");
    }
    function wrapRange(range, item) {
      try {
        if (!range || range.collapsed || !range.startContainer.isConnected || range.commonAncestorContainer.ownerDocument !== document) return false;
        const segments = collectSegments(range);
        if (!segments.length) return false;
        if(segments.every(segment=>nodeIsPdfText(segment.node)&&segment.node.parentElement?.closest?.('.docsSource'))){
          const rects=pdfRectsForSegments(segments);rects.forEach((rect,index)=>{const mark=document.createElement('span');positionPdfRect(mark,rect.source,rect);decoratePdfMark(mark,item,index,rects.length);pdfHighlightOverlay(rect.source).append(mark);});if(rects.length)mergePdfAnnotationRects(item.id);return rects.length>0;
        }
        let wrappedCount = 0;
        const expectedParts = segments.length;
        for (let i = segments.length - 1; i >= 0; i--) {
          const { node, start, end } = segments[i], pdf = nodeIsPdfText(node);
          if (!node.isConnected || end <= start || end > node.nodeValue.length) continue;
          try {
            const whiteText = isWhiteTextElement(node.parentElement || document.documentElement);
            const part = document.createRange(); part.setStart(node, start); part.setEnd(node, end);
            const mark = document.createElement("mark"); mark.className = `lhn-mark lhn-${config.normalizeColor(item.color)} notranslate${expectedParts > 1 ? " lhn-fragmented" : ""}${pdf ? " lhn-pdf-highlight" : ""}`; mark.setAttribute("translate", "no"); mark.dataset.lhnId = item.id; mark.dataset.lhnParts = String(expectedParts); mark.dataset.lhnPart = String(i); mark.setAttribute("data-lhn-note", item.note || "");
            if (whiteText) { mark.classList.add("lhn-black-text"); mark.style.setProperty("color", "#000", "important"); mark.style.setProperty("-webkit-text-fill-color", "#000", "important"); }
            withTranslationMutationShield(node.parentElement, () => {
              mark.appendChild(part.extractContents()); part.insertNode(mark);
            });
            attachMarkEvents(mark, item.id); wrappedCount++;
          } catch (error) { console.warn("Highlight Notes: could not wrap one text fragment", error); }
        }
        return wrappedCount === expectedParts;
      } catch (error) { console.warn("Highlight Notes: could not wrap selected text", error); return false; }
    }
    return Object.freeze({ clearPreview, drawPreview, updatePreviewColor, hasPreview: () => !!previewSegments?.length, commitPreview, setMarkColor, ensureTextReadable, wrapRange });
  }
  return Object.freeze({ create });
})();
