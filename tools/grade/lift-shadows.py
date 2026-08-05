"""Lift the dark end of a plate without touching the lamps.

Room 2 graded to Room 1's average and still read as unviewable on Tyler's
display at full brightness. The average was never the question: Room 1 spends
a third of its frame on lit sky and town lights, so the same MEAN buys it a
much brighter picture, while Room 2 is dark buildings over dark mud and the
walkable ground sat at median luminance 28.

A gamma curve on luminance, hue preserved, gain clamped. Gamma below 1 lifts
shadows hardest and highlights least, so lamps and windows keep their punch
instead of blooming, which a linear gain would not manage.

TWO ZONES, because Tyler ruled 0.78 over 0.66 for a reason worth keeping:
the stronger lifts "make the mountains look fake". They do -- distant haze is
LOW CONTRAST, and lifting it adds contrast the distance should not have, so
the range stops reading as far away and starts reading as a painted backdrop.
Atmospheric perspective is a contrast effect and a global lift destroys it.

So the far zone (sky and mountains) takes the ruled gamma, and the ground --
where the mud is, where the player looks, where a dark coat has to read --
takes a stronger one.

Usage: python3 tools/grade/lift-shadows.py <in> <gamma> <out> [ground_gamma]
"""
import sys
import numpy as np
from PIL import Image

# SPRITES TAKE THE GROUND GAMMA, FLAT, AND KEEP THEIR ALPHA. A row-based far
# plane mask is meaningless on a 70-pixel dog: he is entirely ground. Cut
# before the lift he sat at the plate's ORIGINAL darkness while the mud around
# him went to 63 -- a hole in the street. Anything composited over a lifted
# plate is lifted with it, by the same numbers, or it does not belong there.
SPRITE = '--sprite' in sys.argv
argv = [x for x in sys.argv if x != '--sprite']
src, gamma, out = argv[1], float(argv[2]), argv[3]
ground_gamma = float(argv[4]) if len(argv) > 4 else gamma
GROUND_TOP, GROUND_FEATHER = 570.0, 90.0
raw = Image.open(src)
alpha = np.array(raw.convert('RGBA'))[..., 3] if SPRITE else None
a = np.array(raw.convert('RGB')).astype(float)
l = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
H0 = a.shape[0]
# Per-row gamma: the ruled one up top, the ground one below, feathered across
# the line where the buildings meet the mud so no band shows.
if SPRITE:
    gam_row = np.full((H0, 1), ground_gamma)
else:
    mix = np.clip((np.arange(H0) - GROUND_TOP) / GROUND_FEATHER, 0, 1)[:, None]
    gam_row = gamma * (1 - mix) + ground_gamma * mix
lifted = 255.0 * np.power(np.clip(l, 0, 255) / 255.0, gam_row)
gain = np.clip(np.where(l > 1e-3, lifted / np.maximum(l, 1e-3), 1.0), 1.0, 4.0)
# NO CHANNEL MAY OVERFLOW. The first version clipped 22% of the frame at
# gamma 0.6, and the curve was not the culprit: a saturated lamp already at
# R=255 has no headroom for ANY multiplier, so the gain has to be capped per
# pixel by the channel closest to the ceiling. Shadows still get the full
# lift; the lamps simply keep what they have.
headroom = 255.0 / np.maximum(a.max(axis=2), 1e-3)
gain = np.minimum(gain, headroom)

# THE SKY IS NOT THE PROBLEM AND MUST NOT PAY FOR THE FIX. At gamma 0.68,
# 99.6% of saturating pixels were sky: a night sky lifted like a street goes
# milky and takes the stars with it. The lift ramps in from SKY_KEEP at the
# top of frame to full by SKY_FULL, so the street, the mud and the buildings
# get all of it and the sky keeps its night.
# THE FAR PLANE IS PROTECTED BY ROW, and a colour mask was tried first and
# REJECTED BY MEASUREMENT. Masking by blueness protected the mountains but
# lifted the warm pixels beside them, so contrast inside the band went UP --
# 23.0 against the flat lift's 21.5 -- which is the exact opposite of haze.
# Selective lifting within a distant plane manufactures detail that distance
# is supposed to have taken away.
#
# Tyler ruled 0.78 over 0.66 because the stronger lifts "make the mountains
# look fake". Haze is LOW CONTRAST; any lift on the far plane reads as the
# distance coming closer. So the far plane simply keeps what it had, and the
# upper storeys of the buildings share that restraint -- their windows are
# already the brightest things in the frame and need nothing.
FAR_KEEP, FAR_TOP, FAR_BOTTOM = 0.06, 300.0, 470.0
H = a.shape[0]
row = np.clip((np.arange(H) - FAR_TOP) / (FAR_BOTTOM - FAR_TOP), 0, 1)
mask = np.ones(H) if SPRITE else FAR_KEEP + (1 - FAR_KEEP) * row
gain = (1.0 + (gain - 1.0) * mask[:, None])[..., None]
res = np.clip(a * gain, 0, 255)
if SPRITE:
    Image.fromarray(np.dstack([res, alpha]).astype(np.uint8)).save(out)
else:
    Image.fromarray(res.astype(np.uint8)).save(out)
gl = 0.2126 * res[..., 0] + 0.7152 * res[..., 1] + 0.0722 * res[..., 2]
print(f'gamma {gamma}: mean {l.mean():.1f} -> {gl.mean():.1f}, '
      f'ground median {np.median(l[600:]):.1f} -> {np.median(gl[600:]):.1f}, '
      f'clipped {100 * (res.max(axis=2) >= 255).mean():.2f}%'
      + (f' [ground gamma {ground_gamma}]' if ground_gamma != gamma else ''))
