"""Fanshawe's close-up, its three frames (reference/fanshawe-closeup/brief.md; errata 159, 160, 161).

fanshawe-closeup operations 1-3 drew, at 1536 x 1024:
  rest-source.png    the close-up at rest (operation 1)
  talk-source.png    an edit of it, mid-word (operation 2)
  blink-source.png   an edit of it, blinking (operation 3)

THE EDITS ARE PUT BACK ON FRAME 1 WHERE THEY DID NOT CHANGE. An edit returns a whole new picture: what
it was asked to change has changed, and every other edge carries a faint re-encoding difference (a few
levels, no movement). The game swaps the frames while he talks and blinks, so that noise would shimmer
over the wall and the lamp. Each edit is therefore kept only where it really changed -- pixels that
differ from frame 1 by more than THRESHOLD (summed RGB), cleaned of specks, closed, filled and grown by
GROW so the whole changed shape and its edge come across -- and inside the regions the brief allows: the
face and the hands for the mid-word frame, the eyes for the blink. Everywhere else is frame 1's pixel.
The script prints each region and fails if a change lies outside where the brief allows it.

Then all three are derived by tools/art/derive.mjs -- the brief's transform, a 20:9 crop resampled to
1920 x 864 -- into art/cutaways/, BUT FROM y 20 RATHER THAN y 170 (errata 161). Operation 1 drew his face
at y ~300 of the source, not the ~455 the brief asked for. The brief's y 170 crop put his face at y ~165
of the frame, cut the top of his hair, and laid the cut-away's speech (drawn across the top of the frame)
over his eyes, as the game showed. Tyler asked for his face near y 360; from y 20 it is at ~354, the
speech sits over his hair, and his folded hands are just in at the bottom edge (they begin at source row
681). It is the same transform on another 20:9 window of the same picture; nothing is redrawn.

Usage: fanshawe-closeup.py
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = 'art/staging/fanshawe-closeup'
CROP = {'x': 8, 'y': 20, 'width': 1520, 'height': 684}
THRESHOLD, GROW = 60, 8
# Where the brief lets each edit change the picture, in source pixels (x0, y0, x1, y1).
ALLOWED = {
    'talk': {'face': (640, 150, 980, 470), 'hands and sleeves': (300, 430, 900, 880)},
    'blink': {'eyes': (660, 210, 860, 310)},
}


def load(name):
    return np.asarray(Image.open(os.path.join(ROOT, STAGE, f'{name}-source.png')).convert('RGB'))


rest = load('rest')
report = {}
for frame, boxes in ALLOWED.items():
    edit = load(frame)
    d = np.abs(rest.astype(int) - edit.astype(int)).sum(-1)
    changed = ndi.binary_opening(d > THRESHOLD, iterations=2)
    changed = ndi.binary_fill_holes(ndi.binary_closing(changed, iterations=4))
    allowed = np.zeros(changed.shape, bool)
    for x0, y0, x1, y1 in boxes.values(): allowed[y0:y1, x0:x1] = True
    outside = changed & ~allowed
    if outside.sum() > 50:
        ys, xs = np.nonzero(outside)
        sys.exit(f'{frame}: {int(outside.sum())} changed pixels outside {list(boxes)} '
                 f'(x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()}): keep frame 1 and tell Tyler (the brief)')
    keep = ndi.binary_dilation(changed & allowed, iterations=GROW) & allowed
    out = rest.copy(); out[keep] = edit[keep]
    Image.fromarray(out).save(os.path.join(ROOT, STAGE, f'{frame}-on-rest.png'))
    ys, xs = np.nonzero(keep)
    report[frame] = {'kept from the edit': int(keep.sum()), 'box': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
                     'faint difference elsewhere, discarded (mean, summed RGB)': round(float(d[~keep].mean()), 2)}

js = ("import { deriveFixedRoomPlate } from './tools/art/derive.mjs';"
      f"for (const [src, out] of [['{STAGE}/rest-source.png','art/cutaways/fanshawe-closeup-rest.png'],"
      f"['{STAGE}/talk-on-rest.png','art/cutaways/fanshawe-closeup-talk.png'],"
      f"['{STAGE}/blink-on-rest.png','art/cutaways/fanshawe-closeup-blink.png']]) deriveFixedRoomPlate({{ source: src, out, crop: {json.dumps(CROP)} }});")
subprocess.check_call(['node', '--input-type=module', '-e', js], cwd=ROOT)
print(json.dumps(report, indent=1))
