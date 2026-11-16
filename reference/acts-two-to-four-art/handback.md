# Acts II to IV, four drawings: handed back (reference/acts-two-to-four-art/brief.md, errata 354)

## Spent

On Tyler's instruction (2026-11-16), `art/staging/caps.json` has four new entries, each with cap 2 and quoting him: `room-32-coffin-lantern`, `room-31-coffin-open`, `room-44-seance-sign` and `room-31-hearse-match`. He authorized up to eight operations for the brief.

**Four operations are spent, one per item, and no correction was needed.** That is 45,136 billed tokens:

| Item | Asset | Attempt | Tokens |
|---|---|---|---|
| 1 | room-32-coffin-lantern | 1 | 12,299 |
| 2 | room-31-coffin-open | 1 | 11,915 |
| 3 | room-44-seance-sign | 1 | 9,565 |
| 4 | room-31-hearse-match | 1 | 11,357 |

- **Ledger:** 448 attempts and 4,569,656 tokens against `spendTokensTotal` 4,625,000. About 55,000 is left, so the ceiling was not reached.
- **Corrections in hand:** each asset still has its second operation.
- **Nothing wired:** nothing in `content/` or `docs/` is touched, as the brief says; the main session wires it.

Each item was generated against a frame of Thad in its own room, with Thad's ruler frame (`art/staging/act-one-art/thad-ruler.png`). Prompts and specs are `reference/acts-two-to-four-art/<item>-op-1.txt` and `.spec.json`.

All four are cut by **`tools/art/acts-two-to-four-cut.py JOB [--write]`**, JOB being `lantern`, `coffin`, `sign` or `hearse`. Nothing is regraded.
- **Items 2 and 4 share one sheet.** Run `coffin`, then `hearse`, then `grievance` when re-running: `hearse` builds on the opened-coffin prop saved at `art/staging/acts-two-to-four-art/hearse/coffin-open-prop.png`.

## 1. The view up out of the coffin, with Hob: `art/backgrounds/room-32-coffin-lantern.png`

**What it shows.** We look straight up out of the open pine coffin at night:
- the coffin's two long sides, dark, run up the left and right edges;
- night sky with a few stars between them;
- Hob leans over the opening from the top of the frame, hat off, his lantern held low;
- his face is lit from below by the lantern, and the light catches the boards' inner edges.

He was drawn against Hob at the graveside at night with Thad beside him (`art/staging/acts-two-to-four-art/coffin-lantern/funeral-night-thad-and-hob.png`) and Hob at 2x.

**How it was cut.**
- The operation filled the whole canvas, not only the template's band.
- The plate is cut from rows 170-860: Hob's hair starts at row 173 and the lantern's glow runs to row 803.
- It is brought up to 1920 x 864 **nearest-neighbour**, never smoothed.
- Only the lantern's dark base is trimmed at the bottom edge.

**Kept.** The same path and size. The dark plate and the five seam plates are untouched, as the brief says.

**Before and after:** `renders/room-32-coffin-lantern-before-after.png`.

**For Tyler's eye.**
- Its mean light is 19.4 (the old placeholder's was 11.6).
- Hob's face is mostly in shadow, as asked, but his moustache and brow read clearly. It is a larger, closer Hob than any in the game, so judge whether his face matches his.

## 2. The coffin top, open: `art/props/room-31-hearse.png` (the coffin group)

**What it shows.**
- The same pine coffin on the same trestles, lid off.
- The lid is the one already leaning on the near trestle; there is no second lid.
- The box is open, dark inside, with a small pale cushion at the head end, nearer the hearse's back wheel.

**How it was made.** It was a masked edit of the prop, drawn against the funeral with Thad (`coffin-open/funeral-with-thad.png`).
- The operation redrew the whole coffin group (box, trestles and leaning lid) a few pixels from where it was, not only the masked lid.
- So the group is taken whole from the prop's row 268 down. A strip composite had doubled the handles.
- The old grass patch under the trestles, which the old prop carried, is gone: the plate's own ground shows through.
- Nothing above row 268 changed.

**Before and after:** `renders/room-31-coffin-open-before-after.png`.

## 3. The séance chalkboard: `art/props/room-44-seance-sign.png` (new)

**What it shows.** A small A-frame chalkboard in a dark wood frame, chalked **SÉANCE / TONIGHT**, a line under it, and **$2** larger than the rest. It is drawn against the Lane with Thad (`seance-sign/lane-with-thad.png`).

**The sheet.** 81 x 96, one frame `[0, 0, 81, 96]`, snapped to the one level at the man where it stands (block 1.88).

**For the wiring** (a prop with `when: { T_SEANCE_ON: true }`):
- **Position:** `x` **1134**, `y` **645**, bottom-centre. That centres it on THE SÉANCE SIGN's hotspot (1108, 470, 52, 180) and stands it on the ground in front of the tent's right side. It spans x 1094-1175.
- **Height:** 0.44 of the man there (216.7), about knee to waist on Thad, as the brief asks.
- **The hotspot:** it is 52 wide, narrower than the board's 81. Widening it to the board is the wiring's choice.
- **Thad's stand point:** THE SÉANCE SIGN's stand point (1134, 735, facing back) puts Thad squarely in front of the board and hides it. The render `renders/room-44-seance-sign-with-thad.png` stands him beside it at (1260, 735).

## 4. The graveside hearse, the gate's: `art/props/room-31-hearse.png` (the hearse)

**What it shows.** The gate's hearse (`art/actors/room-14-hearse-grievance.png`), seen from three-quarter rear:
- glass sides with tan curtains tied back;
- two brass lamps and the black finial;
- empty behind the glass;
- no horse (Grievance is her own figure).

It is drawn against the gate's hearse at 2x and the funeral with Thad.

**Size.** 1.292 of a man at its wheels, the gate hearse's own ratio (385 / 298). That makes it 550 x 437 at the man there (338.2).

**The rebuilt prop.** The new hearse is behind; item 2's open coffin group is in front, exactly where it stood. A few magenta key flecks between the spokes were cleared to transparent.

**Before and after:** `renders/room-31-hearse-before-after.png`.

**Tyler's first look (2026-11-16):** "The right edge of the coffin is cutoff and it's like weirdly pushed up against the carriage."

Both are fixed with no new operation:
- **The coffin's foot end.** Item 2's operation drew the whole box, but its right end ran about 12 px past the old 422-wide sheet, and the cut cropped it there. The sheet now grows 20 px to the right, so the box is whole. Its left edge stays where it was.
- **Space between coffin and hearse.** The hearse is set back: its wheels sit at room (505, 578), not (480, 620). It stands deeper in the yard, a little smaller on the room's curve, still 1.292 of the man there. The coffin stands clear in front of it.
- **The old hearse beside Grievance.** Grievance's own sheet, `art/actors/room-31-grievance.png`, had been cut from room-31's composition master with three leftovers of the old prop: the old hearse's front, the old lid's corner, and a scrap of grass beside her. With the hearse set back, these read as a second hearse.
  - The tool clears the same three regions in all four of her frames, 22,386 px each (`tools/art/acts-two-to-four-cut.py grievance`).
  - Her own pixels and her frames are unchanged.
  - **This is a sheet outside the four items**, changed because item 4 made those leftovers visible.

**Tyler's second look:** "the horse is clearly a cut out with different color grass around it and it's not attached."
- **The grass:** the master's green grass around her legs is cleared from her sheet, so she stands on the night plate's own blue ground. It is the green-over-blue, green-over-red pixels from her chest down; her coat and harness are neutral and stay. Any piece cut off from her body is cleared too. That makes 36,648 px cleared a frame in all, the same in every frame.
- **Attached:** the hearse's front comes left to meet her (its left edge at room x 239), so her traces run into its front wheel. Its wheels are at (505, 578), still set back behind the coffin.

**The sheet changed size, so the record must change with it.** These are wiring numbers, not done here:

| | x | y | frame |
|---|---|---|---|
| was | 361 | 733 | `[0, 0, 422, 578]` |
| **now** | **461** | 733 | **`[0, 0, 622, 578]`** |

- The coffin group lands where it was, its left edge unmoved.
- The hearse spans x 239-772, clear of the grave.

**Tests.** "No prop paints the plate over a figure behind it" now passes, both with the record as it is and with the new record applied (tried, then reverted). The overlap that tripped it was the dark hearse over the old-hearse strip, and that strip is gone.

**The render** with Grievance, the coffin and Thad, in her frames 0 and 3: `renders/room-31-graveside-hearse-coffin-grievance.png`.

## For Tyler's eye

1. Hob's face in the coffin plate.
2. The new hearse is brighter and a touch greener than the old navy one, because it is the gate's colours. It is not regraded.
3. Grievance, now without the old hearse or the master's grass, her traces into the hearse's front wheel. A faint blue edge from the master's sky still rims her plume and ears.
4. Thad's stand point at the séance sign hides the board.

## Checks

- All 67 checks pass.
- All 2,002 tests pass.
