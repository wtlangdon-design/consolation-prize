#!/usr/bin/env python3
"""
THE R3-PREF BLOCKING GUIDE — measured off the preferred room, not invented.

Owner ruling, PHASE A sec.16: before an image operation is spent, a
deterministic guide is drawn FROM R3-PREF so the replica has a layout to be
faithful to rather than a description to interpret. Zero image operations.

WHY THIS EXISTS AT ALL. The clean-sheet Room 3 was rejected for changing the
room. It was built from a written description of a saloon, and a description is
the one input that guarantees a different room, because everything the owner
actually liked about R3-PREF -- how far back the stove sits, how long the bar
runs, where the card table falls in the frame -- lives in the pixels and not in
any sentence anyone wrote down.

So every number below is READ OFF R3-PREF. Nothing here is a preference.

    python3 tools/room03/replica-blocking.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PREF = ROOT / 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png'
COLD = ROOT / 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
ROOM_JSON = ROOT / 'content/rooms/nugget-candidate.json'
OUT = ROOT / 'proofs/room-03/pref-replica'

# THE CAMERA, carried from the accepted room and not re-derived. A 1.75 m man
# is drawn K*(y - EYE) tall when his soles are on row y. Room 3's horizon is
# declared in the room JSON; K comes from the accepted Thad scale samples.
EYE = 239.0
K = 0.8494

# Read off R3-PREF with a ruler, listed here so the guide is auditable.
FEATURES = {
    'door_swinging':   (28, 250, 200, 640, 'the batwing doors, room exit WEST'),
    'window_front':    (232, 178, 430, 460, 'the front window onto the night street'),
    'piano':           (430, 300, 660, 520, 'the upright piano -- NOBODY IS EVER AT IT'),
    'card_table':      (673, 340, 1160, 560, 'the card table, its chairs and its floor'),
    'stove':           (1080, 250, 1230, 520, 'the stove, REARWARD of the card table'),
    'stairs':          (1290, 120, 1560, 430, 'the staircase'),
    'landing':         (1275, 67, 1400, 260, 'the landing -- there is always a man on it'),
    'back_bar':        (1430, 150, 1920, 400, 'the back bar: shelves, bottles, mirror'),
    'spittoon':        (1390, 755, 1505, 850, 'the spittoon (occlusion plane 1)'),
}

# The bar's own trajectory, the room's main depth device, measured as two
# points on the counter's top edge in R3-PREF.
BAR_FAR = (1185, 383)
BAR_NEAR = (1908, 560)

# Where people will later stand. NOT drawn into the plate -- reserved so the
# replica's furniture leaves them physically possible.
RESERVED = 'card_1 card_2 card_3 card_4 bar_1 bar_2 bar_3 stove_man landing_man deke'


def drawn_height(y):
    """A standing 1.75 m man's drawn height with his soles on row y."""
    return K * (y - EYE)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pref = Image.open(PREF).convert('RGB')
    room = json.loads(ROOM_JSON.read_text())
    people = room['population']['people']

    guide = pref.copy()
    d = ImageDraw.Draw(guide, 'RGBA')

    # the horizon, which every scale on the page hangs off
    d.line([(0, EYE), (1920, EYE)], fill=(255, 210, 60, 210), width=2)
    d.text((12, EYE - 22), f'HORIZON y={EYE:.0f}  (eye level)', fill=(255, 210, 60, 255))

    # the long bar, extended to both frame edges so its trajectory is legible
    (x0, y0), (x1, y1) = BAR_FAR, BAR_NEAR
    m = (y1 - y0) / (x1 - x0)
    d.line([(0, y0 + m * (0 - x0)), (1920, y0 + m * (1920 - x0))],
           fill=(90, 200, 255, 150), width=2)
    d.line([BAR_FAR, BAR_NEAR], fill=(90, 200, 255, 255), width=4)
    d.text((BAR_FAR[0] + 8, BAR_FAR[1] - 26), 'BAR counter top edge — the room\'s depth device',
           fill=(90, 200, 255, 255))
    d.ellipse([BAR_FAR[0] - 9, BAR_FAR[1] - 9, BAR_FAR[0] + 9, BAR_FAR[1] + 9],
              outline=(255, 90, 90, 255), width=3)
    d.text((BAR_FAR[0] - 300, BAR_FAR[1] + 14),
           'STOVE-SIDE TERMINUS — must resolve, not dissolve', fill=(255, 90, 90, 255))

    for name, (a, b, c, e, what) in FEATURES.items():
        d.rectangle([a, b, c, e], outline=(120, 255, 150, 190), width=2)
        d.text((a + 5, b + 4), name, fill=(120, 255, 150, 255))

    # every future person: his box, and the height the CAMERA says he should be
    for p in people:
        x, y, w, h = p['box']
        seat = p.get('seat') or [x + w // 2, y + h]
        col = (255, 140, 255, 220)
        d.rectangle([x, y, x + w, y + h], outline=col, width=2)
        d.line([(seat[0] - 14, seat[1]), (seat[0] + 14, seat[1])], fill=col, width=3)
        sh = drawn_height(seat[1])
        d.text((x + 3, y + h + 3), f'{p["id"]}  standing {sh:.0f}px', fill=col)

    # Thad, at the sizes the camera gives him where he will actually walk
    for wx, wy, tag in [(360, 800, 'foreground'), (760, 690, 'near card'),
                        (1120, 620, 'stove approach'), (1500, 700, 'near bar'),
                        (300, 560, 'far left / exit')]:
        hgt = drawn_height(wy)
        d.rectangle([wx - hgt * 0.16, wy - hgt, wx + hgt * 0.16, wy],
                    outline=(255, 255, 255, 210), width=2)
        d.text((wx - hgt * 0.16, wy + 4), f'THAD {tag} {hgt:.0f}px', fill=(255, 255, 255, 235))

    guide.save(OUT / 'blocking-on-r3pref.png')

    rec = {
        'schema': 1,
        'note': 'R3-PREF blocking, measured off the preferred plate. Zero image '
                'operations. This is the layout the replica must be faithful to.',
        'blueprint': str(PREF.relative_to(ROOT)),
        'peopleFreeAncestor': str(COLD.relative_to(ROOT)),
        'size': [1920, 864],
        'camera': {'eyeY': EYE, 'k': K,
                   'note': 'a 1.75 m man is k*(y-eyeY) tall with soles on row y'},
        'bar': {'farEnd': BAR_FAR, 'nearEnd': BAR_NEAR,
                'slope': round(m, 5),
                'terminusRequirement': 'the stove-side end must resolve structurally: '
                                       'end stile, return, or continuation into architecture. '
                                       'It may not fade, smear or depend on a patron to hide it.'},
        'features': {k: {'box': list(v[:4]), 'what': v[4]} for k, v in FEATURES.items()},
        'reservedForPeople': [
            {'id': p['id'], 'box': p['box'], 'seat': p.get('seat'),
             'standingHeightHere': round(drawn_height((p.get('seat') or [0, p['box'][1] + p['box'][3]])[1]), 1),
             'what': p['what']}
            for p in people],
        'reservedNote': RESERVED,
        'thadSamples': [{'at': [wx, wy], 'where': tag, 'drawnHeight': round(drawn_height(wy), 1)}
                        for wx, wy, tag in [(360, 800, 'foreground'), (760, 690, 'near card'),
                                            (1120, 620, 'stove approach'), (1500, 700, 'near bar'),
                                            (300, 560, 'far left / exit')]],
        'out': 'proofs/room-03/pref-replica/blocking-on-r3pref.png',
    }
    (OUT / 'blocking.json').write_text(json.dumps(rec, indent=1) + '\n')
    print(f'wrote {OUT / "blocking-on-r3pref.png"}')
    print(f'wrote {OUT / "blocking.json"}')
    print(f'bar slope {m:.5f}; a man at the near bar is {drawn_height(700):.0f}px, '
          f'at the stove {drawn_height(620):.0f}px')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
