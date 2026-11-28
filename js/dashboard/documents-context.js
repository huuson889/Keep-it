// A source adapter only: the document viewer supplies identity/anchors to the existing app tools.
// No Reader, selection toolbar, note composer, sidebar or AI UI is built here.
(() => {
  'use strict';
  if (location.protocol !== 'chrome-extension:' && location.protocol !== 'moz-extension:') return;
  if (!location.pathname.endsWith('/pages/documents.html')) return;
  let host = null;
  const context = { active:() => !!host?.active?.() };
  const aiSheet=globalThis.LHN_AI_SHEET.create({canOpen:()=>context.active(),t:key=>LHN_LANGUAGES.t('bar_'+key,{},document.documentElement.lang)});aiSheet.bindMessages();
  globalThis.LHN_SELECTION_TOOLBAR.installTouchSelectionBridge();
  for (const name of [
    'url','title','hostname','thumbnail','sentenceContext','root','containsRange','selectionRects','anchorFor','findRanges','onAnnotations',
    'applyPageShrink','restorePageWidth','onSidebar','revealAnnotation','readerBlocks','readerBlocksForTarget','readerSpeakerGeometry','readerSpeakerHost','positionReaderSpeaker','readerText',
    'readerFontAllowed','readerSpeakersAllowed','readerCard','readerBlockForCard','mountReaderCard',
    'readerNextPage','onReaderBlock','onReaderState','readerTargetLanguage','openSettings'
  ]) context[name] = (...args) => host?.[name]?.(...args);
  globalThis.LHN_PAGE_CONTEXT = Object.freeze(context);
  globalThis.LHN_DOCUMENT_CONTEXT = Object.freeze({
    attach(value) { host = value; },
    receiveAIMessage:message=>aiSheet.handleMessage(message),
    async refresh() {
      document.documentElement.classList.toggle('documents-native-inactive', !context.active());
      if(!context.active())aiSheet.close(true);
      /* v3.5.491: không chờ refreshSource (chờ loadSettings + restoreAnnotations) để openViewer không bị treo. */
      try { void globalThis.LHN_CONTENT_TOOLS?.refreshSource?.(); } catch { /* ignore */ }
      globalThis.LHN_READER_API?.refreshSource?.();
    }
  });
  document.documentElement.classList.add('documents-native-inactive');
})();
