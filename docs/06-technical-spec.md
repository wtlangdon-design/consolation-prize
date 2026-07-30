# CONSOLATION PRIZE
## Technical Specification & Build Brief — v1

*Final design document. Companion to Bible v2, the Puzzle Graph, the Liar's Assay, the Dialogue Trees, and the Examine Layer.*

---

# PART ONE — THE AMBIENT LAYER

*Added at your direction, and it turned out to be the piece that makes everything else feel alive. It also gets to reuse machinery already in the design, so it's nearly free.*

## The problem it solves

Everything specified so far is load-bearing. Every character gates a puzzle, every room contains something needed. A game built from only that is a *machine*, and the player feels it — Consolation would read as eleven people standing at their assigned stations waiting to be interacted with.

Monkey Island's Mêlée Island doesn't feel like that, and the reason is the people who don't matter: the pirates arguing in the SCUMM Bar, the lookout on the hill, the men who exist to be talked to and give you nothing.

## The propagation engine — Frame's headlines

**This is the key idea and it costs almost nothing to build**, because the machinery already exists.

Ignatius Frame prints Thad's humiliations on the front page of the *Clarion*, misspelled, within the hour. **Everyone in Consolation reads the Clarion.** So the eight headline events are already a global state-broadcast system, and every ambient NPC can be keyed to it.

| `REPUTATION` state | Set by | Town's attitude |
|---|---|---|
| `R_NOBODY` | start | Nobody looks up |
| `R_SWINDLED` | A3 headline | Pity, openly |
| `R_RACCOON` | A5 headline | Amusement |
| `R_BORDERS_MOTT` | A9 headline | **Sudden, universal warmth** |
| `R_SURVEYED` | A7 headline | The Ozymandia joke |
| `R_LOST_DUEL` | B5 headline | Contempt |
| `R_WON_DUEL` | B6 headline | Grudging respect |
| `R_DEAD` | E5 obituary | **Everyone is very strange with him** |
| `R_TRUTH` | F4 | Adoration, for entirely the wrong reason |

Every ambient NPC carries one bark per reputation state. Eighteen NPCs × nine states = **162 lines that make the entire town appear to be paying attention to the player**, delivered by a system that is one integer and a lookup.

`R_DEAD` is the best of them. Thad is legally deceased and walking around, and Consolation — a town that has never let a fact inconvenience it — simply accommodates this. Nobody screams. The pie woman says *"Thought you'd passed."* Thad says *"I did."* She says *"Well."* And sells him a pie.

## Ambient NPC roster — 18

Each carries: a 2–4 node micro-tree, one bark per reputation state, and idle animation. **None gates any puzzle.** Three of them quietly resolve hotspots the player has already read.

| # | Character | Hook |
|---|---|---|
| 1 | **The letter-writer** | Writes letters home for men who can't. Charges by the page. **Resolves the Main Street notice board hotspot.** Thad, who writes his own, finds him fascinating and slightly threatening |
| 2–3 | **The two boundary men** | Have been arguing about the same forty feet for six years. Neither claim has any gold. Both know. Talkable in every act; the argument advances by one inch per act |
| 4 | **The bell-ringer** | Strikes the church bell by hand, half a step flat, drunk. Thad can LISTEN and be visibly pained. Never fixable |
| 5 | **The message boy** | Runs notes for a penny. Knows more about Consolation than anyone. Will not be drawn out. Is nine |
| 6 | **The pie woman** | Pies of unstated provenance. Best `R_DEAD` bark in the game |
| 7 | **The man leaving tomorrow** | Has been leaving tomorrow for four years. His bark changes tomorrow each time |
| 8 | **The hotel clerk** | Has Thad's name misspelled in the register, differently from the Clarion, and considers his version authoritative |
| 9 | **The barber-dentist-surgeon** | One man, three trades, one set of instruments. Period-accurate. Offers all three services in a single sentence |
| 10 | **The photographer** | Sells stock portraits by the gross. **Has the Mott photograph in his window.** Thad can buy one. It is the same man |
| 11 | **The fiddler** | Plays in the Nugget. Tuned to the flat piano, so he is flat too. In Act IV he is the first instrument to correct |
| 12 | **The stage driver** | Arrives, complains, departs. His axle is the one Thad heard in Room 1 |
| 13 | **The one-strike man** | Found colour once, in 1849. Will describe it to anyone. It gets smaller each time he tells it, and he does not notice |
| 14–15 | **The boarding house women** | Run the only solvent business in town. Regard the entire gold rush as a temporary weather event |
| 16 | **The map seller** | Sells maps to Mott's strike on Main Street. Unknowingly employed by the Improvement Company. Genuinely believes in them. **The saddest character in the game and he is played entirely for laughs** |
| 17 | **The card sharp** | Cheats openly. Everyone knows. Nobody minds. He is the only honest man in Consolation about what he does |
| 18 | **The dog's owner** | Looking for the lost dog on the notice board. The dog is on Main Street. **The player can resolve this. It is worth nothing and it is the nicest thing in the game** |

## Ancillary interiors — 6

Enterable, gate nothing, contain no required items. Each has 5–8 hotspots and one ambient NPC.

**The barber's** · **The boarding house parlour** · **The photographer's studio** · **The bakehouse** · **The empty storefront** (something failed here; the sign is still up) · **The schoolhouse** (no teacher, never had one, the town built it first)

*The schoolhouse is a joke about civic optimism that is not a joke.*

## Ambient object rules

1. **Every door on every street opens or gives a reason.** No painted-on doors. If a building can't be entered, Thad says why, and the reason is different for each.
2. **Every ambient NPC is TALK TO-able in every act**, and their line differs by act and reputation.
3. **The town has a clock.** Not a game-mechanical clock — a *visual* one. Ambient NPCs occupy different positions in day and night states. The bell-ringer, the message boy, and the watchman are the only three who move between them.
4. **Nothing ambient is missable in a way that matters**, and everything ambient is missable.

**Cost:** ~18 micro-trees (~180 lines) + 162 reputation barks + 6 interiors (~80 hotspots, 160 lines) ≈ **500 lines.** It brings the written total to roughly **3,650 lines**, and it is the difference between a puzzle box and a town.

---

# PART TWO — TECHNICAL SPECIFICATION

## Engine

**Phaser 3, TypeScript, browser-delivered.**

Rationale, plainly: it is 2D-native (you are not fighting a 3D engine to draw a flat painting), it is mature with excellent documentation — which matters directly, because it means an implementing agent has good training data and will hallucinate less API — it handles scenes, sprites, and audio without additional frameworks, and it deploys to a URL, which means you can play it on the Chromebook and hand it to anyone with a link.

**Explicitly not ThreeJS.** A 3D engine for a hand-painted 2D point-and-click means building a 2D renderer on top of a 3D one and paying for it forever.

## Architecture — the one rule that matters

> **No content lives in code. All content lives in JSON. The engine reads the JSON and knows nothing about Consolation.**

The writing *is* the game — 3,650 lines of it. If a line of dialogue requires touching a `.ts` file to change, the game will not get edited, and it needs to be edited perhaps twenty times per line.

```
/engine        Phaser scenes, verb system, inventory, dialogue runner,
               flag store, audio manager. Knows nothing about the game.
/content
  /rooms       35 + 6 ancillary — background, hotspots, exits, act variants
  /hotspots    LOOK and LISTEN lines, per act state
  /dialogue    Trees, nodes, options, tags, gates, state changes
  /assay       24 pairs, 4 duels, mockery pool
  /ambient     18 NPCs, micro-trees, 162 reputation barks
  /flags       Definitions, initial state
  /audio       Stem manifest, room mix map
/art           Backgrounds, sprites, UI
/audio         Stems
```

## Core systems

**Verb system.** Nine verbs, bottom panel. Selected verb + clicked hotspot → action lookup. Default verb on double-click is WALK TO. Unhandled combinations return a Thad line from a per-object fallback pool, never a generic "I can't do that" — the fallback pool is itself comedy and should run to about 40 lines.

**Flag store.** Flat key-value, booleans and integers, as specified in the Dialogue document. Everything in the game — dialogue gates, hotspot variants, ambient barks, puzzle state — reads from this one store. It is also the entire save file.

**Dialogue runner.** Reads trees from JSON. Evaluates gates against the flag store. Renders options with their tags. Applies state changes on selection. Handles greyed-but-visible exhausted options and repeat-selection variants.

**Save system.** Serialize the flag store, current room, inventory array, and reputation integer. That is the whole save. Autosave on room transition. This is trivially small and trivially reliable, and it falls directly out of the flag-store design.

**Inventory.** Array of item IDs. Every item has LOOK and LISTEN lines. Combination is a lookup table of pairs.

## Audio — the tuning system

The most technically interesting part of the build, and it is much simpler than it sounds.

**Structure:** the score is stems — piano, fiddle, jaw harp, distant harmonica — all at one tempo on a shared harmonic grid. Each room has a stem mix. Room transitions crossfade at the next bar boundary rather than cutting. This is the iMUSE effect and it is achievable with Web Audio scheduling.

**The tuning arc:** every stem plays through a Web Audio `detune` parameter, set globally to **−35 cents** for the entire game. Consolation is flat, everywhere, always, and the player never consciously registers it.

In Act IV, during F2, that single parameter animates from −35 to **0** over ninety seconds.

**The entire emotional arc of the game is one automated Web Audio parameter.** It is perhaps twelve lines of code and it is the best thing in the build.

*(The fiddler in the Nugget corrects first, about twenty seconds in. He is the only NPC who ever notices.)*

## Art pipeline

Hand-painted 2D backgrounds at 1920×1080, one per room, with a separate walkable-area mask and a depth-sort layer. Character sprites hand-drawn, roughly 8 frames per walk cycle per direction, plus idles. Palette locked per the Bible: mud, ochre, dust, pine, with peeling optimistic colour on the false fronts only.

**41 backgrounds. This is the long pole of the entire project** and should be scheduled first, not last.

## Platform targets

Desktop browser first, 1920×1080, mouse. Runs on a Chromebook — verify continuously, since that is the machine it will be reviewed on. Touch/mobile is a later port and should not constrain the verb interface now.

---

# PART THREE — THE BUILD BRIEF

## What to hand Claude Code

All five design documents, and this instruction set. Not a vibe.

## Phasing

**Phase 1 — Engine skeleton.** Phaser project, verb panel, flag store, room loader, dialogue runner, save/load. **No content.** Acceptance: a test room with three hotspots, all nine verbs functional, a two-node dialogue tree, and a save that survives a browser refresh.

**Phase 2 — Vertical slice: Room 2, Main Street.** One finished room. Real background, all nine hotspots with LOOK and LISTEN, three ambient NPCs, working exits, audio for one room. Acceptance: **it is fun to click around in for five minutes with no puzzle in it.** If it isn't, nothing later will save it.

**Phase 3 — Content pipeline.** Tooling to get JSON content in and validate it. Acceptance: a broken flag reference or a missing LISTEN line fails a validation pass rather than shipping silently.

**Phase 4 — Act I complete.** Ten puzzles, eight rooms, playable end to end. Acceptance: **a person who has not seen the design documents completes Act I without a walkthrough.** This is the only puzzle-quality test that means anything.

**Phase 5 — Acts II–IV.** Bulk build against the graph.

**Phase 6 — Audio, the tuning arc, and polish.**

## Acceptance criteria — the actual point

Your original prompt asked for "utterly perfect" and "AAA quality," with a critic subagent doing blind visual comparison. Those aren't criteria; they're adjectives, and an agent handed adjectives will either loop forever or declare victory arbitrarily. Every criterion below is checkable by a person in under a minute:

- Every hotspot returns a distinct LOOK line and a distinct LISTEN line. No repeats across the game. **Validation script, not a judgement call.**
- Every dialogue node offers ≥3 options and ≥1 `[COMIC]` option. **Validation script.**
- No flag is read before it can be written. **Validation script.**
- Every one of the 43 puzzles is reachable from a fresh save. **Automated graph traversal.**
- No dead ends: automated traversal confirms the win state is reachable from every reachable state.
- Act I is completable by a naive tester without hints.
- The game runs at 60fps on a Chromebook.
- Save/load restores exact state including partial dialogue trees.

## What NOT to let the agent do

1. **Do not fan out subagents on content.** Parallelised comedy produces tonal mush. One voice writes Thad, or Thad has no voice. Subagents are fine for engine plumbing, art batching, and validation tooling — never dialogue, never examine lines.
2. **Do not let it "optimise" dialogue.** ~40% of selectable options do nothing. Every optimisation pass will identify them as dead code. They are the product.
3. **Do not let it fix the coffin.** Room 32 has no verb panel and no hotspots. This will be logged as a bug in every review.
4. **Do not let it emphasise the three load-bearing LISTEN lines.** No sting, no highlight, no hint system.
5. **Do not let it add a hint system at all.** The no-dead-ends guarantee is the accessibility feature.
6. **Do not `/loop` on quality.** Loop on the validation scripts, which have exit conditions. "Until it's perfect" has none.
7. **Do not generate the examine lines.** ~890 lines, and it is where the charm lives. Generated examine text is the single most detectable tell in an AI-built adventure game.

## Sequencing note

Commission the 41 backgrounds before Phase 4. Art is the long pole and everything else can be built against placeholders.

---

# THE DOCUMENT SET

| Document | Contains |
|---|---|
| **Bible v2** | Story, characters, stakes, verbs, rooms, music, art, the opening |
| **Puzzle Dependency Graph** | 43 puzzles, item ledger, dead-end audit, cross-act reuse |
| **The Liar's Assay** | 24 boast/counter pairs, 4 duels, wrong-answer pool |
| **Dialogue Trees** | 8 full trees, ~40 flags, letters home, ~2,250 lines |
| **The Examine Layer** | LOOK/LISTEN doctrine, 12 scripted rooms, 23 manifests |
| **Technical Spec** | This document — ambient layer, engine, audio, build brief |

**Remaining writing:** ~420 examine lines (manifest rooms) and ~500 ambient lines. Roughly 920 of 3,650. Everything else is specified.

That is a complete design for a ten-to-twelve-hour comedy adventure, and it is what should be handed to a build agent — instead of four sentences containing the word "perfect."
