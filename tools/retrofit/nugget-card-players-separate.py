#!/usr/bin/env python3
"""Cut the four card players out of the feasibility-gate sheet, one asset each.

Tyler, 2026-09-12, ROOM 3 ARCHITECTURAL RESET: "Every player must resolve to his
own character asset. No character asset may contain table pixels, floor pixels,
wall pixels, background pixels, another patron, environmental shadow inherited
from a source location, or a rectangular or irregular environmental halo."

THE SHEET IS KEYED, NOT MATTED, AND THAT IS THE WHOLE POINT OF GENERATING ON
MAGENTA. There is no room behind these men to subtract and no outline to guess:
the background is one colour that appears nowhere on a person in dark wool,
lamplit skin or a cream shirt, so "is this pixel background?" is answered by the
pixel itself. That is the property the baked plate never had.

  1  KEY      Every edge pixel of a figure generated on a key field is a BLEND
              of the man and the field, so it is not fully his and not fully the
              field: alpha there is fractional. P = a.F + (1-a).K with K known
              gives a = 1 - (min(r, b) - g) / 255 for magenta, which is 1 on any
              pixel with no key in it and 0 on the field itself.
  2  UNPREMULTIPLY  and then F = (P - (1-a).K) / a recovers the man's own colour
              on those edge pixels. WITHOUT THIS STEP THE FIGURES WEAR A PINK
              RIM: measured on the first cut, the outermost 1.5 px ring was 82%
              magenta-signature at a mean of (78, 11, 74), falling to 0.3% in
              the interior. A simple green-limit despill was tried first and
              could not reach it, because those pixels were not spill -- they
              were a blend being treated as opaque.
  3  SPLIT    connected components of the alpha, largest four kept, left to
              right. Each becomes its own file, trimmed to its own bounding box
              with a 2 px margin, so nothing but him is in his asset.
  4  MEASURE  seated height, stand point and the two numbers a runtime actor
              needs -- his width, and where on his own bounding box the ground
              under him is.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, label, gaussian_filter, distance_transform_edt

SRC = 'art/staging/room-03/cast-card-players-01/source.png'
OUT = 'art/staging/room-03/cast-card-players-01/'
KEY = np.array([255.0, 0.0, 255.0])
HARD, SOFT = 46.0, 120.0      # keyed / kept, in RGB distance from the key
MIN_PART = 4000
MARGIN = 2
NAMES = ['card_1_flatcap', 'card_2_silver', 'card_3_young', 'card_4_spectacles']


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def main():
    img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
    H, W, _ = img.shape
    d = np.sqrt(((img - KEY) ** 2).sum(2))
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    keyed = 1.0 - np.clip((np.minimum(r, b) - g) / 255.0, 0, 1)
    # WHERE THE KEY IS ALLOWED TO ACT: within 3 px of a figure's outer boundary,
    # and nowhere else. A maroon waistcoat deep inside a man reads a little
    # magenta by this measure and must stay exactly as painted, so the interior
    # is forced opaque.
    #
    # DISTANCE FROM THE KEY COLOUR WAS THE FIRST GATE AND IT DOES NOT WORK: a
    # pixel that is one fifth field and four fifths dark coat sits 247 away from
    # magenta in RGB, far outside any sane threshold, and kept its whole fifth
    # of pink. Measured on that cut, the outer ring composited +30 (r+b)/2 - g
    # against an interior of 0.
    core = distance_transform_edt(keyed > 0.5) > 3.0
    alpha = np.where(core, 1.0, keyed)

    solid = binary_fill_holes(alpha > 0.9)
    lab, n = label(solid)
    sizes = np.bincount(lab.ravel()); sizes[0] = 0
    keep = np.argsort(sizes)[::-1][:4]
    keep = [k for k in keep if sizes[k] >= MIN_PART]
    order = sorted(keep, key=lambda k: np.nonzero(lab == k)[1].mean())
    print(f'{n} component(s); keeping {len(order)}: sizes {[int(sizes[k]) for k in order]}')
    if len(order) != 4:
        print('NOT FOUR FIGURES -- stopping'); sys.exit(2)

    # UNPREMULTIPLY: take the field back out of every blended pixel.
    a3 = np.clip(alpha, 0, 1)[:, :, None]
    safe = np.maximum(a3, 0.06)
    rgb = np.clip((img - (1.0 - a3) * KEY[None, None, :]) / safe, 0, 255)
    rgb = np.where(a3 >= 0.995, img, rgb)

    rec = {'schema': 1,
           'note': 'The four card players cut from the feasibility-gate sheet. One asset per man, '
                   'keyed off a flat magenta field, despilled, split by connected component and '
                   'trimmed to his own box. No table, chair, floor, wall or neighbour is in any of '
                   'them, because none was in the sheet.',
           'source': SRC, 'sourceSha256': sha(SRC),
           'key': {'colour': '#FF00FF', 'soft': SOFT,
                   'alpha': 'a = 1 - (min(r,b) - g)/255 inside the field neighbourhood',
                   'colour_recovery': 'unpremultiplied: F = (P - (1-a)K) / a'},
           'players': []}

    for k, name in zip(order, NAMES):
        m = (lab == k)
        grow = gaussian_filter(m.astype(np.float32), 1.2) > 0.02
        a = np.where(grow, alpha, 0.0)
        ys, xs = np.nonzero(a > 0.02)
        x0, x1 = max(0, xs.min() - MARGIN), min(W, xs.max() + 1 + MARGIN)
        y0, y1 = max(0, ys.min() - MARGIN), min(H, ys.max() + 1 + MARGIN)
        cut = np.dstack([rgb[y0:y1, x0:x1], (a[y0:y1, x0:x1] * 255)]).astype(np.uint8)
        path = f'{OUT}{name}.png'
        Image.fromarray(cut, 'RGBA').save(path)
        aa = cut[:, :, 3]
        sole = int(np.nonzero(aa > 40)[0].max())
        cols = np.nonzero(aa > 40)[1]
        rec['players'].append({
            'id': name, 'file': path, 'sha256': sha(path),
            'sheetBox': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
            'size': [int(x1 - x0), int(y1 - y0)],
            'opaquePx': int((aa > 200).sum()),
            'transparentFraction': round(float((aa < 250).mean()), 4),
            'partialEdgePx': int(((aa > 10) & (aa < 245)).sum()),
            'soleRow': sole,
            'standPoint': [int(round(cols.mean())), sole],
        })
        print(f'  {name:20s} {x1-x0:4d}x{y1-y0:4d}  opaque {int((aa>200).sum()):6d}  '
              f'transparent {100*(aa<250).mean():5.1f}%  soft edge {int(((aa>10)&(aa<245)).sum()):5d}')

    json.dump(rec, open(OUT + 'players.json', 'w'), indent=1)
    open(OUT + 'players.json', 'a').write('\n')


main()
