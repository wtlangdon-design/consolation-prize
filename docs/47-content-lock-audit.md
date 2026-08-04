# 47 · THE CONTENT LOCK AUDIT — what is settled, what drifted, what Tyler must rule, what must be written

> **Status: audit complete, rulings pending.** Commissioned at the start of the pre-Room-2
> content push: "it's best for all of that to be perfect now." This document is the result of
> cross-checking the bible (doc 01), the puzzle graph (doc 02), the Assay (doc 03), the dialogue
> trees (doc 04), the examine layer (doc 05), and the issue list (doc 36) against each other.

---

# PART ONE — WHAT IS LOCKED, VERIFIED ACROSS DOCUMENTS

**The mystery holds end to end.** Three layers (Hob is Mott; the strike was invented; the gold
is real anyway, under Prosperity), and **all six beats of the reveal schedule have verified
carriers**:

| Reveal | Carrier | Verified |
|---|---|---|
| Prosperity borders Mott's claim | Puzzle A9 — Sump reads the boundary aloud | doc 02 |
| No Mott gold ever assayed | `WIN_B3`, the second ledger | doc 04 |
| Fanshawe wants the search to continue | Structural: `FAN` root — the pen with no ink; "Fanshawe will never actually let Thad sell" | doc 04 |
| Hob is Mott | `HOB_C1` — and the carrier is a `[COMIC]` option that silently sets `T_HOB_HANDWRITING`, the only time in the game a comic option progresses | doc 04 |
| The strike was a lie | `HOB_C2`, the confession | doc 04 |
| The gold is real | The Listening, Act IV | docs 01/02 |

**The ending is fully specified and it is good:** the filing in Mott's name, the thirty-day
work requirement forcing Mott into public, Fanshawe destroyed because his business was the
search. The final beat — the first entirely true letter home — is written into the bible.

**The Liar's Assay is complete.** Doc 03 is a full script: 24 boast/counter pairs across six
tiers with sourcing (who teaches each), matching the bible's 20–24 spec exactly.

**The dialogue architecture is complete and self-aware.** Eight core trees, act-gated by the
reveal flags; five minor characters; the letters home; and four implementation warnings that are
themselves design rulings (the `[COMIC]` options are the product; `HOB_C1` option 4 must not be
tagged as progress in data; repeat responses are a character arc; the letters are never paid
off). **These warnings bind the compiler and the dialogue rebuild** and are restated here so
they survive into implementation.

**The puzzle structure is genre-complete.** Acts of ~10/~18/~10/~5 with Act II's three trials
fully independent; the item ledger's critical path; "every item must be funny to carry before it
is useful to use."

---

# PART TWO — DRIFT BETWEEN DOCUMENTS (clerical, fix without rulings)

1. **Puzzle count:** bible says ~40, doc 02's header says 43, the table has 45 rows. The table
   is the truth; the prose gets corrected to cite it.
2. **Line totals:** doc 04 says ~3,250 written lines; doc 05 says ~3,150. Reconcile to one
   number in one place, cited by the other.
3. **The bible's opening (Part Six) predates doc 17 v3.1.** Its Thad line ("I have four
   dollars…") and staging differ from the canonical opening as built and shipped. Doc 17
   governs; the bible gets a pointer, not a rewrite.
4. **The bible's music section predates docs 28/45 and errata 56.** "Badly tuned upright piano"
   stands; the LA-voice canon and rendered-stem mechanism live in errata 56. Pointer, not
   rewrite.
5. **Room count is 35 and consistent** (21 town + 8 diggings + 6 late) — recorded because a
   larger figure has circulated in working notes and should die here.

---

# PART THREE — OPEN RULINGS — **ALL FIVE RULED** (R1: errata 57 · R2/Q5: errata 60 · R3/Q2: errata 58 · R4: errata 60 · R5: doc 49) — retained as the record

These block writing or building and cannot be resolved by any document:

**R1 · Doc 30 step 8 — `afterUse` authored outcomes vs errata 37's universal grey rule.**
*Blocks: every dialogue tree's data format, therefore all ~2,250 dialogue lines.* If options can
be authored `retain | remove | rephrase | replace | counted-repeat`, that is written per option,
per tree, now — not retrofitted into eight finished trees. This is the first ruling because it
changes what "writing a tree" means. The performance loop CC is landing makes either answer
implementable; the question is purely which game Tyler wants.

**R2 · Q5 — the act-variation schema.**
*Blocks: the compiler's schema, and doc 05's ~140 act-variant lines.* Rooms change across acts;
the schema needs a gating field rather than duplicated hotspot ids. Ruling needed on the shape
(proposal: every hotspot, response and staging step accepts an optional `act` condition compiled
to the existing `when`, with ruling 19a pairs generated for visual state changes).

**R3 · Q2 — which way is Main Street.**
*Blocks: Room 2's plate prompt, geometry, and every exit that names a direction.* The previous
ruling was retracted; Room 2 cannot be annotated or generated until this is settled.

**R4 · Hob's "Wouldn't stand there." — what is the referent?**
*Blocks: nothing mechanical; blocks meaning.* The bible calls the opening "the entire solution
to the mystery in ninety seconds." If the line is a live Chekhov element (the mud? the claim?
the spot where something is buried?) it should be ruled before Act III is written against it; if
it is pure texture, that is also a ruling.

**R5 · The wrong-answer layer's density.**
*Blocks: doc 48 (Part Four below).* Proposal: three authored wrong-verb responses per load-
bearing hotspot, one per minor hotspot, all in Thad's voice, written per room in the same
sitting as that room's examine lines. Tyler rules the density and the voice sample before the
volume pass begins.

---

# PART FOUR — THE WRITING QUEUE, ONCE RULED

In order, each producing compiler-ready text in the doc-05/doc-04 formats:

| # | Work | Size | Depends on |
|---|---|---|---|
| W1 | Grow the eight core trees to full branches (doc 04 has spines and load-bearing lines; the estimate gap is ~800–1,000 lines) | large | R1 |
| W2 | The wrong-answer layer, doc 48: format + Room 2 worked example, then per-room | ~200–250 lines | R5 |
| W3 | Examine volume: the 23 manifest rooms | ~420 lines | none — can start immediately |
| W4 | Act-variant examine lines | ~140 lines | R2 |
| W5 | Beat scripts for the act turns — doc 17 siblings for: the swindle dinner (A10), the funeral, the coffin, the confession, the Listening, the filing, Main Street at dawn | 7 scripts | none for drafts; staging detail follows their rooms |
| W6 | Music: the remaining doc 28 themes and doc 45 coverage past the opening | per errata 56's method | none |
| W7 | Letters home — verify doc 04 Part Three carries all 12 (4 acts × 3 versions); write any missing | small | none |

W3 can begin today regardless of rulings. W1 begins the moment R1 is ruled.

---

# PART FIVE — THE STANDING DISCIPLINE FOR THE WRITING PASS

- **Everything is written in the format the compiler will parse** (doc 46's appendix), so no
  line is written twice.
- **Doc 05's warning binds the volume work:** the writing degrades fastest if rushed or
  generated. Drafted a room at a time, in Thad's voice, reviewed by Tyler in room-sized batches
  — he is the editor, and the batch is sized so a review is one sitting.
- **Doc 04's implementation warnings are content-lock law** and travel into the compiler as
  checks where checkable (e.g. a validator can verify `HOB_C1` option 4 is tagged `[COMIC]` in
  data).
- **No document states a fact another document owns.** Counts cite the table that is the truth.
  The drift in Part Two is the cost of having done otherwise.
