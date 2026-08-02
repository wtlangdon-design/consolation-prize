"""Room 1's walk-box overlay: a thing to be marked up, not a proposal.

The room declares NO walk boxes. The walkable band is three extents, so
nothing in the picture is solid: the player crosses the fence, the sign and
the shack as if they were painted on. Making any of them block movement is
polygon work, and which things block is a judgement about the picture that
belongs to the project owner.

SO THIS ASKS TWO QUESTIONS AND KEEPS THEM SEPARATE, because they need
different data and the same object can need both:

    STOP AT?   collision -- a walk-box boundary. He cannot walk through it.
    PASS BEHIND?  occlusion -- a clip plane. He CAN walk there, and the thing
                  draws over him when he does.

The fence is the case that makes the distinction matter: a rail fence is
something a man walks up to and stops at, and also something he can stand
behind. Assuming either answer picks the wrong data structure.

EVERY LETTERED BOX BELOW IS DRAWN BY EYE and is meant to be corrected. Only
B's board comes from a measurement -- it is the town_sign hotspot's own rect.

Run: python3 tools/room01-walkbox-overlay.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PLATE = ROOT / "art" / "backgrounds" / "room-01-stage-road.png"
OUT = ROOT / "renders"

BAND_TOP = 660
BAND_BOTTOM = 864
BANDS = [("road_far", 660, 728), ("road_mid", 728, 796), ("road_near", 796, 864)]
HEIGHTS = {"road_far": 190, "road_mid": 205, "road_near": 225}

# x0, y0, x1, y1, label, what it is
CANDIDATES = [
    (0, 430, 350, 700, "A", "the shack and headframe"),
    (204, 360, 396, 690, "B", "the town sign (board rect is measured)"),
    (86, 588, 300, 712, "C", "the wagon wheel and barrels"),
    (676, 424, 1284, 644, "D", "the rail fence and bench"),
    (812, 612, 904, 668, "E", "the crate under the rails"),
    (1656, 396, 1920, 532, "F", "the right-hand fence"),
    (1840, 436, 1920, 576, "G", "the hay bales"),
]

INK = (255, 236, 200)
BAND = (86, 214, 140)
CAND = (255, 128, 96)
RULE = (150, 190, 255)


def font(size: int) -> ImageFont.ImageFont:
    for name in ("DejaVuSansMono.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def shade(draw: ImageDraw.ImageDraw, box, colour, alpha: int) -> None:
    """A wash that leaves the art readable underneath it."""
    draw.rectangle(box, fill=colour + (alpha,))


def annotate(plate: Image.Image, scale: int, crop=None) -> Image.Image:
    """The plate with the band shaded, a labelled ruler, and the candidates."""
    base = plate.convert("RGBA")
    if crop:
        base = base.crop(crop)
    ox, oy = (crop[0], crop[1]) if crop else (0, 0)
    if scale != 1:
        base = base.resize((base.width * scale, base.height * scale), Image.NEAREST)
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    small = font(11 * scale)
    big = font(15 * scale)

    def to(x: int, y: int) -> tuple[int, int]:
        return ((x - ox) * scale, (y - oy) * scale)

    # The walkable band, one wash per zone so the three are told apart.
    for index, (name, top, bottom) in enumerate(BANDS):
        # Light on purpose: the wash has to say WHERE without hiding WHAT.
        shade(draw, [*to(ox, top), *to(ox + base.width // scale, bottom)],
              BAND, 16 + index * 9)
        draw.line([*to(ox, top), *to(ox + base.width // scale, top)], fill=BAND + (200,),
                  width=max(1, scale // 2))
        draw.text(to(ox + 96, top + 4),
                  f"{name}  y {top}-{bottom}  {HEIGHTS[name]}px", font=small, fill=BAND + (255,))

    # A RULER, because a labelled row is what makes an answer usable.
    for y in range(400, 880, 20):
        if crop and not (crop[1] <= y <= crop[3]):
            continue
        heavy = y % 100 == 0
        draw.line([*to(ox, y), *to(ox + (26 if heavy else 14), y)],
                  fill=RULE + (255 if heavy else 150,), width=max(1, scale // 2))
        if heavy:
            draw.text(to(ox + 30, y - 7), str(y), font=small, fill=RULE + (255,))

    for x0, y0, x1, y1, label, _ in CANDIDATES:
        if crop and (x1 < crop[0] or x0 > crop[2]):
            continue
        draw.rectangle([*to(x0, y0), *to(x1, y1)], outline=CAND + (255,), width=max(2, scale))
        draw.text(to(x0 + 6, y0 + 4), label, font=big, fill=CAND + (255,))

    return Image.alpha_composite(base, layer).convert("RGB")


def questions() -> Image.Image:
    """The two questions, per object, asked separately and visibly."""
    rows = font(20)
    head = font(26)
    panel = Image.new("RGB", (1920, 150 + 46 * len(CANDIDATES)), (18, 16, 14))
    draw = ImageDraw.Draw(panel)
    draw.text((40, 26), "ROOM 1 — WHAT IS SOLID, AND WHAT IS IN FRONT?", font=head, fill=INK)
    draw.text((40, 64),
              "Two different questions and two different answers. An object can need both.",
              font=rows, fill=(170, 158, 138))
    draw.text((40, 104), "STOP AT?", font=rows, fill=CAND)
    draw.text((190, 104), "he cannot walk through it — a walk-box boundary", font=rows, fill=INK)
    draw.text((980, 104), "PASS BEHIND?", font=rows, fill=CAND)
    draw.text((1180, 104), "he can stand there and it draws over him — a clip plane",
              font=rows, fill=INK)
    y = 150
    for x0, y0, x1, y1, label, what in CANDIDATES:
        draw.text((40, y), f"{label}", font=rows, fill=CAND)
        draw.text((80, y), what, font=rows, fill=INK)
        draw.text((700, y), f"x {x0}-{x1}   y {y0}-{y1}", font=rows, fill=(140, 132, 118))
        draw.text((1180, y), "STOP AT:  yes / no        PASS BEHIND:  yes / no",
                  font=rows, fill=(140, 132, 118))
        y += 46
    return panel


def main() -> None:
    plate = Image.open(PLATE)
    OUT.mkdir(exist_ok=True)

    whole = annotate(plate, 1)
    panel = questions()
    sheet = Image.new("RGB", (1920, whole.height + panel.height), (18, 16, 14))
    sheet.paste(whole, (0, 0))
    sheet.paste(panel, (0, whole.height))
    sheet.save(OUT / "room-01-walkbox-overlay.png")

    left = annotate(plate, 4, crop=(0, 480, 640, 864))
    left.save(OUT / "room-01-walkbox-overlay-left-third@4x.png")

    print(f"wrote {OUT / 'room-01-walkbox-overlay.png'}  {sheet.size}")
    print(f"wrote {OUT / 'room-01-walkbox-overlay-left-third@4x.png'}  {left.size}")


if __name__ == "__main__":
    main()
