"""WHAT THE TWO FURNITURE-CLUSTER OPERATIONS RETURNED (doc 36 Q134).

    python3 tools/retrofit/nugget-cluster-evidence.py

Both were spent and neither was used. This puts what was sent beside what came
back, with the difference between them, so the rejection is a thing a person
can look at rather than a number they have to trust. Nothing here is
integrated and nothing in the room is touched.
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
SRC = json.load(open('art/staging/room-03/cluster-sources.json'))['clusters']
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    F = B = T = ImageFont.load_default()

CAPTION = {
    'card': 'CARD TABLE — REJECTED. The room outside the free window came back untouched (mean '
            'difference 4 of 255, nothing over 48), and inside it the furniture moved: the '
            'table\'s near rim, the line a seated man\'s lap has to sit behind, dropped 66 plate '
            'pixels; the tabletop narrowed by a quarter; the packed-dirt floor became planks. The '
            'composition is a real card game. It is a real card game at a table this room '
            'does not have.',
    'bar': 'BAR — REJECTED, and not close. This is a different saloon: a short frontal bar instead '
           'of the long diagonal counter, one stool instead of three, a new stove, a new door, a '
           'new window, a plank floor. Even the region the mask kept came back changed — 65% of '
           'its pixels differ by more than 16 — and no uniform shift registers it (best offset '
           'improves the residual by 1%). The three men are using a bar that was invented for '
           'them.',
}


def half(im):
    return im.resize((im.width // 2, im.height // 2), Image.LANCZOS)


def lift(im, gamma=0.55):
    a = np.asarray(im.convert('RGB')).astype(float) / 255.0
    return Image.fromarray((np.power(a, gamma) * 255).astype(np.uint8))


rows = []
for name in ('card', 'bar'):
    spec = SRC[name]
    sent = Image.open(spec['canvas']).convert('RGB')
    got = Image.open(f"{os.path.dirname(spec['canvas'])}/source.png").convert('RGB')
    diff = np.abs(np.asarray(sent).astype(int) - np.asarray(got).astype(int)).max(axis=2)
    heat = Image.fromarray(np.clip(diff * 3, 0, 255).astype(np.uint8)).convert('RGB')
    rows.append((name, [('SENT — the accepted plate at x2', half(lift(sent))),
                        ('GOT — the composition', half(lift(got))),
                        ('DIFFERENCE x3', half(heat))]))

probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))


def wrap(text, w):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if probe.textlength(trial, font=F) <= w:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


width = max(sum(c.width + 18 for _, c in cells) + 18 for _, cells in rows)
blocks = [wrap(CAPTION[name], width - 28) for name, _ in rows]
height = 96 + sum(max(c.height for _, c in cells) + 30 + 20 * len(b) + 26
                  for (_, cells), b in zip(rows, blocks))
canvas = Image.new('RGB', (width, height), (22, 22, 26))
d = ImageDraw.Draw(canvas)
d.text((16, 16), 'PHASE 2A  The two furniture-registered cluster operations, and why neither ships',
       fill=(238, 238, 242), font=T)
d.text((16, 48), 'Both were spent. Both failed the furniture-registration gate BEFORE anything was '
       'extracted, which is what the gate is for.', fill=(255, 150, 145), font=F)
d.text((16, 70), 'The plates are brightened here only, so the geometry is visible. Nothing in the '
       'room was changed and no character art was modified.', fill=(150, 150, 160), font=F)
y = 96
for (name, cells), block in zip(rows, blocks):
    x = 18
    for label, im in cells:
        canvas.paste(im, (x, y))
        d.text((x, y + im.height + 6), label, fill=(222, 222, 228), font=B)
        x += im.width + 18
    y += max(c.height for _, c in cells) + 30
    for line in block:
        d.text((16, y), line, fill=(222, 222, 228), font=F)
        y += 20
    y += 26
canvas.save(f'{OUT}/phase2a-cluster-rejections.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-cluster-rejections.webp', canvas.size)
