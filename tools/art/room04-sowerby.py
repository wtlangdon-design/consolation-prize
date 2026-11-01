"""Room 4's Sowerby, cut from operation 4. No image operation.

THE SECOND DRAWING (Tyler, 2026-11-01: "the guy on the far left doesn't even
have legs"; he chose option 1, the room's fourth and last operation). The first
drawing (operation 3) was asked to stand him "behind the LEFT end of the long
table" with "the table hiding him below the waist" -- but the table does not
reach where he was drawn, so he floated, and his legs existed in no source.
Operation 4 asked for him FULL LENGTH, boots on the floor at the foot of the
back wall, in front of the chalkboard (reference/room-04/prompts/sowerby-02.txt),
edited into the room as it stands with Thad, Deke and the re-cut judges.

HIS COAT IS BLACK ON A DARK WALL, so a difference or a brightness threshold
alone cannot hold his outline -- the first lost his coat, the second took in
wall. He is separated with GrabCut (OpenCV, `pip install opencv-python-headless`),
seeded from both: what changed against the base above the chair line (head,
collar, raised arm, pencil) and his dark silhouette below it, with the wall
either side of him marked as certainly wall. The boxes are readings of the
derived picture (renders/room-04-sowerby-cut.png shows the result).

WHERE HE STANDS. The edit drew him where the room's front chair stands, and
that chair is in front of him: in the game the plate keeps its chair, so he is
moved 118 px right, into the gap between that chair and the table's left end
-- still at the back wall and the chalkboard, boots on the same floor line.

HIS HEIGHT IS THE ROOM'S CURVE. Room 4's depth note is a standing man of 470 at
y 600 and 560 at y 840; at his soles (y 513) that is 437, and the room declares
it as its `beyond` sample (reference/room-04/annotation.json). The edit drew
him 379, which beside the seated judges read as a boy; he is resampled once
to 437 (Lanczos, alpha re-thresholded), the same resampler every plate in the
room has been through.

THE PENCIL. Errata 75: "Sowerby holds the pencil", and the plate paints the
judges' pencil on the table for the room without him. While he is present, a
prop of bare table -- the plate's own wood beside it, shifted over the pencil
and matched row by row -- covers it. It is opaque, a piece of plate, and starts
at y 333: above that the pencil's tip is already under judge 1's hands, which
are drawn before it.
Operation 4 was also asked to remove the pencil, but Thad stood in front of it
in the base, so the edit never saw it.

Writes art/staging/room-04/sowerby/sowerby.png (rest, breath), pencil-cover.png
and sowerby.json.
"""
import json
import os
import subprocess

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-04')
DERIVED = f'{S}/sowerby-02/derived-1920x864.png'
BASE = f'{S}/sowerby-02/base-1920x864.png'
PLATE = os.path.join(ROOT, 'art/backgrounds/room-04-nugget-back.png')
GAP = 2
WORK = (380, 100, 640, 540)     # GrabCut's window
CHAIR_LINE = 300                # above it the base is plain wall and slate; below, the base's chair
SHIFT = 118                     # clear of the front chair's back, short of the table's end
HEIGHT = 437                    # the room's curve at his soles, y 513 (annotation `beyond`)
# BELOW THE HEM, TRACED. Tyler, 2026-11-01, on the first cut in the game: "The
# judge is missing part of his leg." Black trousers on a dark wall, with the
# chair's seat touching the left leg: GrabCut took in wall beside and between
# the legs, and 20 px of floor under the boots, and that wall, drawn 118 px
# from where it was painted, read as a piece out of his leg. So from the coat's
# hem down the outline is the derived picture's own, read off it brightened
# (renders/room-04-sowerby-legs.png): rows, then the columns his legs and boots
# fill, ending at the soles on the floor line.
HEM = 432
LEGS = [(HEM, 440, 448, 514),      # y0, y1, x0, x1: under the coat's hem, both legs
        (440, 496, 448, 470),      # the left leg, outline to outline
        (440, 490, 481, 514),      # the right leg. Between them, x 470-481, is wall: the
                                   # plank seams at y 452 and 475 cross it and stop at
                                   # each leg's outline, so the room shows through there
        (496, 514, 449, 469)]      # the left boot, from its top line to the floor line
# THE RIGHT BOOT rises from its heel to its toe: wall above that line stays out.
TOE = [(y, 481, 514 if y < 496 else min(533, 514 + 2 * (y - 496))) for y in range(490, 514)]
SOLES = 514
COAT_EDGE = (286, 421, 524, 540)   # rows, and the columns its outline is found in
PENCIL = (772, 333, 850, 376)   # the judges' pencil on the plate, with its shadow, below judge 1's hands
WOOD_FROM = 84                  # bare table this far right of it


def largest(mask):
    labels, count = ndi.label(mask)
    sizes = ndi.sum(mask, labels, range(1, count + 1))
    return ndi.binary_fill_holes(labels == (1 + int(np.argmax(sizes))))


d = np.asarray(Image.open(DERIVED).convert('RGB'))
b = np.asarray(Image.open(BASE).convert('RGB')).astype(int)
lum = 0.299 * d[..., 0] + 0.587 * d[..., 1] + 0.114 * d[..., 2]
change = ndi.uniform_filter(np.abs(d.astype(int) - b).sum(2).astype(float), size=5)

# SEEDS. Above the chair line: what changed against the base. Below it: his
# dark silhouette, the averaged brightness of his coat (about 21) under the
# wall's (about 29).
up = np.zeros(lum.shape, bool)
up[120:CHAIR_LINE, 410:600] = change[120:CHAIR_LINE, 410:600] > 26
dark = np.zeros(lum.shape, bool)
smooth = ndi.uniform_filter(lum, size=7)
dark[280:526, 410:565] = smooth[280:526, 410:565] < 24.5
rough = ndi.binary_fill_holes(ndi.binary_closing(up | dark, iterations=3))
rough = largest(ndi.binary_opening(rough, structure=np.ones((3, 3)), iterations=2))

X0, Y0, X1, Y1 = WORK
crop = np.ascontiguousarray(d[Y0:Y1, X0:X1][..., ::-1])
r = rough[Y0:Y1, X0:X1]
u = (ndi.uniform_filter(np.abs(d.astype(int) - b).sum(2).astype(float), size=3)[Y0:Y1, X0:X1] > 30) \
    & ((np.arange(Y1 - Y0)[:, None] + Y0) < CHAIR_LINE)
gc = np.full(crop.shape[:2], cv2.GC_BGD, np.uint8)
gc[ndi.binary_dilation(r, iterations=12)] = cv2.GC_PR_BGD
gc[ndi.binary_dilation(u, iterations=6) & (gc == cv2.GC_BGD)] = cv2.GC_PR_BGD
gc[r | u] = cv2.GC_PR_FGD
gc[ndi.binary_erosion(r, iterations=8)] = cv2.GC_FGD
gc[ndi.binary_erosion(u, iterations=2)] = cv2.GC_FGD


def wall(x0, x1, y0, y1):
    gc[max(0, y0 - Y0):max(0, y1 - Y0), max(0, x0 - X0):max(0, x1 - X0)] = cv2.GC_BGD


wall(541, X1, 268, Y1)                    # beneath the raised arm, right of the coat
wall(X0, 409, 290, Y1)                    # left of the coat
wall(X0, 432, 446, Y1)                    # either side of the legs and boots
wall(529, X1, 446, Y1)
bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
cv2.grabCut(crop, gc, None, bgm, fgm, 8, cv2.GC_INIT_WITH_MASK)
mask = np.zeros(lum.shape, bool)
mask[Y0:Y1, X0:X1] = largest(ndi.binary_opening((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), iterations=1))

# THE COAT'S RIGHT EDGE, FOLLOWED. Tyler, on the traced legs: "The one leg is
# still cut off on the side." Below the elbow the wall marked certain stopped at
# x 541, a ruled line, and GrabCut kept the 6 px of wall between it and the
# coat: a straight strip down his side that, 118 px from where it was painted,
# read as his side sliced off. The coat has its own dark outline at x 527-536;
# each row stops there, and the right panel stops at its hem, y 421.
lum_v = ndi.uniform_filter1d(lum, size=3, axis=0)
for y in range(COAT_EDGE[0], COAT_EDGE[1]):
    x = COAT_EDGE[2] + int(np.argmin(lum_v[y, COAT_EDGE[2]:COAT_EDGE[3]]))
    mask[y, x + 1:] = False
mask[COAT_EDGE[1]:, LEGS[0][3]:] = False
mask[HEM:, :] = False
for y0, y1, x0, x1 in LEGS:
    mask[y0:y1, x0:x1] = True
for y, x0, x1 in TOE:
    mask[y, x0:x1] = True
ys, xs = np.where(mask)
t, bot, l, rt = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
assert bot == SOLES, bot
fig = np.asarray(Image.open(DERIVED).convert('RGBA'))[t:bot, l:rt].copy()
fig[..., 3] = np.where(mask[t:bot, l:rt], 255, 0)
drawn = bot - t
img = Image.fromarray(fig)
scaled = img.resize((round(img.width * HEIGHT / drawn), HEIGHT), Image.LANCZOS)
a = np.asarray(scaled).copy()
a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
a[a[..., 3] == 0] = 0
os.makedirs(f'{S}/sowerby', exist_ok=True)
f0 = f'{S}/sowerby/frame-0.png'
f1 = f'{S}/sowerby/frame-1.png'
Image.fromarray(a).save(f0)
subprocess.run(['python3', os.path.join(ROOT, 'tools/rig/ambient-breath.py'), f0, f1], check=True)
h, w = a.shape[:2]
sheet = np.zeros((h + 2 * GAP, 2 * w + 3 * GAP, 4), np.uint8)
sheet[GAP:GAP + h, GAP:GAP + w] = a
sheet[GAP:GAP + h, 2 * GAP + w:2 * GAP + 2 * w] = np.asarray(Image.open(f1).convert('RGBA'))
Image.fromarray(sheet).save(f'{S}/sowerby/sowerby.png')
os.remove(f0)
os.remove(f1)
feet = int(bot - 1)
centre = int((l + rt) // 2 + SHIFT)

# THE PENCIL COVER, drawn while he is present.
plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(float)
px0, py0, px1, py1 = PENCIL
patch = np.zeros((py1 - py0, px1 - px0, 4), np.uint8)
for y in range(py0, py1):
    target = np.concatenate([plate[y, px0 - 12:px0 - 3], plate[y, px1 + 3:px1 + 12]]).mean(0)
    source = plate[y, px0 + WOOD_FROM - 12:px1 + WOOD_FROM + 12].mean(0)
    patch[y - py0, :, :3] = np.clip(plate[y, px0 + WOOD_FROM:px1 + WOOD_FROM] + (target - source), 0, 255)
patch[..., 3] = 255
Image.fromarray(patch).save(f'{S}/sowerby/pencil-cover.png')

record = {
    'sheet': 'art/staging/room-04/sowerby/sowerby.png',
    'frames': [[GAP, GAP, int(w), int(h)], [2 * GAP + w, GAP, int(w), int(h)]],
    'anchor': {'x': centre, 'y': feet},
    'drawnHeight': int(drawn), 'height': HEIGHT, 'shift': SHIFT,
    'cutBox': [int(l), int(t), int(rt - l), int(drawn)], 'pixels': int(mask.sum()),
    'pencilCover': {'staged': 'art/staging/room-04/sowerby/pencil-cover.png',
                    'x': (px0 + px1) // 2, 'y': py1 - 1, 'frames': [[0, 0, px1 - px0, py1 - py0]]},
    'source': 'room-04 attempt 4 (art/staging/room-04/sowerby-02/source.png), derived with the room crop',
}
json.dump(record, open(f'{S}/sowerby/sowerby.json', 'w'), indent=1)

view = np.asarray(Image.open(DERIVED).convert('RGB'))[t - 10:bot + 10, l - 10:rt + 10].copy()
view[~mask[t - 10:bot + 10, l - 10:rt + 10]] = [255, 0, 255]
Image.fromarray(view).resize((view.shape[1] * 2, view.shape[0] * 2), Image.NEAREST).save(
    os.path.join(ROOT, 'renders/room-04-sowerby-cut.png'))
print(json.dumps({k: record[k] for k in ('frames', 'anchor', 'drawnHeight', 'height', 'pixels')}))

# The reading the legs were traced from: the derived picture brightened, with the traced outline.
from PIL import ImageDraw, ImageEnhance
legs = ImageEnhance.Brightness(Image.open(DERIVED).convert('RGB').crop((420, 400, 540, 530))).enhance(3.0)
legs = legs.resize((960, 1040), Image.NEAREST)
pen = ImageDraw.Draw(legs)
for y0, y1, x0, x1 in LEGS + [(y, y + 1, x0, x1) for y, x0, x1 in TOE]:
    pen.rectangle(((x0 - 420) * 8, (y0 - 400) * 8, (x1 - 420) * 8 - 1, (y1 - 400) * 8 - 1), outline=(255, 0, 255))
legs.save(os.path.join(ROOT, 'renders/room-04-sowerby-legs.png'))
