import { readFile } from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import * as ort from 'onnxruntime-web';
import { PPOcr } from '../ocr.js';
const M = '/home/claude/demo/models/';
const models = { det: (await readFile(M+'det.onnx')).buffer, rec: (await readFile(M+'rec.onnx')).buffer, dict: await readFile(M+'dict.txt','utf8') };
ort.env.wasm.numThreads = 1;
const ocr = await PPOcr.create({ ort, models, makeCanvas: (w,h)=>createCanvas(w,h) });
const img = await loadImage(await readFile('../samples/a4_vi.png'));
const c = createCanvas(img.width, img.height); c.getContext('2d').drawImage(img,0,0);
for (let k=0;k<2;k++){ const r=await ocr.run(c); console.log('run',k, JSON.stringify(r.timing)); }
// time pure session.run for rec at a typical batch
const T0=performance.now(); let sessMs=0; const orig=ocr.rec.run.bind(ocr.rec);
ocr.rec.run=async(f)=>{const s=performance.now(); const o=await orig(f); sessMs+=performance.now()-s; return o};
const r=await ocr.run(c); console.log('rec session.run total ms', Math.round(sessMs), 'rec wall', Math.round(r.timing.recMs));
