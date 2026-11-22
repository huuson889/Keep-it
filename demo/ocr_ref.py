"""Reference PP-OCRv5 pipeline (det -> boxes -> crops -> rec -> CTC greedy decode).

Used to validate the browser port in index.html. Same preprocessing constants.
"""
import sys
import numpy as np
import onnxruntime as ort
from PIL import Image

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
DET_LIMIT = 960        # max side for detection input
DET_THRESH = 0.3       # binarization threshold
BOX_THRESH = 0.6       # min mean prob inside a box
UNCLIP = 1.5           # expansion ratio
MIN_SIDE = 3
REC_H = 48


def load_dict(path):
    chars = [l.rstrip("\r\n") for l in open(path, encoding="utf-8")]
    # CTC index 0 = blank, last index = space
    return [""] + chars + [" "]


def det_resize(w, h):
    ratio = 1.0
    if max(h, w) > DET_LIMIT:
        ratio = DET_LIMIT / max(h, w)
    rh = int(h * ratio)
    rw = int(w * ratio)
    rh = max(int(round(rh / 32) * 32), 32)
    rw = max(int(round(rw / 32) * 32), 32)
    return rw, rh


def detect(det_sess, img):
    w, h = img.size
    rw, rh = det_resize(w, h)
    x = np.asarray(img.convert("RGB").resize((rw, rh), Image.BILINEAR), dtype=np.float32) / 255.0
    x = ((x - MEAN) / STD).transpose(2, 0, 1)[None].astype(np.float32)
    prob = det_sess.run(None, {det_sess.get_inputs()[0].name: x})[0][0, 0]
    return boxes_from_prob(prob, w / rw, h / rh, w, h)


def boxes_from_prob(prob, sx, sy, W, H):
    """Connected components on the binary map -> axis-aligned boxes (DB-style scoring + unclip)."""
    mask = prob > DET_THRESH
    rh, rw = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    boxes = []
    for y0 in range(rh):
        for x0 in range(rw):
            if not mask[y0, x0] or seen[y0, x0]:
                continue
            stack = [(y0, x0)]
            seen[y0, x0] = True
            xs0 = xs1 = x0
            ys0 = ys1 = y0
            pts = []
            while stack:
                y, x = stack.pop()
                pts.append((y, x))
                xs0, xs1 = min(xs0, x), max(xs1, x)
                ys0, ys1 = min(ys0, y), max(ys1, y)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < rh and 0 <= nx < rw and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            bw, bh = xs1 - xs0 + 1, ys1 - ys0 + 1
            if min(bw, bh) < MIN_SIDE:
                continue
            score = float(np.mean([prob[y, x] for y, x in pts]))
            if score < BOX_THRESH:
                continue
            # unclip: expand by d = area * ratio / perimeter (rectangle case)
            area, perim = bw * bh, 2 * (bw + bh)
            d = area * UNCLIP / perim
            l, t = xs0 - d, ys0 - d
            r, b = xs1 + 1 + d, ys1 + 1 + d
            boxes.append((max(0, l * sx), max(0, t * sy), min(W, r * sx), min(H, b * sy), score))
    boxes.sort(key=lambda b: (round(b[1] / 10), b[0]))  # reading order: top-to-bottom, left-to-right
    return boxes


def recognize(rec_sess, chars, crop):
    w, h = crop.size
    nw = max(8, min(int(np.ceil(REC_H * w / h)), 3200))
    x = np.asarray(crop.convert("RGB").resize((nw, REC_H), Image.BILINEAR), dtype=np.float32) / 255.0
    x = ((x - 0.5) / 0.5).transpose(2, 0, 1)[None].astype(np.float32)
    out = rec_sess.run(None, {rec_sess.get_inputs()[0].name: x})[0][0]  # (T, C)
    idx = out.argmax(axis=1)
    prob = out.max(axis=1)
    text, scores, prev = [], [], 0
    for t, i in enumerate(idx):
        if i != 0 and i != prev:
            text.append(chars[i])
            scores.append(prob[t])
        prev = i
    return "".join(text), float(np.mean(scores)) if scores else 0.0


def run(image_path, det_path, rec_path, dict_path):
    det = ort.InferenceSession(det_path, providers=["CPUExecutionProvider"])
    rec = ort.InferenceSession(rec_path, providers=["CPUExecutionProvider"])
    chars = load_dict(dict_path)
    img = Image.open(image_path).convert("RGB")
    results = []
    for (l, t, r, b, s) in detect(det, img):
        crop = img.crop((int(l), int(t), int(np.ceil(r)), int(np.ceil(b))))
        text, conf = recognize(rec, chars, crop)
        results.append({"box": [round(l), round(t), round(r), round(b)], "det": round(s, 3),
                        "text": text, "rec": round(conf, 3)})
    return results


if __name__ == "__main__":
    base = "/home/claude/demo/models/"
    res = run(sys.argv[1], base + "det.onnx", base + "rec.onnx", base + "ppocrv5_dict.txt")
    for r in res:
        print(r)
