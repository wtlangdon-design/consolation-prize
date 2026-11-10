"""The final look: each operation's template (reference/final-look/brief.md sections 1, 2, 4, 5). No image operation.

For each figure: Thad's standing front frame first (the ruler, as tall against the figure as the engine draws him
beside it in its room, from tools/art/beside-thad.py), then each DISTINCT pose of the figure's current sheet, in
sheet order (a derived breath frame is left out: the cut derives it again), feet on one line, on magenta
(tools/art/lineup-redraws.py's template()). Writes art/staging/final-look/<key>/template.png and prints, per
figure, which sheet frame each template figure is.
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ns = {'__file__': os.path.join(ROOT, 'tools/art/lineup-redraws.py')}
exec(open(ns['__file__']).read().split('def head_crop')[0], ns)
template = ns['template']

# key: (ambient record, the sheet frames to redraw in order, Thad's height over the figure's rest height in its room)
FIGURES = {
    'pratt':       ('content/ambient/pratt.json',               [0, 2, 3, 4, 5, 6], 383 / 387),
    'pratt-jump':  ('content/ambient/pratt-jump.json',          [0, 2, 3, 4, 5],    399 / 429),
    'rule-keeper': ('content/ambient/gulch-rule-keeper.json',   [0, 2, 3, 4, 5, 6], 398 / 370),
    'ozymandia':   ('content/ambient/prosperity-ozymandia.json', [0, 1, 2, 3, 4],   389 / 407),
    'pie-woman':   ('content/ambient/pie-woman.json',           [0, 2, 3, 4],       129 / 136),
}


def crop(im):
    return im.crop(im.getbbox())


def main():
    thad = crop(Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA'))
    out = {}
    for key, (rec, picks, ratio) in FIGURES.items():
        s = json.load(open(os.path.join(ROOT, rec)))['sprite']
        sheet = Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA')
        figs = [crop(sheet.crop((x, y, x + w, y + h))) for x, y, w, h in (s['frames'][i] for i in picks)]
        th = round(figs[0].height * ratio)
        ruler = thad.resize((round(thad.width * th / thad.height), th), Image.NEAREST)
        gap = max(40, int(0.18 * figs[0].height))
        d = os.path.join(ROOT, f'art/staging/final-look/{key}')
        os.makedirs(d, exist_ok=True)
        template([ruler] + figs, [gap] * len(figs)).save(os.path.join(d, 'template.png'))
        out[key] = {'sheet': s['sheet'], 'frames': picks, 'cells': s['frames'][0][2:]}
    print(json.dumps(out, indent=1))


main()
