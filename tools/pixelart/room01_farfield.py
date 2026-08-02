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
import json
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

#: How much worse than the ACHIEVABLE FLOOR a region may score. Not how far it
#: may sit from the raw bar -- see the floor calculation for why that number
#: cannot be a threshold. 0.05 means a twentieth of the region's pixels.
SHAPE_MARGIN = 0.05

#: Ruling 42's hollow test. An interior bucket holding less than this share of
#: its expected 1/BUCKETS is a gap in the middle of the distribution, which is
#: what "highlights with nothing to be highlights on" measures as.
HOLLOW_RATIO = 0.50

#: Ruling 41. Ours over the reference's mean saturation. Under the floor the
#: region is washed out; over the ceiling it shouts, which is what took the
#: road's ruts over the town.
SAT_FLOOR, SAT_CEILING = 0.70, 1.30

#: No tolerance, because the test does not need one. See foreign_families.


def luminance(pixel) -> float:
    red, green, blue = pixel
    return 0.299 * red + 0.587 * green + 0.114 * blue


def saturation(pixel) -> float:
    peak = max(pixel)
    return 0.0 if peak == 0 else (peak - min(pixel)) / peak


def blue_axis(pixel) -> float:
    """Blue against yellow. Positive is a cold surface."""
    red, green, blue = pixel
    return blue - (red + green) / 2


def family_map(palette_data) -> dict:
    """RGB tuple -> the locked palette family that owns it."""
    colours = [
        (int(v[1:3], 16), int(v[3:5], 16), int(v[5:7], 16))
        for v in palette_data["colours"]
    ]
    owner = {}
    for name, span in palette_data["families"].items():
        for step in range(span["count"]):
            owner.setdefault(colours[span["start"] + step], name)
    return owner


def foreign_families(ours: list, theirs: list, owner: dict) -> dict:
    """Families we paint with that the reference never uses in this region.

    THIS REPLACED A MEAN, AND THE REPLACEMENT IS THE POINT.

    Ruling 41 asked for saturation beside luminance, so this check measured
    saturation -- the AMOUNT of colour, with no opinion about its DIRECTION. A
    region author closing the sky's chroma gap found that the single most
    saturated cold entry in the locked palette is accent_teal 0 at (8, 32, 32),
    dithered it through the middle of the night sky at the highest density that
    still measured well, and moved the number the right way. Three blind critics
    on three different regions then independently called the sky green speckle.

    The first fix was a mean green-minus-magenta axis, and it was wrong twice
    over. It scored the sky +9.0 against the reference with the teal in, +8.0
    with the teal entirely removed -- so it was measuring a palette limit, not
    the defect, and its threshold was unreachable. And a mean cannot see
    localised wrong hue anyway: eleven hundred teal pixels moved the region's
    average by less than one unit while being plainly green to look at.

    So the test is not a statistic at all. The reference re-quantised into OUR
    palette is the requantiser's best attempt at the same picture under the same
    constraint, and it chose accent_teal for the sky ZERO times out of 15,360
    pixels. Ours chose it 1,089 times. A family the reference never reaches for
    in a region is a family that does not belong in it, and there is no
    threshold to argue about.
    """
    ours_families, theirs_families = {}, set()
    for pixel in theirs:
        name = owner.get(pixel)
        if name:
            theirs_families.add(name)
    for pixel in ours:
        name = owner.get(pixel)
        if name:
            ours_families[name] = ours_families.get(name, 0) + 1
    return {
        name: count for name, count in ours_families.items()
        if name not in theirs_families
    }


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
    owner = family_map(json.loads((ROOT / "art" / "palette" / "consolation-256.json").read_text()))

    print("ROOM 1 -- the far field, per errata 41 (saturation) and 42 (shape)\n")
    print(f"  {'region':8s} {'shape':>15s} {'hollow':>18s} {'sat ratio':>15s} {'foreign':>8s} "
          f"{'top2 cover':>20s} {'mean run':>16s}")
    print("  " + "-" * 104)

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

        # THE ACHIEVABLE FLOOR, and the third time this file has been wrong the
        # same way. Flatness was first: measured against a 256-colour reference
        # it could never pass, which is noise with a threshold on it. Shape had
        # exactly the same flaw and it took two region authors, independently,
        # to find it -- the town's and the coach's, each reporting that the
        # bucket they were told to fill is one the palette cannot reach.
        #
        # They were right and it is worse than they said. Scored against the raw
        # bar, OUR RENDER BEATS THE RE-QUANTISED BAR ON FIVE REGIONS OF SEVEN:
        # sky 0.537 against 0.560, range 0.336 against 0.418, town 0.445 against
        # 0.505, team 0.049 against 0.072, coach 0.166 against 0.176. The check
        # was reporting failure while the drawing was already past the best this
        # palette can do at this picture, and two rounds of town work were spent
        # partly chasing a number that had no floor to stand on.
        #
        # So the score that decides anything is the MARGIN over the floor. The
        # raw distance is kept in the report because it says how far the palette
        # itself falls short, which is worth knowing and is nobody's fault.


        # THE PROOF'S OWN SCORE, ON THE SAME RECT, PRINTED BESIDE OURS. The
        # flatness test already refuses to be measured against the free-colour
        # bar, on the grounds that "a test that cannot pass is not a test, it
        # is noise with a threshold on it". Shape and hollow needed the same
        # treatment and did not have it: the proof -- the reference put
        # through OUR palette, which is by construction the best score
        # reachable here -- scores shape 0.560 on the sky, 0.418 on the range
        # and 0.505 on the town, all hollow in buckets 2 or 4, against a
        # SHAPE_TOLERANCE of 0.20. Two of the reference's five quintiles are
        # below accent_indigo[0] and simply do not exist in this palette, so
        # no drawing of the far field can fill them.
        #
        # It cost a round. The sky closed its shape gap by dithering `grey` 1
        # through 2,152 px of night -- scoring 0.396, BETTER than the proof --
        # and paid for it with the one number the proof does reach: saturation
        # 0.74 proof, 0.65 ours, ruling 41's floor 0.70. A blind critic on a
        # different region named the result "dark speckle over the entire
        # upper third" without being asked about the sky at all.
        #
        # So the threshold is not moved and no failure is suppressed: every
        # line still prints. What is printed beside it is what the same
        # measurement gives on the best picture this palette can hold, and a
        # region already past that number is not short, it is over-tuned.
        proof = sample(bar_in_palette, rect)
        proof_shares = bucket_shares([luminance(p) for p in proof], edges)
        proof_shape = 0.5 * sum(abs(s - expected) for s in proof_shares)

        # A bucket the FLOOR cannot fill either is a palette fact, not a hollow.
        hollow = [
            index for index in range(1, BUCKETS - 1)
            if shares[index] < expected * HOLLOW_RATIO
            and proof_shares[index] >= expected * HOLLOW_RATIO
        ]
        proof_hollow = [
            index for index in range(1, BUCKETS - 1)
            if proof_shares[index] < expected * HOLLOW_RATIO
        ]

        our_sat = sum(saturation(pixel) for pixel in ours) / len(ours)
        ref_sat = sum(saturation(pixel) for pixel in theirs) / len(theirs)
        ratio = our_sat / ref_sat if ref_sat else 0.0
        proof_sat = sum(saturation(pixel) for pixel in proof) / len(proof)
        proof_ratio = proof_sat / ref_sat if ref_sat else 0.0

        foreign = foreign_families(ours, proof, owner)
        foreign_count = sum(foreign.values())

        our_cover, our_run = flatness(ours)
        ref_cover, ref_run = flatness(proof)

        hollow_text = "none" if not hollow else "bucket " + ",".join(str(h + 1) for h in hollow)
        print(f"  {name:8s} {shape:7.3f} /{proof_shape:6.3f} {hollow_text:>18s} "
              f"{ratio:10.2f} /{proof_ratio:4.2f} {foreign_count:8d} "
              f"{our_cover:8.0%} vs {ref_cover:4.0%}   {our_run:5.2f} vs {ref_run:4.2f}")

        if shape - proof_shape > SHAPE_MARGIN:
            failures.append(f"{name}: shape {shape:.3f} against an achievable floor of "
                            f"{proof_shape:.3f} -- {shape - proof_shape:+.3f} worse than the "
                            "best this palette can do at this picture")
        if hollow:
            also = "" if not proof_hollow else " -- and so is the proof, in bucket " + \
                ",".join(str(h + 1) for h in proof_hollow)
            failures.append(f"{name}: {hollow_text} hollow -- ruling 42's signature, "
                            "highlights with nothing to be highlights on" + also)
        if not (SAT_FLOOR <= ratio <= SAT_CEILING):
            failures.append(f"{name}: saturation ratio {ratio:.2f} outside "
                            f"{SAT_FLOOR}-{SAT_CEILING} -- ruling 41 "
                            f"(the proof reaches {proof_ratio:.2f})")
        if foreign:
            named = ", ".join(f"{fam} x{count}" for fam, count in sorted(foreign.items()))
            failures.append(f"{name}: paints in {named} -- families the reference never "
                            "uses here. Chroma in the wrong direction is not chroma")
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
