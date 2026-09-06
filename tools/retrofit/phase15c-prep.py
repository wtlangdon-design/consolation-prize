"""PHASE 1.5C -- OWNER REVIEW FAILED; PAINT THE SURFACES INTO THE ENVIRONMENT (doc 36 Q119).

Tyler's ruling on Phase 1.5B: the notice board and the trough still read as
cut and pasted, and the Nugget floor keeps plank remnants inside the
rectangular furniture-restore regions. The construction is wrong, not the
art: a companion over a plate is a composite, and a composite is what the eye
sees. So:

  MAIN STREET  one masked in-context operation over the plate window, the
               mask freeing BOTH the notice-board wall and the trough's
               footprint. The result's masked regions are composited into a
               NEW plate file (street-candidate-02) with feathered edges; the
               board structure and the trough become plate. The funeral sheet
               stays the only companion (it changes); the trough's occlusion
               mask becomes a separate alpha file cut from the new plate.
  NUGGET       one masked operation over the WHOLE public floor with NO
               furniture holes and NO rectangular restore afterwards: the
               model repaints the floor under and around the furniture; only
               tight furniture silhouettes may be restored, if at all.

    python3 tools/retrofit/phase15c-prep.py
"""
import hashlib, json, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()


def plate_to_source_mask(plate_mask):
    small = plate_mask.resize((1520, 684), Image.NEAREST)
    alpha = Image.new('L', (1536, 1024), 255)
    alpha.paste(Image.eval(small, lambda v: 255 - v), (8, 170))
    mask = Image.new('RGBA', (1536, 1024), (0, 0, 0, 255)); mask.putalpha(alpha)
    return mask


def diagnostic(plate, plate_mask, out):
    im = plate.convert('RGBA'); tint = Image.new('RGBA', im.size, (255, 60, 60, 90))
    im.paste(tint, (0, 0), plate_mask)
    ImageDraw.Draw(im).text((12, 12), f'MASK DIAGNOSTIC: red = the region the model may paint. {out}', fill=(255, 255, 255))
    im.convert('RGB').save(out)


# ---- MAIN STREET: board + trough, one operation ----------------------------
MS_PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
plate = Image.open(MS_PLATE).convert('RGB')
WIN_X = 1200
BOARD_ZONE = (1596, 350, 1800, 560)     # the small structure's wall under the porch, papers included
TROUGH_ZONE = (1960, 560, 2400, 800)    # the mud beside the east rail, the whole footprint the last result showed
window = plate.crop((WIN_X, 0, WIN_X + 1920, 864))
canvas = Image.open('art/staging/room-02/street-east-source-01.png').convert('RGB').copy()
canvas.paste(window.resize((1520, 684), Image.LANCZOS), (8, 170))
canvas.save('art/staging/room-02/integrate-01/edit-canvas.png')
pm = Image.new('L', (1920, 864), 0); d = ImageDraw.Draw(pm)
for z in (BOARD_ZONE, TROUGH_ZONE):
    d.rectangle([z[0] - WIN_X, z[1], z[2] - WIN_X, z[3]], fill=255)
pm.save('art/staging/room-02/integrate-01/mask-window.png')
plate_to_source_mask(pm).save('art/staging/room-02/integrate-01/edit-mask.png')
full = Image.new('L', (3610, 864), 0); full.paste(pm, (WIN_X, 0))
diagnostic(plate, full, 'renders/opening-set-retrofit/phase15c-street-mask-diagnostic.png')
rec = {'schema': 1, 'purpose': "OWNER-DIRECTED (Tyler, Phase 1.5B review, 2026-09-06): 'integrate the permanent board structure directly into the environment plate' and 'integrate the trough into the environment in context so its timber, mud contact, shadows, reflected light, water and edge treatment are painted together with the street'. One in-context operation over the plate window; its two masked regions become PLATE in a new file (street-candidate-02). Nothing else in the plate changes: only the masked regions of the derived result are composited, with feathered edges.",
       'source': {MS_PLATE: sha(MS_PLATE), 'editCanvas': 'art/staging/room-02/integrate-01/edit-canvas.png'}, 'window': {'plateX0': WIN_X, 'width': 1920},
       'zones': {'board': list(BOARD_ZONE), 'trough': list(TROUGH_ZONE)}, 'mask': 'art/staging/room-02/integrate-01/edit-mask.png', 'maskSha256': sha('art/staging/room-02/integrate-01/edit-mask.png'),
       'mustRemainUnchanged': 'everything outside the two zones: the porch roof and posts above the board, the neighbouring buildings, the boardwalk, the rail and its posts, the saloon, the mud beyond the trough zone', 'diagnostic': 'renders/opening-set-retrofit/phase15c-street-mask-diagnostic.png'}
json.dump(rec, open('art/staging/room-02/integrate-01/integrate-op.json', 'w'), indent=1); open('art/staging/room-02/integrate-01/integrate-op.json', 'a').write('\n')

# ---- NUGGET: the whole public floor, no holes --------------------------------
NG_BASE = 'art/staging/room-03/corrected-02/plate-cold-dirt.png'
ng = Image.open(NG_BASE).convert('RGB')
FLOOR3 = [(40, 640), (300, 606), (500, 525), (505, 521), (705, 521), (712, 404), (1058, 404), (1060, 410), (1130, 410), (1198, 398), (1205, 505), (1250, 528), (1920, 836), (1920, 864), (40, 864)]
pm3 = Image.new('L', (1920, 864), 0); ImageDraw.Draw(pm3).polygon(FLOOR3, fill=255)
# the table top alone stays out: a light wooden surface the model must not treat as floor
ImageDraw.Draw(pm3).ellipse((786, 352, 1004, 402), fill=0)
pm3.save('art/staging/room-03/floor-03/floor-mask-plate.png')
plate_to_source_mask(pm3).save('art/staging/room-03/floor-03/edit-mask.png')
diagnostic(ng, pm3, 'renders/opening-set-retrofit/phase15c-floor-mask-diagnostic.png')
rec3 = {'schema': 1, 'purpose': "OWNER-DIRECTED (Tyler, Phase 1.5B review, 2026-09-06): 'the entire walkable public floor must read as one continuous dirt floor... Preserve actual furniture pixels only -- not halos, former floor underneath furniture, or broad restore regions that reintroduce planks.' The Phase 1.5B mask cut holes around furniture by a classifier and the restore step used rectangular boxes; both left planks. This mask is the whole public floor with NO holes but the table top; the model repaints the floor under and around every leg. Afterwards NOTHING is restored by box: at most the tight furniture silhouettes, and only if the model moved them.",
        'source': {'art/staging/room-03/floor-source-02.png': sha('art/staging/room-03/floor-source-02.png'), NG_BASE: sha(NG_BASE)},
        'floorPolygonPlate': FLOOR3, 'mask': 'art/staging/room-03/floor-03/edit-mask.png', 'maskSha256': sha('art/staging/room-03/floor-03/edit-mask.png'), 'maskPlate': 'art/staging/room-03/floor-03/floor-mask-plate.png',
        'mustRemainUnchanged': 'every wall, door, window, the piano, the stove and pipe, the stairs, the bar, the chandelier, the mirror, the portrait, the handbill, the lamps, and -- inside the mask -- the stools, the spittoon, the chairs, the table pedestal and the piano stool as objects (the model is told to keep them; they are checked, not boxed)',
        'diagnostic': 'renders/opening-set-retrofit/phase15c-floor-mask-diagnostic.png'}
json.dump(rec3, open('art/staging/room-03/floor-03/floor-op.json', 'w'), indent=1); open('art/staging/room-03/floor-03/floor-op.json', 'a').write('\n')
print('prepared')
