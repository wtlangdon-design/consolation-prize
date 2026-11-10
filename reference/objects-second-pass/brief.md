# Objects, second pass: seven icons and two patches, for the builder session with the image key

Written 2026-11-10 for errata 250 (doc 121), on Tyler's "Do all the Not Done things." Everything here is built and playing; until these are in, each icon is its labelled box and the two patches are told in words.

**Budget.** A new asset, `objects-second-pass`, in `art/staging/caps.json`, out of the fifteen operations Tyler set aside for new briefs (three spent on `act1-dinner`; `press-pull` asks for up to four). This brief asks for **three operations and one held in reserve** (four in all). Check `art/staging/ledger.json` before each and log each.

**Nothing here may be written by the builder.** No lines. Do not touch `content/`. Never touch `wtlangdon-design/anchorage`.

Read first: `CLAUDE.md`, `docs/55-full-game-build.md` §8, `docs/121-the-not-done-list.md`, and how the last icon sheet was done (`reference/act2-papers/handback.md`, `tools/art/act2-papers-icons-place.py`).

When done: commit to a branch named `objects-second-pass-art` with `reference/objects-second-pass/handback.md` beside this brief, push it, and stop.

## 1 · Seven item icons, one sheet

In the style, size and light of `art/ui/item-icons.png` (attach it). One object per cell, on the sheet's own background, no words:

| id | What it is |
|---|---|
| `nail` | One cut iron nail, square head |
| `oats` | A small loose handful of oats |
| `parsley` | One fresh curled sprig of parsley |
| `capital_b` | A single piece of lead printing type, its face a backward capital B, worn |
| `pikes_collar` | A starched white detachable collar, standing stiff |
| `button` | A black bone button, four holes |
| `room_key` | A door key on a large oval brass tag stamped 3 |

## 2 · The drawer, shut (Fanshawe's office)

- The plate `art/backgrounds/room-11-fanshawe-office.png` draws the sideboard's **lower right drawer pulled open** (about x 1470 to 1600, y 535 to 620). Wanted: **the same sideboard with that drawer shut,** matching the shut drawer beside it, handle and all. Hand back the patch with its offset, or the whole plate with only that drawer changed; the main session cuts the changed pixels and asserts nothing else differs.
- It is drawn until he opens the drawer and again once he has shut it.

## 3 · The envelope on Mr. Pike's board (Boot Hill)

- A small patch for `art/backgrounds/room-14-boot-hill.png` (attach it, and a frame with Thad at the marker): **a sealed cream envelope fixed by one nail through its corner to the face of Pike's wooden headboard,** hanging a little crooked. No readable words. Night light, as the plate.

## For the wiring

- Icons: `content/ui/item-icons.json` cells, and each item's `iconPending` comes off (it is written by `tools/extract-content.mjs`, `notDoneItems`).
- The drawer: a prop in `reference/room-11/annotation.json`, shown while `T_DRAWER_OPEN` is false.
- The envelope: a prop in `reference/room-14/annotation.json`, shown while `T_LETTER_DELIVERED` is true.
