"""Room 15's three figures, keyed from room-15 operations 3 and 4. No image
operation here.

THE LIVERY MAN (operation 3, five poses in his chair): no document describes
his looks; he is drawn as the composition master drew him, old, lean, a
battered hat, braces, tipped back in a kitchen chair facing Grievance's stall
(doc 54's chair: "It faces Grievance's stall"). Posture seated: the whole man
and his chair, drawn over the plate's empty chair. Rest, breath (derived from
rest), humming, talking, the hat brim pulled down.

GRIEVANCE (operation 4, five whole-mule poses): behind her half door, cut at
the door's top (posture animal). Rest, breath (derived), ears round to the
left, her head turned to look left, a snort.

THE OTHER MULES (doc 09: "Four mules, numbered"). The master drew them as
heads and necks with no bodies; Tyler, seeing it: "what the hell are the four
half donkey things in that pen?", and chose to draw them from Grievance's
sheet, which has no image operation left to replace (errata 88 F). So: her
poses, mirrored so they look right, across at her stall ("the way a work crew
looks at a man who has got away with something"), lightened a shade, four of
them side by side in the pen, behind its rails -- every pixel on a rail row is
dropped, so they show through the gaps. One figure of five frames: the four
at rest, breathing, and three frames in which different mules turn their ears
or their heads, so they never move in step.

KEYING, as tools/art/room13-undertaker.py does it: the largest piece per pose,
the edge eroded one source pixel, a despill.

Writes art/staging/room-15/{livery-man,grievance,mules}/<name>.png and .json,
and renders/room-15-figures.png.
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-15')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-15-livery.png')
GAP = 2
KEY = 90

# Placement, read off the plate with a grid over it.
LIVERY = {'height': 235, 'bottom': 622, 'centre': 990}      # his chair over the plate's, x 875-1010
GRIEVANCE = {'height': 360, 'bottom': 606, 'centre': 1125, 'cut': 430}   # half door x 1050-1200, top y 428
# Each mule's right end (its head), depth scale and lift; drawn back to front.
MULES = {'height': 225, 'bottom': 616, 'right': [724, 604, 668, 548], 'depth': [1.0, 0.9, 0.86, 0.94],
         'lift': [0, 24, 32, 10], 'draw': [2, 1, 3, 0]}
RAILS = [(465, 487), (513, 535), (561, 583)]                 # the pen's three rails, plate rows
PEN = (462, 726)                                             # inside the pen's two posts


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
    record = {'sheet': f'art/staging/room-15/{name}/{name}.png', 'frames': rects, 'frameNames': frame_names,
              'topLeft': top_left, 'anchor': {'x': int(x0 + l + W // 2), 'y': int(y0 + t + H)}, **extra}
    json.dump(record, open(f'{S}/{name}/{name}.json', 'w'), indent=1, default=int)
    return record, placed, top_left


def main():
    shown = []
    # THE LIVERY MAN, whole, in his chair.
    lm = poses(f'{S}/livery-man-01/sheet.png', LIVERY['height'])
    lm[1] = (breath(lm[0][0], 'livery-man'), lm[0][1])
    box = box_of(lm, LIVERY['bottom'], LIVERY['centre'])
    placed = graded(lay(lm, LIVERY['bottom'], LIVERY['centre'], box), box)
    shown.append(write('livery-man', placed, box, ['rest', 'breath', 'humming', 'talking', 'hat'],
                       {'height': LIVERY['height'], 'posture': 'seated',
                        'source': 'room-15 attempt 3 (art/staging/room-15/livery-man-01/sheet.png)'}))
    # GRIEVANCE, behind her half door.
    gr = poses(f'{S}/grievance-01/sheet.png', GRIEVANCE['height'])
    gr[1] = (breath(gr[0][0], 'grievance'), gr[0][1])
    box = box_of(gr, GRIEVANCE['bottom'], GRIEVANCE['centre'])
    placed = lay(gr, GRIEVANCE['bottom'], GRIEVANCE['centre'], box)
    for p in placed:
        p[GRIEVANCE['cut'] - box[1]:] = 0
    placed = graded(placed, box)
    shown.append(write('grievance', placed, box, ['rest', 'breath', 'ears', 'look', 'snort'],
                       {'height': GRIEVANCE['height'], 'cut': GRIEVANCE['cut'], 'posture': 'animal',
                        'source': 'room-15 attempt 4 (art/staging/room-15/grievance-01/sheet.png)'}))
    # THE OTHER MULES (room-15 operation 5): four side-on mules, each with an
    # action pose, crowded in the narrow pen, heads toward Grievance's stall.
    src = np.asarray(Image.open(f'{S}/mules-01/sheet.png').convert('RGB')).astype(int)
    figs = key_figures(src)
    if len(figs) != 8:
        raise SystemExit(f'mules-01: expected eight mules, found {len(figs)}')
    # two rows: sort by row, then by column
    cuts = [cut(src, m) for m in figs]
    tops = [np.where(m)[0].min() for m in figs]
    order_rc = sorted(range(8), key=lambda i: (tops[i] > src.shape[0] // 2, np.where(figs[i])[1].min()))
    rest_cuts = [cuts[i] for i in order_rc[:4]]
    act_cuts = [cuts[i] for i in order_rc[4:]]
    each = []
    for k in range(4):
        h0 = rest_cuts[k][0].shape[0]
        sc = MULES['height'] * MULES['depth'][k] / h0
        rest = scaled(rest_cuts[k][0], sc)
        act = scaled(act_cuts[k][0], sc)
        each.append({'rest': (rest, rest.shape[1] - rest.shape[1] / 2),
                     'breath': None, 'act': (act, act.shape[1] / 2), 'r': (rest, rest.shape[1] / 2)})
    for k in range(4):
        each[k]['breath'] = (breath(each[k]['r'][0], 'mules'), each[k]['r'][1])
    # which mules act in each frame, so they never move in step
    WEAR = [[0, 0, 0, 0], [1, 1, 1, 1], [2, 0, 0, 2], [0, 2, 0, 0], [0, 0, 2, 0]]
    rows = np.zeros(1000, bool)
    for a0, b0 in RAILS:
        rows[a0:b0 + 1] = True
    box = (PEN[0], 200, PEN[1] + 1, MULES['bottom'] + 1)
    placed = []
    for wear in WEAR:
        canvas = np.zeros((box[3] - box[1], box[2] - box[0], 4), np.uint8)
        for k in MULES['draw']:      # the back ones first
            f, cx = (each[k]['r'], each[k]['breath'], each[k]['act'])[wear[k]]
            # rest and action share the hoof line and the rump end
            layer = lay([(f, f.shape[1] / 2)], MULES['bottom'] - MULES['lift'][k],
                        MULES['right'][k] - each[k]['r'][0].shape[1] / 2, box)[0]
            on = layer[..., 3] > 0
            canvas[on] = layer[on]
        ys = np.arange(canvas.shape[0]) + box[1]
        canvas[rows[ys]] = 0
        placed.append(canvas)
    placed = graded(placed, box)
    shown.append(write('mules', placed, box, ['rest', 'breath', 'two eat and swish', 'ears back', 'head up'],
                       {'height': MULES['height'], 'posture': 'animal', 'rails': RAILS,
                        'source': 'room-15 attempt 5 (art/staging/room-15/mules-01/sheet.png)'}))
    plate = Image.open(PLATE).convert('RGBA')
    views = []
    for i in range(5):
        v = plate.copy()
        for record, frames, at in shown:
            v.alpha_composite(Image.fromarray(frames[i]), (at['x'], at['y']))
        views.append(v.crop((420, 160, 1440, 660)))
    strip = Image.new('RGBA', (views[0].width, views[0].height * 5))
    for i, v in enumerate(views):
        strip.paste(v, (0, i * v.height))
    strip.convert('RGB').save(os.path.join(ROOT, 'renders/room-15-figures.png'))
    print(json.dumps({r['sheet']: {k: r[k] for k in ('frames', 'topLeft', 'anchor')} for r, _, _ in shown}, default=int))


if __name__ == '__main__':
    main()
