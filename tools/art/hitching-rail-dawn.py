"""The hitching rail alone, at dawn, for Room 36 (errata 182). No image operation.

Tyler, 2026-11-08: "At dawn I think the horses should all be gone. Just the
hitching post is there." The riders have taken their horses; the rail stays.

The rail is drawn in front of the horses, so its pixels in the night sheet's
rest frame are the rail's own: the top rail between the posts and the two
posts, taken by their rects (the rope loops that hung from the knots to the
horses' bridles are left behind; the wraps on the rail stay). It is scaled by
exactly the factor the engine draws the night group at -- the room's man at
its feet times its stature, over its figureHeight, nearest-neighbour as the
engine draws -- so the empty rail stands where the night rail stood, pixel for
pixel. Then it is relit by the dawn plate's ratio to the night's over the
ground it stands on, as tools/art/room36-dawn.py lights the street.

Writes art/props/room-36-hitching-rail-dawn.png and prints the prop entry
Room 36's annotation carries.

usage: python3 tools/art/hitching-rail-dawn.py
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NPC = 'content/ambient/hitching-horses.json'
NIGHT = 'art/backgrounds/room-02-main-street.png'
DAWN = 'art/backgrounds/room-36-main-street-dawn.png'
OUT = 'art/props/room-36-hitching-rail-dawn.png'
# In the rest frame's own rows and columns.
RAIL = (35, 234, 610, 259)     # the top rail between the posts
LEFT_POST = (3, 205, 42, 403)
RIGHT_POST = (605, 222, 643, 405)


def man_at(room, x, y):
    out = subprocess.check_output(['node', '--experimental-strip-types', '-e', f"""
import('{ROOT}/engine/core/WalkBoxes.ts').then(({{WalkBoxes, heightIn}}) => {{
  const fs = require('fs'); const m = JSON.parse(fs.readFileSync('{ROOT}/content/manifest.json','utf8'));
  for (const p of m.rooms) {{ const r = JSON.parse(fs.readFileSync('{ROOT}/'+p,'utf8')); if (r.id !== '{room}') continue;
    const n = new WalkBoxes(r.walkBoxes, () => true).nearest({x}, {y}); console.log(n ? heightIn(n.box, {y}) : 0); }}
}});"""], stderr=subprocess.DEVNULL, cwd=ROOT).decode().strip()
    return float(out)


def main():
    npc = json.load(open(os.path.join(ROOT, NPC)))
    sprite = npc['sprite']
    x, y, w, h = sprite['frames'][0]
    rest = np.asarray(Image.open(os.path.join(ROOT, sprite['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))).copy()
    yy, xx = np.mgrid[0:h, 0:w]
    inside = lambda r: (xx >= r[0]) & (xx < r[2]) & (yy >= r[1]) & (yy < r[3])
    keep = (inside(RAIL) | inside(LEFT_POST) | inside(RIGHT_POST)) & (rest[..., 3] > 0)
    rest[~keep] = 0
    scale = man_at('main_street_dawn', npc['x'], npc['y']) * sprite['stature'] / sprite['figureHeight']
    size = (round(w * scale), round(h * scale))
    rail = Image.fromarray(rest, 'RGBA').resize(size, Image.NEAREST)
    # Relight: the dawn plate over the night plate, on the ground the rail stands on.
    left = round(npc['x'] - size[0] / 2)
    ground = (slice(npc['y'] - size[1], 858), slice(left, left + size[0]))
    night = np.asarray(Image.open(os.path.join(ROOT, NIGHT)).convert('RGB')).astype(float)[ground].reshape(-1, 3)
    dawn = np.asarray(Image.open(os.path.join(ROOT, DAWN)).convert('RGB')).astype(float)[ground].reshape(-1, 3)
    lit = night.sum(1) > 60
    ratio = np.median(dawn[lit] / np.maximum(night[lit], 1), axis=0)
    px = np.asarray(rail).astype(float)
    px[..., :3] = np.clip(px[..., :3] * ratio, 0, 255)
    os.makedirs(os.path.join(ROOT, os.path.dirname(OUT)), exist_ok=True)
    Image.fromarray(px.round().astype(np.uint8), 'RGBA').save(os.path.join(ROOT, OUT))
    prop = {'id': 'hitching_rail', 'sheet': OUT, 'x': npc['x'], 'y': npc['y'], 'frame': [0, 0, size[0], size[1]]}
    print(OUT, size, 'scale', round(scale, 4), 'ratio', ratio.round(3))
    print(json.dumps(prop))


if __name__ == '__main__':
    main()
