# 124 · The puzzles, held to what makes Monkey Island's fun (2026-11-10)

Tyler, 2026-11-10, of what still worries him before playing: "fun puzzles." Offered a review of all of them against what makes Monkey Island's puzzles fun, with the weakest ranked and a change proposed for each, and no puzzle changed without his word: **"go."**

Every earlier audit asked whether a puzzle is *fair* (doc 94: is the clue there) or *countable* (doc 116: objects, hands, verbs; `tools/check-pacing.mjs` holds those, and they all pass). This one asks whether solving it is *fun*. That is a judgement, and it is the builder's, made by reading every puzzle's design (doc 57, doc 02, docs 107-111, 115, 120) and how it completes in the built game (`content/puzzles/puzzle-graph.json`). Tyler's play is the test of it.

## What makes a Monkey Island puzzle fun

1. **The goal comes first.** You know what you want before you know how: the idol in the water, the three trials. A puzzle solved before it is posed is a surprise, not a solution.
2. **The answer is surprising and, afterwards, obvious.** The rubber chicken on the cable. You laugh because it was there all along.
3. **The hands do it.** You pick something up and use it on the world. Saying the right line can be a solution, but a game of them is a quiz.
4. **The payoff is a joke.** Solving is rewarded with the best line in the scene, or a thing seen.
5. **No waiting and no errands.** "Come back later" and "go and tell X" are what people remember disliking.

## The game, puzzle by puzzle, in one line each

**Strongest** (all five marks): A2 the piano for a room · A5 the raccoon · A8 the piano that pays · A9 the read-back ("East by Claim One") · A10 the dinner ended with the cover · B3 Grievance and the corrected tune · C3 the funeral manufactured for a dead man · C4 the office searched while the town is up the hill · D4 the plate at the gate · D5 Pratt turned with his own chalk · D6 "The stamp did not ask." · E0 "Herein." · E3 the estate sale (the hen, the coat, the raccoon sold) · E6 Hob as executor · E6b the hearse · E9 the same hand · F1 to F3 the warm hole, the listening, the wall · F4 and F5 the duel and the filing · G5 the fiddle tuned for a seat.

**Sound, and there to set something up** (a conversation that poses a goal, which is a conversation's job): A1 · A3 the swindle · A4 the map · A6 the refusal · B4/G6 the challenge · C1 and C2 Winnie's queue · D1 ninety days · D2 Pratt's refusal · D3 Sheng's terms · E0b the offer · E1 Sump's "standing" · E2 Section nineteen · G3 the camp's trust · G4 the find.

**Duels** (B5/G7, B6, F4): the insult fight is Monkey Island's own; the losses are by design and short.

## The five weakest, ranked, with what I propose

**1 · E5, the obituary: nothing to do but talk.** After Sump records the death, the obituary comes from the next TALK TO Frame. The player holds the death certificate and never uses it on anyone but the counter. *Proposal:* give Frame the certificate. Using it on him opens FRA_E1, exactly as the submission log on Winnie opens WIN_B2 (C5). TALK TO still works for a player who does not think of it. **No new lines.**

**2 · E4 → E5 → E6, three papers in a row.** The certificate from Winnie, recorded by Sump, the obituary from Frame, the executor's form to Sump: four counters-and-papers between the estate sale and the hearse. The pacing check passes (it never reaches four counters in a row on the route), and the paperwork is the running joke. But it is the longest stretch of the game where the hands rest. *Proposal:* proposal 1 helps. Beyond it, nothing I can do without writing: a new object step here would need new lines, which only Tyler can authorise. **Watch it in play.**

**3 · B1 and B2, two errands before Grievance.** Frame says where Vessel went; the livery man says whom Grievance moved for. Both are "go and ask", with no surprise in the answer. B3, which they set up, is one of the best puzzles in the game, so the errands are short and pay off. *Proposal:* none. **Watch it in play**: if Act II's start feels like a round of interviews, this is where.

**4 · C6, come back later.** After the assay is granted, Winnie's sparring (WIN_B4, pairs 5 to 9) waits until Thad has left the office and come back. The assay itself is already handed over at once (errata 232), so this is only the sparring, and only a wait. *Proposal:* drop the wait; WIN_B4 opens on the next TALK TO. **No new lines.** (Ask: is the wait a joke I am missing? Doc 53 records it as the assay "taking time", which it no longer does.)

**5 · Duel Two can be a grind.** It needs fourteen pairs of the twenty-three. The route guarantees fifteen (Duel One, Winnie, Pratt), but a player who skips the sparrings and goes straight to Vessel loses exchange after exchange, with no hint (invariant 4) and nothing new learned. Monkey Island's version had the same risk and the same cure, more fights. *Proposal:* none to the puzzle. **Watch it in play**: if a lost Duel Two is tedious rather than funny, the fix is in how fast a lost exchange plays, not in the rules.

## Not proposed

- No puzzle is removed, and none is replaced. The ending, the reveal and invariants 3 and 7 (the unmarked LISTEN lines and HOB_C1 option 4) are untouched; E9's quiet second way stays quiet.
- III-1, the archive searched, stays withdrawn (doc 121).

## What Tyler rules

- Proposal 1 (the certificate on Frame): yes or no.
- Proposal 4 (no wait for Winnie's sparring): yes or no.
- 2, 3 and 5 are for his play: one sentence after he has played them is enough to act on.

## Ruled, and done (errata 274)

- Proposal 1: made. The certificate on Frame opens the obituary.
- Proposal 4: kept as it is. The wait keeps WIN_B2's other questions open; see errata 274.
- 2, 3 and 5: looked at again on Tyler's "can you just make them better now?"; left as they are, for the reasons in errata 274. They remain for his play.
- 3, again (errata 278, Tyler: "Write them", then "Approve" of doc 125): B2 is now done by hand -- the question asked from the board of names, the tune heard by LISTENing. B1 is left as it is (doc 125).
