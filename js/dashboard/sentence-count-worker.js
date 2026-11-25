// v3.5.311: counts the Dictation sentences of a cached YouTube transcript with the Overlay's own splitter
// (overlay/source/video.js → resegmentBySentence + dedupeSentences, as in getStudyCues), so the Dashboard can show
// "x / total" for lessons saved before the total was stored. Runs in a worker so the content-script globals stay isolated.
const PENDING = 'Đang dịch...';
importScripts('../overlay/source/video.js');
self.onmessage = ({ data }) => {
  const counts = {};
  for (const [id, cues] of Object.entries(data?.items || {})) {
    try { if (Array.isArray(cues) && cues.length) counts[id] = dedupeSentences(resegmentBySentence(cues)).filter(cue => cue.en).length; } catch (_) {}
  }
  self.postMessage(counts);
};
