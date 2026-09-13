#!/usr/bin/env python3
"""
THE ENGINE-FIT COMPOSITION GUIDE. Zero image operations.

WHAT IT IS FOR. pref-replica-02 is the right room drawn too tall: its canonical
content spans 986 source rows and the engine can carry 691, because
PLAY_HEIGHT is fixed at 864 and the camera scrolls in X only. Four things fall
outside any legal band -- the chandelier, the landing, the landing man's
headroom and the spittoon -- and three of them are canonical hotspots.

So this guide does the arithmetic the generator cannot: it draws THE SAFE
GAMEPLAY BAND at 1536 x 691 on the 1536 x 1024 working canvas, and marks every
required feature's FULL BOUNDS inside it -- not its centre, its bounds. A
composition built to this guide fits by construction and needs no band search
afterwards.

THE BAND ARITHMETIC, from the engine and not from preference:

    PLAY_HEIGHT           864   engine/render/Screen.ts, fixed
    minimum room width   1920   the screen; there is no letterboxing
    source width         1536   the endpoint's widest
    rows that can reach  1536 * 864/1920 = 691
    band placed at       y 166 .. 857     (centred, 166 rows spare each side)
    room_y               (source_y - 166) * 864/691

AND THE HUMAN ENVELOPES ARE THE POINT OF THE EXERCISE. The landing failed last
time because it was drawn as a shelf rather than as somewhere a man stands, so
every future person is marked here at the size the room's own camera gives him.
The plate stays people-free; the envelopes exist so the FURNITURE is built for
actual humans.

    python3 tools/room03/geometry-guide.py
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'proofs/room-03/pref-replica'
SRC = 1536, 1024
BAND = dict(x=0, y=166, w=1536, h=691)
SCALE = 864 / BAND['h']                      # source row -> room row

# The room's camera, carried from R3-PREF because that is the picture Tyler
# likes and the corrected room should not need a third depth model.
EYE, K = 239.0, 0.8494


def sy(room_y):
    """Source row for a room row."""
    return BAND['y'] + room_y / SCALE


def box(room_rect):
    x0, y0, x1, y1 = room_rect
    return (x0 * SRC[0] / 1920, sy(y0), x1 * SRC[0] / 1920, sy(y1))


# ---- THE TARGET LAYOUT, in 1920x864 room coordinates -------------------------
#
# Horizontal relationships are pref-replica-02's and are NOT to move: the card
# table and the bar are the two things it got right. Only the VERTICAL spread
# is recomposed, and the whole of it now lives inside 864 rows.
FEATURES = {
    'CEILING BEAM':      (980, 8, 1560, 48),
    'THE LANDING':       (1240, 175, 1600, 262),
    'THE STAIRCASE':     (1210, 240, 1600, 480),
    'THE CHANDELIER':    (770, 25, 1060, 175),
    'FRONT DOORS  exit': (0, 230, 300, 800),
    'THE WINDOW':        (360, 120, 620, 400),
    'THE HANDBILL':      (300, 250, 355, 335),
    'THE PIANO':         (480, 270, 735, 600),
    'THE PORTRAIT':      (830, 145, 935, 265),
    'THE CARD TABLE':    (790, 395, 1105, 485),
    'CARD CHAIRS':       (700, 375, 1180, 700),
    'THE STOVE':         (1090, 250, 1200, 470),
    'BACK ROOM DOOR exit': (1205, 185, 1290, 450),
    'THE BAR':           (1250, 425, 1920, 730),
    'BACK BAR + MIRROR': (1480, 150, 1920, 425),
    'BAR STOOLS':        (1255, 520, 1790, 815),
    'THE SPITTOON':      (1140, 755, 1265, 855),
    'FOREGROUND DIRT':   (0, 700, 1920, 864),
}

# ---- WHERE PEOPLE WILL LATER STAND. Not drawn in the plate. ------------------
def man(x, ground, seated=False, drawn=None):
    """
    `drawn` overrides the camera for a figure who is NOT on the room's floor.

    THE LANDING MAN IS THE WHOLE REASON THIS PARAMETER EXISTS. The camera gives
    a man's height from the row his soles are on, and that is only true for
    someone standing on the ground plane. He is up a flight of stairs, so his
    size is set by his DISTANCE and not by his floor row, and feeding the
    landing's own row into k(y - EYE) produces a number with no meaning.

    R3-PREF settled it by authoring him at 168 px. This guide asks for 180 and
    a ceiling well clear of it, because the first draft of this very file put
    the landing floor at room y235 under a beam at y60 -- 175 px of headroom
    for a man the formula said was 203 -- and failed its own section 3 gate
    before a single operation was spent. A guide that cannot pass its own gate
    is not a guide.
    """
    h = drawn if drawn is not None else K * (ground - EYE)
    if seated:
        h *= 0.78
    w = 0.34 * h
    return (x - w / 2, ground - h, x + w / 2, ground)


PEOPLE = {
    'landing man':  man(1390, 262, drawn=180),
    'stove man':    man(1075, 600),
    'card_2 seat':  man(860, 600, seated=True),
    'card_3 seat':  man(1030, 600, seated=True),
    'card_1 seat':  man(790, 672, seated=True),
    'card_4 seat':  man(1105, 672, seated=True),
    'bar_1 stool':  man(1300, 690, seated=True),
    'bar_2 lean':   man(1400, 760),
    'bar_3 stand':  man(1620, 845),
    'THAD rear':    man(640, 640),
    'THAD mid':     man(880, 760),
    'THAD near':    man(400, 850),
    'DEKE reserved': man(560, 720),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    g = Image.new('RGB', SRC, (26, 24, 22))
    d = ImageDraw.Draw(g, 'RGBA')

    # OUTSIDE THE BAND IS OVERSCAN, NOT VOID, and the difference matters.
    # An instruction to leave a third of the canvas blank is one an image model
    # will not follow and should not: it would fight the composition. So the
    # strips are given a JOB that is safe to lose -- plain ceiling above, plain
    # dirt below -- and the band crop simply takes the middle. Anything drawn in
    # the strips is discarded, so nothing the game needs may live there.
    d.rectangle([0, 0, SRC[0], BAND['y']], fill=(58, 30, 16, 255))
    d.rectangle([0, BAND['y'] + BAND['h'], SRC[0], SRC[1]], fill=(58, 38, 20, 255))
    d.text((12, 12), 'OVERSCAN — PLAIN CEILING AND ROOF BEAMS ONLY. This strip is cropped away; '
                     'nothing the game needs may be here.', fill=(255, 200, 160))
    d.text((12, SRC[1] - 24), 'OVERSCAN — PLAIN DIRT FLOOR ONLY. This strip is cropped away; '
                              'nothing the game needs may be here.', fill=(255, 210, 170))
    d.rectangle([BAND['x'], BAND['y'], BAND['x'] + BAND['w'] - 1, BAND['y'] + BAND['h'] - 1],
                outline=(120, 255, 150, 255), width=4)
    d.text((14, BAND['y'] + 10),
           f'THE PLAYABLE BAND — {BAND["w"]} x {BAND["h"]} — THIS becomes the 1920 x 864 room. '
           f'EVERY numbered box below must be COMPLETE inside it.',
           fill=(150, 255, 180))

    # the floor line and the horizon, so the perspective is not guessed
    d.line([(0, sy(700)), (SRC[0], sy(700))], fill=(255, 210, 60, 150), width=2)
    d.text((14, sy(700) + 4), 'front of the furniture — open dirt below this line',
           fill=(255, 210, 60, 230))

    # NUMBERED, WITH THE KEY IN THE DEAD SPACE. The first draft wrote every
    # name on its own box and eighteen labels overlapped into noise across the
    # middle of the room -- the one part of the picture the generator has to
    # read. The dead space above and below the band is the right place for
    # text: it is already marked as somewhere nothing may be drawn.
    key = []
    for i, (name, rect) in enumerate(FEATURES.items(), 1):
        a, b, c, e = box(rect)
        col = (255, 120, 60, 255) if 'exit' in name else (120, 200, 255, 240)
        d.rectangle([a, b, c, e], outline=col, width=3)
        d.text((a + 6, b + 5), str(i), fill=col)
        key.append((i, name, col))
    for j, (i, name, col) in enumerate(key):
        cx, cy = 16 + (j // 9) * 340, 44 + (j % 9) * 13
        d.text((cx, cy), f'{i:>2}  {name}', fill=col)

    for name, rect in PEOPLE.items():
        a, b, c, e = box(rect)
        col = (255, 240, 120, 235) if name.startswith('THAD') else \
              (150, 255, 150, 220) if name.startswith('DEKE') else (255, 110, 255, 225)
        for k in range(0, int(e - b), 14):          # dashed, so it reads as absent
            d.line([(a, b + k), (a, min(e, b + k + 7))], fill=col, width=2)
            d.line([(c, b + k), (c, min(e, b + k + 7))], fill=col, width=2)
        d.line([(a, e), (c, e)], fill=col, width=2)
        d.text((a, e + 3), name.split()[0], fill=col)

    d.text((14, SRC[1] - 48),
           'DASHED OUTLINES ARE NOT PEOPLE. They mark where figures are composited LATER. '
           'Draw the furniture and floor there and NOBODY AT ALL.', fill=(255, 200, 255))
    g.save(OUT / 'geometry-guide.png')

    rec = dict(schema=1, note='Engine-fit composition guide. Zero image operations.',
               source=list(SRC), band=BAND,
               bandWhy=('PLAY_HEIGHT 864 is fixed and the camera scrolls in X only, so '
                        '1536 * 864/1920 = 691 rows is everything that can reach the screen'),
               roomFromSource='room_y = (source_y - 166) * 864/691',
               camera=dict(eyeY=EYE, k=K, carriedFrom='R3-PREF'),
               featuresRoomCoords={k: list(v) for k, v in FEATURES.items()},
               peopleRoomCoords={k: [round(x) for x in v] for k, v in PEOPLE.items()},
               landingHeadroom=dict(landingFloorRoomY=262, ceilingRoomY=48,
                                    manHeightRoomPx=180,
                                    manHeightWhy='authored, not from the camera -- he is not on '
                                                 'the ground plane; R3-PREF used 168',
                                    headroomRoomPx=262 - 48,
                                    fits=180 <= 262 - 48))
    (OUT / 'geometry-guide.json').write_text(json.dumps(rec, indent=1) + '\n')
    lm = rec['landingHeadroom']
    print(f'wrote {OUT / "geometry-guide.png"}')
    print(f'band {BAND["w"]}x{BAND["h"]} at y{BAND["y"]}; room_y = (source_y - 166) * {SCALE:.4f}')
    print(f'landing: floor room y{lm["landingFloorRoomY"]}, ceiling y{lm["ceilingRoomY"]}, '
          f'headroom {lm["headroomRoomPx"]}px, a 1.75 m man {lm["manHeightRoomPx"]}px '
          f'-> fits: {lm["fits"]}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
