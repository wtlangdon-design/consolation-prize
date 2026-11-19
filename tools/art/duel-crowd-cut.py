"""The duel crowd and Fanshawe in the street, redrawn to Thad's look, cut (reference/duel-and-caves-art/brief.md Part A;
Act IV art finding 4). No image operation.

  python3 tools/art/duel-crowd-cut.py JOB [--op N] [--write]      JOB: town-left | town-right | fanshawe | office |
      office-turned | memorial | wreath | sow-master | sow-praying | sow-plate | sow-duel | sow-nugget | ut-hill | ut-shop
  python3 tools/art/duel-crowd-cut.py ut-hill|ut-shop --prep     writes the job's template, layout and old sheet

Each operation redrew a sheet's four distinct poses (frames 0, 2, 3, 4) in place on a 2x2 or 1x4 template, enlarged.
Each pose is the whole drawing the operation put in its window; ONE factor for all four makes the rest pose exactly as
tall (crown to lowest sole) as the old rest frame; each is laid in its own old cell, registered on the old frame by best
overlap. Frame 1 is the breath, derived from frame 0 by tools/rig/ambient-breath.py, as the records say. The same cells,
the same frame rects, the same record: nothing in content/ changes. Nothing is regraded: every colour is the
operation's own; the snap is the one level's, centre-sampled (tools/art/one-level.py --resnap, errata 235).
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
cut = {'__file__': R('tools/art/act1-figures-cut.py'), '__name__': 'helpers'}
saved, sys.argv = sys.argv, ['act1-figures-cut.py']
exec(open(cut['__file__']).read().split("if __name__ == '__main__':")[0], cut)
sys.argv = saved
alpha, rows_of, snap, despill_edge, opaque_rgb, N, downscale, measures, thad_at, bt, unpocket = (cut[k] for k in (
    'alpha', 'rows_of', 'snap', 'despill_edge', 'opaque_rgb', 'N', 'downscale', 'measures', 'thad_at', 'bt', 'unpocket'))

ST = 'art/staging/duel-and-caves-art'
JOBS = {'town-left': 'duel-town-left', 'town-right': 'duel-town-right', 'fanshawe': 'duel-fanshawe'}
# Fanshawe everywhere else (Tyler, 2026-11-17: "Proceed"), redrawn against the duel Fanshawe: job -> (record, spriteWhen
# index or None, room file). Their staging is art/staging/duel-and-caves-art/fanshawe-all/<job>-*.
ALL = {'office': ('fanshawe', None, 'fanshawe-office'), 'office-turned': ('fanshawe', 0, 'fanshawe-office'),
       'memorial': ('memorial-fanshawe', None, 'boot-hill'), 'wreath': ('wreath-fanshawe', None, 'main-street')}
# The Reverend everywhere (Tyler, 2026-11-18: "now the priest is the one character out of place"; "All six sheets"):
# staging art/staging/sowerby/<job>-*. FRAMES gives a sheet's whole cell list where the record shows only part of it
# (the plate sheet: two states share it); BREATHS maps each derived breath cell to the cell it is derived from.
SOW = {'sow-master': ('funeral-sowerby', None, 'funeral'), 'sow-praying': ('procession-sowerby', 0, 'boot-hill'),
       'sow-plate': ('sowerby-gate', 0, 'boot-hill'), 'sow-duel': ('duel-sowerby', None, 'main-street'),
       'sow-nugget': ('sowerby', None, 'nugget-back')}
ALL.update(SOW)
# The undertaker (errata 380; Tyler, 2026-11-19: "It looks like the guy on the far right still has a big head?", then
# "1": both drawings): staging art/staging/undertaker-heads/<job>-*. Prepared with --prep (the template: the four drawn
# poses enlarged K times in one row on magenta; the layout; the old sheet). Each sheet is snapped at the level
# one-level.py reads for it (--dry), and after the cut the shop's waist is matted along the bench's slanted back edge as
# tools/art/cast-softer.py did (waist-matte.py, its guide), then the sheet is re-snapped by one-level.py --resnap --only.
UT = {'ut-hill': ('funeral-undertaker', None, 'funeral'), 'ut-shop': ('undertaker', None, 'undertaker')}
ALL.update(UT)
PREP = {'ut-hill': {'k': 1.7, 'gap': 150}, 'ut-shop': {'k': 2.0, 'gap': 50}}
MATTE = {'ut-shop': {'plate': 'art/backgrounds/room-13-undertakers.png', 'guide': '1430:494,1650:516'}}
# The hill's correction (operation 2, his face lit evenly so it reads at the graveside's size) turned frame 3's glance
# down to the left, at the coffin, toward the front. Frame 3 is taken from operation 1, whose glance is in profile and
# reads whole: {(job, op): {pose: from op}}.
POSE_FROM_OP = {('ut-hill', 2): {3: 1}, ('ut-hill', 3): {3: 1}}   # op 3 (darker) kept op 2's front-facing frame 3
STAGE = {**{j: 'art/staging/sowerby' for j in SOW}, **{j: 'art/staging/undertaker-heads' for j in UT}}
FRAMES = {'sow-plate': [[2 + 292 * i, 2, 290, 314] for i in range(6)]}
BREATHS = {'sow-praying': {}, 'sow-plate': {1: 0, 5: 4}}
# The operation drew the praying sheet's open-mouthed pose 7.5% taller than its rest (634 px against 590), the same man
# standing the same way; the old sheet has both poses the same height (rows 0-313). Each pose is scaled to its own old
# height, uniformly, so his crown is not cut off at the cell's top.
PER_POSE = {'sow-praying', 'ut-hill'}
# The undertaker on the hill: operation 1 drew his looking-up pose (4) a little taller than his rest, the old sheet has
# both at rows 0-399, and one scale cut 15 px of his hair at the cell's top -- each pose to its own old height.
# Tyler, 2026-11-18: "The Nugget back image of the reverend has a comically small head". Both of sowerby-nugget's
# operations drew it so (the correction drew him bigger, not his head), and its cap is spent. The duel sheet is the same
# Reverend in the same four pencil poses, with his head right: the Nugget sheet is cut from the duel's drawing.
FROM = {'sow-nugget': ('sow-duel', 3)}   # the duel's third drawing: his face and colours to the master's, the pencil kept
# Rows of headroom added above a sheet's cells. The duel drawing's raised pose lifts the pencil hand above his crown; the
# Nugget cell's crown is on its top row, so the hand and pencil were cut off (511 px) and the pencil would vanish in that
# one frame (errata 111). The cells grow upward only: the soles and figureHeight stay, and the engine draws an ambient by
# figureHeight and stands its frame on its bottom row, so he is the same size in the same place. The record's frame rects
# change (reported); that is the wiring's.
# A drawing that did not keep its poses where the template put them. sow-duel operation 3 (Tyler, 2026-11-18: "His face
# in the duel and the Nugget is very very rudimentary ... why is he looking so yellow?") drew the four poses a little to
# the left, copied a row of heads from the reference along the bottom (rows 760-910) and Thad at the right. Below `clip`
# is cleared to the key (only those copied heads are there; his soles are near 650), and the poses are found where they
# stand: the `n` largest figures above it, left to right, Thad (the rightmost, in blue) left out.
DETECT = {('sow-duel', 3): {'clip': 720, 'n': 4}}
HEADROOM = {'sow-nugget': 56, 'sow-duel': 24}
OL_RESNAP = {'sow-nugget'}
BY_CROWN = {'sow-duel', 'sow-nugget'}
JOB = sys.argv[1]
OPN = int(sys.argv[sys.argv.index('--op') + 1]) if '--op' in sys.argv else 1
WRITE = '--write' in sys.argv


def window(out_img, op, pos, w, h, margin=30, vmargin=0):
    # the 2x2 templates leave no gap between rows, so a window reaches no further up or down than its own pose
    from scipy import ndimage as ndi
    y0, x0 = max(0, pos[1] - vmargin), max(0, pos[0] - margin)
    y1, x1 = min(out_img.shape[0], pos[1] + h + vmargin), min(out_img.shape[1], pos[0] + w + margin)
    m = op[y0:y1, x0:x1]
    lab, n = ndi.label(m); sizes = ndi.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z >= 60])
    f = np.zeros((y1 - y0, x1 - x0, 4), np.uint8); f[..., :3] = out_img[y0:y1, x0:x1]; f[..., 3] = np.where(m, 255, 0)
    return f


def best_shift(cell_alpha, old_alpha, search=20):
    h, w = old_alpha.shape; best = (-1, 0, 0)
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            a = np.zeros_like(old_alpha)
            ys0, xs0 = max(0, dy), max(0, dx); ys1, xs1 = min(h, h + dy), min(w, w + dx)
            a[ys0:ys1, xs0:xs1] = cell_alpha[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
            iou = (a & old_alpha).sum() / max(1, (a | old_alpha).sum())
            if iou > best[0]: best = (iou, dx, dy)
    return best


MIRROR = ()    # Fanshawe: the rest (thumbs in waistcoat) and the watch were drawn turned to the viewer's left -- the
                   # prompt said so, wrongly; tests/faces.test.mjs holds his record's `faces: right`. Mirrored, the
                   # hand held out and the hat tip already face right.


def rim_clean(c, passes=3):
    """Key left on the outline (tests/master-cut-edges.test.mjs: a rim pixel more magenta than the figure inside it):
    such rim pixels are cleared, a ring at a time. The figure inside is not touched."""
    from scipy import ndimage as ndi
    c = c.copy()
    for _ in range(passes):
        a = c.astype(int); m = a[..., 3] > 128
        rim = m & ndi.binary_dilation(~m, iterations=1)
        mag = (a[..., 0] + a[..., 2]) / 2 - a[..., 1]
        inner = m & ~rim
        med = np.median(mag[inner]) if inner.any() else 0
        bad = rim & (mag > med + 18)
        if not bad.any(): break
        c[bad] = 0
    return c


def pose_has_man(job, pose):
    return not (job == 'wreath' and pose == 3)     # the wreath alone: centred as the old one was


def best_shift_x(cell_alpha, old_alpha, dx):
    h, w = old_alpha.shape; a = np.zeros_like(old_alpha)
    xs0, xs1 = max(0, dx), min(w, w + dx); a[:, xs0:xs1] = cell_alpha[:, xs0 - dx:xs1 - dx]
    return (a & old_alpha).sum() / max(1, (a | old_alpha).sum())


def main():
    if JOB in ALL:
        name, when, room_id = ALL[JOB]; SD = STAGE.get(JOB, f'{ST}/fanshawe-all')
        rec = json.load(open(R(f'content/ambient/{name}.json')))
        sp = rec['sprite'] if when is None else {**rec['sprite'], **rec['spriteWhen'][when]['sprite']}
        if JOB in FRAMES: sp = {**sp, 'frames': FRAMES[JOB]}
        src, src_op = FROM.get(JOB, (JOB, OPN))
        lay = json.load(open(R(f'{SD}/{src}-layout.json')))
        out_img = np.asarray(Image.open(R(f'{SD}/{src}-op-{src_op}.png')).convert('RGB')).astype(int)
        if src != JOB:                                 # the source's own cell is the window its drawing was laid in
            sn, sw = SOW[src][0], SOW[src][1]
            srec = json.load(open(R(f'content/ambient/{sn}.json')))
            ssp = srec['sprite'] if sw is None else {**srec['sprite'], **srec['spriteWhen'][sw]['sprite']}
            globals()['WIN'] = ssp['frames'][0][2:4]
        old = np.asarray(Image.open(R(f'{SD}/{JOB}-old.png')).convert('RGBA'))
        globals()['ROOM_ID'] = room_id; globals()['SPRITE'] = sp
    else:
        name = JOBS[JOB]
        rec = json.load(open(R(f'content/ambient/{name}.json'))); sp = rec['sprite']
        lay = json.load(open(R(f'{ST}/{name}-layout.json')))
        out_img = np.asarray(Image.open(R(f'{ST}/{JOB}-op-{OPN}.png')).convert('RGB')).astype(int)
        old = np.asarray(Image.open(R(f'{ST}/{name}-old.png')).convert('RGBA'))
        globals()['ROOM_ID'] = 'main-street'; globals()['SPRITE'] = sp
    op = opaque_rgb(out_img)
    K = lay['k']; w, h = sp['frames'][0][2], sp['frames'][0][3]
    ww, wh = globals().get('WIN') or (w, h)
    det = DETECT.get(FROM.get(JOB, (JOB, OPN)) if JOB in FROM else (JOB, OPN)) if JOB in STAGE else None
    if det:
        from scipy import ndimage as ndi
        out_img = out_img.copy(); out_img[det['clip']:] = (255, 0, 255); op = opaque_rgb(out_img)
        lab, n = ndi.label(op); sizes = ndi.sum(op, lab, range(1, n + 1))
        big = sorted(range(n), key=lambda i: -sizes[i])[:det['n'] + 1]
        boxes = sorted(ndi.find_objects(lab)[i] for i in big)
        boxes = sorted(boxes, key=lambda b: b[1].start)[:det['n']]          # left to right; Thad, rightmost, left out
        lay = {**lay, 'positions': [[int((b[1].start + b[1].stop) / 2 - round(ww * K) / 2), lay['positions'][0][1]] for b in boxes]}
    # One row of poses (Fanshawe): the window reaches well above and below the template's cell -- the operation drew him
    # taller than the cell (rows 217-823 against 252-772), and a window held to the cell cut off his shoes and hat-top.
    one_row = len({p[1] for p in lay['positions']}) == 1
    figs = [window(out_img, op, pos, round(ww * K), round(wh * K), margin=10 if det else min(30, round(ww * K * 0.05)),
                   vmargin=150 if one_row else 0) for pos in lay['positions']]
    for pose_i, from_op in POSE_FROM_OP.get((JOB, OPN), {}).items():
        # a pose taken from another operation of the same sheet, laid in the same template window
        oi = np.asarray(Image.open(R(f'{STAGE[JOB]}/{JOB}-op-{from_op}.png')).convert('RGB')).astype(int)
        k_i = lay['poses'].index(pose_i)
        figs[k_i] = window(oi, opaque_rgb(oi), lay['positions'][k_i], round(ww * K), round(wh * K),
                           margin=min(30, round(ww * K * 0.05)), vmargin=150 if one_row else 0)
    for fg in figs:                                   # nothing of the drawing may touch the window's top or bottom
        assert not alpha(fg)[0].any() and not alpha(fg)[-1].any(), 'a pose runs past its window: widen it'
    orest = old[sp['frames'][0][1]:sp['frames'][0][1] + h, sp['frames'][0][0]:sp['frames'][0][0] + w]
    o_r = rows_of(orest); n_r = rows_of(figs[0])
    f = (o_r[-1] - o_r[0] + 1) / (n_r[-1] - n_r[0] + 1)
    if JOB in BY_CROWN:
        # The pencil raised in the rest pose stands above his crown in the bold redraw: measured to its tip, he came out
        # 1.8% short. The crown is the top of the columns over his torso (a quarter of the figure's width either side).
        def crown(fg):
            r = rows_of(fg); c = np.nonzero(alpha(fg).any(0))[0]; t = fg[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
            tx = cut['torso_x'](t); q = t.shape[1] / 4
            return int(np.nonzero(alpha(t)[:, max(0, int(tx - q)):int(tx + q) + 1].any(1))[0][0]), t.shape[0]
        oc, oh = crown(orest); nc, nh = crown(figs[0])
        f = (oh - oc) / (nh - nc)
    scale_by = 'old rest height' if JOB not in PER_POSE else "each pose's own old height"
    if JOB in BY_CROWN: scale_by = 'old rest height, crown to sole'
    if JOB == 'town-right':
        # Keeping the old group's height made the redrawn (longer-bodied) people taller than Thad beside them. The sheet
        # is 1:1 in the room (no figureHeight): its frontmost man -- the piece whose feet are lowest -- is the room's man
        # where the group stands, his hat on top (x 1.04).
        from scipy import ndimage as ndi
        lab, n = ndi.label(alpha(figs[0]))
        bottoms = [(np.nonzero((lab == i).any(1))[0][-1], i) for i in range(1, n + 1) if (lab == i).sum() > 500]
        front = max(bottoms)[1]; fr = np.nonzero((lab == front).any(1))[0]
        man_here = bt['curve_man'](bt['load']('content/rooms/main-street.json'), rec['x'], rec['y'])
        f = man_here * 1.04 / (fr[-1] - fr[0] + 1)
        scale_by = f'frontmost man = {round(man_here, 1)} x 1.04'
    man = sp.get('levelMan') or sp.get('figureHeight') or bt['curve_man'](bt['load'](f'content/rooms/{ROOM_ID}.json'), rec['x'], rec['y'])
    # the record's new figureHeight (tools/solve-figure-height.mjs, below) is the man the one-level test will read
    man = {'town-left': 213, 'town-right': 182}.get(JOB, man)
    if JOB in ('office', 'office-turned'):
        # The level the one-level test reads for this desk figure (tools/art/one-level.py --dry: block 4.09, the floor's man
        # in front of the desk) and the level his old sheet shipped at. The man where he sits is 304 (block 2.64); that is
        # the lobby clerk's open question (reference/act-one-art/handback.md), not settled here.
        man = 4.09 * N
    if JOB in UT:
        # the level the one-level test reads for this sheet: for the shop it is the floor's man in front of the bench
        import subprocess, re
        dry = subprocess.run([sys.executable, R('tools/art/one-level.py'), '--dry', '--only', os.path.basename(sp['sheet'])],
                             capture_output=True, text=True, check=True).stdout
        man = float(re.search(r'block ([0-9.]+)', dry).group(1)) * N
    block = man / N
    # The redrawn groups spread wider than the old cells at the same height. The cells are widened evenly about their
    # centre (W, the widest pose plus a margin) rather than the people shrunk: the record's x is the cell's centre, so
    # nothing moves; the record's frame rects are reported for the wiring.
    def trimmed(fig):
        r = rows_of(fig); c = np.nonzero(alpha(fig).any(0))[0]; return fig[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    W = max(w, max(round(trimmed(fg).shape[1] * f) for fg in figs) + 16)
    if JOB in ('fanshawe',) or JOB in ALL:
        # one man, centred on his torso where the old frame's torso was: the cell must hold his widest reach either side
        ocx = cut['torso_x'](orest) if alpha(orest).any() else w / 2
        half = 0
        for fg in figs:
            t = trimmed(fg); sw = max(1, round(t.shape[1] * f)); tx = cut['torso_x'](t) * f
            half = max(half, tx, sw - tx)
        W = max(W if JOB not in ALL else w, int(np.ceil(2 * (half + abs(ocx - w / 2)))) + 6)
    W += (W - w) % 2
    if JOB in UT:
        # The torso-centred reach above overestimated the shop's poses (it widened 166 to 202, and nothing fell outside
        # 166): the brief keeps his cells and records, so the old cell is kept and any loss at its edge is reported.
        W = w
    pad = (W - w) // 2
    HR = HEADROOM.get(JOB, 0)
    if HR:
        old = np.vstack([np.zeros((HR, old.shape[1], 4), np.uint8), old]); h += HR
    old_w = np.zeros((old.shape[0], 2 + len(sp['frames']) * (W + 2), 4), np.uint8)
    new_frames = []
    for i, (x, y, fw, fh) in enumerate(sp['frames']):
        fh += HR
        nx = 2 + i * (W + 2); old_w[y:y + fh, nx + pad:nx + pad + fw] = old[y:y + fh, x:x + fw]; new_frames.append([nx, y, W, fh])
    old_cells = {i: old_w[fr[1]:fr[1] + h, fr[0]:fr[0] + W] for i, fr in enumerate(new_frames)}
    cells, regs = {}, []
    for pose, fig in zip(lay['poses'], figs):
        r = rows_of(fig); c = np.nonzero(alpha(fig).any(0))[0]
        fig = fig[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
        ocell = old_cells[pose]
        fp = (lambda r: (r[-1] - r[0] + 1) / fig.shape[0])(rows_of(ocell)) if JOB in PER_POSE else f
        sm = downscale(fig, max(1, round(fig.shape[1] * fp)), max(1, round(fig.shape[0] * fp)))
        # start: soles on the old cell's sole row, centred as the old drawing is; then the best-overlap shift
        oc = np.nonzero(alpha(ocell).any(0))[0]; ocx = (oc[0] + oc[-1]) / 2
        cell = np.zeros((h, W, 4), np.uint8)
        oy = int(rows_of(ocell)[-1]) - (sm.shape[0] - 1); ox = int(round(ocx - (sm.shape[1] - 1) / 2))
        if (JOB == 'fanshawe' or JOB in ALL) and pose_has_man(JOB, pose):   # one man: centred on his torso
            ox = int(round(cut['torso_x'](ocell) - cut['torso_x'](sm)))
        ys0, xs0 = max(0, oy), max(0, ox); ys1, xs1 = min(h, oy + sm.shape[0]), min(W, ox + sm.shape[1])
        cell[ys0:ys1, xs0:xs1] = sm[ys0 - oy:ys1 - oy, xs0 - ox:xs1 - ox]
        iou, dx, dy = best_shift(alpha(cell), alpha(ocell), search=12)
        dy = 0                                     # soles stay on the old sole row
        dx = 0                                     # centred as the old group was: a redrawn group spreads differently, and
                                                   # registering on the old outline only pushed it to the search's limit
        iou = round(float(best_shift_x(alpha(cell), alpha(ocell), dx)), 3)
        moved = np.zeros_like(cell)
        a0, b0 = max(0, dy), max(0, dx); a1, b1 = min(h, h + dy), min(W, W + dx)
        moved[a0:a1, b0:b1] = cell[a0 - dy:a1 - dy, b0 - dx:b1 - dx]
        lost = int(alpha(sm).sum() - alpha(moved).sum())
        regs.append({'pose': pose, 'iou': round(float(iou), 3), 'dx': dx, 'dy': dy, 'pixelsLostAtCellEdge': lost})
        if JOB == 'fanshawe' and pose in MIRROR:      # his record faces right (toward Thad); these poses were drawn facing left
            moved = moved[:, ::-1].copy()
        # The undertaker's sheets are snapped ONCE, by one-level.py after the cut (below). Snapped here on the cell's grid
        # and again there on the figure's own, the two grids a fraction of a block apart dropped whole columns: a strip
        # of his face went missing (Tyler, 2026-11-19: "Looks like he's missing part of his face"; "Here too").
        cells[pose] = rim_clean(unpocket(despill_edge(moved if JOB in UT else snap(moved, block),
                                                      width=max(2, int(np.ceil(block)) + 1))))
    for dst, srci in BREATHS.get(JOB, {1: 0}).items():   # the derived breaths, back on the level's grid
        cells[dst] = breath(cells[srci], name) if JOB in UT else snap(breath(cells[srci], name), block)
    if JOB in OL_RESNAP:
        # tests/one-level.test.mjs lays its grid from the figure's own box, this cut from the cell's: the Nugget sheet's
        # frame 0 read 8.7% finer than the level. Each cell is re-snapped by tools/art/one-level.py's own snap, crisp
        # (--resnap: sampled at each block's centre).
        ol = {'np': np, 'Image': Image, 'RESNAP': True}
        src = open(R('tools/art/one-level.py')).read()
        exec(src[src.index('def jsround'):src.index('def man_at')], ol)
        cells = {i: ol['snap'](c, block) for i, c in cells.items()}
    sheet = np.zeros_like(old_w)
    for i, (x, y, fw, fh) in enumerate(new_frames):
        sheet[y:y + fh, x:x + fw] = cells[i]
    old = old_w
    room = bt['load'](f'content/rooms/{ROOM_ID}.json')
    gm = bt['curve_man'](room, rec['x'], rec['y'])
    k = gm * sp.get('stature', 1) / sp['figureHeight'] if sp.get('figureHeight') else 1
    def game(c):
        im = Image.fromarray(c); return np.asarray(im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.BOX))
    rep = {'job': JOB, 'op': OPN, 'scale': round(f, 4), 'scaleBy': scale_by, 'frames': new_frames, 'framesWere': sp['frames'], 'block': round(block, 3), 'register': regs,
           'restRows': {'old': [int(o_r[0]), int(o_r[-1])], 'new': [int(rows_of(cells[0])[0]), int(rows_of(cells[0])[-1])]},
           'measures': measures(((name, game(cells[0])), ('before', game(orest)), ('thadAtThisMan', thad_at(gm))))}
    globals()['NEW_FRAMES'] = new_frames
    print(json.dumps(rep))
    if WRITE:
        Image.fromarray(sheet).save(R(sp['sheet']))
        if JOB in ALL: print(json.dumps({'wrote': sp['sheet']}))
        if JOB in UT:
            import subprocess, tempfile
            if JOB in MATTE:
                with tempfile.TemporaryDirectory() as tmp:
                    fj = os.path.join(tmp, 'frames.json'); json.dump({'frames': new_frames}, open(fj, 'w'))
                    out = subprocess.run([sys.executable, R('tools/art/waist-matte.py'), R(sp['sheet']), fj, R(MATTE[JOB]['plate']),
                                          str(rec['x']), MATTE[JOB]['guide'], R(sp['sheet'])], capture_output=True, text=True, check=True)
                    print(json.dumps({'matte': json.loads(out.stdout.strip().splitlines()[-1]), 'recordY': rec['y']}))
            subprocess.run([sys.executable, R('tools/art/one-level.py'), '--resnap', '--only', os.path.basename(sp['sheet'])],
                           check=True, stdout=subprocess.DEVNULL)
            sheet = np.asarray(Image.open(R(sp['sheet'])).convert('RGBA'))
        render(rec, room, old, sheet)


def breath(rest, name):
    import subprocess
    d = R(f'{STAGE[JOB]}/{name}' if JOB in STAGE else f'{ST}/{name}'); os.makedirs(d, exist_ok=True)
    Image.fromarray(rest).save(f'{d}/rest.png')
    subprocess.run([sys.executable, R('tools/rig/ambient-breath.py'), f'{d}/rest.png', f'{d}/breath.png'], check=True,
                   capture_output=True)
    return np.asarray(Image.open(f'{d}/breath.png').convert('RGBA'))


def render(rec, room, old, new):
    sp = dict(SPRITE); sp['frames'] = NEW_FRAMES
    plate = Image.open(R(room['background'])).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    tx = rec['walkTo']['x'] if JOB in ('office', 'office-turned', 'ut-shop') else rec['x'] + (300 if rec['x'] < 3000 else -300)
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == ('left' if tx > rec['x'] else 'right') and not cl.get('state'))
    ty = rec['walkTo']['y'] if JOB in ('office', 'office-turned', 'ut-shop') else rec['y'] + 5
    t = Image.open(R(st['frames'][0])).convert('RGBA')
    t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
    kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
    ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
    k = bt['curve_man'](room, rec['x'], rec['y']) * sp.get('stature', 1) / sp['figureHeight'] if sp.get('figureHeight') else 1
    rows = []
    for sheet in (old, new):
        panels = []
        for i in ([p for p in (0, 2, 3, 4) if p < len(sp['frames'])] if JOB != 'sow-praying' else [0, 1]):
            x, y, w, h = sp['frames'][i]
            f = Image.fromarray(sheet[y:y + h, x:x + w]).resize((round(w * k), round(h * k)), Image.NEAREST)
            f = bt['lit'](f, bt['grade_for'](room, rec['id']), bt['mover_tint'](room.get('lamps'), rec['x'], rec['y']))
            im = plate.copy(); im.alpha_composite(f, (round(rec['x'] - w * k / 2), round(rec['y'] - h * k)))
            im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
            x0 = max(0, min(rec['x'], tx) - 200); y1 = max(rec['y'], ty) + 40
            c = im.crop((x0, y1 - 560, x0 + 700, y1)).convert('RGB')
            panels.append(c)
        rows.append(panels)
    pw, ph = rows[0][0].size
    img = Image.new('RGB', (pw * 4 + 18, ph * 2 + 6))
    for r, panels in enumerate(rows):
        for i, p in enumerate(panels):
            img.paste(p, (i * (pw + 6), r * (ph + 6)))
    img.save(R(f'renders/room-02-{JOB}-before-after.png' if JOB not in ALL else
               (f'renders/{JOB}-before-after.png' if JOB in STAGE else f'renders/fanshawe-{JOB}-before-after.png')))


def prep():
    """The template an operation redraws in place: the sheet's four drawn poses (0, 2, 3, 4), enlarged K times
    (nearest), in one row on magenta, 1536 x 1024; the layout the cut reads; the old sheet the cut registers on."""
    name, when, room_id = ALL[JOB]; SD = STAGE[JOB]; os.makedirs(R(SD), exist_ok=True)
    rec = json.load(open(R(f'content/ambient/{name}.json')))
    sp = rec['sprite'] if when is None else {**rec['sprite'], **rec['spriteWhen'][when]['sprite']}
    sheet = Image.open(R(sp['sheet'])).convert('RGBA'); sheet.save(R(f'{SD}/{JOB}-old.png'))
    K, gap = PREP[JOB]['k'], PREP[JOB]['gap']; poses = [0, 2, 3, 4]
    cw, ch = round(sp['frames'][0][2] * K), round(sp['frames'][0][3] * K)
    x0 = (1536 - (4 * cw + 3 * gap)) // 2; y0 = (1024 - ch) // 2
    t = Image.new('RGBA', (1536, 1024), (255, 0, 255, 255)); pos = []
    for i, p in enumerate(poses):
        x, y, w, h = sp['frames'][p]
        t.alpha_composite(sheet.crop((x, y, x + w, y + h)).resize((cw, ch), Image.NEAREST), (x0 + i * (cw + gap), y0))
        pos.append([x0 + i * (cw + gap), y0])
    t.convert('RGB').save(R(f'{SD}/{JOB}-template.png'))
    json.dump({'poses': poses, 'positions': pos, 'k': K}, open(R(f'{SD}/{JOB}-layout.json'), 'w'))
    print(json.dumps({'job': JOB, 'template': f'{SD}/{JOB}-template.png', 'positions': pos, 'k': K, 'cell': [cw, ch]}))


if __name__ == '__main__':
    prep() if '--prep' in sys.argv else main()
