"""PHASE 2A: a deterministic face finish on two candidate figures (doc 36 Q132).

    python3 tools/art/phase2a-face-finish.py [--write]

ZERO IMAGE-GENERATION OPERATIONS. Tyler's ruling after the last authorized
generation: identity, pose, clothing, hair, hat, moustache and cloth all came
back right, and the whole remaining mismatch was in the face -- eyes drawn as
eyeballs, cheeks modelled as smooth ramps. That is a small enough target to
repaint, so it is repainted rather than recast.

WHAT THIS IS NOT. Not a filter. Nothing here runs over a whole sprite: every
operation is confined to a declared region of a declared character, and hair,
hat, facial hair, clothing, hands, props, body and pose are never touched.
There is no blur, no global posterize, no palette reduction, no
downsample-and-upscale, no nearest-neighbour degradation.

THE TWO CORRECTIONS, which are the two Tyler named:

1. THE EYE. The generated eye is an eyeball -- a white sclera, an iris
   highlight, a catchlight. Thad's eye at the same displayed height is one dark
   shape, and so is every accepted figure's in this game.

   THE DARK PART OF THE EYE IS ALREADY RIGHT and is never touched. Reading the
   actual pixels settles what the rule has to be. Brightness alone cannot do
   it: the lit lid inside the rectangle runs to 195 and one man's catchlight
   only reaches 184, so any single threshold either leaves a white dot or eats
   a lid. WARMTH can. This cast is lit by lamplight and their skin is heavily
   warm -- red minus blue sits around 170 across every face -- while a sclera
   or a catchlight is near-neutral, red minus blue under about 60. So the rule
   is: inside the rectangle, a pixel that is LIGHT and NOT WARM is eyeball, and
   takes the eye's own darkest tone. Everything else is left exactly as drawn,
   so the eye keeps the shape the drawing gave it and stops being an eyeball.

   Three wider rules were tried and thrown away, and they are worth naming
   because each looked reasonable. Filling every non-skin pixel in the
   rectangle, and filling every dark-or-bright pixel in it, both turned the
   shadow-side eye into a solid black RECTANGLE: on that side of the face the
   whole socket is below the dark threshold, so the rectangle became the shape.
   Counting dark neighbours in a 5x5 missed the middle of a five-pixel-wide
   sclera and, taken on a cropped window with wraparound, painted little
   brackets along the rectangle's edges. A hole fill found nothing at all,
   because the sclera is not enclosed -- it opens into the lower lid.

2. THE CHEEK. The skin inside the face is snapped to FOUR deliberate tones
   taken from the character's own art -- measured at the 10th, 35th, 60th and
   85th percentile of his own face -- so his colour family and his identity
   survive and what goes is the ramp between them.

   Snapping alone leaves islands: a handful of pixels of the shadow tone
   stranded in the lit plane, which read as blotches on a cheek rather than as
   shading. So every connected run of a tone smaller than MIN_MASS is handed to
   whichever tone most surrounds it. That is the difference between a few
   intentional masses and a quantized photograph, and it is done by counting
   areas rather than by blurring, so a large plane keeps every hard edge it
   had.

   The luminance is NOT smoothed first. An earlier pass median-filtered it to
   place the planes and the result was worse: simple boundaries, but they
   stopped following the face, and the nose and jaw dissolved into blobs.
   Snapping the original values keeps every plane edge where the drawing put
   it, which is what makes the result read as shading rather than as damage.

Every number in FACES was read off the art with a coordinate grid at 8x and
14x, not guessed, and the eye rectangles in particular were tightened twice:
a rectangle that reaches into the brow fills brow and socket together and the
man ends up wearing a black wedge.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
SRC = 'art/staging/room-03/cast-bar-pair-01'
OUT = f'{SRC}/finished'

FACES = {
    'bar-2': {
        'figureHeight': 741, 'deployedHeight': 380,
        'face': (115, 30, 200, 126),
        'browGuard': 44,
        'eyes': [(147, 63, 173, 77), (175, 60, 197, 77)],
        'note': 'three-quarters to screen right; the far eye sits higher and is foreshortened, '
                'and its outer edge is the silhouette, so the fill is bounded by alpha as well '
                'as by the rectangle',
    },
    'bar-3': {
        'figureHeight': 754, 'deployedHeight': 494,
        'face': (105, 58, 205, 128),
        'browGuard': 60,
        'eyes': [(137, 73, 170, 86), (170, 71, 198, 85)],
        'note': 'square to camera under a bowler; the moustache below y 96 and the hat above '
                'y 60 are outside every region here and are never touched',
    },
}
LEVEL_PERCENTILES = (10, 35, 60, 85)
MIN_MASS = 14           # a run of a tone smaller than this is an island, not a plane
EYE_LIGHT = 140         # a sclera is light...
EYE_WARMTH = 120        # ...and, unlike this lamplit skin, not warm (red minus blue)


def skin_of(rgb, alpha, box, eyes, guard):
    """Skin inside the face box: opaque, warm, and light enough to be a plane.

    Hair, brow, moustache, nostril, mouth and the shadow under the jaw all fall
    below this and are never quantized -- they are already the hard dark
    accents the target vocabulary asks for."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mask = np.zeros(alpha.shape, bool)
    x0, y0, x1, y1 = box
    mask[y0:y1, x0:x1] = True
    mask[:guard, :] = False
    mask &= (alpha > 200) & (r > b + 25) & (r >= 100) & (g > b)
    for ex0, ey0, ex1, ey1 in eyes:
        mask[ey0:ey1, ex0:ex1] = False
    return mask


def drop_islands(index, mask, levels, min_mass=MIN_MASS, rounds=2):
    """Hand every run of a tone smaller than `min_mass` to the tone around it.

    NOT A BLUR AND NOT A FILTER: no value is invented and no edge is softened.
    A run either survives whole, with the boundary the drawing gave it, or it
    is absorbed whole into its neighbour. Runs are four-connected, found with
    an explicit stack -- Pillow and numpy are this repository's only Python
    dependencies and one more for a flood fill would be a poor trade."""
    height, width = index.shape
    out = index.copy()
    for _ in range(rounds):
        seen = np.zeros_like(mask)
        changed = False
        for sy in range(height):
            for sx in range(width):
                if not mask[sy, sx] or seen[sy, sx]:
                    continue
                level = out[sy, sx]
                run, stack, border = [], [(sy, sx)], []
                seen[sy, sx] = True
                while stack:
                    y, x = stack.pop()
                    run.append((y, x))
                    for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                        if not (0 <= ny < height and 0 <= nx < width) or not mask[ny, nx]:
                            continue
                        if out[ny, nx] == level:
                            if not seen[ny, nx]:
                                seen[ny, nx] = True
                                stack.append((ny, nx))
                        else:
                            border.append(int(out[ny, nx]))
                if len(run) >= min_mass or not border:
                    continue
                winner = max(set(border), key=border.count)
                for y, x in run:
                    out[y, x] = winner
                changed = True
        if not changed:
            break
    return out


def finish(name, spec, write):
    path = f'{SRC}/{name}.png'
    arr = np.asarray(Image.open(path).convert('RGBA')).astype(int).copy()
    rgb, alpha = arr[..., :3], arr[..., 3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]

    skin = skin_of(rgb, alpha, spec['face'], spec['eyes'], spec['browGuard'])
    targets = [np.percentile(lum[skin], p) for p in LEVEL_PERCENTILES]
    colours = []
    for target in targets:
        near = skin & (np.abs(lum - target) < 4)
        if near.sum() < 20:
            near = skin & (np.abs(lum - target) < 9)
        colours.append(rgb[near].mean(axis=0).round().astype(int))

    index = np.abs(np.stack([lum - t for t in targets])).argmin(axis=0)
    index = drop_islands(index, skin, len(targets))
    for level, colour in enumerate(colours):
        hit = skin & (index == level)
        for channel in range(3):
            arr[..., channel][hit] = colour[channel]

    eyes = []
    for ex0, ey0, ex1, ey1 in spec['eyes']:
        window = (slice(ey0, ey1), slice(ex0, ex1))
        wrgb, wal = arr[window][..., :3], arr[window][..., 3]
        wl = 0.299 * wrgb[..., 0] + 0.587 * wrgb[..., 1] + 0.114 * wrgb[..., 2]
        warmth = wrgb[..., 0] - wrgb[..., 2]
        sclera = (wal > 200) & (wl > EYE_LIGHT) & (warmth < EYE_WARMTH)
        dark = (wal > 200) & (wl < 115)
        if not sclera.any() or not dark.any():
            eyes.append({'box': [ex0, ey0, ex1, ey1], 'scleraPixels': int(sclera.sum()),
                         'darkPixelsLeftAlone': int(dark.sum()), 'ink': None})
            continue
        darkest = wl[dark].min()
        ink = wrgb[dark & (wl <= darkest + 6)].mean(axis=0).round().astype(int)
        for channel in range(3):
            arr[window][..., channel][sclera] = ink[channel]
        eyes.append({'box': [ex0, ey0, ex1, ey1], 'scleraPixels': int(sclera.sum()),
                     'darkPixelsLeftAlone': int(dark.sum()), 'ink': [int(v) for v in ink]})

    made = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    record = {'id': name, 'source': path, 'face': list(spec['face']),
              'browGuard': spec['browGuard'],
              'levels': [{'percentile': p, 'lum': round(float(t), 1),
                          'colour': [int(v) for v in c]}
                         for p, t, c in zip(LEVEL_PERCENTILES, targets, colours)],
              'method': f'the character\'s own luminance snapped to his own four tones, then '
                        f'every connected run smaller than {MIN_MASS} px handed to the tone '
                        f'around it. No smoothed pixel is ever written and no edge is softened: '
                        f'the output skin holds only the four declared colours.',
              'eyeRule': f'inside each rectangle, and only there, a pixel lighter than '
                         f'{EYE_LIGHT} whose red minus blue is under {EYE_WARMTH} is eyeball -- '
                         f'light but not warm, which this lamplit skin never is -- and takes the '
                         f'eye\'s own darkest tone. Everything else is left exactly as drawn, so '
                         f'the eye keeps its authored shape.',
              'skinPixelsRepainted': int(skin.sum()), 'eyes': eyes,
              'figureHeight': spec['figureHeight'], 'deployedHeight': spec['deployedHeight'],
              'note': spec['note']}
    if write:
        os.makedirs(OUT, exist_ok=True)
        made.save(f'{OUT}/{name}.png')
        record['out'] = f'{OUT}/{name}.png'
    print(f"{name}: skin {record['skinPixelsRepainted']} px -> {len(colours)} tones; "
          f"sclera removed {[e['scleraPixels'] for e in eyes]} px, "
          f"eye darks kept {[e['darkPixelsLeftAlone'] for e in eyes]} px")
    return record


write = '--write' in sys.argv
records = [finish(name, spec, write) for name, spec in FACES.items()]
if write:
    json.dump({'schema': 1,
               'note': 'PHASE 2A deterministic face finish: eyes and cheek planes only, on the '
                       'isolated candidates. Zero image-generation operations. Doc 36 Q132.',
               'figures': records},
              open(f'{OUT}/face-finish.json', 'w'), indent=1)
    open(f'{OUT}/face-finish.json', 'a').write('\n')
    print(f'{OUT}/face-finish.json')
