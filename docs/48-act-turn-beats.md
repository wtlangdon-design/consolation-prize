# 48 · THE ACT-TURN BEAT SCRIPTS — doc 17's siblings, at outline depth

> **Status: outlines (W5, doc 47).** Doc 17 proved the format: beats in a table, lines in the
> table's own rows, staging referencing lines BY INDEX, control column governing `wait`. These
> seven scripts are written to that format at outline depth — beats, lines where load-bearing,
> control, and dependencies — and each graduates to full doc-17 depth when its room enters the
> factory. Timing values (`wait` seconds, holds) are deliberately absent: those are rulings made
> by watching, per the mud beat's 0.7/1.1.

**Standing rules inherited from doc 17:** not cutscenes where play will do — control returns
the moment a scene can survive it. Lines live here, staging names them by index. Errata 30a's
`wait` is legal only in beats whose control is `none`. Errata 45's shape everywhere: state
commits after the last line, never under it.

---

## S1 · THE DINNER AT FANSHAWE'S (A10 — the Act I turn)

*Room 11. The swindle happens here and the player performs it. A dialogue puzzle staged as a
cutscene frame around a live tree — control is `dialogue` throughout the middle.*

| # | Beat | Control |
|---|---|---|
| 1 | Thad seated; the table laid absurdly well; Fanshawe pours. "You'll take wine. It takes itself, mostly." | none |
| 2 | **The tree (FAN_A2).** Six options; five sell Prosperity in language Thad doesn't recognise as a sale. The player is the mark, live | dialogue |
| 3 | Whichever option — the pen with no ink, the charm, the handkerchief pocketed absently. `T_SWINDLED` set here, AFTER the exchange settles | dialogue |
| 4 | Thad on the porch, holding the deed wrong side up. "A very fine dinner." Beat. "I believe I own something." | none |
| 5 | Act card: **PART TWO — THREE PIECES OF PAPER** | none |

Dependencies: FAN_A2 tree (written, doc 04); the deed item; act card system (built).

## S2 · THE FUNERAL (Act III opening)

*Room 31. The examine layer (doc 05) carries the comedy; the script carries only the spine, so
the player is free to wander their own funeral — which is the joke. Control is FULL except the
bookends.*

| # | Beat | Control |
|---|---|---|
| 1 | Procession in: Grievance in black, the coffin, the town. Thad at the back, hat pulled low | none |
| 2 | **Play.** Sowerby's eulogy loops as ambient bark ("…a man of music, taken flat…"); every hotspot live | full |
| 3 | On LOOK at the grave the second time, or on exit toward Boot Hill: Hob, at Thad's shoulder, not looking at him: "Good turnout." Beat. "Better than mine." — and he walks. First seed, planted in daylight, deniable | none |
| 4 | `T_FUNERAL_DONE`; Boot Hill opens | — |

Dependencies: Sowerby bark line; Hob mover in room 31; E-series flags.

## S3 · INSIDE THE COFFIN (E7)

*Room 32 — already scripted in doc 05. The script is short because the room is the experience:
dark, close, LISTEN is the only verb that matters and the walls answer.*

| # | Beat | Control |
|---|---|---|
| 1 | Lid closes. Black screen, one candle-width of seam light. "This is the quietest room in Consolation. I have plans for it." | none |
| 2 | **Play, constrained:** LOOK/LISTEN only; the lid is the single exit and it is gated on E7's condition | limited |
| 3 | The knock that answers his — from outside, even, counted. The lid opens on Hob's lantern. No line. Straight into HOB_C1 | none |

Dependencies: verb-limited control mode (new — smallest possible version: a room flag the verb
panel reads); doc 05 room 32 lines (written).

## S4 · THE CONFESSION (HOB_C2 — the Act III climax)

*The watchman's shack, room 21. Almost entirely the tree; the frame is one lamp and two chairs.*

| # | Beat | Control |
|---|---|---|
| 1 | The shack by lamplight. Hob sets two cups. "You'll have noticed I talk more at night." | none |
| 2 | **HOB_C2** (written, doc 04): the whole truth, at his pace, with his pauses. The tree's own `wait`-shaped silences are authored as short exchanges, not engine waits — a man deciding to keep talking | dialogue |
| 3 | After settle: `T_HOB_IS_MOTT`, `T_STRIKE_WAS_LIE`. Outside, dawn is starting. "Twelve years I watched them look. You're the first that listened." | none |
| 4 | Act card: **PART FOUR — THE QUIETEST PART OF THE GAME** | none |

Dependencies: HOB_C2 tree (written); shack room; dawn grade variant of the exterior (art).

## S5 · THE LISTENING (F2)

*Room 33 — scripted in doc 05 as "Everything: (the puzzle)". The one set piece that is a
mechanic, not a scene. Outline only marks the frame; the puzzle spec is doc 31's.*

| # | Beat | Control |
|---|---|---|
| 1 | The chamber. The tuning fork comes out unbidden — the only scripted USE in the game. One strike: A, 440, correct | none |
| 2 | **The mechanic:** the room answers, out of tune; the player tunes by LISTEN, interval by interval, doc 31's feel rules governing. The score comes into tune WITH the puzzle — errata 28a reversal required for score cues tied to puzzle state (**ruling: Tyler, flagged in doc 47's successor**) | full |
| 3 | The last interval true. Ninety seconds of the score in tune, doc 28's arc landing. No lines. He sits down in the dark and listens to it | none |

Dependencies: the Listening mechanic (doc 31 feel + new engine work — the real build of Act IV);
score-state coupling (blocked on the errata 28a ruling); THADDEUS complete statement (exists,
errata 56 — this is the one place it finishes).

## S6 · THE FILING (the last puzzle)

*Room 7, the registrar's. The game about paperwork ends with paperwork, done correctly, once.*

| # | Beat | Control |
|---|---|---|
| 1 | The counter. Sump, the form, the pen — with ink. Every document the player gathered across four acts, laid down one by one (inventory-driven: each is a USE, the player performs the filing) | full |
| 2 | The name line. The one authored choice: the player writes **OBADIAH MOTT**. (Offered as a dialogue choice of names — his own, Winnie's, Mott's. Only one advances; the others get Sump's flattest look) | dialogue |
| 3 | The county seal comes down. One stamp. It is the loudest sound in the game and the score rests under it | none |
| 4 | Sump, reading it back, toneless as ever, and for once every word he says is a bomb going off in the street outside | none |
| 5 | `T_FILED`. Main Street dawn opens | — |

Dependencies: the document items (built/designed in doc 02's ledger); seal SFX (one sound —
errata 28a ruling again, or a bed-side one-shot exemption).

## S7 · MAIN STREET, DAWN (the close)

*Room 36 — scripted in doc 05. Not a cutscene at all, and that is the design: the player walks
the street they know, reads the nine rewritten hotspots at their own pace, and the game ends
when they choose the one exit.*

| # | Beat | Control |
|---|---|---|
| 1 | Fade up on the street, in tune, first light. No lines. The dog is on his back in the road | full |
| 2 | **Play:** all nine dawn hotspots (written). The one exit is the coach stop, east | full |
| 3 | At the coach stop: the sign — POP. 2,000 AND CLIMBING — being repainted upward by a man on a ladder, who nods. Thad's last spoken line: "Leave the mud." | none |
| 4 | The letter, Act IV, over black: four lines, entirely true | none |
| 5 | Credits over the town waking — **and credits must not lengthen the beat's music; doc 45's close governs** | none |

Dependencies: room 36 art (dawn plate); the letter display (the letters system, doc 04);
credits (unbuilt, flagged in errata 55's launch-screen cluster).

---

## What blocks graduation to full depth

Per script: S1 nothing (could be doc-17 depth now); S2 the Sowerby bark; S3 the verb-limit
mode; S4 the dawn grade; S5 the Listening mechanic and the errata 28a ruling; S6 the seal
sound, same ruling; S7 credits and the launch-screen cluster. The errata 28a reversal now has
three scripts asking for it — the case impact, the score-state coupling, the seal — and should
be ruled once, for all three, rather than eroded.
