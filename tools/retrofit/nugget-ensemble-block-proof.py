#!/usr/bin/env python3
"""
WHY THE ROOM 3 RUNTIME-ENSEMBLE PASS STOPPED, IN THREE PANELS.

The approved architecture (static environment + card-table ensemble + three bar
units) needs two things for every patron it lifts out of the plate:

  A. a tight alpha silhouette of that patron, and
  B. correct background pixels where he was standing.

This proof shows what the repository actually has for each.

PANEL 1  the accepted composite, card region, with the region marked that no
         source anywhere supplies: the rebuilt table's own left and right rim
         and apron, behind the two near players' bodies.
PANEL 2  the ONLY people-free source for the card area -- the canvas the card
         cluster operation was given. It is the OLD table: smaller, further
         back, five chairs, a different footprint. It cannot stand in for the
         accepted rebuilt table.
PANEL 3  the people-free source for the BAR -- the canvas the bar rebuild was
         given. This one IS the canonical rebuilt bar, complete and empty:
         counter run, panelling, base moulding, foot rail, three stools, back
         bar and bottles. (B) is solved for the bar and unsolved for the cards.

The plate is a night interior with a mean level of 24, so every panel is gamma
lifted for reading ONLY. Nothing here is written back to any shipping asset.

    python3 tools/retrofit/nugget-ensemble-block-proof.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'proofs' / 'room-03' / 'ensemble-block'

PLATE = ROOT / 'art/staging/room-03/rebuild-04/plate-room-03-recomposed.png'
CARD_CANVAS = ROOT / 'art/staging/room-03/cluster-card-01/furniture-canvas.png'
BAR_CANVAS = ROOT / 'art/staging/room-03/bar-rebuild-01/canvas.png'
ROOM = ROOT / 'content/rooms/nugget-candidate.json'

# NOT EYEBALLED. The boxes are the room's own declared population, which the
# owner recorded off this plate on a 50px grid and which tests/phase2a-access
# already checks every run. Whatever the plate holds inside one of these is the
# man; whatever is BEHIND him is what a runtime sprite would reveal, and it is
# that hidden material this proof classifies.
#
# The classification itself is the whole finding:
#   recoverable -- a people-free source exists for the pixels behind this man
#   MISSING     -- no source anywhere holds them
RECOVERY = {
    'bar_1': ('recoverable', 'bar-rebuild-01/canvas.png holds this counter run, empty'),
    'bar_2': ('recoverable', 'bar-rebuild-01/canvas.png holds this counter run, empty'),
    'bar_3': ('recoverable', 'bar-rebuild-01/canvas.png, plus rebuild-04 already rebuilt it'),
    'card_1': ('missing', 'his body crosses the rebuilt table; no people-free rebuilt table exists'),
    'card_4': ('missing', 'his body crosses the rebuilt table; no people-free rebuilt table exists'),
    'card_2': ('partial', 'wall behind him is recoverable; his hands and cards lie on the table'),
    'card_3': ('partial', 'wall behind him is recoverable; his hands and cards lie on the table'),
}
COLOUR = {'recoverable': (110, 220, 130), 'partial': (250, 205, 90), 'missing': (255, 90, 90)}

GAMMA = 0.38


def lift(a: np.ndarray) -> np.ndarray:
    """Gamma lift for reading. Never written back to a shipping asset."""
    return np.clip((a / 255.0) ** GAMMA * 255, 0, 255).astype('uint8')


def panel(img: Image.Image, title: str, scale: int = 1) -> Image.Image:
    a = np.asarray(img.convert('RGB')).astype(float)
    out = Image.fromarray(lift(a))
    if scale != 1:
        out = out.resize((out.width * scale, out.height * scale), Image.NEAREST)
    band = Image.new('RGB', (out.width, out.height + 26), (16, 16, 18))
    band.paste(out, (0, 26))
    ImageDraw.Draw(band).text((6, 8), title, fill=(235, 225, 200))
    return band


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    import json
    people = {one['id']: one for one in json.loads(ROOM.read_text())['population']['people']}

    plate = Image.open(PLATE).convert('RGB')
    x0, y0, x1, y1 = 640, 230, 1920, 864
    one = panel(plate.crop((x0, y0, x1, y1)), '', scale=1)
    draw = ImageDraw.Draw(one)
    for pid, (kind, why) in RECOVERY.items():
        bx, by, bw, bh = people[pid]['box']
        colour = COLOUR[kind]
        draw.rectangle([bx - x0, by - y0 + 26, bx + bw - x0, by + bh - y0 + 26],
                       outline=colour, width=2)
        draw.text((bx - x0 + 3, by - y0 + 26 + 3), f'{pid}  {kind.upper()}', fill=colour)
    draw.text((8, 8),
              'PANEL 1  accepted composite, declared population boxes.  '
              'GREEN a people-free source exists behind him   '
              'AMBER partly   RED nothing anywhere', fill=(235, 225, 200))
    # ONE TRACKED SHEET, NOT FOUR PLATES. CLAUDE.md's proof policy: a compact
    # contact sheet at half scale is what gets tracked, because forty rooms of
    # full-resolution panels is blobs a 279MB repository deltas badly against.

    two = panel(Image.open(CARD_CANVAS),
                'PANEL 2  only people-free card source: the OLD table (wrong geometry)')
    three = panel(Image.open(BAR_CANVAS),
                  'PANEL 3  people-free bar source: the canonical rebuilt bar, complete and empty')

    width = max(p.width for p in (one, two, three))
    height = one.height + two.height + three.height + 20
    sheet = Image.new('RGB', (width, height), (16, 16, 18))
    y = 0
    for p in (one, two, three):
        sheet.paste(p, (0, y))
        y += p.height + 10
    # Half scale, complete frames, never cropped -- the policy's own wording.
    sheet = sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS)
    out = OUT / 'contact-sheet.webp'
    sheet.save(out, 'WEBP', quality=88, method=6)
    print(f'wrote {out}  {sheet.width}x{sheet.height}  {out.stat().st_size // 1024}KB')


if __name__ == '__main__':
    main()
