"""Room 4's plate from operation 2, repaired and derived. No image operation.

1. THE CUSHION. Operation 2 (the people-free edit of the composition master)
   dropped the champion's cushion, which doc 54 writes into THE CHAIRS
   ("The champion's chair has a cushion"). Nobody stood in front of it, so
   the master's own pixels are the cushion: copied back where the two images
   differ inside its measured box (x 1055-1173, y 540-580), and nowhere
   else. Doc 46 Part Eleven: a small region is repainted, not regenerated.
2. THE FRAME. The generator drew the slate, door and window tops at y 95-113,
   above the fixed Room 5 crop (y 170), so Room 4 takes its own crop: the
   width x 8-1528, y 120-804 (exactly 20:9), resampled to 1920x864 by derive.mjs's
   resampler. Recorded in art/staging/room-04/plate-01/frame.json.
"""
import json, os, subprocess
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-04')
CUSHION = (1052, 536, 1178, 585)
CROP = {'x': 8, 'y': 120, 'width': 1520, 'height': 684}
m = np.asarray(Image.open(f'{S}/composition-master-01.png').convert('RGB')).astype(int)
p = np.asarray(Image.open(f'{S}/plate-01/source.png').convert('RGB')).astype(int)
x0, y0, x1, y1 = CUSHION
diff = np.abs(m - p).sum(2) > 24
mask = np.zeros(diff.shape, bool)
mask[y0:y1, x0:x1] = diff[y0:y1, x0:x1]
out = p.copy()
out[mask] = m[mask]
Image.fromarray(out.astype(np.uint8)).save(f'{S}/plate-01/source-repaired.png')
json.dump({'source': 'art/staging/room-04/plate-01/source-repaired.png', 'crop': CROP,
           'out': 'art/staging/room-04/plate-01/candidate-1920x864.png',
           'repair': {'what': 'the champion\'s cushion, from composition-master-01', 'box': list(CUSHION),
                      'pixels': int(mask.sum())}},
          open(f'{S}/plate-01/frame.json', 'w'), indent=1)
print('cushion pixels restored', int(mask.sum()))
