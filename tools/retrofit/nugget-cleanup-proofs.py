#!/usr/bin/env python3
"""The four owner-review sheets for the Room 3 final cleanup pass.

  1 grounding   the foreground bar patron, before and after, at 1:1
  2 stove-man   why he is retained: the frame that caused the impression, a
                clean frame, and what moving him back would actually cost
  3 spittoon    the occlusion plane, by the renderer's own mechanism
  4 style       Thad, the two runtime actors and two baked patrons, matched
                to a common height so the drawing languages can be compared
                rather than the sizes

Everything is drawn at 1:1 except sheet 4, which says its scale factors on it.
Gameplay scale is the decisive proof, so nothing here is enlarged to flatter.
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw

os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
R = 'renders/opening-set-retrofit/'
BEFORE = 'art/staging/room-03/rebuild-01/plate-room-03-rebuilt.png'
AFTER  = 'art/staging/room-03/rebuild-02/plate-room-03-rebuilt.png'
MASK   = 'art/masks/room-03-plane-1.png'
THAD   = 'art/actors/thad-stand-front/stand-00.png'


def label(im, text, pad=18):
    out = Image.new('RGB', (im.width, im.height + pad), (16, 14, 12))
    out.paste(im, (0, pad))
    ImageDraw.Draw(out).text((3, 4), text, fill=(230, 214, 170))
    return out


def row(panels, gap=10, bg=(16, 14, 12)):
    w = sum(p.width for p in panels) + gap * (len(panels) - 1)
    h = max(p.height for p in panels)
    s = Image.new('RGB', (w, h), bg)
    x = 0
    for p in panels:
        s.paste(p, (x, 0)); x += p.width + gap
    return s


def thad_at(x, y, height):
    im = Image.open(THAD).convert('RGBA')
    a = np.asarray(im)[:, :, 3]
    ys, xs = np.nonzero(a > 8)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    w = int(round(im.width * height / im.height))
    return im.resize((w, height), Image.NEAREST), (int(x - w // 2), int(y - height))


def sheet_grounding():
    box = (1580, 190, 1850, 864)
    a = label(Image.open(BEFORE).crop(box), 'BEFORE  soles 700 / 695, floor 770 / 790')
    b = label(Image.open(AFTER).crop(box),  'AFTER  translated 82 rows, soles 782 / 777')
    row([a, b]).save(R + 'room-03-cleanup-grounding.webp', 'WEBP', quality=90, method=6)


def sheet_spittoon():
    """The plane, by the operation the renderer actually performs.

    Renderer.masked() draws the figure to a scratch canvas, composites the
    plane's mask with destination-out, and blits the remainder. That is what
    this does, at the authored proof point, so the picture is the mechanism and
    not an illustration of it."""
    plate = Image.open(AFTER).convert('RGBA')
    mask = Image.open(MASK).convert('RGBA')
    out = []
    for use_plane in (False, True):
        frame = plate.copy()
        fig, at = thad_at(1443, 800, 477)
        scratch = Image.new('RGBA', frame.size, (0, 0, 0, 0))
        scratch.paste(fig, at)
        if use_plane:
            alpha = np.asarray(scratch)[:, :, 3].astype(np.float32)
            cut = np.asarray(mask)[:, :, 3].astype(np.float32)
            keep = np.clip(alpha - cut, 0, 255).astype(np.uint8)
            s = np.asarray(scratch).copy(); s[:, :, 3] = keep
            scratch = Image.fromarray(s, 'RGBA')
        frame.alpha_composite(scratch)
        out.append(label(frame.convert('RGB').crop((1340, 500, 1600, 864)),
                         'WITH the plane' if use_plane else 'WITHOUT  (what it did before)'))
    live = Image.open(R + 'phase2a-production-nugget-candidate-at-1200_800-1443_805-1443_805.png')
    out.append(label(live.convert('RGB').crop((1090, 500, 1350, 864)),
                     'LIVE  same band, 240 px along: whole'))
    row(out).save(R + 'room-03-cleanup-spittoon.webp', 'WEBP', quality=90, method=6)


def sheet_stove_man():
    clean = Image.open(R + 'phase2a-production-nugget-candidate-at-700_700.png')
    crowd = Image.open(R + 'phase2a-production-nugget-candidate-at-1180_640.png')
    panels = [
        label(crowd.convert('RGB').crop((1020, 250, 1240, 540)),
              'THE FRAME THAT CAUSED IT  Thad across him'),
        label(clean.convert('RGB').crop((1020, 250, 1240, 540)),
              'LIVE  clean frame, Thad elsewhere'),
    ]
    for name, tag in (('sm-A', 'RETAINED  1145,508'),
                      ('sm-B', 'BACK 21px  1124,504  stove hidden'),
                      ('sm-C', 'BACK 33px  1112,498  stove gone')):
        path = f'/tmp/{name}.png'
        if os.path.exists(path):
            panels.append(label(Image.open(path).crop((1020, 250, 1240, 540)), tag))
    row(panels).save(R + 'room-03-cleanup-stove-man.webp', 'WEBP', quality=90, method=6)


def sheet_style():
    """MATCHED SCALE, because the question is the drawing language and not the
    size. Each figure is taken at its own staged height and then brought to a
    common 300 px, with its true height printed on it."""
    plate = Image.open(AFTER).convert('RGB')
    picks = [
        ('THAD act', None, 477, (1443, 800)),
        ('STOVE act', 'content/ambient/nugget-stove-man.json', None, None),
        ('LANDING act', 'content/ambient/nugget-landing-man.json', None, None),
        ('BAR 1 baked', None, None, (1195, 262, 1350, 605)),
        ('CARD 4 baked', None, None, (995, 300, 1150, 545)),
    ]
    panels = []
    for name, amb, h, geom in picks:
        if amb:
            d = json.load(open(amb)); f = d['sprite']['frames'][0]
            im = Image.open(d['sprite']['sheet']).convert('RGBA') \
                .crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
            bg = Image.new('RGB', im.size, (16, 14, 12)); bg.paste(im, (0, 0), im)
            im = bg
        elif h:
            fig, _ = thad_at(0, 0, h)
            bg = Image.new('RGB', fig.size, (16, 14, 12)); bg.paste(fig, (0, 0), fig)
            im = bg
        else:
            im = plate.crop(geom)
        true_h = im.height
        w = int(round(im.width * 300 / im.height))
        panels.append(label(im.resize((w, 300), Image.LANCZOS), f'{name} {true_h}px'))
    row(panels).save(R + 'room-03-style-scale.webp', 'WEBP', quality=92, method=6)


sheet_grounding(); sheet_spittoon(); sheet_stove_man(); sheet_style()
for f in ('grounding', 'spittoon', 'stove-man'):
    p = R + f'room-03-cleanup-{f}.webp'
    print(f'  {p}  {os.path.getsize(p)//1024} KB')
print(f"  {R}room-03-style-scale.webp  {os.path.getsize(R+'room-03-style-scale.webp')//1024} KB")
