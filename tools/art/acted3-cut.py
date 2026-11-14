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

if __name__ == '__main__':
    ns['figure'](sys.argv[1], '--write' in sys.argv)
