"""PHASE 1.5 -- MAIN STREET PHYSICAL-PROP CORRECTIONS, DETERMINISTIC (doc 36 Q117).

Zero image operations. Every layer here is derived from art that already
exists and is authorized: the shipping plate's own trough, the plate's own
wood for the notice-board frame, and the shipping gilt lettering for the
Improvement Company sign. Each is a full-frame RGBA companion the candidate
room draws as an object state over the accepted plate, so the plate itself
is not touched (doc 35 section 6: no lettering in the plate; the engine puts
it there).

    python3 tools/retrofit/main-street-corrections.py

Writes art/staging/room-02/companions-01/*.png and a record beside them.
"""
import hashlib, json, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
SHIPPING = 'art/backgrounds/room-02-main-street.png'
GILT = 'art/objects/room-02/company-sign-gilt.png'
OUT = 'art/staging/room-02/companions-01'
W, H = 3610, 864
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
plate = Image.open(PLATE).convert('RGB')
ship = Image.open(SHIPPING).convert('RGB')
record = {'schema': 1, 'note': __doc__.strip(), 'inputs': {PLATE: sha(PLATE), SHIPPING: sha(SHIPPING), GILT: sha(GILT)}, 'layers': {}}


def blank():
    return Image.new('RGBA', (W, H), (0, 0, 0, 0))


def save(name, image, **info):
    path = f'{OUT}/{name}.png'
    image.save(path)
    bbox = image.getbbox()
    record['layers'][name] = {'path': path, 'sha256': sha(path), 'bbox': list(bbox) if bbox else None, **info}
    print(name, bbox)


# ---- 1. THE WATER TROUGH, from the shipping plate ---------------------------
# The shipping plate (signed off, errata 64a) draws a trough with three inches
# of water at its boardwalk edge, x 1913-2096, y 556-624. That is the one
# authorized trough in the game. It is cut by polygon, scaled by the ratio of
# the two plates' figure scales (a man is 105 at the shipping boardwalk line
# and 200 at the candidate's: 1.9, the same Lanczos-3 kernel errata 63 derives
# plates with), relit to the candidate's own mud, and seated in the street
# beside the east hitching rail, in the fringe of the saloon's pool, where a
# trough stands: by the rail the horses are tied to.
TROUGH_POLY = [(1913, 585), (1955, 556), (2078, 556), (2096, 590), (2096, 624), (1913, 624)]
SCALE = 1.9
TROUGH_FOOT = (1990, 688)  # left edge and the y its base sits on (the mud_far / mud_mid seam)
xs = [p[0] for p in TROUGH_POLY]; ys = [p[1] for p in TROUGH_POLY]
box = (min(xs), min(ys), max(xs), max(ys))
crop = ship.crop(box).convert('RGBA')
mask = Image.new('L', crop.size, 0)
ImageDraw.Draw(mask).polygon([(x - box[0], y - box[1]) for x, y in TROUGH_POLY], fill=255)
crop.putalpha(mask)
size = (round(crop.width * SCALE), round(crop.height * SCALE))
trough = crop.resize(size, Image.LANCZOS)
# RELIGHT: the shipping night grade is bluer and darker than the candidate's.
# Match the trough's wood to the candidate mud it stands in by per-channel
# gain, measured on the two plates' own mud beside each trough.
ship_mud = np.array(ship.crop((1840, 600, 1910, 640))).reshape(-1, 3).mean(0)
cand_mud = np.array(plate.crop((TROUGH_FOOT[0], TROUGH_FOOT[1] - 10, TROUGH_FOOT[0] + size[0], TROUGH_FOOT[1] + 30))).reshape(-1, 3).mean(0)
gain = np.clip(cand_mud / np.maximum(ship_mud, 1), 0.75, 1.35)
arr = np.array(trough).astype(float)
arr[..., :3] = np.clip(arr[..., :3] * gain, 0, 255)
trough = Image.fromarray(arr.astype('uint8'), 'RGBA')
layer = blank()
at = (TROUGH_FOOT[0], TROUGH_FOOT[1] - size[1])
# A ground-contact shadow under the base so it sits in the mud rather than on it.
shadow = Image.new('RGBA', (size[0], 8), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
for i in range(8):
    sd.line([(4 + i, i), (size[0] - 4 - i, i)], fill=(8, 6, 4, int(120 * (1 - i / 8))))
layer.alpha_composite(shadow, (at[0], TROUGH_FOOT[1] - 2))
layer.alpha_composite(trough, at)
save('water-trough', layer, source='shipping plate polygon', polygon=TROUGH_POLY, scale=SCALE, gain=[round(float(g), 3) for g in gain],
     placedAt=list(at), size=list(size), footY=TROUGH_FOOT[1])
record['trough'] = {'rect': [at[0], at[1], size[0], size[1]], 'obstacle': [at[0], TROUGH_FOOT[1] - 40, size[0], 44]}

# ---- 2. THE NOTICE BOARD FRAME ---------------------------------------------
# The candidate paints the notices as papers nailed straight onto the front
# wall of the small structure under the Clarion's porch, edge to edge with
# the wall, so the eye reads a papered wall fused into the next building. A
# framed board on that wall is what doc 05 describes ("Paper, in wind. A
# great deal of it" -- on a board). The frame's wood is sampled from the
# plate's own porch post so it belongs; a cast shadow on its right and lower
# edges lifts it off the wall.
FRAME = (1638, 392, 1774, 532)   # outer edge
FRAME_W = 7
post = np.array(plate.crop((1618, 420, 1632, 500))).reshape(-1, 3)
wood = tuple(int(v) for v in np.percentile(post, 60, axis=0))
wood_dark = tuple(int(v * 0.62) for v in wood)
wood_light = tuple(min(255, int(v * 1.35)) for v in wood)
layer = blank()
d = ImageDraw.Draw(layer)
x0, y0, x1, y1 = FRAME
# cast shadow first, then the frame over it
for i in range(5):
    a = int(110 * (1 - i / 5))
    d.line([(x1 + i, y0 + 6 + i), (x1 + i, y1 + i)], fill=(0, 0, 0, a))
    d.line([(x0 + 6 + i, y1 + i), (x1 + i, y1 + i)], fill=(0, 0, 0, a))
# The rails are the plate's own post wood, tiled, so the frame carries the
# plate's grain rather than a flat fill.
strip = plate.crop((1619, 420, 1619 + FRAME_W, 500)).convert('RGBA')
for yy in range(y0, y1, strip.height):
    layer.paste(strip.crop((0, 0, FRAME_W, min(strip.height, y1 - yy))), (x0, yy))
    layer.paste(strip.crop((0, 0, FRAME_W, min(strip.height, y1 - yy))), (x1 - FRAME_W + 1, yy))
rail = strip.rotate(90, expand=True)
for xx in range(x0, x1, rail.width):
    layer.paste(rail.crop((0, 0, min(rail.width, x1 - xx + 1), FRAME_W)), (xx, y0))
    layer.paste(rail.crop((0, 0, min(rail.width, x1 - xx + 1), FRAME_W)), (xx, y1 - FRAME_W + 1))
d = ImageDraw.Draw(layer)
d.line([(x0, y0), (x1, y0)], fill=wood_light + (255,), width=2)          # lit top edge
d.line([(x0, y0), (x0, y1)], fill=wood_light + (200,), width=1)          # lit left edge
d.line([(x0 + FRAME_W - 1, y0 + FRAME_W - 1), (x1 - FRAME_W + 1, y0 + FRAME_W - 1)], fill=wood_dark + (255,), width=2)  # inner shadow under the top rail
d.line([(x0 + FRAME_W - 1, y0 + FRAME_W - 1), (x0 + FRAME_W - 1, y1 - FRAME_W + 1)], fill=wood_dark + (255,), width=2)
d.line([(x0 + 2, y1 - 2), (x1 - 2, y1 - 2)], fill=wood_dark + (255,), width=2)  # dark bottom rail edge
d.line([(x1 - 2, y0 + 2), (x1 - 2, y1 - 2)], fill=wood_dark + (255,), width=2)
save('notices-frame', layer, frame=list(FRAME), frameWidth=FRAME_W, wood=list(wood))

# ---- 3. THE IMPROVEMENT COMPANY SIGN: lettering as a layer -------------------
# The board is blank in the plate, which is correct (doc 35 section 6). The
# lettering is the shipping gilt art, the one authored rendering of the words,
# scaled to the board's inner face (342-698 x 140-228) and given two states:
# WEATHERED (the base: gilt dulled, flaked by a seeded erosion -- "the only
# sign in town that has been painted twice", peeling) and GILT (Act III,
# "fresh gilt on the lettering"), each a companion over the same blank board.
BOARD = (342, 140, 698, 228)
gilt = Image.open(GILT)
if 'A' not in gilt.mode:
    g = np.array(gilt.convert('RGB')).astype(float)
    lum = g.mean(-1)
    alpha = np.clip((lum - 60) / 50, 0, 1) * 255
    gilt = Image.fromarray(np.dstack([g, alpha]).astype('uint8'), 'RGBA')
gilt = gilt.convert('RGBA')
bh = BOARD[3] - BOARD[1]
scale = bh / gilt.height
lettering = gilt.resize((round(gilt.width * scale), bh), Image.LANCZOS)
lx = (BOARD[0] + BOARD[2]) // 2 - lettering.width // 2
ly = BOARD[1]
# GILT: fresh, but in a night plate: pulled down to the plate's exposure.
arr = np.array(lettering).astype(float)
arr[..., :3] *= 0.82
fresh = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'), 'RGBA')
layer = blank(); layer.alpha_composite(fresh, (lx, ly))
save('company-sign-gilt', layer, board=list(BOARD), letteringAt=[lx, ly], letteringSize=list(fresh.size), scale=round(scale, 4))
# WEATHERED: dulled, desaturated, flaked. The flaking is a seeded hash so the
# layer is reproducible pixel for pixel.
arr = np.array(lettering).astype(float)
rgb = arr[..., :3]; grey = rgb.mean(-1, keepdims=True)
rgb = (rgb * 0.55 + grey * 0.45) * 0.62
rng = np.random.default_rng(20260905)
flake = rng.random(arr.shape[:2])
keep = (flake > 0.22).astype(float)
# flaking eats from the letter edges more than the centres: erode alpha a little
arr[..., :3] = rgb
arr[..., 3] = arr[..., 3] * (0.55 + 0.45 * keep)
weathered = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'), 'RGBA')
layer = blank(); layer.alpha_composite(weathered, (lx, ly))
save('company-sign-weathered', layer, board=list(BOARD), letteringAt=[lx, ly], seed=20260905)

# ---- 4. THE FUNERAL NOTICE (Act III), on the framed board ---------------------
# posted-notices-act3.png is the authored clean white sheet at the shipping
# scale (56x70); scaled by the same 1.9 and pinned over the papers, on the
# same frame, so the Act III state is the ordinary board plus one sheet --
# "It has the whole board's attention."
SHEET = 'art/objects/room-02/posted-notices-act3.png'
sheet = Image.open(SHEET).convert('RGBA')
sheet = sheet.resize((round(sheet.width * SCALE), round(sheet.height * SCALE)), Image.LANCZOS)
frame_layer = Image.open(f'{OUT}/notices-frame.png').convert('RGBA')
layer = frame_layer.copy()
sx = (FRAME[0] + FRAME[2]) // 2 - sheet.width // 2
sy = FRAME[1] + 14
layer.alpha_composite(sheet, (sx, sy))
record['inputs'][SHEET] = sha(SHEET)
save('notices-funeral', layer, sheetAt=[sx, sy], sheetSize=list(sheet.size), scale=SCALE)

json.dump(record, open(f'{OUT}/derivation.json', 'w'), indent=1)
open(f'{OUT}/derivation.json', 'a').write('\n')
print('record', f'{OUT}/derivation.json')
