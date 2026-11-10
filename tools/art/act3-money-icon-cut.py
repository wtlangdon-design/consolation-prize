"""Act III polish: Mr. Pratt's two dollars and sixty cents, its item icon (reference/act3-polish/brief.md, picture 1).

act3-estate-sale operation 3 drew the money once, large, on magenta (art/staging/act3-estate-sale/op-3/sheet.png):
two silver dollars squared in one upright stack and a smaller stack of small coins beside it -- tidy stacks, which
no other money icon in the set is (the filing fee's loose pile, the pair of coins, the loan's sack, the linen
money's copper scatter). It is keyed, cut and reduced by tools/art/item-icons-cut.py's own functions into one
60x40 cell with a pixel of air, as tools/art/act3-coat-cut.py cut the hen and the coat, into its own small sheet
beside art/ui/item-icons.png. Nothing in art/ui/item-icons.png or content/ is touched.

Usage: act3-money-icon-cut.py [--write]
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/staging/act3-estate-sale/op-3/sheet.png')
OUT = os.path.join(ROOT, 'art/ui/item-icons-act3-polish.png')
IDS = ['pratt_money']           # this tool's name; the main session names the item

spec = importlib.util.spec_from_file_location('icons', os.path.join(ROOT, 'tools/art/item-icons-cut.py'))
icons = importlib.util.module_from_spec(spec); spec.loader.exec_module(icons)
rgb = np.asarray(Image.open(SRC).convert('RGB'))
mask = icons.key_mask(rgb)
# The two stacks stand apart, and item-icons-cut's objects() keeps only the longest unbroken run of drawing -- it
# took the dollars and dropped the small coins. One drawing, one box: everything drawn on the sheet.
ys, xs = np.nonzero(mask)
boxes = [(IDS[0], int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1))]
cw, ch = icons.CELL; air = icons.AIR
factor = max(max(w / (cw - 2 * air), h / (ch - 2 * air)) for _, _, _, w, h in boxes)
sheet = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
icon = Image.fromarray(icons.reduce(rgb, mask, boxes[0], factor), 'RGBA')
sheet.alpha_composite(icon, ((cw - icon.width) // 2, (ch - icon.height) // 2))
# not a copy of any shipping cell (tools/check-item-names.mjs fails pixel-identical cells)
ship = np.asarray(Image.open(os.path.join(ROOT, 'art/ui/item-icons.png')).convert('RGBA'))
table = json.load(open(os.path.join(ROOT, 'content/ui/item-icons.json')))
mine = np.asarray(sheet)
same = [k for k, (x, y, w, h) in table['icons'].items() if (w, h) == (cw, ch) and np.array_equal(ship[y:y + h, x:x + w], mine)]
assert not same, f'pixel-identical to {same}'
print(json.dumps({'factor': round(factor, 3), 'icon': [icon.width, icon.height], 'cell': [0, 0, cw, ch]}))
if '--write' in sys.argv:
    sheet.save(OUT)
    json.dump({'sheet': 'art/ui/item-icons-act3-polish.png', 'cell': [cw, ch], 'icons': {IDS[0]: [0, 0, cw, ch]},
               'note': "Mr. Pratt's two dollars and sixty cents (reference/act3-polish/brief.md), act3-estate-sale "
                       "operation 3, cut by tools/art/act3-money-icon-cut.py with tools/art/item-icons-cut.py's own "
                       "reduction. The id is this tool's name; the main session names the item and moves the cell into "
                       "the shipping sheet."},
              open(OUT.replace('.png', '.json'), 'w'), indent=2)
