"""
Doc 28 Part Six's everyday sounds, and the doc 45 cues that name them,
rendered offline (errata 49) the way Room 32's and Room 33's are.

    python3 tools/audio/render-everyday-sfx.py

THE AGENT THAT WROTE THIS CANNOT HEAR IT. Every claim below is about the
waveform; Tyler auditions all of it before any of it is wired to a cue. Not
wired by this: these are files, and the cue sheet's triggers come after the
ear has passed them.

Doc 28 Part Six, the essential list, and what answers each:

  footsteps by surface   step-{mud,boardwalk,plank,dirt}-{1..4}.wav
                         "the mud one is squelching because Room 1 and Main
                         Street are both mud". Four takes per surface, so a
                         walk never repeats a foot.
  doors                  batwing-swing-{1,2,3}.wav (R03-DOOR: one per visible
                         oscillation, each smaller), door-latch.wav (the assay
                         office's latch), door-locked.wav (R07/08-LOCK: "the
                         sound itself must communicate that it did not open")
  the team               team-moving.wav and team-halted.wav (O-02-S1, O-02-S2;
                         both loop without a seam), team-departing.wav (O-06B-S,
                         receding)
  the case               case-in-mud.wav (O-06-S1: the impact, and the fork
                         against the clasp at exactly A440)
  the flat church bell   church-bell.wav (R17-BELL, near) and
                         church-bell-distant.wav (R02-BELL). One fixed pitch:
                         a bell cast for D and half a step flat, so C-sharp,
                         exactly, every strike. It bypasses the score's -35.
  paper                  paper-light.wav (R03-HANDBILL), paper-ordinary.wav
                         (R05-QUEUE, R08-TIME: "one ordinary paper movement"),
                         paper-substantial.wav (R09-PAPER)
  the stamp              stamp.wav (U-STAMP)
  the Assay's pencil     pencil.wav (U-ASSAY-PENCIL)

And the other cues doc 45 specifies plainly enough to build:

  floorboard-creak.wav   R02-BOARD, R05-FLOOR-STEP: a board taking weight
  floorboard-hollow.wav  R05-FLOOR: "loose-plank movement with audible hollow
                         beneath"
  sign-creak.wav         R01-SIGN-1/2: "one wooden sign creak"
  leather-settle.wav     R11-CHAIRS: "one leather-settling sound"
  clock-tick.wav         R07-A: Sump's clock, a seamless loop
  wind.wav               R02-A: "wind through false fronts", a seamless loop
  press-cycle.wav        R09-PRESS: "press mechanism with knock on return
                         stroke", one stroke, loops

Left out on purpose: R03-A's "indistinct talk" and R01-WEST-3's laugh are
human voices, which synthesis does badly and which want recordings; the
spittoon waits on OQ-11.

THE OUTPUT STAGE MATCHES THE SCORE'S: rolled off at 11 kHz, as the music
proof's master chain is, so a door and a fiddle sound like the same machine.

Deterministic: seeded, so a re-render is the same bytes.
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

RATE = 44100
OUT = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'
rng = np.random.default_rng(28)


# ---------------------------------------------------------------- helpers

def n_of(seconds):
    return int(round(seconds * RATE))


def t(seconds):
    return np.arange(n_of(seconds)) / RATE


def lowpass(x, hz, order=4):
    return sosfilt(butter(order, hz, 'low', fs=RATE, output='sos'), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=RATE, output='sos'), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=RATE, output='sos'), x)


def noise(seconds):
    return rng.normal(0, 1, n_of(seconds))


def env(n, attack, decay):
    k = np.arange(n) / RATE
    return np.minimum(1, k / max(attack, 1e-4)) * np.exp(-k / decay)


def place(dest, src, at, gain=1.0):
    """Adds src into dest starting at `at` seconds, clipped to dest."""
    i = n_of(at)
    if i < 0:
        src, i = src[-i:], 0
    if i >= len(dest):
        return dest
    m = min(len(src), len(dest) - i)
    dest[i:i + m] += gain * src[:m]
    return dest


def modes(seconds, table, decay, detune=0.03):
    """Struck resonant modes: (freq, amp) pairs, each decaying."""
    x = t(seconds)
    out = np.zeros_like(x)
    for freq, amp in table:
        f = freq * (1 + rng.uniform(-detune, detune))
        out += amp * np.sin(2 * np.pi * f * x + rng.uniform(0, 6.28)) * np.exp(-x / (decay * rng.uniform(0.8, 1.2)))
    return out


def click(seconds, cutoff, decay):
    return lowpass(noise(seconds), cutoff) * env(n_of(seconds), 0.0004, decay)


def creak(seconds, rate_from, rate_to, lo, hi, roughness=0.25):
    """Stick-slip: a train of tiny impulses whose rate glides, rung through
    the wood. This is what a creak is, physically -- the board catching and
    letting go faster or slower as the weight moves."""
    n = n_of(seconds)
    out = np.zeros(n)
    rates = np.geomspace(rate_from, rate_to, n)
    phase = 0.0
    for i in range(n):
        phase += rates[i] / RATE
        if phase >= 1:
            phase -= 1 + rng.uniform(-roughness, roughness) * 0.2
            out[i] = rng.uniform(0.5, 1.0)
    body = bandpass(out, lo, hi)
    body = bandpass(body, lo * 0.9, hi * 1.1)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 0.6
    return body * shape


def periodic_noise(period, lo, hi):
    """Band-limited noise that is exactly periodic in `period` seconds: built in
    the frequency domain on a buffer one period long, so its end runs straight
    into its start. A continuous bed (a wheel's rumble) folded like a release
    would instead jump at the seam, where two unrelated noises meet."""
    n = n_of(period)
    spec = np.fft.rfft(rng.normal(0, 1, n))
    freqs = np.fft.rfftfreq(n, 1 / RATE)
    spec[(freqs < lo) | (freqs > hi)] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.std(x) + 1e-9)


def loopable(x, period):
    """Folds everything past `period` back over the start, the way the music
    renderer folds a release: a sound still sounding when the loop ends is
    still sounding when it comes round."""
    p = n_of(period)
    body = x[:p].copy()
    rest = x[p:]
    body[:min(len(rest), p)] += rest[:p]
    return body


def finish(x, peak=0.8, fade=0.015, loop=False):
    x = x - np.mean(x)
    if loop:
        # Filter it as the circle it is: run the filter in over the loop's own
        # end first, so sample 0 follows the last sample instead of following
        # silence. Filtered from rest, a loop starts with a step at its seam.
        pad = n_of(0.05)
        x = lowpass(np.concatenate([x[-pad:], x]), 11000, order=2)[pad:]
    else:
        x = lowpass(x, 11000, order=2)
    if not loop:
        f = n_of(fade)
        x[-f:] *= np.linspace(1, 0, f)
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def save(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(OUT / name), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(data.tobytes())
    print(f'{name:28s} {len(x) / RATE:5.2f}s')


# ---------------------------------------------------------------- footsteps

def step_mud():
    """A squelch: the boot's low thud into wet ground, then the suction as it
    pulls free -- a few bubbles bursting, rising in pitch."""
    d = 0.55
    x = np.zeros(n_of(d))
    thud = lowpass(noise(0.2), 320) * env(n_of(0.2), 0.006, 0.05)
    place(x, thud, 0, 1.0)
    smack = bandpass(noise(0.08), 600, 2200) * env(n_of(0.08), 0.002, 0.018)
    place(x, smack, 0.004, 0.35)
    lift = rng.uniform(0.12, 0.2)
    for _ in range(rng.integers(3, 6)):
        dur = rng.uniform(0.012, 0.03)
        k = t(dur)
        f0, f1 = rng.uniform(250, 450), rng.uniform(700, 1300)
        chirp = np.sin(2 * np.pi * (f0 * k + (f1 - f0) * k * k / (2 * dur))) * np.hanning(len(k))
        place(x, chirp, lift + rng.uniform(0, 0.12), rng.uniform(0.15, 0.35))
    suck = bandpass(noise(0.18), 300, 1400) * env(n_of(0.18), 0.03, 0.05)
    place(x, suck, lift, 0.4)
    return finish(x, peak=0.7)


def step_wood(hollow):
    """Heel, then toe, on a board. A boardwalk is raised over the mud, so it
    rings lower and longer than a floor laid on joists indoors."""
    d = 0.4
    x = np.zeros(n_of(d))
    table = [(165, 1.0), (390, 0.5), (910, 0.22), (1700, 0.08)] if hollow else \
            [(230, 1.0), (580, 0.4), (1400, 0.16), (2600, 0.06)]
    decay = 0.075 if hollow else 0.04
    for at, g in ((0.0, 1.0), (rng.uniform(0.045, 0.07), 0.55)):
        hit = modes(0.3, [(f * rng.uniform(0.97, 1.03), a) for f, a in table], decay) * env(n_of(0.3), 0.001, 0.3)
        place(x, hit, at, g)
        place(x, click(0.03, 3000, 0.004), at, 0.5 * g)
    return finish(x, peak=0.7)


def resonate(excite, table, rnd):
    """Rings an excitation through a bank of damped two-pole resonators --
    modal synthesis. Unlike modes(), which adds clean sine waves (and made the
    first boardwalk sound like a drum), the noise that strikes the board is
    what rings, so the result has wood's dry, unpitched grain."""
    out = np.zeros(len(excite))
    for freq, amp, decay in table:
        f = freq * rnd.uniform(0.96, 1.04)
        r = np.exp(-1 / (decay * RATE))
        w = 2 * np.pi * f / RATE
        out += amp * (1 - r) * lfilter([1], [1, -2 * r * np.cos(w), r * r], excite)
    return out


def dry_creak(rnd, seconds, rate_from, rate_to, lo, hi):
    """creak(), on a private random stream: a board flexing on its nails."""
    n = n_of(seconds)
    rates = np.geomspace(rate_from, rate_to, n)
    out = np.zeros(n)
    phase = 0.0
    for i in range(n):
        phase += rates[i] / RATE
        if phase >= 1:
            phase -= 1 + rnd.uniform(-0.3, 0.3) * 0.25
            out[i] = rnd.uniform(0.4, 1.0)
    body = bandpass(bandpass(out, lo, hi), lo * 0.9, hi * 1.1)
    return body * np.sin(np.linspace(0, np.pi, n)) ** 0.7


def wood_step(rnd, hollow):
    """TYLER, 2026-11-06, twice. The first boards rang pure sines (a drum);
    the second rang resonators (glass bottles). "Creaky dry wood that thuds."

    So nothing here rings at a pitch. Dry wood damps itself almost at once,
    and a footstep on it is three things, all noise, none tonal:
      the thud    -- the weight landing: low noise, the main body of the sound
      the tok     -- the heel on the board's face: a broad mid band of noise
                     that is over in under ten milliseconds
      the creak   -- the board flexing on its nails as the weight rolls
                     forward: stick-slip, dry, short
    The boardwalk is hollow underneath, so its thud is lower and a little
    longer and it creaks on most steps; the plank floor is laid tight, so
    its thud is short and muted and it creaks rarely and faintly."""
    d = 0.5
    x = np.zeros(n_of(d))
    thud_cut, thud_decay = (170, 0.045) if hollow else (220, 0.022)
    for at, g in ((0.0, 1.0), (rnd.uniform(0.05, 0.075), 0.5)):
        thud = lowpass(rnd.normal(0, 1, n_of(0.25)), thud_cut, order=4) * env(n_of(0.25), 0.003, thud_decay)
        place(x, thud, at, 1.0 * g)
        tok = bandpass(rnd.normal(0, 1, n_of(0.05)), 350, 1800, order=1) * env(n_of(0.05), 0.0008, 0.007)
        place(x, tok, at, 0.55 * g)
    if hollow:
        place(x, lowpass(rnd.normal(0, 1, n_of(0.2)), 110, order=4) * env(n_of(0.2), 0.01, 0.06), 0.005, 0.5)
    creaks = rnd.random() < (0.75 if hollow else 0.3)
    if creaks:
        dur = rnd.uniform(0.12, 0.22)
        c = dry_creak(rnd, dur, rnd.uniform(25, 40), rnd.uniform(60, 110), 250, 1100)
        place(x, c, rnd.uniform(0.08, 0.14), (0.9 if hollow else 0.35) * rnd.uniform(0.8, 1.1))
    return finish(highpass(lowpass(x, 4500), 50), peak=0.7)


def step_boardwalk(rnd):
    return wood_step(rnd, hollow=True)


def step_plank(rnd):
    return wood_step(rnd, hollow=False)


def step_dirt():
    """Packed dirt and grit: a dull pat and a crunch of small stones."""
    d = 0.35
    x = np.zeros(n_of(d))
    place(x, lowpass(noise(0.15), 260) * env(n_of(0.15), 0.004, 0.035), 0, 1.0)
    for _ in range(rng.integers(25, 45)):
        size = int(rng.integers(40, 220))
        grain = rng.normal(0, 1, size) * np.exp(-np.arange(size) / (size / 5))
        place(x, grain, abs(rng.normal(0.02, 0.035)), rng.uniform(0.05, 0.25))
    return finish(bandpass(x, 90, 6000), peak=0.6)


# ---------------------------------------------------------------- doors

def batwing(size):
    """One swing of a saloon batwing: air moved by the leaf, a dry iron
    hinge complaining as it turns, and the leaves brushing as they pass.
    `size` 1..0 -- each oscillation smaller than the last."""
    d = 0.5 + 0.5 * size
    x = np.zeros(n_of(d))
    k = t(d)
    sweep = np.sin(np.pi * k / d) ** 2
    air = bandpass(noise(d), 300, 2200) * sweep
    place(x, air, 0, 0.25 * size)
    hinge_len = d * 0.7
    hk = t(hinge_len)
    f = 700 + 500 * size + 180 * np.sin(np.pi * hk / hinge_len)
    squeal = np.sign(np.sin(2 * np.pi * np.cumsum(f) / RATE)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f * 2.01) / RATE) * 0.3
    squeal = bandpass(squeal, 800, 3500) * np.sin(np.pi * hk / hinge_len) ** 1.5
    squeal *= (0.5 + 0.5 * (rng.random(len(hk)) > 0.15))  # it catches
    place(x, lowpass(squeal, 3500), d * 0.1, 0.35 * size ** 1.3)
    place(x, modes(0.2, [(320, 1), (760, 0.4)], 0.03) * env(n_of(0.2), 0.001, 0.2), d * 0.5, 0.3 * size)
    return finish(x, peak=0.55 * (0.5 + 0.5 * size))


def batwing_hinge(size, rnd):
    """TYLER, 2026-11-06: the first batwings squealed like a gull. A batwing
    hangs on a spring hinge of iron, dry and a little rusted: as the leaf swings
    out and back the pin grinds, and that grinding is a creak -- stick-slip,
    pulses that speed up and slow down with the swing -- rung through the
    iron's few hard resonances and the leaf's wood. No pitched tone at all.
    Air moved by the leaf under it, and a soft wooden tap where the two leaves
    pass. `size` 1..0: each oscillation smaller and shorter than the last."""
    d = 0.45 + 0.55 * size
    x = np.zeros(n_of(d))
    n = n_of(d)
    k = np.arange(n) / RATE
    # the swing's speed: out and back, so the creak's rate rises and falls twice
    speed = np.abs(np.sin(2 * np.pi * k / d))
    rate = 18 + 70 * size * speed
    pulses = np.zeros(n)
    phase = 0.0
    for i in range(n):
        phase += rate[i] / RATE
        if phase >= 1:
            phase -= 1 + rnd.uniform(-0.25, 0.25) * 0.3
            pulses[i] = rnd.uniform(0.4, 1.0) * speed[i]
    iron = resonate(pulses, [(430, 1.0, 0.020), (980, 0.8, 0.014), (1720, 0.5, 0.010),
                             (2650, 0.3, 0.006)], rnd)
    leaf = resonate(pulses, [(210, 1.0, 0.012), (520, 0.6, 0.010)], rnd)
    place(x, iron * 30 + leaf * 15, 0, 0.9 * size ** 0.8)
    air = bandpass(rnd.normal(0, 1, n), 250, 1500) * speed ** 2
    place(x, air, 0, 0.06 * size)
    tap = resonate(np.concatenate([rnd.normal(0, 1, n_of(0.003)), np.zeros(n_of(0.1))]),
                   [(340, 1.0, 0.02), (820, 0.6, 0.012), (1600, 0.3, 0.007)], rnd)
    place(x, tap, d * 0.5, 25 * size)
    return finish(x, peak=0.55 * (0.5 + 0.5 * size))


def door_latch():
    """A thumb latch: the bar lifts with a light metal tick, the door gives,
    the bar drops home with a clack."""
    x = np.zeros(n_of(0.9))
    metal = [(2150, 1.0), (3420, 0.6), (5230, 0.35)]
    place(x, modes(0.15, metal, 0.02) * env(n_of(0.15), 0.0005, 0.15), 0.0, 0.5)
    place(x, lowpass(noise(0.25), 500) * env(n_of(0.25), 0.03, 0.08), 0.12, 0.35)       # the door gives
    place(x, modes(0.3, [(1900, 1.0), (3100, 0.7), (4700, 0.4)], 0.04) * env(n_of(0.3), 0.0005, 0.3), 0.42, 0.9)
    place(x, modes(0.3, [(210, 1), (520, 0.4)], 0.05) * env(n_of(0.3), 0.001, 0.3), 0.42, 0.5)
    return finish(x, peak=0.7)


def door_locked():
    """Somebody tries it and it does not open: the latch lifts, the door
    shoves an eighth of an inch and stops dead against the bolt, twice, the
    second harder. No give, no swing -- the sound has to say no."""
    x = np.zeros(n_of(1.3))
    place(x, modes(0.12, [(2150, 1.0), (3420, 0.6)], 0.018) * env(n_of(0.12), 0.0005, 0.12), 0.0, 0.4)
    for at, g in ((0.18, 0.75), (0.62, 1.0)):
        thump = modes(0.35, [(140, 1.0), (330, 0.6), (780, 0.25)], 0.06) * env(n_of(0.35), 0.002, 0.35)
        rattle = modes(0.25, [(1650, 1.0), (2480, 0.7), (3900, 0.4)], 0.025) * env(n_of(0.25), 0.0005, 0.25)
        place(x, thump, at, g)
        place(x, rattle, at + 0.004, 0.5 * g)
        place(x, rattle, at + 0.03, 0.25 * g)
    return finish(x, peak=0.8)


# ---------------------------------------------------------------- the team

STRIDE = 1.15     # a walking horse's stride, seconds


def hoof_mud():
    h = lowpass(noise(0.25), 240) * env(n_of(0.25), 0.004, 0.045)
    h += 0.25 * bandpass(noise(0.25), 500, 1600) * env(n_of(0.25), 0.03, 0.06)
    return h


def harness_clink():
    return modes(0.25, [(rng.uniform(2800, 4200), 1.0), (rng.uniform(5000, 6500), 0.5)], 0.03) * env(n_of(0.25), 0.0005, 0.25)


def team(seconds, moving=True):
    """Two horses walking a coach through mud: eight footfalls per stride
    between them, never quite in step; harness jingling on the footfalls;
    the wheels' low rumble and an axle that squeaks once a turn."""
    x = np.zeros(n_of(seconds + 1.5))
    if moving:
        for horse, offset in ((0, 0.0), (1, 0.31)):
            at = offset
            while at < seconds:
                for k, frac in enumerate((0, 0.25, 0.5, 0.75)):
                    when = at + frac * STRIDE + rng.normal(0, 0.012)
                    place(x, hoof_mud(), when, rng.uniform(0.6, 0.9))
                    if rng.random() < 0.45:
                        place(x, harness_clink(), when + 0.02, rng.uniform(0.05, 0.14))
                at += STRIDE
        k = t(seconds + 1.5)
        turns = seconds / max(1, round(seconds / 0.9))       # a whole number of wheel turns per loop
        rumble = np.tile(periodic_noise(seconds, 20, 140), 2)[:len(x)] * (0.8 + 0.2 * np.sin(2 * np.pi * k / turns))
        x += 0.12 * rumble
        at = 0.4
        while at < seconds:
            sq = t(0.28)
            f = 620 + 90 * np.sin(np.pi * sq / 0.28)
            tone = np.sin(2 * np.pi * np.cumsum(f) / RATE) * np.sin(np.pi * sq / 0.28) ** 2
            place(x, bandpass(tone + 0.3 * np.sign(tone), 500, 2500), at, 0.06)
            at += 1.6
    else:
        # standing: each horse breathes out through the nose every few seconds,
        # shifts a hoof now and then, and the harness moves when it does.
        for horse, offset, period in ((0, 0.3, 3.6), (1, 2.0, 4.1)):
            at = offset
            while at < seconds:
                dur = rng.uniform(0.7, 1.1)
                breath = bandpass(noise(dur), 180, 900) * np.sin(np.linspace(0, np.pi, n_of(dur))) ** 1.5
                breath += 0.4 * lowpass(noise(dur), 120) * np.sin(np.linspace(0, np.pi, n_of(dur))) ** 2
                place(x, breath, at, rng.uniform(0.35, 0.5))
                if rng.random() < 0.6:
                    place(x, harness_clink(), at + rng.uniform(0.1, 0.5), rng.uniform(0.06, 0.12))
                at += period * rng.uniform(0.9, 1.1)
        place(x, hoof_mud(), 5.3, 0.5)
        place(x, harness_clink(), 5.33, 0.12)
    return x


def team_departing():
    """The moving team, pulling away: quieter, and the highs going first, the
    way a sound recedes."""
    d = 5.0
    x = team(d)[:n_of(d)]
    k = t(d)
    near = x * np.exp(-k / 1.6)
    far = lowpass(x, 900) * np.exp(-k / 2.6) * 0.8
    blend = np.clip(k / d, 0, 1)
    return finish(near * (1 - blend) + far * blend, peak=0.7)


# ---------------------------------------------------------------- the case

def case_in_mud():
    """O-06-S1: a leather case dropped flat into mud -- a heavy wet thump --
    and inside it the tuning fork knocks the clasp and rings. A440, exactly:
    the one correct pitch in the game, faint, under the mud."""
    d = 3.5
    x = np.zeros(n_of(d))
    place(x, lowpass(noise(0.4), 200) * env(n_of(0.4), 0.004, 0.08), 0, 1.0)
    place(x, bandpass(noise(0.3), 400, 1800) * env(n_of(0.3), 0.01, 0.07), 0.01, 0.35)
    place(x, modes(0.3, [(260, 1.0), (640, 0.4)], 0.04) * env(n_of(0.3), 0.001, 0.3), 0.005, 0.4)
    k = t(3.0)
    fork = np.sin(2 * np.pi * 440.0 * k) * np.exp(-k / 1.1)              # exactly 440, no detune
    fork += 0.1 * np.sin(2 * np.pi * 440.0 * 6.27 * k) * np.exp(-k / 0.04)
    place(x, fork, 0.03, 0.09)
    return finish(x, peak=0.8)


# ---------------------------------------------------------------- the bell

BELL_STRIKE = 440.0 * 2 ** ((61 - 69) / 12)   # C-sharp 4: cast for D, half a step flat


def bell(distant):
    """A hand-struck church bell. Partials in a bell's ratios -- hum, prime,
    minor third, fifth, nominal -- each ringing down at its own rate, the hum
    longest. Its pitch is fixed and never passes through the score's detune:
    it is wrong by the same amount every time."""
    d = 9.0
    k = t(d)
    f = BELL_STRIKE
    parts = [(0.5, 1.0, 7.0), (1.0, 0.8, 4.5), (1.2, 0.55, 3.2), (1.5, 0.35, 2.2),
             (2.0, 0.6, 2.4), (2.5, 0.25, 1.2), (3.0, 0.18, 0.9), (4.07, 0.12, 0.5)]
    x = np.zeros_like(k)
    for ratio, amp, decay in parts:
        beat = 1 + 0.0015 * rng.uniform(-1, 1)   # a cast bell's slight doublets
        x += amp * np.sin(2 * np.pi * f * ratio * k) * np.exp(-k / decay)
        x += 0.3 * amp * np.sin(2 * np.pi * f * ratio * beat * k) * np.exp(-k / decay)
    strike = bandpass(noise(0.06), 1500, 6000) * env(n_of(0.06), 0.0005, 0.01)
    x[:len(strike)] += 0.6 * strike
    x *= np.minimum(1, k / 0.002)
    if distant:
        x = lowpass(x, 2500)
        echo = np.zeros_like(x)
        for delay, g in ((0.11, 0.35), (0.23, 0.2), (0.41, 0.12)):
            place(echo, x, delay, g)
        x = (x + echo) * 0.6
        return finish(x, peak=0.45)
    return finish(x, peak=0.8)


# ---------------------------------------------------------------- paper, stamp, pencil

def paper(weight):
    """Paper handled: a crackle of small folds over a breathy rustle. Heavier
    paper -- a newspaper's back editions -- is longer and lower."""
    d = {'light': 0.4, 'ordinary': 0.65, 'substantial': 1.1}[weight]
    lo = {'light': 2200, 'ordinary': 1600, 'substantial': 900}[weight]
    x = np.zeros(n_of(d))
    shape = np.sin(np.linspace(0, np.pi, n_of(d))) ** 0.8
    x += bandpass(noise(d), lo, 9000) * shape * 0.35
    for _ in range(int(d * {'light': 60, 'ordinary': 70, 'substantial': 55}[weight])):
        size = int(rng.integers(30, 160))
        crack = rng.normal(0, 1, size) * np.exp(-np.arange(size) / (size / 4))
        place(x, crack, rng.uniform(0.02, d * 0.9), rng.uniform(0.1, 0.6))
    if weight == 'substantial':
        place(x, lowpass(noise(0.3), 300) * env(n_of(0.3), 0.01, 0.06), d * 0.75, 0.6)   # the pile settles
    return finish(highpass(x, lo * 0.5), peak=0.55)


def stamp():
    """A rubber stamp brought down on a document on a wooden counter: the
    slap of rubber on paper and the desk's thump under it, then the small
    unsticking as it lifts."""
    x = np.zeros(n_of(0.6))
    place(x, modes(0.4, [(150, 1.0), (370, 0.6), (820, 0.25)], 0.06) * env(n_of(0.4), 0.001, 0.4), 0, 1.0)
    place(x, bandpass(noise(0.05), 900, 4500) * env(n_of(0.05), 0.0005, 0.008), 0, 0.8)
    place(x, bandpass(noise(0.04), 2500, 7000) * env(n_of(0.04), 0.004, 0.01), 0.24, 0.15)
    return finish(x, peak=0.85)


def pencil():
    """A judge's mark: a short tick and a scratched line, graphite on paper."""
    x = np.zeros(n_of(0.6))
    for at, dur in ((0.0, 0.07), (0.12, 0.28)):
        k = n_of(dur)
        stroke = bandpass(noise(dur), 2500, 8000) * np.sin(np.linspace(0, np.pi, k)) ** 0.6
        stroke *= 0.7 + 0.3 * np.sin(2 * np.pi * 37 * np.arange(k) / RATE)   # the grain of the paper
        place(x, stroke, at, 0.6)
        place(x, click(0.02, 4000, 0.002), at, 0.3)
    return finish(x, peak=0.5)


# ---------------------------------------------------------------- wood under weight

def floorboard_creak():
    x = np.zeros(n_of(0.8))
    place(x, creak(0.55, 35, 140, 380, 1500), 0.02, 1.0)
    place(x, modes(0.2, [(190, 1.0), (470, 0.4)], 0.04) * env(n_of(0.2), 0.002, 0.2), 0.0, 0.5)
    return finish(x, peak=0.6)


def floorboard_hollow():
    """The proud board pressed and let go: it rocks, knocks, and the space
    under it answers -- a low, boxy resonance the solid floor does not have."""
    x = np.zeros(n_of(1.2))
    place(x, creak(0.35, 50, 110, 400, 1400), 0.0, 0.6)
    knock = modes(0.9, [(110, 1.0), (165, 0.7), (230, 0.5), (520, 0.25)], 0.22) * env(n_of(0.9), 0.002, 0.9)
    place(x, knock, 0.3, 1.0)
    place(x, click(0.03, 2500, 0.004), 0.3, 0.4)
    place(x, modes(0.6, [(115, 0.8), (240, 0.4)], 0.15) * env(n_of(0.6), 0.002, 0.6), 0.62, 0.45)
    return finish(x, peak=0.75)


def sign_creak():
    """A painted sign on two iron hooks, swinging once each way."""
    x = np.zeros(n_of(1.6))
    place(x, creak(0.6, 18, 60, 700, 2200, roughness=0.4), 0.0, 1.0)
    place(x, creak(0.5, 55, 20, 650, 2000, roughness=0.4), 0.8, 0.7)
    return finish(x, peak=0.5)


def leather_settle():
    x = np.zeros(n_of(1.0))
    place(x, creak(0.7, 25, 70, 160, 700, roughness=0.5), 0.0, 1.0)
    place(x, lowpass(noise(0.5), 400) * np.sin(np.linspace(0, np.pi, n_of(0.5))), 0.1, 0.25)
    return finish(x, peak=0.5)


# ---------------------------------------------------------------- loops

def clock_tick():
    """Sump's clock: a tick and a slightly lower tock, a second apart, in a
    wooden case. Two seconds, and it loops exactly."""
    x = np.zeros(n_of(2.6))
    for at, pitch in ((0.0, 1.0), (1.0, 0.86)):
        tick = modes(0.12, [(3100 * pitch, 1.0), (4700 * pitch, 0.5)], 0.006) * env(n_of(0.12), 0.0003, 0.12)
        box = modes(0.15, [(520 * pitch, 1.0), (1150 * pitch, 0.4)], 0.025) * env(n_of(0.15), 0.001, 0.15)
        place(x, tick, at, 0.6)
        place(x, box, at, 0.4)
    return finish(loopable(x, 2.0), peak=0.4, loop=True)


def wind():
    """Wind through false fronts: a low moving rush, and now and then a thin
    whistle where it finds a gap between the boards. Twelve seconds, looped."""
    d = 12.0
    k = t(d + 2)
    base = lowpass(noise(d + 2), 600)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * k / 6.0) * np.sin(2 * np.pi * k / 4.0 + 1.0)
    x = base * swell
    for at, dur, f in ((2.0, 2.4, 930), (7.5, 3.0, 1180)):
        w = bandpass(noise(dur), f * 0.97, f * 1.03, order=2) * np.sin(np.linspace(0, np.pi, n_of(dur))) ** 2
        place(x, w, at, 1.6)
    x = loopable(x, d)
    # make the loop's ends meet: a short crossfade from the end into the head
    f = n_of(0.5)
    x[:f] = x[:f] * np.linspace(0, 1, f) + x[-f:] * np.linspace(1, 0, f)
    x = x[:-f]
    return finish(x, peak=0.35, loop=True)


def press_cycle():
    """One stroke of a hand press: the bar pulled (a creak), the platen
    coming down on the forme (a heavy thump), and on the way back up the
    knock -- doc 05's "the knock again, on the return". Loops."""
    d = 2.4
    x = np.zeros(n_of(d + 0.8))
    place(x, creak(0.45, 30, 90, 300, 1200), 0.0, 0.5)
    place(x, modes(0.5, [(95, 1.0), (210, 0.6), (480, 0.3)], 0.08) * env(n_of(0.5), 0.002, 0.5), 0.45, 1.0)
    place(x, click(0.05, 2000, 0.01), 0.45, 0.5)
    place(x, creak(0.35, 80, 40, 300, 1000), 1.0, 0.35)
    place(x, modes(0.3, [(620, 1.0), (1350, 0.5), (2300, 0.2)], 0.03) * env(n_of(0.3), 0.0008, 0.3), 1.4, 0.75)
    return finish(loopable(x, d), peak=0.7, loop=True)


# ---------------------------------------------------------------- render

if __name__ == '__main__':
    for surface in ('mud', 'boardwalk', 'plank', 'dirt'):
        for i in range(1, 5):
            take = {'mud': step_mud, 'dirt': step_dirt}.get(surface)
            if surface == 'boardwalk':
                # The first boardwalk (step_wood(True)) is replaced, but it still
                # draws its random numbers here, so every sound after it keeps the
                # exact bytes Tyler approved on 2026-11-06. The new one has its own.
                step_wood(True)
                save(f'step-boardwalk-{i}.wav', step_boardwalk(np.random.default_rng(1000 + i)))
                continue
            if surface == 'plank':
                step_wood(False)   # replaced 2026-11-06; still draws its numbers (see the boardwalk)
                save(f'step-plank-{i}.wav', step_plank(np.random.default_rng(1100 + i)))
                continue
            save(f'step-{surface}-{i}.wav', take())
    for i, size in enumerate((1.0, 0.6, 0.3), start=1):
        batwing(size)   # the replaced gull, still drawing its numbers (see the boardwalk)
        save(f'batwing-swing-{i}.wav', batwing_hinge(size, np.random.default_rng(2000 + i)))
    save('door-latch.wav', door_latch())
    save('door-locked.wav', door_locked())
    save('team-moving.wav', finish(loopable(team(STRIDE * 6), STRIDE * 6), peak=0.7, loop=True))
    save('team-halted.wav', finish(loopable(team(8.0, moving=False), 8.0), peak=0.6, loop=True))
    save('team-departing.wav', team_departing())
    save('case-in-mud.wav', case_in_mud())
    save('church-bell.wav', bell(False))
    save('church-bell-distant.wav', bell(True))
    for weight in ('light', 'ordinary', 'substantial'):
        save(f'paper-{weight}.wav', paper(weight))
    save('stamp.wav', stamp())
    save('pencil.wav', pencil())
    save('floorboard-creak.wav', floorboard_creak())
    save('floorboard-hollow.wav', floorboard_hollow())
    save('sign-creak.wav', sign_creak())
    save('leather-settle.wav', leather_settle())
    save('clock-tick.wav', clock_tick())
    save('wind.wav', wind())
    save('press-cycle.wav', press_cycle())
