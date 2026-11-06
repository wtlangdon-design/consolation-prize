"""The cut height that gives a new pose sheet's row the same HEAD SIZE as a
character's current drawing in the game (so a redraw keeps his size in his
room). Head size: crown to shoulders, the rows of the run through the head's
centre column until it widens past 1.35x the head (shoulders). A first version
measured face width by skin colour and put Fanshawe 21% too large (2026-11-06).

Usage: face-size.py <sheet.png> <row> <pose> <current sheet.png> <frame json>
"""
import json, sys
import numpy as np
from PIL import Image

def facew(rgba):
    """Head size: crown to shoulders (named facew for its callers)."""
    m = rgba[..., 3] > 128
    h, w = m.shape
    crown = np.where(m.any(1))[0][0]
    cx = int(np.median(np.where(m[min(h - 1, crown + 4)])[0]))
    wid = []
    for r in range(crown, crown + int(h * 0.6)):
        row = m[r]
        if not row[cx]: wid.append(0); continue
        l = cx
        while l > 0 and row[l - 1]: l -= 1
        rr = cx
        while rr < w - 1 and row[rr + 1]: rr += 1
        wid.append(rr - l + 1)
    wid = np.array(wid); head = wid[:int(len(wid) * 0.6)].max(); top = int(np.argmax(wid[:int(len(wid) * 0.6)]))
    neck = next((i for i in range(top, len(wid)) if wid[i] > 1.35 * head), len(wid))
    return float(neck)

sheet, row, pose, cur, frame = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], json.loads(sys.argv[5])
s = np.asarray(Image.open(sheet).convert('RGBA')).copy()
d = np.sqrt((s[..., 0].astype(int) - 255) ** 2 + s[..., 1].astype(int) ** 2 + (s[..., 2].astype(int) - 255) ** 2)
s[..., 3] = np.where(d >= 120, 255, 0)
busy = (s[..., 3] > 0).sum(1) > 3
bands, start = [], None
for y, on in enumerate(busy):
    if on and start is None: start = y
    if not on and start is not None:
        if y - start > 40: bands.append((start, y))
        start = None
y0, y1 = bands[row]
cols = np.where((s[y0:y1, :, 3] > 0).any(0))[0]
runs, a0, p = [], cols[0], cols[0]
for c in cols[1:]:
    if c > p + 20: runs.append((a0, p)); a0 = c
    p = c
runs.append((a0, p))
x0, x1 = runs[pose]
new = facew(s[y0:y1, x0:x1 + 1])
c = np.asarray(Image.open(cur).convert('RGBA')); fx, fy, fw, fh = frame
old = facew(c[fy:fy + fh, fx:fx + fw])
print(json.dumps({'band': int(y1 - y0), 'faceNew': new, 'faceOld': old, 'height': round((y1 - y0) * old / new)}))
