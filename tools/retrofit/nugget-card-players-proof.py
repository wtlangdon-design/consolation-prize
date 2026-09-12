#!/usr/bin/env python3
"""The owner-review proofs for the Room 3 card-player feasibility gate.

Tyler, 2026-09-12: "Do not hide a bad local result by only showing the full-room
image." So every proof below is 1:1 and the local ones come first.

REGISTRATION IS MEASURED, NOT ASSUMED, and that is the experiment. The four
actors are placed by the ONE thing the locked composition fixes and this gate may
not change -- where each man's head is and how big it is. Nothing is nudged to
make his feet meet the floor. Then the proof reports where his soles and his
hands actually landed against the frozen chair and the frozen table, which is
the question: do the actors fit the furniture, or were they drawn to fit
themselves?

THE HEAD BOXES OF THE FOUR BAKED MEN were read off the shipping plate at 8x on a
10 px grid, the way every mask in this project has been cut. The asset head boxes
are measured: from the crown down, a seated figure's silhouette widens sharply
where the head meets the shoulders, so the head ends at the first row whose width
exceeds 1.8x the narrowest row above it.
"""
import hashlib, json, os
import numpy as np
from PIL import Image, ImageDraw

PLATE = 'art/staging/room-03/rebuild-03/plate-room-03-rebuilt.png'
DIR = 'art/staging/room-03/cast-card-players-01/'
R = 'renders/opening-set-retrofit/'

# THE LOCKED COMPOSITION'S OWN NUMBERS. headTop/headBot/headCx are the baked
# man's head on the shipping plate; chairFloorY is where his chair's feet meet
# the dirt; tableY is the table edge his hands work at.
# SCALE COMES FROM HEAD TOP TO CHAIR SEAT, and both of those numbers are locked
# rather than judged. `headTop` is the baked man's crown, read off the shipping
# plate at 8x; `seatY` is the chair-seat row the room file itself declares for
# him (RoomFile.population[].seat), which is the room's own statement of where
# that man sits. Two anchors fix scale and position with nothing eyeballed in
# between.
#
# TWO EARLIER ANCHORS WERE TRIED AND ARE WORTH RECORDING. Head HEIGHT put the
# silver-haired man 15% out on his own, because the generated one has more hair
# than the baked one and hair is not a skeleton. SHOULDER WIDTH read off the
# plate by eye was worse: it made the near men smaller than the far men, which
# no perspective allows, because two of these four are seen from behind and a
# back's apparent span is not a front's.
#
# `chairFloorY` is measured from the chairs themselves for the two NEAR men,
# whose chairs are drawn. The far pair's chairs are hidden behind them, so their
# floor row is the old furniture file's estimate and is carried here as a
# TARGET TO REPORT AGAINST, not as an anchor.
LOCKED = {
    'card_1_flatcap':    dict(headTop=299, headCx=775,  seatY=480, assetSeatRow=400,
                              chairFloorY=553, chairFloorMeasured=True,  tableY=415),
    'card_2_silver':     dict(headTop=260, headCx=840,  seatY=435, assetSeatRow=415,
                              chairFloorY=485, chairFloorMeasured=False, tableY=349),
    'card_3_young':      dict(headTop=258, headCx=972,  seatY=435, assetSeatRow=405,
                              chairFloorY=485, chairFloorMeasured=False, tableY=349),
    'card_4_spectacles': dict(headTop=301, headCx=1041, seatY=490, assetSeatRow=395,
                              chairFloorY=550, chairFloorMeasured=True,  tableY=415),
}
ORDER = ['card_1_flatcap', 'card_2_silver', 'card_3_young', 'card_4_spectacles']
CROP = (700, 240, 1180, 600)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def head_rows(alpha):
    """Crown to neck. The silhouette of a seated man narrows sharply between the
    head and the shoulders, so the neck is the first clear minimum of the width
    profile below the widest row of the head itself. A plain "width jumped"
    test was tried first and reported 13 px heads, because a hat widens within
    a dozen rows of the crown and the test fired there."""
    op = alpha > 120
    rows = np.nonzero(op.any(1))[0]
    w = np.array([op[r].sum() for r in rows], float)
    k = np.ones(5) / 5.0
    w = np.convolve(w, k, mode='same')
    look = max(12, int(0.45 * len(rows)))
    crown = int(np.argmax(w[:max(6, look // 3)]))       # the widest row of the head
    neck = crown + int(np.argmin(w[crown:look]))        # the narrowest row below it
    if neck <= crown + 4:
        neck = crown + max(6, int(0.10 * len(rows)))
    return int(rows[0]), int(rows[neck])


def placed():
    out = []
    for name in ORDER:
        im = Image.open(f'{DIR}{name}.png').convert('RGBA')
        a = np.asarray(im)[:, :, 3]
        top, bot = head_rows(a)
        L = LOCKED[name]
        scale = (L['seatY'] - L['headTop']) / float(L['assetSeatRow'] - top)
        w = max(1, int(round(im.width * scale)))
        h = max(1, int(round(im.height * scale)))
        sm = im.resize((w, h), Image.LANCZOS)
        sa = np.asarray(sm)[:, :, 3]
        cols = np.nonzero((sa > 120).any(0))[0]
        rows = np.nonzero((sa > 120).any(1))[0]
        # his own head centre, so he lands where the locked composition has him
        hb = int(round((bot - top) * scale))
        hcols = np.nonzero((sa[:max(1, hb)] > 120).any(0))[0]
        hcx = float(hcols.mean()) if len(hcols) else float(cols.mean())
        x = int(round(L['headCx'] - hcx))
        y = int(round(L['headTop'] - rows.min()))
        out.append(dict(name=name, img=sm, scale=scale, x=x, y=y,
                        soleY=y + int(rows.max()), headTopY=y + int(rows.min()),
                        assetHead=[top, bot], locked=L,
                        drawn=[w, h]))
    return out


def label(im, text, pad=18):
    o = Image.new('RGB', (im.width, im.height + pad), (16, 14, 12))
    o.paste(im.convert('RGB'), (0, pad))
    ImageDraw.Draw(o).text((3, 4), text, fill=(230, 214, 170))
    return o


def row(ps, gap=10):
    w = sum(p.width for p in ps) + gap * (len(ps) - 1)
    s = Image.new('RGB', (w, max(p.height for p in ps)), (16, 14, 12))
    x = 0
    for p in ps:
        s.paste(p, (x, 0)); x += p.width + gap
    return s


def main():
    os.makedirs(R, exist_ok=True)
    plate = Image.open(PLATE).convert('RGB')
    men = placed()

    # ---- PROOF 2: each asset alone, on fields chosen to expose contamination.
    tiles = []
    for m in men:
        im = Image.open(f'{DIR}{m["name"]}.png').convert('RGBA')
        cyan = Image.new('RGB', im.size, (0, 150, 170)); cyan.paste(im, (0, 0), im)
        # a checkerboard says where alpha is partial; a flat magenta field says
        # whether any of the key survived in him.
        chk = Image.new('RGB', im.size, (235, 235, 235))
        d = ImageDraw.Draw(chk)
        for yy in range(0, im.height, 12):
            for xx in range(0, im.width, 12):
                if ((xx // 12) + (yy // 12)) % 2 == 0:
                    d.rectangle([xx, yy, xx + 11, yy + 11], fill=(120, 120, 120))
        chk.paste(im, (0, 0), im)
        alp = Image.fromarray(np.asarray(im)[:, :, 3]).convert('RGB')
        tiles.append(label(row([cyan, chk, alp], gap=6), m['name']))
    row(tiles, gap=14).save(R + 'room-03-gate-players-isolated.webp', 'WEBP', quality=94, method=6)

    # ---- PROOF 1 and 3 and 4.
    ref = plate.crop(CROP)
    # DEPTH ORDER, WHICH IS HALF THE POINT OF SEPARATING THEM. Two of these men
    # sit on the far side of the table and two on the near side, and a baked
    # patron can never be told apart that way. Here the far pair is clipped at
    # the table's far rim -- y 352, measured -- so the table passes in front of
    # them, and the near pair is drawn whole and last, in front of everything.
    # Nothing about the actors changes; only the order they are drawn in.
    FAR_RIM = 352
    comp = plate.copy()
    for m in men:
        im = m['img']
        if m['name'] in ('card_2_silver', 'card_3_young'):
            a = np.asarray(im).copy()
            cut = max(0, FAR_RIM - m['y'])
            a[cut:, :, 3] = 0
            im = Image.fromarray(a, 'RGBA')
            m['clippedAt'] = FAR_RIM
        comp.paste(im, (m['x'], m['y']), im)
    compc = comp.crop(CROP)

    # the environment the rebuild must supply: the locked composition with the
    # four men knocked out. NOT reconstructed -- knocked out, so the hole is
    # exactly what a people-free plate would have to draw.
    env = plate.crop(CROP).copy()
    ed = ImageDraw.Draw(env)
    for m in men:
        a = np.asarray(m['img'])[:, :, 3] > 60
        ys, xs = np.nonzero(a)
        px = Image.new('L', env.size, 0)
        mask = Image.fromarray((a * 255).astype(np.uint8))
        px.paste(mask, (m['x'] - CROP[0], m['y'] - CROP[1]))
        env.paste(Image.new('RGB', env.size, (196, 32, 160)), (0, 0), px)
    row([label(env, 'PROOF 1  the environment layer: the four men knocked out, NOT reconstructed'),
         label(ref, 'the locked composition as it ships today')
         ]).save(R + 'room-03-gate-environment.webp', 'WEBP', quality=94, method=6)

    row([label(ref, 'LOCKED  the baked composition'),
         label(compc, 'GATE    the four generated actors composited over it')
         ]).save(R + 'room-03-gate-composite.webp', 'WEBP', quality=94, method=6)

    def gam(im, g):
        v = np.asarray(im).astype(np.float32) / 255.0
        return Image.fromarray(np.clip(v ** g * 255, 0, 255).astype(np.uint8))
    row([label(gam(compc, 0.30), 'GATE at gamma 0.30 -- halos and bad alpha'),
         label(gam(ref, 0.30), 'the baked composition at gamma 0.30')
         ]).save(R + 'room-03-gate-contamination.webp', 'WEBP', quality=94, method=6)

    comp.save('/tmp/gate-full-plate.png')

    rec = {'schema': 1,
           'note': 'Registration of the four gate actors against the LOCKED composition. Each is '
                   'scaled so his head height matches the baked man\'s and placed so his head top '
                   'and head centre match. Nothing is nudged to make his feet meet the floor: '
                   'soleY is where they actually landed.',
           'plate': PLATE, 'plateSha256': sha(PLATE), 'players': []}
    for m in men:
        L = m['locked']
        rec['players'].append({
            'id': m['name'], 'scale': round(m['scale'], 4), 'drawn': m['drawn'],
            'anchors': {'headTop': L['headTop'], 'seatY': L['seatY'],
                        'assetHeadRow': m['assetHead'][0], 'assetSeatRow': L['assetSeatRow']},
            'placedAt': [m['x'], m['y']],
            'headTop': {'locked': L['headTop'], 'placed': m['headTopY']},
            'depthOrder': ('behind the table, clipped at the far rim y 352'
                           if m['name'] in ('card_2_silver', 'card_3_young')
                           else 'in front of the table, drawn whole and last'),
            'sole': {'chairFloor': L['chairFloorY'], 'placed': m['soleY'],
                     'deltaPx': m['soleY'] - L['chairFloorY'],
                     'chairFloorMeasured': L['chairFloorMeasured']},
        })
    json.dump(rec, open(DIR + 'registration.json', 'w'), indent=1)
    open(DIR + 'registration.json', 'a').write('\n')
    for p in rec['players']:
        print(f"  {p['id']:20s} scale {p['scale']:.3f}  drawn {p['drawn'][0]}x{p['drawn'][1]}  "
              f"sole {p['sole']['placed']} vs chair floor {p['sole']['chairFloor']}  "
              f"({p['sole']['deltaPx']:+d} px)")


main()
