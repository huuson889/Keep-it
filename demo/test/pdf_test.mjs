import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import * as ort from 'onnxruntime-web';
import { PPOcr } from '../ocr.js';
import { addTextLayer } from '../textlayer.js';

// load the UMD builds of pdf-lib and fontkit into this process
globalThis.self = globalThis;
vm.runInThisContext(await readFile('../vendor/pdf-lib.min.js', 'utf8'));
vm.runInThisContext(await readFile('../vendor/fontkit.umd.min.js', 'utf8'));
const PDFLib = globalThis.PDFLib, fontkit = globalThis.fontkit ?? globalThis.Fontkit;
console.log('pdf-lib', !!PDFLib, 'fontkit', !!fontkit);

const M = '../models/';
const ocr = await PPOcr.create({ ort, models: {
  det: (await readFile(M + 'det.onnx')).buffer, rec: (await readFile(M + 'rec.onnx')).buffer,
  dict: await readFile(M + 'dict.txt', 'utf8') }, makeCanvas: (w, h) => createCanvas(w, h) });
ort.env.wasm.numThreads = 1;

// 1) make an A4 PDF whose only content is the scanned image (no text layer)
const png = await readFile('../samples/a4_vi.png');
const img = await loadImage(png);
const W = 595.2, H = 841.92;
const scanDoc = await PDFLib.PDFDocument.create();
const page = scanDoc.addPage([W, H]);
page.drawImage(await scanDoc.embedPng(png), { x: 0, y: 0, width: W, height: H });
const scanBytes = await scanDoc.save();
await writeFile('/tmp/scan.pdf', scanBytes);

// 2) OCR the page image at its own pixel size (s = px per pt)
const c = createCanvas(img.width, img.height); c.getContext('2d').drawImage(img, 0, 0);
const res = await ocr.run(c);
const s = img.width / W;
const pages = [{ n: 1, s, pdfH: H, lines: res.lines }];

// 3) add the text layer
const fontBytes = await readFile('../vendor/font.ttf');
const out = await addTextLayer({ PDFLib, fontkit, pdfBytes: scanBytes, fontBytes: fontBytes.buffer, pages });
await writeFile('/tmp/layer.pdf', out.bytes);
console.log('written', out.written, 'skipped', out.skipped, 'lines', res.lines.length);
