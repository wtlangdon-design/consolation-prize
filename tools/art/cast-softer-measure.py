"""The undertaker and Madame Ozymandia beside Thad, measured before anyone looks
(CLAUDE.md character style gate step 2; reference/cast-softer/brief.md).

For each, at the size the game draws them (their sheets are 1:1 in their rooms):
  * texture -- tools/art/room04-cast-measure.py's metric, mean absolute
    4-neighbour luminance difference over the figure's interior -- against
    Thad's at the room's man where the figure stands. The flag is 1.35x Thad's.
  * head, crown to chin -- the crown is the figure's top row; the chin is the
    neck, the narrowest row of the outline under the head -- against Thad's at
    that depth. (Not for Ozymandia: her hands are at her temples.) The brief asks the
    undertaker's to be within 10% of Thad's.
  * shoulders -- the widest row in the top half, against Thad's.

Flags, does not decide. Usage: cast-softer-measure.py [label]   prints JSON.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WHO = {'undertaker': 'content/ambient/undertaker.json', 'ozymandia': 'content/ambient/ozymandia.json'}


def man_at(room, x, y):
    js = ("import {readFileSync} from 'node:fs'; import {WalkBoxes, heightIn} from './engine/core/WalkBoxes.ts';"
          "const m=JSON.parse(readFileSync('content/manifest.json','utf8'));"
          f"const r=m.rooms.map(p=>JSON.parse(readFileSync(p,'utf8'))).find(r=>r.id==='{room}');"
          f"const n=new WalkBoxes(r.walkBoxes,()=>true).nearest({x},{y}); console.log(n?heightIn(n.box,{y}):0);")
    out = subprocess.check_output(['node', '--experimental-strip-types', '--input-type=module', '-e', js], cwd=ROOT,
                                  stderr=subprocess.DEVNULL)
    return float(out.decode().strip().splitlines()[-1])


def lum(a):
    a = a.astype(float)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def texture(a):
    m = a[..., 3] >= 128
    l = lum(a[..., :3])
    inner = ndi.binary_erosion(m, iterations=2)
    dx = np.abs(np.diff(l, axis=1))[inner[:, 1:] & inner[:, :-1]]
    dy = np.abs(np.diff(l, axis=0))[inner[1:] & inner[:-1]]
    return round(float((dx.mean() + dy.mean()) / 2), 2)


def head(a, hands_up=False):
    """Crown to chin, read off the OUTLINE: below the head the silhouette narrows at the neck before the
    shoulders widen it, so the chin is the narrowest row between the head's widest row and the point where
    the outline has grown past twice the head's width. Not for a figure whose hands are at her head
    (Ozymandia): returns None."""
    if hands_up:
        return None
    m = a[..., 3] >= 128
    rows = np.nonzero(m.any(1))[0]; top = rows[0]
    widths = np.array([(int(np.ptp(np.nonzero(r)[0])) + 1) if r.any() else 0 for r in m])
    head_w = widths[top:top + 12].max()
    y = top
    while y + 1 < len(widths) and widths[y + 1] <= 2 * head_w and y - top < len(widths) // 2: y += 1
    seg = widths[top:y + 1]
    widest = int(np.argmax(seg[: max(1, len(seg) * 2 // 3)]))
    neck = widest + int(np.argmin(seg[widest:]))
    return int(neck + 1)


def shoulders(a):
    m = a[..., 3] >= 128
    rows = np.nonzero(m.any(1))[0]; top = rows[0]
    half = m[top:top + (rows[-1] - top) // 2]
    return int(max((int(np.ptp(np.nonzero(r)[0])) + 1) if r.any() else 0 for r in half))


def measure(img, hands_up=False):
    a = np.asarray(img)
    return {'texture': texture(a), 'head': head(a, hands_up), 'shoulders': shoulders(a),
            'height': int((a[..., 3] >= 128).any(1).sum())}


thad_src = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')
thad_src = thad_src.crop(thad_src.getbbox())
report = {'label': sys.argv[1] if len(sys.argv) > 1 else '', 'flag': 1.35}
for who, path in WHO.items():
    npc = json.load(open(os.path.join(ROOT, path)))
    s = npc['sprite']; x, y, w, h = s['frames'][0]
    fig = Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
    fig = fig.crop(fig.getbbox())
    man = man_at(npc['room'], npc['x'], npc['y'])
    # NEAREST, as the engine draws him (pixelArt: true). A BOX shrink blurs his block edges and makes
    # every 1:1 figure beside him read too sharp.
    thad = thad_src.resize((round(thad_src.width * man / thad_src.height), round(man)), Image.NEAREST)
    f, t = measure(fig, who == 'ozymandia'), measure(thad)
    report[who] = {'man': man, 'figure': f, 'thad': t,
                   'textureRatio': round(f['texture'] / t['texture'], 2),
                   'headRatio': round(f['head'] / t['head'], 2) if f['head'] and t['head'] else None,
                   'shoulderRatio': round(f['shoulders'] / t['shoulders'], 2)}
report['flags'] = [f"{w}: texture {report[w]['figure']['texture']} is {report[w]['textureRatio']}x Thad's"
                   for w in WHO if report[w]['textureRatio'] > 1.35]
if report['undertaker']['headRatio'] and abs(report['undertaker']['headRatio'] - 1) > 0.10:
    report['flags'].append(f"undertaker: head {report['undertaker']['headRatio']}x Thad's at that depth")
print(json.dumps(report, indent=1))
