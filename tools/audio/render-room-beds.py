"""
EVERY ROOM'S BED (doc 45, "Every room's bed"; errata 203, 206; reference/room-beds/brief.md).

    python3 tools/audio/render-room-beds.py

Run AFTER render-everyday-sfx.py and render-room-sfx.py: most of what is here
is built out of files Tyler has already approved by ear -- the wind through the
false fronts, the Nugget's talk, the team standing and moving, the boardwalk and
plank steps, the creaking board, the town sign, the leather, the latch, the
batwings' iron hinge, the stamp, Sump's clock, the distant flat bell -- so a
room's sound shares its material with what he heard rather than inventing a
second one. Only what no approved file holds is synthesized here: water,
distant picks and hammering, canvas, fire, an oven, coppers at the boil, a
plane on wood, straw, a vault's mechanism, small bells, breathing, a cat, a
cough, a far dog, and two voices too far off to have words.

THE LESSONS THESE KEEP (errata 102, 106; doc 55 section 8):

  * Unpitched noise reads. Every material is shaped noise: bands of it, grains
    of it, bursts of it. Nothing is a sine, and the only resonators are the ones
    the approved renderers already allow to ring, because the thing rings:
    glass, and here the tent's small bells, built the same way, very short,
    high and inharmonic, so they jingle without a note.
  * Anything that rings at a clean pitch reads as the wrong material. Doc 45's
    rule 4 for beds is the same: no pitch. The only pitched sound in any bed is
    the approved flat bell, far off, where doc 45 names it (rule 4: the fork and
    the flat bell are the two pitched sounds outside the score).
  * Voices only distant and wordless. The two men arguing and the mourners'
    cough are voices; both are low-passed past any word. Synthesized creatures
    and voices are where this fails (errata 206 F: Tyler heard the owl as
    something raked on the ground and the boy's humming as someone dying), so
    the owl and the humming are cut, and no new one is added.
  * Loops are built to loop. Every continuous texture is generated exactly one
    loop long in the frequency domain (its end runs into its start); every
    event is placed on a circle, so one that rings past the end sounds again at
    the start, as a sound still ringing when the loop comes round would; every
    filter is run in over the loop's own end; and a slow swell has a whole
    number of cycles in the loop. The seam is measured and printed.
  * Under the music, never over it (rule 5). The files are normalized; their
    gains in content/audio/sounds.json are set from measurement against the
    music as it plays, and tools/check-sound-levels.mjs holds them.

THE FORMAT. Mono, 16-bit WAV like every sound effect, at 22,050 Hz rather than
44,100 to keep thirty-odd loops at about half the size: every bed is muffled,
distant or low (the output stage already rolls off at 11 kHz, which is this
rate's ceiling). The approved files are read at 44,100 and everything is mixed
there; only the written file is halved.

THE AGENT THAT WROTE THIS CANNOT HEAR IT. Every claim here is about the
waveform. Tyler hears every bed against its room's music before the gains are
final (doc 45 rule 5; errata 102).

Deterministic: every bed has its own seeded stream.
"""
import importlib.util
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter, resample_poly, sosfilt, welch

RATE = 44100
OUT_RATE = 22050
ROOT = Path(__file__).resolve().parents[2]
SFX = ROOT / 'audio' / 'sfx'
OUT = SFX / 'beds'


def _sibling(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), Path(__file__).with_name(name))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# The approved voices: render-room-sfx.py's glottal pulse and formant vowels,
# the same machine as the Nugget's talk and the distant laugh.
ROOMSFX = _sibling('render-room-sfx.py')
glottal, vowel = ROOMSFX.glottal, ROOMSFX.vowel


# ---------------------------------------------------------------- helpers

def n_of(seconds):
    return int(round(seconds * RATE))


def sos(kind, hz, order):
    return butter(order, hz, kind, fs=RATE, output='sos')


def lowpass(x, hz, order=4):
    return sosfilt(sos('low', hz, order), x)


def highpass(x, hz, order=2):
    return sosfilt(sos('high', hz, order), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(sos('band', [lo, hi], order), x)


def env(n, attack, decay):
    k = np.arange(n) / RATE
    return np.minimum(1, k / max(attack, 1e-4)) * np.exp(-k / decay)


def hann(n):
    return np.hanning(max(n, 2))[:n]


def load(name):
    with wave.open(str(SFX / name)) as src:
        x = np.frombuffer(src.readframes(src.getnframes()), dtype='<i2') / 32767
        if src.getnchannels() > 1:
            x = x.reshape(-1, src.getnchannels()).mean(axis=1)
    return x.astype(float)


def circ(x, fn, pad=0.6):
    """A filter run around the loop: started over the loop's own end, so the
    first sample follows the last instead of following silence."""
    p = min(n_of(pad), len(x))
    return fn(np.concatenate([x[-p:], x]))[p:]


def formant_noise(rnd, seconds, bands):
    """Noise through a few broad bands, each with its own decay: a body's
    colour without a pitch (render-everyday-sfx.py's wood steps)."""
    n = n_of(seconds)
    out = np.zeros(n)
    for centre, width, gain, decay in bands:
        lo, hi = centre * (1 - width / 2), centre * (1 + width / 2)
        out += gain * bandpass(rnd.normal(0, 1, n), lo, hi, order=1) * env(n, 0.0008, decay)
    return out


def resonate(excite, table, rnd):
    out = np.zeros(len(excite))
    for freq, amp, decay in table:
        f = freq * rnd.uniform(0.97, 1.03)
        r = np.exp(-1 / (decay * RATE))
        w = 2 * np.pi * f / RATE
        out += amp * (1 - r) * lfilter([1], [1, -2 * r * np.cos(w), r * r], excite)
    return out


class Loop:
    """A bed: a buffer that is a circle."""

    def __init__(self, seconds, seed):
        self.seconds = seconds
        self.n = n_of(seconds)
        self.x = np.zeros(self.n)
        self.rnd = np.random.default_rng(seed)

    def at(self, src, when, gain=1.0):
        """An event, placed on the circle: what rings past the end comes round."""
        i = n_of(when) % self.n
        src = np.asarray(src, dtype=float) * gain
        while len(src):
            m = min(len(src), self.n - i)
            self.x[i:i + m] += src[:m]
            src, i = src[m:], 0

    def add(self, signal, gain=1.0):
        """A continuous texture exactly one loop long."""
        assert len(signal) == self.n, (len(signal), self.n)
        self.x += gain * signal

    def times(self, count, jitter=0.35, start=None):
        """`count` moments spread round the loop, not quite evenly."""
        step = self.seconds / count
        first = self.rnd.uniform(0, step) if start is None else start
        return [(first + k * step + self.rnd.uniform(-jitter, jitter) * step) % self.seconds for k in range(count)]

    def swell(self, cycles, depth, phase=None):
        """A slow rise and fall with a whole number of cycles in the loop."""
        k = np.arange(self.n) / self.n
        out = np.ones(self.n)
        for c, d in zip(cycles, depth):
            out += d * np.sin(2 * np.pi * c * k + (self.rnd.uniform(0, 6.28) if phase is None else phase))
        return np.clip(out, 0.05, None)

    def noise(self, lo, hi, tilt=0.0):
        """Band-limited noise exactly periodic in the loop, its spectrum tilted
        by `tilt` dB an octave (negative darkens it). Unit RMS."""
        spec = np.fft.rfft(self.rnd.normal(0, 1, self.n))
        freqs = np.fft.rfftfreq(self.n, 1 / RATE)
        spec[(freqs < lo) | (freqs > hi)] = 0
        if tilt:
            with np.errstate(divide='ignore'):
                spec *= np.where(freqs > 0, (np.maximum(freqs, lo) / lo) ** (tilt / 6.02), 0)
        x = np.fft.irfft(spec, self.n)
        return x / (np.std(x) + 1e-12)

    def tile(self, x):
        """An approved loop laid end to end, when the bed is a whole number of it."""
        reps = self.n / len(x)
        assert abs(reps - round(reps)) < 1e-3, f'{self.seconds}s is not a whole number of {len(x) / RATE:.2f}s'
        return np.tile(x, int(round(reps)))[:self.n]

    def excerpt(self, x, crossfade=0.4):
        """A loop cut from a longer approved stream: its tail overlapped onto its
        head, as render-room-sfx.py's loop_seam."""
        f = n_of(crossfade)
        start = int(self.rnd.integers(0, max(1, len(x) - self.n - f)))
        part = x[start:start + self.n + f].copy()
        if len(part) < self.n + f:
            part = np.tile(x, 3)[start:start + self.n + f].copy()
        part[:f] = part[:f] * np.linspace(0, 1, f) + part[-f:] * np.linspace(1, 0, f)
        return part[:self.n]


def wall(x, cut=420):
    """Through a wall, as the music's `distance: wall` is: the top gone, and
    the wall's short reflections."""
    y = lowpass(x, cut)
    out = y.copy()
    for delay, g in ((0.005, 0.35), (0.011, 0.2)):
        out[n_of(delay):] += g * y[:len(y) - n_of(delay)]
    return out


def far(x, cut, taps=((0.09, 0.3), (0.21, 0.18), (0.4, 0.08))):
    """Across a distance: the top gone, and what the street or the hills send
    back late."""
    y = lowpass(x, cut)
    out = np.concatenate([y, np.zeros(n_of(max(d for d, _ in taps)))])
    for delay, g in taps:
        out[n_of(delay):n_of(delay) + len(y)] += g * y
    return out


def passing(x, seconds, rnd):
    """Something going by: up, then away."""
    n = min(len(x), n_of(seconds))
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return x[:n] * shape


def finish(x, peak=0.9):
    """The output stage of every sound here: rolled off at 11 kHz as the score
    is, on the circle, and normalized."""
    x = x - np.mean(x)
    x = circ(x, lambda y: lowpass(y, 11000, order=2), pad=0.05)
    return x / (np.max(np.abs(x)) + 1e-12) * peak


def save(name, x):
    """Halved to 22,050 Hz on the circle (the seam stays a seam), then written."""
    pad = 2048
    y = resample_poly(np.concatenate([x[-pad:], x, x[:pad]]), OUT_RATE, RATE)[pad // 2:-(pad // 2)]
    OUT.mkdir(parents=True, exist_ok=True)
    data = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(str(OUT / name), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(OUT_RATE)
        out.writeframes(data.tobytes())
    report(name, y)


def report(name, y):
    """Measured, because nobody here can listen: the loop's seam against its
    ordinary sample steps; the longest run near silence; and how tonal it is,
    the strongest spectral peak over the median of its neighbourhood."""
    # The seam against the steps on either side of it: a loop that meets
    # itself steps across its seam as it steps anywhere near it.
    seam = abs(y[0] - y[-1])
    near = np.abs(np.diff(np.concatenate([y[-441:], y[:441]])))
    near = np.delete(near, 440)
    pct = 100 * np.mean(near < seam)
    quiet = np.abs(y) < 10 ** (-60 / 20)
    run, best = 0, 0
    for q in quiet:
        run = run + 1 if q else 0
        best = max(best, run)
    f, p = welch(y, fs=OUT_RATE, nperseg=4096)
    band = (f > 80) & (f < 9000)
    smooth = np.convolve(p, np.ones(31) / 31, mode='same')
    peaky = float(np.max(p[band] / (smooth[band] + 1e-20)))
    print(f'{name:34s} {len(y) / OUT_RATE:5.1f}s  seam at {pct:5.1f}th pct of the 20 ms round it  '
          f'longest quiet {best / OUT_RATE:4.2f}s  peakiness {peaky:5.1f}')


# ---------------------------------------------------------------- the approved materials

WIND = load('wind.wav')                 # the false fronts' wind, 11.5 s, a seamless loop
CROWD = load('nugget-crowd.wav')        # the Nugget's talk with no words in it, 20 s
TEAM_HALTED = load('team-halted.wav')   # horses standing: breathing, harness, a hoof
TEAM_MOVING = load('team-moving.wav')   # horses and wheels in mud
BOARDWALK = [load(f'step-boardwalk-{i}.wav') for i in range(1, 7)]
PLANK = [load(f'step-plank-{i}.wav') for i in range(1, 7)]
DIRT = [load(f'step-dirt-{i}.wav') for i in range(1, 5)]
CREAK = load('floorboard-creak.wav')
SIGN = load('sign-creak.wav')
LEATHER = load('leather-settle.wav')
LATCH = load('door-latch.wav')
HINGE = [load(f'batwing-swing-{i}.wav') for i in (1, 2, 3)]
STAMP = load('stamp.wav')
CLOCK = load('clock-tick.wav')
BELL_FAR = load('church-bell-distant.wav')
LAUGH = load('laugh-distant.wav')


def pick(rnd, xs):
    return xs[int(rnd.integers(0, len(xs)))]


# ---------------------------------------------------------------- materials

def town_murmur(bed, cut, swell=0.4):
    """The town as a murmur: the Nugget's approved talk, low-passed until no
    syllable is left, rising and falling."""
    x = bed.excerpt(CROWD)
    x = circ(x, lambda y: lowpass(y, cut))
    return x / (np.std(x) + 1e-12) * bed.swell([1, 3], [swell, swell * 0.4])


def wind_tiled(bed, cut=None, lo=None):
    x = bed.tile(WIND)
    if cut:
        x = circ(x, lambda y: lowpass(y, cut))
    if lo:
        x = circ(x, lambda y: highpass(y, lo))
    return x / (np.std(x) + 1e-12)


def gusts(bed, cycles=(2, 5), depth=(0.5, 0.25)):
    return bed.swell(list(cycles), list(depth))


def walker(bed, at, steps, takes, cut, gain, pace=0.52):
    """Someone walking past: approved steps, rising and falling."""
    rnd = bed.rnd
    shape = np.sin(np.linspace(0, np.pi, steps)) ** 1.2 + 0.05
    for k in range(steps):
        take = lowpass(pick(rnd, takes), cut)
        bed.at(take, at + k * pace * rnd.uniform(0.94, 1.06), gain * shape[k] * rnd.uniform(0.8, 1.1))


def cart(bed, at, seconds, cut, gain):
    """A cart going by: the approved team and wheels, passing."""
    x = np.tile(TEAM_MOVING, 3)[:n_of(seconds)]
    bed.at(passing(lowpass(x, cut), seconds, bed.rnd), at, gain)


def strike(rnd, bright=(1200, 3600), body=280):
    """A pick into rock: a dry click and the thud behind it, both noise."""
    n = n_of(0.12)
    click = bandpass(rnd.normal(0, 1, n), *bright, order=1) * env(n, 0.0004, rnd.uniform(0.004, 0.008))
    thud = lowpass(rnd.normal(0, 1, n), body) * env(n, 0.002, 0.022)
    return click * 0.8 + thud


def picks(bed, diggers, cut, gain, every=(1.6, 2.7)):
    """Picks far off: a few men, each at his own pace, resting now and then,
    with the hills answering late."""
    rnd = bed.rnd
    for _ in range(diggers):
        at = rnd.uniform(0, 2)
        g = gain * rnd.uniform(0.5, 1.0)
        while at < bed.seconds:
            blow = far(strike(rnd), cut, ((0.23, 0.25), (0.51, 0.12)))
            bed.at(blow, at, g * rnd.uniform(0.75, 1.0))
            at += rnd.uniform(*every)
            if rnd.random() < 0.15:
                at += rnd.uniform(2, 4)


def hammering(bed, bursts, cut, gain):
    """Hammering from town: a few blows at a time on wood, then a pause."""
    rnd = bed.rnd
    for at in bed.times(bursts, 0.25):
        for k in range(int(rnd.integers(3, 7))):
            blow = formant_noise(rnd, 0.12, [(320, 1.0, 1.0, 0.014), (950, 1.0, 0.5, 0.007), (2400, 0.8, 0.2, 0.003)])
            bed.at(far(blow, cut), at + k * rnd.uniform(0.42, 0.55), gain * rnd.uniform(0.7, 1.0))


def wander(bed, fastest):
    """A slow, aimless drift, one loop long: random components at every whole
    number of cycles in the loop up to `fastest` Hz, each its own size and
    phase, so no rate in it repeats (TYLER, 2026-11-08, of the first creek: "thin
    foil attached to a fan flapping about" -- a fan is a regular rate). Unit
    standard deviation."""
    k = np.arange(bed.n) / bed.n
    out = np.zeros(bed.n)
    for c in range(1, max(2, int(fastest * bed.seconds)) + 1):
        out += bed.rnd.normal(0, 1) / np.sqrt(c) * np.sin(2 * np.pi * c * k + bed.rnd.uniform(0, 6.28))
    return out / (np.std(out) + 1e-12)


# The bands a brook is built from: (lowest Hz, highest Hz, share). Pink to
# brown noise, darker in the low bands, each band drifting on its own.
BROOK_BANDS = [(60, 220, 1.0), (180, 450, 0.9), (380, 800, 0.75), (700, 1400, 0.55),
               (1200, 2400, 0.38), (2000, 4000, 0.22), (3500, 7000, 0.1)]


def water(bed, lo, hi, burble=2.0, depth=0.45, burble_band=(180, 700)):
    """Running water, remade (errata 206 F). The first one was a wash with a
    hundred short noise grains a second through it, and Tyler heard foil on a
    fan. This is the way a brook is heard from a few yards off: several bands
    of dark, pink-to-brown noise, each one's level drifting slowly and
    independently of the others (which moves the brook's brightness about, the
    filter's cutoff wandering without a filter being swept), and under it now
    and then a soft, low burble an octave wide. No grain, no flutter, nothing
    faster than about two drifts a second, nothing periodic."""
    rnd = bed.rnd
    out = np.zeros(bed.n)
    for a, b, share in BROOK_BANDS:
        a, b = max(a, lo), min(b, hi)
        if b <= a * 1.2:
            continue
        band = bed.noise(a, b, tilt=-4.5)
        level = np.exp(depth * wander(bed, 1.6) - depth * depth / 2)
        out += share * band * level
    out /= np.std(out) + 1e-12
    count = int(burble * bed.seconds)
    for _ in range(count):
        dur = rnd.uniform(0.08, 0.2)
        n = n_of(dur)
        centre = np.exp(rnd.uniform(np.log(burble_band[0]), np.log(burble_band[1])))
        g = bandpass(rnd.normal(0, 1, n), centre / 1.45, centre * 1.45, order=1) * hann(n) ** 2
        i = int(rnd.integers(0, bed.n))
        m = min(n, bed.n - i)
        out[i:i + m] += g[:m] / (np.std(g) + 1e-12) * rnd.uniform(0.15, 0.35)
        if m < n:
            out[:n - m] += g[m:] / (np.std(g) + 1e-12) * 0.25
    return out


def drip(rnd):
    """One drop: a short dry tick and the small pat of it landing."""
    n = n_of(0.08)
    tick = bandpass(rnd.normal(0, 1, n), 1600, 5200, order=1) * env(n, 0.0003, 0.003)
    pat = lowpass(rnd.normal(0, 1, n), 700) * env(n, 0.001, 0.012)
    return tick + 0.6 * pat


def canvas(bed, gain, flaps, cut=700):
    """Canvas breathing: a low, slow rush as the walls fill and ease, and now
    and then one panel taking the wind."""
    rnd = bed.rnd
    body = bed.noise(70, cut, tilt=-4.0) * bed.swell([1, 2, 5], [0.45, 0.25, 0.1])
    bed.add(body, gain)
    for at in bed.times(flaps, 0.4):
        n = n_of(0.35)
        flap = bandpass(rnd.normal(0, 1, n), 160, 1400, order=1) * env(n, 0.012, 0.09)
        bed.at(flap, at, gain * rnd.uniform(1.0, 1.8))


def settling(bed, creaks, ticks, cut, gain):
    """A building settling: the approved board and sign, low and slow, and the
    small ticks of wood and iron easing as the air changes."""
    rnd = bed.rnd
    for at in bed.times(creaks, 0.4):
        c = pick(rnd, [CREAK, SIGN[:n_of(0.9)]])
        bed.at(lowpass(c, cut), at, gain * rnd.uniform(0.35, 0.8))
    for at in bed.times(ticks, 0.45):
        n = n_of(0.03)
        t = bandpass(rnd.normal(0, 1, n), 1500, 4500, order=1) * env(n, 0.0003, 0.004)
        bed.at(lowpass(t, cut * 2.5), at, gain * rnd.uniform(0.15, 0.4))


def fire(bed, roar, crackle, rate=5.0):
    """A fire in a grate: a soft roar that flickers, and crackles, most of them
    tiny, a few not, at random."""
    rnd = bed.rnd
    f = circ(rnd.normal(0, 1, bed.n), lambda y: lowpass(y, 3, order=2))
    flicker = 1.0 + 0.3 * f / (np.std(f) + 1e-12)
    bed.add(bed.noise(60, 420, tilt=-3) * np.clip(flicker, 0.2, 1.6), roar)
    count = int(rate * bed.seconds)
    for _ in range(count):
        n = n_of(0.02)
        c = highpass(rnd.normal(0, 1, n), 1200) * env(n, 0.0002, rnd.uniform(0.0015, 0.005))
        bed.at(c, rnd.uniform(0, bed.seconds), crackle * rnd.pareto(2.5) * 0.6)
    for _ in range(int(bed.seconds / 4)):
        n = n_of(0.08)
        pop = formant_noise(rnd, 0.08, [(500, 1.0, 1.0, 0.008), (1800, 1.0, 0.4, 0.003)])
        bed.at(pop, rnd.uniform(0, bed.seconds), crackle * 0.8)


def jingle(rnd):
    """Small bells on a tent's hem, nudged: struck three or four times in a
    quarter second. Rung the way render-room-sfx.py rings the Nugget's glass
    (glass is allowed to ring; it does), but each bell is a cluster of high,
    inharmonic partials gone in well under a tenth of a second, and the bells
    differ, so what is heard is a jingle and not a note."""
    x = np.zeros(n_of(0.6))
    bells = [[(rnd.uniform(2600, 6800), rnd.uniform(0.4, 1.0), rnd.uniform(0.02, 0.05)) for _ in range(5)] for _ in range(4)]
    at = 0.0
    for _ in range(int(rnd.integers(3, 6))):
        strike_ = np.concatenate([rnd.normal(0, 1, n_of(0.0015)), np.zeros(n_of(0.25))])
        ring = resonate(strike_, pick(rnd, bells), rnd)
        i = n_of(at)
        x[i:i + len(ring)] += ring[:len(x) - i] * rnd.uniform(0.5, 1.0)
        at += rnd.uniform(0.04, 0.09)
    return x


def breathing(bed, period, lo, hi, gain, huff=True):
    """An animal breathing, slow, through the nose: an in-breath and a longer
    out-breath, bands of noise, as render-room-sfx.py's dog."""
    rnd = bed.rnd
    count = max(1, int(round(bed.seconds / period)))
    for k in range(count):
        at = k * bed.seconds / count + rnd.uniform(-0.1, 0.1)
        inn, out = period * rnd.uniform(0.28, 0.34), period * rnd.uniform(0.42, 0.5)
        a = bandpass(rnd.normal(0, 1, n_of(inn)), lo * 1.6, hi, order=1) * np.sin(np.linspace(0, np.pi, n_of(inn))) ** 2
        b = bandpass(rnd.normal(0, 1, n_of(out)), lo, hi * 0.7, order=1) * np.sin(np.linspace(0, np.pi, n_of(out))) ** 1.4
        bed.at(a, at, gain * 0.6)
        bed.at(b, at + inn + 0.08, gain)
    if huff:
        n = n_of(0.15)
        bed.at(bandpass(rnd.normal(0, 1, n), lo, hi, order=1) * env(n, 0.004, 0.045), rnd.uniform(0, bed.seconds), gain * 1.4)


def stroke_plane(rnd, seconds):
    """A carpenter's hand plane drawn the length of a coffin board, remade
    (errata 206 F; Tyler of the first: "it sounds nothing like it"). The first
    was a hiss chopped by a fast random flutter and clipped, which is a crackle,
    not a plane. A stroke is one long, even, dry shhhhk:

      the bite   -- the sole set down (a soft wooden tok) and the iron catching
                    the grain: a short dry rasp, the stick-slip of a creak
                    (render-everyday-sfx.py's), bright, in the first tenth of
                    a second
      the cut    -- wood friction: broad noise, its body in the board (300-900
                    Hz) and its edge in the shaving curling off (1.5-4 kHz),
                    rising in, held almost level, falling as the plane runs
                    off the end. Its level drifts by a decibel or so, slowly:
                    no flutter, nothing periodic
      the lift   -- the plane taken off the end, and quiet
    """
    n = n_of(seconds)
    k = np.arange(n) / RATE
    body = bandpass(rnd.normal(0, 1, n), 300, 900, order=1)
    edge = bandpass(rnd.normal(0, 1, n), 1400, 4200, order=1)
    air = highpass(rnd.normal(0, 1, n), 4200) * 0.25
    cut = 0.55 * body / np.std(body) + 1.0 * edge / np.std(edge) + air
    drift = lowpass(rnd.normal(0, 1, n), 4, order=2)
    cut *= np.exp(0.12 * drift / (np.std(drift) + 1e-12))
    rise, fall = n_of(0.07), n_of(0.14)
    shape = np.ones(n)
    shape[:rise] = np.sin(np.linspace(0, np.pi / 2, rise)) ** 2
    shape[-fall:] = np.cos(np.linspace(0, np.pi / 2, fall)) ** 2
    shape *= 1.0 - 0.18 * k / seconds          # the cut eases as the stroke runs on
    out = cut * shape
    bite_n = n_of(0.12)
    pulses = np.zeros(bite_n)
    phase = 0.0
    rates = np.linspace(rnd.uniform(140, 180), rnd.uniform(220, 260), bite_n)
    for i in range(bite_n):
        phase += rates[i] / RATE
        if phase >= 1:
            phase -= 1 + rnd.uniform(-0.25, 0.25) * 0.3
            pulses[i] = rnd.uniform(0.5, 1.0)
    rasp = bandpass(pulses, 900, 3800) * np.sin(np.linspace(0, np.pi, bite_n)) ** 0.8
    out[:bite_n] += 2.0 * rasp * np.std(out) / (np.std(rasp) + 1e-12)
    tok = formant_noise(rnd, 0.05, [(260, 1.0, 1.0, 0.009), (900, 1.0, 0.4, 0.004)])
    lead = n_of(0.03)
    whole = np.zeros(lead + n)
    whole[:len(tok)] += 0.5 * tok / (np.max(np.abs(tok)) + 1e-12) * np.max(np.abs(out))
    whole[lead:] += out
    return whole


def cough(rnd):
    """A cough at a graveside: two bursts of breath through an open throat,
    heard from across the mourners. Noise through vowel-like bands, no voice."""
    x = np.zeros(n_of(0.7))
    at = 0.0
    for g in (1.0, 0.6):
        n = n_of(rnd.uniform(0.09, 0.13))
        burst = np.zeros(n)
        src = rnd.normal(0, 1, n)
        for f, a in ((650, 1.0), (1150, 0.6), (2400, 0.25)):
            burst += a * bandpass(src, f * 0.8, f * 1.25, order=1)
        burst *= env(n, 0.004, 0.04)
        x[n_of(at):n_of(at) + n] += g * burst
        at += rnd.uniform(0.2, 0.28)
    return lowpass(x, 2200)


def shuffle(rnd):
    """Feet shifting on earth: render-room-sfx.py's queue shuffle, on dirt."""
    k = n_of(rnd.uniform(0.35, 0.6))
    s = bandpass(rnd.normal(0, 1, k), 250, 2500) * np.sin(np.linspace(0, np.pi, k)) ** 1.2
    return s * 0.5 + np.concatenate([pick(rnd, DIRT)[:k] * 0.6, np.zeros(max(0, k - len(DIRT[0])))])[:k]


def dog_far(rnd):
    """A dog, very small with distance: two short barks through the approved
    voice machine, low-passed past anything but their shape."""
    x = np.zeros(n_of(1.0))
    at = 0.0
    for _ in range(2):
        dur = rnd.uniform(0.09, 0.13)
        f0 = np.linspace(rnd.uniform(300, 360), rnd.uniform(220, 260), 5)
        bark = vowel(rnd, glottal(rnd, f0, dur, jitter=0.06), 'a') * env(n_of(dur), 0.006, dur / 2.5)
        x[n_of(at):n_of(at) + len(bark)] += bark
        at += rnd.uniform(0.22, 0.32)
    return far(x, 900, ((0.2, 0.3), (0.45, 0.15)))


def talk(rnd, seconds, voices, base=(95, 150), gap=(0.25, 0.9), cut=900):
    """Two or more voices, as render-room-sfx.py's crowd(), but in exchange:
    each speaks a phrase and the other answers. Low-passed past any word."""
    x = np.zeros(n_of(seconds + 1))
    pitches = [rnd.uniform(*base) for _ in range(voices)]
    at, who = 0.3, 0
    while at < seconds - 0.6:
        f = pitches[who]
        for _ in range(int(rnd.integers(4, 11))):
            dur = rnd.uniform(0.08, 0.2)
            f0 = f * np.linspace(rnd.uniform(1.0, 1.25), rnd.uniform(0.85, 1.05), 5)
            syl = vowel(rnd, glottal(rnd, f0, dur), pick(rnd, list(ROOMSFX.VOWELS)))
            syl *= np.sin(np.linspace(0, np.pi, n_of(dur))) ** 0.8
            i = n_of(at)
            x[i:i + len(syl)] += syl[:len(x) - i] * rnd.uniform(0.7, 1.0)
            at += dur + rnd.uniform(0.015, 0.05)
        at += rnd.uniform(*gap)
        who = (who + 1) % voices
    # The whole of it, tail and all: the caller lays it on the circle, so a
    # phrase still going at the loop's end is still going at its start.
    return lowpass(x, cut)


# ---------------------------------------------------------------- the rooms
# Each bed cites its doc 45 row, and holds what that row says and nothing more.

def bed_stage_road():
    """Row 1. Night wind; a town far off, mostly gone in for the night. Also the
    coach stop at dawn, whose row forbids anything like picks: there are none.
    The team and the axle are the opening's (O-02-S2, R01-COACH-2)."""
    bed = Loop(11.5, 4101)
    bed.add(wind_tiled(bed), 1.0)
    bed.add(town_murmur(bed, 320, swell=0.5), 0.24)
    bed.at(far(lowpass(LATCH, 900), 900), bed.rnd.uniform(3, 9), 0.08)
    return bed.x


def bed_nugget_back():
    """Row 4. Wind on painted glass, dulled; the Nugget beyond the wall."""
    bed = Loop(11.5, 4104)
    bed.add(wind_tiled(bed, cut=380), 0.5)
    crowd = circ(bed.excerpt(CROWD), lambda y: wall(y, 380))
    bed.add(crowd / np.std(crowd), 0.55)
    for at in bed.times(2, 0.4):
        bed.at(wall(pick(bed.rnd, PLANK), 300), at, 0.25)
    return bed.x


def bed_street_muffled():
    """Rows 5 and 40. The street, muffled: the town's talk with the words gone,
    someone on the boardwalk now and then, a cart once. Nothing from the floor
    (row 5's never: the loose board is one hotspot's line)."""
    bed = Loop(12.0, 4105)
    bed.add(town_murmur(bed, 420), 0.32)
    bed.add(circ(bed.noise(60, 400, tilt=-3), lambda y: y) * gusts(bed), 0.12)
    walker(bed, 1.2, 8, BOARDWALK, 700, 0.5)
    walker(bed, 7.4, 6, BOARDWALK, 650, 0.35)
    cart(bed, 4.0, 5.5, 350, 0.18)
    return bed.x


def bed_assay_records():
    """Row 6. Picks, far off; the front office through the door -- the counter
    creaking when somebody leans on it."""
    bed = Loop(12.0, 4106)
    bed.add(bed.noise(50, 300, tilt=-4) * gusts(bed), 0.06)
    picks(bed, 3, 1400, 0.35)
    for at in bed.times(2, 0.3):
        bed.at(wall(CREAK, 700), at, 0.5)
    bed.add(town_murmur(bed, 260), 0.05)
    return bed.x


def bed_archive():
    """Row 8. The building settling; Main Street, muffled; a stamp through the
    door now and then, and another at exactly the same interval. No paper: the
    timesheet's LISTEN is paper (invariant 3), and a bed's paper would be its."""
    bed = Loop(12.0, 4108)
    bed.add(town_murmur(bed, 300), 0.12)
    cart(bed, 6.5, 6.0, 260, 0.12)
    settling(bed, 3, 5, 800, 0.6)
    stamp = wall(STAMP, 650)
    t0 = bed.rnd.uniform(1.0, 2.0)
    bed.at(stamp, t0, 0.55)
    bed.at(stamp, t0 + 1.6, 0.55)
    return bed.x


def layer_colonel_voices():
    """Row 10's layer. Voices shaped like laughter, through the Colonel's door:
    two voices in exchange and the approved laugh, through a well-hung door."""
    rnd = np.random.default_rng(4110)
    bed = Loop(9.0, 4111)
    v = wall(talk(rnd, 9.0, 2, base=(90, 130), gap=(0.6, 1.4), cut=600), 420)
    bed.at(v / (np.std(v) + 1e-12), 0.0, 0.5)
    bed.at(wall(LAUGH, 450), 5.2, 1.2)
    return bed.x


def bed_fanshawe_office():
    """Row 11. Main Street with the edges taken off; the lobby, faint, through
    the door -- the lobby's clock, wrong with authority."""
    bed = Loop(12.0, 4111)
    bed.add(town_murmur(bed, 520), 0.22)
    walker(bed, 2.0, 7, BOARDWALK, 500, 0.22)
    cart(bed, 7.0, 5.0, 320, 0.12)
    bed.add(wall(np.tile(CLOCK, 6)[:bed.n], 900), 0.12)
    return bed.x


def bed_mercantile():
    """Row 12. The doors still swinging -- the approved iron hinge, slower and
    smaller each time -- and the street beyond them."""
    bed = Loop(12.0, 4112)
    bed.add(town_murmur(bed, 650), 0.3)
    walker(bed, 6.0, 8, BOARDWALK, 1100, 0.35)
    cart(bed, 1.0, 5.0, 500, 0.12)
    at = bed.rnd.uniform(0.2, 0.6)
    for k, g in enumerate((0.35, 0.22, 0.14)):
        bed.at(lowpass(HINGE[k], 2400), at, g)
        at += len(HINGE[k]) / RATE * 1.2
    return bed.x


def bed_boot_hill():
    """Row 14. Wind in the rails and the grass; a little of the town, carried
    up the hill."""
    bed = Loop(11.5, 4114)
    w = wind_tiled(bed)
    bed.add(w, 1.0)
    grass = bed.noise(2000, 7000, tilt=-2) * gusts(bed, (2, 7), (0.55, 0.25))
    bed.add(grass, 0.18)
    bed.add(town_murmur(bed, 300, swell=0.6), 0.22)
    return bed.x


def bed_livery():
    """Row 15. Straw settling; warm boards creaking; wind through the gap."""
    bed = Loop(11.5, 4115)
    bed.add(circ(wind_tiled(bed), lambda y: bandpass(y, 200, 1400)), 0.35)
    rnd = bed.rnd
    for _ in range(26):
        n = n_of(rnd.uniform(0.03, 0.12))
        straw = highpass(rnd.normal(0, 1, n), 2500) * (rnd.random(n) < 0.3) * hann(n)
        bed.at(straw, rnd.uniform(0, bed.seconds), rnd.uniform(0.05, 0.16))
    for at in bed.times(3, 0.35):
        bed.at(lowpass(pick(rnd, [CREAK, SIGN[:n_of(1.0)]]), 900), at, rnd.uniform(0.3, 0.5))
    return bed.x


def layer_grievance():
    """Row 15's layer. Grievance breathing, slow and deliberate, while she is in
    her stall: a mule's long breath through the nose."""
    bed = Loop(8.0, 4116)
    breathing(bed, 4.0, 160, 1300, 1.0)
    return bed.x


def bed_tent():
    """Row 16. Canvas breathing; the pot at a murmur; the street arriving in
    pieces. No hum: the tent's hum is one hotspot's line, and it stays there."""
    bed = Loop(12.0, 4116)
    canvas(bed, 0.5, 3)
    f = circ(bed.rnd.normal(0, 1, bed.n), lambda y: lowpass(y, 9, order=2))
    simmer = bed.noise(250, 1100, tilt=-2) * (0.7 + 0.3 * np.abs(f) / (np.std(f) + 1e-12))
    bed.add(simmer, 0.05)
    street = town_murmur(bed, 650) * np.clip(gusts(bed, (3, 7), (0.9, 0.5)) - 0.9, 0, None)
    bed.add(street, 0.6)
    return bed.x


def bed_church():
    """Row 17. Wind thinned by the glass; wood easing. Never the bell."""
    bed = Loop(11.5, 4117)
    bed.add(circ(wind_tiled(bed), lambda y: bandpass(y, 300, 1500)), 0.6)
    settling(bed, 3, 4, 900, 0.5)
    return bed.x


def bed_hotel_lobby():
    """Row 18. The street, muffled; boots on the boardwalk; a cart going by,
    rarely (once in the loop)."""
    bed = Loop(18.0, 4118)
    bed.add(town_murmur(bed, 420), 0.28)
    walker(bed, 1.0, 9, BOARDWALK, 900, 0.55)
    walker(bed, 6.2, 6, BOARDWALK, 800, 0.4)
    walker(bed, 13.0, 8, BOARDWALK, 900, 0.5)
    cart(bed, 9.0, 6.0, 420, 0.22)
    return bed.x


def bed_thads_room():
    """Row 19. The town through the wall; a man passing in the hall, rarely
    (once in the loop): slow steps on the hall's boards, past the door."""
    bed = Loop(18.0, 4119)
    t = town_murmur(bed, 380)
    bed.add(circ(t, lambda y: wall(y, 380)) / (np.std(t) + 1e-12), 0.3)
    walker(bed, 8.0, 7, PLANK, 650, 0.6, pace=0.7)
    return bed.x


def bed_back_alley():
    """Row 20. A drip above, a ripple below; washing snapping in the wind; the
    street through two walls. Nothing from the shack."""
    bed = Loop(11.5, 4120)
    rnd = bed.rnd
    g = gusts(bed, (2, 5), (0.6, 0.3))
    bed.add(circ(wind_tiled(bed), lambda y: lowpass(y, 700)), 0.3)
    at = 0.4
    while at < bed.seconds:
        bed.at(drip(rnd), at, 0.4)
        n = n_of(0.25)
        ripple = bandpass(rnd.normal(0, 1, n), 300, 1400, order=1) * env(n, 0.01, 0.06)
        bed.at(ripple, at + 0.05, 0.12)
        at += rnd.uniform(1.4, 2.6)
    for at in bed.times(5, 0.3):
        if g[n_of(at) % bed.n] > 0.9:
            n = n_of(0.1)
            snap = bandpass(rnd.normal(0, 1, n), 350, 3200, order=1) * env(n, 0.002, 0.03)
            bed.at(snap, at, 0.5)
            bed.at(snap * 0.6, at + rnd.uniform(0.12, 0.2), 0.4)
    t = town_murmur(bed, 260)
    bed.add(circ(t, lambda y: wall(y, 260)), 0.08)
    return bed.x


def layer_cat():
    """Row 20's layer. The cat purring, while she is there: a fast flutter of
    breath (below where a pitch begins), in and out."""
    bed = Loop(6.0, 4121)
    rnd = bed.rnd
    k = np.arange(bed.n) / RATE
    flutter = np.clip(np.sin(2 * np.pi * 26 * k + 0.6 * np.sin(2 * np.pi * 0.5 * k)), 0, None) ** 3
    body = bed.noise(80, 700, tilt=-3) * flutter
    phase = (np.sin(2 * np.pi * k * 3 / bed.seconds) * 0.5 + 0.5) ** 0.7 * 0.8 + 0.2
    bed.add(body * phase, 1.0)
    return bed.x


def bed_watchmans_shack():
    """Row 21. The street, all of it, at a watchman's distance -- a door, boots,
    the talk -- and the alley outside. Nothing of the watchman's."""
    bed = Loop(11.5, 4121)
    rnd = bed.rnd
    bed.add(circ(wind_tiled(bed), lambda y: lowpass(y, 800)), 0.45)
    bed.add(town_murmur(bed, 520), 0.3)
    walker(bed, 3.0, 6, BOARDWALK, 700, 0.3)
    bed.at(far(lowpass(LATCH, 1200), 1200), 7.8, 0.3)
    for at in bed.times(2, 0.3):
        knock = formant_noise(rnd, 0.1, [(160, 1.0, 1.0, 0.03), (420, 1.0, 0.4, 0.012)])
        bed.at(knock, at, 0.25)
    return bed.x


def bed_claims_road():
    """Row 22. Wind down off the diggings; a bucket swinging on its rope; picks,
    distant; the town small and far: a door, a dog, the bell (the approved
    flat bell, far off, once in the loop)."""
    bed = Loop(23.0, 4122)
    rnd = bed.rnd
    bed.add(wind_tiled(bed), 1.0)
    picks(bed, 4, 1300, 0.22)
    at = 0.6
    while at < bed.seconds:
        bed.at(lowpass(SIGN[:n_of(0.7)], 1400), at, 0.12)
        knock = formant_noise(rnd, 0.08, [(420, 1.0, 1.0, 0.012), (1300, 1.0, 0.3, 0.004)])
        bed.at(knock, at + 0.5, 0.1)
        at += rnd.uniform(2.4, 3.1)
    bed.at(far(LATCH, 800), 4.5, 0.12)
    bed.at(dog_far(rnd), 11.0, 0.08)
    bed.at(lowpass(BELL_FAR, 1600), 15.5, 0.12)
    return bed.x


def bed_prosperity():
    """Row 23. Wind along the top; water over stones next door. No air from the
    hole (doc 45 rule 2): nothing here comes from it, and the raccoon's
    breathing, which would sit in its mouth, is not wired (invariant 3)."""
    bed = Loop(11.5, 4123)
    bed.add(wind_tiled(bed), 1.0)
    w = water(bed, 150, 3000, burble=1.2)
    bed.add(circ(w, lambda y: lowpass(y, 1400)) / (np.std(w) + 1e-12), 0.25)
    return bed.x


def bed_pratts_claim():
    """Row 25. Water, even and polite; canvas easing."""
    bed = Loop(12.0, 4125)
    w = water(bed, 120, 2600, burble=1.0, depth=0.25)
    bed.add(w / np.std(w), 0.4)
    canvas(bed, 0.25, 2, cut=500)
    return bed.x


def bed_creek():
    """Row 26. Water over stone and through the riffles: the creek, nearest and
    fullest of the waters. (The first one's grit ticking along the riffle bars
    is gone with its grains: it was part of what read as foil.)"""
    bed = Loop(12.0, 4126)
    w = water(bed, 60, 7000, burble=2.5, depth=0.5)
    bed.add(w / np.std(w), 0.6)
    return bed.x


def bed_claim_row():
    """Row 27. Wind across the shaft mouths, low; boards knocking out of time
    with each other; the road below, faint."""
    bed = Loop(11.5, 4127)
    rnd = bed.rnd
    g = gusts(bed, (2, 5), (0.55, 0.25))
    bed.add(circ(wind_tiled(bed), lambda y: lowpass(y, 450)), 0.7)
    bed.add(bed.noise(35, 180, tilt=-3) * g, 0.25)
    for period, size in ((1.9, 1.0), (2.7, 0.8)):
        at = rnd.uniform(0, period)
        while at < bed.seconds:
            if g[n_of(at) % bed.n] > 0.85:
                knock = formant_noise(rnd, 0.1, [(260, 1.0, 1.0, 0.016), (800, 1.0, 0.4, 0.006)])
                bed.at(knock, at, 0.22 * size * rnd.uniform(0.7, 1.1))
            at += period * rnd.uniform(0.9, 1.1)
    cart(bed, 5.0, 5.0, 300, 0.06)
    return bed.x


def layer_boundary_men():
    """Row 27's layer. Two men arguing, words unclear, while the boundary men
    are there: two voices answering each other, low-passed past any word."""
    rnd = np.random.default_rng(4128)
    bed = Loop(10.0, 4129)
    v = talk(rnd, 10.0, 2, base=(105, 160), gap=(0.1, 0.4), cut=800)
    bed.at(v / (np.std(v) + 1e-12), 0.0, 1.0)
    return bed.x


def bed_laundry():
    """Row 28. Water at the boil, cloth turning; iron set down and taken up;
    wind. The coppers are the room's own working noise (rule 2)."""
    bed = Loop(11.5, 4128)
    rnd = bed.rnd
    boil = water(bed, 60, 1400, burble=5.0, depth=0.35, burble_band=(120, 450))
    bed.add(boil / np.std(boil), 0.4)
    for at in bed.times(3, 0.3):
        n = n_of(1.2)
        turn = bandpass(rnd.normal(0, 1, n), 200, 1300, order=1) * np.sin(np.linspace(0, np.pi, n)) ** 2
        bed.at(turn, at, 0.35)
    for k in range(5):
        at = k * 2.3 + rnd.uniform(-0.08, 0.08)
        down = formant_noise(rnd, 0.15, [(180, 1.0, 1.0, 0.025), (700, 1.0, 0.6, 0.01), (2200, 1.0, 0.25, 0.004)])
        bed.at(down, at, 0.55)
        n = n_of(0.18)
        up = bandpass(rnd.normal(0, 1, n), 600, 2600, order=1) * np.sin(np.linspace(0, np.pi, n)) ** 2
        bed.at(up, at + 1.25, 0.15)
    bed.add(circ(wind_tiled(bed), lambda y: lowpass(y, 500)), 0.3)
    return bed.x


def bed_high_ridge():
    """Row 29. Wind with nothing to stop it; everything faint and mixed: the
    bell (far, once in the loop), picks, a dog."""
    bed = Loop(23.0, 4129)
    rnd = bed.rnd
    bed.add(wind_tiled(bed), 1.0)
    bed.add(bed.noise(300, 5000, tilt=-3) * gusts(bed, (3, 8), (0.7, 0.3)), 0.35)
    picks(bed, 3, 900, 0.12)
    bed.at(lowpass(BELL_FAR, 1200), 6.0, 0.08)
    bed.at(dog_far(rnd), 16.5, 0.05)
    return bed.x


def bed_motts_site():
    """Row 30. Wind in the workings, hollow; gravel trickling; mesh buzzing in
    the gusts; the bell, very thin, on the wind (once in the loop). Never THE
    STRIKE, which is score."""
    bed = Loop(23.0, 4130)
    rnd = bed.rnd
    g = gusts(bed, (4, 9), (0.6, 0.3))
    w = wind_tiled(bed, cut=900)
    hollow = w.copy()
    for d, a in ((0.019, 0.35), (0.031, 0.25), (0.047, 0.15)):
        hollow += a * np.roll(w, n_of(d))
    bed.add(hollow, 0.8)
    for _ in range(9):
        at = rnd.uniform(0, bed.seconds)
        for k in range(int(rnd.integers(4, 12))):
            n = n_of(0.02)
            stone = bandpass(rnd.normal(0, 1, n), 900, 4000, order=1) * env(n, 0.0004, 0.004)
            bed.at(stone, at + k * rnd.uniform(0.03, 0.12), rnd.uniform(0.04, 0.12))
    flutter = np.abs(circ(rnd.normal(0, 1, bed.n), lambda y: bandpass(y, 25, 60, order=1))) * 6
    mesh = bed.noise(800, 4000) * flutter * np.clip(g - 1.0, 0, None)
    bed.add(mesh, 0.25)
    bed.at(lowpass(BELL_FAR, 1000), 12.0, 0.05)
    return bed.x


def bed_funeral():
    """Row 31. Wind through the grass. The owl is cut (errata 206 F; Tyler:
    "sounds nothing like an owl. It sounds like something being raked on the
    ground"): the sky's LISTEN still hears it, and a bed may say less than
    LISTEN, never more."""
    bed = Loop(23.0, 4131)
    bed.add(wind_tiled(bed, cut=1500), 0.7)
    bed.add(bed.noise(2200, 7000, tilt=-2) * gusts(bed, (3, 8), (0.55, 0.25)), 0.16)
    return bed.x


def layer_mourners():
    """Row 31's layer. The mourners shuffling, and a cough, while they are
    there."""
    bed = Loop(10.0, 4132)
    rnd = bed.rnd
    for at in bed.times(5, 0.35):
        bed.at(shuffle(rnd), at, rnd.uniform(0.4, 0.8))
    bed.at(cough(rnd), 6.3, 0.5)
    return bed.x


def bed_company_vault():
    """Row 35. The mechanism breathing -- the room's own working noise (rule 2),
    oiled and huge -- and tin ticking with the temperature."""
    bed = Loop(12.0, 4135)
    rnd = bed.rnd
    breath = bed.swell([3], [0.55], phase=0.0)
    bed.add(bed.noise(30, 220, tilt=-4) * breath, 1.0)
    bed.add(bed.noise(200, 900, tilt=-4) * breath ** 2, 0.12)
    for at in bed.times(7, 0.45):
        n = n_of(0.02)
        tick = bandpass(rnd.normal(0, 1, n), 2000, 6000, order=1) * env(n, 0.0002, 0.003)
        bed.at(tick, at, rnd.uniform(0.25, 0.6))
    return bed.x


def bed_parlour():
    """Row 37. A good fire ticking -- the room's own working noise -- and boots
    overhead, taken off carefully, rarely (once in the loop): a few slow steps
    through the ceiling, and two boots set down."""
    bed = Loop(18.0, 4137)
    fire(bed, 0.35, 0.5)
    walker(bed, 9.0, 4, PLANK, 260, 0.9, pace=0.8)
    for k, at in enumerate((12.6, 14.1)):
        drop = formant_noise(bed.rnd, 0.12, [(150, 1.0, 1.0, 0.03), (420, 1.0, 0.3, 0.01)])
        bed.at(lowpass(drop, 300), at, 0.7)
    return bed.x


def lane_faint(bed, gain):
    """The Lane through a door or a window: a hush, the town's murmur far off,
    feet on the mud going past."""
    bed.add(bed.noise(60, 350, tilt=-3) * gusts(bed), gain * 0.25)
    bed.add(town_murmur(bed, 300), gain * 0.25)
    walker(bed, bed.rnd.uniform(1, 4), 6, DIRT, 600, gain * 0.5, pace=0.55)


def bed_photographers_studio():
    """Row 38. The Lane through the glass, faint; canvas stirring -- the painted
    backdrop flexing in the draft."""
    bed = Loop(12.0, 4138)
    lane_faint(bed, 1.0)
    canvas(bed, 0.12, 2, cut=450)
    return bed.x


def bed_bakehouse():
    """Row 39. The oven working -- the room's own working noise -- and dough
    being kneaded, every 1.25 s; and in the yard a cart being loaded: trays
    set down, a horse shifting, waiting for its load."""
    bed = Loop(10.0, 4139)
    rnd = bed.rnd
    bed.add(bed.noise(35, 260, tilt=-3) * bed.swell([1, 4], [0.1, 0.05]), 0.7)
    fire(bed, 0.0, 0.12, rate=1.5)
    for k in range(8):
        at = k * 1.25
        n = n_of(0.3)
        push = lowpass(rnd.normal(0, 1, n), 500) * np.sin(np.linspace(0, np.pi, n)) ** 2
        bed.at(push, at, 0.25)
        slap = formant_noise(rnd, 0.1, [(140, 1.0, 1.0, 0.03), (650, 1.0, 0.5, 0.012), (1800, 0.9, 0.2, 0.004)])
        bed.at(slap, at + 0.32, 0.5)
    yard = wall(np.concatenate([TEAM_HALTED[n_of(1.0):n_of(4.0)]]), 900)
    bed.at(yard, 2.0, 0.3)
    for at in (6.1, 7.4):
        tray = formant_noise(rnd, 0.1, [(300, 1.0, 1.0, 0.015), (1100, 1.0, 0.4, 0.005)])
        bed.at(lowpass(tray, 900), at, 0.18)
    return bed.x


def bed_schoolhouse():
    """Row 41. Hammering from town, far off."""
    bed = Loop(12.0, 4141)
    bed.add(bed.noise(60, 300, tilt=-3) * gusts(bed), 0.05)
    hammering(bed, 3, 1100, 0.6)
    return bed.x


def bed_barbers():
    """Row 42. The Lane, faint; leather creaking as it settles (the approved
    leather, the chair's)."""
    bed = Loop(12.0, 4142)
    lane_faint(bed, 1.0)
    for at in bed.times(2, 0.3):
        bed.at(LEATHER, at, 0.35)
    return bed.x


def bed_lower_street():
    """Row 43. Main Street a little way off, mostly the Nugget; wind from the
    diggings; a loose board knocking; horses shifting at the livery; small bells
    from the tent flap at the far end, rarely (once in the loop)."""
    bed = Loop(23.0, 4143)
    rnd = bed.rnd
    g = gusts(bed, (3, 7), (0.6, 0.3))
    bed.add(circ(wind_tiled(bed), lambda y: lowpass(y, 1600)), 0.6)
    t = bed.excerpt(np.tile(CROWD, 2))
    bed.add(circ(t, lambda y: lowpass(y, 900)) / (np.std(t) + 1e-12), 0.3)
    walker(bed, 3.0, 8, BOARDWALK, 1200, 0.25)
    walker(bed, 15.0, 7, BOARDWALK, 1200, 0.2)
    at = rnd.uniform(0, 2)
    while at < bed.seconds:
        if g[n_of(at) % bed.n] > 0.95:
            knock = formant_noise(rnd, 0.1, [(300, 1.0, 1.0, 0.016), (900, 1.0, 0.4, 0.006)])
            bed.at(knock, at, 0.3)
        at += rnd.uniform(1.8, 2.6)
    for at in (6.0, 18.5):
        bed.at(lowpass(TEAM_HALTED[n_of(at % 5):n_of(at % 5 + 3.0)], 1100), at, 0.25)
    bed.at(far(jingle(rnd), 3500), 11.5, 0.25)
    return bed.x


def bed_the_lane():
    """Row 44. Main Street through the gap, Lower Street at the other end, and a
    hush between; a plane on wood from the undertaker's (and nothing else from
    inside); bells on the tent's hem in the draft; a mule, faint, from the
    livery."""
    bed = Loop(11.5, 4144)
    rnd = bed.rnd
    bed.add(circ(wind_tiled(bed), lambda y: lowpass(y, 500)), 0.3)
    bed.add(town_murmur(bed, 700), 0.18)
    walker(bed, 8.0, 5, DIRT, 800, 0.2, pace=0.55)
    # The undertaker at his board, through his door: a stroke, the plane
    # carried back, the next; and once in the loop he stops, and starts again.
    at = 0.6
    for k in range(6):
        stroke = stroke_plane(rnd, rnd.uniform(0.6, 0.9))
        bed.at(wall(stroke, 2800), at, 0.12)
        at += len(stroke) / RATE + (rnd.uniform(2.2, 2.8) if k == 2 else rnd.uniform(0.55, 0.85))
    bed.at(far(jingle(rnd), 3000), 7.2, 0.15)
    bed.at(lowpass(TEAM_HALTED[n_of(2.0):n_of(4.5)], 700), 9.0, 0.18)
    return bed.x


BEDS = {
    'stage-road.wav': bed_stage_road,
    'nugget-back.wav': bed_nugget_back,
    'street-muffled.wav': bed_street_muffled,
    'assay-records.wav': bed_assay_records,
    'archive.wav': bed_archive,
    'colonel-voices.wav': layer_colonel_voices,
    'fanshawe-office.wav': bed_fanshawe_office,
    'mercantile.wav': bed_mercantile,
    'boot-hill.wav': bed_boot_hill,
    'livery.wav': bed_livery,
    'grievance-breathing.wav': layer_grievance,
    'tent.wav': bed_tent,
    'church.wav': bed_church,
    'hotel-lobby.wav': bed_hotel_lobby,
    'thads-room.wav': bed_thads_room,
    'back-alley.wav': bed_back_alley,
    'cat-purring.wav': layer_cat,
    'watchmans-shack.wav': bed_watchmans_shack,
    'claims-road.wav': bed_claims_road,
    'prosperity.wav': bed_prosperity,
    'pratts-claim.wav': bed_pratts_claim,
    'creek.wav': bed_creek,
    'claim-row.wav': bed_claim_row,
    'boundary-men.wav': layer_boundary_men,
    'laundry.wav': bed_laundry,
    'high-ridge.wav': bed_high_ridge,
    'motts-site.wav': bed_motts_site,
    'funeral.wav': bed_funeral,
    'mourners.wav': layer_mourners,
    'company-vault.wav': bed_company_vault,
    'parlour.wav': bed_parlour,
    'photographers-studio.wav': bed_photographers_studio,
    'bakehouse.wav': bed_bakehouse,
    'schoolhouse.wav': bed_schoolhouse,
    'barbers.wav': bed_barbers,
    'lower-street.wav': bed_lower_street,
    'the-lane.wav': bed_the_lane,
}


if __name__ == '__main__':
    import sys
    only = set(sys.argv[1:])
    for name, make in BEDS.items():
        if only and name not in only:
            continue
        save(name, finish(make()))
