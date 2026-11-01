"""Room 4's cast, measured before anyone looks (CLAUDE.md, character style gate step 2).

Flags, does not decide. Thad, Deke (re-cut from his approved sheet at this
room's height) and the three judges (cut from the composition master), each at
the size the game draws them here, measured with tools/art/deke-measure.py's
texture metric -- mean absolute 4-neighbour luminance difference over the
figure interior -- plus luminance mean and spread and saturation, and a
key-colour edge count. "Too sharp is the usual miss": a judge far above
Thad's texture is the flag to look for.

Also writes renders/room-04-cast-in-room.png: the plate with every figure where
the room places it, at game size.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-04')
FAR, NEAR = (600, 470), (840, 560)
THAD_MARK, DEKE_MARK = (800, 760), (1180, 760)


def height_at(y):
    return FAR[1] + (NEAR[1] - FAR[1]) * (y - FAR[0]) / (NEAR[0] - FAR[0])


def lum(a):
    a = a.astype(float)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def stats(img):
    a = np.asarray(img)
    m = a[..., 3] >= 128
    l = lum(a[..., :3])
    inner = ndi.binary_erosion(m, iterations=2)
    dx = np.abs(np.diff(l, axis=1))[inner[:, 1:] & inner[:, :-1]]
    dy = np.abs(np.diff(l, axis=0))[inner[1:] & inner[:-1]]
    hsv = np.asarray(Image.fromarray(a[..., :3]).convert('HSV')).astype(float)
    edge = m & ~ndi.binary_erosion(m)
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    magenta = edge & ((r - g) > 60) & ((b - g) > 60)
    return {'height': int(m.any(1).sum()), 'texture': round((dx.mean() + dy.mean()) / 2, 2),
            'lumMean': round(float(l[m].mean()), 1), 'lumSD': round(float(l[m].std()), 1),
            'satMean': round(float(hsv[..., 1][m].mean()), 1),
            'magentaEdgePct': round(100 * float(magenta.sum()) / max(1, int(edge.sum())), 2)}


def frame(sheet, rect):
    x, y, w, h = rect
    return Image.open(sheet).convert('RGBA').crop((x, y, x + w, y + h))


thad = Image.open(os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')).convert('RGBA')
thad = thad.crop(thad.getbbox())
th = int(round(height_at(THAD_MARK[1])))
thad = thad.resize((round(thad.width * th / thad.height), th), Image.BOX)
deke_cut = json.loads(open(os.path.join(S, 'deke/deke.json')).read())
deke = frame(os.path.join(ROOT, deke_cut['sheet']), deke_cut['frames'][0])
judges = json.loads(open(os.path.join(S, 'judges/judges.json')).read())['judges']

report = {'note': __doc__.split('\n')[0], 'curve': {'far': FAR, 'near': NEAR},
          'thad': {**stats(thad), 'drawnAt': THAD_MARK},
          'deke': {**stats(deke), 'drawnAt': DEKE_MARK, 'curveHeightAtFeet': round(height_at(DEKE_MARK[1]), 1)},
          'judges': []}
plate = Image.open(os.path.join(S, 'plate-01/candidate-1920x864.png')).convert('RGBA')
for j in judges:
    img = frame(os.path.join(ROOT, j['staged']), j['frames'][0])
    report['judges'].append({'judge': j['judge'], **stats(img), 'posture': 'seated'})
    plate.alpha_composite(img, (j['anchor']['x'] - img.width // 2, j['anchor']['y'] - img.height + 1))
plate.alpha_composite(deke, (DEKE_MARK[0] - deke.width // 2, DEKE_MARK[1] - deke.height + 1))
plate.alpha_composite(thad, (THAD_MARK[0] - thad.width // 2, THAD_MARK[1] - thad.height + 1))
plate.convert('RGB').save(os.path.join(ROOT, 'renders/room-04-cast-in-room.png'))
t = report['thad']['texture']
report['flags'] = [f"judge {j['judge']}: texture {j['texture']} against Thad's {t}"
                   for j in report['judges'] if j['texture'] > t * 1.35]
if report['deke']['texture'] > t * 1.35:
    report['flags'].append(f"deke: texture {report['deke']['texture']} against Thad's {t}")
os.makedirs(os.path.join(ROOT, 'proofs/room-04'), exist_ok=True)
json.dump(report, open(os.path.join(ROOT, 'proofs/room-04/cast-measure.json'), 'w'), indent=1)
print(json.dumps(report, indent=1))
