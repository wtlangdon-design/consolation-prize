"""Acted directions, the second pass: each operation's template (reference/acted-directions-2/brief.md). No image op.

For each figure: Thad's standing frame (the ruler, as tall against the figure as the engine draws him beside it in
its room -- the Thad heights tools/art/beside-thad.py printed), then the figure's own shipping rest frame (the
figure's ruler: left as it is, so the cut can register the new poses on it), then the rest frame once more for each
new pose (errata 144's template method), feet on one line, on magenta. For Thad's own two sheets the ruler is his own
idle frame in the facing the poses take, and it is repeated. Writes art/staging/acted-directions-2/<key>/template.png.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
ns = {'__file__': R('tools/art/lineup-redraws.py')}
exec(open(ns['__file__']).read().split('def head_crop')[0], ns)
template = ns['template']

# key: (ambient record or None for Thad, number of new poses, Thad's drawn height, the figure's drawn cell height)
FIGURES = {
    'pratt':        ('content/ambient/pratt.json', 4, 383, 387),
    'pratt-jump':   ('content/ambient/pratt-jump.json', 2, 399, 429),
    'rule-keeper':  ('content/ambient/gulch-rule-keeper.json', 2, 398, 370),
    'lookout':      ('content/ambient/gulch-lookout.json', 3, 322, 322),
    'deacon':       ('content/ambient/gulch-deacon.json', 2, 385, 426),
    'winnie':       ('content/ambient/winnie.json', 2, 253, 168),
    'ozymandia':    ('content/ambient/ozymandia.json', 1, 272, 219),
    'frame':        ('content/ambient/frame.json', 2, 502, 521),
    'deke':         ('content/ambient/deke-vessel.json', 2, 428, 428),
    'letter-writer': ('content/ambient/letter-writer.json', 1, 306, 320),
    'panner':       ('content/ambient/gulch-panner.json', 1, 376, 408),
}
# The panner is redrawn whole (Tyler: he reads as Thad in a hat; "Redraw him, 1 op"): his five drawn poses (frame 1 is
# the derived breath), then his rest once more for the snort.
REDRAW = {'panner': [0, 2, 3, 4, 5]}
THAD = {'thad-back': ('art/actors/thad-idle-back/idle-00.png', 5), 'thad-right': ('art/actors/thad-idle-right/idle-00.png', 2)}


def crop(im):
    return im.crop(im.getbbox())


def main():
    thad = crop(Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'))
    for key, (rec, n, th, fh) in FIGURES.items():
        s = json.load(open(R(rec)))['sprite']
        x, y, w, h = s['frames'][0]
        sheet = Image.open(R(s['sheet'])).convert('RGBA')
        rest = crop(sheet.crop((x, y, x + w, y + h)))
        t = round(rest.height * th / fh)
        drawn = [crop(sheet.crop((fx, fy, fx + fw, fy + fh_))) for fx, fy, fw, fh_ in (s['frames'][i] for i in REDRAW[key])] \
            if key in REDRAW else [rest]
        ruler = thad.resize((round(thad.width * t / thad.height), t), Image.NEAREST)
        gap = max(50, int(0.25 * rest.height))
        os.makedirs(R(f'art/staging/acted-directions-2/{key}'), exist_ok=True)
        template([ruler] + drawn + [rest] * n, [gap] * (len(drawn) + n)).save(R(f'art/staging/acted-directions-2/{key}/template.png'))
    for key, (path, n) in THAD.items():
        rest = crop(Image.open(R(path)).convert('RGBA'))
        os.makedirs(R(f'art/staging/acted-directions-2/{key}'), exist_ok=True)
        template([rest] * (n + 1), [int(0.45 * rest.width) + 60] * n).save(R(f'art/staging/acted-directions-2/{key}/template.png'))
    print('templates written')


main()
