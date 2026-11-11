# THE LAST CLAIM IN CONSOLATION
## 126 · Conversations as Monkey Island ran them

*Tyler, 2026-11-11, playing Main Street on a tablet: "All the options are appearing at once for the conversation." Asked which he meant: "Reveal them gradually." Told how Monkey Island did it: "I want it to be exactly like MI. I thought I established that a long time ago." Then: "Fix ALL characters dialogue in the whole game to match my expectations. When I wake up in the morning I want it to all be done. You made all decisions you think are best to achieve it, even if it means writing more and/or new dialogue." Errata 280 records it. One voice, under doc 59 and doc 99. This document is the source: `tools/extract-content.mjs` reads it and applies it to every tree as the tree is written.*

## How Monkey Island ran a conversation

1. **The whole current list is shown at once,** three to five lines, nearly always one of them a joke, and a way out.
2. **A line asked is a line gone.** The script rebuilt the list after every answer, and what had been asked was not offered again. The running gags written to be asked again (a counted repeat here: Winnie's raccoon) were the exception, and they were written as such.
3. **The list unfolds from the answers.** A reply raises the next question, and the next question appears then, not before. The opening list is the questions a stranger would ask first.
4. **A topic waits for what the hero knows.** A question about something appears once he has heard of it.

The game already did 1, and did 3 only where a document wrote a follow-up (doc 07's ↳). It did not do 2: errata 57 kept an asked line on the list, greyed, with a second answer (doc 04 rule 4, errata 171 and 174's "asked again"). Tyler's ruling supersedes that. Doc 99's second answers stay in the documents as written; the game no longer reaches them, except where this document keeps a line on purpose.

## The rule

Every `TOPIC` and `COMIC` option that would stay on the list after it is asked (`retain`, or no aftermath written) is `remove`: asked once, and gone. Kept as they are:

- an option that ends the conversation (a tree must always be leavable, errata 57);
- `counted-repeat`, `rephrase` and `replace` options, which were written to come back;
- `PROGRESS`, `ASSAY` and `EXIT` options, which author their own aftermath;
- the letters home (`LETTERS_HOME`), which is not a conversation, and the engine's test harness (`harness_tree`);
- any option this document names under a tree with **stays**.

## The trees

Each tree below lists what changes in it. The forms are:

- `` `option` waits for `other` `` — offered only once `other` has been asked in the same node (its answer raises it); `` `option` in `NODE` `` names it in one node only, where a tree reuses ids;
- `` `option` waits for `FLAG` `` — offered only once `FLAG` is true (what Thad knows);
- `` `option` stays `` — kept on the list after it is asked, with its written second answer;
- `` `option` goes `` — gone once asked, though its tag would otherwise keep it;
- `` new `option` in `node` (TAG), waits for `other`: "Thad's line" → "Reply." / Thad: "…" / "…" `` — a line written here, one voice. A `/` starts the next speech; `Thad:` marks his.

### STAGE_DRIVER

The first conversation in the game teaches the list: each question goes as it is answered, and the way out arrives when all three have been (doc 17).

- `drv1` goes
- `drv2` goes

### amb_map_seller

Opens on where the maps come from, Pike, and whether they work. The accounts wait for "From the accounts"; digging waits for "They've not been *disproved*", which is what raises it.

- `map_seller3` waits for `map_seller6`

### amb_letter_writer

Opens on his rate, Pike, and Thad's own letters. "Going well?" already waits for the rate; the truth waits for "Bad weeks are my living", which is the question it raises.

- `letter_writer3` waits for `letter_writer2`

### amb_message_boy

"Everything. Pick a bit." is the answer that invites "Tell me something."

- `message_boy2` waits for `message_boy1`

### amb_man_leaving_tomorrow

The bag is noticed once he has said "Tomorrow."

- `leaving2` waits for `leaving1`

### amb_boundary_men

Whether there is gold is asked once he knows what they are arguing about.

- `boundary2` waits for `boundary1`

### amb_barber

The instruments are asked about once he has listed what they are for. The shave keeps the second answer errata 183 wrote for it.

- `barber2` waits for `barber1`
- `barber3` stays

### amb_bell_ringer

He offers to show where to strike it once he has told the man it is flat.

- `bell_ringer2` waits for `bell_ringer1`

### amb_boarding_women

The joke keeps the second answer errata 183 wrote for it.

- `boarding3` stays

### amb_photographer

"That's Obadiah Mott." answers "Nobody." The joke keeps the second answer errata 183 wrote for it.

- `photographer2` waits for `photographer1`
- `photographer3` stays

### amb_dogs_owner

He can only be told about the dog once he has said he is looking for one.

- `dogs_owner4` waits for `dogs_owner1`

### amb_fiddler

"The piano is flat" answers "I'm tuned to the piano", and the offer to fix it needs something to fix.

- `fiddler2` waits for `fiddler1`
- `fiddler5` waits for `fiddler1`

### amb_one_strike_man

When, and since, follow the story.

- `one_strike2` waits for `one_strike1`
- `one_strike5` waits for `one_strike2`

### LIVERY_MAN

"Why 'Grievance'?" is asked once he has said her name.

- `livery_man2` waits for `livery_man1`

### OZYMANDIA

Whether the rod ever fails, and whether she ever hears anything, follow how it works. Gold on his claim waits until he has a claim.

- `ozymandia3` waits for `ozymandia2`
- `ozymandia4` waits for `ozymandia2`
- `ozymandia6` waits for `T_SWINDLED`

### FANSHAWE

In FAN_B1, the regiment follows how a man comes to be a colonel. (The price of the favour stays open: the favour is in his greeting, and asking for the note takes the conversation elsewhere.)

- `fanshawe5` in `FAN_B1` waits for `fanshawe4`

### DEACON

"Why do they call you the Deacon?" follows his name.

- `gulch_deacon3` waits for `gulch_deacon1`

### LOOKOUT

What would convince him follows "That's what a claim jumper says"; how rich he is follows "Is he rich? Then he's a jumper too."

- `gulch_lookout3` waits for `gulch_lookout1`
- `gulch_lookout6` waits for `gulch_lookout2`

### MAN_UPSTREAM

Sharing follows whose ground it is, and so does measuring it.

- `gulch_man_upstream3` waits for `gulch_man_upstream2`
- `gulch_man_upstream5` waits for `gulch_man_upstream2`

### RULE_KEEPER

The plank, and arithmetic, follow "What rules?"

- `gulch_rule_keeper2` waits for `gulch_rule_keeper1`
- `gulch_rule_keeper6` waits for `gulch_rule_keeper1`

### SEANCE

"Woooo." is the séance's running gag: the wind, then the persistent wind (doc 111).

- `seance1` stays

## The keepers

*Tyler, 2026-11-11, shown what the rule cost ("give me an example of what we're losing") and offered the second answers that are a joke rather than a restatement: "Yes."* Monkey Island kept a question on the list where asking it again was the joke. These are the ones here that are: the second answer pays for the second ask, and most say so ("Asking twice is a dollar", "You've asked twice now"). A restatement ("Still not been disproved") stays gone. Not kept, whatever the line: the stage driver (the first conversation teaches the list), Fanshawe's dinner (its count of deferred pitches is the scene), and a list that is a puzzle's choice.

### amb_bell_ringer

- `bell_ringer5` stays — "Ask me after the noon bell. I won't hear you. That's also the qualification."

### amb_boundary_men

- `boundary5` stays — "You've asked twice now. He'll call that evidence."

### amb_card_sharp

- `card_sharp6` stays — "Good enough not to play you. You'd lose, and I'd feel it."

### amb_fiddler

- `fiddler5` stays — "Still no. In tune, I'd be playing on my own."

### amb_letter_writer

- `letter_writer6` stays — "So you keep saying."

### amb_man_leaving_tomorrow

- `leaving5` stays — "Tomorrow. I've told you. It's the one place I'm sure of."

### amb_message_boy

- `message_boy6` stays — "A penny and I'll go. I'll come straight back, but I'll go."

### amb_one_strike_man

- `one_strike1` stays — "Again? …Bless you. Nobody asks twice."

### amb_pie_woman

- `pie_woman1` stays — "Still pie. It's been pie all day."

### UNDERTAKER

- `undertaker4` stays — "Keep it. Paper's dear out here."
- `undertaker7` stays — "That's how this town says it. It sends you to me."
- `undertaker_c3` stays — "Roomy's extra. Nobody's ever come back for that either."

### OZYMANDIA

- `ozymandia2` stays — "Asking twice is a dollar."
- `ozymandia3` stays — "I am adding the question to your account."
- `ozymandia7` stays — "Free, and no atmosphere whatsoever."

### FRAME

- `frame3` in `FRA_A1` stays — "I'd lend it to you, but then you'd have it."
- `frame2` in `FRA_A1` stays — "It keeps coming back to me. Some of it for the first time."

### FANSHAWE

- `fanshawe3` in `FAN_B1` stays — "Eleven minutes, every day, without fail."
- `fanshawe4` in `FAN_B2` stays — "Newer still. I had them reupholstered while you were looking."
- `fanshawe5` in `FAN_C1` stays — "I shall have to name something after you."

### SUMP

- `sump2` in `SUM_B1` stays — "Section nineteen has not changed since you asked. It is not that kind of section."
- `sump3` in `SUM_C1` stays — "You are the first. I have made a note of it for the next printing."
- `sump3` in `SUM_E1` stays — "No form in advance. I have checked again. I find it a serious gap."

### WINNIE

- `winnie4` in `WIN_B2` stays — "Still offended. I'll tell you when it stops. It won't."
- `winnie2` in `WIN_B4` stays — "Certified worthless. Asking twice won't lower it."
- `winnie4` in `WIN_B4` stays — "I have told you this twice now. I'm keeping count."

### SOWERBY

- `sowerby6` in `SOW_A1` stays — "I pray for one daily, in general terms."

### SHENG

- `sheng5` in `SHE_D1` stays — "Nobody believes me, which is also restful."

### HOTEL_CLERK

- `hotel_clerk5` stays — "The road, as given. It keeps no register, which is its only appeal."

### PANNER

- `gulch_panner5` stays — "Still no. You're consistent. I like that in a beggar."

### RULE_KEEPER

- `gulch_rule_keeper7` stays — "That one's called 'The Strike'. It's the same as the other one."

### LOOKOUT

- `gulch_lookout7` stays — "Still thinking. That's the first honest offer I've had all year."

### SEANCE

- `seance2` in `SEA_E1` stays — "He said that already. Still good."
