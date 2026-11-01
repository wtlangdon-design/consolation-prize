"""Deke Vessel walking out of the Nugget, as a strip of frames for Tyler.

Reads the screencast tools/gauntlet/deke-walk-proof.mjs wrote, finds the
walk by what differs from the empty room he leaves behind (the last frame),
and lays out evenly spaced moments of it, each a crop of the floor from the
batwing doors to the bar. Labels are the time since he set off.

  python3 tools/gauntlet/deke-walk-strip.py [count]
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw

D = 'renders/proofs/room-03-deke-walk/raw-captures-ignored/'
OUT = 'renders/room-03-deke-walks-out-strip.png'
count = int(sys.argv[1]) if len(sys.argv) > 1 else 12
frames = json.load(open(D + 'frames.json'))['frames']
grey = lambda f: np.asarray(Image.open(D + f['name']).convert('L')).astype(int)
empty = grey(frames[-1])

# He is in the frame where the floor from the door to the bar differs from
# the empty room; he is WALKING where that difference has moved.
centre = []
for f in frames:
    d = np.abs(grey(f) - empty)[300:870, 0:1250] > 40
    xs = np.nonzero(d.any(0))[0]
    centre.append(np.median(np.nonzero(d)[1]) if d.sum() > 8000 else None)
moving = [i for i in range(1, len(frames))
          if centre[i] is not None and centre[i - 1] is not None and centre[i] < centre[i - 1] - 3]
first, last = moving[0] - 1, moving[-1] + 1
t0 = frames[first]['t']
picks = sorted({round(first + (last - first) * k / (count - 1)) for k in range(count)})

CROP = (0, 330, 1250, 870)
scale = 0.5
w, h = int((CROP[2] - CROP[0]) * scale), int((CROP[3] - CROP[1]) * scale)
cols = 3
rows = (len(picks) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 8) + 8, rows * (h + 30) + 8), (24, 20, 16))
draw = ImageDraw.Draw(sheet)
for k, i in enumerate(picks):
    im = Image.open(D + frames[i]['name']).convert('RGB').crop(CROP).resize((w, h), Image.NEAREST)
    x, y = 8 + (k % cols) * (w + 8), 8 + (k // cols) * (h + 30)
    sheet.paste(im, (x, y))
    draw.text((x, y + h + 6), f"{frames[i]['t'] - t0:+.2f} s", fill=(230, 220, 200))
sheet.save(OUT)
print(json.dumps({'out': OUT, 'walkFrames': [first, last], 'seconds': round(frames[last]['t'] - t0, 2),
                  'picked': picks}))

# THE MANIFEST IS WHAT IS KEPT (CLAUDE.md, renders): every capture's hash, so
# the next run can be compared against this one; the frames themselves are
# raw-captures-ignored.
import hashlib, subprocess
P = 'renders/proofs/room-03-deke-walk/'
sha = lambda path: hashlib.sha256(open(path, 'rb').read()).hexdigest()
git = lambda *a: subprocess.run(['git', *a], capture_output=True, text=True).stdout.strip()
exitBlock = json.load(open('content/ambient/deke-vessel.json'))['exit']
json.dump({
    'what': 'Deke Vessel walks out of the Nugget after "All right." (Room 3, A3)',
    'route': '?fixture=w1-piano&room=nugget; his opening left by deke_vessel7; TALK TO; deke_vessel2, 3, 4, 6',
    'commit': git('rev-parse', 'HEAD'), 'branch': git('rev-parse', '--abbrev-ref', 'HEAD'),
    'dirty': bool(git('status', '--porcelain')),
    'exit': {k: exitBlock[k] for k in ('path', 'speed', 'fps', 'figureHeight', 'drawnFacing')},
    'assets': {p: sha(p) for p in ('art/actors/deke-vessel-walk.png', 'art/actors/deke-vessel.png')},
    'walk': {'firstFrame': frames[first]['name'], 'lastFrame': frames[last]['name'],
             'seconds': round(frames[last]['t'] - t0, 2)},
    'captures': [{'name': f['name'], 't': f['t'], 'sha256': sha(D + f['name'])} for f in frames],
    'strip': {'path': OUT, 'sha256': sha(OUT), 'picked': [frames[i]['name'] for i in picks]},
}, open(P + 'proof.json', 'w'), indent=1)
Image.open(OUT).save(P + 'contact-sheet.webp', quality=90)
open(P + 'index.html', 'w').write(
    '<!doctype html><meta charset="utf-8"><title>Deke walks out</title>'
    '<body style="background:#181410;color:#e6dcc8;font:14px sans-serif">'
    '<p>Deke Vessel walks out of the Nugget after "All right." -- times are seconds since he set off. '
    'Hashes and route in proof.json.</p><img src="contact-sheet.webp" style="max-width:100%"></body>\n')
