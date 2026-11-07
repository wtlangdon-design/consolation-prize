"""The acted directions' poses (reference/acted-directions/brief.md, errata 148), cut and appended.

Cast-unify 71-75 drew each character's new poses ON A TEMPLATE OF HIS OWN SHIPPING REST FRAME, repeated
(errata 144's method: the generator keeps the proportions of the figure it is handed, so it was handed
the figure it has to match). The first figure of each row is that rest frame redrawn, and it is the ruler:

  1. The row is cut by tools/art/cast-unify-cut.py --grid 1 at the height where its first figure is as
     tall as the shipping rest frame (a probe cut, then the corrected one, as cast-softer.py does).
  2. Each new pose is registered to that first figure -- on the waist line and the torso for a figure
     behind a counter (errata 111 G and H: the cut line and the body do not move between poses), on the
     soles and the legs for a standing one, on the soles and the feet for Thad -- and then put on the
     shipping rest frame by the same registration of the first figure to it.
  3. Snapped to one level (tools/art/one-level.py's snap, at the block size one-level.py gives the
     sheet), and a counter figure's cut line put back on its waist (one-level.py's recut).
  4. APPENDED: every existing frame keeps its index and its pixels; the new ones are 5, 6, ... A frame
     that reaches past the old box (a raised stamp) gets a box grown at the top and evenly at the sides,
     so its bottom centre -- where the engine stands it -- is the old one's.

Thad's poses are a clip, `pick-fit` from the back (art/actors/thad-pick-fit-back/): frame 0 is his
stand-back frame itself, so the clip begins and ends on him standing, then the new poses on his canvas
(soles at 627, centre 351), and a rig.json for tools/build-actor-record.mjs.

DEKE IS NOT CUT. Cast-unify 74 put something in his raised hand (the brief keeps his hands at his belt)
and drew a different face; laying its bent head on his rest frame gave a different man again. With the
cap spent, doc 95 row 12 stays printed until Tyler rules (errata 148).

Usage: acted-poses.py [--write]   (without --write, prints the measurements and writes nothing)
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WRITE = '--write' in sys.argv
py = lambda *a: subprocess.check_output([sys.executable, *a], cwd=ROOT).decode()
src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py')}
exec(src[src.index('import json'):src.index('def man_at')], ns)        # snap() and recut(), nothing else
snap, recut, N = ns['snap'], ns['recut'], 115.0

# who: (record, batch, row, the generated figures to append, in order, registration)
WHO = {
    'winnie_registrar': ('content/ambient/winnie-registrar.json', 42, 0, [1, 2, 3], 'waist'),
    'sump': ('content/ambient/sump.json', 43, 0, [1, 2, 3], 'waist'),
    'pratt': ('content/ambient/pratt.json', 44, 0, [1, 2], 'legs'),
    'pratt_jump': ('content/ambient/pratt-jump.json', 44, 1, [1], 'legs'),
}
THAD = 46               # the crouch (1) and the mended pick held across him (3); 2 lost the handle
THAD_POSES = [1, 3]


def read(p): return json.load(open(os.path.join(ROOT, p)))
def alpha(a): return a[..., 3] > 128
def rows(a): return np.nonzero(alpha(a).any(1))[0]


def crop(a):
    m = alpha(a); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    return a[r[0]:r[-1] + 1, c[0]:c[-1] + 1]


def cells(sheet, frames):
    im = np.asarray(Image.open(os.path.join(ROOT, sheet) if not os.path.isabs(sheet) else sheet).convert('RGBA'))
    return [crop(im[y:y + h, x:x + w].copy()) for x, y, w, h in frames]


def man(rec):
    s = rec['sprite']
    if s.get('figureHeight'): return s['figureHeight'] / (s.get('stature') or 1.0)
    js = ("import {readFileSync} from 'node:fs'; import {WalkBoxes, heightIn} from './engine/core/WalkBoxes.ts';"
          "const m=JSON.parse(readFileSync('content/manifest.json','utf8'));"
          f"const r=m.rooms.map(p=>JSON.parse(readFileSync(p,'utf8'))).find(r=>r.id==='{rec['room']}');"
          f"const n=new WalkBoxes(r.walkBoxes,()=>true).nearest({rec['x']},{rec['y']}); console.log(n?heightIn(n.box,{rec['y']}):0);")
    return float(subprocess.check_output(['node', '--experimental-strip-types', '--input-type=module', '-e', js],
                                         cwd=ROOT, stderr=subprocess.DEVNULL).decode().split()[-1])


def overlap_dx(a, b, band, reach=40):
    """The shift of b that lays its opaque pixels best on a's, over a band of rows measured up from the
    bottom (fractions of a's height), both bottom-aligned and left-aligned to start."""
    H = max(a.shape[0], b.shape[0]); W = max(a.shape[1], b.shape[1]) + 2 * reach
    def pad(x):
        out = np.zeros((H, W), bool); out[H - x.shape[0]:, reach:reach + x.shape[1]] = alpha(x); return out
    A, B = pad(a), pad(b)
    lo, hi = int(H - a.shape[0] * band[1]), int(H - a.shape[0] * band[0])
    best, at = -1, 0
    for dx in range(-reach, reach + 1):
        s = np.roll(B, dx, 1)[lo:hi]
        score = (A[lo:hi] & s).sum() / max(1, (A[lo:hi] | s).sum())
        if score > best: best, at = score, dx
    return at, round(float(best), 3)


def feet_dx(a, b):
    """Centres of the lowest rows (the boots): Thad crouched shares nothing else with Thad standing."""
    def c(x):
        m = alpha(x)[-max(4, x.shape[0] // 30):]; cols = np.nonzero(m.any(0))[0]; return (cols.min() + cols.max()) / 2
    return int(round(c(a) - c(b)))


def register(ref, pose, how):
    """Where pose's crop goes, as (dx, dy) of its top-left from ref's crop's top-left, both standing on
    one bottom row (a counter figure's waist line, a standing figure's soles)."""
    dy = ref.shape[0] - pose.shape[0]
    if how == 'waist': dx, _ = overlap_dx(ref, pose, (0.2, 0.55))
    elif how == 'legs': dx, _ = overlap_dx(ref, pose, (0.05, 0.45))
    else: dx = feet_dx(ref, pose)
    return dx, dy


def cut_row(batch, row, target, tmp):
    """Cut the row at the height that makes its first figure `target` rows tall."""
    sheet = os.path.join(ROOT, f'art/staging/cast-unify/batch-{batch}/sheet.png')
    def at(h):
        out = os.path.join(tmp, f'{batch}-{row}-{h}.png')
        fr = json.loads(py('tools/art/cast-unify-cut.py', sheet, str(row), str(h), out, '--grid', '1'))['frames']
        got = cells(out, fr)
        return [got[0]] + got[2:], got[0].shape[0]                    # the cutter's derived breath is dropped
    probe = 400
    _, h0 = at(probe)
    h = int(round(probe * target / h0))
    figs, got = at(h)
    if got != target:
        h = int(round(h * target / got)); figs, got = at(h)
    return figs, h, got


def place(rest_cell, frame_box, gen_rest, pose, how):
    """The pose in the coordinates of the shipping frame's box: the generated rest is laid on the
    shipping rest by `how`, and the pose on the generated rest the same way."""
    x, y, w, h = frame_box
    rest = rest_cell                                                   # uncropped shipping frame 0
    m = alpha(rest); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    shipped = rest[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    gx, gy = register(shipped, gen_rest, how)                          # generated rest -> shipped crop
    px, py_ = register(gen_rest, pose, how)                            # pose -> generated rest
    return c[0] + gx + px, r[0] + gy + py_


def grow_and_paste(boxes_wh, pose, ox, oy):
    """A frame the size of the old ones, grown at the top and evenly at the sides if the pose reaches
    past it; the pose pasted at (ox, oy) of the OLD box's coordinates."""
    w, h = boxes_wh
    left = max(0, -ox); right = max(0, ox + pose.shape[1] - w); top = max(0, -oy)
    side = max(left, right)
    W, H = w + 2 * side, h + top
    out = np.zeros((H, W, 4), np.uint8)
    X, Y = ox + side, oy + top
    region = out[Y:Y + pose.shape[0], X:X + pose.shape[1]]
    keep = alpha(pose)[:region.shape[0], :region.shape[1]]
    region[keep] = pose[:region.shape[0], :region.shape[1]][keep]
    return out


report = {}
with tempfile.TemporaryDirectory() as tmp:
    for who, (rec_p, batch, row, picks, how) in WHO.items():
        rec = read(rec_p); s = rec['sprite']
        sheet = np.asarray(Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA')).copy()
        x, y, w, h = s['frames'][0]
        rest_cell = sheet[y:y + h, x:x + w].copy()
        target = int(rows(rest_cell)[-1] - rows(rest_cell)[0] + 1)
        figs, height, got = cut_row(batch, row, target, tmp)
        b = man(rec) / N
        new = []
        for i in picks:
            pose = figs[i]; ox, oy = place(rest_cell, s['frames'][0], figs[0], pose, how)
            cell = grow_and_paste((w, h), pose, ox, oy)
            snapped = snap(cell, b) if b > 1.05 else cell
            if s.get('waistOn') is not None: snapped = recut(snapped, cell, b)
            new.append(snapped)
        report[who] = {'cutHeight': height, 'restRows': [target, got], 'block': round(b, 2),
                       'new': [list(n.shape[1::-1]) for n in new]}
        if not WRITE: continue
        # APPEND: the old sheet untouched, the new frames in a strip below it
        H2 = max(n.shape[0] for n in new)
        W2 = 2 + sum(n.shape[1] + 2 for n in new)
        out = np.zeros((sheet.shape[0] + H2 + 2, max(sheet.shape[1], W2), 4), np.uint8)
        out[:sheet.shape[0], :sheet.shape[1]] = sheet
        fx = 2; frames = [list(f) for f in s['frames']]
        for n in new:
            fy = sheet.shape[0] + (H2 - n.shape[0])
            out[fy:fy + n.shape[0], fx:fx + n.shape[1]] = n
            frames.append([fx, fy, n.shape[1], n.shape[0]]); fx += n.shape[1] + 2
        Image.fromarray(out).save(os.path.join(ROOT, s['sheet']))
        text = open(os.path.join(ROOT, rec_p)).read()
        rec['sprite']['frames'] = frames
        indent = 1 if text.startswith('{\n "') else 2
        open(os.path.join(ROOT, rec_p), 'w').write(json.dumps(rec, indent=indent, ensure_ascii=False) + '\n')

    # THAD: the pick-fit clip from the back
    stand = np.asarray(Image.open(os.path.join(ROOT, 'art/actors/thad-stand-back/stand-00.png')).convert('RGBA')).copy()
    rig = read('art/actors/thad-stand-back/rig.json')
    fw, fh = rig['figure']; pad = rig['padding']
    target = int(rows(stand)[-1] - rows(stand)[0] + 1)
    figs, height, got = cut_row(THAD, 0, target, tmp)
    m = alpha(stand); r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    shipped = stand[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    gx, gy = register(shipped, figs[0], 'feet')
    b = fh / N
    clip = [stand]
    for i in THAD_POSES:
        px, py_ = register(figs[0], figs[i], 'feet')
        ox, oy = c[0] + gx + px, r[0] + gy + py_
        canvas = np.zeros_like(stand)
        pose = figs[i]
        ys, xs = slice(max(0, oy), min(canvas.shape[0], oy + pose.shape[0])), slice(max(0, ox), min(canvas.shape[1], ox + pose.shape[1]))
        sub = pose[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
        keep = alpha(sub); canvas[ys, xs][keep] = sub[keep]
        clip.append(snap(canvas, b))
    report['thad'] = {'cutHeight': height, 'restRows': [target, got], 'block': round(b, 2), 'frames': len(clip)}
    if WRITE:
        d = os.path.join(ROOT, 'art/actors/thad-pick-fit-back'); os.makedirs(d, exist_ok=True)
        for f in os.listdir(d):
            if f.endswith('.png'): os.unlink(os.path.join(d, f))
        for i, a in enumerate(clip): Image.fromarray(a).save(os.path.join(d, f'pick-fit-{i:02d}.png'))
        json.dump({'clip': 'pick-fit', 'facing': 'back', 'figure': [fw, fh], 'frames': len(clip), 'padding': pad,
                   'note': "Doc 95 rows 4 and 6, the Mercantile's pickaxe in Room 33 (errata 148): 0 standing (his "
                           "stand-back frame itself, so the clip cannot pop at either end), 1 crouched, feeling the "
                           "ground for the pick's head, the bare handle in his other hand, 2 the mended pick held "
                           "across him. Cast-unify 75 (reference/cast-unify-46.txt), cut by tools/art/acted-poses.py "
                           "on his stand-back scale; its third pose (fitting) lost the handle and is not used."},
                  open(os.path.join(d, 'rig.json'), 'w'), indent=2)
print(json.dumps(report, indent=1))
