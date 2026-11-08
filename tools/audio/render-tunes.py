"""
The moments the writing says are HEARD, made audible (errata 109). Run after
render-music.mjs has written sfx/piano-flat.wav and sfx/piano-tuned.wav.

    python3 tools/audio/render-tunes.py

  livery-hum.wav        B2/B3, doc 04 LIV_A1 option 4: "He hums the pitch.
                        Badly. It is recognisably the town theme and
                        recognisably wrong, and Thad's ear files it."
  grievance-whistle.wav B3: Thad strikes the fork, whistles the tune right,
                        and Grievance moves.
  piano-tuning.wav      A2 and A8: the flat C-sharp as the room has always
                        heard it, the fork, the tuning pin turning, and the
                        same notes on the mended piano.

THE TUNE IS CONSOLATION'S FIRST PHRASE, as the music proof writes it
(CONSOLATION_MEL, beats 0-8; WHISTLE_PHRASE in the proof): D F# A F# D, E F# G
F# E, D -- A. Not invented: it is the town theme, which is what the livery man
was trying to hum. The voices are at true pitch, A440 -- the fork's pitch --
and not at the score's -35 cents: a man's whistle is not the score.

A HUM AND A WHISTLE ARE THE TWO HUMAN SOUNDS SYNTHESIS DOES WELL: a closed-
mouth hum is a buzz through the nose (a low formant and little else), and a
whistle is very nearly a pure tone with breath on it. The laugh and the crowd
(errata 106) were the hard ones.

Deterministic.
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 44100
SFX = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'

PHRASE = [(0, 74, 0.5), (0.5, 78, 0.5), (1, 81, 0.5), (1.5, 78, 0.5), (2, 74, 1), (3, 76, 0.5), (3.5, 78, 0.5),
          (4, 79, 0.5), (4.5, 78, 0.5), (5, 76, 1), (6, 74, 1.5), (7.5, 69, 0.5)]


def n_of(s):
    return int(round(s * RATE))


def hz(m, cents=0.0):
    return 440.0 * 2 ** ((m - 69) / 12 + cents / 1200)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=RATE, output='sos'), x)


def lowpass(x, f, order=4):
    return sosfilt(butter(order, f, 'low', fs=RATE, output='sos'), x)


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


def place(dest, src, at, gain=1.0):
    i = n_of(at)
    m = min(len(src), len(dest) - i)
    dest[i:i + m] += gain * src[:m]


def pitch_track(notes, beat, cents_for, glide=0.04):
    """A frequency per sample following the notes, gliding between them as a
    voice does rather than stepping as a keyboard does."""
    end = max(b + d for b, _, d in notes) * beat + 0.4
    f = np.zeros(n_of(end))
    amp = np.zeros_like(f)
    for k, (b, m, d) in enumerate(notes):
        i0, i1 = n_of(b * beat), n_of((b + d) * beat)
        f[i0:i1] = hz(m, cents_for(k))
        seg = i1 - i0
        a = np.ones(seg)
        a[:n_of(0.03)] = np.linspace(0.3, 1, min(seg, n_of(0.03)))
        a[-n_of(0.05):] *= np.linspace(1, 0.55, min(seg, n_of(0.05)))
        amp[i0:i1] = a
    f[f == 0] = hz(notes[-1][1])
    g = n_of(glide)
    f = np.convolve(f, np.ones(g) / g, mode='same')
    return f, amp


def livery_hum():
    """Badly: an octave down in a man's chest, slower than the tune goes, every
    note a little off and THE FOURTH BAR SAGGING, a half step flat (doc 54 B3:
    Thad whistles it "corrected: the fourth bar lifted where the livery man let
    it sag"; errata 190 -- it was the eighth note sharp), the vibrato uneven.
    Recognisably the town theme, and recognisably wrong."""
    rnd = np.random.default_rng(4101)
    notes = [(b, m - 24 - (1 if b >= 6 else 0), d) for k, (b, m, d) in enumerate(PHRASE)]
    offs = rnd.uniform(-55, 45, len(notes))
    f, amp = pitch_track(notes, 60 / 104, lambda k: offs[k], glide=0.07)
    t = np.arange(len(f)) / RATE
    f = f * 2 ** ((9 * np.sin(2 * np.pi * 4.3 * t + rnd.uniform(0, 6)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))) / 1200)
    phase = np.cumsum(f) / RATE
    buzz = sum(np.sin(2 * np.pi * k * phase) / k ** 1.3 for k in range(1, 14))
    hum = lowpass(buzz, 700) + 0.6 * bandpass(buzz, 200, 320, order=1)
    hum *= amp * np.minimum(1, t / 0.15)
    hum += 0.03 * lowpass(rnd.normal(0, 1, len(hum)), 400) * amp
    return hum


def whistle(rnd, notes, beat):
    """In tune: a near-pure tone an octave above the tune, breath on it, a
    small even vibrato -- a man who knows exactly where the note is."""
    up = [(b, m + 12, d) for b, m, d in notes]
    f, amp = pitch_track(up, beat, lambda k: 0.0, glide=0.035)
    t = np.arange(len(f)) / RATE
    f = f * 2 ** ((12 * np.sin(2 * np.pi * 5.2 * t)) / 1200)
    phase = np.cumsum(f) / RATE
    tone = np.sin(2 * np.pi * phase) + 0.06 * np.sin(4 * np.pi * phase)
    breath = bandpass(rnd.normal(0, 1, len(tone)), 900, 3200) * 0.08
    return (tone + breath) * amp * np.minimum(1, t / 0.05)


LONG_MOMENT = 4.3


def grievance_whistle():
    rnd = np.random.default_rng(4201)
    fork = load('r33-fork.wav')
    w = whistle(rnd, PHRASE, 60 / 120)
    x = np.zeros(n_of(1.4) + len(w) + n_of(2.2 + LONG_MOMENT))
    place(x, fork / (np.abs(fork).max() + 1e-9), 0.0, 0.35)
    place(x, w / (np.abs(w).max() + 1e-9), 1.3, 0.8)
    end = 1.3 + len(w) / RATE
    # "Grievance's ears come round. She looks at Thad for a long moment. Then she walks out of her stall"
    # (doc 54 B3): her steps after the long moment, not on the whistle's last note (errata 190).
    end += LONG_MOMENT
    for k, at in enumerate((0.35, 0.8, 1.25, 1.7)):          # and she goes
        step = lowpass(load(f'step-dirt-{k % 4 + 1}.wav'), 1500)
        place(x, step, end + at, 0.5)
    return x


def tuning_pin(rnd):
    """The pin turning in the block: a few stiff, dry catches."""
    n = n_of(0.5)
    out = np.zeros(n)
    phase, rate = 0.0, np.linspace(30, 70, n)
    for i in range(n):
        phase += rate[i] / RATE
        if phase >= 1:
            phase -= 1
            out[i] = rnd.uniform(0.5, 1.0)
    return bandpass(out, 1200, 4500) * np.sin(np.linspace(0, np.pi, n))


def piano_tuning():
    rnd = np.random.default_rng(4301)
    flat = load('piano-flat.wav')[:n_of(3.0)]
    tuned = load('piano-tuned.wav')
    fork = load('r33-fork.wav')[:n_of(1.6)]
    pin = tuning_pin(rnd)
    x = np.zeros(n_of(3.0 + 1.8 + 1.2 + len(tuned) / RATE))
    place(x, flat, 0.0, 1.0)
    place(x, fork / (np.abs(fork).max() + 1e-9), 3.1, 0.3)
    place(x, pin / (np.abs(pin).max() + 1e-9), 4.6, 0.25)
    place(x, pin / (np.abs(pin).max() + 1e-9), 5.3, 0.2)
    place(x, tuned, 6.0, 1.0)
    return x


if __name__ == '__main__':
    save('livery-hum.wav', livery_hum(), 0.6)
    save('grievance-whistle.wav', grievance_whistle(), 0.7)
    save('piano-tuning.wav', piano_tuning(), 0.75)
