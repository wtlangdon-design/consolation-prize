# 56 · PUZZLE CONTENT AUDIT — what the 45 puzzles still need (2026-10-31)

> **Why this exists.** Room 4's builder stopped on unwritten duel lines (doc 36 Q146) after the
> readiness gate said YES. The gate checked the room's examine layer and that each puzzle was
> *named*; it never checked that each puzzle's own writing existed. This audit read every puzzle
> end to end against the docs (read-only, three passes: Act I, Act II, Acts III–IV). Errata 74
> makes the gate check it from now on (`proofs/readiness/puzzles.json`,
> `tools/lib/puzzle-content.mjs`): a room is not buildable until every puzzle it hosts has an
> audited entry whose needs all resolve.
>
> **Status:** B5 and B6 (Room 4) are complete (errata 73). **Everything below is open.** `[W]` is
> missing writing; `[D]` is a missing decision. "file:line" citations are to `docs/`.

---

## Headline — structural holes (decide first; they change what gets written)

1. **Act II deadlock.** B6 needs ≥14 pairs; only Winnie (5) and Pratt (6) are guaranteed besides
   Duel One (4), and Tier 4 pairs 16–19 have no granting option in any tree. Pratt's pairs come at
   D5, and D1's 90-day rule is said only in SUM_B1 row 1″, which opens after Documents A and B.
   So D needs A and A needs D (also breaks doc 02's "any order").
2. **D5 is circular.** PRA_D5 opens on the $11,000 offer (04:504), which is made only at E0b, which
   needs Document D.
3. **The fake funeral (C3 / D4) has no design**: what is buried, who arranges it, cost, where, how
   long the empty-office window lasts. No line anywhere tells the player Fanshawe attends every
   funeral.
4. **E6, the executor, is unwritten end to end** — candidates, refusals, Hob's appointment, the
   papers — and docs 08/54 have Thad enter the archive as *his own* executor, against doc 02's Hob.
5. **The funeral → coffin transition (E7) is unstaged**, and the sources disagree on where Thad is
   during the eulogy.
6. **A7's money loop.** Ozymandia charges $2 in advance; Thad has $0 after A3; the fee (A8) needs
   the boundary from A7.
7. **When ACT becomes 3** is circular (funeral sets it; E1–E6 come before the funeral; E4 is gated
   on act 3). No PART THREE card.
8. **F4's "24 pairs"** is unreachable if Tier 4 stays missable (invariant 6).

## Act I

- **A1** [D] two undertaker trees (doc 04 UND_A1, doc 27); [D] "meets 5 characters" vs doc 17's one destination; [D] doc 27 trees carry no errata-57 afterUse tags (A1–A3).
- **A2** [W+D] the hotel parlour piano has no hotspot, room, LOOK or LISTEN — the LISTEN is the line the puzzle teaches with; [W] USE fork on piano before clerk option 4; [D/W] hotel room key item; [D] what sets T_TUNES_PIANOS; [D] WIN_A2's "A2's paper half".
- **A3** [D] how the trade moves the items (Q141 route 1 never ruled); [D/W] Vessel's exit after the swindle; [D] option 6 gating.
- **A4** [D] what the map unlocks (Room 22 is open from the start); [D/W] FAN_A1 before the swindle.
- **A5** [D] **two blankets** — doc 23 HORSE BLANKET vs doc 54 THE LIVERY BLANKET, different lines and success lines; [D] PRA_A1 drops below three options once option 1 is spent; [D/W] TALK TO the raccoon after naming.
- **A6** [W] **Sump's refusal without a survey is not written**; [D] its trigger and T_SURVEY_NEEDED.
- **A7** [D] money loop (headline 6); [W] the divination and its nonsense boundary text; [W] the survey item; [D] "the correct form"; [W/D] who sends Thad to Ozymandia; [D] where she divines; her tree has no opening, no exit, and option 1 ends mid-sentence.
- **A8** [W+D] nobody hires or pays Thad for the Nugget piano; [D/W] why A8 needs the boundary; [W/D] repeats ("the joke improves with repetition" has one line); [D] the piano after tuning (OQ-12).
- **A9** [W] **the Act I turn has no spoken words** — Sump's read-back and "abuts Claim One, O. Mott" are stage directions; [D] trigger order; [W] filing without fee/survey; [D] survey item consumed?
- **A10** [D/W] what starts the dinner; [D] S1 beat 3 under errata 68 B; [W] **the handkerchief item**; [D] FAN_A2 has no ender; the porch, the table.
- Items: pickled eggs and tonic lack display-name rows; the pickaxe has lines but no acquisition action in Room 12; Thad's case has no item lines.

## Act II

- **B1** [W] no line gives Vessel's destination; [W] FRA_B1 opt 2 "raccoon in the Nugget" (pending Tyler); [D] T_VESSEL_LOCATION setter.
- **B2** [W] the livery man's "moved for one man" line; [D] LIV_A1 opt 1 "D-travel"; [D] T_GRIEVANCE_MOTT setter.
- **B3** [D] not gated on B1; [D] transition to Vessel in Room 4; [W] option 4's pair 20 never spoken.
- **B4** [W] no "sign this" option, refusal or "the local way" line in VES_B1; [D] blank Form 4.
- **B5** [W] Thad's notebook line exists for pair 1 only; [D] Sowerby's handbill, "a Mr. Grubbe of the East".
- **B6** [D] scoring ("first to five" vs "five exchanges, best-of"); [W] Tier 4 pairs 16–19 have no [ASSAY] option; [D] "T. GRUB".
- **C1** complete. **C5** complete.
- **C2** [D] topic/flag setters (T_QUEUE_PADDED).
- **C3** headline 3.
- **C4** [W] fake photograph item; [D] T_MOTT_FACE_UNKNOWN setter.
- **C6** [W] the collection action and result lines; [W] Document B item; [D] the Winnie sparring's trigger.
- **D1** headline 1; [D] T_NINETY_DAYS setter.
- **D2** [W] no option asks Pratt to attest; [D] PRA_D2 trigger.
- **D3** [W] SHE_D1 has no [COMIC]; [W] Sheng's terms never stated; [D] SHE_D1 gives the information outright and option 2 replaces D4's task.
- **D4** [W] every line (Sowerby's debt, non-funeral refusal, payment, return to Sheng); [W] the money item; [D] depends on C3.
- **D5** headline 2; [D] what "He signs" is; [D/W] how the six pairs are taught.
- **D6** [W] the attestation scene; [D] who notarises, where; [W] Document D item.
- **E0** [D] where Claim 1's filing is viewed (Room 8 is executor-only); [W] the Act II viewing line; [D] Document C as an item; T_CLAIM1_BLANK setter.
- **E0b** [W] option 2's apology is a stage direction; [W] option 3 counted-repeat with one response; [D] trigger, room, contract as item; no Act II turn beat or PART THREE card.
- Items with no lines: Document B, Document C, Document D, the fake photograph, the handkerchief, Sheng's stake money, Sowerby's debt money, Fanshawe's note, the Claim One index card copy, the contract, the attestation form.

## Acts III–IV

- **E1** [W] no option or refusal; [D] "seven years" already met (1846 → 1858).
- **E2** [W] no realization line; [D] setters for T_NEED_TO_DIE / T_EXECUTOR_RULE.
- **E3** [W] Sowerby's replies to options 1, 3, 4; [D] [COMIC] tag; [D] prices, counter start and display; [D] "Sheng's goodwill".
- **E4** [W] death certificate item; [D] WIN_C1's gate (headline 7).
- **E5** [D] FRA_E1 contradicts errata 9 (which name is misspelled where); [W] the obituary is never shown; [D] obituary as item; trigger.
- **E6** headline 4.
- **E7** headline 5; [D] procession staging.
- **E8** complete (errata 71). The climb out is Room 31's.
- **E9** [W] the archive door admitting the executor; [D] what completes E9 (invariant 3); [D] photograph and Grievance corroborations.
- **E10** [D] when HOB_C2 settles; [D] pairs 22–23 "acquired from Hob's confession" have no granting option; [D] T_NO_GOLD_EVER vs T_STRIKE_WAS_LIE; [D/W] "Thad packs to leave".
- **F1** [W] no trigger, realization or descent line; [D] how the tunnel is dug; T_DRAUGHT setter.
- **F2** writing complete; [D] tuning numbers; Room 34 → 33 exit.
- **F3** [W/D] the gold/sample item; [D] T_STRIKE_FOUND setter.
- **F4** [D] trigger, exchange order, scoring/retry, pair 24 learning; headline 8.
- **F5** [W] S6 at outline depth (documents laid down and their lines, the form, the three name choices as lines with a [COMIC], Sump's read-back); [D] WIN_F2's place; Winnie's signature; which claim is filed.
- Items with no lines: death certificate, obituary, executor papers, the gold/sample, the filing form, Documents B–D, the fake photograph.

## Cross-cutting

- **Repeat responses for `retain` options** (errata 57) are written for almost no node in any act.
- Side notes: errata 9's spelling (the grave marker is the correct one) is contradicted by Room 14's THE FRESH PLOT lines; doc 04:593 still says "Duel Four".
