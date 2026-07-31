# THE LAST CLAIM IN CONSOLATION
## Road to Done — full remaining scope

*Written after Phase 2 shipped and deployed. Honest sizing, including one significant scope discovery.*

---

# THE SCOPE DISCOVERY

**The written-content estimate of ~3,850 lines is wrong. It counted first-pass LOOK/LISTEN and dialogue only. It did not count repeat variants, verb fallbacks, or exit hotspots — and Room 2 has now shown what those actually cost.**

Room 2 required, beyond its first-pass examine lines:
- ~54 repeat variants (doc 13)
- ~50 verb fallbacks and object overrides (doc 13)
- ~50 exit hotspot lines (doc 14)

That is **~154 additional lines for one room**, and Room 2 has only nine hotspots. The average room has fifteen.

Extrapolated flat across 42 screens: **~6,000 additional lines**, taking the project total to roughly **9,800**. That is not a realistic hand-written target.

## The decision: no tiering. Uniform standard everywhere.

**Ruled by Tyler, 30 July 2026: every room is written to the Room 2 standard. The line total is not a constraint on this project.**

Tiering was considered and rejected. There is no deadline, no budget per line, and no reason to accept "adequate" in a room a player might spend ten minutes in.

**Working total: ~9,800 lines.** Treat it as a fact about the project, not a problem with it.

### What actually threatens quality at this volume

Not exhaustion of time or budget — degradation of voice. The failure mode is line 4,000 reading flatter than line 100 and nobody catching it, because the person writing it has stopped hearing Thad and started producing examine lines.

Four practices, all free:

1. **Batch by voice, not by room.** Write all of one character's dialogue in one sitting; write all of one verb's fallbacks together. Room-by-room authoring forces constant tonal context-switching and it shows.
2. **Short sessions.** Room 2's 154 lines were good because they were one focused pass. Volume sessions sag around the 300-line mark, and they sag invisibly.
3. **No fixed order.** Write whichever room is interesting that day. Nothing in the build depends on examine content arriving in sequence.
4. **Cold reads.** Re-read batches out of order a week later. Flat lines announce themselves once you have forgotten writing them. This is the only reliable quality check available.

### The actual constraint

CLAUDE.md forbids the build agent from generating written content. Every one of those ~9,800 lines is hand-written in chat and committed. That is a deliberately narrow pipe, and it is the correct one — generated examine text is the single most detectable tell in an AI-built adventure game.

Plan around the pipe, not around the total.

---

# 1 · DESIGN — complete

- [x] 14 design documents
- [x] Errata with 16 rulings
- [ ] **Reconciliation pass** — fold all 16 rulings back into the source documents (errata lists the file-by-file edits)
- [ ] **Room tiering decision** (above)

# STATUS — 31 July, after the vertical slice

**Doc 22 §6 runs end to end in Main Street on THE WATER TROUGH.** Resolve, walk to staging point, wait, turn to facing, wait, chore, script, respond — with a real route around an obstacle, not a straight line. This was the external audit's central criticism and it is addressed: the components have now been shown to combine.

Built since that audit: polygonal walk boxes with breadth-first routing and per-box scale and clip; staging points with required facing on 60 objects across 11 rooms; a five-step sequence runner; the single-click model with `defaultVerb`; entrance placement; real Thad sprites in the runtime; the foreground plane; two-frame crowd idles; text inventory with authored display names.

**Now due rather than deferred:** an actor routing behind the trough is drawn over it. Y-sorting and per-box clip levels (doc 22 items 4 and 6) were correctly deferred and are now reachable in play.

**Still not started:** audio, object states, Acts I–IV content, 39 backgrounds, 30 characters.

---

# 2 · ENGINE

Built:
- [x] Nine-verb panel, flag store, room loader, dialogue runner
- [x] Save/load, validation tooling, content pipeline
- [x] Depth zones — superseded by errata 24: two drawn sizes, continuous decimation, snap at the measured eye-death row
- [x] Deploy to Pages
- [x] **Polygonal walk boxes, routing, per-box scale and clip** (doc 22 items 1, 5)
- [x] **Staging points with required facing** (item 3)
- [x] **Sequence runner — walk, waitForActor, face, chore, say** (item 8, reduced)
- [x] **Single-click model with defaultVerb** (item 11, errata 28b)
- [x] **Entrance positions and facing** (item 2)
- [x] **Real Thad sprites in the runtime** (item 7)
- [x] Foreground plane (flat; per-box clip levels pending)
- [x] Text inventory panel, 8 Act I items wired

Not built:
- [ ] **Y-sorting and per-box clip levels** (doc 22 items 4, 6) — **now due, not deferred.** An actor routing behind the trough draws over it
- [ ] **Object visual states and ownership** (item 9)
- [ ] **Inventory combination table** — the array, panel and item lines are built. **~40 item icons RESTORED per errata 29 — inventory uses icons after all**
- [ ] **The Liar's Assay** — turn-based duel: boast/counter resolution, five exchanges, learn-by-losing, mockery pool, pair acquisition state
- [ ] **Reputation broadcast** — integer state, ambient bark firing on approach, one-shot-per-state
- [ ] **Letters home** — three-version choice UI, per act, tracking nothing
- [ ] **Scripted sequence system** — the opening 90 seconds, the funeral, the public duel. Non-interactive beats with timed dialogue
- [ ] **The coffin (E7)** — verb panel removal, three-minute timer, audio silence, panel restoration
- [ ] **The Listening (F2)** — pitch-based spatial puzzle, no text hints, tied to the audio system
- [ ] **Act transitions and gating**
- [ ] **Music manager** — stem mixing, bar-boundary crossfade, global detune with Act IV automation
- [ ] **Palette cycling** — per doc 18. Ramp rotation on the indexed canvas, reserved index ranges, Options toggle, and Room 33's ramp-to-zero scripted against the detune automation
- [ ] **Puzzle graph traversal** — written but inert; activates when the graph is in the manifest

# 3 · ART

Backgrounds — **2 of 41 done**:
- [x] Room 2 (Main Street), Room 36 (dawn variant)
- [ ] **Interior component library** — in progress. Enclosed volume, floor plane, lamplight, furniture. Blocks 11 of Act I's 14 rooms
- [ ] 19 interiors
- [ ] 9 exteriors (diggings, ridge, roads, Boot Hill)
- [ ] 6 ancillary interiors
- [ ] 5 Act III/IV rooms
- [ ] Room 32 (coffin) — black frame, produced in post, not painted

Characters — **1 of 31 done**:
- [x] Thad — 3 sizes, 3 views, mud and boardwalk walk cycles
- [ ] Thad, full coverage per the dossier's protagonist minimum:
  - [ ] four-direction walk and idle
  - [ ] **face-direction change without walking**
  - [ ] talk — left, right, near-front
  - [ ] **three use heights** — pick up low, use at waist, use overhead
  - [ ] give and take
  - [ ] **eye shift and head turn** — cited as the highest-economy comic beats; a two-frame eye movement does the work of a full reaction
  - [ ] short comic reaction
  - [ ] tuning fork, and three scripted specials
- [ ] 8 core named characters
- [ ] 4 minor named characters
- [ ] 18 ambient characters (may share base sprites with measured palette swaps)
- [ ] All subject to ruling 16 — measured legibility per room they appear in

Interface:
- [ ] Inventory panel, dialogue overlay polish, title and credits. **~40 item icons, per errata 29**

# 4 · AUDIO — **nothing exists**

This is the largest wholly unstarted area and the biggest unretired risk in the project.

- [ ] **Compose the score** — badly-tuned upright piano, fiddle, jaw harp, distant harmonica. One tempo, shared harmonic grid, stems
- [ ] Per-room stem mixes for 42 screens
- [ ] iMUSE-style crossfade at bar boundaries
- [ ] Global −35 cent detune, animating to 0 across 90 seconds in Act IV
- [ ] SFX — footsteps by surface, doors, dirt on a coffin lid, the flat church bell
- [ ] The Listening chamber's resonance audio, which is a puzzle mechanic rather than dressing

**Flagged honestly:** procedural pixel art succeeded. Procedural *music* is a different proposition, and the score carries the emotional arc of the entire game via the tuning resolution. This is the strongest remaining candidate for commissioning a human.

# 5 · WRITTEN CONTENT

Written:
- [x] All first-pass examine lines, 42 rooms
- [x] 8 core dialogue trees
- [x] 24 Liar's Assay boast/counter pairs
- [x] 18 ambient micro-trees, 162 reputation barks
- [x] Room 2 repeat variants, fallbacks and exits

Not written:
- [ ] **Repeat variants and verb fallbacks, 41 rooms** — the scope discovery above. ~4,000 lines at tiered standard
- [ ] **Exit hotspots, ~40 rooms** — seen-from-outside lines, distinct from the room behind
- [ ] **72 Liar's Assay wrong answers** — three per pair; only pair 1's are written
- [ ] **Letters home** — 4 acts × 3 versions
- [ ] **4 minor character trees** — Sump, Vessel, the livery man, the undertaker. Sketched only
- [ ] **~40 inventory item LOOK and LISTEN lines**
- [ ] Act-gated dialogue variants for all 8 core trees

# 6 · INTEGRATION — by act

- [ ] **Act I** — 10 puzzles, 14 rooms. Acceptance: a naive tester completes it without a walkthrough
- [ ] **Act II** — 18 puzzles, three parallel trials. Largest act
- [ ] **Act III** — 10 puzzles, the funeral, the coffin, the Hob reveal
- [ ] **Act IV** — 5 puzzles, the Listening, the final duel, the filing, the ending

# POLISH LIST

**Opened when art direction froze.** Anything that looks wrong from here goes
here rather than becoming a ruling. One pass across everything at once, at the
end, against a settled rulebook — rather than discovering rule thirty-five on
room two.

Nothing here stops the line.

| # | What | Where | Why it is here and not a ruling |
|---|---|---|---|
| P1 | Ruling 34's camera work — Room 5's symmetrical one-point VP, three-quarter exteriors | Rooms 1, 2, 5 | Deferred indefinitely by decision. A re-block of composed rooms, and the churn that kept us on two rooms |
| P1b | 34 applied to new rooms only, so Rooms 18/19/13 are asymmetric and Room 5 is not — a permanent divergence | Rooms 5, 13, 18, 19 | Accepted with the deferral rather than resolved. Every interior built from here is asymmetric; the one composed before the ruling stays symmetrical, and the two will never match |
| P2 | Doc 25 restates variant 1 at a later variant, twice | `claims_registrar/number_spindle` LISTEN 3, `assay_office/queue_book` LISTEN 2 | Same "falls away and returns" shape doc 25 note 4 protects for the stove, but note 4 covers the stove and not these. Allowlisted provisionally with the caveat in the entry |
| P3 | Room 2 is broadly bright — p90 155, 16% over luminance 140 | Room 2 | The façade was the loudest offender and only 70px. The real lever is the mud and the boardwalk sitting in the same upper-middle band as the sky, which is a re-block |
| P4 | The offside horse reads as a dark mass beside the nearside one | Room 1 | Correctly proportioned and correctly separated in tone; the far animal is simply behind the near one at 26px |
| P5 | Room 0's plan is sparse at frame left | Room 0 | Twelve locations now land on it rather than three. Judge the composition when it is carrying its real load |
| P6 | 32d and 32e on Rooms 1 and 2 — foreground planes are still amorphous, and almost everything is 8–20px | Rooms 1, 2 | Ruled but not executed before the freeze. Both rooms pass every audit as they stand |
| P3b | Room 13 is very bright — 44.7% over luminance 140 and 0.5% under 30, near three times Room 2's load with essentially no true dark | Room 13 | Errata 23's named near-monochrome exception makes the pale field deliberate; what is not deliberate is the total absence of a dark end. Every legibility surface passes, so it is taste, not legibility |
| P3c | Room 19 spans only 50 points p10 to p90, and 5.2% under 30 against Room 29's 13% | Room 19 | Likely a thin foreground plane — the bed rail and post are 7px and 10px. Same shape as P6 and best fixed in the same pass |
| P7 | The hotel's foreground plane is a wing chair the room no longer contains | Room 18 | Doc 26 furnishes the lobby with a settee, and a cropped chair back is nameable and unwritten. Left as dressing rather than made into a second settee: "shiny at both arms and nowhere in the middle" is unreadable on an object with one arm in frame |

---

# 7 · QA

- [ ] Automated graph traversal proving all 45 puzzles reachable and no dead ends
- [ ] Full playthrough, repeatedly
- [ ] Save/load across every state including partial dialogue and mid-duel
- [ ] 60fps verified on a Chromebook, not in a container
- [ ] Glyph coverage across all content
- [ ] Naive-tester passes per act

---

# WHAT THE REMAINING RISK ACTUALLY IS

Nearly everything left is volume rather than uncertainty. Three exceptions:

1. **Interiors** — unproven, in progress, blocks most of Act I
2. **Audio** — wholly unstarted, and the one area where the successful technique may not transfer
3. **The Listening (F2)** — the only puzzle in the game with no text hints, depending on audio that does not exist. Unbuildable and untestable until the score does

Everything else is a known quantity performed many times.
