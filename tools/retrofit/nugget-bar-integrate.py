#!/usr/bin/env python3
"""Integrate the ONE authorized bar-cluster operation into Room 3's plate.

The return leg of the send: the 1536x1024 endpoint image is resized back to the
1024x683 crop it was drawn from and laid at plate (896,181).

WHY THE WHOLE BAR QUADRANT IS TAKEN AND NOT ONLY THE FREE WINDOW. The endpoint
held the room -- 6.39 of 255 mean over 880,880 kept pixels, best uniform shift
zero, against 26.14 and a reversed counter slope on the call this replaces --
but inside the kept strip nearest the window it did two things the mask was
never going to stop: it carried the new brass foot rail on past the window edge
and it dropped the far stool. Blitting only the window therefore leaves a rail
that begins in mid-air at plate x 1270 and a counter with a step in it at
x 1860. Taking the quadrant from x 1176 -- right of the card group, left of
anything the men touch -- gives a rail that runs the bar's whole length, a
counter with no join in it, and exactly three stools. The stairs come back
tread for tread, which is what the landing man stands on, and the seam at
x 1176 crosses open dirt floor and blank wall where the residual is 2 to 4.

THE ONE FACE CORRECTION, and it is four pixels. The standing man's near eye
came back with a catchlight at luminance 184 inside a socket that runs 0 to 30.
Every accepted figure in this game, the four card players two feet to his left
included, has one dark shape for an eye. So inside a declared rectangle round
that one eye, a pixel lighter than 90 takes the eye's own darkest tone. The
other two men were measured and need nothing: the miner's eye peaks at 94 on a
cheek that runs to 90, and the lean man is in profile with no light in his at
all. Nothing else on any face is touched -- not the cheeks, which model exactly
as the accepted card players' do.
"""
import json, hashlib, os
import numpy as np
from PIL import Image

PLATE  = 'art/staging/room-03/card-salvage/plate-card-baked.png'
BAR    = 'art/staging/room-03/bar-rebuild-01/source.png'
CROP   = (896, 181, 1920, 864)
SEAM_X = 1176
FEATHER = 24
CATCHLIGHT = {'rect': (1719, 273, 1727, 277), 'over': 90.0,
              'who': 'the standing man in the bowler, his near eye'}
OUT = 'art/staging/room-03/rebuild-01/'

def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()

def main():
    os.makedirs(OUT, exist_ok=True)
    plate = Image.open(PLATE).convert('RGB')
    bar = Image.open(BAR).convert('RGB')
    back = bar.resize((CROP[2]-CROP[0], CROP[3]-CROP[1]), Image.LANCZOS)
    full = plate.copy(); full.paste(back, (CROP[0], CROP[1]))

    p = np.asarray(plate).astype(np.float32)
    f = np.asarray(full).astype(np.float32)
    m = np.zeros(p.shape[:2], np.float32)
    m[CROP[1]:CROP[3], SEAM_X:] = 1.0
    for i in range(FEATHER):
        m[CROP[1]:CROP[3], SEAM_X+i] = i / float(FEATHER)
    out = p*(1-m[:, :, None]) + f*m[:, :, None]
    out = np.clip(out, 0, 255)

    x0, y0, x1, y1 = CATCHLIGHT['rect']
    win = out[y0:y1, x0:x1]
    lum = .299*win[..., 0] + .587*win[..., 1] + .114*win[..., 2]
    hot = lum > CATCHLIGHT['over']
    dark = lum <= lum.min() + 6
    ink = win[dark].mean(0).round()
    for c in range(3):
        win[..., c][hot] = ink[c]
    out[y0:y1, x0:x1] = win

    img = Image.fromarray(out.astype(np.uint8))
    dst = OUT + 'plate-room-03-rebuilt.png'
    img.save(dst)

    rec = {
      'schema': 1,
      'cardBakedPlate': PLATE, 'cardBakedSha256': sha(PLATE),
      'barOperation': BAR, 'barSha256': sha(BAR),
      'cropPlate': list(CROP), 'seamX': SEAM_X, 'feather': FEATHER,
      'catchlight': {**CATCHLIGHT, 'pixelsRepainted': int(hot.sum()),
                     'ink': [int(v) for v in ink]},
      'out': dst,
    }
    rec['outSha256'] = sha(dst)
    json.dump(rec, open(OUT+'integration.json', 'w'), indent=1)
    print(json.dumps(rec, indent=1))

main()
