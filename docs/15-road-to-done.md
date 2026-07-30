# CONSOLATION PRIZE
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

## The fix: tier the rooms

Monkey Island did not treat every screen equally, and neither should this.

| Tier | Rooms | Standard |
|---|---|---|
| **A — hubs** | Main Street, the Nugget, Prosperity, the assay office, Fanshawe's office, the Registrar, Main Street dawn | 3 repeat variants per verb, rich object overrides, full exit treatment. The Room 2 standard. |
| **B — story rooms** | ~14 rooms carrying puzzles or reveals | 2 repeat variants, overrides only where a joke exists, global fallbacks otherwise |
| **C — everything else** | ~21 rooms, mostly ancillary and single-visit | 1 line per hotspot verb, global fallbacks only |

**Revised realistic total: ~5,600 written lines.** Still large. Achievable.

**Decision required before Act I content authoring begins.** Tier assignment is a design call, not an implementation one.

---

# 1 · DESIGN — complete

- [x] 14 design documents
- [x] Errata with 16 rulings
- [ ] **Reconciliation pass** — fold all 16 rulings back into the source documents (errata lists the file-by-file edits)
- [ ] **Room tiering decision** (above)

# 2 · ENGINE

Built:
- [x] Nine-verb panel, flag store, room loader, dialogue runner
- [x] Save/load, validation tooling, content pipeline
- [x] Depth zones with discrete snapping
- [x] Deploy to Pages

Not built:
- [ ] **Inventory** — array, panel UI, ~40 item icons, LOOK/LISTEN per item, combination table
- [ ] **The Liar's Assay** — turn-based duel: boast/counter resolution, five exchanges, learn-by-losing, mockery pool, pair acquisition state
- [ ] **Reputation broadcast** — integer state, ambient bark firing on approach, one-shot-per-state
- [ ] **Letters home** — three-version choice UI, per act, tracking nothing
- [ ] **Scripted sequence system** — the opening 90 seconds, the funeral, the public duel. Non-interactive beats with timed dialogue
- [ ] **The coffin (E7)** — verb panel removal, three-minute timer, audio silence, panel restoration
- [ ] **The Listening (F2)** — pitch-based spatial puzzle, no text hints, tied to the audio system
- [ ] **Act transitions and gating**
- [ ] **Music manager** — stem mixing, bar-boundary crossfade, global detune with Act IV automation
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
- [ ] Thad: talk cycle, reach/pickup, tuning fork, and three scripted specials
- [ ] 8 core named characters
- [ ] 4 minor named characters
- [ ] 18 ambient characters (may share base sprites with measured palette swaps)
- [ ] All subject to ruling 16 — measured legibility per room they appear in

Interface:
- [ ] Inventory panel, dialogue overlay polish, ~40 item icons, title and credits

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
