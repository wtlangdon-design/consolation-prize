# The mercantile's doorway: what is outside

**Tyler, 2026-11-14** (errata 323): "the way things look from inside the mercantile looking out, doesn't match what's actually outside." One image operation, in the session with the image key.

**This brief does not budget anything by itself.** The operation is authorized by the prompt Tyler pastes into the image session, which tells that session to add the cap entry. Do not touch `content/` or `docs/` while drawing, and never touch `wtlangdon-design/anchorage`.

## What is wrong

The mercantile's plate (`art/backgrounds/room-12-mercantile.png`, 1920×864) shows the street through its open batwing doors, at the left, about x 60-450, y 0-700. Through them it paints a tall two-storey house with a gabled roof and six lit windows, close across the way.

Main Street has no such house. The street is built on one side only (`art/backgrounds/room-02-main-street.png`). The mercantile is at its west end, and what faces its door is the open street at night: wide churned mud with puddles catching the sky, dark wooded hills, and stars.

## What to draw

Repaint **only the view through the doorway**. Everything else in the plate stays pixel-for-pixel: the batwing doors, the frame, the floor, the shelves and the counter.
- **Through the doors:** the muddy street, dark and wide, with a little warm lamplight from the store's own porch lantern spilling onto the near boards and the first yard of mud. Beyond it, open ground and the dark line of the hills, with the night sky and a few stars above.
- **Nothing built across the street.** No house, no lit windows, no figure.
- **The light:** the same night as Main Street's plate, the same blue, the same stars. Nothing in it is brighter than the store's interior.

## How

- Work at the plate's own size and pixel scale. Mask the doorway opening between the frame posts and above the batwings' top rail, and keep everything outside the mask unchanged.
- Attach Main Street's west end (`art/backgrounds/room-02-main-street.png`, x 0-1400) as the reference for colour, mud, hills and sky.
- Keep the plate's pixel look: the same block size and the same soft, low-texture shading (CLAUDE.md's style gate; too sharp is the usual miss).

## When done

Commit the new plate at the same path, on a branch named `mercantile-doorway-art`, with `reference/mercantile-doorway/handback.md` beside this brief. The hand-back gives:
- the mask's rect;
- a before and after crop of the doorway, under `renders/`;
- the count of changed pixels outside the mask, which should be 0.

Push it, and stop. The other session updates the plate's hash in `reference/room-12/annotation.json` and merges.
