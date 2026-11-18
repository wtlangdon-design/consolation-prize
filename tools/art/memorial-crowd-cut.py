"""The mourners on Boot Hill redrawn to Thad's proportions, cut (reference/memorial-crowd-art/brief.md; errata 376).
No image operation.

room-14-memorial-crowd operation 1 redrew the seven mourners' rest pose in place on a 2x template of the old frame 0
(art/staging/memorial-crowd/template.png). The tool takes the whole group, scales it by one factor so it stands as tall
as the old frame 0 (crown to lowest sole) -- the record's figureHeight is the old drawing's man -- lays it in the old
443 x 403 cell with its soles on the old sole row, centred as the old group was, snaps it to the one level at the
record's man and cleans the key off its rim. Nothing is regraded: every colour is the operation's own.

Only the rest pose is drawn (the brief): the main session derives the record's other four frames from it.

  python3 tools/art/memorial-crowd-cut.py [--write]
Writes art/staging/memorial-crowd/rest-cut.png and renders/room-14-memorial-crowd-in-the-scene.png.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
cut = {'__file__': R('tools/art/duel-crowd-cut.py'), '__name__': 'helpers'}
saved, sys.argv = sys.argv, ['duel-crowd-cut.py', 'town-left']
exec(open(cut['__file__']).read().rsplit("\nif __name__ == '__main__':", 1)[0], cut)
sys.argv = saved
alpha, rows_of, snap, despill_edge, opaque_rgb, N, downscale, measures, thad_at, bt, unpocket, rim_clean, window = (
    cut[k] for k in ('alpha', 'rows_of', 'snap', 'despill_edge', 'opaque_rgb', 'N', 'downscale', 'measures', 'thad_at',
                     'bt', 'unpocket', 'rim_clean', 'window'))
ST = 'art/staging/memorial-crowd'
WRITE = '--write' in sys.argv


def main():
    rec = json.load(open(R('content/ambient/memorial-town.json'))); sp = rec['sprite']
    lay = json.load(open(R(f'{ST}/layout.json')))
    out = np.asarray(Image.open(R(f'{ST}/op-1.png')).convert('RGB')).astype(int)
    old = np.asarray(Image.open(R(f'{ST}/crowd-frame-0-as-it-is.png')).convert('RGBA'))
    h, w = old.shape[:2]; K = lay['k']
    fig = window(out, opaque_rgb(out), lay['positions'][0], w * K, h * K, margin=40, vmargin=120)
    assert not alpha(fig)[0].any() and not alpha(fig)[-1].any(), 'the group runs past its window'
    r = rows_of(fig); c = np.nonzero(alpha(fig).any(0))[0]; fig = fig[r[0]:r[-1] + 1, c[0]:c[-1] + 1]
    o_r = rows_of(old); f = (o_r[-1] - o_r[0] + 1) / fig.shape[0]
    sm = downscale(fig, max(1, round(fig.shape[1] * f)), max(1, round(fig.shape[0] * f)))
    # The redrawn group stands a little wider than the old cell. The cell is widened evenly about its centre (the
    # record's x is the cell's centre, so nobody moves) rather than the people shrunk; the frame rect is reported.
    W = max(w, sm.shape[1] + 8); W += (W - w) % 2; pad = (W - w) // 2
    old = np.concatenate([np.zeros((h, pad, 4), old.dtype), old, np.zeros((h, pad, 4), old.dtype)], 1); w = W
    oc = np.nonzero(alpha(old).any(0))[0]; ocx = (oc[0] + oc[-1]) / 2
    cell = np.zeros_like(old)
    oy = int(o_r[-1]) - (sm.shape[0] - 1); ox = int(round(ocx - (sm.shape[1] - 1) / 2))
    ys0, xs0 = max(0, oy), max(0, ox); ys1, xs1 = min(h, oy + sm.shape[0]), min(w, ox + sm.shape[1])
    cell[ys0:ys1, xs0:xs1] = sm[ys0 - oy:ys1 - oy, xs0 - ox:xs1 - ox]
    lost = int(alpha(sm).sum() - alpha(cell).sum())
    block = sp['figureHeight'] / N
    cell = rim_clean(unpocket(despill_edge(snap(cell, block), width=max(2, int(np.ceil(block)) + 1))))
    room = bt['load']('content/rooms/boot-hill.json'); man = bt['curve_man'](room, rec['x'], rec['y'])
    k = man / sp['figureHeight']
    def game(a):
        im = Image.fromarray(a); return np.asarray(im.resize((round(im.width * k), round(im.height * k)), Image.BOX))
    rep = {'scale': round(f, 4), 'cell': [w, h], 'cellWas': [w - 2 * pad, h], 'restFrameForTheRecord': [2, 2, w, h], 'rows': {'old': [int(o_r[0]), int(o_r[-1])], 'new': [int(rows_of(cell)[0]), int(rows_of(cell)[-1])]},
           'width': {'old': int(oc[-1] - oc[0] + 1), 'new': int(np.ptp(np.nonzero(alpha(cell).any(0))[0]) + 1)},
           'pixelsLostAtCellEdge': lost, 'block': round(block, 3),
           'measures': measures((('mourners', game(cell)), ('before', game(old)), ('thadAtThisMan', thad_at(man))))}
    print(json.dumps(rep))
    if WRITE:
        Image.fromarray(cell).save(R(f'{ST}/rest-cut.png'))
        render(room, old, cell)


def place(im, room, rec, frame_img, fh, stature=1):
    k = bt['curve_man'](room, rec['x'], rec['y']) * stature / fh
    f = frame_img.resize((round(frame_img.width * k), round(frame_img.height * k)), Image.NEAREST)
    f = bt['lit'](f, bt['grade_for'](room, rec['id']), bt['mover_tint'](room.get('lamps'), rec['x'], rec['y']))
    im.alpha_composite(f, (round(rec['x'] - frame_img.width * k / 2), round(rec['y'] - frame_img.height * k)))


def render(room, old, new):
    plate = Image.open(R(room['background'])).convert('RGBA')
    get = lambda n: json.load(open(R(f'content/ambient/{n}.json')))
    fan, town = get('memorial-fanshawe'), get('memorial-town')
    sow = next(json.load(open(R(p))) for p in [f'content/ambient/{f}' for f in os.listdir(R('content/ambient'))]
               if json.load(open(R(p))).get('id') == 'sowerby_gate')
    plate_prop = next(p for p in room.get('props', []) if p['id'] == 'collection_plate')
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'right' and not cl.get('state'))
    panels = []
    for crowd in (old, new):
        im = plate.copy()
        for rec in (sow, fan):
            x, y, w, h = rec['sprite']['frames'][0]
            place(im, room, rec, Image.open(R(rec['sprite']['sheet'])).convert('RGBA').crop((x, y, x + w, y + h)), rec['sprite']['figureHeight'])
        place(im, room, town, Image.fromarray(crowd), town['sprite']['figureHeight'])
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
    o.save(R('renders/room-14-memorial-crowd-in-the-scene.png'))


if __name__ == '__main__':
    main()
