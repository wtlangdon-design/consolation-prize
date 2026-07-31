"""Room 1's ambient motion, rendered at its real rates. Errata 35.

WHAT THIS PROVES AND WHAT IT DOES NOT. These are composed frames of the whole
room, so they show the motion as it will look. They are not yet the shipping
mechanism: Hob and the team are painted into the background, and an animated
background is a thing this engine does not have. Turning these into sprites is
the wiring step, and the frames come first so there is something to wire.

35d's rates, in the ruling's own numbers:

  the team   heads down, hold, up, chew -- 10 to 20 seconds, and the two
             horses OUT OF PHASE, which is why the cycle below is not
             symmetrical and why one animal is never doing what the other is
  Hob        the lamp swings on the walk, and the lit side of his face and
             coat move with it -- lighting him from a fixed side while the
             lamp moves would be worse than not moving it at all
"""

from __future__ import annotations

from PIL import Image

import room01_stage_road as room
from renders import RENDERS

#: (swing, graze, hold in frames). One frame is 1/6 of a second at the GIF's
#: rate, and the holds are long because 35d says slow and irregular. The two
#: horses never change together and the sequence does not repeat evenly.
CYCLE = (
    (0, (0, 0), 14),
    (1, (0, 0), 8),
    (1, (0, 1), 10),
    (0, (0, 1), 16),
    (-1, (1, 1), 6),
    (-1, (1, 0), 12),
    (0, (1, 0), 18),
    (1, (0, 0), 9),
)


def main() -> None:
    RENDERS.mkdir(parents=True, exist_ok=True)
    frames, durations = [], []
    for swing, graze, hold in CYCLE:
        canvas, palette = room.compose(with_coach=True, swing=swing, graze=graze)
        frames.append(canvas.to_image(palette).convert("P", palette=Image.ADAPTIVE))
        durations.append(hold * 166)
    out = RENDERS / "room-01-ambient.gif"
    frames[0].save(out, save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, disposal=2)
    print(f"wrote {out.relative_to(RENDERS.parent)}  {len(frames)} frames, "
          f"{sum(durations) / 1000:.1f}s cycle")


if __name__ == "__main__":
    main()
