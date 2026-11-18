"""The Reverend on Boot Hill, before and after his redraw (Tyler, 2026-11-18: "now the priest is the one character out
of place"; "All six sheets"). No image operation.

Boot Hill at game size, as tools/art/memorial-crowd-cut.py draws it: the Reverend at the gate (sowerby_gate, frame 0),
Colonel Fanshawe, the redrawn mourners (art/staging/memorial-crowd/rest-cut.png, not yet wired), the collection plate
and Thad. Above, the Reverend's sheet as git HEAD has it; below, the sheet on disk.

  python3 tools/art/sowerby-scene.py [--rev REV]      writes renders/room-14-reverend-in-the-scene.png
"""
import io, json, os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
mc = {'__file__': R('tools/art/memorial-crowd-cut.py'), '__name__': 'helpers'}
exec(open(mc['__file__']).read().rsplit("\nif __name__ == '__main__':", 1)[0], mc)
bt, place = mc['bt'], mc['place']
REV = sys.argv[sys.argv.index('--rev') + 1] if '--rev' in sys.argv else 'HEAD'


def main():
    room = bt['load']('content/rooms/boot-hill.json')
    get = lambda n: json.load(open(R(f'content/ambient/{n}.json')))
    fan, town, sow = get('memorial-fanshawe'), get('memorial-town'), get('sowerby-gate')
    crowd = Image.open(R('art/staging/memorial-crowd/rest-cut.png')).convert('RGBA')
    plate_prop = next(p for p in room.get('props', []) if p['id'] == 'collection_plate')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'right' and not cl.get('state'))
    sheet = sow['sprite']['sheet']
    old = Image.open(io.BytesIO(subprocess.run(['git', 'show', f'{REV}:{sheet}'], cwd=ROOT, capture_output=True,
                                               check=True).stdout)).convert('RGBA')
    new = Image.open(R(sheet)).convert('RGBA')
    panels = []
    for sow_sheet in (old, new):
        im = Image.open(R(room['background'])).convert('RGBA')
        x, y, w, h = sow['sprite']['frames'][0]
        place(im, room, sow, sow_sheet.crop((x, y, x + w, y + h)), sow['sprite']['figureHeight'])
        x, y, w, h = fan['sprite']['frames'][0]
        place(im, room, fan, Image.open(R(fan['sprite']['sheet'])).convert('RGBA').crop((x, y, x + w, y + h)),
              fan['sprite']['figureHeight'])
        place(im, room, town, crowd, town['sprite']['figureHeight'])
        px, py, pw, ph = plate_prop.get('frame', [0, 0, 0, 0])
        pimg = Image.open(R(plate_prop['sheet'])).convert('RGBA')
        if pw: pimg = pimg.crop((px, py, px + pw, py + ph))
        im.alpha_composite(pimg, (plate_prop['x'] - pimg.width // 2, plate_prop['y'] - pimg.height + 1))
        tx, ty = 325, 780
        t = Image.open(R(st['frames'][0])).convert('RGBA')
        t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
        kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
        ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
        im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
        panels.append(im.crop((200, 420, 1400, 864)).convert('RGB'))
    pw_, ph_ = panels[0].size
    o = Image.new('RGB', (pw_, ph_ * 2 + 8)); o.paste(panels[0], (0, 0)); o.paste(panels[1], (0, ph_ + 8))
    o.save(R('renders/room-14-reverend-in-the-scene.png'))
    print(json.dumps({'wrote': 'renders/room-14-reverend-in-the-scene.png', 'oldFrom': f'{REV}:{sheet}'}))


if __name__ == '__main__':
    main()
