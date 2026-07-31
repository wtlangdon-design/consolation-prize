"""The title screen. Its own composition, no longer Room 29 with text on it.

Room 29 and this share a viewpoint and a palette and nothing else. Room 29
is a place Thad stands in Act IV, so it stays wide and empty and mostly
landscape. This is a poster, and a poster has one job: say what the game is
before anyone has pressed anything.

What the game is: a town PERFORMING prosperity. So Consolation is pushed
much larger and much nearer than Room 29 has it -- near enough that the
false fronts read as flat boards standing a storey above the sheds behind
them, near enough for lit windows and a worn street. At Room 29's distance
that is an indistinct smudge and the joke of the shot is lost entirely.

Layout, in thirds:
  top     -- CONSOLATION PRIZE, the second largest thing in the frame
  middle  -- the town, performing
  bottom  -- the menu, in the game font, deliberately unremarkable

MUSIC: there is none. The score does not exist, and errata invariant 5 makes
its detuning the emotional arc of the whole game, so a placeholder would be
actively misleading rather than merely absent. MUSIC_CUE is the hook.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import title_face
from canvas import IndexedCanvas
from components import distant_hills
from dither import BAYER2, BAYER4, dither_pixel
from palette import Palette, Ramp
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]

WIDTH, HEIGHT = 320, 144
SEED = 18581225

MUSIC_CUE = "title.theme"

#: The title gets the top third, as instructed.
TITLE_TOP = 8
#: The town sits across the middle, near enough to read.
STREET_Y = 104
#: The town ends here, and the right third of the frame is sky and ground.
#:
#: At 250 the row kept going until the last false front was under the menu
#: column, which starts at x253 -- so the menu read as having been dropped on
#: top of a building rather than placed beside a town. The fix is the town's,
#: not the menu's: two buildings come off the end at full size. Scaling the
#: row down instead would have kept the same number of buildings and made
#: every one of them wrong, and this viewpoint exists to show a false front
#: at a size where you can see it is false.
TOWN_LEFT, TOWN_RIGHT = 16, 208
HORIZON = 40

#: Menu down the right, clear of the town.
#:
#: Centred and low, it sat squarely on the buildings and needed a dark plate
#: under every row to stay readable -- which punched a black slab through the
#: middle of the picture. Moved right, it clears the last building and the
#: plates can be much lighter, because there is less behind them to fight.
#: The lettering above is untouched.
MENU_RIGHT = 306
MENU_TOP = 88
MENU_ROW = 11

_MANIFEST = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
_FONT = json.loads((ROOT / _MANIFEST["font"]).read_text(encoding="utf-8"))


def game_font(canvas: IndexedCanvas, text: str, x: int, y: int, ramp: Ramp, tone: float) -> int:
    """The 5x7 game font, read from the same JSON the engine reads."""
    glyphs = _FONT["glyphs"]
    per_glyph = _FONT.get("advances", {})
    default = _FONT.get("advance", 6)
    cursor = x
    for character in text:
        if character == " ":
            cursor += _FONT.get("spaceAdvance", default)
            continue
        rows = glyphs.get(character) or glyphs.get(character.upper())
        if rows is None:
            cursor += default
            continue
        for row, bits in enumerate(rows):
            for column, mark in enumerate(bits):
                if mark == "#":
                    canvas.put(cursor + column, y + row, ramp.frac(tone))
        cursor += per_glyph.get(character, default)
    return cursor - x


def landscape(canvas: IndexedCanvas, palette: Palette, rng) -> None:
    """Same viewpoint and palette as Room 29, composed nearer."""
    sky = palette.family("dusk")
    far = palette.family("sky")
    sage = palette.family("sage")
    mud = palette.family("mud")

    for y in range(HORIZON + 6):
        position = 1.0 - (y / max(1, HORIZON + 6))
        for x in range(WIDTH):
            dither_pixel(canvas, x, y, sky, max(0.04, 0.26 + 0.58 * position), BAYER4)

    distant_hills(canvas, 0, HORIZON - 14, WIDTH, 18, far, rng, layers=2, amplitude=5)
    distant_hills(canvas, 0, HORIZON - 4, WIDTH, 20, sage, rng, layers=3, amplitude=8)

    # The valley floor the town stands on, and the slope below it running
    # down out of frame toward the viewer.
    for y in range(HORIZON + 4, HEIGHT):
        walk = (y - HORIZON - 4) / max(1, HEIGHT - HORIZON - 4)
        ramp, tone = (sage, 0.26 - 0.06 * walk) if walk < 0.28 else (mud, 0.30 + 0.26 * walk)
        for x in range(WIDTH):
            dither_pixel(canvas, x, y, ramp, max(0.04, tone), BAYER2)


def town(canvas: IndexedCanvas, palette: Palette, rng) -> None:
    """Consolation, near enough to see it performing.

    Each building is a flat false front with a shallow shed behind it, and at
    this distance the relationship is legible: the parapet stands clear above
    the roof it is hiding, and you can see the gap. Half the windows are lit,
    which is the performance -- a town this size at this hour should be dark.
    """
    bone = palette.family("bone")
    umber = palette.family("umber")
    ochre = palette.family("ochre")
    mud = palette.family("mud")
    grey = palette.family("grey")

    # The street: worn, rutted, and paler than the ground either side.
    canvas.rect(TOWN_LEFT - 8, STREET_Y, TOWN_RIGHT - TOWN_LEFT + 16, 14, mud.frac(0.50))
    for _ in range(60):
        x = rng.randrange(TOWN_LEFT - 6, TOWN_RIGHT + 6)
        y = STREET_Y + rng.randrange(0, 14)
        canvas.hline(x, y, 2 + rng.randrange(0, 7), mud.frac(0.36 + 0.20 * rng.random()))

    x = TOWN_LEFT
    while True:
        width = 22 + rng.randrange(0, 12)
        parapet = 30 + rng.randrange(0, 12)
        shed = parapet - 14 - rng.randrange(0, 5)
        top = STREET_Y - parapet
        # The row ends on a WHOLE building. Testing x alone let the last one
        # start just inside the edge and finish thirty pixels past it, which
        # is how the town got under the menu.
        if x + width > TOWN_RIGHT:
            break

        # The shed behind: lower, darker, and WIDER than the board in front
        # of it, so it protrudes at both sides.
        #
        # Drawn narrower than the parapet -- the first attempt -- it was
        # entirely hidden behind it and the buildings read as flat boards
        # with nothing at all behind them, which loses the one thing this
        # viewpoint exists to show. You have to be able to see the building
        # the sign is lying about.
        back_top = STREET_Y - shed
        canvas.rect(x - 4, back_top, width + 8, shed, umber.frac(0.15))
        canvas.hline(x - 4, back_top, width + 8, umber.frac(0.34))     # roof edge
        canvas.hline(x - 4, back_top + 1, width + 8, umber.frac(0.22))
        for rib in range(x - 2, x + width + 6, 5):
            canvas.vline(rib, back_top + 2, shed - 2, umber.frac(0.10))

        # The false front: flat, pale, facing us square, catching the last
        # of the light. This is the board the town is hiding behind.
        canvas.rect(x, top, width, parapet, bone.frac(0.30 + 0.14 * rng.random()))
        canvas.hline(x, top, width, bone.frac(0.84))                  # lit cap
        canvas.hline(x, top + 1, width, bone.frac(0.56))
        canvas.vline(x, top, parapet, bone.frac(0.62))                # lit edge
        canvas.vline(x + width - 1, top, parapet, umber.frac(0.10))   # shade edge
        # The shadow the parapet throws onto the shed roof behind it. This
        # single line is what makes the board read as standing IN FRONT OF
        # something rather than as the front wall of it.
        canvas.hline(x + 1, top + 2, width + 4, umber.frac(0.05))

        # A cornice band, and blank signage. No lettering anywhere: doc 05
        # holds the words and the examine layer delivers them.
        canvas.hline(x + 1, top + 6, width - 2, umber.frac(0.14))
        canvas.rect(x + 3, top + 9, width - 6, 5, bone.frac(0.20))

        # Windows. About half lit, which at this hour is the performance.
        rows = 2
        for row in range(rows):
            wy = top + 18 + row * 9
            if wy + 5 > STREET_Y - 2:
                continue
            for wx in range(x + 3, x + width - 5, 8):
                lit = rng.random() < 0.5
                canvas.rect(wx, wy, 5, 6, ochre.frac(0.62) if lit else grey.frac(0.14))
                if lit:
                    canvas.rect(wx + 1, wy + 1, 3, 4, ochre.frac(0.86))
                    # The light it throws down onto the street below.
                    canvas.put(wx + 2, STREET_Y + 1, ochre.frac(0.34))
                canvas.hline(wx - 1, wy - 1, 7, umber.frac(0.12))

        # A door at street level, and the boardwalk in front of it.
        door_x = x + width // 2 - 3
        canvas.rect(door_x, STREET_Y - 9, 6, 9, umber.frac(0.10))
        canvas.hline(x, STREET_Y - 1, width, umber.frac(0.22))

        x += width + 3 + rng.randrange(0, 4)

    # The far side of the street: rooflines only, seen from behind.
    x = TOWN_LEFT + 10
    while x < TOWN_RIGHT - 10:
        width = 18 + rng.randrange(0, 10)
        depth = 7 + rng.randrange(0, 4)
        canvas.rect(x, STREET_Y + 13, width, depth, umber.frac(0.22))
        canvas.hline(x, STREET_Y + 13, width, umber.frac(0.40))
        canvas.hline(x, STREET_Y + 14, width, umber.frac(0.28))
        x += width + 3 + rng.randrange(0, 4)


def compose(has_save: bool = False) -> tuple[IndexedCanvas, Palette, dict]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))

    landscape(canvas, palette, rng)
    town(canvas, palette, rng)

    bone = palette.family("bone")
    umber = palette.family("umber")
    grey = palette.family("grey")

    menu = json.loads((ROOT / "content" / "ui" / "title.json").read_text(encoding="utf-8"))

    # A band behind the title, stepped down its own ramps, so the letters
    # never have to fight the sky's dither for an edge.
    band_top, band_height = TITLE_TOP - 5, title_face.CELL_H * 2 + 14
    for y in range(band_top, band_top + band_height):
        for x in range(WIDTH):
            canvas.put(x, y, palette.darken(canvas.get(x, y), 2))

    lines = menu["title"]["lines"]
    for index, line in enumerate(lines):
        width = title_face.measure(line)
        title_face.draw(canvas, line, (WIDTH - width) // 2,
                        TITLE_TOP + index * (title_face.CELL_H + 4), bone, umber)

    # The menu: game font, centred, bottom. Deliberately unremarkable -- it
    # is how you start, not what the game is.
    hitboxes = []
    for index, item in enumerate(menu["menu"]["items"]):
        y = MENU_TOP + index * MENU_ROW
        if y + 7 > HEIGHT:
            break
        enabled = item["id"] != "continue" or has_save
        label = item["label"]
        width = sum(_FONT.get("advances", {}).get(c, _FONT.get("advance", 6)) for c in label)
        left = MENU_RIGHT - width
        for offset in range(-2, 9):
            for x in range(left - 5, MENU_RIGHT + 5):
                canvas.put(x, y + offset, palette.darken(canvas.get(x, y + offset), 1))
        hitboxes.append({"id": item["id"], "label": label,
                         "rect": [left - 5, y - 2, width + 10, MENU_ROW], "enabled": enabled})
        game_font(canvas, label, left, y, bone if enabled else grey,
                  0.94 if enabled else 0.46)

    return canvas, palette, {"items": hitboxes, "music": MUSIC_CUE}


def main() -> None:
    canvas, palette, meta = compose(has_save=False)
    RENDERS.mkdir(parents=True, exist_ok=True)
    canvas.save(RENDERS / "title-screen.png", palette)
    canvas.save(RENDERS / "title-screen@4x.png", palette, scale=4)
    native = ROOT / "art" / "backgrounds" / "title-screen.png"
    canvas.save(native, palette)
    print("wrote renders/title-screen@4x.png")
    print(f"  colours used: {len(canvas.used_indices())}")
    print(f"  title cell {title_face.CELL_W}x{title_face.CELL_H}; "
          f'"CONSOLATION" measures {title_face.measure("CONSOLATION")}px of {WIDTH}')
    print(f"  menu: {', '.join(item['label'] for item in meta['items'])}")
    print(f"  MUSIC: none. Hook is '{meta['music']}' and nothing plays it.")


if __name__ == "__main__":
    main()
