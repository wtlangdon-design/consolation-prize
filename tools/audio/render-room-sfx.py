"""
The rest of doc 45's sounds (errata 106: Tyler, "Handle the sounds that aren't
hooked up yet"), rendered offline like the everyday ones.

    python3 tools/audio/render-room-sfx.py

Run AFTER render-everyday-sfx.py: several of these are built from files Tyler
already approved (the wind, the clock, the paper, the mud), so they share a
material with what he heard rather than inventing a second one.

THE LESSON FROM ERRATA 102 HOLDS HERE: anything that rings at a clean pitch
reads as a different material. Wood, mud, paper and feet are unpitched noise;
only the glass and the spittoon's brass are allowed to ring, because they do.

THE TWO HUMAN SOUNDS ARE THE RISK. A laugh and a room of talk are voices, and
synthesis does voices worst. Both are built to be heard from a distance --
low-passed, quiet, through a wall or across a street -- where what reads is the
rhythm of syllables and the colour of vowels rather than any word, which is
also all doc 45 asks of them ("no intelligible words", "indistinct talk").

    axle-receding.wav     R01-COACH-2: the dry near axle, squealing away east
    laugh-distant.wav     R01-WEST-3: one distant human laugh from town
    spittoon.wav          R03-SPITTOON: one restrained wet spittoon sound
    mud-working.wav       R23/24-MUD: wet, working at it
    street-distant.wav    R21-WINDOW: "The street. All of it."
    nugget-crowd.wav      R03-A: glasses, indistinct talk, the chandelier cooling (loops)
    dog-breathing.wav     R02-A: the dog, breathing, while it is there (loops)
    main-street-bed.wav   R02-A: the wind through the false fronts, and posted paper in it (loops)
    registrar-bed.wav     R07-A: patient shuffling, paper settling, Sump's clock (loops)

Deterministic: every sound has its own seeded stream.
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

RATE = 44100
OUT = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'


def n_of(seconds):
    return int(round(seconds * RATE))


def lowpass(x, hz, order=4):
    return sosfilt(butter(order, hz, 'low', fs=RATE, output='sos'), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=RATE, output='sos'), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=RATE, output='sos'), x)


def env(n, attack, decay):
    k = np.arange(n) / RATE
    return np.minimum(1, k / max(attack, 1e-4)) * np.exp(-k / decay)


def place(dest, src, at, gain=1.0):
    i = n_of(at)
    if i < 0:
        src, i = src[-i:], 0
    if i >= len(dest):
        return dest
    m = min(len(src), len(dest) - i)
    dest[i:i + m] += gain * src[:m]
    return dest


def resonate(excite, table, rnd):
    out = np.zeros(len(excite))
    for freq, amp, decay in table:
        f = freq * rnd.uniform(0.97, 1.03)
        r = np.exp(-1 / (decay * RATE))
        w = 2 * np.pi * f / RATE
        out += amp * (1 - r) * lfilter([1], [1, -2 * r * np.cos(w), r * r], excite)
    return out


def load(name):
    with wave.open(str(OUT / name)) as src:
        return np.frombuffer(src.readframes(src.getnframes()), dtype='<i2') / 32767


def loop_seam(x, crossfade=0.4):
    """Overlap the tail onto the head so the loop's ends meet."""
    f = n_of(crossfade)
    x = x.copy()
    x[:f] = x[:f] * np.linspace(0, 1, f) + x[-f:] * np.linspace(1, 0, f)
    return x[:-f]


def finish(x, peak, loop=False):
    x = x - np.mean(x)
    if loop:
        pad = n_of(0.05)
        x = lowpass(np.concatenate([x[-pad:], x]), 11000, order=2)[pad:]
    else:
        x = lowpass(x, 11000, order=2)
        f = n_of(0.02)
        x[-f:] *= np.linspace(1, 0, f)
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def save(name, x):
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(OUT / name), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(data.tobytes())
    print(f'{name:24s} {len(x) / RATE:5.2f}s')


# ---------------------------------------------------------------- voices

def glottal(rnd, f0, seconds, jitter=0.02):
    """A pulse train at a wandering pitch: the buzz a vowel is cut from."""
    n = n_of(seconds)
    out = np.zeros(n)
    t, i = 0.0, 0
    f0 = np.atleast_1d(f0)
    while i < n:
        out[i] = 1.0
        pitch = f0[min(len(f0) - 1, int(i / n * len(f0)))] * (1 + rnd.normal(0, jitter))
        t += 1 / pitch
        i = n_of(t)
    return lowpass(out, 3500, order=2)


VOWELS = {'a': (750, 1150, 2500), 'e': (450, 1900, 2550), 'o': (500, 850, 2400), 'u': (350, 800, 2300),
          'i': (300, 2200, 2900), 'eh': (550, 1700, 2500)}


def vowel(rnd, source, which):
    f1, f2, f3 = VOWELS[which]
    out = np.zeros_like(source)
    for f, amp, bw in ((f1, 1.0, 90), (f2, 0.6, 110), (f3, 0.25, 160)):
        lo, hi = max(60, f - bw), f + bw
        out += amp * bandpass(source, lo, hi, order=1)
    return out


def laugh_distant():
    """Five ha's, falling in pitch and loudness, from down the street."""
    rnd = np.random.default_rng(3101)
    x = np.zeros(n_of(2.4))
    at = 0.1
    for k in range(5):
        dur = 0.13 - 0.008 * k
        f0 = np.linspace(230 - 12 * k, 200 - 14 * k, 6)
        voiced = vowel(rnd, glottal(rnd, f0, dur), 'a') * np.sin(np.linspace(0, np.pi, n_of(dur))) ** 0.7
        breath = bandpass(rnd.normal(0, 1, n_of(0.05)), 900, 3500) * np.hanning(n_of(0.05))
        place(x, breath, at, 0.25 * (1 - 0.12 * k))
        place(x, voiced, at + 0.03, 1.0 * (1 - 0.15 * k))
        at += 0.2 + 0.015 * k
    # the street between: the high end goes, and the false fronts answer
    x = lowpass(x, 1800)
    echo = np.zeros_like(x)
    for delay, g in ((0.09, 0.35), (0.19, 0.22), (0.33, 0.12)):
        place(echo, x, delay, g)
    return finish(x + echo, peak=0.5)


def crowd(rnd, seconds, voices):
    """Indistinct talk: several voices, each a run of syllables -- a vowel at
    a speaking pitch, a gap -- with pauses between phrases. Heard through the
    room it reads as talk without a word in it."""
    x = np.zeros(n_of(seconds + 1))
    for v in range(voices):
        base = rnd.uniform(95, 210)
        at = rnd.uniform(0, 2.0)
        gain = rnd.uniform(0.4, 1.0)
        while at < seconds:
            phrase = int(rnd.integers(3, 10))
            for _ in range(phrase):
                dur = rnd.uniform(0.09, 0.22)
                f0 = base * np.linspace(rnd.uniform(0.95, 1.12), rnd.uniform(0.85, 1.0), 5)
                syl = vowel(rnd, glottal(rnd, f0, dur), rnd.choice(list(VOWELS)))
                syl *= np.sin(np.linspace(0, np.pi, n_of(dur))) ** 0.8
                place(x, syl, at, gain)
                at += dur + rnd.uniform(0.02, 0.07)
            at += rnd.uniform(0.4, 1.8)
    return lowpass(x, 1600)


# ---------------------------------------------------------------- the one-shots

def axle_receding():
    """A dry axle squealing once a turn, going away east: stick-slip at a few
    hundred catches a second (buzzy, not a whistle), each turn quieter and
    duller than the last."""
    rnd = np.random.default_rng(3001)
    d = 4.0
    x = np.zeros(n_of(d))
    at, turn = 0.05, 0
    while at < d - 0.4:
        dur = 0.28
        n = n_of(dur)
        rate = np.linspace(rnd.uniform(380, 420), rnd.uniform(470, 520), n)
        pulses = np.zeros(n)
        phase = 0.0
        for i in range(n):
            phase += rate[i] / RATE
            if phase >= 1:
                phase -= 1 + rnd.uniform(-0.2, 0.2) * 0.2
                pulses[i] = rnd.uniform(0.5, 1.0)
        squeal = bandpass(pulses, 700, 3200) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
        far = 0.7 ** turn
        place(x, lowpass(squeal, max(900, 3200 * far)), at, far)
        at += 0.62 + 0.04 * turn
        turn += 1
    return finish(x, peak=0.45)


def spittoon():
    """Restrained: a small wet arrival and the brass under it, once."""
    rnd = np.random.default_rng(3201)
    x = np.zeros(n_of(1.0))
    splat = bandpass(rnd.normal(0, 1, n_of(0.08)), 500, 2600) * env(n_of(0.08), 0.002, 0.018)
    place(x, splat, 0.0, 0.8)
    for _ in range(3):
        size = int(rnd.integers(60, 200))
        drop = rnd.normal(0, 1, size) * np.exp(-np.arange(size) / (size / 4))
        place(x, bandpass(drop, 800, 3000), rnd.uniform(0.02, 0.09), 0.3)
    strike = np.concatenate([rnd.normal(0, 1, n_of(0.002)), np.zeros(n_of(0.9))])
    brass = resonate(strike, [(880, 1.0, 0.25), (2240, 0.6, 0.16), (3710, 0.35, 0.09), (5200, 0.15, 0.05)], rnd)
    place(x, brass, 0.004, 9.0)
    return finish(x, peak=0.5)


def mud_working():
    """Prosperity's mud, listened to: slow sucking and settling, no boot in it."""
    rnd = np.random.default_rng(3301)
    d = 2.6
    x = np.zeros(n_of(d))
    for at in (0.1, 0.9, 1.7):
        suck = bandpass(rnd.normal(0, 1, n_of(0.35)), 250, 1200) * np.sin(np.linspace(0, np.pi, n_of(0.35))) ** 2
        place(x, suck, at + rnd.uniform(0, 0.1), 0.35)
        for _ in range(int(rnd.integers(2, 5))):
            dur = rnd.uniform(0.015, 0.035)
            k = np.arange(n_of(dur)) / RATE
            f0, f1 = rnd.uniform(200, 380), rnd.uniform(500, 1000)
            chirp = np.sin(2 * np.pi * (f0 * k + (f1 - f0) * k * k / (2 * dur))) * np.hanning(len(k))
            place(x, chirp, at + rnd.uniform(0.05, 0.35), rnd.uniform(0.12, 0.3))
    return finish(lowpass(x, 3000), peak=0.45)


def street_distant():
    """The whole street at a watchman's distance: the wind, the Nugget's piano
    faint under it, a door somewhere. Swells in and out."""
    rnd = np.random.default_rng(3401)
    d = 6.0
    wind = load('wind.wav')[:n_of(d)]
    piano_path = OUT.parent / 'consolation-distant-piano.wav'
    with wave.open(str(piano_path)) as src:
        stereo = np.frombuffer(src.readframes(src.getnframes()), dtype='<i2').reshape(-1, 2) / 32767
    piano = lowpass(stereo.mean(axis=1)[n_of(3.0):n_of(3.0 + d)], 900)
    x = 0.8 * wind + 0.35 * piano
    latch = lowpass(load('door-latch.wav'), 1500)
    place(x, latch, 3.4, 0.25)
    shape = np.sin(np.linspace(0, np.pi, n_of(d))) ** 0.8
    return finish(x * shape, peak=0.4)


# ---------------------------------------------------------------- the beds

def nugget_crowd():
    """R03-A. Twenty seconds of a saloon at night: talk with no words in it,
    a glass set down now and then (glass is allowed to ring -- it does), and
    the chandelier's tin ticking as it cools."""
    rnd = np.random.default_rng(3501)
    d = 20.0
    x = crowd(rnd, d + 0.5, voices=7) * 0.9
    for at in rnd.uniform(0.3, d, 9):
        strike = np.concatenate([rnd.normal(0, 1, n_of(0.001)), np.zeros(n_of(0.7))])
        glass = resonate(strike, [(rnd.uniform(2400, 3200), 1.0, 0.18), (rnd.uniform(5200, 6400), 0.5, 0.09)], rnd)
        place(x, glass, at, rnd.uniform(1.5, 3.0))
        place(x, lowpass(rnd.normal(0, 1, n_of(0.03)), 600) * np.hanning(n_of(0.03)), at, 0.1)  # the table
    for at in rnd.uniform(0.5, d, 6):
        tick = bandpass(rnd.normal(0, 1, n_of(0.006)), 3000, 7000) * np.hanning(n_of(0.006))
        place(x, tick, at, 0.25)
    return finish(loop_seam(x[:n_of(d + 0.4)]), peak=0.5, loop=True)


def dog_breathing():
    """R02-A. A dog lying in the street, breathing slow through its nose, a
    small huff now and then."""
    rnd = np.random.default_rng(3601)
    d = 8.0
    x = np.zeros(n_of(d + 1))
    at = 0.2
    while at < d:
        inn = rnd.uniform(0.6, 0.9)
        out = rnd.uniform(0.8, 1.1)
        place(x, bandpass(rnd.normal(0, 1, n_of(inn)), 600, 2400) * np.sin(np.linspace(0, np.pi, n_of(inn))) ** 2, at, 0.25)
        place(x, bandpass(rnd.normal(0, 1, n_of(out)), 300, 1600) * np.sin(np.linspace(0, np.pi, n_of(out))) ** 1.5,
              at + inn + 0.1, 0.4)
        at += inn + out + rnd.uniform(0.4, 0.9)
    place(x, bandpass(rnd.normal(0, 1, n_of(0.12)), 400, 2000) * env(n_of(0.12), 0.005, 0.04), 5.2, 0.6)  # the huff
    return finish(loop_seam(x[:n_of(d + 0.4)]), peak=0.35, loop=True)


def main_street_bed():
    """R02-A. The approved wind, with a posted handbill catching in it twice."""
    rnd = np.random.default_rng(3701)
    x = load('wind.wav').copy()
    flap = load('paper-light.wav')
    for at in (3.3, 8.6):
        place(x, flap, at, 0.35)
        place(x, flap, at + rnd.uniform(0.25, 0.4), 0.2)
    return finish(x, peak=0.35, loop=True)


def registrar_bed():
    """R07-A. Sump's clock, and the queue: someone shifting their feet, a page
    settling. Sixteen seconds, which is sixteen ticks."""
    rnd = np.random.default_rng(3801)
    d = 16.0
    clock = load('clock-tick.wav')
    x = np.tile(clock, int(d / (len(clock) / RATE)))[:n_of(d)].astype(float)
    for at in (3.1, 9.7, 13.2):
        k = n_of(0.5)
        shuffle = bandpass(rnd.normal(0, 1, k), 250, 2500) * np.sin(np.linspace(0, np.pi, k)) ** 1.2
        place(x, shuffle, at, 0.12)
        place(x, lowpass(rnd.normal(0, 1, n_of(0.08)), 250) * env(n_of(0.08), 0.004, 0.02), at + 0.3, 0.2)
    paper = load('paper-light.wav')
    for at in (6.2, 14.6):
        place(x, paper, at, 0.25)
    return finish(x, peak=0.4, loop=True)


def church_bell_toll():
    """R17-BELL, as a pull on the rope really sounds (Tyler, 2026-11-06: "The
    bell doesn't toll loudly enough for long enough"). One pull swings the
    bell, and it strikes on each swing, each a little softer as the swing
    dies: three strikes of the approved bell, two and a half seconds apart,
    ringing out together. Same bell, same flat note."""
    one = load('church-bell.wav')
    x = np.zeros(n_of(14.0))
    for at, g in ((0.0, 1.0), (2.5, 0.82), (5.0, 0.62)):
        place(x, one, at, g)
    return finish(x, peak=0.85)


if __name__ == '__main__':
    save('axle-receding.wav', axle_receding())
    save('laugh-distant.wav', laugh_distant())
    save('spittoon.wav', spittoon())
    save('mud-working.wav', mud_working())
    save('street-distant.wav', street_distant())
    save('nugget-crowd.wav', nugget_crowd())
    save('dog-breathing.wav', dog_breathing())
    save('main-street-bed.wav', main_street_bed())
    save('registrar-bed.wav', registrar_bed())
    save('church-bell-toll.wav', church_bell_toll())
