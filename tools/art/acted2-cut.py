"""Acted directions, the second pass: each figure's new poses cut and added to its own sheet
(reference/acted-directions-2/brief.md). No image operation.

Each acted-directions-2 operation drew, on magenta, Thad (the ruler, not shipped), the figure's own rest frame (left
as it was: the registration ruler), then the figure's new poses (tools/art/acted2-inputs.py). This, with
tools/art/final-look-cut.py's own functions:

  - finds the figures as groups of pieces (a thin handle eaten by the key stays with its man);
  - scales every pose by ONE factor so the drawn rest copy is exactly as tall as the sheet's rest frame, and matches
    its mean light to the rest frame's;
  - registers each pose on the drawn rest by its legs (or its waist, for a figure cut off at a counter or a table),
    the drawn rest on the shipping rest the same way, so a pose stands where the rest stands;
  - ADDS the poses to the sheet as a new row below everything on it: frames [2 + i*(W+2), Y, W, H], one cell size
    for the row -- frame 0's cell, widened evenly at both sides and grown at the top only as far as a pose needs --
    the soles (or the waist line) on frame 0's own row in the cell, counted from the cell's foot;
  - despills each frame's outline ring and snaps it to the one level at the record's own man (errata 112);
  - ASSERTS THE EXISTING FRAMES ARE UNTOUCHED, pixel for pixel, and writes the sheet over itself.

The panner (Tyler, mid-brief: he reads as Thad in a hat; "Redraw him, 1 op") is redrawn whole as final-look-cut
does -- every old frame replaced in place, the breath derived -- and his snort added after.

Thad's two sheets are strips on his idle canvases (as tools/art/press-pull-cut.py cut the haul), registered on his
feet: art/actors/thad-acted2-back.png and art/actors/thad-acted2-right.png.

Usage: acted2-cut.py KEY [--write]
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
src = open(R('tools/art/final-look-cut.py')).read()
ns = {'__file__': R('tools/art/final-look-cut.py')}
saved, sys.argv = sys.argv, ['final-look-cut.py']
exec(src[:src.index('\ndef main(')], ns)
sys.argv = saved
for k in ('place', 'register', 'snap', 'alpha', 'rows_of', 'N', 'breath_of', 'figures_of', 'scaled', 'despill_edge',
          'spill_on_edge', 'height'):
    globals()[k] = ns[k]
A = 'art/staging/acted-directions-2'

# key: (record, registration, the old frames redrawn in order (None: none), the old frame derived as a breath)
FIGURES = {
    'pratt': ('content/ambient/pratt.json', 'legs', None, None),
    'pratt-jump': ('content/ambient/pratt-jump.json', 'legs', None, None),
    'rule-keeper': ('content/ambient/gulch-rule-keeper.json', 'legs', None, None),
    'lookout': ('content/ambient/gulch-lookout.json', 'legs', None, None),
    'deacon': ('content/ambient/gulch-deacon.json', 'legs', None, None),
    'winnie': ('content/ambient/winnie.json', 'waist', None, None),
    'ozymandia': ('content/ambient/ozymandia.json', 'waist', None, None),
    'frame': ('content/ambient/frame.json', 'legs', None, None),
    'deke': ('content/ambient/deke-vessel.json', 'legs', None, None),
    'letter-writer': ('content/ambient/letter-writer.json', 'legs', None, None),
    'panner': ('content/ambient/gulch-panner.json', 'legs', [0, 2, 3, 4, 5], 1),
}
# What a pose dropped that the figure holds in every other frame, put back from the drawn rest (errata 111: nothing
# appears or vanishes), under-painted only. key: {new pose index: box (x0, y0, x1, y1) in the drawn rest, at the
# operation's own scale}. Pratt with the hand held out (row 131) let the mallet go: it stands on its head by his boot,
# where the rest frame has it, the hand that held its handle now out.
# Figures with nothing purple in their design are despilled through and through, not only at the outline: Deke's
# glass is see-through and the generator let the key's magenta show inside it.
FULL_DESPILL = {'deke'}

UNDERPAINT = {'pratt-jump': {0: (0, 296, 100, 577)}}

# A correction (a reserve operation) supplies some of a Thad sheet's poses: key: (correction stage, {pose: its pose}).
# The blanket (row 136): the first try lifted the whole blanket by two corners at once, in brown check; the
# correction lifts one corner at a time, in the icon's red-and-cream stripes.
REPLACE = {'thad-back': ('thad-blanket', {4: 1, 5: 2})}

THAD = {'thad-back': ('art/actors/thad-idle-back', 'art/actors/thad-acted2-back.png', [1]),
        'thad-right': ('art/actors/thad-idle-right', 'art/actors/thad-acted2-right.png', [])}


def leftmost(path, n):
    """The first n figures from the left. The generator sometimes draws a spare copy after the last pose
    (Ozymandia's sheet has her rest again at its right end); figures_of keeps the n LARGEST groups, which can drop the
    pose for the spare. Every group at least a quarter the size of the largest is a figure; the first n of them in
    template order are the ones asked for."""
    m = 1 + n
    while True:
        try:
            got = figures_of(path, m)
        except AssertionError:
            break
        m += 1
    return figures_of(path, m - 1)[:n] if m - 1 >= n else figures_of(path, n)


def poses_in(key):
    """The new poses the operation's prompt numbers ("3. ..." lines), less any it redraws whole."""
    text = open(R(f'reference/acted-directions-2/{key}.txt')).read()
    return len(re.findall(r'^\d+\. .*NEW POSE|^\d+\. ', text, re.M)) - text.count('(REDRAWN)')


def lum(f):
    return float((f[alpha(f)][:, :3].astype(float) @ [0.299, 0.587, 0.114]).mean())


def lit(f, k):
    return np.dstack([np.clip(f[..., :3] * k, 0, 255).astype(np.uint8), f[..., 3]])


def man_of(rec):
    s = rec['sprite']
    if s.get('levelMan'):
        return s['levelMan']
    if s.get('figureHeight'):
        return s['figureHeight'] / (s.get('stature') or 1)
    out = subprocess.check_output(['node', '--experimental-strip-types', '-e', f"""
import('{ROOT}/engine/core/WalkBoxes.ts').then(({{WalkBoxes, heightIn}}) => {{
  const fs = require('fs'); const m = JSON.parse(fs.readFileSync('{ROOT}/content/manifest.json','utf8'));
  for (const p of m.rooms) {{ const r = JSON.parse(fs.readFileSync('{ROOT}/'+p,'utf8')); if (r.id !== '{rec['room']}') continue;
    const n = new WalkBoxes(r.walkBoxes, () => true).nearest({rec['x']}, {rec['y']}); console.log(n ? heightIn(n.box, {rec['y']}) : 0); }}
}});"""], stderr=subprocess.DEVNULL).decode().strip()
    return float(out)


def finish(c, block, ring):
    c = despill_edge(snap(c, block) if block > 1.05 else c, width=ring)
    assert spill_on_edge(c, width=ring) == 0, 'magenta survives the despill at the edge'
    return c


def figure(key, write):
    rec_path, how, redraw, breath_at = FIGURES[key]
    rec = json.load(open(R(rec_path)))
    s = rec['sprite']
    keep = R(f'{A}/{key}/old-sheet.png')
    if not os.path.exists(keep):
        Image.open(R(s['sheet'])).save(keep)
    old = np.asarray(Image.open(keep).convert('RGBA')).copy()
    frames = s['frames']
    x0, y0, w0, h0 = frames[0]
    rest_old = old[y0:y0 + h0, x0:x0 + w0]
    n_new = poses_in(key)
    n_drawn = (len(redraw) if redraw else 1) + n_new
    figs = leftmost(R(f'{A}/{key}/sheet.png'), 1 + n_drawn)[1:]
    gen_rest = figs[0]
    k = height(rest_old) / height(gen_rest)
    light = lum(rest_old) / lum(gen_rest)
    figs = [lit(scaled(f, k), light) for f in figs]
    gen_rest = figs[0]
    under = {i: tuple(round(v * k) for v in b) for i, b in UNDERPAINT.get(key, {}).items()}
    man = man_of(rec); block = man / N; ring = max(2, int(np.ceil(block)) + 1)
    if key in FULL_DESPILL:
        ring = 10 ** 4
    out = old.copy()
    report = {'scale': round(k, 4), 'light': round(light, 4), 'block': round(block, 3)}
    if redraw:                                           # the panner: every old frame replaced in place
        # A pose wider than its old cell (his swirl) has the whole sheet drawn smaller by the factor that fits it,
        # as tools/art/final-look-cut.py did for Pratt's raised mallet; the wiring re-measures his height.
        fit = min([1.0] + [frames[i][2] / figs[j].shape[1] for j, i in enumerate(redraw)]
                  + [(int(rows_of(rest_old)[-1]) + 1) / figs[j].shape[0] for j, i in enumerate(redraw)])
        if fit < 1:
            figs = [scaled(f, fit) for f in figs]
            gen_rest = figs[0]
            report['shrunkToFit'] = round(fit, 4)
        for i, (x, y, w, h) in enumerate(frames):
            out[y:y + h, x:x + w] = 0
        for j, i in enumerate(redraw):
            x, y, w, h = frames[i]
            ox, oy = place(rest_old, frames[0], gen_rest, figs[j], how)
            ox = min(max(ox, 0), w - figs[j].shape[1])        # the least sideways nudge that keeps it in its cell
            c = np.zeros((h, w, 4), np.uint8)
            pose = figs[j]
            sub = pose[max(0, -oy):h - oy, max(0, -ox):w - ox]
            assert alpha(sub).sum() == alpha(pose).sum(), f'{key} frame {i} leaves its cell'
            c[max(0, oy):max(0, oy) + sub.shape[0], max(0, ox):max(0, ox) + sub.shape[1]][alpha(sub)] = sub[alpha(sub)]
            out[y:y + h, x:x + w] = finish(c, block, ring)
        if breath_at is not None:
            x, y, w, h = frames[breath_at]; x0_, y0_, _, _ = frames[0]
            out[y:y + h, x:x + w] = breath_of(out[y0_:y0_ + h0, x0_:x0_ + w0])
        poses = figs[len(redraw):]
        report['redrawn'] = redraw
    else:
        poses = figs[1:]
    assert len(poses) == n_new, (len(poses), n_new)
    placed = [(p,) + place(rest_old, frames[0], gen_rest, p, how) for p in poses]
    side = max([0] + [max(-ox, ox + p.shape[1] - w0) for p, ox, oy in placed])
    top = max([0] + [-oy for p, ox, oy in placed])
    W, H = w0 + 2 * side, h0 + top
    Y = max(y + h for x, y, w, h in frames) + 2
    sheet = np.zeros((max(out.shape[0], Y + H + 2), max(out.shape[1], 2 + len(poses) * (W + 2)), 4), np.uint8)
    sheet[:out.shape[0], :out.shape[1]] = out
    rects = []
    for i, (p, ox, oy) in enumerate(placed):
        c = np.zeros((H, W, 4), np.uint8)
        X, Yp = ox + side, oy + top
        c[Yp:Yp + p.shape[0], X:X + p.shape[1]][alpha(p)] = p[alpha(p)]
        if i in under:
            bx0, by0, bx1, by1 = under[i]
            rx, ry = place(rest_old, frames[0], gen_rest, gen_rest, how)
            piece = gen_rest[by0:by1, bx0:bx1]
            region = c[ry + top + by0:ry + top + by1, rx + side + bx0:rx + side + bx1]
            put = alpha(piece) & ~alpha(region)
            region[put] = piece[put]
            report.setdefault('underpainted', []).append(i)
        c = finish(c, block, ring)
        fx = 2 + i * (W + 2)
        sheet[Y:Y + H, fx:fx + W] = c
        rects.append([fx, Y, W, H])
    if not redraw:
        assert np.array_equal(sheet[:old.shape[0], :old.shape[1]], old), 'an existing frame was touched'
    report.update({'cell': [W, H], 'grownTop': top, 'grownEachSide': side, 'newFrames': rects,
                   'firstNewIndex': len(frames), 'soleRowInCell': int(rows_of(rest_old)[-1]) + top})
    print(json.dumps({key: report}, default=int))
    if write:
        Image.fromarray(sheet).save(R(s['sheet']))


def thad(key, write):
    clip, out_path, shake = THAD[key]
    stand = np.asarray(Image.open(R(f'{clip}/idle-00.png')).convert('RGBA')).copy()
    rig = json.load(open(R(f'{clip}/rig.json')))
    t = height(stand)
    m = alpha(stand); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    shipped = stand[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    n_new = poses_in(key)
    figs = leftmost(R(f'{A}/{key}/sheet.png'), 1 + n_new)
    k = t / height(figs[0]); light = lum(shipped) / lum(figs[0])
    figs = [lit(scaled(f, k), light) for f in figs]
    block = rig['figure'][1] / N; ring = max(2, int(np.ceil(block)) + 1)
    sources = {i: (figs, i) for i in range(1, len(figs))}
    if key in REPLACE:
        stage, picks = REPLACE[key]
        cf = leftmost(R(f'{A}/{stage}/sheet.png'), 1 + max(picks.values()))
        ck = t / height(cf[0]); cl = lum(shipped) / lum(cf[0])
        cf = [lit(scaled(f, ck), cl) for f in cf]
        for i, j in picks.items():
            sources[i] = (cf, j)
    clip_frames = []
    for i in range(1, len(figs)):
        src_figs, j = sources[i]
        gx, gy = register(shipped, src_figs[0], 'feet'); px, py = register(src_figs[0], src_figs[j], 'feet')
        ox, oy = c[0] + gx + px, r[0] + gy + py
        canvas = np.zeros_like(stand); pose = src_figs[j]
        sub = pose[max(0, -oy):canvas.shape[0] - oy, max(0, -ox):canvas.shape[1] - ox]
        assert alpha(sub).sum() == alpha(pose).sum(), f'{key} pose {i} leaves the canvas'
        canvas[max(0, oy):max(0, oy) + sub.shape[0], max(0, ox):max(0, ox) + sub.shape[1]][alpha(sub)] = sub[alpha(sub)]
        clip_frames.append(finish(canvas, block, ring))
    # A derived tremble (row 80): the rod and the upper body one art pixel aside, the legs still.
    for i in shake:
        f = clip_frames[i - 1]; rr = rows_of(f); waist = rr[0] + (rr[-1] - rr[0]) * 55 // 100
        d = f.copy(); step = max(1, round(block))
        d[:waist] = 0; d[:waist, step:] = f[:waist, :-step]
        clip_frames.insert(i, d)
    Wc = stand.shape[1]
    strip = np.zeros((stand.shape[0], len(clip_frames) * Wc, 4), np.uint8)
    for i, f in enumerate(clip_frames):
        strip[:, i * Wc:(i + 1) * Wc] = f
    print(json.dumps({key: {'canvas': list(stand.shape[1::-1]), 'frames': len(clip_frames), 'block': round(block, 3),
                            'soles': [int(rows_of(f)[-1]) for f in clip_frames], 'restSole': int(rows_of(stand)[-1]),
                            'heights': [height(f) for f in clip_frames], 'out': out_path}}))
    if write:
        Image.fromarray(strip).save(R(out_path))


if __name__ == '__main__':
    key = sys.argv[1]
    (thad if key in THAD else figure)(key, '--write' in sys.argv)
