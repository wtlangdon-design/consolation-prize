"""Room 20's one figure, the alley cat, keyed from room-20 operation 3. No
image operation here.

THE CAT (doc 05: "A cat on a crate, in the one square of sun. It has arranged
the alley around itself"; doc 09: "entirely uninterested in the gold rush").
Five poses on magenta, generated against a side-by-side with Thad: rest,
breath (derived from rest), her tail lifted, her head turned to look left, a
paw washed. Posture animal: sitting on the top crate's lid, in the light from
the propped back door (errata 93 B).

KEYING, as tools/art/room15-figures.py does it: the largest piece per pose,
the edge eroded one source pixel, a despill.

Writes art/staging/room-20/cat/cat.png and .json, and renders/room-20-cat.png.
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-20')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-20-back-alley.png')
GAP = 2
KEY = 90

# The top crate's lid, x 413-535, its front edge at y 558: she sits on its lit half.
CAT = {'height': 56, 'bottom': 556, 'centre': 462}


def key_figures(src):
    key = np.minimum(src[..., 0], src[..., 2]) - src[..., 1]
    mask = key < KEY
    labels, count = ndi.label(mask)
    sizes = ndi.sum(mask, labels, range(1, count + 1))
    big = [1 + i for i in np.argsort(sizes)[::-1] if sizes[i] > 8000]
    figs = sorted(((np.where(labels == lab)[1].min(), labels == lab) for lab in big), key=lambda f: f[0])
    # fold a small piece (a snort's breath, a hat brim) into the figure whose columns hold it
    merged = []
    for x0, m in figs:
        xs = np.where(m)[1]
        if merged and xs.min() < merged[-1][1] + 20 and m.sum() < 30000:
            merged[-1] = (merged[-1][0], max(merged[-1][1], xs.max()), merged[-1][2] | m)
        else:
            merged.append((x0, xs.max(), m))
    return [m for _, _, m in merged]


def cut(src, m):
    m = ndi.binary_erosion(m, iterations=1)
    _, (iy, ix) = ndi.distance_transform_edt(~m, return_indices=True)
    filled = src[iy, ix]
    ys, xs = np.where(m)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.zeros((b - t, r - l, 4), np.uint8)
    rgba[..., :3] = filled[t:b, l:r]
    rgba[..., 3] = np.where(m[t:b, l:r], 255, 0)
    base = m[b - (b - t) // 6:b, l:r]
    return rgba, float(np.where(base)[1].mean())


def scaled(rgba, scale):
    img = Image.fromarray(rgba)
    s = np.asarray(img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)).copy()
    s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
    c = s[..., :3].astype(int)
    cast = (s[..., 3] > 0) & ((c[..., 0] + c[..., 2]) / 2 - c[..., 1] > 24)
    for ch in (0, 2):
        s[..., ch] = np.where(cast, np.minimum(c[..., ch], c[..., 1] + 24), c[..., ch])
    return s


def breath(rest, name):
    os.makedirs(f'{S}/{name}', exist_ok=True)
    f0, f1 = f'{S}/{name}/_rest.png', f'{S}/{name}/_breath.png'
    Image.fromarray(rest).save(f0)
    subprocess.run(['python3', os.path.join(ROOT, 'tools/rig/ambient-breath.py'), f0, f1], check=True)
    out = np.asarray(Image.open(f1).convert('RGBA')).copy()
    os.remove(f0)
    os.remove(f1)
    return out


def poses(sheet, height):
    src = np.asarray(Image.open(sheet).convert('RGB')).astype(int)
    figs = key_figures(src)
    if len(figs) != 5:
        raise SystemExit(f'{sheet}: expected five poses, found {len(figs)}')
    cuts = [cut(src, m) for m in figs]
    scale = height / cuts[0][0].shape[0]
    return [(scaled(rgba, scale), cx * scale) for rgba, cx in cuts]


def lay(frames, bottom, centre, canvas_box):
    """Each frame on a canvas in plate coordinates: its bottom on `bottom`, its base centre on `centre`."""
    x0, y0, x1, y1 = canvas_box
    out = []
    for f, cx in frames:
        c = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        px, py = int(round(centre - cx - x0)), int(round(bottom - f.shape[0] - y0))
        sy0, sx0 = max(0, -py), max(0, -px)
        sy1, sx1 = min(f.shape[0], c.shape[0] - py), min(f.shape[1], c.shape[1] - px)
        region = c[py + sy0:py + sy1, px + sx0:px + sx1]
        src = f[sy0:sy1, sx0:sx1]
        on = src[..., 3] > 0
        region[on] = src[on]
        out.append(c)
    return out


def graded(placed, box, strength=0.6):
    """Each figure lit by where it stands (as tools/grade/match-local.py does): its
    luminance scaled part of the way toward the plate's in a ring around it."""
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(float)
    x0, y0, x1, y1 = box
    ring = np.concatenate([plate[max(0, y0 - 30):y0, x0:x1].reshape(-1, 3),
                           plate[y0:y1, max(0, x0 - 30):x0].reshape(-1, 3),
                           plate[y0:y1, x1:x1 + 30].reshape(-1, 3)])
    local = float(ring.mean())
    out = []
    for p in placed:
        on = p[..., 3] > 0
        own = float(p[..., :3][on].mean()) if on.any() else local
        factor = (local / own) ** strength if own > local else 1.0
        q = p.copy()
        q[..., :3] = np.clip(p[..., :3].astype(float) * factor, 0, 255).astype(np.uint8)
        out.append(q)
    print(f'  graded {x0},{y0}: local {local:.0f}, figure {own:.0f}, x{factor:.2f}')
    return out


def box_of(frames, bottom, centre, pad=4):
    left = min(centre - cx for f, cx in frames) - pad
    right = max(centre - cx + f.shape[1] for f, cx in frames) + pad
    top = min(bottom - f.shape[0] for f, _ in frames) - pad
    return int(np.floor(left)), int(np.floor(top)), int(np.ceil(right)), int(bottom) + 1


def write(name, placed, box, frame_names, extra):
    x0, y0, x1, y1 = box
    # trim every frame to the union of what is drawn
    union = np.zeros(placed[0].shape[:2], bool)
    for p in placed:
        union |= p[..., 3] > 0
    ys, xs = np.where(union)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    placed = [p[t:b, l:r] for p in placed]
    W, H = r - l, b - t
    sheet = np.zeros((H + 2 * GAP, len(placed) * (W + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, p in enumerate(placed):
        x = GAP + i * (W + GAP)
        sheet[GAP:GAP + H, x:x + W] = p
        rects.append([x, GAP, int(W), int(H)])
    os.makedirs(f'{S}/{name}', exist_ok=True)
    Image.fromarray(sheet).save(f'{S}/{name}/{name}.png')
    top_left = {'x': int(x0 + l), 'y': int(y0 + t)}
    record = {'sheet': f'art/staging/room-20/{name}/{name}.png', 'frames': rects, 'frameNames': frame_names,
              'topLeft': top_left, 'anchor': {'x': int(x0 + l + W // 2), 'y': int(y0 + t + H)}, **extra}
    json.dump(record, open(f'{S}/{name}/{name}.json', 'w'), indent=1, default=int)
    return record, placed, top_left


def main():
    cat = poses(f'{S}/cat-01/sheet.png', CAT['height'])
    cat[1] = (breath(cat[0][0], 'cat'), cat[0][1])
    box = box_of(cat, CAT['bottom'], CAT['centre'])
    placed = graded(lay(cat, CAT['bottom'], CAT['centre'], box), box, strength=0.3)
    record, frames, at = write('cat', placed, box, ['rest', 'breath', 'tail', 'look', 'wash'],
                               {'height': CAT['height'], 'posture': 'animal',
                                'source': 'room-20 attempt 3 (art/staging/room-20/cat-01/sheet.png)'})
    plate = Image.open(PLATE).convert('RGBA')
    views = []
    for i in range(5):
        v = plate.copy()
        v.alpha_composite(Image.fromarray(frames[i]), (at['x'], at['y']))
        views.append(v.crop((330, 430, 630, 630)).resize((600, 400), Image.NEAREST))
    strip = Image.new('RGBA', (views[0].width * 5, views[0].height))
    for i, v in enumerate(views):
        strip.paste(v, (i * v.width, 0))
    strip.convert('RGB').save(os.path.join(ROOT, 'renders/room-20-cat.png'))
    print(json.dumps({k: record[k] for k in ('frames', 'topLeft', 'anchor')}, default=int))


if __name__ == '__main__':
    main()
