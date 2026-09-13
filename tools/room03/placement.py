#!/usr/bin/env python3
"""
WHERE THE TWO ACCEPTED CLUSTERS STAND IN THE ROOM.

The shell is generated LAST and around FIXED cluster geometry, so the geometry
has to be fixed first -- and fixed by measurement, not by the box the staging
guide was drawn into. The masters have their own internal perspective and it is
stronger than the room camera's; each cluster is therefore placed so that ITS
MOST PROMINENT FIGURE is exactly the size the camera says a man is on that row,
and the deviation on the others is measured and stated rather than hidden.

  scale s and vertical offset oy solve together, because a figure's row depends
  on the offset and the offset depends on the row:

      h(row) = k (row - EYE) = H s          the camera and the art must agree
      row    = oy + Y s                     where Y is his row in the master

  which gives oy directly once s is chosen, and s is chosen so the cluster
  occupies the span the blocking asks for.

    python3 tools/room03/placement.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'proofs/room-03/clean-sheet'
BLOCK = json.loads((OUT / 'blocking.json').read_text())
EYE, K = BLOCK['camera']['eyeLevelY'], BLOCK['camera']['k']
SEATED = 0.78


def h(y):
    return K * (y - EYE)


# MEASURED OFF EACH MASTER, at 1:1 with a grid.
CLUSTERS = {
    'card': {
        'master': [1536, 1024], 'scale': 0.42,
        'anchorOn': 'card_1', 'anchorKind': 'seated',
        'crownY': 272, 'footY': 893,
        'alignX': {'masterX': 718, 'roomX': 700, 'what': 'the table centre'},
        'artBox': [124, 80, 1411, 989],
        'others': {'card_2': ('seated', 87, 443, 'far left -- THE CARD SHARP'),
                   'card_3': ('seated', 80, 445, 'far right'),
                   'card_4': ('seated', 284, 989, 'near right')},
    },
    'bar': {
        'master': [1024, 1024], 'scale': 0.667,
        'anchorOn': 'bar_3', 'anchorKind': 'standing',
        'crownY': 215, 'footY': 940,
        'alignX': {'masterX': 1010, 'roomX': 1900, 'what': "the counter's near end"},
        'artBox': [21, 20, 1023, 977],
        'others': {'bar_2': ('standing', 258, 730, 'leaning, middle'),
                   'bar_1': ('seated', 286, 545, 'seated at the far end')},
    },
}


def solve(spec):
    s = spec['scale']
    span = (spec['footY'] - spec['crownY']) * s
    frac = SEATED if spec['anchorKind'] == 'seated' else 1.0
    # frac * k * (oy + footY*s - EYE) = span
    oy = (span / (frac * K)) + EYE - spec['footY'] * s
    ox = spec['alignX']['roomX'] - spec['alignX']['masterX'] * s
    return s, ox, oy


def main():
    out = {}
    for name, spec in CLUSTERS.items():
        s, ox, oy = solve(spec)
        w, hgt = spec['master']
        box = [round(ox), round(oy), round(ox + w * s), round(oy + hgt * s)]
        rows = []
        for who, (kind, cy, fy, what) in {
                spec['anchorOn']: (spec['anchorKind'], spec['crownY'], spec['footY'], 'THE ANCHOR'),
                **spec['others']}.items():
            row = oy + fy * s
            drawn = (fy - cy) * s
            frac = SEATED if kind == 'seated' else 1.0
            want = frac * h(row)
            rows.append({'id': who, 'kind': kind, 'floorRow': round(row),
                         'drawn': round(drawn), 'cameraWants': round(want),
                         'errorPct': round((drawn / want - 1) * 100, 1), 'what': what})
        ab = spec['artBox']
        art = [round(ox + ab[0] * s), round(oy + ab[1] * s),
               round(ox + ab[2] * s), round(oy + ab[3] * s)]
        out[name] = {'scale': round(s, 4), 'offset': [round(ox, 1), round(oy, 1)],
                     'roomBox': box, 'artBox': art, 'figures': rows}
        print(f'{name.upper()}  scale {s:.4f}  offset ({ox:.0f}, {oy:.0f})  canvas {box}  ART {art}')
        for r in rows:
            print(f'    {r["id"]:7s} {r["kind"]:8s} row {r["floorRow"]:4d}  drawn {r["drawn"]:4d}  '
                  f'camera {r["cameraWants"]:4d}  {r["errorPct"]:+6.1f}%   {r["what"]}')
    (OUT / 'placement.json').write_text(json.dumps(out, indent=1) + '\n')
    print(f'\nwrote {OUT / "placement.json"}')


if __name__ == '__main__':
    main()
