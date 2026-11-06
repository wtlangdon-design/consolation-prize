"""Duel Three's two crowds, composed person by person on Room 2's street.

Tyler, 2026-11-06: "all the characters in this scene are still a mess" -- the
two crowds were three people each in a stiff row facing the camera, from
before the locked cast. Cast-unify 29 drew eleven distinct townspeople on
magenta (reference/cast-unify-27.txt), six turned right and five turned left.
Each stands at his own spot on the street, his feet on it, drawn at the
street's own man there (the depth curve) times his height in the drawing, so
nearer people are larger and nobody floats; the left group watches the duel
from beside the trough, the right group from past the assay office, clear of
the dog, the pie woman, the map seller, Fanshawe and Thad.

Each group is one band sheet, drawn 1:1 where it was composed: 0 rest,
1 breath, 2-4 a different few of them leaning to each other.

Writes art/actors/room-02-duel-town-<side>.png; prints frames, x, y per side.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = os.path.join(ROOT, 'art/staging/cast-unify/batch-27')
REF = 372                     # an ordinary man's height in the drawing, crown to sole
# Each group looks toward the duel: the left group to its right, the right
# group to its left. The drawing turned all eleven to the left, whatever the
# brief asked (Tyler, 2026-11-06: "as long as everyone is supposed to be looking
# where they're looking"), so a group whose people face the wrong way is
# mirrored, and every person is measured after: the tool refuses to write a
# crowd with anyone facing away.
FACES = {'left': 'right', 'right': 'left'}
GROUPS = {
    'left': ('row-right', [(2352, 738, 162), (2405, 712, 152), (2495, 728, 158), (2300, 792, 182), (2440, 772, 174), (2525, 800, 185)]),
    'right': ('row-left', [(3450, 718, 154), (3565, 748, 165), (3395, 760, 170), (3620, 795, 183), (3505, 805, 186)]),
}
LEANS = [[(0, 5), (3, -5)], [(1, -5), (4, 5), (2, 4)], [(5, -5), (2, -4), (0, -4)]]


def people(row):
    sh = Image.open(f'{B}/{row}.png').convert('RGBA')
    out = []
    for x, y, w, h in json.load(open(f'{B}/{row}.json'))['frames']:
        c = sh.crop((x, y, x + w, y + h))
        bb = c.getbbox(); out.append(c.crop(bb))
    return out


def facing(img):
    """+ looks right, - looks left: the face's skin centroid against the head's, top 16%."""
    a = np.asarray(img).astype(int); m = a[..., 3] > 128
    rows = np.nonzero(m.any(1))[0]; top = rows[0]; H = rows[-1] - top
    hd = a[top:top + max(4, int(H * 0.16))]; ha = hd[..., 3] > 128
    r, g, b = hd[..., 0], hd[..., 1], hd[..., 2]
    skin = ha & (r > 150) & (g > 95) & (r - b > 45)
    return float(np.nonzero(skin)[1].mean() - np.nonzero(ha)[1].mean())


def lean(img, dx):
    a = np.asarray(img).copy(); h = a.shape[0]; out = np.zeros_like(a)
    for yy in range(h):
        s = int(round(dx * (h - 1 - yy) / (h - 1)))
        if s > 0: out[yy, s:] = a[yy, :-s]
        elif s < 0: out[yy, :s] = a[yy, -s:]
        else: out[yy] = a[yy]
    return Image.fromarray(out)


result = {}
for side, (row, spots) in GROUPS.items():
    figs = people(row)
    want = 1 if FACES[side] == 'right' else -1
    figs = [f if facing(f) * want > 0 else f.transpose(Image.FLIP_LEFT_RIGHT) for f in figs]
    wrong = [i for i, f in enumerate(figs) if facing(f) * want <= 1.0]
    if wrong:
        raise SystemExit(f'{side}: people {wrong} do not clearly face {FACES[side]}')
    placed = []
    for i, (x, y, man) in enumerate(spots):
        f = figs[i]; k = man / REF
        placed.append((y, i, x, f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS)))
    x0 = min(x - p.width // 2 for _, _, x, p in placed) - 8; x1 = max(x - p.width // 2 + p.width for _, _, x, p in placed) + 8
    y0 = min(y - p.height + 1 for y, _, _, p in placed) - 8; y1 = max(y for y, _, _, _ in placed) + 1
    W, H = x1 - x0, y1 - y0

    def frame(changes):
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for y, i, x, p in sorted(placed):
            q = changes.get(i, p)
            canvas.alpha_composite(q, (x - p.width // 2 - x0, y - p.height + 1 - y0))
        a = np.asarray(canvas).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
        return a
    rest = frame({})
    breath = rest.copy(); cut = int(H * 0.55); breath[:cut - 1] = rest[1:cut]
    acts = [frame({i: lean(placed[[q[1] for q in placed].index(i)][3], dx) for i, dx in grp if i < len(placed)}) for grp in LEANS]
    frames = [rest, breath] + acts
    GAP = 2
    sheet = np.zeros((H + 2 * GAP, len(frames) * (W + GAP) + GAP, 4), np.uint8); rects = []
    for n, f in enumerate(frames):
        fx = GAP + n * (W + GAP); sheet[GAP:GAP + H, fx:fx + W] = f; rects.append([fx, GAP, W, H])
    Image.fromarray(sheet).save(os.path.join(ROOT, f'art/actors/room-02-duel-town-{side}.png'))
    result[side] = {'frames': rects, 'x': x0 + W // 2, 'y': y1 - 1}
print(json.dumps(result))
