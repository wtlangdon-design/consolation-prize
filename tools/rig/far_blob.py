"""Beat 11's far-distance figure, DERIVED from the walk rather than drawn.

    python3 tools/rig/far_blob.py

Errata 55 walks Thad up the road until Main Street arrives, and the legibility
ladder measured where the walk stops being a walk: 5 distinct pictures of 8 all
the way down to 22px, 4 at 16 and 4 at 12. Below 22 the animation has lost a
position, which is a fact about the bytes rather than a judgement about a
silhouette, so 22 is the handoff.

TYLER'S RULING: below it he can be a dark silhouette with a slight vertical
bob -- "a bouncing little dark blob if it is indiscernible" -- and it is NOT a
generation. This threshold's the back walk's own alpha, fills it flat in the
room's darkest value, and bobs it.

THE PROPERTY THAT MAKES THIS BETTER THAN DRAWN ART: it cannot drift from the
character it represents, because it is made from him. Regenerate the back walk
and re-run this, and the blob is the new man automatically. A commissioned
far-distance sprite is a second thing to keep in sync, forever, over a figure
nobody can resolve.

WHY 2x THE HANDOFF HEIGHT (R5a). 22px is the largest this clip is ever drawn
at -- it takes over at the handoff and only shrinks after -- so 44 is twice the
largest drawn size, and the bob is 2px here to be 1px there.

IT IS DECLARED IN `content/actors/thad.json`, AND I FIRST DECIDED IT SHOULD NOT
BE. The reasoning was R5l -- a clip in a record that nothing plays is a plan --
and `check-actor-clips` already asserts the opposite, by name, with the better
argument: "new art nobody wired is invisible; the game never asks for it and
nothing says so." Undeclared art is not a smaller version of the same problem,
it is the one where nothing can even tell the art exists. Declared, it is
loaded, it is in the boot budget, it is in every diff. No sequence plays it
until beat 11 has a committed path, and its reader today is
`tools/beat11/trace-path.html`.

To add it, `build-actor-record.mjs` needs `farwalk` in CLIPS -- that list is an
allowlist and a new directory stops the build until somebody names it.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art/actors/thad-walk-back"
PLATE = ROOT / "art/backgrounds/room-01-stage-road.png"
OUT = ROOT / "art/actors/thad-farwalk-back"

# THE HANDOFF, AND IT IS A MEASUREMENT RATHER THAN AN EYE JUDGEMENT: the height
# at which the eight-frame back walk drops from 5 distinct pictures to 4.
HANDOFF_H = 22
FIGURE_H = HANDOFF_H * 2
BOB_PX = 2                      # at FIGURE_H, so one drawn pixel at the handoff

# WHICH SOURCE FRAMES. The cycle is a palindrome -- frames 2 and 6 are the same
# file, and so are 1/7 and 3/5 (Q88) -- so 0, 2, 4 is contact, passing, opposite
# contact, the three widest-separated pictures the clip actually contains.
# Asking for six would return three of them twice.
PICK = [0, 2, 4]

# THE WHOLE FIGURE BOBS, feet and all, and at this size that is right rather
# than a shortcut: at 22px there are no legs left to swing, so the bounce IS
# the walk. Lifting a body off stationary feet needs feet to read as feet.
#
# CONTACT IS THE GROUND LINE. A walker is lowest at contact and highest at
# mid-stance, so the two contact frames sit on the anchor row and the passing
# frame rides 2px above it -- which puts every frame inside the canvas without
# the anchor having to describe the top of a bounce.
BOB = [BOB_PX, 0, BOB_PX]


def darkest(path: Path):
    """The room's darkest value, as the room's own pixels report it."""
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(int)
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    y, x = np.unravel_index(int(np.argmin(lum)), lum.shape)
    colour = tuple(int(v) for v in rgb[y, x])
    count = int((rgb.reshape(-1, 3) == np.array(colour)).all(1).sum())
    return colour, count, (int(x), int(y))


def main():
    frames = sorted(SOURCE.glob("*.png"))
    if not frames:
        raise SystemExit(f"no frames in {SOURCE}")
    masks = []
    for i in PICK:
        alpha = np.asarray(Image.open(frames[i]).convert("RGBA"))[..., 3]
        masks.append(alpha > 128)

    # ONE BOX FOR ALL OF THEM, so the blob does not jitter horizontally: the
    # bob is meant to be the only movement, and cropping each frame to its own
    # extent would slide him sideways by whatever the arms were doing.
    union = np.zeros_like(masks[0])
    for m in masks:
        union |= m
    ys, xs = np.nonzero(union)
    top, bottom = int(ys.min()), int(ys.max())
    left, right = int(xs.min()), int(xs.max())
    src_h = bottom - top + 1
    scale = FIGURE_H / src_h
    width = max(1, round((right - left + 1) * scale))

    colour, count, where = darkest(PLATE)
    canvas_h = FIGURE_H + BOB_PX

    written = []
    for n, (mask, dy) in enumerate(zip(masks, BOB)):
        crop = mask[top:bottom + 1, left:right + 1]
        # AREA-AVERAGE THEN RE-THRESHOLD. Resampling a hard silhouette leaves a
        # soft edge, and the presentation spec forbids anti-aliasing anywhere.
        # Averaging coverage and cutting at half a pixel is the honest small
        # version of a shape: it keeps the outline where the majority of the
        # figure was, and every pixel that survives is fully opaque.
        small = np.asarray(Image.fromarray((crop * 255).astype(np.uint8))
                           .resize((width, FIGURE_H), Image.BOX)) >= 128
        out = np.zeros((canvas_h, width, 4), np.uint8)
        # THE RIG'S CANVAS CONVENTION, followed exactly: the figure occupies
        # rows 0..figure_height-1 at its lowest and the anchor row is the one
        # after, so `anchor: [pad + w/2, figure_height]` in the actor record
        # lands the soles on the waypoint. `character.py` writes every other
        # clip this way and a clip that agreed with itself instead would draw
        # the man two pixels into the road.
        out[dy:dy + FIGURE_H, :, :3] = colour
        out[dy:dy + FIGURE_H, :, 3] = small * 255
        path = OUT / f"farwalk-{n:02d}.png"
        OUT.mkdir(parents=True, exist_ok=True)
        Image.fromarray(out).save(path)
        written.append(path)

    seen = {p.read_bytes() for p in written}
    print(f"source {SOURCE.name}, frames {PICK} of {len(frames)}")
    print(f"figure {src_h}px -> {FIGURE_H}px ({width}x{canvas_h} canvas), bob {BOB_PX}px")
    print(f"room's darkest value {colour}, {count} pixel(s) of it in the plate, "
          f"first at {where}")
    print(f"wrote {len(written)} frame(s), {len(seen)} distinct")
    if len(seen) < 2:
        raise SystemExit(
            "the blob does not move: every frame is the same file. A bob that "
            "quantises away is not a bob -- raise BOB_PX or FIGURE_H.")

    (OUT / "rig.json").write_text(json.dumps({
        "clip": "farwalk",
        "facing": "back",
        "view": "headon",
        # THE DECLARED FIGURE IS THE CLIP'S FULL EXTENT, bob included, which is
        # the same convention every walk uses -- thad-walk-back declares 548 and
        # its own bounce lives inside that. So a waypoint asking for 22px gets a
        # 22px extent and a 21px man, and the pixel is the bounce.
        "figure": [width, canvas_h],
        "padding": 0,
        "frames": len(written),
        "derivedFrom": f"art/actors/{SOURCE.name}",
        "sourceFrames": PICK,
        "handoffHeight": HANDOFF_H,
        "note": (
            "DERIVED, NOT DRAWN. Beat 11's far-distance figure, thresholded out of "
            f"{SOURCE.name}'s own alpha and filled flat in the room's darkest value "
            f"{colour}. Errata 55 keeps him walking until Main Street arrives, and the "
            "legibility ladder put the handoff at 22px: that is where the eight-frame "
            "back walk drops from 5 distinct pictures to 4, so the animation loses a "
            "position there. Measured, not judged.\n\n"
            "WRITTEN AT 44px = TWICE THE HANDOFF, which is R5a read correctly: 22 is the "
            "LARGEST this clip is ever drawn at, because it takes over at the handoff and "
            "only shrinks afterwards. The 2px bob is one drawn pixel there.\n\n"
            "FRAMES 0, 2 AND 4 OF THE SOURCE. The walk is a palindrome (Q88) -- 2 and 6 "
            "are the same file, as are 1/7 and 3/5 -- so those three are the widest-"
            "separated pictures it actually contains. Six frames would be three of them "
            "twice.\n\n"
            "IT CANNOT DRIFT FROM HIM, because it is made from him: regenerate the back "
            "walk, re-run tools/rig/far_blob.py, and the blob is the new man. That is the "
            "property a commissioned far sprite would not have.\n\n"
            "THE WHOLE FIGURE BOBS, feet and all. At 22px there are no legs left to swing, "
            "so the bounce IS the walk -- lifting a body off stationary feet needs feet "
            "that read as feet. Contact frames sit on the anchor row and the passing frame "
            "rides 2px above it, which is where a walker actually is."
        ),
    }, indent=2) + "\n")
    print(f"wrote rig.json to {OUT}")


if __name__ == "__main__":
    main()
