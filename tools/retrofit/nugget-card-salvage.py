#!/usr/bin/env python3
"""Salvage the card cluster as Room 3's canonical card composition.

Tyler, 2026-09-11: the rejected cluster-card-01 generation becomes canon. The
one required repair is deterministic and carries no image operation: the
endpoint laid a PLANK floor under the table and the Nugget has a dirt floor.

Method, floor band only:

  out = plateDirt * shadow            where the band reads as floor
  out = newArt                        where the band reads as an object

`shadow` is the new art's own low-frequency floor luminance divided by a
per-row high percentile of itself, so the table's and chairs' cast shadows
survive while the floor's overall brightness and grain come from the plate.
Nothing is synthesised: every floor pixel that ships is a Nugget dirt pixel
multiplied by a number between 0.35 and 1.15.
"""
import json, hashlib, sys
import numpy as np
from PIL import Image, ImageFilter

PLATE = 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
CARD  = 'art/staging/room-03/cluster-card-01/source.png'
MASK  = 'art/staging/room-03/cluster-card-01/edit-mask.png'
CROP  = (655, 110)          # plate origin of the cluster canvas
SCALE = 2

FLOOR_TOP   = 505           # plate row the dirt substitution starts at
FADE        = 20            # rows of floor-only cross-fade below FLOOR_TOP
CLEAN_TOP   = 526           # first plate row of guaranteed-clean open dirt
CLEAN_BOT   = 622           # last

OUT = 'art/staging/room-03/card-salvage/'

def sha(p):
    return hashlib.sha256(open(p,'rb').read()).hexdigest()

def blur(a, r):
    from scipy.ndimage import gaussian_filter
    return gaussian_filter(a.astype(np.float32), r, mode='nearest')

def main():
    import os
    os.makedirs(OUT, exist_ok=True)
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(np.float32)
    card  = np.asarray(Image.open(CARD ).convert('RGB')).astype(np.float32)
    mask  = np.asarray(Image.open(MASK ).convert('RGBA'))[:,:,3]

    # the cluster canvas is an integer x2 of the plate: fold it back exactly
    h, w, _ = card.shape
    ch, cw = h // SCALE, w // SCALE
    new = card.reshape(ch, SCALE, cw, SCALE, 3).mean((1,3))

    free = mask < 128
    fy, fx = np.nonzero(free)
    x0, x1 = CROP[0] + fx.min()//SCALE, CROP[0] + fx.max()//SCALE
    y0, y1 = CROP[1] + fy.min()//SCALE, CROP[1] + fy.max()//SCALE
    print(f'free window -> plate x {x0}..{x1}  y {y0}..{y1}')

    # ---- floor band -------------------------------------------------------
    by0, by1 = FLOOR_TOP, y1 + 1
    bx0, bx1 = x0, x1 + 1
    band = new[by0-CROP[1]:by1-CROP[1], bx0-CROP[0]:bx1-CROP[0]]
    BH, BW, _ = band.shape
    L = band.mean(2)

    # WHAT TO REPLACE, decided by local structure rather than by recognising
    # furniture. A plank floor is flat: its seams are long horizontal lines and
    # its grain is shallow. A chair leg, a stretcher or a boot is not flat at
    # any scale. So the seams are suppressed first -- otherwise a seam would
    # protect itself by being the very structure the test looks for -- and what
    # is still flat afterwards is floor and gets the Nugget's dirt.
    from scipy.ndimage import median_filter, uniform_filter, minimum_filter
    med = median_filter(L, size=31, mode='nearest')

    vmed = median_filter(L, size=(9, 1), mode='nearest')     # vertical median
    seam = (vmed - L) > 1.5
    runs = uniform_filter(seam.astype(np.float32), size=(1, 81), mode='nearest')
    seam &= runs > 0.50                                       # long and horizontal
    Lf = np.where(seam, vmed, L)

    k = 11
    mu = uniform_filter(Lf, k, mode='nearest')
    var = np.maximum(uniform_filter(Lf * Lf, k, mode='nearest') - mu * mu, 0.0)
    std = np.sqrt(var)
    flat = np.clip((6.5 - std) / 3.0, 0.0, 1.0)
    flat = minimum_filter(flat, size=7, mode='nearest')        # margin round legs
    obj = flat < 0.5

    # the floor's own shading, with the furniture filled in, so the table's and
    # the chairs' cast shadows survive onto the dirt that replaces the planks
    lp = blur(np.where(obj, med, Lf), 22.0)
    base = np.percentile(lp, 88, axis=1, keepdims=True)
    base = blur(np.repeat(base, BW, axis=1), 30.0)
    shadow = np.clip(lp / np.maximum(base, 1e-3), 0.35, 1.15)

    # clean dirt source, mirrored upward for rows above CLEAN_TOP
    rows = []
    for py in range(by0, by1):
        if py >= CLEAN_TOP:
            rows.append(min(py, CLEAN_BOT))
        else:
            rows.append(min(CLEAN_TOP + (CLEAN_TOP - py), CLEAN_BOT))
    dirt = plate[rows, bx0:bx1, :]

    repaired = dirt * shadow[:, :, None]
    repaired = np.clip(repaired, 0, 255)

    # Substitute only where the floor is lit enough for a plank to be legible.
    # Under the table the room is at luminance 13 and a seam cannot be seen at
    # all; replacing texture nobody can read would only risk a visible join.
    t = np.clip((np.arange(BH)) / float(FADE), 0, 1)[:, None]
    lit = np.clip((med - 16.0) / 10.0, 0.0, 1.0)
    w = (t * lit * flat)[:, :, None]
    out_band = band * (1 - w) + repaired * w

    composed = plate.copy()
    composed[y0:y1+1, x0:x1+1] = new[y0-CROP[1]:y1+1-CROP[1], x0-CROP[0]:x1+1-CROP[0]]
    composed[by0:by1, bx0:bx1] = out_band

    Image.fromarray(np.clip(composed,0,255).astype(np.uint8)).save(OUT+'plate-card-baked.png')
    Image.fromarray((obj*255).astype(np.uint8)).save(OUT+'floor-object-mask.png')

    rec = {
      'schema': 1,
      'note': 'Card cluster salvaged as canon. Free window blitted into the accepted '
              'plate at an integer x2; plank floor replaced by plate dirt modulated by '
              "the new art's own shadow field. No image operation.",
      'plate': PLATE, 'plateSha256': sha(PLATE),
      'cluster': CARD, 'clusterSha256': sha(CARD),
      'freeWindowPlate': [int(x0), int(y0), int(x1), int(y1)],
      'floorBandPlate': [int(bx0), int(by0), int(bx1-1), int(by1-1)],
      'floorTop': FLOOR_TOP, 'fadeRows': FADE,
      'cleanDirtRows': [CLEAN_TOP, CLEAN_BOT],
      'objectPixels': int(obj.sum()), 'bandPixels': int(obj.size),
      'out': OUT+'plate-card-baked.png',
    }
    rec['outSha256'] = sha(rec['out'])
    json.dump(rec, open(OUT+'salvage.json','w'), indent=1)
    print(json.dumps({k:v for k,v in rec.items() if k!='note'}, indent=1))

main()
