#!/usr/bin/env python3
"""
THE REPLICA GATE. Read-only; zero image operations.

WHAT A GATE CAN AND CANNOT DECIDE HERE, said plainly because the last time this
project let gates stand in for looking at a room, the room was rejected. Whether
the replica is a good picture is Tyler's call and nothing below touches it.

What these checks CAN prove:
  1  the candidate is exactly 1920x864 RGB with no alpha and no corruption;
  2  the candidate is reproducible from a recorded source and band;
  3  no human figure survives in the seven regions where R3-PREF has one;
  4  the dirt floor is continuous across the foreground;
  5  the ledger holds what it says it holds.

Check 3 is the one worth explaining. There is no face detector here. The test is
that in each patron box the candidate must be materially DIFFERENT from R3-PREF
(a man has gone) and must be materially SIMILAR to the empty floor and furniture
around it (what replaced him is room). A figure that survived would fail the
second half: skin and cloth do not have the room's local statistics.

    python3 tools/room03/pref-replica-gate.py
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CAND = ROOT / 'art/staging/room-03/pref-replica-02/candidate-1920x864.png'
SRC = ROOT / 'art/staging/room-03/pref-replica-02/source.png'
PREF = ROOT / 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png'
DERIV = ROOT / 'art/staging/room-03/pref-replica-02/derivation.json'
ROOM = ROOT / 'content/rooms/nugget-candidate.json'

fails, notes = [], []


def check(ok, line):
    (notes if ok else fails).append(('PASS  ' if ok else 'FAIL  ') + line)


def main():
    im = Image.open(CAND)
    check(im.size == (1920, 864), f'candidate is {im.size[0]}x{im.size[1]} (must be 1920x864)')
    check(im.mode == 'RGB', f'candidate mode is {im.mode} (must be RGB -- a plate has no alpha)')

    a = np.asarray(im.convert('RGB')).astype(float)
    check(a.std() > 8, f'candidate is not flat (std {a.std():.1f})')
    check(not (a.max() == a.min()), 'candidate is not a single colour')

    # reproducible from the recorded source and band
    d = json.loads(DERIV.read_text())
    b = d['band']
    src = Image.open(SRC).convert('RGB')
    again = src.crop((b['x'], b['y'], b['x'] + b['w'], b['y'] + b['h'])).resize((1920, 864), Image.LANCZOS)
    same = hashlib.sha256(np.asarray(again).tobytes()).hexdigest() == \
        hashlib.sha256(np.asarray(im.convert('RGB')).tobytes()).hexdigest()
    check(same, 'candidate reproduces exactly from the recorded source and band')
    check(hashlib.sha256(SRC.read_bytes()).hexdigest() == d['source']['sha256'],
          'the recorded source hash still matches the file')

    # nobody left where R3-PREF has somebody
    ref = np.asarray(Image.open(PREF).convert('RGB')).astype(float)
    people = [p for p in json.loads(ROOM.read_text())['population']['people']
              if p['kind'] in ('baked', 'voice')]
    print('\nPEOPLE-FREE, box by box  (gone = differs from R3-PREF; room = matches its surroundings)')
    for p in people:
        x, y, w, h = p['box']
        box = a[y:y + h, x:x + w]
        ring = np.concatenate([
            a[max(0, y - 40):y, x:x + w].reshape(-1, 3),
            a[y + h:min(864, y + h + 40), x:x + w].reshape(-1, 3),
            a[y:y + h, max(0, x - 40):x].reshape(-1, 3),
            a[y:y + h, x + w:min(1920, x + w + 40)].reshape(-1, 3)])
        gone = float(np.abs(box - ref[y:y + h, x:x + w]).mean())
        # how far the box's colour statistics sit from the room immediately round it
        dm = float(np.abs(box.reshape(-1, 3).mean(0) - ring.mean(0)).mean())
        ok = gone > 8.0 and dm < 22.0
        print(f'  {p["id"]:<8} gone {gone:6.2f}   colour distance from surrounding room {dm:5.2f}'
              f'   {"ok" if ok else "LOOK AT THIS"}')
        check(ok, f'{p["id"]}: no figure survives in his box')

    # the floor runs unbroken across the walkable foreground
    strip = a[700:860, 120:1400]
    lum = strip[..., 0] * .299 + strip[..., 1] * .587 + strip[..., 2] * .114
    warm = strip[..., 0] - strip[..., 2]
    check(lum.std() < 26, f'foreground floor is one continuous material (luminance std {lum.std():.1f})')
    check(warm.mean() > 8, f'foreground floor is warm dirt, not grey boards (R-B {warm.mean():.1f})')

    # the ledger says what it says
    caps = json.loads((ROOT / 'art/staging/caps.json').read_text())
    rows = json.loads((ROOT / 'art/staging/ledger.json').read_text())['attempts']
    mine = [r for r in rows if r.get('assetId') == 'room-03-pref-replica-plate']
    cap = caps['perAsset']['room-03-pref-replica-plate']['attempts']
    check(len(mine) <= cap, f'replica operations {len(mine)} of {cap}')
    check(len(rows) == 55, f'ledger holds {len(rows)} rows (53 before this phase + 2)')

    print()
    for line in notes:
        print('  ' + line)
    for line in fails:
        print('  ' + line)
    print(f'\n{len(notes)} passed, {len(fails)} failed')
    return 1 if fails else 0


if __name__ == '__main__':
    raise SystemExit(main())
