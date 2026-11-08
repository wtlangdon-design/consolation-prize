"""ROOM 1'S SKY, EXTENDED UPWARD FOR THE OPENING PAN (errata 157).

Tyler, 2026-11-07, of the jump from the title straight into Thad's first
line: "maybe the camera pans down from a starry sky to find Thad standing
there in the mud ... that would be the coolest way to start."

The approved plate stops just above the mountains. The pan needs a screen of
night sky above it. No new picture is painted: the sky is the plate's OWN sky
band (rows 0..BAND), its stars lifted out, its row-by-row gradient levelled to
the plate's top row so that tiles do not stripe, stacked with random shifts
and flips, and re-starred with the plate's own stars at the plate's own
density. Deterministic (fixed seed), so a rerun writes the same bytes.

    python3 tools/pixelart/room01_sky_extension.py
writes art/backgrounds/room-01-stage-road-sky.png (1920 x HEIGHT), then runs
room01_sky_stars.py for the room's `skyStars` (the ones that twinkle).
"""
import warnings

import numpy as np
from PIL import Image
from scipy import ndimage

PLATE = 'art/backgrounds/room-01-stage-road.png'
OUT = 'art/backgrounds/room-01-stage-road-sky.png'
HEIGHT = 864
BAND = 96          # sky-only rows at the plate's top
SEED = 1858

def main() -> None:
    warnings.filterwarnings('ignore', message='All-NaN slice')
    rng = np.random.default_rng(SEED)
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(np.float64)
    band = plate[:BAND].copy()
    w = band.shape[1]
    # Stars: anything well above the navy ground in red (the ground's red is ~0-15).
    star = band[..., 0] > 38
    star_grown = ndimage.binary_dilation(star, iterations=4)
    # Lift them out: each masked pixel takes the median of the ground around
    # it. (Copying the nearest pixel along the row left horizontal streaks.)
    clean = band.copy()
    for c in range(3):
        channel = band[..., c].copy()
        channel[star_grown] = np.nan
        filled = ndimage.generic_filter(channel, np.nanmedian, size=13, mode='nearest')
        # A star wider than the window leaves nothing to take a median of: its row's median, then.
        rows = np.nanmedian(channel, axis=1, keepdims=True)
        filled = np.where(np.isnan(filled), np.broadcast_to(rows, filled.shape), filled)
        clean[..., c][star_grown] = filled[star_grown]
    # Level the band's own top-to-bottom gradient to its first rows' mean.
    row_mean = clean.mean(axis=1, keepdims=True)
    target = clean[:6].reshape(-1, 3).mean(axis=0)
    flat = clean - row_mean + target
    # Stack shifted, flipped tiles to the height, top to bottom.
    tiles = []
    while sum(t.shape[0] for t in tiles) < HEIGHT:
        t = np.roll(flat, int(rng.integers(0, w)), axis=1)
        if rng.random() < 0.5: t = t[::-1]
        if rng.random() < 0.5: t = t[:, ::-1]
        tiles.append(t)
    sky = np.concatenate(tiles)[-HEIGHT:]
    # The plate's stars, as their light over the ground beneath them.
    labels, n = ndimage.label(star)
    sprites = []
    for sl in ndimage.find_objects(labels):
        y0, x0 = max(sl[0].start - 6, 0), max(sl[1].start - 6, 0)
        y1, x1 = min(sl[0].stop + 6, BAND), min(sl[1].stop + 6, w)
        patch = band[y0:y1, x0:x1]
        under = clean[y0:y1, x0:x1]
        # Only the star's own light: faint differences around it are the
        # ground's noise, and pasting them drew a little box round every star.
        light = np.clip(patch - under, 0, None)
        light[light.sum(axis=-1) < 45] = 0
        sprites.append(light)
    # AT THE PLATE'S DENSITY OF STARS A PERSON SEES: counted as bright cores
    # (red over 110) per row, the plate's band against the new sky, adding
    # stars until the new sky has as many per row as the plate does.
    def seen_per_row(img: np.ndarray) -> float:
        return ndimage.label(img[..., 0] > 110)[1] / img.shape[0]
    want = seen_per_row(band)
    count = 0
    while seen_per_row(sky) < want:
        for _ in range(20):
            s = sprites[int(rng.integers(0, len(sprites)))]
            h, sw = s.shape[:2]
            y = int(rng.integers(0, HEIGHT - h)); x = int(rng.integers(0, w - sw))
            sky[y:y + h, x:x + sw] += s
            count += 1
    final = np.clip(sky, 0, 255).round().astype(np.uint8)
    Image.fromarray(final).save(OUT, optimize=True)
    print(f'{OUT}: {w}x{HEIGHT}, {count} stars from {n} in the plate band')
    # THE STARS THAT TWINKLE (errata 157, 165) are read back out of the sky just
    # written, never typed in: a regenerated sky moves its stars.
    import room01_sky_stars
    room01_sky_stars.main()

if __name__ == '__main__':
    main()
