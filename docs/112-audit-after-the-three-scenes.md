# 112 · The whole game, audited again (2026-11-09)

Tyler, 2026-11-09: "Can you do a full, new audit to see how everything lands now and if we still need to add more scenes like we just added to make it feel fun, funny and MI esque?"

This is the audit. It proposes; it builds nothing new and writes no lines. Every proposal in §4 needs Tyler's ruling before a line or a picture exists.

**What was done.** The whole game was played in the real build from NEW GAME to THE END (`npm run gauntlet:full`, recorded), on main after errata 240. The transcript (`renders/playthrough/transcript.md`, 2,193 lines) was read end to end, and every one of the 232 frames was looked at on the four contact sheets (`renders/playthrough/act-N.webp`).

---

## 1 · Does it run

| | |
|---|---|
| Breaks | 0 |
| Reaches THE END | yes |
| Console errors, failed requests, text off the screen | 0, 0, 0 |
| Oddities | 2 (below) |
| `npm test`, puzzle graph | pass, 53 of 53 |

**The two oddities.** Twice a prop was wanted before its picture had loaded and nothing was drawn for that moment: the Nugget's empty barrel (step A3.2) and the bare desk in Fanshawe's office (step E0b.2). Both files exist and both are in the room's preload list. The 2026-11-07 run had none. The cause is not established: the recording browser ran at about 11 frames a second, so it may be the test machine. It is on the list in §5.

**Frame rate.** The numbers this run recorded (7 to 12 a second) are the recording browser drawing in software while saving frames. They say nothing about a Chromebook. That check is still Tyler's.

---

## 2 · How each stretch plays

"Hands" is a step where the player does something to the world (USE, PICK UP, OPEN, LOOK, LISTEN, a duel). "Talk" is a conversation step. Minutes are the scripted run's, which reads every line at reading speed and explores nothing, so a player's are longer.

| Stretch | Minutes | Hands | Talk | Verdict |
|---|---|---|---|---|
| Act I | 18 | 13 | 10 | Lands |
| Act II, front: the Clarion to Fiddler's Gulch and back | 15 | 7 | 8 | The best stretch in the game |
| **Act II, back: the three papers (C1 to D6)** | **19** | **4** | **16** | **The weak stretch now** |
| Act II, the rematch | 3 | 1 | 1 | Lands |
| Act III | 28 | 15 | 13 | Lands; was the weak one, is not any more |
| Act IV | 11 | 11 | 3 | Lands; quiet on purpose |

**Act I** is unchanged and reads well: the swindle, the piano's two dollars, the hole with the raccoon in it, the dinner.

**Act II, front** is the game at its most Monkey Island. Thad whistles a stuck mule out of her stall with a tuning fork, rides to another camp, buys his way past a lookout with a newspaper that proves he owns nothing, finds his father's watch on a nail, tunes a fiddle for a seat, loses a lying contest five to nothing, and then carries insults up and down a river between two men who each think he was sent by the other. Every step is a different kind of thing to do, and the insults he carries are the answers he needs later.

**Act II, back** is where it sags. Detail in §3.

**Act III** now has three scenes the player does with his hands: under the séance table, the hen and the raccoon, and the hearse that will not go. The séance and the estate sale are funny on the page and in the frames. The stretch from the estate sale to the hearse was still five counters in a row (Winnie, Sump, Frame, Hob, Sump). §5, row 1, takes one of those out.

**Act IV** is three swings of a bad pickaxe, the last duel in the street with the town watching, four papers on one counter, and the letter home. It is short and it is meant to be.

**Is it funny.** Yes, throughout. The writing was never the problem. What made Act III drag was the ratio of talking to doing, and that is exactly what is still wrong with the back of Act II.

---

## 3 · The weak stretch: the three papers

From Winnie's "eight months" to Pratt's "ninety days", in play order:

Assay office · Registrar · tent · Clarion · church · Prosperity · Pratt's claim · laundry · Clarion · **Fanshawe's office** · Boot Hill · laundry · Assay office · Pratt's claim · Registrar.

Fifteen stops. At thirteen of them the player picks lines from a list. The four things done by hand are: give the Reverend a letter, pick the log up off a desk, open a drawer, give Winnie the log.

The lines are good (Sump's "this office is linear", Pratt's "Nine dollars and a hen", Winnie's nineteen names). But three things the player sets in motion happen where he cannot see them:

1. **Pike's memorial.** The player arranges a funeral in three conversations (Frame, the Reverend, Frame again) so that Fanshawe will leave his office. He never sees it. He walks into an empty office and is told "The service is over."
2. **The burglary.** Winnie says the log is "in a drawer he sits in front of all day." When the player gets there, it is lying on the desk. One click. The single hands-on room in the whole stretch has nothing to solve in it.
3. **The collection.** Sheng sends Thad to collect nine funerals of linen from the Reverend. It happens by itself on arriving at Boot Hill. And the line says "The town is coming back down the hill, Colonel Fanshawe in front, holding his hat", while the picture shows the Reverend and Thad alone on an empty hill.

Pratt jumping the claim (D2) is the fourth: a man is pulling up Thad's stake and hammering in his own, and all the player can do about it is talk.

In Monkey Island terms this stretch is the three trials, and one of the three (the affidavit: the journey and the river) is a full adventure while the other two (the assay, the neighbor) are errands run across counters.

---

## 4 · Proposals — Tyler rules on each

No more scenes are needed in Acts I, III or IV. The back of Act II wants one real scene and up to two small ones. In order of what they buy:

### P1 · The burglary becomes a room puzzle (recommended)

Fanshawe's office, empty, the town on the hill. The log is in the drawer, as Winnie said, and the drawer is locked. Everything needed to open it is in the room already (the saber on the wall, the eleven chairs, the safe, the portrait, the drawer of stock portraits that is already a joke). A classic one-room puzzle: three or four steps, a wrong-try line for every sensible wrong thing, and the stock-portrait drawer kept as the laugh on the way.

- **Why this one:** it is the only hands-on room in the stretch, the player has just done three conversations' work to empty it, and Winnie has promised a drawer.
- **Cost:** about 15 to 20 new lines (a writing exception from Tyler, like errata 113's and 127's). One or two image operations for an open-drawer state, or none if the drawer is shown by Thad's line alone. No change to any flag the rest of the game reads: the room still ends with the log in hand.

### P2 · The stake (small, no pictures)

At Prosperity, while Pratt is jumping the claim: PULL his stake and he puts it back; PUSH it, PICK UP the mallet, and so on. A short run of things that do not work, each with its line, ending where it ends now ("Nine dollars"). Nothing is solved here; it is a gag the player gets to poke at, like the rubber tree.

- **Cost:** about 8 lines. No art: Pratt's sheet already has the two hammering poses, unused in this room.

### P3 · The town on the hill (smallest)

At Boot Hill for the collection, draw the mourners coming down, so the picture shows what Thad's line says. The mourners and the Reverend at the gate already exist from Act III's hearse scene.

- **Cost:** no new lines and no new pictures; placement, a scale check and a proof. A fuller version, where the player takes the money from the plate himself, would be about 6 lines more.

### Not proposed

- **Showing Pike's memorial itself.** Thad is meant to be in the office while it happens; that is the trick. P1 and P3 show both ends of it.
- **Anything in Act IV.** Its quiet is the design (the detune, the lamp).
- **Cutting any counter visit in the stretch.** The order is the three-papers joke; the cure is things to do, not fewer people.

---

## 5 · Smaller findings

| # | Finding | State |
|---|---|---|
| 1 | Act III took the death certificate and Hob's form to Sump in two visits. Doc 110 (row 8) planned one. The game always allowed one; the played route did not use it | **Being done**: the played route sees Hob first and takes both to Sump together (the model run passes, 1,565 tests; the browser run is being recorded and the route lands with it). Four Registrar visits in Act III become three |
| 2 | Winnie's sparring lesson ("Teach me to answer a boast.") is only offered after Thad has left her office and come back (errata 232). Nothing tells the player to. It is the one source of an answer Duel Three throws | For Tyler: leave, or offer it without the walk out |
| 3 | The pie woman's bark still prints twice on one pass along Main Street at three points (transcript lines 867–868, 1482–1483, 1844–1845). Errata 221 fixed three-in-90-ms; this is two | Open |
| 4 | Two props a moment late (§1) | Open; cause not established |
| 5 | Pratt walking out of the Registrar's (frame 0139) reads large and crisp beside Thad. Measured, he is within his ruled 0.96 stature at a nearer depth; it is the hat, the stride and the mallet. Tyler has seen this walk (2026-11-06) | For Tyler's eye when he plays D6 |
| 6 | Act IV opens in Thad's room with daylight in the window ("the coach is at noon"); every outdoor frame after it is night until the last dawn | For Tyler: taste |
| 7 | Still open from before: the Sowerby-notice trim; the Chromebook frame-rate check; CLAUDE.md says 45 puzzles and the graph has 53 | Tyler's |
