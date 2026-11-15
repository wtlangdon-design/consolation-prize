"""The Mercantile's storekeeper, cut (reference/mercantile-keeper/brief.md; errata 335). No image operation.

mercantile-keeper drew, on magenta, four full-length frames of the storekeeper (operation 1 with Thad, the ruler, at
the left): rest (hands on the counter), rest B (tapping), writing, the lean. NOTHING IS REGRADED (the brief: never fix
the numbers in the cut): the tool scales, keys, places and snaps to the one level; every colour is the operation's.

  - one scale for all four: his rest frame, crown to sole, is 390 px (the brief: a standing man about one
    counter-depth behind the counter, a little smaller than Thad's 433 at the counter);
  - all four cut at one sheet row, CUT: the foot of his hands resting on the counter in the rest frame. That row is put
    on the counter top's back edge, y 510 (the brief's anchor); the counter hides the rest;
  - each centred in one cell on its torso (15-45% down), the cut row on the cell's bottom row; despilled at the
    outline; snapped to the one level (errata 112) at a man of 390.

Reports the frame rects, the anchor, his crown against Thad's at the counter and the tonic's shelf (y 265), any
overlap with THE CREDIT LEDGER and THE PICKLE JAR, and texture, contrast and mean luminance beside Thad and the barman.
Writes art/actors/room-12-storekeeper.png and renders/room-12-storekeeper-with-thad.png.
  python3 tools/art/mercantile-keeper-cut.py [--op N] [--write]
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
alpha, rows_of, snap, scaled, despill_edge, opaque_rgb, N = (ns[k] for k in (
    'alpha', 'rows_of', 'snap', 'scaled', 'despill_edge', 'opaque_rgb', 'N'))
bt = {'__file__': R('tools/art/beside-thad.py')}
srcb = open(bt['__file__']).read(); exec(srcb[:srcb.index('def main')], bt)
ms = {'__file__': R('tools/art/cast-softer-measure.py')}
srcm = open(ms['__file__']).read(); exec(srcm[:srcm.index('def head(')], ms)

# Per operation: the sheet and how many figures stand left of his four (operation 1 kept Thad, the ruler).
OPS = {1: {'sheet': 'art/staging/mercantile-keeper/op-1/sheet.png', 'before': 1},
       2: {'sheet': 'art/staging/mercantile-keeper/op-2/sheet.png', 'before': None}}   # None: found by count
OP = int(sys.argv[sys.argv.index('--op') + 1]) if '--op' in sys.argv else 2
SHEET = OPS[OP]['sheet']
OUT = 'art/actors/room-12-storekeeper.png'
MAN = 390.0                 # the brief: about 390 px crown to hidden feet
ANCHOR = (1660, 510)        # the counter top's back edge under him
THAD_AT = (1480, 740)       # where Thad talks to him from, facing right
LEDGER, JAR = (1420, 420, 200, 110), (1755, 370, 120, 195)     # content/rooms/mercantile.json hotspots
TONIC_SHELF = 265


def columns(op):
    busy = op.any(0); runs, s = [], None
    for x, on in enumerate(busy):
        if on and s is None: s = x
        if not on and s is not None:
            if x - s > 30: runs.append((s, x))
            s = None
    return runs


def hands_foot(a, op, x0, x1):
    """The lowest row of his hands (skin: red well over blue) in the lower-middle of the figure."""
    rows = np.nonzero(op[:, x0:x1].any(1))[0]; top, bot = rows[0], rows[-1]
    sub = a[:, x0:x1]
    skin = ((sub[..., 0] - sub[..., 2]) > 110) & (sub[..., 0] > 150) & op[:, x0:x1]
    lo, hi = top + int(.35 * (bot - top)), top + int(.6 * (bot - top))
    ys = np.nonzero(skin[lo:hi].sum(1) >= 3)[0]
    return lo + ys[-1]


def main(write):
    room = bt['load']('content/rooms/mercantile.json')
    a = np.asarray(Image.open(R(SHEET)).convert('RGB')).astype(int)
    op = opaque_rgb(a)
    runs = columns(op)
    runs = runs[-4:]
    assert len(runs) == 4, runs
    rest = runs[0]
    rr = np.nonzero(op[:, rest[0]:rest[1]].any(1))[0]
    k = MAN / (rr[-1] - rr[0] + 1)
    CUT = hands_foot(a, op, *rest) + 1
    crops = []
    for x0, x1 in runs:
        rows = np.nonzero(op[:, x0:x1].any(1))[0]; y0 = rows[0]
        rgba = np.zeros((CUT - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = a[y0:CUT, x0:x1]; rgba[..., 3] = np.where(op[y0:CUT, x0:x1], 255, 0)
        crops.append((y0, scaled(rgba, k)))
    top = min(y0 for y0, _ in crops)
    H = round((CUT - top) * k)
    def torso_x(f):
        m = alpha(f); r = np.nonzero(m.any(1))[0]; hh = r[-1] - r[0] + 1
        c = np.nonzero(m[r[0] + int(.15 * hh):r[0] + int(.45 * hh)].any(0))[0]; return (c[0] + c[-1]) / 2
    half = int(np.ceil(max(max(torso_x(f), f.shape[1] - torso_x(f)) for _, f in crops))) + 2
    W = 2 * half
    block = MAN / N
    cells = []
    for y0, f in crops:
        c = np.zeros((H, W, 4), np.uint8)
        ox = int(round(half - torso_x(f))); oy = H - f.shape[0]
        c[oy:oy + f.shape[0], ox:ox + f.shape[1]][alpha(f)] = f[alpha(f)]
        cells.append(despill_edge(snap(c, block) if block > 1.05 else c, width=max(2, int(np.ceil(block)) + 1)))
    sheet = np.zeros((H + 4, 2 + 4 * (W + 2), 4), np.uint8); rects = []
    for i, c in enumerate(cells):
        x = 2 + i * (W + 2); sheet[2:2 + H, x:x + W] = c; rects.append([x, 2, W, H])

    # where he falls in the room
    ox, oy = ANCHOR[0] - W // 2, ANCHOR[1] - H + 1
    def overlap(c, rect):
        rx, ry, rw, rh = rect; m = alpha(c)
        ys, xs = np.nonzero(m); X, Y = xs + ox, ys + oy
        return int(((X >= rx) & (X < rx + rw) & (Y >= ry) & (Y < ry + rh)).sum())
    crowns = [int(oy + rows_of(c)[0]) for c in cells]
    thad_man = bt['curve_man'](room, *THAD_AT)

    thad = np.asarray(Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'))
    thad = np.asarray(Image.fromarray(thad).crop(Image.fromarray(thad).getbbox()))
    th = np.asarray(Image.fromarray(thad).resize((round(thad.shape[1] * MAN / thad.shape[0]), round(MAN)), Image.BOX))
    brec = json.load(open(R('content/ambient/nugget-barman.json')))
    bx, by, bw, bh = brec['sprite']['frames'][0]
    barman = np.asarray(Image.open(R(brec['sprite']['sheet'])).convert('RGBA'))[by:by + bh, bx:bx + bw]
    r0 = cells[0]
    who = (('storekeeper', r0), ('thadAtThisMan', th), ('barman', barman))
    report = {'op': OP, 'scale': round(k, 4), 'block': round(block, 3), 'cutSheetRow': int(CUT), 'cell': [W, H],
              'frames': rects, 'anchor': {'inCell': [W // 2, H - 1], 'room': list(ANCHOR)},
              'restHeight': MAN, 'bandHeight': int(H - rows_of(r0)[0]),
              'crownInRoom': crowns, 'thadCrownAtCounter': round(THAD_AT[1] - thad_man), 'thadManAtCounter': round(thad_man, 1),
              'feetInRoomAtHisHeight': round(crowns[0] + MAN),
              'overlap': {'ledger': [overlap(c, LEDGER) for c in cells], 'jar': [overlap(c, JAR) for c in cells]},
              'crownBelowTonicShelf': all(c >= TONIC_SHELF for c in crowns),
              'changedFromRest': [round(float(np.mean(np.any(c != r0, axis=2)[alpha(r0) | alpha(c)])), 3) for c in cells],
              'texture': {n: ms['texture'](x) for n, x in who},
              'contrast': {n: round(float(ms['lum'](x[..., :3])[alpha(x)].std()), 1) for n, x in who},
              'meanLuminance': {n: round(float(ms['lum'](x[..., :3])[alpha(x)].mean()), 1) for n, x in who}}
    print(json.dumps(report, indent=1))
    if write:
        Image.fromarray(sheet).save(R(OUT))
        render(cells, room, W, H)


def render(cells, room, W, H):
    plate = Image.open(R(room['background'])).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'right' and not cl.get('state'))
    t = Image.open(R(st['frames'][0])).convert('RGBA')
    t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), *THAD_AT))
    kt = bt['curve_man'](room, *THAD_AT) / st['figureHeight']
    ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
    panels = []
    for c in cells:
        im = plate.copy()
        f = bt['lit'](Image.fromarray(c), bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), *ANCHOR))
        im.alpha_composite(f, (ANCHOR[0] - W // 2, ANCHOR[1] - H + 1))
        im.alpha_composite(ts, (round(THAD_AT[0] - st['anchor'][0] * kt), round(THAD_AT[1] - st['anchor'][1] * kt)))
        panels.append(im.crop((1240, 160, 1920, 800)).convert('RGB'))
    pw, ph = panels[0].size
    out = Image.new('RGB', (pw * 2 + 8, ph * 2 + 8), (0, 0, 0))
    for i, p in enumerate(panels):
        out.paste(p, ((i % 2) * (pw + 8), (i // 2) * (ph + 8)))
    out.save(R('renders/room-12-storekeeper-with-thad.png'))


if __name__ == '__main__':
    main('--write' in sys.argv)
