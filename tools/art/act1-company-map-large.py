"""The Company's map, large, for I-3 (reference/act1-dinner/brief.md section 2; doc 120 I-3). No image operation here.

act1-dinner operation 2 drew the map unrolled on Madame Ozymandia's table at 1536x1024, smooth and painted. Operation
4 (Tyler, 2026-11-10: "You can do another redraw on the map") redrew it as pixel art in the tent plate's style, its
layout kept so the I-3 wiring's hotspots and survey lines still land (checked by FEATURES below). This makes operation
4 the game's 1920x864 background:

  - the whole sheet is kept, so the two rocks at the top and the road at the bottom both stay ~150 px or more inside
    the frame (the brief: "Nothing important within 150 px of the frame's edge"): scaled to 864 tall;
  - the table cloth is carried out to 1920 at each side, mirrored from the operation's own cloth at that edge;
  - no further pixelation: operation 4 is drawn in the plates' grain, and is scaled as the plates are.

Writes art/backgrounds/room-16-company-map.png and renders/room-16-company-map-beside-the-tent.png.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/staging/act1-dinner/op-4/sheet.png')
OUT = os.path.join(ROOT, 'art/backgrounds/room-16-company-map.png')
SHOW = os.path.join(ROOT, 'renders/room-16-company-map-beside-the-tent.png')
W, H = 1920, 864
EDGE = 28   # source columns of cloth at the left, outside the paper and its weights, top to bottom


# Where the I-3 wiring (errata 251) points, in the background's pixels, as operation 2's map put them: the red
# circle's box, and two hotspots. The redraw must keep each within TOL px.
FEATURES = {'red circle': (962, 325, 1160, 487)}
TOL = 12


def check_features(img):
    a = np.asarray(img).astype(int)
    red = (a[..., 0] - a[..., 1] > 60) & (a[..., 0] > 110) & (a[..., 2] < 110)
    sub = red[150:750, 600:1400]
    lab, n = ndi.label(ndi.binary_closing(sub, iterations=3))
    big = 1 + int(np.argmax(ndi.sum(np.ones_like(lab), lab, range(1, n + 1))))   # the circle: the one large red shape
    ys, xs = np.nonzero(lab == big)
    got = (xs.min() + 600, ys.min() + 150, xs.max() + 600, ys.max() + 150)
    want = FEATURES['red circle']
    off = max(abs(g - w) for g, w in zip(got, want))
    print('red circle', got, 'was', want, 'off by', off)
    assert off <= TOL, f'the redraw moved the red circle {off} px: the wiring\'s hotspots would miss'


def main():
    src = Image.open(SRC).convert('RGB')
    s = H / src.height
    body = np.asarray(src.resize((round(src.width * s), H), Image.LANCZOS)).astype(np.uint8)
    pad = (W - body.shape[1]) // 2
    edge = round(EDGE * s)
    # The operation's paper reaches its right edge at the bottom, so both sides are carried out from the left's
    # clean cloth, the right side mirrored.
    left = body[:, :edge]
    right = left[:, ::-1]

    rng = np.random.default_rng(16)

    def cloth(strip, n, flip):
        # Tiles of the operation's own cloth, alternately mirrored, each rolled down by its own amount so the damask's
        # rows do not line up into stripes across the side.
        reps = []
        k = 0
        while sum(r.shape[1] for r in reps) < n:
            tile = strip[:, ::-1] if (k % 2 == 0) == flip else strip
            if k:
                # roll the damask, not the lamp: each row keeps its own light, only the pattern moves
                light = tile.astype(float).mean(1, keepdims=True)
                tex = tile / np.maximum(light, 1)
                rolled = np.roll(tex, int(rng.integers(0, H)), axis=0) * light
                tile = np.clip(rolled, 0, 255).astype(np.uint8)
            reps.append(tile)
            k += 1
        return np.concatenate(reps, 1)[:, :n]

    lft = cloth(left, pad, True)[:, ::-1]
    rgt = cloth(right, W - pad - body.shape[1], True)
    # Each carried-out side takes the light the operation has at its own edge, row by row, so there is no seam.
    def match(strip, at):
        k = at.reshape(H, -1, 3).mean(1) / np.maximum(strip[:, :6].reshape(H, -1, 3).mean(1), 1)
        return np.clip(strip * k[:, None, :], 0, 255)
    lft = match(lft[:, ::-1].astype(float), body[:, :6].astype(float))[:, ::-1]
    rgt = match(rgt.astype(float), body[:, -6:].astype(float))
    full = np.concatenate([lft, body, rgt], 1).astype(float)
    # The cloth beyond the operation's own edge falls off into the tent's dark, as the lamp is at the upper left.
    x = np.arange(W)
    fall = np.ones(W)
    fall[:pad] = 0.3 + 0.7 * (x[:pad] / pad) ** 0.7
    fall[pad + body.shape[1]:] = 0.3 + 0.7 * ((W - 1 - x[pad + body.shape[1]:]) / (W - pad - body.shape[1])) ** 0.7
    full *= fall[None, :, None]
    out = Image.fromarray(np.clip(full, 0, 255).astype(np.uint8))
    check_features(out)
    out.save(OUT)
    tent = Image.open(os.path.join(ROOT, 'art/backgrounds/room-16-tent.png')).convert('RGB')
    show = Image.new('RGB', (W, H * 2 + 16), (0, 0, 0))
    show.paste(tent, (0, 0))
    show.paste(out, (0, H + 16))
    show.save(SHOW)
    print('wrote', os.path.relpath(OUT, ROOT), out.size, 'pad', pad)


if __name__ == '__main__':
    main()
