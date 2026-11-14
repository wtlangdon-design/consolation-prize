"""Acted directions, the third pass: the street people's templates (reference/acted-directions-3/brief.md). No op.

Each template, on magenta (tools/art/lineup-redraws.py's template()): Thad's standing frame first, as tall against the
figure as the engine draws him beside it in its room (tools/art/beside-thad.py's numbers), then the frames listed
below from the figure's own sheet. The first figure frame is its rest, the registration ruler; for the two whose
whole sheet is redrawn with a new prop (the bell-ringer's bottle, the map seller's pencil), every drawn frame is
listed, so every one is repainted with the prop; the new poses follow as copies of the frame each grows from.
Writes art/staging/acted-directions-3/<key>/template.png.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
ns = {'__file__': R('tools/art/lineup-redraws.py')}
exec(open(ns['__file__']).read().split('def head_crop')[0], ns)
template = ns['template']

# key: (record, sheet frames in template order after Thad, Thad's drawn height, the rest cell's drawn height)
FIGURES = {
    'letter-writer': ('content/ambient/letter-writer.json', [0, 2, 2], 224, 235),               # rest; 2 new from frame 2
    'man-leaving':   ('content/ambient/man-leaving-tomorrow.json', [0, 0], 152, 154),          # rest; 1 new
    'bell-ringer':   ('content/ambient/bell-ringer.json', [0, 2, 3, 4, 0, 0, 0], 187, 195),     # 4 redrawn; 3 new
    'map-seller':    ('content/ambient/map-seller.json', [0, 2, 3, 4, 2, 2], 136, 142),         # 4 redrawn; 2 new
}


def crop(im):
    return im.crop(im.getbbox())


def main():
    thad = crop(Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'))
    for key, (rec, picks, th, fh) in FIGURES.items():
        s = json.load(open(R(rec)))['sprite']
        sheet = Image.open(R(s['sheet'])).convert('RGBA')
        x, y, w, h = s['frames'][0]
        rest = crop(sheet.crop((x, y, x + w, y + h)))
        figs = [crop(sheet.crop((fx, fy, fx + fw, fy + fhh))) for fx, fy, fw, fhh in (s['frames'][i] for i in picks)]
        t = round(h * th / fh) * rest.height / h
        ruler = thad.resize((round(thad.width * t / thad.height), round(t)), Image.NEAREST)
        gap = max(24, int(0.1 * rest.height))
        os.makedirs(R(f'art/staging/acted-directions-3/{key}'), exist_ok=True)
        template([ruler] + figs, [gap] * len(figs)).save(R(f'art/staging/acted-directions-3/{key}/template.png'))
    print('templates written')


main()
