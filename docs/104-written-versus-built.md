# THE LAST CLAIM IN CONSOLATION
## 104 · Written versus built — the audit, and what it found

*Errata 182. Tyler, 2026-11-08, after errata 180 and 181 turned up two scenes written and never built: "I'm concerned that after multiple audits, you're just now finding multiple missing scenes." He was offered two mechanical checks, written versus built and built versus heard, and said "Yes".*

## Why the audits missed them

Every earlier audit asked a different question:
- **The writing passes (docs 60–103)** read the documents and judged the lines. A scene that was written got read, built or not.
- **The full-game play-through** walks the shortest route. Optional scenes are off it.
- **The puzzle checks** ask whether every puzzle can be solved and nothing dead-ends. A missing optional scene breaks neither.
- **The skipped openings (errata 181)** were in the game and never played. Reading documents cannot see that.

None asked whether what the documents write is in the game.

## The two checks

1. **Written versus built:** `tools/check-written-vs-built.mjs`, in `run-all`.
   - Every quoted line in the 26 documents `/content` is extracted or compiled from is looked for in `/content`.
   - A line counts as in the game if it is there word for word, or if a content line shares 60% of its words. The first voice pass reworded many lines in place.
   - Every line that is not in the game is listed in `proofs/written-not-built.json` with its reason. A new one fails the check.
   - Lines under four words are below its bar, so two short gaps are named in the ledger by hand.
2. **Built versus heard:** a structural pass over the content.
   - Every dialogue node is reachable from its tree's start, an entry or a `goto`.
   - Every tree has an owner or is opened by a scene.
   - Every gate's flag has a writer (`check-flag-order`, already in place).
   - It found one fault, errata 181's: openings never said on `goto`. `tests/goto-opening.test.ts` now holds that fault.

## What it found: 124 lines written and not in the game

**Not gaps (77):**
- **Not a line (24):** quotations inside the documents: Tyler's words, rulings, notes, and table fragments.
- **In the game, reworded (15):** the hotspot is built and says it in other words, after the examine merge (errata 67–69) or the voice pass.
- **Superseded (10):** replaced by a later document or ruling:
  - UND_A1;
  - Room 1's case on the coach roof (the opening was restaged);
  - doc 08's Room 36 lines, where doc 05 governs;
  - doc 10's empty strongbox, where doc 05 governs;
  - the dropped Room 19 window line.
- **By design (3):** doc 49 lines for the coffin (invariant 2) and the listening chamber.
- **Waiting on art (20):** the second ledger's nineteen names, on the counter (errata 181). The image session is drawing it.
- **Superseded by staging (5):** the stage driver's barks for later acts. He leaves in the opening and is never placed again.

**Gaps (47), for Tyler:**

| # | Gap | Size | What it needs |
|---|---|---|---|
| 1 | **The six ancillary interiors** (rooms 37–42): the barber's, the boarding-house parlour, the photographer's studio, the bakehouse, the empty storefront and the schoolhouse. Also **their people**: the barber-dentist-surgeon, the photographer, and the two boarding-house women (doc 07 #9, #10, #14–15). | 25 lines found, plus each room's hotspots | Six rooms of art, four characters, and staging. Canon is 42 screens (errata 1), but these six were never on the full build list (errata 72), and the Lane shows the barber's and photographer's fronts shut. |
| 2 | **Fanshawe's war, paid off** (FAN_D1): "You were never a colonel." / "No. I wasn't." It needs five contradictions, and three are offered by no node, so it can never be reached (errata 84 I). | One scene and three questions | Wiring, and three options to put the contradictions on. |
| 3 | **Hob's running lines** (doc 04 HOB_A1): "Wouldn't stand there." · "It'll rain." · "That's not yours." · "You're the piano man." · "It's a bad claim." "They're all bad claims." | Five lines | Barks for Hob on his night rounds. They are clues, and they count against his forty words. |
| 4 | **Ozymandia at Prosperity in Act IV**, after the void, staring at the ground: "…It's loud here." | One line | Staging: her figure at Prosperity in Act IV. |
| 5 | **Refusals for objects that never became clickable** (doc 49): Room 1's sign, mud and road; the Registrar's chained pen, form stack and counter bell; Boot Hill's fence and oats; the shack's lamp reserve, calendar and stool; the claim row. **Examine lines** for Room 22's milepost and Room 25's workings. Doc 26's washstand USE, and a LOOK at Grievance herself. | 19 lines | Hotspots where the object is drawn, and lines wired where it already is. |

`proofs/written-not-built.json` lists every line, by group.
