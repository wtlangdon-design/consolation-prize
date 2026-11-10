"""Objects, second pass: the two patches (reference/objects-second-pass/brief.md sections 2 and 3; doc 121 N-1, N-2).

Each was an edit of the plate itself, cropped and drawn at 2x (objects-second-pass operations 2 and 3, a marked
layout beside it, as act1-dinner operation 3 was done). This takes the operation's pixels back to the plate's grid and
keeps them only where they differ from the plate, inside the box the brief names, as tools/art/room14-props.py does:

  THE DRAWER, SHUT    room 11, the sideboard's lower right drawer (brief: about x 1470-1600, y 535-620)
                      -> art/props/room-11-drawer-shut.png
  THE ENVELOPE        room 14, on Mr. Pike's headboard -> art/props/room-14-pike-envelope.png

Each patch is cut to its own box; its record (the renderer draws from x - floor(w / 2), y - h + 1) is printed, and
asserted to change nothing outside its box. Writes renders/objects-second-pass-patches.png (each plate before and
after, at 3x round the patch). No image operation here.

Usage: objects-second-pass-patches.py [--write]
"""
import json, os, sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WRITE = '--write' in sys.argv
THR = 40

PATCHES = {
    'drawer_shut': {'plate': 'art/backgrounds/room-11-fanshawe-office.png', 'crop': (1150, 330),
                    'op': 'art/staging/objects-second-pass/op-2/sheet.png', 'box': (1446, 500, 1612, 642),
                    'out': 'art/props/room-11-drawer-shut.png'},
}
ENVELOPE = os.path.join(ROOT, 'art/staging/objects-second-pass/op-3/sheet.png')
if os.path.exists(ENVELOPE):
    PATCHES['pike_envelope'] = json.load(open(os.path.join(ROOT, 'art/staging/objects-second-pass/op-3/geometry.json')))


def cut(spec):
    plate = np.asarray(Image.open(os.path.join(ROOT, spec['plate'])).convert('RGB')).astype(int)
    X0, Y0 = spec['crop']
    op = Image.open(os.path.join(ROOT, spec['op'])).convert('RGB').resize((768, 512), Image.BOX)
    op = np.asarray(op).astype(int)
    x0, y0, x1, y1 = spec['box']
    state = plate.copy()
    state[Y0:Y0 + 512, X0:X0 + 768] = op[:min(512, plate.shape[0] - Y0), :min(768, plate.shape[1] - X0)]
    m = np.zeros(plate.shape[:2], bool)
    m[y0:y1, x0:x1] = np.abs(state - plate).sum(2)[y0:y1, x0:x1] > THR
    # One solid shape, not a per-pixel scatter: closed, its holes filled, its largest piece kept, so a new drawer's
    # face is all new pixels and not old ones wherever the two happen to agree.
    inside = np.zeros_like(m); inside[y0:y1, x0:x1] = True
    m = ndi.binary_closing(m, iterations=6) & inside
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m)
    if n > 1:
        m = lab == 1 + int(np.argmax(ndi.sum(np.ones_like(lab), lab, range(1, n + 1))))
    m = ndi.binary_dilation(m, iterations=1) & inside
    ys, xs = np.nonzero(m)
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.zeros((by1 - by0, bx1 - bx0, 4), np.uint8)
    rgba[..., :3] = state[by0:by1, bx0:bx1]
    rgba[..., 3] = np.where(m[by0:by1, bx0:bx1], 255, 0)
    after = plate.copy(); after[m] = state[m]
    assert not (after != plate).any(2)[~inside].any(), 'nothing outside the box may change'
    h, w = rgba.shape[:2]
    rec = {'sheet': spec['out'], 'x': int(bx0) + w // 2, 'y': int(by0) + h - 1, 'frame': [0, 0, int(w), int(h)],
           'changed': int(m.sum())}
    return rgba, plate, after, (bx0, by0, bx1, by1), rec


def main():
    out, panels = {}, []
    for key, spec in PATCHES.items():
        rgba, plate, after, (bx0, by0, bx1, by1), rec = cut(spec)
        out[key] = rec
        if WRITE:
            Image.fromarray(rgba).save(os.path.join(ROOT, spec['out']))
        pad = 60
        win = (max(0, bx0 - pad), max(0, by0 - pad), min(plate.shape[1], bx1 + pad), min(plate.shape[0], by1 + pad))
        a = Image.fromarray(plate.astype(np.uint8)).crop(win)
        b = Image.fromarray(after.astype(np.uint8)).crop(win)
        pair = Image.new('RGB', (a.width * 2 + 8, a.height), (0, 0, 0))
        pair.paste(a, (0, 0)); pair.paste(b, (a.width + 8, 0))
        panels.append(pair.resize((pair.width * 3, pair.height * 3), Image.NEAREST))
    if WRITE:
        W = max(p.width for p in panels); H = sum(p.height for p in panels) + 16 * (len(panels) - 1)
        sheet = Image.new('RGB', (W, H), (0, 0, 0)); y = 0
        for p in panels:
            sheet.paste(p, (0, y)); y += p.height + 16
        sheet.save(os.path.join(ROOT, 'renders/objects-second-pass-patches.png'))
    print(json.dumps(out))


main()
