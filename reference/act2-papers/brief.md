# Act II, the three papers: four pictures, for the builder session with the image key

Written 2026-11-09. Tyler, 2026-11-09: "make EVERYTHING in the game the best it can be", then "Design for the best scene, brief the art", then "All" to doc 114's rows. These pictures are for rows II-5 and II-1, whose lines are `docs/115-the-three-papers.md`.

**Budget.** A new asset, `act2-papers`, in `art/staging/caps.json`. **Tyler sets its cap in this session**; the brief asks for **four operations and two held in reserve** for corrections against Thad (six in all). Check `art/staging/ledger.json` before each operation and log each.

**Nothing here may be written by the builder.** No lines. Do not touch `content/`. Never touch `wtlangdon-design/anchorage`.

Read first: `CLAUDE.md` (the character style gate), `docs/55-full-game-build.md` §8, `docs/115-the-three-papers.md`.

**Every figure:** generated against a frame of Thad in the room it will stand in (attach it); cut out on magenta (#FF00FF), no ground; Thad's look, which is flat, soft-shaded and low in texture. Too sharp is the usual miss. Frames registered on the figure's rest frame so he does not shift.

## 1 · Fanshawe in his doorway, behind the wreath (Main Street)

- **Where:** the Improvement Company's street door on Main Street, at night, in the street's lamplight. Attach `art/backgrounds/` Main Street's plate cropped to the door, and `art/actors/room-02-duel-fanshawe-standing.png` (the same man, the same clothes, with black gloves added).
- **What:** the Colonel half out of the doorway behind a funeral wreath of white lilies "the size of a cartwheel", wider than the door. A black ribbon across it with gilt lettering, part of the word hidden.
- **Frames, four:** rest (pushing politely from inside); a breath; a harder push, hat askew; and **the wreath alone**, on the same registration, so the wreath can be drawn through the door without him.
- Sized to the door as painted: he is the man the street's depth curve gives at that door.

## 2 · Fanshawe on Boot Hill, hat in hand

- **Where:** Room 14, the hill at night under the moon. Attach `art/actors/room-31-sowerby-master.png` and `art/actors/room-14-mourners-at-gate.png` for the light, and a frame of Thad in Room 14.
- **What:** the same man, facing left (down the hill, toward the gate), his top hat held at his chest in both gloved hands. Doc 57: "Colonel Fanshawe in front, holding his hat."
- **Frames, three:** rest; a breath; his watch taken out and looked at, the hat under his arm.
- He replaces `art/actors/room-14-fanshawe-coming-down.png`, which is his Duel Three sheet mirrored and wears the hat.

## 3 · The Reverend at the gate, with the collection plate

- **The same man, same clothes, same size and stance** as `art/actors/room-31-sowerby-master.png` (attach it, and a frame of Thad in Room 14).
- **Frames, four, registered on his existing rest frame:**
  - holding a pewter collection plate in both hands, a little out from his chest;
  - a breath;
  - one hand out, reaching, the other empty (the plate is away down the line);
  - gripping the rim of a plate held out at arm's length, as against someone pulling it.

## 4 · Thad holding the plate

- **Thad, front view**, the cast master's Thad, hat off and under one arm, the pewter plate held in both hands at his waist. Attach his front idle frames.
- **Two frames:** holding it; holding it with his arms drawn back and his weight on his heels (the pull).
- Cut and sized exactly as his `coat-bundle` clip was (`tools/build-actor-record.mjs`, errata 238), so it drops in as a clip.

## 5 · Five item icons (doc 118)

One more operation, **a sheet of five 60×40 cells** in the style and at the pixel size of `art/ui/item-icons.png` (attach it; see `reference/item-icons/brief.md` and how `tools/art/act3-coat-cut.py` cut the last ones). So the budget asked for is **five operations and two in reserve**.

- `chalk`: a stub of white chalk worn to the shape of a thumb.
- `funeral_notice`: a small printed handbill, the ink wet, one word in much larger type than the rest.
- `hotel_lamp`: a small brass oil lamp with a glass chimney, turned low.
- `hymnal`: a small dark cloth-bound hymn book with a ribbon marker.
- `wreath`: a funeral wreath of white lilies with a black ribbon lettered in gilt.

Each must be told at a glance from every cell already on the sheet (`tools/check-item-names.mjs`). Hand them back as a small sheet beside the shipping one, as the hen and the coat were.

## Handing it back

Commit the cut-outs under `art/actors/` with their ledger rows on a branch named `act2-papers-art`, with a `reference/act2-papers/handback.md` saying what each sheet is and how its frames are laid out. Push it and tell the main session the branch name. The main session wires them in.
