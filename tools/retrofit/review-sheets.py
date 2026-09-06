"""THE OPENING-SET RETROFIT PHASE 1 REVIEW SHEETS (doc 36 Q116).

Composes, from tracked inputs and the candidate rooms' raw captures, the sheets
Tyler rules on: each candidate plate whole and in 1:1 crops, the shipping plate
beside it at the same scale, the live route with the accepted Thad at three
depths, and the four-room continuity sheet. Frames are downscaled whole or
cropped 1:1 -- never resampled up, never smoothed past Lanczos on the way down
-- and every legacy actor on a sheet is captioned LEGACY CONTEXT. The patron-
zone diagnostic is a separate image so the clean plate is judged clean.

    python3 tools/retrofit/review-sheets.py

Raw captures live under renders/proofs/candidates/*/raw-captures-ignored/ and
are reproduced by the two review routes (tools/gauntlet/life.mjs ... --warp).
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
os.makedirs(OUT, exist_ok=True)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:  # pragma: no cover
    FONT = TITLE = ImageFont.load_default()

MS_PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
MS_OLD = 'art/backgrounds/room-02-main-street.png'
NG_PLATE = 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
NG_OLD = 'art/backgrounds/room-03-nugget.png'
MS_RAW = 'renders/proofs/candidates/main-street/raw-captures-ignored'
NG_RAW = 'renders/proofs/candidates/nugget/raw-captures-ignored'
PLAY = (0, 0, 1920, 864)


def load(path, crop=None, scale=1.0):
    im = Image.open(path).convert('RGB')
    if crop:
        im = im.crop(crop)
    if scale != 1.0:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    return im


def sheet(out, title, items, cols, caption_h=40, pad=12, top=52, note=None):
    """items: [(image, caption)] laid out in a grid, each cell the largest item's size."""
    fw = max(im.width for im, _ in items)
    fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols
    note_h = 0
    if note:
        note_h = 22 * (note.count('\n') + 1) + 10
    W = cols * fw + (cols + 1) * pad
    H = top + note_h + rows * (fh + caption_h + pad) + pad
    canvas = Image.new('RGB', (W, H), (22, 22, 26))
    d = ImageDraw.Draw(canvas)
    d.text((pad, 14), title, fill=(236, 236, 240), font=TITLE)
    if note:
        d.text((pad, top - 4), note, fill=(190, 190, 200), font=FONT)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols)
        x = pad + c * (fw + pad)
        y = top + note_h + r * (fh + caption_h + pad)
        canvas.paste(im, (x, y))
        d.text((x, y + fh + 8), cap, fill=(222, 222, 228), font=FONT)
    ext = out.rsplit('.', 1)[1]
    if ext == 'webp':
        canvas.save(out, 'WEBP', quality=84, method=6)
    else:
        canvas.save(out)
    print(out, canvas.size)


def raw(dir_, name):
    return f'{dir_}/{name}.png'


def fresh(life, dir_, *wanted):
    """A capture THIS RUN actually took, by name fragment.

    A proof directory accumulates: routes get renamed, captures get renumbered,
    and the orphans stay on disk looking exactly like current ones. The
    continuity sheet was reading `c04-thad-mid.png` -- a file from a run a day
    older than the cast -- and captioning it "nine runtime patrons" over an
    empty room. Doc 38 R3g names that failure exactly: a stale filmstrip
    presented beside the fresh one. So the name is looked up in the run's own
    record, and a fragment that matches nothing returns nothing rather than a
    file that happens to exist.
    """
    names = [one['name'] for one in life.get('captures', [])]
    for fragment in wanted:
        for name in names:
            if fragment in name:
                path = raw(dir_, name)
                if os.path.exists(path):
                    return path
    return None


def thad_crop(life, name, width=420, margin=40):
    """A 1:1 crop around Thad in a capture, from the probe's own bounds."""
    cap = next((c for c in life['captures'] if c['name'] == name), None)
    if cap is None:
        return None
    cam = cap.get('camera') or 0
    bx, by, bw, bh = cap['movers']['thad']['bounds']
    cx = int(bx - cam + bw / 2)
    x0 = max(0, min(1920 - width, cx - width // 2))
    y0 = max(0, min(864 - (bh + 2 * margin), by - margin))
    h = min(864 - y0, bh + 2 * margin)
    return (x0, y0, x0 + width, y0 + h), cap['movers']['thad']['height'], cap['movers']['thad']['at']


def main_street():
    plate = load(MS_PLATE)
    sheet(f'{OUT}/main-street-candidate-plate.webp',
          'MAIN STREET CANDIDATE 01 -- the clean plate, whole (0.53) and at 1:1',
          [(load(MS_PLATE, scale=0.53), f'the whole candidate, 3610x864, people-free ({MS_PLATE})')], 1,
          note='Two errata-63 panels stitched at explicit cut columns; nobody is painted into it. Below: 1:1 crops of the places the brief asked about.')
    crops = [
        ((3020, 220, 3420, 660), 'the assay office exterior: the door Room 5 is behind, its one lantern'),
        ((2370, 260, 2830, 700), 'the saloon: batwing doors, both porch lanterns, the brightest place on the street'),
        ((220, 260, 800, 700), 'the Improvement Company: two lit windows, the twice-painted sign'),
        ((1080, 300, 1440, 640), 'the Clarion and its small lantern'),
        ((1560, 300, 1860, 620), 'the notice board wall'),
        ((0, 560, 620, 864), 'FOREGROUND OPPORTUNITY: the west hitching rail (occluder, plane 1, not yet cut)'),
        ((2280, 600, 2760, 864), 'FOREGROUND OPPORTUNITY: the east rail in front of the saloon (plane 1)'),
        ((760, 440, 1100, 660), 'FOREGROUND OPPORTUNITY: the trough on the boardwalk edge (plane 2)'),
        ((1380, 0, 1760, 360), 'the church steeple and the hills: depth behind the street'),
    ]
    sheet(f'{OUT}/main-street-candidate-crops.webp', 'MAIN STREET CANDIDATE 01 -- 1:1 crops',
          [(load(MS_PLATE, crop=c), cap) for c, cap in crops], 3)
    old = load(MS_OLD, scale=0.5)
    new = load(MS_PLATE, scale=0.5)
    sheet(f'{OUT}/main-street-old-vs-new.webp',
          'MAIN STREET -- shipping plate (top) and candidate 01 (bottom) at the SAME scale (0.5)',
          [(old, f'SHIPPING {MS_OLD}: 3690x864. Doorways 102-134 px, so Thad is 105 at the building line and 206 at the foot'),
           (new, f'CANDIDATE {MS_PLATE}: 3610x864. The Company door 220 px, so Thad is 200 at the boardwalk line and 275 at the foot')], 1,
          note='Same pixel scale, same night, same street order west to east. The candidate\'s buildings are about twice the size on the same canvas: that is the scale correction.')
    life_path = 'renders/proofs/candidates/main-street/life.json'
    if os.path.exists(life_path) and os.path.exists(raw(MS_RAW, 'c01-arrival-east-end')):
        life = json.load(open(life_path))
        caps = [
            ('c01-arrival-east-end', 'arrival at the east end, the road in. Dog and map seller: LEGACY CONTEXT'),
            ('c02-thad-far-assay-office', 'Thad FAR at the assay office door. Figures in orange: LEGACY CONTEXT'),
            ('c03-saloon-doors-in-pool', 'Thad in the saloon\'s pool, lit by it (mover light field)'),
            ('c04-thad-mid', 'Thad MID depth'),
            ('c05-thad-near', 'Thad NEAR depth'),
            ('c06-notice-board', 'the notice board. Letter-writer beside it: LEGACY CONTEXT'),
            ('c07-trough-company', 'the trough and the Company in its window light'),
            ('c08-near-west-rail', 'in front of the west rail (walks round it: not yet an occluder)'),
            ('c09-behind-west-rail', 'on the mud edge behind the west rail'),
            ('c10-idle-30', 'after 30 s idle'),
        ]
        items = [(load(raw(MS_RAW, n), crop=PLAY, scale=0.5), f'{n}: {c}') for n, c in caps if os.path.exists(raw(MS_RAW, n))]
        sheet(f'{OUT}/main-street-candidate-live.webp',
              'MAIN STREET CANDIDATE 01 -- live, with the accepted Thad (frozen) and the SHIPPING ambient cast as LEGACY CONTEXT',
              items, 2, note='The pie woman, letter-writer, map seller and dog are the shipping sprites at their shipping positions: context for the eye, not proposals. Recasts are deferred until the plate is accepted.')
        depth = []
        for n, label in (('c02-thad-far-assay-office', 'FAR'), ('c04-thad-mid', 'MID'), ('c05-thad-near', 'NEAR'), ('c03-saloon-doors-in-pool', 'IN THE SALOON POOL')):
            if not os.path.exists(raw(MS_RAW, n)):
                continue
            got = thad_crop(life, n)
            if not got:
                continue
            box, h, at = got
            depth.append((load(raw(MS_RAW, n), crop=box), f'{label}: Thad {h} px tall at world {at[0]},{at[1]} (1:1)'))
        if depth: sheet(f'{OUT}/main-street-thad-depths.webp', 'MAIN STREET CANDIDATE 01 -- the accepted Thad at three depths, 1:1', depth, 4,
              note='Far 200, near 275 by the annotation\'s two anchors; errata 54\'s 222/240/263 land inside that range.')
    else:
        print('main street: no live captures yet; live sheets skipped', file=sys.stderr)


def nugget():
    sheet(f'{OUT}/nugget-candidate-plate.webp', 'THE NUGGET CLEAN-PLATE CANDIDATE 02 -- whole (0.75)',
          [(load(NG_PLATE, scale=0.75), f'{NG_PLATE}: 1920x864, ZERO people baked; chandelier unlit; stove, bar lamps and door lamp painted lit')], 1)
    crops = [
        ((480, 220, 760, 540), 'the piano, approachable, with its stool'),
        ((280, 230, 420, 380), 'the handbill: mundane, small, aligned to the boards (unmarked, invariant 3)'),
        ((700, 300, 1100, 540), 'the card table and four empty chairs; the abandoned hand on top'),
        ((1150, 300, 1920, 864), 'the bar\'s depth: counter, three stools, back bar, mirror'),
        ((1020, 130, 1220, 430), 'the stove, its pipe, the back-room door under the landing'),
        ((280, 100, 520, 420), 'the door lamp and the window: the street wall'),
        ((800, 0, 1080, 200), 'the chandelier: seven cold candles, NOT lit (doc 16)'),
        ((1180, 20, 1440, 420), 'the stairs and the landing'),
        ((0, 0, 320, 720), 'the batwing doors and the blue street'),
    ]
    sheet(f'{OUT}/nugget-candidate-crops.webp', 'THE NUGGET CANDIDATE 02 -- 1:1 crops',
          [(load(NG_PLATE, crop=c), cap) for c, cap in crops], 3)
    sheet(f'{OUT}/nugget-old-vs-new.webp', 'THE NUGGET -- shipping plate (left) and clean candidate 02 (right), same scale (0.5)',
          [(load(NG_OLD, scale=0.5), f'SHIPPING {NG_OLD}: seven people painted in, chandelier lit, one warm grade over everything'),
           (load(NG_PLATE, scale=0.5), f'CANDIDATE {NG_PLATE}: same composition, nobody in it, the finish toward Room 5, chandelier cold')], 2)
    life_path = 'renders/proofs/candidates/nugget/life.json'
    if os.path.exists(life_path):
        life = json.load(open(life_path))
        caps = [
            ('c01-arrival', 'arrival through the batwing doors'),
            ('c02-thad-far-card-table', 'Thad FAR, by the card table'),
            ('c03-thad-by-stove', 'Thad by the stove, in its field'),
            ('c04-thad-mid', 'Thad MID depth'),
            ('c05-thad-near-bar', 'Thad NEAR, at the bar end by the spittoon'),
            ('c06-piano', 'LOOK AT the piano: the line up'),
            ('c07-handbill', 'LOOK AT the handbill: the line up'),
            ('c08-away-from-light', 'away from every light'),
            ('c09-idle-30', 'after 30 s idle'),
        ]
        items = [(load(raw(NG_RAW, n), crop=PLAY, scale=0.5), f'{n}: {c}') for n, c in caps if os.path.exists(raw(NG_RAW, n))]
        sheet(f'{OUT}/nugget-candidate-live.webp', 'THE NUGGET CANDIDATE 02 -- live, the accepted Thad only, nobody else', items, 2)
        depth = []
        for n, label in (('c02-thad-far-card-table', 'FAR'), ('c04-thad-mid', 'MID'), ('c05-thad-near-bar', 'NEAR'), ('c03-thad-by-stove', 'BY THE STOVE')):
            if not os.path.exists(raw(NG_RAW, n)):
                continue
            got = thad_crop(life, n, width=480)
            if not got:
                continue
            box, h, at = got
            depth.append((load(raw(NG_RAW, n), crop=box), f'{label}: Thad {h} px at world {at[0]},{at[1]} (1:1)'))
        if depth: sheet(f'{OUT}/nugget-thad-depths.webp', 'THE NUGGET CANDIDATE 02 -- the accepted Thad at three depths, 1:1', depth, 4,
              note='Tyler\'s anchors carried (198 far, 459 near). DECISION POINT: the plate\'s own furniture reads a taller man at the back (~330); see the annotation\'s scaling note.')
    # THE PATRON-ZONE DIAGNOSTIC, apart from the review sheets.
    plan = json.load(open('proofs/room-03/separation-plan.json'))
    im = load(NG_PLATE)
    d = ImageDraw.Draw(im, 'RGBA')
    colours = [(255, 80, 80), (80, 200, 255), (255, 220, 80), (200, 120, 255), (120, 255, 140), (255, 160, 60)]
    for i, zone in enumerate(plan['actorZones']):
        if 'zone' not in zone:
            continue
        x, y, w, h = zone['zone']
        c = colours[i % len(colours)]
        d.rectangle([x, y, x + w, y + h], outline=c + (255,), width=3, fill=c + (40,))
        d.text((x + 6, y + 6), f"{zone['who']} -- {zone['status']}", fill=(255, 255, 255), font=FONT)
    for z in plan['dialogueApproachZones']:
        x, y = z['standAt']
        d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 255, 255, 220))
        d.text((x + 12, y - 8), f"stand: {z['target']}", fill=(255, 255, 255), font=FONT)
    d.text((12, 12), 'DIAGNOSTIC ONLY -- actor zones and approach points from proofs/room-03/separation-plan.json over the clean plate. Not a review sheet.', fill=(255, 255, 255), font=FONT)
    im.save(f'{OUT}/nugget-patron-zones-diagnostic.png')
    print(f'{OUT}/nugget-patron-zones-diagnostic.png')


def continuity():
    frames = []
    r1 = 'renders/room-01-in-engine-1920x1080.png'
    frames.append((load(r1, crop=PLAY, scale=0.5), 'ROOM 1 STAGE ROAD -- shipping, accepted (the exterior authority)'))
    ms_life = 'renders/proofs/candidates/main-street/life.json'
    ms = fresh(json.load(open(ms_life)), MS_RAW, 'thad-mid', 'before-trough') if os.path.exists(ms_life) else None
    if ms:
        frames.append((load(ms, crop=PLAY, scale=0.5), 'MAIN STREET -- live, PHASE 2A: the three humans recast and on the room\'s own depth curve'))
    ng_life = 'renders/proofs/candidates/nugget/life.json'
    ng = fresh(json.load(open(ng_life)), NG_RAW, 'thad-mid', 'near-bar') if os.path.exists(ng_life) else None
    if ng:
        frames.append((load(ng, crop=PLAY, scale=0.5), 'THE NUGGET -- live, PHASE 2A: nine runtime patrons, corrected depth model, no animation on anybody'))
    r5 = 'renders/proofs/assay-office-shipping/raw-captures-ignored/panel-b-populated.png'
    if not os.path.exists(r5):
        r5 = 'art/backgrounds/room-05-assay-office.png'
    frames.append((load(r5, crop=PLAY, scale=0.5), 'ROOM 5 ASSAY OFFICE -- shipping, owner-accepted (the visual-language target)'))
    sheet(f'{OUT}/opening-set-continuity.webp',
          'THE OPENING SET, in play order: Room 1 -> Main Street CANDIDATE -> Nugget CANDIDATE -> Room 5 (each 0.5)',
          frames, 2, note='The two authorities are shipping rooms; the two candidates are staged and not promoted. The cut the audit called most jarring (Room 1 -> Main Street) is the one to judge first.')


if __name__ == '__main__':
    main_street()
    nugget()
    continuity()
