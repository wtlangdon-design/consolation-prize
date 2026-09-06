"""PHASE 2A FINAL OPERATION: an isolated two-character correction source
(doc 36 Q131).

    python3 tools/retrofit/phase2a-bar-pair-prep.py

WHY THIS FILE EXISTS. The previous attempt masked a window over two men on the
four-man family sheet and asked the endpoint to repaint only inside it. The
prompt worked -- the men it drew were drawn in the vocabulary that was asked
for -- but the endpoint read a large rectangle of empty backdrop between
figures as permission to recompose the scene, and it returned two men at a new
scale with the Stove Man and Bar Patron 3 simply absent.

So the input topology changes and the art direction does not. Tyler's ruling:
build a source that contains ONLY the two men to be redrawn, so the two who
must not change are not in the request at all. A mask can be misread. An
absence cannot.

WHAT IS AND IS NOT DONE TO THE FIGURES. They are pasted at their NATIVE
resolution -- no resize, no resample, no filter of any kind. The cuts are the
authoritative retained assets the game draws today, and any resampling here
would put a softened or stair-stepped edge in front of the model in exactly the
operation whose whole subject is edge quality. The only thing this file adds is
flat magenta and a great deal of space between them.
"""
import hashlib, json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

CUTS = 'art/staging/room-03/cast-bar-stove-02'
OUT = 'art/staging/room-03/cast-bar-pair-01'
MAGENTA = (255, 0, 255, 255)          # doc 38 R3: this cast wears dark wool; green sits inside it
W, H = 1536, 1024                     # landscape: two upright men, natively sized, with room to spare
BASELINE = 880                        # the row both men's soles sit on

# The roles are read from the SHIPPING staging record, not from the numbering.
# "bar_2" and "bar_3" are ids, and an id is not a description of what a man is
# doing; the pose that has to survive this operation is the one the room draws.
staging = {c['id']: c for c in
           json.load(open('reference/room-03-candidate/nugget-staging.json'))['characters']}
who = [('bar-2', 'nugget_bar_2'), ('bar-3', 'nugget_bar_3')]

figures = [(cut, Image.open(f'{CUTS}/{cut}.png').convert('RGBA'), staging[ident])
           for cut, ident in who]
total = sum(im.width for _, im, _ in figures)
# Generous, deliberate separation: the gap between them is wider than either
# man, so the canvas cannot be mistaken for a composition.
gap = 340
margin = (W - total - gap) // 2
assert margin > 0 and gap > max(im.width for _, im, _ in figures), (margin, gap)

canvas = Image.new('RGBA', (W, H), MAGENTA)
placed = []
x = margin
for cut, im, record in figures:
    y = BASELINE - im.height
    assert y >= 0, f'{cut} is taller than the canvas allows'
    canvas.alpha_composite(im, (x, y))
    placed.append({'cut': f'{CUTS}/{cut}.png', 'id': record['id'], 'at': [x, y],
                   'size': [im.width, im.height], 'resized': False,
                   'pose': record['pose'], 'deployedFigureHeight': None})
    x += im.width + gap

sheets = {s['id']: s for s in json.load(open('art/staging/phase2a-sheets.json'))['sheets']}
for entry in placed:
    entry['deployedFigureHeight'] = sheets[entry['id']]['figureHeight']

os.makedirs(OUT, exist_ok=True)
canvas.convert('RGB').save(f'{OUT}/pair-source.png')

record = {
    'schema': 1,
    'purpose': "OWNER-AUTHORIZED (Tyler, 2026-09-06): the FINAL Phase 2A image operation. An "
               "isolated two-character correction source holding ONLY nugget_bar_2 and "
               "nugget_bar_3, so that Bar Patron 1 and the Stove Man are not in the request at "
               "all. Replaces the masked family-sheet method, which the endpoint recomposed.",
    'canvas': [W, H],
    'background': 'flat magenta #FF00FF, edge to edge',
    'baselineRow': BASELINE,
    'gapPx': gap,
    'marginPx': margin,
    'resampling': 'NONE. Both figures are pasted at native resolution from the retained cuts.',
    'figures': placed,
    'notInThisRequest': ['bar-1 (Bar Patron 1)', 'stove-man (the Stove Man)',
                         'the four card players', 'the landing man',
                         'any Room 3 environment art'],
    'out': f'{OUT}/pair-source.png',
    'sha256': sha(f'{OUT}/pair-source.png'),
    'sources': {f'{CUTS}/{cut}.png': sha(f'{CUTS}/{cut}.png') for cut, _ in who},
}
json.dump(record, open(f'{OUT}/pair-source.json', 'w'), indent=1, ensure_ascii=False)
open(f'{OUT}/pair-source.json', 'a').write('\n')
for entry in placed:
    print(f"  {entry['id']:16s} native {entry['size'][0]}x{entry['size'][1]} at {entry['at']}  "
          f"draws at {entry['deployedFigureHeight']}px in the room")
print(f'gap {gap}px, margins {margin}px  ->  {OUT}/pair-source.png')
