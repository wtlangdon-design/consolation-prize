"""THAD TAKES THE LIGHT OF THE ROOM HE STANDS IN (errata 260; Tyler, 2026-11-10: "Make all of the changes that you flagged").

His coat is one cool blue in every frame he has. In the Nugget, the back room, the vault and under Prosperity a ruling
tinted him into the lamplight (`figureLight`, light 1 / 0.92 / 0.8). In every other warm interior nothing did, and he
stood in a brown room like a figure pasted onto it. This writes the same kind of grade for each interior that has none
for him, from the room's own plate, so that no room is set by hand and a new plate is re-read by one command:

    light       1 - K * (1 - c), per channel, where c is the plate's mean colour below its top third with its
                brightest channel at 1. K = 0.33 gives the Nugget's ruled tint from the Nugget's own plate.
    brightness  0.62 + 0.006 * the same band's luminance, held to 0.72 .. 0.95: the dim rooms dim him, as the
                rulings on the back room (0.72), the vault (0.8) and the chamber (0.67) did.

A room that already grades him is left exactly as ruled. A room that grades somebody else (the laundry, the bakehouse)
keeps that grade and gains him, with his own brightness. Exteriors are not touched: the night is blue and so is he.

The grade is written to the room's annotation (reference/room-NN/annotation.json `figureLight`), which is what
tools/compile-room.mjs reads, and the room is compiled.

    python3 tools/art/thad-room-light.py [--dry]
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
K = 0.33
DRY = '--dry' in sys.argv
INTERIORS = ['archive', 'assay_office', 'barbers', 'boarding_house_parlour', 'church', 'claims_registrar', 'clarion',
             'company_lobby', 'empty_storefront', 'fanshawe_office', 'hotel_lobby', 'livery', 'mercantile',
             'nugget_back', 'photographers_studio', 'schoolhouse', 'thads_room', 'undertaker', 'watchmans_shack',
             'grog_tent', 'laundry', 'bakehouse', 'ozymandias_tent', 'mine_adit', 'mine_climb', 'mine_two_rocks', 'mine_line']
NOTE = ("Errata 260: Thad takes this room's light. Derived from the plate by tools/art/thad-room-light.py (the tint from "
        "its mean colour, the brightness from its luminance), as the Nugget's ruled grade is of the Nugget's plate.")

# A room's own people are painted into its light, and tools/check-figure-light.mjs holds each to Thad's brightness
# where they stand. Dimmed as far as the plate asks, he fell under the barber and a boarder; there he is held up just far enough
# that they are not brighter than he is. The laundry and the bakehouse are left out: Mr. Sheng's and the boy's grades are ruled, and beside them Thad is
# right as he is drawn.
# The tent is left too: its light is ruled by state (errata 239: lit, he is as drawn; dark, the room grades him).
HELD_UP = {'barbers': 0.86, 'boarding_house_parlour': 0.85}
LEFT = {'laundry', 'bakehouse', 'ozymandias_tent'}

import glob
import subprocess

annotations = {}
for path in glob.glob(os.path.join(ROOT, 'reference/room-*/annotation.json')):
    annotations[json.load(open(path)).get('room')] = path
rooms = {json.load(open(os.path.join(ROOT, p)))['id']: json.load(open(os.path.join(ROOT, p))) for p in
         json.load(open(os.path.join(ROOT, 'content/manifest.json')))['rooms']}
for room_id in INTERIORS:
    if room_id in LEFT:
        print(f'{room_id}: left as drawn')
        continue
    room = rooms[room_id]
    path = annotations[room_id]
    raw = open(path).read()
    ann = json.loads(raw)
    plate = np.array(Image.open(os.path.join(ROOT, room['background'])).convert('RGB')).astype(float)
    band = plate[int(plate.shape[0] * 0.35):].reshape(-1, 3).mean(0)
    lum = float(band @ np.array([0.2126, 0.7152, 0.0722]))
    c = band / band.max()
    light = [round(float(1 - K * (1 - v)), 2) for v in c]
    brightness = round(min(0.95, max(0.72, 0.62 + 0.006 * lum)), 2)
    brightness = max(brightness, HELD_UP.get(room_id, 0))
    grade = ann.get('figureLight')
    if grade and 'thad' in grade.get('figures', []) and NOTE not in grade.get('note', ''):
        print(f'{room_id}: ruled already, left')
        continue
    if grade and NOTE not in grade.get('note', ''):
        grade['figures'] = [*grade['figures'], 'thad']
        grade.setdefault('perFigure', {})['thad'] = {'brightness': brightness}
        grade['note'] = (grade.get('note', '') + ' ' + NOTE + " He joins the room's own grade, at his own brightness.").strip()
        print(f"{room_id}: joins the room's grade {grade.get('light')}, brightness {brightness}")
    elif grade and grade.get('figures') != ['thad']:
        grade['perFigure']['thad'] = {'brightness': brightness}
        print(f"{room_id}: in the room's grade, brightness {brightness}")
    else:
        ann['figureLight'] = {'figures': ['thad'], 'light': light, 'brightness': brightness, 'note': NOTE}
        print(f'{room_id}: light {light}, brightness {brightness} (plate luminance {lum:.1f})')
    if DRY:
        continue
    indent = len(raw.split('\n')[1]) - len(raw.split('\n')[1].lstrip())
    open(path, 'w').write(json.dumps(ann, indent=indent, ensure_ascii=False) + ('\n' if raw.endswith('\n') else ''))
    number = str(int(os.path.basename(os.path.dirname(path)).split('-')[1]))
    done = subprocess.run(['node', 'tools/compile-room.mjs', number, '--write'], cwd=ROOT, capture_output=True, text=True)
    if done.returncode != 0:
        raise SystemExit(f'compile-room {number} failed:\n{done.stdout}{done.stderr}')
