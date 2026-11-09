"""Sowerby at the church pulpit, drawn at a man's size for where he stands (Tyler, 2026-11-08, of the
counter render: "he looks enormous behind the podium").

His sheet was cut 1:1 from the cast master at the height the pulpit's top row gave it, and nothing measured
it: from crown to the pulpit's top he was 203 px, the waist-up of a man of nearly 500, larger than Thad at the
front of the room. He stands on the pulpit's platform at the back, where the room's own depth curve, carried
back to that floor (`depthY`), makes a man about 285 px. A man's crown-to-waist is about 0.41 of him, so each
frame is resampled to that height (premultiplied BOX, doc 38 R4), bottom-centred where it was, and the sheet
repacked. Then run tools/art/room17-sowerby-desk.py (the desk is the plate's: re-clear it at the new size) and
tools/art/one-level.py --only room-17-sowerby-master. tests/scale.test.ts holds the size.

Usage: room17-sowerby-scale.py    (rewrites the sheet and the church placement's frames; prints them)
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WAIST_UP = 0.41
path = os.path.join(ROOT, 'content/ambient/sowerby.json')
npc = json.load(open(path))
place = npc['placements']['church']; sp = place['sprite']
room = [json.load(open(os.path.join(ROOT, p))) for p in json.load(open(os.path.join(ROOT, 'content/manifest.json')))['rooms']]
room = [r for r in room if r['id'] == 'church'][0]
c = room['walkBoxes'][0]['scaleMode']
man = c['farHeight'] + (sp['depthY'] - c['farY']) * (c['nearHeight'] - c['farHeight']) / (c['nearY'] - c['farY'])
sheet = np.asarray(Image.open(os.path.join(ROOT, sp['sheet'])).convert('RGBA'))
rest = sheet[sp['frames'][0][1]:sp['frames'][0][1] + sp['frames'][0][3], sp['frames'][0][0]:sp['frames'][0][0] + sp['frames'][0][2]]
rows = np.where((rest[..., 3] > 128).any(1))[0]
scale = WAIST_UP * man / (rows[-1] - rows[0] + 1)
cells = []
for (fx, fy, w, h) in sp['frames']:
    cell = sheet[fy:fy + h, fx:fx + w].astype(np.float32)
    pre = cell.copy(); pre[..., :3] *= pre[..., 3:4] / 255
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    small = np.stack([np.asarray(Image.fromarray(pre[..., k], 'F').resize((nw, nh), Image.BOX)) for k in range(4)], -1)
    a = small[..., 3]
    rgb = np.where(a[..., None] > 1, small[..., :3] * 255 / np.maximum(a[..., None], 1), 0)
    cells.append(np.dstack([np.clip(rgb, 0, 255), np.where(a >= 128, 255, 0)]).astype(np.uint8))
W = max(c.shape[1] for c in cells); H = max(c.shape[0] for c in cells)
out = np.zeros((H + 4, (W + 2) * len(cells) + 2, 4), np.uint8)
frames = []
for i, cell in enumerate(cells):
    x = 2 + i * (W + 2); y = 2 + (H - cell.shape[0])
    out[y:y + cell.shape[0], x:x + cell.shape[1]] = cell
    frames.append([x, 2, W, H])
Image.fromarray(out).save(os.path.join(ROOT, sp['sheet']))
sp['frames'] = frames
json.dump(npc, open(path, 'w'), indent=1, ensure_ascii=False); open(path, 'a').write('\n')
print(json.dumps({'man': round(man), 'scale': round(scale, 3), 'frames': frames}))
