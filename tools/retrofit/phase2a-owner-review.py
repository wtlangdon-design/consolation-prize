"""PHASE 2A CORRECTION PASS: the owner-review page, built from DEPLOYED frames.

    BASE_PATH=/consolation-prize/ npm run build
    node tools/gauntlet/production-shot.mjs <shots...>
    python3 tools/retrofit/phase2a-owner-review.py

WHY THIS IS NOT A COMPOSITE. Tyler reviewed the last pass off labelled
composites and rejected what he saw in the game, and he was right to: a
composite drawn from the staging numbers agrees with the engine by
construction. Everything on this page is a screenshot of the built bundle
served the way Pages serves it, downscaled and never cropped, so a panel is a
whole frame or it is not on the page.

The matched-height face strip is the one measurement that mattered. The
detail-density metrics could not separate Thad from the new cast; putting the
heads side by side at the SAME figure height does it in one look.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
SHOT = f'{OUT}/phase2a-production'
PLAY = (0, 0, 1920, 864)          # the play area is the TOP 864 rows; the panel is the bottom 216
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception:
    F = B = T = ImageFont.load_default()


def frame(name, width=1400):
    im = Image.open(f'{SHOT}-{name}.png').convert('RGB').crop(PLAY)
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def crop(name, box, zoom=1):
    """A region of a deployed frame at 1:1, or magnified with hard pixels.

    NEVER downscaled: the whole point of this panel is what the two men look
    like at the size the game actually draws them."""
    im = Image.open(f'{SHOT}-{name}.png').convert('RGB').crop(PLAY).crop(box)
    return im if zoom == 1 else im.resize((im.width * zoom, im.height * zoom), Image.NEAREST)


def wrap(draw, text, font, width):
    """A caption that runs off the right edge is a caption nobody read. The
    last sheet lost the three bar patrons that way, which is exactly the thing
    the panel was there to show."""
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=font) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def page(out, title, note, panels):
    w = max(im.width for im, _, _ in panels)
    probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))
    heads = [wrap(probe, note, F, w)]
    blocks = [wrap(probe, sub, F, w) for _, _, sub in panels]
    h = sum(im.height + 34 + 20 * len(b) + 16 for (im, _, _), b in zip(panels, blocks))
    canvas = Image.new('RGB', (w + 28, 64 + 20 * len(heads[0]) + h), (22, 22, 26))
    d = ImageDraw.Draw(canvas)
    d.text((14, 16), title, fill=(238, 238, 242), font=T)
    y = 50
    for line in heads[0]:
        d.text((14, y), line, fill=(190, 190, 200), font=F)
        y += 20
    y += 14
    for (im, cap, _), block in zip(panels, blocks):
        canvas.paste(im, (14, y))
        y += im.height + 8
        d.text((14, y), cap, fill=(255, 205, 140), font=B)
        y += 24
        for line in block:
            d.text((14, y), line, fill=(214, 214, 220), font=F)
            y += 20
        y += 16
    canvas.save(out, 'WEBP', quality=90, method=6)
    print(out, canvas.size)


page(f'{OUT}/phase2a-owner-review-street.webp',
     'PHASE 2A CORRECTION  Main Street, deployed bundle, gameplay scale',
     'Every panel is a complete 1920x864 play area from dist/, downscaled, never cropped. '
     'No environment art changed: plate, rail, trough, sign, navigation and the dog are as accepted.',
     [(frame('main-street-candidate'), 'AS YOU ARRIVE',
       'The pie woman is on the mud IN FRONT OF the rail, well clear of the trough at the left. '
       'The map seller is on his boardwalk; Thad is at the right-hand end of the street.'),
      (frame('main-street-candidate-at-700_800'), 'THAD BESIDE THE PIE WOMAN',
       'Failure 2. Her feet are on open mud, the trough is a whole body-width to her left, and '
       'she stands in front of the rail, not behind it. Thad is beside her for scale and detail.'),
      (frame('main-street-candidate-at-700_800-1200_780'), 'THAD BESIDE THE MAP SELLER',
       'The map seller at his final scale, unmoved, with Thad on the mud below the boardwalk.'),
      (frame('main-street-candidate-at-100_800-100_800-900_700-420_760'),
       'THAD BESIDE THE LETTER-WRITER AT HIS STATION',
       'Seated at the folding table with the satchel at his feet: the seated man\'s head reaches '
       'Thad\'s chest, which is what a seated man does.')])

page(f'{OUT}/phase2a-owner-review-nugget.webp',
     'PHASE 2A CORRECTION  The Bountiful Nugget, deployed bundle, gameplay scale',
     'Failure 3. Nine patrons: 3 at the bar, 4 at cards, 1 on the landing, 1 at the stove. '
     'Nobody at the piano. No animation on anyone -- these are static poses.',
     [(frame('nugget-candidate'), 'THE ROOM WITH NOBODY IN THE WAY',
       'Four men round the table with cards in hand. The abandoned fifth hand lies on the near '
       'edge, which is the side with no chair, so it still belongs to somebody who went outside. '
       'The stove man is turned INTO the iron with both hands open at it. At the bar: one seated '
       'on a stool with a cup, one leaning on the counter with his elbow up, one standing at the '
       'near end with a cup. The man on the landing is still, and the piano keeps its empty '
       'stool.'),
      (frame('nugget-candidate-at-560_800'), 'THAD IN THE ROOM',
       'Thad at the front left, at the near depth, with the whole population visible behind him.'),
      (crop('nugget-candidate', (1230, 240, 1920, 864)),
       'THE TWO FOREGROUND MEN AT 1:1 — nugget_bar_2 and nugget_bar_3, CORRECTED',
       'Not resized: this is the size the game draws them, and it is the size the correction had '
       'to survive. The eyes are dark shapes with no white in them and the cheeks are a few flat '
       'planes, done by repainting the faces of the isolated-pair candidates rather than by '
       'generating anything -- zero image operations (doc 36 Q132). They keep their near-camera '
       'depth, which is what gives the room its depth.')])
