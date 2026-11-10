"""The final look, section 6: the washout's saturation, by tool (reference/final-look/brief.md). No image operation.

The washout (Room 45) is the most saturated plate in the game. Its daylight is ruled and stays: only its colour is
brought to the level of the two Gulch rooms the brief names, Room 50 (the ledge) and Room 51 (the tents). Measured
as chroma -- each pixel's distance from its own grey, sqrt(sum((RGB - Y)^2)) with Y = .299R + .587G + .114B -- and
as HSV saturation, over the whole plate. Every pixel's chroma is scaled about its own Y by one factor, so its
lightness is untouched and only the colour comes down: the washout's mean chroma lands on the mean of the ledge's
and the tents'. Nothing else changes.

Writes art/backgrounds/room-45-washout.png (from the plate as it was, kept in staging) and
renders/room-45-washout-before-after.png; prints the numbers.
"""
import json, os, shutil

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
PLATE = 'art/backgrounds/room-45-washout.png'
BEFORE = 'art/staging/final-look/washout/before.png'
LIKE = ['art/backgrounds/room-50-ledge.png', 'art/backgrounds/room-51-tents.png']
W = np.array([0.299, 0.587, 0.114])


def measure(a):
    y = a @ W
    chroma = np.sqrt(((a - y[..., None]) ** 2).sum(2))
    sat = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('HSV'))[..., 1].astype(float)
    return {'chroma': round(float(chroma.mean()), 2), 'hsvSaturationPct': round(float(sat.mean() / 2.55), 1),
            'meanLight': round(float(y.mean()), 1)}


def main():
    os.makedirs(os.path.dirname(R(BEFORE)), exist_ok=True)
    if not os.path.exists(R(BEFORE)):
        shutil.copy(R(PLATE), R(BEFORE))
    a = np.asarray(Image.open(R(BEFORE)).convert('RGB')).astype(float)
    like = [measure(np.asarray(Image.open(R(p)).convert('RGB')).astype(float)) for p in LIKE]
    target = sum(m['chroma'] for m in like) / len(like)
    before = measure(a)
    k = target / before['chroma']
    y = (a @ W)[..., None]
    out = np.clip(y + (a - y) * k, 0, 255)
    after = measure(out)
    Image.fromarray(np.round(out).astype(np.uint8)).save(R(PLATE))
    ba = Image.new('RGB', (1920, 864 * 2 + 16), (0, 0, 0))
    ba.paste(Image.fromarray(a.astype(np.uint8)), (0, 0))
    ba.paste(Image.open(R(PLATE)).convert('RGB'), (0, 880))
    ba.save(R('renders/room-45-washout-before-after.png'))
    print(json.dumps({'ledge': like[0], 'tents': like[1], 'target chroma': round(target, 2), 'factor': round(k, 4),
                      'washoutBefore': before, 'washoutAfter': after}, indent=1))


main()
