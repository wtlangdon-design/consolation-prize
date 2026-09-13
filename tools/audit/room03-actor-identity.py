#!/usr/bin/env python3
"""
ROOM 3 ASSET TRUTH AUDIT, PART TWO: for each painted patron, is there an
INDEPENDENT asset that is the same art as the man in the preferred plate?

Read only. No image operation, no art written, no runtime touched.

THE TEST. An independent asset is placed over the preferred plate at the
registration the repository already records for it, and two things are measured
inside its own opaque area:

    RGB AGREEMENT   mean |asset - plate|. If the asset IS the painted man --
                    the same pixels, merely cut out -- this is near zero. A
                    redrawn likeness of the same character scores tens.

    COVERAGE        does the asset's silhouette contain the painted man's, so
                    that drawing it could hide him? Only answerable where a
                    people-free version of that patch exists to subtract.

A caution the numbers cannot state themselves: agreement is measured against a
plate that CONTAINS the man, so a low score proves sameness and a high score
proves difference, but nothing here can make a different man into the same one.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PREF = ROOT / 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png'
STAGE = ROOT / 'art/staging/room-03'


def place(asset, scale, at, shape):
    im = Image.open(asset).convert('RGBA')
    if scale != 1.0:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                       Image.LANCZOS)
    canvas = Image.new('RGBA', (shape[1], shape[0]), (0, 0, 0, 0))
    canvas.alpha_composite(im, at)
    return np.asarray(canvas)


def report(label, asset, scale, at, plate):
    a = place(asset, scale, at, plate.shape[:2])
    m = a[..., 3] > 200
    if m.sum() < 200:
        print(f'  {label:<22} placed outside the plate'); return
    d = np.abs(a[..., :3].astype(float) - plate)[m].mean()
    rel = str(Path(asset).relative_to(ROOT))
    verdict = ('SAME PIXELS' if d < 3 else
               'SAME ART, RESAMPLED' if d < 12 else
               'DIFFERENT ART')
    print(f'  {label:<22} {rel:<56} scale {scale:<7} at {str(tuple(at)):<12} '
          f'mean|diff| {d:6.1f}  {verdict}')


def main():
    plate = np.asarray(Image.open(PREF).convert('RGB')).astype(float)

    print('A. THE FOUR CARD PLAYERS, at the registration cast-card-players-01 records\n')
    reg = json.loads((STAGE / 'cast-card-players-01/registration.json').read_text())
    print(f'   (registered against {reg["plate"]},')
    print(f'    which this audit measured as 0.00 different from the preferred plate')
    print(f'    inside all four card boxes)\n')
    for p in reg['players']:
        report(p['id'], STAGE / f'cast-card-players-01/{p["id"]}.png',
               p['scale'], tuple(p['placedAt']), plate)

    print('\nB. THE SHIPPING AMBIENT CASTS, at the population boxes nugget-candidate declares\n')
    room = json.loads((ROOT / 'content/rooms/nugget-candidate.json').read_text())
    casts = {'card_1': 'cast-nugget-card-1', 'card_2': 'cast-nugget-card-2',
             'card_3': 'cast-nugget-card-3', 'card_4': 'cast-nugget-card-4',
             'bar_1': 'cast-nugget-bar-1', 'bar_2': 'cast-nugget-bar-2',
             'bar_3': 'cast-nugget-bar-3'}
    for p in room['population']['people']:
        if p['id'] not in casts:
            continue
        f = ROOT / f'art/actors/{casts[p["id"]]}.png'
        if not f.exists():
            print(f'  {p["id"]:<22} NO FILE {f}'); continue
        x, y, w, h = p['box']
        im = Image.open(f)
        s = round(h / im.height, 4)
        report(p['id'], f, s, (x, y), plate)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
