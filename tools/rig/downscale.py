#!/usr/bin/env python3
"""Take a rigged clip to the size the game loads it at.

    python3 tools/rig/downscale.py art/actors/thad-lookup-left --figure 526

THIS STAGE WAS NOT IN THE REPOSITORY AND IT PRODUCES EVERY PIXEL ANYONE SEES.
`character.py` writes at source resolution -- 869x1720 for the lookup source --
and the game loads 279x610. Everything between was a Python block written fresh
from memory each time, leaving no script, no log and no parameter behind.

That is worse than an unread field. An unread field is at least present in a
diff. A stage with no artefact cannot be reviewed, cannot be re-run, and cannot
be corrected once: when the coach's transparent RGB was got wrong and magenta
bled inward, the fix lived in one person's head and the next coach would have
had it again.

WHY PREMULTIPLY. Resampling RGBA directly averages the colour of transparent
pixels into their opaque neighbours. A keyed frame carries WHATEVER WAS UNDER
THE KEY in its transparent pixels -- `character.py` bleeds edge colour outward
precisely so that stays sane -- but at a 3x reduction each output pixel draws
on nine inputs, and any transparent one contributes its colour weighted by
nothing. Premultiplying by alpha first makes the weight correct; unpremultiplying
after restores the colour. Skipping it is what puts a halo on every edge.

AND IT REFUSES A CLIP THAT COLLAPSES. `character.py` floors the breath
amplitude so a six-frame idle has at least three distinct pictures at SOURCE
resolution. Nothing guaranteed that survived the reduction: offsets of 7px at
1655 become 2.2px at 526, and two of them can round to the same row. This is
the same refusal one stage later, and it is the stage where the arithmetic
actually decides -- so it is checked on what it writes rather than on what it
was given.
"""
from __future__ import annotations
import argparse
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


def figure_height(frames: list[Image.Image]) -> int:
    """The tallest opaque extent across the clip, which is what `figure` means.

    ACROSS THE CLIP AND NOT FROM ONE FRAME. A breath raises the chest, so the
    figure is a few rows taller in the middle of the cycle than at its ends --
    and scaling each frame to its own height would make him grow and shrink
    instead of breathe. One factor for the whole clip, from the largest.
    """
    top, bottom = None, None
    for frame in frames:
        rows = np.nonzero((np.array(frame)[..., 3] > 128).any(axis=1))[0]
        if len(rows) == 0:
            continue
        top = rows.min() if top is None else min(top, rows.min())
        bottom = rows.max() if bottom is None else max(bottom, rows.max())
    if top is None:
        raise SystemExit("every frame is fully transparent")
    return int(bottom - top) + 1


def reduce_frame(frame: Image.Image, size: tuple[int, int]) -> Image.Image:
    a = np.array(frame).astype(np.float64)
    alpha = a[..., 3:4] / 255.0
    a[..., :3] *= alpha                                   # premultiply
    # RESAMPLE IN FLOAT, ONE CHANNEL AT A TIME. Premultiplied colour at a faint
    # edge is a small number -- (2, 1, 2) under alpha 10 -- and rounding it to
    # a byte before the resize, then dividing by the alpha afterwards, turned
    # rounding noise into colour: the Family-A stride's downscale came back
    # with 550 visible purple edge pixels a frame (Tyler's profile-walk task,
    # 2026-09-05). PIL resizes a 32-bit float plane exactly.
    planes = [np.array(Image.fromarray(a[..., c].astype(np.float32), "F")
                       .resize(size, Image.LANCZOS)).astype(np.float64) for c in range(4)]
    small = np.dstack(planes)
    out_a = np.clip(small[..., 3:4], 0, 255)
    # Unpremultiply where there is anything to divide by. A pixel that came out
    # fully transparent keeps whatever colour the division would have blown up
    # to infinity, so it is left at zero -- and clause one of
    # check-clip-agreement treats two fully transparent pixels as agreeing
    # whatever their colour channels say, for exactly this reason.
    safe = out_a > 0
    small[..., :3] = np.where(safe, small[..., :3] * 255.0 / np.maximum(out_a, 1e-6), 0.0)
    small[..., 3:4] = out_a
    # AND WHAT LANCZOS RINGS PAST THE KEY LINE COMES BACK UNDER IT. A negative
    # lobe beside a hard dark edge can push red and blue over the green by
    # more than the fringe check allows; pull both down together, keeping
    # their ratio, to eight below the line -- the same rule character.py's
    # despill applies at source resolution.
    # AFTER THE CLIP, in the range the check reads. Done before it, a ringing
    # overshoot un-premultiplied at alpha 50 -- red in the thousands, green
    # below zero -- scaled to a negative and clipped back to (255, 0, 0).
    small = np.clip(small, 0, 255)
    rgb = small[..., :3]
    avg = (rgb[..., 0] + rgb[..., 2]) / 2
    over = (out_a[..., 0] > 0) & (avg > rgb[..., 1] + 22)
    scale = np.where(over, (rgb[..., 1] + 22) / np.maximum(avg, 1e-6), 1.0)
    rgb[..., 0] *= scale
    rgb[..., 2] *= scale
    return Image.fromarray(np.clip(small, 0, 255).astype(np.uint8), "RGBA")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("clip", help="a directory of rigged frames, as character.py writes them")
    ap.add_argument("--figure", type=int, required=False, default=0,
                    help="the figure height the game loads, in pixels. R5a: twice the "
                         "largest DRAWN height, or as much less as the boot budget "
                         "requires -- see doc 38 R5a's bound, which the coach broke")
    ap.add_argument("--factor", type=float, default=None,
                    help="an explicit scale instead of one derived from --figure: for a clip that is "
                         "PART of a figure (legs alone) and must land at the same scale as the whole")
    ap.add_argument("--out", help="where to write. Defaults to the clip directory, in place")
    ap.add_argument("--min-distinct", type=int, default=3,
                    help="refuse if the reduced clip holds fewer distinct pictures than "
                         "this. Three is the fewest that can rise and settle")
    args = ap.parse_args()

    src = Path(args.clip)
    files = sorted(p for p in src.glob("*.png"))
    if not files:
        raise SystemExit(f"no frames in {src}")
    frames = [Image.open(p).convert("RGBA") for p in files]

    fig = figure_height(frames)
    if args.factor is None and fig <= args.figure:
        raise SystemExit(
            f"{src.name}: figure is already {fig}px against a requested {args.figure}px. "
            "This tool reduces; it does not enlarge, because enlarging invents detail.")
    factor = args.factor if args.factor is not None else args.figure / fig
    w, h = frames[0].size
    size = (max(1, round(w * factor)), max(1, round(h * factor)))

    out = Path(args.out) if args.out else src
    out.mkdir(parents=True, exist_ok=True)
    reduced = [reduce_frame(frame, size) for frame in frames]

    # THE REFUSAL COMES BEFORE THE WRITE. A collapsed clip that is written and
    # then complained about is a collapsed clip in the tree, and the whole
    # reason this check exists is that sixteen of them got there and stayed.
    # BY THE THRESHOLDED ALPHA MASK, NOT BY THE BYTES, and the difference is
    # the whole reliability of this refusal. Byte-equality is the honest
    # measure upstream, where frames are composites of the same layers at whole
    # -pixel offsets: identical bytes mean an identical picture. AFTER A
    # RESAMPLE IT IS THE WRONG MEASURE. LANCZOS turns a sub-pixel offset into
    # slightly different values everywhere, so every frame stays byte-distinct
    # however little the figure moved -- tested: reducing a 4-picture clip to a
    # 62px figure, where the breath is a fifth of a pixel, still reported four.
    # A refusal that cannot fire is not a refusal.
    #
    # The mask asks the question the eye asks: did the SHAPE move. A whole-pixel
    # shift changes it; a resampling smear does not.
    digests = [hashlib.sha256((np.array(frame)[..., 3] > 128).tobytes()).hexdigest()
               for frame in reduced]
    distinct = len(set(digests))
    if len(reduced) >= 4 and distinct < args.min_distinct:
        raise SystemExit(
            f"{src.name}: {len(reduced)} frames reduce to {distinct} distinct picture(s) at "
            f"{args.figure}px. The clip survives at source resolution and collapses here -- "
            f"scale {factor:.3f} put its offsets on the same row. Nothing written. "
            "Raise --breath in character.py, or --figure here.")

    for path, frame in zip(files, reduced):
        frame.save(out / path.name)
    print(f"{src.name}: {len(reduced)} frames {w}x{h} -> {size[0]}x{size[1]} "
          f"(figure {fig} -> {args.figure}, x{factor:.3f}), {distinct} distinct")


if __name__ == "__main__":
    main()
