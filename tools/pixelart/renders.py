"""Where every render goes.

One directory, descriptive names, overwritten in place. No version suffixes:
the point of a render is to show the current state of a thing, and a folder
of room-03-v4-final-FINAL.png is a folder nobody can read at a glance.

Git already holds every previous version, which is the versioning system
this project has -- adding a second one in the filenames would only make the
two disagree.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

#: Review renders: composites, sheets, scale checks, inspection crops.
RENDERS = ROOT / "renders"

#: Shipping art the engine actually loads at runtime. NOT renders -- these
#: are game assets and are referenced by room JSON, so they keep their own
#: home and their own names.
BACKGROUNDS = ROOT / "art" / "backgrounds"


def out(name: str) -> Path:
    RENDERS.mkdir(parents=True, exist_ok=True)
    return RENDERS / name
