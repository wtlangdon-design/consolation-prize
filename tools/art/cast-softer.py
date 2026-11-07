"""The undertaker and Madame Ozymandia, softer (reference/cast-softer/brief.md): cast-unify
operation 61's sheet (art/staging/cast-unify/batch-31/sheet.png) cut into their sheets, as
their current sheets were cut (errata 111 J and K):

  1. tools/art/cast-unify-cut.py --grid 1: the row keyed, its own pixels, a clean edge, and a
     derived breath after the rest pose -- 0 rest, 1 breath, 2-4 the other three poses.
  2. Every frame registered on the waist: its lowest row, and that row's middle, on the rest frame's
     (`register` below), so the figure does not swing or rise between poses.
  3. At the size of the drawing it replaces: the row is re-cut so the rest frame's bust (crown to
     waist) is as tall as the current sheet's -- he stays the size his bench and her table were
     staged for.
  4. The undertaker's waist matted along the bench's slanted back edge (tools/art/waist-matte.py),
     y 494 at x 1430 to y 516 at x 1650; Ozymandia's waist is a flat line on her table's back edge,
     and the ball stands in front of her on her room's plane 1, as before.
  5. One level (tools/art/one-level.py --only), 115 art pixels a man.

Writes art/actors/room-13-undertaker-master.png and art/actors/room-16-ozymandia.png and their
frames, and prints what to put in the ambient records (frames, and the undertaker's y).

Usage: cast-softer.py [--write-records]
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/cast-unify/batch-31/sheet.png')
WHO = {
    'undertaker': {'row': 0, 'out': 'art/actors/room-13-undertaker-master.png', 'record': 'content/ambient/undertaker.json',
                   'plate': 'art/backgrounds/room-13-undertakers.png', 'guide': '1430:494,1650:516'},
    'ozymandia': {'row': 1, 'out': 'art/actors/room-16-ozymandia.png', 'record': 'content/ambient/ozymandia.json'},
}
PROBE = 260          # a first cut near game size, to find the height that matches the old rest frame
py = lambda *a: subprocess.check_output([sys.executable, *a], cwd=ROOT).decode()


def rest_height(sheet, frames):
    x, y, w, h = frames[0]
    a = np.asarray(Image.open(sheet).convert('RGBA'))[y:y + h, x:x + w, 3] > 128
    return int(a.any(1).sum())


def register(src, frames, dest):
    """Every frame put on the rest frame's WAIST: its lowest row on the rest frame's, and the middle of
    that row on the rest frame's. Behind a bench or a table the waist is the fixed thing. (bust-register.py
    registers on the head, the largest piece in the top quarter -- here a raised hand is, and it slid
    Ozymandia sideways by half her width.)"""
    sheet = np.asarray(Image.open(src).convert('RGBA'))
    cells = [sheet[y:y + h, x:x + w].copy() for x, y, w, h in frames]
    def waist(cell):
        a = cell[..., 3] > 128
        bottom = int(np.nonzero(a.any(1))[0].max())
        cols = np.nonzero(a[max(0, bottom - 2):bottom + 1].any(0))[0]
        return bottom, (cols.min() + cols.max()) / 2
    rb, rx = waist(cells[0])
    H, W = cells[0].shape[:2]; pad = W // 2
    outs = []
    for cell in cells:
        b, x = waist(cell)
        dx, dy = int(round(rx - x)), rb - b
        canvas = np.zeros((H, W + 2 * pad, 4), np.uint8)
        moved = np.zeros_like(cell)
        if dy >= 0: moved[dy:] = cell[:H - dy]
        else: moved[:H + dy] = cell[-dy:]
        canvas[:, pad + dx:pad + dx + W] = moved
        outs.append(canvas)
    alpha = np.any([c[..., 3] > 0 for c in outs], axis=0)
    cols = np.nonzero(alpha.any(0))[0]; x0, x1 = cols.min(), cols.max() + 1
    rows = np.nonzero(alpha.any(1))[0]; y0, y1 = rows.min(), rows.max() + 1
    outs = [c[y0:y1, x0:x1] for c in outs]
    w, h = x1 - x0, y1 - y0
    result = np.zeros((h + 4, len(outs) * (w + 2) + 2, 4), np.uint8)
    rects = []
    for i, c in enumerate(outs):
        x = 2 + i * (w + 2)
        result[2:2 + h, x:x + w] = c
        rects.append([int(x), 2, int(w), int(h)])
    Image.fromarray(result).save(dest)
    return {'frames': rects}


def cut(row, height, tmp):
    raw = os.path.join(tmp, f'raw-{row}-{height}.png')
    frames = json.loads(py('tools/art/cast-unify-cut.py', SHEET, str(row), str(height), raw, '--grid', '1'))
    reg = os.path.join(tmp, f'reg-{row}-{height}.png')
    return reg, register(raw, frames['frames'], reg)


out = {}
with tempfile.TemporaryDirectory() as tmp:
    for who, spec in WHO.items():
        record = json.load(open(os.path.join(ROOT, spec['record'])))
        s = record['sprite']
        target = rest_height(os.path.join(ROOT, s['sheet']), s['frames'])
        probe, pf = cut(spec['row'], PROBE, tmp)
        height = int(round(PROBE * target / rest_height(probe, pf['frames'])))
        sheet, frames = cut(spec['row'], height, tmp)
        got = rest_height(sheet, frames['frames'])
        if got != target:        # the cutter's rounding: one more pass at the corrected height
            height = int(round(height * target / got))
            sheet, frames = cut(spec['row'], height, tmp)
        dest = os.path.join(ROOT, spec['out'])
        info = {'frames': frames['frames'], 'restHeight': rest_height(sheet, frames['frames']), 'cutHeight': height}
        if 'guide' in spec:
            fj = os.path.join(tmp, f'{who}-frames.json'); json.dump(frames, open(fj, 'w'))
            matted = json.loads(py('tools/art/waist-matte.py', sheet, fj, os.path.join(ROOT, spec['plate']),
                                   str(record['x']), spec['guide'], dest).strip().splitlines()[-1])
            info['y'] = matted['y']; info['matte'] = matted
        else:
            Image.open(sheet).save(dest)
        out[who] = info
# THE RECORDS FIRST, THEN THE SNAP: one-level.py takes each frame's box from the record, and snapping the
# new sheet with the old boxes drew an old box's edge through Ozymandia's face.
if '--write-records' in sys.argv:
    for who, spec in WHO.items():
        p = os.path.join(ROOT, spec['record']); text = open(p).read(); rec = json.loads(text)
        rec['sprite']['frames'] = out[who]['frames']
        if 'y' in out[who]: rec['y'] = out[who]['y']
        indent = 1 if text.startswith('{\n "') else 2
        open(p, 'w').write(json.dumps(rec, indent=indent, ensure_ascii=False) + '\n')
for spec in WHO.values():
    subprocess.check_call([sys.executable, 'tools/art/one-level.py', '--only', os.path.basename(spec['out'])], cwd=ROOT,
                          stdout=subprocess.DEVNULL)
print(json.dumps(out, indent=1))
