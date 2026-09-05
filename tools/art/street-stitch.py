#!/usr/bin/env python3
"""STITCH the two derived Main Street panels into one plate.

The east panel was outpainted from the west SOURCE's right `keep` fraction, so
after errata 63's crop the east PANEL's left part reproduces the west PANEL's
right part. The stitch keeps the west panel whole and appends the east panel
from the end of the overlap, with a short feathered blend across the last
`feather` px of the overlap so a one-pixel disagreement never shows as a
line. Nothing is resampled, recoloured or regenerated. Records the numbers.

usage: street-stitch.py <west panel> <east panel> <out.png> <keep fraction> [feather px]
"""
import json, sys, os, hashlib
from PIL import Image
import numpy as np

west_p, east_p, out, keep = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
feather = int(sys.argv[5]) if len(sys.argv) > 5 else 96
W = Image.open(west_p).convert('RGB'); E = Image.open(east_p).convert('RGB')
assert W.size == E.size == (1920, 864), (W.size, E.size)
# the kept source columns [1536-keep_px, 1536) map through the crop (x 8..1528) to derived columns
keep_px = int(round(1536 * keep))
src_left = 1536 - keep_px
overlap = int(round((1528 - max(src_left, 8)) / 1520 * 1920))       # west columns reproduced at the east panel's left
east_start = int(round((keep_px - 8) / 1520 * 1920)) if keep_px > 8 else 0  # first east column beyond the overlap
width = 1920 + (1920 - east_start)
w = np.asarray(W).astype(float); e = np.asarray(E).astype(float)
out_a = np.zeros((864, width, 3), float)
out_a[:, :1920] = w
out_a[:, 1920:] = e[:, east_start:]
# feather across the seam: blend west's last `feather` columns with east's matching columns
f0 = 1920 - feather
for i in range(feather):
    t = (i + 1) / (feather + 1)
    col_e = east_start - feather + i
    if col_e < 0: continue
    out_a[:, f0 + i] = w[:, f0 + i] * (1 - t) + e[:, col_e] * t
Image.fromarray(np.clip(out_a, 0, 255).astype('uint8')).save(out)
# seam disagreement, measured before the blend: mean abs diff over the overlap columns
ov = np.abs(w[:, 1920 - overlap:] - e[:, :overlap]).mean() if overlap > 0 else None
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rec = {'west': {'path': west_p, 'sha256': sha(west_p)}, 'east': {'path': east_p, 'sha256': sha(east_p)},
       'keepFraction': keep, 'overlapPx': overlap, 'eastStart': east_start, 'feather': feather, 'width': width,
       'overlapMeanAbsDiff': ov, 'out': {'path': out, 'sha256': sha(out)},
       'note': 'west panel kept whole; east appended from eastStart; a feathered blend over the last `feather` columns of the west panel.'}
json.dump(rec, open(os.path.splitext(out)[0] + '.stitch.json', 'w'), indent=1)
print(json.dumps({'width': width, 'overlap': overlap, 'eastStart': east_start, 'overlapMeanAbsDiff': ov}))
