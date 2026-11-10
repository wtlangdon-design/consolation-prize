"""EACH ROOM A COLOUR OF ITS OWN (errata 262; Tyler, 2026-11-10: "a nice way to differentiate different rooms from
each other, so they don't all look exactly the same").

Most interiors were one lamp-lit brown. This leans each listed room's shadows and mid-tones toward a colour that
belongs to it (reference/room-grades.json), and leaves its lamps and what they light warm. Nothing is redrawn and no
image operation is spent: it is one function of a pixel's own colour, applied to the room's plate and, so that a patch
cut from a plate still matches it pixel for pixel, to every other picture the room names (props, the plate's other
states). Masks are shapes and are left; figures are lit by the room's `figureLight` and are left.

Always from the untouched original: the first run copies each picture to art/staging/room-grade/originals/ and every
run reads from there, so running it twice changes nothing and removing a room from the list restores its plate.

    python3 tools/art/room-grade.py            write
    python3 tools/art/room-grade.py --check    exit 1 if any shipped picture is not what this would write
"""
import json
import os
import re
import shutil
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIGINALS = os.path.join(ROOT, 'art/staging/room-grade/originals')
LUMA = np.array([0.2126, 0.7152, 0.0722])
CHECK = '--check' in sys.argv


def grade(image, tint, strength, saturate):
    """Dark pixels lean to the tint at their own brightness; bright ones (the lamps' light) do not. Alpha is kept."""
    rgba = np.array(image.convert('RGBA')).astype(float)
    a = rgba[..., :3] / 255
    lum = (a @ LUMA)[..., None]
    lean = np.clip(1 - lum * 1.6, 0, 1) ** 1.2 * strength
    t = np.array(tint) / 255
    toward = (lum + 0.02) * (t / (t @ LUMA))
    mixed = a * (1 - lean) + toward * lean
    grey = (mixed @ LUMA)[..., None]
    out = grey + (mixed - grey) * saturate
    rgba[..., :3] = np.round(np.clip(out, 0, 1) * 255)
    return Image.fromarray(rgba.astype('uint8'), 'RGBA')


def pictures(room_path):
    """The plate and every picture cut from it: all the room file names, but masks, figures and staging."""
    text = open(room_path).read()
    found = sorted(set(re.findall(r'"(art/[^"]+\.png)"', text)))
    return [p for p in found if not p.startswith(('art/masks/', 'art/actors/', 'art/staging/', 'art/ui/'))]


def main():
    grades = json.load(open(os.path.join(ROOT, 'reference/room-grades.json')))['rooms']
    manifest = json.load(open(os.path.join(ROOT, 'content/manifest.json')))
    rooms = {}
    for path in manifest['rooms']:
        rooms[json.load(open(os.path.join(ROOT, path)))['id']] = os.path.join(ROOT, path)
    wanted = {}
    for room, spec in grades.items():
        if room not in rooms:
            raise SystemExit(f'reference/room-grades.json: no room "{room}"')
        for picture in pictures(rooms[room]):
            if picture in wanted and wanted[picture] != spec:
                raise SystemExit(f'{picture} is named by two rooms with different grades')
            wanted[picture] = spec
    os.makedirs(ORIGINALS, exist_ok=True)
    kept = {name for name in os.listdir(ORIGINALS)}
    stale = 0
    for picture, spec in sorted(wanted.items()):
        shipped = os.path.join(ROOT, picture)
        original = os.path.join(ORIGINALS, picture.replace('/', '__'))
        if not os.path.exists(original):
            if CHECK:
                print(f'stale: {picture} is listed and has no original kept: it was never graded')
                stale += 1
                continue
            shutil.copyfile(shipped, original)
        out = grade(Image.open(original), spec['tint'], spec['strength'], spec['saturate'])
        if Image.open(shipped).mode == 'RGB':
            out = out.convert('RGB')
        same = os.path.exists(shipped) and Image.open(shipped).convert('RGBA').tobytes() == out.convert('RGBA').tobytes()
        if CHECK:
            if not same:
                print(f'stale: {picture} is not its original graded as reference/room-grades.json says')
                stale += 1
            continue
        if not same:
            out.save(shipped)
        print(f"{picture}: {spec['why']}{'' if not same else ' (as it was)'}")
    # A picture whose room is no longer listed goes back to its original.
    for name in sorted(kept - {p.replace('/', '__') for p in wanted}):
        picture = name.replace('__', '/')
        if CHECK:
            print(f'stale: {picture} has an original kept and no grade listed: restore it')
            stale += 1
            continue
        shutil.copyfile(os.path.join(ORIGINALS, name), os.path.join(ROOT, picture))
        os.remove(os.path.join(ORIGINALS, name))
        print(f'{picture}: restored')
    if CHECK and stale:
        raise SystemExit(1)
    if CHECK:
        print(f'{len(wanted)} picture(s) are their originals, graded')


main()
