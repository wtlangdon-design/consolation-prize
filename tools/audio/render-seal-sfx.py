"""
THE COUNTY SEAL, rendered offline. Doc 48 S6 beat 3: "The county seal comes
down. One stamp. It is the loudest sound in the game and the score rests under
it." Tyler delegated the one-shot ruling (2026-11-06, errata 99 P): it is a
rendered one-shot, played over a two-second rest in the score.

THE AGENT THAT WROTE THIS CANNOT HEAR IT (errata 49's rule). What was aimed for:
an iron seal driven down through paper onto a hardwood counter by a man who has
waited his whole career to do it -- a low, heavy thump with the bite of the iron
at the front and the counter's short wooden ring under it, then the room.

Writes audio/sfx/county-seal.wav. Deterministic: seeded.
    python3 tools/audio/render-seal-sfx.py
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 44100
ROOT = Path(__file__).resolve().parents[2]
rng = np.random.default_rng(48)


def lowpass(x, hz, order=4):
    return sosfilt(butter(order, hz, 'low', fs=RATE, output='sos'), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=RATE, output='sos'), x)


def main():
    seconds = 2.2
    t = np.arange(int(seconds * RATE)) / RATE
    # The body: a low thump that drops in pitch as the counter takes the blow.
    pitch = 62 + 40 * np.exp(-t / 0.03)
    phase = 2 * np.pi * np.cumsum(pitch) / RATE
    body = np.sin(phase) * np.exp(-t / 0.16)
    # The iron's bite: a very short bright click at the front.
    bite = bandpass(rng.normal(0, 1, len(t)), 1800, 6500) * np.exp(-t / 0.006)
    # The counter's wooden ring: two damped modes.
    wood = (0.5 * np.sin(2 * np.pi * 210 * t) + 0.3 * np.sin(2 * np.pi * 347 * t)) * np.exp(-t / 0.07)
    # The room: diffuse, low-passed noise decaying over a second and a half.
    room = lowpass(rng.normal(0, 1, len(t)), 1400) * np.exp(-t / 0.45) * 0.08
    room[: int(0.012 * RATE)] *= np.linspace(0, 1, int(0.012 * RATE))
    out = 1.0 * body + 0.55 * bite + 0.35 * wood + room
    out[: 40] *= np.linspace(0, 1, 40)
    out = out / np.max(np.abs(out)) * 0.95          # the loudest sound in the game
    data = (np.clip(out, -1, 1) * 32767).astype('<i2')
    path = ROOT / 'audio' / 'sfx' / 'county-seal.wav'
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(data.tobytes())
    print(path.relative_to(ROOT), round(len(t) / RATE, 2), 's')


if __name__ == '__main__':
    main()
