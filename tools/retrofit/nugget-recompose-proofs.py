#!/usr/bin/env python3
"""The owner-review sheets for the Room 3 recomposition. All at 1:1.

  1 empty      the reconstructed bar with the foreground patron HIDDEN
  2 back       the same crop with him composited back
  3 halo       the same crop, gamma 0.30, to expose any halo around him
  4 terminus   the bar's far end, before and after -- NOT REPAIRED, reported

The fifth, the full 1920x1080 gameplay frame, is taken by the engine itself.
"""
import os
import numpy as np
from PIL import Image, ImageDraw

os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
R = 'renders/opening-set-retrofit/'
EMPTY = 'art/staging/room-03/rebuild-04/plate-room-03-empty.png'
FULL  = 'art/staging/room-03/rebuild-04/plate-room-03-recomposed.png'
OLD   = 'art/staging/room-03/rebuild-03/plate-room-03-rebuilt.png'
BOX   = (1540, 240, 1880, 820)


def label(im, text, pad=18):
    o = Image.new('RGB', (im.width, im.height + pad), (16, 14, 12))
    o.paste(im, (0, pad))
    ImageDraw.Draw(o).text((3, 4), text, fill=(230, 214, 170))
    return o


def row(ps, gap=10):
    w = sum(p.width for p in ps) + gap * (len(ps) - 1)
    s = Image.new('RGB', (w, max(p.height for p in ps)), (16, 14, 12))
    x = 0
    for p in ps:
        s.paste(p, (x, 0)); x += p.width + gap
    return s


def gamma(im, g):
    v = np.asarray(im).astype(np.float32) / 255.0
    return Image.fromarray(np.clip(v ** g * 255, 0, 255).astype(np.uint8))


e = Image.open(EMPTY).convert('RGB').crop(BOX)
f = Image.open(FULL).convert('RGB').crop(BOX)
o = Image.open(OLD).convert('RGB').crop(BOX)

row([label(e, 'EMPTY  bar and floor reconstructed, patron hidden'),
     label(f, 'BACK   the same crop, patron composited')
     ]).save(R + 'room-03-recompose-empty-and-back.webp', 'WEBP', quality=93, method=6)

row([label(gamma(o, 0.30), 'BEFORE  gamma 0.30 -- the halo'),
     label(gamma(f, 0.30), 'AFTER   gamma 0.30 -- no halo')
     ]).save(R + 'room-03-recompose-halo.webp', 'WEBP', quality=93, method=6)

tb = (1140, 350, 1300, 570)
row([label(Image.open(OLD).convert('RGB').crop(tb), 'BEFORE  the run ends in a smear'),
     label(Image.open(FULL).convert('RGB').crop(tb), 'AFTER   UNCHANGED -- see the report')
     ]).save(R + 'room-03-recompose-terminus.webp', 'WEBP', quality=93, method=6)
print('wrote three sheets at 1:1 to', R)
