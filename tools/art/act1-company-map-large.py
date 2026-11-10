"""The Company's map, large, for I-3 (reference/act1-dinner/brief.md section 2; doc 120 I-3). No image operation here.

act1-dinner operation 2 drew the map unrolled on Madame Ozymandia's table at 1536x1024, smooth. This makes it the
game's 1920x864 background:

  - the whole sheet is kept, so the two rocks at the top and the road at the bottom both stay ~150 px or more inside
    the frame (the brief: "Nothing important within 150 px of the frame's edge"): scaled to 864 tall;
  - the table cloth is carried out to 1920 at each side, mirrored from the operation's own cloth at that edge;
  - drawn to the game's grain: 4 px per art pixel (480x216), the ink lines lifted, box-reduced, posterised so
    the washes step as the plates' do, then nearest-neighbour up.

Writes art/backgrounds/room-16-company-map.png and renders/room-16-company-map-beside-the-tent.png.
"""
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/staging/act1-dinner/op-2/sheet.png')
OUT = os.path.join(ROOT, 'art/backgrounds/room-16-company-map.png')
SHOW = os.path.join(ROOT, 'renders/room-16-company-map-beside-the-tent.png')
W, H, GRAIN = 1920, 864, 4
STEP = 10   # the posterise: washes step as the plates' do
EDGE = 28   # source columns of cloth at the left, outside the paper and its weights, top to bottom


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

    def cloth(strip, n, flip):
        reps = []
        k = 0
        while sum(r.shape[1] for r in reps) < n:
            reps.append(strip[:, ::-1] if (k % 2 == 0) == flip else strip)
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
    fall[:pad] = 0.55 + 0.45 * (x[:pad] / pad)
    fall[pad + body.shape[1]:] = 0.55 + 0.45 * ((W - 1 - x[pad + body.shape[1]:]) / (W - pad - body.shape[1]))
    full *= fall[None, :, None]
    img = Image.fromarray(np.clip(full, 0, 255).astype(np.uint8))
    img = img.filter(ImageFilter.UnsharpMask(radius=3, percent=80, threshold=2))
    small = img.resize((W // GRAIN, H // GRAIN), Image.BOX)
    a = np.asarray(small).astype(int)
    a = (a // STEP) * STEP + STEP // 2
    small = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    out = small.resize((W, H), Image.NEAREST)
    out.save(OUT)
    tent = Image.open(os.path.join(ROOT, 'art/backgrounds/room-16-tent.png')).convert('RGB')
    show = Image.new('RGB', (W, H * 2 + 16), (0, 0, 0))
    show.paste(tent, (0, 0))
    show.paste(out, (0, H + 16))
    show.save(SHOW)
    print('wrote', os.path.relpath(OUT, ROOT), out.size, 'pad', pad)


if __name__ == '__main__':
    main()
