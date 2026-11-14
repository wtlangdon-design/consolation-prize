"""Acted directions, the third pass: the street people's sheets cut (reference/acted-directions-3/brief.md).
No image operation.

Each acted-directions-3-street operation drew Thad (the ruler, not shipped) and then the figure's frames
(tools/art/acted3-inputs.py). This uses tools/art/acted2-cut.py's own machinery: every pose scaled by one factor so
the drawn rest is the sheet's rest height, its light matched, registered on the legs, despilled, snapped to the one
level at the record's own man.

  letter-writer, man-leaving  the existing frames are untouched (asserted, pixel for pixel); the new poses are added
                              as a new row below the sheet (acted2-cut's `figure`).
  bell-ringer, map-seller     every existing drawn frame is REPLACED in place by its repaint with the new prop (the
                              bottle, the pencil: errata 111, nothing appears from nowhere); the breath frame (1) is
                              derived again from the new rest; the new poses follow in a new row.

  python3 tools/art/acted3-cut.py KEY [--write]       KEY: letter-writer, man-leaving, bell-ringer, map-seller
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
src = open(R('tools/art/acted2-cut.py')).read()
ns = {'__file__': R('tools/art/acted2-cut.py')}
saved, sys.argv = sys.argv, ['acted2-cut.py']
exec(src[:src.index("\nif __name__")], ns)
sys.argv = saved

ns['A'] = 'art/staging/acted-directions-3'
# key: (record, registration, the old frames redrawn in order (None: none), the old frame derived as a breath)
ns['FIGURES'].clear()
ns['FIGURES'].update({
    'letter-writer': ('content/ambient/letter-writer.json', 'legs', None, None),
    'man-leaving': ('content/ambient/man-leaving-tomorrow.json', 'legs', None, None),
    'bell-ringer': ('content/ambient/bell-ringer.json', 'legs', [0, 2, 3, 4], 1),
    'map-seller': ('content/ambient/map-seller.json', 'legs', [0, 2, 3, 4], 1),
})
ns['UNDERPAINT'].clear()
ns['FULL_DESPILL'].clear()


def poses_in(key):
    """Lines beginning "N." in the prompt, less the ones naming a repaint of an old frame (they say no NEW: and the
    first is the rest). The letter-writer and the man leaving list only new poses after the two he keeps."""
    import re
    text = open(R(f'reference/acted-directions-3/{key}.txt')).read()
    lines = re.findall(r'^(\d+)\. (.*)$', text, re.M)
    if key in ('bell-ringer', 'map-seller'):
        return sum(1 for _, l in lines if l.startswith('NEW'))
    return len(lines) or 1


ns['poses_in'] = poses_in

# Each figure's sheet as drawn: the correction where one was spent (both named a miss in the first: the bell-ringer's
# second bottle and lost mallet, the map seller's second pencil and a stray line).
SHEET = {'bell-ringer': 'sheet-fix.png', 'map-seller': 'sheet-fix.png'}
_leftmost = ns['leftmost']
ns['leftmost'] = lambda path, n: _leftmost(path.replace('/sheet.png', '/' + SHEET.get(path.split('/')[-2], 'sheet.png')), n)

# THE MAP SELLER'S ONE PENCIL. Both of his drawings left a pencil behind his ear in the two drawing poses as well as the
# one in his hand. In those frames (the new row) the pencil-yellow pixels in the head (the top HEAD of the figure) are
# put out: each takes the median of the non-yellow figure pixels round it.
HEAD = 0.2
_figure = ns['figure']


def figure(key, write):
    import io, contextlib
    import numpy as np
    from PIL import Image
    from scipy import ndimage as ndi
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        _figure(key, write)
    report = json.loads(buf.getvalue())
    if key == 'map-seller' and write:
        sheet_path = R(json.load(open(R('content/ambient/map-seller.json')))['sprite']['sheet'])
        a = np.asarray(Image.open(sheet_path).convert('RGBA')).copy()
        removed = 0
        for x, y, w, h in report[key]['newFrames']:
            c = a[y:y + h, x:x + w]
            op = c[..., 3] > 128
            rows = np.nonzero(op.any(1))[0]
            top = rows[0] + int(HEAD * (rows[-1] - rows[0] + 1))
            rgb = c[..., :3].astype(int)
            # the pencil's yellow is green-heavy (G over 0.8 R, about 240,208,16); his skin is not (G about 0.65 R)
            yellow = op & (rgb[..., 0] > 150) & (rgb[..., 1] > 0.8 * rgb[..., 0]) & (rgb[..., 2] < 110)
            yellow[top:] = False
            if not yellow.any():
                continue
            yellow = ndi.binary_dilation(yellow, iterations=1) & op & (rgb[..., 1] > 0.72 * rgb[..., 0])
            for yy, xx in zip(*np.nonzero(yellow)):
                y0, y1, x0, x1 = max(0, yy - 3), yy + 4, max(0, xx - 3), xx + 4
                ok = op[y0:y1, x0:x1] & ~yellow[y0:y1, x0:x1]
                if ok.any():
                    c[yy, xx, :3] = np.median(rgb[y0:y1, x0:x1][ok], axis=0)
                else:
                    c[yy, xx, 3] = 0
            removed += int(yellow.sum())
        Image.fromarray(a).save(sheet_path)
        report[key]['earPencilPixelsRemoved'] = removed
    print(json.dumps(report))


ns['figure'] = figure

if __name__ == '__main__':
    ns['figure'](sys.argv[1], '--write' in sys.argv)
