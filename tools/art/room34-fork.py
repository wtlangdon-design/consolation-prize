"""ERRATA 369: THE TUNING FORK IN ROOM 34, REDRAWN (Tyler, 2026-11-16: "Let's do the fork correction."; the image
session's room-34-fork attempt 1, reference/duel-and-caves-art/handback-fork.md).

The old fork, a small silver smudge on the stump, is painted into both Room 34 plates. It is painted out of each
plate's untouched original (reference/room-grade/originals/, which tools/art/room-grade.py grades into the shipped
plate): a band along it is filled from the stump around it. The new fork, drawn alone on magenta, is laid over both as one prop: scaled to 85 px tip to tip
(half the lamp's height, the brief's size), reduced to the room's block of 4 px and drawn back up nearest, so it is
as coarse as the stump it lies on, centred where the old one lay.

    python3 tools/art/room34-fork.py [--write]

Reads the plates from their first state, kept in art/staging/room34-fork/, so a re-run gives the same pixels.
"""
import json
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
WRITE = '--write' in sys.argv
KEEP = 'art/staging/room34-fork'
PLATES = ['art/backgrounds/room-34-under-prosperity.png', 'art/backgrounds/room-34-under-prosperity-after.png']
CUT = 'art/staging/duel-and-caves-art/room-34-fork/fork-1-cut.png'
PROP = 'art/props/room-34-tuning-fork.png'
CENTRE = (636, 571)           # the old fork's centre in the plate (placement.json)
LENGTH = 85                   # tip to tip
BLOCK = 4                     # the room's block
# The old fork's centre line, from the end of its prongs to the end of its stem, and its half-width with a margin.
A, B, HALF = np.array([613.0, 559.0]), np.array([657.0, 586.0]), 8.0


def original(plate):
    return f"reference/room-grade/originals/{plate.replace('/', '__')}"


def first_state(path):
    keep = f'{KEEP}/{os.path.basename(path)}'
    if not os.path.exists(R(keep)):
        os.makedirs(R(KEEP), exist_ok=True); shutil.copy(R(path), R(keep))
    return np.asarray(Image.open(R(keep)).convert('RGBA')).copy()


def paint_out(a):
    """The band along the old fork, filled from the stump around it (OpenCV's Telea inpainting): the stump top is soft
    and nearly flat there, so a fill from its edges is the stump. Most of it is under the new fork in any case."""
    import cv2
    d = (B - A) / np.linalg.norm(B - A); n = np.array([-d[1], d[0]]); L = np.linalg.norm(B - A)
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    s = (xs - A[0]) * d[0] + (ys - A[1]) * d[1]; t = (xs - A[0]) * n[0] + (ys - A[1]) * n[1]
    mask = ((s >= -4) & (s <= L + 4) & (np.abs(t) <= HALF)).astype(np.uint8)
    out = a.copy()
    out[..., :3] = cv2.inpaint(np.ascontiguousarray(a[..., :3]), mask, 6, cv2.INPAINT_TELEA)
    return out


def fork():
    cut = Image.open(R(CUT)).convert('RGBA')
    al = np.asarray(cut)[..., 3] > 128
    ys, xs = np.where(al)
    cut = cut.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    diag = np.hypot(*cut.size)
    w, h = cut.size
    cols = max(1, round(w * LENGTH / diag / BLOCK)); rows = max(1, round(h * LENGTH / diag / BLOCK))
    pre = np.asarray(cut).astype(np.float32); pre[..., :3] *= pre[..., 3:4] / 255
    small = np.stack([np.asarray(Image.fromarray(pre[..., c], 'F').resize((cols, rows), Image.BOX)) for c in range(4)], -1)
    keep = small[..., 3] >= 110
    rgb = np.where(small[..., 3:4] > 1, small[..., :3] * 255 / np.maximum(small[..., 3:4], 1), 0)
    small = np.dstack([np.clip(rgb, 0, 255), np.where(keep, 255, 0)]).astype(np.uint8)
    return np.asarray(Image.fromarray(small, 'RGBA').resize((cols * BLOCK, rows * BLOCK), Image.NEAREST))


def main():
    prop = fork()
    h, w = prop.shape[:2]
    record = {'id': 'tuning_fork', 'sheet': PROP, 'x': CENTRE[0], 'y': CENTRE[1] + h // 2 - 1, 'frame': [0, 0, w, h]}
    print(json.dumps(record))
    plates = {p: paint_out(first_state(original(p))) for p in PLATES}
    if WRITE:
        for p, a in plates.items():
            Image.fromarray(a).convert('RGB' if Image.open(R(p)).mode == 'RGB' else 'RGBA').save(R(original(p)))
        os.makedirs(R('art/props'), exist_ok=True)
        Image.fromarray(prop).save(R(PROP))
        Image.fromarray(prop).save(R(original(PROP)))
        subprocess.run([sys.executable, R('tools/art/room-grade.py')], check=True, stdout=subprocess.DEVNULL)
    return record, plates, prop


if __name__ == '__main__':
    record, plates, prop = main()
    if '--look' in sys.argv:
        out = sys.argv[sys.argv.index('--look') + 1]
        a = plates[PLATES[0]].copy()
        h, w = prop.shape[:2]; x0 = record['x'] - w // 2; y0 = record['y'] - h + 1
        m = prop[..., 3:4] > 0
        a[y0:y0 + h, x0:x0 + w] = np.where(m, prop, a[y0:y0 + h, x0:x0 + w])
        b = first_state(original(PLATES[0]))
        row = np.concatenate([b[480:640, 500:720], plates[PLATES[0]][480:640, 500:720], a[480:640, 500:720]], 1)
        Image.fromarray(row).resize((row.shape[1] * 4, row.shape[0] * 4), Image.NEAREST).save(out)
