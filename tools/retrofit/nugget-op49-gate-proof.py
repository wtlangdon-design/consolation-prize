#!/usr/bin/env python3
"""
THE OPERATION 49 GEOMETRY GATE, AND WHY IT FAILED.

Tyler's ART UNBLOCK GATE §4: "After operation 49: perform deterministic
measurement against the populated accepted table ... If the canonical table
geometry materially drifts: STOP. Do not spend operation 50."

This builds the review sheet and prints the measurements it rests on.

THE TEST THAT DECIDES IT IS A LANDMARK TEST, not a silhouette one. The mask
held back the two face-up cards of the abandoned fifth-place hand, so they are
a fixed point common to both images. In the accepted composition they lie flat
on the tabletop well inside the rim. In the output the same cards overhang the
edge, because the table's near-left rim has receded beneath them -- which is
measurable without segmenting anything, and is visible at a glance.

    python3 tools/retrofit/nugget-op49-gate-proof.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'proofs' / 'room-03' / 'art-unblock-gate'

ACCEPTED = ROOT / 'art/staging/room-03/card-clean-01/source-canvas.png'
OP49 = ROOT / 'art/staging/room-03/card-clean-01/source.png'
MASK = ROOT / 'art/staging/room-03/card-clean-01/edit-mask.png'
OLD_CANVAS = ROOT / 'art/staging/room-03/cluster-card-01/furniture-canvas.png'
COMPOSITE = ROOT / 'art/staging/room-03/rebuild-04/plate-room-03-recomposed.png'
BAR_CANVAS = ROOT / 'art/staging/room-03/bar-rebuild-01/canvas.png'

GAMMA = 0.38
# canvas (cx, cy) is plate (655 + cx/2, 110 + cy/2)
def c(px, py):
    return (int((px - 655) * 2), int((py - 110) * 2))


def lift(img):
    a = np.asarray(img.convert('RGB')).astype(float)
    return Image.fromarray(np.clip((a / 255.0) ** GAMMA * 255, 0, 255).astype('uint8'))


def panel(img, title, scale=1):
    out = lift(img)
    if scale != 1:
        out = out.resize((int(out.width * scale), int(out.height * scale)), Image.NEAREST)
    band = Image.new('RGB', (out.width, out.height + 26), (16, 16, 18))
    band.paste(out, (0, 26))
    ImageDraw.Draw(band).text((6, 8), title, fill=(235, 225, 200))
    return band


def rim_row(grey, px, lo=396, hi=436):
    """
    The table's near rim in this column, as the strongest bright-to-dark step.

    A PLAIN THRESHOLD WAS TRIED FIRST AND WAS NOT TRUSTWORTHY: it takes the
    last row above a tone, and the dirt below the table carries highlights that
    clear it, so the same column answered 439 and 404 for pictures whose rims
    are 11px apart. The rim is an EDGE -- a lit lip over its own shadow -- so
    it is found as one, and the columns the mask kept then agree to 0px, which
    is how you know the measure is reading the rim and not the floor.
    """
    cx, _ = c(px, 0)
    col = np.array([grey[c(0, py)[1], cx] for py in range(lo, hi)], dtype=float)
    smooth = np.convolve(col, np.ones(5) / 5.0, mode='same')
    return lo + int(np.argmin(np.diff(smooth))) + 1


COLUMNS = (840, 850, 862, 875, 888, 900, 912, 924, 940, 955)


def measure():
    grey = lambda p: np.asarray(Image.open(p).convert('RGB')).astype(float).mean(2)
    acc, op = grey(ACCEPTED), grey(OP49)
    return [(px, rim_row(acc, px), rim_row(op, px)) for px in COLUMNS]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    acc, op = Image.open(ACCEPTED), Image.open(OP49)

    print('NEAR-RIM ROW BY COLUMN (plate coords). Negative delta = rim receded upward.')
    print('The mask KEPT x 876-994, so those columns are the control: they must read 0.')
    print('   x     accepted   op49   delta')
    for px, a, o in measure():
        flag = '  <- kept by the mask' if 876 <= px <= 994 else ''
        print(f'  {px:4d}    {a:6d}   {o:5d}   {o - a:+5d}{flag}')

    mask = np.asarray(Image.open(MASK).convert('RGBA'))[:, :, 3] == 255
    d = np.abs(np.asarray(op.convert('RGB')).astype(float)
               - np.asarray(acc.convert('RGB')).astype(float)).max(axis=2)
    x0, y0 = c(858, 388)
    x1, y1 = c(896, 410)
    print(f'\nmask KEPT region   mean diff {d[mask].mean():.2f}  frac>16 {(d[mask] > 16).mean():.4f}')
    print(f'mask FREED region  mean diff {d[~mask].mean():.2f}  frac>16 {(d[~mask] > 16).mean():.4f}')
    print(f'abandoned hand (held back by the mask)  mean diff {d[y0:y1, x0:x1].mean():.2f}'
          f'  max {d[y0:y1, x0:x1].max():.0f}   <-- it was repainted anyway')

    # PANEL 4 is the one that decides it: the same cards, in both, at 4x.
    hx0, hy0 = c(830, 378)
    hx1, hy1 = c(935, 432)
    zoom_a = panel(acc.crop((hx0, hy0, hx1, hy1)),
                   'ACCEPTED  the cards lie flat on the tabletop, inside the rim', 4)
    zoom_b = panel(op.crop((hx0, hy0, hx1, hy1)),
                   'OP49  the same cards now overhang: the near rim has receded beneath them', 4)

    panels = [
        panel(acc, 'PANEL 1  accepted populated card area -- the frozen reference'),
        panel(Image.open(OLD_CANVAS),
              'PANEL 2  OLD / NOT FOR SHIPPING -- the only prior people-free card source, wrong table'),
        panel(op, 'PANEL 3  OPERATION 49 output -- men and chairs gone, room closed behind them'),
        zoom_a, zoom_b,
        panel(Image.open(COMPOSITE).crop((1150, 250, 1920, 800)),
              'PANEL 6  accepted bar -- counter front edge y = 383 + 0.2135(x-1185)'),
        panel(Image.open(BAR_CANVAS).resize((1024, 683), Image.LANCZOS).crop((254, 69, 1024, 619)),
              'PANEL 7  bar-rebuild canvas -- a DIFFERENT bar: lower, steeper, stools moved'),
    ]
    width = max(p.width for p in panels)
    sheet = Image.new('RGB', (width, sum(p.height + 8 for p in panels)), (16, 16, 18))
    y = 0
    for p in panels:
        sheet.paste(p, (0, y))
        y += p.height + 8
    # FULL WIDTH, NOT HALF. The policy's half-scale sheet is for forty rooms of
    # room proofs; this one carries labels a person has to read and a 40px card
    # that has to be judged, and at half scale neither survived.
    path = OUT / 'contact-sheet.webp'
    sheet.save(path, 'WEBP', quality=88, method=6)
    print(f'\nwrote {path}  {sheet.width}x{sheet.height}  {path.stat().st_size // 1024}KB')


if __name__ == '__main__':
    main()
