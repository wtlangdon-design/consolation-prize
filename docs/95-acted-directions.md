# THE LAST CLAIM IN CONSOLATION
## 95 · Acted directions — which stage directions a figure performs, and which stay printed

*Tyler, 2026-11-06. He was told: "a few directions are still printed rather than acted, such as '(stamping)' during the filing. Acting them out needs new poses." His answer: **"then let's do it? Lol"**. Errata 141 records the ruling.*

*It amends doc 58 (Tyler, 2026-11-05), which made every conversation direction SHOWN, in parentheses, in the quieter ink. Doc 58 still decides which directions are notes and are never shown, and how a bare pause is shown. This document decides, for every direction that is shown, whether a figure acts it instead.*

*Confirmed the same evening. Asked whether the physical directions whose wording carries the joke should stay printed (Thad's three pick swings, "Stamp. Thad is alive.", Hob's "He does not walk on for four seconds.", the Reverend's "A long, painful pause."), Tyler chose **"Yes, keep those printed (Recommended)"**. The other recommendations in the catalogue stand as written.*

---

## The rules

1. **A physical direction is acted.** A direction that describes a visible physical action by a figure on screen — stamping, signing, blotting, handing over a pen, putting on a hat, looking up at the sky, closing her eyes, writing it down, swinging a pick — is performed: the figure plays a pose or a short run of poses, and the printed text no longer shows.
2. **Narration stays printed,** exactly as doc 58 rules: what a man means or knows ("He means it. It is the most dangerous thing he says all evening."), what a moment means ("From this moment Pratt dislikes Thad…"), a tone ("warmly", "wounded"), and every pause, worded or bare.
3. **When in doubt, keep it printed.** A direction whose joke would be lost by acting it stays printed, and is listed below for Tyler.
4. **A direction is acted only with frames the figure has.** Class **A** is acted now. Class **B** is physical, but needs a pose that has not been drawn; it stays printed until it is drawn (`reference/acted-directions/brief.md`), and then moves to A here. Class **C** stays printed.
5. **Acting it never marks it.** Invariants 3 and 7 hold: an acted direction is performed wherever it falls, progress or not, and HOB_C1 option 4 is left exactly as it was.

## How the table is read

`tools/extract-content.mjs` reads the table below into `content/acted-directions.json`, and the game loads it. Nothing about a direction's class lives anywhere else. For a row of class A:

- **Performed by** names the figure, or figures, that act it (their ambient ids). Every figure named that is in the room performs it, whoever the line is written for: "They resume immediately." is both boundary men.
- **Thad acts in a clip** (errata 148). He is named with the clip, `thad:pick-fit`, and his **Frames** are that clip's frames, played on him in the facing the clip is drawn in. He is in every room he speaks in, so his rows need no figure standing there.
- **Frames** are the figure's own frame indices, played in order across **Seconds**. The beat cannot be clicked through, as a duel's held beats cannot (errata 130).
- **Holds** is a frame the figure keeps while he goes on speaking in the same exchange, until his next acted direction: Ozymandia speaks with her eyes still closed.
- **Cue** is a doc 45 sound cue and the frame (counted from 1) it lands on.

`tests/acted-directions.test.ts` holds it: every direction in the content is in this table, every row is in the content, every A row has a figure in its room that performs it and prints nothing, and no B or C row is acted by anyone.

## The directions

Counts: **A 20 · B 2 · C 47** — 69 directions, every one flagged `"direction": true` in `content/dialogue`, `content/combinations.json`, `content/assay` and `content/rooms`.

| # | Class | Speaker | Direction | Where | Performed by | Frames | Seconds | Holds | Cue | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | A | fanshawe | He puts on his hat. | assay/assay duel_three | duel_fanshawe | 4 | 1.5 |  |  | His frame 4 is the hat (errata 131 B). Already acted; now read from here. |
| 2 | A | sump | Stamp. | combinations (deed on counter, at the filing) | sump | 3 0 | 1.2 |  | U-STAMP @2 | Frame 3 raises the stamp; it comes down on 0, with the approved stamp (doc 45 U-STAMP: "where the writing says one does"). |
| 3 | C | thad | Thad swings. The head flies off into the dark and lands somewhere he cannot see. | combinations (pickaxe on every_rock_surface, first) |  |  |  |  |  | The swing is physical, but the joke is where the head goes: into a dark the player cannot see either. Acting it would show a man swinging at nothing. |
| 4 | A | thad | He finds it and fits it back. | combinations (pickaxe on every_rock_surface, first) | thad:pick-fit | 1 1 2 3 0 | 2.5 |  |  | Crouched in the dark, feeling the ground for the head with the bare handle in his other hand (1), fitting the head onto the upright handle (2), the pick whole (3), and standing again (0, his stand-back frame) for his line. Cast-unify 75 and 77 (errata 148). |
| 5 | C | thad | The head comes off again, gently, as if apologizing. | combinations (pickaxe on every_rock_surface, second) |  |  |  |  |  | "As if apologizing" is the joke, and it is the pick's, not a figure's. |
| 6 | A | thad | He fits it back. | combinations (pickaxe on every_rock_surface, second) | thad:pick-fit | 2 3 0 | 1.5 |  |  | Fitting the head on again (2), the pick whole (3), and standing (0). As the first fit. |
| 7 | C | thad | Thad holds the head on with one hand and swings with the other. The rock gives. Warm air comes through, and behind it a dark that goes a long way down. | combinations (pickaxe on every_rock_surface, third) |  |  |  |  |  | Mostly what the rock does, and Room 34's second state already shows the result. |
| 8 | C | thad | A piece of the wall comes away in his hand. It is much heavier than a piece of wall should be. | combinations (pickaxe on every_rock_surface, third) |  |  |  |  |  | "Much heavier than a piece of wall should be" is the clue and the joke; no pose shows weight. |
| 9 | C | sump | Stamp. Thad is alive. | combinations (death_certificate on counter, at the filing) |  |  |  |  |  | "Thad is alive." is the punchline, and a stamp cannot say it. |
| 10 | A | winnie | She signs beside it. | combinations (sample on counter, at the filing) | winnie_registrar | 7 7 0 | 1.5 |  |  | Her frame 7 signs a paper on the closed book at her end of the counter, head bent (cast-unify 71, errata 148). |
| 11 | A | boundary_b | They resume immediately. | dialogue/amb-boundary-men root option 2 | boundary_b, boundary_a | 2 3 2 3 | 2.0 |  |  | Both men point and argue again at once (their frames 2 and 3). "Immediately" is what the player sees. |
| 12 | A | deke_vessel | He looks at the watch. | dialogue/deke-vessel root option 4 | deke_vessel | 5 | 1.2 |  |  | His head bent to the watch Thad holds out across the barrel, his hands still at his belt (frame 5; cast-unify 76, errata 148). |
| 13 | A | deke_vessel | He finishes his drink, collects his hat, and leaves the Nugget. | dialogue/deke-vessel root option 6 | deke_vessel | 3 | 1.0 |  |  | His hat (frame 3), then the walk out of the Nugget he already has when T_SWINDLED lands (doc 57 A3). The drink is not shown. |
| 14 | C | fanshawe | He knows exactly who is in the Nugget. | dialogue/fanshawe FAN_A0 option 3 |  |  |  |  |  | Narration: what he knows. |
| 15 | C | fanshawe | He gives the map anyway. It has Claim Two circled. | dialogue/fanshawe FAN_A1 option 2 |  |  |  |  |  | "Claim Two circled" is information the player needs, and only words carry it. |
| 16 | C | fanshawe | He will not. Sump is never asked. | dialogue/fanshawe FAN_A2 option 2 |  |  |  |  |  | Narration. |
| 17 | C | fanshawe | The subject has gone wherever subjects go at his table. | dialogue/fanshawe FAN_A2 option 3 |  |  |  |  |  | Narration. |
| 18 | C | fanshawe | warmly | dialogue/fanshawe FAN_A2 option 4 |  |  |  |  |  | A tone. |
| 19 | C | fanshawe | He means it. It is the most dangerous thing he says all evening. | dialogue/fanshawe FAN_A2 option 5 |  |  |  |  |  | Narration: meaning. |
| 20 | C | fanshawe | Thad has not mentioned the sealed filing. He watches Thad not mention it. Both men note it. | dialogue/fanshawe FAN_B2 option 1 |  |  |  |  |  | Narration: what two men notice. |
| 21 | C | fanshawe | He says it with real warmth. It is not a threat. It is worse — it is preparedness. | dialogue/fanshawe FAN_B2 option 2 |  |  |  |  |  | Narration: meaning. |
| 22 | C | fanshawe | Buena Vista was February 1847. | dialogue/fanshawe FAN_B2 option 3 |  |  |  |  |  | Narration: a fact. |
| 23 | C | fanshawe | He hands Thad the pen. The pen has no ink. | dialogue/fanshawe FAN_C1 option 2 |  |  |  |  |  | Physical, but "The pen has no ink" is the joke, and an inkless pen looks like a pen. |
| 24 | C | fanshawe | He does not send for any. | dialogue/fanshawe FAN_C1 option 2 |  |  |  |  |  | Something not done. |
| 25 | C | fanshawe | genuine delight | dialogue/fanshawe FAN_C1 option 5 |  |  |  |  |  | A tone. |
| 26 | C | fanshawe | It is not. | dialogue/fanshawe FAN_C1 option 5 |  |  |  |  |  | Narration. |
| 27 | C | frame | He has the type set before Thad has finished the name. | dialogue/frame FRA_A1 option 6 |  |  |  |  |  | The joke is the speed, which is narration; the type is not in the room's picture. |
| 28 | C | frame | he savors it | dialogue/frame FRA_A1 option 7 |  |  |  |  |  | A tone. |
| 29 | A | frame | He looks up. He looks at the stranger for a long moment. | dialogue/frame FRA_E1 option 3 | frame | 3 0 0 0 0 | 3.0 |  |  | Head down in his notebook (frame 3), then up, and the long look held on his rest frame, which faces out. The leaner redraw (errata 138) keeps them; any later one must too. |
| 30 | C | hob | nothing | dialogue/hob HOB_A1 option 1 |  |  |  |  |  | Hob says nothing; there is nothing to act. |
| 31 | C | hob | He stops. Then: | dialogue/hob HOB_A1 option 3 |  |  |  |  |  | A pause with a stage cue; pauses stay printed (the ruling). |
| 32 | C | hob | He does not walk on for four seconds. | dialogue/hob HOB_A1 option 3 |  |  |  |  |  | A pause, and "four seconds" is the joke as written. See the list for Tyler. |
| 33 | C | hob | He signs Form 31-E against the lamp post, and hands it back. | dialogue/hob HOB_E6 option 1 |  |  |  |  |  | The back alley's plate has no lamp post, so the pose would sign against something the words do not name. See the list for Tyler. |
| 34 | C | hob | He looks at Thad for a long time. | dialogue/hob HOB_C1 option 4 |  |  |  |  |  | HOB_C1 option 4 (invariant 7): nothing about it may differ from the other options. It stays exactly as it is. |
| 35 | C | ozymandia | genuinely puzzled | dialogue/ozymandia OZY_A1 option 4 |  |  |  |  |  | A tone. |
| 36 | A | ozymandia | she closes her eyes | dialogue/ozymandia OZY_A1 option 5 | ozymandia | 0 | 1.0 | 2 |  | Frame 0 is her eyes closed at her temples; she says her line on frame 2, eyes still closed, humming. |
| 37 | A | ozymandia | She opens them. | dialogue/ozymandia OZY_A1 option 5 | ozymandia | 4 | 0.8 | 4 |  | Frame 4 is her eyes open and her palm out, which is where "Two dollars." goes. |
| 38 | C | pratt | Of what? | dialogue/pratt-jump PRA_D2 option 1 |  |  |  |  |  | Narration. |
| 39 | C | pratt | This is true, and it is the entire legal system. | dialogue/pratt-jump PRA_D2 option 2 |  |  |  |  |  | Narration. |
| 40 | A | pratt | He looks at his feet, checking. | dialogue/pratt-jump PRA_D2 option 3 | pratt_jump | 5 | 1.5 |  |  | Head bowed over his boots, the mallet resting as it rests on his rest frame (frame 5; cast-unify 73, errata 148). |
| 41 | C | pratt | He thinks about it for some time. | dialogue/pratt PRA_A1 option 1 |  |  |  |  |  | A pause, worded; pauses stay printed. |
| 42 | C | pratt | He walks over, unhurried, and reaches into the hole. The bite. He withdraws the hand and studies it. | dialogue/pratt PRA_A1 option 1 |  |  |  |  |  | The hole is on Claim Two, in Prosperity; Pratt says it on his own claim, where there is no hole to walk to. See the list for Tyler. |
| 43 | C | pratt | From this moment Pratt dislikes Thad, steadily and without heat, the way he does everything. | dialogue/pratt PRA_A1 option 1 |  |  |  |  |  | Narration. |
| 44 | C | pratt | He says it as though it were the weather. | dialogue/pratt PRA_A1 option 2 |  |  |  |  |  | A tone. |
| 45 | A | pratt | He looks up at the sky, checking. | dialogue/pratt PRA_A1 option 3 | pratt | 2 | 1.5 |  |  | Frame 2 is Pratt checking the sky (errata 111 M). |
| 46 | C | pratt | He does not consider this strange. | dialogue/pratt PRA_B1 option 1 |  |  |  |  |  | Narration. |
| 47 | C | pratt | It is not his claim either. Nobody has ever had the heart to tell him, and by now it is his the way anything is anybody's here: by upkeep. | dialogue/pratt PRA_D6 option 2 |  |  |  |  |  | Narration. |
| 48 | C | pratt | a long, respectful pause | dialogue/pratt PRA_D6 option 3 |  |  |  |  |  | A pause, worded; pauses stay printed. |
| 49 | A | pratt | He puts his hat on. | dialogue/pratt PRA_D6 option 5 | pratt | 5 6 0 | 1.5 |  |  | His hat off at his chest (5), going back on (6), and on (0). Cast-unify 73, errata 148. |
| 50 | C | thad | The raccoon regards him. | dialogue/raccoon RAC_A1 option 1 |  |  |  |  |  | The raccoon already faces Thad on his rest frame, so acting it shows nothing new. |
| 51 | C | thad | The raccoon does not. | dialogue/raccoon RAC_A1 option 4 |  |  |  |  |  | Something not done. |
| 52 | A | sheng | He returns to doing laundry. | dialogue/sheng SHE_A1 option 3 | sheng | 3 4 3 4 0 | 2.5 |  |  | Two strokes of the iron and back to ironing (frames 3, 4, 0). |
| 53 | C | sowerby | He brightens, and then remembers to be grave. | dialogue/sowerby SOW_A1 option 5 |  |  |  |  |  | Two expressions in a row; the joke is the remembering. |
| 54 | C | sowerby | wounded | dialogue/sowerby SOW_C1 option 2 |  |  |  |  |  | A tone. |
| 55 | C | sowerby | A long, painful pause. He writes it down. | dialogue/sowerby SOW_C1 option 3 |  |  |  |  |  | Mostly a pause, worded ("painful"). See the list for Tyler. |
| 56 | C | sowerby | His eyes fill. | dialogue/sowerby SOW_C1 option 4 |  |  |  |  |  | Too small to see at game size. |
| 57 | C | sowerby | He goes on. He is still going when Thad looks back from the door. | dialogue/sowerby SOW_C1 option 4 |  |  |  |  |  | Narration: it happens after Thad has gone. |
| 58 | A | sump | He brings Claim One's filing to the window, under its glass. | dialogue/sump SUM_B1 option 4 | sump | 7 | 1.2 | 7 |  | Frame 7 holds the filing up in its glazed frame at the window, and he keeps it there through the next line (cast-unify 72, errata 148). |
| 59 | C | sump | He turns the glass over. The back of the sheet is blank. | dialogue/sump SUM_B1 option 4 |  |  |  |  |  | "The back of the sheet is blank" is the clue, and only words carry it. |
| 60 | A | winnie | stamping | dialogue/sump SUM_F1 option 1 | winnie_registrar | 5 6 0 | 1.2 |  | U-STAMP @2 | The stamp raised over the paper (5), down on it (6) with the approved stamp, and back to waiting (0). Cast-unify 71, errata 148. |
| 61 | C | sump | reading, toneless | dialogue/sump SUM_F1 option 1 |  |  |  |  |  | A tone. |
| 62 | A | sump | He blots it. | dialogue/sump SUM_F1 option 1 | sump | 5 6 5 0 | 1.6 |  |  | The rocker blotter rocked one way (5), the other (6), back (5), and his hands back on the ledger (0). Cast-unify 72, errata 148. |
| 63 | C | winnie | She stops writing. It is the first time she has stopped writing. | dialogue/winnie WIN_B1 option 3 |  |  |  |  |  | "It is the first time" is the joke, and it is narration. |
| 64 | A | winnie | signing | dialogue/winnie WIN_C1 option 4 | winnie | 2 3 2 3 | 1.6 | 2 |  | Her writing frames in Room 5 (2, 3); she says her line still writing. |
| 65 | C | sowerby | He looks at the collection plate for a long time. Then he counts out of it with his eyes shut. | rooms/boot-hill arrival scene |  |  |  |  |  | The joke is "with his eyes shut", too small to read at game size. See the list for Tyler. |
| 66 | C | pratt_registrar | a very long pause | rooms/claims-registrar arrival scene |  |  |  |  |  | A pause, worded; pauses stay printed. |
| 67 | A | sump | He notarizes it. He stamps it. He does not look up. | rooms/claims-registrar arrival scene | sump | 2 2 3 0 0 | 3.0 |  | U-STAMP @4 | He writes (2), raises the stamp (3) and brings it down (0) with the approved stamp, and stays bent to his ledger. |
| 68 | A | bell_ringer | He does not move. | dialogue/amb-bell-ringer root option 2 | bell_ringer | 0 | 2.0 |  |  | Errata 161: he holds his rest frame, mallet down, for the beat; the stillness is the answer. |
| 69 | B | letter_writer | He puts his pen down. | dialogue/amb-letter-writer root option 4 |  |  |  |  |  | Errata 170, the Main Street pass: the one moment he stops writing, because the name is Pike. Physical, and his drawn poses all hold the pen, so it stays printed until a pen-down pose is drawn (rule 4). |
| 70 | B | deke_vessel | He raises his glass an inch. | dialogue/deke-vessel root option 9 |  |  |  |  |  | Errata 172, doc 99's rewrite: his small toast to Pike, the one gesture of respect in a scene of selling. Physical, and no glass pose is drawn yet, so it stays printed (rule 4). |

## When a B pose is drawn

`reference/acted-directions/brief.md` briefs the image session. When a sheet is cut and wired:

1. Add the new frames to the figure's sheet and ambient file, keeping every existing frame index as it is.
2. Change the row here from B to A, and fill in **Performed by**, **Frames**, **Seconds** and, if a sound lands, **Cue**.
3. Run `node tools/extract-content.mjs`, then `npm test`. `tests/acted-directions.test.ts` fails until the figure is in the right room and has the frames.

Nothing else changes. The engine reads the class from here.

## For Tyler

Each item is a direction kept printed because acting it would lose something. Each has a recommendation.

1. **Thad's pickaxe in Room 33 (rows 3–8).** The three swings stay printed. Their jokes are where the head goes ("lands somewhere he cannot see", "as if apologizing") and what the wall weighs, and a pose shows none of that. The two fits ("He finds it and fits it back.", "He fits it back.") are B. Thad has no clip with a pickaxe in his hands, and none of his back-facing clips (reach, strain, tug, wrench) can stand in for one. **Recommendation:** draw the fits (one sheet in the brief) and keep the swings printed. The beat would then read as printed swing, acted fit, Thad's line. *Done (errata 148): the fits are acted from his `pick-fit` clip, the swings stay printed.*
2. **"Stamp. Thad is alive." (row 9).** The stamp is physical, but "Thad is alive." is the punchline. **Recommendation:** keep it printed as it is.
3. **Hob's "He does not walk on for four seconds." (row 32).** Hob is standing anyway, so acting it would be four seconds of nothing, and "four seconds" is the joke as written. **Recommendation:** keep it printed.
4. **Hob signing "against the lamp post" (row 33).** The back alley's plate has no lamp post. Acting it would have Hob sign against a wall or a barrel the words never name. **Recommendation:** keep it printed. If you want it acted, say what he signs against, and it becomes one more sheet.
5. **Pratt's bite (row 42).** It is physical and it sets up "Healing wrong." But the hole is on Claim Two, in Prosperity, and Pratt says the line on his own claim. **Recommendation:** keep it printed. Acting it would mean walking him into another room.
6. **Sowerby's "A long, painful pause. He writes it down." (row 55).** It is mostly a worded pause, and "painful" is the joke. **Recommendation:** keep it printed.
7. **Sowerby at Boot Hill's gate (row 65), "…counts out of it with his eyes shut".** Shut eyes do not read at game size. **Recommendation:** keep it printed.
8. **Deke's exit (row 13) is acted without the drink.** He tips his hat (his frame 3) and walks out on the walk he already has. "Finishes his drink" is not shown. **Recommendation:** accept it. Drawing the drink would cost a sheet for half a second.
