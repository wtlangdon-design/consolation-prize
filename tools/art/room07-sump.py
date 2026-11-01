"""Room 7's Registrar Sump, keyed from operation 3's five-pose sheet. No image
operation.

HIS DRAWING. Canon gives Sump no appearance (errata 80 B), so he was drawn first
in the composition master, behind his counter beside Thad (style gate step 1),
and then drawn alone on flat magenta in five poses from that master (room-07
operation 3, reference/room-07/prompts/sump-01.txt): rest, breath, writing,
stamping, looking up over his spectacles. Keyed, never cut from a plate (doc 55
section 8).

KEYING, as tools/art/room04-sowerby.py does it: magenta-ness is min(R, B) - G,
below KEY is him; the largest piece per pose, holes filled, the edge eroded one
source pixel, the colour under his transparent pixels filled from his nearest
own pixel so resampling cannot reach the key, then a despill.

REGISTRATION. Each pose is aligned on its shoe baseline and on the centre of
its legs, which do not move between poses, so the breaks change his arms and
head and never shift the man. The breath frame is derived from the rest frame
(tools/rig/ambient-breath.py) rather than taken from pose 2: two drawings of
one man differ everywhere and would read as a twitch.

BEHIND THE COUNTER (posture behind-counter, as Winnie's in Room 5). He is
scaled to HEIGHT, a standing man just behind the counter, and placed so that
his resting hands lie on the open ledger; everything of him below the
ledger's far edge (CUT) is dropped, in one straight line just under his
resting hands. (A matte that kept hand-coloured pixels below the line was tried
first and left loose fragments on the ledger's pages.) So `y` in his record is the row under his hands,
not his feet: the sheet has no feet.

Writes art/staging/room-07/sump/sump.png (rest, breath, writing, stamping,
looking up) and sump.json, and renders/room-07-sump-cut.png.
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-07')
SOURCE = f'{S}/sump-01/sheet.png'
GAP = 2
KEY = 90
HEIGHT = 450          # a standing man just behind the counter (feet near y 699 on the room's curve)
HANDS_AT = 440        # the rest pose's hands rest at the ledger's far edge (plate y 440)
CUT = 450             # below this he is behind the ledger and the counter; his hands end just above it
HANDS = 450           # one straight cut: a matte that kept hand pixels below it left fragments on the page
CENTRE_X = 1300       # over the ledger (plate x 1190-1395)
POSES = ['rest', 'writing', 'stamping', 'looking up']   # sheet poses 1, 3, 4, 5


def key_figures(src):
    key = np.minimum(src[..., 0], src[..., 2]) - src[..., 1]
    mask = key < KEY
    labels, count = ndi.label(mask)
    sizes = ndi.sum(mask, labels, range(1, count + 1))
    big = [1 + i for i in np.argsort(sizes)[::-1] if sizes[i] > 20000]
    figs = []
    for lab in big:
        m = ndi.binary_fill_holes(labels == lab)
        ys, xs = np.where(m)
        figs.append((xs.min(), m))
    # The stamp is held clear of his hand in pose 4: fold any big piece whose
    # box sits inside a figure's column span into that figure.
    figs.sort(key=lambda f: f[0])
    merged = []
    for x0, m in figs:
        ys, xs = np.where(m)
        if merged and xs.max() < merged[-1][1] + 40 and m.sum() < 30000:
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
    # the legs' centre, in the bottom fifth: they do not move between poses
    legs = m[b - (b - t) // 5:b, l:r]
    cx = float(np.where(legs)[1].mean())
    return rgba, cx


def main():
    src = np.asarray(Image.open(SOURCE).convert('RGB')).astype(int)
    figs = key_figures(src)
    if len(figs) != 5:
        raise SystemExit(f'expected five poses on the sheet, found {len(figs)}')
    cuts = [cut(src, m) for m in figs]
    rest_h = cuts[0][0].shape[0]
    scale = HEIGHT / rest_h
    # where the rest pose's hands are, as a fraction of his height: the lowest
    # skin rows in his middle third
    rgb = cuts[0][0][..., :3].astype(int)
    skin = (cuts[0][0][..., 3] > 0) & (rgb[..., 0] > 150) & (rgb[..., 0] > rgb[..., 2] + 40)
    rows = np.where(skin.any(1))[0]
    hands_frac = float(rows[(rows > rest_h * 0.35) & (rows < rest_h * 0.65)].mean()) / rest_h
    top = HANDS_AT - hands_frac * HEIGHT        # plate row of his head's top in the rest pose
    feet = top + HEIGHT

    frames = []
    os.makedirs(f'{S}/sump', exist_ok=True)
    for index, (rgba, cx) in enumerate(cuts):
        if index == 1:
            continue  # pose 2 (breath) is derived from rest, below
        img = Image.fromarray(rgba)
        w, h = round(img.width * scale), round(img.height * scale)
        s = np.asarray(img.resize((w, h), Image.LANCZOS)).copy()
        s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
        opaque = s[..., 3] > 0
        c = s[..., :3].astype(int)
        cast = opaque & ((c[..., 0] + c[..., 2]) / 2 - c[..., 1] > 24)
        for ch in (0, 2):
            s[..., ch] = np.where(cast, np.minimum(c[..., ch], c[..., 1] + 24), c[..., ch])
        frames.append((s, cx * scale))
    # breath from rest, on the whole figure before the counter cut
    f0, f1 = f'{S}/sump/_rest.png', f'{S}/sump/_breath.png'
    Image.fromarray(frames[0][0]).save(f0)
    subprocess.run(['python3', os.path.join(ROOT, 'tools/rig/ambient-breath.py'), f0, f1], check=True)
    frames.insert(1, (np.asarray(Image.open(f1).convert('RGBA')).copy(), frames[0][1]))
    os.remove(f0)
    os.remove(f1)

    # Place every frame on one canvas in plate coordinates: shoes on `feet`,
    # legs' centre on CENTRE_X; then keep rows above CUT, and his hands down to HANDS.
    left = min(CENTRE_X - cx for _, cx in frames)
    right = max(CENTRE_X - cx + f.shape[1] for f, cx in frames)
    upper = min(feet - f.shape[0] for f, _ in frames)
    x0, x1, y0 = int(np.floor(left)), int(np.ceil(right)), int(np.floor(upper))
    W, H = x1 - x0, HANDS - y0
    placed = []
    for f, cx in frames:
        canvas = np.zeros((int(feet) - y0 + 2, W, 4), np.uint8)
        px, py = int(round(CENTRE_X - cx - x0)), int(round(feet - f.shape[0] - y0))
        canvas[py:py + f.shape[0], px:px + f.shape[1]] = f
        canvas = canvas[:H]
        c = canvas[..., :3].astype(int)
        hand = (c[..., 0] > 140) & (c[..., 0] > c[..., 2] + 35) & (c[..., 1] > 90)
        below = np.arange(H)[:, None] + y0 >= CUT
        canvas[below & ~hand] = 0
        # a stray hand pixel cut off from the hand is dropped
        lab, n = ndi.label(canvas[..., 3] > 0)
        if n > 1:
            sizes = ndi.sum(canvas[..., 3] > 0, lab, range(1, n + 1))
            keep = np.isin(lab, [1 + i for i in range(n) if sizes[i] >= 40])
            canvas[~keep] = 0
        placed.append(canvas)
    sheet = np.zeros((H + 2 * GAP, len(placed) * (W + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, p in enumerate(placed):
        x = GAP + i * (W + GAP)
        sheet[GAP:GAP + H, x:x + W] = p
        rects.append([x, GAP, W, H])
    Image.fromarray(sheet).save(f'{S}/sump/sump.png')
    record = {
        'sheet': 'art/staging/room-07/sump/sump.png', 'frames': rects,
        'frameNames': ['rest', 'breath', 'writing', 'stamping', 'looking up'],
        'topLeft': {'x': x0, 'y': y0}, 'anchor': {'x': x0 + W // 2, 'y': y0 + H},
        'height': HEIGHT, 'feetRow': round(feet, 1), 'cut': CUT, 'handsTo': HANDS, 'key': KEY,
        'source': 'room-07 attempt 3 (art/staging/room-07/sump-01/sheet.png)',
    }
    json.dump(record, open(f'{S}/sump/sump.json', 'w'), indent=1)
    plate = Image.open(os.path.join(ROOT, 'art/backgrounds/room-07-claims-registrar.png')).convert('RGBA')
    views = []
    for p in placed:
        v = plate.copy()
        v.alpha_composite(Image.fromarray(p), (x0, y0))
        views.append(v.crop((x0 - 60, y0 - 20, x1 + 60, HANDS + 60)))
    strip = Image.new('RGBA', (sum(v.width for v in views), views[0].height))
    x = 0
    for v in views:
        strip.paste(v, (x, 0))
        x += v.width
    strip.convert('RGB').save(os.path.join(ROOT, 'renders/room-07-sump-cut.png'))
    print(json.dumps({k: record[k] for k in ('frames', 'topLeft', 'anchor', 'feetRow')}))


if __name__ == '__main__':
    main()
