"""The dinner table in two layers: its top behind a seated man, its hanging cloth in front of him. No image
operation.

Seated at the table's end, Thad is drawn in front of the table top, so his forearms rest on it, and behind the
cloth that hangs from its front edge, so his legs are under it (Tyler, 2026-11-08: "Maybe you need the tablecloth
to come all the way down and it can hide his legs completely?"). Room-11 attempt 9's cloth hangs to the carpet
(tools/art/room11-dinner-relay.py), so both layers are the one table's own pixels, split at the top's front edge:

- `dinner` (art/props/room-11-dinner.png): the rows above the front edge, standing at that edge;
- `dinner_drape` (art/props/room-11-dinner-drape.png): from STRIP rows above the front edge to the carpet,
  standing on the carpet. Over the table it is the table's own pixels, so nothing changes where nobody is; the
  STRIP rows are where a seated man's lap lies, and they put it under the top, not through it (Tyler,
  2026-11-08: "Close but thads one leg is popping up through the tablecloth").

Reads the whole table that tools/art/room11-props.py writes to art/props/room-11-dinner.png, and rewrites it as
the top. Run it after room11-props.py, every time. Prints both props' records.
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROP = os.path.join(ROOT, 'art/props/room-11-dinner.png')
DRAPE = os.path.join(ROOT, 'art/props/room-11-dinner-drape.png')
X, Y = 1087, 733                  # the whole table's record from room11-props.py: bottom-centre on the plate
FRONT = 152                       # the top's front edge, in the whole table's rows
STRIP = 15                        # rows above it the cloth layer also carries: where a seated man's lap lies


def main():
    whole = np.asarray(Image.open(PROP).convert('RGBA'))
    h, w = whole.shape[:2]
    if h <= FRONT:
        raise SystemExit('art/props/room-11-dinner.png is already the top alone: run tools/art/room11-props.py first')
    top0 = Y - h + 1
    Image.fromarray(whole[:FRONT]).save(PROP)
    Image.fromarray(whole[FRONT - STRIP:]).save(DRAPE)
    print(json.dumps({
        'dinner': {'sheet': 'art/props/room-11-dinner.png', 'x': X, 'y': top0 + FRONT - 1, 'frame': [0, 0, w, FRONT]},
        'dinner_drape': {'sheet': 'art/props/room-11-dinner-drape.png', 'x': X, 'y': Y, 'frame': [0, 0, w, h - FRONT + STRIP]},
    }))


if __name__ == '__main__':
    main()
