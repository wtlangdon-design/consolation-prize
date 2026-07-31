"""Errata 30f step 0 — all eleven Act I interior identities, proposed at once.

WHY THIS IS A PICTURE. Errata 17b's rule is that no two adjacent-in-play
rooms share a material identity, and errata 23 adds the proportions each
identity is spent in. Neither can be checked by reading a table of adjectives:
"pale institutional wood" and "scrubbed bone-white" are different sentences
and very nearly the same colour. Eleven rooms assigned one at a time is how
room nine discovers its two neighbours have taken both plausible answers,
which is exactly what 30f moves this pass in front of step 1 to prevent.

So each room is a strip of its palette script at the proportions errata 23
declares -- dominant field, structural shadow, secondary local colour,
narrative accent -- and the strips are ordered so that rooms ADJACENT IN PLAY
sit next to each other. If two neighbours look alike here they will look alike
in the game.

NOTHING HERE IS COMPOSED. This is a colour decision taken before any room is
blocked out, which is the whole point of it being step 0.
"""

from __future__ import annotations

from pathlib import Path

from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS
from title_screen import game_font

ROOT = Path(__file__).resolve().parents[2]

#: Errata 23's palette script, as fractions of the strip.
ROLES = (("dominant", 0.62), ("shadow", 0.20), ("secondary", 0.12), ("accent", 0.06))

#: room number, name, four families with their ramp positions, and the
#: adjacency group. Rooms in the same group are seen back to back.
PLAN = [
    (2, "MAIN STREET", "set", [("mud", 0.45), ("umber", 0.22), ("pine_weathered", 0.55), ("accent_gold", 0.7)], "street"),
    (3, "THE NUGGET", "set", [("umber", 0.5), ("mud", 0.25), ("ochre", 0.6), ("accent_gold", 0.75)], "nugget"),
    (4, "NUGGET BACK ROOM", "new", [("pine_weathered", 0.42), ("umber", 0.25), ("grey", 0.5), ("accent_gold", 0.6)], "nugget"),
    (5, "ASSAY OFFICE", "set", [("grey", 0.55), ("dusk", 0.28), ("bone", 0.7), ("accent_teal", 0.5)], "assay"),
    (6, "ASSAY RECORDS", "new", [("umber", 0.65), ("mud", 0.25), ("bone", 0.72), ("accent_rust", 0.55)], "assay"),
    (0, "THE MAP", "move", [("grey", 0.82), ("umber", 0.3), ("grey", 0.6), ("umber", 0.5)], "map"),
    (7, "CLAIMS REGISTRAR", "17b", [("pine_weathered", 0.7), ("pine_weathered", 0.3), ("bone", 0.85), ("accent_rust", 0.5)], "map"),
    (13, "THE UNDERTAKER'S", "17b", [("bone", 0.85), ("dust", 0.45), ("pine_fresh", 0.8), ("bone", 0.6)], "map"),
    (15, "LIVERY STABLE", "17b", [("ochre", 0.42), ("umber", 0.22), ("mud", 0.42), ("accent_rust", 0.5)], "map"),
    (16, "OZYMANDIA'S TENT", "17b", [("accent_indigo", 0.5), ("accent_indigo", 0.25), ("accent_teal", 0.55), ("accent_gold", 0.85)], "map"),
    (10, "IMPROVEMENT CO.", "new", [("pine_fresh", 0.85), ("dust", 0.4), ("bone", 0.85), ("accent_gold", 0.85)], "company"),
    (11, "FANSHAWE'S OFFICE", "17b", [("accent_red", 0.3), ("void", 0.4), ("umber", 0.45), ("accent_gold", 0.85)], "company"),
    (12, "MERCANTILE", "17b", [("ochre", 0.55), ("umber", 0.28), ("accent_teal", 0.5), ("accent_red", 0.55)], "street"),
    (18, "HOTEL LOBBY", "30d", [("sky", 0.45), ("accent_indigo", 0.3), ("ochre", 0.4), ("accent_gold", 0.72)], "hotel"),
    (19, "THAD'S ROOM", "17b", [("dust", 0.55), ("dust", 0.28), ("bone", 0.8), ("grey", 0.6)], "hotel"),
]

WIDTH = 320
ROW = 13
LABEL_W = 158
TOP = 12


def main() -> None:
    palette = Palette.load()
    height = TOP + ROW * len(PLAN) + 6
    canvas = IndexedCanvas(WIDTH, height, palette.role("panelBg"))
    grey = palette.family("grey")
    bone = palette.family("bone")

    groups = {}
    for _, _, _, _, group in PLAN:
        groups.setdefault(group, len(groups))

    for index, (number, name, source, families, group) in enumerate(PLAN):
        y = TOP + index * ROW

        # A bar down the left edge joining rooms that are adjacent in play,
        # so a shared identity between neighbours is visible as two similar
        # strips inside one bracket.
        canvas.rect(0, y, 2, ROW - 1, grey.frac(0.3 + 0.12 * (groups[group] % 4)))

        strip_x = LABEL_W
        strip_w = WIDTH - LABEL_W - 4
        cursor = strip_x
        for (family, position), (_, share) in zip(families, ROLES):
            ramp = palette.family(family)
            width = int(strip_w * share)
            canvas.rect(cursor, y, width, ROW - 2, ramp.frac(position))
            cursor += width
        canvas.rect(cursor, y, strip_x + strip_w - cursor, ROW - 2,
                    palette.family(families[-1][0]).frac(families[-1][1]))

        # Composed rooms are marked, because they are constraints on the rest
        # rather than proposals: their identity is already on disk.
        # Room number, name, and where the identity comes from. Drawn in the
        # game's own 5x7 face, because that is the size these decisions are
        # actually looked at in.
        game_font(canvas, f"{number}", 6, y + 2, grey, 0.72)
        game_font(canvas, name, 20, y + 2, bone, 0.88 if source == "set" else 0.66)
        game_font(canvas, source.upper(), LABEL_W - 27, y + 2, grey,
                  0.85 if source == "set" else 0.55)

    canvas.save(RENDERS / "interior-identity-plan.png", palette)
    canvas.save(RENDERS / "interior-identity-plan@4x.png", palette, scale=4)
    print(f"wrote renders/interior-identity-plan@4x.png ({len(PLAN)} rooms)")


if __name__ == "__main__":
    main()
