"""The dish uncovered (reference/act1-dinner/brief.md section 1; doc 120 I-1). No image operation here.

act1-dinner operation 3 (operation 1's correction: a marked layout, the cover tipped onto the tray's left rim, the
page and its parsley on the tray) edited the dinner where it stands, in the room, at 2x. This takes its pixels back to
the table's own 1x grid and lays them over the table's own picture only where they differ from it, inside the corner
the brief names, as tools/art/room14-props.py does for the hill:

  - CORNER: the only rows and columns that may change (the yellow box of the layout guide);
  - where the table's picture is transparent (off its edge), only the cover may add pixels (the blue box);
  - every other pixel of the 598 x 152 table is the table's own, untouched.

Writes art/props/room-11-dinner-uncovered.png (the whole table, drawn where room-11-dinner.png is) and
renders/room-11-dinner-uncovered-with-thad.png, and asserts nothing outside the corner changed.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OP = os.path.join(ROOT, 'art/staging/act1-dinner/op-3/sheet.png')
TABLE = os.path.join(ROOT, 'art/props/room-11-dinner.png')
DRAPE = os.path.join(ROOT, 'art/props/room-11-dinner-drape.png')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-11-fanshawe-office.png')
OUT = os.path.join(ROOT, 'art/props/room-11-dinner-uncovered.png')
SHOW = os.path.join(ROOT, 'renders/room-11-dinner-uncovered-with-thad.png')
AT = (1087 - 299, 550 - 151)      # the table's top-left in the room (content: x 1087, y 550, 598 x 152)
DRAPE_AT = (1087 - 299, 733 - 197)
CROP = (AT[0] - 60, AT[1] - 250)  # the operation's input: the room from here, 768 x 512, at 2x
CORNER = (30, 52, 168, 152)       # table x0, y0, x1, y1
COVER = (30, 88, 112, 152)        # off the table's edge, only the cover
THR = 48


def room_with_table():
    room = Image.open(PLATE).convert('RGBA')
    room.alpha_composite(Image.open(TABLE).convert('RGBA'), AT)
    room.alpha_composite(Image.open(DRAPE).convert('RGBA'), DRAPE_AT)
    return room


def main():
    table = np.asarray(Image.open(TABLE).convert('RGBA')).copy()
    h, w = table.shape[:2]
    op = Image.open(OP).convert('RGB').resize((768, 512), Image.BOX)
    op = np.asarray(op.crop((60, 250, 60 + w, 250 + h))).astype(int)
    base = np.asarray(room_with_table().convert('RGB').crop((AT[0], AT[1], AT[0] + w, AT[1] + h))).astype(int)

    x0, y0, x1, y1 = CORNER
    m = np.zeros((h, w), bool)
    m[y0:y1, x0:x1] = np.abs(op - base).sum(2)[y0:y1, x0:x1] > THR
    m = ndi.binary_dilation(ndi.binary_closing(m, iterations=2), iterations=1)
    inside = np.zeros_like(m)
    inside[y0:y1, x0:x1] = True
    off = table[..., 3] == 0
    cover = np.zeros_like(m)
    cover[COVER[1]:COVER[3], COVER[0]:COVER[2]] = True
    m &= inside & (~off | cover)
    # Off the table's edge, keep only the cover's own body: the largest piece there, not stray background.
    lab, n = ndi.label(m & off)
    if n:
        sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = 1 + int(np.argmax(sizes))
        m &= ~(off & (lab != keep) & (lab > 0))

    out = table.copy()
    out[m, :3] = op[m]
    out[m, 3] = 255
    changed = np.any(out != table, axis=2)
    assert not changed[~inside].any(), 'nothing outside the corner may change'
    Image.fromarray(out).save(OUT)
    ys, xs = np.where(changed)
    print('wrote', os.path.relpath(OUT, ROOT), (w, h), 'changed', int(changed.sum()), 'px in',
          (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    show()


def show():
    """The dinner as it plays, the table before and after, with Thad and the Colonel seated as they are."""
    seated = Image.open(os.path.join(ROOT, 'renders/room-11-dinner-seated-and-the-deed.png')).convert('RGB')
    before = seated.crop((0, 0, 960, 432)).resize((1920, 864), Image.NEAREST)
    after = before.copy()
    # The render's table is drawn at the content's place; lay the new table's corner over it the same way.
    new = Image.open(OUT).convert('RGBA')
    old = np.asarray(Image.open(TABLE).convert('RGBA'))
    diff = np.any(np.asarray(new) != old, axis=2)
    ys, xs = np.where(diff)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    patch = new.crop(box)
    after.paste(patch, (AT[0] + box[0], AT[1] + box[1]), patch)
    crop = (AT[0] - 120, AT[1] - 260, AT[0] + 720, AT[1] + 330)
    a, b = before.crop(crop), after.crop(crop)
    sheet = Image.new('RGB', (a.width * 2 + 16, a.height), (0, 0, 0))
    sheet.paste(a, (0, 0))
    sheet.paste(b, (a.width + 16, 0))
    sheet.save(SHOW)
    print('wrote', os.path.relpath(SHOW, ROOT))


if __name__ == '__main__':
    main()
