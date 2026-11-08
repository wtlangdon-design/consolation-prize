# Five written moments, acted: for the builder session (errata 189)

Written 2026-11-08. Tyler, asked which of five written moments to build (they are printed as text but never acted out), chose all five. **Nothing here is new writing.** Every moment below is already in the documents, word for word; this brief only says where it is and what it needs. If a moment cannot be acted without an image operation its asset has no budget for, **stop and ask Tyler** for the operation. Do not raise a cap yourself (`art/staging/caps.json` changes only on Tyler's word).

Read first: `CLAUDE.md` (character style gate, errata 77 movement), `docs/95-acted-directions.md` (how a direction becomes acted: its table, classes A/B/C, `performs`), `docs/55-full-game-build.md` §8. Never touch `wtlangdon-design/anchorage`.

Budget today (`art/staging/caps.json` against `art/staging/ledger.json`): **room-11 has 1 operation left; room-15, room-23 have none; room-17 has 1; room-12 has 1.** Audio costs no image operations.

## 1. Fanshawe's dinner (doc 48 S1, beats 3–4; errata 84 I b)

- **Beat 3:** "Whichever option — the pen with no ink, the charm, the handkerchief pocketed absently."
- **Beat 4:** "Thad on the porch, holding the deed wrong side up. 'A very fine dinner.' Beat. 'I believe I own something.'"
- **What it needs:** Thad seated at the laid table for the dinner (`?fixture=r11-b`), and Thad on the porch holding the deed upside down for beat 4's two lines. There is no seated clip or deed clip of Thad today.
- **Budget:** room-11's last operation, for one sheet with both poses, generated against Thad in Room 11 (style gate step 1). If one sheet cannot carry both, act the porch pose first, because it carries the line, and ask Tyler about the seat.
- **Then:** class A rows in doc 95 for the directions that become acted. Beat 4 stays where `transitScene` plays it now (errata 84 E).

## 2. Grievance and the tune (doc 54 Room 15, GRIEVANCE · USE THE TUNING FORK, after `T_HUM_HEARD`; doc 02 B3)

- **The direction, as written:** "(Thad strikes the fork on his boot heel and listens to it. Then he whistles the livery man's tune, corrected: the fourth bar lifted where the livery man let it sag. Grievance …)". Read the rest of the line in doc 54. Act what it says, in its order.
- **Sound:** the fork's A exists (`R33`'s fork and the case's fork use it). The whistled tune, corrected, is a new short cue: the livery man's hum (`LIV_A1` option 4) with its fourth bar lifted. Render it with the music tooling and give it a doc 45-style cue id. **Tyler approves new sounds by ear** (errata 102), so send it to him.
- **Art:** room-15 has no operations. First try to act it from frames that exist: Thad's fork clip if there is one, `pick-fit`-style held frames, and Grievance's ride or funeral sheets for her walk out of the stall. If her walk truly needs a new drawing, stop and ask Tyler for one room-15 operation.

## 3. The tonic's fumes, and the raccoon's look (doc 54 Room 23/24, A5)

- **The smoke:** "(It fumes. Thad retreats, coughing, as far as the claim marker.)" Thad walking backwards to the claim marker is a staged walk with his existing walk clip (no art). The fume itself is an effect over the hole. Make it with the engine's existing means if one exists; otherwise act the retreat only and report.
- **The blanket:** "(The cloth settles. A long pause. The raccoon emerges, gives Thad one look of complete contempt, and leaves at a walk.)" Hold the raccoon on a frame facing Thad for the look before his walk out. Use his existing frames; room-23 has no operations.

## 4. The county seal (doc 48 S6, beat 3)

- "The county seal comes down. One stamp. It is the loudest sound in the game and the score rests under it."
- Errata 28a's ban on timed sound is reversed for cues (errata 106), so this is buildable now.
- **What it needs:** one cue at that beat, a stamp much heavier than `U-STAMP`, and the score resting under it. Duck the music for the stamp and its tail, then let it come back. Set its level against errata 106's rule, and make it the loudest effect in the game on purpose. Check that `tools/check-sound-levels.mjs` allows it as the single named exception.
- **Tyler approves it by ear.**

## 5. Sowerby's counter (doc 04 SOW_C1, errata 75 note)

- "The counter shows the running total — ADJECTIVES and the price — from the opening until the negotiation ends; it starts at 0 and $0. Two dollars an adjective; the minimum rate is fifty cents, four words."
- **What it needs:** an on-screen tally during SOW_C1, reading the `SOWERBY_ADJECTIVES` counter, as two figures labelled exactly **ADJECTIVES** and **PRICE**, in the game's bitmap face (errata 62).
  - The price is two dollars an adjective, at or above the written minimum. Read the rule from doc 04, and do not restate it in code.
  - Its labels and placement live in content JSON, not in a `.ts` file (the no-content-in-code rule).
  - It is shown only while SOW_C1 is open.
- **No image operation.**

## Measure and ship

- `npm test`, `node tools/run-all.mjs` and `npm run gauntlet` all pass.
- Doc 95 rows: a direction that is now acted moves to class A.
- One pull request per moment, or one for all five. Record each under the next free errata number on `main`, with the usual trailers and a `Lesson:` line.
- Send Tyler: renders of 1 to 3, the two new sounds (the whistle and the seal) to listen to, and a render of the counter.
