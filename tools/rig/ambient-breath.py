"""A second idle frame for a standing ambient figure: one breath.

Ruling 20 gives each ambient character a TWO-FRAME idle at its own rate and
phase, because nothing on Main Street moves on the same beat as anything else.
That needs a second frame, and a second generation would not give one: two
portraits of the same person differ everywhere, and the difference would read
as a twitch rather than a breath.

So the second frame is derived. The chest lifts by one pixel and the head
with it, above a hem line found the way character.py finds one -- the widest
sustained run in the lower half, which for a standing figure is where the
coat or skirt stops moving. Below that nothing changes at all, because a
breathing man does not move his boots.

One pixel at a 132px figure is the whole of it. Two reads as a shrug.

Usage: python3 tools/rig/ambient-breath.py <frame0.png> <frame1.png>
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
a = np.array(Image.open(src).convert('RGBA'))
height = a.shape[0]

opaque = a[..., 3] > 16
widths = opaque.sum(axis=1)
lower = widths[height // 2:]
hem = height // 2 + int(np.argmax(lower))          # the widest row below the middle

frame = a.copy()
upper = frame[:hem]
frame[:hem] = np.roll(upper, -1, axis=0)
frame[hem - 1:hem] = a[hem - 1:hem]                # keep the hem row itself put

Image.fromarray(frame).save(out)
lifted = int((np.array(Image.open(out))[..., 3] > 16).sum() - opaque.sum())
print(f'{out}: chest lifted 1px above row {hem} of {height}, alpha delta {lifted}')
