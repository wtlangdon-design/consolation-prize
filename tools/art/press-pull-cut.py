"""The press, pulled: the three sheets, cut (reference/press-pull/brief.md; errata 249, doc 118 O-2).

press-pull operations 1-3 (art/staging/press-pull/op-N/sheet.png), each drawn on a template of the figure's own
shipping rest frame (errata 144's method; the template's first figure is the ruler and is not shipped):

  1  FRAME, WALKING LEFT -> art/actors/room-09-frame-walk.png
     From operation 4 (reference/press-walk-six/brief.md: a walk is six frames, tests/walk-gait.test.mjs), drawn on
     Thad's own six-frame walk to the left as the pose guide, as WALK-C posed Deke's: contact, down, passing,
     contact on the other foot, down, passing; in profile facing left (from the press at x 1379 to his back
     editions, ~450 px left). Operation 1's four frames, the first cut, are superseded. All six are scaled by one
     factor so the tallest is his standing height. Each frame's soles on his rest frame's sole row; each centred on
     its TORSO (15-45% down the figure, the method of tools/art/walk-c.py), so the body travels steadily and the legs
     do the walking. Cells 502 tall and as wide as the widest stride needs about the torso (the brief's 269 does not hold it),
     bottom-centred.
  2  FRAME, STOOD BACK, ARMS FOLDED -> art/actors/room-09-frame-stood-back.png
     Three-quarter turned to the right, toward the press, arms folded, weight back. Frames: 0 rest · 1 breath
     (derived, as every ambient breath is). On his 201 x 502 cell, registered on his legs.
  3  THAD HAULING THE BAR -> art/actors/thad-haul-right.png
     As thad-plate-front was cut (tools/art/act2-papers-cut.py): on his idle-right canvas (663 x 691) and scale
     (626 px), registered on his feet. Frames side by side, frame i at x = 663 i: 0 hands on the bar · 1 weight going
     back · 2 the bar home. A strip, as thad-plate-front was handed over: declaring a clip directory touches content/.

Every frame is despilled (the key's red-and-blue-over-green) and refused if any is left; snapped to one level.
Usage: press-pull-cut.py [--write]
"""
import json, os, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WRITE = '--write' in sys.argv
src = open(os.path.join(ROOT, 'tools/art/act2-papers-cut.py')).read()
src = src[src.index('import json'):src.index('\nreport = {}')]      # its helpers, not its run
ns = {'__file__': os.path.join(ROOT, 'tools/art/act2-papers-cut.py')}
saved_argv, sys.argv = sys.argv, ['act2-papers-cut.py']
exec(src, ns)
sys.argv = saved_argv
cut_row, place, grow_and_paste, register, snap, alpha, rows_of, read, N = (ns[k] for k in (
    'cut_row', 'place', 'grow_and_paste', 'register', 'snap', 'alpha', 'rows_of', 'read', 'N'))
despill, spill_left, breath_of, finish, strip, cut_sheet, on_shipping_canvas = (ns[k] for k in (
    'despill', 'spill_left', 'breath_of', 'finish', 'strip', 'cut_sheet', 'on_shipping_canvas'))
STAGE = lambda n: os.path.join(ROOT, f'art/staging/press-pull/op-{n}/sheet.png')


WALK_CELL = 269


def torso_centre(f, band=(0.15, 0.45)):
    """The column centre of the figure's torso (15-45% down it), as tools/art/walk-c.py seats a walk."""
    m = alpha(f); r = np.nonzero(m.any(1))[0]; hh = r[-1] - r[0] + 1
    part = m[r[0] + int(hh * band[0]):r[0] + int(hh * band[1])]
    c = np.nonzero(part.any(0))[0]
    return (c[0] + c[-1]) / 2


report = {}
with tempfile.TemporaryDirectory() as tmp:
    Fr = read('content/ambient/frame.json')['sprite']
    box = Fr['frames'][0]
    x, y, w, h = box
    fsheet = np.asarray(Image.open(os.path.join(ROOT, Fr['sheet'])).convert('RGBA'))
    frest = fsheet[y:y + h, x:x + w].copy()
    rr = rows_of(frest); target = int(rr[-1] - rr[0] + 1); sole = int(rr[-1])
    block = target / N

    # ---- 1 · the walk ------------------------------------------------------------------------------------------
    figs1, _, _ = cut_sheet(STAGE(4), target, tmp, 'press-walk')
    walk = figs1[1:7]
    assert len(walk) == 6, len(figs1)
    # One factor for all six, so his tallest (passing) frame is his standing height and the others keep their dip.
    tall = max(int(rows_of(f)[-1] - rows_of(f)[0] + 1) for f in walk)
    grow = target / tall
    walk = [np.asarray(Image.fromarray(f).resize((round(f.shape[1] * grow), round(f.shape[0] * grow)), Image.NEAREST)).copy()
            for f in walk]
    cxs = [torso_centre(f) for f in walk]
    half = int(np.ceil(max(max(c, f.shape[1] - c) for f, c in zip(walk, cxs))))
    # The brief's cell is 269 (operation 1's cut); operation 4's stride, seated on the torso, needs more. The cell is
    # widened to hold it, evenly at both sides (the engine draws bottom-centred, so the width does not move him).
    W1 = max(WALK_CELL, 2 * half + 2)
    W1 += (W1 - WALK_CELL) % 2
    frames1 = []
    for f, c in zip(walk, cxs):
        canvas = np.zeros((h, W1, 4), np.uint8)
        fr = rows_of(f); ox = int(round(W1 / 2 - c)); oy = sole - int(fr[-1])
        ys = slice(max(0, oy), oy + f.shape[0]); sub = f[ys.start - oy:]
        region = canvas[ys, ox:ox + f.shape[1]]
        keep = alpha(sub)[:region.shape[0], :region.shape[1]]
        region[keep] = sub[:region.shape[0], :region.shape[1]][keep]
        frames1.append(canvas)
    out1, rects1 = strip(finish(frames1, block))
    report['walk'] = {'grown': round(grow, 4), 'cell': [W1, h], 'frames': rects1,
                      'heights': [int(rows_of(f)[-1] - rows_of(f)[0] + 1) for f in frames1],
                      'soles': [int(rows_of(f)[-1]) for f in frames1], 'ofRest': target}

    # ---- 2 · stood back, arms folded ---------------------------------------------------------------------------
    figs2, _, _ = cut_sheet(STAGE(2), target, tmp, 'press-stood')
    poses2 = on_shipping_canvas(frest, box, figs2, [1])
    out2, rects2 = strip(finish([poses2[0], breath_of(poses2[0])], block))
    report['stoodBack'] = {'frames': rects2, 'height': int(rows_of(poses2[0])[-1] - rows_of(poses2[0])[0] + 1),
                           'sole': int(rows_of(poses2[0])[-1])}

    # ---- 3 · Thad hauling the bar, on his idle-right canvas ----------------------------------------------------
    stand = np.asarray(Image.open(os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')).convert('RGBA')).copy()
    rig = read('art/actors/thad-idle-right/rig.json'); fw_, fh_ = rig['figure']
    t3 = int(rows_of(stand)[-1] - rows_of(stand)[0] + 1)
    m = alpha(stand); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    shipped = stand[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    figs3, _, _ = cut_sheet(STAGE(3), t3, tmp, 'press-thad')
    clip = []
    for i in (1, 2, 3):
        gx, gy = register(shipped, figs3[0], 'feet'); px, py_ = register(figs3[0], figs3[i], 'feet')
        ox, oy = c[0] + gx + px, r[0] + gy + py_
        canvas = np.zeros_like(stand); pose = figs3[i]
        ys = slice(max(0, oy), min(canvas.shape[0], oy + pose.shape[0]))
        xs = slice(max(0, ox), min(canvas.shape[1], ox + pose.shape[1]))
        sub = pose[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
        assert sub.shape[1] == pose.shape[1] and sub.shape[0] == pose.shape[0], 'the pose leaves the canvas'
        keep = alpha(sub); canvas[ys, xs][keep] = sub[keep]
        clip.append(canvas)
    clip = finish(clip, fh_ / N)
    W3 = stand.shape[1]; out3 = np.zeros((stand.shape[0], len(clip) * W3, 4), np.uint8)
    for i, f in enumerate(clip): out3[:, i * W3:(i + 1) * W3] = f
    report['thadHaul'] = {'canvas': list(stand.shape[1::-1]), 'frames': len(clip),
                          'soles': [int(rows_of(f)[-1]) for f in clip],
                          'heights': [int(rows_of(f)[-1] - rows_of(f)[0] + 1) for f in clip],
                          'restSole': int(rows_of(stand)[-1]), 'restHeight': t3}

print(json.dumps(report))
if WRITE:
    Image.fromarray(out1).save(os.path.join(ROOT, 'art/actors/room-09-frame-walk.png'))
    Image.fromarray(out2).save(os.path.join(ROOT, 'art/actors/room-09-frame-stood-back.png'))
    Image.fromarray(out3).save(os.path.join(ROOT, 'art/actors/thad-haul-right.png'))
