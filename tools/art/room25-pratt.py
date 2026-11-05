"""Nickel Pratt, keyed from room-25 operation 3. No image operation here.

ON HIS CLAIM (doc 04 PRA_A1: "Pratt on his own claim, beside Prosperity,
raking"): rest, breath, his head tipped back to check the sky ("He looks up
at the sky, checking"), and raking -- the deliberate action errata 77 asks
for. Drawn in the morning light of Room 25's plate.

ON PROSPERITY (doc 57 D2: "Pratt is on it, pulling up the stake"; doc 04
PRA_D2: "with a stake and a mallet, mid-jump"): the mallet at rest, breath,
raised and striking a new stake at his boots; and his walk, mallet in hand,
for when he goes back next door. Graded into Room 23's dusk.

Cut per cell, not per blob: the new stake stands apart from him in three of
the four frames and belongs to every one. Keyed off magenta as
tools/art/room23-raccoon.py does it.

Writes art/staging/room-25/pratt/{pratt,pratt-jump}.png and .json, and
renders/room-25-pratt.png.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-25')
KEY = 90
GAP = 2
HOME = (1180, 716)       # where he rakes, in Room 25 (the master's place for him)
HOME_H = 395             # Room 25's curve at y 716 is 383; he is the bigger man (1.03)
JUMP = (560, 762)        # beside the claim marker on Prosperity
JUMP_H = 409             # Room 23's curve at y 762 is 397, times 1.03
DUSK = (0.72, 0.72, 0.8)


def cells(src, mask):
    rows = np.where(mask.any(1))[0]
    # The three rows: the two widest empty runs between drawn rows (a raised
    # mallet comes close to the walk row's boots).
    gaps = sorted(np.argsort(np.diff(rows))[::-1][:2])
    bands = [(rows[0], rows[gaps[0]] + 1), (rows[gaps[0] + 1], rows[gaps[1]] + 1), (rows[gaps[1] + 1], rows[-1] + 1)]
    out = []
    for y0, y1 in bands:
        band = mask[y0:y1]
        cols = np.where(band.any(0))[0]
        steps = np.diff(cols)
        cuts = sorted(np.argsort(steps)[::-1][:3])
        # The stake stands apart from the man: join each stake to the man to
        # its right by taking the three widest gaps BETWEEN frames, which are
        # wider than the gap between a stake and his boots.
        starts = [cols[0]] + [cols[i + 1] for i in cuts]
        ends = [cols[i] + 1 for i in cuts] + [cols[-1] + 1]
        row = []
        for x0, x1 in zip(starts, ends):
            m = band[:, x0:x1]
            ys = np.where(m.any(1))[0]
            t, b = y0 + ys[0], y0 + ys[-1] + 1
            mm = ndi.binary_erosion(mask[t:b, x0:x1], iterations=1)
            c = src[t:b, x0:x1].copy()
            cast = (c[..., 0] + c[..., 2]) / 2 - c[..., 1] > 24
            for ch in (0, 2):
                c[..., ch] = np.where(cast, np.minimum(c[..., ch], c[..., 1] + 24), c[..., ch])
            dark = (np.abs(c[..., 0] - c[..., 2]) <= 1) & (c[..., 0] - c[..., 1] >= 8) & (c[..., 0] < 40)
            c[..., 0] = np.where(dark, c[..., 0] + 3, c[..., 0])
            rgba = np.zeros((b - t, x1 - x0, 4), np.uint8)
            rgba[..., :3] = np.clip(c, 0, 255)
            rgba[..., 3] = np.where(mm, 255, 0)
            row.append(rgba)
        out.append(row)
    return out


def scaled(rgba, scale):
    img = Image.fromarray(rgba)
    s = np.asarray(img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)).copy()
    s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
    return s


def tint(rgba, t):
    out = rgba.copy()
    c = np.clip(rgba[..., :3].astype(float) * np.array(t), 0, 255).astype(int)
    # A dark purple the grade lands on R equal to B reads as un-keyed magenta
    # (tools/check-residual-key.mjs): nudge its red, as the cut does before it.
    dark = (np.abs(c[..., 0] - c[..., 2]) <= 1) & (c[..., 0] - c[..., 1] >= 8) & (c[..., 0] < 48)
    c[..., 0] = np.where(dark, c[..., 0] + 4, c[..., 0])
    out[..., :3] = np.clip(c, 0, 255).astype(np.uint8)
    return out


def heel(t):
    """His right boot heel: the rightmost drawn column in his bottom rows."""
    cols = np.where((t[-12:, :, 3] > 0).any(0))[0]
    return int(cols.max()) if len(cols) else t.shape[1] // 2


def sheet(groups, name, extra):
    """Each group's frames share ONE rect, every frame placed so his heel
    lands on the same column: a frame drawn centred on his x never moves him
    -- the stake at his boots and the swing of the mallet change a frame's
    width, not where he stands."""
    tiles, rects, layout = [], [], []
    for group in groups:
        a = max(heel(t) for t in group)
        w = a + max(t.shape[1] - heel(t) for t in group)
        h = max(t.shape[0] for t in group)
        for t in group:
            layout.append((t, a - heel(t), w, h))
    total = sum(w + GAP for _, _, w, _ in layout) + GAP
    height = max(h for _, _, _, h in layout) + 2 * GAP
    out = np.zeros((height, total, 4), np.uint8)
    x = GAP
    for t, dx, w, h in layout:
        top = height - GAP - t.shape[0]
        out[top:top + t.shape[0], x + dx:x + dx + t.shape[1]] = t
        rects.append([int(x), int(height - GAP - h), int(w), int(h)])
        x += w + GAP
    os.makedirs(f'{S}/pratt', exist_ok=True)
    Image.fromarray(out).save(f'{S}/pratt/{name}.png')
    record = {'sheet': f'art/staging/room-25/pratt/{name}.png', 'frames': rects, **extra}
    json.dump(record, open(f'{S}/pratt/{name}.json', 'w'), indent=1, default=int)
    return record


def unstake(jump):
    """THE NEW STAKE IS NOT PART OF HIM. A talking figure is drawn whole, one
    piece (tests/lessons.test.ts), so the stake at his boots comes out of the
    four mallet frames and stands on its own as a prop of Room 23: cut from
    the first frame, where it stands apart, and cleared from all four (in the
    last the mallet lands on it; what is left of him is his largest piece).
    Its place is the frame's: frames are drawn centred on his x with their
    bottom row on his y, at 1:1 here (Room 23's curve at his feet times his
    stature is his figure height)."""
    path = f'{S}/pratt/pratt-jump.png'
    img = np.asarray(Image.open(path).convert('RGBA')).copy()
    x0, y0, w, h = jump['frames'][0]
    cell = img[y0:y0 + h, x0:x0 + w]
    labels, n = ndi.label(cell[..., 3] > 0)
    sizes = ndi.sum(cell[..., 3] > 0, labels, range(1, n + 1))
    body = 1 + int(np.argmax(sizes))
    pieces = [1 + i for i in range(n) if 1 + i != body and sizes[i] > 200]
    stake_mask = np.isin(labels, pieces)
    ys, xs = np.where(stake_mask)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    prop = np.zeros((b - t, r - l, 4), np.uint8)
    prop[stake_mask[t:b, l:r]] = cell[t:b, l:r][stake_mask[t:b, l:r]]
    os.makedirs(os.path.join(ROOT, 'art/props'), exist_ok=True)
    Image.fromarray(prop).save(os.path.join(ROOT, 'art/props/room-23-pratt-stake.png'))
    for fx, fy, fw, fh in jump['frames'][:4]:
        c = img[fy:fy + fh, fx:fx + fw]
        c[max(0, t - 1):b + 1, max(0, l - 2):r + 2] = 0
        lab, m = ndi.label(c[..., 3] > 0)
        if m > 1:
            sz = ndi.sum(c[..., 3] > 0, lab, range(1, m + 1))
            c[(lab != 1 + int(np.argmax(sz))) & (c[..., 3] > 0)] = 0
    Image.fromarray(img).save(path)
    # WHERE THE MALLET LANDS. The frames are aligned on his heel, so his feet
    # never slide; the stake goes where the last frame's mallet head comes
    # down -- its head is the leftmost thing drawn -- standing just under it.
    fx, fy, fw, fh = jump['frames'][3]
    down = img[fy:fy + fh, fx:fx + fw, 3] > 0
    cols = np.where(down.any(0))[0]
    head = down[:, cols[0]:cols[0] + 24]
    rows = np.where(head.any(1))[0]
    left = JUMP[0] - fw // 2
    top = JUMP[1] - fh + 1
    x = int(left + cols[0] + 12)
    y = int(top + rows.max() + (b - t))
    return {'x': x, 'y': y, 'frame': [0, 0, int(r - l), int(b - t)]}


def main():
    src = np.asarray(Image.open(f'{S}/pratt-01/sheet.png').convert('RGB')).astype(int)
    key = np.minimum(src[..., 0], src[..., 2]) - src[..., 1]
    mask = ndi.binary_opening(key < KEY, iterations=1)
    rake, walk, mallet = cells(src, mask)
    k = HOME_H / rake[0].shape[0]
    home = sheet([[scaled(f, k) for f in rake]], 'pratt', {
        'height': HOME_H, 'frameNames': ['rest', 'breath', 'sky', 'rake'], 'anchor': {'x': HOME[0], 'y': HOME[1]},
        'source': 'room-25 attempt 3 (art/staging/room-25/pratt-01/sheet.png), the top row'})
    j = JUMP_H / mallet[0].shape[0]
    jw = JUMP_H / max(f.shape[0] for f in walk) * 0.97
    jump_tiles = [tint(scaled(f, j), DUSK) for f in mallet] + [tint(scaled(f, jw), DUSK) for f in walk]
    jump = sheet([jump_tiles[:4], jump_tiles[4:]], 'pratt-jump', {
        'height': JUMP_H, 'walkHeight': max(t.shape[0] for t in jump_tiles[4:]),
        'frameNames': ['mallet rest', 'mallet breath', 'mallet up', 'mallet down', 'walk 1', 'walk 2', 'walk 3', 'walk 4'],
        'drawnFacing': 'left', 'anchor': {'x': JUMP[0], 'y': JUMP[1]},
        'source': 'room-25 attempt 3, the bottom and middle rows, graded into Room 23\'s dusk'})
    stake = unstake(jump)
    plate = Image.open(os.path.join(ROOT, 'art/backgrounds/room-25-pratts-claim.png')).convert('RGBA')
    p = Image.open(f'{S}/pratt/pratt.png').convert('RGBA')
    fr = home['frames'][0]
    plate.alpha_composite(p.crop((fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3])), (HOME[0] - fr[2] // 2, HOME[1] - fr[3]))
    pros = Image.open(os.path.join(ROOT, 'art/backgrounds/room-23-prosperity.png')).convert('RGBA')
    q = Image.open(f'{S}/pratt/pratt-jump.png').convert('RGBA')
    st = Image.open(os.path.join(ROOT, 'art/props/room-23-pratt-stake.png')).convert('RGBA')
    pros.alpha_composite(st, (stake['x'] - st.width // 2, stake['y'] - st.height + 1))
    fr = jump['frames'][0]
    pros.alpha_composite(q.crop((fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3])), (JUMP[0] - fr[2] // 2, JUMP[1] - fr[3] + 1))
    strip = Image.new('RGB', (1920, 1728))
    strip.paste(plate.convert('RGB'), (0, 0))
    strip.paste(pros.convert('RGB'), (0, 864))
    strip.save(os.path.join(ROOT, 'renders/room-25-pratt.png'))
    print(json.dumps({'home': [f[3] for f in home['frames']], 'jump': [f[3] for f in jump['frames']], 'stake': stake}))


if __name__ == '__main__':
    main()
