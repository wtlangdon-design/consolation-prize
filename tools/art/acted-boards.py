#!/usr/bin/env python3
"""The boards for the acted directions' pose sheets (doc 95; errata 141).

Each board is one character's crop of the locked cast master (errata 111 B:
every new pose is drawn from it, never from a later version) beside the
IN-GAME Thad (errata 139: every earlier board used Thad's cast-sheet drawing,
whose head is about 1.3x the in-game Thad's, and the redraws inherited it).
The in-game Thad is scaled, nearest-neighbour, to the height the master's Thad
has on the same board, so the two stand at one scale and a head can be
measured against the hero the game actually shows.

    python3 tools/art/acted-boards.py <out-dir>

Writes <out-dir>/<name>-board.png for every character the brief names, and
thad-board.png (the in-game Thad from the front and from the back).
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MASTER = os.path.join(ROOT, 'art/staging/cast-master/master-02.png')
BOXES = os.path.join(ROOT, 'art/staging/cast-master/master-02-boxes.json')
THAD = os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')
GRID = 3
# Master index of each character the brief draws (tools/art/cast-master-sheet.py NAMES).
CAST = {'winnie': 3, 'sump': 6, 'pratt': 8, 'deke': 2}
THAD_BACK = os.path.join(ROOT, 'art/actors/thad-stand-back/stand-00.png')


def thad_in_game(height, path=THAD):
    im = Image.open(path).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
    im = im.crop(box)
    width = max(1, round(im.width * height / im.height))
    return im.resize((width, height), Image.NEAREST)


def main(out):
    os.makedirs(out, exist_ok=True)
    boxes = json.load(open(BOXES))['boxes']
    # The master's Thad on a board is row one's man, unscaled: his locked height.
    thad_h = round((boxes[0][3] - boxes[0][1]) / GRID) * GRID
    thad = thad_in_game(thad_h)
    for name, index in CAST.items():
        with tempfile.TemporaryDirectory() as tmp:
            crop = os.path.join(tmp, 'crop.png')
            subprocess.run([sys.executable, os.path.join(ROOT, 'tools/art/cast-master-sheet.py'), MASTER, BOXES,
                            crop, '--board', str(index)], check=True, capture_output=True)
            sheet = Image.open(crop).convert('RGB')
        rgb = np.asarray(sheet).astype(int)
        key = (rgb[..., 0] == 255) & (rgb[..., 1] == 0) & (rgb[..., 2] == 255)
        ys, xs = np.where(~key)
        figure = sheet.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        mask = Image.fromarray((~key[ys.min():ys.max() + 1, xs.min():xs.max() + 1]).astype(np.uint8) * 255)
        gap, pad = 60, 40
        W = thad.width + gap + figure.width + 2 * pad
        H = max(thad.height, figure.height) + 2 * pad
        board = Image.new('RGB', (W, H), (255, 0, 255))
        board.paste(thad, (pad, H - pad - thad.height), thad)
        board.paste(figure, (pad + thad.width + gap, H - pad - figure.height), mask)
        path = os.path.join(out, f'{name}-board.png')
        board.save(path)
        print(json.dumps({'board': path, 'thad': [thad.width, thad.height], name: [figure.width, figure.height]}))
    # THAD HIMSELF, for the pickaxe sheet: the in-game Thad from the front and
    # from the back, the way he faces the rock in Room 33.
    back = thad_in_game(thad_h, THAD_BACK)
    gap, pad = 60, 40
    board = Image.new('RGB', (thad.width + gap + back.width + 2 * pad, thad_h + 2 * pad), (255, 0, 255))
    board.paste(thad, (pad, pad), thad)
    board.paste(back, (pad + thad.width + gap, pad), back)
    path = os.path.join(out, 'thad-board.png')
    board.save(path)
    print(json.dumps({'board': path, 'thad': [thad.width, thad.height], 'back': [back.width, back.height]}))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'reference/acted-directions'))
