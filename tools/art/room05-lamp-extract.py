#!/usr/bin/env python3
"""Cut the hanging work lamp out of the edited night room as a prop.

Tyler's post-pilot revision: the lamp was acquired IN CONTEXT (the night
source edited to add one lamp, nothing else) so that its perspective, scale
and brass sit in the room's own vocabulary -- and then it is EXTRACTED, so
the accepted DAY and NIGHT plates stay untouched and one fixture is drawn
over both.

The difference between the lamp edit and the unlit night candidate (same
crop, same derivation) is two things: the lamp itself, which is a strong,
compact change, and its light on the surfaces, which is a gentle, diffuse
one. The prop is the first and not the second: pixels whose change exceeds
a hard threshold, as the one connected body in the lamp's region, dilated
by a pixel so the anti-aliased rim comes with it. The light is the runtime
lamp's job.

    python3 tools/art/room05-lamp-extract.py <lamp-edit candidate> <night candidate> <out dir>

Writes hanging-lamp.png (tight RGBA crop), hanging-lamp-overlay.png (the
same pixels on a transparent 1920x864 plate, the form a hotspot state image
takes), and lamp.json with the bounds, the attachment point, the flame
position and the hashes.
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

edit_p, night_p, out_dir = sys.argv[1], sys.argv[2], Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)
e = np.array(Image.open(edit_p).convert('RGB')).astype(int)
n = np.array(Image.open(night_p).convert('RGB')).astype(int)
assert e.shape == n.shape == (864, 1920, 3)
diff = np.abs(e - n).sum(axis=2)

# The lamp's region and the fixture's own box. The edit also brightened the
# cage post beside the lamp, the shelf edge under it and a vial rim or two
# past the threshold -- lit surfaces, not the object -- so a component is
# kept only when it lies wholly inside the fixture's box, which was read off
# the difference image: chain and bracket above, font, chimney and base
# below, nothing past the shelf under it.
REGION = (880, 0, 1060, 300)   # x0, y0, x1, y1: where to look
FIXTURE = (928, 60, 1016, 252) # x0, y0, x1, y1: where the fixture is, and nothing else may be
STRONG = 90                    # summed RGB change that is an object, not light
CHAIN_BAND = (950, 60, 1000, 166)   # the thin chain and bracket: a lower threshold inside their own column
CHAIN = 50
strong = np.zeros(diff.shape, dtype=bool)
strong[REGION[1]:REGION[3], REGION[0]:REGION[2]] = diff[REGION[1]:REGION[3], REGION[0]:REGION[2]] > STRONG
strong[CHAIN_BAND[1]:CHAIN_BAND[3], CHAIN_BAND[0]:CHAIN_BAND[2]] |= diff[CHAIN_BAND[1]:CHAIN_BAND[3], CHAIN_BAND[0]:CHAIN_BAND[2]] > CHAIN
lab, k = label(binary_dilation(strong, iterations=1))
keep_ids = []; sizes = []
for i in range(1, k + 1):
    ys, xs = np.where(lab == i); n_ = len(xs); sizes.append(n_)
    if n_ < 20: continue
    if xs.min() >= FIXTURE[0] and xs.max() <= FIXTURE[2] and ys.min() >= FIXTURE[1] and ys.max() <= FIXTURE[3]:
        keep_ids.append(i)
mask = np.isin(lab, keep_ids) & (diff > 25)                         # dilated by one, but never onto unchanged plate
ys, xs = np.where(mask)
x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())

rgba = np.zeros((864, 1920, 4), dtype=np.uint8)
rgba[..., :3] = e.astype(np.uint8); rgba[..., 3] = np.where(mask, 255, 0).astype(np.uint8)
Image.fromarray(rgba).save(out_dir / 'hanging-lamp-overlay.png')
crop = rgba[y0:y1 + 1, x0:x1 + 1]
Image.fromarray(crop).save(out_dir / 'hanging-lamp.png')

# The flame: the brightest warm pixels inside the fixture; the attachment
# point: the topmost fixture pixels' centre (where the chain meets the rail).
r, g, b = e[..., 0], e[..., 1], e[..., 2]
warm_bright = mask & (r > 200) & (g > 150) & (r - b > 60)
fy, fx = np.where(warm_bright)
flame = [int(fx.mean()), int(fy.mean())] if len(fx) else None
top_cols = np.where(mask[y0])[0]
attach = [int(top_cols.mean()), y0]
# The light on the surfaces, for the record (what the runtime lamp must supply)
soft = (diff > 12) & ~mask
sy, sx = np.where(soft[0:520, 700:1500]); glow_bbox = [700 + int(sx.min()), int(sy.min()), 700 + int(sx.max()), int(sy.max())] if len(sx) else None
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rec = {'note': 'THE HANGING WORK LAMP as a prop, cut from the in-context edit by tools/art/room05-lamp-extract.py. Strong, connected change against the unlit night candidate = the fixture; the diffuse change = its light, left to the runtime lamp.',
       'sources': {'lampEdit': {'path': edit_p, 'sha256': sha(edit_p)}, 'nightCandidate': {'path': night_p, 'sha256': sha(night_p)}},
       'method': {'region': REGION, 'fixtureBox': FIXTURE, 'strongThreshold': STRONG, 'chainBand': CHAIN_BAND, 'chainThreshold': CHAIN, 'keepMinPixels': 20, 'dilate': 1, 'rimThreshold': 25},
       'bounds': [x0, y0, x1 - x0 + 1, y1 - y0 + 1], 'pixels': int(mask.sum()), 'attachmentPoint': attach, 'flame': flame,
       'lightOnSurfacesBBox': glow_bbox,
       'outputs': {'overlay': {'path': str(out_dir / 'hanging-lamp-overlay.png'), 'sha256': sha(out_dir / 'hanging-lamp-overlay.png')},
                   'crop': {'path': str(out_dir / 'hanging-lamp.png'), 'sha256': sha(out_dir / 'hanging-lamp.png')}}}
json.dump(rec, open(out_dir / 'lamp.json', 'w'), indent=1)
print(json.dumps({k: rec[k] for k in ('bounds', 'pixels', 'attachmentPoint', 'flame', 'lightOnSurfacesBBox')}))
print('components kept', len(keep_ids), 'sizes', sorted(sizes, reverse=True)[:6])
