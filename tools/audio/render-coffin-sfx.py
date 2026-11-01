"""
Room 32's one-shots, rendered offline (errata 49: "render stems offline at
build time from the same synthesis path"; live synthesis is kept for F2's
taps only). Doc 45: R32-DIRT ("SFX: dirt on coffin lid"), and errata 70 B's
spade, lid strike and three knocks.

THE AGENT THAT WROTE THIS CANNOT HEAR IT. Errata 49's binding rule: every
claim below is about the waveform, not the sound, and Tyler auditions all of
it before Room 32 ships. What was aimed for:

  close  -- inside a pine box: a hollow wooden thump (the lid ringing at its
            low modes) under a scatter of grit, all muffled by the box.
  earth  -- later shovelfuls landing on earth, not wood: a dull pat, no ring.
  spade  -- a blade cutting into packed earth, far and then near.
  lid    -- the spade meeting the lid: a hard wooden knock with an edge.
  knock  -- a knuckle on the lid. Three are played, a beat apart.

Deterministic: seeded, so a re-render is the same bytes.
    python3 tools/audio/render-coffin-sfx.py
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 44100
OUT = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'
rng = np.random.default_rng(32)


def t(seconds):
    return np.arange(int(seconds * RATE)) / RATE


def lowpass(x, hz, order=4):
    return sosfilt(butter(order, hz, 'low', fs=RATE, output='sos'), x)


def bandpass(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], 'band', fs=RATE, output='sos'), x)


def env(n, attack, decay):
    k = np.arange(n) / RATE
    a = np.minimum(1, k / max(attack, 1e-4))
    return a * np.exp(-k / decay)


def wood(seconds, modes, decay, strike=0.004):
    """Decaying low modes of a pine board, struck."""
    x = t(seconds)
    out = np.zeros_like(x)
    for freq, amp in modes:
        detune = 1 + rng.uniform(-0.02, 0.02)
        out += amp * np.sin(2 * np.pi * freq * detune * x) * np.exp(-x / (decay * rng.uniform(0.85, 1.15)))
    click = lowpass(rng.normal(0, 1, len(x)), 1800) * env(len(x), 0.0005, strike)
    return out + 0.6 * click


def grit(seconds, density, lo, hi, decay):
    """A scatter of small grains: soil and stones landing over a spread of time."""
    n = int(seconds * RATE)
    out = np.zeros(n)
    count = int(density * seconds)
    for _ in range(count):
        at = int(abs(rng.normal(0.06, decay)) * RATE)
        if at >= n - 600:
            continue
        size = rng.integers(80, 500)
        grain = rng.normal(0, 1, size) * np.exp(-np.arange(size) / (size / 4))
        out[at:at + size] += grain * rng.uniform(0.2, 1.0) * np.exp(-at / RATE / (decay * 2))
    return bandpass(out, lo, hi)


def finish(x, peak=0.9, fade=0.02):
    x = x - np.mean(x)
    tail = int(fade * RATE)
    x[-tail:] *= np.linspace(1, 0, tail)
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def save(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(OUT / name), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(data.tobytes())


# Shovelfuls on the lid, heard from inside the box: boomy, muffled.
for index in range(1, 5):
    seconds = 1.6
    body = wood(seconds, [(92, 1.0), (176, 0.55), (251, 0.35), (418, 0.12)], decay=0.22)
    body *= rng.uniform(0.8, 1.0)
    scatter = grit(seconds, density=900, lo=300, hi=3200, decay=0.18) * 0.5
    mix = lowpass(body + scatter, 2400)
    save(f'r32-dirt-close-{index}.wav', finish(mix))

# Later shovelfuls, landing on earth already on the lid: a pat, no ring.
for index in range(1, 4):
    seconds = 1.2
    thud = lowpass(rng.normal(0, 1, int(seconds * RATE)), 260) * env(int(seconds * RATE), 0.004, 0.09)
    scatter = grit(seconds, density=500, lo=200, hi=1400, decay=0.12) * 0.25
    save(f'r32-dirt-earth-{index}.wav', finish(lowpass(thud + scatter, 900), peak=0.7))

# A spade cutting packed earth: a crunch with a short scrape.
def spade(distance):
    seconds = 0.9
    n = int(seconds * RATE)
    crunch = bandpass(rng.normal(0, 1, n), 400, 2600) * env(n, 0.006, 0.12)
    scrape = bandpass(rng.normal(0, 1, n), 1800, 5200) * env(n, 0.05, 0.08) * 0.4
    mix = crunch + scrape
    return lowpass(mix, 1500 if distance == 'far' else 3200)

save('r32-spade-far.wav', finish(spade('far'), peak=0.45))
save('r32-spade-near.wav', finish(spade('near'), peak=0.8))

# The spade meets the lid: wood, struck hard, with an edge on it.
lid = wood(1.0, [(118, 1.0), (233, 0.6), (402, 0.3), (1150, 0.15)], decay=0.12, strike=0.01)
lid += 0.25 * bandpass(rng.normal(0, 1, len(lid)), 2500, 6000) * env(len(lid), 0.0005, 0.01)
save('r32-spade-lid.wav', finish(lowpass(lid, 4200)))

# A knuckle on the lid, from outside: short, clean, the lid's first mode.
knock = wood(0.45, [(140, 1.0), (285, 0.45), (610, 0.15)], decay=0.05, strike=0.002)
save('r32-knock.wav', finish(lowpass(knock, 3000), peak=0.85))

print('rendered', sorted(p.name for p in OUT.glob('r32-*.wav')))
