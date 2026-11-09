"""The mine's lanterns (Rooms 46-49): old, unlit, hung on the pit props, one drawing for all four rooms. No line names
them and none is clickable: they are scenery (Tyler, 2026-11-09: "Maybe lanterns can be setup throughout the caves to
make it look a little more 'of the era'?"; asked how, "Unlit, as scenery"). The mine is still lit by daylight through
its shafts (doc 108), and the lanterns are dead.

THE MINE MUST NOT SHOW THE WAY (the brief; doc 107). So every way in a room gets the same lantern, at the same size and
the same height, on the same post of its timbers -- the left -- and Room 49's two passages, which are one passage
mirrored, get it mirrored: on the left passage's left post and the right passage's right post, the drawing flipped.
Room 47's fork has two big props flanking the shaft of light; one lantern hangs on each, on the shaft's side, mirrored. tests/gulch-mine.test.ts holds
it: every way forward in a mine room has its lantern, all alike.

    python3 tools/art/mine-lanterns.py

Reads art/staging/room-46/lantern/source.png (room-46 operation 3); writes art/props/mine-lantern-NN.png (and
-49-flip) at each room's size, snapped to one level, and prints the props for each room's annotation.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools/art'))
src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py')}
exec(src[src.index('import json'):src.index('def man_at')], ns)
snap = ns['snap']

SOURCE = os.path.join(ROOT, 'art/staging/room-46/lantern/source.png')
HEIGHT = 0.24        # of the room's man where the ways stand: a lantern and its bail and nail; at 0.16 it was a smudge
NAIL = 0.86          # of the room's man above the floor: about head height on the post
# Per room: the plate's floor row under the ways, and each lantern's post: (centre x, flipped).
ROOMS = {
    # Each on the inner face of its post, against the dark of the passage, where the tin and the glass read: on the
    # post's own brown, at first, it was a brown smudge (the first placement, checked at game size).
    # Room 46's right opening is the shortest; at head height its lantern sat on the crossbeam, so the room's three
    # hang lower together, under that beam: alike, still.
    46: {'floor': 640, 'top': 400, 'posts': [('left_opening', 448, False), ('middle_opening', 898, False), ('right_opening', 1478, False)]},
    47: {'floor': 650, 'posts': [('passage_up', 752, False), ('passage_on', 1188, True)]},
    48: {'floor': 620, 'posts': [('way_back', 92, False), ('way_past_big_rock', 947, False), ('way_past_other_rock', 1687, False)]},
    49: {'floor': 595, 'posts': [('left_passage', 532, False), ('right_passage', 1458, True)]},
}


def man_at(n, y):
    a = json.load(open(os.path.join(ROOT, f'reference/room-{n}/annotation.json')))['scaling']
    (fy, fh), (ny, nh) = (a['far']['y'], a['far']['height']), (a['near']['y'], a['near']['height'])
    return fh + (nh - fh) * (y - fy) / (ny - fy)


def keyed():
    a = np.asarray(Image.open(SOURCE).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    key = (g < np.minimum(r, b) - 60) & (r > 150) & (b > 150)
    out = np.zeros(a.shape[:2] + (4,), np.uint8)
    out[..., :3] = a
    out[..., 3] = np.where(key, 0, 255)
    rows, cols = np.nonzero(out[..., 3])
    return Image.fromarray(out[rows.min():rows.max() + 1, cols.min():cols.max() + 1])


def main():
    lantern = keyed()
    props = {}
    for n, room in ROOMS.items():
        man = man_at(n, room['floor'])
        h = round(HEIGHT * man)
        w = round(lantern.width * h / lantern.height)
        small = lantern.resize((w, h), Image.BOX)
        arr = np.asarray(small).copy()
        arr[..., 3] = np.where(arr[..., 3] > 128, 255, 0)
        arr = snap(arr, man / 115.0)
        img = Image.fromarray(arr)
        top = room.get('top', round(room['floor'] - NAIL * man))
        props[n] = []
        for way, x, flip in room['posts']:
            name = f"mine-lantern-{n}{'-flip' if flip else ''}"
            (img.transpose(Image.FLIP_LEFT_RIGHT) if flip else img).save(os.path.join(ROOT, f'art/props/{name}.png'))
            props[n].append({'id': f'lantern_{way}', 'sheet': f'art/props/{name}.png', 'x': x, 'y': top + img.height,
                             'frame': [0, 0, img.width, img.height],
                             'note': f"An old lantern, unlit, on the post by {way} (tools/art/mine-lanterns.py): scenery, the "
                                     "same at every way in the room, so none is marked (the brief: the mine must not show the way)."})
    print(json.dumps(props, indent=1))


if __name__ == '__main__':
    main()
