"""Lower Street's bell-ringer, keyed from bell-ringer operation 1 (reference/streets/brief.md, errata 161). No
image operation here.

Doc 07 #4: "Church steps. Strikes the bell by hand, half a step flat, drunk." Five poses on magenta: rest,
breath (DERIVED from rest, as the cat's was), strike-up, strike, talk. He is cut exactly as
tools/art/room20-cat.py cut the cat -- its keying, its cut, its LANCZOS scale with a hard alpha and a
despill, its breath, its grade to the light where he stands -- with two things a man needs and a cat did
not:
  * HIS HEIGHT IS A MAN'S. Lower Street's depth is Room 20's exterior curve (proofs/room-43/graybox.json:
    258 at y 705, 362 at y 858). He stands at the foot of the church steps, left of the bell post, his
    soles on y 700, where the curve gives 255. 255 is crown to sole WITHOUT his bowler (the hat is not
    counted, as Pratt's is not: tools/art/figure-height.py --hat), so his drawn height is a little more.
  * ONE LEVEL OF PIXELATION (errata 112): each frame snapped to a man's 115 art pixels, by
    tools/art/one-level.py's snap, so his pixels are Thad's size where he stands.

Writes art/actors/room-43-bell-ringer.png, art/staging/bell-ringer/bell-ringer/bell-ringer.json (the frame
rectangles, the top-left and anchor in the plate) and renders/room-43-bell-ringer.png.
"""
import importlib.util, json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('cat', os.path.join(ROOT, 'tools/art/room20-cat.py'))
cat = importlib.util.module_from_spec(spec); spec.loader.exec_module(cat)
src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py')}
exec(src[src.index('import json'):src.index('def man_at')], ns)
snap = ns['snap']

S = os.path.join(ROOT, 'art/staging/bell-ringer')
cat.S = S
cat.PLATE = os.path.join(ROOT, 'art/backgrounds/room-43-lower-street.png')
FAR, NEAR = (705, 258), (858, 362)
BOTTOM, CENTRE = 700, 915            # the foot of the church steps, left of the bell post (x ~960-1027)
MAN = FAR[1] + (BOTTOM - FAR[0]) * (NEAR[1] - FAR[1]) / (NEAR[0] - FAR[0])
OUT = 'art/actors/room-43-bell-ringer.png'


def crown_below_hat(rgba):
    """The top of his head under the bowler: below the brim, the outline narrows to the head (as
    figure-height.py --hat reads it). Returns rows from the top of the frame."""
    a = rgba[..., 3] > 0
    rows = np.nonzero(a.any(1))[0]
    w = np.array([a[r].sum() for r in range(a.shape[0])])
    top = rows[0]
    brim = top + int(np.argmax(w[top:top + a.shape[0] // 8]))            # the widest row near the top: the brim
    return brim


def main():
    # Probe at the MAN'S height, then correct so that crown-below-hat to sole is the man's height.
    probe = cat.poses(f'{S}/sheet-01.png', round(MAN))
    rest = probe[0][0]
    hat = crown_below_hat(rest)
    height = round(MAN * rest.shape[0] / (rest.shape[0] - hat))
    frames = cat.poses(f'{S}/sheet-01.png', height)
    frames[1] = (cat.breath(frames[0][0], 'bell-ringer'), frames[0][1])
    b = MAN / 115.0
    frames = [(snap(f, b), cx) for f, cx in frames]
    box = cat.box_of(frames, BOTTOM, CENTRE)
    placed = cat.graded(cat.lay(frames, BOTTOM, CENTRE, box), box, strength=0.3)
    record, cut, at = cat.write('bell-ringer', placed, box, ['rest', 'breath', 'strike-up', 'strike', 'talk'],
                                {'height': height, 'man': round(MAN, 1), 'hatRows': int(hat), 'posture': 'standing',
                                 'source': 'bell-ringer attempt 1 (art/staging/bell-ringer/sheet-01.png)'})
    record['sheet'] = OUT
    json.dump(record, open(f'{S}/bell-ringer/bell-ringer.json', 'w'), indent=1, default=int)
    Image.open(f'{S}/bell-ringer/bell-ringer.png').save(os.path.join(ROOT, OUT))
    plate = Image.open(cat.PLATE).convert('RGBA')
    views = []
    for f in cut:
        v = plate.copy(); v.alpha_composite(Image.fromarray(f), (at['x'], at['y']))
        views.append(v.crop((700, 330, 1150, 760)))
    thad = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')
    thad = thad.crop(thad.getbbox()); thad = thad.resize((round(thad.width * MAN / thad.height), round(MAN)), Image.NEAREST)
    v = plate.copy(); v.alpha_composite(Image.fromarray(cut[0]), (at['x'], at['y']))
    v.alpha_composite(thad, (CENTRE - 170 - thad.width // 2, BOTTOM - thad.height + 1))
    views.insert(0, v.crop((600, 330, 1050, 760)))
    strip = Image.new('RGBA', (sum(x.width for x in views), views[0].height))
    x = 0
    for one in views: strip.paste(one, (x, 0)); x += one.width
    strip.convert('RGB').save(os.path.join(ROOT, 'renders/room-43-bell-ringer.png'))
    print(json.dumps({k: record[k] for k in ('frames', 'topLeft', 'anchor', 'height', 'man', 'hatRows')}, default=int))


if __name__ == '__main__':
    main()
