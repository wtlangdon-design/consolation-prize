#!/usr/bin/env python3
"""
THE CLEAN-SHEET ROOM 3 BLOCKING GUIDE -- structural authority for the rebuild.

Tyler's clean-sheet reset, sec.16: a deterministic composition guide BEFORE any
image operation. Old Room 3 coordinates are not canon and none are read here;
what IS carried over is the CAMERA, and that is a deliberate choice rather than
an oversight.

WHY THE CAMERA IS KEPT WHEN EVERYTHING ELSE IS THROWN AWAY. The Thad depth
relationship in the retired room -- 227 px at y 506, 526 px at y 858, a true
perspective reaching zero at y 239 -- is the one part of Room 3 that was
measured, cross-checked against the back door, owner-reviewed as an A/B/C study
and accepted. Section 3 says not to canonise a new scale incidentally, and a
rebuild that also moves the camera changes the one variable Tyler has already
judged. So the NEW room is designed to the SAME camera: eye level y 239, and a
man's drawn height h(y) = 0.8494 (y - 239). Everything else -- walls, bar,
table, stove, stairs, piano, floor, lighting, every prop -- is designed from
zero against it.

THE ROOM THIS DESCRIBES, and how it differs from the retired one:

  THE BAR IS THE DEPTH. In the retired room it began at x 1185 and ran to the
  frame edge: a short counter, nearly frontal, whose far end had to be given a
  terminus it never had. Here it is the room's longest line -- from the near
  right corner of the frame at (1900, 838) back to (1120, 497), 780 px across
  and 341 px of depth -- so a patron at its near end is drawn 509 px tall and
  one at its far end 219, and the bar itself does the work of saying how deep
  the room is. Its far end dies into the back wall and the stair, not into open
  floor, so there is no terminus to invent.

  THE CARD TABLE COMES FORWARD AND LEFT, out of the middle of the floor, to
  x 380-980. Its near rim is at y 726 where a man is drawn 414 px, which is what
  gives the two near players real size and real backs; the retired table sat at
  a depth where every seat wanted the same 230 px figure and the near seats
  could not be told from the far ones.

  THE STOVE KEEPS THE BACK WALL between them, which is where Tyler put it and
  where the canonical line wants it -- the man beside it has not taken his coat
  off, and that only reads if he is at the cold end of the room.

  THE FOREGROUND IS FLOOR. A dirt apron across the whole bottom of the frame,
  16-30 px of walkable band per row, so Thad can cross in front of everything.

    python3 tools/room03/blocking.py            # the guide and the record
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'proofs/room-03/clean-sheet'
W, H = 1920, 864

# THE CAMERA, carried over and nothing else.
EYE = 239.0
K = 0.8494


def figure_height(y):
    """A 1.75 m man's drawn height with his feet on floor row y."""
    return K * (y - EYE)


# ---- THE ROOM ------------------------------------------------------------
#
# Every number below is chosen against the camera above and checked by
# `verify()`: a thing a man stands beside has to be the size that man's height
# at that row implies, or the room will not read no matter how it is painted.
REGIONS = {
    'back_wall': {
        'rect': [0, 262, 1920, 505],
        'what': 'the back wall: its base runs y 497-505, so a man standing against it is drawn 219-226 px',
    },
    'front_doors': {
        'rect': [0, 300, 250, 800],
        'what': 'THE FRONT DOORS -- batwings on the left wall, cut by the frame, floor at y 800 (476 px man)',
    },
    'window': {
        'rect': [276, 232, 470, 382],
        'what': 'THE WINDOW -- street-side, night blue, left wall ABOVE the piano and clear of it',
    },
    'handbill': {
        'rect': [262, 452, 316, 536],
        'what': 'THE HANDBILL -- nailed to the left wall by the doors, at a reading height nobody uses',
    },
    'piano': {
        'rect': [300, 392, 620, 650],
        'what': ('THE PIANO -- upright against the left wall, mid-depth. 258 px tall because 1.3 m at '
                 'a depth where a man is 349, NOBODY AT IT AND NOBODY NEAR IT'),
    },
    # THE CLUSTER BOXES ARE 3:2 ON PURPOSE. They are the frame an authored
    # cluster master is generated into, and the endpoint's landscape size is
    # 1536x1024, so a box of another shape would be letterboxed or cropped and
    # the geometry inside it would no longer be the geometry that was designed.
    # The top of each box is set by the TALLEST HEAD in it, computed rather
    # than guessed: a seated man's crown is 0.78 of his standing height above
    # the floor, so the far card players' heads reach y 374 and the box has to
    # start above that.
    'card_cluster': {
        'rect': [370, 360, 1015, 790],
        'what': ('CARD CLUSTER bounds, 645x430 = 3:2: table, four players, four chairs, the empty '
                 'fifth place nearest camera, and the abandoned hand'),
    },
    'card_table': {
        'rect': [470, 560, 900, 745],
        'what': 'the round table itself; top plane y 578-640, near rim y 726, floor contact y 745',
    },
    'stove': {
        'rect': [1024, 258, 1146, 500],
        'what': 'THE STOVE -- iron box and pipe against the back wall, between the card floor and the stair foot',
    },
    'stove_man': {
        'rect': [1152, 279, 1218, 500],
        'what': 'THE STOVE MAN stands here, back of the room, coat on, hands to the heat (221 px at y 500)',
    },
    'stairs': {
        'rect': [1230, 40, 1500, 430],
        'what': ('THE STAIRS -- on the BACK wall, rising right to left. THE BAR\'S FAR END DIES INTO '
                 'THEIR FOOT, which is why this room has no terminus to invent'),
    },
    'landing': {
        'rect': [1290, 90, 1450, 250],
        'what': 'THE LANDING -- and the man on it. There is always a man on the landing.',
    },
    'bar_cluster': {
        'rect': [1130, 64, 1920, 854],
        'what': ('BAR CLUSTER bounds, 790x790 = 1:1: counter, BACK BAR with its bottles and mirror, '
                 'stools, brass rail, and the three patrons -- seated at the far end, leaning at the '
                 'middle, standing at the near. SQUARE because the back bar rises to y 64 behind the '
                 'counter\'s near end and a 3:2 box cut it off; the endpoint\'s square size is 1024.'),
    },
    'chandelier': {
        'rect': [820, 0, 1120, 165],
        'what': 'THE CHANDELIER -- hung over OPEN DIRT FLOOR, not over the table, which is the whole joke',
    },
    'portrait': {
        'rect': [700, 296, 812, 430],
        'what': 'THE FADED PORTRAIT -- back wall, left of the stove',
    },
    'mirror': {
        'rect': [1560, 262, 1900, 500],
        'what': 'THE MIRROR -- over the back bar, on the right wall behind the bar\'s near half',
    },
    'spittoon': {
        'rect': [1120, 792, 1216, 862],
        'what': 'THE SPITTOON -- foreground, short of the bar\'s near end, and it occludes',
    },
    'deke_reserve': {
        'rect': [200, 790, 560, 862],
        'what': 'FUTURE DEKE -- open near-left floor inside the doors, reserved and NOT implemented',
    },
}

# THE BAR LINE, which is the room's spine. Counter front top edge, near -> far.
BAR_NEAR = (1900, 838)
BAR_FAR = (1240, 505)

# THE FLOOR. Near edge of the walkable apron and its far edge.
FLOOR_NEAR_Y = 858
FLOOR_FAR_Y = 520

# WHERE THE NINE STAND, in room coordinates, as floor contact points. These are
# BLOCKING intentions, not final runtime anchors: the cluster masters decide the
# exact contacts and sec.11 and sec.13 record them afterwards.
#
# THE FOUR SEATS ARE SOLVED ON THE GROUND PLANE, NOT PLACED BY EYE. The table
# centre stands 4.35 m from the camera; the four chairs sit 0.95 m out from it
# at the four diagonals, so each seat is 0.67 m across and 0.67 m nearer or
# further, and the camera turns that into rows 744 and 609 and offsets of 164
# and 120 px. Placing them by eye is how the retired room ended up with four
# seats that all wanted the same 230 px figure.
PEOPLE = [
    ('card_1', 499, 697, 'near-left seat, THREE-QUARTER BACK VIEW, 72 deg round from the empty place'),
    ('card_2', 602, 602, 'far-left seat, facing the room -- THE CARD SHARP'),
    ('card_3', 798, 602, 'far-right seat, facing the room'),
    ('card_4', 901, 697, 'near-right seat, THREE-QUARTER BACK VIEW'),
    ('bar_1', 1360, 578, 'far end of the bar, seated on a stool -- THE ONE-STRIKE MAN'),
    ('bar_2', 1500, 690, 'mid bar, LEANING, forearm on the counter'),
    ('bar_3', 1740, 812, 'near end of the bar, STANDING, drinking, foreground depth'),
    ('stove_man', 1185, 500, 'at the back with the stove, coat on'),
    # HE IS NOT ON THE FLOOR, so his size does not come from his feet. A man on
    # a raised landing has his contact row high in the frame while standing at
    # the DEPTH of the back wall, and sizing him from his contact row would draw
    # him 52 px tall -- a doll on a staircase. depthY is the floor row directly
    # below him, and it is what the scale law is given.
    ('landing_man', 1370, 250, 'on the landing, above the room, barely moving', 478),
]

# THAD, at the three depths section 37 asks for a proof of.
THAD = [('far', 700, 560), ('middle', 900, 700), ('near', 640, 852)]


def verify():
    """
    THE CHECKS THAT MAKE THIS A DESIGN AND NOT A WISH. Each one asks whether a
    number in the layout above agrees with the camera, and prints the answer so
    a person can disagree with it.
    """
    out = []
    b = figure_height(BAR_NEAR[1]), figure_height(BAR_FAR[1])
    out.append(('bar run', f'near end y {BAR_NEAR[1]} -> a man is {b[0]:.0f} px; '
                           f'far end y {BAR_FAR[1]} -> {b[1]:.0f} px; ratio {b[0] / b[1]:.2f}x'))
    # A COUNTER IS 1.10 m, which is 0.63 of a 1.75 m man.
    for label, (x, y) in (('near', BAR_NEAR), ('far', BAR_FAR)):
        out.append((f'counter height, {label} end',
                    f'{0.63 * figure_height(y):.0f} px at x {x} -- top edge y {y - 0.63 * figure_height(y):.0f}'))
    # A TABLE IS 0.75 m, 0.43 of a man; a chair seat 0.45 m, 0.26.
    ty = REGIONS['card_table']['rect'][3]
    out.append(('card table', f'floor contact y {ty}, a man there is {figure_height(ty):.0f} px, '
                              f'so the top is {0.43 * figure_height(ty):.0f} px up at y {ty - 0.43 * figure_height(ty):.0f}'))
    out.append(('card seat', f'a chair seat is {0.26 * figure_height(ty):.0f} px up, y {ty - 0.26 * figure_height(ty):.0f}'))
    # THE STOVE MAN AND THE NEAR BAR PATRON are the room's two extremes.
    hs = figure_height(499)
    hn = figure_height(812)
    out.append(('depth range', f'stove man {hs:.0f} px at y 499, near bar patron {hn:.0f} px at y 812, '
                               f'{hn / hs:.2f}x -- the room is that deep'))
    for who, x, y, *rest in PEOPLE:
        if who.startswith('card'):
            h = figure_height(y)
            out.append((f'{who} crown', f'seated, {SEATED * h:.0f} px above his floor row {y} -> y {y - SEATED * h:.0f}'))
    out.append(('thad', '  '.join(f'{n} y{y}={figure_height(y):.0f}px' for n, _, y in THAD)))
    out.append(('walk band', f'floor y {FLOOR_FAR_Y} to {FLOOR_NEAR_Y}, '
                             f'{figure_height(FLOOR_FAR_Y):.0f} px to {figure_height(FLOOR_NEAR_Y):.0f} px'))
    return out


# A seated man's crown, as a fraction of his standing height above the floor:
# a 1.75 m man sits 0.91 m from seat to crown on a 0.45 m seat, so 1.36 m.
SEATED = 0.78


def bar_top(x):
    """The counter's front top edge at x, from the two ends."""
    (x0, y0), (x1, y1) = BAR_NEAR, BAR_FAR
    t = (x - x0) / (x1 - x0)
    base = y0 + t * (y1 - y0)
    return base - 0.63 * figure_height(base)


def draw():
    img = Image.new('RGB', (W, H), (26, 26, 30))
    d = ImageDraw.Draw(img)

    # the floor apron, as a value block
    d.polygon([(0, FLOOR_NEAR_Y + 6), (W, FLOOR_NEAR_Y + 6), (W, FLOOR_FAR_Y), (0, FLOOR_FAR_Y)],
              fill=(52, 44, 36))
    d.line([(0, int(EYE)), (W, int(EYE))], fill=(80, 80, 120))
    d.text((6, int(EYE) - 14), f'EYE LEVEL y {EYE:.0f} -- h(y) = {K} (y - {EYE:.0f})', fill=(150, 150, 200))

    for name, spec in REGIONS.items():
        x0, y0, x1, y1 = spec['rect']
        d.rectangle([x0, y0, x1, y1], outline=(120, 150, 170), width=2)
        d.text((x0 + 4, y0 + 3), name, fill=(190, 215, 230))

    # the bar's spine: base line and counter top
    d.line([BAR_NEAR, BAR_FAR], fill=(215, 170, 90), width=3)
    d.line([(BAR_NEAR[0], bar_top(BAR_NEAR[0])), (BAR_FAR[0], bar_top(BAR_FAR[0]))],
           fill=(245, 215, 150), width=3)
    d.text((BAR_FAR[0] + 6, BAR_FAR[1] - 30), 'THE BAR -- the room\'s longest line', fill=(245, 215, 150))

    for who, x, y, what, *rest in PEOPLE:
        h = figure_height(rest[0] if rest else y)
        w = h * 0.30
        d.rectangle([x - w / 2, y - h, x + w / 2, y], outline=(235, 120, 110), width=2)
        d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(235, 120, 110))
        d.text((x - w / 2, y - h - 14), f'{who}  {h:.0f}px', fill=(245, 165, 150))

    for label, x, y in THAD:
        h = figure_height(y)
        w = h * 0.30
        d.rectangle([x - w / 2, y - h, x + w / 2, y], outline=(120, 235, 150), width=3)
        d.text((x - w / 2, y + 4), f'THAD {label} {h:.0f}px', fill=(150, 245, 175))

    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    checks = verify()
    for name, line in checks:
        print(f'  {name:24s} {line}')
    img = draw()
    img.save(OUT / 'blocking.png')
    record = {
        'note': ('CLEAN-SHEET ROOM 3 BLOCKING GUIDE (Tyler, clean-sheet reset sec.16). Structural '
                 'authority for the rebuild. No image operation was spent to produce it and no old '
                 'Room 3 coordinate was read into it -- only the CAMERA is carried over, because the '
                 'Thad depth relationship is the one part of the retired room that was measured, '
                 'cross-checked and owner-accepted.'),
        'camera': {'eyeLevelY': EYE, 'k': K,
                   'law': 'drawnHeight(y) = k * (y - eyeLevelY), a 1.75 m man',
                   'carriedFrom': ('the retired room\'s accepted curve: 227 px at y 506, 526 px at '
                                   'y 858, zero at y 239')},
        'size': [W, H],
        'floor': {'nearY': FLOOR_NEAR_Y, 'farY': FLOOR_FAR_Y},
        'bar': {'nearEnd': list(BAR_NEAR), 'farEnd': list(BAR_FAR),
                'why': ('the room\'s spine. 780 px across and 341 px of depth, so the bar itself says '
                        'how deep the room is; its far end dies into the back wall and the stair '
                        'rather than into open floor, so there is no terminus to invent')},
        'regions': REGIONS,
        'people': [{'id': p[0], 'contact': [p[1], p[2]],
                    'depthY': (p[4] if len(p) > 4 else p[2]),
                    'drawnHeight': round(figure_height(p[4] if len(p) > 4 else p[2])),
                    'elevated': len(p) > 4, 'what': p[3]} for p in PEOPLE],
        'thadProofPositions': [{'label': n, 'at': [x, y], 'drawnHeight': round(figure_height(y))}
                               for n, x, y in THAD],
        'checks': [{'name': n, 'says': s} for n, s in checks],
    }
    (OUT / 'blocking.json').write_text(json.dumps(record, indent=1) + '\n')
    print(f'\nwrote {OUT / "blocking.png"} and blocking.json')


if __name__ == '__main__':
    main()
