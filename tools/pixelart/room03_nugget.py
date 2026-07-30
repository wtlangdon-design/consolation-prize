"""Room 3 — The Bountiful Nugget, composed at 320x144.

The proof that interiors work before eleven of them get built for Act I.

Composition follows the brief: mahogany bar running down the right, dirt
floor, brass chandelier hanging over it, upright piano against the left
wall, rough tables and chairs, staircase at the back, blank handbill by the
door, warm dusty shafts from a window at frame left, open floor downstage.

The order below is not arbitrary. Everything is drawn FLAT first -- every
material at its own authored tone, as if the room were evenly lit -- and the
lighting field is applied in one pass at the end. Lighting a component as it
is drawn is what makes an interior look like a collage of separately-lit
objects, and it is the mistake the exterior code would have led me into,
because out there the light really is the same everywhere.
"""

from __future__ import annotations

import random
from pathlib import Path

import furniture
import interior
import lighting
from canvas import IndexedCanvas
from interior import Box
from lighting import Lamp, LightField, Shaft
from palette import Palette
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]
OUT = RENDERS

WIDTH, HEIGHT = 320, 144
SEED = 18580411

#: The room as a perspective box. The back wall is placed so the floor gets
#: 62 rows -- enough for three depth zones with a 40px actor downstage.
BOX = Box(
    width=WIDTH, height=HEIGHT,
    back_left=44, back_right=278, back_top=26, back_bottom=82,
)

#: Frame left, high on the side wall. Everything warm in the room points
#: back to this and to the chandelier.
WINDOW = (10, 34, 26, 24)


def compose() -> tuple[IndexedCanvas, Palette, LightField]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))

    pine = palette.family("pine_weathered")
    fresh = palette.family("pine_fresh")
    umber = palette.family("umber")
    mud = palette.family("mud")
    ochre = palette.family("ochre")
    grey = palette.family("grey")
    bone = palette.family("bone")
    dusk = palette.family("dusk")
    brass = palette.family("accent_gold")
    ember = palette.family("accent_rust")
    glass = palette.family("sky")

    # -- the shell ---------------------------------------------------------
    #
    # Warm families throughout. The first pass built the shell out of
    # pine_weathered, which measures saturation 0.17 -- effectively grey --
    # and because the lighting pass only ever steps a colour along its OWN
    # ramp, warm light on cold timber stays cold. A candle cannot make grey
    # wood warm; it can only make it lighter grey. The temperature of the
    # room is decided by which family the wood is, not by the lamps.
    interior.ceiling(canvas, BOX, umber, rng, base=0.13, beams=5)
    interior.side_walls(canvas, BOX, umber, rng, base=0.44)
    interior.back_wall(canvas, BOX, fresh, rng, base=0.34, board=7, wainscot=0.18)
    interior.dirt_floor(canvas, BOX, mud, rng, grit=ochre, base=0.46)

    # -- openings ----------------------------------------------------------
    win_x, win_y, win_w, win_h = WINDOW
    interior.interior_window(canvas, win_x, win_y, win_w, win_h, pine, bone, panes=(2, 2))

    door_x, door_w = 60, 26
    door_y = BOX.back_bottom - 44
    interior.doorway(canvas, door_x, door_y, door_w, 44, pine, dusk, base=0.34)

    # Doc 05: the handbill is pinned by the door, and nobody will read it.
    #
    # It was previously drawn at (91,46) and the portrait at (96,36), so the
    # portrait covered half of it -- the Rules of the Assay, which carry the
    # thesis of the game and sit on this wall for fifteen hours, were partly
    # hidden behind a picture. Moved clear, enlarged, and given a dark ground
    # so it is the brightest thing on that stretch of wall.
    global HANDBILL_RECT
    HANDBILL_RECT = (90, 42, 12, 16)
    furniture.handbill(canvas, palette, *HANDBILL_RECT, bone, rng)

    # -- back wall furniture ------------------------------------------------
    furniture.staircase(canvas, palette, 166, BOX.back_top + 4, 56, BOX.back_bottom - BOX.back_top - 4,
                        fresh, rng, steps=9, rise_right=True)

    # The back room door. Doc 16 gives it an exit and three examine variants
    # each way, so it has to be visible: shut, behind the bar, and the only
    # door in the room that is not letting daylight in.
    BACK_DOOR = (232, BOX.back_bottom - 46, 26, 46)
    bd_x, bd_y, bd_w, bd_h = BACK_DOOR
    canvas.rect(bd_x - 2, bd_y - 2, bd_w + 4, bd_h + 2, fresh.frac(0.14))
    canvas.rect(bd_x, bd_y, bd_w, bd_h, fresh.frac(0.26))
    for plank in range(bd_x + 1, bd_x + bd_w, 5):
        canvas.vline(plank, bd_y, bd_h, fresh.frac(0.18))
    canvas.hline(bd_x - 2, bd_y - 2, bd_w + 4, fresh.frac(0.46))
    canvas.vline(bd_x - 1, bd_y - 1, bd_h + 1, fresh.frac(0.40))
    canvas.vline(bd_x + bd_w, bd_y - 1, bd_h + 1, fresh.frac(0.10))
    canvas.put(bd_x + bd_w - 4, bd_y + bd_h // 2, brass.frac(0.52))
    furniture.framed_portrait(canvas, palette, 128, 34, 14, 18, umber, dusk, rng)
    stove_x, stove_y = 106, BOX.back_bottom - 26
    stove_door = furniture.pot_stove(canvas, palette, stove_x, stove_y, 16, 26, grey, ember,
                                     flue_top=BOX.back_top)

    # -- the bar, running down the right ------------------------------------
    #
    # back_edge is 6, not 16. At 16 the counter climbed so steeply across its
    # own length that it stopped reading as a horizontal surface and became a
    # ramp walling off the corner of the room.
    furniture.back_bar(canvas, palette, 262, BOX.back_top + 8, 58, 44, fresh, dusk, brass, rng)
    bar_x, bar_w = 216, WIDTH - 216
    bar_y, bar_h = 90, 26
    furniture.bar_counter(canvas, palette, bar_x, bar_y, bar_w, bar_h, fresh, brass, rng, back_edge=6)
    furniture.glassware(canvas, palette, bar_x + 30, bar_y + 8, 4, glass, rng)
    furniture.spittoon(canvas, palette, bar_x - 16, HEIGHT - 16, 9, brass)

    # -- the piano, against the left wall ------------------------------------
    # Its foot sits ON the floor line at that depth, not floating above it.
    furniture.upright_piano(canvas, palette, 30, 68, 36, 34, fresh, bone, rng)

    # -- tables and chairs, midground, foreground left open ------------------
    for index, (tx, ty, tw) in enumerate(((100, 98, 28), (156, 90, 22), (76, 118, 34))):
        furniture.rough_table(canvas, palette, tx, ty, tw, 11 + (ty - 90) // 5, umber, rng)
        furniture.rough_chair(canvas, palette, tx - 6, ty - 3, 13, umber, facing=1,
                              askew=(1, -1, 2)[index])
        furniture.rough_chair(canvas, palette, tx + tw + 2, ty - 3, 13, umber, facing=-1,
                              askew=(-2, 1, -1)[index])
        # What the last people to sit here left on it.
        if index == 0:
            furniture.card_hand(canvas, palette, tx + 9, ty - 3, bone, rng)
            furniture.left_glass(canvas, palette, tx + 3, ty, glass, rng)
        elif index == 1:
            furniture.standing_bottle(canvas, palette, tx + 6, ty, glass, height=7)
            furniture.left_glass(canvas, palette, tx + 14, ty, glass, rng, drained=True)
        else:
            furniture.left_glass(canvas, palette, tx + 5, ty, glass, rng)
            furniture.left_glass(canvas, palette, tx + 9, ty, glass, rng, drained=True)

    # Coats and hats on the wall by the door -- the strongest evidence of
    # people available without drawing any.
    furniture.wall_hooks(canvas, palette, 128, 60, 3, fresh, rng, spacing=7)
    furniture.wall_hooks(canvas, palette, 48, 46, 2, fresh, rng, spacing=8)

    # -- the chandelier, over the dirt floor ---------------------------------
    candles, ring_y = furniture.chandelier(canvas, palette, 150, 50, 58, brass, ochre,
                                           arms=7, drop=22)

    field = build_light(candles, ring_y, stove_door)
    field.apply(canvas, palette)

    # After the lighting pass: sources are objects, not lit surfaces, so the
    # field must not be allowed to have dimmed them.
    for cx, cy in candles:
        lighting.lamp_core(canvas, palette, cx, cy, "accent_gold", radius=0)
    canvas.rect(win_x, win_y, win_w, win_h, bone.at(bone.count - 1))
    for col in range(1, 2):
        canvas.vline(win_x + col * win_w // 2, win_y, win_h, pine.frac(0.30))
    canvas.hline(win_x, win_y + win_h // 2, win_w, pine.frac(0.30))

    for shaft in shafts():
        lighting.dust_motes(canvas, palette, shaft, rng, density=0.6)

    return canvas, palette, field


def shafts() -> list[Shaft]:
    """Warm dusty light from the window at frame left, falling down-right."""
    win_x, win_y, win_w, win_h = WINDOW
    return [
        Shaft(x=win_x + win_w, y=win_y + 2, width=13, length=210,
              dx=0.84, dy=0.54, intensity=1.15, spread=0.16),
        Shaft(x=win_x + win_w, y=win_y + win_h - 5, width=10, length=175,
              dx=0.76, dy=0.65, intensity=0.92, spread=0.18),
    ]


def build_light(candles: list[tuple[int, int]], ring_y: int, stove_door: tuple[int, int]) -> LightField:
    """Ambient plus every source in the room.

    Ambient sits well below 1.0 because the room is genuinely dim -- an 1858
    saloon with two openings and some candles. Starting at 1.0 and only
    adding light gives a room that is evenly bright with brighter patches,
    which is a lit stage rather than an interior.
    """
    field = LightField(WIDTH, HEIGHT, ambient=0.80)

    for shaft in shafts():
        field.add_shaft(shaft)

    # The window itself spills onto the wall around it.
    win_x, win_y, win_w, win_h = WINDOW
    field.add_lamp(Lamp(x=win_x + win_w // 2, y=win_y + win_h // 2, radius=44,
                        intensity=0.55, squash=1.0))

    # The chandelier: one broad pool from the fitting, plus each candle
    # close-in, so the brass reads lit from its own flames.
    field.add_lamp(Lamp(x=150, y=ring_y + 4, radius=104, intensity=0.58, squash=1.5))
    for cx, cy in candles:
        field.add_lamp(Lamp(x=cx, y=cy, radius=13, intensity=0.42, squash=1.0))

    # The stove door, low and warm.
    field.add_lamp(Lamp(x=stove_door[0], y=stove_door[1], radius=30, intensity=0.40, squash=1.2))

    # Lamps behind the bar -- doc 05 has men reading assay results off it.
    field.add_lamp(Lamp(x=268, y=80, radius=54, intensity=0.36, squash=1.6))

    # The floor is lit at a glancing angle and returns less of it.
    field.scale_below(BOX.back_bottom, 0.97)
    return field


def main() -> None:
    canvas, palette, _ = compose()
    OUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT / "room-03-nugget.png", palette)
    canvas.save(OUT / "room-03-nugget@4x.png", palette, scale=4)
    print(f"wrote {(OUT / 'room-03-nugget@4x.png').relative_to(ROOT)}")
    print(f"colours used: {len(canvas.used_indices())}")
    for index, (top, bottom) in enumerate(interior.floor_zone_rows(BOX)):
        print(f"  floor zone {index}: rows {top}..{bottom}")


if __name__ == "__main__":
    main()
