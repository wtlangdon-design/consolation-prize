"""PHASE 1.5E -- TWO LOCAL STRUCTURAL REPAIR CANVASES (doc 36 Q121).

Tyler's ruling after 1.5D: the board and the trough still read as separate
pieces composited over the environment. The strategy changes: the board's
structure and the trough become PLATE, painted as local structural repairs of
the accepted plate, one operation per region, on local near-square canvases
with the problem region at the centre. Preflight diagnosis (recorded in Q121):

  REGION A  the west and east source panels were stitched at x 1704-1800 with
            a 96 px feather; the west panel's freestanding notice board (x
            1615-1790) fell inside the feather, so its right half is a ghost
            dissolved into the east panel's porch (its roof meets the porch
            roof at the same height, a doubled lantern at ~1755,430, a
            half-transparent post). The church is NOT structurally broken:
            its steeple, gable and both walls match the west source, its
            right wall ends at x ~1690 with open hills between it and the
            east storefront's false front (x ~1755); only its lower right
            wall behind the board sits in the seam. So the mask frees the
            board, the church's lower right wall behind it, and the east
            porch's ghosted left end (roof end and post), and keeps the
            steeple, gable, the Company porch, the lit window and the mud.
  REGION B  the 1.5D trough (x 2016-2400, y 654-808, 154 px tall) stands
            with its back rim ABOVE the top of the east rail's near post (y
            690) while its right end passes behind that post, so the post
            reads as rising out of the trough; the two were authored apart.
            The mask frees the mud in front of the saloon from the boardwalk
            foot down, with the WHOLE east rail inside it, so trough and rail
            are authored together as one scene. The 1.5D trough result rides
            along as the object reference only.

    python3 tools/retrofit/phase15e-prep.py
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
    zx0, zy0, zx1, zy1 = zone
    m = Image.new('L', (1024, 1024), 255)
    ImageDraw.Draw(m).rectangle([at[0] + (zx0 - x0) * scale, at[1] + (zy0 - y0) * scale, at[0] + (zx1 - x0) * scale, at[1] + (zy1 - y0) * scale], fill=0)
    mask = Image.new('RGBA', (1024, 1024), (0, 0, 0, 255)); mask.putalpha(m)
    mask.save(f'art/staging/room-02/{name}/edit-mask.png')
    diag = canvas.convert('RGBA'); tint = Image.new('RGBA', (1024, 1024), (255, 60, 60, 90)); diag.paste(tint, (0, 0), Image.eval(m, lambda v: 255 - v))
    diag.convert('RGB').save(f'renders/opening-set-retrofit/phase15e-{name}-canvas-diagnostic.png')
    return {'region': list(region), 'scale': scale, 'at': list(at), 'zonePlate': list(zone), 'canvas': f'art/staging/room-02/{name}/edit-canvas.png', 'mask': f'art/staging/room-02/{name}/edit-mask.png', 'maskSha256': sha(f'art/staging/room-02/{name}/edit-mask.png'), 'diagnostic': f'renders/opening-set-retrofit/phase15e-{name}-canvas-diagnostic.png'}


a = local('repair-a', (1440, 110, 1960, 630), 1.96, (2, 2), (1585, 335, 1800, 615))
a.update({'schema': 1, 'purpose': "OWNER-AUTHORIZED (Tyler, Phase 1.5E): REGION A, the one local structural repair of the notice-board / storefront / church relationship, 1 of 1. A 520x520 window of the accepted plate scaled x1.96 into a 1024 canvas; the mask frees the stitched board, the church's lower right wall behind it and the east porch's ghosted left end, and keeps the steeple, gable, the Company porch, the lit window, the boardwalk edge and the mud. The result's masked zone, scaled back 1:1, becomes PLATE (street-candidate-03); the board's structure and its ordinary papers are environment, only the Act III funeral sheet stays an overlay.", 'source': {MS_PLATE: sha(MS_PLATE)}, 'diagnosis': 'stitch seam x 1704-1800 (96 px feather) through the west panel\'s board; church intact outside the seam, not repainted above y 335 or left of x 1585', 'mustRemainUnchanged': 'the steeple and church roof, the Company building and its porch, the storefront\'s lit window and false front right of x 1800, the boardwalk edge and the mud below y 615'})
json.dump(a, open('art/staging/room-02/repair-a/repair-op.json', 'w'), indent=1); open('art/staging/room-02/repair-a/repair-op.json', 'a').write('\n')

b = local('repair-b', (1880, 380, 2760, 864), 1024 / 880, (0, 230), (1960, 600, 2690, 864))
ref = Image.open('art/staging/room-02/trough-02/local-1to1.png').convert('RGB')
ref = ref.crop((2016 - 1880, 640 - 420, 2400 - 1880, 820 - 420)); ref = ref.resize((ref.width * 2, ref.height * 2), Image.LANCZOS)
refc = Image.new('RGB', (1024, 1024), (12, 10, 8)); refc.paste(ref, ((1024 - ref.width) // 2, (1024 - ref.height) // 2)); refc.save('art/staging/room-02/repair-b/object-reference.png')
b.update({'schema': 1, 'purpose': "OWNER-AUTHORIZED (Tyler, Phase 1.5E): REGION B, the one local structural repair of the water-trough / east hitching-rail relationship, 1 of 1. An 880x484 window of the accepted plate scaled x1.164 and set in the middle of a 1024 canvas with letterbox above and below; the mask frees the mud in front of the saloon from the boardwalk foot (y 600) to the frame bottom with the whole east rail inside it, so the trough and the rail are authored TOGETHER as one physical scene. The 1.5D trough result is the object reference only; the current pasted trough is NOT in the source (the plate never held it). The result's masked zone, scaled back 1:1, becomes PLATE (street-candidate-03): the trough is permanent scenery, occluding by an environmental plane mask.", 'source': {MS_PLATE: sha(MS_PLATE), 'objectReference': 'art/staging/room-02/repair-b/object-reference.png'}, 'diagnosis': 'the 1.5D trough (154 px tall) back rim above the near rail post\'s top while its end passes behind the post; authored apart from the rail', 'mustRemainUnchanged': 'the saloon, its porch, steps and lamps, the storefronts, the boardwalk and its edge, the mud left of x 1960'})
json.dump(b, open('art/staging/room-02/repair-b/repair-op.json', 'w'), indent=1); open('art/staging/room-02/repair-b/repair-op.json', 'a').write('\n')
print('prepared')
