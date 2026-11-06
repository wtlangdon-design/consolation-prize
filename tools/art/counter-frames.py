"""Every frame of a placed figure, composed on its room's plate exactly as the
engine draws it (bottom-centre at x, y; props after it), side by side, zoomed.
For looking at each pose in place before anyone else has to (Tyler,
2026-11-06: "Really evaluate what you're doing").

Usage: counter-frames.py <ambient id file stem> <out.png> [zoom]
"""
import json, os, sys
from PIL import Image

stem, out = sys.argv[1], sys.argv[2]
zoom = int(sys.argv[3]) if len(sys.argv) > 3 else 2
d = json.load(open(f'content/ambient/{stem}.json')); sp = d['sprite']
bg = {}
for f in os.listdir('content/rooms'):
    if f.endswith('.json'):
        r = json.load(open('content/rooms/' + f)); bg[r.get('id')] = r.get('background')
plate = Image.open(bg[d['room']]).convert('RGBA'); sheet = Image.open(sp['sheet']).convert('RGBA')
tiles = []
for k, (x, y, w, h) in enumerate(sp['frames']):
    im = plate.copy()
    im.alpha_composite(sheet.crop((x, y, x + w, y + h)), (d['x'] - w // 2, d['y'] - h + 1))
    for pr in sp.get('props', []):
        px, py, pw, ph = pr['frames'][pr.get('byFrame', {}).get(str(k), 0)]
        im.alpha_composite(Image.open(pr['sheet']).convert('RGBA').crop((px, py, px + pw, py + ph)), (pr['x'] - pw // 2, pr['y'] - ph + 1))
    xs = [d['x'] - w // 2 - 30, d['x'] + w // 2 + 30] + [pr['x'] - 30 for pr in sp.get('props', []) if abs(pr['x'] - d['x']) < 300]
    tiles.append(im.crop((max(0, min(xs)), d['y'] - h - 10, min(plate.width, max(xs)), min(plate.height, d['y'] + 40))))
W = sum(t.width for t in tiles) + 8 * len(tiles); H = max(t.height for t in tiles)
sheet_out = Image.new('RGB', (W, H)); x = 0
for t in tiles: sheet_out.paste(t, (x, 0)); x += t.width + 8
sheet_out.resize((W * zoom, H * zoom), Image.NEAREST).save(out)
