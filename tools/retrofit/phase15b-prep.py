"""PHASE 1.5B -- PREPARE THE TWO AUTHORIZED OPERATIONS (doc 36 Q118), no call.

  MAIN STREET TROUGH   the accepted candidate plate has no true source (it is
                       two stitched panels), so an errata-63 source canvas is
                       BUILT from the plate: a 1920x864 window around the
                       trough site, taken down to 1520x684 with the derivation
                       kernel and set at (8,170) of a 1536x1024 canvas; the
                       mask frees only the trough's footprint in the mud.
                       Afterwards the derived window's masked region is the
                       only thing taken, and the trough is cut from it by
                       difference against the plate, so the companion's alpha
                       is the trough's own silhouette.
  NUGGET FLOOR         the whole public floor, in source space, on top of the
                       floor-01 result (which already carries the accepted
                       foreground dirt in source space), furniture and
                       architecture EXCLUDED by the restore step's boxes and,
                       in the mask itself, by the bar, stairs, piano, stove
                       and walls lying outside the polygon.

    python3 tools/retrofit/phase15b-prep.py
"""
import hashlib, json, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
CROP = (8, 170, 1528, 854)   # errata 63: the 1520x684 of the 1536x1024 source that becomes 1920x864


def plate_to_source_mask(plate_mask):
    """A plate-space L mask (1920x864, 255 = paint) -> an RGBA edit mask in source space (alpha 0 = paint)."""
    small = plate_mask.resize((1520, 684), Image.NEAREST)
    alpha = Image.new('L', (1536, 1024), 255)
    alpha.paste(Image.eval(small, lambda v: 255 - v), (8, 170))
    mask = Image.new('RGBA', (1536, 1024), (0, 0, 0, 255)); mask.putalpha(alpha)
    return mask


def diagnostic(plate, plate_mask, out, colour=(255, 60, 60)):
    im = plate.convert('RGBA'); tint = Image.new('RGBA', im.size, colour + (90,))
    im.paste(tint, (0, 0), plate_mask)
    d = ImageDraw.Draw(im); d.text((12, 12), f'MASK DIAGNOSTIC: red = the region the model may paint. {out}', fill=(255, 255, 255))
    im.convert('RGB').save(out)


# ---- MAIN STREET TROUGH ----------------------------------------------------
MS_PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
plate = Image.open(MS_PLATE).convert('RGB')
WIN_X = 1200                                   # the 1920-wide window: x 1200-3120 of the plate
TROUGH_ZONE = (1960, 540, 2370, 712)           # plate space: the mud beside the east rail, base at ~688
window = plate.crop((WIN_X, 0, WIN_X + 1920, 864))
canvas = Image.open('art/staging/room-02/street-east-source-01.png').convert('RGB').copy()  # the east panel's own source: its letterbox pixels are the right night
canvas.paste(window.resize((1520, 684), Image.LANCZOS), (8, 170))
canvas.save('art/staging/room-02/trough-01/edit-canvas.png')
pm = Image.new('L', (1920, 864), 0)
ImageDraw.Draw(pm).rectangle([TROUGH_ZONE[0] - WIN_X, TROUGH_ZONE[1], TROUGH_ZONE[2] - WIN_X, TROUGH_ZONE[3]], fill=255)
pm.save('art/staging/room-02/trough-01/mask-window.png')
plate_to_source_mask(pm).save('art/staging/room-02/trough-01/edit-mask.png')
full = Image.new('L', (3610, 864), 0); full.paste(pm, (WIN_X, 0))
diagnostic(plate, full, 'renders/opening-set-retrofit/phase15b-trough-mask-diagnostic.png')
rec = {'schema': 1, 'purpose': 'THE ONE AUTHORIZED TROUGH OPERATION (Tyler, Phase 1.5B section 4): local prop art only. The Phase 1.5 trough -- the shipping plate\'s trough scaled 1.9 -- read as cut and pasted, jagged at the rim, older than the street and electric blue in the water (owner finding 1). A new trough is painted IN CONTEXT, inside a mask that frees only its footprint in the mud beside the east hitching rail; the accepted plate outside that footprint is not touched by construction, because only the masked region of the derived result is taken, and from it only the trough\'s own silhouette (by difference against the plate) becomes the companion. The hotspot, the filled state, the plane-1 occlusion, the obstacle and the approach are kept.',
       'source': {MS_PLATE: sha(MS_PLATE), 'editCanvas': 'art/staging/room-02/trough-01/edit-canvas.png', 'canvasNote': 'built from the plate (no true source exists for a stitched plate): plate window x 1200-3120 taken to 1520x684 with errata 63\'s kernel and set at (8,170) of the east panel\'s own source canvas'},
       'window': {'plateX0': WIN_X, 'width': 1920}, 'troughZonePlate': list(TROUGH_ZONE), 'mask': 'art/staging/room-02/trough-01/edit-mask.png', 'maskSha256': sha('art/staging/room-02/trough-01/edit-mask.png'),
       'mustRemainUnchanged': 'everything outside the trough zone: the rail and its posts, the boardwalk edge, the notice-board building, the saloon, every building, the mud beyond the zone, the dog\'s ground', 'diagnostic': 'renders/opening-set-retrofit/phase15b-trough-mask-diagnostic.png'}
json.dump(rec, open('art/staging/room-02/trough-01/trough-op.json', 'w'), indent=1); open('art/staging/room-02/trough-01/trough-op.json', 'a').write('\n')

# ---- NUGGET FLOOR, THE WHOLE PUBLIC FLOOR ------------------------------------
NG_BASE = 'art/staging/room-03/corrected-01/plate-cold-dirt.png'
ng = Image.open(NG_BASE).convert('RGB')
# The public floor: the doorway threshold, the far wall's foot behind the piano
# and the table (the wall base runs about y 445 there), the stove's and the
# back door's foot (~410), the stairs' foot (~395), then the bar's front foot
# from its left end (1205,505) to the frame's edge (1920,836).
FLOOR2 = [(40, 640), (300, 606), (500, 525), (505, 521), (705, 521), (712, 404), (1058, 404), (1060, 410), (1130, 410), (1198, 398), (1205, 505), (1250, 528), (1920, 836), (1920, 864), (40, 864)]
pm2 = Image.new('L', (1920, 864), 0); ImageDraw.Draw(pm2).polygon(FLOOR2, fill=255)
# HOLES FOR THE FURNITURE THE POLYGON NOW REACHES BEHIND: the table top (an
# ellipse the model must not touch) and, inside the table-and-chairs box,
# every pixel the restore step's classifier calls furniture (chair backs and
# legs, the pedestal, the bottle and glasses) -- so the floor between the legs
# is painted and the furniture is not even offered.
TABLE_TOP = (786, 352, 1004, 402)
ImageDraw.Draw(pm2).ellipse(TABLE_TOP, fill=0)
hsv = np.array(ng.convert('HSV')).astype(float)
hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
arr = np.array(pm2)
for (x0, y0, x1, y1) in [(712, 335, 1090, 510), (1170, 490, 1285, 690), (1320, 535, 1440, 750), (1555, 610, 1710, 840), (1390, 755, 1500, 864), (630, 405, 725, 505)]:
    win = (slice(y0, y1), slice(x0, x1))
    plank_or_dirt = (hue[win] > 8) & (hue[win] < 42) & (sat[win] > 45) & (val[win] > 40) & (val[win] < 200)
    arr[win][~plank_or_dirt] = 0
pm2 = Image.fromarray(arr)
pm2.save('art/staging/room-03/floor-02/floor-mask-plate.png')
plate_to_source_mask(pm2).save('art/staging/room-03/floor-02/edit-mask.png')
diagnostic(ng, pm2, 'renders/opening-set-retrofit/phase15b-floor-mask-diagnostic.png')
old = np.array(Image.open('art/staging/room-03/floor-01/floor-mask-plate.png').convert('L')) > 127
new = np.array(pm2) > 127
rec2 = {'schema': 1, 'purpose': 'THE ONE REMAINING NUGGET OPERATION (Tyler, Phase 1.5B section 12): the public saloon floor completed as dirt. The Phase 1.5 mask stopped at the far wall\'s foot line in front of the furniture and left planks under and around the card table, the stove side and the bar-side circulation (owner finding 3). This mask is the whole public floor: doorway to the far wall\'s foot behind the piano and the table, the stove\'s and the back door\'s foot, the stairs\' foot, and the bar\'s front foot to the frame edge. The image edited is floor-source-01.png, the Phase 1.5 result in source space, which already carries the accepted foreground dirt, so the model continues that material rather than inventing another.',
        'source': {'art/staging/room-03/floor-source-01.png': sha('art/staging/room-03/floor-source-01.png'), NG_BASE: sha(NG_BASE)},
        'floorPolygonPlate': FLOOR2, 'mask': 'art/staging/room-03/floor-02/edit-mask.png', 'maskSha256': sha('art/staging/room-03/floor-02/edit-mask.png'), 'maskPlate': 'art/staging/room-03/floor-02/floor-mask-plate.png',
        'maskPixels': {'phase15': int(old.sum()), 'phase15b': int(new.sum()), 'added': int((new & ~old).sum())},
        'furnitureExcluded': 'inside the polygon the three stools, the spittoon, the piano stool, the chairs\' legs and feet and the table\'s pedestal are restored from the accepted plate by tools/retrofit/nugget-floor-restore.py (boxes there); outside it the bar, the stairs, the piano, the stove, the doors, the walls and the trim are never in the mask',
        'mustRemainUnchanged': 'every wall, door, window, the piano, the card table and its chairs, the stove and pipe, the stairs, the bar, the stools, the spittoon, the chandelier, the mirror, the portrait, the handbill, the lamps; the accepted foreground dirt language continues, not a new material',
        'diagnostic': 'renders/opening-set-retrofit/phase15b-floor-mask-diagnostic.png'}
json.dump(rec2, open('art/staging/room-03/floor-02/floor-op.json', 'w'), indent=1); open('art/staging/room-03/floor-02/floor-op.json', 'a').write('\n')
print(json.dumps(rec2['maskPixels']))
