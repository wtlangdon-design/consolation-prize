"""The Nugget's pianist, cut (reference/nugget-pianist/brief.md; errata 317, doc 133). No image operation.

nugget-pianist operation 1 drew Thad standing (the ruler: a standing man) and then four frames of the pianist on his
stool -- rest, play A, play B, the drink -- with the glass on the (not drawn) piano lid in 1-3 and in his hand in 4.
This:

  - finds each figure as its group of pieces (the glass floating where the lid is stays with its man:
    tools/art/final-look-cut.py's figures_of);
  - scales all four by ONE factor: the drawn Thad is a standing man, and a standing man at the stool's foot (y 525 in
    the Nugget) is the room's curve there, so his seated figure keeps the size the generator drew it against Thad;
  - registers frames 2-4 on frame 1 by the legs and the stool (the bottom of the figure, which does not move), and lays
    each into one cell, bottom-centred on the stool, the soles on the cell's bottom row;
  - despills and snaps to the one level (errata 112) at the room's man there.

Writes art/actors/room-03-pianist.png (frames [2 + i*(W+2), 2, W, H]) and renders/room-03-pianist-in-the-nugget.png
(each frame on the stool beside Thad by the piano), and prints the hand-back's numbers.
  python3 tools/art/nugget-pianist-cut.py [--write]
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
src = open(R('tools/art/final-look-cut.py')).read()
ns = {'__file__': R('tools/art/final-look-cut.py')}
saved, sys.argv = sys.argv, ['final-look-cut.py']
exec(src[:src.index('\ndef main(')], ns)
sys.argv = saved
alpha, rows_of, register, snap, figures_of, scaled, despill_edge, N = (ns[k] for k in (
    'alpha', 'rows_of', 'register', 'snap', 'figures_of', 'scaled', 'despill_edge', 'N'))
bt = {'__file__': R('tools/art/beside-thad.py')}
srcb = open(bt['__file__']).read(); exec(srcb[:srcb.index('def main')], bt)
ms = {'__file__': R('tools/art/cast-softer-measure.py')}
srcm = open(ms['__file__']).read(); exec(srcm[:srcm.index('def head(')], ms)

SHEET = 'art/staging/nugget-pianist/sheet.png'
OUT = 'art/actors/room-03-pianist.png'
STOOL = (675, 525)          # the stool's foot in the Nugget (the `piano_stool` obstacle, x 645-705, y 445-525)


def height(a):
    r = rows_of(a); return int(r[-1] - r[0] + 1)


def main(write):
    room = bt['load']('content/rooms/nugget.json')
    man = bt['curve_man'](room, *STOOL)
    figs = figures_of(R(SHEET), 5)
    thad_h = height(figs[0])
    k = man / thad_h
    poses = [scaled(f, k) for f in figs[1:]]
    # one cell: each pose registered on the first by the legs and stool
    offs = [(0, 0)] + [register(poses[0], p, 'legs') for p in poses[1:]]
    xs0 = min(dx for dx, dy in offs); xs1 = max(dx + p.shape[1] for (dx, dy), p in zip(offs, poses))
    ys0 = min(dy for dx, dy in offs); ys1 = max(dy + p.shape[0] for (dx, dy), p in zip(offs, poses))
    W, H = xs1 - xs0 + 4, ys1 - ys0 + 2
    block = man / N
    cells = []
    for (dx, dy), p in zip(offs, poses):
        c = np.zeros((H, W, 4), np.uint8)
        x, y = dx - xs0 + 2, dy - ys0
        c[y:y + p.shape[0], x:x + p.shape[1]][alpha(p)] = p[alpha(p)]
        c = despill_edge(snap(c, block) if block > 1.05 else c, width=max(2, int(np.ceil(block)) + 1))
        cells.append(c)
    sheet = np.zeros((H + 4, 2 + len(cells) * (W + 2), 4), np.uint8)
    rects = []
    for i, c in enumerate(cells):
        x = 2 + i * (W + 2); sheet[2:2 + H, x:x + W] = c; rects.append([x, 2, W, H])
    rest = cells[0]
    rr = rows_of(rest); cc = np.nonzero(alpha(rest)[rr[-1] - 3:rr[-1] + 1].any(0))[0]
    # the feet point: the bottom row, centred under the stool's foot (the stool is the widest thing at the bottom)
    feet = [int((cc[0] + cc[-1]) / 2), int(rr[-1])]
    changed = [round(float(np.mean(np.any(cells[i] != rest, axis=2)[alpha(rest) | alpha(cells[i])])), 3) for i in range(4)]
    thad = np.asarray(Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'))
    report = {'manAtStool': round(man, 1), 'scale': round(k, 4), 'block': round(block, 3), 'cell': [W, H], 'frames': rects,
              'feetInCell': feet, 'seatedHeight': height(rest), 'seatedOverMan': round(height(rest) / man, 3),
              'changedFromRest': changed,
              'texture': {'pianist': ms['texture'](rest), 'thadStandFront': ms['texture'](thad)},
              'contrast': {'pianist': round(float(ms['lum'](rest[..., :3])[alpha(rest)].std()), 1),
                           'thadStandFront': round(float(ms['lum'](thad[..., :3])[alpha(thad)].std()), 1)}}
    print(json.dumps(report, indent=1))
    if write:
        Image.fromarray(sheet).save(R(OUT))
        render(cells, feet, room, man)


def render(cells, feet, room, man):
    plate = Image.open(R(room['background'])).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    st = next(c for c in thad['clips'] if c['id'] == 'stand' and c['facing'] == 'left' and not c.get('state'))
    tx, ty = 820, 600
    t = Image.open(R(st['frames'][0])).convert('RGBA')
    t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
    kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
    ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
    panels = []
    for c in cells:
        im = plate.copy()
        f = bt['lit'](Image.fromarray(c), bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), *STOOL))
        im.alpha_composite(f, (STOOL[0] - feet[0], STOOL[1] - feet[1]))
        im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
        panels.append(im.crop((420, 220, 1020, 680)).convert('RGB'))
    out = Image.new('RGB', (600 * 2 + 8, 460 * 2 + 8), (0, 0, 0))
    for i, p in enumerate(panels):
        out.paste(p, ((i % 2) * 608, (i // 2) * 468))
    out.save(R('renders/room-03-pianist-in-the-nugget.png'))


if __name__ == '__main__':
    main('--write' in sys.argv)
