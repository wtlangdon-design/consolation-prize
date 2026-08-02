"""Stops a composer writing an output that errata 53 or 54 took away from it.

WHY THIS IS A REFUSAL AND NOT A DELETION FROM render-all's LIST. A module
quietly dropped from that list is invisible: the next person adds it back, or
writes a new one, and nothing says why it went. A module that stops and names
the issue cannot be un-learned by accident.

It matters because the instruction is documented. CLAUDE.md says "One command
regenerates everything: npm run renders"; render-all runs
`room01_stage_road.py`, whose first output is Room 1's shipping background, and
`actor_export.py`, which rewrites `content/actors/thad.json` wholesale. So
FOLLOWING THE DOCUMENTATION destroyed both. Room 1's two sprite sheets have
already been lost once tonight to a careless glob, and the plate is a generated
asset the project owner approved.

WHAT IS DELIBERATELY NOT LISTED. Room 2's occlusion masks and open-door state
and Room 3's idle sheet are cut from composed art too, and they are equally
stale under errata 53 -- but those rooms have no approved plate, their composed
output IS the shipping art, and refusing to write it would remove working
assets with nothing to put in their place. That is a decision about what those
rooms look like and it is not a guard's to make. Room 1 is different only
because it has been superseded in fact rather than in doctrine.

docs/36-issue-list.md Q20 carries the full nineteen-path trace.
"""
from __future__ import annotations

from pathlib import Path

# tools/pixelart/superseded.py -> tools/pixelart -> tools -> repo root
REPO_ROOT = Path(__file__).resolve().parents[2]

SUPERSEDED = {
    "art/backgrounds/room-01-stage-road.png":
        "this path now holds the APPROVED GENERATED PLATE at 1920x864, promoted from "
        "reference/casting/room-01-plate-approved.png. Writing the composed 320x144 "
        "room over it destroys it",
    "art/foregrounds/room-01-stage-road.png":
        "cut from the composed Room 1, which errata 53 discarded. The near plane has "
        "to be cut from the approved plate instead",
    "art/objects/room-01-coach.png":
        "the difference between two composed versions of a plate that no longer "
        "exists. D5's chain makes the coach generation B and no such generation has "
        "been made",
    "content/actors/thad.json":
        "errata 54 migrated this file's play-area heights and threshold by x6, and "
        "this exporter regenerates them from measurements on the composed 320x144 "
        "sheet -- so running it silently reverts the migration. It also derives "
        "`threshold` from eye_death_row, which measures decimation, and errata 54 "
        "voids decimation. Q9 owns rewriting this file and has not been ruled",
}


class SupersededOutput(RuntimeError):
    """Raised instead of overwriting something the writer no longer owns."""


def refuse_if_superseded(path: Path) -> None:
    """Raises if `path` is on the superseded list. A no-op otherwise."""
    try:
        key = Path(path).resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return
    reason = SUPERSEDED.get(key)
    if reason is None:
        return
    raise SupersededOutput(
        f"REFUSING TO WRITE {key}\n"
        f"  {reason}.\n"
        f"  See docs/36-issue-list.md Q20. This is not a bug in this module -- it is a\n"
        f"  writer being stopped from answering a question that belongs to the project\n"
        f"  owner. Do not delete this module from tools/render-all.mjs; the refusal is\n"
        f"  the point, and a module removed from a list says nothing to the next person."
    )
