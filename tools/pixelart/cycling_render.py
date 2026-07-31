"""Room 1's palette cycling, as something a person can watch. Doc 18.

Two renders, because they answer different questions.

  The GIF answers "does this read as a lamp breathing and water shifting, or
  does it read as a fault?" -- which only wall-clock timing can answer, so it
  runs at the declared rates over a full loop.

  The states sheet answers "what actually changes?" -- which motion hides.
  Crops of the two elements at every state they have, side by side and still.
"""

from __future__ import annotations

import cycling
import room01_stage_road as room
from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS

ROOM_ID = "stage_road"

#: What to crop for the states sheet: the lamp, and the densest stretch of
#: road, which holds streaks painted with all three reserved indices and so
#: shows all three phases at once.
CROPS = (
    ("hobs_lamp", (78, 74, 22, 20)),
    ("puddles", (156, 123, 60, 20)),
)


def crop(canvas: IndexedCanvas, rect: tuple[int, int, int, int]) -> IndexedCanvas:
    x, y, width, height = rect
    out = IndexedCanvas(width, height)
    for row in range(height):
        for column in range(width):
            out.put(column, row, canvas.get(x + column, y + row))
    return out


def main() -> None:
    palette = Palette.load()
    base, _ = room.compose()
    elements = cycling.load(ROOM_ID, palette)
    RENDERS.mkdir(parents=True, exist_ok=True)

    instants, loop = cycling.change_times(elements)
    images, delays = [], []
    for position, when in enumerate(instants):
        table = cycling.mapping_at(elements, when + 1e-6)
        images.append(cycling.recolour(base, table).to_image(palette).resize(
            (base.width * 2, base.height * 2)))
        nxt = instants[position + 1] if position + 1 < len(instants) else loop
        delays.append(int(round((nxt - when) * 1000)))

    gif = RENDERS / "room-01-stage-road-cycle.gif"
    images[0].save(gif, save_all=True, append_images=images[1:],
                   duration=delays, loop=0, disposal=1, optimize=False)

    # The states sheet. One column per state of that element, at 6x, with the
    # element's own name and nothing else -- if the difference between two
    # columns is invisible here it is invisible in the game, which for the
    # puddles is close to the point and for the lamp would be a bug.
    gap, scale = 3, 6
    rows = []
    for name, rect in CROPS:
        element = next(e for e in elements if e.id == name)
        states = cycling.phase_count(element)
        strip = IndexedCanvas(
            (rect[2] + gap) * states + gap, rect[3] + gap * 2,
            fill=palette.family("void").at(0))
        for step in range(states):
            # Only this element moves in its own strip. The other one holding
            # still is what makes the column-to-column difference readable.
            table = cycling.mapping(
                elements, [step if other is element else 0 for other in elements])
            piece = crop(cycling.recolour(base, table), rect)
            strip.blit(piece, gap + step * (rect[2] + gap), gap)
        rows.append((element, strip))

    width = max(strip.width for _, strip in rows)
    height = sum(strip.height for _, strip in rows)
    sheet = IndexedCanvas(width, height, fill=palette.family("void").at(0))
    cursor = 0
    for _, strip in rows:
        sheet.blit(strip, 0, cursor)
        cursor += strip.height
    sheet.save(RENDERS / "room-01-cycle-states@6x.png", palette, scale=scale)

    print(f"wrote renders/{gif.name}")
    print(f"  {len(images)} distinct pictures over a {loop:.1f}s loop")
    for element, _ in rows:
        print(f"  {element.id}: {element.mode} {element.rate} Hz, "
              f"{cycling.phase_count(element)} states on indices "
              f"{element.first}..{element.first + element.count - 1}")
    print("wrote renders/room-01-cycle-states@6x.png")


if __name__ == "__main__":
    main()
