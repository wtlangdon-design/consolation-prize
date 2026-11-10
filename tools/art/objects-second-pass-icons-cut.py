"""Objects, second pass: seven item icons (reference/objects-second-pass/brief.md section 1; errata 250, doc 121 N-4).

objects-second-pass operation 1 drew seven objects in one row on magenta
(art/staging/objects-second-pass/op-1/sheet.png), left to right: a nail, oats, parsley, a capital B, Mr. Pike's
collar, a button, the room key. Each is keyed, cut and reduced by tools/art/item-icons-cut.py's own functions into a
60x40 cell, at ONE factor that fits the largest with a pixel of air, as tools/art/act2-papers-icons-cut.py fitted
Act II's five -- into a small sheet of its own beside art/ui/item-icons.png (art/ui/item-icons-objects-second-pass.png,
seven cells in a row, + .json). The objects are found by the magenta between them.

Every cell is refused if it is pixel-identical to any cell of the shipping sheet or of the side sheets beside it
(tools/check-item-names.mjs's rule). Nothing in content/ is touched.

Usage: objects-second-pass-icons-cut.py [--write]
"""
import glob, importlib.util, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/staging/objects-second-pass/op-1/sheet.png')
OUT = os.path.join(ROOT, 'art/ui/item-icons-objects-second-pass.png')
IDS = ['nail', 'oats', 'parsley', 'capital_b', 'pikes_collar', 'button', 'room_key']   # the brief's ids, left to right

spec = importlib.util.spec_from_file_location('icons', os.path.join(ROOT, 'tools/art/item-icons-cut.py'))
icons = importlib.util.module_from_spec(spec); spec.loader.exec_module(icons)
rgb = np.asarray(Image.open(SRC).convert('RGB'))
mask = icons.key_mask(rgb)
busy = mask.any(0); runs, s = [], None
for x, on in enumerate(busy):
    if on and s is None: s = x
    if not on and s is not None:
        if x - s > 20: runs.append((s, x))
        s = None
assert len(runs) == len(IDS), runs
boxes = []
for item, (x0, x1) in zip(IDS, runs):
    ys = np.nonzero(mask[:, x0:x1].any(1))[0]
    boxes.append((item, x0, int(ys[0]), x1 - x0, int(ys[-1] - ys[0] + 1)))
cw, ch = icons.CELL; air = icons.AIR
factor = max(max(w / (cw - 2 * air), h / (ch - 2 * air)) for _, _, _, w, h in boxes)
sheet = Image.new('RGBA', (cw * len(IDS), ch), (0, 0, 0, 0)); cells = {}
for i, box in enumerate(boxes):
    icon = Image.fromarray(icons.reduce(rgb, mask, box, factor), 'RGBA')
    sheet.alpha_composite(icon, (i * cw + (cw - icon.width) // 2, (ch - icon.height) // 2))
    cells[box[0]] = [i * cw, 0, cw, ch]
mine = np.asarray(sheet)
others = []
table = json.load(open(os.path.join(ROOT, 'content/ui/item-icons.json')))
ship = np.asarray(Image.open(os.path.join(ROOT, 'art/ui/item-icons.png')).convert('RGBA'))
others += [(k, ship[y:y + h, x:x + w]) for k, (x, y, w, h) in table['icons'].items()]
for side in glob.glob(os.path.join(ROOT, 'art/ui/item-icons-*.json')):
    if side == OUT.replace('.png', '.json'): continue
    t = json.load(open(side)); img = np.asarray(Image.open(os.path.join(ROOT, t['sheet'])).convert('RGBA'))
    others += [(k, img[y:y + h, x:x + w]) for k, (x, y, w, h) in t['icons'].items()]
for item, (x, y, w, h) in cells.items():
    same = [k for k, o in others if o.shape == (h, w, 4) and np.array_equal(o, mine[y:y + h, x:x + w])]
    assert not same, f'{item} is pixel-identical to {same}'
print(json.dumps({'factor': round(factor, 3), 'cells': cells, 'comparedWith': len(others)}))
if '--write' in sys.argv:
    sheet.save(OUT)
    json.dump({'sheet': 'art/ui/item-icons-objects-second-pass.png', 'cell': [cw, ch], 'icons': cells,
               'note': "Doc 121's seven icons (reference/objects-second-pass/brief.md section 1), objects-second-pass operation 1, cut by "
                       "tools/art/objects-second-pass-icons-cut.py with tools/art/item-icons-cut.py's own reduction, at one factor. "
                       "The main session moves the cells into the shipping sheet when it wires the items."},
              open(OUT.replace('.png', '.json'), 'w'), indent=2)
