"""The Deacon is Deke Vessel, exactly, minus the mustache (doc 109, Two decisions, 2; Tyler, 2026-11-09: "can you
overlay Deke on Deacon to make sure they're exactly the same minus the mustache?").

gulch-vessel operation 1 drew a new man, and side by side with Vessel's accepted figure he was another man. So the
Deacon is Vessel's own accepted frames (art/actors/deke-vessel.png, content/ambient/deke-vessel.json), every pixel his
but one band. A first pass filled the mustache in code -- cheek colour, a pale stripe, a drawn mouth -- and at game size
it read as a muzzle (Tyler: "Is that how you're planning on leaving him? With mouth?"). So gulch-vessel operation 2 had
the model shave Vessel's own sheet, and from that edit only the mustache band of each frame is taken: registered to the
frame, its colour matched to his on a ring round the band, its edge blended into his pixels, the magenta key's fringe
kept out, and its own mouth deepened so it survives the snap at game size. Everything outside the band is his. Then the frames are scaled to the grog tent's man at the Deacon's feet and
snapped to one level (errata 112), as every figure in the room is.

    python3 tools/art/room52-deacon-from-deke.py
writes art/actors/room-52-deacon.png, art/staging/room-52/deacon/deacon.json and renders/room-52-deacon-vs-deke.png
(Vessel above, the Deacon below, and their difference -- only the mustache's pixels -- in the last row).
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEKE = json.load(open(os.path.join(ROOT, 'content/ambient/deke-vessel.json')))['sprite']
SHEET = os.path.join(ROOT, DEKE['sheet'])


# The edit (gulch-vessel operation 2): Vessel's own sheet on magenta at OFFSET, the mustache shaved off by the model.
EDIT = os.path.join(ROOT, 'art/staging/room-52/deacon-shave/source.png')
OFFSET = tuple(int(v) for v in open(os.path.join(ROOT, 'art/staging/room-52/deacon-shave/offset.txt')).read().split())

# EACH FRAME'S MUSTACHE, MEASURED (rows and columns in the frame, from the figure's own pixels: the run of rows under the
# nose that is mostly dark across the face), and each frame's register in the edit (rows, columns), found by matching his
# silhouette in the edit to his silhouette on the sheet.
BOXES = {0: (56, 66, 121, 156), 1: (55, 66, 121, 156), 2: (52, 62, 121, 160),
         3: (52, 62, 118, 165), 4: (53, 63, 136, 185), 5: (67, 73, 103, 140)}
REGISTER = {0: (1, 0), 1: (1, 0), 2: (1, 0), 3: (1, -1), 4: (1, -1), 5: (0, 0)}
# THE EDIT'S OWN MOUTH, MEASURED in each frame (its two rows, and its columns): the edit drew it two pixels deep at the
# sheet's size, and the room's snap (a block is 3.7 of the sheet's pixels) averaged it into the skin, so at game size he
# had only a faint line (Tyler, 2026-11-09: "he still needs a bit more of a mouth, no?"). Those rows are deepened --
# the edit's own pixels darkened, never a mouth drawn where it drew none -- so the line survives the snap.
MOUTH = {0: (61, 62, 120, 137), 1: (61, 62, 120, 140), 2: (60, 61, 125, 145),
         3: (58, 59, 126, 150), 4: (58, 59, 150, 168), 5: (75, 76, 106, 120)}
DEEPEN = 0.62
GROW = (4, 5)   # the band grown past the measured mustache, rows and columns
RAMP = 4        # and blended into his own pixels over this many more


def keyed(e):
    """The edit's magenta, and its fringe: anything well purpler than green, and one pixel round it."""
    r, g, b = e[..., 0], e[..., 1], e[..., 2]
    hard = (g < np.minimum(r, b) - 50)
    grown = hard.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        grown |= np.roll(np.roll(hard, dy, 0), dx, 1)
    return hard, grown


def shave(f, index, edit):
    """Vessel's frame `index` (RGBA) with only the mustache band taken from the edit: his own pixels everywhere else.
    The edit's colour is matched to his on a ring round the band, and the band's edge blends into his pixels."""
    x, y, w, h = DEKE['frames'][index]
    dy, dx = REGISTER[index]
    ox, oy = OFFSET
    e = edit[oy + y + dy:oy + y + dy + h, ox + x + dx:ox + x + dx + w].astype(float)
    hard, fringe = keyed(e)
    y0, y1, x0, x1 = BOXES[index]
    y0, y1, x0, x1 = y0 - GROW[0], y1 + GROW[0], x0 - GROW[1], x1 + GROW[1]
    ring = np.zeros((h, w), bool)
    ring[y0 - 10:y1 + 11, x0 - 10:x1 + 11] = True
    ring[y0:y1 + 1, x0:x1 + 1] = False
    both = ring & (f[..., 3] > 128) & ~fringe
    corr = f[..., :3][both].astype(float).mean(0) - e[both].mean(0)
    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.minimum.reduce([yy - y0 + RAMP, y1 + RAMP - yy, xx - x0 + RAMP, x1 + RAMP - xx]).astype(float)
    wgt = np.clip(dist / RAMP, 0, 1)
    wgt[fringe & (wgt < 1)] = 0          # never blend the edit's key fringe into his face
    core = wgt >= 1
    g = f.astype(float).copy()
    mix = f[..., :3] * (1 - wgt[..., None]) + np.clip(e + corr, 0, 255) * wgt[..., None]
    g[..., :3] = np.where((f[..., 3:4] > 128) | core[..., None], mix, f[..., :3])
    # Inside the band the edit decides what is figure: what was mustache past his profile is gone.
    g[..., 3] = np.where(core & hard, 0, np.where(core & ~fringe, 255, f[..., 3]))
    # A fringe pixel inside the band takes his own pixel back (or nothing, if he had none there).
    g[core & fringe & ~hard] = f[core & fringe & ~hard]
    m0, m1, mx0, mx1 = MOUTH[index]
    lips = g[m0:m1 + 1, mx0:mx1 + 1]
    lips[..., :3] = np.where(lips[..., 3:4] > 128, lips[..., :3] * DEEPEN, lips[..., :3])
    return g.astype(np.uint8), (int(y0), int(y1))


def main():
    import importlib.util
    spec = importlib.util.spec_from_file_location('people', os.path.join(ROOT, 'tools/art/interiors-people.py'))
    people = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(people)
    p = people.PEOPLE[(52, 'deacon')]
    man = people.man_at(p['curve'], p['feet'][1])
    target = round(man * p['stature'])
    src = np.array(Image.open(SHEET).convert('RGBA'))
    edit = np.array(Image.open(EDIT).convert('RGB'))
    frames, before, after, touched = [], [], [], []
    for index, (x, y, w, h) in enumerate(DEKE['frames']):
        f = src[y:y + h, x:x + w]
        shaved, band = shave(f, index, edit)
        touched.append(band)
        before.append(f)
        after.append(shaved)
    # One scale for every frame (the rest frame's figure height to the room's man), nearest, then one level.
    rows = np.nonzero(after[0][..., 3].max(1) > 128)[0]
    k = target / (rows[-1] - rows[0] + 1)
    out = []
    for f in after:
        im = Image.fromarray(f).resize((round(f.shape[1] * k), round(f.shape[0] * k)), Image.NEAREST)
        out.append(Image.fromarray(people.snap(np.asarray(im).copy(), man / 115.0)))
    w = max(o.width for o in out)
    h = max(o.height for o in out)
    sheet = Image.new('RGBA', (2 + len(out) * (w + 2), h + 4), (0, 0, 0, 0))
    rects = []
    for i, o in enumerate(out):
        x0 = 2 + i * (w + 2)
        sheet.alpha_composite(o, (x0 + (w - o.width) // 2, 2 + h - o.height))
        rects.append([x0, 2, w, h])
    sheet.save(os.path.join(ROOT, 'art/actors/room-52-deacon.png'))
    record = {'sheet': 'art/actors/room-52-deacon.png', 'frames': rects,
              'frameNames': ['rest', 'breath', 'talk', 'hat', 'look', 'down'],
              'figureHeight': target, 'stature': p['stature'], 'posture': p['posture'], 'man': round(man, 1),
              'feet': list(p['feet']), 'mustacheRows': touched,
              'source': f"{DEKE['sheet']} (Vessel's accepted figure, every frame), the mustache band only from "
                        'gulch-vessel operation 2 (art/staging/room-52/deacon-shave/source.png), by '
                        'tools/art/room52-deacon-from-deke.py',
              'note': "Room 52: the Deacon is Vessel's own frames, shaved, scaled to the room's man at his feet and snapped to one level."}
    os.makedirs(os.path.join(ROOT, 'art/staging/room-52/deacon'), exist_ok=True)
    json.dump(record, open(os.path.join(ROOT, 'art/staging/room-52/deacon/deacon.json'), 'w'), indent=1)
    # THE OVERLAY TYLER ASKED FOR: Vessel, the Deacon, and every pixel that differs, at Vessel's own size.
    fw, fh = before[0].shape[1], before[0].shape[0]
    grid = Image.new('RGB', (len(before) * (fw + 8), 3 * (fh + 8)), (255, 0, 255))
    for i, (b, a) in enumerate(zip(before, after)):
        x0 = i * (fw + 8)
        grid.paste(Image.fromarray(b).convert('RGBA'), (x0, 0), Image.fromarray(b))
        grid.paste(Image.fromarray(a).convert('RGBA'), (x0, fh + 8), Image.fromarray(a))
        diff = np.any(b != a, axis=2)
        shown = np.where(diff[..., None], np.array([255, 255, 0, 255], np.uint8), (b * [1, 1, 1, 0.35]).astype(np.uint8))
        shown[..., 3] = np.where(diff | (b[..., 3] > 128), 255, 0)
        dim = Image.fromarray(shown.astype(np.uint8))
        grid.paste(dim, (x0, 2 * (fh + 8)), dim)
    grid.save(os.path.join(ROOT, 'renders/room-52-deacon-vs-deke.png'))
    print(json.dumps({'frames': len(out), 'figureHeight': target, 'mustacheRows': touched}))


if __name__ == '__main__':
    main()
