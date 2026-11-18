# The mourners on Boot Hill, redrawn to Thad's proportions (errata 376)

For the image session. **No operation is spent until Tyler pastes the prompt below into it.** About 26,000 tokens are left under the ceiling (reference/duel-and-caves-art/handback-fork.md), so one picture and one correction.

## Why

At Pike's memorial on Boot Hill (Act II, the funeral day), Tyler: "Fanshawe's head looks comically tiny compared to everyone else in the scene." Fanshawe is right: measured at the same depth his face matches Thad's and every other Fanshawe in the game (tools/art/fanshawe-lineup.py: memorial 26.5, Thad 26.4, duel 28.1). It is the mourners beside him who are off: their heads are about 1.3 to 1.4 times Thad's, with more facial rendering than he has (the Act II art review, finding 9). Tyler chose to redraw the mourners rather than enlarge Fanshawe's head.

See `art/staging/memorial-crowd/boot-hill-memorial-as-it-is.png` (the scene in the game now: Thad at the left edge, the Reverend, the obelisk, Fanshawe in the green coat with his hat in hand, the mourners at the right) and `art/staging/memorial-crowd/crowd-frame-0-as-it-is.png` (the mourners' sheet, frame 0, as it is).

## What

**One picture: the mourners, the same seven people in the same clothes and the same arrangement, redrawn to Thad's look.**
- Back row, left to right: the young man with brown hair holding his hat at his chest, the man with the black moustache, the grey-bearded old man, the young man in spectacles.
- Front row, left to right: the woman in a black bonnet, the old woman in a grey shawl leaning on a cane, the young woman in a black hood.
- Turned a little down the hill toward the Reverend (to the viewer's left), hats in hand, solemn.
- **Thad's proportions:** about seven heads tall, small heads with softly shaded faces, flat colour, low texture, no hard internal contrast; no brighter than Thad (CLAUDE.md character style gate). Generate against a frame of Thad on Boot Hill at game size; the as-it-is scene above is that frame.
- On flat magenta (#FF00FF), as one group, the same overall size and footprint as the current frame (about 443 by 403 px at the sheet's scale), so the record's place and scale stay as they are.

Only the rest pose is drawn. The main session derives the record's other four frames from it (a breath, and three in which a different two or three of them shift their weight; `tools/rig/room04-idles.py`'s method), and the mirrored copy the gate scenes use.

**Not in this picture:** the same mourners at the gate and bowed in prayer (Act III's procession, `room-14-mourners-at-gate.png`, `room-14-mourners-bowed*.png`) keep their current drawing until Tyler asks; Fanshawe is never in those scenes. The Reverend's head is also a little big; he is not redrawn here.

## Paste this into the image session

> Read `reference/memorial-crowd-art/brief.md` on main and draw it. Add a cap entry to `art/staging/caps.json` for asset `room-14-memorial-crowd`, cap 2, quoting Tyler: "Redraw the mourners". Use `art/staging/memorial-crowd/boot-hill-memorial-as-it-is.png` and `art/staging/memorial-crowd/crowd-frame-0-as-it-is.png` as the reference images. Generate the seven mourners in their rest pose on flat magenta at high quality, to Thad's proportions; spend the second operation only if the first misses on head size or style. Put the result on a new branch named `memorial-crowd-art` with a `reference/memorial-crowd-art/handback.md` saying what was spent, show me the new group beside Thad and Fanshawe in the scene, and do not wire anything: the main session wires it.
