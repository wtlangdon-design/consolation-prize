"""PHASE 1.5C -- THE BOARD AND THE TROUGH BECOME PLATE (doc 36 Q119).

    python3 tools/retrofit/street-integrate.py

Takes the in-context result's two masked regions (integrate-01) and composites
them into a NEW plate file, art/staging/room-02/street-candidate-02/
candidate-plate.png, with the mask edge feathered over 8 px so the seams fall
inside repainted mud and wall. Nothing outside the mask is read from the
result. Records the sha of both plates and the pixels that changed.
"""
import hashlib, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
WINDOW = 'art/staging/room-02/integrate-01/window-1920x864.png'
MASK = 'art/staging/room-02/integrate-01/mask-window.png'
OP = json.load(open('art/staging/room-02/integrate-01/integrate-op.json'))
WIN_X = OP['window']['plateX0']
OUT = 'art/staging/room-02/street-candidate-02/candidate-plate.png'
plate = np.array(Image.open(PLATE).convert('RGB')).astype(float)
win = np.array(Image.open(WINDOW).convert('RGB')).astype(float)
mask = np.array(Image.open(MASK).convert('L')) > 127
# feather: full weight inside, falling to 0 over the last 8 px inside the mask edge
dist = ndimage.distance_transform_edt(mask)
weight = np.clip(dist / 8.0, 0, 1)
full_w = np.zeros((864, 3610)); full_w[:, WIN_X:WIN_X + 1920] = weight
full_r = np.zeros_like(plate); full_r[:, WIN_X:WIN_X + 1920] = win
out = plate * (1 - full_w[..., None]) + full_r * full_w[..., None]
os.makedirs(os.path.dirname(OUT), exist_ok=True)
Image.fromarray(np.clip(out, 0, 255).astype('uint8')).save(OUT)
changed = np.abs(out - plate).sum(-1) > 6
full_m = np.zeros((864, 3610), bool); full_m[:, WIN_X:WIN_X + 1920] = mask
rec = {'schema': 1, 'note': __doc__.strip(), 'inputs': {PLATE: sha(PLATE), WINDOW: sha(WINDOW), MASK: sha(MASK)}, 'output': {OUT: sha(OUT)},
       'zones': OP['zones'], 'feather': 8, 'changedInsideMask': int((changed & full_m).sum()), 'changedOutsideMask': int((changed & ~full_m).sum())}
json.dump(rec, open('art/staging/room-02/street-candidate-02/integrate.json', 'w'), indent=1); open('art/staging/room-02/street-candidate-02/integrate.json', 'a').write('\n')
print(json.dumps({k: rec[k] for k in ('changedInsideMask', 'changedOutsideMask')}))
