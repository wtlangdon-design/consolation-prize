"""The six interiors' people (reference/ancillary-interiors/brief.md, errata 183), drawn by errata 144's method: each
sheet is painted OVER THE IN-GAME THAD (art/actors/thad-stand-front/stand-00.png), once per drawn pose, with the
person shown only as a face crop from the room's composition master; clothes, props and poses are in the prompt.

  python3 tools/art/interiors-people.py refs <NN> <who>
      writes art/staging/room-NN/<who>/{template,face,thad-in-room}.png
  python3 tools/art/interiors-people.py cut <NN> <who>
      cuts art/staging/room-NN/<who>/sheet-01.png (tools/art/cast-unify-cut.py --grid 1, which derives the breath as
      frame 1) at the room's man where the person stands times their stature, snaps every frame to one level
      (errata 112: blocks of man/115), and writes art/actors/room-NN-<who>.png and
      art/staging/room-NN/<who>/<who>.json (frames, frame names, figureHeight, stature, posture, man).
  python3 tools/art/interiors-people.py measure <NN> <who>
      the style gate's step 2 numbers against Thad (see measure()).

No image operation here.
"""
import contextlib
import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
THAD = os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')
MAGENTA = (255, 0, 255)

src = open(os.path.join(ROOT, 'tools/art/lineup-redraws.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/lineup-redraws.py')}
exec(src[src.index('import json'):src.index('def refs')], ns)
template, face = ns['template'], ns['face']
src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py')}
exec(src[src.index('import json'):src.index('def man_at')], ns)
snap = ns['snap']

# Each person: the master and the box of their face in it; the poses drawn (the cutter adds the breath as frame 1);
# where they stand in the plate (soles); their stature against the room's man; the room's depth curve.
PEOPLE = {
    (42, 'barber'): {
        'master': 'art/staging/room-42/composition-master-01.png', 'faceBox': (452, 255, 568, 380),
        'drawn': 4, 'names': ['rest', 'breath', 'wipe-a', 'wipe-b', 'talk'],
        'feet': (690, 735), 'stature': 1.0, 'posture': 'standing',
        'curve': ((720, 483), (858, 578)),
        'plate': 'art/backgrounds/room-42-barbers.png', 'thadAt': (470, 745), 'roomCrop': (180, 150, 1180, 830),
    },
    (38, 'photographer'): {
        'master': 'art/staging/room-38/composition-master-01.png', 'faceBox': (1095, 318, 1190, 412),
        'drawn': 4, 'names': ['rest', 'breath', 'card-up', 'card-tilt', 'talk'],
        'feet': (1383, 701), 'stature': 1.0, 'posture': 'standing',
        'curve': ((730, 458), (855, 545)),
        'plate': 'art/backgrounds/room-38-photographers-studio.png', 'thadAt': (1560, 735), 'roomCrop': (920, 150, 1920, 830),
    },
    (37, 'women'): {
        'master': 'art/staging/room-37/composition-master-01.png', 'faceBox': [(1290, 330, 1370, 410), (1385, 335, 1465, 415)],
        'drawn': 6, 'gaps': [50, 50, 220, 50, 50],
        'plate': 'art/backgrounds/room-37-boarding-house-parlour.png', 'thadAt': (1525, 665), 'roomCrop': (900, 100, 1920, 790),
        'curve': ((660, 452), (855, 587)),
    },
    (37, 'woman-a'): {
        'sheet': 'art/staging/room-37/women/sheet-a.png', 'drawn': 3, 'names': ['rest', 'breath', 'hair', 'talk'],
        'feet': (1679, 650), 'stature': 0.97, 'posture': 'standing', 'curve': ((660, 452), (855, 587)),
    },
    (37, 'woman-b'): {
        'sheet': 'art/staging/room-37/women/sheet-b.png', 'drawn': 3, 'names': ['rest', 'breath', 'arms', 'talk'],
        'feet': (1801, 660), 'stature': 0.97, 'posture': 'standing', 'curve': ((660, 452), (855, 587)),
    },
}


def stage(n, who):
    return os.path.join(ROOT, f'art/staging/room-{n}/{who}')


def man_at(curve, y):
    (fy, fh), (ny, nh) = curve
    return fh + (nh - fh) * (y - fy) / (ny - fy)


def thad():
    t = Image.open(THAD).convert('RGBA')
    return t.crop(t.getbbox())


def refs(n, who):
    p = PEOPLE[(n, who)]
    d = stage(n, who)
    os.makedirs(d, exist_ok=True)
    template([thad()] * p['drawn'], p.get('gaps')).save(os.path.join(d, 'template.png'))
    boxes = p['faceBox'] if isinstance(p['faceBox'], list) else [p['faceBox']]
    faces = [face(None, sheet=os.path.join(ROOT, p['master']), box=b) for b in boxes]
    if len(faces) == 1:
        faces[0].save(os.path.join(d, 'face.png'))
    else:                                         # a pair, side by side, as the boundary men's were
        both = Image.new('RGB', (1024 * len(faces), 1024), MAGENTA)
        for i, one in enumerate(faces):
            both.paste(one, (1024 * i, 0))
        both.resize((768 * len(faces), 768), Image.NEAREST).save(os.path.join(d, 'face.png'))
    plate = Image.open(os.path.join(ROOT, p['plate'])).convert('RGBA')
    t = thad()
    h = round(man_at(p['curve'], p['thadAt'][1]))
    t = t.resize((round(t.width * h / t.height), h), Image.NEAREST)
    plate.alpha_composite(t, (p['thadAt'][0] - t.width // 2, p['thadAt'][1] - h))
    plate.crop(p['roomCrop']).convert('RGB').save(os.path.join(d, 'thad-in-room.png'))
    print(os.path.relpath(d, ROOT))


def cut_at(sheet, height, tmp):
    out = os.path.join(tmp, f'c{height}.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'),
                                               sheet, '0', str(height), out, '--grid', '1'], cwd=ROOT).decode())
    return Image.open(out).convert('RGBA'), info['frames']


def split(n, who):
    """A pair drawn on one sheet: cut it at the widest run of clear magenta near its middle into sheet-a.png (the
    left group) and sheet-b.png (the right), each then cut as its own figure."""
    d = stage(n, who)
    a = np.asarray(Image.open(os.path.join(d, 'sheet-01.png')).convert('RGB')).astype(int)
    key = (a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110)
    clear = key.all(0)
    w = a.shape[1]
    best, run, at = 0, 0, w // 2
    for x in range(w // 4, 3 * w // 4):
        run = run + 1 if clear[x] else 0
        if run > best:
            best, at = run, x - run // 2
    Image.fromarray(a[:, :at].astype(np.uint8)).save(os.path.join(d, 'sheet-a.png'))
    Image.fromarray(a[:, at:].astype(np.uint8)).save(os.path.join(d, 'sheet-b.png'))
    print(json.dumps({'split at': at, 'gap': best}))


def standing(img, frame):
    x, y, w, h = frame
    return int((np.asarray(img)[y:y + h, x:x + w, 3] > 128).any(1).sum())


def cut(n, who):
    p = PEOPLE[(n, who)]
    d = stage(n, who)
    sheet = os.path.join(ROOT, p['sheet']) if p.get('sheet') else os.path.join(d, 'sheet-01.png')
    os.makedirs(d, exist_ok=True)
    man = man_at(p['curve'], p['feet'][1])
    target = round(man * p['stature'])
    with tempfile.TemporaryDirectory() as tmp:
        img, fr = cut_at(sheet, 400, tmp)
        img, fr = cut_at(sheet, round(400 * target / standing(img, fr[0])), tmp)
    a = np.asarray(img).copy()
    b = man / 115.0
    for x, y, w, h in fr:
        a[y:y + h, x:x + w] = snap(a[y:y + h, x:x + w].copy(), b)
    out = os.path.join(ROOT, f'art/actors/room-{n}-{who}.png')
    Image.fromarray(a).save(out)
    got = standing(Image.fromarray(a), fr[0])
    record = {'sheet': os.path.relpath(out, ROOT), 'frames': fr, 'frameNames': p['names'][:len(fr)],
              'figureHeight': got, 'stature': p['stature'], 'posture': p['posture'], 'man': round(man, 1),
              'feet': list(p['feet']),
              'note': f"Room {n}: the room's man where they stand (soles at y {p['feet'][1]}) is {round(man, 1)}; "
                      f"drawn at {p['stature']} of him, crown to sole. Frame 1 is a breath the cutter derives from frame 0.",
              'source': f'room-{n} ({os.path.relpath(sheet, ROOT)})'}
    json.dump(record, open(os.path.join(d, f'{who}.json'), 'w'), indent=1)
    print(json.dumps({k: record[k] for k in ('sheet', 'frames', 'figureHeight', 'man')}))




def measure(n, who):
    """CLAUDE.md style gate step 2, before anyone looks: each frame drawn as the engine draws it (its figureHeight
    is the room's man there) beside Thad drawn at that man, NEAREST. Flags, does not decide:
      * the edge: alpha is 0 or 255 only, and no key colour survives (magenta-ish pixels);
      * luminance p10 / p50 / p90 against Thad's;
      * texture (tools/art/cast-softer-measure.py's metric) as a ratio of Thad's; the briefs' flag is 1.35x.
    """
    spec = importlib.util.spec_from_file_location('csm', os.path.join(ROOT, 'tools/art/cast-softer-measure.py'))
    csm = importlib.util.module_from_spec(spec)
    with contextlib.redirect_stdout(io.StringIO()):         # it measures its own two figures on import
        spec.loader.exec_module(csm)
    rec = json.load(open(os.path.join(stage(n, who), f'{who}.json')))
    sheet = np.asarray(Image.open(os.path.join(ROOT, rec['sheet'])).convert('RGBA'))
    t = thad()
    t = np.asarray(t.resize((round(t.width * rec['man'] / t.height), round(rec['man'])), Image.NEAREST))

    def lums(a):
        m = a[..., 3] >= 128
        return [round(float(np.percentile(csm.lum(a[..., :3])[m], q)), 1) for q in (10, 50, 90)]
    out = {'thad': {'lum p10/50/90': lums(t), 'texture': csm.texture(t)}, 'frames': []}
    for i, (x, y, w, h) in enumerate(rec['frames']):
        f = sheet[y:y + h, x:x + w]
        alpha = f[..., 3]
        key = ((f[..., 0] > 180) & (f[..., 2] > 180) & (f[..., 1] < 90) & (alpha > 0)).sum()
        tex = csm.texture(f)
        out['frames'].append({'frame': rec['frameNames'][i], 'alphaBinary': bool(np.isin(alpha, (0, 255)).all()),
                              'keyPixels': int(key), 'lum p10/50/90': lums(f), 'texture': tex,
                              'textureVsThad': round(tex / out['thad']['texture'], 2)})
    print(json.dumps(out, indent=1))
    return out


if __name__ == '__main__':
    {'refs': refs, 'cut': cut, 'measure': measure, 'split': split}[sys.argv[1]](int(sys.argv[2]), sys.argv[3])
