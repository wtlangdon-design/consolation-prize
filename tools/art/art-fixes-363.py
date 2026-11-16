"""ERRATA 363: NINE PICTURE FAULTS FIXED BY SCRIPT (Tyler, 2026-11-16: "Go", to the recommendations after errata 362).

No image operation. Every pixel written is a pixel already drawn: moved, copied from the same picture, or regraded
toward the picture's own range. Each job writes its asset(s) and a before/after render under renders/art-fixes-363/.

    python3 tools/art/art-fixes-363.py JOB [--write]

Jobs: lamp, panner, seam, dawn, wreath, headboard, grievance (a trial picture only).
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
WRITE = '--write' in sys.argv
OUT = 'renders/art-fixes-363'


def rgba(path):
    return np.asarray(Image.open(R(path)).convert('RGBA')).copy()


def side_by_side(name, before, after, zoom=2):
    """Before above, after below, each `zoom` times, nearest-neighbour."""
    b = Image.fromarray(before).convert('RGB'); a = Image.fromarray(after).convert('RGB')
    w, h = b.size
    sheet = Image.new('RGB', (w * zoom, h * zoom * 2 + 8), (255, 255, 255))
    sheet.paste(b.resize((w * zoom, h * zoom), Image.NEAREST), (0, 0))
    sheet.paste(a.resize((w * zoom, h * zoom), Image.NEAREST), (0, h * zoom + 8))
    if WRITE:
        os.makedirs(R(OUT), exist_ok=True)
        sheet.save(R(f'{OUT}/{name}.png'))


# --- 1. THE LAMP, TAKEN ----------------------------------------------------------------------------------------------
# Act IV's morning plate keeps the lamp on the desk after PICK UP takes it (T_LAMP_TAKEN). A prop of the same plate's
# wall, window jamb, sill and desk top, copied from beside the lamp, is drawn over it once it is taken.
LAMP_BOX = (755, 355, 815, 490)          # x0, y0, x1, y1 on the plate: the lamp to the foot of its base, with a margin


def lamp():
    # Room 19 is graded (reference/room-grades.json): the patch is cut from the plate's UNGRADED original and kept as
    # its own original there, and tools/art/room-grade.py grades it with the plate, so the two match pixel for pixel.
    plate = rgba('reference/room-grade/originals/art__backgrounds__room-19-thads-room-act4.png')
    out = plate.copy()
    x0, y0, x1, y1 = LAMP_BOX
    for y in range(y0, y1):
        for x in range(x0, x1):
            if y < 390:
                src = (x, y - 40)                       # the jamb and the wall run straight up past the chimney
            elif x < 775 and y < 468:
                src = (x - 25, y)                       # the wall left of the jamb, from just beside it
            elif y < 445:
                src = (x + 45, y)                       # the sill and its shadow run on to the jamb
            elif y < 468:
                src = (x - 25 if x < 790 else x + 45, y)   # the wall under the sill
            else:
                # the desk top: each row is the middle colour of the same row's clear desk right of the base
                out[y, x] = np.median(plate[y, 816:830], axis=0).astype(np.uint8)
                continue
            out[y, x] = plate[src[1], src[0]]
    patch = out[y0:y1, x0:x1]
    w, h = x1 - x0, y1 - y0
    record = {'id': 'lamp_taken', 'sheet': 'art/props/room-19-lamp-taken.png', 'x': x0 + w // 2, 'y': y1 - 1, 'frame': [0, 0, w, h]}
    print(json.dumps(record))
    side_by_side('room-19-lamp-taken', plate[y0 - 40:y1 + 20, x0 - 80:x1 + 80], out[y0 - 40:y1 + 20, x0 - 80:x1 + 80], 3)
    if WRITE:
        Image.fromarray(patch).save(R('reference/room-grade/originals/' + record['sheet'].replace('/', '__')))
        Image.fromarray(patch).save(R(record['sheet']))
        import subprocess
        subprocess.run([sys.executable, R('tools/art/room-grade.py')], check=True, stdout=subprocess.DEVNULL)


# --- 3. THE PANNER'S SHINS ------------------------------------------------------------------------------------------
# The river's plane 2 ends his legs on a dead-straight line at y 589, with no water where a man meets water. A broken
# ring of the channel's own highlight colours over that line, the legs' reflection broken in the channel's own darker
# tones under it, and a few glints further out: drawn in front of him, its foot one row below his (690), so it sorts after him.
PANNER_RING = {
    'x0': 1730, 'y0': 584, 'block': 5, 'foot': 691,
    'rows': [
        '..hfhffhfh.hhfhfhffhfh..',
        '.h.mdmdmdmhfhmdmdmdmh.h.',
        'h..h.mh.m..h..m.hm.h...h',
    ],
}


def panner():
    plate = rgba('art/backgrounds/room-53-river.png')
    region = plate[600:700, 1600:1900, :3].reshape(-1, 3).astype(int); lum = region @ np.array([0.3, 0.59, 0.11])
    def tone(q):
        t = np.percentile(lum, q); return np.median(region[np.abs(lum - t) < 4], axis=0).astype(np.uint8)
    colours = {'f': tone(99.5), 'h': tone(92), 'm': tone(45), 'd': tone(28)}
    ring = PANNER_RING; b = ring['block']
    w = len(ring['rows'][0]) * b; h = ring['foot'] - ring['y0'] + 1
    sheet = np.zeros((h, w, 4), np.uint8)
    for r, row in enumerate(ring['rows']):
        for c, ch in enumerate(row):
            if ch in colours:
                sheet[r * b:(r + 1) * b, c * b:(c + 1) * b, :3] = colours[ch]; sheet[r * b:(r + 1) * b, c * b:(c + 1) * b, 3] = 255
    record = {'id': 'panner_water', 'sheet': 'art/props/room-53-panner-water.png', 'x': ring['x0'] + w // 2, 'y': ring['foot'], 'frame': [0, 0, w, h]}
    print(json.dumps(record))
    if WRITE:
        Image.fromarray(sheet).save(R(record['sheet']))


def original(path):
    """A plate this tool edits in place is read from its first state, kept beside the staging (art/staging/art-fixes-363/),
    so the job re-runs to the same pixels."""
    keep = f'art/staging/art-fixes-363/{os.path.basename(path)}'
    if not os.path.exists(R(keep)):
        os.makedirs(os.path.dirname(R(keep)), exist_ok=True)
        Image.open(R(path)).save(R(keep))
    return rgba(keep)


# --- 4. THE RIVER'S SEAM -------------------------------------------------------------------------------------------
# Left of the bar, the mud bank and the water meet on one straight column (x 850, y 470 to 770): blocky mud on one
# side, the channel's long ripples on the other. The edge is broken into the plate's own pieces: across a zone
# 36 px wide, block by block (the mud's own 6 px), each block is mud or water with the chance of mud falling from one side
# of the zone to the other. Mud carried right is the bank copied from 48 px left, water carried left the channel
# copied from 48 px right. The zone narrows to the line at its two ends, where the shoreline above and the bank below
# meet it.
SEAM = {'x': 850, 'y0': 470, 'y1': 770, 'half': 18, 'block': 6, 'carry': 48}   # half a whole number of blocks: a block edge on the line


def seam():
    plate_path = 'art/backgrounds/room-53-river.png'
    before = original(plate_path); out = before.copy()
    s = SEAM; rng = np.random.default_rng(363); b = s['block']
    rows = list(range(s['y0'], s['y1'], b))
    for i, y in enumerate(rows):
        half = int(s['half'] * min(1.0, (i + 1) / 5, (len(rows) - i) / 5))
        for x in range(s['x'] - s['half'], s['x'] + s['half'], b):
            if half == 0 or abs(x + b / 2 - s['x']) > half:
                continue
            mud = rng.random() < 0.5 - (x + b / 2 - s['x']) / (2 * half)
            for yy in range(y, min(y + b, s['y1'])):
                for xx in range(x, x + b):
                    if mud:
                        out[yy, xx] = before[yy, xx - s['carry']] if xx >= s['x'] else before[yy, xx]
                    else:
                        out[yy, xx] = before[yy, xx + s['carry']] if xx < s['x'] else before[yy, xx]
    box = (s['x'] - 90, s['y0'] - 20, s['x'] + 90, s['y1'] + 20)
    side_by_side('room-53-river-seam', before[box[1]:box[3], box[0]:box[2]], out[box[1]:box[3], box[0]:box[2]], 2)
    print(json.dumps({'job': 'seam', 'rows': [s['y0'], s['y1']], 'zone': s['half'] * 2}))
    if WRITE:
        Image.fromarray(out[..., :3]).save(R(plate_path))


# --- 5. THE DAWN STREET ----------------------------------------------------------------------------------------------
# The game ends on this picture. Its relight (tools/art/room36-dawn.py) left (a) a saturated emerald and teal band
# along the whole ridgeline, (b) electric-blue porch posts, hoops and blotches in the Nugget's windows and lanterns,
# and (c) the steeple's spire torn and ragged on its right against the sky.
# (a) and (b) are pulled back into the plate's own range: the rest of the plate's saturation has its median at 65 and
# its 90th percentile at 153, the ridge's teal sits at 207 and runs to 255. Those pixels keep their hue and lightness
# order and take half their saturation (the ridge's blues with its teal, or they stand out of it as specks), and the
# brightest of the ridge's teal (its emerald rim) a fifth less value.
# (c) The spire is symmetric (Room 2's own, unrelit), and its left, lit half came through clean: its right half is the
# left mirrored about the tower's axis, shaded as the tower's right half is against its left, on the sky's own row.
DAWN = {'ridge_rows': 420, 'teal': (110, 260), 'blue': (200, 260), 'axis2': 1577, 'spire': (34, 142), 'tower': (150, 200),
        'trough': (1895, 540, 2140, 650)}


def dawn():
    path = 'art/backgrounds/room-36-main-street-dawn.png'
    before = original(path)
    rgb = Image.fromarray(before[..., :3])
    hsv = np.asarray(rgb.convert('HSV')).astype(float)
    hue = hsv[..., 0] * 360 / 255; sat = hsv[..., 1]; val = hsv[..., 2]
    rows = np.arange(hsv.shape[0])[:, None]
    teal = (rows < DAWN['ridge_rows']) & (hue >= DAWN['teal'][0]) & (hue <= DAWN['teal'][1]) & (sat > 40)
    rim = teal & (val > np.percentile(val[teal], 95))
    # electric blues: strong and not dark, or pale and bright (the blotches in the Nugget's lit windows)
    blue = (hue >= DAWN['blue'][0]) & (hue <= DAWN['blue'][1]) & (((sat > 120) & (val > 60)) | ((sat > 60) & (val > 150)))
    tx0, ty0, tx1, ty1 = DAWN['trough']
    blue[ty0:ty1, tx0:tx1] = False          # the trough's water is water, and blue (tests/trough-solid.test.mjs reads it)
    sat2 = sat.copy(); val2 = val.copy()
    sat2[teal | blue] *= 0.5
    val2[rim] *= 0.8
    val2[blue] *= 0.85
    out_hsv = np.stack([hsv[..., 0], sat2, val2], 2).clip(0, 255).astype(np.uint8)
    out = np.asarray(Image.fromarray(out_hsv, 'HSV').convert('RGB')).astype(int)
    # keep every untouched pixel exactly as it was (the HSV round trip moves some by one)
    touched = teal | blue
    out = np.where(touched[..., None], out, before[..., :3].astype(int))
    # (c) the spire
    y0, y1 = DAWN['spire']; ax2 = DAWN['axis2']; ty0, ty1 = DAWN['tower']
    cx = ax2 // 2
    left = out[ty0:ty1, cx - 30:cx].reshape(-1, 3).mean(0); right = out[ty0:ty1, cx + 1:cx + 31].reshape(-1, 3).mean(0)
    shade = np.clip(right / np.maximum(left, 1), 0.5, 1.2)
    spire = 0
    for y in range(y0, y1):
        sky = np.median(out[y, 845:880], 0)
        for x in range(cx + 1, cx + 40):
            mirror = out[y, ax2 - x]
            is_spire = np.abs(mirror - np.median(out[y, 690:735], 0)).sum() > 60
            out[y, x] = (mirror * shade).round() if is_spire else sky
            spire += int(is_spire)
    out = out.clip(0, 255).astype(np.uint8)
    print(json.dumps({'job': 'dawn', 'ridgeTeal': int(teal.sum()), 'rim': int(rim.sum()), 'electricBlue': int(blue.sum()),
                      'spirePixels': spire, 'shade': [round(float(v), 3) for v in shade]}))
    for name, box in (('ridge-and-nugget', (1450, 100, 2250, 420)), ('steeple', (700, 20, 880, 200))):
        x0, y0b, x1, y1b = box
        side_by_side(f'room-36-dawn-{name}', before[y0b:y1b, x0:x1, :3], out[y0b:y1b, x0:x1], 2 if name != 'steeple' else 3)
    if WRITE:
        Image.fromarray(out).save(R(path))


# --- 6. THE WREATH ON THE COFFIN ------------------------------------------------------------------------------------
# USE the wreath on the coffin (doc 118 O-6) lays the Colonel's wreath on Thad's own coffin, and nothing was drawn.
# The wreath is the hill's own (art/props/room-14-colonels-wreath.png, already in the night), 1:1, hung on the coffin's
# leaning lid under its name plate. Its sheet runs down to one row below the coffin's foot (726), so it is drawn
# after the coffin; Thad's stands are all below that.
WREATH = {'sheet': 'art/props/room-14-colonels-wreath.png', 'centre_x': 318, 'top': 568, 'foot': 727}


def wreath():
    w = rgba(WREATH['sheet']); h = WREATH['foot'] - WREATH['top'] + 1
    sheet = np.zeros((h, w.shape[1], 4), np.uint8); sheet[:w.shape[0]] = w
    record = {'id': 'wreath_on_coffin', 'sheet': 'art/props/room-31-wreath-on-coffin.png', 'x': WREATH['centre_x'],
              'y': WREATH['foot'], 'frame': [0, 0, w.shape[1], h]}
    print(json.dumps(record))
    if WRITE:
        Image.fromarray(sheet).save(R(record['sheet']))


# --- 7 AND 8. ONE HEADBOARD FOR ONE GRAVE, AND THE PEG ON IT ----------------------------------------------------------
# Thad's grave had two headboards: a carved-cross board like the hill's others on Boot Hill (the fresh plot before the
# funeral, his own plot after it), and a tall rounded board with a plaque at the graveside, in the picture Tyler
# approved. The graveside's board is carried to the hill: cut from the funeral plate, at the hill's man the share of a
# man it is at the graveside (0.52 of 319 there; the hill's man is 285), graded to the hill's own board's colour, and
# set where the old board stood. On his own plot the tuning peg (its LOOK: "Someone has left a tuning peg on the
# headboard") sat six pixels above the old board, in the sky; it is set on the new board's top.
BOARD = {'plate': 'art/backgrounds/room-31-funeral.png', 'box': (955, 380, 1014, 545), 'lit': 70,
         'share': 165 / 319, 'hill_man': 285}
PLOTS = {
    'own': {'sheet': 'art/props/room-14-own-plot.png', 'clear': (112, 0, 192, 98), 'centre': 151, 'bottom': 97,
            'peg': (130, 0, 182, 18)},
    'fresh': {'sheet': 'art/props/room-14-fresh-plot.png', 'clear': (160, 40, 242, 151), 'centre': 201, 'bottom': 150},
}


def the_board():
    plate = rgba(BOARD['plate'])[..., :3].astype(int)
    x0, y0, x1, y1 = BOARD['box']
    crop = plate[y0:y1, x0:x1]; lum = crop.mean(2)
    mask = np.zeros(lum.shape, bool)
    for r in range(lum.shape[0]):
        lit = np.nonzero(lum[r] > BOARD['lit'])[0]
        if len(lit) >= 3:
            mask[r, lit.min():lit.max() + 1] = True
    ys, xs = np.nonzero(mask)
    crop = crop[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; mask = mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    H = round(BOARD['share'] * BOARD['hill_man']); W = round(crop.shape[1] * H / crop.shape[0])
    rgba_board = np.concatenate([crop, mask[..., None] * 255], 2).astype(np.uint8)
    small = np.asarray(Image.fromarray(rgba_board).resize((W, H), Image.BOX)).copy()
    small[..., 3] = np.where(small[..., 3] >= 128, 255, 0)
    return small


def graded(board, target):
    """The board's colours moved onto the hill's old board's: per channel, its mean and spread."""
    on = board[..., 3] > 0; src = board[..., :3][on].astype(float)
    out = board.copy()
    out[..., :3][on] = np.clip((src - src.mean(0)) / np.maximum(src.std(0), 1) * target.std(0) + target.mean(0), 0, 255).astype(np.uint8)
    return out


def headboard():
    board = the_board()
    own = original(PLOTS['own']['sheet'])
    cx0, cy0, cx1, cy1 = PLOTS['own']['clear']
    old = own[cy0:cy1, cx0:cx1]; target = old[..., :3][(old[..., 3] > 0) & (old[..., :3].mean(2) > 70)].astype(float)
    board = graded(board, target)
    report = {'job': 'headboard', 'board': [int(board.shape[1]), int(board.shape[0])]}
    for name, plot in PLOTS.items():
        sheet = original(plot['sheet'])
        peg = None
        if 'peg' in plot:
            px0, py0, px1, py1 = plot['peg']; peg = sheet[py0:py1, px0:px1].copy()
            pys, pxs = np.nonzero(peg[..., 3]); peg = peg[pys.min():pys.max() + 1, pxs.min():pxs.max() + 1]
        x0, y0, x1, y1 = plot['clear']
        sheet[y0:y1, x0:x1] = 0
        top = plot['bottom'] - board.shape[0] + 1
        # the sheet grows upward as far as the board (and the peg on it) needs; its foot, the prop's y, stays
        extra = max(0, -(top - (0 if peg is None else peg.shape[0] - 3)))
        if extra:
            sheet = np.concatenate([np.zeros((extra, sheet.shape[1], 4), np.uint8), sheet], 0)
        top += extra; bx = plot['centre'] - board.shape[1] // 2
        region = sheet[top:top + board.shape[0], bx:bx + board.shape[1]]
        on = board[..., 3] > 0
        region[on] = board[on]
        if peg is not None:      # resting on the board's top, three rows sunk into it
            py = top - peg.shape[0] + 3; pxc = plot['centre'] - peg.shape[1] // 2
            pr = sheet[py:py + peg.shape[0], pxc:pxc + peg.shape[1]]; pon = peg[..., 3] > 0; pr[pon] = peg[pon]
        report[name] = {'sheet': plot['sheet'], 'grewTop': int(extra), 'frame': [0, 0, int(sheet.shape[1]), int(sheet.shape[0])]}
        if WRITE:
            Image.fromarray(sheet).save(R(plot['sheet']))
    print(json.dumps(report))


# --- 9. GRIEVANCE'S COAT: A TRIAL, NOT SHIPPED ------------------------------------------------------------------------
# She is brown at the livery, on the street and at the washout, and charcoal at the gate and the graveside. This
# writes only a picture for Tyler: the graveside sheet's coat moved to the livery's brown under the hill's night,
# by the coat's own shading. It does not ship, because the mask cannot be cut from her harness by colour: her black
# leather and her dark coat are the same darks, so the plume, the blinkers and the collar's leather go brown with
# her, and the coat's blue sheen stays as specks. A brown coat in a black harness is a drawing.
def grievance():
    liv = rgba('art/actors/room-15-grievance.png').astype(float)
    lrgb = liv[..., :3][liv[..., 3] > 0]; llum = lrgb @ [0.3, 0.59, 0.11]
    coat = lrgb[(llum > 50) & (llum < 140) & (lrgb[:, 0] > lrgb[:, 2] + 30)].mean(0)
    ratio = coat / (coat @ [0.3, 0.59, 0.11]) * np.array([0.74, 0.82, 1.0])     # the graveside's night on Thad
    ratio = ratio / (ratio @ [0.3, 0.59, 0.11])
    a = rgba('art/actors/room-31-grievance.png').astype(float)
    rgb = a[..., :3]; lum = rgb @ [0.3, 0.59, 0.11]
    mask = (a[..., 3] > 0) & (lum >= 8) & (lum < 52) & (rgb[..., 1] >= rgb[..., 0] - 2) & (rgb[..., 2] <= rgb[..., 1] + 6)
    out = a.copy(); out[..., :3][mask] = np.clip((lum[mask] * 1.25)[:, None] * ratio, 0, 255)
    night = np.zeros((401, 363, 4), np.uint8); night[..., :3] = (30, 34, 52); night[..., 3] = 255
    panes = []
    for sheet in (a, out):
        im = Image.fromarray(night.copy()); im.alpha_composite(Image.fromarray(sheet.astype(np.uint8)).crop((2, 2, 365, 403)))
        panes.append(np.asarray(im))
    side_by_side('room-31-grievance-brown-trial', panes[0], panes[1], 2)
    print(json.dumps({'job': 'grievance', 'shipped': False, 'coatPixels': int(mask.sum())}))


JOBS = {'lamp': lamp, 'panner': panner, 'seam': seam, 'dawn': dawn, 'wreath': wreath, 'headboard': headboard,
        'grievance': grievance}

if __name__ == '__main__':
    job = next((a for a in sys.argv[1:] if not a.startswith('--')), None)
    if job not in JOBS:
        sys.exit(f'job: one of {", ".join(JOBS)}')
    JOBS[job]()
