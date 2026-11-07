"""The acted poses measured before anyone looks (CLAUDE.md style gate step 2; reference/acted-directions/brief.md).

For each figure given new frames by tools/art/acted-poses.py (errata 148), drawn as the engine draws it -- a
sheet with a figureHeight scaled to the room's man where it stands, a 1:1 sheet as it is -- and Thad drawn at
that man, NEAREST, as the engine draws him:

  * texture of the rest frame and of each new frame (tools/art/cast-softer-measure.py's metric: the mean
    absolute 4-neighbour luminance step over the figure's interior), and the ratio of each to Thad's. The
    brief's flag is 1.35x Thad's.
  * the head, crown to chin, BY RULER (errata 139: the automatic neck-finder fails on hats, beards and bent
    heads): the picture renders/acted-poses-beside-thad.png puts every new frame beside its rest frame and
    Thad, with the rest frame's crown and chin ruled across all of them.

Flags, does not decide. Usage: acted-poses-measure.py   prints JSON and writes the picture.
"""
import json, os, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WHO = ['content/ambient/winnie-registrar.json', 'content/ambient/sump.json',
       'content/ambient/pratt.json', 'content/ambient/pratt-jump.json']
OUT = 'renders/acted-poses-beside-thad.png'
FLAG = 1.35


def man_at(room, x, y):
    js = ("import {readFileSync} from 'node:fs'; import {WalkBoxes, heightIn} from './engine/core/WalkBoxes.ts';"
          "const m=JSON.parse(readFileSync('content/manifest.json','utf8'));"
          f"const r=m.rooms.map(p=>JSON.parse(readFileSync(p,'utf8'))).find(r=>r.id==='{room}');"
          f"const n=new WalkBoxes(r.walkBoxes,()=>true).nearest({x},{y}); console.log(n?heightIn(n.box,{y}):0);")
    return float(subprocess.check_output(['node', '--experimental-strip-types', '--input-type=module', '-e', js],
                                         cwd=ROOT, stderr=subprocess.DEVNULL).decode().split()[-1])


def texture(a):
    m = a[..., 3] >= 128
    l = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    inner = ndi.binary_erosion(m, iterations=2)
    dx = np.abs(np.diff(l, axis=1))[inner[:, 1:] & inner[:, :-1]]
    dy = np.abs(np.diff(l, axis=0))[inner[1:] & inner[:-1]]
    return round(float((dx.mean() + dy.mean()) / 2), 2)


thad_src = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')
thad_src = thad_src.crop(thad_src.getbbox())
report, strips = {'flag': FLAG}, []
for path in WHO:
    npc = json.load(open(os.path.join(ROOT, path))); s = npc['sprite']
    sheet = Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA')
    man = man_at(npc['room'], npc['x'], npc['y'])
    k = man * s.get('stature', 1) / s['figureHeight'] if s.get('figureHeight') else 1.0
    idx = [0] + list(range(5, len(s['frames'])))
    figs = []
    for i in idx:
        x, y, w, h = s['frames'][i]
        f = sheet.crop((x, y, x + w, y + h))
        if k != 1.0: f = f.resize((max(1, round(w * k)), max(1, round(h * k))), Image.NEAREST)
        figs.append(f)
    thad = thad_src.resize((round(thad_src.width * man / thad_src.height), round(man)), Image.NEAREST)
    t = texture(np.asarray(thad))
    row = {'room': npc['room'], 'man': man, 'thad': t,
           'frames': {str(i): {'texture': texture(np.asarray(f)), 'ratio': round(texture(np.asarray(f)) / t, 2)} for i, f in zip(idx, figs)}}
    row['flags'] = [f"frame {i}: texture {v['ratio']}x Thad's" for i, v in row['frames'].items() if v['ratio'] > FLAG]
    report[npc['id']] = row
    # The strip: Thad, then the rest frame and each new frame, standing on one line; behind a counter the
    # figure's waist is on the line at the height of Thad's waist (his frame's 0.47 from the top).
    counter = s.get('waistOn') is not None
    H = max([thad.height] + [f.height for f in figs]) + 40
    W = thad.width + sum(f.width + 30 for f in figs) + 60
    strip = Image.new('RGBA', (W, H), (96, 96, 96, 255))
    base = H - 10
    strip.alpha_composite(thad, (20, base - thad.height))
    x = thad.width + 50
    for f in figs:
        bottom = base - (round(thad.height * 0.53) if counter else 0)
        strip.alpha_composite(f, (x, bottom - f.height)); x += f.width + 30
    # The rest frame's crown and chin, by ruler: crown its top row, chin from its record's head fraction.
    rest = np.asarray(figs[0])[..., 3] >= 128
    r = np.nonzero(rest.any(1))[0]
    top = (base - (round(thad.height * 0.53) if counter else 0)) - figs[0].height + r[0]
    d = ImageDraw.Draw(strip)
    d.line([(thad.width + 40, top), (W, top)], fill=(255, 255, 0, 255))
    trow = np.nonzero((np.asarray(thad)[..., 3] >= 128).any(1))[0]
    d.line([(0, base - thad.height + trow[0]), (thad.width + 40, base - thad.height + trow[0])], fill=(0, 255, 255, 255))
    strips.append(strip)
W = max(s.width for s in strips); H = sum(s.height for s in strips)
sheet = Image.new('RGBA', (W, H), (96, 96, 96, 255)); y = 0
for s in strips: sheet.alpha_composite(s, (0, y)); y += s.height
sheet.convert('RGB').save(os.path.join(ROOT, OUT))
print(json.dumps(report, indent=1))
