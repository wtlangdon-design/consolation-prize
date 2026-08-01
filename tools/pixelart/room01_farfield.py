"""The far field, measured the way errata 41 and 42 say to measure it.

WHY THIS EXISTS. Nine blind critics judged Room 1 and named three defects that
are one defect: the far field is flat. The sky is seventeen rows of one colour
with its whole gradient dumped into a checker belt. The range is two colours
with a mechanical staircase for a ridgeline. The town puts 90.5 per cent of its
non-window pixels into three neutral greys, so every building shares a value
with the one behind it. The team has the same problem on a different object --
silhouettes with no modelling inside them.

Every one of those passed every check this project had. That is not an accident
and it is not bad luck; it is what rulings 41 and 42 are about. So the checks
come first this time, before a pixel is redrawn.

    python3 room01_farfield.py            report
    python3 room01_farfield.py --strict    and fail on a region that is short

WHAT IT MEASURES, and each one is a ruling made executable:

  SHAPE (ruling 42). The reference's own quintile boundaries are computed per
  region, and then OUR pixels are dropped into those five buckets. A perfect
  match puts twenty per cent in each. The score is total-variation distance
  from that, so it is scale-free and it does not care about means: two regions
  with identical mean, variance and extremes score badly here if one is bimodal
  and the other is not. The hollow-middle test is separate and blunter -- any
  interior bucket under half its expected share is the exact signature the town
  had, and it is reported by name.

  SATURATION (ruling 41). Mean chroma alongside mean luminance, always, because
  a region can match on value and still shout. Reported as a ratio so the
  direction is unambiguous.

  FLATNESS. What the shape score cannot see: a region can have a perfect
  distribution and still be painted in slabs. So the two commonest indices'
  coverage and the mean same-value run length are reported next to it. "Two
  colours with a staircase" is a flatness failure, not a shape one.

WHAT THIS CHECK CANNOT SEE, stated here because ruling 42 asks every instrument
to say so. It is blind to WHERE a value is. A region could put its mid-tones in
exactly the right proportion and in exactly the wrong places -- the sky's ramp
inverted, the town's lit roofs under the eaves instead of over them -- and
score perfectly on all three numbers. Placement is what the blind critics are
for, and neither replaces the other.
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / "reference" / "room-01" / "image-B-bar-320x144.png"

#: The bar re-quantised into our locked palette, and FLATNESS IS MEASURED
#: AGAINST THIS ONE rather than against the bar itself.
#:
#: The bar was generated without a palette and carries 256 free colours, so its
#: two commonest cover four to six per cent of any region -- a number we could
#: not reach with 105 indices if the drawing were perfect. Compared against it,
#: every region fails flatness for ever, and a test that cannot pass is not a
#: test, it is noise with a threshold on it. The re-quantisation is the same
#: picture under the same constraint we are under, so it is the only fair
#: control for a question about how many colours a surface uses.
#:
#: Shape and saturation stay measured against the true bar: those are questions
#: about the target's look, and the re-quantisation is measurably three
#: luminance points brighter than the thing it re-quantises.
REFERENCE_IN_PALETTE = ROOT / "reference" / "room-01" / "image-B-in-locked-palette-320x144.png"

#: The four regions this run is allowed to touch. Everything else in the frame
#: is out of scope by instruction -- the road in particular held up and is not
#: to be re-opened.
REGIONS = (
    ("sky", (0, 0, 320, 48)),
    ("range", (0, 20, 320, 40)),
    ("town", (60, 30, 120, 38)),
    ("team", (142, 54, 92, 58)),
)

#: Five buckets, because the reference's quintiles are what defines them and
#: five is enough to show a hollow without splitting hairs over sampling noise.
BUCKETS = 5

#: Total-variation distance from a perfect distribution match. Below this a
#: region is the same SHAPE as the reference, whatever its mean.
#: 0.20 means a fifth of the region's pixels would have to move bucket.
SHAPE_TOLERANCE = 0.20

#: Ruling 42's hollow test. An interior bucket holding less than this share of
#: its expected 1/BUCKETS is a gap in the middle of the distribution, which is
#: what "highlights with nothing to be highlights on" measures as.
HOLLOW_RATIO = 0.50

#: Ruling 41. Ours over the reference's mean saturation. Under the floor the
#: region is washed out; over the ceiling it shouts, which is what took the
#: road's ruts over the town.
SAT_FLOOR, SAT_CEILING = 0.70, 1.30


def luminance(pixel) -> float:
    red, green, blue = pixel
    return 0.299 * red + 0.587 * green + 0.114 * blue


def saturation(pixel) -> float:
    peak = max(pixel)
    return 0.0 if peak == 0 else (peak - min(pixel)) / peak


def sample(image: Image.Image, rect) -> list:
    x, y, width, height = rect
    pixels = image.load()
    return [pixels[px, py] for py in range(y, y + height) for px in range(x, x + width)]


def quintiles(values: list[float]) -> list[float]:
    ordered = sorted(values)
    return [ordered[int(len(ordered) * i / BUCKETS)] for i in range(1, BUCKETS)]


def bucket_shares(values: list[float], edges: list[float]) -> list[float]:
    counts = [0] * BUCKETS
    for value in values:
        index = 0
        while index < len(edges) and value >= edges[index]:
            index += 1
        counts[index] += 1
    return [count / len(values) for count in counts]


def flatness(pixels: list) -> tuple[float, float]:
    """Top-two coverage, and mean run length along rows.

    A region can hold the right distribution and still be slabs. This is what
    catches that: the range scored two colours over most of its area and a
    staircase for an edge, which is a coverage number, not a histogram one.
    """
    counts = Counter(pixels)
    top_two = sum(count for _, count in counts.most_common(2)) / len(pixels)
    runs, run = [], 1
    for index in range(1, len(pixels)):
        if pixels[index] == pixels[index - 1]:
            run += 1
        else:
            runs.append(run)
            run = 1
    runs.append(run)
    return top_two, sum(runs) / len(runs)


def report(strict: bool) -> int:
    import room01

    canvas, palette = room01.compose(with_coach=True)
    ours_image = canvas.to_image(palette).convert("RGB")
    bar = Image.open(REFERENCE).convert("RGB")
    bar_in_palette = Image.open(REFERENCE_IN_PALETTE).convert("RGB")

    print("ROOM 1 -- the far field, per errata 41 (saturation) and 42 (shape)\n")
    print(f"  {'region':8s} {'shape':>7s} {'hollow':>18s} {'sat ratio':>10s} "
          f"{'top2 cover':>22s} {'mean run':>18s}")
    print("  " + "-" * 88)

    failures = []
    for name, rect in REGIONS:
        ours = sample(ours_image, rect)
        theirs = sample(bar, rect)

        ref_lum = [luminance(pixel) for pixel in theirs]
        our_lum = [luminance(pixel) for pixel in ours]
        edges = quintiles(ref_lum)
        shares = bucket_shares(our_lum, edges)

        expected = 1.0 / BUCKETS
        shape = 0.5 * sum(abs(share - expected) for share in shares)

        hollow = [
            index for index in range(1, BUCKETS - 1)
            if shares[index] < expected * HOLLOW_RATIO
        ]

        our_sat = sum(saturation(pixel) for pixel in ours) / len(ours)
        ref_sat = sum(saturation(pixel) for pixel in theirs) / len(theirs)
        ratio = our_sat / ref_sat if ref_sat else 0.0

        our_cover, our_run = flatness(ours)
        ref_cover, ref_run = flatness(sample(bar_in_palette, rect))

        hollow_text = "none" if not hollow else "bucket " + ",".join(str(h + 1) for h in hollow)
        print(f"  {name:8s} {shape:7.3f} {hollow_text:>18s} {ratio:10.2f} "
              f"{our_cover:9.0%} vs {ref_cover:4.0%}      {our_run:5.2f} vs {ref_run:4.2f}")

        if shape > SHAPE_TOLERANCE:
            failures.append(f"{name}: shape {shape:.3f} over {SHAPE_TOLERANCE} -- "
                            f"buckets {['%.0f%%' % (s * 100) for s in shares]} against 20% each")
        if hollow:
            failures.append(f"{name}: {hollow_text} hollow -- ruling 42's signature, "
                            "highlights with nothing to be highlights on")
        if not (SAT_FLOOR <= ratio <= SAT_CEILING):
            failures.append(f"{name}: saturation ratio {ratio:.2f} outside "
                            f"{SAT_FLOOR}-{SAT_CEILING} -- ruling 41")
        if our_cover > ref_cover + 0.15:
            failures.append(f"{name}: two colours cover {our_cover:.0%} against the "
                            f"reference's {ref_cover:.0%} -- painted in slabs")

    print()
    if failures:
        print("  SHORT OF THE BAR:")
        for line in failures:
            print(f"    - {line}")
    else:
        print("  every far-field region matches the reference on shape, chroma and flatness")

    print("\n  Blind to WHERE a value sits. A region can score perfectly here with its\n"
          "  ramp inverted or its lit planes under the eaves instead of over them.\n"
          "  That is what the blind critics are for; neither replaces the other.")

    return 1 if (strict and failures) else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true",
                        help="exit non-zero when a region is short")
    args = parser.parse_args()
    raise SystemExit(report(args.strict))


if __name__ == "__main__":
    main()
