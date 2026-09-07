"""FURNITURE-REGISTERED CLUSTER SOURCES: the canonical furniture, as the canvas
to compose people into (doc 36 Q134).

    python3 tools/retrofit/nugget-cluster-prep.py

Tyler's ruling after Q133: author the furniture-dependent group as a coherent
composition against the exact canonical furniture, then decompose it into
runtime actors. So the request stops being "draw me some men" and becomes
"put men into this room", and the room in the request is the shipping room's
own pixels.

THREE THINGS MAKE THE ROUND TRIP EXACT.

1. THE CROPS ARE CHOSEN SO THE SCALE IS AN INTEGER. 512x512 for the card table
   and 768x512 for the bar, each doubled to the size the endpoint returns. A
   x2 nearest-neighbour enlargement adds no new colour and invents no edge, and
   halving it afterwards lands every canonical pixel back on the pixel it came
   from. A fractional scale would resample the furniture on the way in and
   again on the way out, and the registration gate could never tell drift from
   arithmetic.

2. THE MASK FREES ONLY WHERE PEOPLE GO. The wall, the window, the piano, the
   stove, the back bar and its bottles are all outside it and come back
   untouched, which pins the perspective and the light. The furniture itself is
   inside the free window, because people have to overlap it -- that is the
   risk this method accepts, and the registration gate is what catches it.

   This is NOT the topology that failed on the bar-stove sheet. That was a
   large empty rectangle between separate figures on a flat backdrop, and the
   endpoint read the emptiness as permission to recompose. Here the free window
   is full of continuous scenery with furniture running through it, which is
   the shape twelve earlier masked edits in this project held.

3. THE IDENTITY SHEET IS SEPARATE. The accepted patrons ride along as their own
   reference image rather than being pasted into the canvas, so nothing about
   their current -- wrong -- placement is suggested to the model as a layout.
"""
import hashlib, json, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

F = json.load(open('reference/room-03-candidate/nugget-furniture.json'))
SHEETS = {s['id']: s for s in json.load(open('art/staging/phase2a-sheets.json'))['sheets']}
PLATE = F['plate']
MAGENTA = (255, 0, 255, 255)

CLUSTERS = {
    'card': {
        'dir': 'art/staging/room-03/cluster-card-01',
        # 512x512 of the plate, x2 -> 1024x1024. Holds the whole table, both
        # visible chairs, the floor a boot can reach and the head-room a seated
        # man needs, plus wall and window above to hold the perspective.
        'crop': (655, 110, 1167, 622),
        'scale': 2,
        # The free window in CANVAS coordinates (after the x2). Everything
        # outside it -- the window, the wall, the portrait, the stove -- is
        # kept. Its top is set by the TALLEST THING THAT HAS TO BE DRAWN, not
        # by the furniture: a seated man on the left chair is 233 px tall with
        # his feet at plate row 507, so his head reaches plate row 274, and a
        # window that started at the tabletop would have cut every head off.
        'free': (36, 300, 1010, 1014),
        'people': ['nugget_card_1', 'nugget_card_2', 'nugget_card_3', 'nugget_card_4'],
    },
    'bar': {
        'dir': 'art/staging/room-03/cluster-bar-01',
        # 768x512 of the plate, x2 -> 1536x1024. The counter along its whole
        # length, all three stools, the foot rail and the floor in front.
        # Same 3:2 so the x2 lands exactly, but lifted: a man standing at the
        # near end of the bar is 433 px tall with his boots at plate row 765,
        # so the crop has to start above plate row 332 or he is beheaded by the
        # canvas edge.
        'crop': (1152, 310, 1920, 822),
        'scale': 2,
        # A SLOPED WINDOW THAT FOLLOWS THE BAR, not a rectangle. The card call
        # settled what a mask is worth here: outside its free window the room
        # came back untouched -- mean difference 4 out of 255, nothing over 48
        # -- and inside it the table moved 66 px and the floor changed
        # material. So the window is worth making tight, and tight here means
        # following the counter's own slope: from 210 px above the counter top
        # (head-room for a standing man) down to the floor in front of the bar.
        # The back-bar shelves above that, and the open floor away from the
        # bar, stay outside it.
        'freePolygon': 'bar-band',
        'people': ['nugget_bar_1', 'nugget_bar_2', 'nugget_bar_3'],
    },
}


def identity_sheet(ids, out, gap=90):
    """The accepted patrons, side by side on magenta, at their shipping size.

    They are NOT pasted into the room canvas: this is who they are, not where
    they go. Their current placement is the thing being replaced."""
    figures = [Image.open(SHEETS[i]['sheet']).convert('RGBA') for i in ids]
    width = sum(f.width for f in figures) + gap * (len(figures) + 1)
    height = max(f.height for f in figures) + 120
    canvas = Image.new('RGBA', (width, height), MAGENTA)
    x = gap
    for figure in figures:
        canvas.alpha_composite(figure, (x, height - 60 - figure.height))
        x += figure.width + gap
    canvas.convert('RGB').save(out)
    return [SHEETS[i]['sheet'] for i in ids]


made = {'schema': 1,
        'note': 'Furniture-registered cluster sources: the canonical furniture at an integer x2, '
                'a mask that frees only where people go, and a separate identity sheet. '
                'Doc 36 Q134.',
        'plate': PLATE, 'plateSha256': sha(PLATE), 'clusters': {}}

plate = Image.open(PLATE).convert('RGB')
for name, spec in CLUSTERS.items():
    os.makedirs(spec['dir'], exist_ok=True)
    x0, y0, x1, y1 = spec['crop']
    z = spec['scale']
    crop = plate.crop((x0, y0, x1, y1))
    canvas = crop.resize((crop.width * z, crop.height * z), Image.NEAREST)
    canvas_path = f"{spec['dir']}/furniture-canvas.png"
    canvas.save(canvas_path)

    alpha = Image.new('L', canvas.size, 255)
    draw = ImageDraw.Draw(alpha)
    if spec.get('freePolygon') == 'bar-band':
        edge = F['bar']['counterFrontTopEdge']
        base = F['bar']['counterFrontFaceBottom']
        top, bottom = [], []
        for cx in range(0, canvas.width + 1, 8):
            px = x0 + cx / z
            top.append((cx, max(0, (edge['at1150'] + (px - 1150) * edge['slopePerPx'] - y0) * z - 210)))
            bottom.append((cx, min(canvas.height,
                                   (base['at1400'] + (px - 1400) * base['slopePerPx'] - y0) * z + 150)))
        draw.polygon(top + bottom[::-1], fill=0)
        spec['free'] = ['bar-band polygon: counter top - 210 canvas px, down to the bar base + 150']
    else:
        fx0, fy0, fx1, fy1 = spec['free']
        draw.rectangle([fx0, fy0, fx1 - 1, fy1 - 1], fill=0)
    mask = Image.new('RGBA', canvas.size, (0, 0, 0, 255))
    mask.putalpha(alpha)
    mask_path = f"{spec['dir']}/edit-mask.png"
    mask.save(mask_path)

    diag = canvas.convert('RGBA')
    diag.paste(Image.new('RGBA', canvas.size, (90, 220, 255, 255)), (0, 0),
               Image.eval(alpha, lambda v: 0 if v else 70))
    diag.convert('RGB').save(f'renders/opening-set-retrofit/phase2a-cluster-{name}-canvas.png')

    identity_path = f"{spec['dir']}/identity.png"
    used = identity_sheet(spec['people'], identity_path)

    made['clusters'][name] = {
        'cropPlate': list(spec['crop']), 'scale': z,
        'canvas': canvas_path, 'canvasSize': list(canvas.size), 'canvasSha256': sha(canvas_path),
        'mask': mask_path, 'maskSha256': sha(mask_path),
        'freeWindowCanvas': list(spec['free']) if isinstance(spec['free'], (list, tuple)) else spec['free'],
        'freeIsPolygon': spec.get('freePolygon') is not None,
        'identity': identity_path, 'identitySha256': sha(identity_path),
        'identityFrom': used,
        'roundTrip': f'canvas pixel (cx, cy) is plate pixel ({x0} + cx//{z}, {y0} + cy//{z})',
    }
    freed = 100 * (1 - np.asarray(alpha).mean() / 255)
    print(f'{name}: canvas {canvas.size} from plate {spec["crop"]} x{z}; '
          f'free {freed:.0f}% of the canvas; identity {len(used)} figures')

json.dump(made, open('art/staging/room-03/cluster-sources.json', 'w'), indent=1, ensure_ascii=False)
open('art/staging/room-03/cluster-sources.json', 'a').write('\n')
print('art/staging/room-03/cluster-sources.json')
