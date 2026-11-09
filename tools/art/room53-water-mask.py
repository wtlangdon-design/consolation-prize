"""Room 53's two water planes (reference/room-53/annotation.json, occlusion): the river in front of a man standing in it,
from his knee to his feet. No image operation.

    python3 tools/art/room53-water-mask.py

The river is everything right of the near bank's edge: the bank's edge is the column where the mud meets the water.
The bar's outline (BAR, plate pixels) is kept for the render, which draws it, but is not cut from the masks. A man is under water to the knee:
KNEE of the room's man where he stands (the curve, `MAN`). Plane 1 is the ford: Thad crosses it in one band, 485 to 505,
so its mask is the near channel's water over the rows from the knee of a man at the band's top to the band's foot. Plane
2 is the channel right of the bar, where the panner stands with his feet on the river bed at y 690. Each mask is white
where the water is in front of the figure on that plane; the masks are not drawn.

Writes art/masks/room-53-plane-1.png, art/masks/room-53-plane-2.png and renders/room-53-water-planes.png (the plate
with plane 1 tinted blue and plane 2 tinted red).
"""
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-53-river.png')
# The bar, its ring of stones and the stump, traced clockwise from its left tip.
BAR = [(1000, 465), (1035, 427), (1120, 402), (1250, 365), (1345, 365), (1400, 420), (1485, 440), (1595, 505),
       (1640, 525), (1770, 575), (1780, 620), (1760, 640), (1645, 658), (1495, 652), (1360, 622), (1235, 597),
       (1165, 562), (1090, 532)]
BANK_EDGE = 868          # the column where the near bank's mud meets the water, down the ford's rows and below
KNEE = 0.27              # of a man, from his soles


def man(y):
    return 110 + (490 - 110) * (y - 300) / (858 - 300)


def plane(rows, cols):
    """White over these rows and columns, right of the bank: the water surface in front of a man standing in it.

    A mask hides only the figure's own pixels, so what the plate shows behind him there -- the bar's right tip behind
    the panner -- does not matter: the water between him and us is in front of his shins whatever lies beyond him. The
    first cut left the bar's outline out of the mask, and the panner's legs showed down to y 641 where the bar is
    behind him (the proof: "cut off at y641, 49px above her feet")."""
    w, h = Image.open(PLATE).size
    mask = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rectangle([cols[0], rows[0], cols[1], rows[1]], fill=255)
    d.rectangle([0, 0, BANK_EDGE, h], fill=0)
    return mask


def main():
    ford_top, ford_foot = 485, 505
    one = plane((round(ford_top - KNEE * man(ford_top)), ford_foot), (BANK_EDGE, 1040))
    feet = 690
    two = plane((round(feet - KNEE * man(feet)), feet + 12), (1690, 1919))
    os.makedirs(os.path.join(ROOT, 'art/masks'), exist_ok=True)
    for mask, name in ((one, 'room-53-plane-1.png'), (two, 'room-53-plane-2.png')):
        # As every plane's mask (art/masks/room-52-plane-1.png): white and opaque where the plane is, clear elsewhere.
        out = Image.new('RGBA', mask.size, (0, 0, 0, 0))
        out.paste(Image.new('RGBA', mask.size, (255, 255, 255, 255)), (0, 0), mask)
        out.save(os.path.join(ROOT, 'art/masks', name))
    show = Image.open(PLATE).convert('RGB')
    blue = Image.new('RGB', show.size, (40, 90, 255))
    red = Image.new('RGB', show.size, (255, 50, 50))
    show = Image.composite(Image.blend(show, blue, 0.55), show, one)
    show = Image.composite(Image.blend(show, red, 0.55), show, two)
    ImageDraw.Draw(show).line(BAR + [BAR[0]], fill=(255, 220, 60), width=2)
    show.save(os.path.join(ROOT, 'renders/room-53-water-planes.png'))
    print({'plane1rows': [round(ford_top - KNEE * man(ford_top)), ford_foot], 'plane2rows': [round(feet - KNEE * man(feet)), feet + 12]})


if __name__ == '__main__':
    main()
