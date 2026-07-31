"""Room 2 -- Main Street, day."""

from __future__ import annotations

from pathlib import Path

import street_scene
from canvas import IndexedCanvas
from renders import FOREGROUNDS
from street_scene import DAY, HEIGHT, WIDTH, compose

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    canvas, palette = compose(DAY)
    native = ROOT / "art" / "backgrounds" / "room-02-main-street.png"
    preview = ROOT / "renders" / "room-02-main-street-day@4x.png"
    canvas.save(native, palette)
    canvas.save(preview, palette, scale=4)
    street_scene.FOREGROUND.save_rgba(FOREGROUNDS / "room-02-main-street.png", palette)

    # Doc 22 section 5's z-planes. Two masks, and plane 2 CONTAINS plane 1 --
    # an actor is masked by its assigned plane and not by a union of every
    # plane, so each plane has to carry everything nearer than the actors at
    # that level. Plane 1 is the near corner alone; plane 2 adds the rail and
    # the trough, which is what lets Thad walk BETWEEN them: in front of the
    # trough in the near mud, behind it in the middle band.
    masks = ROOT / "art" / "masks"
    masks.mkdir(parents=True, exist_ok=True)
    street_scene.FOREGROUND.save_rgba(masks / "room-02-plane-1.png", palette)
    plane2 = IndexedCanvas(WIDTH, HEIGHT, fill=255)
    plane2.blit(street_scene.MIDGROUND, 0, 0, transparent=255)
    plane2.blit(street_scene.FOREGROUND, 0, 0, transparent=255)
    plane2.save_rgba(masks / "room-02-plane-2.png", palette)
    print("wrote art/masks/room-02-plane-1.png and room-02-plane-2.png")
    print(f"wrote {native.relative_to(ROOT)}  ({WIDTH}x{HEIGHT})")
    print(f"wrote {preview.relative_to(ROOT)}  ({WIDTH * 4}x{HEIGHT * 4})")
    print(f"colours used: {len(canvas.used_indices())} of 256")


if __name__ == "__main__":
    main()
