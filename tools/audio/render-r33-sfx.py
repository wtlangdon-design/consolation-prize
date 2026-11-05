"""
Room 33's one-shots, rendered offline. Doc 45: R33-TAP ("SFX synthesis: solid-rock
high damped knock <-> void low long-tail response, with continuous spatial
gradient"), R33-VOID ("correct low void response and long tail"), and doc 48 S5
beat 1's fork ("One strike: A, 440"; doc 28 Part Six: "a clean A440, and it must
be *actually* 440Hz while everything else is flat").

THE GRADIENT IS RENDERED, NOT SYNTHESISED LIVE (errata 99 H). Errata 49 kept live
synthesis for the taps; doc 45's own requirement is a continuous gradient whose
tail the ripple matches exactly. Sixteen steps between solid rock and the void's
edge, each written with its measured tail, give the engine a tail it can draw to
the frame and a sound it can play through the same path as every other one-shot.
Step 0 is the rock far from the void; step 15 is the rock at the void's edge.

THE AGENT THAT WROTE THIS CANNOT HEAR IT. Errata 49's rule: every claim here is
about the waveform, and Tyler judges the sound by ear (doc 57 F2: "The tap curve,
the void's position and its radius are tuning for the builder, judged by Tyler's
ear"). What was aimed for:

  tap    -- a knuckle of steel on rock. Far: a dull, high, damped knock that is
            over at once. Near: lower, and a tail that rings on longer.
  void   -- lower still, hollow, and a long tail: a room down there.
  fork   -- a pure A440, struck, ringing down to nothing.

Writes audio/sfx/r33-tap-NN.wav, r33-void.wav, r33-fork.wav and
content/audio/r33-taps.json (each tap's file and tail, in seconds -- the ripple's
duration). Deterministic: seeded, so a re-render is the same bytes.
    python3 tools/audio/render-r33-sfx.py
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 44100
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'audio' / 'sfx'
rng = np.random.default_rng(33)
STEPS = 16
FLOOR = 10 ** (-48 / 20)    # the tail ends where the envelope falls 48 dB under the strike


def t(seconds):
    return np.arange(int(seconds * RATE)) / RATE


def lowpass(x, hz, order=4):
    return sosfilt(butter(order, hz, 'low', fs=RATE, output='sos'), x)


def knock(pitch, decay, body):
    """A strike on stone: a short noise click and two damped modes, `decay` seconds per e-fold."""
    tail = decay * np.log(1 / FLOOR)
    x = t(tail + 0.02)
    modes = [(pitch, 1.0), (pitch * 2.37, 0.45 * body), (pitch * 3.9, 0.18 * body)]
    out = np.zeros_like(x)
    for freq, amp in modes:
        out += amp * np.sin(2 * np.pi * freq * x) * np.exp(-x / (decay * (1.0 if freq == pitch else 0.6)))
    click = lowpass(rng.normal(0, 1, len(x)), 3200) * np.exp(-x / 0.004)
    out = out + 0.5 * click
    return out / np.max(np.abs(out)) * 0.8, tail


def write(path, samples):
    data = (np.clip(samples, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(data.tobytes())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    taps = []
    for step in range(STEPS):
        k = step / (STEPS - 1)
        # Geometric from the rock's dull high knock to the void's edge.
        pitch = 1150 * (260 / 1150) ** k
        decay = 0.03 * (0.42 / 0.03) ** k
        samples, tail = knock(pitch, decay, body=1 - 0.6 * k)
        name = f'r33-tap-{step:02d}.wav'
        write(OUT / name, samples)
        taps.append({'src': f'audio/sfx/{name}', 'tail': round(tail, 3)})
    void, void_tail = knock(150, 0.75, body=0.3)
    write(OUT / 'r33-void.wav', void)
    x = t(5.0)
    fork = np.sin(2 * np.pi * 440.0 * x) * np.exp(-x / 1.4)
    fork += 0.12 * np.sin(2 * np.pi * 440.0 * 6.27 * x) * np.exp(-x / 0.05)     # the strike's bright overtone
    write(OUT / 'r33-fork.wav', fork / np.max(np.abs(fork)) * 0.7)
    record = {'schema': 1,
              'note': 'Room 33\'s taps, rendered by tools/audio/render-r33-sfx.py: step 0 is solid rock, step 15 the '
                      'void\'s edge; `tail` is each one\'s audible length in seconds, which the ripple lasts (doc 45 R33-RIPPLE).',
              'taps': taps,
              'void': {'src': 'audio/sfx/r33-void.wav', 'tail': round(void_tail, 3)},
              'fork': {'src': 'audio/sfx/r33-fork.wav', 'tail': 5.0}}
    (ROOT / 'content' / 'audio').mkdir(parents=True, exist_ok=True)
    (ROOT / 'content' / 'audio' / 'r33-taps.json').write_text(json.dumps(record, indent=1) + '\n')
    print(json.dumps([tap['tail'] for tap in taps]), record['void']['tail'])


if __name__ == '__main__':
    main()
