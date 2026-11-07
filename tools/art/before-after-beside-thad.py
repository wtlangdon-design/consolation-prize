"""Before and after beside Thad, in the figure's room at game size (the redraw briefs' side-by-side).

Each named figure is drawn as the engine draws it -- a standing sheet scaled by the room's man over its
figureHeight, nearest-neighbour; punched out by its clipPlane's mask -- at its place, with Thad standing
at the same depth beside it; once from <ref> (before) and once from the working tree (after), side by side.

Usage: before-after-beside-thad.py <ref> <out.png> <ambient.json> [--zoom N]
"""
import io, json, os, subprocess, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ref, out, path = sys.argv[1], sys.argv[2], sys.argv[3]
zoom = int(sys.argv[sys.argv.index('--zoom') + 1]) if '--zoom' in sys.argv else 1


def load(p, at, binary=False):
    if at is None:
        return open(os.path.join(ROOT, p), 'rb' if binary else 'r').read()
    o = subprocess.check_output(['git', 'show', f'{at}:{p}'], cwd=ROOT)
    return o if binary else o.decode()


def man_at(room, x, y):
    js = ("import {readFileSync} from 'node:fs'; import {WalkBoxes, heightIn} from './engine/core/WalkBoxes.ts';"
          "const m=JSON.parse(readFileSync('content/manifest.json','utf8'));"
          f"const r=m.rooms.map(p=>JSON.parse(readFileSync(p,'utf8'))).find(r=>r.id==='{room}');"
          f"const n=new WalkBoxes(r.walkBoxes,()=>true).nearest({x},{y}); console.log(n?heightIn(n.box,{y}):0);")
    return float(subprocess.check_output(['node', '--experimental-strip-types', '--input-type=module', '-e', js], cwd=ROOT,
                                         stderr=subprocess.DEVNULL).decode().split()[-1])


manifest = json.load(open(os.path.join(ROOT, 'content/manifest.json')))
thad = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')
thad = thad.crop(thad.getbbox())
tiles = []
for tag, at in (('BEFORE', ref), ('AFTER', None)):
    npc = json.loads(load(path, at)); s = npc['sprite']
    room = next(r for r in (json.load(open(os.path.join(ROOT, p))) for p in manifest['rooms']) if r['id'] == npc['room'])
    plate = Image.open(os.path.join(ROOT, room['background'])).convert('RGBA')
    x, y, w, h = s['frames'][0]
    f = Image.open(io.BytesIO(load(s['sheet'], at, True))).convert('RGBA').crop((x, y, x + w, y + h))
    man = man_at(npc['room'], npc['x'], npc['y'])
    if s.get('figureHeight'):
        k = man * s.get('stature', 1) / s['figureHeight']
        f = f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.NEAREST)
    left, top = npc['x'] - f.width // 2, npc['y'] - f.height + 1
    t = thad.resize((round(thad.width * man / thad.height), round(man)), Image.NEAREST)
    tx = left - t.width - max(6, t.width // 4)
    plate.alpha_composite(t, (tx, npc['y'] - t.height + 1))
    layer = Image.new('RGBA', plate.size, (0, 0, 0, 0)); layer.alpha_composite(f, (left, top))
    plane = next((p for p in room.get('occlusionPlanes', []) if p.get('level') == npc.get('clipPlane')), None)
    if plane:
        a = layer.getchannel('A'); a.paste(0, (0, 0), Image.open(os.path.join(ROOT, plane['mask'])).convert('L')); layer.putalpha(a)
    plate.alpha_composite(layer)
    pad = max(10, round(man * 0.08))
    box = (max(0, tx - pad), max(0, min(top, npc['y'] - t.height) - pad), min(plate.width, left + f.width + pad),
           min(plate.height, npc['y'] + pad))
    c = plate.crop(box).convert('RGB')
    c = c.resize((c.width * zoom, c.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(c); d.rectangle((0, 0, 60, 14), fill=(0, 0, 0)); d.text((3, 2), tag, fill=(255, 255, 0))
    tiles.append(c)
o = Image.new('RGB', (sum(t.width for t in tiles) + 10, max(t.height for t in tiles)), (30, 30, 30)); x = 0
for t in tiles: o.paste(t, (x, 0)); x += t.width + 10
o.save(os.path.join(ROOT, out)); print(out, o.size)
