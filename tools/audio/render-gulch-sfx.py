"""
Fiddler's Gulch's room beds, the washout to the ledge (doc 45, "Rooms 45-54"; errata 195), rendered offline like the
room ones, with tools/audio/render-room-sfx.py's own helpers.

    python3 tools/audio/render-gulch-sfx.py

    washout-bed.wav   R45-A: wind over the slide; a trickle working through it; now and then a stone ticking down (loops)
    mine-bed.wav      R46-49-A: drips at random intervals, cool moving air (loops). ONE FILE FOR ALL FOUR MINE ROOMS, at
                      one level, carried across them (doc 45), so nothing in it can tell a right turn from a wrong one
                      (doc 107: "Nothing in the mine hints by sound").
    ledge-bed.wav     R50-A: wind high on the cliff; far below, water and shovels (loops)

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


if __name__ == '__main__':
    for name, make in (('washout-bed.wav', washout_bed), ('mine-bed.wav', mine_bed), ('ledge-bed.wav', ledge_bed)):
        save(name, make())
        print('wrote audio/sfx/' + name)
