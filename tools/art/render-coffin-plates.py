"""
Room 32's plates (errata 70 A and B): the inside of a coffin lid, from
underneath, in the dark -- and a seam of light that narrows as the dirt
lands, then nothing, then Hob's lantern.

Drawn at the game's native 320x144 and scaled x6 nearest-neighbour, so the
pixels are the same size as every other room's. No blur, no anti-aliasing:
light falls off in stepped bands, the way the rest of the game draws it.
No figure is drawn -- Hob is not in this picture, only his light (the
Character style gate governs figures, and there is none here).

THE AGENT THAT DREW THIS CANNOT JUDGE IT BY EYE ALONE; it has been looked at
as an image, and Tyler approves it in the room before it ships.
    python3 tools/art/render-coffin-plates.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

W, H, SCALE = 320, 144, 6
OUT = Path(__file__).resolve().parents[2] / 'art' / 'backgrounds'
rng = np.random.default_rng(32)

BLACK = np.array([6, 5, 4])
BOARD = np.array([14, 10, 7])
BOARD_EDGE = np.array([9, 7, 5])
WARM = np.array([255, 214, 140])
GLOW = [np.array([120, 84, 46]), np.array([52, 36, 20]), np.array([24, 17, 10])]


def lid():
    """Three boards running across, barely there: the eye finds them only near the light."""
    img = np.tile(BLACK, (H, W, 1)).astype(float)
    for top, bottom in ((0, 38), (40, 92), (94, 144)):
        img[top:bottom] = BOARD
        img[bottom - 1:bottom + 1] = BOARD_EDGE
    # Grain, as sparse darker pixels, never brighter than the board.
    for _ in range(900):
        y, x = rng.integers(0, H), rng.integers(0, W)
        img[y, x] = img[y, x] * 0.7
    return img


SEAM_Y = 39  # the gap between the first and second boards


def seam(img, left, right, width):
    """A gap of light between two boards, with stepped spill onto their edges."""
    out = img.copy()
    if width <= 0 or right <= left:
        return out
    half = width // 2
    for band, colour in enumerate(GLOW, start=1):
        y0, y1 = SEAM_Y - half - band, SEAM_Y + (width - half) + band
        x0, x1 = left - band * 3, right + band * 3
        region = out[max(0, y0):y1, max(0, x0):min(W, x1)]
        np.maximum(region, colour, out=region)
    out[SEAM_Y - half:SEAM_Y + (width - half), left:right] = WARM
    return out


def lantern(img):
    """The lid is off. The grave's walls frame a square of night, and the lantern is in it."""
    out = np.tile(BLACK, (H, W, 1)).astype(float)
    sky = np.array([10, 12, 22])
    out[10:110, 70:250] = sky
    for _ in range(40):
        y, x = rng.integers(12, 70), rng.integers(74, 246)
        out[y, x] = [150, 150, 170]
    cx, cy = 196, 42
    for radius, colour in ((34, GLOW[2]), (24, GLOW[1]), (15, GLOW[0]), (6, WARM)):
        yy, xx = np.ogrid[:H, :W]
        ring = (xx - cx) ** 2 + ((yy - cy) * 1.15) ** 2 <= radius ** 2
        out[ring] = np.maximum(out[ring], colour)
    # Earth walls, lit on the side nearest the lantern.
    out[10:110, 62:70] = [30, 20, 12]
    out[10:110, 250:258] = [62, 40, 22]
    return out


def save(name, img):
    big = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').resize((W * SCALE, H * SCALE), Image.NEAREST)
    OUT.mkdir(parents=True, exist_ok=True)
    big.save(OUT / name)


base = lid()
# The full seam, then five narrowings as the dirt lands, then dark.
stages = [(40, 280, 2), (70, 262, 2), (104, 238, 1), (140, 210, 1), (160, 186, 1), (170, 176, 1)]
save('room-32-coffin.png', seam(base, *stages[0]))
for index, stage in enumerate(stages[1:], start=1):
    save(f'room-32-coffin-seam-{index}.png', seam(base, *stage))
save('room-32-coffin-dark.png', np.tile(BLACK, (H, W, 1)).astype(float))
save('room-32-coffin-lantern.png', lantern(base))
print('drawn', sorted(p.name for p in OUT.glob('room-32-coffin*.png')))
