"""PHASE 1.5F -- THE CHAPEL FRONT: ONE LOCAL CANVAS (doc 36 Q122).

    python3 tools/retrofit/phase15f-chapel-prep.py

Tyler's finding: the church front still reads as physically unrealistic. The
brief requires the cause to be proven before any repaint, with the notice
board taken out of the way for the diagnosis (renders/opening-set-retrofit/
phase15f-chapel-diagnostic.webp, built by phase15f-chapel-diagnose.py).

THE DIAGNOSIS, WITH THE BOARD CLONED OUT: the chapel is NOT truncated and
carries no stitch artifact -- steeple, gable and roof are one structure, the
nave continues left behind the Improvement Company, and the wall runs
unbroken to the boardwalk. What it has is NO ARCHITECTURE: no door, no
window, no step, no plinth anywhere on the front. A church nobody can enter,
whose facade is a blank slab meeting a boardwalk. At gameplay scale it reads
as a steeple and a triangle rather than a building, which is exactly the
failure the brief names. Moving the board cannot fix that -- it would only
uncover more blank wall -- so this is the brief's CASE 2 and the one
conditional chapel operation is spent on it.

THE CANVAS: a 520x520 window of the plate (x 1380-1900, y 90-610) at x1.969,
the chapel centred. The mask frees the chapel's FRONT ONLY -- x 1505-1740, y
330-578 -- which keeps the steeple, the whole roof and gable, the Improvement
Company and its porch, the storefront right of the chapel, the mountains and
the boardwalk. The board stands inside that zone; it is frozen art, so it is
not asked for and not kept from the result: its own pixels are composited
back over the result by their wood-hue silhouette, cut from the plate as it
is now (phase15f-chapel-integrate.py). A door painted behind it stays behind
it, which is what a notice board on a boardwalk in front of a church does.
"""
import hashlib, json, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
REGION = (1380, 90, 1900, 610)
SCALE = 1024 / (REGION[2] - REGION[0])
AT = (0, 0)
ZONE = (1505, 330, 1740, 578)
plate = Image.open(PLATE).convert('RGB')

crop = plate.crop(REGION)
scaled = crop.resize((round(crop.width * SCALE), round(crop.height * SCALE)), Image.LANCZOS)
canvas = Image.new('RGB', (1024, 1024), (12, 10, 8)); canvas.paste(scaled, AT)
canvas.save('art/staging/room-02/chapel-01/edit-canvas.png')
m = Image.new('L', (1024, 1024), 255)
ImageDraw.Draw(m).rectangle([AT[0] + (ZONE[0] - REGION[0]) * SCALE, AT[1] + (ZONE[1] - REGION[1]) * SCALE,
                             AT[0] + (ZONE[2] - REGION[0]) * SCALE, AT[1] + (ZONE[3] - REGION[1]) * SCALE], fill=0)
mask = Image.new('RGBA', (1024, 1024), (0, 0, 0, 255)); mask.putalpha(m)
mask.save('art/staging/room-02/chapel-01/edit-mask.png')
diag = canvas.convert('RGBA'); tint = Image.new('RGBA', (1024, 1024), (255, 60, 60, 90))
diag.paste(tint, (0, 0), Image.eval(m, lambda v: 255 - v))
diag.convert('RGB').save('renders/opening-set-retrofit/phase15f-chapel-canvas-diagnostic.png')

record = {'schema': 1, 'region': list(REGION), 'scale': round(SCALE, 4), 'at': list(AT), 'zonePlate': list(ZONE),
          'canvas': 'art/staging/room-02/chapel-01/edit-canvas.png', 'mask': 'art/staging/room-02/chapel-01/edit-mask.png',
          'maskSha256': sha('art/staging/room-02/chapel-01/edit-mask.png'),
          'diagnostic': 'renders/opening-set-retrofit/phase15f-chapel-canvas-diagnostic.png',
          'purpose': "OWNER-AUTHORIZED, CONDITIONAL (Tyler, Phase 1.5F): the chapel-front operation, 1 of 1, spent only because the board-hidden diagnostic proved the facade itself carries no architecture -- no door, no window, no step, no plinth. Repair, not redesign: the chapel keeps its location, its steeple, its distant scale and its night lighting, and gains the entrance and base that make it read as a building behind the street.",
          'source': {PLATE: sha(PLATE)},
          'mustRemainUnchanged': 'the steeple and the whole roof and gable above y 330, the Improvement Company and its porch left of x 1505, the storefront right of x 1740, the mountains, the boardwalk below y 578, and the notice board (restored by its own silhouette after the operation)',
          'note': __doc__.strip()}
json.dump(record, open('art/staging/room-02/chapel-01/chapel-op.json', 'w'), indent=1)
open('art/staging/room-02/chapel-01/chapel-op.json', 'a').write('\n')
print('prepared', REGION, 'scale', round(SCALE, 4), 'zone', ZONE)
