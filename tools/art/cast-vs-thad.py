"""The side-by-side a redraw is generated against (CLAUDE.md character style
gate steps 1 and 4: "showing the mismatch as a picture is what worked").

Tyler, 2026-11-02: the full build's figures are too fine beside Thad -- "Thad
is pixelated, not smooth", "Bigger pixels". Post-processing was rejected; each
figure is redrawn by the generator against this picture: Thad standing, front
on, at his own resolution (his pixels are about eight source pixels square, so
he is about 80 pixels tall), and the figure's current rest pose at the same
height beside him, on flat grey. No image operation here.

usage: python3 tools/art/cast-vs-thad.py <sheet.png> <pose-index> <height-ratio> <out.png>
  height-ratio: the figure's height as a share of Thad's (a shorter man < 1).
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = __file__.rsplit('/tools/', 1)[0]
THAD = f'{ROOT}/art/actors/thad-stand-front/stand-00.png'


def keyed_poses(sheet):
    src = np.asarray(Image.open(sheet).convert('RGB')).astype(int)
    mask = (np.minimum(src[..., 0], src[..., 2]) - src[..., 1]) < 90
    labels, count = ndi.label(mask)
    sizes = ndi.sum(mask, labels, range(1, count + 1))
    big = sorted([1 + i for i in range(count) if sizes[i] > 20000],
                 key=lambda lab: np.where(labels == lab)[1].min())
    poses = []
    for lab in big:
        m = labels == lab
        ys, xs = np.where(m)
        rgba = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
        rgba[..., :3] = src[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        rgba[..., 3] = np.where(m[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 255, 0)
        poses.append(Image.fromarray(rgba))
    return poses


def main():
    sheet, index, ratio, out = sys.argv[1], int(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
    thad = Image.open(THAD).convert('RGBA')
    thad = thad.crop(thad.getbbox())
    pose = keyed_poses(sheet)[index]
    h = round(thad.height * ratio)
    pose = pose.resize((round(pose.width * h / pose.height), h), Image.LANCZOS)
    canvas = Image.new('RGBA', (1536, 1024), (150, 150, 150, 255))
    base = 1024 - (1024 - thad.height) // 2
    canvas.alpha_composite(thad, (420 - thad.width // 2, base - thad.height))
    canvas.alpha_composite(pose, (1100 - pose.width // 2, base - pose.height))
    canvas.convert('RGB').save(out)
    print(out, thad.size, pose.size)


if __name__ == '__main__':
    main()
