#!/usr/bin/env python3
"""ROOM 5's PROUD FLOORBOARD, as two deterministic state images per plate.

    python3 tools/pixelart/floorboard.py

Tyler's playtest finding (2026-09-05): the writing says the board "sits a
little proud of the others" and the accepted plates draw it flush, so the
authored physical fact did not exist on screen. This does not repaint the
room. It takes ONE plank's own pixels out of each accepted plate and writes
them back as a hotspot state image over the unchanged plate:

  REST     the plank lifted PROUD by two rows -- its own pixels moved up, a
           dark gap the height of the lift showing under its near (lower)
           edge, a restrained lift of the top lip, the end grain a shade
           darker at both ends. Nail-head proud, not a step.
  PRESSED  the plank flush, exactly the plate's own pixels: what the board
           looks like with a foot on it, and what it looked like before.

Same plank, same bounds, same lift, on the DAY plate and on the NIGHT plate:
each image is derived from its own plate so the light matches, and the
geometry is identical by construction. No image model, no invented pixels.
The output is a full-plate RGBA with only the plank region opaque, as the
hanging lamp's state image is, and the record beside it carries the bounds
and the hashes.
"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image

OUT = Path('art/staging/room-05/floorboard')
PLATES = {
    'day': 'art/staging/room-05/plate-02/candidate-1920x864.png',
    'night': 'art/staging/room-05/plate-03-night-lift/candidate-1920x864.png',
}
# THE PHYSICAL PLANK, read on the day plate (tools/pixelart/floorboard.py's
# own scan): the board row directly under the counter's base seam (rows
# 701-702), its body rows 707-718 and its lit lower edge 719-723, ending at
# the dark seam of rows 725-729; between the split at x~956 and the joint
# at x~1098. Inside the hotspot [880,704,240,36] and smaller than it: the
# rect is interaction geometry, this is the wood.
PLANK = (960, 707, 138, 18)          # x, y, w, h  -> rows 707..724, cols 960..1097
LIFT = 2                             # rows proud, "about the width of a nail head" at this scale
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

def build(plate_path):
    plate = np.array(Image.open(plate_path).convert('RGB')).astype(float)
    H, W = plate.shape[:2]
    x, y, w, h = PLANK
    plank = plate[y:y + h, x:x + w].copy()
    # PRESSED: the plate's own pixels, flush.
    pressed = np.zeros((H, W, 4)); pressed[y:y + h, x:x + w, :3] = plank; pressed[y:y + h, x:x + w, 3] = 255
    # REST: the same pixels lifted LIFT rows, the gap under the near edge dark.
    rest = np.zeros((H, W, 4))
    top = y - LIFT
    rest[top:top + h, x:x + w, :3] = plank; rest[top:top + h, x:x + w, 3] = 255
    # the top lip catches a little more light: the wood's own colour, lifted 14%
    rest[top, x:x + w, :3] = np.clip(plank[0] * 1.14, 0, 255)
    # the gap under the near edge: the seam colour below the plank, darkened, LIFT rows deep
    seam = plate[y + h:y + h + 3, x:x + w].mean(0)
    for r in range(LIFT):
        rest[top + h + r, x:x + w, :3] = seam * 0.62; rest[top + h + r, x:x + w, 3] = 255
    # end grain: the outermost column at each end a shade darker, the ends of a board that stands up
    for cx in (x, x + w - 1):
        rest[top:top + h, cx, :3] *= 0.92
    return rest, pressed

record = {'plank': dict(x=PLANK[0], y=PLANK[1], w=PLANK[2], h=PLANK[3], rows=f'{PLANK[1]}..{PLANK[1] + PLANK[3] - 1}', cols=f'{PLANK[0]}..{PLANK[0] + PLANK[2] - 1}'),
          'liftRows': LIFT, 'hotspotRect': [880, 704, 240, 36], 'plates': {}, 'images': {}}
OUT.mkdir(parents=True, exist_ok=True)
for name, plate_path in PLATES.items():
    rest, pressed = build(plate_path)
    suffix = '' if name == 'day' else '-night'
    for state, img in (('rest', rest), ('pressed', pressed)):
        p = OUT / f'board-{state}{suffix}.png'
        Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA').save(p, optimize=True)
        record['images'][f'{state}-{name}'] = {'path': str(p), 'sha256': sha(p)}
    record['plates'][name] = {'path': plate_path, 'sha256': sha(plate_path)}
record['note'] = ('Derived from the accepted plates by tools/pixelart/floorboard.py; the plates are unchanged. '
                  'REST is the plank lifted two rows with the gap under its near edge; PRESSED is the plank flush. '
                  'Same bounds and lift on both plates.')
(OUT / 'floorboard.json').write_text(json.dumps(record, indent=2))
print(json.dumps(record['images'], indent=1)); print('plank', record['plank'], 'lift', LIFT)
