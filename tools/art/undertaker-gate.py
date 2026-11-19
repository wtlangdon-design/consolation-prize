"""The undertaker at the cemetery gate, before and after his redraw (errata 380; Tyler, 2026-11-19: "It looks like the
guy on the far right still has a big head?"). No image operation.

Boot Hill at game size as the stalled procession (T_PROCESSION_STALLED) places it: the hearse, the Reverend and the
undertaker (procession_undertaker, frame 0), with Thad beside the undertaker. The mourners stand at the far left,
outside the crop. Above, the undertaker's hill sheet as git HEAD has it; below, the sheet on disk.

  python3 tools/art/undertaker-gate.py [--rev REV]     writes renders/room-14-undertaker-at-the-gate.png
"""
import io, json, os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
mc = {'__file__': R('tools/art/memorial-crowd-cut.py'), '__name__': 'helpers'}
exec(open(mc['__file__']).read().rsplit("\nif __name__ == '__main__':", 1)[0], mc)
bt, place = mc['bt'], mc['place']
REV = sys.argv[sys.argv.index('--rev') + 1] if '--rev' in sys.argv else 'HEAD'


def frame0(rec, sheet=None):
    x, y, w, h = rec['sprite']['frames'][0]
    im = sheet or Image.open(R(rec['sprite']['sheet'])).convert('RGBA')
    return im.crop((x, y, x + w, y + h))


def main():
    room = bt['load']('content/rooms/boot-hill.json')
    get = lambda n: json.load(open(R(f'content/ambient/{n}.json')))
    hearse, sow, ut = get('procession-hearse'), get('procession-sowerby'), get('procession-undertaker')
    sheet = ut['sprite']['sheet']
    old = Image.open(io.BytesIO(subprocess.run(['git', 'show', f'{REV}:{sheet}'], cwd=ROOT, capture_output=True,
                                               check=True).stdout)).convert('RGBA')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'right' and not cl.get('state'))
    tx, ty = ut['x'] - 260, ut['y'] + 10
    panels = []
    for ut_sheet in (old, Image.open(R(sheet)).convert('RGBA')):
        im = Image.open(R(room['background'])).convert('RGBA')
        for rec in sorted((hearse, sow, ut), key=lambda r: r['y']):
            place(im, room, rec, frame0(rec, ut_sheet if rec is ut else None), rec['sprite']['figureHeight'],
                  rec['sprite'].get('stature', 1))
        t = Image.open(R(st['frames'][0])).convert('RGBA')
        t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
        kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
        ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
        im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
        panels.append(im.crop((1000, 380, 1920, 864)).convert('RGB'))
    pw, ph = panels[0].size
    o = Image.new('RGB', (pw, ph * 2 + 8)); o.paste(panels[0], (0, 0)); o.paste(panels[1], (0, ph + 8))
    o.save(R('renders/room-14-undertaker-at-the-gate.png'))
    print(json.dumps({'wrote': 'renders/room-14-undertaker-at-the-gate.png', 'oldFrom': f'{REV}:{sheet}'}))


if __name__ == '__main__':
    main()
