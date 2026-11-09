"""Scene C's raccoon in Thad's coat, and the scene's two item icons (reference/act3-estate-sale/brief.md, operation 2;
doc 111 part C).

act3-estate-sale operation 2 painted, on a template of Thad's own stand-front frame repeated (errata 144's method),
Thad in his shirtsleeves holding his coat bundled with the raccoon in it: the template's first figure (the ruler,
which the generator also put in shirtsleeves, unused), then 2 braced, 3 the bundle lurching left, 4 the paw swiping
out. Below them, two icons: the coat bundled with a raccoon's face, and the hen.

  THE CLIP  art/actors/thad-coat-bundle-front.png: as Thad's pick-fit clip is cut (tools/art/acted-poses.py): the
            row cut where its first figure is as tall as his stand-front frame (626 px), each pose registered on his
            feet to that figure and laid on his stand-front canvas (709 x 691), snapped to his level. Frames, side by
            side: 0 braced (rest), 1 breath (derived), 2 lurching left, 3 the paw swiping.
            A STRIP, NOT A CLIP DIRECTORY: an art/actors/thad-* directory is one of Thad's declared clips
            (tools/build-actor-record.mjs, content/actors/thad.json), and an undeclared one fails the clip check.
            Declaring it is the wiring's; this hands over the frames. Split it into coat-bundle-00..03.png with a
            rig.json ({clip: 'coat-bundle', facing: 'front', figure: [189, 626], padding: 260}) when it is declared.
  THE ICONS art/ui/item-icons-act3-estate.png: two 60x40 cells, by tools/art/item-icons-cut.py's own key, BOX
            reduction and despill, at one factor that fits the larger with a pixel of air, as the Gulch's three
            were. A separate small sheet; nothing in art/ui/item-icons.png or content/ is touched.

Usage: act3-coat-cut.py [--write]
"""
import importlib.util, json, os, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/staging/act3-estate-sale/op-2/sheet.png')
CLIP = os.path.join(ROOT, 'art/actors/thad-coat-bundle-front.png')
ICONS = os.path.join(ROOT, 'art/ui/item-icons-act3-estate.png')
ICON_IDS = ['raccoon_in_coat', 'hen']           # left to right, as the operation's prompt asks
WRITE = '--write' in sys.argv

src = open(os.path.join(ROOT, 'tools/art/acted-poses.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/acted-poses.py')}
saved_argv, sys.argv = sys.argv, ['acted-poses.py']
exec(src[src.index('import json'):src.index('report = {}')], ns)
sys.argv = saved_argv
cut_row, register, snap, alpha, rows_of, N = (ns[k] for k in ('cut_row', 'register', 'snap', 'alpha', 'rows', 'N'))

# --- the clip ------------------------------------------------------------------------------------------------
stand = np.asarray(Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')).copy()
rig = json.load(open(os.path.join(ROOT, 'art/actors/thad-stand-front/rig.json')))
fw, fh = rig['figure']; pad = rig['padding']
target = int(rows_of(stand)[-1] - rows_of(stand)[0] + 1)
m = alpha(stand); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
shipped = stand[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
b = fh / N
with tempfile.TemporaryDirectory() as tmp:
    link = os.path.join(ROOT, 'art/staging/cast-unify/batch-act3-coat')
    os.makedirs(link, exist_ok=True)
    Image.open(SRC).save(os.path.join(link, 'sheet.png'))
    try:
        figs, cut_h, got = cut_row('act3-coat', 0, target, tmp)
    finally:
        os.unlink(os.path.join(link, 'sheet.png')); os.rmdir(link)
poses = []
for i in (1, 2, 3):
    gx, gy = register(shipped, figs[0], 'feet')
    px, py_ = register(figs[0], figs[i], 'feet')
    ox, oy = c[0] + gx + px, r[0] + gy + py_
    canvas = np.zeros_like(stand); pose = figs[i]
    ys = slice(max(0, oy), min(canvas.shape[0], oy + pose.shape[0])); xs = slice(max(0, ox), min(canvas.shape[1], ox + pose.shape[1]))
    sub = pose[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
    keep = alpha(sub); canvas[ys, xs][keep] = sub[keep]
    poses.append(snap(canvas, b))
rest = poses[0]
rr = rows_of(rest); mid = rr[0] + (rr[-1] - rr[0]) * 55 // 100          # cast-unify-cut's waist line
breath = rest.copy(); breath[:mid - 1] = rest[1:mid]; breath[mid - 1] = rest[mid]
clip = [rest, breath, poses[1], poses[2]]


def despill(a, tolerance=6):
    a = a.copy(); cc = a[..., :3].astype(int)
    ex = np.minimum(cc[..., 0], cc[..., 2]) - cc[..., 1]
    hit = (a[..., 3] > 0) & (ex > tolerance)
    cc[..., 0] -= np.where(hit, ex, 0); cc[..., 2] -= np.where(hit, ex, 0)
    a[..., :3] = np.clip(cc, 0, 255).astype(np.uint8)
    return a


def spill_left(a, tolerance=6):
    cc = a[..., :3].astype(int)
    return int(((a[..., 3] > 0) & (np.minimum(cc[..., 0], cc[..., 2]) - cc[..., 1] > tolerance)).sum())


clip = [despill(f) for f in clip]
assert all(spill_left(f) == 0 for f in clip), 'magenta survives the despill'
heights = [int(rows_of(f)[-1] - rows_of(f)[0] + 1) for f in clip]
soles = [int(rows_of(f)[-1]) for f in clip]

# --- the icons -----------------------------------------------------------------------------------------------
spec = importlib.util.spec_from_file_location('icons', os.path.join(ROOT, 'tools/art/item-icons-cut.py'))
icons = importlib.util.module_from_spec(spec); spec.loader.exec_module(icons)
full = np.asarray(Image.open(SRC).convert('RGB'))
# the strip: below the figures' row (the cut row's band), found as the magenta gap under it
busy = ~icons.key_mask(full).all(1) if icons.key_mask(full).mean() > 0.5 else icons.key_mask(full).any(1)
gaps = [y for y in range(1, len(busy)) if busy[y] and not busy[y - 1]]   # where each band of drawing begins
strip_y = gaps[-1] if gaps else 680
rgb = full[strip_y:]
mask = icons.key_mask(rgb)
saved = icons.GRID; icons.GRID = (len(ICON_IDS), 1)
boxes = icons.objects(rgb, mask, ICON_IDS)
icons.GRID = saved
cw, ch = icons.CELL; air = icons.AIR
factor = max(max(w / (cw - 2 * air), h / (ch - 2 * air)) for _, _, _, w, h in boxes)
sheet = Image.new('RGBA', (len(ICON_IDS) * cw, ch), (0, 0, 0, 0)); cells = {}
for i, box in enumerate(boxes):
    icon = Image.fromarray(icons.reduce(rgb, mask, box, factor), 'RGBA')
    sheet.alpha_composite(icon, (i * cw + (cw - icon.width) // 2, (ch - icon.height) // 2))
    cells[box[0]] = [i * cw, 0, cw, ch]

print(json.dumps({'clip': {'cutAt': [cut_h, got], 'target': target, 'block': round(b, 2), 'heights': heights, 'soles': soles,
                           'canvas': list(stand.shape[1::-1])},
                  'icons': {'stripY': int(strip_y), 'factor': round(factor, 3), 'cells': cells}}))
if WRITE:
    W, H = stand.shape[1], stand.shape[0]
    strip = np.zeros((H, len(clip) * W, 4), np.uint8)
    for i, a in enumerate(clip): strip[:, i * W:(i + 1) * W] = a
    Image.fromarray(strip).save(CLIP)
    sheet.save(ICONS)
    json.dump({'sheet': 'art/ui/item-icons-act3-estate.png', 'cell': [cw, ch], 'icons': cells,
               'note': "Scene C's two icons (reference/act3-estate-sale/brief.md), act3-estate-sale operation 2, cut by "
                       "tools/art/act3-coat-cut.py with tools/art/item-icons-cut.py's own reduction. The ids are this "
                       "tool's names; the main session names the items and moves the cells into the shipping sheet."},
              open(ICONS.replace('.png', '.json'), 'w'), indent=2)
