"""The town's streets at night, brought to one night (errata 268; Tyler, 2026-11-10).

Tyler asked whether Main Street looked drawn by the same hand as the other rooms. Beside Lower Street, the Lane and the
Back Alley it did not: its ground was twice as bright and far busier, with neon-blue puddles, and its colour ran
hotter; the side streets were cold and dim with a lamp or two. He chose the tool pass before any redraw.

MAIN STREET comes down: below the porches the ground is dimmed and loses some colour, keeping the pools of lamplight
(the dimming is least where the ground is warm); the puddles become a dull sheen; the whole plate eases a little.
The two act overlays drawn on its buildings (the gilt sign, the funeral notice) take the same easing, so they still sit
flush. THE SIDE STREETS come up: the lamps and what they light are brightened and warmed, the rest lifted slightly.

Every step is one function of a pixel (and its row), from the untouched originals kept in
reference/night-streets/originals/. Nothing is redrawn, the grain is not touched (coarsening it by tool only smeared
the small buildings), and no image operation is spent. The dawn plate is left: its ground is already quiet.

    python3 tools/art/night-streets.py            write
    python3 tools/art/night-streets.py --check    exit 1 if a shipped plate is not what this writes
"""
import os
import shutil
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIGINALS = os.path.join(ROOT, 'reference/night-streets/originals')
MAIN = 'art/backgrounds/room-02-main-street.png'
OVERLAYS = ['art/objects/room-02/company-sign-gilt-overlay.png', 'art/objects/room-02/posted-notices-act3-overlay.png']
SIDE = ['art/backgrounds/room-43-lower-street.png', 'art/backgrounds/room-44-the-lane.png', 'art/backgrounds/room-20-back-alley.png']
LUMA = np.array([0.299, 0.587, 0.114])
GROUND_FROM, GROUND_FULL = 610, 700   # Main Street's rows: the ground's grade ramps in below the porches
STEP = 14.0                            # the plate's colours settle to flat steps


def sat(a, s):
    grey = (a @ LUMA)[..., None]
    return grey + (a - grey) * s


def eased(a):
    """What the whole of Main Street gets, and its overlays with it."""
    return np.round(sat(a, 0.90) * 0.95 / STEP) * STEP


def main_street(a):
    rows = np.arange(a.shape[0])[:, None, None]
    ramp = np.clip((rows - GROUND_FROM) / float(GROUND_FULL - GROUND_FROM), 0, 1)
    warm = np.clip((a[..., 0:1] - a[..., 2:3]) / 90.0, 0, 1)      # lamplit ground keeps more of its light
    ground = sat(a, 0.70) * (0.66 + 0.26 * warm)
    puddle = np.clip((ground[..., 2:3] - ground[..., 0:1]) / 30.0, 0, 1)
    ground = ground * (1 - puddle) + sat(ground, 0.35) * 0.8 * puddle
    return eased(a * (1 - ramp) + ground * ramp)


def side_street(a):
    warm = np.clip((a[..., 0:1] - a[..., 2:3] - 10) / 60.0, 0, 1)   # the lamps and what they light
    out = sat(a * (1.12 + 0.35 * warm), 1.0 + 0.25 * warm)
    rows = np.arange(a.shape[0])[:, None, None]
    sky = np.clip((a[..., 2:3] - a[..., 0:1] - 15) / 50.0, 0, 1) * np.clip(1 - rows / 400.0, 0, 1)
    return out * (1 + 0.10 * sky)


def original(path):
    kept = os.path.join(ORIGINALS, os.path.basename(path))
    if not os.path.exists(kept):
        os.makedirs(ORIGINALS, exist_ok=True)
        shutil.copyfile(os.path.join(ROOT, path), kept)
    return Image.open(kept)


def made(path, grade):
    image = original(path)
    rgba = np.asarray(image.convert('RGBA')).astype(float)
    rgb = np.clip(grade(rgba[..., :3]), 0, 255)
    out = np.dstack([rgb, rgba[..., 3:]]).astype(np.uint8)
    return Image.fromarray(out).convert(image.mode if image.mode in ('RGB', 'RGBA') else 'RGBA')


def main():
    check = '--check' in sys.argv
    jobs = [(MAIN, main_street)] + [(p, eased) for p in OVERLAYS] + [(p, side_street) for p in SIDE]
    wrong = []
    for path, grade in jobs:
        out = made(path, grade)
        if check:
            now = Image.open(os.path.join(ROOT, path)).convert('RGBA')
            if np.asarray(now).tobytes() != np.asarray(out.convert('RGBA')).tobytes():
                wrong.append(path)
        else:
            out.save(os.path.join(ROOT, path), optimize=True)
            print('wrote', path)
    if wrong:
        print('not what tools/art/night-streets.py writes:', ', '.join(wrong))
        sys.exit(1)


if __name__ == '__main__':
    main()
