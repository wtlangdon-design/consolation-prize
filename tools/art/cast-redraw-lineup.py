"""The full build's cast before and after its redraw at Thad's pixel size, each
beside Thad, at game size against its own room. No image operation.

Tyler (2026-11-02) asked whether Fanshawe was too sharp beside Thad; Sump,
Frame and the lobby clerk were the same. Post-processing was rejected ("Thad
is pixelated, not smooth"); each was regenerated against a side-by-side of
Thad (errata 84 J). This writes the comparison a person looks at: the sprite
as first shipped (from the directory given) and as redrawn, in its room, with
Thad standing beside it at that room's curve.

usage: python3 tools/art/cast-redraw-lineup.py <old-sprite-dir>
Writes renders/full-build-cast-redrawn.png.
"""
import json
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OLD = sys.argv[1]
CAST = [('sump', 'room-07-sump'), ('frame', 'room-09-frame'), ('lobby-clerk', 'room-10-clerk'), ('fanshawe', 'room-11-fanshawe')]


def main():
    thad = Image.open(os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')).convert('RGBA')
    thad = thad.crop(thad.getbbox())
    rows = []
    for amb_id, sprite in CAST:
        amb = json.load(open(os.path.join(ROOT, f'content/ambient/{amb_id}.json')))
        room = next(json.load(open(os.path.join(ROOT, p))) for p in json.load(open(os.path.join(ROOT, 'content/manifest.json')))['rooms']
                    if json.load(open(os.path.join(ROOT, p))).get('id') == amb['room'])
        plate = Image.open(os.path.join(ROOT, room['background'])).convert('RGBA')
        box = room['walkBoxes'][0]['scaleMode']
        stand = amb.get('walkTo', {'x': amb['x'] - 250, 'y': box['farY'] + 50})
        th = round(box['farHeight'] + (box['nearHeight'] - box['farHeight']) * (stand['y'] - box['farY']) / (box['nearY'] - box['farY']))
        t = thad.resize((round(thad.width * th / thad.height), th), Image.BOX)
        x, y, w, h = amb['sprite']['frames'][0]
        cells = []
        for sheet in (os.path.join(OLD, f'{sprite}.png'), os.path.join(ROOT, amb['sprite']['sheet'])):
            fig = Image.open(sheet).convert('RGBA').crop((x, y, x + w, y + h))
            v = plate.copy()
            v.alpha_composite(fig, (amb['x'] - w // 2, amb['y'] - h))
            v.alpha_composite(t, (stand['x'] - t.width // 2, stand['y'] - th))
            cx = (amb['x'] + stand['x']) // 2
            cells.append(v.crop((cx - 380, stand['y'] - th - 30, cx + 380, stand['y'] + 20)).convert('RGB'))
        rows.append(cells)
    W = 760 * 2 + 20
    H = sum(r[0].height + 20 for r in rows)
    out = Image.new('RGB', (W, H), (20, 20, 20))
    yy = 0
    for before, after in rows:
        out.paste(before, (0, yy))
        out.paste(after, (780, yy))
        yy += before.height + 20
    ImageDraw.Draw(out)
    out.save(os.path.join(ROOT, 'renders/full-build-cast-redrawn.png'))
    print('renders/full-build-cast-redrawn.png', out.size)


if __name__ == '__main__':
    main()
