"""The final look: each redrawn figure cut back into its own sheet (reference/final-look/brief.md sections 1, 2, 4, 5).

Each final-look operation drew, on magenta, Thad (the ruler, not shipped) and then the figure's distinct poses in its
sheet's order (tools/art/final-look-inputs.py). This keys the sheet on the distance from the magenta, takes each
figure as one group of nearby pieces (a rake's head stays with the man whose thin handle the key ate, which
tools/art/cast-unify-cut.py's column runs cut in two), and scales every pose by ONE factor (premultiplied box), the
one that makes the NEW rest pose exactly as tall, crown to sole, as the OLD rest pose: the figure is drawn at the size it was, and only its proportions change. Each pose is registered on the new rest
by its legs (tools/art/acted-poses.py's place()), the rest on the old rest the same way, and laid into the OLD sheet's
own frame rectangles, at the same positions and sizes, each frame's soles on the row its old frame's soles were on.
A breath frame, where the sheet had one, is derived again from the rest (one pixel, the waist up). Every frame is
despilled at its edge ring (the figure's own purples inside are kept) and refused if spill is left there, snapped to one level, and refused if it reaches outside its cell.

So the wiring is the file swapped (and a height re-measured): writes the sheet over the old one, same name.

Usage: final-look-cut.py KEY [--write]     KEY: pratt, pratt-jump, rule-keeper, ozymandia, pie-woman
"""
import json, os, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = open(os.path.join(ROOT, 'tools/art/act2-papers-cut.py')).read()
src = src[src.index('import json'):src.index('\nreport = {}')]
ns = {'__file__': os.path.join(ROOT, 'tools/art/act2-papers-cut.py')}
saved, sys.argv = sys.argv, ['act2-papers-cut.py']
exec(src, ns)
sys.argv = saved
place, register, snap, alpha, rows_of, N = (ns[k] for k in ('place', 'register', 'snap', 'alpha', 'rows_of', 'N'))
despill, spill_left, breath_of, opaque_rgb = (ns[k] for k in ('despill', 'spill_left', 'breath_of', 'opaque_rgb'))
from scipy import ndimage as ndi


def figures_of(path, n):
    """The sheet's figures, left to right, as RGBA crops at the sheet's own scale. Keyed on the distance from the
    magenta; the n largest groups of touching pieces are the figures, and every smaller piece (a rake's head
    whose thin handle the key ate) joins the figure nearest it along the row."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)
    m = opaque_rgb(a)
    # tools/art/cast-unify-cut.py's POCKET rule: key caught inside the drawing is backdrop (real purple sits well
    # under it, Ozymandia's feather among it).
    m &= ~((((a[..., 0] + a[..., 2]) / 2 - a[..., 1]) > 80) & (a[..., 2] > a[..., 1] + 30))
    m = ndi.binary_opening(m, iterations=1) | (m & ndi.binary_dilation(ndi.binary_opening(m, iterations=1), iterations=2))
    lab, k = ndi.label(ndi.binary_dilation(m, iterations=3))
    sizes = ndi.sum(m, lab, range(1, k + 1))
    big = [g + 1 for g in np.argsort(sizes)[::-1][:n]]
    assert len(big) == n and sizes[big[-1] - 1] > 0.25 * sizes[big[0] - 1], 'not as many figures as poses'
    boxes = {g: (lambda yx: (yx[1].min(), yx[1].max()))(np.nonzero(lab == g)) for g in range(1, k + 1)}
    owner = {g: g for g in big}
    for g in range(1, k + 1):                       # each small piece goes to the nearest figure along the row
        if g in owner or sizes[g - 1] < 30:
            continue
        x0, x1 = boxes[g]
        owner[g] = min(big, key=lambda b: max(0, boxes[b][0] - x1, x0 - boxes[b][1]))
    keep = sorted(big, key=lambda g: boxes[g][0])
    groups = {b: np.isin(lab, [g for g, o in owner.items() if o == b]) for b in keep}
    out = []
    for g in keep:
        mm = m & groups[g]
        ys, xs = np.nonzero(mm)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = a[y0:y1, x0:x1]; rgba[..., 3] = np.where(mm[y0:y1, x0:x1], 255, 0)
        out.append(rgba)
    return out


def scaled(f, k):
    im = Image.fromarray(f, 'RGBA')
    # premultiplied, so the key's colour does not bleed into the edge
    a = np.asarray(im).astype(float); a[..., :3] *= a[..., 3:] / 255
    im = Image.fromarray(a.astype(np.uint8), 'RGBA').resize((max(1, round(f.shape[1] * k)), max(1, round(f.shape[0] * k))), Image.BOX)
    b = np.asarray(im).astype(float); al = b[..., 3:]
    b[..., :3] = np.where(al > 0, b[..., :3] * 255 / np.maximum(al, 1), 0)
    b[..., 3] = np.where(al[..., 0] > 127, 255, 0)
    return np.clip(b, 0, 255).astype(np.uint8)

# key: (ambient record, the sheet frames the template drew in order, the frame derived as a breath or None, how)
FIGURES = {
    'pratt':       ('content/ambient/pratt.json',                [0, 2, 3, 4, 5, 6], 1, 'legs'),
    'pratt-jump':  ('content/ambient/pratt-jump.json',           [0, 2, 3, 4, 5],    1, 'legs'),
    'rule-keeper': ('content/ambient/gulch-rule-keeper.json',    [0, 2, 3, 4, 5, 6], 1, 'legs'),
    'ozymandia':   ('content/ambient/prosperity-ozymandia.json', [0, 1, 2, 3, 4],    None, 'legs'),
    'pie-woman':   ('content/ambient/pie-woman.json',            [0, 2, 3, 4],       1, 'legs'),
}


def ring_of(c, width=2):
    a = alpha(c)
    return a & ~ndi.binary_erosion(a, iterations=width)


# Figures whose own design has purple keep the narrow ring (Ozymandia's feather is the key's own hue, red equal to
# blue, and sits on her outline); the rest take a ring one art pixel deep, where the generator darkened its outline
# against the magenta.
PURPLE = {'ozymandia'}


def despill_edge(c, tolerance=6, width=2):
    """The key's spill is only where the figure met the magenta: its outer ring. Inside, red and blue over green is
    the figure's own colour (Ozymandia's purple feather), and is kept."""
    c = c.copy(); x = c[..., :3].astype(int)
    ex = np.minimum(x[..., 0], x[..., 2]) - x[..., 1]
    hit = ring_of(c, width) & (ex > tolerance)
    x[..., 0] -= np.where(hit, ex, 0); x[..., 2] -= np.where(hit, ex, 0)
    c[..., :3] = np.clip(x, 0, 255).astype(np.uint8)
    return c


def spill_on_edge(c, tolerance=6, width=2):
    x = c[..., :3].astype(int)
    return int((ring_of(c, width) & (np.minimum(x[..., 0], x[..., 2]) - x[..., 1] > tolerance)).sum())


def height(a):
    r = rows_of(a); return int(r[-1] - r[0] + 1)


def main(key, write):
    rec, picks, breath_at, how = FIGURES[key]
    s = json.load(open(os.path.join(ROOT, rec)))['sprite']
    # The sheet as it was before this redraw (main at 11345485), kept in staging so the cut reads the same old
    # frames however many times it is run.
    old = np.asarray(Image.open(os.path.join(ROOT, f'art/staging/final-look/{key}/old-sheet.png')).convert('RGBA')).copy()
    frames = s['frames']
    cell = lambda i: old[frames[i][1]:frames[i][1] + frames[i][3], frames[i][0]:frames[i][0] + frames[i][2]]
    rest_old = cell(0)
    target = height(rest_old)
    stage = os.path.join(ROOT, f'art/staging/final-look/{key}/sheet.png')
    figs = figures_of(stage, len(picks) + 1)                                # the ruler, then the poses
    # THE SAME LIGHT AS BEFORE: the operation drew the new drawing a little brighter than the old (Pratt by a tenth,
    # past Prosperity's night limit, tools/check-figure-light.mjs). Every pose's colour is scaled by one factor so
    # the new rest pose's mean light is the old rest pose's; the room's grading stays as it was set for him.
    lum = lambda f: float((f[alpha(f)][:, :3].astype(float) @ [0.299, 0.587, 0.114]).mean())
    light = lum(rest_old) / lum(figs[1])
    figs = [figs[0]] + [np.dstack([np.clip(f[..., :3] * light, 0, 255).astype(np.uint8), f[..., 3]]) for f in figs[1:]]
    k = target / height(figs[1])
    # If a pose would stand taller than its cell allows above its soles (Pratt's mallet raised overhead), the whole
    # sheet is drawn by the factor that fits it: the cells stay the size they are, and the rest comes out a little
    # shorter (the wiring re-measures the height).
    room_ = [int(rows_of(cell(i))[-1]) + 1 for i in picks]
    fit = min(r / (f.shape[0] * k) for r, f in zip(room_, figs[1:]))
    if fit < 1:
        k *= fit
    poses = [scaled(f, k) for f in figs[1:]]
    assert len(poses) == len(picks), (len(poses), picks)
    got = height(poses[0])
    report = {'levelBlock': None, 'oldRest': target, 'newRest': got, 'scale': round(k, 4), 'light': round(light, 4), 'shrunkToFit': round(min(1, fit), 4), 'frames': {}}
    out = old.copy()
    for i, (x, y, w, h) in enumerate(frames):
        out[y:y + h, x:x + w] = 0
    w0, h0 = frames[0][2], frames[0][3]
    laid = {}
    for k, i in enumerate(picks):
        ox, oy = place(rest_old, frames[0], poses[0], poses[k], how)       # in frame 0's box
        laid[i] = (poses[k], ox, oy)
    if breath_at is not None:
        laid[breath_at] = None
    for i, (x, y, w, h) in enumerate(frames):
        if i not in laid:
            raise SystemExit(f'{key}: frame {i} is neither drawn nor derived')
    # The level's block, as tests/one-level.test.mjs reads it for this record: the man the grid is snapped at
    # (`levelMan`, errata 234) where the record names one, else figureHeight / stature, over N = 115.
    sp = json.load(open(os.path.join(ROOT, rec)))['sprite']
    man = sp.get('levelMan') or sp['figureHeight'] / (sp.get('stature') or 1)
    block = man / N
    report['levelBlock'] = round(block, 4)
    canvases = {}
    for i, (x, y, w, h) in enumerate(frames):
        if laid[i] is None:
            continue
        pose, ox, oy = laid[i]
        sole_old = int(rows_of(cell(i))[-1])                                  # this frame's own sole row
        sole_rest = int(rows_of(rest_old)[-1])
        oy += sole_old - sole_rest
        oy += 0
        nudge = 0
        inside = lambda dx: alpha(pose[max(0, -oy):h - oy, max(0, -(ox + dx)):w - (ox + dx)]).sum()
        if inside(0) < alpha(pose).sum():           # a long tool past the cell: the least sideways nudge that fits it
            nudge = min(range(-60, 61), key=lambda dx: (alpha(pose).sum() - inside(dx), abs(dx)))
            ox += nudge
        c = np.zeros((h, w, 4), np.uint8)
        ys0, xs0 = max(0, oy), max(0, ox)
        sub = pose[ys0 - oy:min(pose.shape[0], h - oy), xs0 - ox:min(pose.shape[1], w - ox)]
        lost = int(alpha(pose).sum() - alpha(sub).sum())
        region = c[ys0:ys0 + sub.shape[0], xs0:xs0 + sub.shape[1]]
        keep = alpha(sub); region[keep] = sub[keep]
        ring = 2 if key in PURPLE else max(2, int(np.ceil(block)) + 1)
        c = despill_edge(snap(c, block) if block > 1.05 else c, width=ring)
        assert spill_on_edge(c, width=ring) == 0, f'{key} frame {i}: magenta survives the despill at the edge'
        canvases[i] = c
        report['frames'][i] = {'height': height(c), 'sole': int(rows_of(c)[-1]), 'oldSole': sole_old, 'lostOutsideCell': lost, 'nudged': nudge}
    if breath_at is not None:
        b = breath_of(canvases[0])
        canvases[breath_at] = b
        report['frames'][breath_at] = {'height': height(b), 'derived': 'breath of 0'}
    for i, (x, y, w, h) in enumerate(frames):
        out[y:y + h, x:x + w] = canvases[i]
    bad = {i: f['lostOutsideCell'] for i, f in report['frames'].items() if f.get('lostOutsideCell')}
    assert not bad, f'{key}: pixels fall outside the cell in frames {bad}'
    print(json.dumps({key: report}))
    if write:
        Image.fromarray(out).save(os.path.join(ROOT, s['sheet']))
    return out


if __name__ == '__main__':
    main(sys.argv[1], '--write' in sys.argv)
