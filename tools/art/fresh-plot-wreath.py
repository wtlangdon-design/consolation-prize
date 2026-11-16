"""The fresh grave no longer draws through the Colonel's wreath (errata 358). No image operation.

Props are drawn in feet order, and Boot Hill's fresh plot (feet at y 365) is drawn after the Colonel's wreath on Pike's
board (feet at y 302): three columns of the plot's headboard edge cut across the wreath (the Act III review's art
director, finding 8). The plot's sheet loses its pixels where the wreath is drawn; nothing else changes.
Props are anchored at the middle of their feet: left = x - width // 2, top = y - height + 1.
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def box(prop):
    _, _, w, h = prop['frame']
    return prop['x'] - w // 2, prop['y'] - h + 1, w, h


def main():
    room = json.load(open(os.path.join(ROOT, 'content/rooms/boot-hill.json')))
    props = {p['id']: p for p in room['props']}
    plot, wreath = props['fresh_plot'], props['colonel_s_wreath']
    path = os.path.join(ROOT, plot['sheet'])
    sheet = np.asarray(Image.open(path).convert('RGBA')).copy()
    over = np.asarray(Image.open(os.path.join(ROOT, wreath['sheet'])).convert('RGBA'))
    px, py, pw, ph = box(plot)
    wx, wy, ww, wh = box(wreath)
    cleared = 0
    for y in range(wh):
        for x in range(ww):
            if over[y, x, 3] == 0:
                continue
            sx, sy = wx + x - px, wy + y - py
            if 0 <= sx < pw and 0 <= sy < ph and sheet[sy, sx, 3] > 0:
                sheet[sy, sx, 3] = 0
                cleared += 1
    Image.fromarray(sheet, 'RGBA').save(path)
    print('cleared', cleared, 'pixels of the plot under the wreath')


if __name__ == '__main__':
    main()
