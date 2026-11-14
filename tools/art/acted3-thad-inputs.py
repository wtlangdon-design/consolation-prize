"""Acted directions, third pass: Thad's hand-over, the inputs (reference/acted-directions-3/brief.md, `thad`).
No image operation.

1. The style gate's picture (CLAUDE.md, step 1): Thad in the Nugget (Room 3) where he stands to deal with Deke Vessel
   -- Deke's walk-to, (730, 818), facing right -- across the whiskey barrel (prop, x 890) from Deke at (1046, 815),
   both drawn as the engine draws them: at the room's man, graded by the room's figureLight and tinted by its lamps
   (tools/art/beside-thad.py's own functions). And the same with Thad facing left from Deke's other side, for the
   left-facing clip. Cropped round the three of them.
2. The templates: Thad's stand frame in each facing, three times on magenta (lineup-redraws.py's template()), the
   first the ruler.

Writes art/staging/acted-directions-3/thad/{nugget-right.png, nugget-left.png, template-right.png, template-left.png}.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
OUT = R('art/staging/acted-directions-3/thad')
ns = {'__file__': R('tools/art/beside-thad.py')}
src = open(ns['__file__']).read(); exec(src[:src.index('def main')], ns)
lt = {'__file__': R('tools/art/lineup-redraws.py')}
exec(open(lt['__file__']).read().split('def head_crop')[0], lt)


def crop(im):
    return im.crop(im.getbbox())


def draw(canvas, img, anchor, h_fig, man, x, y):
    k = man / h_fig
    s = img.resize((round(img.width * k), round(img.height * k)), Image.NEAREST)
    canvas.alpha_composite(s, (round(x - anchor[0] * k), round(y - anchor[1] * k)))


def main():
    room = ns['load']('content/rooms/nugget.json')
    deke = ns['load']('content/ambient/deke-vessel.json')
    thad = ns['load']('content/actors/thad.json')
    plate = Image.open(R(room['background'])).convert('RGBA')
    barrel = next(p for p in room['props'] if p['id'] == 'whiskey_barrel')
    b = Image.open(R(barrel['sheet'])).convert('RGBA'); fx, fy, fw, fh = barrel['frame']; b = b.crop((fx, fy, fx + fw, fy + fh))
    s = deke['sprite']; x, y, w, h = s['frames'][0]
    dimg = Image.open(R(s['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
    dimg = ns['lit'](dimg, ns['grade_for'](room, deke['id']), ns['mover_tint'](room.get('lamps'), deke['x'], deke['y']))
    stands = {c['facing']: c for c in thad['clips'] if c['id'] == 'stand' and not c.get('state')}
    for facing, tx, ty in (('right', 730, 818), ('left', 1362, 818)):
        im = plate.copy()
        im.alpha_composite(b, (barrel['x'] - fw // 2, barrel['y'] - fh + 1))
        man_d = ns['curve_man'](room, deke['x'], deke['y'])
        draw(im, dimg, (w / 2, h - 1), deke.get('figureHeight') or (h - 1) * (s.get('stature') or 1), man_d * (s.get('stature') or 1), deke['x'], deke['y'])
        st = stands[facing]
        timg = Image.open(R(st['frames'][0])).convert('RGBA')
        timg = ns['lit'](timg, ns['grade_for'](room, 'thad'), ns['mover_tint'](room.get('lamps'), tx, ty))
        draw(im, timg, st['anchor'], st['figureHeight'], ns['curve_man'](room, tx, ty), tx, ty)
        x0 = min(tx, deke['x']) - 300; x1 = max(tx, deke['x']) + 300
        im.crop((max(0, x0), 280, min(1920, x1), 864)).convert('RGB').save(os.path.join(OUT, f'nugget-{facing}.png'))
        rest = crop(Image.open(R(st['frames'][0])).convert('RGBA'))
        lt['template']([rest] * 3, [int(rest.width * 0.9) + 80] * 2).save(os.path.join(OUT, f'template-{facing}.png'))
    print('written to', os.path.relpath(OUT, ROOT))


main()
