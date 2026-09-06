"""PHASE 1.5D -- TWO LOCAL, CENTRED WORKING CANVASES (doc 36 Q120).

Tyler's ruling after 1.5C: the model twice put the trough at the bottom edge
of a full-panorama canvas and once painted the notice board away, so each
subject now gets its OWN local source window with the site near the centre of
a near-square 1024x1024 canvas, scaled up so the model sees the site large,
and its own mask, prompt, proof and failure stop.

  BOARD    plate x 1500-2000, y 150-650 (500x500) scaled x2 -> 1000x1000, at
           (12,12) of 1024x1024. Mask: the papered wall between the porch post
           and the wall's edge, below the roof beam (1596-1800 x 388-560).
  TROUGH   plate x 1880-2600, y 420-864 (720x444) scaled x1.42 -> 1022x630,
           at (1,60) of 1024x1024, the site (1960-2400 x 560-800) landing at
           canvas y ~260-600 -- the middle of the frame, with letterbox above
           and below so no frame edge invites the trough to sit on it. The
           Phase 1.5C trough (good object, bad placement) is passed as the
           object reference.

    python3 tools/retrofit/phase15d-prep.py
"""
import hashlib, json, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
MS_PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
plate = Image.open(MS_PLATE).convert('RGB')


def local(name, region, scale, at, zone, colour=(12, 10, 8)):
    x0, y0, x1, y1 = region
    crop = plate.crop(region)
    scaled = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.LANCZOS)
    canvas = Image.new('RGB', (1024, 1024), colour); canvas.paste(scaled, at)
    canvas.save(f'art/staging/room-02/{name}/edit-canvas.png')
    # the mask in canvas space: alpha 0 where the model may paint
    zx0, zy0, zx1, zy1 = zone
    m = Image.new('L', (1024, 1024), 255)
    ImageDraw.Draw(m).rectangle([at[0] + (zx0 - x0) * scale, at[1] + (zy0 - y0) * scale, at[0] + (zx1 - x0) * scale, at[1] + (zy1 - y0) * scale], fill=0)
    mask = Image.new('RGBA', (1024, 1024), (0, 0, 0, 255)); mask.putalpha(m)
    mask.save(f'art/staging/room-02/{name}/edit-mask.png')
    diag = canvas.convert('RGBA'); tint = Image.new('RGBA', (1024, 1024), (255, 60, 60, 90)); diag.paste(tint, (0, 0), Image.eval(m, lambda v: 255 - v))
    diag.convert('RGB').save(f'renders/opening-set-retrofit/phase15d-{name}-canvas-diagnostic.png')
    return {'region': list(region), 'scale': scale, 'at': list(at), 'zonePlate': list(zone), 'canvas': f'art/staging/room-02/{name}/edit-canvas.png', 'mask': f'art/staging/room-02/{name}/edit-mask.png', 'maskSha256': sha(f'art/staging/room-02/{name}/edit-mask.png'), 'diagnostic': f'renders/opening-set-retrofit/phase15d-{name}-canvas-diagnostic.png'}


board = local('board-01', (1500, 150, 2000, 650), 2.0, (12, 12), (1596, 388, 1800, 560))
board.update({'schema': 1, 'purpose': "OWNER-AUTHORIZED (Tyler, Phase 1.5D): the bulletin-board operation, 1 of 1. A local 500x500 window of the accepted plate centred on the existing papered wall under the Clarion's porch, scaled x2 so the papers read as the semantic anchor; the mask frees only that wall below the roof beam. The model is asked to FRAME THESE PAPERS INTO A COHERENT NOTICE BOARD at the existing location. The result's masked region, scaled back, becomes the posted_notices ORDINARY state image (a companion over the unchanged plate); the funeral sheet goes on it.", 'source': {MS_PLATE: sha(MS_PLATE)}, 'mustRemainUnchanged': 'the porch roof and beam above, the porch post left of the board, the neighbouring building right of it, the boardwalk below, everything outside the wall zone'})
json.dump(board, open('art/staging/room-02/board-01/board-op.json', 'w'), indent=1); open('art/staging/room-02/board-01/board-op.json', 'a').write('\n')
trough = local('trough-02', (1880, 420, 2600, 864), 1.42, (1, 60), (1960, 560, 2400, 800))
# the object reference: the Phase 1.5C trough, cropped from that result's window
raw = Image.open('art/staging/room-02/integrate-01/window-1920x864.png').convert('RGB')
ref = raw.crop((2040 - 1200, 690, 2460 - 1200, 864)); ref = ref.resize((ref.width * 2, ref.height * 2), Image.LANCZOS)
refc = Image.new('RGB', (1024, 1024), (12, 10, 8)); refc.paste(ref, ((1024 - ref.width) // 2, (1024 - ref.height) // 2)); refc.save('art/staging/room-02/trough-02/object-reference.png')
trough.update({'schema': 1, 'purpose': "OWNER-AUTHORIZED (Tyler, Phase 1.5D): the water-trough operation, 1 of 1. A local 720x444 window of the accepted plate around the site beside the east hitching rail, scaled x1.42 and set in the MIDDLE of a 1024x1024 canvas with letterbox above and below, so the site is nowhere near a frame edge; the mask frees only the site. The Phase 1.5C trough (good object, wrong placement) is passed as the object reference. The result's masked region, scaled back, becomes the water_trough FILLED state image (a companion over the unchanged plate); the plane-1 mask is an authored silhouette cut from it.", 'source': {MS_PLATE: sha(MS_PLATE), 'objectReference': 'art/staging/room-02/trough-02/object-reference.png'}, 'mustRemainUnchanged': 'the hitching rail and its posts, the boardwalk edge and the porches above, the saloon, the mud outside the site'})
json.dump(trough, open('art/staging/room-02/trough-02/trough-op.json', 'w'), indent=1); open('art/staging/room-02/trough-02/trough-op.json', 'a').write('\n')
print('prepared')
