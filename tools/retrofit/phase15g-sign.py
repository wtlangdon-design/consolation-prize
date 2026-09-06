"""PHASE 1.5G -- THE SIGN, REBUILT LETTER BY LETTER (doc 36 Q123).

    python3 tools/retrofit/phase15g-sign.py

Zero image operations. Tyler's third finding: after Phase 1.5F the lettering
still LOOKS crooked in the live room, whatever the residual angle measured.

WHY A LEVEL BLOCK CAN STILL READ AS CROOKED. 1.5F rotated the whole crop by
its measured slant. Rotating a raster by 1.4 degrees does not put the letters
on a line: each glyph lands where the rotation leaves it, a third of a pixel
here and two thirds there, and every letter keeps the vertical offset the old
angled board gave it. The BLOCK is level; the LETTERS still step up and down
the way they did on the shipping sign, and stepping letters are what a person
sees as crooked. It also resampled every letterform once, which softened them.

THE METHOD. The authored letterforms are kept exactly as drawn and MOVED,
never rotated and never resampled:

  1. the letters are cut from art/objects/room-02/company-sign-gilt.png on
     their own luminance ramp (95..125), which takes the glyphs and none of
     the source crop's wood;
  2. connected components are the glyphs -- 11 on line one (CONSOLATION) and
     19 pieces on line two (IMPROVEMENT COMPANY, one letter arriving in two);
  3. the two lines are separated by their own baselines, not by a horizontal
     cut, because the source is slanted;
  4. each line's slant is measured from its glyph bottoms by Theil-Sen (the
     median of every pairwise slope -- robust to a letter or two whose bottom
     is a serif or an overshoot), and each glyph is moved by whole pixels
     against that slope. A round letter keeps its overshoot; a flat letter
     keeps its flat foot; the LINE comes level;
  5. every glyph's foot is then set on its line's own median row exactly --
     a one-pixel optical overshoot is invisible at this size, and a one-pixel
     step, magnified onto the board, is precisely what reads as crooked;
  6. the two lines are set on exact rows, the block scaled once to the board's
     inner face and centred on it.

The result is one raster; both states are cut from it, so the weathered and
gilt states cannot differ in position or angle by a pixel.
"""
import hashlib, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
GILT = 'art/objects/room-02/company-sign-gilt.png'
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
OUT = 'art/staging/room-02/companions-04'
os.makedirs(OUT, exist_ok=True)
W, H = 3610, 864
FACE = (345, 143, 703, 225)     # the board's inner face on the live plate
INK_LO, INK_HI = 95.0, 125.0
WIDTH_SHARE = 0.82
LINE_GAP = 3                    # rows of clear air between the two lines, as authored


def theil_sen(xs, ys):
    slopes = [(ys[j] - ys[i]) / (xs[j] - xs[i]) for i in range(len(xs)) for j in range(i + 1, len(xs)) if xs[j] != xs[i]]
    return float(np.median(slopes)) if slopes else 0.0


source = Image.open(GILT).convert('RGB')
rgb = np.array(source).astype(float)
alpha = np.clip((rgb.mean(-1) - INK_LO) / (INK_HI - INK_LO), 0, 1)
label, count = ndimage.label(alpha > 0.5, structure=np.ones((3, 3)))
glyphs = []
for i in range(1, count + 1):
    ys, xs = np.where(label == i)
    if len(ys) < 8:
        continue
    glyphs.append({'id': i, 'x0': int(xs.min()), 'x1': int(xs.max()), 'y0': int(ys.min()), 'y1': int(ys.max()),
                   'cx': float(xs.mean()), 'bottom': int(ys.max()), 'px': int(len(ys))})

# LINE ASSIGNMENT BY THE SOURCE'S OWN SLANT: a horizontal cut would split a
# slanted line. Two clusters on (bottom - slope*cx), from a first pass over all
# glyph bottoms.
rough = theil_sen([g['cx'] for g in glyphs], [g['bottom'] for g in glyphs])
level_bottom = [g['bottom'] - rough * g['cx'] for g in glyphs]
split = (min(level_bottom) + max(level_bottom)) / 2
for g, lb in zip(glyphs, level_bottom):
    g['line'] = 0 if lb < split else 1

lines = [[g for g in glyphs if g['line'] == n] for n in (0, 1)]
report = []
moved = np.zeros(alpha.shape, float)
placed = []
for n, line in enumerate(lines):
    line.sort(key=lambda g: g['cx'])
    slope = theil_sen([g['cx'] for g in line], [g['bottom'] for g in line])
    ref = float(np.mean([g['cx'] for g in line]))
    for g in line:
        g['shift'] = -int(round(slope * (g['cx'] - ref)))
    base = float(np.median([g['bottom'] + g['shift'] for g in line]))
    # STEP 5, AND THE PART TYLER'S EYE INSISTED ON: every glyph's foot goes on
    # the line's own row exactly. A 1px optical overshoot on a round letter is
    # invisible at this size; a 1px step, magnified by the scale onto the
    # board, is the thing that reads as crooked. The line is the authority.
    for g in line:
        g['shift'] -= int(round((g['bottom'] + g['shift']) - base))
    after = [g['bottom'] + g['shift'] for g in line]
    report.append({'line': n, 'glyphs': len(line), 'slopeBefore': round(slope, 5),
                   'degreesBefore': round(float(np.degrees(np.arctan(slope))), 2),
                   'baselineRow': round(base, 1),
                   'spreadBefore': int(max(g['bottom'] for g in line) - min(g['bottom'] for g in line)),
                   'spreadAfter': int(max(after) - min(after)),
                   'shifts': [g['shift'] for g in line]})
    for g in line:
        piece = (label[g['y0']:g['y1'] + 1, g['x0']:g['x1'] + 1] == g['id'])
        value = alpha[g['y0']:g['y1'] + 1, g['x0']:g['x1'] + 1] * piece
        placed.append((g['x0'], g['y0'] + g['shift'], value, rgb[g['y0']:g['y1'] + 1, g['x0']:g['x1'] + 1]))

# COMPOSE: the glyphs on their new rows, in one raster, at source scale.
top = min(y for _, y, _, _ in placed)
bottom = max(y + v.shape[0] for _, y, v, _ in placed)
left = min(x for x, _, _, _ in placed)
right = max(x + v.shape[1] for x, _, v, _ in placed)
canvas = np.zeros((bottom - top, right - left, 4), float)
for x, y, value, colour in placed:
    ys, xs = y - top, x - left
    region = canvas[ys:ys + value.shape[0], xs:xs + value.shape[1]]
    take = value > region[..., 3]
    region[..., 3] = np.maximum(region[..., 3], value)
    region[..., :3][take] = colour[take]
lettering = Image.fromarray(np.clip(np.dstack([canvas[..., :3], canvas[..., 3] * 255]), 0, 255).astype('uint8'), 'RGBA')

fw, fh = FACE[2] - FACE[0], FACE[3] - FACE[1]
scale = (fw * WIDTH_SHARE) / lettering.width
if lettering.height * scale > fh * 0.80:
    scale = (fh * 0.80) / lettering.height
size = (round(lettering.width * scale), round(lettering.height * scale))
lettering = lettering.resize(size, Image.LANCZOS)
lx = FACE[0] + (fw - lettering.width) // 2
ly = FACE[1] + (fh - lettering.height) // 2

record = {'schema': 1, 'note': __doc__.strip(), 'inputs': {GILT: sha(GILT), PLATE: sha(PLATE)},
          'method': 'glyph-level: components moved by whole pixels against each line\'s Theil-Sen slope; no rotation, no per-glyph resampling',
          'boardInnerFace': list(FACE), 'lines': report,
          'placement': {'scale': round(scale, 4), 'size': list(lettering.size), 'at': [lx, ly],
                        'marginLeftRight': [lx - FACE[0], FACE[2] - (lx + lettering.width)],
                        'marginTopBottom': [ly - FACE[1], FACE[3] - (ly + lettering.height)]},
          'supersedes': 'art/staging/room-02/companions-03 (Phase 1.5F whole-crop rotation)', 'layers': {}}


def save(name, image, **info):
    path = f'{OUT}/{name}.png'
    image.save(path)
    record['layers'][name] = {'path': path, 'sha256': sha(path), 'bbox': list(image.getbbox()), **info}
    print(name, image.getbbox())


arr = np.array(lettering).astype(float); arr[..., :3] *= 0.82
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
layer.alpha_composite(Image.fromarray(np.clip(arr, 0, 255).astype('uint8'), 'RGBA'), (lx, ly))
save('company-sign-gilt', layer, state='gilt')

arr = np.array(lettering).astype(float)
rgbv = arr[..., :3]; grey = rgbv.mean(-1, keepdims=True)
arr[..., :3] = (rgbv * 0.55 + grey * 0.45) * 0.62
rng = np.random.default_rng(20260905)
arr[..., 3] = arr[..., 3] * (0.55 + 0.45 * (rng.random(arr.shape[:2]) > 0.22))
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
layer.alpha_composite(Image.fromarray(np.clip(arr, 0, 255).astype('uint8'), 'RGBA'), (lx, ly))
save('company-sign-weathered', layer, state='weathered', seed=20260905)

json.dump(record, open(f'{OUT}/sign-rebuild.json', 'w'), indent=1); open(f'{OUT}/sign-rebuild.json', 'a').write('\n')
for line in report:
    print(f"line {line['line']}: {line['glyphs']} glyphs, slant {line['degreesBefore']:+.2f} deg, "
          f"baseline spread {line['spreadBefore']} px -> {line['spreadAfter']} px")
print(f"lettering {lettering.size} at {(lx, ly)}; margins L/R {lx - FACE[0]}/{FACE[2] - (lx + lettering.width)} "
      f"T/B {ly - FACE[1]}/{FACE[3] - (ly + lettering.height)}")
