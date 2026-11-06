"""Relight ONE day-lit sheet into Room 31's night, as tools/art/room31-night.py
relights the funeral cast: the same ratio (night over day, blurred past any
detail), and CAST_LIGHT of it where each frame stands.

For a figure redrawn from the cast master (errata 111) after the funeral was
built: room31-night.py relights the sheets room31-cast.py writes, and running
those again would put the old cast back, so a redrawn figure keeps its own
file and is relit here once.

Usage: room31-relight-one.py <day sheet.png> <frames.json> <foot x> <foot y> <out.png>
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = open(os.path.join(ROOT, 'tools/art/room31-night.py')).read()
head = src.split('lit = day * ratio')[0]
ns = {'__file__': os.path.join(ROOT, 'tools/art/room31-night.py')}
exec(compile(head, 'room31-night.py', 'exec'), ns)
ratio, H, W = ns['ratio'], ns['H'], ns['W']
CAST_LIGHT = float(src.split('CAST_LIGHT = ')[1].split('\n')[0])

sheet_path, frames_path, fx_, fy_, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
frames = json.load(open(frames_path))['frames']
sheet = np.asarray(Image.open(sheet_path).convert('RGBA')).astype(float)
for fx, fy, fw, fh in frames:
    x0, y0 = int(round(fx_ - fw / 2)), int(round(fy_ - fh))
    ys, xs = np.mgrid[0:fh, 0:fw]
    wy, wx = np.clip(ys + y0, 0, H - 1), np.clip(xs + x0, 0, W - 1)
    sheet[fy:fy + fh, fx:fx + fw, :3] *= ratio[wy, wx] ** CAST_LIGHT
Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8)).save(out)
print(json.dumps({'relit': out, 'castLight': CAST_LIGHT, 'frames': len(frames)}))
