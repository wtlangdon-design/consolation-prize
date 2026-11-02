"""Room 10's prospectus rack in Act IV, empty: a prop over the plate. No image
operation here.

Doc 05 Part Two-B writes THE PROSPECTUS RACK for act 4: "The rack is empty."
That is a picture, so the act-4 state is room-10 operation 4 -- the plate's own
source, edited to empty the rack and change nothing else
(reference/room-10/prompts/rack-01.txt) -- derived through the plate's crop.

ONLY WHAT CHANGED SHIPS. The edit drifts by a few levels everywhere (resampling),
so the prop is not the edit's rack rectangle: it is the edit's pixels where it
differs from the plate by more than DIFF, grown by GROW pixels and limited to
the rack, and transparent everywhere else. Laid over the plate, it changes the
pamphlets to bare shelves and touches nothing around them.

The renderer draws a prop from x - floor(w / 2) and y - h + 1 (drawRoomProp),
so the record printed puts the prop's top-left on the rack's exactly.

Writes art/props/room-10-rack-empty.png and renders/room-10-rack-act4.png.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-10-company-lobby.png')
EDIT = os.path.join(ROOT, 'art/staging/room-10/rack-01/source.png')
CROP = (8, 170, 1528, 854)        # the plate's crop (tools/art/room10-plate.mjs)
RACK = (895, 200, 1020, 552)      # the rack, in plate pixels (x0, y0, x1, y1)
DIFF = 40
GROW = 3


def main():
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(int)
    edit = np.asarray(Image.open(EDIT).convert('RGB').crop(CROP).resize((1920, 864), Image.LANCZOS)).astype(int)
    x0, y0, x1, y1 = RACK
    d = np.abs(edit - plate).sum(2)[y0:y1, x0:x1]
    m = ndi.binary_dilation(ndi.binary_closing(d > DIFF, iterations=2), iterations=GROW)
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., :3] = edit[y0:y1, x0:x1]
    rgba[..., 3] = np.where(m, 255, 0)
    os.makedirs(os.path.join(ROOT, 'art/props'), exist_ok=True)
    Image.fromarray(rgba).save(os.path.join(ROOT, 'art/props/room-10-rack-empty.png'))
    shown = Image.fromarray(plate.astype(np.uint8)).convert('RGBA')
    shown.alpha_composite(Image.fromarray(rgba), (x0, y0))
    side = Image.new('RGB', (2 * (x1 - x0) + 20, y1 - y0))
    side.paste(Image.fromarray(plate[y0:y1, x0:x1].astype(np.uint8)), (0, 0))
    side.paste(shown.crop(RACK).convert('RGB'), (x1 - x0 + 20, 0))
    side.save(os.path.join(ROOT, 'renders/room-10-rack-act4.png'))
    print(json.dumps({'sheet': 'art/props/room-10-rack-empty.png', 'x': x0 + (x1 - x0) // 2,
                      'y': y1 - 1, 'frame': [0, 0, x1 - x0, y1 - y0], 'opaque': int(m.sum())}))


if __name__ == '__main__':
    main()
