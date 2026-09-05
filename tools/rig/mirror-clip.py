#!/usr/bin/env python3
"""Mirror a rigged clip for the opposite facing, deterministically.

    python3 tools/rig/mirror-clip.py art/actors/thad-walk-right art/actors/thad-walk-left

docs/52: Thad has no authored asymmetry, so ONE side-facing family is rigged
facing right and the left is this -- every frame flipped about its vertical
axis, byte-for-byte the same drawing seen from the other side. The rig.json is
copied with `facing` flipped, `walk_dx` negated and `mirroredFrom` recording
the source clip and the hash of every frame it was flipped from, so the record
says what it is rather than claiming a generation of its own. The canvas is
flipped whole, so `padding` (the figure's left margin) becomes the RIGHT
margin's old value: recomputed here from the flipped canvas.
"""
import hashlib, json, shutil, sys
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
rig = json.loads((src / 'rig.json').read_text())
dst.mkdir(parents=True, exist_ok=True)
for old in dst.glob('*.png'):
    old.unlink()
frames = sorted(src.glob('*.png'))
hashes = {}
for f in frames:
    im = Image.open(f).convert('RGBA')
    ImageOps.mirror(im).save(dst / f.name)
    hashes[f.name] = hashlib.sha256(f.read_bytes()).hexdigest()
# padding: the figure box's left edge on the flipped canvas = W - (padding + figure width)
W = Image.open(frames[0]).width
fig_w = rig['figure'][0]
out = dict(rig)
out['facing'] = 'left' if rig.get('facing') == 'right' else 'right'
if 'walk_dx' in out and out['walk_dx'] is not None:
    out['walk_dx'] = -out['walk_dx']
out['padding'] = W - (rig['padding'] + fig_w)
if 'invocation' in out:
    out['invocation'] = {**out['invocation'], 'facing': out['facing']}
out['mirroredFrom'] = {'clip': str(src), 'frames': hashes, 'note': 'docs/52 left/right policy: one side family, mirrored deterministically. Regenerate by re-running tools/rig/mirror-clip.py on the source clip; never edit these frames by hand.'}
(dst / 'rig.json').write_text(json.dumps(out, indent=2))
print(f'mirrored {len(frames)} frame(s) {src} -> {dst}; facing {out["facing"]}, walk_dx {out.get("walk_dx")}, padding {rig["padding"]} -> {out["padding"]}')
