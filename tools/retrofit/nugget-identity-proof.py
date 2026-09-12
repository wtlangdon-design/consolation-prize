#!/usr/bin/env python3
"""
THE ROOM 3 INTERACTION-IDENTITY REVIEW SHEET, and the measurements under it.

Reads the captures `tools/gauntlet/life.mjs` took for the
`nugget-interaction-identities` route and answers the four questions Tyler's
ruling asks of each of the two painted speaking characters:

  1  TALK TO resolves over the painted man        -- the sentence line reads his name
  2  his canonical tree opens                     -- the option list, and its gate
  3  the first speech is anchored over his head   -- measured, not eyeballed
  4  no duplicate art at any point                -- his painted box, pixel for pixel

THE NO-DUPLICATE TEST IS NOT n01-vs-n09. Thad walks across the room between
them, so a whole-frame difference is mostly the protagonist and proves nothing.
Each man's painted box is compared in a frame where Thad is at the OTHER end of
the room, which is the comparison that isolates what this pass changed.

    python3 tools/retrofit/nugget-identity-proof.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
CAPS = ROOT / 'renders/proofs/nugget-candidate/life/raw-captures-ignored'
OUT = ROOT / 'proofs/room-03/interaction-identities'

# id -> (painted box, ambient x, painted head top, zone height, the frame in
# which Thad is demonstrably somewhere else)
WHO = {
    'THE CARD SHARP (card_2)': ((800, 250, 910, 430), 855, 250, 263, 'n07-one-strike-released'),
    'THE ONE-STRIKE MAN (bar_1)': ((1195, 262, 1350, 605), 1272, 262, 263, 'n04-card-sharp-released'),
}
GAMMA = 0.5


def cap(name):
    return Image.open(CAPS / f'{name}.png').convert('RGB')


def lift(img, gamma=GAMMA):
    a = np.asarray(img).astype(float)
    return Image.fromarray(np.clip((a / 255.0) ** gamma * 255, 0, 255).astype('uint8'))


def band(img, title, scale=1):
    if scale != 1:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.NEAREST)
    out = Image.new('RGB', (img.width, img.height + 26), (16, 16, 18))
    out.paste(img, (0, 26))
    ImageDraw.Draw(out).text((6, 8), title, fill=(235, 225, 200))
    return out


def ink_rows(frame, base):
    """Rows carrying speech ink: bright, and absent from the quiet room."""
    a = np.asarray(frame).astype(int)[:864]
    b = np.asarray(base).astype(int)[:864]
    mark = (np.abs(a - b).max(axis=2) > 60) & (a.mean(2) > 170)
    rows = np.nonzero(mark.any(axis=1))[0]
    cols = np.nonzero(mark.any(axis=0))[0]
    return (rows.min(), rows.max(), cols.min(), cols.max()) if len(rows) else None


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    base = cap('n01-room-entered')

    print('SPEECH ANCHOR -- measured against each painted head top\n')
    for who, (box, x, head, zone, _) in WHO.items():
        name = ('n03c-card-sharp-reply-anchored' if 'CARD' in who else 'n06-one-strike-speaks')
        r0, r1, c0, c1 = ink_rows(cap(name), base)
        print(f'  {who}')
        print(f'    ambient anchor ({x}, {head + zone}), zone {zone} -> speakerHead y {head}')
        print(f'    speech ink rows {r0}-{r1}, centred x {(c0 + c1) // 2} (his x is {x})')
        print(f'    the block\'s foot sits {head - r1}px CLEAR ABOVE his painted head top')

    print('\nNO DUPLICATE ART -- each painted box, in a frame where Thad is elsewhere\n')
    for who, (box, x, head, zone, elsewhere) in WHO.items():
        x0, y0, x1, y1 = box
        a = np.asarray(base.crop(box)).astype(int)
        b = np.asarray(cap(elsewhere).crop(box)).astype(int)
        d = np.abs(a - b).max(axis=2)
        print(f'  {who}: n01 vs {elsewhere}')
        print(f'    identical {(d == 0).mean() * 100:.4f}%   max difference {d.max()}   '
              f'pixels differing {(d > 0).sum()}')

    panels = [
        band(lift(base).resize((960, 540)), 'n01  the room as a player meets it -- nine painted men'),
        band(lift(cap('n02-card-sharp-list')).resize((960, 540)),
             'n02  TALK TO resolves: the sentence line reads THE CARD SHARP. Three options -- the follow-up is gated.'),
        band(lift(cap('n03c-card-sharp-reply-anchored')).resize((960, 540)),
             'n03c  his reply, anchored 51px above his painted head'),
        band(lift(cap('n05-one-strike-list')).resize((960, 540)),
             'n05  TALK TO resolves: THE ONE-STRIKE MAN. Four options.'),
        band(lift(cap('n06-one-strike-speaks')).resize((960, 540)),
             'n06  "Forty-nine." anchored 51px above his painted head'),
        band(lift(cap('n08-patrons-group-intact')).resize((960, 540)),
             'n08  LOOK AT the patrons still answers with the group line -- neither identity stole it'),
        band(lift(cap('n09-final')).resize((960, 540)),
             'n09  after both conversations: no ghost, no duplicate, no residue'),
    ]
    width = max(p.width for p in panels)
    sheet = Image.new('RGB', (width, sum(p.height + 8 for p in panels)), (16, 16, 18))
    y = 0
    for p in panels:
        sheet.paste(p, (0, y))
        y += p.height + 8
    path = OUT / 'contact-sheet.webp'
    sheet.save(path, 'WEBP', quality=86, method=6)
    print(f'\nwrote {path}  {sheet.width}x{sheet.height}  {path.stat().st_size // 1024}KB')


if __name__ == '__main__':
    main()
