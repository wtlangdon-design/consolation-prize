"""Room 16 with the lamp turned down: the tent's plate, dimmed, for the séance in the dark (doc 111 B; errata 238).

OZY_E1 option 2: "She turns the lamp down to a bead." The tent has no plate in the dark, and none is drawn: act3-seance's
handback (reference/act3-seance/handback.md) checked its dark group against "the plate simply dimmed"
(renders/room-16-seance-table-dark-check.png) and left how the room darkens to the wiring. The engine's way for a
room's picture to change with the story is a whole-frame plate chosen by state (RoomFile.plates and plateWhen, as Room
31's night and Room 19's Act IV morning are), so this writes that plate: the tent's séance plate (the shipping plate with one sliver filled, errata 239) times DIM, every pixel, the
same uniform dimming the handback's check used (0.44 measured on its chart, wall, floor and stove). No image operation,
no pixel drawn: the plate darkened, nothing added. The lamp turned down to a bead is its own prop over the dimmed lamp
(art/props/room-16-seance-lamp.png), and the candle's light is in the dark group's own sheet.

    python3 tools/art/room16-seance-dark.py [--write]
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Errata 239: from the tent's seance plate (tools/art/room16-seance-plate.py), which is the shipping plate with the
# crystal ball's sliver behind the medium's hand filled with the plate's own curtain. Run that first.
PLATE = os.path.join(ROOT, 'art/backgrounds/room-16-tent-seance.png')
OUT = os.path.join(ROOT, 'art/backgrounds/room-16-tent-seance-dark.png')
DIM = 0.44

plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(float)
dark = np.clip(np.round(plate * DIM), 0, 255).astype(np.uint8)
print(f'{os.path.relpath(OUT, ROOT)}: {dark.shape[1]}x{dark.shape[0]}, mean {plate.mean():.1f} -> {dark.mean():.1f}')
if '--write' in sys.argv:
    Image.fromarray(dark, 'RGB').save(OUT, optimize=True)
