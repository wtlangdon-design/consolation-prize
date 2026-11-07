"""Build beside Thad, measured before anyone looks (CLAUDE.md style gate step 2; reference/leaner-cast/brief.md).

For each named figure, drawn as the engine draws it (a standing sheet scaled by the room's man over its
figureHeight, nearest-neighbour; a 1:1 sheet as it is), against Thad drawn at the room's man where the
figure stands:
  * head -- crown to chin. The crown is the top row, or for a hatted figure the man's crown (the figure's
    feet less its figureHeight); the chin is the neck, the narrowest row of the outline under the head.
  * shoulders -- the widest row between the chin and a quarter of a man below the crown.
The brief's flags: head outside 10% of Thad's, shoulders over 1.15x his. They flag; they do not decide.

Usage: build-vs-thad.py [--ref <git ref>] <ambient.json> ...   prints JSON (with --ref, the sheets and
records at that revision: the before).
"""
import io, json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = sys.argv[1:]
ref = None
if '--ref' in args:
    i = args.index('--ref'); ref = args[i + 1]; del args[i:i + 2]


def load(path, binary=False):
    if ref is None:
        return open(os.path.join(ROOT, path), 'rb' if binary else 'r').read()
    out = subprocess.check_output(['git', 'show', f'{ref}:{path}'], cwd=ROOT)
    return out if binary else out.decode()


def man_at(room, x, y):
    js = ("import {readFileSync} from 'node:fs'; import {WalkBoxes, heightIn} from './engine/core/WalkBoxes.ts';"
          "const m=JSON.parse(readFileSync('content/manifest.json','utf8'));"
          f"const r=m.rooms.map(p=>JSON.parse(readFileSync(p,'utf8'))).find(r=>r.id==='{room}');"
          f"const n=new WalkBoxes(r.walkBoxes,()=>true).nearest({x},{y}); console.log(n?heightIn(n.box,{y}):0);")
    out = subprocess.check_output(['node', '--experimental-strip-types', '--input-type=module', '-e', js], cwd=ROOT,
                                  stderr=subprocess.DEVNULL)
    return float(out.decode().split()[-1])


def widths(m):
    return np.array([(int(np.ptp(np.nonzero(r)[0])) + 1) if r.any() else 0 for r in m])


def build(img, crown_offset=0, man=None):
    m = np.asarray(img)[..., 3] >= 128
    rows = np.nonzero(m.any(1))[0]; top = rows[0] + crown_offset
    w = widths(m)
    head_w = w[top:top + max(6, len(w) // 40)].max()
    y = top
    while y + 1 < len(w) and w[y + 1] <= 2 * head_w and y - top < len(w) // 2: y += 1
    seg = w[top:y + 1]
    widest = int(np.argmax(seg[: max(1, len(seg) * 2 // 3)]))
    chin = top + widest + int(np.argmin(seg[widest:]))
    span = int((man or (rows[-1] - rows[0] + 1)) * 0.25)
    shoulders = int(w[chin:top + span].max()) if top + span > chin else int(w[chin])
    return {'head': int(chin - top + 1), 'shoulders': shoulders}


thad_src = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')
thad_src = thad_src.crop(thad_src.getbbox())
report = {'ref': ref or 'working tree', 'flags': []}
for path in args:
    npc = json.loads(load(path)); s = npc['sprite']
    sheet = Image.open(io.BytesIO(load(s['sheet'], True))).convert('RGBA')
    x, y, w, h = s['frames'][0]
    fig = sheet.crop((x, y, x + w, y + h)); fig = fig.crop(fig.getbbox())
    man = man_at(npc['room'], npc['x'], npc['y'])
    offset = 0
    if s.get('figureHeight'):
        k = man * s.get('stature', 1) / s['figureHeight']
        fig = fig.resize((max(1, round(fig.width * k)), max(1, round(fig.height * k))), Image.NEAREST)
        offset = max(0, fig.height - round(man * s.get('stature', 1)))     # a hat above the man's crown
    thad = thad_src.resize((round(thad_src.width * man / thad_src.height), round(man)), Image.NEAREST)
    f, t = build(fig, offset, man), build(thad, 0, man)
    row = {'room': npc['room'], 'man': man, 'figure': f, 'thad': t,
           'head': round(f['head'] / t['head'], 2), 'shoulders': round(f['shoulders'] / t['shoulders'], 2)}
    report[npc['id']] = row
    if abs(row['head'] - 1) > 0.10: report['flags'].append(f"{npc['id']}: head {row['head']}x Thad's")
    if row['shoulders'] > 1.15: report['flags'].append(f"{npc['id']}: shoulders {row['shoulders']}x Thad's")
print(json.dumps(report, indent=1))
