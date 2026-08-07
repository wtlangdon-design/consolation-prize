"""Give the people inside a furniture-and-people sprite a breath.

WHY NOT A SECOND GENERATION. These men are fused to furniture that must not
move by a pixel, and a second drawing redraws the furniture too: asked for the
same card table with nobody at it, the generator hit the bounding box exactly
and then repeated only 26% of the furniture pixels within twelve levels --
mean difference 29.2 where it should have been zero. Compositing frames from
two such drawings makes the table shimmer under men who are supposed to be
still.

SO THE MOTION IS DERIVED FROM THE ONE DRAWING WE HAVE, and every pixel outside
a man's own column range is copied verbatim. The furniture cannot move because
it is never rewritten.

Each man is a column range with a head in it. His rows from the top of the
sprite down to a waist line lift by one pixel; the row uncovered at the waist
is filled from the row below it, which is his own body. Above his head is
transparency -- these groups are drawn with the heads at the top of the frame
-- so the lift corrupts nothing at all.

A CYCLE, NOT A FRAME. Lifting everybody at once is a room of men breathing in
unison, which ruling 20 warns about for exactly the reason it warns about
synchronised idles on a street: the eye catches the pattern instantly. Each man
is lifted for two frames of a four-frame cycle, offset one frame from his
neighbour, so no two are ever in step and the cycle does not repeat visibly.

Usage: python3 tools/rig/breathe-group.py <sprite.png> <out_dir> <x0:x1:waist> ...
"""
import sys

import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
men = [tuple(int(v) for v in spec.split(':')) for spec in sys.argv[3:]]

from pathlib import Path

a = np.array(Image.open(src).convert('RGBA'))
out_dir = Path(out)
out_dir.mkdir(parents=True, exist_ok=True)

CYCLE = 4
touched = np.zeros(a.shape[:2], bool)
for x0, x1, waist in men:
    touched[:waist, x0:x1] = True

worst = 0
for step in range(CYCLE):
    frame = a.copy()
    for index, (x0, x1, waist) in enumerate(men):
        # Up for two frames of four, each man offset one frame from the last.
        if (step - index) % CYCLE not in (0, 1):
            continue
        column = frame[:waist, x0:x1]
        frame[:waist, x0:x1] = np.roll(column, -1, axis=0)
        frame[waist - 1:waist, x0:x1] = a[waist:waist + 1, x0:x1]
    changed = np.abs(frame.astype(int) - a.astype(int)).max(axis=2) > 0
    worst = max(worst, int((changed & ~touched).sum()))
    Image.fromarray(frame).save(out_dir / f'breath-{step:02d}.png')

print(f'{out_dir}: {CYCLE} frames, {len(men)} figure(s) offset one frame apart; '
      f'{worst} px ever changed outside the declared columns')
