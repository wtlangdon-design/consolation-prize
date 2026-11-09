"""
Fiddler's Gulch's room beds, the washout to the ledge (doc 45, "Rooms 45-54"; errata 195), rendered offline like the
room ones, with tools/audio/render-room-sfx.py's own helpers.

    python3 tools/audio/render-gulch-sfx.py

    washout-bed.wav   R45-A: wind over the slide; a trickle working through it; now and then a stone ticking down (loops)
    mine-bed.wav      R46-49-A: drips at random intervals, cool moving air (loops). ONE FILE FOR ALL FOUR MINE ROOMS, at
                      one level, carried across them (doc 45), so nothing in it can tell a right turn from a wrong one
                      (doc 107: "Nothing in the mine hints by sound").
    ledge-bed.wav     R50-A: wind high on the cliff; far below, water and shovels (loops)
    tents-bed.wav     R51-A: a cook fire, canvas in the wind, now and then a bolt sliding home (loops)
    grog-bed.wav      R52-A: low talk, glasses set down, the plank creaking (loops)
    grog-fork.wav     R52-FORK: the fork, exact A440 (the approved r33-fork.wav, so it is the fork Tyler has heard), then
                      the pegs turning one at a time
    river-bed.wav     R53-A: fast water over stones, the rocker's slow knock, gravel down the long tom (loops)
    bar-pebble.wav    R53-PEBBLE: one pebble set down on gravel, after each exchange of Duel One on the bar
    grog-fiddle.wav   R52-FIDDLE: a fiddle played very badly and very happily, a few seconds, no theme: a bowed
                      string that wanders flat and sharp, slides, and scrapes. No tune is written; the pitches are
                      the open strings, missed. It is an instrument, so it plays on the music bus.

THE LESSON FROM ERRATA 102 HOLDS: anything that rings at a clean pitch reads as a different material. Wind, water,
grit, stone and shovels are unpitched noise, shaped; a drip is a short filtered transient, never a tone. The wind is
the approved wind.wav, so the Gulch's air is the air Tyler already heard.

Deterministic: every sound has its own seeded stream.
"""
import importlib.util
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('room_sfx', HERE / 'render-room-sfx.py')
sfx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sfx)
RATE, n_of, lowpass, highpass, bandpass, env, place, load, loop_seam, finish, save = (
    sfx.RATE, sfx.n_of, sfx.lowpass, sfx.highpass, sfx.bandpass, sfx.env, sfx.place, sfx.load, sfx.loop_seam,
    sfx.finish, sfx.save)

SECONDS = 24


def noise(rnd, n):
    return rnd.standard_normal(n)


def wind(seconds, tilt=None):
    w = load('wind.wav')
    reps = int(np.ceil(n_of(seconds) / len(w))) + 1
    x = np.tile(w, reps)[:n_of(seconds)].copy()
    return highpass(x, tilt) if tilt else x


def trickle(rnd, seconds):
    """Water working through loose earth: band-limited noise in small uneven gusts, never a pitch."""
    n = n_of(seconds)
    body = bandpass(noise(rnd, n), 900, 3800)
    gusts = lowpass(np.abs(noise(rnd, n)), 3.0)
    gusts = gusts / (gusts.max() + 1e-9)
    return body * (0.25 + 0.75 * gusts)


def ticks(rnd, seconds, every, gain):
    """Small stones ticking down: short dry transients, at uneven intervals."""
    out = np.zeros(n_of(seconds))
    t = rnd.uniform(0.5, every)
    while t < seconds - 0.5:
        n = n_of(0.05)
        tick = bandpass(noise(rnd, n), 1800, 5200) * env(n, 0.001, 0.035)
        place(out, tick, t, gain * rnd.uniform(0.5, 1.0))
        for k in range(rnd.integers(0, 3)):          # a bounce or two after it, quieter, sooner
            place(out, tick * 0.4, t + 0.08 * (k + 1) + rnd.uniform(0, 0.04), gain * 0.35)
        t += rnd.uniform(every * 0.6, every * 1.6)
    return out


def drips(rnd, seconds, every, gain):
    """Water dripping in a mine: each a short filtered transient with a little wet tail, its colour varied so no
    two match and none settles on a pitch."""
    out = np.zeros(n_of(seconds))
    t = rnd.uniform(0.3, every)
    while t < seconds - 0.6:
        n = n_of(0.22)
        lo = rnd.uniform(700, 1400)
        drop = bandpass(noise(rnd, n), lo, lo * rnd.uniform(2.2, 3.4)) * env(n, 0.002, 0.09)
        place(out, drop, t, gain * rnd.uniform(0.4, 1.0))
        t += rnd.uniform(every * 0.3, every * 1.8)
    return out


def air(rnd, seconds):
    """Cool moving air in a tunnel: low noise, breathing slowly in and out."""
    n = n_of(seconds)
    body = lowpass(noise(rnd, n), 420)
    slow = lowpass(noise(rnd, n), 0.25)
    slow = (slow - slow.min()) / (slow.max() - slow.min() + 1e-9)
    return body * (0.4 + 0.6 * slow)


def shovels(rnd, seconds, every, gain):
    """Shovels in gravel, far below: a scrape and a throw, low-passed by the distance."""
    out = np.zeros(n_of(seconds))
    t = rnd.uniform(0.5, every)
    while t < seconds - 1.0:
        n = n_of(0.35)
        scrape = bandpass(noise(rnd, n), 500, 2600) * env(n, 0.04, 0.25)
        place(out, lowpass(scrape, 1800), t, gain * rnd.uniform(0.6, 1.0))
        t += rnd.uniform(every * 0.6, every * 1.5)
    return out


def washout_bed():
    rnd = np.random.default_rng(4501)
    x = 0.85 * wind(SECONDS) + 0.10 * trickle(rnd, SECONDS) + ticks(rnd, SECONDS, 6.0, 0.18)
    return finish(loop_seam(x), 0.5, loop=True)


def mine_bed():
    rnd = np.random.default_rng(4649)
    x = 0.55 * air(rnd, SECONDS) + drips(rnd, SECONDS, 2.6, 0.35)
    return finish(loop_seam(x), 0.45, loop=True)


def ledge_bed():
    rnd = np.random.default_rng(5001)
    high = wind(SECONDS, tilt=700)
    below = lowpass(trickle(rnd, SECONDS), 1400)
    x = 0.85 * high + 0.18 * below + shovels(rnd, SECONDS, 3.2, 0.10)
    return finish(loop_seam(x), 0.5, loop=True)


def fire(rnd, seconds, gain):
    """A cook fire: a low breathing roar and dry crackle -- short noise pops at uneven, clustered intervals."""
    n = n_of(seconds)
    roar = lowpass(noise(rnd, n), 260)
    slow = lowpass(np.abs(noise(rnd, n)), 1.5)
    roar = roar * (0.5 + 0.5 * slow / (slow.max() + 1e-9))
    pops = np.zeros(n)
    t = rnd.uniform(0.05, 0.3)
    while t < seconds - 0.1:
        m = n_of(rnd.uniform(0.004, 0.02))
        pop = bandpass(noise(rnd, m), rnd.uniform(1200, 2500), rnd.uniform(4500, 8000)) * env(m, 0.0005, 0.006)
        place(pops, pop, t, rnd.uniform(0.2, 1.0))
        t += rnd.exponential(0.12) if rnd.random() < 0.7 else rnd.uniform(0.4, 1.4)
    return gain * (0.6 * roar + pops)


def canvas(rnd, seconds, every, gain):
    """Canvas in the wind: now and then a slack flap -- a soft low thump with a rustle on it, never a tone."""
    out = np.zeros(n_of(seconds))
    t = rnd.uniform(0.5, every)
    while t < seconds - 0.6:
        m = n_of(0.3)
        thump = lowpass(noise(rnd, m), 220) * env(m, 0.01, 0.12)
        rustle = bandpass(noise(rnd, m), 600, 2400) * env(m, 0.005, 0.08) * 0.3
        place(out, thump + rustle, t, gain * rnd.uniform(0.5, 1.0))
        if rnd.random() < 0.5:
            place(out, (thump + rustle) * 0.5, t + rnd.uniform(0.15, 0.3), gain * 0.5)
        t += rnd.uniform(every * 0.5, every * 1.5)
    return out


def bolt(rnd, seconds, at, gain):
    """A bolt sliding home in a cabin door: a short iron scrape, then a dull clunk -- noise, shaped, no ring."""
    out = np.zeros(n_of(seconds))
    m = n_of(0.22)
    scrape = bandpass(noise(rnd, m), 1400, 4200) * env(m, 0.02, 0.15)
    k = n_of(0.08)
    clunk = lowpass(noise(rnd, k), 500) * env(k, 0.001, 0.05)
    place(out, scrape, at, gain * 0.5)
    place(out, clunk, at + 0.2, gain)
    return out


def tents_bed():
    rnd = np.random.default_rng(5101)
    x = (0.5 * wind(SECONDS, tilt=300) + fire(rnd, SECONDS, 0.35) + canvas(rnd, SECONDS, 3.5, 0.25)
         + bolt(rnd, SECONDS, 9.3, 0.3) + bolt(rnd, SECONDS, 19.1, 0.22))
    return finish(loop_seam(x), 0.45, loop=True)


def peg_turn(rnd, gain):
    """A peg turning in the scroll: a few small wooden catches, faster as it gives (render-fiddler.py's peg)."""
    n = n_of(0.6)
    out = np.zeros(n)
    phase, rate = 0.0, np.linspace(16, 38, n)
    for i in range(n):
        phase += rate[i] / RATE
        if phase >= 1:
            phase -= 1
            out[i] = rnd.uniform(0.4, 1.0)
    return gain * bandpass(out, 900, 3800) * np.sin(np.linspace(0, np.pi, n))


def grog_bed():
    rnd = np.random.default_rng(5201)
    talk = sfx.crowd(rnd, SECONDS, 6)[:n_of(SECONDS)]
    x = 0.55 * talk
    t = rnd.uniform(0.5, 2.0)
    while t < SECONDS - 0.5:                     # a glass set down on wood: a dull knock with a short bright edge
        m = n_of(0.06)
        knock = lowpass(noise(rnd, m), 900) * env(m, 0.001, 0.03) + 0.25 * bandpass(noise(rnd, m), 3000, 7000) * env(m, 0.001, 0.008)
        place(x, knock, t, rnd.uniform(0.25, 0.5))
        t += rnd.uniform(2.0, 5.0)
    t = rnd.uniform(3.0, 6.0)
    while t < SECONDS - 1.0:                     # the plank creaking as a man leans: stick-slip, low
        m = n_of(0.5)
        creak = bandpass(noise(rnd, m), 300, 1100) * env(m, 0.08, 0.3)
        place(x, creak, t, 0.18)
        t += rnd.uniform(6.0, 11.0)
    return finish(loop_seam(x), 0.8, loop=True)


def grog_fork():
    rnd = np.random.default_rng(5202)
    fork = load('r33-fork.wav')
    x = np.zeros(len(fork) + n_of(3.0))
    x[:len(fork)] += fork
    for k in range(4):
        place(x, peg_turn(rnd, 0.6), 1.4 + k * 0.6, 1.0)
    return finish(x, 0.6)


def grog_fiddle():
    """Very bad, very happy: a bowed string (a sawtooth through a wooden body), each stroke aimed at an open string and
    missing it -- sharp or flat by a third of a semitone or more, sliding as the finger hunts -- with the bow pressed
    too hard (scratch noise at each change) and a wide, uneven vibrato. Unpitched in intent: no two strokes agree."""
    rnd = np.random.default_rng(5204)
    opens = [196.0, 293.66, 440.0, 659.25]
    seconds = 4.2
    out = np.zeros(n_of(seconds + 0.5))
    t = 0.0
    while t < seconds:
        dur = rnd.uniform(0.18, 0.5)
        n = n_of(dur)
        aim = opens[int(rnd.integers(0, 4))] * 2 ** (rnd.uniform(-0.45, 0.45) / 12 * 3)
        slide = np.linspace(aim * 2 ** (rnd.uniform(-1, 1) / 12), aim, n)
        vib = 1 + 0.012 * np.sin(2 * np.pi * rnd.uniform(4, 8) * np.arange(n) / RATE + rnd.uniform(0, 6))
        f = slide * vib
        phase = np.cumsum(f) / RATE
        saw = 2 * (phase - np.floor(phase + 0.5))
        body = bandpass(saw, 250, 3200) + 0.4 * bandpass(saw, 2400, 5000)
        stroke = body * env(n, 0.02, dur * 0.4)
        scratch = bandpass(noise(rnd, n_of(0.05)), 1500, 6000) * env(n_of(0.05), 0.002, 0.03)
        place(out, stroke, t, rnd.uniform(0.6, 1.0))
        place(out, scratch, t, 0.5)
        t += dur * rnd.uniform(0.8, 1.05)
    return finish(out, 0.6)


def river_bed():
    """R53-A: the river loud and close (fast water over stones: the approved trickle, opened up and brighter), the
    rocker's slow knock from up the bank (a dull wooden thud, every two seconds and a little, never on a clock), and
    gravel rattling down the long tom across the water. Unpitched, all of it."""
    rnd = np.random.default_rng(5301)
    water = trickle(rnd, SECONDS)
    fast = 0.9 * highpass(water, 250) + 0.35 * bandpass(noise(rnd, n_of(SECONDS)), 1200, 6000)
    x = 0.55 * fast
    t = rnd.uniform(0.3, 1.5)
    while t < SECONDS - 0.5:                     # the rocker: a box on curved feet, chunk
        m = n_of(0.12)
        place(x, lowpass(noise(rnd, m), 500) * env(m, 0.002, 0.08), t, rnd.uniform(0.3, 0.42))
        t += rnd.uniform(1.9, 2.6)
    t = rnd.uniform(2.0, 4.0)
    while t < SECONDS - 1.5:                     # a shovelful down the long tom: gravel rattling along wood, far
        m = n_of(1.1)
        rattle = bandpass(noise(rnd, m), 900, 4200) * env(m, 0.05, 0.7)
        place(x, lowpass(rattle, 3000), t, rnd.uniform(0.12, 0.2))
        t += rnd.uniform(4.0, 8.0)
    return finish(loop_seam(x), 0.55, loop=True)


def bar_pebble():
    """R53-PEBBLE: one pebble set down on gravel -- a short click with the grit of the gravel under it, cold, a natural
    tail. A transient, never a tone (errata 102)."""
    rnd = np.random.default_rng(5302)
    n = n_of(0.25)
    out = np.zeros(n)
    click = n_of(0.012)
    place(out, bandpass(noise(rnd, click), 1800, 7000) * env(click, 0.0005, 0.008), 0.0, 1.0)
    grit = n_of(0.12)
    place(out, bandpass(noise(rnd, grit), 600, 3000) * env(grit, 0.002, 0.09), 0.006, 0.35)
    return finish(out, 0.5)


if __name__ == '__main__':
    for name, make in (('washout-bed.wav', washout_bed), ('mine-bed.wav', mine_bed), ('ledge-bed.wav', ledge_bed),
                       ('tents-bed.wav', tents_bed), ('grog-bed.wav', grog_bed), ('grog-fork.wav', grog_fork),
                       ('grog-fiddle.wav', grog_fiddle), ('river-bed.wav', river_bed), ('bar-pebble.wav', bar_pebble)):
        save(name, make())
        print('wrote audio/sfx/' + name)
