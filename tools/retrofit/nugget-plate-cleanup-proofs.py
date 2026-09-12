#!/usr/bin/env python3
"""The two 1:1 before/after sheets for the Room 3 background composite cleanup.

  1 stove-area    the floor the stove man used to stand on, and the bar's far
                  end beside it: dirt instead of plank, and a run that ends
  2 patron-ground the foreground bar patron's own ground: dirt under both
                  boots instead of the kick-board the translation laid there

BOTH ARE 1:1 AND SO IS EVERY PANEL IN THEM. The third proof this pass owes is
a full live deployed gameplay frame, which is taken by the engine itself
(tools/gauntlet/production-shot.mjs) and not drawn here: a composite made from
the same numbers as the engine agrees with the engine by construction.
"""
import os
from PIL import Image, ImageDraw

os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
R = 'renders/opening-set-retrofit/'
BEFORE = 'art/staging/room-03/rebuild-02/plate-room-03-rebuilt.png'
AFTER = 'art/staging/room-03/rebuild-03/plate-room-03-rebuilt.png'


def label(im, text, pad=18):
    out = Image.new('RGB', (im.width, im.height + pad), (16, 14, 12))
    out.paste(im, (0, pad))
    ImageDraw.Draw(out).text((3, 4), text, fill=(230, 214, 170))
    return out


def row(panels, gap=10):
    w = sum(p.width for p in panels) + gap * (len(panels) - 1)
    s = Image.new('RGB', (w, max(p.height for p in panels)), (16, 14, 12))
    x = 0
    for p in panels:
        s.paste(p, (x, 0)); x += p.width + gap
    return s


def sheet(box, before_text, after_text, name):
    a = label(Image.open(BEFORE).convert('RGB').crop(box), before_text)
    b = label(Image.open(AFTER).convert('RGB').crop(box), after_text)
    row([a, b]).save(R + name, 'WEBP', quality=92, method=6)
    print('wrote', R + name, '  1:1, crop', box)


sheet((1040, 360, 1280, 640),
      'BEFORE  plank floor, bar end dissolves',
      'AFTER  dirt; the run ends on its own face',
      'room-03-cleanup2-stove-area.webp')

sheet((1560, 560, 1860, 830),
      "BEFORE  the kick-board laid on the dirt behind his boots",
      'AFTER  both boots on dirt, contact kept, bar panel continuous',
      'room-03-cleanup2-patron-ground.webp')
