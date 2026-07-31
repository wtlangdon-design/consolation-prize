"""SCUMM's actor scaling, tested against ours. Evidence for ruling 15.

WHAT SCUMM ACTUALLY DID. ScummVM's source scales actors CONTINUOUSLY and stays
crisp by DECIMATING rather than resampling: `smallCostumeScaleTable` is a
256-entry table and the engine walks it one entry per source row and column,
drawing that row or column when the entry is under the scale and skipping it
when it is over. Nothing is blended. A 40px actor at scale 166 is 26 rows of
the original 40, chosen by the table, each still exactly one source row.

The table is a BIT-REVERSAL distribution -- 0, 128, 64, 192, 32, 160, ... --
which is what makes it work. Consecutive entries are as far apart in value as
possible, so the rows it drops at any scale are spread evenly through the
figure rather than clumping. It is the same idea as an ordered dither, applied
to a sequence instead of a plane.

WHAT RULING 15 ASSUMED. Ruling 15 fixed three drawn heights and forbade
interpolation, and the stated reason was smearing. That reason was about
RESAMPLING, which is not what SCUMM did. This module exists to find out
whether the objection survives when the mechanism is right.

THE TEST. Decimate the 40px Thad to 26 and 32 with a bit-reversal table, put
each beside the hand-corrected version, and look at the face -- the earlier
finding was that reducing by ratio lands on the eyes, and a distribution table
does not know where the eyes are either.

Evidence only. Nothing here changes what the game draws.
"""

from __future__ import annotations

import actor
from canvas import IndexedCanvas
from palette import Palette


def bit_reversal_table(size: int = 256) -> list[int]:
    """SCUMM's smallCostumeScaleTable, regenerated rather than transcribed.

    Eight-bit reversal: entry n is n's bits in the opposite order. The result
    is 0, 128, 64, 192, 32, 160, 96, 224 ... -- every prefix of it spread as
    evenly over 0..255 as a prefix of that length can be.
    """
    table = []
    for n in range(size):
        bits = 0
        for shift in range(8):
            if n & (1 << shift):
                bits |= 1 << (7 - shift)
        table.append(bits)
    return table


TABLE = bit_reversal_table()


def kept(count: int, scale: int) -> list[int]:
    """Which of `count` source lines survive at `scale` (0-255).

    One table entry per source line, in order, exactly as the interpreter
    walks it. A line is drawn when its entry is under the scale.
    """
    return [index for index in range(count) if TABLE[index % len(TABLE)] < scale]


def decimate(source: IndexedCanvas, scale: int) -> IndexedCanvas:
    """Scale by dropping whole rows and columns. No blending anywhere.

    Rows and columns use the same table but are walked independently, which
    is what SCUMM did and what keeps a figure's proportions from shearing.
    """
    rows = kept(source.height, scale)
    columns = kept(source.width, scale)
    out = IndexedCanvas(max(1, len(columns)), max(1, len(rows)), fill=actor.TRANSPARENT)
    for target_y, source_y in enumerate(rows):
        for target_x, source_x in enumerate(columns):
            out.put(target_x, target_y, source.pixels[source_y][source_x])
    return out


def scale_for(source_height: int, wanted: int) -> int:
    """The scale value whose decimation is closest to `wanted` rows.

    Searched rather than computed. The table is not linear over short runs --
    40 rows sample only the first 40 entries, whose distribution is coarse --
    so the scale that yields 26 rows out of 40 is not simply 26/40 of 255.
    """
    best, best_gap = 255, None
    for scale in range(1, 256):
        gap = abs(len(kept(source_height, scale)) - wanted)
        if best_gap is None or gap < best_gap:
            best, best_gap = scale, gap
        if best_gap == 0 and gap > 0:
            break
    return best
