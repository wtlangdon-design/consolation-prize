#!/usr/bin/env python3
"""Build the request for the ONE authorized Room 3 bar-cluster operation.

Tyler, 2026-09-11: the card cluster is salvaged as canon and exactly one image
operation rebuilds the bar quadrant with its three patrons registered to it.

WHAT THE PREVIOUS BAR CALL GOT WRONG, and what this changes. Its free window
was a BAND following the counter, so the counter was free along its whole
length and never crossed into kept pixels: nothing held its angle and the
returned slope reversed. Here the window is a rectangle the counter ENTERS at
plate x 1270 and LEAVES at plate x 1860 through kept room, so both ends of the
line are pinned to the accepted plate and the run between them has to join
them. Everything outside stays the Nugget: the stove, a finished card player,
the doorway, the stairs, the far stool, the mirror and the upper shelf, the
foreground floor and the spittoon, which gets its own notch in the mask so the
window cannot eat it.

The canvas is the CARD-BAKED plate, not the old one, so the request carries
four accepted men at their accepted size inside the frame -- the scale and the
drawing language are in the picture rather than only in the words.

Geometry: plate crop (896,181)-(1920,864), 1024 x 683, drawn at 1536 x 1024.
That is x1.5 across and x1.49927 down -- 0.05% anisotropy, a third of a pixel
over the full height -- accepted because no integer scale can hold a standing
man's crown at y~315 and his boots at y~790 inside a 1024-row canvas.
"""
import json, hashlib, os
import numpy as np
from PIL import Image

PLATE = 'art/staging/room-03/card-salvage/plate-card-baked.png'
OUT   = 'art/staging/room-03/bar-rebuild-01/'
CROP  = (896, 181, 1920, 864)
CANVAS = (1536, 1024)
FREE  = (1270, 270, 1860, 800)          # plate rect the endpoint may paint in
NOTCH = (1390, 755, 1505, 850)          # the spittoon, kept inside that rect

def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()

def to_canvas(x, y):
    sx = CANVAS[0] / (CROP[2]-CROP[0])
    sy = CANVAS[1] / (CROP[3]-CROP[1])
    return int(round((x-CROP[0])*sx)), int(round((y-CROP[1])*sy))

def main():
    os.makedirs(OUT, exist_ok=True)
    plate = Image.open(PLATE).convert('RGB')
    canvas = plate.crop(CROP).resize(CANVAS, Image.LANCZOS)
    canvas.save(OUT+'canvas.png')

    a = np.full(CANVAS[::-1], 255, np.uint8)
    fx0, fy0 = to_canvas(FREE[0], FREE[1]); fx1, fy1 = to_canvas(FREE[2], FREE[3])
    a[fy0:fy1, fx0:fx1] = 0
    nx0, ny0 = to_canvas(NOTCH[0], NOTCH[1]); nx1, ny1 = to_canvas(NOTCH[2], NOTCH[3])
    a[ny0:ny1, nx0:nx1] = 255
    m = np.dstack([np.asarray(canvas), a])
    Image.fromarray(m, 'RGBA').save(OUT+'edit-mask.png')

    # identity: the three accepted patrons, unchanged from the sheet already built
    src = 'art/staging/room-03/cluster-bar-01/identity.png'
    Image.open(src).save(OUT+'identity.png')

    rec = {
      'schema': 1,
      'plate': PLATE, 'plateSha256': sha(PLATE),
      'cropPlate': list(CROP), 'canvasSize': list(CANVAS),
      'scale': [CANVAS[0]/(CROP[2]-CROP[0]), CANVAS[1]/(CROP[3]-CROP[1])],
      'freeWindowPlate': list(FREE), 'keptNotchPlate': list(NOTCH),
      'freeWindowCanvas': [fx0, fy0, fx1, fy1],
      'freeFraction': round(float((a<128).mean()), 4),
      'canvas': OUT+'canvas.png', 'canvasSha256': sha(OUT+'canvas.png'),
      'mask': OUT+'edit-mask.png', 'maskSha256': sha(OUT+'edit-mask.png'),
      'identity': OUT+'identity.png', 'identitySha256': sha(OUT+'identity.png'),
      'identityFrom': ['art/actors/cast-nugget-bar-1.png',
                       'art/actors/cast-nugget-bar-2.png',
                       'art/actors/cast-nugget-bar-3.png'],
      'poseAuthority': 'art/staging/room-03/cluster-bar-01/source.png',
      'roundTrip': 'plate (x,y) -> canvas ((x-896)*1.5, (y-181)*1.49927); the return '
                   'leg resizes 1536x1024 back to 1024x683 and blits at (896,181)',
    }
    json.dump(rec, open(OUT+'request.json','w'), indent=1)
    print(json.dumps(rec, indent=1))

main()
