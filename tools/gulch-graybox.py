"""Fiddler's Gulch's grayboxes (reference/fiddlers-gulch/brief.md, errata 190-196): ruling 22 steps 1-6, before any
art (errata 22), one room at a time.

    python3 tools/gulch-graybox.py 45

The same steps and the same legibility gate as tools/interiors-graybox.py, whose build() this uses: a value block,
the walkable band and the ways out, docs 108-109's subjects as silhouettes, the room's figures where they stand, Thad
at every depth. DAYLIGHT, every room (errata 190): no lamp pool, and the values are a day's. Every position is a
staging decision under the standing delegation, recorded in the room's errata build section.

Writes renders/room-NN-graybox.png, renders/room-NN-graybox-with-thad.png, reference/room-NN/layout-1536x1024.png
and proofs/room-NN/graybox.json.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('interiors_graybox', os.path.join(ROOT, 'tools/interiors-graybox.py'))
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

# THE DEPTH OF AN EXTERIOR: Room 5's slope (0.68 a row), as Rooms 22, 25 and 29 take it, with Thad about 330 tall
# where he stands to talk -- the claims road's man (reference/room-22/annotation.json).
def slope(far_y, far_h, near_y=858, why=''):
    return {'far': (far_y, far_h), 'near': (near_y, round(far_h + 0.68 * (near_y - far_y))), 'from': why}


ROOMS = {
    45: {
        'id': 'washout', 'name': 'THE WASHOUT', 'tool': 'tools/gulch-graybox.py', 'errata': '196',
        'what': "The road to Fiddler's Gulch ending in a slide of rock and mud with a whole pine in it roots up; a "
                'signpost into the slide; the road back down the valley; an old timbered mine in the ridge with rails '
                'running out of it to the edge of the slide; Grievance waiting on the one patch of grass. Daylight.',
        'depth': slope(660, 302, why="Room 5's exterior slope, as Room 22: a man of 302 at the band's far edge"),
        'surfaces': [
            ('sky, daylight', (0, 0, 1920, 210), 205),
            ('ridge and far hills', (0, 150, 1920, 410), 104),
            ('road and verge', (0, 560, 1920, 304), 100),
        ],
        'objects': [
            ('THE ROAD BACK', (0, 600, 380, 264), 104, 'behind'),
            ('GRIEVANCE (on the grass)', (440, 430, 230, 250), 62, 'behind'),
            ('THE SIGNPOST', (930, 360, 70, 300), 74, 'behind'),
            ('THE SLIDE', (1020, 210, 560, 470), 98, 'behind'),
            ('THE SLIDE (the pine, roots up)', (1100, 250, 380, 120), 60, 'behind'),
            ('THE OLD MINE', (1620, 330, 230, 320), 54, 'behind'),
            ('THE OLD MINE (its rails)', (1500, 640, 170, 30), 70, 'behind'),
        ],
        'lamp': None,
        'marks': {'arrival': (300, 800, 'right'), 'grievance': (780, 760, 'left'), 'mine': (1720, 700, 'right')},
        'walk': (160, 690, 1700, 168),
        'exits': [('THE OLD MINE', 'mine_adit')],
        'layoutThad': (860, 790),
        'figures': [(300, 800, False), (780, 760, True), (1180, 700, False), (1720, 700, False), (600, 850, False),
                    (1400, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the slide, the signpost, the mine and '
                         'Grievance are all behind it, so no plane is needed.',
        'lightSources': ['sky'],
    },
}

if __name__ == '__main__':
    n = int(sys.argv[1])
    base.ROOMS[n] = ROOMS[n]
    base.build(n)
