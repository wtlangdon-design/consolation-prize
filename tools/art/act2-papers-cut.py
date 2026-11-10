"""Act II's three papers: the four pictures, cut (reference/act2-papers/brief.md; doc 115 rows II-5 and II-1).

act2-papers operations 1-5 (art/staging/act2-papers/op-N/sheet.png), each drawn on a template of the figure's own
shipping rest frame (errata 144's method; the template's first figure is the ruler and is not shipped):

  1  FANSHAWE IN HIS DOORWAY, BEHIND THE WREATH -> art/actors/room-02-fanshawe-wreath.png
     From operation 5, the correction of operation 1 (the ribbon reads SINCERELY as doc 115's LOOK says, not "IN
     LOVING MEMORY"; his coat fills the wreath's hole; the lilies drawn flat, as Thad is). Operation 5 drew him
     with the wreath's bottom at row 686 and nothing below it, where the ruler's feet are at 766: his own lower legs
     and boots, from the ruler (the same man in the same drawing), are put under the wreath where it leaves them
     showing, centred on the ring. Every frame is anchored on the wreath's ring, so the wreath does not move and
     the wreath alone lands where the wreath was. Frames: 0 pushing politely from inside · 1 breath (derived) ·
     2 a harder push, hat askew · 3 the wreath alone.
  2  FANSHAWE ON BOOT HILL, HAT IN HAND -> art/actors/room-14-fanshawe-hat-in-hand.png
     His Main Street standing rest frame, mirrored to face left, was the template. Frames: 0 the hat held at his
     chest in both gloved hands · 1 breath (derived) · 2 the watch out, the hat under his arm. On the mirrored
     shipping frame's canvas (271 x 400), registered on his legs.
  3  THE REVEREND WITH THE PLATE -> art/actors/room-14-sowerby-plate.png
     Frames: 0 the plate in both hands · 1 breath (derived) · 2 one hand reaching out, the plate away down the line
     · 3 gripping the plate held out at arm's length, as against a pull. On his shipping frame's canvas (182 x 314,
     the sheet sowerby-gate uses), registered on his legs. He reaches to his left: the line stands there (the
     procession mourners at x 335, he at 480).
  4  THAD HOLDING THE PLATE -> art/actors/thad-plate-front.png
     As the coat-bundle clip was cut (tools/art/act3-coat-cut.py): on his stand-front canvas (709 x 691) and scale
     (626 px), registered on his feet. Frames side by side, frame i at x = 709 i: 0 holding it at his waist, his hat
     under his arm · 1 breath (derived) · 2 the pull, arms drawn back, weight on his heels. A strip, as coat-bundle
     was handed over: declaring a clip directory touches content/ (tools/art/thad-coat-bundle-split.py splits one).

Every frame is despilled (the key's red-and-blue-over-green) and refused if any is left; snapped to one level.
Usage: act2-papers-cut.py [--write]
"""
import json, os, sys, tempfile
import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WRITE = '--write' in sys.argv
src = open(os.path.join(ROOT, 'tools/art/acted-poses.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/acted-poses.py')}
saved_argv, sys.argv = sys.argv, ['acted-poses.py']
exec(src[src.index('import json'):src.index('report = {}')], ns)
sys.argv = saved_argv
cut_row, place, grow_and_paste, register, snap, alpha, rows_of, read, N = (ns[k] for k in (
    'cut_row', 'place', 'grow_and_paste', 'register', 'snap', 'alpha', 'rows', 'read', 'N'))
STAGE = lambda n: os.path.join(ROOT, f'art/staging/act2-papers/op-{n}/sheet.png')


def opaque_rgb(a):
    return np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2) >= 120


def despill(a, tolerance=6):
    a = a.copy(); c = a[..., :3].astype(int)
    ex = np.minimum(c[..., 0], c[..., 2]) - c[..., 1]
    hit = (a[..., 3] > 0) & (ex > tolerance)
    c[..., 0] -= np.where(hit, ex, 0); c[..., 2] -= np.where(hit, ex, 0)
    a[..., :3] = np.clip(c, 0, 255).astype(np.uint8)
    return a


def spill_left(a, tolerance=6):
    c = a[..., :3].astype(int)
    return int(((a[..., 3] > 0) & (np.minimum(c[..., 0], c[..., 2]) - c[..., 1] > tolerance)).sum())


def breath_of(rest):
    rr = rows_of(rest); mid = rr[0] + (rr[-1] - rr[0]) * 55 // 100          # cast-unify-cut's waist line
    b = rest.copy(); b[:mid - 1] = rest[1:mid]; b[mid - 1] = rest[mid]; return b


def finish(frames, block):
    out = [despill(snap(f, block) if block > 1.05 else f) for f in frames]
    assert all(spill_left(f) == 0 for f in out), 'magenta survives the despill'
    return out


def strip(frames):
    """Frames of one size side by side, 2 px apart, as every ambient sheet is laid out."""
    fh = max(f.shape[0] for f in frames); fw = max(f.shape[1] for f in frames)
    out = np.zeros((fh + 4, len(frames) * (fw + 2) + 2, 4), np.uint8); rects = []
    for i, f in enumerate(frames):
        x = 2 + i * (fw + 2); out[2 + fh - f.shape[0]:2 + fh, x:x + f.shape[1]] = f; rects.append([x, 2, fw, fh])
    return out, rects


def cut_sheet(sheet_path, target, tmp, tag):
    link = os.path.join(ROOT, f'art/staging/cast-unify/batch-{tag}')
    os.makedirs(link, exist_ok=True)
    Image.open(sheet_path).save(os.path.join(link, 'sheet.png'))
    try:
        return cut_row(tag, 0, target, tmp)
    finally:
        os.unlink(os.path.join(link, 'sheet.png')); os.rmdir(link)


def on_shipping_canvas(rest_cell, frame_box, figs, picks, how='legs'):
    w, h = frame_box[2], frame_box[3]
    return [grow_and_paste((w, h), figs[i], *place(rest_cell, frame_box, figs[0], figs[i], how)) for i in picks]


report = {}
with tempfile.TemporaryDirectory() as tmp:
    # ---- 1 · the wreath --------------------------------------------------------------------------------------
    F = read('content/ambient/duel-fanshawe.json')['sprite']
    x, y, w, h = F['frames'][0]
    fan_sheet = np.asarray(Image.open(os.path.join(ROOT, F['sheet'])).convert('RGBA'))
    fan_rest = fan_sheet[y:y + h, x:x + w]
    target = int(rows_of(fan_rest)[-1] - rows_of(fan_rest)[0] + 1)
    a = np.asarray(Image.open(STAGE(5)).convert('RGB')).copy()
    op = opaque_rgb(a.astype(int))
    busy = op.any(0); figs_x, s = [], None
    for xx, on in enumerate(busy):
        if on and s is None: s = xx
        if not on and s is not None:
            if xx - s > 40: figs_x.append((s, xx))
            s = None
    assert len(figs_x) == 4, figs_x
    ruler, wreaths = figs_x[0], figs_x[1:]
    ry = np.nonzero(op[:, ruler[0]:ruler[1]].any(1))[0]; soles = int(ry[-1])
    k = target / (soles - ry[0] + 1)
    lily = (a[..., 0] > 170) & (a[..., 1] > 160) & (a[..., 2] > 130) & op        # the white lilies: the ring

    def ring_centre(x0, x1):
        yy, xx = np.nonzero(lily[:, x0:x1]); return int(round(xx.mean())) + x0, int(yy.max())
    # the ruler's lower legs and boots, from the wreath's bottom down to his soles
    wb = max(ring_centre(*fx)[1] for fx in wreaths[:2])
    leg_cols = np.nonzero(op[wb - 20:soles + 1, ruler[0]:ruler[1]].any(0))[0]
    lx0, lx1 = ruler[0] + leg_cols[0], ruler[0] + leg_cols[-1] + 1
    legs = a[wb - 20:soles + 1, lx0:lx1].copy(); legs_m = op[wb - 20:soles + 1, lx0:lx1]
    for fx in wreaths[:2]:
        cx, _ = ring_centre(*fx)
        X0 = cx - (lx1 - lx0) // 2
        region = a[wb - 20:soles + 1, X0:X0 + (lx1 - lx0)]
        free = ~op[wb - 20:soles + 1, X0:X0 + (lx1 - lx0)]
        put = legs_m & free                                   # under-paint: the wreath stays in front
        region[put] = legs[put]
    op = opaque_rgb(a.astype(int))
    # one window per frame, anchored on the ring's centre; all four frames share it
    half = max(cx - fx[0] for fx in wreaths for cx in [ring_centre(*fx)[0]]) + 12
    half = max(half, max(fx[1] - ring_centre(*fx)[0] for fx in wreaths) + 12)
    top = int(ry[0]) - 4
    cells = []
    for fx in wreaths:
        cx, _ = ring_centre(*fx)
        win = a[top:soles + 2, cx - half:cx + half]; m = op[top:soles + 2, cx - half:cx + half]
        rgba = np.dstack([win, (m * 255).astype(np.uint8)])
        cells.append(rgba)
    H2, W2 = round(cells[0].shape[0] * k), round(cells[0].shape[1] * k)
    def shrink(c):
        im = Image.fromarray(c, 'RGBA'); return np.asarray(im.resize((W2, H2), Image.BOX)).copy()
    cells = [shrink(c) for c in cells]
    for c in cells: c[..., 3] = np.where(c[..., 3] > 127, 255, 0)
    frames = [cells[0], breath_of(cells[0]), cells[1], cells[2]]
    out1, rects1 = strip(finish(frames, target / N))
    report['wreath'] = {'scale': round(k, 4), 'ofRest': target, 'legsUnder': [int(wb), soles], 'frames': rects1}

    # ---- 2 · Fanshawe on the hill, facing left -----------------------------------------------------------------
    rest2 = np.asarray(ImageOps.mirror(Image.fromarray(fan_rest)))
    figs2, _, _ = cut_sheet(STAGE(2), target, tmp, 'act2-fanshawe')
    poses2 = on_shipping_canvas(rest2, F['frames'][0], figs2, [1, 2])
    b2 = target / N
    out2, rects2 = strip(finish([poses2[0], breath_of(poses2[0]), poses2[1]], b2))
    report['hatInHand'] = {'frames': rects2}

    # ---- 3 · the Reverend with the plate -----------------------------------------------------------------------
    S = read('content/ambient/sowerby-gate.json')['sprite']
    sx, sy, sw, sh = S['frames'][0]
    sow_rest = np.asarray(Image.open(os.path.join(ROOT, S['sheet'])).convert('RGBA'))[sy:sy + sh, sx:sx + sw]
    t3 = int(rows_of(sow_rest)[-1] - rows_of(sow_rest)[0] + 1)
    figs3, _, _ = cut_sheet(STAGE(3), t3, tmp, 'act2-sowerby')
    poses3 = on_shipping_canvas(sow_rest, S['frames'][0], figs3, [1, 2, 3])
    out3, rects3 = strip(finish([poses3[0], breath_of(poses3[0]), poses3[1], poses3[2]], t3 / N))
    report['plate'] = {'frames': rects3}

    # ---- 4 · Thad holding the plate, as coat-bundle was cut ----------------------------------------------------
    stand = np.asarray(Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')).copy()
    rig = read('art/actors/thad-stand-front/rig.json'); fw_, fh_ = rig['figure']
    t4 = int(rows_of(stand)[-1] - rows_of(stand)[0] + 1)
    m = alpha(stand); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    shipped = stand[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    figs4, _, _ = cut_sheet(STAGE(4), t4, tmp, 'act2-thad')
    clip = []
    for i in (1, 2):
        gx, gy = register(shipped, figs4[0], 'feet'); px, py_ = register(figs4[0], figs4[i], 'feet')
        ox, oy = c[0] + gx + px, r[0] + gy + py_
        canvas = np.zeros_like(stand); pose = figs4[i]
        ys = slice(max(0, oy), min(canvas.shape[0], oy + pose.shape[0])); xs = slice(max(0, ox), min(canvas.shape[1], ox + pose.shape[1]))
        sub = pose[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
        keep = alpha(sub); canvas[ys, xs][keep] = sub[keep]
        clip.append(canvas)
    clip = finish([clip[0], breath_of(clip[0]), clip[1]], fh_ / N)
    W4 = stand.shape[1]; out4 = np.zeros((stand.shape[0], len(clip) * W4, 4), np.uint8)
    for i, f in enumerate(clip): out4[:, i * W4:(i + 1) * W4] = f
    report['thadPlate'] = {'canvas': list(stand.shape[1::-1]), 'frames': len(clip), 'soles': [int(rows_of(f)[-1]) for f in clip],
                           'heights': [int(rows_of(f)[-1] - rows_of(f)[0] + 1) for f in clip]}

print(json.dumps(report))
if WRITE:
    Image.fromarray(out1).save(os.path.join(ROOT, 'art/actors/room-02-fanshawe-wreath.png'))
    Image.fromarray(out2).save(os.path.join(ROOT, 'art/actors/room-14-fanshawe-hat-in-hand.png'))
    Image.fromarray(out3).save(os.path.join(ROOT, 'art/actors/room-14-sowerby-plate.png'))
    Image.fromarray(out4).save(os.path.join(ROOT, 'art/actors/thad-plate-front.png'))
