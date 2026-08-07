"""Move the people inside a furniture-and-people sprite, without moving the furniture.

EVERY OTHER ROUTE WAS TRIED AND MEASURED FIRST, because none of them work:

  a second whole-group generation      mean difference 44.2 between two
                                       drawings of the same group -- a swap is
                                       a jolt, not an animation
  an empty-furniture generation        redraws the furniture: 26% of pixels
                                       repeated within twelve levels, and it
                                       does not align with a men-only pass
  a companion patch of one man         the generator pastes a RECTANGLE and
                                       redraws everything in it, chair back
                                       included; thresholding it builds a
                                       chimera with two arms

So the motion is derived, and the region is the thing that matters. The first
attempt lifted each man from the top of the sprite to y150 -- straight through
the tabletop, whose top edge is at y100 -- so the table rose with him. That was
the bug, not the approach.

HEADS AND SHOULDERS ONLY, ABOVE THE FURNITURE LINE. A man's head sits against
transparency; nothing but him is up there, so he can be moved freely and what
he uncovers is his own neck. Three pixels of nod with a pixel of sway reads at
this scale, where one pixel of breath did not.

Usage: breathe-group.py <sprite.png> <out_dir> <x0:x1:floor> ... [--dy 3]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
dy = int(sys.argv[sys.argv.index('--dy') + 1]) if '--dy' in sys.argv else 3
men = [tuple(int(v) for v in s.split(':')) for s in sys.argv[3:] if ':' in s]

a = np.array(Image.open(src).convert('RGBA'))
out_dir = Path(out)
out_dir.mkdir(parents=True, exist_ok=True)

CYCLE = 6
# A nod down and back, with a pixel of sway a beat later, so the motion is not
# a metronome. Each man runs the same curve from a different starting step.
NOD = [0, 1, 2, 2, 1, 0]
SWAY = [0, 0, 1, 1, 0, 0]

touched = np.zeros(a.shape[:2], bool)
for x0, x1, floor in men:
    touched[:floor, x0:x1] = True

worst = 0
for step in range(CYCLE):
    frame = a.copy()
    for index, (x0, x1, floor) in enumerate(men):
        phase = (step + index * 2) % CYCLE
        down = NOD[phase] * dy // 2
        side = SWAY[phase]
        if down == 0 and side == 0:
            continue
        block = a[:floor, x0:x1].copy()
        block = np.roll(block, down, axis=0)
        if side:
            block = np.roll(block, side, axis=1)
        # What the move uncovers at the top is transparency, which is what was
        # there; at the floor line it is his own neck, one row up.
        block[:down] = 0
        frame[:floor, x0:x1] = block
        frame[floor - 1:floor, x0:x1] = a[floor - 1:floor, x0:x1]
    changed = np.abs(frame.astype(int) - a.astype(int)).max(axis=2) > 0
    worst = max(worst, int((changed & ~touched).sum()))
    Image.fromarray(frame).save(out_dir / f'idle-{step:02d}.png')

print(f'{out_dir}: {CYCLE} frames, {len(men)} figure(s), nod {dy}px; '
      f'{worst} px ever changed outside the declared regions')
