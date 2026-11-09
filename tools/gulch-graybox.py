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


MINE = {'far': (700, 393), 'near': (858, 434), 'from': "Room 34's depth (the game's other mine): 0.26 a row on a near-flat floor"}

ROOMS = {
    45: {
        'id': 'washout', 'name': 'THE WASHOUT', 'tool': 'tools/gulch-graybox.py', 'errata': '199',
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
    # THE MINE (doc 108). An interior camera at Room 34's depth (the game's other mine), lit by daylight down old
    # shafts, the same day inside (errata 190). One grammar for all four: the way back at the left edge; a passage or
    # opening is a mid-dark mouth (never black, so the hero reads in front of it); and THE MINE MUST NOT SHOW THE WAY
    # (the brief): no light, colour, track, mark or composition favours a right way over a wrong one.
    46: {
        'id': 'mine_adit', 'name': 'THE MINE: THE ADIT', 'tool': 'tools/gulch-graybox.py', 'errata': '199',
        'what': 'Just inside the mine: a rock chamber with three timbered openings in the far wall (left; middle, the '
                'widest, a chalk arrow beside it pointing at the ground; right, low), a grey survey stake by the right '
                'one, and the daylight of the way out at the left edge.',
        'depth': MINE,
        'surfaces': [('rock roof and walls', (0, 0, 1920, 700), 72), ('floor, rock and grit', (0, 690, 1920, 174), 90)],
        'objects': [
            ('THE WAY OUT', (0, 280, 150, 584), 190, 'behind'),
            ('THE LEFT OPENING', (330, 300, 230, 390), 50, 'behind'),
            ('THE MIDDLE OPENING', (820, 220, 320, 470), 50, 'behind'),
            ('THE MIDDLE OPENING (the chalk arrow)', (1150, 470, 40, 60), 140, 'behind'),
            ('THE RIGHT OPENING', (1380, 430, 220, 260), 50, 'behind'),
            ('THE STAKE', (1630, 490, 36, 200), 100, 'behind'),
        ],
        'lamp': None,
        'marks': {'arrival': (260, 800, 'right'), 'left': (445, 720, 'up'), 'middle': (980, 720, 'up'),
                  'right': (1490, 720, 'up'), 'stake': (1700, 760, 'left')},
        'walk': (150, 700, 1700, 158),
        'exits': [('THE WAY OUT', 'washout'), ('THE LEFT OPENING', 'washout'), ('THE MIDDLE OPENING', 'washout'),
                  ('THE RIGHT OPENING', 'mine_climb')],
        'layoutThad': (700, 800),
        'figures': [(260, 800, False), (445, 720, False), (980, 720, True), (1490, 720, False), (1200, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band; the openings are in the far wall.',
        'lightSources': ['THE WAY OUT'],
    },
    47: {
        'id': 'mine_climb', 'name': 'THE MINE: THE CLIMB', 'tool': 'tools/gulch-graybox.py', 'errata': '199',
        'what': 'A fork: at the left a passage climbing steeply with steps cut in it, at the right a level passage with '
                'rusted rails running into it; two pit props hold the roof, one carved; a bar of daylight comes down a '
                'shaft in the roof onto the middle of the floor, between the two ways.',
        'depth': MINE,
        'surfaces': [('rock roof and walls', (0, 0, 1920, 700), 72), ('floor, rock and grit', (0, 690, 1920, 174), 90)],
        'objects': [
            ('THE WAY BACK', (0, 330, 140, 534), 56, 'behind'),
            ('THE PASSAGE UP', (300, 170, 300, 520), 50, 'behind'),
            ('THE PROPS', (690, 110, 80, 580), 96, 'behind'),
            ('THE PROPS (the second)', (1150, 110, 80, 580), 96, 'behind'),
            ('THE SHAFT OF LIGHT', (880, 0, 170, 700), 168, 'behind'),
            ('THE PASSAGE ON', (1340, 350, 330, 340), 50, 'behind'),
        ],
        'lamp': None,
        'marks': {'arrival': (300, 800, 'right'), 'up': (450, 720, 'up'), 'on': (1500, 720, 'up')},
        'walk': (150, 700, 1700, 158),
        'exits': [('THE WAY BACK', 'mine_adit'), ('THE PASSAGE UP', 'mine_two_rocks'), ('THE PASSAGE ON', 'mine_adit')],
        'layoutThad': (760, 800),
        'figures': [(300, 800, False), (450, 720, False), (1500, 720, True), (1250, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band; the props stand at its far edge.',
        'lightSources': ['THE SHAFT OF LIGHT'],
    },
    48: {
        'id': 'mine_two_rocks', 'name': 'THE MINE: THE TWO ROCKS', 'tool': 'tools/gulch-graybox.py', 'errata': '199',
        'what': 'A chamber with two boulders: at the left one the size of a stagecoach, with a passage going round '
                'behind it; at the right a smaller one, with a passage beyond it. The two passages are the same kind of '
                'mouth, the same size and the same dark.',
        'depth': MINE,
        'surfaces': [('rock roof and walls', (0, 0, 1920, 700), 72), ('floor, rock and grit', (0, 690, 1920, 174), 90)],
        'objects': [
            ('THE WAY BACK', (0, 330, 140, 534), 56, 'behind'),
            ('THE WAY PAST THE BIG ROCK', (960, 330, 210, 360), 50, 'behind'),
            ('THE BIG ROCK', (330, 160, 640, 530), 98, 'behind'),
            ('THE OTHER ROCK', (1300, 420, 290, 270), 98, 'behind'),
            ('THE WAY PAST THE OTHER ROCK', (1620, 330, 210, 360), 50, 'behind'),
        ],
        'lamp': None,
        'marks': {'arrival': (300, 800, 'right'), 'big': (1065, 720, 'up'), 'other': (1725, 720, 'up')},
        'walk': (150, 700, 1700, 158),
        'exits': [('THE WAY BACK', 'mine_climb'), ('THE WAY PAST THE BIG ROCK', 'mine_line'),
                  ('THE WAY PAST THE OTHER ROCK', 'mine_climb')],
        'layoutThad': (760, 800),
        'figures': [(300, 800, False), (1065, 720, False), (1725, 720, True), (1200, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band; both rocks stand at its far edge.',
        'lightSources': [],
    },
    49: {
        'id': 'mine_line', 'name': 'THE MINE: THE LINE', 'tool': 'tools/gulch-graybox.py', 'errata': '199',
        'what': 'A junction: two timbered passages that look exactly alike, in mirror image about the middle of the '
                'picture, and an ore cart on its side between them with MAY chalked on it.',
        'depth': MINE,
        'surfaces': [('rock roof and walls', (0, 0, 1920, 700), 72), ('floor, rock and grit', (0, 690, 1920, 174), 90)],
        'objects': [
            ('THE WAY BACK', (0, 330, 140, 534), 56, 'behind'),
            ('THE LEFT PASSAGE', (540, 240, 300, 450), 50, 'behind'),
            ('THE RIGHT PASSAGE', (1080, 240, 300, 450), 50, 'behind'),
            ('THE ORE CART', (870, 560, 180, 130), 92, 'behind'),
        ],
        'lamp': None,
        'marks': {'arrival': (300, 800, 'right'), 'left': (690, 720, 'up'), 'right': (1230, 720, 'up')},
        'walk': (150, 700, 1700, 158),
        'exits': [('THE WAY BACK', 'mine_two_rocks'), ('THE LEFT PASSAGE', 'mine_line'), ('THE RIGHT PASSAGE', 'ledge')],
        'layoutThad': (1500, 800),
        'figures': [(300, 800, False), (690, 720, False), (1230, 720, True), (1500, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band; the cart lies at its far edge.',
        'lightSources': [],
    },
    50: {
        'id': 'ledge', 'name': 'THE LEDGE', 'tool': 'tools/gulch-graybox.py', 'errata': '199',
        'what': "The mine's far mouth high on a ravine wall in daylight: a rock ledge; at the left the hole in the cliff "
                'the mine comes out of; a cairn of piled stones at the edge; far below, filling the middle of the view, '
                "the whole camp of Fiddler's Gulch -- tents, cabins, a river, smoke going straight up; at the right the "
                'ravine dropping away and a zigzag path going down it with a rope along the bad parts.',
        'depth': slope(690, 258, why="Room 5's exterior slope, as the washout"),
        'surfaces': [
            ('sky, daylight', (0, 0, 1920, 170), 205),
            ('the far wall of the ravine', (0, 120, 1920, 300), 112),
            ('THE CAMP BELOW (far down)', (420, 300, 1060, 300), 104),
            ('the ledge, rock', (0, 600, 1920, 264), 100),
        ],
        'objects': [
            ('THE MINE', (50, 280, 280, 400), 54, 'behind'),
            ('THE CAIRN', (1260, 470, 150, 210), 86, 'behind'),
            ('THE RAVINE', (1480, 300, 440, 300), 92, 'behind'),
            ('THE PATH DOWN', (1640, 560, 280, 304), 104, 'behind'),
        ],
        'lamp': None,
        'marks': {'arrival': (330, 760, 'right'), 'cairn': (1200, 760, 'right'), 'path': (1700, 800, 'right')},
        'walk': (150, 690, 1700, 168),
        'exits': [('THE MINE', 'washout')],
        'layoutThad': (760, 790),
        'figures': [(330, 760, False), (900, 720, False), (1200, 760, True), (1650, 830, False)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band; the cairn is at its far edge.',
        'lightSources': ['sky'],
    },
}

if __name__ == '__main__':
    n = int(sys.argv[1])
    base.ROOMS[n] = ROOMS[n]
    base.build(n)
