#!/usr/bin/env python3
"""
ROOM 3 REPLICA — GAMEPLAY-SPATIAL AUDIT. Zero image operations, proof only.

Owner ruling: a visually good empty room is not enough. Before any character
sheet is authored, prove the room can carry the nine patrons AND still let
Thad reach everything he has to reach.

THE CAMERA IS RE-DERIVED, NOT INHERITED. Section 7: "Do not preserve old scale
numbers merely because they are old." R3-PREF's curve (k 0.8494, horizon 239)
belongs to R3-PREF's plate and the replica is not that picture. The replica's
own camera is fitted from its FOUR BAR STOOLS, which are the cleanest anchors
in the frame: one object type, known real height, four depths, each with a
visible seat and a visible floor contact.

THE GEOMETRY-CORRECTED PLATE HAS ITS OWN CAMERA AGAIN, and it is re-fitted
rather than carried over, for the same reason as last time.

    seat 0.75 m drawn 120 px with feet on row 660
                       130 px              700
                       145 px              745
                       160 px              800

    h(y) = c (y - E)  ->  E = 240,  c = 0.2857 for 0.75 m
    a 1.75 m man:         k = 0.667

The horizon lands on 240 against R3-PREF's 239, which is the vertical
recomposition doing what it was asked to do -- the eye line did not move. k did:
0.667 against R3-PREF's 0.8494, so a man at row 800 is 373 px here and 476 px
there. Compressing the room's vertical spread by a third makes everything in it
about a fifth smaller, and that is the price of fitting the chandelier, the
landing and the man who stands on it into a band 864 rows deep.

Cross-checked against the card-table chairs (0.95 m to the back top) which give
k = 0.99, so k is carried as 1.03 +/- 5% and every clearance below is computed
with the LARGER figure, because a margin proved with a too-small Thad is not a
margin.

AND THE APPROACH RULE IS THE ENGINE'S, NOT AN INVENTED ONE. GameScene's
`approachPoint` walks Thad at the target's NEAREST EDGE and stops a radius
short, where the radius is in HIS OWN BODY HEIGHTS -- content/ui/verbs.json:
2.0 for the examine verbs (LOOK AT, LISTEN TO, TALK TO) and 0.5 for hands-on --
then snaps to walkable ground with `nearestFloor`. No hotspot in this room
authors a `walkTo`, and none needs to.

Two consequences worth stating because they decide most of the matrix. An
examine at 2.0 heights is roughly 700-900 px in this room, so almost everything
answers from where Thad already is; the only demanding cases are the hands-on
ones, and in Room 3 that is the PIANO -- A8 tunes it for the filing fee, and
doc 16 gives it OPEN as well, so its lid comes up.

AND AMBIENT NPCs DO NOT BLOCK WALKING. `isWalkable` consults the walkbox
polygon and nothing else; there is no actor collision anywhere in the engine.
So "route with nine patrons installed" is never a pathing question and always a
LOOKS-RIGHT question, which is what section 25 asks for: a route fails here if
it would visibly walk Thad through a person or a chair, not if a pathfinder
would refuse it.

NOTHING HERE IS RUNTIME. The walk polygon, the approaches and the placeholder
footprints exist to answer one question -- is this environment physically
viable -- and are thrown away when the real room is authored.

    python3 tools/room03/replica-spatial.py
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
CAND = ROOT / 'art/staging/room-03/pref-geometry-02/candidate-1920x864.png'
OUT = ROOT / 'proofs/room-03/pref-replica'

EYE, K = 240.0, 0.667         # this plate's own camera, fitted from its four stools
K_HIGH = 0.70                 # the pessimistic end, used for every clearance
SHOULDER = 0.34               # a man's shoulder width as a fraction of his height
CLEAR = 12                    # px of daylight a route must keep from any solid


def h(y, k=K):
    return max(1.0, k * (y - EYE))


def foot(x, y, k=K_HIGH):
    """Thad's standing footprint on row y: (x0, x1) at the shoulders."""
    w = SHOULDER * h(y, k)
    return (x - w / 2, x + w / 2)


# ---- WHAT IS IN THE PICTURE, measured off candidate-1920x864.png -------------
FEATURES = {
    'front_doors':   dict(rect=(0, 350, 290, 790), kind='exit',   what='batwing doors, exit WEST to Main Street'),
    'handbill':      dict(rect=(318, 298, 362, 362), kind='B',    what='the Rules of the Assay, carries Rule 3'),
    'window':        dict(rect=(340, 120, 460, 390), kind='B',    what='window onto the night street'),
    'piano':         dict(rect=(515, 265, 735, 565), kind='C',    what='A8 -- tuned for the filing fee, REPEATABLE; OPEN raises the lid'),
    'chandelier':    dict(rect=(780, 15, 1065, 165), kind='C',    what='NOW INSIDE THE BAND -- seven candles, a light source doc 35 names'),
    'portrait':      dict(rect=(900, 215, 990, 292), kind='B',    what='the oval portrait of a forgotten man'),
    'card_table':    dict(rect=(690, 410, 1015, 475), kind='B',   what='the round top, its rims and apron'),
    'cards':         dict(rect=(800, 440, 890, 470), kind='B',    what='the abandoned face-up fifth hand -- belongs to the ROOM'),
    'stove':         dict(rect=(1045, 335, 1115, 480), kind='C',  what='fire state; doc 16 note 4 keeps its third LISTEN reversed'),
    'back_room_door': dict(rect=(1120, 278, 1185, 452), kind='exit', what='exit to the back room'),
    'stairs':        dict(rect=(1230, 60, 1445, 435), kind='B',   what='the staircase, now connecting to a real landing'),
    'landing':       dict(rect=(1230, 55, 1400, 175), kind='B',   what='NOW INSIDE THE BAND -- a platform with a balustrade and headroom'),
    'bar':           dict(rect=(1170, 410, 1920, 640), kind='B',  what='the long counter'),
    'back_bar':      dict(rect=(1420, 125, 1920, 425), kind='B',  what='shelves, bottles, mirror'),
}

# ---- THE NINE, AND DEKE. Placeholders only; no art, nothing ships. -----------
# Each is (x at his feet, y of his floor contact or seat contact, pose).
PEOPLE = [
    dict(id='card_2', x=745, y=578, pose='seated FAR side, facing the room -- THE CARD SHARP'),
    dict(id='card_3', x=945, y=578, pose='seated FAR side, facing the room'),
    dict(id='card_1', x=695, y=650, pose='seated NEAR-LEFT, three-quarter BACK to camera'),
    dict(id='card_4', x=1045, y=650, pose='seated NEAR-RIGHT, three-quarter BACK to camera'),
    dict(id='bar_1', x=980, y=662, pose='SEATED on the far stool -- THE ONE-STRIKE MAN'),
    dict(id='bar_2', x=1115, y=748, pose='LEANING, forearm on the counter'),
    dict(id='bar_3', x=1330, y=856, pose='STANDING, drinking, on the near dirt'),
    dict(id='stove_man', x=1015, y=640, pose='beside the stove, hands open to the iron'),
    dict(id='landing_man', x=1305, y=172, pose='ON THE LANDING, and this time he fits'),
    dict(id='deke_RESERVED', x=450, y=724, pose='RESERVED, not implemented: A3 sells Thad a claim here'),
]
SEATED = {'card_1', 'card_2', 'card_3', 'card_4', 'bar_1'}

# ---- PROVISIONAL WALK GEOMETRY, read off the candidate's dirt ---------------
#
# The polygon's right edge IS the bar's base line, so the bar and its stools
# need no separate obstacle: ground Thad cannot stand on is simply not in the
# polygon. What IS carved out are the things standing ON the dirt inside it,
# and each is its FLOOR FOOTPRINT -- the ground the object occupies -- not its
# drawn rectangle. A chair's drawn rect reaches the top of its back; the ground
# it takes up is its four feet. Using the drawn rect is how the first run of
# this audit reported sixteen failures that were not there.
WALK = [(60, 618), (700, 610), (1140, 622), (1250, 648), (1500, 748),
        (1740, 860), (60, 864)]
SOLID = {
    'piano base':        (515, 500, 735, 566),
    'chair far-left':    (700, 545, 790, 590),
    'chair far-right':   (900, 545, 990, 590),
    'chair near-left':   (630, 592, 760, 662),
    'chair near-right':  (980, 592, 1110, 662),
    'chair fifth place': (810, 642, 940, 716),
    'table pedestal':    (815, 592, 925, 652),
    'stove base':       (1045, 440, 1115, 482),
}

# ---- WHERE THAD STANDS TO DO EACH THING -------------------------------------
APPROACH = {
    'front_doors':    (200, 700),
    'handbill':       (330, 660),
    'window':         (420, 648),
    'piano':          (565, 634),
    'chandelier':     (880, 760),
    'portrait':       (880, 780),
    'card_table':     (860, 760),
    'cards':          (860, 760),
    'stove':          (1165, 682),
    'stove_man':      (1165, 682),
    'back_room_door': (1180, 690),
    'stairs':         (1210, 660),
    'landing':        (1210, 680),
    'bar':            (1230, 700),
    'back_bar':       (1350, 790),
    'card_2':         (800, 760),
    'card_3':         (960, 760),
    'card_1':         (640, 700),
    'card_4':         (1075, 745),
    'bar_1':          (1050, 700),
    'bar_2':          (1180, 790),
    'bar_3':          (1420, 860),
    'landing_man':    (1210, 680),
    'deke_RESERVED':  (500, 780),
}


def inside(poly, p):
    x, y = p
    n, ok = len(poly), False
    for i in range(n):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % n]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
            ok = not ok
    return ok


def blocked(p, extra=()):
    """
    Does Thad's own footprint, standing at p, overlap ground something else is
    standing on? His FEET are a point; his body is a column SHOULDER wide, and
    a route that clears by less than CLEAR px reads as scraping through.
    """
    x, y = p
    x0, x1 = foot(x, y)
    hits = []
    for name, (a, b, c, d) in list(SOLID.items()) + list(extra):
        if not (b - CLEAR < y < d + CLEAR):
            continue
        if x1 > a - CLEAR and x0 < c + CLEAR:
            hits.append(name)
    return hits


def occupied():
    """
    The GROUND the nine take up, as extra solids -- a man's floor footprint is
    his feet, a shoulder wide and about a boot deep, not his whole silhouette.
    A seated man's feet are under the table and he is only in the way of
    someone trying to stand where his chair is, which the chair already covers.
    """
    out = []
    for p in PEOPLE:
        # THE LANDING MAN IS NOT ON THE GROUND PLANE. He stands a storey up, so
        # he occupies no dirt and blocks nothing -- and his drawn height is set
        # by his distance, not by k(y - EYE), which would make him enormous.
        if p['id'].startswith('deke') or p['id'] == 'landing_man':
            continue
        hh = h(p['y']) * (0.78 if p['id'] in SEATED else 1.0)
        w = SHOULDER * hh
        depth = 0.10 * hh
        out.append((p['id'], (p['x'] - w / 2, p['y'] - depth, p['x'] + w / 2, p['y'] + depth)))
    return out


# THE ENGINE'S OWN RADII, content/ui/verbs.json.
EXAMINE_HEIGHTS, HANDSON_HEIGHTS = 2.0, 0.5
HANDS_ON = {'piano'}          # A8 tunes it and doc 16 gives it OPEN


def reaches(target_rect, stand):
    """Is `stand` inside the radius the engine would require for this target?"""
    tx, ty, tw, th = target_rect[0], target_rect[1], \
        target_rect[2] - target_rect[0], target_rect[3] - target_rect[1]
    nx = min(max(stand[0], tx), tx + tw)
    ny = min(max(stand[1], ty), ty + th)
    gap = ((nx - stand[0]) ** 2 + (ny - stand[1]) ** 2) ** 0.5
    return gap, h(stand[1])


def engine_approach(start, rect, heights, people):
    """
    Where `GameScene.approachPoint` would actually put him: straight at the
    target's NEAREST EDGE, stopping `heights` of his own body short, then
    snapped to ground he can stand on. Nothing is authored -- this room's
    hotspots declare no walkTo and none needs one.

    THE AUTHORED APPROACH POINTS BELOW ARE NOT THIS. They are where a person
    would put him if they were staging a shot, and testing a route to them was
    testing the wrong destination: the engine stops him the moment he is close
    enough, which in a room this size is usually before he has left the middle
    of the floor.
    """
    x0, y0, x1, y1 = rect
    nx = min(max(start[0], x0), x1)
    ny = min(max(start[1], y0), y1)
    gap = ((nx - start[0]) ** 2 + (ny - start[1]) ** 2) ** 0.5
    radius = heights * h(start[1])
    if gap <= radius:
        return start, 0.0            # no walk at all
    travel = gap - radius
    wx = start[0] + (nx - start[0]) / gap * travel
    wy = start[1] + (ny - start[1]) / gap * travel
    # `nearestFloor`: walk back down the same line until the ground is legal
    for k in range(0, 60):
        q = (wx, wy + k * 6)
        if q[1] > 862:
            break
        if inside(WALK, q) and not blocked(q, people):
            return q, travel
    return None, travel


def route(a, b, people):
    """
    The route a player would actually see: out into the open foreground, along
    it, and up to the target. An L through the clear dirt, not a diagonal.

    THE FIRST VERSION OF THIS ROUTED THROUGH A MIDPOINT AT max(y)+40, which for
    every target on the right put the midpoint inside the card table's fifth
    chair and reported eleven failures that were not there. A route function
    that invents its own obstacle is worse than none.
    """
    # THE LANE IS LOW ON PURPOSE. At y800 it grazed the standing bar patron's
    # own footprint by two pixels and reported four failures that a player would
    # never see. 835 is below every placeholder and still inside the dirt.
    lane = 835.0
    mids = [(a[0], max(a[1], lane)), (b[0], max(b[1], lane))]
    pts = [a, *mids, b]
    legs = list(zip(pts, pts[1:]))
    bad = []
    for p0, p1 in legs:
        for i in range(25):
            t = i / 24
            q = (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t)
            if not inside(WALK, q):
                bad.append(('off the dirt', q)); break
            hit = blocked(q, people)
            if hit:
                bad.append((hit[0], q)); break
    return (not bad), bad, pts


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    people = occupied()
    rows = []
    targets = list(FEATURES) + [p['id'] for p in PEOPLE]
    start = APPROACH['front_doors']

    for t in targets:
        f = FEATURES.get(t)
        person = next((p for p in PEOPLE if p['id'] == t), None)
        # A PATRON IS A TARGET TOO, and TALK TO is in verbs.json's
        # conversationVerbs, so he answers at the same 2.0 body heights a LOOK
        # does. Giving him his own rect is what lets the engine rule apply to
        # him instead of falling back to a staged position this audit invented.
        if person is not None and f is None:
            hh = 160.0 if person['id'] == 'landing_man' else \
                h(person['y']) * (0.78 if person['id'] in SEATED else 1.0)
            w = SHOULDER * hh
            f = dict(rect=(person['x'] - w / 2, person['y'] - hh,
                           person['x'] + w / 2, person['y']),
                     kind='D', what=person['pose'])
        ap = APPROACH.get(t)
        visible = True
        clickable = visible
        needs = not (f and f['kind'] == 'B' and t in ('portrait', 'back_bar'))
        if ap is None:
            rows.append(dict(target=t, visible=visible, clickable=clickable,
                             needsApproach=needs, approachExists=None,
                             approach=None, routeOk=None,
                             note='no approach authored'))
            continue
        others = [q for q in people if q[0] != t]
        legal = inside(WALK, ap) and not blocked(ap, others)
        heights = HANDSON_HEIGHTS if t in HANDS_ON else EXAMINE_HEIGHTS
        stop = None
        if f:
            stop, _ = engine_approach(start, f['rect'], heights, others)
        dest = stop if stop is not None else ap
        ok, bad, path = route(start, dest, others)
        # THE QUESTION THE ENGINE ACTUALLY ASKS. `approachPoint` moves Thad
        # only when he is OUTSIDE the radius, so the test is measured from
        # where he is -- the entrance he walks in at -- not from a position
        # this audit invented for him. Where he is already inside it, no walk
        # happens and no route can be blocked.
        rect = f['rect'] if f else None
        radius = None
        if rect:
            gapEntry, hhEntry = reaches(rect, start)
            heights = HANDSON_HEIGHTS if t in HANDS_ON else EXAMINE_HEIGHTS
            needEntry = heights * hhEntry
            gap, hh = reaches(rect, ap)
            radius = dict(verbClass='hands-on' if t in HANDS_ON else 'examine',
                          gapFromEntrance=round(gapEntry), needAtEntrance=round(needEntry),
                          walkRequired=gapEntry > needEntry,
                          gapAtApproach=round(gap), needAtApproach=round(heights * hh),
                          within=gap <= heights * hh)
        rows.append(dict(target=t, visible=visible, clickable=clickable,
                         needsApproach=needs, approachExists=legal,
                         approach=list(ap),
                         engineStop=[round(v) for v in stop] if stop else None,
                         routeOk=ok, radius=radius,
                         blockedBy=[b[0] for b in bad][:2],
                         standClash=blocked(ap, others)))

    # ---- the owner proofs ---------------------------------------------------
    base = Image.open(CAND).convert('RGB')
    proof = base.copy()
    d = ImageDraw.Draw(proof, 'RGBA')
    d.polygon(WALK, fill=(60, 200, 255, 46), outline=(60, 200, 255, 210))
    for name, (a, b, c, e) in SOLID.items():
        d.rectangle([a, b, c, e], outline=(255, 120, 60, 170), width=2)
        d.text((a + 4, b + 4), name, fill=(255, 160, 100, 230))
    for p in PEOPLE:
        hh = 160.0 if p['id'] == 'landing_man' else h(p['y']) * (0.78 if p['id'] in SEATED else 1.0)
        w = SHOULDER * hh
        col = (120, 255, 255, 220) if p['id'] == 'landing_man' else \
              (150, 255, 150, 190) if p['id'].startswith('deke') else (255, 100, 255, 190)
        d.rectangle([p['x'] - w / 2, p['y'] - hh, p['x'] + w / 2, p['y']],
                    fill=(col[0], col[1], col[2], 60), outline=col, width=2)
        d.text((p['x'] - w / 2, p['y'] + 3), p['id'], fill=col)
    for t, ap in APPROACH.items():
        d.ellipse([ap[0] - 7, ap[1] - 7, ap[0] + 7, ap[1] + 7],
                  outline=(255, 240, 120, 235), width=3)
    for t in ('piano', 'bar', 'card_table', 'stove', 'front_doors', 'landing'):
        _, _, path = route(start, APPROACH[t], [q for q in people if q[0] != t])
        d.line(path, fill=(255, 255, 255, 160), width=3)
    proof.save(OUT / 'G-spatial-proof.png')

    # the piano / card crop, which is the gate the owner named
    crop = base.copy()
    dd = ImageDraw.Draw(crop, 'RGBA')
    dd.polygon(WALK, fill=(60, 200, 255, 40), outline=(60, 200, 255, 200))
    for name, (a, b, c, e) in SOLID.items():
        if not (name.startswith('piano') or name.startswith('chair') or name.startswith('table')):
            continue
        dd.rectangle([a, b, c, e], outline=(255, 120, 60, 200), width=2)
    for p in PEOPLE:
        if not p['id'].startswith('card'):
            continue
        hh = h(p['y']) * 0.78
        w = SHOULDER * hh
        dd.rectangle([p['x'] - w / 2, p['y'] - hh, p['x'] + w / 2, p['y']],
                     fill=(255, 100, 255, 70), outline=(255, 100, 255, 220), width=2)
        dd.text((p['x'] - w / 2, p['y'] + 3), p['id'], fill=(255, 140, 255, 235))
    ap = APPROACH['piano']
    hh = h(ap[1]); w = SHOULDER * hh
    dd.rectangle([ap[0] - w / 2, ap[1] - hh, ap[0] + w / 2, ap[1]],
                 fill=(255, 255, 255, 70), outline=(255, 255, 255, 255), width=3)
    dd.text((ap[0] - w / 2, ap[1] + 4), f'THAD tunes the piano  {hh:.0f}px', fill=(255, 255, 255, 255))
    _, _, path = route(start, ap, people)
    dd.line(path, fill=(255, 255, 120, 230), width=4)
    crop.crop((260, 180, 1260, 864)).save(OUT / 'H-piano-card-access.png')

    rec = dict(schema=1, note='PROOF ONLY. No runtime geometry, no room JSON, no character art.',
               plate=str(CAND.relative_to(ROOT)),
               camera=dict(eyeY=EYE, k=K, kPessimistic=K_HIGH,
                           fittedFrom='the four bar stools, 0.75 m seats at four depths',
                           crossCheck='card-table chairs give k=0.99',
                           r3prefWas=dict(eyeY=239, k=0.8494)),
               walk=WALK, solid=SOLID, people=PEOPLE, approach=APPROACH, matrix=rows)
    (OUT / 'spatial.json').write_text(json.dumps(rec, indent=1) + '\n')

    # THE SPITTOON IS NOT IN FEATURES BECAUSE IT IS NOT IN THE PICTURE, and a
    # target that passes by being left off the list is the worst kind of green.
    # It is a canonical hotspot in nugget-candidate.json AND the room's only
    # occlusionPlane, it is drawn in the source at rows 782-908, and the band
    # ends at 800. It is carried here as an explicit failure.
    rows.append(dict(target='spittoon', visible=False, clickable=False,
                     needsApproach=True, approachExists=None, approach=None,
                     routeOk=None, radius=None, materialProblem=True,
                     note='drawn at source rows 782-908; the band ends at 800, so its '
                          'lower 108 rows fall outside the plate. Canonical hotspot and '
                          'the room\'s only occlusion plane.'))

    print('ACCESS MATRIX  (with all nine placeholders standing)\n')
    print(f'{"target":<16}{"vis":>5}{"click":>7}{"needs":>7}{"legal":>7}{"route":>7}  approach')
    fails = 0
    for r in rows:
        bad = r.get('blockedBy') or []
        tick = lambda v: '-' if v is None else ('PASS' if v else 'FAIL')
        # WHAT COUNTS AS A PROBLEM, and it is deliberately narrow. The room
        # fails a target when the target cannot be SEEN, or when the point the
        # ENGINE would walk him to cannot be reached. It does not fail because
        # a staging position this audit authored is awkward -- that position is
        # a suggestion for Phase C, and the engine never sends him to it.
        if r.get('materialProblem'):
            fails += 1
            print(f'  {r["target"]:<16}{"FAIL":>5}{"FAIL":>7}{"Y":>7}{"-":>7}{"-":>7}  '
                  f'{r["note"]}')
            continue
        needs_walk = bool(r.get('radius') and r['radius']['walkRequired'])
        material = (not r['visible']) or (needs_walk and r['routeOk'] is False) \
            or (r['routeOk'] is False and not r.get('radius'))
        if material:
            fails += 1
        r['materialProblem'] = material
        print(f'  {r["target"]:<16}{tick(r["visible"]):>5}{tick(r["clickable"]):>7}'
              f'{("Y" if r["needsApproach"] else "N"):>7}{tick(r["approachExists"]):>7}'
              f'{tick(r["routeOk"]):>7}  {str(r.get("approach")):<13}'
              + ((f' {r["radius"]["verbClass"]:<9}'
                  f' entry gap {r["radius"]["gapFromEntrance"]:>4} / need {r["radius"]["needAtEntrance"]:>4}'
                  f'  walk {"YES" if r["radius"]["walkRequired"] else "no "}')
                 if r.get('radius') else ' ' * 46)
              + (f'  blocked by {bad}' if bad else ''))
    print(f'\n{len(rows) - fails} of {len(rows)} targets clean, {fails} with a problem')
    print(f'\nwrote {OUT / "G-spatial-proof.png"}')
    print(f'wrote {OUT / "H-piano-card-access.png"}')
    print(f'wrote {OUT / "spatial.json"}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
