"""Every item icon at game size beside its names: reference/item-icons/icons-after.png.

The counterpart of icons-before.png (the items audit, errata 140). Each icon is
drawn the way Renderer.drawInventory draws it -- fitted into the 180x80 slot by
min(180/w, 80/h), nearest-neighbour -- on the panel's dark ground, so the sheet
shows exactly what a player sees. No image operation.

usage: python3 tools/art/item-icons-contact.py
"""
import glob
import json
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'reference/item-icons/icons-after.png')
GROUND = (30, 26, 20)
SLOT = (180, 80)
COLS, COL_W, ROW_H = 4, 460, 130
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def items():
    found = {}
    for path in glob.glob(os.path.join(ROOT, 'content/items/*.json')):
        data = json.load(open(path))
        for item in data.get('items', [data]) if isinstance(data, dict) else data:
            if isinstance(item, dict) and 'id' in item:
                found[item['id']] = item
    return found


def main():
    table = json.load(open(os.path.join(ROOT, 'content/ui/item-icons.json')))
    sheet = Image.open(os.path.join(ROOT, table['sheet'])).convert('RGBA')
    known = items()
    ids = list(table['icons'])
    rows = -(-len(ids) // COLS)
    out = Image.new('RGB', (COLS * COL_W, rows * ROW_H), GROUND)
    draw = ImageDraw.Draw(out)
    font = ImageFont.truetype(FONT, 16)
    for i, item in enumerate(ids):
        x, y, w, h = table['icons'][item]
        fit = min(SLOT[0] / w, SLOT[1] / h)
        icon = sheet.crop((x, y, x + w, y + h)).resize((round(w * fit), round(h * fit)), Image.NEAREST)
        cx, cy = (i % COLS) * COL_W + 10, (i // COLS) * ROW_H + (ROW_H - SLOT[1]) // 2
        out.paste(icon, (cx + (SLOT[0] - icon.width) // 2, cy + (SLOT[1] - icon.height) // 2), icon)
        entry = known.get(item, {})
        label = (entry.get('short') or entry.get('name') or item).upper()
        name = entry.get('name') or ''
        tx = cx + SLOT[0] + 14
        draw.text((tx, cy + 6), label, fill=(232, 222, 200), font=font)
        draw.text((tx, cy + 30), item, fill=(170, 160, 140), font=font)
        draw.text((tx, cy + 54), name if len(name) <= 30 else name[:29] + '...', fill=(170, 160, 140), font=font)
    out.save(OUT)
    print(os.path.relpath(OUT, ROOT), out.size, f'fit x{fit:g}')


if __name__ == '__main__':
    main()
