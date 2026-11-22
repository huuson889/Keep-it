// PP-OCR (det + rec) in JavaScript, shared by the browser demo and the Node test.
// Needs an onnxruntime-web namespace (`ort`) and a canvas factory `makeCanvas(w, h)`
// that returns objects with a 2D context (drawImage, getImageData).

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const REC_H = 48;
const REC_BATCH = 8;
const REC_MAX_W = 3200;

export const DEFAULTS = {
  detLimit: 960, // longest side fed to the detector (speed vs. small-text recall)
  detThresh: 0.3, // binarization threshold
  boxThresh: 0.6, // minimum mean probability inside a box
  unclip: 1.5, // box expansion ratio
  minSide: 3,
};

/** Dictionary file -> CTC classes: [blank, ...chars, space]. */
export function parseDict(text) {
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return ['', ...lines, ' '];
}

export class PPOcr {
  constructor({ ort, det, rec, chars, makeCanvas, options = {} }) {
    this.ort = ort;
    this.det = det;
    this.rec = rec;
    this.chars = chars;
    this.makeCanvas = makeCanvas;
    this.opt = { ...DEFAULTS, ...options };
  }

  /** Loads both sessions. `models` holds ArrayBuffers: { det, rec, dict (string) }. */
  static async create({ ort, models, makeCanvas, options, executionProviders = ['wasm'] }) {
    const init = { executionProviders };
    const [det, rec] = await Promise.all([
      ort.InferenceSession.create(models.det, init),
      ort.InferenceSession.create(models.rec, init),
    ]);
    return new PPOcr({ ort, det, rec, chars: parseDict(models.dict), makeCanvas, options });
  }

  /** Full page: returns { lines: [{text, conf, det, box:[l,t,r,b]}], timing }. */
  async run(source) {
    const t0 = performance.now();
    const boxes = await this.detect(source);
    const t1 = performance.now();
    const lines = await this.recognize(source, boxes);
    const t2 = performance.now();
    return {
      lines,
      timing: { detMs: t1 - t0, recMs: t2 - t1, totalMs: t2 - t0, boxes: boxes.length },
    };
  }

  // ---- detection ---------------------------------------------------------

  async detect(source) {
    const W = source.width, H = source.height, o = this.opt;
    const ratio = Math.max(H, W) > o.detLimit ? o.detLimit / Math.max(H, W) : 1;
    const rw = Math.max(Math.round(Math.trunc(W * ratio) / 32) * 32, 32);
    const rh = Math.max(Math.round(Math.trunc(H * ratio) / 32) * 32, 32);

    const c = this.makeCanvas(rw, rh);
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(source, 0, 0, rw, rh);
    const px = cx.getImageData(0, 0, rw, rh).data;

    const input = new Float32Array(3 * rw * rh);
    const plane = rw * rh;
    for (let i = 0; i < plane; i++) {
      for (let k = 0; k < 3; k++) {
        input[k * plane + i] = (px[i * 4 + k] / 255 - MEAN[k]) / STD[k];
      }
    }
    const feeds = { [this.det.inputNames[0]]: new this.ort.Tensor('float32', input, [1, 3, rh, rw]) };
    const out = await this.det.run(feeds);
    const prob = out[this.det.outputNames[0]].data; // rh * rw, already sigmoid

    return this.boxesFromProb(prob, rw, rh, W, H);
  }

  boxesFromProb(prob, rw, rh, W, H) {
    const o = this.opt;
    const sx = W / rw, sy = H / rh;
    const seen = new Uint8Array(rw * rh);
    const stack = new Int32Array(rw * rh);
    const boxes = [];
    let top = 0;
    const tryPush = (q) => {
      if (!seen[q] && prob[q] > o.detThresh) {
        seen[q] = 1;
        stack[top++] = q;
      }
    };

    for (let start = 0; start < rw * rh; start++) {
      if (seen[start] || prob[start] <= o.detThresh) continue;
      top = 0;
      tryPush(start);
      let count = 0, sum = 0;
      let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
      while (top > 0) {
        const p = stack[--top];
        const y = (p / rw) | 0, x = p - y * rw;
        count++;
        sum += prob[p];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        if (x + 1 < rw) tryPush(p + 1);
        if (x > 0) tryPush(p - 1);
        if (y + 1 < rh) tryPush(p + rw);
        if (y > 0) tryPush(p - rw);
      }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (Math.min(bw, bh) < o.minSide) continue;
      if (sum / count < o.boxThresh) continue;

      // unclip: grow the rectangle by area * ratio / perimeter on every side
      const d = (bw * bh * o.unclip) / (2 * (bw + bh));
      boxes.push({
        l: Math.max(0, (x0 - d) * sx),
        t: Math.max(0, (y0 - d) * sy),
        r: Math.min(W, (x1 + 1 + d) * sx),
        b: Math.min(H, (y1 + 1 + d) * sy),
        score: sum / count,
      });
    }
    // reading order: rows (top edge in ~10 px buckets), then left to right
    boxes.sort((a, b) => Math.round(a.t / 10) - Math.round(b.t / 10) || a.l - b.l);
    return boxes;
  }

  // ---- recognition -------------------------------------------------------

  async recognize(source, boxes) {
    if (!boxes.length) return [];
    // prepare every crop as a normalized [3, 48, w] plane, then batch by similar width
    const items = boxes.map((bx, i) => {
      const w = bx.r - bx.l, h = bx.b - bx.t;
      const nw = Math.max(8, Math.min(Math.ceil((REC_H * w) / h), REC_MAX_W));
      return { i, nw, bx };
    });
    const order = [...items].sort((a, b) => a.nw - b.nw);
    const results = new Array(boxes.length);

    for (let s = 0; s < order.length; s += REC_BATCH) {
      const group = order.slice(s, s + REC_BATCH);
      const maxW = Math.max(...group.map((g) => g.nw));
      const data = new Float32Array(group.length * 3 * REC_H * maxW); // zero padding
      group.forEach((g, bi) => {
        const plane = this.cropPlane(source, g.bx, g.nw);
        const base = bi * 3 * REC_H * maxW;
        for (let k = 0; k < 3; k++) {
          for (let y = 0; y < REC_H; y++) {
            const dst = base + k * REC_H * maxW + y * maxW;
            const src = k * REC_H * g.nw + y * g.nw;
            data.set(plane.subarray(src, src + g.nw), dst);
          }
        }
      });
      const feeds = {
        [this.rec.inputNames[0]]: new this.ort.Tensor('float32', data, [group.length, 3, REC_H, maxW]),
      };
      const out = await this.rec.run(feeds);
      const t = out[this.rec.outputNames[0]];
      const [B, T, C] = t.dims;
      group.forEach((g, bi) => {
        const { text, conf } = this.ctcGreedy(t.data, bi, T, C);
        results[g.i] = {
          text,
          conf,
          det: g.bx.score,
          box: [Math.round(g.bx.l), Math.round(g.bx.t), Math.round(g.bx.r), Math.round(g.bx.b)],
        };
      });
    }
    return results.filter((r) => r.text.length > 0);
  }

  /** Crop one box, resize to height 48 x width nw, return normalized CHW Float32Array. */
  cropPlane(source, bx, nw) {
    const c = this.makeCanvas(nw, REC_H);
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(source, bx.l, bx.t, bx.r - bx.l, bx.b - bx.t, 0, 0, nw, REC_H);
    const px = cx.getImageData(0, 0, nw, REC_H).data;
    const plane = new Float32Array(3 * REC_H * nw);
    const n = REC_H * nw;
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 3; k++) plane[k * n + i] = (px[i * 4 + k] / 255 - 0.5) / 0.5;
    }
    return plane;
  }

  /** CTC greedy decode for batch item `bi` of a [B, T, C] probability tensor. */
  ctcGreedy(data, bi, T, C) {
    const base = bi * T * C;
    let prev = 0, sum = 0, n = 0;
    const chars = [];
    for (let t = 0; t < T; t++) {
      const row = base + t * C;
      let best = 0, bp = -1;
      for (let c = 0; c < C; c++) {
        const v = data[row + c];
        if (v > bp) { bp = v; best = c; }
      }
      if (best !== 0 && best !== prev) {
        chars.push(this.chars[best]);
        sum += bp;
        n++;
      }
      prev = best;
    }
    return { text: chars.join('').trim(), conf: n ? sum / n : 0 };
  }
}
