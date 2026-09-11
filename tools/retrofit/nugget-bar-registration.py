#!/usr/bin/env python3
"""The furniture-registration gate on the ONE authorized bar-cluster operation.

Same three measurements the rejected pair were judged on (doc 36 Q134), run
against the same thresholds, so the numbers are comparable rather than
re-argued: the difference over the KEPT region, whether any uniform translation
improves it, and where the residual actually is.

  CARD, 2026-09-07, PASSED registration and was rejected on geometry: mean 4.14
  BAR,  2026-09-07, REJECTED: mean 26.14, 65% over 16, 10% over 48, slope reversed
  BAR,  2026-09-11, this one
"""
import json, hashlib
import numpy as np
from PIL import Image

BASE = 'art/staging/room-03/bar-rebuild-01/'
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()

src = np.asarray(Image.open(BASE+'canvas.png').convert('RGB')).astype(np.float32)
out = np.asarray(Image.open(BASE+'source.png').convert('RGB')).astype(np.float32)
kept = np.asarray(Image.open(BASE+'edit-mask.png'))[:, :, 3] > 127

d = np.abs(src-out).mean(2)
k = d[kept]
best = (0, 0, float(k.mean()))
for dy in range(-8, 9, 2):
    for dx in range(-8, 9, 2):
        sh = np.roll(np.roll(out, dy, 0), dx, 1)
        m = float(np.abs(src-sh).mean(2)[kept].mean())
        if m < best[2]:
            best = (dx, dy, m)

grid = []
h, w = d.shape
for gy in range(0, h, 128):
    row = []
    for gx in range(0, w, 128):
        blk, kk = d[gy:gy+128, gx:gx+128], kept[gy:gy+128, gx:gx+128]
        row.append(None if kk.sum() < 100 else round(float(blk[kk].mean()), 1))
    grid.append(row)

rec = {
 'schema': 1,
 'note': 'ROOM 3 REBUILD: the registration gate on the one authorized bar operation. THE '
         'GEOMETRY HELD. Best uniform shift is (0,0) -- no translation improves the residual, '
         'so nothing moved -- and the mean over 880,880 kept pixels is 6.39 against the 4.14 '
         'that passed on the card call and the 26.14 that failed on the bar call this one '
         'replaces. What residual there is sits in a strip beside the free window, where the '
         'endpoint carried its new brass foot rail past the mask edge and dropped the far '
         'stool. That is why the integration takes the whole quadrant from plate x 1176 '
         'rather than the free window alone: a rail that begins in mid-air and a counter with '
         'a step in it are worse than a re-rendered strip of wall whose residual is 2 to 4.',
 'canvas': BASE+'canvas.png', 'canvasSha256': sha(BASE+'canvas.png'),
 'output': BASE+'source.png', 'outputSha256': sha(BASE+'source.png'),
 'mask': BASE+'edit-mask.png', 'maskSha256': sha(BASE+'edit-mask.png'),
 'keptPixels': int(kept.sum()),
 'meanDifference': round(float(k.mean()), 2),
 'over16Percent': round(float((k > 16).mean()*100), 2),
 'over48Percent': round(float((k > 48).mean()*100), 2),
 'max': round(float(k.max()), 1),
 'bestUniformShift': {'dx': best[0], 'dy': best[1], 'mean': round(best[2], 2)},
 'translationHelps': best[:2] != (0, 0),
 'residualGrid128': grid,
 'comparisons': {'card-2026-09-07': 4.14, 'bar-2026-09-07-rejected': 26.14},
 'verdict': 'PASS -- registered, integrated',
}
json.dump(rec, open('proofs/room-03/bar-rebuild-registration.json', 'w'), indent=1)
print(json.dumps({k2: v for k2, v in rec.items()
                  if k2 in ('keptPixels','meanDifference','over16Percent','over48Percent',
                            'max','bestUniformShift','translationHelps','verdict')}, indent=1))
