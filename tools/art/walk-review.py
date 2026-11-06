"""EVERY FRAME OF EVERY WALK, LARGE, before anyone is shown a walk (Tyler, 2026-11-06: "How are you missing
these things?" -- a hand off Pratt's mallet in one frame, the miners' hands off their tools, the miners
walking sideways up the hill. Each was there to see in one frame of a cycle that had been judged from a
contact strip of a few).

Writes renders/walks-every-frame/<walker>.png: each frame of the cycle, in order, numbered, on a mid-grey,
at a scale where a man is about 300 px tall, so a hand, a tool and a foot can be checked in every frame.

Usage: walk-review.py [walker ...]
"""
import json, os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'renders/walks-every-frame')
want = [a for a in sys.argv[1:] if not a.startswith("--")]


def sheet_frames(sheet, frames):
    im = Image.open(os.path.join(ROOT, sheet)).convert('RGBA')
    return [im.crop((x, y, x + w, y + h)) for x, y, w, h in frames]


def write(name, frames, per_row=8):
    k = 300 / max(f.height for f in frames)
    fs = [f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.NEAREST) for f in frames]
    cw = max(f.width for f in fs) + 12; ch = max(f.height for f in fs) + 24
    rows = (len(fs) + per_row - 1) // per_row
    c = Image.new('RGB', (cw * min(per_row, len(fs)), ch * rows), (96, 96, 104)); d = ImageDraw.Draw(c)
    for i, f in enumerate(fs):
        x, y = (i % per_row) * cw, (i // per_row) * ch
        c.paste(f, (x + 6, y + 20), f); d.text((x + 6, y + 4), str(i), fill=(255, 240, 160))
        d.rectangle([x + 5, y + 19, x + 6 + f.width, y + 20 + f.height], outline=(140, 140, 150))   # the frame's own canvas, so an offset pose reads as one
    os.makedirs(OUT, exist_ok=True)
    c.save(os.path.join(OUT, f'{name}.png'))
    return c.size


manifest = json.load(open(os.path.join(ROOT, 'content/manifest.json')))
for p in manifest['ambient']:
    n = json.load(open(os.path.join(ROOT, p)))
    for kind in ('exit', 'loop', 'arrive'):
        e = n.get(kind)
        if not e or len(e.get('frames') or []) < 2: continue
        name = f"{n['id']}-{kind}"
        if want and not any(w in name for w in want): continue
        print(name, write(name, sheet_frames(e['sheet'], e['frames'])))
for p in manifest.get('actors', []):
    a = json.load(open(os.path.join(ROOT, p)))
    for c in a.get('clips', []):
        if c['id'] != 'walk' or len(c['frames']) < 2: continue
        name = f"{a['id']}-walk-{c['facing']}"
        if want and not any(w in name for w in want): continue
        print(name, write(name, [Image.open(os.path.join(ROOT, f)).convert('RGBA') for f in c['frames']]))


# AND EVERY PATH OVER ITS ROOM (Tyler, 2026-11-06: the miners at the top of the road "just randomly walking
# across a building" -- the path's last leg ran through the cabin, and nothing showed the path over the
# picture): renders/walks-every-frame/<walker>-path.png, the plate with the path and, at each point, a
# box the size the walker is drawn there. Look at where every box stands before a walk is shown.
from PIL import ImageDraw as _D
rooms = {json.load(open(os.path.join(ROOT, p)))['id']: json.load(open(os.path.join(ROOT, p))) for p in manifest['rooms']}
for p in manifest['ambient']:
    n = json.load(open(os.path.join(ROOT, p)))
    for kind in ('exit', 'loop', 'arrive'):
        e = n.get(kind)
        if not e or len(e.get('frames') or []) < 2: continue
        name = f"{n['id']}-{kind}"
        if want and not any(w in name for w in want): continue
        room = rooms[n['room']]; bg = room.get('background')
        bg = bg if isinstance(bg, str) else None
        if not bg: continue
        im = Image.open(os.path.join(ROOT, bg)).convert('RGB'); d = _D.Draw(im)
        pts = ([[n['x'], n['y']]] if kind == 'exit' else []) + e['path']
        d.line([tuple(q) for q in pts], fill=(255, 220, 60), width=3)
        fw, fh = e['frames'][0][2], e['frames'][0][3]
        for i, (x, y) in enumerate(pts):
            hts = e.get('heights')
            if not hts: continue
            k = hts[min(i - (1 if kind == 'exit' else 0), len(hts) - 1)] / e['figureHeight']
            d.rectangle([x - fw * k / 2, y - fh * k, x + fw * k / 2, y], outline=(120, 220, 255))
        for prop in room.get('props') or []:
            pw, ph = prop['frame'][2], prop['frame'][3]
            d.rectangle([prop['x'] - pw // 2, prop['y'] - ph + 1, prop['x'] - pw // 2 + pw, prop['y']], outline=(255, 90, 90))
        im.save(os.path.join(OUT, f'{name}-path.png'))
        print(name, 'path drawn')


# AND EVERY OTHER CLIP: an actor's actions and idles, and every ambient figure's own animation (its idle
# loop, breath and actions), each frame large and in order -- renders/movement-every-frame/<name>.png.
# Tyler, 2026-11-06, after the walks: "Any other movement in the game we should evaluate?" -- each is
# looked at for a hand leaving what it holds, a foot sliding, a pop between frames, before it is shown.
if '--all' in sys.argv:
    OUT2 = os.path.join(ROOT, 'renders/movement-every-frame'); os.makedirs(OUT2, exist_ok=True)
    def write2(name, frames, per_row=12):
        global OUT
        old, OUT = OUT, OUT2
        try: return write(name, frames, per_row)
        finally: OUT = old
    for p in manifest.get('actors', []):
        a = json.load(open(os.path.join(ROOT, p)))
        for c in a.get('clips', []):
            if c['id'] == 'walk' or len(c['frames']) < 2: continue
            print(f"{a['id']}-{c['id']}-{c['facing']}", write2(f"{a['id']}-{c['id']}-{c['facing']}", [Image.open(os.path.join(ROOT, f)).convert('RGBA') for f in c['frames']]))
    for p in manifest['ambient']:
        n = json.load(open(os.path.join(ROOT, p)))
        sprites = [('', n.get('sprite'))] + [(f'-{r}', pl.get('sprite')) for r, pl in (n.get('placements') or {}).items() if pl.get('sprite')]
        for suffix, sp in sprites:
            if not sp or len(sp.get('frames') or []) < 2: continue
            print(f"{n['id']}{suffix}", write2(f"{n['id']}{suffix}", sheet_frames(sp['sheet'], sp['frames'])))
