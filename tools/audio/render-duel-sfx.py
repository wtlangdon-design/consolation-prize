"""THE STREET ERUPTS (doc 03, Duel Four; errata 131 E).

    crowd-erupts.wav   F4-ERUPTS: the town's roar on Sowerby's verdict, cut and
                       shaped from the approved Nugget crowd (R03-A), no new voice

Nothing is synthesized here. The Nugget's crowd (tools/audio/render-room-sfx.py,
approved by ear, errata 102 and 122) is the only crowd the game has. Three
windows of it are laid over one another, so seven voices become twenty-one, and
shaped as a swell: up in a third of a second, held, and dying away over four.

    python3 tools/audio/render-duel-sfx.py
"""
import wave
from pathlib import Path

import numpy as np

RATE = 44100
OUT = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'


def n_of(seconds):
    return int(round(seconds * RATE))


def load(name):
    with wave.open(str(OUT / name)) as src:
        assert src.getframerate() == RATE and src.getnchannels() == 1
        return np.frombuffer(src.readframes(src.getnframes()), dtype='<i2') / 32767


def save(name, x):
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(OUT / name), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(data.tobytes())
    print(f'{name:24s} {len(x) / RATE:5.2f}s')


def crowd_erupts():
    crowd = load('nugget-crowd.wav')
    d = 6.0
    n = n_of(d)
    x = np.zeros(n)
    for start in (1.0, 7.3, 13.1):
        i = n_of(start)
        x += crowd[i:i + n]
    t = np.arange(n) / RATE
    attack, hold, decay = 0.3, 1.4, 4.3
    shape = np.where(t < attack, t / attack,
                     np.where(t < attack + hold, 1.0, np.clip(1 - (t - attack - hold) / decay, 0, 1) ** 1.5))
    x = x * shape
    x = x - np.mean(x)
    return x / (np.max(np.abs(x)) + 1e-9) * 0.95


if __name__ == '__main__':
    save('crowd-erupts.wav', crowd_erupts())
