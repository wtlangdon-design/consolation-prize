# The derived illegal states, reconciled against doc 34 §4.6

> **Status: reconciled.** Doc 34's eleven tables are restored on main and §4.6
> now carries its received assertions. This file was written when §4.6 was
> empty; it is kept, rather than deleted, because the diff below is a result.
>
> **§4.6 is authoritative.** Where the two disagree, the received set wins.
> They do not disagree anywhere. What follows is what each set has that the
> other does not, and why.

---

## The result in one line

**Every assertion the derivation missed comes from §1.2 — the one section I
flagged as mattering most and could not see. Nothing was missed from any
section that was present.**

That is a clean outcome and it is the argument for flagging rather than
guessing: the derivation was complete with respect to its evidence, and the gap
in the derivation is exactly the shape of the gap in the document.

---

## 1 · In §4.6, absent from the derived set — all four traceable to §1.2

| received assertion | the §1.2 defect it exists for |
|---|---|
| All ChoreHandles settled or cancelled **with an explicit reason** before participant disposal | *"Sequence chore returns guessed seconds; cancel clears only runner state"* — D32 requires propagated settle/cancel |
| Transition autosave accepted **only from a destination-settled event** | *"enterRoom() applies onEnter and autosaves immediately"* — D29/D33 permit autosave only after ingress settles |
| A required `ChoreVariant` lookup **fails explicitly** | *"Missing actor clip can still fall through to size.clips[0]"* — E50/D32 make missing coverage a build error |
| The canonical route validator **rejects pre-E43 topology** | *"Main Street east leads directly to stub_claims_road; no Lane exit exists"* |

The first is the one I would least like to have missed. "Cancelled with an
explicit reason" is not a detail: §2.2 says to replace boolean cancel with a
reasoned `finish(reason)` routed by the coordinator, and a handle that is
merely cancelled cannot tell a settle from an abandonment at the disposal
boundary. It is a different shape of API, not a stricter check.

## 2 · In the derived set, absent from §4.6 — six, all still true

None contradicts §4.6. Each is sourced from a populated section, so these are
restatements of binding rules that §4.6 did not choose to express as runtime
assertions. **Recommend keeping all six as assertions**, because each is
cheap and each guards a rule that is otherwise only prose.

| derived assertion | its source | why keep it |
|---|---|---|
| SaveCoordinator is the **only** storage writer | §10.4 | §4.6 asserts *when* a write may happen and never *who* may write. A direct write from `enterRoom()` passes every §4.6 check. |
| SaveCoordinator **never decides** whether a transaction commits | §4.2 | Guards the arbitration boundary rather than the write boundary. |
| The live coordinator is disposed **only at the swap boundary** | §4.2 | §4.6's load assertion covers the live *hash*; this covers the live *object*. |
| Ordinary world input cannot cancel a transition **after threshold commit** | §10.5 | §4.6 has the drain-before-transition rule but nothing about cancelling after. |
| The wall clock **never drives gameplay state** | §4.5 | The cheapest of the six and the easiest to violate accidentally. |
| **No live clock position is persisted** | §4.5 | Otherwise a save silently carries a presentation phase and load reproduces a paused utterance. |

Two further derived items are strictly *stronger* statements of received ones
and should replace them rather than sit beside them:

- **Phase markers appear exactly once *and in the §9.1 order*.** §4.6 asserts
  "unique and monotonic"; §9.1 names the order — stage → chore/contact → sound
  → chore settle → line → line settle/skip → world state → flags → inventory →
  stable. Monotonic does not imply correct, and the order is the contract.
- **The playfield is skip-only during speech, with a mouse-visible shell
  control reachable throughout.** §4.6's input rule asserts one-layer
  consumption; §10.7 and §9.2 add which layer and what must stay reachable.

## 3 · Contradictions

**None.** The two sets agree everywhere they overlap, and §4.4's newly visible
shell policy confirms the one I was least sure of — quit-to-title must not
mutate or clear saves, which I had derived from §10.5 and which §4.4 now states
directly, along with the FINISH & SAVE / LEAVE WITHOUT SAVING / CANCEL prompt
when a manual save is queued.

§4.4 also answers the question I listed as open: **Restart during atomic work is
permitted after confirmation** — it validates a candidate first, then abandons
the entire unsaved live session at the atomic swap, and explicitly does *not*
complete pending story effects into the candidate.

## 4 · One count to check

§4.6 as pushed contains **fifteen** assertion rows; the note accompanying it
says sixteen. That may be a miscount, or one row may not have survived the
same conversion that displaced the tables. Worth a glance at the source,
because a missing assertion is invisible in exactly the way the missing tables
were.

---

## The working set

Implementation step A asserts **§4.6's fifteen**, plus the six in section 2
above, with two of §4.6's strengthened per section 2's closing note. Twenty-one
assertions, each carrying its citation, and §4.6's wording preferred wherever
both express the same rule.
