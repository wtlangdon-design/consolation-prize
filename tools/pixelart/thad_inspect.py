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

    # The 26px reduction: 32px source, raw row-drop, hand-corrected. Both the
    # raw and the corrected are kept, per ruling 16 rule 6.
    workings = IndexedCanvas(3 * (3 * 18) + 8, 40, fill=ground)
    x = 2
    for view in actor.VIEWS:
        source = actor.draw(palette, view=view, height=32, surface=actor.BOARDWALK)
        raw, corrected = actor.reduce_and_correct(source, palette, view=view)
        for figure in (source, raw, corrected):
            workings.blit(figure, x, 4 + (33 - figure.height), transparent=actor.TRANSPARENT)
            x += 17
        x += 4
    workings.save(RENDERS / "thad-26px-reduction-workings@8x.png", palette, scale=8)

    for name in ("thad-views-front-side-back@8x.png",
                 "thad-walk-mud-vs-boardwalk@8x.png",
                 "thad-26px-reduction-workings@8x.png"):
        print(f"wrote renders/{name}")


if __name__ == "__main__":
    main()
