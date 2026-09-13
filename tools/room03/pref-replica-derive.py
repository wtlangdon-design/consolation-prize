#!/usr/bin/env python3
"""
DERIVE THE 1920x864 REPLICA CANDIDATE, AND BUILD THE FIVE OWNER PROOFS.

Zero image operations. The endpoint's widest size is 3:2 and the play area is
2.22:1, so a band of the 1536x1024 source has to be chosen. That choice is a
real decision and it is recorded here rather than buried in a magic number.

HOW THE BAND WAS CHOSEN, and the measurement that decided it. A band is ONE
number, and the replica's landmarks do not agree about what it should be. Each
was measured in the source and asked where it would have to sit for the band to
put it where R3-PREF has it:

    card table, top rim    source y 394   wants band y0 = 133
    bar counter, far end   source y 401   wants band y0 = 108
    chandelier             source y  36   wants band y0 =  21
    brass spittoon         source y 906   wants band y0 = 301

THE SPREAD IS THE FINDING, and it is stated rather than smoothed over: the
replica draws this room's furniture smaller and further back than R3-PREF does,
so no single band reproduces R3-PREF's framing. A normalised cross-correlation
over the whole room preferred y204, which is a compromise that puts nothing
where it belongs.

y120 is chosen because the two landmarks that agree are the two that matter --
the card table and the bar, 25 rows apart -- and they are the room's subject.
The chandelier and the spittoon are lost from the BAND, not from the ART: both
are drawn, at source y36 and y906, and either can be extracted as a prop later
with no image operation, the way Room 5's hanging lamp was.

    python3 tools/room03/pref-replica-derive.py
"""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/pref-replica-02/source.png'
PREF = ROOT / 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png'
THAD = ROOT / 'art/actors/thad-stand-front/stand-00.png'
OUT = ROOT / 'art/staging/room-03/pref-replica-02'
PROOF = ROOT / 'proofs/room-03/pref-replica'

BAND = dict(x=32, y=120, w=1472, h=662)     # 1472/662 = 2.2236, target 2.2222
EYE, K = 239.0, 0.8494

# Where Thad will actually walk, read off the blocking guide. Proof only.
THAD_AT = [(300, 800, 'foreground left'), (700, 700, 'near the card table'),
           (1080, 620, 'stove approach'), (1450, 700, 'at the bar'),
           (250, 560, 'the doors')]


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def plate():
    src = Image.open(SRC).convert('RGB')
    b = BAND
    return src.crop((b['x'], b['y'], b['x'] + b['w'], b['y'] + b['h'])) \
              .resize((1920, 864), Image.LANCZOS)


def main():
    PROOF.mkdir(parents=True, exist_ok=True)
    cand = plate()
    out = OUT / 'candidate-1920x864.png'
    cand.save(out)

    pref = Image.open(PREF).convert('RGB')

    # A + B: the two rooms at one presentation scale, stacked, labelled
    S = (1440, 648)
    ab = Image.new('RGB', (1440, 648 * 2 + 8), (140, 20, 20))
    ab.paste(pref.resize(S, Image.LANCZOS), (0, 0))
    ab.paste(cand.resize(S, Image.LANCZOS), (0, 656))
    ab.save(PROOF / 'A-B-r3pref-over-replica.png')

    # C: the bar, both rooms, with the stove-side terminus and the foreground
    bar = (1100, 180, 1920, 864)
    cw, ch = bar[2] - bar[0], bar[3] - bar[1]
    c = Image.new('RGB', (cw, ch * 2 + 8), (140, 20, 20))
    c.paste(pref.crop(bar), (0, 0))
    c.paste(cand.crop(bar), (0, ch + 8))
    c.resize((cw * 3 // 4, (ch * 2 + 8) * 3 // 4), Image.LANCZOS).save(PROOF / 'C-bar.png')

    # D: the card area, both rooms
    card = (560, 300, 1240, 800)
    cw, ch = card[2] - card[0], card[3] - card[1]
    d = Image.new('RGB', (cw, ch * 2 + 8), (140, 20, 20))
    d.paste(pref.crop(card), (0, 0))
    d.paste(cand.crop(card), (0, ch + 8))
    d.save(PROOF / 'D-card.png')

    # E: Thad at the sizes the camera gives him. PROOF ONLY -- not the plate.
    guide = cand.copy()
    thad = Image.open(THAD).convert('RGBA')
    g = ImageDraw.Draw(guide, 'RGBA')
    placed = []
    for x, y, where in THAD_AT:
        h = K * (y - EYE)
        t = thad.resize((max(1, round(thad.width * h / thad.height)), round(h)), Image.LANCZOS)
        guide.paste(t, (round(x - t.width / 2), round(y - t.height)), t)
        g.text((x - 40, y + 6), f'{where}  {h:.0f}px', fill=(255, 255, 255, 235))
        placed.append({'at': [x, y], 'where': where, 'drawnHeight': round(h, 1)})
    guide.save(PROOF / 'E-thad-scale.png')

    rec = {
        'schema': 1,
        'note': 'The R3-PREF people-free replica candidate. CANDIDATE ONLY -- not promoted, '
                'not referenced by any room JSON, not deployed. R3-PREF remains shipping.',
        'source': {'path': str(SRC.relative_to(ROOT)), 'sha256': sha(SRC), 'size': [1536, 1024],
                   'ledger': 'room-03-pref-replica-plate attempt 2'},
        'blueprint': {'path': str(PREF.relative_to(ROOT)), 'sha256': sha(PREF)},
        'band': BAND,
        'bandWhy': ('the card table and the bar agree on it within 25 rows and they are the '
                    "room's subject; the chandelier (source y36) and the spittoon (source y906) "
                    'fall outside it and are extractable as props later with no image operation'),
        'landmarkBands': {'cardTableTop': 133, 'barFarEnd': 108, 'chandelier': 21, 'spittoon': 301},
        'resample': {'algorithm': 'lanczos3', 'from': [BAND['w'], BAND['h']], 'to': [1920, 864]},
        'derived': {'path': str(out.relative_to(ROOT)), 'sha256': sha(out), 'size': [1920, 864]},
        'thadProof': placed,
        'proofs': [str(p.relative_to(ROOT)) for p in sorted(PROOF.glob('[A-E]*.png'))],
    }
    (OUT / 'derivation.json').write_text(json.dumps(rec, indent=1) + '\n')
    print(f'wrote {out}  sha {rec["derived"]["sha256"][:12]}')
    for p in rec['proofs']:
        print(f'wrote {p}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
