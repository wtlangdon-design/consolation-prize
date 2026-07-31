"""Room 5 — Assay Office, front. The small-room test, at 320x144.

Room 3's box has a 234px back wall. This one has 128 -- barely half -- and
that is the point: the perspective machinery was tuned on a wide room and
was unproven at this width before Act I depended on it. A narrow back wall
means the two side walls take almost two thirds of the frame, so the whole
picture now rests on the receding planes rather than on the flat one.

Ruling 17b identity: grey, bone, glass and brass. Cold precision. Not one
warm family appears anywhere in this file, which is the hard guarantee that
it cannot read as the Nugget rearranged -- but the other half of the
separation is order. Every vial is the same height at the same spacing,
every ledger is squared. The Nugget is a room where things were put down;
this is a room where things were put away.

Ruling 17c was run BEFORE any of this was composed, in surface_plan.py. It
said the counter top, the balance dome, the ledger stack and the window card
all land above 150 and that Thad's face fails against every one of them by
23 to 75. So this is a coat room, and the composition is built knowing that:
the dome is placed where no head reaches it.
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
from surface_plan import PlannedSurface, audit_plan, thad_anchors

ROOT = Path(__file__).resolve().parents[2]
OUT = RENDERS

WIDTH, HEIGHT = 320, 144
SEED = 18580617

#: Half the Nugget's back wall. The small-room test.
BOX = Box(
    width=WIDTH, height=HEIGHT,
    back_left=96, back_right=224, back_top=18, back_bottom=78,
)

#: A tall window on the right-hand wall. Cold north light, drawn from the
#: sky family rather than bone -- an office that measures things for a
#: living does not get the Nugget's amber.
WINDOW = (250, 34, 22, 34)

#: The best-lit interior in Consolation, and that is a design point rather
#: than a lighting preference: you cannot judge ore colour in gloom, so an
#: assayer lights her office. It is the one room in the game where you can
#: see, run by the one person who deals in facts.
AMBIENT = 1.12


def plan() -> list[PlannedSurface]:
    """The room as a list of intended surfaces, for the 17c pre-check."""
    return [
        PlannedSurface("back wall", "grey", 0.34, AMBIENT),
        PlannedSurface("side walls", "grey", 0.26, AMBIENT * 0.95),
        PlannedSurface("plank floor", "bone", 0.30, AMBIENT * 0.92),
        PlannedSurface("counter top", "bone", 0.62, AMBIENT * 1.10),
        PlannedSurface("counter front", "grey", 0.30, AMBIENT),
        PlannedSurface("shelf bank", "grey", 0.22, AMBIENT * 0.95),
        PlannedSurface("vial rank", "sky", 0.55, AMBIENT),
        # No head reaches the dome: it stands on the counter top, which puts
        # it above a near actor's head and behind a far actor's.
        PlannedSurface("balance dome", "bone", 0.92, AMBIENT * 1.25, behind_head=False),
        PlannedSurface("ledger stack", "bone", 0.55, AMBIENT, behind_head=False),
        PlannedSurface("stove, iron", "grey", 0.14, AMBIENT),
        PlannedSurface("brass fittings", "accent_gold", 0.50, AMBIENT * 1.1),
        PlannedSurface("window card", "bone", 0.90, AMBIENT * 1.15, behind_head=False),
    ]


def compose() -> tuple[IndexedCanvas, Palette, LightField]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))

    grey = palette.family("grey")
    bone = palette.family("bone")
    glass = palette.family("sky")
    brass = palette.family("accent_gold")
    ember = palette.family("accent_rust")
    ochre = palette.family("ochre")
    pine = palette.family("pine_weathered")

    # -- the shell ---------------------------------------------------------
    #
    # pine_weathered is the right family HERE for exactly the reason it was
    # wrong in the Nugget: saturation 0.17 reads cold, and cold is the brief.
    # Ruling 17a cuts both ways.
    # Ceiling deliberately shallow. There is genuinely nothing up there, so
    # the answer is less of it rather than more detail in it.
    interior.ceiling(canvas, BOX, grey, rng, base=0.14, beams=4)
    interior.side_walls(canvas, BOX, grey, rng, base=0.26, board_spacing=18)
    interior.back_wall(canvas, BOX, grey, rng, base=0.34, board=9, wainscot=0.20)
    interior.plank_floor(canvas, BOX, bone, rng, base=0.30, boards=11)

    # -- the window, on the right-hand wall ---------------------------------
    win_x, win_y, win_w, win_h = WINDOW
    interior.interior_window(canvas, win_x, win_y, win_w, win_h, pine, glass,
                             panes=(2, 3), base=0.30)
    # Doc 05: THE WINDOW SIGN. Blank, like every sign in this game.
    furniture.pinned_card(canvas, palette, win_x - 14, win_y + 8, 10, 13, bone, rng)

    # -- the counter, across the middle distance ----------------------------
    counter_y = 90
    # Counter offset left and the grille well off centre. Dead-centre
    # counter with mirrored shelves either side reads as mechanical, which
    # is a different thing from precise -- symmetry is a machine, and this
    # room is a person who is very good at her job.
    furniture.service_counter(canvas, palette, 48, counter_y, 190, 26,
                              bone, grey, brass, rng, window=(186, 28))

    # -- behind the counter: shelves of vials, in rank ----------------------
    # Unequal banks at unequal heights -- one tall case of four ranks and one
    # short of two, not a mirrored pair.
    furniture.vial_shelves(canvas, palette, BOX.back_left + 2, BOX.back_top + 6,
                           74, 52, grey, glass, ochre, rng, ranks=4)
    furniture.vial_shelves(canvas, palette, BOX.back_left + 82, BOX.back_top + 22,
                           40, 34, grey, glass, ochre, rng, ranks=2)

    # -- on the counter -----------------------------------------------------
    # The dome sits on the counter top: above a near actor's head, behind a
    # far actor's. That placement is the 17c pre-check's finding made
    # geometric rather than left to chance.
    furniture.balance_under_dome(canvas, palette, 76, counter_y - 22, 24, 23,
                                 bone, brass, grey)
    furniture.ledger_stack(canvas, palette, 132, counter_y - 1, 22, 4, grey, bone)
    furniture.ledger_stack(canvas, palette, 52, counter_y - 1, 16, 2, grey, bone)

    # HER PEN, in its stand, nib down. Doc 25 writes it, so ruling 19b makes
    # it exist -- a LOOK line describing a pen in a room with no pen is the
    # contradiction that ruling is about. Six pixels, on the counter top,
    # between the ledgers where a right-handed person would reach it.
    global PEN_RECT
    PEN_RECT = (120, counter_y - 8, 8, 9)
    canvas.rect(122, counter_y - 3, 4, 3, brass.frac(0.30))          # the stand
    canvas.hline(121, counter_y - 4, 6, brass.frac(0.46))
    canvas.vline(124, counter_y - 8, 5, grey.frac(0.52))             # the shaft
    canvas.put(124, counter_y - 8, bone.frac(0.80))                  # the nib, up

    # THE CERTIFICATE. Framed, on the back wall left of the shelves, high --
    # where a thing nobody reads any more gets hung. The word on it is drawn
    # by nothing: every sign in this game is blank and the engine has the
    # words, which is also why "acting" can stay a LOOK line and not a
    # legibility problem.
    global CERTIFICATE_RECT
    CERTIFICATE_RECT = (BOX.back_left - 22, 26, 18, 22)
    cert_x, cert_y, cert_w, cert_h = CERTIFICATE_RECT
    canvas.rect(cert_x, cert_y, cert_w, cert_h, grey.frac(0.30))          # the frame
    canvas.outline(cert_x, cert_y, cert_w, cert_h, grey.frac(0.14))
    canvas.rect(cert_x + 2, cert_y + 2, cert_w - 4, cert_h - 4, bone.frac(0.62))
    # Ruled, not lettered. Every sign in this game is blank and the engine
    # holds the words -- which is also why "the word acting has been there
    # nine years" can be a LOOK line rather than a legibility problem.
    for row in range(4, cert_h - 5, 3):
        canvas.hline(cert_x + 4, cert_y + row, cert_w - 8, bone.frac(0.40))
    canvas.rect(cert_x + 4, cert_y + cert_h - 7, 4, 3, grey.frac(0.40))   # the seal

    # -- the loose floorboard -----------------------------------------------
    # Doc 05: "A floorboard. It sits a little proud of the others." Winnie's
    # second ledger is under it and Act II turns on it, so it exists in the
    # art and is a registered hotspot -- but it is two pixels of highlight,
    # findable and not advertised.
    global FLOORBOARD_RECT
    FLOORBOARD_RECT = (196, 126, 42, 6)
    furniture.proud_floorboard(canvas, palette, 196, 128, 42, bone)

    # -- the stove, cold iron -----------------------------------------------
    stove_door = furniture.pot_stove(canvas, palette, 30, 96, 15, 24, grey, ember,
                                     flue_top=int(BOX.ceiling_y_at(30)))

    field = build_light(stove_door)
    field.apply(canvas, palette)

    # Sources are objects, not lit surfaces.
    canvas.rect(win_x, win_y, win_w, win_h, glass.at(glass.count - 1))
    for row in range(1, 3):
        canvas.hline(win_x, win_y + row * win_h // 3, win_w, pine.frac(0.26))
    canvas.vline(win_x + win_w // 2, win_y, win_h, pine.frac(0.26))

    for shaft in shafts():
        lighting.dust_motes(canvas, palette, shaft, rng, density=0.35)

    return canvas, palette, field


def shafts() -> list[Shaft]:
    """Cold light from the right, falling left and down across the floor."""
    win_x, win_y, win_w, win_h = WINDOW
    return [
        Shaft(x=win_x, y=win_y + 4, width=11, length=180,
              dx=-0.80, dy=0.60, intensity=0.62, spread=0.12),
    ]


def build_light(stove_door: tuple[int, int]) -> LightField:
    """Daylight, and not much else.

    The Nugget needed ambient 0.80 because it is lit by candles. This room
    has a big window and is open for business, so it starts near 1.0 -- the
    difference in ambient between the two is as much of the identity
    separation as the palette is.
    """
    field = LightField(WIDTH, HEIGHT, ambient=AMBIENT)
    for shaft in shafts():
        field.add_shaft(shaft)
    win_x, win_y, win_w, win_h = WINDOW
    field.add_lamp(Lamp(x=win_x, y=win_y + win_h // 2, radius=110, intensity=0.50, squash=1.1))
    field.add_lamp(Lamp(x=stove_door[0], y=stove_door[1], radius=22, intensity=0.26, squash=1.2))
    # The counter is the working surface and gets the light that matters.
    # Two working lamps over the counter -- this is a bench you read colour
    # at, so it gets more light than anything else in the building.
    field.add_lamp(Lamp(x=120, y=86, radius=96, intensity=0.30, squash=1.9))
    field.add_lamp(Lamp(x=214, y=86, radius=96, intensity=0.26, squash=1.9))
    # And the vial case, lit deliberately so the work in it is legible.
    field.add_lamp(Lamp(x=160, y=48, radius=104, intensity=0.30, squash=1.4))
    field.scale_below(BOX.back_bottom, 0.98)
    return field


def main() -> None:
    palette = Palette.load()
    coat, face = thad_anchors(palette)
    failures = audit_plan(palette, "ROOM 5 -- ASSAY OFFICE (plan, ruling 17c)",
                          plan(), coat, face)
    print()
    canvas, _, _ = compose()
    OUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT / "room-05-assay-office.png", palette)
    canvas.save(OUT / "room-05-assay-office@4x.png", palette, scale=4)
    print(f"wrote {(OUT / 'room-05-assay@4x.png').relative_to(ROOT)}")
    print(f"colours used: {len(canvas.used_indices())}")
    print(f"back wall {BOX.back_right - BOX.back_left}px wide "
          f"(the Nugget's is 234) -- side walls take "
          f"{WIDTH - (BOX.back_right - BOX.back_left)}px of the frame")
    if failures:
        raise SystemExit(f"plan failed on {failures} surface(s)")


if __name__ == "__main__":
    main()
