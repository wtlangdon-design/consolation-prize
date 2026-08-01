"""The blind A/B harness for the Room 1 rebuild.

WHAT IT IS FOR. A critic that knows which picture is ours grades ours. Every
comparison this loop makes is therefore blind: the harness writes two files
called candidate-alpha.png and candidate-beta.png, one of them the reference
bar and one of them the current render, and which is which depends on the round
and the region. The critic reads the two files, picks one, and names the gap.
The caller decodes afterwards.

WHAT IT IS NOT FOR. It never scales the reference down to us or us up to the
reference by anything but nearest neighbour, and it never composites the two.
The pair a critic sees are the same size, the same magnification and the same
file format, so nothing but the drawing distinguishes them -- no JPEG ringing on
one side, no smoothing on the other, no size tell.

    python3 room01_ab.py --round 3
    python3 room01_ab.py --round 3 --only hob,coach

Writes work/room-01-loop/round-003/ with, per region:

    <region>/candidate-alpha.png    one of the two, magnified
    <region>/candidate-beta.png     the other
    ours.png / ours@4x.png          the round's real render, not blinded
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image

from room01_regions import AUTHORED, REGIONS, BY_ID

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / "reference" / "room-01" / "image-B-bar-320x144.png"
WORK = ROOT / "work" / "room-01-loop"
GALLERY = ROOT / "renders" / "room-01-loop"


def render_ours() -> Image.Image:
    """The current composition, exactly as a player would see it.

    Imported inside the function so a broken compositor fails here with its own
    traceback rather than at import time, which matters when the thing being
    iterated on is the compositor.
    """
    import room01_stage_road as room

    canvas, palette = room.compose(with_coach=True)
    return canvas.to_image(palette).convert("RGB")


def _slot(round_number: int, region_index: int) -> tuple[str, str]:
    """Which name ours gets, and which the reference gets.

    Alternating on round PLUS region index rather than round alone: if every
    region in a round put ours in the same slot, a critic that somehow learned
    one answer would have learned all of them, and more practically it makes a
    systematic slot bias impossible to mistake for a result.
    """
    ours_is_alpha = (round_number + region_index) % 2 == 0
    return ("alpha", "beta") if ours_is_alpha else ("beta", "alpha")


def build(round_number: int, only: set[str] | None = None) -> Path:
    ours = render_ours()
    if ours.size != (320, 144):
        raise SystemExit(f"composition is {ours.size}, must be 320x144")
    bar = Image.open(REFERENCE).convert("RGB")
    if bar.size != (320, 144):
        raise SystemExit(f"reference is {bar.size}, must be 320x144")

    out = WORK / f"round-{round_number:03d}"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    ours.save(out / "ours.png")
    _magnify(ours, 4).save(out / "ours@4x.png")

    # The gallery keeps both sizes on purpose. The native PNG is what the
    # progress page embeds -- seven kilobytes, exact pixels, magnified by the
    # browser with image-rendering: pixelated, so a phone gets the real thing
    # rather than a resample of it. The 4x is for looking at on GitHub, where
    # a 320x144 image is a postage stamp.
    GALLERY.mkdir(parents=True, exist_ok=True)
    ours.save(GALLERY / f"round-{round_number:03d}.png")
    _magnify(ours, 4).save(GALLERY / f"round-{round_number:03d}@4x.png")

    for index, region in enumerate(REGIONS):
        if only and region.id not in only:
            continue
        ours_name, bar_name = _slot(round_number, index)
        folder = out / region.id
        folder.mkdir(parents=True, exist_ok=True)
        _crop(ours, region).save(folder / f"candidate-{ours_name}.png")
        _crop(bar, region).save(folder / f"candidate-{bar_name}.png")

    print(f"round {round_number} -> {out}")
    for index, region in enumerate(REGIONS):
        if only and region.id not in only:
            continue
        ours_name, _ = _slot(round_number, index)
        print(f"  {region.id:10s} ours is {ours_name}")
    return out


def _crop(image: Image.Image, region) -> Image.Image:
    x, y, width, height = region.rect
    return _magnify(image.crop((x, y, x + width, y + height)), region.zoom)


def _magnify(image: Image.Image, scale: int) -> Image.Image:
    """Nearest neighbour, always. Any other filter would grade a blur."""
    return image.resize(
        (image.width * scale, image.height * scale), Image.Resampling.NEAREST
    )


def decode(round_number: int, region_id: str) -> str:
    """Which slot holds ours, for a caller reading a critic's verdict."""
    index = next(i for i, region in enumerate(REGIONS) if region.id == region_id)
    return _slot(round_number, index)[0]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--round", type=int, required=True)
    parser.add_argument("--only", default="", help="comma-separated region ids")
    parser.add_argument("--decode", default="", help="print which slot is ours and exit")
    args = parser.parse_args()

    if args.decode:
        for region_id in args.decode.split(","):
            region_id = region_id.strip()
            if region_id not in BY_ID:
                raise SystemExit(f"unknown region {region_id!r}")
            print(f"{region_id}: ours is {decode(args.round, region_id)}")
        return

    only = {part.strip() for part in args.only.split(",") if part.strip()} or None
    if only:
        unknown = only - {region.id for region in REGIONS}
        if unknown:
            raise SystemExit(f"unknown regions: {sorted(unknown)}")
    build(args.round, only)


if __name__ == "__main__":
    main()
