"""Duel Three's gathering, painted into Room 2's street in sections and cut by subtraction.

Tyler, 2026-11-06: "Do we need the desk at all?" (no -- ruled: no table) and
"all the characters in this scene are still a mess" (ruled: compose the
gathering as one picture). One edit of the whole street re-laid the buildings
and could not be subtracted (cast-unify 26), so the gathering is painted in
LOCAL sections, each an edit of a 700x467 crop of the street as it stands --
the plate, the figures that stay (Thad at his duel stand, the dog, the map
seller, the pie woman) and every section already accepted -- then cut where
the edit differs from that base.

  base <section>             write the section's base crop (and 1536x1024 copy)
  cut <section> <thresh>     cut the section's edit into layer-<section>.png,
                             a full-street RGBA layer of what was added

Sections are named in SECTIONS (crop box and the region people may be cut in).
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = os.path.join(ROOT, 'art/staging/cast-unify/batch-25')
SECTIONS = {
    'porch': {'box': (2560, 397, 3260, 864), 'region': (2600, 470, 3240, 864)},
    'left': {'box': (2000, 397, 2700, 864), 'region': (2010, 560, 2690, 864)},
    'right': {'box': (3000, 397, 3700, 864), 'region': (3010, 560, 3690, 864)},
}
ORDER = ['porch', 'left', 'right']


def room():
    for f in os.listdir(os.path.join(ROOT, 'content/rooms')):
        r = json.load(open(os.path.join(ROOT, 'content/rooms', f)))
        if r.get('id') == 'main_street':
            return r


def fixed_layer():
    """The figures that stay, drawn as the engine draws them."""
    W, H = 3700, 864
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    def put(img, x, y):
        layer.alpha_composite(img, (x - img.width // 2, y - img.height + 1))
    th = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-left/stand-00.png')).convert('RGBA')
    a = np.asarray(th)[..., 3] > 0
    ys, xs = np.where(a.any(1))[0], np.where(a.any(0))[0]
    th = th.crop((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))
    put(th.resize((round(th.width * 181 / th.height), 181), Image.LANCZOS), 3000, 790)
    man = {'map-seller': 150, 'pie-woman': 157}
    for rec in ('dog', 'map-seller', 'pie-woman'):
        d = json.load(open(os.path.join(ROOT, f'content/ambient/{rec}.json')))
        sp = d['sprite']; x, y, w, h = sp['frames'][0]
        f = Image.open(os.path.join(ROOT, sp['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
        if sp.get('figureHeight'):
            s = man[rec] * sp.get('stature', 1) / sp['figureHeight']
            f = f.resize((round(w * s), round(h * s)), Image.LANCZOS)
        put(f, d['x'], d['y'])
    return layer


def street(upto):
    """The plate, the fixed figures, and the accepted sections before `upto`."""
    plate = Image.open(os.path.join(ROOT, room()['background'])).convert('RGBA')
    plate.alpha_composite(fixed_layer())
    for name in ORDER[:ORDER.index(upto)]:
        p = f'{B}/layer-{name}.png'
        if os.path.exists(p):
            plate.alpha_composite(Image.open(p).convert('RGBA'))
    return plate


def base(name):
    os.makedirs(B, exist_ok=True)
    box = SECTIONS[name]['box']
    crop = street(name).crop(box).convert('RGB')
    crop.save(f'{B}/base-{name}.png')
    crop.resize((1536, 1024), Image.LANCZOS).save(f'{B}/base-{name}-1536.png')


def cut(name, thresh):
    box = SECTIONS[name]['box']; rx0, ry0, rx1, ry1 = SECTIONS[name]['region']
    w, h = box[2] - box[0], box[3] - box[1]
    basec = np.asarray(Image.open(f'{B}/base-{name}.png').convert('RGB')).astype(float)
    edit = np.asarray(Image.open(f'{B}/edit-{name}.png').convert('RGB').resize((w, h), Image.BOX)).astype(float)
    d = ndi.uniform_filter(np.abs(edit - basec).sum(-1), 5)
    allowed = np.zeros((h, w), bool)
    allowed[max(0, ry0 - box[1]):ry1 - box[1], max(0, rx0 - box[0]):rx1 - box[0]] = True
    keep = np.asarray(fixed_layer().crop(box))[..., 3] > 0
    allowed &= ~ndi.binary_dilation(keep, iterations=3)
    m = (d > thresh) & allowed
    m = ndi.binary_closing(m, iterations=3)
    m = ndi.binary_fill_holes(m) & allowed
    lab, n = ndi.label(m)
    sizes = ndi.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 600])
    m = ndi.binary_opening(m, iterations=1)
    layer = np.zeros((864, 3700, 4), np.uint8)
    sub = layer[box[1]:box[3], box[0]:box[2]]
    sub[..., :3] = edit.round().astype(np.uint8)
    sub[..., 3] = m * 255
    Image.fromarray(layer).save(f'{B}/layer-{name}.png')
    lab, n = ndi.label(m)
    print(json.dumps({'section': name, 'pieces': int(n), 'pixels': int(m.sum())}))


def grab(name, lo=35.0, hi=90.0, min_h=60):
    """Cut each new figure by GrabCut at the edit's own resolution.

    A plain threshold of the difference loses dark coats against the dark
    hotel wall (the judges' legs went) or takes their cast shadows. Each
    figure is found from the difference (a piece at least MIN_H tall: a lamp
    the edit nudged is not a figure), then GrabCut separates him from the wall
    by colour, seeded with the strong difference as figure and everything
    outside his box as street. Done at 1536x1024 and shrunk to the street's size.
    """
    import cv2
    box = SECTIONS[name]['box']; rx0, ry0, rx1, ry1 = SECTIONS[name]['region']
    w, h = box[2] - box[0], box[3] - box[1]
    E = np.asarray(Image.open(f'{B}/edit-{name}.png').convert('RGB'))
    Bs = np.asarray(Image.open(f'{B}/base-{name}-1536.png').convert('RGB'))
    k = E.shape[1] / w
    d = ndi.uniform_filter(np.abs(E.astype(float) - Bs.astype(float)).sum(-1), 7)
    allowed = np.zeros(d.shape, bool)
    allowed[int((ry0 - box[1]) * k):int((ry1 - box[1]) * k), int(max(0, rx0 - box[0]) * k):int((rx1 - box[0]) * k)] = True
    keep = np.asarray(fixed_layer().crop(box).resize((E.shape[1], E.shape[0]), Image.NEAREST))[..., 3] > 0
    keep = ndi.binary_dilation(keep, iterations=6)
    allowed &= ~keep
    seed = ndi.binary_closing((d > lo) & allowed, iterations=4)
    lab, n = ndi.label(seed)
    out = np.zeros(d.shape, bool)
    figs = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        ys, xs = sl
        if ys.stop - ys.start < min_h * k / 2.19 * 2.19 or (lab[sl] == i + 1).sum() < 1500:
            continue
        y0, y1 = max(0, ys.start - 14), min(d.shape[0], ys.stop + 6)
        x0, x1 = max(0, xs.start - 14), min(d.shape[1], xs.stop + 14)
        gc = np.full(d.shape, cv2.GC_BGD, np.uint8)
        gc[y0:y1, x0:x1] = cv2.GC_PR_BGD
        piece = (lab == i + 1)
        gc[piece] = cv2.GC_PR_FGD
        sure = ndi.binary_erosion((d > hi) & piece, iterations=2)
        gc[sure] = cv2.GC_FGD
        gc[keep] = cv2.GC_BGD
        bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        cv2.grabCut(cv2.cvtColor(E, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
        m = (gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)
        m = ndi.binary_opening(m, iterations=1)
        lab2, n2 = ndi.label(m)
        if n2:
            m = lab2 == (1 + int(np.argmax(ndi.sum(m, lab2, range(1, n2 + 1)))))
        m = ndi.binary_fill_holes(m)
        out |= m
        figs.append([int(box[0] + x0 / k), int(box[1] + y0 / k), int(box[0] + x1 / k), int(box[1] + y1 / k)])
    small = np.asarray(Image.fromarray(out.astype(np.uint8) * 255).resize((w, h), Image.BOX)) >= 128
    rgb = np.asarray(Image.fromarray(E).resize((w, h), Image.BOX))
    layer = np.zeros((864, 3700, 4), np.uint8)
    sub = layer[box[1]:box[3], box[0]:box[2]]
    sub[..., :3] = rgb
    sub[..., 3] = small * 255
    Image.fromarray(layer).save(f'{B}/layer-{name}.png')
    json.dump({'section': name, 'figures': figs}, open(f'{B}/layer-{name}.json', 'w'))
    print(json.dumps({'section': name, 'figures': figs}))


if __name__ == '__main__':
    if sys.argv[1] == 'grab':
        grab(sys.argv[2]); sys.exit(0)
    cmd, name = sys.argv[1], sys.argv[2]
    base(name) if cmd == 'base' else cut(name, float(sys.argv[3]))
