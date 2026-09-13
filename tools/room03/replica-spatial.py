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

    seat 0.75 m drawn 160 px with feet on row 640
                       200 px              727
                       233 px              820

    h(y) = c (y - E)  ->  E = 292,  c = 0.460 for 0.75 m
    a 1.75 m man:         k = 0.460 * 1.75/0.75 = 1.073

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
CAND = ROOT / 'art/staging/room-03/pref-replica-02/candidate-1920x864.png'
OUT = ROOT / 'proofs/room-03/pref-replica'

EYE, K = 292.0, 1.03          # the replica's own camera, fitted from its stools
K_HIGH = 1.073                # the pessimistic end, used for every clearance
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
    'front_doors':   dict(rect=(0, 200, 290, 780), kind='exit',   what='batwing doors, exit WEST to Main Street'),
    'handbill':      dict(rect=(300, 220, 350, 300), kind='B',    what='the Rules of the Assay, carries Rule 3'),
    'window':        dict(rect=(360, 60, 620, 390), kind='B',     what='window onto the night street'),
    'piano':         dict(rect=(500, 210, 730, 570), kind='C',    what='A8 -- tuned for the filing fee, REPEATABLE; OPEN raises the lid'),
    'portrait':      dict(rect=(830, 100, 930, 240), kind='B',    what='the oval portrait of a forgotten man'),
    'card_table':    dict(rect=(790, 350, 1100, 440), kind='B',   what='the round top, its rims and apron'),
    'cards':         dict(rect=(900, 385, 990, 415), kind='B',    what='the abandoned face-up fifth hand -- belongs to the ROOM'),
    'stove':         dict(rect=(1130, 230, 1200, 450), kind='C',  what='fire state; doc 16 note 4 keeps its third LISTEN reversed'),
    'back_room_door': dict(rect=(1210, 150, 1290, 430), kind='exit', what='exit to the back room'),
    'stairs':        dict(rect=(1290, 0, 1490, 390), kind='B',    what='the staircase; its LANDING is above the frame'),
    'bar':           dict(rect=(1255, 370, 1920, 700), kind='B',  what='the long counter, its far end now structurally resolved'),
    'back_bar':      dict(rect=(1500, 120, 1920, 400), kind='B',  what='shelves, bottles, mirror'),
}

# ---- THE NINE, AND DEKE. Placeholders only; no art, nothing ships. -----------
# Each is (x at his feet, y of his floor contact or seat contact, pose).
PEOPLE = [
    dict(id='card_2', x=840, y=560, pose='seated FAR side on the far-left chair, facing the room -- THE CARD SHARP'),
    dict(id='card_3', x=1020, y=560, pose='seated FAR side on the far-right chair, facing the room'),
    dict(id='card_1', x=778, y=632, pose='seated NEAR-LEFT, three-quarter BACK to camera'),
    dict(id='card_4', x=1112, y=632, pose='seated NEAR-RIGHT, three-quarter BACK to camera'),
    dict(id='bar_1', x=1290, y=642, pose='SEATED on the far stool -- THE ONE-STRIKE MAN'),
    dict(id='bar_2', x=1332, y=722, pose='LEANING, forearm on the counter, feet on the dirt'),
    dict(id='bar_3', x=1500, y=845, pose='STANDING, drinking, on the near dirt'),
    dict(id='stove_man', x=1098, y=602, pose='beside the stove, hands open to the iron'),
    dict(id='landing_man', x=1390, y=120, pose='ON THE LANDING -- see the failure note'),
    dict(id='deke_RESERVED', x=560, y=706, pose='RESERVED, not implemented: A3 sells Thad a claim here'),
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
WALK = [(140, 590), (700, 588), (1180, 600), (1258, 624), (1420, 744),
        (1580, 864), (140, 864)]
SOLID = {
    'piano base':        (490, 520, 748, 582),
    'chair far-left':    (795, 530, 885, 575),
    'chair far-right':   (975, 530, 1065, 575),
    'chair near-left':   (715, 575, 840, 645),
    'chair near-right': (1050, 575, 1175, 645),
    'chair fifth place': (885, 630, 1015, 710),
    'table pedestal':    (890, 575, 1005, 625),
    'stove base':       (1125, 400, 1205, 465),
}

# ---- WHERE THAD STANDS TO DO EACH THING -------------------------------------
APPROACH = {
    'front_doors':    (210, 700),
    'handbill':       (330, 660),
    'window':         (470, 640),
    'piano':          (628, 636),
    'portrait':       (880, 760),
    'card_table':     (945, 742),
    'cards':          (945, 742),
    'card_2':         (900, 742),
    'card_1':         (700, 690),
    'card_3':         (1030, 742),
    'card_4':         (1200, 742),
    'stove':          (1240, 700),
    'stove_man':      (1240, 700),
    'back_room_door': (1250, 712),
    'stairs':         (1290, 732),
    'bar':            (1350, 762),
    'bar_1':          (1288, 722),
    'bar_2':          (1400, 790),
    'bar_3':          (1560, 862),
    'back_bar':       (1420, 820),
    'deke_RESERVED':  (640, 760),
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
        if person is not None and f is None and person['id'] != 'landing_man':
            hh = h(person['y']) * (0.78 if person['id'] in SEATED else 1.0)
            w = SHOULDER * hh
            f = dict(rect=(person['x'] - w / 2, person['y'] - hh,
                           person['x'] + w / 2, person['y']),
                     kind='D', what=person['pose'])
        ap = APPROACH.get(t)
        visible = True
        if person and person['id'] == 'landing_man':
            visible = False
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
        hh = h(p['y']) * (0.78 if p['id'] in SEATED else 1.0)
        w = SHOULDER * hh
        col = (255, 90, 90, 200) if p['id'] == 'landing_man' else \
              (150, 255, 150, 190) if p['id'].startswith('deke') else (255, 100, 255, 190)
        d.rectangle([p['x'] - w / 2, p['y'] - hh, p['x'] + w / 2, p['y']],
                    fill=(col[0], col[1], col[2], 60), outline=col, width=2)
        d.text((p['x'] - w / 2, p['y'] + 3), p['id'], fill=col)
    for t, ap in APPROACH.items():
        d.ellipse([ap[0] - 7, ap[1] - 7, ap[0] + 7, ap[1] + 7],
                  outline=(255, 240, 120, 235), width=3)
    for t in ('piano', 'bar', 'card_table', 'stove', 'front_doors'):
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
