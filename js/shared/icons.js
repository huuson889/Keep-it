(() => {const ICON_PATHS = {
  // Approved file-label demo v5, option 3.
  "file-kind-pdf": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\" fill=\"currentColor\" stroke=\"none\"></path><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" fill=\"#fff\" fill-opacity=\".27\" stroke=\"none\"></path><path d=\"M6.4 17.5v-5h1.2a1.25 1.25 0 0 1 0 2.5H6.4m4.2 2.5v-5h.9c2.7 0 2.7 5 0 5h-.9m4.7 0v-5H18m-2.7 2.3h2.2\" stroke=\"#fff\" stroke-width=\"1.05\" transform=\"translate(12 15) scale(.88) translate(-12 -15)\"></path>",
  "file-kind-docx": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\" fill=\"currentColor\" stroke=\"none\"></path><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" fill=\"#fff\" fill-opacity=\".27\" stroke=\"none\"></path><path d=\"M7.5 12l2 6 2.5-5 2.5 5 2-6\" stroke=\"#fff\" stroke-width=\"1.6\"></path>",
  "file-kind-pptx": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\" fill=\"currentColor\" stroke=\"none\"></path><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" fill=\"#fff\" fill-opacity=\".27\" stroke=\"none\"></path><path d=\"M9 18v-7h3a2.25 2.25 0 0 1 0 4.5H9\" stroke=\"#fff\" stroke-width=\"1.6\"></path>",
  "file-kind-image": "<rect fill=\"currentColor\" height=\"18\" rx=\"3\" stroke=\"none\" width=\"18\" x=\"3\" y=\"3\"></rect><circle cx=\"8\" cy=\"8\" fill=\"#fff\" r=\"1.5\" stroke=\"none\"></circle><path d=\"m4.5 16 3.2-3.2 3 3L16 10.5l3.5 3.5\" stroke=\"#fff\" stroke-width=\"1.5\"></path>",
  // Approved Trash icons demo v1, option B (folded-file family).
  "file-kind-web": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" fill=\"#fff\" fill-opacity=\".27\" stroke=\"none\"/><circle cx=\"12\" cy=\"14.5\" r=\"4.6\" stroke=\"#fff\" stroke-width=\"1.15\"/><path d=\"M7.4 14.5h9.2M12 10c-2.3 2.4-2.3 6.6 0 9M12 10c2.3 2.4 2.3 6.6 0 9\" stroke=\"#fff\" stroke-width=\"1.05\"/>",
  "file-kind-note": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" fill=\"#fff\" fill-opacity=\".27\" stroke=\"none\"/><path d=\"M8 11h8M8 14.5h8M8 18h5\" stroke=\"#fff\" stroke-width=\"1.5\"/>",
  "file-kind-dictation": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" fill=\"#fff\" fill-opacity=\".27\" stroke=\"none\"/><path d=\"M8 15v-1a4 4 0 0 1 8 0v1\" stroke=\"#fff\" stroke-width=\"1.4\"/><rect x=\"7\" y=\"14\" width=\"3\" height=\"5.4\" rx=\"1.2\" fill=\"#fff\" stroke=\"none\"/><rect x=\"14\" y=\"14\" width=\"3\" height=\"5.4\" rx=\"1.2\" fill=\"#fff\" stroke=\"none\"/>",
  "file-kind-speak": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" fill=\"#fff\" fill-opacity=\".27\" stroke=\"none\"/><rect x=\"10\" y=\"9.7\" width=\"4\" height=\"6.5\" rx=\"2\" fill=\"#fff\" stroke=\"none\"/><path d=\"M8 14v.8a4 4 0 0 0 8 0V14M12 19v1M10 20h4\" stroke=\"#fff\" stroke-width=\"1.1\"/>",
  // Documents toolbar and Keepit main tools sheet share these exact glyphs.
  "tool-translate": '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  "tool-read": '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  "tool-word-class": '<path d="M3 6h8"/><path d="M5 10h4"/><path d="M14 6h7"/><path d="M15.5 10h4"/><path d="M3 15h8"/><path d="M5 19h4"/><path d="M14 15h7"/><path d="M15.5 19h4"/>',
  "tool-notes": '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  "tool-ai": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4M22 5h-4M4 17v2M5 18H3"/>',
  "tool-ocr": '<path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 8h8"></path><path d="M7 12h10"></path><path d="M7 16h6"></path>',

  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>',
  "file-spreadsheet": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M8 13h8M8 17h8M12 12v6"/>',
  "file-code": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M10 13l-2 2 2 2M14 13l2 2-2 2"/>',
  "file-json": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M10 12c-1 0-1 1-1 2s0 2-1 2M14 12c1 0 1 1 1 2s0 2 1 2"/>',
  settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  external: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  sparkles: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>',
  cursor: '<path d="m5 3 14 9-7 1-3 7L5 3Z"/><path d="m12 13 5 6"/>',
  "square-text": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h8M7 12h10M7 16h6"',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  "flow-single": '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M8 7h8M8 11h8M8 15h8"/>',
  "flow-continuous": '<path d="M4 2h16v11H4zM4 22v-6h16v6M8 6h8M8 9h8M8 20h8"/>',
  "flow-facing": '<rect x="2" y="2" width="9" height="20" rx="1"/><rect x="13" y="2" width="9" height="20" rx="1"/><path d="M5 7h3M5 11h3M5 15h3M16 7h3M16 11h3M16 15h3"/>',
  "flow-facingContinuous": '<path d="M2 2h9v11H2zM13 2h9v11h-9zM2 22v-6h9v6M13 22v-6h9v6M5 6h3M5 9h3M16 6h3M16 9h3M5 20h3M16 20h3"/>',
  // v3.5.542: icon của 5 tab Dashboard + Thùng rác — MỘT nguồn cho cả menu trái dashboard và thanh Keepit
  "nav-overview": '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  "nav-dictation": '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  "nav-flashcards": '<rect width="14" height="17" x="3" y="4" rx="2"/><path d="M7 8h6M7 12h6"/><path d="M16 8h2a2 2 0 0 1 2 2v10H8"/>',
  "nav-notes": '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  "nav-docs": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5M8 13h8M8 17h6"/>',
  "nav-trash": '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>'
};
  function render(name, cls = '') { const path = globalThis.LHN_CONFIG.ACTION_ICON_PATHS[name] || ICON_PATHS[name] || ICON_PATHS.sparkles; return `<svg class="lucide ${cls}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`; }
  // <svg data-icon="nav-overview"> … </svg> anywhere in a page gets its paths from here (one source, two places)
  function applyIcons(root = document) { root.querySelectorAll?.("[data-icon]").forEach(el => { const name = el.dataset.icon, path = ICON_PATHS[name]; if (path && el.innerHTML.trim() === "") el.innerHTML = path; }); }

  function createFlowSelect(select, direction = 'down', icons = true) {
    const wrapper = document.createElement('div'); wrapper.className = 'flow-select'; wrapper.dataset.direction = direction; wrapper.classList.toggle('flow-select-zoom', !icons);
    const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'flow-select-trigger'; trigger.setAttribute('role', 'combobox'); trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-expanded', 'false');
    const list = document.createElement('div'); list.className = 'flow-select-list'; list.setAttribute('role','listbox'); list.id = select.id + '-options'; trigger.setAttribute('aria-controls', list.id); list.hidden = true;
    select.before(wrapper); wrapper.append(select, trigger, list); select.hidden = true;
    const measure = document.createElement('canvas').getContext('2d');
    const refresh = () => {
      const chosen = select.selectedOptions[0]; if (!chosen) return;
      trigger.innerHTML = (icons ? render('flow-'+chosen.value) : '') + '<span></span><svg class="flow-select-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
      trigger.querySelector('span').textContent = chosen.textContent; trigger.setAttribute('aria-label', (select.getAttribute('aria-label') || '') + ': ' + chosen.textContent);
      const style=getComputedStyle(trigger);measure.font=style.font;const max=Math.max(0,...[...select.options].filter(option=>!option.hidden).map(option=>measure.measureText(option.dataset.full||option.textContent).width));wrapper.style.width=Math.ceil(max+(icons?56:36))+'px';
      list.replaceChildren();
      for (const option of select.options) {
        if (option.hidden) continue;
        const item = document.createElement('button'); item.type='button'; item.className='flow-select-option'; item.setAttribute('role','option'); item.setAttribute('aria-selected',String(option.selected)); item.disabled=option.disabled; item.dataset.value=option.value; item.innerHTML=(icons ? render('flow-'+option.value) : '')+'<span></span>'; item.querySelector('span').textContent=option.dataset.full||option.textContent;
        item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true})); close();trigger.focus();}); list.append(item);
      }
    };
    const setOpen = open => {
      if (open) {
        const box=trigger.getBoundingClientRect(), clip=wrapper.closest('.moreBody')?.getBoundingClientRect();
        const top=clip?.top ?? 0, bottom=clip?.bottom ?? innerHeight, above=box.top-top-6, below=bottom-box.bottom-6;
        wrapper.dataset.direction = above > below ? 'up' : 'down';
        list.style.maxHeight = Math.max(60,Math.min(460,wrapper.dataset.direction==='up'?above:below))+'px';
      }
      list.hidden=!open; trigger.setAttribute('aria-expanded',String(open)); wrapper.dispatchEvent(new CustomEvent('document-select-visibility',{bubbles:true,detail:{open}}));
    };
    const close = () => { if(!list.hidden)setOpen(false); };
    trigger.addEventListener('click',()=>{if(!list.hidden){close();return;} refresh(); setOpen(true);});
    wrapper.addEventListener('keydown',event=>{ if(event.key==='Escape'&&!list.hidden){event.preventDefault();event.stopPropagation();close();trigger.focus();} else if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(list.hidden){refresh();setOpen(true);}const choices=[...list.querySelectorAll('button:not(:disabled)')];const index=choices.indexOf(document.activeElement);choices[(index+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length]?.focus();} });
    document.addEventListener('pointerdown',event=>{if(!wrapper.contains(event.target))close();});
    select.addEventListener('change', refresh); refresh();
    return Object.freeze({refresh,close,element:wrapper});
  }
  globalThis.LHN_ICONS = Object.freeze({ render, applyIcons, createFlowSelect });
})();