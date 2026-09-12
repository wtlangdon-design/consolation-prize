#!/usr/bin/env python3
"""
THE TWO INTERACTION-IDENTITY FRAMES. Zero alpha everywhere, no generation.

Tyler's OWNER ARCHITECTURE RULING (Option A): the seven furniture-dependent
Nugget patrons stay painted into the plate, and only the two canonical speaking
characters get an interaction identity over their painted representations.

WHY A TRANSPARENT FRAME AND NOT A HOTSPOT. `Interactable` carries no `tree`
field; a dialogue tree opens only from `AmbientFile.tree`. So a speaking
character must be an AmbientFile -- but an AmbientFile is an interaction
identity, not a promise of art. Everything the engine wants from one is data,
and the one thing that touches a sprite, `Ambient.npcAt`, reads the frame's
HEIGHT and never its content:

    height = npc.sprite?.frames?.[0]?.[3] ?? heightForZone(npc.zone)
    half   = height * 0.2

So a frame at the painted man's own dimensions gives a person-sized TALK TO
target and draws nothing at all over the painting.

WHY NOT NO SPRITE AT ALL. An ambient with no `sprite` draws the graybox
outline (Renderer.drawAmbient) -- deliberately, because that is what a content
gap should look like. The transparent frame is the declaration that this
character is painted ON PURPOSE.

WHY TWO ASSETS AND NOT ONE SHARED. The frame's height sets the hit box and its
width is the painted man's own, so a single shared asset would give one of them
somebody else's bounds. Correctness over deduplication, per the ruling.

    python3 tools/retrofit/nugget-identity-frames.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/actors'

# width  = the painted man's own box width, from the room's declared population
# height = the zone height his speech anchor uses, so the hit box spans exactly
#          from his painted head top down to his anchor row
FRAMES = {
    'nugget-card-sharp-identity': (110, 263,
                                   'card_2, painted box x 800-910 y 250-430'),
    'nugget-one-strike-identity': (155, 263,
                                   'bar_1, painted box x 1195-1350 y 262-605'),
}


def main() -> None:
    for name, (w, h, who) in FRAMES.items():
        path = OUT / f'{name}.png'
        Image.fromarray(np.zeros((h, w, 4), dtype='uint8'), 'RGBA').save(path)
        check = np.asarray(Image.open(path).convert('RGBA'))
        assert check.shape == (h, w, 4), check.shape
        assert check[:, :, 3].max() == 0, 'alpha is not zero everywhere'
        print(f'{path.relative_to(ROOT)}  {w}x{h}  alpha max {check[:, :, 3].max()}  -- {who}')


if __name__ == '__main__':
    main()
