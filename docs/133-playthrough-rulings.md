# THE LAST CLAIM IN CONSOLATION
## 133 · Rulings from the playthrough (errata 317)

*Tyler, 2026-11-14, playing the full build. Each section is one thing he found or asked, what he ruled, and the lines it needed. New lines are his request in each case; the prose of each is the writer's, in the person's voice (doc 99).*

---

## THE STREET BEFORE THE DOORS

*Tyler: "I feel like maybe Thad shouldnt be able to go into any of the buildings on Main Street until he's talked to all three characters on the street? Especially if they give him exposition info? Like maybe if someone tries to open a door Thad says, I should see what I can learn from the people out here before I start poking around (don't treat that as exact dialogue though)."*

Doc 131's three voices on Main Street (the map seller, the pie woman, the man leaving tomorrow) each say what the town is from their own angle. Until Thad has asked each of them the question that is theirs ("Who's Mott?", "Is there money to be made in Consolation?", "I've only just arrived."), the street's doors refuse him with this line. The ways on to other streets (Lower Street, the lane) are not doors and stay open. It holds only until the swindle (`T_SWINDLED`): a man who has already been swindled in the Nugget has been through a door.

**THE DOORS** *(WALK TO, OPEN or USE, until he has heard all three)* — "Not yet. Before I go knocking on doors, I'd like to know what kind of town this is, and somebody out here is bound to tell me."

## THE RECORDS ROOM

*Tyler: "should Winnie allow me to walk back into the records room with her standing there? Especially when it's the first time I've met her?" Shown that the room has no puzzle, that she sleeps there, and that it shows the nineteen names before she has told him of them, he chose: shut until she trusts him.*

Until she has shown him the second ledger (`T_SECOND_LEDGER`, WIN_B2 option 3), her back door refuses him, in her voice. After that it opens.

**THE RECORDS ROOM DOOR** *(WALK TO, OPEN or USE, until the second ledger)* — **WINNIE:** "That door is for staff, Mr. Grubb. I am the staff."

## THE ASSAY BEFORE THE CLAIM

*Tyler: "Does Thad's conversation with Winnie about getting soil assayed make sense before he's purchased the claim from Deke? If not, he shouldn't be able to have that conversation with her until after he gets the claim from Deke."*

It does not: he has no soil until he owns a claim. WIN_A1 option 1 ("I'd like to have some soil assayed, please.") waits for `T_SWINDLED` (doc 04). Before that her node keeps her other questions. Nothing on the way to the claim needs the queue.

## A LINE SAID IS A LINE GREYED

*Tyler: "The 'What number am I?' dialogue line isn't fading out after it's said. It's remaining the brighter color for unspoken lines."*

Errata 57 kept every `counted-repeat` row at full weight. Now a counted-repeat greys once said, like every other row the player has asked; asked again, it still gives its next answer. The exception is errata 130 E's: a counted-repeat that is the way on (a PROGRESS or ASSAY row, as the rematch is) stays bright, because a greyed row reads "already asked".

## THE CLICK DOES THE THING'S OWN VERB

*Tyler: "Everything is currently 'Walk to' by default. Did you say in MI2 that certain objects had certain default actions so that everything wasn't 'Walk to'. Now that I'm playing through, having to click 'Look at' for a majority of the items is cumbersome." Offered Monkey Island 2's right button, with left still walking, he chose: "Left click does it."*

Errata 283's MI1 walk is withdrawn. With no verb chosen, a click on a thing performs its own verb, and the sentence line names that verb while the thing is hovered. For most things the verb is LOOK AT; for doors and ways out, the walk through; for people, TALK TO. The right button does the same. A chosen verb wins, and the ground is walked.

## THE PIANO IN THE NUGGET

*Tyler: "Is the piano self playing? Should we make it so that Thad has to actually sit down and play it? Or establish that it's self playing?"* The Nugget's music has a piano in it and nobody at the piano. A player piano is an 1890s invention. Offered a pianist, the piano taken out of the room's music, or the piano left as score, he chose: **"Add a bad pianist."**

A patron sits at the upright and plays badly, with confidence. The figure needs one image operation (`reference/nugget-pianist/brief.md`), drawn in the session with the image key. When he is wired, Thad's piano lines that say nobody plays it are rewritten to match, and the piano heard in the Nugget is his.

**Wired (the hand-back, `reference/nugget-pianist/handback.md`).** He sits on the stool at the upright, plays (his rest and his two playing frames), and now and then drinks from the glass on the lid. The piano's lines that said nobody touches it now say what is on the screen (doc 05; doc 16):
- LOOK 1: "… Nobody here can play it, and one man is proving it nightly. I could make it worth playing. I'd only need asking."
- LOOK 2: "He hasn't stopped playing since I came in. I count the wrong notes. I count more than is healthy."
- LOOK 3: "Bottle rings on the lid. Several. His glass is making another, and I am being very calm about it."

He stands within the piano's own hotspot, so a click on him is a click on the piano, and he says nothing of his own. The LISTEN lines (C-sharp flat) were always true of a piano somebody plays.

## WHAT OPENS

*Tyler, 2026-11-14, told that the sealed letter was not the only thing in his pocket that answered OPEN with a line written for scenery ("It doesn't open. Very little here does, but I live in hope."): "Do all 5." Errata 318.*

Each of these is a thing a player would naturally try to open, and opens. Each answers OPEN in its own terms, in Thad's voice, true in every act he carries it. Read by `tools/extract-content.mjs` into the item's file.

- `clarion` — "I've read it. Page one is about me, and I have read page one more than once."
- `company_ledger` — "Twelve months of figures, all agreeing with each other. I would only be interrupting."
- `company_map` — "Unrolled: the district, the roads, and Claim Two, circled. It is still circled. I check."
- `hymnal` — "Every hymn in it is pitched for a choir this town does not have. I have looked."
- `invitation` — "It is a card, engraved on one side. The other side is blank, which is the most honest thing about it."
- `obituary` — "I have read my own obituary. Once was moving. Twice would be vanity."
- `padded_log` — "I have read enough of it. One sample, under a great many names."
- `watch` — "It tells me the time, eleven minutes early. My father's idea of a kindness."
- `eggs` — "I opened it once, in the street. The street has not forgiven me."
- `tonic` — "Not indoors. Not near anyone I like."

## THE NUGGET'S BACK ROOM

*Tyler, 2026-11-14, asked whether the Nugget's back room should stay shut until there is a reason to go in: "You decide." Errata 318.*

The back room is where the town holds its Liar's Assay. In Act I nothing there is Thad's business, and on his first day in town it is somebody else's back room. From Act II it is the Assay's room, and the chalk Pratt's turn is written with lies in it. The trials run in any order (doc 02), so it may be needed before Vessel is back. So the door refuses him through Act I, once he has arrived by the road, and opens from Act II.

**THE BACK ROOM DOOR** *(WALK TO, OPEN or USE, in Act I)* — "Somebody's back room, on my first day in town. I'll wait to be asked."

## WHAT THAD MUST ALREADY KNOW

*Tyler: "Do all 5." The third was a read of every question that moves the story on (every PROGRESS row, act by act) for what Thad must already have, or have been told, for it to make sense. Errata 318.*

Two did not:
- **The livery man, "Could I borrow a blanket?"** It was offered before Thad had seen his claim, so he asked for a blanket for a raccoon he had never met. It now waits for `T_SEEN_PROSPERITY`, which arriving at Prosperity writes.
- **Pratt, "There's a raccoon in my hole. Would you get him out?"** The same gate.

The rest hold. The clerk's "Your piano is out of tune" stands: Thad has the ear, and the parlour piano's own LISTEN says every string answers a passing cart. The fifth item, a read for lines built to sound like sayings when no such saying exists (the driver's hat), found none.

## A TAP NAMES, A SECOND TAP DOES

*Tyler, 2026-11-14, testing on his phone: "Now when I click on an interactable item, it doesn't say what it is in the bottom menu. It just activates it." Errata 319.*

A finger has no hover, so the sentence line never got to say what a tap would do. Now, with no verb chosen and nothing held, the first tap on a thing or a person only names it ("Look at THE PORTRAIT"). The second tap on the same one does it. The ground and the ways out go at once, as a walk always has, and a chosen verb acts at once. With a mouse or a trackpad, nothing changes: pointing names a thing and one click does it. And with nothing under the pointer, the line now reads "Walk to", not "Look at".

## THE CLARION'S PHOTOGRAPH

*Tyler: "Thad talks about Mr. Sheng in the printing press room before visiting Sheng the first time."*

Doc 05's LOOK at the Clarion's photograph of Mott said he had seen it in Mr. Sheng's window, true only after the laundry. It now says only what the Clarion shows: "The only known likeness of Obadiah Mott. It has the look of a photograph that has done other work." The laundry's own collar advertisement makes the connection when he gets there. The line had also been cut in two after "Mr.", as "…in Mr." and "Sheng's window…". The compiler no longer cuts a line after a title.

## THE HORSES

*Tyler, told the horses at the rail were scenery because no document had written them a line: "I want them clickable." Errata 320.*

Room 2's `horses` hotspot is laid over the group; the figure still lets the pointer through to it. Variant 1 of LOOK and LISTEN is doc 05's, variants 2 and 3 and the refusals are doc 13's. At dawn the rail is empty and has no hotspot.

## THE SWITCH, ONCE

*Tyler: "I don't think I like the lines where Thad is about to say something sassy but catches himself mid sentence and says something nice instead. I could see him doing it once, but back and back in multiple conversations seems repetitive."*

Errata 293 put three on Main Street. The pie woman's stays ("Madam, that pie is a cr— a credit to the territory!"), because it is the cleanest. The other two are now said as the menu offers them, and answered:
- The man leaving tomorrow: "You're never leaving this town, are you?" → "Tomorrow."
- The map seller: "Your maps are a swindle, sir, and I'll tell the whole town so!" → "Tell them, sir! Every man in town owns one, and not one has asked for his money back."

Both keep their option ids (`tools/town-barks.json` `keepIds`), so saves and the walkthrough still find them.
