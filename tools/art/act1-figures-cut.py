"""Act I's four figures redrawn in the cast's hand, cut (reference/act-one-art/brief.md). No image operation.

Each job replaces a sheet that is already wired, so each keeps the old sheet's frame count, frame order, cells,
anchor and height (the brief: "Same poses, same cells, same anchor"). NOTHING IS REGRADED (the brief: "Never fix
the numbers in the cut"): the tool registers, keys, places and snaps to the one level (errata 112); every colour is
the operation's own.

  python3 tools/art/act1-figures-cut.py JOB [--op N] [--write]      JOB: horses | clerk | mapseller | barman1

Each job reads its old sheet from art/staging/act-one-art/<job>/old-sheet.png, so it re-runs to the same pixels, and
prints what was kept and the measures beside Thad (texture, contrast, mean luminance on the rest frame at game size).
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
alpha, rows_of, snap, despill_edge, opaque_rgb, N = (ns[k] for k in (
    'alpha', 'rows_of', 'snap', 'despill_edge', 'opaque_rgb', 'N'))
# The one level's snap SAMPLES each block's centre (tools/art/one-level.py --resnap, errata 235) instead of averaging:
# averaging blocks of a non-whole size smeared these small figures' faces (the map seller's eyes went), as it did the
# panner's. Every colour stays the operation's own.
snap.__globals__['RESNAP'] = True
bt = {'__file__': R('tools/art/beside-thad.py')}
srcb = open(bt['__file__']).read(); exec(srcb[:srcb.index('def main')], bt)
ms = {'__file__': R('tools/art/cast-softer-measure.py')}
srcm = open(ms['__file__']).read(); exec(srcm[:srcm.index('def head(')], ms)

ST = 'art/staging/act-one-art'
JOB = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'horses'
OPN = int(sys.argv[sys.argv.index('--op') + 1]) if '--op' in sys.argv else None
WRITE = '--write' in sys.argv


def thad_at(man):
    t = Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'); t = t.crop(t.getbbox())
    return np.asarray(t.resize((max(1, round(t.width * man / t.height)), round(man)), Image.BOX))


def barman_rest():
    b = json.load(open(R('content/ambient/nugget-barman.json')))['sprite']; x, y, w, h = b['frames'][0]
    return np.asarray(Image.open(R(b['sheet'])).convert('RGBA'))[y:y + h, x:x + w]


def measures(named):
    return {'texture': {n: ms['texture'](x) for n, x in named},
            'contrast': {n: round(float(ms['lum'](x[..., :3])[alpha(x)].std()), 1) for n, x in named},
            'meanLuminance': {n: round(float(ms['lum'](x[..., :3])[alpha(x)].mean()), 1) for n, x in named}}


def register(new_op, old_alpha, pos, search=16):
    """The shift of the operation's frame against the old frame laid where the template put it: best overlap."""
    h, w = old_alpha.shape; best = (-1, 0, 0)
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            y0, x0 = pos[1] + dy, pos[0] + dx
            if y0 < 0 or x0 < 0: continue
            n = new_op[y0:y0 + h, x0:x0 + w]
            if n.shape != old_alpha.shape: continue
            inter = (n & old_alpha).sum(); uni = (n | old_alpha).sum()
            iou = inter / max(1, uni)
            if iou > best[0]: best = (iou, dx, dy)
    return best


# ---------------------------------------------------------------- the horses
def horses():
    D = f'{ST}/horses'
    rec = json.load(open(R('content/ambient/hitching-horses.json'))); sp = rec['sprite']
    lay = json.load(open(R(f'{D}/layout.json')))
    op = OPN or 1
    out_img = np.asarray(Image.open(R(f'{D}/op-{op}.png')).convert('RGB')).astype(int)
    new_op = opaque_rgb(out_img)
    old = np.asarray(Image.open(R(f'{D}/old-sheet.png')).convert('RGBA'))
    sheet = np.zeros_like(old)
    man_sheet = sp['figureHeight'] / sp['stature']          # the man where they stand, in sheet pixels
    block = man_sheet / N
    report = {'job': 'horses', 'op': op, 'block': round(block, 3), 'frames': sp['frames'], 'register': []}
    # what the record reads off frame 0: the black's ear tips and front hooves (errata 201)
    def black_rows(c):
        m = alpha(c)[:, 30:200]
        r = np.nonzero(m.any(1))[0]; return int(r[0]), int(r[-1])
    raws = []
    for (x, y, w, h), pos in zip(sp['frames'], lay['positions']):
        oa = old[y:y + h, x:x + w, 3] >= 128
        iou, dx, dy = register(new_op, oa, pos)
        report['register'].append({'iou': round(float(iou), 3), 'dx': dx, 'dy': dy})
        y0, x0 = pos[1] + dy, pos[0] + dx
        c = np.zeros((h, w, 4), np.uint8)
        c[..., :3] = out_img[y0:y0 + h, x0:x0 + w]; c[..., 3] = np.where(new_op[y0:y0 + h, x0:x0 + w], 255, 0)
        raws.append(c)
    # The operation drew the group a little taller than the record's (the black's ears higher). One factor for all
    # four frames puts the black's ear tips to hooves back at the record's figureHeight, about the hooves' centre,
    # with the hooves on the record's footRow, so the scale test's stature holds.
    ear, hoof = black_rows(raws[0])
    f = sp['figureHeight'] / (hoof - ear)
    report['heightFix'] = {'drawnEarsHooves': [ear, hoof], 'factor': round(f, 4)}
    cells = []
    for (x, y, w, h), c in zip(sp['frames'], raws):
        im = Image.fromarray(c)
        pm = np.asarray(im).astype(float); pm[..., :3] *= pm[..., 3:4] / 255.0
        sw, sh_ = round(w * f), round(h * f)
        big = np.asarray(Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8)).resize((sw, sh_), Image.LANCZOS)).astype(float)
        a_ = big[..., 3:4]; rgb = np.where(a_ > 0, big[..., :3] * 255.0 / np.maximum(a_, 1), 0)
        big = np.concatenate([np.clip(rgb, 0, 255), np.where(a_ >= 128, 255, 0)], 2).astype(np.uint8)
        c2 = np.zeros((h, w, 4), np.uint8)
        ox = round(w / 2 - w * f / 2); oy = round(sp['footRow'] - hoof * f)
        ys0, xs0 = max(0, oy), max(0, ox)
        ys1, xs1 = min(h, oy + sh_), min(w, ox + sw)
        c2[ys0:ys1, xs0:xs1] = big[ys0 - oy:ys1 - oy, xs0 - ox:xs1 - ox]
        c2 = despill_edge(snap(c2, block), width=max(2, int(np.ceil(block)) + 1))
        sheet[y:y + h, x:x + w] = c2; cells.append(c2)
    report['blackEarsHooves'] = {'old': black_rows(old[2:415, 2:704]), 'new': black_rows(cells[0]),
                                 'record': [sp['footRow'] - sp['figureHeight'], sp['footRow']]}
    room = bt['load']('content/rooms/main-street.json')
    man = bt['curve_man'](room, rec['x'], rec['y'])
    k = man * sp['stature'] / sp['figureHeight']
    def game(c):
        im = Image.fromarray(c); return np.asarray(im.resize((round(im.width * k), round(im.height * k)), Image.BOX))
    g = bt['grade_for'](room, rec['id'])
    def lit(c):
        return np.asarray(bt['lit'](Image.fromarray(c), g, bt['mover_tint'](room.get('lamps'), rec['x'], rec['y'])))
    th = thad_at(man)
    report['gameScale'] = round(k, 4)
    report['measures'] = measures((('horses', game(cells[0])), ('horsesBefore', game(old[2:415, 2:704])),
                                   ('thadAtThisMan', th), ('barman', barman_rest())))
    report['litMeanLuminance'] = {'horses': round(float(ms['lum'](lit(game(cells[0]))[..., :3])[alpha(game(cells[0]))].mean()), 1),
                                  'horsesBefore': round(float(ms['lum'](lit(game(old[2:415, 2:704]))[..., :3])[alpha(game(old[2:415, 2:704]))].mean()), 1)}
    print(json.dumps(report, indent=1))
    if WRITE:
        Image.fromarray(sheet).save(R(sp['sheet']))
        render_street(room, rec, old, sheet, k, man)


def render_street(room, rec, old, new, k, man):
    sp = rec['sprite']; x, y, w, h = sp['frames'][0]
    plate = Image.open(R(room['background'])).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'left' and not cl.get('state'))
    tx, ty = rec['x'] + 260, rec['y'] + 10
    t = Image.open(R(st['frames'][0])).convert('RGBA')
    t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
    kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
    ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
    panels = []
    for sheet in (old, new):
        for i, (fx, fy, fw, fh) in enumerate(sp['frames'][:1]):
            f = Image.fromarray(sheet[fy:fy + fh, fx:fx + fw])
            f = f.resize((round(fw * k), round(fh * k)), Image.NEAREST)
            f = bt['lit'](f, bt['grade_for'](room, rec['id']), bt['mover_tint'](room.get('lamps'), rec['x'], rec['y']))
            im = plate.copy()
            im.alpha_composite(f, (round(rec['x'] - fw * k / 2), round(rec['y'] - sp['footRow'] * k)))
            im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
            crop = im.crop((rec['x'] - 330, rec['y'] - 300, rec['x'] + 400, rec['y'] + 90)).convert('RGB')
            panels.append(crop.resize((round(crop.width * 1.5), round(crop.height * 1.5)), Image.NEAREST))
    out = Image.new('RGB', (panels[0].width, panels[0].height * 2 + 8), (0, 0, 0))
    out.paste(panels[0], (0, 0)); out.paste(panels[1], (0, panels[0].height + 8))
    out.save(R('renders/act-one-art-horses-before-after.png'))


def downscale(rgba, w, h):
    """Premultiplied area resample to the cell, alpha cut at half."""
    pm = rgba.astype(float); pm[..., :3] *= pm[..., 3:4] / 255.0
    sm = np.asarray(Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8)).resize((w, h), Image.BOX)).astype(float)
    a_ = sm[..., 3:4]; rgb = np.where(a_ > 0, sm[..., :3] * 255.0 / np.maximum(a_, 1), 0)
    return np.concatenate([np.clip(rgb, 0, 255), np.where(a_ >= 128, 255, 0)], 2).astype(np.uint8)


def enlarged_frames(D, op, sp, lay):
    """Each frame of an operation drawn at `k` times the cell, registered on the old frame laid where the template put
    it (best overlap at the drawn size), cut out and brought back to the cell."""
    out_img = np.asarray(Image.open(R(f'{D}/op-{op}.png')).convert('RGB')).astype(int)
    new_op = opaque_rgb(out_img)
    old = np.asarray(Image.open(R(f'{D}/old-sheet.png')).convert('RGBA'))
    K = lay['k']; regs = []; cells = []
    for (x, y, w, h), pos in zip(sp['frames'], lay['positions']):
        oa = np.asarray(Image.fromarray(old[y:y + h, x:x + w]).resize((w * K, h * K), Image.NEAREST))[..., 3] >= 128
        iou, dx, dy = register(new_op, oa, pos, search=8 * K)
        regs.append({'iou': round(float(iou), 3), 'dx': dx, 'dy': dy})
        y0, x0 = pos[1] + dy, pos[0] + dx
        big = np.zeros((h * K, w * K, 4), np.uint8)
        hh = min(h * K, out_img.shape[0] - y0); ww = min(w * K, out_img.shape[1] - x0)
        big[:hh, :ww, :3] = out_img[y0:y0 + hh, x0:x0 + ww]; big[:hh, :ww, 3] = np.where(new_op[y0:y0 + hh, x0:x0 + ww], 255, 0)
        cells.append(downscale(big, w, h))
    return old, cells, regs


# ---------------------------------------------------------------- the lobby clerk
def clerk():
    D = f'{ST}/clerk'
    rec = json.load(open(R('content/ambient/lobby-clerk.json'))); sp = rec['sprite']
    lay = json.load(open(R(f'{D}/layout.json')))
    op = OPN or 1
    old, cells, regs = enlarged_frames(D, op, sp, lay)
    room = bt['load']('content/rooms/company-lobby.json')
    man = bt['curve_man'](room, rec['x'], rec['y'])
    block = man / N
    w, h = sp['frames'][0][2], sp['frames'][0][3]
    waist_row = h - 1 - (rec['y'] - sp['waistOn'])            # the cell row the waist must end on
    report = {'job': 'clerk', 'op': op, 'register': regs, 'manAtClerk': round(man, 1), 'block': round(block, 3),
              'waistRow': waist_row}
    def waist_of(c):
        col = alpha(c)[:, c.shape[1] // 2]; r = np.nonzero(col)[0]; return int(r[-1]) if len(r) else None
    report['waistDrawn'] = [waist_of(c) for c in cells]
    # The operation drew his hands level with his waist, a few rows above where the old drawing ended. One shift for
    # all five frames (from the rest frame) lands the rest frame's waist on the desk's back edge (waistOn).
    shift = waist_row - report['waistDrawn'][0]
    report['shiftDown'] = shift
    def moved(c):
        o = np.zeros_like(c)
        if shift >= 0: o[shift:] = c[:c.shape[0] - shift]
        else: o[:shift] = c[-shift:]
        return o
    cells = [moved(c) for c in cells]
    # Below the waist row only his hands come forward onto the desk top: the waistcoat and shirt stop at the desk's
    # back edge (errata 111; tests/counter-surface.test.mjs). Hands are skin (red well over blue) and the cuffs above
    # them; whatever piece below the waist row holds skin is kept, the rest is behind the desk.
    from scipy import ndimage as ndi
    fixed = []
    for c in cells:
        c = c.copy(); low = c[waist_row + 1:]
        m = low[..., 3] >= 128
        skin = ((low[..., 0].astype(int) - low[..., 2]) > 60) & (low[..., 0] > 120) & m
        lab, n = ndi.label(m); keep = np.zeros_like(m)
        for i in range(1, n + 1):
            if (skin & (lab == i)).sum() >= 4: keep |= (lab == i)
        low[..., 3] = np.where(keep, low[..., 3], 0)
        fixed.append(despill_edge(snap(c, block), width=max(2, int(np.ceil(block)) + 1)))
    # Frame 1 is the breath, derived from the rest frame by tools/rig/ambient-breath.py, as the record's frameNote says
    # it is (the operation's own frame 1 is set aside).
    import subprocess
    Image.fromarray(fixed[0]).save(R(f'{D}/rest.png'))
    subprocess.run([sys.executable, R('tools/rig/ambient-breath.py'), R(f'{D}/rest.png'), R(f'{D}/breath.png')],
                   check=True, capture_output=True)
    fixed[1] = np.asarray(Image.open(R(f'{D}/breath.png')).convert('RGBA'))
    sheet = np.zeros_like(old)
    for (x, y, fw, fh), c in zip(sp['frames'], fixed):
        sheet[y:y + fh, x:x + fw] = c
    report['waistAfter'] = [waist_of(c) for c in fixed]
    def bottom_widest(c):
        m = alpha(c)[-6:]; best = 0
        for row in m:
            run = 0
            for v in row:
                run = run + 1 if v else 0; best = max(best, run)
        return round(best / c.shape[1], 3)
    report['bottomWidest'] = [bottom_widest(c) for c in fixed]
    report['measures'] = measures((('clerk', fixed[0]), ('clerkBefore', old[2:2 + h, 2:2 + w]),
                                   ('thadAtThisMan', thad_at(man)), ('storekeeper', storekeeper_rest())))
    print(json.dumps(report, indent=1))
    if WRITE:
        Image.fromarray(sheet).save(R(sp['sheet']))
        render_bust(room, rec, old, sheet, 'renders/act-one-art-lobby-clerk-before-after.png', (1300, 712), 'back',
                    (1000, 150, 1800, 800))


def storekeeper_rest():
    import glob
    rec = [json.load(open(f)) for f in glob.glob(R('content/ambient/*.json')) if 'room-12-storekeeper' in open(f).read()][0]
    x, y, w, h = rec['sprite']['frames'][0]
    return np.asarray(Image.open(R(rec['sprite']['sheet'])).convert('RGBA'))[y:y + h, x:x + w]


def render_bust(room, rec, old, new, out, thad_at_xy, facing, crop, frames=(0,)):
    sp = rec['sprite']
    plate = Image.open(R(room['background'])).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == facing and not cl.get('state'))
    tx, ty = thad_at_xy
    t = Image.open(R(st['frames'][0])).convert('RGBA')
    t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
    kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
    ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
    rows = []
    for sheet in (old, new):
        panels = []
        for i in frames:
            fx, fy, fw, fh = sp['frames'][i]
            f = Image.fromarray(sheet[fy:fy + fh, fx:fx + fw])
            f = bt['lit'](f, bt['grade_for'](room, rec['id']), bt['mover_tint'](room.get('lamps'), rec['x'], rec['y']))
            im = plate.copy(); im.alpha_composite(f, (rec['x'] - fw // 2, rec['y'] - fh + 1))
            im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
            panels.append(im.crop(crop).convert('RGB'))
        rows.append(panels)
    pw, ph = rows[0][0].size
    img = Image.new('RGB', (pw * len(frames) + 8 * (len(frames) - 1), ph * 2 + 8), (0, 0, 0))
    for r, panels in enumerate(rows):
        for i, p in enumerate(panels):
            img.paste(p, (i * (pw + 8), r * (ph + 8)))
    img.save(R(out))


def breath_of(D, rest):
    """The breath frame, derived from the rest frame by tools/rig/ambient-breath.py, as the records' frameNotes say."""
    import subprocess
    Image.fromarray(rest).save(R(f'{D}/rest.png'))
    subprocess.run([sys.executable, R('tools/rig/ambient-breath.py'), R(f'{D}/rest.png'), R(f'{D}/breath.png')],
                   check=True, capture_output=True)
    return np.asarray(Image.open(R(f'{D}/breath.png')).convert('RGBA'))


def unpocket(c):
    """Key caught INSIDE the figure (tests/master-cut-edges.test.mjs: blue well over green and more than 80 magenta):
    each such pixel takes the median colour of its opaque, un-keyed neighbours. Despill, not a grade."""
    c = c.copy(); a = c.astype(int)
    bad = (a[..., 3] > 128) & (a[..., 2] > a[..., 1] + 30) & ((a[..., 0] + a[..., 2]) / 2 - a[..., 1] > 60)
    for y, x in zip(*np.nonzero(bad)):
        ys, xs = slice(max(0, y - 2), y + 3), slice(max(0, x - 2), x + 3)
        ok = (a[ys, xs, 3] > 128) & ~bad[ys, xs]
        if ok.any(): c[y, x, :3] = np.median(a[ys, xs, :3][ok], axis=0).astype(np.uint8)
    return c


def figure_in(out_img, new_op, pos, w, h, margin=40, vmargin=16):
    """The whole drawn figure the operation put near where the template laid frame (pos, w x h): every opaque piece
    in the window around it, cropped to their bounds."""
    y0, x0 = max(0, pos[1] - vmargin), max(0, pos[0] - margin)
    y1, x1 = min(out_img.shape[0], pos[1] + h + vmargin), min(out_img.shape[1], pos[0] + w + margin)
    m = new_op[y0:y1, x0:x1]
    from scipy import ndimage as ndi
    lab, n = ndi.label(m)                                  # specks of the key's edge are not the figure
    sizes = ndi.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z >= 60])
    ys, xs = np.nonzero(m)
    a, b, c, d = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    f = np.zeros((b - a, d - c, 4), np.uint8)
    f[..., :3] = out_img[y0 + a:y0 + b, x0 + c:x0 + d]; f[..., 3] = np.where(m[a:b, c:d], 255, 0)
    return f


def torso_x(c):
    m = alpha(c); r = np.nonzero(m.any(1))[0]; hh = r[-1] - r[0] + 1
    cols = np.nonzero(m[r[0] + int(.15 * hh):r[0] + int(.45 * hh)].any(0))[0]
    return (cols[0] + cols[-1]) / 2


def standing(D, rec, room, op, render_out, thad_dx, crop_box, grow=False):
    """A full-length standing figure on a 1:1 sheet. Each frame is the whole figure the operation drew there; ONE
    factor for all frames makes the rest frame as tall as the old rest frame; each is laid in its old cell with its
    soles on the old sole row and its torso where the old frame's torso was; snapped at the record's man.

    With `grow` (errata 359), a pose wider or taller than its old cell is not trimmed at the cell's edge: its cell is
    widened evenly at both sides and grown at the top only, as far as the pose needs, and the sheet is laid again. The torso stays at the cell's centre offset and the soles on the cell's foot row, so the engine, which
    centres each frame on the figure's x and stands it on its foot, draws it where the old cell stood. Returns the new
    frame rects in `report['frames']` for the record."""
    sp = rec['sprite']
    lay = json.load(open(R(f'{D}/layout.json')))
    out_img = np.asarray(Image.open(R(f'{D}/op-{op}.png')).convert('RGB')).astype(int)
    new_op = opaque_rgb(out_img)
    old = np.asarray(Image.open(R(f'{D}/old-sheet.png')).convert('RGBA'))
    K = lay['k']
    figs = [figure_in(out_img, new_op, pos, fw * K, fh * K) for (fx, fy, fw, fh), pos in zip(sp['frames'], lay['positions'])]
    w, h = sp['frames'][0][2], sp['frames'][0][3]
    x0, y0 = sp['frames'][0][:2]
    orest = old[y0:y0 + h, x0:x0 + w]
    crown_old, sole_old = int(rows_of(orest)[0]), int(rows_of(orest)[-1])
    f = (sole_old - crown_old + 1) / figs[0].shape[0]
    block = (sp.get('levelMan') or sp['figureHeight']) / N     # the man tests/one-level.test.mjs reads for the record
    cells, clipped, rects = [], [], []
    for (fx, fy, fw, fh), fig in zip(sp['frames'], figs):
        sm = downscale(fig, max(1, round(fig.shape[1] * f)), max(1, round(fig.shape[0] * f)))
        sm = sm[:, alpha(sm).any(0)] if alpha(sm).any() else sm
        ocell = old[fy:fy + fh, fx:fx + fw]
        cx = torso_x(ocell) if alpha(ocell).any() else fw / 2
        sole = int(rows_of(sm)[-1])
        ox = int(round(cx - torso_x(sm))); oy = sole_old - sole
        if grow:
            side = max(0, -ox, ox + sm.shape[1] - fw); top = max(0, -oy)
            if side or top:
                fw, fh, ox, oy = fw + 2 * side, fh + top, ox + side, oy + top
                fx = fy = None
        rects.append([fx, fy, fw, fh])
        c = np.zeros((fh, fw, 4), np.uint8)
        ys0, xs0 = max(0, oy), max(0, ox); ys1, xs1 = min(fh, oy + sm.shape[0]), min(fw, ox + sm.shape[1])
        c[ys0:ys1, xs0:xs1] = sm[ys0 - oy:ys1 - oy, xs0 - ox:xs1 - ox]
        lost = int(alpha(sm).sum() - alpha(c).sum())
        clipped.append(lost)
        cells.append(unpocket(despill_edge(snap(c, block), width=max(2, int(np.ceil(block)) + 1))))
    cells[1] = breath_of(D, cells[0])
    if rects[1][2:] != [cells[1].shape[1], cells[1].shape[0]]:
        rects[1] = [None, None, cells[1].shape[1], cells[1].shape[0]]     # the breath is the rest's own size
    if any(r[0] is None for r in rects):
        # The sheet is laid again: the old rows kept, in order, each cell at its own size, two pixels apart as the
        # sheet's own are.
        ry = 2
        for row in sorted({y for x, y, w, h in sp['frames']}):
            rx = 2; members = [r for r, (x, y, w, h) in zip(rects, sp['frames']) if y == row]
            for r in members: r[0], r[1] = rx, ry; rx += r[2] + 2
            ry += max(r[3] for r in members) + 2
        sheet = np.zeros((max(r[1] + r[3] for r in rects) + 2, max(r[0] + r[2] for r in rects) + 2, 4), np.uint8)
    else:
        sheet = np.zeros_like(old)
    for (x, y, fw, fh), c in zip(rects, cells):
        sheet[y:y + fh, x:x + fw] = c
    man = bt['curve_man'](room, rec['x'], rec['y'])
    k = man / sp['figureHeight']
    def game(c):
        im = Image.fromarray(c); return np.asarray(im.resize((round(im.width * k), round(im.height * k)), Image.BOX))
    report = {'op': op, 'scale': round(f, 4), 'block': round(block, 3),
              'restRows': {'old': [crown_old, sole_old], 'new': [int(rows_of(cells[0])[0]), int(rows_of(cells[0])[-1])]},
              'restWidth': {'old': int(np.ptp(np.nonzero(alpha(orest).any(0))[0]) + 1),
                            'new': int(np.ptp(np.nonzero(alpha(cells[0]).any(0))[0]) + 1)},
              'pixelsLostAtCellEdge': clipped, 'frames': rects,
              'measures': measures(((rec['id'], game(cells[0])), ('before', game(orest)),
                                    ('thadAtThisMan', thad_at(man)), ('barman', barman_rest())))}
    if grow and any(clipped):
        sys.exit(f'{rec["id"]}: a grown cell still lost {clipped} pixels at its edge; not written')
    if WRITE:
        Image.fromarray(sheet).save(R(sp['sheet']))
        render_standing(room, rec, old, sheet, k, render_out, thad_dx, crop_box, rects)
    return report


def render_standing(room, rec, old, new, k, out, thad_dx, crop_box, new_frames=None, zoom=1.5):
    sp = rec['sprite']
    plate = Image.open(R(room['background'])).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == ('right' if thad_dx < 0 else 'left')
              and not cl.get('state'))
    tx, ty = rec['x'] + thad_dx, rec['y'] + 8
    t = Image.open(R(st['frames'][0])).convert('RGBA')
    t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
    kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
    ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
    rows = []
    for sheet, frames in ((old, sp['frames']), (new, new_frames or sp['frames'])):
        panels = []
        for (fx, fy, fw, fh) in frames:
            f = Image.fromarray(sheet[fy:fy + fh, fx:fx + fw]).resize((round(fw * k), round(fh * k)), Image.NEAREST)
            f = bt['lit'](f, bt['grade_for'](room, rec['id']), bt['mover_tint'](room.get('lamps'), rec['x'], rec['y']))
            im = plate.copy(); im.alpha_composite(f, (round(rec['x'] - fw * k / 2), round(rec['y'] - fh * k)))
            im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
            c = im.crop(crop_box).convert('RGB')
            panels.append(c.resize((round(c.width * zoom), round(c.height * zoom)), Image.NEAREST))
        rows.append(panels)
    pw, ph = rows[0][0].size; n = len(rows[0])
    img = Image.new('RGB', (pw * n + 6 * (n - 1), ph * 2 + 8), (0, 0, 0))
    for r, panels in enumerate(rows):
        for i, p in enumerate(panels):
            img.paste(p, (i * (pw + 6), r * (ph + 8)))
    img.save(R(out))


# ---------------------------------------------------------------- the map seller
def mapseller():
    rec = json.load(open(R('content/ambient/map-seller.json')))
    room = bt['load']('content/rooms/main-street.json')
    # Errata 359: three poses were trimmed at the cell's edge; their cells grow instead, and the record takes the rects.
    rep = standing(f'{ST}/mapseller', rec, room, OPN or 2, 'renders/act-one-art-map-seller-before-after.png', -110,
                   (rec['x'] - 170, rec['y'] - 190, rec['x'] + 60, rec['y'] + 20), grow=True)
    if WRITE and rep['frames'] != rec['sprite']['frames']:
        path = R('content/ambient/map-seller.json'); text = open(path).read()
        rec['sprite']['frames'] = rep['frames']
        open(path, 'w').write(json.dumps(rec, indent=1, ensure_ascii=False) + ('\n' if text.endswith('\n') else ''))
    print(json.dumps({'job': 'mapseller', **rep}, indent=1))


# ---------------------------------------------------------------- the first man at the Nugget's bar
def barman1():
    """A masked edit of the room itself: both frames, each in its crop of the plate, his sprite's area (dilated 2 px)
    open to repaint. Each frame's pixels are taken back from the edit inside his OLD sprite outline exactly, so the
    figure painted in the plate under him never shows and the band's cut stays where it was."""
    D = f'{ST}/barman1'
    rec = json.load(open(R('content/ambient/nugget-bar1.json'))); sp = rec['sprite']
    lay = json.load(open(R(f'{D}/layout.json')))
    op = OPN or 2
    out_img = Image.open(R(f'{D}/op-{op}.png')).convert('RGB')
    old = np.asarray(Image.open(R(f'{D}/old-sheet.png')).convert('RGBA'))
    CX0, CY0, CX1, CY1 = lay['crop']; ox, oy = lay['origin']; cw, ch = lay['cw'], lay['ch']
    block = 2.51                                   # tools/art/one-level.py --dry --only nugget-bar1
    sheet = np.zeros_like(old); cells = []
    for (x, y, w, h), pos in zip(sp['frames'], lay['positions']):
        crop = out_img.crop((pos[0], pos[1], pos[0] + cw, pos[1] + ch))
        rgba = np.asarray(crop.convert('RGBA')).copy()
        small = downscale(rgba, CX1 - CX0, CY1 - CY0)
        cell = small[oy - CY0:oy - CY0 + h, ox - CX0:ox - CX0 + w].copy()
        cell[..., 3] = old[y:y + h, x:x + w, 3]
        cell = snap(cell, block)
        cell[..., 3] = old[y:y + h, x:x + w, 3]    # the outline is the old one, to the pixel, after the snap too
        cell[..., :3] = np.where(cell[..., 3:4] > 0, cell[..., :3], 0)
        sheet[y:y + h, x:x + w] = cell; cells.append(cell)
    b2 = json.load(open(R('content/ambient/nugget-bar2.json')))['sprite']; bx, by, bw, bh = b2['frames'][0]
    bar2 = np.asarray(Image.open(R(b2['sheet'])).convert('RGBA'))[by:by + bh, bx:bx + bw]
    room = bt['load']('content/rooms/nugget.json')
    report = {'job': 'barman1', 'op': op, 'block': block, 'frames': sp['frames'],
              'outlineUnchanged': bool((sheet[..., 3] == old[..., 3]).all()),
              'changedFromRest': round(float((np.abs(cells[0][..., :3].astype(int) - cells[1][..., :3]).max(2) > 40)[cells[0][..., 3] > 0].mean()), 3),
              'measures': measures((('bar1', cells[0]), ('bar1Before', old[2:247, 2:174]), ('bar2', bar2),
                                    ('thadAtThisMan', thad_at(bt['curve_man'](room, rec['x'], rec['y']))))) }
    print(json.dumps(report, indent=1))
    if WRITE:
        Image.fromarray(sheet).save(R(sp['sheet']))
        plate = Image.open(R(room['background'])).convert('RGBA')
        thad = bt['load']('content/actors/thad.json')
        st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'right' and not cl.get('state'))
        panels = []
        for src_sheet in (old, sheet):
            for (x, y, w, h) in sp['frames']:
                im = plate.copy()
                for fid in ('nugget-bar2', 'nugget-bar3'):
                    d = json.load(open(R(f'content/ambient/{fid}.json'))); s2 = d['sprite']; fx, fy, fw, fh = s2['frames'][0]
                    im.alpha_composite(Image.open(R(s2['sheet'])).convert('RGBA').crop((fx, fy, fx + fw, fy + fh)), (d['x'] - fw // 2, d['y'] - fh + 1))
                im.alpha_composite(Image.fromarray(src_sheet[y:y + h, x:x + w]), (ox, oy))
                tx, ty = 1484, 760
                t = Image.open(R(st['frames'][0])).convert('RGBA')
                t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
                kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
                ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
                im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
                panels.append(im.crop((1000, 260, 1640, 800)).convert('RGB'))
        pw, ph = panels[0].size
        img = Image.new('RGB', (pw * 2 + 8, ph * 2 + 8), (0, 0, 0))
        for i, p in enumerate(panels):
            img.paste(p, ((i % 2) * (pw + 8), (i // 2) * (ph + 8)))
        img.save(R('renders/act-one-art-bar-man-before-after.png'))


JOBS = {'horses': horses, 'clerk': clerk, 'mapseller': mapseller, 'barman1': barman1}

if __name__ == '__main__':
    JOBS[JOB]()
