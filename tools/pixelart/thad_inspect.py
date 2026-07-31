"""Thad's 8x inspection crops. Ruling 16 rule 5 requires 8x, not 4x.

These were produced by throwaway inline scripts during the sprite pass,
which meant the renders existed and the thing that made them did not. Four
separate defects were caught at 8x that were invisible at 4x, so this is a
standing check rather than a one-off and it has to be re-runnable.
"""

from __future__ import annotations

import actor
from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS


def main() -> None:
    palette = Palette.load()
    RENDERS.mkdir(parents=True, exist_ok=True)
    ground = palette.family("mud").at(9)

    # Three views, whole, on a mud-value ground.
    views = IndexedCanvas(3 * 24 + 4, 52, fill=ground)
    for index, view in enumerate(actor.VIEWS):
        figure = actor.at_height(palette, view=view, height=40, surface=actor.BOARDWALK)
        views.blit(figure, 2 + index * 24, 6, transparent=actor.TRANSPARENT)
    views.save(RENDERS / "thad-views-front-side-back@8x.png", palette, scale=8)

    # The two walks, each on its own surface, stacked for comparison.
    width = 8 * 22 + 6
    walks = IndexedCanvas(width, 104, fill=palette.family("grey").at(3))
    walks.rect(0, 44, width, 8, palette.family("mud").at(8))
    for index in range(8):
        frame = actor.walk_frame(palette, index, height=40, surface=actor.MUD)
        walks.blit(frame, 3 + index * 22, 44 - actor.content_bottom(frame),
                   transparent=actor.TRANSPARENT)
    walks.rect(0, 96, width, 8, palette.family("pine_weathered").at(11))
    for index in range(8):
        frame = actor.walk_frame(palette, index, height=40, surface=actor.BOARDWALK)
        walks.blit(frame, 3 + index * 22, 96 - actor.content_bottom(frame),
                   transparent=actor.TRANSPARENT)
    walks.save(RENDERS / "thad-walk-mud-vs-boardwalk@8x.png", palette, scale=8)

    # The snap, per ruling 24: the last decimated height with eyes, the first
    # without, and the drawn far sprite that replaces it. Kept at 8x because
    # the whole decision is about two pixels in a face.
    threshold = actor.eye_death_row(palette)
    heights = (threshold + 1, threshold, actor.FAR)
    workings = IndexedCanvas(3 * (3 * 18) + 8, 40, fill=ground)
    x = 2
    for view in actor.VIEWS:
        for height in heights:
            figure = actor.at_height(palette, view=view, height=height,
                                     surface=actor.BOARDWALK, sink=0)
            workings.blit(figure, x, 4 + (33 - figure.height), transparent=actor.TRANSPARENT)
            x += 17
        x += 4
    workings.save(RENDERS / "thad-far-sprite-snap@8x.png", palette, scale=8)

    # The one bespoke reaction, front and side, every frame. Doc 15's short
    # comic reaction: he leans away, his eyes go with him, he comes back.
    # Held still at 8x because in motion it is over in half a second, which
    # is the point of it and also the reason it needs checking like this.
    frames = actor.RECOIL
    recoil = IndexedCanvas(len(frames) * 2 * 22 + 6, 46, fill=ground)
    x = 3
    for view in (actor.FRONT, actor.SIDE):
        for step in frames:
            figure = actor.at_height(palette, view=view, height=40,
                                     surface=actor.BOARDWALK, sink=0, **step)
            recoil.blit(figure, x, 44 - figure.height, transparent=actor.TRANSPARENT)
            x += 22
        x += 6
    recoil.save(RENDERS / "thad-recoil@8x.png", palette, scale=8)

    near_mud(palette)

    for name in ("thad-views-front-side-back@8x.png",
                 "thad-walk-mud-vs-boardwalk@8x.png",
                 "thad-far-sprite-snap@8x.png",
                 "thad-recoil@8x.png",
                 "thad-near-mud-inspection@8x.png"):
        print(f"wrote renders/{name}")
    print(f"  the snap is at {threshold} -> {actor.FAR}, measured, not chosen")


def near_mud(palette: Palette) -> None:
    """The near zone of Room 2, at 8x, standing and mid-stride.

    Room 2's near mud measures p10 27.1 against a boot at 27 -- a dark margin
    of zero, the thinnest reading in any composed room. The number cannot
    settle it: the mud-sink takes the bottom rows of the sprite away on
    purpose, so a boot that measures as invisible may be a boot that is not
    being drawn. Ruling 16 rule 5 says look at it at 8x.
    """
    import actor_sheet
    from street_scene import DAY, compose

    x, feet = actor_sheet._zone_columns()[0]
    crop_x, crop_y, crop_w, crop_h = x - 15, feet - 43, 30, 45

    panel = IndexedCanvas(crop_w * 2 + 4, crop_h, fill=palette.family("void").at(0))
    for column, frame in enumerate((None, 1)):
        room, _ = compose(DAY)
        actor_sheet.place(room, palette, x, feet, 40, view=actor.SIDE,
                          frame=frame, surface=actor.MUD)
        for y in range(crop_h):
            for px in range(crop_w):
                panel.put(column * (crop_w + 4) + px, y, room.get(crop_x + px, crop_y + y))
    panel.save(RENDERS / "thad-near-mud-inspection@8x.png", palette, scale=8)


if __name__ == "__main__":
    main()
