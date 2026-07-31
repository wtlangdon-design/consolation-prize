"""Two-frame sprites for the named ambient characters. Errata ruling 20.

Ruling 20's point is that sprites are the game's principal source of motion.
Room 2 has three ambient characters standing in it and until now the engine
drew them as solid blocks, so the busiest screen in the game had nothing
moving on it at all except the player.

WHAT THESE ARE AND ARE NOT. They are crowd silhouettes -- the same module
that draws the Nugget's drinkers -- standing in for eighteen ambient
characters that doc 15 lists as unbuilt. They are NOT the finished
characters, and they are deliberately no more articulated than the anonymous
crowd, for the reason crowd.py states: a background figure that is as
detailed as the protagonist invites the player to treat it as one. The pie
woman does not have a pie yet because the pie is her drawing, not her
placeholder.

RESTRAINT IS THE SPEC. Three figures, two frames each, 0.31 to 0.44 Hz, no
two rates equal and every phase different. Doc 21 gap 6 already worries that
the Nugget is over its ambient budget at six moving elements; Main Street
gets three, on a screen the player will stand in for hours.

Frame rects are declared in the ambient JSON and read back here, so the sheet
builder and the engine cannot disagree about where a frame is.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import crowd
from canvas import IndexedCanvas
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]
SHEETS = ROOT / "art" / "actors"

#: Same key as the idle sheets and the foreground planes.
TRANSPARENT = 255

#: One seed, so a rebuild produces the same three people.
SEED = 0x105E


def load(room_id: str) -> list[dict]:
    """Every ambient character in a room that declares a sprite."""
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    found = []
    for relative in manifest["ambient"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if data["room"] == room_id and data.get("sprite"):
            found.append(data)
    return found


def build(room_id: str, palette: Palette) -> IndexedCanvas:
    people = load(room_id)
    if not people:
        raise RuntimeError(f"{room_id} has no ambient character declaring a sprite")

    frames = [frame for npc in people for frame in npc["sprite"]["frames"]]
    canvas = IndexedCanvas(max(f[0] + f[2] for f in frames),
                           max(f[1] + f[3] for f in frames), fill=TRANSPARENT)
    rng = random.Random(SEED)

    for npc in people:
        for pose, (fx, fy, fw, fh) in enumerate(npc["sprite"]["frames"]):
            cell = IndexedCanvas(fw, fh, fill=TRANSPARENT)
            # Each figure is redrawn from the same seeded state for both of
            # its frames, so the two poses are the same man in the same coat.
            # Advancing the rng between them would give him a new coat every
            # half second, which is what the first pass did.
            # Tone 0.42, not the crowd module's 0.14. That default was chosen
            # for a saloon at eleven in the morning, and on a daylit street it
            # produces three black slabs with hats -- no internal value at
            # all, because every step of the garment ramp it uses is below the
            # mud it is standing in. Lifting the base is what gives them a lit
            # side and a shaded side, which is the difference between a person
            # and a post.
            crowd.standing(cell, palette, fw // 2, fh - 1, fh - 1,
                           random.Random(SEED ^ hash(npc["id"]) & 0xFFFF),
                           pose=pose, tone=0.42)
            canvas.blit(cell, fx, fy, transparent=TRANSPARENT)
    return canvas


def main() -> None:
    palette = Palette.load()
    SHEETS.mkdir(parents=True, exist_ok=True)
    room = "main_street"
    sheet = build(room, palette)
    path = SHEETS / "ambient-main-street.png"
    sheet.save_rgba(path, palette, transparent=TRANSPARENT)
    print(f"wrote {path.relative_to(ROOT)}  {sheet.width}x{sheet.height}")
    for npc in load(room):
        sprite = npc["sprite"]
        print(f"  {npc['id']:<15}{sprite['rate']} Hz, phase {sprite.get('phase', 0)}, "
              f"at ({npc['x']}, {npc['y']})")


if __name__ == "__main__":
    main()
