"""PHASE 2A: how much detail does a figure carry, at the size it is drawn?

    python3 tools/art/phase2a-detail-audit.py

Tyler, on the deployed rooms: the new NPCs read as modern painted illustrations
reduced into the game, and Thad beside them looks pixelated and simplified. The
question this answers is not "are they pretty" -- that is his -- but "are they
the same KIND of picture", which is measurable, because the difference between
authored pixel art and a downsampled painting shows up in the pixels:

  coloursPerK   unique RGB values per 1000 opaque pixels. Authored pixel art
                reuses a small palette; a resampled painting invents a new
                colour at every edge.
  flat          the fraction of opaque pixels whose four neighbours are ALL
                exactly the same colour. Pixel art is mostly flat runs. A
                photographic gradient has almost none.
  step          the mean absolute luminance difference between horizontally
                adjacent opaque pixels. Small and continuous means a gradient;
                mostly zero with occasional jumps means a drawn edge.

THE MEASUREMENT IS TAKEN AT THE DEPLOYED SIZE, never on the source sheet. A
1200 px painting and a 250 px sprite are not comparable pictures, and the whole
defect is that one of them was made by shrinking the other.
"""
import json, os, sys
from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)


def stats(path, target_h=None):
    im = Image.open(path).convert('RGBA')
    if target_h and abs(im.height - target_h) > 1:
        scale = target_h / im.height
        im = im.resize((max(1, round(im.width * scale)), target_h), Image.LANCZOS)
    a = np.asarray(im)
    alpha = a[..., 3] > 128
    n = int(alpha.sum())
    if n == 0:
        return None
    rgb = a[..., :3]
    flat_px = rgb[alpha]
    colours = len(np.unique(flat_px.reshape(-1, 3), axis=0))
    # flatness: all four neighbours identical
    same = np.ones_like(alpha)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        rolled = np.roll(np.roll(rgb, dy, 0), dx, 1)
        ralpha = np.roll(np.roll(alpha, dy, 0), dx, 1)
        same &= (rolled == rgb).all(axis=2) & ralpha
    flat = float((same & alpha).sum()) / n
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])
    both = alpha[:, 1:] & alpha[:, :-1]
    step = float(np.abs(np.diff(lum, axis=1))[both].mean()) if both.any() else 0.0
    return {'file': path, 'size': [im.width, im.height], 'opaque': n,
            'colours': colours, 'coloursPerK': round(colours / n * 1000, 1),
            'flat': round(flat, 3), 'step': round(step, 2)}


SUBJECTS = [
    ('THAD (the reference)', 'art/actors/thad-stand-front/stand-00.png', 392),
    ('THAD in the street', 'art/actors/thad-stand-front/stand-00.png', 231),
    ('WINNIE (accepted)', 'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png', None),
]
sheets = json.load(open('art/staging/phase2a-sheets.json'))['sheets']
for one in sheets:
    SUBJECTS.append((one['id'], one['sheet'], None))
# the legacy street sheets, as the OTHER end of the range: they are the art
# Tyler accepted the look of for years, just at the wrong size.
SUBJECTS.append(('legacy pie woman', 'art/actors/ambient-pie-woman.png', None))
SUBJECTS.append(('legacy map seller', 'art/actors/ambient-map-seller.png', None))

rows = []
print(f"{'subject':26s} {'size':>10s} {'colours':>8s} {'per 1k':>7s} {'flat':>6s} {'step':>6s}")
for label, path, height in SUBJECTS:
    got = stats(path, height)
    if not got:
        continue
    got['subject'] = label
    rows.append(got)
    print(f"{label:26s} {got['size'][0]:4d}x{got['size'][1]:<4d} {got['colours']:8d} "
          f"{got['coloursPerK']:7.1f} {got['flat']:6.3f} {got['step']:6.2f}")

os.makedirs('proofs/room-03', exist_ok=True)
json.dump({'schema': 1, 'note': __doc__.strip(), 'rows': rows},
          open('proofs/room-03/phase2a-detail-audit.json', 'w'), indent=1)
print('\nproofs/room-03/phase2a-detail-audit.json')
