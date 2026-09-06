"""PHASE 2A FINAL VISUAL CORRECTION: the mask that makes "do not reopen the
accepted family members" structural rather than hopeful (doc 36 Q130).

    python3 tools/retrofit/phase2a-bar-fix-prep.py

Tyler authorized exactly ONE more `nugget-bar-stove-family` operation, for
`nugget_bar_2` and `nugget_bar_3` only, and said in the same breath to keep the
current Bar Patron 1 and Stove Man. A prompt asking the model to leave two of
four men alone is a request. A MASK is a guarantee: the endpoint regenerates
only where the mask is transparent and returns the rest of the source, so the
two accepted men cannot come back different even if the model would have drawn
them differently.

The convention is the one this repository already uses (phase 1.5E): alpha 0 is
the window the model may paint in, alpha 255 is kept.

The window is drawn from the extraction record's own boxes, not from numbers
typed in twice -- the figures were cut at those coordinates, so those are the
coordinates that are true.
"""
import hashlib, json, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

SHEET = 'art/staging/room-03/cast-bar-stove-02/source.png'
OUT = 'art/staging/room-03/cast-bar-stove-03'
# Clearance between the window's edge and the nearest kept figure. Wide enough
# that the model has room to redraw a shoulder or a hat brim, narrow enough
# that it never reaches a man it may not touch.
PAD = 28

boxes = {}
for sheet in json.load(open('art/staging/phase2a-extraction.json'))['sheets']:
    if sheet['source'] == SHEET:
        for figure in sheet['figures']:
            x, y, w, h = figure['fromSource']
            boxes[figure['id']] = (x, y, x + w, y + h)
assert set(boxes) == {'bar-1', 'bar-2', 'bar-3', 'stove-man'}, boxes

free = ['bar-2', 'bar-3']
keep = ['bar-1', 'stove-man']
x0 = min(boxes[i][0] for i in free) - PAD
x1 = max(boxes[i][2] for i in free) + PAD
y0 = min(boxes[i][1] for i in free) - PAD
y1 = max(boxes[i][3] for i in free) + PAD

im = Image.open(SHEET).convert('RGB')
x0, y0 = max(0, x0), max(0, y0)
x1, y1 = min(im.width, x1), min(im.height, y1)

# THE CLEARANCE IS ASSERTED, NOT ASSUMED. A window that touches a kept man is
# the one failure this file exists to prevent, and it must fail here rather
# than in the returned image.
for who in keep:
    kx0, ky0, kx1, ky1 = boxes[who]
    overlap = not (kx1 <= x0 or kx0 >= x1 or ky1 <= y0 or ky0 >= y1)
    assert not overlap, f'the free window {x0,y0,x1,y1} touches {who} at {boxes[who]}'
gaps = {who: (x0 - boxes[who][2] if boxes[who][2] <= x0 else boxes[who][0] - x1) for who in keep}

alpha = Image.new('L', im.size, 255)
ImageDraw.Draw(alpha).rectangle([x0, y0, x1 - 1, y1 - 1], fill=0)
mask = Image.new('RGBA', im.size, (0, 0, 0, 255))
mask.putalpha(alpha)
os.makedirs(OUT, exist_ok=True)
mask.save(f'{OUT}/edit-mask.png')

# THE TINT HAS TO BE SEE-THROUGH. `Image.paste` with a mask uses the MASK for
# blending and ignores the pasted image's own alpha, so a full-strength mask
# paints solid colour over the very thing the diagnostic exists to show. The
# free window is blended at a third instead, so a person can see WHICH two men
# are inside it.
diag = im.convert('RGBA')
diag.paste(Image.new('RGBA', im.size, (90, 220, 255, 255)), (0, 0),
           Image.eval(alpha, lambda v: 0 if v else 80))
draw = ImageDraw.Draw(diag)
for who, (bx0, by0, bx1, by1) in boxes.items():
    draw.rectangle([bx0, by0, bx1 - 1, by1 - 1],
                   outline=(120, 255, 160) if who in free else (255, 120, 120), width=4)
diag.convert('RGB').save('renders/opening-set-retrofit/phase2a-bar-fix-mask.png')

record = {
    'schema': 1,
    'purpose': "OWNER-AUTHORIZED (Tyler, 2026-09-06): the ONE additional nugget-bar-stove-family "
               "operation, a one-time exception over the ceiling of 2, for nugget_bar_2 and "
               "nugget_bar_3 ONLY. They are the two figures nearest the camera and the only two "
               "still outside Thad's feature vocabulary at matched deployed height.",
    'source': {SHEET: sha(SHEET)},
    'mask': f'{OUT}/edit-mask.png',
    'maskSha256': sha(f'{OUT}/edit-mask.png'),
    'freeWindow': [x0, y0, x1, y1],
    'pad': PAD,
    'freed': {who: list(boxes[who]) for who in free},
    'kept': {who: list(boxes[who]) for who in keep},
    'clearancePx': gaps,
    'mustRemainUnchanged': 'bar-1 (Bar Patron 1, seated on the stool with his cup) and stove-man '
                           '(the coat buttoned to the throat, hands open at the iron). Tyler: '
                           'keep their current retained assets; do not replace them merely '
                           'because a new sheet offers alternatives.',
    'diagnostic': 'renders/opening-set-retrofit/phase2a-bar-fix-mask.png',
}
json.dump(record, open(f'{OUT}/edit-mask.json', 'w'), indent=1)
open(f'{OUT}/edit-mask.json', 'a').write('\n')
print(f'free window {x0},{y0} -> {x1},{y1}  ({x1 - x0}x{y1 - y0})')
print('clearance to kept figures:', gaps)
print(f'{OUT}/edit-mask.png  ·  renders/opening-set-retrofit/phase2a-bar-fix-mask.png')
