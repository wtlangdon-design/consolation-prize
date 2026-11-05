"""Room 16's Madame Ozymandia, keyed from operation 3's five-pose sheet. No image
operation.

HER DRAWING. No document describes her: doc 01 gives a brass rod, a great deal of
humming and an entrance fee; doc 04 "enormous theatrical authority deployed over
total fraud". The composition master drew a head-wrapped fortune-teller, a
caricature the builder's own brief led it to; her sheet draws her instead as an
American spiritualist medium of the 1850s -- black silk, lace, a cameo, a small
bonnet with its veil put up (errata 89 B) -- generated against Thad so she is on
his pixel grid. Rest, breath, humming, pronouncing, the palm held out for the fee.

KEYING, as tools/art/room13-ozymandia.py does it, with the key raised: her veil
is a purple close to the magenta.

BEHIND THE TABLE (posture behind-counter): scaled to HEIGHT, her spread hands on
the table top, everything below CUT dropped. The crystal ball, the cash box and
the tea pot stand in front of her: they are occlusion plane 1
(art/masks/room-16-plane-1.png, written here, white where they stand), assigned
to her by her ambient record's clipPlane, as Room 5's cage bars are to Winnie.

Writes art/staging/room-16/ozymandia/ozymandia.png and ozymandia.json, and
renders/room-16-ozymandia-cut.png.
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-16')
SOURCE = f'{S}/ozymandia-01/sheet.png'
GAP = 2
KEY = 150             # her veil is purple, near the key
HEIGHT = 440          # a woman standing behind the table, on the curve at the table's far side (about 440 at y 740)
HANDS_AT = 506        # her spread hands just above the table top's back edge (plate y 520), so she clears the ball
CUT = 522             # below this she is behind the table top
HANDS = 530           # her hands may lie a little onto the top
CENTRE_X = 967        # behind the crystal ball
# What stands on the table in front of her: masked out of her, by box and by colour
# (the curtain behind is a dark red; the ball, the brass and the box are not).
FRONT = [  # (x0, y0, x1, y1): the ball, the cash box, the tea pot
   (925, 424, 1012, 548), (795, 474, 890, 548), (1098, 462, 1192, 558)]
POSES = ['rest', 'humming', 'pronouncing', 'the fee']   # sheet poses 1, 3, 4, 5


def key_figures(src):
    key = np.minimum(src[..., 0], src[..., 2]) - src[..., 1]
    mask = key < KEY
    labels, count = ndi.label(mask)
    sizes = ndi.sum(mask, labels, range(1, count + 1))
    big = [1 + i for i in np.argsort(sizes)[::-1] if sizes[i] > 20000]
    figs = []
    for lab in big:
        m = labels == lab
        ys, xs = np.where(m)
        figs.append((xs.min(), m))
    # A watch held clear of the hand would be its own piece: fold any small
    # piece whose box sits inside a figure's column span into that figure.
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


PLATE_PX = None


def main():
    global PLATE_PX
    PLATE_PX = np.asarray(Image.open(os.path.join(ROOT, 'art/backgrounds/room-16-tent.png')).convert('RGB')).astype(int)
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
    os.makedirs(f'{S}/ozymandia', exist_ok=True)
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
        # THE RED LANTERN ON HER BLACKS. Her silk's deepest shadows (and her veil,
        # once despilled) are a neutral purple-black, red equal to blue; under the tent's red lamp
        # they take a little red. This is also why the key gate passes: it
        # reads exactly-equal red and blue in near-black as trapped key
        # (errata 89 F says so).
        d = s[..., :3].astype(int)
        dark = opaque & (d.sum(2) < 120) & (np.abs(d[..., 0] - d[..., 2]) <= 1)
        s[..., 0] = np.where(dark, np.minimum(255, d[..., 0] + 3), s[..., 0])
        frames.append((s, cx * scale))
    # breath from rest, on the whole figure before the counter cut
    f0, f1 = f'{S}/ozymandia/_rest.png', f'{S}/ozymandia/_breath.png'
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
    Image.fromarray(sheet).save(f'{S}/ozymandia/ozymandia.png')
    record = {
        'sheet': 'art/staging/room-16/ozymandia/ozymandia.png', 'frames': rects,
        'frameNames': ['rest', 'breath', 'humming', 'pronouncing', 'the fee'],
        'topLeft': {'x': x0, 'y': y0}, 'anchor': {'x': x0 + W // 2, 'y': y0 + H},
        'height': HEIGHT, 'feetRow': round(feet, 1), 'cut': CUT, 'handsTo': HANDS, 'key': KEY,
        'source': 'room-16 attempt 3 (art/staging/room-16/ozymandia-01/sheet.png)',
    }
    json.dump(record, open(f'{S}/ozymandia/ozymandia.json', 'w'), indent=1)
    plate = Image.open(os.path.join(ROOT, 'art/backgrounds/room-16-tent.png')).convert('RGBA')
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
    strip.convert('RGB').save(os.path.join(ROOT, 'renders/room-16-ozymandia-cut.png'))
    # THE PLANE: what stands on the table in front of her, by box and by colour
    # (the curtain behind is a dark red; the ball, the brass and the box are not).
    mask = np.zeros((864, 1920, 4), np.uint8)
    for fx0, fy0, fx1, fy1 in FRONT:
        pr = PLATE_PX[fy0:fy1, fx0:fx1]
        curtain = (pr[..., 0] > 1.5 * pr[..., 1]) & (pr[..., 0] > 1.25 * pr[..., 2]) & (pr.mean(2) < 110)
        on = ndi.binary_opening(~curtain, iterations=1)
        mask[fy0:fy1, fx0:fx1][on] = 255
    os.makedirs(os.path.join(ROOT, 'art/masks'), exist_ok=True)
    Image.fromarray(mask).save(os.path.join(ROOT, 'art/masks/room-16-plane-1.png'))
    print(json.dumps({k: record[k] for k in ('frames', 'topLeft', 'anchor', 'feetRow')}))


if __name__ == '__main__':
    main()
