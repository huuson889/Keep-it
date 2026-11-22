import { readFile } from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import * as ort from 'onnxruntime-web';
import { PPOcr } from '../ocr.js';

const M = '/home/claude/demo/models/';
const models = {
  det: (await readFile(M + 'det.onnx')).buffer,
  rec: (await readFile(M + 'rec.onnx')).buffer,
  dict: await readFile(M + 'dict.txt', 'utf8'),
};
ort.env.wasm.numThreads = 1;
const t0 = performance.now();
const ocr = await PPOcr.create({ ort, models, makeCanvas: (w, h) => createCanvas(w, h) });
console.log('load ms', Math.round(performance.now() - t0), 'classes', ocr.chars.length);

for (const f of process.argv.slice(2)) {
  const img = await loadImage(await readFile(f));
  const c = createCanvas(img.width, img.height);
  c.getContext('2d').drawImage(img, 0, 0);
  const res = await ocr.run(c);
  console.log('==', f, JSON.stringify(res.timing));
  for (const l of res.lines) console.log(l.conf.toFixed(3), JSON.stringify(l.text));
}
