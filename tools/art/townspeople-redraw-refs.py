"""Image 1 of each townspeople redraw (errata 111): Thad, front on, beside the
figure as first drawn, at the same scale, on flat grey -- the side-by-side
Fanshawe, Sump, Frame and the clerk were redrawn against (errata 84 J,
tools/art/cast-vs-thad.py). The boundary men's shows both men. No image
operation.

Tyler, 2026-11-06: "None of the new characters seem to match the pixelation
level of the cast we worked really hard on." Every first sheet came back on a
finer grid than Thad's.

usage: python3 tools/art/townspeople-redraw-refs.py
Writes reference/townspeople/<sheet>-thad-grid.png.
"""
import importlib.util
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('cvt', os.path.join(ROOT, 'tools/art/cast-vs-thad.py'))
cvt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cvt)

STAGE = os.path.join(ROOT, 'art/staging/townspeople-110')
# sheet, attempt as first drawn, [(pose index, height as a share of Thad's)]
SHEETS = [
    ('message-boy', 2, [(0, 0.68)]),
    ('man-leaving-tomorrow', 1, [(0, 1.0)]),
    ('boundary-men', 1, [(0, 1.0), (3, 1.0)]),
    ('dogs-owner', 1, [(0, 1.04)]),
    ('fiddler', 1, [(0, 1.0)]),
]


def main():
    thad = Image.open(cvt.THAD).convert('RGBA')
    thad = thad.crop(thad.getbbox())
    for name, attempt, figures in SHEETS:
        poses = cvt.keyed_poses(os.path.join(STAGE, name, f'sheet-{attempt:02d}.png'))
        canvas = Image.new('RGBA', (1536, 1024), (150, 150, 150, 255))
        base = 1024 - (1024 - thad.height) // 2
        slots = [420] + ([1100] if len(figures) == 1 else [960, 1260])
        canvas.alpha_composite(thad, (slots[0] - thad.width // 2, base - thad.height))
        for (index, ratio), x in zip(figures, slots[1:]):
            pose = poses[index]
            h = round(thad.height * ratio)
            pose = pose.resize((round(pose.width * h / pose.height), h), Image.LANCZOS)
            canvas.alpha_composite(pose, (x - pose.width // 2, base - pose.height))
        out = os.path.join(ROOT, 'reference/townspeople', f'{name}-thad-grid.png')
        canvas.convert('RGB').save(out)
        print(os.path.relpath(out, ROOT))


if __name__ == '__main__':
    main()
