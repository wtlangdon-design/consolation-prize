#!/usr/bin/env python3
"""
THE CLUSTER STAGING GUIDES -- what each cluster master is generated INTO.

Tyler's clean-sheet reset, sec.8: author each furniture-dependent group as ONE
coherent composition first, then decompose it. This draws the composition the
endpoint is asked to complete -- a grayscale value block in the project's own
graybox order (errata 22): value block, then silhouettes, then nothing else.

WHY A DIAGRAM AND NOT A DESCRIPTION. Doc 38's first lesson is that a character
described in words and not shown a style comes back photographic. Q133 is the
same lesson about STAGING: the card-landing sheet was drawn from a written
description of the room and all four men came back facing the camera, because a
round table's near seats need men seen from BEHIND and no wording produced one.
A diagram cannot be misread about who faces where.

THE GROUND PLANE IS SOLVED, NOT SKETCHED. A round table is a circle on the
floor, and its screen ellipse follows from the camera: with h(y) = k(y - EYE) a
point's depth is d = A/(y - EYE), so a metre of depth is a different number of
rows at every row, and the near rim, the far rim and the top surface each land
where the camera puts them. A is calibrated once from the room's own walkable
band and printed with the guide so it can be argued with.

    python3 tools/room03/cluster-guide.py card
    python3 tools/room03/cluster-guide.py bar
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'proofs/room-03/clean-sheet'
BLOCK = json.loads((OUT / 'blocking.json').read_text())

EYE = BLOCK['camera']['eyeLevelY']
K = BLOCK['camera']['k']
# THE ONE FREE PARAMETER OF THE GROUND PLANE. d = A/(y - EYE) metres. Fixed by
# putting the near edge of the walkable floor 3.0 m from the camera, which is
# where a 1.75 m man drawn 526 px tall in a 1920x864 frame actually stands.
A = 3.0 * (BLOCK['floor']['nearY'] - EYE)
SEATED = 0.78

OUTSIZE = (1536, 1024)
SQUARE = (1024, 1024)


def h(y):
    return K * (y - EYE)


def depth(y):
    return A / (y - EYE)


def row_at(d):
    return EYE + A / d


def per_metre(y):
    """Lateral pixels per metre at floor row y."""
    return h(y) / 1.75


class Frame:
    """The cluster box, and room <-> local conversion inside it."""

    out = OUTSIZE

    def __init__(self, rect, out=None):
        if out:
            self.out = out
        self.x0, self.y0, self.x1, self.y1 = rect
        self.s = self.out[0] / (self.x1 - self.x0)

    def p(self, x, y):
        return ((x - self.x0) * self.s, (y - self.y0) * self.s)


def seated_figure(d, f, x, floor_y, facing, label):
    """
    A SEATED MAN AS THREE MASSES -- head, shoulders-to-seat, knees -- because
    those are the three a composition of men round a table has to get right.
    Proportions are the ones the camera implies and not a shape that looked
    about right: crown at 0.78 of standing height, shoulders at 0.70, seat at
    0.26, shoulder width 0.42 of a standing height's quarter.

    ORIENTATION IS DRAWN, NEVER WRITTEN. A near-side man gets a dark head with
    no face mark and a chair back behind him; a far-side man gets a light head
    with one. Q133 is the whole reason: four men were once described as facing
    four ways and all four came back facing the camera.
    """
    hh = h(floor_y)
    back = facing.lower() == 'back'
    crown, shoulder, seat = (floor_y - c * hh for c in (0.78, 0.70, 0.26))
    half, head = 0.115 * hh, 0.105 * hh

    if back:
        cx0, cy0 = f.p(x - half * 1.25, shoulder - 0.06 * hh)
        cx1, cy1 = f.p(x + half * 1.25, floor_y - 0.20 * hh)
        d.rectangle([cx0, cy0, cx1, cy1], fill=(58, 52, 46), outline=(120, 110, 98), width=3)

    d.rectangle([*f.p(x - half, shoulder), *f.p(x + half, seat)],
                fill=(112, 112, 112) if back else (132, 132, 132),
                outline=(178, 178, 178), width=3)
    d.ellipse([*f.p(x - head / 2, crown), *f.p(x + head / 2, crown + head)],
              fill=(84, 84, 84) if back else (176, 176, 176), outline=(214, 214, 214), width=3)
    if not back:
        fx, fy = f.p(x, crown + head * 0.55)
        d.ellipse([fx - 5, fy - 5, fx + 5, fy + 5], fill=(40, 40, 40))

    # knees forward under the table, then boots on the floor
    kx, ky = f.p(x, floor_y - 0.15 * hh)
    d.ellipse([kx - half * f.s * 0.9, ky - 20, kx + half * f.s * 0.9, ky + 20], fill=(100, 100, 100))
    bx, by = f.p(x, floor_y)
    d.ellipse([bx - half * f.s * 0.8, by - 11, bx + half * f.s * 0.8, by + 11], fill=(66, 66, 66))
    tx, ty = f.p(x, crown)
    d.text((tx - 46, ty - 30), f'{label} {"BACK VIEW" if back else "faces room"}', fill=(244, 244, 244))


def card_guide():
    """
    THE Z-ORDER IS THE POINT OF THIS DRAWING. Far players, then the table over
    them, then near players over the table -- because that ring of overlaps is
    exactly what a composition of four men round a table has to get right, and
    the first version of this guide drew all four figures on top of the table
    and read as four men standing behind it.
    """
    rect = BLOCK['regions']['card_cluster']['rect']
    f = Frame(rect)
    img = Image.new('RGB', OUTSIZE, (34, 34, 34))
    d = ImageDraw.Draw(img)

    cx, diam = 700.0, 1.35
    near_y = 745.0
    centre_d = depth(near_y) + diam / 2
    far_y = row_at(centre_d + diam / 2)
    half_n = diam / 2 * per_metre(near_y)
    half_f = diam / 2 * per_metre(far_y)
    top_n = near_y - 0.43 * h(near_y)          # the top surface at its near rim
    top_f = far_y - 0.43 * h(far_y)            # and at its far rim
    apron = 0.12 * per_metre(near_y)           # 12 cm of skirt under the rim

    far_people = [('card_2', 602, 602, 'front'), ('card_3', 798, 602, 'front')]
    near_people = [('card_1', 499, 697, 'BACK'), ('card_4', 901, 697, 'BACK')]

    for who, x, y, facing in far_people:
        seated_figure(d, f, x, y, facing, who)

    # the table: pedestal, then apron, then the top surface over both
    d.polygon([f.p(cx - 40, top_n + apron), f.p(cx + 40, top_n + apron),
               f.p(cx + 86, near_y), f.p(cx - 86, near_y)], fill=(74, 66, 58))
    d.polygon([f.p(cx - half_n, top_n), f.p(cx + half_n, top_n),
               f.p(cx + half_n, top_n + apron), f.p(cx - half_n, top_n + apron)],
              fill=(96, 88, 78))
    d.ellipse([*f.p(cx - half_n, top_f), *f.p(cx + half_n, top_n)],
              fill=(142, 134, 122), outline=(206, 200, 190), width=4)
    d.text(f.p(cx - 78, top_f - 30), f'ROUND TABLE {diam} m', fill=(232, 228, 218))

    hx, hy = f.p(cx, top_n - 22)
    d.rectangle([hx - 46, hy - 15, hx + 46, hy + 15], fill=(238, 234, 222),
                outline=(255, 255, 255), width=3)
    d.text((hx - 104, hy - 44), 'ABANDONED HAND, FACE UP', fill=(252, 252, 244))

    for who, x, y, facing in near_people:
        seated_figure(d, f, x, y, facing, who)

    gx, gy = f.p(cx, 786)  # the fifth place, 0.95 m out on the camera side
    d.ellipse([gx - 132, gy - 34, gx + 132, gy + 34], outline=(250, 210, 120), width=5)
    d.text((gx - 168, gy + 42), 'EMPTY FIFTH PLACE -- NO CHAIR, NO MAN', fill=(250, 210, 120))

    facts = [
        f'CARD CLUSTER STAGING GUIDE -- room box x {rect[0]}-{rect[2]} y {rect[1]}-{rect[3]}, drawn at {f.s:.3f}x',
        f'camera h(y) = {K} (y - {EYE:.0f});  ground plane d = {A:.0f}/(y - {EYE:.0f}) metres',
        f'table centre {centre_d:.2f} m out; near rim row {near_y:.0f}, far rim row {far_y:.0f}',
        f'FIVE-PLACE RING 0.95 m out: near pair row 697 ({h(697):.0f} px), far pair row 602 ({h(602):.0f} px),',
        f'and the FIFTH place open at row 786 facing the camera -- no chair, no man, the hand on the rim.',
        'card_1 and card_4 are on the NEAR side and are seen FROM BEHIND. Not all four face the camera.',
    ]
    for i, line in enumerate(facts):
        d.text((14, 14 + i * 22), line, fill=(250, 250, 250))
    return img, {'rect': rect, 'scale': f.s, 'tableNearY': near_y, 'tableFarY': far_y,
                 'tableDiameterM': diam, 'groundA': A,
                 'seats': {w: [x, y, ff] for w, x, y, ff in far_people + near_people},
                 'fifthPlace': [cx, 786]}


def bar_guide():
    """
    THE BAR IS THE ROOM'S SPINE, so the guide's job is to say how far it runs
    and how differently three men can stand at it. The first version of this
    drew a back-bar polygon that swallowed the frame and a counter with no
    front face at all, which would have told the endpoint nothing except that
    the picture is brown.
    """
    rect = BLOCK['regions']['bar_cluster']['rect']
    f = Frame(rect, SQUARE)
    img = Image.new('RGB', SQUARE, (34, 34, 34))
    d = ImageDraw.Draw(img)
    near, far = BLOCK['bar']['nearEnd'], BLOCK['bar']['farEnd']

    def counter(x):
        t = (x - near[0]) / (far[0] - near[0])
        base = near[1] + t * (far[1] - near[1])
        return base, base - 0.63 * h(base)

    fb, ft = counter(far[0])
    nb, nt = counter(near[0])

    # THE BACK BAR, behind the counter: shelves, bottles and the mirror, rising
    # a further 0.9 of a man above the counter's own top edge at each end.
    d.polygon([f.p(far[0], ft - 0.90 * h(fb)), f.p(near[0], nt - 0.90 * h(nb)),
               f.p(near[0], nt), f.p(far[0], ft)], fill=(52, 44, 38), outline=(132, 118, 104))
    d.text(f.p(1420, 200), 'BACK BAR: shelves, bottles, THE MIRROR', fill=(196, 182, 166))

    # THE COUNTER, as a face with a lit top edge -- 1.10 m at every depth.
    d.polygon([f.p(far[0], ft), f.p(near[0], nt), f.p(near[0], nb), f.p(far[0], fb)],
              fill=(96, 74, 52), outline=(176, 148, 112))
    d.line([f.p(far[0], ft), f.p(near[0], nt)], fill=(240, 212, 164), width=7)
    d.text(f.p(1500, 470), 'MAHOGANY COUNTER', fill=(244, 216, 170))
    # the brass foot rail, forward of the base and lower
    d.line([f.p(far[0] + 20, fb + 0.10 * h(fb)), f.p(near[0] - 20, nb + 0.10 * h(nb))],
           fill=(206, 168, 96), width=6)
    d.text(f.p(1620, 800), 'BRASS FOOT RAIL', fill=(214, 180, 112))

    for who, x, y, role, kind in (
            ('bar_1', 1360, 578, 'SEATED on a stool, both forearms on the counter', 'seat'),
            ('bar_2', 1500, 690, 'LEANING, one forearm taking his weight', 'lean'),
            ('bar_3', 1740, 812, 'STANDING, drinking, half turned into the room', 'stand')):
        hh = h(y)
        half = 0.115 * hh
        head = 0.105 * hh
        crown = y - (SEATED * hh if kind == 'seat' else hh)
        if kind == 'seat':
            sx, sy = f.p(x, y - 0.26 * hh)
            d.ellipse([sx - half * f.s, sy - 14, sx + half * f.s, sy + 14], fill=(120, 98, 66))
            d.line([f.p(x, y - 0.26 * hh), f.p(x, y)], fill=(120, 98, 66), width=8)
        d.rectangle([*f.p(x - half, crown + head), *f.p(x + half, y - (0.26 * hh if kind == 'seat' else 0))],
                    fill=(128, 128, 128), outline=(188, 188, 188), width=3)
        d.ellipse([*f.p(x - head / 2, crown), *f.p(x + head / 2, crown + head)],
                  fill=(176, 176, 176), outline=(216, 216, 216), width=3)
        if kind == 'lean':
            d.line([f.p(x - half, crown + head * 1.4), f.p(x + half * 2.2, counter(x + 40)[1])],
                   fill=(214, 214, 214), width=7)
        tx, ty = f.p(x, crown)
        d.text((tx - 70, ty - 34), f'{who}  {hh:.0f}px', fill=(244, 244, 244))
        d.text((tx - 70, ty - 14), role, fill=(232, 212, 190))

    facts = [
        f'BAR CLUSTER STAGING GUIDE -- room box x {rect[0]}-{rect[2]} y {rect[1]}-{rect[3]}, drawn at {f.s:.3f}x',
        f'camera h(y) = {K} (y - {EYE:.0f})',
        f'the counter runs (1900, 838) to (1240, 505): a man at the near end is {h(838):.0f} px, at the far end {h(505):.0f} px',
        f'its top edge is 1.10 m at every depth -- y {nt:.0f} at x 1900, y {ft:.0f} at x 1240',
        'THREE PATRONS, THREE DIFFERENT RELATIONSHIPS TO THE BAR. Its far end meets the foot of the stairs.',
    ]
    for i, line in enumerate(facts):
        d.text((12, 12 + i * 20), line, fill=(250, 250, 250))
    return img, {'rect': rect, 'scale': f.s, 'nearEnd': near, 'farEnd': far, 'groundA': A,
                 'counterTop': {'x1900': round(nt), 'x1240': round(ft)}}


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else 'card'
    img, rec = {'card': card_guide, 'bar': bar_guide}[which]()
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f'{which}-cluster-guide.png')
    (OUT / f'{which}-cluster-guide.json').write_text(json.dumps(rec, indent=1) + '\n')
    for k, v in rec.items():
        print(f'  {k}: {v}')
    print(f'wrote {OUT / f"{which}-cluster-guide.png"}')


if __name__ == '__main__':
    main()
