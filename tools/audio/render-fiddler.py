"""
The fiddler notices (doc 07 #11 R_TRUTH; doc 06; errata 116). Run after
render-music.mjs has written the three far-off fiddler stems.

    python3 tools/audio/render-fiddler.py

  fiddler-retunes.wav   R33-FIDDLER: "In F2, twenty seconds into the tuning
                        arc, he stops mid-phrase, tunes his A, and continues."
                        The phrase broken off; a beat; his A string bowed flat
                        and drawn up the 35 cents as the peg turns; a beat; the
                        phrase again, in tune. All of it far off, as from the
                        Nugget, and none of it on the music bus -- so it is in
                        tune while the score, at twenty seconds, is not.

The notes are CONSOLATION's own; the only thing made here is the peg turning
and the A being drawn up to pitch. Deterministic.
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 44100
SFX = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'


def n_of(s):
    return int(round(s * RATE))


def load(name):
    with wave.open(str(SFX / name)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, w.getnchannels()) / 32767
    return x.mean(axis=1)


def save(name, x, peak):
    x = x / (np.abs(x).max() + 1e-9) * peak
    with wave.open(str(SFX / name), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
    print(f'{name:24s} {len(x) / RATE:5.2f}s')


def drawn_up(x, start, length, cents=35.0):
    """The string drawn up to pitch: from `start` seconds the playback rate
    rises smoothly over `length` seconds until the note sounds `cents` higher."""
    t = np.arange(len(x)) / RATE
    shape = np.clip((t - start) / length, 0, 1)
    shape = shape * shape * (3 - 2 * shape)
    rate = 2 ** (cents * shape / 1200)
    position = np.cumsum(rate) - rate[0]
    keep = position < len(x) - 1
    return np.interp(position[keep], np.arange(len(x)), x)


def peg(rnd):
    """The peg turning in the scroll: a few small wooden catches."""
    n = n_of(0.7)
    out = np.zeros(n)
    phase, rate = 0.0, np.linspace(18, 40, n)
    for i in range(n):
        phase += rate[i] / RATE
        if phase >= 1:
            phase -= 1
            out[i] = rnd.uniform(0.4, 1.0)
    out = sosfilt(butter(2, [900, 3800], 'band', fs=RATE, output='sos'), out)
    return out * np.sin(np.linspace(0, np.pi, n))


def place(dest, src, at, gain=1.0):
    i = n_of(at)
    m = min(len(src), len(dest) - i)
    dest[i:i + m] += gain * src[:m]


if __name__ == '__main__':
    rnd = np.random.default_rng(1151)
    broken = load('fiddler-broken-off-far.wav')
    a = drawn_up(load('fiddler-open-a-far.wav'), start=0.9, length=1.4)
    again = load('fiddler-phrase-far-tuned.wav')
    p = peg(rnd)
    p = sosfilt(butter(2, 1500, 'low', fs=RATE, output='sos'), p)  # far off, like the rest
    cut = n_of(1.55)                       # he stops mid-phrase
    broken = broken[:cut] * np.concatenate([np.ones(cut - n_of(0.06)), np.linspace(1, 0, n_of(0.06))])
    x = np.zeros(cut + n_of(0.5) + len(a) + n_of(0.6) + len(again))
    place(x, broken, 0.0)
    a_at = 1.55 + 0.5
    place(x, a, a_at, 0.9)
    place(x, p / (np.abs(p).max() + 1e-9) * np.abs(a).max(), a_at + 0.85, 0.35)
    place(x, again, a_at + len(a) / RATE + 0.6)
    save('fiddler-retunes.wav', x, 0.7)
