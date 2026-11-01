"""Character style gate, step 2, for Deke Vessel: measured before anyone looks.
Flags, does not decide. Also writes the game-size lineup beside Thad and the
Nugget bar men from a real 1920x1080 game frame. Nothing is cut or placed.

TEXTURE here = mean absolute luminance difference between 4-neighbours over
the figure interior (alpha eroded 2 px), at Thad's in-game height, box
resampled. The 6.09 / 4.90 figures in CLAUDE.md came from a metric that was
never committed; this one gives Thad 6.48, so compare within this file only.
usage: python3 tools/art/deke-measure.py <attempt-dir> [<attempt-dir> ...]"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
R = '/home/user/consolation-prize/'
GAME_H = 296   # Thad at the near end of the bar: proofs/room-03/old-nugget-ships/one-strike-man-speaks.webp, hat y~340, soles y~636
FRAME = 'proofs/room-03/old-nugget-ships/one-strike-man-speaks.webp'

def lum(a): a = a.astype(float); return 0.299*a[..., 0] + 0.587*a[..., 1] + 0.114*a[..., 2]

def stats(img):
    a = np.asarray(img); m = a[..., 3] >= 128; l = lum(a[..., :3])
    inner = ndi.binary_erosion(m, iterations=2)
    dx = np.abs(np.diff(l, axis=1))[inner[:, 1:] & inner[:, :-1]]
    dy = np.abs(np.diff(l, axis=0))[inner[1:] & inner[:-1]]
    hsv = np.asarray(Image.fromarray(a[..., :3]).convert('HSV')).astype(float)
    return dict(height=int(m.any(1).sum()), texture=round((dx.mean() + dy.mean())/2, 2),
                lumMean=round(l[m].mean(), 1), lumSD=round(l[m].std(), 1), satMean=round(hsv[..., 1][m].mean(), 1))

def at_game(img):
    img = img.crop(img.getbbox()); s = GAME_H/img.height
    g = img.resize((max(1, round(img.width*s)), GAME_H), Image.BOX)
    a = np.asarray(g).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    return Image.fromarray(a, 'RGBA')

def poses(sheet_path):
    a = np.asarray(Image.open(R + sheet_path).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    key = (r > 170) & (b > 170) & (g < 100) & (r - g > 110) & (b - g > 110)
    fig = ndi.binary_opening(~key, iterations=1)
    edge = fig & ndi.binary_dilation(key)
    er, eg, eb = r[edge], g[edge], b[edge]
    halo = round(100*(((er - eg) > 60) & ((eb - eg) > 60)).mean(), 2)
    cols = np.where(fig.any(0))[0]; runs, s, p = [], cols[0], cols[0]
    for c in cols[1:]:
        if c - p > 8: runs.append((s, p)); s = c
        p = c
    runs.append((s, p)); runs = [x for x in runs if x[1] - x[0] > 40]
    out = []
    for x0, x1 in runs:
        m = fig[:, x0:x1 + 1]; ys = np.where(m.any(1))[0]
        rgba = np.dstack([a[:, x0:x1 + 1], m*255]).astype(np.uint8)[ys[0]:ys[-1] + 1]
        out.append(dict(x=[int(x0), int(x1)], top=int(ys[0]), base=int(ys[-1]), img=Image.fromarray(rgba, 'RGBA')))
    return out, halo

thad = at_game(Image.open(R + 'art/actors/thad-idle-left/idle-00.png').convert('RGBA'))
report = dict(metricNote=__doc__.split('TEXTURE')[1].split('usage')[0].strip(), gameHeight=GAME_H, thad=stats(thad), attempts={})
frame = Image.open(R + FRAME).convert('RGB').crop((1020, 320, 1800, 720))
for d in sys.argv[1:]:
    ps, halo = poses(d + '/sheet.png')
    bases = [p['base'] for p in ps]; heights = [p['base'] - p['top'] + 1 for p in ps]
    games = [at_game(p['img']) for p in ps]
    report['attempts'][d] = dict(poseCount=len(ps), sourceHeights=heights, baselineSpread=max(bases) - min(bases),
        magentaTintedEdgePct=halo, poses=[stats(g) for g in games])
    W = frame.width + 40 + thad.width + 30 + sum(g.width + 24 for g in games) + 20; H = frame.height
    c = Image.new('RGB', (W, H), (58, 40, 28)); c.paste(frame, (0, 0))
    x = frame.width + 40; base = H - 64
    c.paste(thad, (x, base - GAME_H), thad); x += thad.width + 30
    for g in games: c.paste(g, (x, base - GAME_H), g); x += g.width + 24
    n = d.rstrip('/').split('/')[-1]
    c.save(R + f'renders/room-03-{n}-beside-thad-game-size.png')
    c.resize((W*2, H*2), Image.NEAREST).save(R + f'renders/room-03-{n}-beside-thad@2x.png')
    json.dump(report['attempts'][d] | dict(thad=report['thad'], metricNote=report['metricNote']),
              open(R + d + '/measurements.json', 'w'), indent=1)
print(json.dumps(report, indent=1))
