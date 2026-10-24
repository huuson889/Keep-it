(() => {
  function fromEvent(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    const key = event.code === 'Space' ? 'Space' : event.key === 'ArrowLeft' ? 'Left' : event.key === 'ArrowRight' ? 'Right' : event.key === 'ArrowUp' ? 'Up' : event.key === 'ArrowDown' ? 'Down' : event.key.length === 1 ? event.key.toUpperCase() : event.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) parts.push(key);
    return parts.join('+');
  }
  globalThis.LHN_SHORTCUTS = Object.freeze({ fromEvent });
})();