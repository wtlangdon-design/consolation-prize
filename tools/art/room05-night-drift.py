#!/usr/bin/env python3
"""Did the NIGHT edit move anything? Tyler's night pass, section 10.

The DAY candidate and the annotation are the geometric authority; the NIGHT
plate is allowed to change light, shadow, colour and texture and nothing
else. Light changes cannot be compared by pixel value, so this compares
STRUCTURE: for every annotated object rect (hotspots, exits, the counter
mask's block, the obstacle) it takes the gradient magnitude of both plates
inside the rect and phase-correlates them. A stationary object gives a sharp
peak at (0, 0); an object that moved gives the peak at its displacement; an
object that is simply not there any more gives no peak.

    python3 tools/art/room05-night-drift.py <day.png> <night.png> <annotation.json> <out.json>

Verdict per rect: PASS when |dx|,|dy| <= 6 and the peak is >= 0.10 of the
correlation energy; otherwise DRIFT. The whole plate is measured the same
way. Numbers are reported; the rule is stated here and nowhere else.
"""
import json, sys, hashlib
import numpy as np
from PIL import Image

day_p, night_p, ann_p, out_p = sys.argv[1:5]
day = np.array(Image.open(day_p).convert('L')).astype(float)
night = np.array(Image.open(night_p).convert('L')).astype(float)
assert day.shape == night.shape == (864, 1920), (day.shape, night.shape)
ann = json.load(open(ann_p))

def grad(a):
    gx = np.zeros_like(a); gy = np.zeros_like(a)
    gx[:, 1:-1] = a[:, 2:] - a[:, :-2]; gy[1:-1, :] = a[2:, :] - a[:-2, :]
    g = np.hypot(gx, gy)
    g -= g.mean(); s = g.std()
    return g / s if s > 0 else g

def shift(a, b):
    """Phase correlation of two equal windows: (dx, dy, peak share)."""
    fa, fb = np.fft.fft2(a), np.fft.fft2(b)
    r = fa * np.conj(fb); r /= (np.abs(r) + 1e-9)
    c = np.fft.ifft2(r).real
    peak = c.max(); iy, ix = np.unravel_index(c.argmax(), c.shape)
    h, w = c.shape
    dy = iy if iy <= h // 2 else iy - h; dx = ix if ix <= w // 2 else ix - w
    energy = np.sqrt((c ** 2).sum())
    return int(dx), int(dy), float(peak / energy) if energy else 0.0

def window(a, box, pad=12):
    x, y, w, h = box
    x0, y0 = max(0, x - pad), max(0, y - pad); x1, y1 = min(1920, x + w + pad), min(864, y + h + pad)
    return a[y0:y1, x0:x1]

rects = {}
for hs in ann.get('hotspots', {}) if isinstance(ann.get('hotspots'), dict) else {}:
    rects[f'hotspot:{hs}'] = ann['hotspots'][hs]
for k, v in (ann.get('exits') or {}).items(): rects[f'exit:{k}'] = v
obstacles = ann.get('obstacles') or []
if isinstance(obstacles, dict): obstacles = [{'id': k, **(v if isinstance(v, dict) else {'rect': v})} for k, v in obstacles.items()]
for i, ob in enumerate(obstacles):
    box = ob if isinstance(ob, list) else (ob.get('rect') or ob.get('box') or ob.get('bounds'))
    name = ob.get('id', str(i)) if isinstance(ob, dict) else str(i)
    if isinstance(box, list) and len(box) == 4: rects[f'obstacle:{name}'] = box
rects['counter block (mask, plate-02)'] = [695, 395, 802, 311]
rects['service cage bars (mask, plate-02)'] = [720, 0, 680, 395]
rects['ledger (under her hands)'] = [955, 368, 200, 56]
rects['whole plate'] = [0, 0, 1920, 864]

gd, gn = grad(day), grad(night)
report = {'day': {'path': day_p, 'sha256': hashlib.sha256(open(day_p, 'rb').read()).hexdigest()},
          'night': {'path': night_p, 'sha256': hashlib.sha256(open(night_p, 'rb').read()).hexdigest()},
          'rule': '|dx|,|dy| <= 6 px and peak share >= 0.10 -> PASS; else DRIFT. Structure compared by phase correlation of gradient magnitude inside each annotated rect (+12 px pad).',
          'rects': []}
worst = None
for name, box in rects.items():
    if not (isinstance(box, list) and len(box) == 4): continue
    a, b = window(gd, box), window(gn, box)
    if a.size < 400: continue
    dx, dy, peak = shift(a, b)
    ok = abs(dx) <= 6 and abs(dy) <= 6 and peak >= 0.10
    report['rects'].append({'name': name, 'box': box, 'dx': dx, 'dy': dy, 'peak': round(peak, 3), 'verdict': 'PASS' if ok else 'DRIFT'})
    print(f"{'PASS' if ok else 'DRIFT':5s} {name:38s} box {box}  shift ({dx:+d},{dy:+d})  peak {peak:.3f}")
report['verdict'] = 'PASS' if all(r['verdict'] == 'PASS' for r in report['rects']) else 'NIGHT EDIT — GEOMETRY DRIFT'
json.dump(report, open(out_p, 'w'), indent=1)
print('\nVERDICT:', report['verdict'])
