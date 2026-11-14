"""Thad's hand-over clip, cut (reference/acted-directions-3/brief.md, `thad`; errata 307, 308). No image operation.

acted-directions-3-thad operations 1 and 2 (and 3, the left facing's correction) drew, on a template of his stand frame repeated (the first copy the ruler,
left as it was), the hand-over in each facing: 1 the near arm out at chest height, the hand closed on something small;
2 the arm back at his side, empty.

For each facing this writes a strip on his stand canvas (663 x 691 right, 663 x 690 left), frame i at x = 663 i:
  0  his stand frame, BYTE FOR BYTE (art/actors/thad-stand-<facing>/stand-00.png), asserted;
  1  the stand frame with only the arm region taken from the drawing;
  2  the same for the arm back down, empty.
The drawing is scaled by the one factor that makes the ruler his stand height, and registered on it by the feet.
"The arm region" is where the drawn pose differs from the drawn ruler (dilated); every other pixel is the stand
frame's own, so his body, head and feet do not move between frames (a whole drawn frame would jump: doc 36 Q107).
Snapped to the one level (errata 112) inside the region only; despilled. Strips, not clip directories: a thad-*
directory must be declared in content/, which this hand-back does not touch.

  python3 tools/art/acted3-thad-cut.py [--write]
Writes art/actors/thad-hand-over-right.png, thad-hand-over-left.png and renders/thad-hand-over-in-the-nugget.png.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
src = open(R('tools/art/final-look-cut.py')).read()
ns = {'__file__': R('tools/art/final-look-cut.py')}
saved, sys.argv = sys.argv, ['final-look-cut.py']
exec(src[:src.index('\ndef main(')], ns)
sys.argv = saved
alpha, rows_of, register, snap, figures_of, scaled, despill_edge, N = (ns[k] for k in (
    'alpha', 'rows_of', 'register', 'snap', 'figures_of', 'scaled', 'despill_edge', 'N'))
STAGE = 'art/staging/acted-directions-3/thad'
MIRROR_LEFT = True         # see mirrored_left()
HEAD = 0.17                # the top of the figure that is head and collar: never taken from the drawing
DIFF, GROW = 60, 4         # how different a pixel is to be the arm's; how far the arm region is grown


def cut(facing):
    stand = np.asarray(Image.open(R(f'art/actors/thad-stand-{facing}/stand-00.png')).convert('RGBA')).copy()
    rig = json.load(open(R(f'art/actors/thad-stand-{facing}/rig.json')))
    m = alpha(stand); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    shipped = stand[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    t = r[-1] - r[0] + 1
    figs = figures_of(R(f'{STAGE}/sheet-{facing}.png'), 3)
    k = t / (rows_of(figs[0])[-1] - rows_of(figs[0])[0] + 1)
    figs = [scaled(f, k) for f in figs]
    block = rig['figure'][1] / N
    frames = [stand.copy()]
    for i in (1, 2):
        canvas = np.zeros_like(stand)
        gx, gy = register(shipped, figs[0], 'feet')
        rest = np.zeros_like(stand)
        def put(dst, f, ox, oy):
            sub = f[max(0, -oy):dst.shape[0] - oy, max(0, -ox):dst.shape[1] - ox]
            dst[max(0, oy):max(0, oy) + sub.shape[0], max(0, ox):max(0, ox) + sub.shape[1]][alpha(sub)] = sub[alpha(sub)]
        put(rest, figs[0], c[0] + gx, r[0] + gy)
        px, py = register(figs[0], figs[i], 'feet')
        put(canvas, figs[i], c[0] + gx + px, r[0] + gy + py)
        diff = (alpha(canvas) != alpha(rest)) | (np.abs(canvas[..., :3].astype(int) - rest[..., :3].astype(int)).sum(2) > DIFF) & alpha(canvas)
        diff = ndi.binary_opening(diff, iterations=1)
        region = ndi.binary_dilation(diff, iterations=GROW)
        lab, n = ndi.label(region)                       # the arm: the regions of real size only
        sizes = ndi.sum(region, lab, range(1, n + 1))
        region = np.isin(lab, 1 + np.nonzero(sizes >= max(200, 0.05 * sizes.max()))[0]) if n else region
        region[:r[0] + int(HEAD * t)] = False             # the arm only: the drawing's head is not his
        print(facing, i, 'diff px', int(diff.sum()), 'region px', int(region.sum()), file=sys.stderr)
        drawn = despill_edge(snap(canvas, block) if block > 1.05 else canvas, width=max(2, int(np.ceil(block)) + 1))
        out = stand.copy()
        out[region] = drawn[region]
        frames.append(out)
    assert np.array_equal(frames[0], stand), 'frame 0 is the stand frame byte for byte'
    W = stand.shape[1]
    strip = np.zeros((stand.shape[0], 3 * W, 4), np.uint8)
    for i, f in enumerate(frames):
        strip[:, i * W:(i + 1) * W] = f
    changed = [int((np.any(f != stand, axis=2)).sum()) for f in frames]
    return strip, {'facing': facing, 'canvas': [W, stand.shape[0]], 'frames': 3, 'scale': round(k, 4),
                   'block': round(block, 3), 'pixelsChangedFromStand': changed,
                   'soles': [int(rows_of(f)[-1]) for f in frames]}


def render(strips):
    """The clip as the engine would draw it in the Nugget, beside Deke across the barrel (the style gate's room)."""
    ins = {'__file__': R('tools/art/acted3-thad-inputs.py')}
    rows = []
    for facing, strip in strips.items():
        base = Image.open(R(f'{STAGE}/nugget-{facing}.png')).convert('RGB')
        rows.append(base)
    # The inputs' frames already hold Thad's stand; the hand-over frames are drawn into the same spot below.
    bt = {'__file__': R('tools/art/beside-thad.py')}
    srcb = open(bt['__file__']).read(); exec(srcb[:srcb.index('def main')], bt)
    room = bt['load']('content/rooms/nugget.json'); deke = bt['load']('content/ambient/deke-vessel.json')
    thad = bt['load']('content/actors/thad.json')
    plate = Image.open(R(room['background'])).convert('RGBA')
    barrel = next(p for p in room['props'] if p['id'] == 'whiskey_barrel')
    b = Image.open(R(barrel['sheet'])).convert('RGBA'); fx, fy, fw, fh = barrel['frame']; b = b.crop((fx, fy, fx + fw, fy + fh))
    s = deke['sprite']; x, y, w, h = s['frames'][0]
    dimg = Image.open(R(s['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
    dimg = bt['lit'](dimg, bt['grade_for'](room, deke['id']), bt['mover_tint'](room.get('lamps'), deke['x'], deke['y']))
    panels = []
    for facing, tx in (('right', 730), ('left', 1362)):
        st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == facing and not cl.get('state'))
        strip = strips[facing]; W = strip.width // 3
        for i in range(3):
            im = plate.copy(); im.alpha_composite(b, (barrel['x'] - fw // 2, barrel['y'] - fh + 1))
            md = bt['curve_man'](room, deke['x'], deke['y']) * (s.get('stature') or 1)
            kd = md / (deke.get('figureHeight') or (h - 1))
            dd = dimg.resize((round(w * kd), round(h * kd)), Image.NEAREST)
            im.alpha_composite(dd, (round(deke['x'] - w / 2 * kd), round(deke['y'] - (h - 1) * kd)))
            f = Image.fromarray(np.asarray(strip)[:, i * W:(i + 1) * W])
            f = bt['lit'](f, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, 818))
            kt = bt['curve_man'](room, tx, 818) / st['figureHeight']
            ft = f.resize((round(f.width * kt), round(f.height * kt)), Image.NEAREST)
            im.alpha_composite(ft, (round(tx - st['anchor'][0] * kt), round(818 - st['anchor'][1] * kt)))
            x0 = min(tx, deke['x']) - 220; x1 = max(tx, deke['x']) + 220
            panels.append(im.crop((max(0, x0), 360, min(1920, x1), 864)).convert('RGB'))
    pw, ph = panels[0].width, panels[0].height
    sheet = Image.new('RGB', (pw * 3 + 16, ph * 2 + 8), (0, 0, 0))
    for i, p in enumerate(panels):
        sheet.paste(p.resize((pw, ph)), ((i % 3) * (pw + 8), (i // 3) * (ph + 8)))
    sheet.save(R('renders/thad-hand-over-in-the-nugget.png'))


def mirrored_left(right_strip):
    """THE LEFT FACING FROM THE RIGHT. Both left drawings (operation 2 and its correction, operation 3) reached with the
    FAR arm and left the near hand at his hip; the brief asks for the near arm. Thad's left stand is close to the mirror
    of his right (IoU 0.945 once aligned), so frame 1 is the left stand with the right clip's arm region, mirrored and
    aligned by the silhouettes, laid in. Frames 0 and 2 are the left stand byte for byte."""
    rs = np.asarray(Image.open(R('art/actors/thad-stand-right/stand-00.png')).convert('RGBA'))
    ls = np.asarray(Image.open(R('art/actors/thad-stand-left/stand-00.png')).convert('RGBA')).copy()
    W = rs.shape[1]
    r1 = right_strip[:, W:2 * W]
    region = np.any(r1 != rs, axis=2)[:, ::-1]
    mr, mr1 = rs[:, ::-1], r1[:, ::-1]
    best = (-1, 0, 0)
    for dy in range(-4, 5):
        for dx in range(-16, 17):
            a = np.roll(np.roll(alpha(mr), dy, 0), dx, 1)[:ls.shape[0]]
            iou = (a & alpha(ls)).sum() / (a | alpha(ls)).sum()
            if iou > best[0]:
                best = (iou, dx, dy)
    _, dx, dy = best
    sh = lambda x: np.roll(np.roll(x, dy, 0), dx, 1)[:ls.shape[0]]
    f1 = ls.copy(); reg = sh(region); f1[reg] = sh(mr1)[reg]
    frames = [ls, f1, ls.copy()]
    strip = np.zeros((ls.shape[0], 3 * W, 4), np.uint8)
    for i, f in enumerate(frames):
        strip[:, i * W:(i + 1) * W] = f
    assert np.array_equal(strip[:, :W], ls)
    return strip, {'facing': 'left', 'canvas': [W, ls.shape[0]], 'frames': 3, 'from': 'the right clip, mirrored',
                   'mirrorAlignment': {'iou': round(best[0], 3), 'dx': dx, 'dy': dy},
                   'pixelsChangedFromStand': [0, int(np.any(f1 != ls, axis=2).sum()), 0],
                   'soles': [int(rows_of(f)[-1]) for f in frames]}


def main(write):
    strips, report = {}, []
    for facing in ('right', 'left'):
        if facing == 'left' and MIRROR_LEFT:
            strip, rep = mirrored_left(np.asarray(strips['right']))
            report.append(rep); strips['left'] = Image.fromarray(strip)
            if write:
                strips['left'].save(R('art/actors/thad-hand-over-left.png'))
            continue
        strip, rep = cut(facing)
        report.append(rep)
        strips[facing] = Image.fromarray(strip)
        if write:
            strips[facing].save(R(f'art/actors/thad-hand-over-{facing}.png'))
    if write:
        render(strips)
    print(json.dumps(report, indent=1))


if __name__ == '__main__':
    main('--write' in sys.argv)
