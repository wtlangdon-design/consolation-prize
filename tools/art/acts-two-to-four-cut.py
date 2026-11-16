"""Acts II to IV, four drawings, cut (reference/acts-two-to-four-art/brief.md; errata 354). No image operation.

  python3 tools/art/acts-two-to-four-cut.py JOB [--write]     JOB: lantern | coffin | sign | hearse

Each job reads its operation from art/staging/acts-two-to-four-art/<job>/ and, for the props, the shipping sheet as it
was from <job>/old-*.png there, so it re-runs to the same pixels. Nothing is regraded: the tool crops, scales, keys and
places; every colour is the operation's own. Nothing is wired: content/ is the main session's.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
ST = 'art/staging/acts-two-to-four-art'
JOB = sys.argv[1] if len(sys.argv) > 1 else 'lantern'
WRITE = '--write' in sys.argv


def lantern():
    """Room 32's lantern plate: operation 1 drew the whole 1536 x 1024 canvas, not only the template's middle band, so
    the band is taken where it holds Hob's head (his hair from row 173) and the lantern's glow (to row 803): rows
    170-860, 1536 x 691, the plate's 1920 x 864 at 0.8, brought up to the plate's size."""
    src = Image.open(R(f'{ST}/coffin-lantern/op-1.png')).convert('RGB')
    band = src.crop((0, 170, 1536, 861))
    plate = band.resize((1920, 864), Image.NEAREST)          # never smoothed (CLAUDE.md), as tools/art/district-arm.py brings a band up
    out = 'art/backgrounds/room-32-coffin-lantern.png'
    old = Image.open(R(f'{ST}/coffin-lantern/old-plate.png')).convert('RGB')
    print(json.dumps({'job': 'lantern', 'band': [0, 170, 1536, 861], 'size': plate.size,
                      'meanLight': {'new': round(float(np.asarray(plate).mean()), 1), 'old': round(float(np.asarray(old).mean()), 1)}}))
    if WRITE:
        plate.save(R(out))
        pair = Image.new('RGB', (960, 432 * 2 + 8)); pair.paste(old.resize((960, 432)), (0, 0)); pair.paste(plate.resize((960, 432)), (0, 440))
        pair.save(R('renders/room-32-coffin-lantern-before-after.png'))


def masked_back(D, op, prop_old):
    """A masked edit of a prop laid at K on the operation's canvas, brought back to the prop's size; only the masked
    pixels change, and only where the old prop was drawn (its outline is kept to the pixel)."""
    lay = json.load(open(R(f'{D}/layout.json')))
    K = lay['K']; X0, Y0 = lay['origin']; W, H = lay['size']
    # The operation drew the coffin's foot end a few pixels past the old sheet's right edge (the old cut had cropped it);
    # the sheet is widened by PAD columns on the right so the whole box is kept.
    PAD = 20
    prop_old = np.concatenate([prop_old, np.zeros((prop_old.shape[0], PAD, 4), prop_old.dtype)], 1)
    out = Image.open(R(f'{D}/op-{op}.png')).convert('RGB').crop((X0, Y0, X0 + W + round(PAD * K), Y0 + H))
    small = np.asarray(out.resize((prop_old.shape[1], prop_old.shape[0]), Image.BOX))
    # The operation redrew the whole coffin group -- box, trestles and leaning lid -- a few pixels from where they
    # were, not only the masked lid; a strip composite doubled the handles. So the group is taken whole: every drawn
    # pixel of the prop from the hearse's wheel line down (TAKE_FROM), the hearse above it untouched.
    m = np.zeros(prop_old.shape[:2], bool); m[lay['takeFrom']:, :] = True
    # Below that line the drawing and its outline are both the operation's: its box and trestles sit a few pixels from
    # the old ones, and the old outline clipped the far trestle and the box's end. The operation's outline is its
    # un-keyed pixels (magenta is the key).
    new = prop_old.copy().astype(np.uint8); new[..., :3][m] = small[m]; new[..., 3][m] = 255
    # Where the operation keyed the old grass patch away to magenta, the prop is left transparent there: the plate's own
    # ground shows through (copying the old patch back would bring the old trestles' legs with it).
    sm = small.astype(int)
    keyed = m & (sm[..., 0] > 150) & (sm[..., 2] > 150) & (sm[..., 1] < 110)
    from scipy import ndimage as ndi
    keyed = ndi.binary_dilation(keyed, iterations=1) & m
    new[..., 3][keyed] = 0; new[..., :3][keyed] = 0
    changed = np.any(new != prop_old, axis=2)
    from scipy import ndimage as _n
    edge = _n.binary_dilation(new[..., 3] == 0, iterations=2) & (new[..., 3] > 0) & m
    sm2 = new.astype(int)
    spill = edge & (sm2[..., 0] > sm2[..., 1] + 40) & (sm2[..., 2] > sm2[..., 1] + 40)
    new[..., 3][spill] = 0; new[..., :3][spill] = 0
    changed = np.any(new != prop_old, axis=2)
    assert not (changed & ~m).any(), 'pixels changed outside the region taken'
    return new, m, int(changed.sum())


def coffin():
    """Item 2: the coffin on the trestles opened -- lid off (the lid already leaning on the near trestle), the box open,
    a pale cushion at the head end. Only the coffin top of art/props/room-31-hearse.png changes."""
    D = f'{ST}/coffin-open'
    old = np.asarray(Image.open(R(f'{D}/old-prop.png')).convert('RGBA'))
    new, m, n = masked_back(D, 1, old)
    old = np.concatenate([old, np.zeros((old.shape[0], new.shape[1] - old.shape[1], 4), old.dtype)], 1)
    print(json.dumps({'job': 'coffin', 'takenFromRow': json.load(open(R(f'{D}/layout.json')))['takeFrom'],
                      'regionPixels': int(m.sum()), 'changed': n, 'changedAboveIt': 0}))
    if WRITE:
        Image.fromarray(new).save(R('art/props/room-31-hearse.png'))
        render_funeral(old, new, 'renders/room-31-coffin-open-before-after.png')


def render_funeral(old, new, out):
    sys.path.insert(0, R('tools/art'))
    bt = {'__file__': R('tools/art/beside-thad.py')}
    src = open(bt['__file__']).read(); exec(src[:src.index('def main')], bt)
    room = bt['load']('content/rooms/funeral.json'); p = room['props'][0]
    plate = Image.open(R(room['background'])).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'left' and not cl.get('state'))
    tx, ty = 760, 760
    t = Image.open(R(st['frames'][0])).convert('RGBA')
    t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
    kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
    ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
    panels = []
    for prop in (old, new):
        im = plate.copy(); pi = Image.fromarray(prop)
        im.alpha_composite(pi, (p['x'] - p['frame'][2] // 2, p['y'] - pi.height + 1))   # left edge where it was
        im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
        panels.append(im.crop((100, 120, 900, 800)).convert('RGB'))
    img = Image.new('RGB', (1608, 680)); img.paste(panels[0], (0, 0)); img.paste(panels[1], (808, 0)); img.save(R(out))


def helpers():
    ns = {'__file__': R('tools/art/final-look-cut.py')}
    src = open(ns['__file__']).read(); saved, sys.argv = sys.argv, ['final-look-cut.py']
    exec(src[:src.index('\ndef main(')], ns); sys.argv = saved
    ns['snap'].__globals__['RESNAP'] = True        # centre-sampled, as tools/art/one-level.py --resnap (errata 235)
    bt = {'__file__': R('tools/art/beside-thad.py')}
    srcb = open(bt['__file__']).read(); exec(srcb[:srcb.index('def main')], bt)
    return ns, bt


SIGN_FOOT = (1134, 645)     # THE SÉANCE SIGN's hotspot (1108, 470, 52, 180): centred on it, standing on the ground
SIGN_H = 96                 # knee to waist on Thad there (the man is about 210): 0.46 of him


def sign():
    """Item 3: THE SÉANCE SIGN, a new prop (art/props/room-44-seance-sign.png): the chalkboard keyed off magenta, scaled
    so it stands SIGN_H tall, snapped to the one level at the man where it stands. Not wired: the main session adds the
    prop (with `when` T_SEANCE_ON) at SIGN_FOOT."""
    ns, bt = helpers()
    a = np.asarray(Image.open(R(f'{ST}/seance-sign/op-1.png')).convert('RGB')).astype(int)
    op = ns['opaque_rgb'](a)
    from scipy import ndimage as ndi
    lab, n = ndi.label(op); sizes = ndi.sum(op, lab, range(1, n + 1)); op = lab == (int(np.argmax(sizes)) + 1)
    op = ndi.binary_fill_holes(op)
    ys, xs = np.nonzero(op)
    crop = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
    crop[..., :3] = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; crop[..., 3] = np.where(op[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 255, 0)
    k = SIGN_H / crop.shape[0]
    pm = crop.astype(float); pm[..., :3] *= pm[..., 3:4] / 255
    sm = np.asarray(Image.fromarray(pm.astype(np.uint8)).resize((round(crop.shape[1] * k), SIGN_H), Image.BOX)).astype(float)
    al = sm[..., 3:4]; rgb = np.where(al > 0, sm[..., :3] * 255 / np.maximum(al, 1), 0)
    small = np.concatenate([np.clip(rgb, 0, 255), np.where(al >= 128, 255, 0)], 2).astype(np.uint8)
    room = bt['load']('content/rooms/the-lane.json')
    man = bt['curve_man'](room, *SIGN_FOOT); block = man / ns['N']
    cell = np.zeros((SIGN_H + 4, small.shape[1] + 4, 4), np.uint8); cell[2:2 + SIGN_H, 2:2 + small.shape[1]] = small
    cell = ns['despill_edge'](ns['snap'](cell, block), width=max(2, int(np.ceil(block)) + 1))
    r = np.nonzero(cell[..., 3].any(1))[0]; c = np.nonzero(cell[..., 3].any(0))[0]
    cell = cell[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    print(json.dumps({'job': 'sign', 'size': [cell.shape[1], cell.shape[0]], 'frame': [0, 0, cell.shape[1], cell.shape[0]],
                      'foot': list(SIGN_FOOT), 'manThere': round(man, 1), 'heightOfMan': round(cell.shape[0] / man, 2),
                      'block': round(block, 3), 'spansX': [SIGN_FOOT[0] - cell.shape[1] // 2, SIGN_FOOT[0] - cell.shape[1] // 2 + cell.shape[1]]}))
    if WRITE:
        Image.fromarray(cell).save(R('art/props/room-44-seance-sign.png'))
        plate = Image.open(R(room['background'])).convert('RGBA')
        im = plate.copy(); im.alpha_composite(Image.fromarray(cell), (SIGN_FOOT[0] - cell.shape[1] // 2, SIGN_FOOT[1] - cell.shape[0] + 1))
        thad = bt['load']('content/actors/thad.json')
        st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'left' and not cl.get('state'))
        tx, ty = 1260, 735                          # beside it, not on its stand point (1134, 735), which hides it
        t = Image.open(R(st['frames'][0])).convert('RGBA')
        t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
        kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
        ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
        im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
        im.convert('RGB').crop((850, 300, 1450, 820)).save(R('renders/room-44-seance-sign-with-thad.png'))


HEARSE_GROUND = (505, 578)  # the hearse's wheels on the ground just behind the coffin (room x of its centre, y of its wheels).
HEARSE_OP = 2               # Tyler, 2026-11-16, of the mule at a right angle to the three-quarter-rear hearse: "Redraw the
                            # hearse side-on". Operation 2 (the asset's correction) is the gate's hearse side-on, empty,
                            # its front to the left, in line with Grievance. Operation 1 (three-quarter rear) is kept.
SHAFTS_END = 405            # operation 2's columns left of its front lamp: the shafts, trimmed
HEARSE_LEFT = 335           # room x of its front end: Grievance (the gate's, 385 wide here) ahead of it with her head on screen, its rear clear of the grave's headstone (x ~960)
                            # Grievance, the mule (content/ambient/funeral-grievance.json, x 129), stands hitched at its
                            # front, clear of it: at x 330 the new, longer hearse hid her whole. Her sprite carries a strip
                            # of the OLD hearse beside her (x ~215-255); from x 205 the new hearse covers that strip.
GATE_RATIO = 1.292          # the gate's hearse, finial to wheels, over its man (content/ambient/procession-hearse.json: 385/298)


def hearse():
    """Item 4: the graveside hearse redrawn as the gate's (art/actors/room-14-hearse-grievance.png), from three-quarter
    rear, empty, no horse, at the gate's size against a man. The prop is rebuilt: the new hearse behind, item 2's coffin
    group (box, cushion, trestles, leaning lid) in front, where it stood. The whole hearse no longer fits the old 422 x 578
    sheet, so the sheet grows; its foot row stays y 733 and the record's new x and frame are reported for the wiring."""
    ns, bt = helpers()
    room = bt['load']('content/rooms/funeral.json'); p = room['props'][0]
    a = np.asarray(Image.open(R(f'{ST}/hearse/op-{HEARSE_OP}.png')).convert('RGB')).astype(int)
    op = ns['opaque_rgb'](a)
    if HEARSE_OP == 2:
        op[:, :SHAFTS_END] = False      # the shafts it drew lying ahead of it: Grievance's own traces carry the hitch
    from scipy import ndimage as ndi
    lab, n = ndi.label(op); sizes = ndi.sum(op, lab, range(1, n + 1))
    op = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z >= 200])
    ys, xs = np.nonzero(op)
    crop = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
    crop[..., :3] = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; crop[..., 3] = np.where(op[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 255, 0)
    man = bt['curve_man'](room, *HEARSE_GROUND)
    H = round(GATE_RATIO * man); k = H / crop.shape[0]; Wd = round(crop.shape[1] * k)
    if HEARSE_OP == 2:                  # side-on: its front (left) end set just behind Grievance's traces
        HG = (HEARSE_LEFT + Wd // 2, HEARSE_GROUND[1])
    else:
        HG = HEARSE_GROUND
    pm = crop.astype(float); pm[..., :3] *= pm[..., 3:4] / 255
    sm = np.asarray(Image.fromarray(pm.astype(np.uint8)).resize((Wd, H), Image.BOX)).astype(float)
    al = sm[..., 3:4]; rgb = np.where(al > 0, sm[..., :3] * 255 / np.maximum(al, 1), 0)
    hearse_img = np.concatenate([np.clip(rgb, 0, 255), np.where(al >= 128, 255, 0)], 2).astype(np.uint8)
    hearse_img = ns['despill_edge'](ns['snap'](hearse_img, man / ns['N']), width=4)
    # key left between the spokes: magenta-ish pixels (blue and red well over green) go transparent -- the wheels are open
    hi = hearse_img.astype(int)
    pocket = (hi[..., 3] > 0) & (hi[..., 0] > hi[..., 1] + 25) & (hi[..., 2] > hi[..., 1] + 25)
    hearse_img[pocket] = 0
    hx0, hy0 = HG[0] - Wd // 2, HG[1] - H + 1
    # item 2's coffin group: the warm wood of the prop below the old hearse's wheel line, whole pieces, holes filled
    cp = np.asarray(Image.open(R(f'{ST}/hearse/coffin-open-prop.png')).convert('RGBA')).astype(int)
    cx0, cy0 = p['x'] - p['frame'][2] // 2, p['y'] - cp.shape[0] + 1      # the old sheet's left edge (it grew rightward)
    opaque = cp[..., 3] >= 128
    warm = opaque & (cp[..., 0] > cp[..., 2] + 6)
    warm[:268] = False
    grp = ndi.binary_fill_holes(ndi.binary_closing(warm, iterations=3)) & opaque
    grp[:268] = False
    # the canvas: everything both layers need, its foot on the coffin's foot row (y 733)
    X0 = min(hx0, cx0 + COFFIN_DX); X1 = max(hx0 + Wd, cx0 + COFFIN_DX + cp.shape[1]); Y0 = min(hy0, cy0); Y1 = p['y'] + 1
    canvas = Image.new('RGBA', (X1 - X0, Y1 - Y0), (0, 0, 0, 0))
    canvas.alpha_composite(Image.fromarray(hearse_img), (hx0 - X0, hy0 - Y0))
    g = np.zeros_like(cp, dtype=np.uint8); g[grp] = cp[grp]
    canvas.alpha_composite(Image.fromarray(g), (cx0 + COFFIN_DX - X0, cy0 - Y0))
    cv = np.asarray(canvas).copy(); ci = cv.astype(int)              # the last key pixels, wherever they landed
    left = (ci[..., 3] > 128) & (ci[..., 2] > ci[..., 1] + 30) & ((ci[..., 0] + ci[..., 2]) / 2 - ci[..., 1] > 80)
    cv[left] = 0; canvas = Image.fromarray(cv)
    new_x = X0 + (X1 - X0) // 2
    report = {'job': 'hearse', 'keyPocketsCleared': int(pocket.sum()), 'manAtWheels': round(man, 1), 'hearseSize': [Wd, H], 'heightOverMan': round(H / man, 3),
              'gate': GATE_RATIO, 'hearseRoomRect': [hx0, hy0, Wd, H], 'sheet': list(canvas.size),
              'record': {'x': new_x, 'y': p['y'], 'frame': [0, 0, canvas.size[0], canvas.size[1]],
                         'was': {'x': p['x'], 'y': p['y'], 'frame': p['frame']}},
              'drawnFromX': X0 - (new_x - canvas.size[0] // 2)}
    print(json.dumps(report))
    if WRITE:
        canvas.save(R('art/props/room-31-hearse.png'))
        plate = Image.open(R(room['background'])).convert('RGBA')
        thad = bt['load']('content/actors/thad.json')
        st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'left' and not cl.get('state'))
        tx, ty = 760, 760
        t = Image.open(R(st['frames'][0])).convert('RGBA')
        t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
        kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
        ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
        panels = []
        old = Image.open(R(f'{ST}/coffin-open/old-prop.png')).convert('RGBA')
        for prop, (px, py) in ((old, (p['x'], p['y'])), (canvas, (new_x, p['y']))):
            im = plate.copy(); im.alpha_composite(prop, (px - prop.width // 2, py - prop.height + 1))
            im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
            panels.append(im.crop((0, 100, 960, 820)).convert('RGB'))
        img = Image.new('RGB', (1928, 720)); img.paste(panels[0], (0, 0)); img.paste(panels[1], (968, 0)); img.save(R('renders/room-31-hearse-before-after.png'))


def grievance():
    """Grievance, the mule (art/actors/room-31-grievance.png): her frames were cut from room-31's composition master with
    the OLD hearse's front, the old lid's corner and a scrap of grass beside her; they never move between frames. With
    the gate's hearse set back behind the coffin (item 4), they read as a second hearse beside her. The same three
    regions are cleared in every frame; her own pixels are not touched. Frame-relative:
      - the old hearse's box above her back: x >= 165, y < 150 (her back begins at y ~152);
      - the old lid's corner: warm wood (red over blue by 20+, light) at x >= 190, y >= 300;
      - the grass and ground under it, at x >= 150, y >= 420 (below her hooves' row, ~415)."""
    rec = json.load(open(R('content/ambient/funeral-grievance.json'))); sp = rec['sprite']
    old = np.asarray(Image.open(R(f'{ST}/hearse/grievance-old.png')).convert('RGBA'))
    new = old.copy(); cleared = []
    for (x, y, w, h) in sp['frames']:
        f = new[y:y + h, x:x + w]; a = f.astype(int)
        yy, xx = np.mgrid[0:h, 0:w]
        box = (xx >= 165) & (yy < 150)
        lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
        lid = (xx >= 190) & (yy >= 300) & (a[..., 0] > a[..., 2] + 20) & (lum > 60)
        from scipy import ndimage as ndi
        lid = ndi.binary_dilation(lid, iterations=1) & (xx >= 190) & (yy >= 300)
        ground = (xx >= 150) & (yy >= 420)
        # the master's grass around her legs: green over blue and over red (the plate's night grass is blue; her coat
        # and harness are neutral), from her chest down; grown by one pixel within the same hue, then any piece left
        # cut off from her body is cleared too
        grassy = (a[..., 1] - a[..., 2] >= 3) & (a[..., 1] - a[..., 0] >= 5) & (yy >= 290)
        grass = ndi.binary_opening(grassy, iterations=1) | (grassy & ndi.binary_dilation(ndi.binary_opening(grassy, iterations=1)))
        kill = (box | lid | ground | grass) & (f[..., 3] > 0)
        keep = (f[..., 3] > 0) & ~kill
        lab, n = ndi.label(keep); sizes = ndi.sum(keep, lab, range(1, n + 1))
        if n: kill |= keep & (lab != (int(np.argmax(sizes)) + 1))
        cleared.append(int(kill.sum())); f[kill] = 0
    print(json.dumps({'job': 'grievance', 'clearedPerFrame': cleared}))
    if WRITE:
        Image.fromarray(new).save(R(sp['sheet']))


GATE_MULE_X0 = 600          # the gate's frames: Grievance from her rump (~625) and a stub of her shafts behind it
MULE_SHAFT_END = 380        # room x of her shafts' stub ends: tucked under the hearse's front, at its front wheel
COFFIN_DX = 60              # the coffin group slid right along the hearse, clear of Grievance's hind legs (it stood over
                            # them in front of her; tests/lessons.test.ts read its dark trestles as plate over her)


def grievance_gate():
    """Tyler, 2026-11-16, of the graveside mule ("still looks totally goofy and out of place"), chose "Use the gate's
    Grievance": the same mule from the gate's sheet (content/ambient/procession-hearse.json), side-on in her harness with
    her shafts, cut from the hearse at column GATE_MULE_X0, turned to face left (the side-on hearse's front is to the
    left), scaled by the man where she stands against the gate's figureHeight, and stood at the hearse's own depth (its
    wheels' row) with her shafts' ends at its front. Her four frames are the gate's four, in order. No operation."""
    ns, bt = helpers()
    room = bt['load']('content/rooms/funeral.json')
    g = json.load(open(R('content/ambient/procession-hearse.json')))['sprite']
    sheet = Image.open(R(g['sheet'])).convert('RGBA')
    cells = []
    for (x, y, w, h) in g['frames']:
        f = sheet.crop((x + GATE_MULE_X0, y, x + w, y + h)).transpose(Image.FLIP_LEFT_RIGHT)
        cells.append(np.asarray(f))
    feet_y = HEARSE_GROUND[1]
    # the gate draws her 1:1 against a man of figureHeight; here the man where she stands
    cw = cells[0].shape[1]
    x_guess = MULE_SHAFT_END - cw // 2
    man = bt['curve_man'](room, x_guess, feet_y)
    k = man / g['figureHeight']
    W, H = round(cw * k), round(cells[0].shape[0] * k)
    out = []
    for c in cells:
        pm = c.astype(float); pm[..., :3] *= pm[..., 3:4] / 255
        sm = np.asarray(Image.fromarray(pm.astype(np.uint8)).resize((W, H), Image.BOX)).astype(float)
        al = sm[..., 3:4]; rgb = np.where(al > 0, sm[..., :3] * 255 / np.maximum(al, 1), 0)
        cell = np.concatenate([np.clip(rgb, 0, 255), np.where(al >= 128, 255, 0)], 2).astype(np.uint8)
        out.append(ns['snap'](cell, man / ns['N']))
    # padded to the old sheet's height (509) so the record, until the main session rewires it, still fits its sheet
    sheet_out = np.zeros((max(H + 4, 509), 2 + len(out) * (W + 2), 4), np.uint8); rects = []
    for i, c in enumerate(out):
        x = 2 + i * (W + 2); sheet_out[2:2 + H, x:x + W] = c; rects.append([x, 2, W, H])
    rec_x = MULE_SHAFT_END - W + W // 2                     # bottom-centre x so her right edge (shafts' ends) is at MULE_SHAFT_END
    print(json.dumps({'job': 'grievance_gate', 'scale': round(k, 4), 'manThere': round(man, 1), 'cell': [W, H],
                      'record': {'x': rec_x, 'y': feet_y, 'frames': rects, 'sheet': 'art/actors/room-31-grievance.png',
                                 'was': {'x': 129, 'y': 700, 'frames': '4 x [276, 505]'}},
                      'framesAre': 'the gate\'s: 0 rest, head turned back a little toward the hearse; 1 breath; 2 head turned fully back, at the hearse; 3 a front hoof stamped'}))
    if WRITE:
        Image.fromarray(sheet_out).save(R('art/actors/room-31-grievance.png'))
        return rec_x, feet_y, rects


JOBS = {'lantern': lantern, 'coffin': coffin, 'sign': sign, 'hearse': hearse, 'grievance': grievance,
        'grievance_gate': grievance_gate}

if __name__ == '__main__':
    JOBS[JOB]()
