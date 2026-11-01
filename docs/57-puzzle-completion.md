# 57 · THE PUZZLE COMPLETION PASS — every puzzle, end to end (2026-11-01)

> **Why this exists.** Doc 56 audited the 45 puzzles and found most of them unbuildable: lines
> missing, items missing, and eight structural holes, among them an Act II deadlock and a funeral
> that was never designed. Tyler, 2026-10-31: *"You decide. And don't take shortcuts. Do
> everything correctly to make the game feel as much like an end product Monkey Island style game
> as possible. Keep the puzzles interesting and clever and tough without being impossible. Keep
> the dialogue really punchy and good. Make the game really come to life."*
>
> This document is that pass, written in one voice. Errata 75 records the structural rulings by
> name so any can be reversed. Where the writing belongs to an existing home it went there:
> dialogue nodes in **doc 04**, duel lines in **doc 03**, items in **doc 23**, room subjects in
> **doc 54**. What is here is everything else: the order of each puzzle, the verb-on-object lines,
> the scenes, and the state each step sets.
>
> **Format** is doc 54's: `> **OBJECT** · VERB, *condition* — "line" → effect`. Italic brackets are
> staging. A speaker's name before a line means that character says it; otherwise it is Thad.

---

# THE SHAPE OF THE GAME, AFTER THIS PASS

- **Act I** is a hub of five short chains that converge on one filing: get a room (A2), get robbed
  (A3), find the claim (A4), evict the raccoon (A5), and the paper chain — Sump wants a survey
  (A6), the only licensed surveyor is a diviner (A7), she wants two dollars, the only work in town
  is a flat piano (A8) — which ends in the filing that names Claim One (A9) and the dinner that
  tests whether Thad will sell (A10).
- **Act II** gives the three documents together from the first conversation with Sump, so the
  trials really are any-order. They interlock exactly twice, both on purpose: **one funeral**
  (the memorial Thad arranges for Ezra Pike) empties Fanshawe's office for Trial Two *and* puts
  money in Sowerby's plate for Trial Three; and **Duel Two** needs the comebacks Winnie and Pratt
  teach at the ends of Trials Two and Three.
- **Act III** is a chain the player feels tightening: you cannot have Mott declared dead (E1),
  but you can die (E2); dying costs money (E3, Sheng's loan, earned in Act II), a certificate
  (E4), a notice (E5) and an executor nobody would think of (E6) — and the executor's signature
  is the clue that solves the mystery (E9).
- **Act IV** is payoff: a warm hole remembered (F1), the Listening (F2), the gold (F3), the truth
  told in public and scored as a lie (F4), and a form (F5).

**Cross-act reuse** (doc 02 rule 4) is now real at every act boundary: the tuning fork (A2, A8,
B3, F2); Fanshawe's map (A4 → A7); the filing fee spent on a diviner (A7); the letter to a dead man
(A1 → C3, the memorial); the funeral machinery (C3 → E3–E7); the executor's form (E6 → E9); the
bishop's fist (pair 1 → the sample's LOOK).

---

# ACT I

## A1 · Deliver the letter to Ezra Pike

Built as doc 17 v3 and doc 27 have it: the stage driver sends Thad to the undertaker; doc 27's undertaker tree sets `T_PIKE_DEAD` and puts Boot Hill on the map; the letter turns to its second state. Doc 27's undertaker supersedes doc 04's sketch `UND_A1` (errata 75). Before the swindle, `FAN_A0` (doc 04) gives Fanshawe's office a first conversation, so the Colonel is met in Act I without FAN_A1's opening assuming a sale that has not happened.

## A2 · Get a room with four dollars when the room costs five

*Room 18. The parlor piano is THE PARLOR PIANO (doc 54, Room 18). The clerk is doc 27's.*

1. The clerk's tree, option 4 — Thad says he can put a piano right — sets `T_TUNES_PIANOS`.
2. LISTEN TO the piano. Its first LISTEN is the line that teaches the verb.
3. USE THE TUNING FORK on the piano.

> **THE PARLOR PIANO** · USE THE TUNING FORK, *before `T_TUNES_PIANOS`* — "Tuning a hotel's piano without being asked is how a man ends up in the street, holding a fork and an explanation."
> **THE PARLOR PIANO** · USE THE TUNING FORK, *after `T_TUNES_PIANOS`* — doc 24's line ("Four minutes. It is the first honest work done in this building in some time."), then **CLERK:** "Top of the stairs, second door. The key sticks. You have to want it." → **A2**. *(The room is the reward; there is no key item. Room 19 opens.)*
> **THE PARLOR PIANO** · USE THE TUNING FORK, *after A2* — "In tune. I keep checking. It keeps being."
> **THE STAIRS** · USE or walk up, *before A2* — **CLERK:** "The stairs come with a room, sir. They are not sold separately."

## A3 · The swindle

*Room 3. Doc 27's DEKE VESSEL tree, as built.* Option 6 sets `T_SWINDLED` and is ungated: being robbed in the first ten minutes is the joke.

**Items follow the flag** (doc 36 Q141 route 1, ruled): FOUR DOLLARS and THE POCKET WATCH are held while `T_SWINDLED` is false; THE DEED is held once it is true; THE POCKET WATCH is held again once B6 is complete. The flag stays the single fact.

When option 6's exchange settles *(now written into doc 27's option 6, which is where the extractor reads it; the conversation ends and A3 completes)*:

> **VESSEL:** "Pleasure, son. Look after her. She's got character." *(He finishes his drink, collects his hat, and leaves the Nugget. From now on he is not in Room 3.)*

## A4 · Find the claim

*Rooms 11 → 22 → 23.* FAN_A1 gives THE COMPANY MAP (doc 04). **The map is what finds Prosperity:** Room 23 appears on the town map, and Room 22 offers the way to it, only while Thad holds the map.

> **Room 22's way up to the claims** · walk, *without the map* — "Forty feet of ground, somewhere up one of these. The deed says 'from the stake, thereabouts', and the whole hillside is stakes."

## A5 · The raccoon

*Rooms 23/24, 12, 15, 25. Errata 68 A as ruled, with these settled:*

- **One blanket.** THE LIVERY BLANKET (doc 23), borrowed by LIV_A1 option 5. Doc 23's HORSE BLANKET is retired; doc 54's success line governs; doc 24's A5 row and blanket pool now name THE LIVERY BLANKET.
- **Pratt** is asked only while the raccoon is in the hole (PRA_A1 option 1); the bite is a standing topic afterward (option 4).
- **Talking to the raccoon after naming him:**

> **THE RACCOON** · TALK TO, *named* — "He has heard me. He has decided against it." · *(again)* "I asked after his health. He ate something I had not known was edible." · *(again, and after)* "We have reached an understanding. He understands it and I do not."

## A6 · The deed has no boundary

*Room 7.* SUM_A1 option 1 (doc 04), or THE DEED on the counter before there is a survey — both give Sump's refusal and set `T_SURVEY_NEEDED`.

> **THE COUNTER** · USE THE DEED, *without THE SURVEY* — Sump's refusal, as SUM_A1 option 1 → `T_SURVEY_NEEDED`, **A6**.

## A7 · The survey

*Room 16. Three steps, three sources: Sump says who (SUM_A1 option 1′), the Nugget pays for it (A8), Fanshawe's map is what she reads.*

1. SUM_A1 option 1′ — the only licensed person is a diviner.
2. OZY_A1 option 1 (doc 04) — two dollars, in advance.
3. Pay her. Show her the ground.

> **MADAME OZYMANDIA** · USE THE FILING FEE, *after OZY_A1 option 1* — "That was the filing fee. It is now a divining fee. Money out here changes careers faster than men do." **OZYMANDIA:** *(She takes it without looking at it.)* "The earth thanks you. I shall pass it on." *(beat)* "Now. Show me the ground." — "It is two miles away and up a hill." — "Then show me a picture of it." → the fee is spent; `T_OZY_PAID`.
> **MADAME OZYMANDIA** · USE THE COMPANY MAP, *after `T_OZY_PAID`* — *(She unrolls it on her table and finds Claim Two at once; somebody has circled it. She holds the rod over it and hums. The humming goes on for some time. The rod does not move. She takes a Form 12-C from a stack of them and writes in purple ink.)* **OZYMANDIA:** "The earth has spoken. The earth was brief." — "You keep Form 12-C?" — "The earth prefers them." *(She hands back the map.)* → THE SURVEY, **A7**.
> **MADAME OZYMANDIA** · USE THE COMPANY MAP, *not yet paid* — **OZYMANDIA:** "The earth will read your map — two dollars — the earth reads *everything* — in advance —"

**The survey, as written on the form** (Sump reads it aloud at A9):
> "Commencing at the stake, thereabouts; thence uphill, with feeling, to the larger of the two rocks; thence along the line the rod preferred, some forty feet, until the humming stopped; thence home."

## A8 · The filing fee

*Room 3.* **Requires only the tuning fork** (doc 02's "requires the boundary" is withdrawn: it made the money circular). The barman pays; nobody else looks up. The piano is flat again every time Thad comes back, which is why this is the game's repeatable money and why "the joke improves with repetition" (doc 02's dead-end audit).

> **THE PIANO** · USE THE TUNING FORK, *first time* — doc 24's line ("Four minutes. C-sharp has come home, and nobody in this room has looked up."), then *(the barman sets two dollars on the bar beside Thad and goes back to his glasses)* "The barman has paid me. Neither of us has mentioned it. It is the most professional transaction of my life." → THE FILING FEE, **A8**.
> **THE PIANO** · USE THE TUNING FORK, *second time* — "Flat again. A man at the bar says the right note was making him nervous. Four minutes. Two dollars, on the bar, unmentioned. We have a routine." → THE FILING FEE
> **THE PIANO** · USE THE TUNING FORK, *third time and after* — "C-sharp, home again. Two dollars, again. I am, by the narrowest definition, employed." → THE FILING FEE
> **THE PIANO** · USE THE TUNING FORK, *already holding THE FILING FEE* — "I have tuned it again, for nothing. The barman did not pay and I did not ask. It is a matter of principle, and I am not sure whose."
> **THE PIANO** · USE THE TUNING FORK, *already tuned this visit* — "It is still in tune. Nobody has had time to undo it."

## A9 · File the deed — the Act I turn

*Room 7. SUM_A1 option 1″ tells the order: the deed, the survey, the fee.* Each is a USE; the last one triggers the read-back.

> **THE COUNTER** · USE THE DEED, *with THE SURVEY* — doc 24's line ("Filed. Mr Sump has written a number in a book, and the number is mine.")
> **THE COUNTER** · USE THE SURVEY, *after the deed* — "The survey, on the correct form. He has read it without expression, which I am told is the highest mark this office gives." *(The survey is lodged; it leaves inventory.)*
> **THE COUNTER** · USE THE SURVEY, *before the deed* — **SUMP:** "The deed first. The order is in the statute."
> **REGISTRAR SUMP** · USE THE FILING FEE, *before the deed and the survey* — **SUMP:** "The money last, Mr. Grubb, so that nobody can say he paid for the paper."
> **REGISTRAR SUMP** · USE THE FILING FEE, *after both* — doc 24's line ("Two dollars, for a number in a book. He has taken it without looking at me, which I am told is the correct procedure."), then **the read-back**:

> **SUMP:** *(He reads the boundary aloud, every word, in exactly the voice he would use for a better one.)* "Claim Two. 'Prosperity,' in pencil. Commencing at the stake, thereabouts; thence uphill, with feeling, to the larger of the two rocks; thence along the line the rod preferred, some forty feet, until the humming stopped; thence home." *(He blots it.)* "Bounded west by Claim Three. North by the creek. South by the road." *(beat)* "East by Claim One."
> **THAD:** "Claim One."
> **SUMP:** "O. Mott. Filed eighteen forty-six." *(He looks up, for the first time.)* "Your neighbor, Mr. Grubb." *(He looks down again.)* "Next."
> → `T_BORDERS_MOTT`, **A9 — the Act I turn.**
> **SUMP:** "There is a note for you. It arrived before you did." → THE INVITATION.

## A10 · Survive dinner at Fanshawe's

*Room 11, at night. Doc 48 S1 with FAN_A2 (doc 04) and errata 68 B (only option 6 advances).*

- **Trigger:** entering Room 11 holding THE INVITATION, until `T_DINED`. S1 beat 1 plays.
- **Leaving the table** by the universal exit before option 6: **FANSHAWE:** "Already? Then come back when you're hungry. The table will keep." *(S1 starts again on the next entry.)*
- **Beat 3, after option 6 settles:** *(Fanshawe refills the glass. Thad, reaching for it, knocks it; Fanshawe's handkerchief is in Thad's hand before the wine reaches the cloth.)* **FANSHAWE:** "Keep it. I have dozens." *(Thad pockets it, absently.)* → THE HANDKERCHIEF; `T_DINED`; Room 11's own handkerchief hotspot is not drawn from now on.
- **Beat 4** plays at the office door as Thad leaves, Fanshawe already turned back to his wine — the doorway is the porch: "A very fine dinner." *(beat)* "I believe I own something." Then the act card, **PART TWO — THREE PIECES OF PAPER**, and `ACT` = 2.

---

# ACT II

*SUM_B1's opening (doc 04) states the whole act: Document C, on presentation of A, B and D. All three document options are offered at once (errata 75).*

## B1 · Find where Vessel went

*Room 9.* FRA_A1 option 1 → FRA_B1; either story pays, and Frame gives the destination (doc 04): Fiddler's Gulch, two days out → `T_VESSEL_LOCATION`. *(Doc 27's Vessel said "Sacramento's four days", which was true and was not where he was going.)*

## B2 · Get two days out of town

*Room 15.* LIV_A1 option 1 is Grievance's refusal; option 6 is the man she moved for → `T_GRIEVANCE_MOTT`; option 4, the tune, opens only after it.

## B3 · The Grievance puzzle

*Room 15. Errata 68 F: the fork is the tool.*

> **GRIEVANCE** · USE THE TUNING FORK, *before `T_HUM_HEARD`* — doc 54's refusal.
> **GRIEVANCE** · USE THE TUNING FORK, *after `T_HUM_HEARD`, without `T_VESSEL_LOCATION`* — "She would go, I think. I do not yet know where to, and she does not strike me as an animal who enjoys a vague errand."
> **GRIEVANCE** · USE THE TUNING FORK, *with both* — doc 54's success line, then **the ride**, over black: "Fiddler's Gulch, two days out. Deke Vessel was delighted to see me, which was the worst part. He has agreed to settle the matter the local way, and the local way has a room." → **B3**; `T_VESSEL_FOUND`; Grievance is back in her stall; Vessel is in Room 4 (errata 73 B); Thad is placed in the Nugget.

## B4 · Vessel refuses to sign

*Room 4.* The first TALK TO plays doc 03's Duel One opening ("Grubb! You came all this way."). VES_B1 option 6 — "I need you to sign an affidavit." — is the refusal and the offer → **B4**, and Duel One begins.

## B5 · Duel One

*Room 4. Doc 03 Part Four with errata 73 B–D and 75:* Sowerby reads the handbill; Vessel throws pairs 1, 2, 3, 4 and 1 again; Thad has only wrong answers; a voice from the ring of chairs mutters each counter and Thad says his notebook line (doc 03). Five straight losses; the loss dialogue; pairs 1–4 join when it is over → **B5**. VES_B1 option 3 replays it for anyone who enjoys losing.

## B6 · Beat Vessel

*Room 4.* VES_B1 option 5, after B5. First to five exchanges; Vessel draws from pairs 1–21, Tier 1 first, never repeating within a duel; a lost Duel Two closes nothing and option 5 offers it again (errata 73 E). Winning dialogue (doc 03) → THE AFFIDAVIT; THE POCKET WATCH returns → **B6**.

**Where the pairs come from**, all of them now with a written route:

| Pairs | Taught by | Where |
|---|---|---|
| 1–4 | Vessel, by beating him | Duel One (B5) |
| 5–9 | Winnie | WIN_B4 option 1, after C6 |
| 10–15 | Pratt | PRA_D6 option 4, after D5 |
| 16 | Frame | FRA_A1 option 7 |
| 17 | Sowerby | SOW_A1 option 8 |
| 18 | Sheng | SHE_A1 option 6 |
| 19 | Ozymandia | OZY_A1 option 5 |
| 20 | the livery man | LIV_A1 option 7 |
| 21 | Hob | HOB_A1 option 6 |
| 22–24 | the truth | E10, the confession |

Duel Two needs fourteen; Duel One, Winnie and Pratt guarantee fifteen. Tier 4 and Hob are the reward for talking to everyone.

## C1 · Winnie refuses

*Room 5.* WIN_B1 option 1 → `T_ASSAY_QUEUE`. Complete as written.

## C2 · The queue is padded

*Room 5.* WIN_B1 option 2 (the Company is always ahead) and option 6 (the log is in the Colonel's office) → `T_OFFICE_TOPIC`, **C2**.

## C3 · Manufacture a funeral

*Rooms 9, 17 and 14.* Fanshawe never leaves his office except for funerals. Nobody has died. But Ezra Pike was buried six years ago on the undertaker's credit, and nobody sang over him — and Thad is carrying a letter of introduction to him from his father.

1. FRA_A1 option 5 → `T_FANSHAWE_FUNERALS` (Frame prints the notices; Fanshawe is the only man who reads them).
2. SOW_A1 option 5 → "Who speaks for the deceased?"
3. The letter.

> **REVEREND SOWERBY** · USE THE LETTER, *after SOW_A1 option 5* — "A letter of introduction to Mr. Pike, from my father. Sealed. I have carried it eleven hundred miles." **SOWERBY:** *(He holds it as though it were warm.)* "Then you are practically family, Mr. Grubb. The estate will be billed. Mr. Pike's estate is six years behind with the undertaker, so I shall be paid after him, which is to say in spirit." *(He gives the letter back.)* "Have it printed. Nobody comes to a funeral he hasn't read about." → `T_MEMORIAL_BOOKED`

4. FRA_A1 option 6 → the notice → **the funeral day** begins (`T_FUNERAL_DAY`) → **C3**.

**The funeral day.** It lasts until Thad walks up Boot Hill.

- **Room 11:** Fanshawe is not there (errata 68 D). Doc 54's empty-office line and C4's pickups.
- **Room 17:** Sowerby is not there. He is up the hill.
- **Main Street**, first entry that day: "The street is half empty. Everyone in town who owns a black coat is up the hill."
- **Room 14, Boot Hill — entering ends the day.** The service is just over:

> "The service is over. Mr. Pike has been remembered, six years late and very thoroughly. The town is coming back down the hill, Colonel Fanshawe in front, holding his hat."

  If `T_SHENG_TASK` is set and D4 is not done, Sowerby is at the gate with the plate (D4, below). Then `T_FUNERAL_DAY` clears, the Colonel is back at his desk, and Sowerby is back in his church.

- **Another service** if the day ended too soon: SOW_A1 option 7, an anniversary; FRA_A1 option 6 prints it again. Doc 02's dead-end audit: "further funerals can be arranged."

## C4 · Search the office

*Room 11, on the funeral day.* Doc 54's lines. The log → THE SUBMISSION LOG and `T_QUEUE_PADDED`; the drawer → THE PHOTOGRAPH and `T_MOTT_FACE_UNKNOWN` → **C4**.

## C5 · Show Winnie

*Room 5.* THE SUBMISSION LOG on Winnie opens WIN_B2 (doc 24, errata 66). Complete as written.

## C6 · The assay returns

*Room 5.* After WIN_B2 option 1, once Thad has left the office and come back, the next TALK TO opens **WIN_B4** (doc 04): its opening issues THE ASSAY OF RECORD → **C6**. Its option 1 is Winnie's sparring: pairs 5–9.

## D1 · The ninety-day rule

*Room 7.* SUM_B1 option 1″ → `T_NINETY_DAYS` → **D1**.

## D2 · The only neighbor is Nickel Pratt

*Rooms 23 and 25.* The first time Thad comes to Prosperity in Act II, Pratt is on it, pulling up the stake: PRA_D2 plays as he arrives. At Pratt's claim, PRA_B1 options 1–4 → `T_PRATT_PAID`; option 6 is the refusal to attest → **D2**.

## D3 · Follow the money

*Room 28.* SHE_A1 option 1 → `T_SHENG_HOLDS_PAPER`, which opens SHE_D1; SHE_D1 option 1 — Sheng's terms: collect the Reverend's linen debt → `T_SHENG_TASK` → **D3**.

## D4 · Sheng's task

*Rooms 17, 14, 28.* On an ordinary day the Reverend has no money (SOW_A1 option 6). On the funeral day he has a full plate, at the foot of Boot Hill:

> **THAD:** "Reverend. Mr. Sheng's linens."
> **SOWERBY:** "Today? Today of all days?"
> **THAD:** "It's the only day you have it."
> **SOWERBY:** *(He looks at the collection plate for a long time. Then he counts out of it with his eyes shut.)* "Nine funerals of linen. He starches with feeling." → THE LINEN MONEY

SHE_D1 option 1′ — Sheng takes it, reads the Thursday ledger, and gives Thad the line he needs for D5: the Company carries Claim Two at eleven thousand dollars → `T_PRATT_TRAIL` → **D4**.

## D5 · Turn Pratt

*Room 25.* PRA_B1 option 7 → **PRA_D5** (doc 04; its first line now quotes the Company's books, which Thad has from Sheng, not the offer he will not hear until E0b). "He signs" is the quitclaim: Pratt gives up jumping Prosperity → `T_PRATT_TURNED` → **D5**. PRA_D6 follows; its option 4 is Pratt's sparring (pairs 10–15).

## D6 · The attestation

*Room 7.* PRA_D6 option 5; the next time Thad enters the Registrar's, Pratt is at the counter:

> **SUMP:** "You attest that Thaddeus Grubb has occupied Claim Two continuously for ninety days."
> **PRATT:** "Yep."
> **SUMP:** "You are his neighbor."
> **PRATT:** "Yep."
> **SUMP:** "How long have you known him?"
> **PRATT:** *(a very long pause)* "…Ninety days."
> **SUMP:** *(He notarizes it. He stamps it. He does not look up.)* "Document D."
> **THAD:** "It has been eleven days."
> **SUMP:** "The stamp did not ask."
> → THE ATTESTATION, **D6**.

## E0 · The Certificate of Contiguity

*Room 7.* SUM_B1 option 1‴, holding THE AFFIDAVIT, THE ASSAY OF RECORD and THE ATTESTATION → THE CERTIFICATE (the three are kept, stamped SEEN), and the viewing:

> **SUMP:** *(He brings Claim One's filing to the window, under its glass.)* "Claim One. Obadiah Mott, eighteen forty-six. 'The richest strike in the history of this territory, lying at the place herein described.'"
> **THAD:** "Where is it described?"
> **SUMP:** "Herein." *(He turns the glass over. The back of the sheet is blank.)* "The office accepted it. It was a busy year."
> → `T_CLAIM1_BLANK`, **E0**.

## E0b · Fanshawe's offer — the Act II turn

*Room 11.* The next time Thad enters after E0, Fanshawe is waiting, and FAN_C1 (doc 04) opens on "Eleven thousand dollars." Option 1, the contract and Clause 9, and Thad's aside — *"He doesn't want the claim. He wants it quiet."* → `T_EXCAVATION_CLAUSE`, **E0b**. Then the act card, **PART THREE — THADDEUS GRUBB IS LEGALLY DEAD**, and `ACT` = 3 (errata 75; errata 60's "the funeral sets act 3" is withdrawn, because E1–E6 come first). The contract is read in place; it is not an item.

---

# ACT III

## E1 · Have Mott declared dead

*Room 7.* SUM_E1 option 1 (doc 04): seven years is no obstacle; standing is. Mott has no kin on file and owes nobody → **E1**, blocked by design.

## E2 · The loophole

*Room 7.* SUM_E1 option 2: Section nineteen, said aloud, to its end → `T_NEED_TO_DIE`, `T_EXECUTOR_RULE` → **E2**.

## E3 · The eulogy, and paying for one's own funeral

*Rooms 17, 28, 13. Three steps.*

1. **SOW_C1** (doc 04), open once E2 is done: the counter runs; "He was present." closes it at fifty cents → `T_SOWERBY_PRICE`.
2. **SHE_D1 option 2** (doc 04), open once E2 and D4 are done: SHENG'S LOAN, two dollars and sixty cents — Sheng knows the exact price before Thad does. This is doc 02's "Sheng's goodwill (D4)".
3. **The undertaker.** UND_C1 (doc 04) is his Act III node; option 1 sizes the coffin → `T_COFFIN_SIZED`. Then:

> **THE UNDERTAKER** · USE SHENG'S LOAN, *with `T_SOWERBY_PRICE` and `T_COFFIN_SIZED`* — **UNDERTAKER:** *(He counts it. It is exact.)* "Pine. Handles. Plate. The hole. The Reverend's four words." *(beat)* "Paid." → the loan is spent; `T_FUNERAL_BOOKED`, **E3**. Frame's notice goes up: FUNERAL THURSDAY: THE PIANO MAN.
> **THE UNDERTAKER** · USE SHENG'S LOAN, *before the Reverend's figure* — **UNDERTAKER:** "The Reverend hasn't sent his figure. I don't bury on estimates."
> **THE UNDERTAKER** · USE SHENG'S LOAN, *before the sizing* — **UNDERTAKER:** "Stand straight first. Sizing's free."

## E4 · The certificate

*Room 5.* WIN_C1 (doc 04) opens once `T_FUNERAL_BOOKED` is set and C5 is complete. Option 4 and the signing → THE DEATH CERTIFICATE → **E4**.

## E5 · The obituary

*Rooms 7 and 9.* SUM_C1 option 1, presenting the certificate, records the decease → `T_DECEASED`. FRA_E1 (doc 04) opens on the next TALK TO Frame after that, Thad with his hat low. Option 1 → THE OBITUARY (THADEUS GRUBBE, errata 9) → `T_OBITUARY`, **E5**.

## E6 · Appoint the executor

*Night rounds, then Room 7.* Every candidate has an interest — Winnie certifies, Sheng holds paper, Frame would sell it, Pratt wants it, Sowerby is paid by it, Fanshawe is Fanshawe — and Section nineteen, sub-section two, forbids every one of them. Nobody has ever thought about Hob.

1. HOB_E6 (doc 04), on his rounds at night once `T_EXECUTOR_RULE` is set → THE EXECUTOR'S FORM, signed "Hob".
2. The form to Sump:

> **REGISTRAR SUMP** · USE THE EXECUTOR'S FORM, *with `T_DECEASED`* — **SUMP:** *(He reads the signature for some time.)* "Hob." *(beat)* "Surname." — "He didn't give one." — "The statute does not require one. It never imagined it would need to." *(He checks the rolls.)* "The night watchman. Holds no claim, owes nothing, is owed nothing, and has never filed so much as a complaint." *(Stamp.)* "Accepted." *(He hands the form back.)* → `T_EXECUTOR_NAMED`, **E6**.
> **REGISTRAR SUMP** · USE THE EXECUTOR'S FORM, *before `T_DECEASED`* — **SUMP:** "The office appoints executors to estates, Mr. Grubb. You are not yet an estate."

Asking anyone else to be executor is answered by the interest rule:

> **WINNIE** · USE THE EXECUTOR'S FORM — **WINNIE:** "I certified your death. I can't also tidy up after it."
> **AH-LAM SHENG** · USE THE EXECUTOR'S FORM — **SHENG:** "I hold paper on your claim's neighbors. I would be executing myself."
> **IGNATIUS FRAME** · USE THE EXECUTOR'S FORM — **FRAME:** "Executor! Of the piano man! Can I print that I am?" *(Thad takes the form back.)*
> **NICKEL PRATT** · USE THE EXECUTOR'S FORM — **PRATT:** "Eleven dollars for the claim." *(Thad takes the form back.)*
> **REVEREND SOWERBY** · USE THE EXECUTOR'S FORM — **SOWERBY:** "I am to be paid out of the estate, Mr. Grubb. It would be indecent. Also impossible."

## E7 · The coffin

*Room 31, then Room 32. Doc 48 S2 beats 1–3 stand; beat 4 is replaced. Doc 04's graveside note governs: Thad is in the box for Sowerby's eleven minutes and cannot hear them.*

- During the funeral, Room 31's exits are refused: "It is my funeral. I should stay for it."
- Doc 49's refusals on THE COFFIN ("Ahead of schedule") stand until beat 3 has played.

> **THE COFFIN** · USE, *after S2 beat 3* — "This is the part of the plan where I lie down." **UNDERTAKER:** "Lid stays loose. Knock twice when they've gone." *(Thad lies down. The lid comes over him. Outside, Sowerby clears his throat and departs from the agreed text.)* → Room 32, at 0 s: the nail. *(The undertaker nails it. In his trade everyone lies down eventually, and nobody has ever asked him to leave a lid loose.)* → **E7**.

*There is nothing to knock with. That is Room 32.*

## E8 · Hob digs him out

*Room 32* (errata 70, 71): four minutes sealed; the lid into HOB_C1. **When HOB_C1 ends**, Thad is in Room 31 at night beside the open grave; Hob has gone:

> "Out. I have been buried and dug up in one evening, and of the two I preferred the second." → `T_FUNERAL_DONE`

## E9 · The archive — Hob is Mott

*Rooms 7 and 8.*

> **THE ARCHIVE DOOR** · OPEN, *with `T_EXECUTOR_NAMED`* — **SUMP:** "The executor of the late Mr. Grubb." — "His agent." — **SUMP:** *(He looks at Thad for some time.)* "You resemble him." — "So I'm told." — **SUMP:** *(He unlocks it.)* "Twenty minutes. The archive closes at four, and so do I." → Room 8.

**Two ways to see it**, both quiet:

> **THE MOTT FILE** · USE THE EXECUTOR'S FORM — "Hob's signature. Mott's signature. The same small, upright hand, twelve years apart, in no hurry either time." → `T_SAME_HAND`, **E9**.
> **THE MOTT FILE** · LOOK, *with `T_HOB_HANDWRITING`* — "The famous filing, under glass. A very neat hand. I have told its owner so, to his face, and he looked at me for a long time." → `T_SAME_HAND`, **E9**.

*The second is invariant 7 at work: the `[COMIC]` option is the one that solves the mystery, and nothing ever says so. THE TIMESHEET's LISTEN is unchanged, sets nothing, and is not pointed at (invariant 3). Without either, THE MOTT FILE's ordinary lines play and nothing is lost: the form is still in Thad's pocket, and HOB_C1 is still open.*

## E10 · The confession — the Act III turn

*Room 21, at night.* HOB_C2's entry is E9 (errata 71 D). Entering the shack after E9 plays doc 48 S4 beat 1, then HOB_C2's opening — the confession — and **E10** completes when that opening ends. Pairs 22, 23 and 24 join: Thad now knows the truth, and the truth is what wins Duel Three. The options after it are free. On leaving, S4 beat 3: `T_HOB_IS_MOTT` and `T_NO_GOLD_EVER` (doc 04's name; S4's `T_STRIKE_WAS_LIE` is the same flag), and Hob's line; then **PART FOUR — THE QUIETEST PART OF THE GAME**, and `ACT` = 4.

**Act IV opens in Room 19, morning**, the case packed on the bed:

> "Packed. It took four minutes; there was less to pack than there was to leave. The coach is at noon. I am going to look at my mud once more first, because nobody else will."

---

# ACT IV

## F1 · One last look at Prosperity

*Rooms 23/24.*

> **THE HOLE** · LOOK, *Act IV* — "The hole is warm. It has been warm since the day I bought it: warm air, out of solid rock, all autumn." *(beat)* "Air does not come out of rock. It comes through it." → `T_DRAUGHT`, **F1**.
> **THE HOLE** · USE THE PICKAXE, *after F1* — "Three days. Forty feet. The head came off once, forwards, which I took as encouragement. I have borrowed the lamp from my room, and I will return it, which is the second time I have promised that to something in this territory. The draught got warmer the whole way down." → Room 34 opens below the hole.
> **THE HOLE** · USE THE PICKAXE, *before F1* — "Dig where? I have been digging at this town for weeks and it has not moved."

**Room 34 to Room 33** is THE GAP, where the tunnel broke into a hollow:

> **THE GAP** — LOOK 1 "Where my tunnel broke into a hollow in the rock. The warm air comes out of it." · 2 "Wide enough for a man who has stopped minding his coat." · 3 "Dark beyond. Not the dark of a tunnel. The dark of a room." | LISTEN 1 "A long, low hum, very faint. The rock is listening back." · 2 "The hum again. It does not change when I do." · 3 "Nothing I can name. I am going in to name it."

## F2 · The Listening

*Room 33.* Errata 70 C–F and 71 E; doc 54's Room 33. The writing is complete. The tap curve, the void's position and its radius are tuning for the builder, judged by Tyler's ear.

## F3 · Break through

*Room 33 → Room 34's second state.* Doc 54's three swings. On the third, after "a dark that goes a long way down":

> *(A piece of the wall comes away in his hand. It is much heavier than a piece of wall should be.)* → THE SAMPLE; `T_BROKE_THROUGH`; `T_STRIKE_FOUND` → **F3**.

*Doc 49's THE SEAM · PICK UP refusal stands: Thad takes nothing more. This one he will file.*

**WIN_F1** (doc 04) opens on the next TALK TO Winnie with THE SAMPLE. Its option 1, "Run it.", is the assay at the window and its result → `T_ASSAY_RUN`.

## F4 · The final duel — Duel Three

*Room 2, Main Street, Act IV.* The first time Thad steps onto the street after `T_ASSAY_RUN`, Fanshawe is waiting with half the town and the judges' table on the boardwalk, Sowerby holding the pencil, and doc 03's challenge plays. Exchanges in the order 4, 9, 22, 23, then the fifth; a lost exchange is thrown again (doc 03, errata 75). The fifth's right answer is pair 24, the truth. Sowerby's verdict, "Better still!", and Fanshawe's hat → `T_FANSHAWE_BEATEN`, **F4**.

*Doc 02's "24 pairs" is withdrawn as a requirement (errata 75): Duel Three needs the five pairs it uses — 4 and 9, guaranteed in Act II, and 22–24, given at E10 — so nothing missable can block the ending.*

## F5 · The filing — the last puzzle

*Room 7. Doc 48 S6 at full depth.* TALK TO Sump after F4, holding THE SAMPLE, with `T_ASSAY_RUN`: Winnie is at the end of the counter. The form is Form 12-C (Amended). The pen has ink.

**Beat 1 — the documents, laid down one by one, in any order:**

> **THE COUNTER** · USE THE DEATH CERTIFICATE — **SUMP:** "You are deceased." — "I was. I'd like to stop." — **SUMP:** "Form 31-F. Notice of Return. It was printed in hope." *(Stamp. Thad is alive.)*
> **THE COUNTER** · USE THE DEED — **SUMP:** "Claim Two. The adjoining holder." *(Stamp.)*
> **THE COUNTER** · USE THE CERTIFICATE — **SUMP:** "Contiguity. A neighbor holding a Certificate of Contiguity may file an amended location on behalf of an absent claimholder. Section nineteen, sub-section four." *(beat)* "Nobody has ever read sub-section four." — "I have." — **SUMP:** "Yes. I saw you."
> **THE COUNTER** · USE THE SAMPLE — **WINNIE:** "Twenty-two hundred to the ton. Assayed this morning, at my window, by me." *(She signs beside it.)*
> **THE COUNTER** · USE anything else Thad has given the office before — **SUMP:** "Already on file, Mr. Grubb. Everything you have ever given me is already on file."

**Beat 2 — the name.** SUM_F1 (doc 04), once all four are down.

**Then WIN_F2** (doc 04): "You're putting it in his name." … *(stamping)* "…Certified."

**Beat 3 — the county seal.** One stamp. The loudest sound in the game; the score rests under it.

**Beat 4 — the read-back:**

> **SUMP:** *(reading, toneless)* "Amended location, Claim One. Holder, Obadiah Mott. 'The strike lies at the place herein described.'" *(beat)* "Which is now described." *(beat)* "Under statute, a claim must be worked by its holder within thirty days, or it reverts to the Territory."
> **THAD:** "So Mr. Mott will have to come forward."
> **SUMP:** "In person. To this window. Within thirty days." *(He blots it.)* "I shall look forward to it."
> → `T_FILED`, **F5**. Room 36.

---

# THE RUNNING GAG, MADE VISIBLE — the Clarion's headlines

*Errata 9's nine renderings needed somewhere to be read. Room 9's THE SCHEDULE BOARD ≡ THE HEADLINE BOARD carries the current edition: after each event below, its next LOOK is that edition's line (then its ordinary lines resume), and `MISSPELLINGS_SEEN` counts it.*

> **THE HEADLINE BOARD** · LOOK, *after A3* — "EASTERN GENTLEMAN BUYS CLAIM TWO, IS DELIGHTED. 'Mr. T. GRUBBS of Providence.' The S is new."
> *after A5* — "RACCOON EVICTED BY PIANO MAN. 'Mr. GRUB.' I have lost a B to a raccoon."
> *after A7* — "DIVINER SURVEYS CLAIM TWO; EARTH 'BRIEF.' 'Mr. GRABB.' He has given me an A I did not ask for."
> *after B5* — "VESSEL TROUNCES NEWCOMER IN ASSAY. 'A Mr. Grubbe of the East.' I am now a region."
> *after B6* — "VESSEL SIGNS! 'T. GRUB.' I won, and it cost me a letter."
> *after C5* — "ASSAY QUEUE 'SLIMS,' SAYS LEDGER. 'Mr. GRUBBE, a client.' The E is back. It was always going to come back."
> *after C3* — "MEMORIAL FOR E. PIKE, LATE. ALL WELCOME. REFRESHMENTS. Frame added the refreshments. He was right to."
> *after E3* — "FUNERAL THURSDAY: THE PIANO MAN. They have not used my name at all. It is the most accurate they have been."
> *after E5* — "OBITUARY, PAGE ONE. 'THADEUS GRUBBE.' I have read my own death in the street, misspelled with great care."

*The ninth is Room 31's marker, spelled right (errata 9).*

---

# STATE THIS PASS ADDS

| Flag | Set by | Read by |
|---|---|---|
| `T_SURVEY_NEEDED` | A6 | SUM_A1 1′, OZY_A1 1 |
| `T_OZY_PAID` | A7, the fee | A7, the map |
| `T_DINED` | A10 beat 3 | — |
| `T_VESSEL_LOCATION` | FRA_B1 | B3 |
| `T_GRIEVANCE_MOTT` | LIV_A1 6 | LIV_A1 4, HOB_C2 6 |
| `T_VESSEL_FOUND` | B3 | Vessel in Room 4 |
| `T_OFFICE_TOPIC` | WIN_B1 6 | FRA_A1 5 |
| `T_FANSHAWE_FUNERALS` | FRA_A1 5 | SOW_A1 5 |
| `T_MEMORIAL_BOOKED` | the letter on Sowerby; SOW_A1 7 | FRA_A1 6 |
| `T_FUNERAL_DAY` | FRA_A1 6 | Rooms 2, 11, 14, 17; D4 |
| `T_SHENG_TASK` | SHE_D1 1 | SOW_A1 6, D4 at Boot Hill |
| `T_PRATT_TRAIL` | SHE_D1 1′ | PRA_B1 7 |
| `T_PRATT_TURNED` | PRA_D5 | PRA_D6 |
| `T_SOWERBY_PRICE` | SOW_C1 3 | the undertaker |
| `T_COFFIN_SIZED` | UND_C1 1 | the undertaker |
| `T_FUNERAL_BOOKED` | E3 | WIN_C1 |
| `T_DECEASED` | SUM_C1 1 | FRA_E1, Sump and the form |
| `T_EXECUTOR_NAMED` | E6 | the archive door |
| `T_SAME_HAND` | E9 | HOB_C2's entry (with E9) |
| `T_ASSAY_RUN` | WIN_F1 1 | F4's trigger, S6 |
| `T_FANSHAWE_BEATEN` | F4 | S6 |
| `T_FILED` | S6 | Room 36 |

Flags doc 04 already declared are set where the table above and doc 04 say. `ACT` moves at the three act cards: 2 at A10, 3 at E0b, 4 at E10.

---

# FOR THE BUILDER

- **Retained options with no written repeat replay their first response.** That is errata 57's runtime behavior and it stands; `counted-repeat` options must author their repeats, and the two that did not (FAN_C1 3, SHE_A1 5) now do.
- `content/items/horse-blanket.json` becomes THE LIVERY BLANKET from doc 23 (id `blanket`); the eggs and the tonic now live in doc 23 too. Doc 24's A5 row (the HORSE BLANKET line) and its HORSE BLANKET pool are superseded by doc 54's blanket lines; `content/combinations.json` routes by line, so the A5 pair is re-routed when Room 23 is built, not before.
- Doc 27's trees carry no errata-57 tags and stay permissive, as errata 57's transition allows.
- Every node, item and scene above is listed per puzzle in `proofs/readiness/puzzles.json`, and the readiness gate checks each one is there.
