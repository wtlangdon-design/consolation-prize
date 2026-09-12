#!/usr/bin/env python3
"""
THE TWO REPAIRS, AT 1:1, SIDE BY SIDE WITH WHAT TYLER REJECTED.

1:1 IS THE POINT and it is also the problem: the Nugget's plate is a dark
room, and at 1:1 on a bright screen the stove-side end is nearly black. So
each proof carries BOTH -- the untouched 1:1 pair, which is the honest
comparison, and the same pair lifted, which is nearer to what the deployed
build shows because the stove lamp (1095, 345, r170) falls straight across
the terminus. Neither is the owner gate; the runtime screenshot is.

    python3 tools/retrofit/nugget-shipping-proof.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OLD = ROOT / 'art/staging/room-03/rebuild-04/plate-room-03-recomposed.png'
NEW = ROOT / 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png'
OUT = ROOT / 'proofs/room-03/shipping-repair'

PROOFS = {
    'proof-a-stove-side-bar-end': {
        'box': (1120, 350, 1300, 600),
        'lead': 'DEFECT A -- THE STOVE-SIDE BAR END',
        'lines': [
            'REJECTED: the counter nosing feathers out across x 1178-1191 over the wall behind, and the',
            'brass foot rail runs to x 1178 with no bar above it. Neither stops; both fade.',
            'REPAIRED: both are cut back to the moulded end stile the bar already carries at x 1193-1196,',
            'so the terminus is one line. Nothing new is drawn -- the bar keeps the end it was built with.',
            'MEASURED: warmth (R-B) across the wall band y 378-390 ran 1.0 / 6.6 / 13.6 / 17.9 / 25.4 at',
            'x 1176 / 1180 / 1184 / 1188 / 1192 and now runs 1.0 / -0.8 / 0.5 / 0.4 / 25.4 -- the counter',
            'begins at x 1192 instead of smearing in from x 1178. Rail peak luminance at x 1190 fell from',
            '70.3 to 44.7, floor level; the fill is floor from x 44 left, whose own peaks there are 56-67.',
        ],
    },
    'proof-b-foreground-bar-man': {
        'box': (1590, 270, 1850, 820),
        'lead': 'DEFECT B -- THE FOREGROUND BAR MAN',
        'lines': [
            'REJECTED: a ring of his OLD surroundings -- bar panelling, kick-board, dark floor -- travelled',
            'with him when he was composited 82 rows down, and sits around his legs and boots as a dark',
            'wooden halo on the dirt. Its cause is in nugget-bar-recompose.py: the matte takes everything',
            'inside a GENEROUS 42-point bound as certainly him, and that bound is 25-30px wider than he is.',
            'REPAIRED: a restore, not a rematte. Inside a traced silhouette the plate is untouched; outside',
            'it the already-reconstructed rebuild-04/plate-room-03-empty.png comes back, which is the clean',
            'room built for this exact geometry. His 64,777 human pixels hash identically before and after.',
            'The two authored contact shadows are re-laid on the clean dirt at their original centres.',
        ],
    },
}
GAMMA = 0.40


def lift(img):
    a = np.asarray(img).astype(float)
    return Image.fromarray(np.clip((a / 255.0) ** GAMMA * 255, 0, 255).astype('uint8'))


def pair(a, b, box, title, scale):
    ca, cb = a.crop(box), b.crop(box)
    if scale != 1:
        ca = ca.resize((ca.width * scale, ca.height * scale), Image.NEAREST)
        cb = cb.resize((cb.width * scale, cb.height * scale), Image.NEAREST)
    out = Image.new('RGB', (ca.width * 2 + 16, ca.height + 30), (16, 16, 18))
    out.paste(ca, (0, 30))
    out.paste(cb, (ca.width + 16, 30))
    d = ImageDraw.Draw(out)
    d.text((2, 4), f'{title} -- REJECTED', fill=(230, 150, 140))
    d.text((ca.width + 18, 4), f'{title} -- REPAIRED', fill=(150, 220, 160))
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    a = Image.open(OLD).convert('RGB')
    b = Image.open(NEW).convert('RGB')
    la, lb = lift(a), lift(b)

    for name, spec in PROOFS.items():
        box = spec['box']
        blocks = [
            pair(a, b, box, '1:1 as it ships', 1),
            pair(la, lb, box, '1:1 lifted', 1),
            pair(la, lb, box, '3x  lifted', 3),
        ]
        head = 26 + 15 * len(spec['lines'])
        width = max(max(x.width for x in blocks), 980)
        sheet = Image.new('RGB', (width, head + sum(x.height + 10 for x in blocks) + 8), (16, 16, 18))
        d = ImageDraw.Draw(sheet)
        d.text((8, 6), spec['lead'], fill=(240, 232, 210))
        for i, line in enumerate(spec['lines']):
            d.text((8, 24 + i * 15), line, fill=(186, 182, 172))
        y = head
        for blk in blocks:
            sheet.paste(blk, (8, y))
            y += blk.height + 10
        path = OUT / f'{name}.webp'
        sheet.save(path, 'WEBP', quality=92, method=6)
        print(f'wrote {path}  {sheet.width}x{sheet.height}  {path.stat().st_size // 1024}KB')


if __name__ == '__main__':
    main()
