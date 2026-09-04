#!/usr/bin/env python3
"""Winnie's ambient frames, from ONE canonical design and ONE derived pose sheet.

Room 5 pilot, doc 38's ambient path (cut-ambient / cut-sheet / ambient-breath),
folded into one script because the two sources have to agree on where the pen
stand is, and the shared tools each cut one file without knowing the other.

  frame 0  rest        canonical: hands on the counter, pen in its stand
  frame 1  breath      derived from 0: chest lifts one display pixel, head still
  frame 2  writing     sheet pose 0: pen in hand, head bowed
  frame 3  writing'    derived from 2: the pen hand shifted along the line
  frame 4  looking up  sheet pose 1: pen in hand, head raised   (talk frame)
  frame 5  pen down    sheet pose 2: placing the pen in the stand

THE STAND IS REGISTERED, NOT TRUSTED. It is a separate blob in every source
and each generation put it a few source pixels somewhere else; at the room's
scale that is a stand that hops when she reaches for it. So the stand's offset
from the figure -- horizontal from the figure's centre column, vertical from
the feet -- is measured on the SHEET (three poses of one generation agree to
within 3px) and the canonical's own stand is moved to that offset.

Usage: winnie-frames.py <canonical.png> <sheet.png> <out_dir> <target_height> [--gamma G]
"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, label

canon_path, sheet_path, out_dir, target = sys.argv[1], sys.argv[2], Path(sys.argv[3]), float(sys.argv[4])
gamma = float(sys.argv[sys.argv.index('--gamma') + 1]) if '--gamma' in sys.argv else 1.0
out_dir.mkdir(parents=True, exist_ok=True)

def load(path):
    a = np.array(Image.open(path).convert('RGB')).astype(float)
    key = (a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110)
    return a, key

def components(mask):
    lab, n = label(mask)
    out = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        out.append({'id': i, 'x0': xs.min(), 'x1': xs.max(), 'y0': ys.min(), 'y1': ys.max(), 'n': len(xs), 'mask': lab == i})
    return sorted(out, key=lambda c: -c['n'])

def figure_and_stand(a, key, x_lo=0, x_hi=None):
    """In a column window, the biggest component is the figure; the biggest
    other component left of it is the stand."""
    x_hi = a.shape[1] if x_hi is None else x_hi
    win = np.zeros_like(key); win[:, x_lo:x_hi] = True
    comps = components((~key) & win)
    fig = comps[0]
    others = [c for c in comps[1:] if c['x1'] < fig['x0'] + (fig['x1'] - fig['x0']) * 0.35 and c['n'] > 200]
    stand = max(others, key=lambda c: c['n']) if others else None
    return fig, stand

def cut(a, key, comps, top, floor, gamma):
    """Alpha from the union of the given components; soft one-pixel rim; the
    room's own lift (gamma 1.0 = none, which is Room 5's: it is not Main Street)."""
    m = np.zeros_like(key)
    for c in comps: m |= c['mask']
    solid = binary_erosion(m, np.ones((3, 3)))
    alpha = np.where(m, 255.0, 0.0); alpha[m & (~solid)] = 170
    col = a.copy()
    if gamma != 1.0:
        lum = 0.2126 * col[..., 0] + 0.7152 * col[..., 1] + 0.0722 * col[..., 2]
        lifted = 255.0 * np.power(np.clip(lum, 0, 255) / 255.0, gamma)
        gain = np.clip(np.where(lum > 1e-3, lifted / np.maximum(lum, 1e-3), 1.0), 1.0, 4.0)[..., None]
        col = np.clip(col * gain, 0, 255)
    return np.dstack([col, alpha])

def shrink(rgba, scale):
    H, W = rgba.shape[:2]
    w, h = max(1, round(W * scale)), max(1, round(H * scale))
    al = rgba[..., 3:] / 255.0
    pm = np.array(Image.fromarray((rgba[..., :3] * al).astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(float)
    a2 = np.array(Image.fromarray(rgba[..., 3].astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(float)
    colour = np.clip(np.where(a2[..., None] > 1, pm / np.maximum(a2[..., None] / 255.0, 1e-3), 0), 0, 255)
    rr, gg, bb = colour[..., 0], colour[..., 1], colour[..., 2]
    need = (a2 > 0) & (((rr + bb) / 2.0 - gg) > 6)
    f = np.where(need, (2.0 * (gg + 4)) / np.maximum(rr + bb, 1e-6), 1.0)
    colour[..., 0] = np.where(need, rr * f, rr); colour[..., 2] = np.where(need, bb * f, bb)
    return np.dstack([colour, a2])

# ---- the sheet: three poses of one generation --------------------------------
sa, sk = load(sheet_path)
cols = (~sk).any(axis=0)
runs, start = [], None
for x, on in enumerate(cols):
    if on and start is None: start = x
    elif not on and start is not None:
        runs.append((start, x)); start = None
if start is not None: runs.append((start, len(cols)))
# merge a narrow run (the stand) into the figure run to its right
merged = []
for r in runs:
    if merged and (r[0] - merged[-1][1]) < 60 and (merged[-1][1] - merged[-1][0]) < 120:
        merged[-1] = (merged[-1][0], r[1])
    else:
        merged.append(r)
poses = []
for (x0, x1) in merged:
    fig, stand = figure_and_stand(sa, sk, x0, x1)
    poses.append({'fig': fig, 'stand': stand})
assert len(poses) == 3, f'expected 3 poses on the sheet, found {len(poses)}: {merged}'
if canon_path == sheet_path:
    print('single-sheet mode: pose 0 is the canonical rest pose; poses 1-2 are writing and looking up')

# The stand's offset, measured on the sheet: from the figure's centre column
# and from the figure's feet, in units of figure height.
def offset(pose):
    f, s = pose['fig'], pose['stand']
    fh = f['y1'] - f['y0'] + 1
    fcx = (f['x0'] + f['x1']) / 2
    return ((s['x0'] + s['x1']) / 2 - fcx) / fh, (f['y1'] - s['y1']) / fh, (s['x1'] - s['x0'] + 1) / fh
offsets = [offset(p) for p in poses if p['stand']]
dx = float(np.mean([o[0] for o in offsets])); dy = float(np.mean([o[1] for o in offsets]))
print(f'stand offset on the sheet: dx {dx:+.3f} h, base {dy:.3f} h above the feet '
      f'(poses agree to {max(o[0] for o in offsets)-min(o[0] for o in offsets):.3f})')

# ---- the canonical: figure + its own stand, moved to the sheet's offset ------
# ONE SHEET FOR EVERYTHING (the corrected pass): the rest pose is pose 0 of the
# same generation as the work poses, so "canonical" and "sheet" are one file.
# The stand then needs no registration at all -- one pass drew it once per
# figure at one offset -- but the measurement still runs and reports it.
single = canon_path == sheet_path
if single:
    ca, ck = sa, sk
    x0, x1 = merged[0]
    cfig, cstand = figure_and_stand(ca, ck, x0, x1)
    poses = poses[1:]
else:
    ca, ck = load(canon_path)
    cfig, cstand = figure_and_stand(ca, ck)
fh = cfig['y1'] - cfig['y0'] + 1
fcx = (cfig['x0'] + cfig['x1']) / 2
want_cx = fcx + dx * fh; want_base = cfig['y1'] - dy * fh
have_cx = (cstand['x0'] + cstand['x1']) / 2; have_base = cstand['y1']
shift_x, shift_y = int(round(want_cx - have_cx)), int(round(want_base - have_base))
print(f'canonical stand moved by ({shift_x:+d}, {shift_y:+d}) source px to register with the sheet')
moved = np.roll(np.roll(cstand['mask'], shift_y, axis=0), shift_x, axis=1)
moved_colour = np.roll(np.roll(ca, shift_y, axis=0), shift_x, axis=1)
canon_rgba = cut(ca, ck, [cfig], cfig['y0'], cfig['y1'], gamma)
stand_rgba = cut(moved_colour, ~moved, [{'mask': moved}], 0, 0, gamma)
canon_rgba = np.where(stand_rgba[..., 3:] > 0, stand_rgba, canon_rgba)

# ---- a common canvas: every frame the same size, feet on the same row --------
# Canvas in SOURCE units around the figure: width = figure width + stand reach,
# height = figure height, feet on the bottom row. Scale = target / figure height.
scale = target / fh
reach = int(abs(dx) * fh) + int(0.18 * fh)
canvas_w = int(cfig['x1'] - cfig['x0'] + 1) + 2 * reach
canvas_h = int(fh) + 8

def place(rgba, fig, cx_src, feet_src):
    """Copy the figure region onto the common canvas with its centre column at
    the canvas centre and its feet on the bottom row."""
    out = np.zeros((canvas_h, canvas_w, 4))
    H, W = rgba.shape[:2]
    ox = int(round(canvas_w / 2 - cx_src)); oy = int(round((canvas_h - 4) - feet_src))
    ys, xs = np.where(rgba[..., 3] > 0)
    for y, x in zip(ys, xs):
        ty, tx = y + oy, x + ox
        if 0 <= ty < canvas_h and 0 <= tx < canvas_w: out[ty, tx] = rgba[y, x]
    return out

frames = {}
frames[0] = place(canon_rgba, cfig, fcx, cfig['y1'])
for i, pose in enumerate(poses):
    f = pose['fig']
    parts = [f] + ([pose['stand']] if pose['stand'] else [])
    rgba = cut(sa, sk, parts, f['y0'], f['y1'], gamma)
    # the sheet's figures are their own height; scale each to the canonical's
    pfh = f['y1'] - f['y0'] + 1
    k = fh / pfh
    if abs(k - 1) > 0.002:
        H, W = rgba.shape[:2]
        al = rgba[..., 3:] / 255.0
        pm = np.array(Image.fromarray((rgba[..., :3] * al).astype(np.uint8)).resize((round(W * k), round(H * k)), Image.LANCZOS)).astype(float)
        a2 = np.array(Image.fromarray(rgba[..., 3].astype(np.uint8)).resize((round(W * k), round(H * k)), Image.LANCZOS)).astype(float)
        rgba = np.dstack([np.clip(np.where(a2[..., None] > 1, pm / np.maximum(a2[..., None] / 255.0, 1e-3), 0), 0, 255), a2])
        f = {'x0': f['x0'] * k, 'x1': f['x1'] * k, 'y0': f['y0'] * k, 'y1': f['y1'] * k}
    frames[2 + i] = place(rgba, f, (f['x0'] + f['x1']) / 2, f['y1'])

# ---- derived: breath (frame 1) and scribble (frame 3) ------------------------
# Breath: everything above the hem rises one DISPLAY pixel; the head stays.
rest = frames[0]
one_px = max(1, int(round(1 / scale)))
opaque = rest[..., 3] > 16
rows = np.nonzero(opaque.any(axis=1))[0]
top, floor = rows.min(), rows.max()
hem = int(top + (floor - top) * 0.58); shoulder = int(top + (floor - top) * 0.28)
breath = rest.copy()
chest = rest[shoulder:hem].copy()
breath[shoulder - one_px:hem - one_px] = chest
breath[hem - one_px:hem] = rest[hem - one_px:hem]
frames[1] = breath
# Scribble: the writing pose with the pen hand moved 2 display pixels along the line.
writing = frames[2]
wfig = poses[0]['fig']
# The hand+pen region: the lower-right quadrant of the torso band on the figure's right side.
band_y0 = int(canvas_h * 0.30); band_y1 = int(canvas_h * 0.45)
cx = canvas_w // 2
hand = np.zeros_like(writing[..., 3], dtype=bool)
hand[band_y0:band_y1, cx - int(0.28 * fh):cx - int(0.02 * fh)] = True
scrib = writing.copy()
move = 2 * one_px
region = writing[band_y0:band_y1, cx - int(0.28 * fh):cx - int(0.02 * fh)]
scrib[band_y0:band_y1, cx - int(0.28 * fh) + move:cx - int(0.02 * fh) + move] = np.where(region[..., 3:] > 0, region, scrib[band_y0:band_y1, cx - int(0.28 * fh) + move:cx - int(0.02 * fh) + move])
frames[3] = scrib
# Reorder so the sheet reads 0 rest, 1 breath, 2 writing, 3 scribble, 4 looking up, 5 pen down.
ordered = [frames[0], frames[1], frames[2], frames[3], frames[3 + 1], frames[3 + 2]] if False else None
order = [0, 1, 2, 3, 4, 5]
seq = {0: frames[0], 1: frames[1], 2: frames[2], 3: frames[3], 4: frames[3 + 1] if 4 in frames else None, 5: frames[5] if 5 in frames else None}
# frames dict has keys 0,1,2,3 (derived) and 2,3,4 from poses -> poses landed at 2,3,4; scribble overwrote 3.
# Rebuild explicitly:
pose_frames = {}
for i, pose in enumerate(poses):
    f = pose['fig']
    parts = [f] + ([pose['stand']] if pose['stand'] else [])
    rgba = cut(sa, sk, parts, f['y0'], f['y1'], gamma)
    pfh = f['y1'] - f['y0'] + 1; k = fh / pfh
    if abs(k - 1) > 0.002:
        H, W = rgba.shape[:2]; al = rgba[..., 3:] / 255.0
        pm = np.array(Image.fromarray((rgba[..., :3] * al).astype(np.uint8)).resize((round(W * k), round(H * k)), Image.LANCZOS)).astype(float)
        a2 = np.array(Image.fromarray(rgba[..., 3].astype(np.uint8)).resize((round(W * k), round(H * k)), Image.LANCZOS)).astype(float)
        rgba = np.dstack([np.clip(np.where(a2[..., None] > 1, pm / np.maximum(a2[..., None] / 255.0, 1e-3), 0), 0, 255), a2])
        f = {'x0': f['x0'] * k, 'x1': f['x1'] * k, 'y0': f['y0'] * k, 'y1': f['y1'] * k}
    pose_frames[i] = place(rgba, f, (f['x0'] + f['x1']) / 2, f['y1'])
writing = pose_frames[0]
scrib = writing.copy()
x0, x1 = cx - int(0.30 * fh), cx - int(0.02 * fh)
region = writing[band_y0:band_y1, x0:x1]
target_slice = scrib[band_y0:band_y1, x0 + move:x1 + move]
scrib[band_y0:band_y1, x0 + move:x1 + move] = np.where(region[..., 3:] > 0, region, target_slice)
final = [frames[0], breath, writing, scrib] + [pose_frames[i] for i in range(1, len(pose_frames))]

# ---- shrink and assemble ------------------------------------------------------
small = [shrink(f, scale) for f in final]
fw, fh_small = small[0].shape[1], small[0].shape[0]
pad = 2
sheet = np.zeros((fh_small + 2 * pad, len(small) * (fw + pad) + pad, 4))
rects = []
for i, f in enumerate(small):
    x = pad + i * (fw + pad)
    sheet[pad:pad + fh_small, x:x + fw] = f
    rects.append([int(x), pad, int(fw), int(fh_small)])
Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8)).save(out_dir / 'winnie-sheet.png')
for i, f in enumerate(small):
    Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).save(out_dir / f'frame-{i:02d}.png')
meta = {
    'frames': rects, 'frameSize': [int(fw), int(fh_small)], 'scale': scale, 'target': target,
    'sourceFigureHeight': int(fh), 'standOffset': {'dx_h': dx, 'base_h': dy, 'canonicalMovedBy': [shift_x, shift_y]},
    'order': ['rest', 'breath', 'writing', 'writing-scribble', 'looking-up'] + (['pen-down'] if len(pose_frames) > 2 else []),
    'sources': {'canonical': canon_path, 'sheet': sheet_path}, 'gamma': gamma,
}
(out_dir / 'frames.json').write_text(json.dumps(meta, indent=1))
# Skin-pixel spread check (doc 40): a derived frame must not change the shape of any skin region.
def skin(f):
    r, g, b, a = f[..., 0], f[..., 1], f[..., 2], f[..., 3]
    return int(((a > 128) & (r > 120) & (r > g + 15) & (g > b) & (r - b > 40) & (r < 250)).sum())
print('skin pixels per frame:', [skin(f) for f in small], '(0 and 1 must agree within 2%)')
print(f'{out_dir}/winnie-sheet.png: {len(small)} frames at {fw}x{fh_small}, scale {scale:.4f}')
