"""PHASE 2A: key the casting sheets and cut each figure out (doc 36 Q128).

    python3 tools/art/phase2a-extract.py

Every Phase 2A casting call came back on flat magenta #FF00FF, which doc 38 R3
asks for because this cast wears dark wool and green sits inside those shadows.
This keys the magenta, despills the fringe it leaves on hair and coat edges,
splits each sheet into its figures by the clear magenta between them, and
writes one tight PNG per figure.

WHAT IT DOES NOT DO. It does not resize, pose, rig or relight anything. The
figure comes out at the size it was painted and the engine scales it to the
room's own curve at its feet (AmbientFile.sprite.figureHeight). Phase 2A is
static staging; poses are Phase 2B's, and only after Tyler has accepted these.
"""
import json, os
from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)

# THE KEY. Magenta is (255, 0, 255): a pixel is backdrop when red and blue are
# both high and green is low. The test is deliberately generous on the inside
# edge and then the despill fixes the rim, because a tight key leaves a magenta
# halo that no amount of compositing hides.
def key(rgb):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    magenta = (r > 150) & (b > 150) & (g < 110) & (r - g > 70) & (b - g > 70)
    return ~magenta


def despill(rgb, solid):
    """Pull the magenta out of edge pixels: cap green's opposites at its level."""
    out = rgb.astype(int).copy()
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    # Only where the pixel is spilled -- red and blue both above green.
    spill = solid & (r > g) & (b > g)
    lift = np.minimum(r, b)
    take = np.where(spill, (lift - g) // 2, 0)
    out[..., 0] = np.clip(r - take, 0, 255)
    out[..., 2] = np.clip(b - take, 0, 255)
    return out.astype(np.uint8)


def columns(mask, gap=14, floor=4):
    """Figure spans: runs of columns with real ink, separated by clear gaps."""
    ink = mask.sum(axis=0)
    on = ink > floor
    spans, start, blank = [], None, 0
    for x, v in enumerate(on):
        if v:
            if start is None:
                start = x
            blank = 0
        elif start is not None:
            blank += 1
            if blank >= gap:
                spans.append((start, x - blank + 1))
                start, blank = None, 0
    if start is not None:
        spans.append((start, len(on)))
    return [(a, b) for a, b in spans if b - a > 30]


def cut(path, out_dir, names, gap=14, splits=None):
    im = Image.open(path).convert('RGB')
    rgb = np.asarray(im)
    solid = key(rgb)
    clean = despill(rgb, solid)
    alpha = (solid * 255).astype(np.uint8)
    os.makedirs(out_dir, exist_ok=True)
    if splits:
        # AN EXPLICIT CUT, because the gap rule cannot find one that is not
        # there. The letter-writer's table stands against his hand: at the
        # narrowest column between them there are still 113 opaque rows, and
        # no clear-gap threshold separates them without also splitting a coat.
        # The column is measured off the ink profile and written down here.
        edges = [0, *splits, solid.shape[1]]
        spans = list(zip(edges, edges[1:]))
    else:
        spans = columns(solid, gap=gap)
    if len(spans) != len(names):
        raise SystemExit(f'{path}: found {len(spans)} figure(s) {spans}, named {len(names)}. '
                         'Refusing to guess which is which.')
    made = []
    for (x0, x1), name in zip(spans, names):
        sub = solid[:, x0:x1]
        rows = np.where(sub.any(axis=1))[0]
        cols = np.where(sub.any(axis=0))[0]
        top, bottom = int(rows[0]), int(rows[-1]) + 1
        left, right = x0 + int(cols[0]), x0 + int(cols[-1]) + 1
        rgba = np.dstack([clean[top:bottom, left:right], alpha[top:bottom, left:right]])
        one = Image.fromarray(rgba, 'RGBA')
        target = f'{out_dir}/{name}.png'
        one.save(target)
        made.append({'id': name, 'file': target, 'width': one.width, 'height': one.height,
                     'fromSource': [left, top, one.width, one.height]})
        print(f'  {name:16s} {one.width:4d}x{one.height:4d}  from {left},{top}')
    return made


JOBS = [
    ('art/staging/room-02/cast-pie-woman-02/source.png',
     'art/staging/room-02/cast-pie-woman-02', ['pie-woman'], 14),
    # The man and his station are separate objects and are cut apart on purpose:
    # the station is a fixed prop of the room and he is a mover in front of it.
    ('art/staging/room-02/cast-letter-writer-02/source.png',
     'art/staging/room-02/cast-letter-writer-02', ['letter-writer', 'letter-writer-station'], 14,
     [588]),
    ('art/staging/room-02/cast-map-seller-02/source.png',
     'art/staging/room-02/cast-map-seller-02', ['map-seller'], 14),
    ('art/staging/room-03/cast-bar-stove-02/source.png',
     'art/staging/room-03/cast-bar-stove-02',
     ['bar-1', 'bar-2', 'bar-3', 'stove-man'], 20),
    ('art/staging/room-03/cast-card-landing-02/source.png',
     'art/staging/room-03/cast-card-landing-02',
     ['card-1', 'card-2', 'card-3', 'card-4', 'landing-man'], 20),
    # THE FINAL CORRECTION PAIR. Only two men, and they were sent alone on
    # purpose (doc 36 Q131) -- so the gap rule has an enormous gap to find and
    # cannot mistake a shoulder for a boundary. Whether either of them is
    # actually promoted into the room is a separate judgement made after this.
    ('art/staging/room-03/cast-bar-pair-01/source.png',
     'art/staging/room-03/cast-bar-pair-01', ['bar-2', 'bar-3'], 40),
]

record = {'schema': 1, 'note': 'PHASE 2A: what was cut out of each casting sheet, at the size it '
          'was painted. No resize, no pose, no relight -- the engine scales these to each room\'s '
          'own depth curve at the character\'s feet.', 'sheets': []}
for job in JOBS:
    source, out_dir, names, gap = job[:4]
    splits = job[4] if len(job) > 4 else None
    print(f'\n{source}')
    record['sheets'].append({'source': source,
                             'figures': cut(source, out_dir, names, gap, splits)})
json.dump(record, open('art/staging/phase2a-extraction.json', 'w'), indent=1)
print('\nart/staging/phase2a-extraction.json')
