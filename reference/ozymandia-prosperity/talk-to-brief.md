# TALK TO Ozymandia at Prosperity: what to wire (errata 189)

For the builder. Background: `reference/ozymandia-prosperity/talk-to-handoff.md` (Tyler chose **C**) and errata 188–189. **No image operation. No new words:** every line is already written.

## The words

- **Thad's**, in `docs/54-batch-c.md`, ROOM 23 & 24, `## Overrides`:
  - `MADAME OZYMANDIA · TALK TO` — "Madame Ozymandia. You're a long way from your tent."
  - `… TALK TO, *second time*` — "No fee today, Madame?"
  - `… TALK TO, *third time and after*` — "I'll leave you to it, then."

  `tools/extract-examine.mjs` already carries them in `content/examine/room-23.json` under `exitsAndUnplaced["MADAME OZYMANDIA"]`, keyed `TALK_TO`, `TALK_TO (second time)` and `TALK_TO (third time and after)`.
- **Hers**, every time, after his line: her one line, "…It's loud here.", read from the bark already in `content/ambient/prosperity-ozymandia.json`. **Never type it again.** Doc 04's "her only line" stays literally true.

## What to wire

1. **People mapping.** In `reference/room-23/annotation.json`, map `"MADAME OZYMANDIA"` to `["prosperity_ozymandia"]` under `people`.
   - The compiler then refuses on the qualifiers `(second time)` and `(third time and after)`, because `peopleWhen` takes flag conditions and these are repeats, not flags.
   - Make them a selection-counted sequence, the way an object's `say` and `repeat` work: line 1 the first time, line 2 the second, line 3 every time after.
   - Do it in the compiler or the engine, whichever is smaller and holds. Don't invent a flag per visit.
2. **She answers.** After Thad's line, she says her bark's line, in her colour, over her head, as one exchange (Thad, then her). Take it from her ambient file's `barks` for the current reputation.
3. **Walk first.** TALK TO on a figure with no tree should walk Thad to the figure's `walkTo` before the exchange, as a tree would. That is a small engine change, so add a test for it.
4. **Compile Room 23** (`node tools/compile-room.mjs 23 --write`).
   - A plain compile of Room 23 also moves Pratt's stake back to a stale place (x 411, y 724). Keep the stake where `main` has it, and fix the cause if it is cheap.
   - The only other changes should be her `peopleResponses` and what the steps above add.
5. **Not touched:** her approach bark (it still plays once on approach, as now), any puzzle, any flag, any LISTEN. Her other wrong verbs stay with the people pool unless Tyler asks.

## Check

- `npm test`, `node tools/run-all.mjs` and `npm run gauntlet` pass.
- Add a test: in Act IV after the void (her fixture), TALK TO three times gives Thad's three lines in order, each followed by hers; a fourth gives line 3 again; and Thad has walked to her `walkTo` first.
- Record it under the next free errata number on `main`, with the usual trailers and a `Lesson:` line. Send Tyler a short capture of the exchange.
