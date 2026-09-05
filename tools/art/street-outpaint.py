#!/usr/bin/env python3
"""THE OUTPAINT CANVAS AND ITS MASK for Main Street's east panel (tools/art/retrofit.mjs).

Lays the right KEEP fraction of the west SOURCE (1536x1024, untouched) on the
left of a fresh 1536x1024 canvas and leaves the rest empty; writes a mask of
the same size whose alpha is opaque where the model must keep the picture and
transparent where it may paint. Deterministic; records the numbers beside it.

usage: street-outpaint.py <west source> <out dir> [keep fraction, default 0.30]
"""
import json, sys, os, hashlib
from PIL import Image

src, out_dir = sys.argv[1], sys.argv[2]
keep = float(sys.argv[3]) if len(sys.argv) > 3 else 0.30
os.makedirs(out_dir, exist_ok=True)
west = Image.open(src).convert('RGBA')
W, H = west.size
assert (W, H) == (1536, 1024), (W, H)
keep_px = int(round(W * keep))
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.paste(west.crop((W - keep_px, 0, W, H)), (0, 0))
mask = Image.new('RGBA', (W, H), (0, 0, 0, 0))
mask.paste((255, 255, 255, 255), (0, 0, keep_px, H))
canvas.save(os.path.join(out_dir, 'outpaint-canvas.png'))
mask.save(os.path.join(out_dir, 'outpaint-mask.png'))
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rec = {'note': 'Outpaint canvas: the west source\'s right part laid at the left of a fresh canvas; the mask keeps it and frees the rest for the model.',
       'westSource': {'path': src, 'sha256': sha(src)}, 'keepFraction': keep, 'keepPx': keep_px,
       'canvas': {'path': os.path.join(out_dir, 'outpaint-canvas.png'), 'sha256': sha(os.path.join(out_dir, 'outpaint-canvas.png'))},
       'mask': {'path': os.path.join(out_dir, 'outpaint-mask.png'), 'sha256': sha(os.path.join(out_dir, 'outpaint-mask.png'))}}
json.dump(rec, open(os.path.join(out_dir, 'outpaint.json'), 'w'), indent=1)
print(json.dumps({'keepPx': keep_px, 'canvas': rec['canvas']['path']}))
