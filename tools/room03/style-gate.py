#!/usr/bin/env python3
"""
THE SECTION 27 CHARACTER-STYLE GATE, RUN ON THE ASSEMBLED ROOM.

This is the gate that was skipped, and skipping it is most of why Tyler looked
at the first assembly and said it was bad. The three gates that DID run --
recomposition, actor-off, small-motion -- measure whether the decomposition is
sound. None of them can see that a man is drawn in a different game's style
from the man who will walk up and talk to him.

WHAT IT MEASURES. Each patron is put beside Thad at matched
display height, because style only compares at matched height -- a figure drawn
at 400px and shown at 200px has half the detail density it looks like it has.

AND THE FIRST VERSION OF THIS GATE NORMALISED THE WRONG THING. It scaled each
LAYER'S BOUNDING BOX to a fixed height. A seated man's layer is bounded by his
head and the table edge that cuts him off, so normalising his bbox to a standing
figure's height enlarged him by roughly the fraction of him the table hides --
card_2 and card_3 came out as giant busts next to a full-length Thad, and every
number taken from them was inflated by the same unknown amount.

The normaliser is the CAMERA, which is the room's own authority and knows what
this gate was trying to ask. `blocking.json` carries, for every figure, the
drawn height a 1.75 m man has at that figure's ground line. Scaling each figure
by MATCH_H / that number puts all eight men at the size they would be if they
were standing at the same distance, whatever the furniture hides. Two numbers per figure:

    EDGE DENSITY   fraction of the figure's own pixels that sit on an edge
                   (Sobel over luminance, thresholded at the figure's own
                   gradient median). This is "how many lines are in this man".

    TONE COUNT     distinct 5-bit luminance levels covering >0.5% of him.
                   This is "how many values does he get shaded with".

A patron matches Thad's abstraction when both land near his. The gate does not
guess a tolerance it cannot defend: it prints the ratios and says which figures
are outside 1.5x, which is the point at which the difference stopped being
arguable when the two crops were looked at side by side.

WHAT THE GATE MAY NOT DO ABOUT A FAILURE. Section 27, verbatim in effect: a
gross style mismatch may NOT be fixed by blur, posterization, global
pixelation, or a reduce-and-upscale trick. Those make a mismatched figure into
a mismatched blurry figure. The only real fix is regeneration under a corrected
prompt, which costs an image operation.

    python3 tools/room03/style-gate.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import sobel

ROOT = Path(__file__).resolve().parents[2]
PROOF = ROOT / 'proofs/room-03/clean-sheet'
THAD = ROOT / 'art/actors/thad-stand-front'

import importlib.util
spec = importlib.util.spec_from_file_location('integrate', Path(__file__).parent / 'integrate.py')
integrate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(integrate)

MATCH_H = 220          # every figure compared as if standing at one distance
BLOCKING = json.loads((PROOF / 'blocking.json').read_text())
STANDING = {p['id']: p['drawnHeight'] for p in BLOCKING['people']}
THAD_STANDING = 233    # errata 54: Thad's drawn height at mid-depth


def lum(rgb):
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def measure(rgba, name, standing, display=None):
    """
    `standing` is the drawn height a standing 1.75 m man has where this figure
    stands -- the camera's number, not the layer's bounding box.

    `display` exists for Thad alone, and it matters. The patrons' layers are
    already at their room size: those pixels are the pixels the player sees.
    Thad's source frames are 626px tall and the engine draws him at 233, so
    measuring the source would credit him with detail no one ever sees and make
    every patron look coarse by comparison. He is resampled to 233 first.
    """
    a = np.asarray(rgba)
    alpha = a[..., 3] > 128
    if alpha.sum() < 200:
        return None
    ys, xs = np.nonzero(alpha)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cut = rgba.crop((x0, y0, x1, y1))
    if display is not None:
        k = display / cut.height
        cut = cut.resize((max(1, round(cut.width * k)), display), Image.LANCZOS)
    h = cut.height
    s = MATCH_H / standing
    cut = cut.resize((max(1, round(cut.width * s)), max(1, round(h * s))), Image.LANCZOS)
    a = np.asarray(cut).astype(float)
    m = a[..., 3] > 128
    L = lum(a)
    gx, gy = sobel(L, 0), sobel(L, 1)
    g = np.hypot(gx, gy)
    inner = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
    if inner.sum() < 100:
        inner = m
    thr = np.median(g[inner]) * 2.0
    edge = float((g[inner] > thr).sum()) / float(inner.sum())
    bins = (L[inner] / 8).astype(int)
    counts = np.bincount(bins, minlength=32) / inner.sum()
    tones = int((counts > 0.005).sum())
    return dict(name=name, drawn_height=int(h), standing_height=int(standing),
                edge_density=round(edge, 4), tones=tones)


def thad_reference():
    f = sorted(THAD.glob('*.png'))[0]
    return measure(Image.open(f).convert('RGBA'), 'thad', THAD_STANDING,
                   display=THAD_STANDING)


def matched(rgba, standing, display=None):
    """The figure at the size he would be if he stood at one common distance."""
    a = np.asarray(rgba)
    ys, xs = np.nonzero(a[..., 3] > 128)
    cut = rgba.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    if display is not None:
        k = display / cut.height
        cut = cut.resize((max(1, round(cut.width * k)), display), Image.LANCZOS)
    s = MATCH_H / standing
    return cut.resize((max(1, round(cut.width * s)), max(1, round(cut.height * s))),
                      Image.LANCZOS)


def sheet(ref, rows):
    """
    THE PICTURE THE NUMBERS ARE FOR. Seven patrons and Thad, every one of them
    at the same crown-to-sole height on the same neutral field, so the question
    "is this man from the same game" is asked the only way it can be answered.
    """
    figs = [('thad', matched(Image.open(sorted(THAD.glob('*.png'))[0]).convert('RGBA'),
                             THAD_STANDING, display=THAD_STANDING))]
    for tag, name, img, at, s in integrate.placed_layers():
        if name.startswith('furniture') or name.endswith('-front'):
            continue
        base = name.replace('-behind', '')
        figs.append((base, matched(img, STANDING[base])))

    pad = 18
    w = sum(f.width for _, f in figs) + pad * (len(figs) + 1)
    hgt = max(f.height for _, f in figs)
    canvas = Image.new('RGB', (w, hgt + pad * 2), (52, 48, 44))
    x = pad
    for name, f in figs:
        canvas.paste(f, (x, pad + hgt - f.height), f)   # feet on one line
        x += f.width + pad
    out = PROOF / 'style-gate-matched-height.png'
    canvas.save(out)
    print(f'\n    wrote {out}   (order: ' + ', '.join(n for n, _ in figs) + ')')


def main():
    ref = thad_reference()
    print('SECTION 27 CHARACTER-STYLE GATE -- patrons vs Thad at matched height\n')
    print(f'  reference  thad   drawn {ref["drawn_height"]}px at standing '
          f'{ref["standing_height"]}px   edge {ref["edge_density"]:.4f}   '
          f'tones {ref["tones"]}\n')

    rows, fails = [], []
    for tag, name, img, at, s in integrate.placed_layers():
        if name.startswith('furniture') or name.endswith('-front'):
            continue
        base = name.replace('-behind', '')
        r = measure(img, base, STANDING[base])
        if r is None:
            continue
        r['edge_ratio'] = round(r['edge_density'] / ref['edge_density'], 2)
        r['tone_ratio'] = round(r['tones'] / ref['tones'], 2)
        rows.append(r)
        worst = max(r['edge_ratio'], 1 / max(r['edge_ratio'], 1e-6))
        flag = 'OUTSIDE 1.5x' if worst > 1.5 else 'within 1.5x'
        if worst > 1.5:
            fails.append(base)
        print(f'  {base:<8} drawn {r["drawn_height"]:>4}px of a standing '
              f'{r["standing_height"]:>3}px   edge {r["edge_density"]:.4f} '
              f'({r["edge_ratio"]:>5.2f}x)   tones {r["tones"]:>2} ({r["tone_ratio"]:>4.2f}x)   {flag}')

    sheet(ref, rows)

    out = PROOF / 'style-gate.json'
    out.write_text(json.dumps(dict(reference=ref, figures=rows, outside=fails), indent=2) + '\n')
    print(f'\n    wrote {out}')

    if fails:
        print(f'\nSECTION 27 FAIL -- {len(fails)} of {len(rows)} patrons outside 1.5x of Thad: '
              f'{", ".join(fails)}')
        print('Section 27 forbids blur, posterization, global pixelation and '
              'reduce/upscale as the remedy. The only remedy is regeneration,\n'
              'which costs an image operation against the cluster cap.')
        return 1
    print('\nSECTION 27 PASS')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
