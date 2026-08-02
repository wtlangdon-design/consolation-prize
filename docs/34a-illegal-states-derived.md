# Doc 34's missing sections, and the illegal states derived to fill one

> **Status: derived, not received.** Doc 34 is binding under errata 52 and is
> the spec for implementation step A. Six of its sections are empty in the
> pushed file, and one of them — 4.6, "Illegal states: make these assertions" —
> is literally one of step A's four named deliverables.
>
> Nothing here is invented from taste. Every assertion below is derived from a
> populated section of doc 34, and the derivation is cited beside it. Where a
> question cannot be answered from what is present, it is listed as open at the
> bottom rather than guessed.

## What is missing

The provenance note says doc 34 was "pushed substantially as received", so these
are most likely tables or matrices that did not survive the paste:

| section | what it was to contain | consequence |
|---|---|---|
| 1.2 | Defects present on main | steps A–D are told to fix a P0 list that is not there |
| 2.1 | P0/P1 contradictions | the contradictions the contract exists to resolve |
| 3.1 | Live conflict matrix and winner | which guide wins each seam |
| 4.3 | The concrete collision named in the request | the worked example of 4.1–4.2 |
| 4.4 | Shell command policy | needed by step D and by input routing rule 7 |
| **4.6** | **Illegal states — make these assertions** | **step A cannot be completed as written** |

Sections 4.1, 4.2, 4.5, 9.1, 9.2 and 10 are populated, and between them they
constrain 4.6 tightly enough to derive it. 4.4 is partly recoverable from
section 10 rule 7 and from 9.1's "command policy" checks. 1.2, 2.1, 3.1 and 4.3
are not recoverable and are not guessed at here.

---

## The derived assertions

Each is stated as a runtime invariant that should fail loudly in development.

### On the root operation

1. **Exactly one root operation exists at any time.** Starting a root while one
   is live is a fault, not a queue. *(§10.1: "Exactly one root operation
   exists"; §4.2: "No scene class may start a second atomic root directly.")*

2. **A root operation has at most one body owner per actor.** A ChoreHandle, a
   walk and a cutscene track cannot all move the same actor. *(§9.1 root
   exclusivity: "never create more than one root atomic operation or more than
   one body owner per actor.")*

3. **Children are never commit owners.** ChoreHandle, SpeechController, prop
   tracks and AudioDirector cues may be live under a root; none may write
   durable state. *(§10.1, §4.2.)*

4. **A dialogue presented inside an action owns no puzzle effects.** The lease
   is presentation only. *(§10.3; §4.1's `dialogue?: PresentationLease // no
   durable puzzle writes`.)*

### On the journal

5. **Resolver code is pure.** Every dialogue, puzzle and verb resolution leaves
   flags, room, objects, inventory, ownership and dialogue counts
   byte-identical until a transaction is reserved. *(§9.1 resolver purity.)*

6. **Phase markers appear exactly once, in order.** stage → chore/contact →
   sound → chore settle → line → line settle/skip → world state → flags →
   inventory → stable. A repeated or out-of-order marker is a fault.
   *(§9.1 exactly-once trace; §10.2.)*

7. **No durable effect is applied outside the journal.** *(§10.2: "One
   immutable TransactionJournal owns every durable effect.")*

### On saving

8. **SaveCoordinator is the only storage writer.** `enterRoom()`, dialogue,
   puzzle, sequence and menu code writing storage directly is a fault.
   *(§10.4.)*

9. **No storage write occurs while a root operation is not stable.** A save
   requested during atomic work queues; exactly one write appears at settle.
   *(§9.1 save sweep; §10.4.)*

10. **SaveCoordinator never decides whether a transaction commits.** It observes
    a published checkpoint and nothing else. *(§4.2.)*

11. **The shell cannot deadlock the thing it waits on.** Selecting Save during
    atomic work closes the shell and lets the operation reach its checkpoint.
    *(§9.1 menu liveness: "No test can remain paused waiting for itself.")*

### On loading

12. **A failed load mutates nothing.** Candidate failure leaves the live hash
    unchanged; success swaps once, atomically. *(§9.1 command policy; §10.5.)*

13. **The live coordinator is disposed only at the swap boundary.** *(§4.2.)*

14. **Quit-to-title never clears or resets saves.** *(§10.5.)*

### On input and transitions

15. **One event is consumed by exactly one layer**, in the order
    confirmation/shell → active dialogue choice → current-line skip →
    map/panel → world. *(§10.7.)*

16. **The playfield is skip-only during speech**, and a mouse-visible shell
    control stays reachable throughout. *(§10.7; §9.2.)*

17. **Ordinary world input cannot cancel a transition after threshold commit.**
    *(§10.5.)*

18. **A dialogue exchange drains before a transition begins**, unless the
    dialogue is authored as non-interactive cutscene speech owned by that
    transition. *(§4.2.)*

### On clocks

19. **The wall clock never drives gameplay state.** *(§4.5.)*

20. **Simulation, presentation and ambient clocks all pause under the shell.**
    The audio transport usually pauses too; the coffin is the named exception
    and pauses with the scene if the shell opens. *(§4.5; §10.10.)*

21. **No live clock position is persisted** unless a named checkpoint requires
    a semantic phase. *(§4.5.)*

---

## Open, and not guessed at

- **What the P0 defects on main actually are** (1.2). Steps A–D are scoped
  against a list that is absent. The step order can proceed regardless, but
  "fix the P0 current defects" in §7.1 cannot be checked off against anything.
- **Which guide wins each seam** (3.1). §4.2's ownership rules cover the seams
  §4 names; a conflict outside those has no ruling.
- **Shell command policy in full** (4.4). §10.7 gives input routing and §9.1
  gives Load/Restart/Quit behaviour, which is most of it. What is unclear is
  which commands are reachable from which root operations — specifically
  whether Restart is offered during a cutscene.
- **The concrete collision** (4.3), which was to be the worked example. The
  "key correction" paragraph at the head of §4 states the answer in prose —
  four nested owners is itself illegal — so the ruling survives even though its
  worked form does not.
