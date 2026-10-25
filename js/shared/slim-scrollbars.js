(() => {
  if (globalThis.LHN_SlimScrollbars) return;

  const HOST_SELECTOR = '[id^="lhn-"], [class*="lhn-"]';
  const managed = new WeakMap();
  const controllers = new WeakMap();
  const liveRecords = new Set();
  const watchedDocuments = new WeakSet();

  function isElement(value) {
    return value && value.nodeType === Node.ELEMENT_NODE;
  }

  function isOwned(element, root) {
    if (!isElement(element)) return false;
    if (root.nodeType === Node.DOCUMENT_NODE) {
      if (root.documentElement?.hasAttribute('data-lhn-app')) return true;
      return !!element.closest(HOST_SELECTOR);
    }
    return true;
  }

  function makeTrack(root, axis) {
    const track = document.createElement('div');
    track.className = 'lhn-slim-scrollbar-track';
    track.dataset.axis = axis;
    track.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('div');
    thumb.className = 'lhn-slim-scrollbar-thumb';
    track.appendChild(thumb);
    root.appendChild(track);
    return { track, thumb };
  }

  function scrollMetrics(element, axis) {
    return axis === 'y'
      ? { scroll: element.scrollTop, extent: element.scrollHeight, view: element.clientHeight }
      : { scroll: element.scrollLeft, extent: element.scrollWidth, view: element.clientWidth };
  }

  function axisVisible(element, axis) {
    const metrics = scrollMetrics(element, axis);
    return metrics.view > 0 && metrics.extent > metrics.view + 1;
  }

  function isAppViewportScroller(element, root) {
    return root.nodeType === Node.DOCUMENT_NODE
      && root.documentElement?.hasAttribute('data-lhn-app')
      && element === root.scrollingElement;
  }

  function clipInsets(element, axis, trackTop, trackLeft, trackHeight, trackWidth) {
    let top = 0, right = 0, bottom = 0, left = 0;
    let ancestor = element.parentElement;
    while (ancestor) {
      const style = getComputedStyle(ancestor);
      const rect = ancestor.getBoundingClientRect();
      if (/hidden|clip|auto|scroll|overlay/.test(style.overflowY)) {
        const clipTop = rect.top + ancestor.clientTop;
        const clipBottom = clipTop + ancestor.clientHeight;
        top = Math.max(top, clipTop - trackTop);
        bottom = Math.max(bottom, trackTop + trackHeight - clipBottom);
      }
      if (/hidden|clip|auto|scroll|overlay/.test(style.overflowX)) {
        const clipLeft = rect.left + ancestor.clientLeft;
        const clipRight = clipLeft + ancestor.clientWidth;
        left = Math.max(left, clipLeft - trackLeft);
        right = Math.max(right, trackLeft + trackWidth - clipRight);
      }
      ancestor = ancestor.parentElement || ancestor.getRootNode()?.host || null;
    }
    return [Math.max(0, top), Math.max(0, right), Math.max(0, bottom), Math.max(0, left)];
  }

  function installTrackEvents(record, axis) {
    const part = record[axis];
    const { track, thumb } = part;
    let pointerStart = 0;
    let scrollStart = 0;
    let dragging = false;

    track.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      const thumbRect = thumb.getBoundingClientRect();
      const thumbStart = axis === 'y' ? thumbRect.top : thumbRect.left;
      const thumbEnd = axis === 'y' ? thumbRect.bottom : thumbRect.right;
      const pointer = axis === 'y' ? event.clientY : event.clientX;
      if (pointer < thumbStart || pointer > thumbEnd) {
        const rect = track.getBoundingClientRect();
        const start = axis === 'y' ? rect.top : rect.left;
        const size = axis === 'y' ? rect.height : rect.width;
        const metrics = scrollMetrics(record.element, axis);
        const ratio = Math.min(1, Math.max(0, (pointer - start) / Math.max(1, size)));
        if (axis === 'y') record.element.scrollTop = ratio * (metrics.extent - metrics.view);
        else record.element.scrollLeft = ratio * (metrics.extent - metrics.view);
      }
      dragging = true;
      pointerStart = pointer;
      scrollStart = axis === 'y' ? record.element.scrollTop : record.element.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
    });

    track.addEventListener('pointermove', event => {
      if (!dragging) return;
      const pointer = axis === 'y' ? event.clientY : event.clientX;
      const travel = axis === 'y' ? track.clientHeight - thumb.offsetHeight : track.clientWidth - thumb.offsetWidth;
      const metrics = scrollMetrics(record.element, axis);
      const range = metrics.extent - metrics.view;
      if (travel <= 0 || range <= 0) return;
      const value = scrollStart + (pointer - pointerStart) * range / travel;
      if (axis === 'y') record.element.scrollTop = value;
      else record.element.scrollLeft = value;
    });

    const stop = () => {
      dragging = false;
      track.classList.remove('is-dragging');
    };
    track.addEventListener('pointerup', stop);
    track.addEventListener('pointercancel', stop);
    track.addEventListener('lostpointercapture', stop);
  }

  function updateTrack(record, axis) {
    const part = record[axis];
    const element = record.element;
    if (!axisVisible(element, axis)) {
      part.track.hidden = true;
      return;
    }

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) {
      part.track.hidden = true;
      return;
    }

    const top = rect.top + element.clientTop;
    const left = rect.left + element.clientLeft;
    const height = element.clientHeight;
    const width = element.clientWidth;
    const metrics = scrollMetrics(element, axis);
    part.track.hidden = false;

    if (axis === 'y') {
      const edge = left + width;
      const thumbSize = Math.min(height, Math.max(28, height * metrics.view / metrics.extent));
      const thumbOffset = (height - thumbSize) * metrics.scroll / Math.max(1, metrics.extent - metrics.view);
      part.track.style.left = `${edge}px`;
      part.track.style.top = `${top}px`;
      part.track.style.height = `${height}px`;
      part.thumb.style.height = `${thumbSize}px`;
      part.thumb.style.transform = `translateY(${thumbOffset}px)`;
      part.track.style.clipPath = `inset(${clipInsets(element, axis, top, edge - 4, height, 4)[0]}px 0 ${clipInsets(element, axis, top, edge - 4, height, 4)[2]}px 0)`;
    } else {
      const edge = top + height;
      const thumbSize = Math.min(width, Math.max(28, width * metrics.view / metrics.extent));
      const thumbOffset = (width - thumbSize) * metrics.scroll / Math.max(1, metrics.extent - metrics.view);
      part.track.style.left = `${left}px`;
      part.track.style.top = `${edge}px`;
      part.track.style.width = `${width}px`;
      part.thumb.style.width = `${thumbSize}px`;
      part.thumb.style.transform = `translateX(${thumbOffset}px)`;
      const insets = clipInsets(element, axis, edge - 4, left, 4, width);
      part.track.style.clipPath = `inset(0 ${insets[1]}px 0 ${insets[3]}px)`;
    }
  }

  function refreshRecord(record) {
    if (!record.element.isConnected) {
      disposeRecord(record);
      return;
    }
    const style = getComputedStyle(record.element);
    const pageScroller = isAppViewportScroller(record.element, record.root);
    const canY = (pageScroller || /auto|scroll|overlay/.test(style.overflowY)) && axisVisible(record.element, 'y');
    const canX = (pageScroller || /auto|scroll|overlay/.test(style.overflowX)) && axisVisible(record.element, 'x');
    if (!canY && !canX) {
      record.element.classList.remove('lhn-slim-scrollbar-managed');
      record.y.track.hidden = true;
      record.x.track.hidden = true;
      return;
    }
    record.element.classList.add('lhn-slim-scrollbar-managed');
    updateTrack(record, 'y');
    updateTrack(record, 'x');
  }

  function disposeRecord(record) {
    record.element.removeEventListener('scroll', record.refresh);
    record.resizeObserver?.disconnect();
    record.y.track.remove();
    record.x.track.remove();
    record.element.classList.remove('lhn-slim-scrollbar-managed');
    managed.delete(record.element);
    liveRecords.delete(record);
  }

  function attach(element, root) {
    if (!isElement(element) || !isOwned(element, root)) return;
    const css = getComputedStyle(element);
    if (!isAppViewportScroller(element, root) && !/auto|scroll|overlay/.test(`${css.overflowY} ${css.overflowX}`)) return;
    let record = managed.get(element);
    if (record) {
      refreshRecord(record);
      return;
    }
    const portal = root.nodeType === Node.DOCUMENT_NODE ? (root.body || root.documentElement) : root;
    record = { element, y: makeTrack(portal, 'y'), x: makeTrack(portal, 'x'), root };
    record.refresh = () => refreshRecord(record);
    element.addEventListener('scroll', record.refresh, { passive: true });
    record.resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(record.refresh) : null;
    record.resizeObserver?.observe(element);
    if (element.firstElementChild) record.resizeObserver?.observe(element.firstElementChild);
    managed.set(element, record);
    liveRecords.add(record);
    installTrackEvents(record, 'y');
    installTrackEvents(record, 'x');
    refreshRecord(record);
  }

  function walk(root, node) {
    if (isElement(node)) attach(node, root);
    if (!node?.querySelectorAll) return;
    if (root.nodeType === Node.DOCUMENT_NODE && !root.documentElement?.hasAttribute('data-lhn-app')) {
      if (isElement(node) && isOwned(node, root)) {
        attach(node, root);
        node.querySelectorAll('*').forEach(element => attach(element, root));
      } else {
        node.querySelectorAll(HOST_SELECTOR).forEach(host => {
          attach(host, root);
          host.querySelectorAll('*').forEach(element => attach(element, root));
        });
      }
      return;
    }
    node.querySelectorAll('*').forEach(element => attach(element, root));
  }

  function cleanup(root, node) {
    if (isElement(node)) {
      const record = managed.get(node);
      if (record) disposeRecord(record);
    }
    node?.querySelectorAll?.('*').forEach(element => {
      const record = managed.get(element);
      if (record) disposeRecord(record);
    });
  }

  function observe(root) {
    if (!root || controllers.has(root)) return;
    const state = { root, frame: 0 };
    controllers.set(root, state);
    if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && root.host) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = globalThis.browser?.runtime?.getURL?.('css/shared/scrollbars.css') || globalThis.chrome?.runtime?.getURL?.('css/shared/scrollbars.css') || '';
      if (link.href) root.appendChild(link);
    }
    walk(root, root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root);

    const observer = new MutationObserver(changes => {
      let shouldRefresh = false;
      for (const change of changes) {
        if (change.type === 'childList') {
          change.removedNodes.forEach(node => cleanup(root, node));
          change.addedNodes.forEach(node => walk(root, node));
          let ancestor = change.target;
          while (isElement(ancestor) && isOwned(ancestor, root)) {
            attach(ancestor, root);
            ancestor = ancestor.parentElement || ancestor.getRootNode()?.host || null;
          }
          shouldRefresh = true;
        } else if (isOwned(change.target, root) && !change.target.closest('.lhn-slim-scrollbar-track')) {
          attach(change.target, root);
          shouldRefresh = true;
        }
      }
      if (shouldRefresh) scheduleRefresh(state);
    });
    const target = root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root;
    const observeAttributes = root.nodeType !== Node.DOCUMENT_NODE || !!root.documentElement?.hasAttribute('data-lhn-app');
    observer.observe(target, { subtree: true, childList: true, attributes: observeAttributes, attributeFilter: ['class', 'style'] });
    state.observer = observer;

    const doc = root.nodeType === Node.DOCUMENT_NODE ? root : root.host?.ownerDocument;
    if (doc && !watchedDocuments.has(doc)) {
      watchedDocuments.add(doc);
      const update = () => liveRecords.forEach(record => {
        if (record.element.ownerDocument === doc) refreshRecord(record);
      });
      doc.defaultView?.addEventListener('scroll', update, true);
      doc.defaultView?.addEventListener('resize', update);
    }
  }

  function scheduleRefresh(state) {
    if (state.frame) return;
    state.frame = requestAnimationFrame(() => {
      state.frame = 0;
      liveRecords.forEach(record => {
        if (record.root === state.root) refreshRecord(record);
      });
    });
  }

  globalThis.LHN_SlimScrollbars = { observe };
  observe(document);
})();
