"""ONE LEVEL OF PIXELATION FOR EVERY CHARACTER (errata 102, Tyler chose B).

Every figure is drawn with the same number of art pixels for a man's height:
N (115, the level of the funeral mock-up Tyler chose). Each frame of every
character sheet is reduced to its own art grid -- block = a man's height in that
sheet's pixels / N -- with a premultiplied BOX and drawn back up NEAREST, the
grid anchored at the frame's bottom-left so the feet row holds still between
frames. A drawing coarser than N is unchanged by this (it cannot gain detail)
and is redrawn instead.

A man's height in a sheet's pixels: its `figureHeight` (the engine draws it at
the room's man), else the room's man at its feet (1:1 sheets); for an actor's
clips, the rig's figure height.

Usage: one-level.py [--n 115] [--dry] [--only <path part> ...]   prints every sheet and its block size

--only snaps just the sheets whose path contains one of the parts: a NEW sheet is snapped on its
own. Run over the whole game again, it rewrote 280 finished sheets -- snapping a frame that was
snapped and then despilled moves its outline by a pixel -- so a finished sheet is never re-snapped.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
N = float(sys.argv[sys.argv.index('--n') + 1]) if '--n' in sys.argv else 115.0
DRY = '--dry' in sys.argv
ONLY = []
if '--only' in sys.argv:
    for a in sys.argv[sys.argv.index('--only') + 1:]:
        if a.startswith('--'): break
        ONLY.append(a)
SKIP_ACTORS = {'coach', 'driver'}


def recut(out, a, b):
    """A behind-counter figure's lowest rows are not drawing: they are the cut along the counter's
    far edge (its `waistOn`). Snapping moved that cut by a block, and the waist check caught it. The
    original cut line is put back: below it nothing, above it the snapped colours carried down."""
    al = a[..., 3] > 128
    band = int(np.ceil(b * 2))
    for x in range(a.shape[1]):
        ys = np.where(al[:, x])[0]
        if len(ys) == 0: continue
        last = ys[-1]
        top = max(0, last - band)
        out[last + 1:, x] = 0
        for y in range(top, last + 1):
            if al[y, x] and out[y, x, 3] == 0:
                above = np.where(out[:y, x, 3] > 0)[0]
                if len(above): out[y, x] = out[above[-1], x]
    return out


def snap(a, b):
    """Reduce an RGBA frame to blocks of about b pixels and draw it back up, KEEPING THE FIGURE'S
    TOP AND BOTTOM ROWS. The grid is fitted to the figure's own opaque box: the block is nudged
    (under 1/2 of a block across the figure) so a whole number of blocks spans the box exactly,
    and anchored at its top-left. A grid laid from the frame's corner shaved a row at the soles or
    the crown, and the waist check and the rig-record check both caught it. If the crown's or
    soles' block row would come out empty under the half-cover rule, its most-covered blocks are
    kept, so the figure is exactly as tall as it was."""
    al0 = a[..., 3] > 128
    rows, cols = np.where(al0.any(1))[0], np.where(al0.any(0))[0]
    if len(rows) == 0: return a
    t, bt, l = rows[0], rows[-1] + 1, cols[0]
    H = bt - t
    nh = max(1, int(round(H / b))); bb = H / nh
    nw = int(np.ceil((a.shape[1] - l) / bb)); W = int(np.ceil(nw * bb))
    crop = np.zeros((H, W, 4), np.uint8); cw = min(W, a.shape[1] - l)
    crop[:, :cw] = a[t:bt, l:l + cw]
    pre = crop.astype(np.float32); pre[..., :3] *= pre[..., 3:4] / 255
    region = (0.0, 0.0, nw * bb, float(H))
    small = np.stack([np.asarray(Image.fromarray(pre[..., c], 'F').resize((nw, nh), Image.BOX, box=region)) for c in range(4)], -1)
    al = small[..., 3]
    keep = al >= 128
    for r in {0, nh - 1}:
        if not keep[r].any() and al[r].max() > 0:
            keep[r] = al[r] >= al[r].max() * 0.5
    rgb = np.where(al[..., None] > 1, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    small = np.dstack([np.clip(rgb, 0, 255), np.where(keep, 255, 0)]).astype(np.uint8)
    up = np.asarray(Image.fromarray(small, 'RGBA').resize((int(round(nw * bb)), H), Image.NEAREST))
    out = np.zeros_like(a)
    out[t:bt, l:l + cw] = up[:, :cw]
    return out


def man_at(room, x, y):
    import subprocess
    out = subprocess.check_output(['node', '--experimental-strip-types', '-e', f"""
import('{ROOT}/engine/core/WalkBoxes.ts').then(({{WalkBoxes, heightIn}}) => {{
  const fs = require('fs'); const m = JSON.parse(fs.readFileSync('{ROOT}/content/manifest.json','utf8'));
  for (const p of m.rooms) {{ const r = JSON.parse(fs.readFileSync('{ROOT}/'+p,'utf8')); if (r.id !== '{room}') continue;
    const n = new WalkBoxes(r.walkBoxes, () => true).nearest({x}, {y}); console.log(n ? heightIn(n.box, {y}) : 0); }}
}});"""], stderr=subprocess.DEVNULL).decode().strip()
    return float(out or 0)


jobs = {}      # (sheet, tuple(frame)) -> block
cut = set()    # (sheet, tuple(frame)) of figures cut at a counter's edge
manifest = json.load(open(os.path.join(ROOT, 'content/manifest.json')))
for p in manifest['ambient']:
    n = json.load(open(os.path.join(ROOT, p)))
    places = [(n['room'], n['x'], n['y'], n.get('sprite'))] + [(r, a.get('x', n['x']), a.get('y', n['y']), a.get('sprite') or n.get('sprite')) for r, a in (n.get('placements') or {}).items()]
    if n.get('exit', {}).get('sheet'):
        ex = n['exit']; places.append((n['room'], ex['path'][0][0], ex['path'][0][1], ex))
    for kind in ('loop', 'arrive'):   # a looping or arriving walker is a figure too
        if n.get(kind, {}).get('sheet'):
            ex = n[kind]; places.append((n['room'], ex['path'][0][0], ex['path'][0][1], ex))
    for room, x, y, sp in places:
        if not sp or not sp.get('frames') or n.get('posture') == 'identity': continue
        # A man's height in this sheet's pixels: the engine draws figureHeight at the room's man times
        # stature, so a man is figureHeight / stature sheet pixels (an animal's stature is small).
        man = (sp['figureHeight'] / (sp.get('stature') or 1.0)) if sp.get('figureHeight') else None
        if not man:
            m = man_at(room, x, y)
            if m <= 0: continue
            man = m / (1.0)
        b = man / N
        for fr in sp['frames']:
            jobs.setdefault((sp['sheet'], tuple(fr)), b)
            if sp.get('waistOn') is not None: cut.add((sp['sheet'], tuple(fr)))
for d in sorted(os.listdir(os.path.join(ROOT, 'art/actors'))):
    rp = os.path.join(ROOT, 'art/actors', d, 'rig.json')
    if not os.path.exists(rp) or d.split('-')[0] in SKIP_ACTORS: continue
    r = json.load(open(rp))
    if r.get('kind') == 'head-overlay' or 'overlay_rect' in r or not r.get('figure'): continue
    b = r['figure'][1] / N
    for f in sorted(os.listdir(os.path.join(ROOT, 'art/actors', d))):
        if f.endswith('.png'):
            jobs[(f'art/actors/{d}/{f}', None)] = b
by_sheet = {}
for (sheet, fr), b in jobs.items(): by_sheet.setdefault(sheet, []).append((fr, b))
for sheet, items in sorted(by_sheet.items()):
    if ONLY and not any(part in sheet for part in ONLY): continue
    path = os.path.join(ROOT, sheet)
    a = np.asarray(Image.open(path).convert('RGBA')).copy()
    for fr, b in items:
        if b <= 1.05 or DRY: continue
        if fr is None:
            a = snap(a, b)
        else:
            x, y, w, h = fr
            if x + w > a.shape[1] or y + h > a.shape[0]:
                print(f'  ! {sheet}: frame {fr} lies outside the {a.shape[1]}x{a.shape[0]} sheet'); continue
            cell = a[y:y + h, x:x + w].copy()
            out = snap(cell, b)
            if (sheet, tuple(fr)) in cut: out = recut(out, cell, b)
            a[y:y + h, x:x + w] = out
    print(f'{sheet}: block {min(b for _, b in items):.2f}' + (' (dry)' if DRY else ''))
    if not DRY:
        Image.fromarray(a).save(path)
