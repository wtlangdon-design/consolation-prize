"""Generates the locked 256-colour palette.

Run once. The output is committed and must not change afterwards -- every
background, sprite and UI element indexes into it, and doc 11 is explicit
that the palette cannot be revised later without redoing every asset.

Two authenticity decisions:

  * Channels are quantised to 6 bits (0-63, scaled back to 0-255), which is
    what VGA hardware actually stored. Colours that are not representable on
    the target hardware would be a tell.

  * Every family is a dark-to-light ramp rather than a scatter of related
    colours. Ordered dithering blends between *adjacent ramp steps*, so a
    ramp with gaps produces visible banding and a ramp with even steps does
    not. The ramps are the reason dithering works at all.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "art" / "palette" / "consolation-256.json"

Rgb = tuple[int, int, int]


def quantise6(value: float) -> int:
    """Clamp to 0-255 through a 6-bit VGA channel."""
    step = max(0, min(63, round(value / 255 * 63)))
    return round(step * 255 / 63)


def ramp(anchors: list[Rgb], count: int) -> list[Rgb]:
    """Piecewise-linear interpolation through anchors, quantised to 6-bit."""
    if count == 1:
        return [tuple(quantise6(c) for c in anchors[0])]  # type: ignore[return-value]

    out: list[Rgb] = []
    segments = len(anchors) - 1
    for index in range(count):
        position = index / (count - 1) * segments
        segment = min(int(position), segments - 1)
        blend = position - segment
        start, end = anchors[segment], anchors[segment + 1]
        out.append(
            tuple(quantise6(start[channel] + (end[channel] - start[channel]) * blend) for channel in range(3))
        )  # type: ignore[arg-type]
    return out


# Family anchors: dark end cooler and more saturated, light end warmer and
# chalkier. That drift is what makes a ramp read as light falling on a
# material rather than as a brightness slider.
FAMILIES: list[tuple[str, int, list[Rgb]]] = [
    ("void", 1, [(0, 0, 0)]),
    # -- earth, the bulk of the town -------------------------------------
    ("mud", 20, [(18, 13, 10), (58, 41, 28), (104, 78, 52), (156, 126, 88)]),
    ("umber", 16, [(12, 9, 8), (45, 32, 24), (86, 63, 44), (128, 100, 72)]),
    ("ochre", 20, [(38, 24, 10), (96, 66, 26), (158, 118, 54), (214, 176, 106)]),
    ("dust", 20, [(28, 25, 22), (74, 68, 60), (128, 120, 106), (192, 184, 166)]),
    # -- timber ----------------------------------------------------------
    ("pine_weathered", 20, [(24, 22, 20), (66, 60, 54), (112, 104, 94), (172, 164, 150)]),
    ("pine_fresh", 16, [(40, 26, 15), (94, 64, 36), (150, 110, 68), (206, 168, 118)]),
    # -- vegetation ------------------------------------------------------
    ("sage", 20, [(22, 26, 20), (58, 68, 50), (100, 112, 84), (156, 166, 132)]),
    ("pine_green", 12, [(10, 16, 12), (28, 44, 32), (54, 76, 54), (86, 112, 80)]),
    # -- air -------------------------------------------------------------
    ("sky", 20, [(48, 52, 62), (92, 104, 120), (140, 156, 174), (196, 208, 220)]),
    ("dusk", 12, [(60, 44, 44), (118, 88, 72), (176, 140, 106), (224, 196, 156)]),
    # -- neutrals --------------------------------------------------------
    ("grey", 16, [(16, 16, 18), (60, 60, 64), (116, 116, 120), (180, 180, 184)]),
    ("bone", 12, [(96, 88, 76), (146, 136, 120), (194, 184, 166), (238, 232, 216)]),
    # -- accents. Small, saturated, and rationed on purpose: the town is
    #    mud and the paint is the joke, so paint has to be scarce. --------
    ("accent_red", 8, [(46, 14, 12), (110, 30, 24), (168, 52, 40), (214, 96, 74)]),
    ("accent_rust", 8, [(52, 22, 8), (118, 56, 18), (176, 92, 34), (222, 138, 66)]),
    ("accent_gold", 8, [(58, 42, 8), (128, 98, 20), (188, 152, 42), (238, 206, 96)]),
    ("accent_teal", 8, [(10, 34, 34), (24, 74, 74), (44, 116, 112), (86, 164, 156)]),
    ("accent_indigo", 8, [(18, 20, 46), (40, 46, 96), (70, 80, 148), (116, 128, 196)]),
]

# Interface chrome. Kept out of the art families so the panel never drifts
# when a background family is retuned, and named so no .ts file has to
# hard-code an index.
UI_ROLES: list[tuple[str, Rgb]] = [
    ("overlayBg", (0, 0, 0)),
    ("panelBg", (34, 28, 22)),
    ("buttonBg", (62, 51, 38)),
    ("buttonBgActive", (110, 88, 58)),
    ("outline", (20, 16, 12)),
    ("inkDim", (128, 112, 88)),
    ("ink", (188, 172, 142)),
    ("inkBright", (238, 232, 216)),
]


def build() -> dict:
    colours: list[str] = []
    families: dict[str, dict] = {}

    for name, count, anchors in FAMILIES:
        start = len(colours)
        for rgb in ramp(anchors, count):
            colours.append("#%02x%02x%02x" % rgb)
        families[name] = {"start": start, "count": count}

    roles: dict[str, int] = {}
    for name, rgb in UI_ROLES:
        roles[name] = len(colours)
        colours.append("#%02x%02x%02x" % tuple(quantise6(c) for c in rgb))

    # Pad any remainder with pure black so the table is exactly 256 long.
    reserved_from = len(colours)
    while len(colours) < 256:
        colours.append("#000000")

    return {
        "schema": 1,
        "id": "consolation-256",
        "locked": True,
        "note": (
            "LOCKED. 256 colours, 6-bit-per-channel VGA. Every asset indexes into this table. "
            "Do not add, remove, reorder or retune an entry -- doc 11 step 1."
        ),
        "channelBits": 6,
        "families": families,
        "roles": roles,
        "reserved": {"start": reserved_from, "count": 256 - reserved_from},
        "colours": colours,
    }


if __name__ == "__main__":
    palette = build()
    assert len(palette["colours"]) == 256, len(palette["colours"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(palette, indent=2) + "\n")
    used = 256 - palette["reserved"]["count"]
    print(f"wrote {OUT.relative_to(ROOT)}: 256 entries, {used} defined, {palette['reserved']['count']} reserved")
    for name, span in palette["families"].items():
        print(f"  {name:16s} {span['start']:3d}..{span['start'] + span['count'] - 1:3d}  ({span['count']})")
