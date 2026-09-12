#!/usr/bin/env python3
"""
DETERMINISTIC SALVAGE OF OPERATION 49. No generation, no repaint.

Operation 49 returned a good clean card environment with two localized faults:
the near rim receded 6-13px wherever the mask freed it, and the abandoned
fifth-place hand was repainted although it was held back.

THE REPAIR IS AN EXACT COPY, NOT A RECONSTRUCTION. Wherever the ACCEPTED
composition shows clean table -- no man, no chair -- those pixels are canon and
can simply be put back. That restores the canonical rim and the abandoned hand
in one step, with no fitting, no warping and no invented pixel.

WHERE THE ACCEPTED ART IS CLEAN, MEASURED RATHER THAN ASSUMED. The near rim is
detectable as a bright-to-dark step from x 844 to x 986; outside that the edge
strength collapses because card_1's and card_4's bodies are in the way. Two
regions come out of that:

  R  x 844-986, y 406-432   the rim and apron, below every player's hands
  H  x 850-900, y 386-432   the abandoned hand and the table under it, in the
                            gap between card_1's body and card_3's hands

WHAT THIS CANNOT DO, AND SAYS SO. Outside x 844-986 the accepted art has no
visible rim -- the two near players are standing on it -- so there is no canon
to copy and operation 49's own reconstruction is all there is. The copy
therefore ends in a STEP wherever op49's rim disagrees at the boundary. This
tool measures that step and prints it; hiding it would need a warp fitted to a
rim the accepted art does not show.

    python3 tools/retrofit/nugget-card-clean-repair.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'art/staging/room-03/card-clean-01'
OP49 = DIR / 'source.png'
ACCEPTED = DIR / 'source-canvas.png'
OUT = DIR / 'repaired.png'

# canvas (cx, cy) is plate (655 + cx/2, 110 + cy/2)
def c(px, py):
    return (int((px - 655) * 2), int((py - 110) * 2))


REGIONS = {
    'rim':  (844, 406, 986, 432),
    'hand': (850, 386, 900, 432),
}
FEATHER = 2


def rim_row(grey, px, lo=394, hi=438):
    """The near rim as the strongest bright-to-dark step, with its strength."""
    cx, _ = c(px, 0)
    col = np.array([grey[c(0, py)[1], cx] for py in range(lo, hi)], dtype=float)
    smooth = np.convolve(col, np.ones(5) / 5.0, mode='same')
    g = np.diff(smooth)
    return lo + int(np.argmin(g)) + 1, float(-g.min())


def main() -> None:
    op = np.asarray(Image.open(OP49).convert('RGB')).astype(float)
    acc = np.asarray(Image.open(ACCEPTED).convert('RGB')).astype(float)

    alpha = np.zeros(op.shape[:2], dtype=float)
    for (x0, y0, x1, y1) in REGIONS.values():
        a0, b0 = c(x0, y0)
        a1, b1 = c(x1, y1)
        alpha[b0:b1, a0:a1] = 1.0
    # A two-pixel feather on the copy edge, so the boundary is a blend and not
    # a hard line. It does not hide a geometry step -- nothing can -- but it
    # stops the copy itself from adding an edge of its own.
    from scipy.ndimage import gaussian_filter
    alpha = gaussian_filter(alpha, FEATHER)

    out = op * (1 - alpha[:, :, None]) + acc * alpha[:, :, None]
    Image.fromarray(np.clip(out, 0, 255).astype('uint8')).save(OUT)

    grey = lambda a: a.mean(2)
    gop, gacc, gout = grey(op), grey(acc), grey(out)

    print('NEAR RIM after repair (plate rows). "copied" columns are canon by construction.')
    print('   x     accepted   op49   repaired   delta-to-accepted')
    for px in (820, 832, 844, 856, 880, 910, 940, 966, 986, 998, 1010):
        a, sa = rim_row(gacc, px)
        o, _ = rim_row(gop, px)
        r, _ = rim_row(gout, px)
        inside = 844 <= px <= 986
        tag = 'copied' if inside else ('NO CANON -- op49 only' if sa < 6 else '')
        print(f'  {px:4d}    {a:6d}   {o:5d}   {r:7d}   {r - a:+6d}   {tag}')

    print('\nSEAM: the step in the repaired rim at each copy boundary')
    for px0, px1, where in ((838, 848, 'left edge x844'), (982, 992, 'right edge x986')):
        r0, _ = rim_row(gout, px0)
        r1, _ = rim_row(gout, px1)
        print(f'  {where}: rim {r0} -> {r1}   step {abs(r1 - r0)}px')

    x0, y0 = c(858, 388)
    x1, y1 = c(896, 410)
    d = np.abs(gout - gacc)[y0:y1, x0:x1]
    print(f'\nABANDONED HAND vs accepted: mean {d.mean():.2f}  max {d.max():.0f}  '
          f'(was 52.01 / 165 before repair)')
    print(f'wrote {OUT}')
    proof(op, acc, out)


def lift(a):
    return Image.fromarray(np.clip((a / 255.0) ** 0.38 * 255, 0, 255).astype('uint8'))


def band(img, title, scale=1):
    from PIL import ImageDraw
    if scale != 1:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.NEAREST)
    out = Image.new('RGB', (img.width, img.height + 24), (16, 16, 18))
    out.paste(img, (0, 24))
    ImageDraw.Draw(out).text((6, 7), title, fill=(235, 225, 200))
    return out


def proof(op, acc, out):
    """The five views Tyler's §4 asks for, in one sheet."""
    wide = (c(760, 340), c(1090, 470))
    tight = (c(800, 372), c(1000, 440))
    crop = lambda a, box: lift(a[box[0][1]:box[1][1], box[0][0]:box[1][0]])

    one = crop(out, wide)
    one = one.resize((one.width // 2, one.height // 2), Image.LANCZOS)   # plate 1:1

    panels = [
        band(crop(acc, wide), 'ACCEPTED composition -- the canon this is measured against'),
        band(crop(op, wide), 'OPERATION 49 raw -- rim receded, abandoned hand repainted'),
        band(crop(out, wide), 'DETERMINISTIC REPAIR -- canon copied back where the accepted art is clean'),
        band(one, '1:1 AT PLATE SCALE -- the seam is visible here, which is the gate that decides it'),
        band(crop(acc, tight), '4x  ACCEPTED  rim and abandoned hand', 4),
        band(crop(out, tight), '4x  REPAIRED  hand exact (mean 0.01); rim doubles at the copy edge', 4),
    ]
    width = max(p.width for p in panels)
    sheet = Image.new('RGB', (width, sum(p.height + 8 for p in panels)), (16, 16, 18))
    y = 0
    for p in panels:
        sheet.paste(p, (0, y))
        y += p.height + 8
    path = ROOT / 'proofs/room-03/art-unblock-gate/salvage-sheet.webp'
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, 'WEBP', quality=88, method=6)
    print(f'wrote {path}  {sheet.width}x{sheet.height}  {path.stat().st_size // 1024}KB')


if __name__ == '__main__':
    main()
