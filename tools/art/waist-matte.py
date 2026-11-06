"""Matte a waist-up figure along a SLANTED back edge, column by column.

A counter figure is drawn cut flat at the waist. Where the furniture's back
edge slants -- the undertaker's bench in Room 13 runs from y 497 to y 510
across his width -- a flat waist set on the edge at one column leaves wall
showing under it on one side and the body over the bench on the other. So the
waist is set on the edge's LOWEST row across the figure, and every pixel of the
figure below the edge in its own column is cleared: the bench is in front.

Only for figures with nothing forward of the waist (`sprite.hands: "folded"`).
The edge is found in the plate itself, column by column: the strongest two-row
step within 4 rows of the line through the GUIDE points.

Usage: waist-matte.py <sheet.png> <frames.json> <plate.png> <x> "<x:y,x:y,...>" <out.png>
Prints the y to place the figure at (its bottom row) and the edge at x.
"""
import json, sys
import numpy as np
from PIL import Image

sheet_p, frames_p, plate_p, X, guide, out = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5], sys.argv[6]
pts = sorted((int(a), int(b)) for a, b in (p.split(':') for p in guide.split(',')))
plate = np.asarray(Image.open(plate_p).convert('RGB')).astype(int).sum(2)
gx, gy = zip(*pts)


def edge(x):
    g = int(round(np.interp(x, gx, gy)))
    steps = [abs(plate[y + 2, x] - plate[y, x]) for y in range(g - 4, g + 5)]
    return g - 4 + int(np.argmax(steps)) + 1


frames = json.load(open(frames_p))['frames']
sheet = np.asarray(Image.open(sheet_p).convert('RGBA')).copy()
w = frames[0][2]; h = frames[0][3]
left = X - w // 2
edges = np.array([edge(left + c) for c in range(w)])
# the waist: columns of the rest frame's bottom row
x0, y0 = frames[0][0], frames[0][1]
alpha0 = sheet[y0:y0 + h, x0:x0 + w, 3] > 128
last = int(np.where(alpha0.any(1))[0].max())          # the waist: the rest frame's lowest drawn row
waist_cols = np.where(alpha0[max(0, last - 3):last + 1].any(0))[0]
lowest = int(edges[waist_cols].max())
place_y = lowest + (h - 1 - last)      # the waist row lands on the lowest edge
for fx, fy, fw, fh in frames:
    for c in range(fw):
        cut = edges[c] - (place_y - fh + 1) + 1    # first frame row below the edge in this column
        if cut < fh:
            sheet[fy + max(cut, 0):fy + fh, fx + c, 3] = 0
Image.fromarray(sheet).save(out)
print(json.dumps({'waistColumns': [int(left + waist_cols.min()), int(left + waist_cols.max())], 'y': place_y, 'edgeAtX': int(edge(X)), 'edgeRange': [int(edges[waist_cols].min()), lowest]}))
