"""Sowerby at the church pulpit: his reading desk is the PLATE's, never his own (Tyler, 2026-11-06, after the
walks: "Any other movement in the game we should evaluate?" -- every frame looked at in the game). The sheet
(cast-unify 18) drew a desk under his hands in each pose, a different one each time, so when he raised a
finger or put a hand to his heart the sloped book-rest jumped. In every frame, where the plate draws its desk
(warm wood in the pulpit's top rows), his sheet is cleared, his skin kept: his hands rest on the plate's desk.

Then snap the sheet to the one level: tools/art/one-level.py --only room-17-sowerby-master (clearing moves a
frame's outline, which moves its art-pixel grid). Run the two in that order; tests/plate-furniture.test.mjs and
tests/one-level.test.mjs hold both.

Usage: room17-sowerby-desk.py    (rewrites art/actors/room-17-sowerby-master.png in place; prints counts)
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
npc = json.load(open(os.path.join(ROOT, 'content/ambient/sowerby.json')))
place = npc['placements']['church']; sp = place['sprite']
rooms = [json.load(open(os.path.join(ROOT, p))) for p in json.load(open(os.path.join(ROOT, 'content/manifest.json')))['rooms']]
room = [r for r in rooms if r['id'] == 'church'][0]
plate = np.asarray(Image.open(os.path.join(ROOT, room['background'])).convert('RGB')).astype(int)
sheet_path = os.path.join(ROOT, sp['sheet'])
sheet = np.asarray(Image.open(sheet_path).convert('RGBA')).copy()

DESK = [(1455, 264), (1503, 261), (1567, 303), (1567, 309), (1478, 309), (1456, 273)]   # room pixels
PULPIT_TOP = 303


def skin(px):
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    return (r > 150) & (g > 90) & (r - b > 50) & (r > g)

for (fx, fy, w, h) in sp['frames']:
    left = place['x'] - w // 2; top = place['y'] - h + 1          # drawn 1:1, centred on x, bottom on y
    # The plate's desk, traced from the plate (the wall behind is warm wood too, so colour cannot find it):
    # the sloped book-rest, and the pulpit's top from its front edge down.
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    d.polygon([(x - left, y - top) for x, y in DESK], fill=255)
    d.rectangle([0, PULPIT_TOP - top, w, h], fill=255)
    desk = np.asarray(m) > 0
    cell = sheet[fy:fy + h, fx:fx + w]
    clear = desk & ~skin(cell[..., :3].astype(int)) & (cell[..., 3] > 0)
    cell[..., 3] = np.where(clear, 0, cell[..., 3])
    print('frame', (fx, fy), 'cleared', int(clear.sum()))
Image.fromarray(sheet).save(sheet_path)
