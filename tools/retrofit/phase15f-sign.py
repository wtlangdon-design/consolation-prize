"""PHASE 1.5F -- THE IMPROVEMENT COMPANY SIGN, ALIGNED TO ITS BUILDING (doc 36 Q122).

    python3 tools/retrofit/phase15f-sign.py

Zero image operations. Tyler's finding: the sign reads crooked against an
otherwise frontal facade.

THE DIAGNOSIS, MEASURED. The plate's physical board is LEVEL: its inner
shadow lines lie at y 142 and y 226 at every column from x 360 to x 700, and
its inner side shadows at x 344 and x 704. Two things in the LETTERING LAYER
are not.

  1. THE TYPE IS TILTED by about +1.4 degrees, falling to the right. The
     slant is inherited from art/objects/room-02/company-sign-gilt.png, the
     one authored rendering of the words -- a crop of the SHIPPING plate's
     sign, whose board was drawn at an angle. Measured on the letters alone
     (luminance > 110, which excludes the wood): line 1 cap-top +1.20 deg,
     line 1 baseline +1.80, line 2 cap-top +1.29, line 2 baseline +1.41.
  2. THE LAYER CARRIES THE SOURCE'S WOOD. Phase 1.5 derived its alpha as a
     luminance ramp, (lum - 60) / 50, over that crop -- so every wooden pixel
     brighter than 60 came too, at partial alpha: 6219 translucent pixels
     against 3594 solid letter ones. A slanted translucent rectangle of the
     old board, over the new level board. That is the second half of what
     reads as crooked, and why the sign also looked slightly pasted on.

THE CORRECTION, deterministic. The alpha ramp is lifted to 95..125, which
takes the letters with their anti-aliased edges and nothing of the wood (at
luminance 85 the source's top, bottom, left and right edge rows are already
empty). The lettering is de-rotated by its own measured slant, refined until
nothing is left to take out, then scaled and centred on the board's inner
face with even margins. The two states are cut from that ONE corrected
lettering, so they cannot drift apart: GILT is the fresh art at the plate's
night exposure, WEATHERED the same art dulled and flaked by the same seeded
erosion as Phase 1.5. The facade is not touched and no pixel of the plate
changes.
"""
import hashlib, json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
GILT = 'art/objects/room-02/company-sign-gilt.png'
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
OUT = 'art/staging/room-02/companions-03'
W, H = 3610, 864
FACE = (345, 143, 703, 225)     # the board's inner face, read off the plate
INK_LO, INK_HI = 95.0, 125.0    # the alpha ramp that takes letters and no wood
WIDTH_SHARE = 0.82              # the type's share of the face's width


def letters(image):
    """Alpha for the LETTERS of the source crop: a ramp above the wood."""
    lum = np.array(image.convert('RGB')).astype(float).mean(-1)
    return np.clip((lum - INK_LO) / (INK_HI - INK_LO), 0, 1)


def slant(alpha):
    """The mean of both lines' cap-top and baseline slopes, px per px."""
    ink = alpha > 0.5
    slopes = {}
    columns = {'l1t': [], 'l1b': [], 'l2t': [], 'l2b': []}
    for x in range(ink.shape[1]):
        idx = np.where(ink[:, x])[0]
        if not len(idx):
            continue
        runs = [[idx[0], idx[0]]]
        for v in idx[1:]:
            if v - runs[-1][1] <= 4:
                runs[-1][1] = v
            else:
                runs.append([v, v])
        if len(runs) < 2:
            continue
        columns['l1t'].append((x, runs[0][0])); columns['l1b'].append((x, runs[0][1]))
        columns['l2t'].append((x, runs[-1][0])); columns['l2b'].append((x, runs[-1][1]))
    for key, pts in columns.items():
        X = np.array([p[0] for p in pts], float); Y = np.array([p[1] for p in pts], float)
        slopes[key] = float(np.polyfit(X, Y, 1)[0])
    return float(np.mean(list(slopes.values()))), slopes


source = Image.open(GILT)
alpha = letters(source)
m, per_line = slant(alpha)
rgba = Image.fromarray(np.dstack([np.array(source.convert('RGB')), alpha * 255]).astype('uint8'), 'RGBA')


def level_at(angle):
    """The source turned by `angle`, cropped to its INK -- a resampled edge
    leaves a fringe of tiny alpha, so getbbox() would keep the whole rotated
    canvas -- and the slant left in it."""
    turned = rgba.rotate(angle, resample=Image.BICUBIC, expand=True)
    ink = np.array(turned)[..., 3].astype(float) / 255 > 0.5
    ys, xs = np.where(ink)
    turned = turned.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    return turned, slant(np.array(turned)[..., 3].astype(float) / 255)[0]


# PIL turns counter-clockwise for a positive angle and the type falls to the
# right (a positive slope in image coordinates), so the first estimate is the
# slant itself; the four measured lines do not agree exactly, so it is
# refined until nothing is left to take out.
angle = float(np.degrees(np.arctan(m)))
level, residual = level_at(angle)
for _ in range(6):
    if abs(np.degrees(np.arctan(residual))) <= 0.05:
        break
    angle += float(np.degrees(np.arctan(residual)))
    level, residual = level_at(angle)

fw, fh = FACE[2] - FACE[0], FACE[3] - FACE[1]
scale = (fw * WIDTH_SHARE) / level.width
if level.height * scale > fh * 0.80:
    scale = (fh * 0.80) / level.height
lettering = level.resize((round(level.width * scale), round(level.height * scale)), Image.LANCZOS)
lx = FACE[0] + (fw - lettering.width) // 2
ly = FACE[1] + (fh - lettering.height) // 2

record = {'schema': 1, 'note': __doc__.strip(), 'inputs': {GILT: sha(GILT), PLATE: sha(PLATE)},
          'diagnosis': {'plateBoardIsLevel': True, 'boardInnerFace': list(FACE),
                        'boardEdgesMeasured': {'innerTopY': 142, 'innerBottomY': 226, 'innerLeftX': 344, 'innerRightX': 704},
                        'sourceLetterSlopePxPerPx': {k: round(v, 4) for k, v in per_line.items()},
                        'sourceLetterSlantDegrees': round(float(np.degrees(np.arctan(m))), 2),
                        'phase15AlphaRamp': '(lum - 60) / 50 -- took the source wood at partial alpha',
                        'correctedAlphaRamp': f'(lum - {INK_LO:.0f}) / {INK_HI - INK_LO:.0f} -- letters only'},
          'placement': {'rotatedBy': round(angle, 3), 'residualDegrees': round(float(np.degrees(np.arctan(residual))), 3),
                        'scale': round(scale, 4), 'size': list(lettering.size), 'at': [lx, ly],
                        'marginLeftRight': [lx - FACE[0], FACE[2] - (lx + lettering.width)],
                        'marginTopBottom': [ly - FACE[1], FACE[3] - (ly + lettering.height)]},
          'layers': {}}


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
rgb = arr[..., :3]; grey = rgb.mean(-1, keepdims=True)
arr[..., :3] = (rgb * 0.55 + grey * 0.45) * 0.62
rng = np.random.default_rng(20260905)
arr[..., 3] = arr[..., 3] * (0.55 + 0.45 * (rng.random(arr.shape[:2]) > 0.22))
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
layer.alpha_composite(Image.fromarray(np.clip(arr, 0, 255).astype('uint8'), 'RGBA'), (lx, ly))
save('company-sign-weathered', layer, state='weathered', seed=20260905)

json.dump(record, open(f'{OUT}/sign-align.json', 'w'), indent=1); open(f'{OUT}/sign-align.json', 'a').write('\n')
print(f"slant {np.degrees(np.arctan(m)):+.2f} deg -> turned {angle:+.3f}, residual {np.degrees(np.arctan(residual)):+.3f} deg; "
      f"lettering {lettering.size} at {(lx, ly)}; margins L/R {lx - FACE[0]}/{FACE[2] - (lx + lettering.width)} "
      f"T/B {ly - FACE[1]}/{FACE[3] - (ly + lettering.height)}")
