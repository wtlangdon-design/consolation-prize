"""The hitching rail alone, at dawn, for Room 36 (errata 187). No image operation.

Tyler, 2026-11-08: "At dawn I think the horses should all be gone. Just the
hitching post is there." The riders have taken their horses; the rail stays.

The rail is drawn in front of the horses, so its pixels in the night sheet's
rest frame are the rail's own: the top rail between the posts and the two
posts, taken by their rects (the rope loops that hung from the knots to the
horses' bridles are left behind; the wraps on the rail stay). It is scaled by
exactly the factor the engine draws the night group at -- the room's man at
its feet times its stature, over its figureHeight, nearest-neighbour as the
engine draws -- so the empty rail stands where the night rail stood, pixel for
pixel (its base line is the frame's foot, below the horses' hooves when the
group declares a foot row: errata 201). Then it is relit by the dawn plate's
ratio to the night's over the ground it stands on, as tools/art/room36-dawn.py
lights the street.

The night rail is the rail AS THE NIGHT DRAWS IT (errata 198): Room 2's
`figureLight` grades the horses into the street's night -- brightness,
contrast, saturation, then the light's colour as a multiply, in that order,
as Renderer.drawTinted does -- so the rail is graded the same way first, and
the dawn ratio is laid on that. Change the night's grade and this follows it.

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
NIGHT_ANNOTATION = 'reference/room-02/annotation.json'
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


def night_grade(rgb, npc_id):
    """Room 2's figureLight on this figure, as the engine draws it: the canvas
    filter's brightness, contrast and saturate (the CSS filter functions, on
    0-1 sRGB values), then the light's colour as a multiply. None named: as drawn."""
    light = json.load(open(os.path.join(ROOT, NIGHT_ANNOTATION))).get('figureLight')
    if not light or npc_id not in light['figures']:
        return rgb
    grade = {**light, **light.get('perFigure', {}).get(npc_id, {})}
    p = rgb / 255.0
    if 'brightness' in grade:
        p = np.clip(p * grade['brightness'], 0, 1)
    if 'contrast' in grade:
        p = np.clip((p - 0.5) * grade['contrast'] + 0.5, 0, 1)
    if 'saturate' in grade:
        s = grade['saturate']
        matrix = np.array([
            [0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s],
            [0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s],
            [0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s]])
        p = np.clip(p @ matrix.T, 0, 1)
    p = p * np.clip(np.array(grade.get('light', [1, 1, 1]), dtype=float), 0, 1)
    return p * 255.0


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
    # The group's feet are its foot row, on its y (errata 201); the frame reaches below them by the rows under it,
    # as the engine draws it (engine/core/Ambient.ts drawnBelowFeet). The prop's base line is the frame's foot.
    foot = sprite.get('footRow', h - 1)
    base = npc['y'] + round((h - 1 - foot) * size[1] / h)
    # Relight: the dawn plate over the night plate, on the ground the rail stands on.
    left = round(npc['x'] - size[0] / 2)
    ground = (slice(base - size[1], min(858, base + 8)), slice(left, left + size[0]))
    night = np.asarray(Image.open(os.path.join(ROOT, NIGHT)).convert('RGB')).astype(float)[ground].reshape(-1, 3)
    dawn = np.asarray(Image.open(os.path.join(ROOT, DAWN)).convert('RGB')).astype(float)[ground].reshape(-1, 3)
    lit = night.sum(1) > 60
    ratio = np.median(dawn[lit] / np.maximum(night[lit], 1), axis=0)
    px = np.asarray(rail).astype(float)
    px[..., :3] = np.clip(night_grade(px[..., :3], npc['id']) * ratio, 0, 255)
    os.makedirs(os.path.join(ROOT, os.path.dirname(OUT)), exist_ok=True)
    Image.fromarray(px.round().astype(np.uint8), 'RGBA').save(os.path.join(ROOT, OUT))
    prop = {'id': 'hitching_rail', 'sheet': OUT, 'x': npc['x'], 'y': base, 'frame': [0, 0, size[0], size[1]]}
    print(OUT, size, 'scale', round(scale, 4), 'ratio', ratio.round(3))
    print(json.dumps(prop))


if __name__ == '__main__':
    main()
