# Winnie takes out the second ledger: for the session with the image key (errata 181)

Written 2026-11-08. **This needs Tyler's cap first.** No asset in `art/staging/caps.json` covers it. Ask Tyler to add one (suggested: asset `room-05-second-ledger`, 3 operations), and record his words in its `why`. Then check `art/staging/ledger.json` before every operation.

## Why

WIN_B3, the second ledger, is built (errata 181). WIN_B2's "Has nobody ever noticed?" now opens it, and the scene plays:
- "Nineteen names. Men who came to this window with a question about Claim One."
- "They stopped coming to the window."

Doc 04 calls it "the scene where the game turns from comedy to mystery". Errata 66 E rules that **Winnie produces the ledger from under Room 5's loose floorboard herself** (66 D puts the board in Room 5, the front office).

Today the retrieval is a printed direction, "(She produces it from under the floor.)": doc 95 row 74, class B, physical with no pose drawn. She stays behind her counter, and no book appears. This brief draws what the direction says, so that it can be acted and the printing stops.

## What to draw

1. **Winnie's retrieval.** She comes round the counter's end, kneels at the loose board, lifts it, takes out a ledger, and stands holding it. Draw it as a few frames on one sheet against her current sheet and Thad in the room (the character style gate in `CLAUDE.md`: Thad's look, measured before anyone looks). Ending on her holding the closed ledger is enough. She does not need to walk back; she can stand where she rose while the scene plays.
2. **The board, lifted.** The floorboard's third state, beside `rest` and `pressed` (`content/rooms/assay-office.json` `floorboard.states`). It is the plank raised and the dark space under it, from the plate's own pixels, as `tools/pixelart/floorboard.py` derived the other two, in night and day. This may need no image operation at all.
3. **The ledger.** One book, held, plainly a different book from the one on her counter: smaller and older, with a cloth cover.

## Then (not the image session's)

- Doc 95 row 74 moves from class B to class A, with her frames.
- The board's `lifted` state is shown while the scene plays.
- Errata 66 E's undecided after-state gets decided: does the ledger go back under the board, or stay on the counter? If it stays, doc 54's THE NAMES (the nineteen entries) and doc 08's THE SECOND LEDGER become readable on the counter. That is Tyler's call. Ask him.

## Read first

- `CLAUDE.md`: the character style gate, and the room composition order.
- Errata 66 D and E.
- Doc 53's WIN_B3 contract.
- `docs/55-full-game-build.md` §8.
- Room 5's floorboard notes in `content/rooms/assay-office.json`. The board is owner-accepted and frozen: its `rest` and `pressed` images do not change.

Never touch `wtlangdon-design/anchorage`.
