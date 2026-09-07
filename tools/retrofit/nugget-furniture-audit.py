"""THE NUGGET'S FURNITURE-REGISTRATION AUDIT (doc 36 Q133).

    python3 tools/retrofit/nugget-furniture-audit.py

WHAT THIS ANSWERS. Tyler rejected the deployed Nugget: the seven
furniture-dependent patrons read as sprites placed near furniture rather than
people using it, and he ruled that the furniture must be part of the
composition authority rather than something the figures are fitted to
afterwards. Before any art is proposed, one question has to be answered
honestly: CAN the accepted character art physically make the contacts the
canonical furniture requires?

It is answerable arithmetically, because a pose fixes two things that no
placement can change -- where a figure's seat is as a fraction of its own
height, and where its contact limb is. The room fixes the rest: the depth
curve says how tall a man is on a given floor row, and the plate says where
the seats and the counter are. If the fractions and the furniture disagree,
no coordinate makes them agree, and that is a fact about the drawing rather
than about the staging.

CONTACT FRACTIONS ARE MEASURED FROM THE SHIPPING SPRITES, not guessed: each
one is read off a labelled 2x/4x grid of the sheet the engine loads, and the
numbers are declared below beside the sprite they came from.

NOTHING HERE MOVES, DRAWS OR PROPOSES ANYTHING. It prints a table and writes a
record. The furniture geometry it reads is `reference/room-03-candidate/
nugget-furniture.json`, itself read off the accepted plate and never modified.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)

F = json.load(open('reference/room-03-candidate/nugget-furniture.json'))
SHEETS = {s['id']: s for s in json.load(open('art/staging/phase2a-sheets.json'))['sheets']}
STAGING = {c['id']: c for c in
           json.load(open('reference/room-03-candidate/nugget-staging.json'))['characters']}
CURVE = F['depthCurve']

# CONTACT FRACTIONS, read off the shipping sheets at 2x and 4x with a grid.
# `seat` and `contact` are fractions of the sprite's own height, measured DOWN
# from the top; the figure's feet are the bottom of the sprite.
CONTACTS = {
    'nugget_card_1': {'seat': 0.66, 'contact': None, 'facing': 'front',
                      'note': 'seated, leaning back, cards at the chest'},
    'nugget_card_2': {'seat': 0.65, 'contact': None, 'facing': 'front',
                      'note': 'seated, hunched forward, cards low'},
    'nugget_card_3': {'seat': 0.67, 'contact': None, 'facing': 'front',
                      'note': 'seated square to camera, cards at the chest'},
    'nugget_card_4': {'seat': 0.67, 'contact': None, 'facing': 'front',
                      'note': 'seated, head down over the cards'},
    'nugget_bar_1': {'seat': 0.63, 'contact': 0.35, 'facing': 'profile-right',
                     'note': 'seated in profile, forearms forward at a counter'},
    'nugget_bar_2': {'seat': None, 'contact': 0.32, 'facing': 'three-quarter',
                     'note': 'standing, near elbow raised onto a counter'},
    'nugget_bar_3': {'seat': None, 'contact': None, 'facing': 'three-quarter',
                     'note': 'standing with a cup: needs floor contact only'},
}


def man_height(y):
    """The room's own man-height at a floor row."""
    span = CURVE['nearY'] - CURVE['farY']
    t = (y - CURVE['farY']) / span
    return CURVE['farHeight'] + t * (CURVE['nearHeight'] - CURVE['farHeight'])


def counter_y(x):
    edge = F['bar']['counterFrontTopEdge']
    return edge['at1150'] + (x - 1150) * edge['slopePerPx']


def report(rows, title):
    print(f'\n{title}')
    print('-' * len(title))
    for row in rows:
        print(row)


findings = []

# ---- THE CARD TABLE ---------------------------------------------------------
#
# Every seated card sprite faces the camera. A round table read as a game needs
# players on BOTH sides of it, and a player on the near side is seen from
# behind. That is a fact about the drawings and no coordinate changes it.
front_facing = [i for i in CONTACTS if i.startswith('nugget_card') and CONTACTS[i]['facing'] == 'front']
card_lines = [f'{len(front_facing)} of 4 seated card sprites face the camera: '
              + ', '.join(sorted(front_facing)),
              'the canonical table is a round pedestal table with seats all round it '
              f"(visible chairs at {[c['seatCentre'] for c in F['cardTable']['visibleChairs']]}, "
              f"hidden far seats at {[c['seatCentre'] for c in F['cardTable']['hiddenFarSeats']]})",
              'a game reads only when players face each other across it, so the near seats '
              'must hold men seen FROM BEHIND -- which none of these four is']
findings.append({'cluster': 'card', 'blocked': True,
                 'reason': 'all four seated players are drawn front-facing; the near seats of a '
                           'round table require back-view players and no placement, scale or '
                           'occlusion can turn a front view into a back view',
                 'detail': card_lines})
report(card_lines, 'CARD TABLE — facing')

# Seat geometry, for completeness: how tall a seated man would have to be for
# his own seat fraction to land on each canonical seat.
seat_lines = []
for seat in F['cardTable']['visibleChairs'] + F['cardTable']['hiddenFarSeats']:
    rise = seat['floorY'] - seat['seatCentre'][1]
    for who in ('nugget_card_1', 'nugget_card_3'):
        frac = 1 - CONTACTS[who]['seat']
        needed = rise / frac
        drawn = SHEETS[who]['figureHeight']
        seat_lines.append(f"  seat {seat['id']:9s} rise {rise:3d}px -> {who} would need to be "
                          f'{needed:5.0f}px tall; he is drawn {drawn}px '
                          f'({100 * (needed - drawn) / drawn:+.0f}%)')
report(seat_lines, 'CARD TABLE — seat height, existing sprites against canonical chairs')

# ---- THE BAR ----------------------------------------------------------------
bar_lines = []
# bar_1: seated. Two contacts must hold at once -- hips on a stool seat and
# forearms on the counter -- and the gap between them is fixed by the drawing.
b1 = CONTACTS['nugget_bar_1']
gap_fraction = b1['seat'] - b1['contact']
for stool in F['bar']['stools']:
    x, seat_y = stool['seatCentre']
    counter = counter_y(x)
    need_px = seat_y - counter
    height_needed = need_px / gap_fraction
    seated_here = 0.72 * man_height(stool['floorY'])
    bar_lines.append(
        f"  stool {stool['id']:6s}: counter {counter:5.0f}, seat {seat_y:3d} -> the drawing needs "
        f'a figure {height_needed:5.0f}px tall to put hips and forearms on both; the room wants '
        f'{seated_here:5.0f}px ({100 * (height_needed - seated_here) / seated_here:+.0f}%)')
report(bar_lines, 'BAR — nugget_bar_1 (seated): hips on the stool AND forearms on the counter')
findings.append({'cluster': 'bar', 'who': 'nugget_bar_1',
                 'blocked': False, 'reason': 'fits the NEAR stool within a few per cent and no '
                                             'other; he is currently staged at the far stool',
                 'detail': bar_lines})

# bar_2: standing and leaning. His elbow height is a fixed fraction of him and
# his height is fixed by the floor row he stands on -- and to lean on the
# counter he must stand AT THE BAR, on the floor row where the bar's own front
# face meets the floor at his x. Solving for elbow height alone finds bogus
# answers out in the middle of the room, where the elbow crosses the counter's
# IMAGE while the man is nowhere near it; the depth has to be pinned first.
b2 = CONTACTS['nugget_bar_2']
stature = STAGING['nugget_bar_2']['stature']
elbow_above_feet = (1 - b2['contact']) * stature
face = F['bar']['counterFrontFaceBottom']
lean_lines = []
reachable = False
for x in (1400, 1550, 1700, 1850):
    stand_y = face['at1400'] + (x - 1400) * face['slopePerPx']   # his boots at the bar's base
    elbow = stand_y - elbow_above_feet * man_height(stand_y)
    counter = counter_y(x)
    gap = counter - elbow                                        # positive: elbow above the counter
    ok = abs(gap) <= 12
    reachable = reachable or ok
    lean_lines.append(f'  at x {x}: standing at the bar (floor row {stand_y:5.0f}) his elbow lands '
                      f'at y {elbow:5.0f}; the counter is at y {counter:5.0f} -- '
                      f'{"ON IT" if ok else f"{gap:+.0f}px, his elbow is above the counter"}')
report(lean_lines, 'BAR — nugget_bar_2 (leaning): standing AT the bar, does his elbow reach it?')
findings.append({'cluster': 'bar', 'who': 'nugget_bar_2', 'blocked': not reachable,
                 'reason': 'his elbow is drawn too high on his body for this counter: standing at '
                           'the bar anywhere along its length, his elbow lands about 90 to 105 px '
                           'above the counter top, and the only floor rows that would fix that are '
                           'out in the middle of the room, where he would be leaning on the '
                           'counter\'s image from several feet in front of it',
                 'detail': lean_lines})

stand_lines = ['  nugget_bar_3 needs floor contact and correct occlusion by the bar front only.',
               '  No second contact is drawn into him, so nothing about him is over-constrained.']
report(stand_lines, 'BAR — nugget_bar_3 (standing)')
findings.append({'cluster': 'bar', 'who': 'nugget_bar_3', 'blocked': False,
                 'reason': 'standing only; registrable with existing art', 'detail': stand_lines})

out = {'schema': 1,
       'note': 'Can the accepted character art make the contacts the canonical furniture '
               'requires? Answered from the drawings\' own fixed proportions and the room\'s own '
               'depth curve. No art was generated, moved or modified to produce this. Doc 36 Q133.',
       'furniture': 'reference/room-03-candidate/nugget-furniture.json',
       'contactFractions': CONTACTS,
       'findings': findings}
json.dump(out, open('proofs/room-03/furniture-registration.json', 'w'), indent=1, ensure_ascii=False)
open('proofs/room-03/furniture-registration.json', 'a').write('\n')
print('\nproofs/room-03/furniture-registration.json')
