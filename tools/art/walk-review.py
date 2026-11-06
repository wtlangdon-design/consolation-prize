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
want = sys.argv[1:]


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
