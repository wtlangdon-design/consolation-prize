"""Ignatius Frame and the three judges, leaner (reference/leaner-cast/brief.md, errata 138).

Tyler, 2026-11-06: "Ignatius and the 3 judges are all really thick compared to Thad. They look like
dwarves vs characters from this same universe of characters." Redrawn from the locked cast master,
built like Thad: cast-unify 62 (Frame, batch-32) and 63 (the judges, batch-33).

  frame      cast-unify-cut --grid 1 at his old figure's height: 0 rest, 1 breath (derived), 2 talking,
             3 writing a quote, 4 leaning in -- the notebook in every pose (errata 111 L).
  standing   each judge cut from his own pair on row 1 (watching; conferring / a nod / a hand to his
             beard): 0 watching, 1 breath, 2 the second pose. The bearded judge's sheet is mirrored so he
             faces the duel (errata 111 V, tests/faces.test.mjs); feet on the porch boards (standsOn).
  seated     each judge from his own row (rows 2-4): hands folded, leaning to confer, a nod, drumming,
             waist-up with nothing of the table drawn; registered on the head and on the hands' row
             (the hands lie on the table's far edge), and cut to the bust height of the judge he replaces.
             The gaunt judge seated is from cast-unify 64, the correction of his row (batch-34).

`figureHeight` of a standing figure is crown to sole (tools/art/figure-height.py; --hat for the
bearded judge). Each record's frames are written BEFORE the snap to one level, which reads them.

Usage: leaner-cast.py frame|judges
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
py = lambda *a: subprocess.check_output([sys.executable, *a], cwd=ROOT).decode()


def read(p):
    return json.load(open(os.path.join(ROOT, p)))


def write(p, rec):
    open(os.path.join(ROOT, p), 'w').write(json.dumps(rec, indent=1, ensure_ascii=False) + '\n')


def snap(*sheets):
    subprocess.check_call([sys.executable, 'tools/art/one-level.py', '--only', *[os.path.basename(s) for s in sheets]],
                          cwd=ROOT, stdout=subprocess.DEVNULL)


def figure_height(sheet, frames, hat=False):
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f:
        json.dump({'frames': frames}, f)
    out = py('tools/art/figure-height.py', sheet, f.name, *(['--hat'] if hat else []))
    os.unlink(f.name)
    return int(json.loads(out.strip().splitlines()[-1])['figureHeight']) if out.strip().startswith('{') else int(out.split()[-1])


def frame():
    sheet = 'art/staging/cast-unify/batch-32/sheet.png'
    rec_p = 'content/ambient/frame.json'; rec = read(rec_p)
    out = 'art/actors/room-09-frame-master.png'
    cut = json.loads(py('tools/art/cast-unify-cut.py', sheet, '0', str(rec['sprite']['figureHeight']),
                        os.path.join(ROOT, out), '--grid', '1'))
    rec['sprite']['frames'] = cut['frames']
    rec['sprite']['figureHeight'] = figure_height(out, cut['frames'])
    write(rec_p, rec)
    snap(out)
    print(json.dumps({'frame': {'frames': cut['frames'], 'figureHeight': rec['sprite']['figureHeight']}}))


JUDGES = 'art/staging/cast-unify/batch-33/sheet.png'
STANDING = {1: 'content/ambient/duel-judge-1.json', 2: 'content/ambient/duel-judge-2.json', 3: 'content/ambient/duel-judge-3.json'}
SEATED = {1: 'content/ambient/room-04-judge-1.json', 2: 'content/ambient/room-04-judge-2.json', 3: 'content/ambient/room-04-judge-3.json'}
HAT = {3}          # the bearded judge's crown is under his hat
# THE GAUNT JUDGE SEATED is cast-unify 64's correction (batch-34, one row): 63 drew his first seated pose
# in a black bow tie and a brown waistcoat; his green cravat is in every pose of 64.
SEATED_FROM = {1: (JUDGES, 1), 2: ('art/staging/cast-unify/batch-34/sheet.png', 0), 3: (JUDGES, 3)}


def rest_height(sheet, frames):
    x, y, w, h = frames[0]
    a = np.asarray(Image.open(os.path.join(ROOT, sheet)).convert('RGBA'))[y:y + h, x:x + w, 3] > 128
    return int(a.any(1).sum())


def standing_pairs(tmp):
    """Row 1 holds the three judges twice each, left to right: one temporary sheet per judge, holding only
    his pair, so the cutter cuts him alone."""
    im = np.asarray(Image.open(os.path.join(ROOT, JUDGES)).convert('RGB')).copy()
    d = np.sqrt((im[..., 0] - 255.) ** 2 + im[..., 1].astype(float) ** 2 + (im[..., 2] - 255.) ** 2)
    busy = (d >= 120).sum(1) > 3
    y0 = int(np.argmax(busy)); y1 = y0
    while y1 < len(busy) and busy[y1]: y1 += 1
    cols = (d[y0:y1] >= 120).sum(0) > 2
    runs, start = [], None
    for x, on in enumerate(cols):
        if on and start is None: start = x
        if not on and start is not None:
            if x - start > 20: runs.append((start, x))
            start = None
    assert len(runs) == 6, f'row 1 should hold six figures, found {len(runs)}'
    out = {}
    for j in (1, 2, 3):
        a, b = runs[2 * (j - 1)][0], runs[2 * (j - 1) + 1][1]
        one = np.full_like(im, (255, 0, 255))
        one[y0 - 4:y1 + 4, a - 4:b + 4] = im[y0 - 4:y1 + 4, a - 4:b + 4]
        path = os.path.join(tmp, f'judge-{j}-standing.png'); Image.fromarray(one).save(path)
        out[j] = path
    return out


def judges():
    sheets = []
    with tempfile.TemporaryDirectory() as tmp:
        pairs = standing_pairs(tmp)
        for j, rec_p in STANDING.items():
            rec = read(rec_p); old = rec['sprite']
            target = old['frames'][0][3]                     # the old frame's drawn height, hat and all
            out = old['sheet']
            cut = json.loads(py('tools/art/cast-unify-cut.py', pairs[j], '0', str(target), os.path.join(ROOT, out), '--grid', '1'))
            if j == 3:                                      # he faces the duel (errata 111 V)
                img = Image.open(os.path.join(ROOT, out)).convert('RGBA')
                a = np.asarray(img).copy()
                for x, y, w, h in cut['frames']:
                    a[y:y + h, x:x + w] = a[y:y + h, x:x + w][:, ::-1]
                Image.fromarray(a).save(os.path.join(ROOT, out))
            rec['sprite']['frames'] = cut['frames']
            rec['sprite']['figureHeight'] = figure_height(out, cut['frames'], j in HAT)
            write(rec_p, rec); sheets.append(out)
        for j, rec_p in SEATED.items():
            rec = read(rec_p); old = rec['sprite']
            target = rest_height(old['sheet'], old['frames'])
            out = old['sheet']
            raw = os.path.join(tmp, f'seated-{j}.png')
            src, row = SEATED_FROM[j]
            cut = json.loads(py('tools/art/cast-unify-cut.py', src, str(row), '300', raw, '--grid', '1'))
            height = int(round(300 * target / rest_height(raw, cut['frames'])))
            cut = json.loads(py('tools/art/cast-unify-cut.py', src, str(row), str(height), raw, '--grid', '1'))
            fj = os.path.join(tmp, f'seated-{j}.json'); json.dump(cut, open(fj, 'w'))
            reg = json.loads(py('tools/art/bust-register.py', raw, fj, os.path.join(ROOT, out), '--bottom'))
            rec['sprite']['frames'] = reg['frames']
            write(rec_p, rec); sheets.append(out)
    snap(*sheets)
    print(json.dumps({p: read(p)['sprite']['frames'][0] for p in [*STANDING.values(), *SEATED.values()]}, indent=1))


if __name__ == '__main__':
    {'frame': frame, 'judges': judges}[sys.argv[1]]()
