# THE LAST CLAIM IN CONSOLATION
## 133 · Rulings from the playthrough (errata 317)

*Tyler, 2026-11-14, playing the full build. Each section is one thing he found or asked, what he ruled, and the lines it needed. New lines are his request in each case; the prose of each is the writer's, in the person's voice (doc 99).*

---

## THE STREET BEFORE THE DOORS

*Tyler: "I feel like maybe Thad shouldnt be able to go into any of the buildings on Main Street until he's talked to all three characters on the street? Especially if they give him exposition info? Like maybe if someone tries to open a door Thad says, I should see what I can learn from the people out here before I start poking around (don't treat that as exact dialogue though)."*

Doc 131's three voices on Main Street (the map seller, the pie woman, the man leaving tomorrow) each say what the town is from their own angle. Until Thad has asked each of them the question that is theirs ("Who's Mott?", "Is there money to be made in Consolation?", "I've only just arrived."), the street's doors refuse him with this line. The ways on to other streets (Lower Street, the lane) are not doors and stay open. It holds only until the swindle (`T_SWINDLED`): a man who has already been swindled in the Nugget has been through a door.

*Errata 339: the Act I review found a player who had talked to all three, with other questions, refused by one line that never said who was left. Any question put to the pie woman or the man with the bag now counts (the map seller's is still "Who's Mott?", since the town's other questions lean on his answer), and the refusal names whoever is left.*

**THE DOORS, THE MAP SELLER UNHEARD** *(WALK TO, OPEN or USE)* — "Not yet. I'd like to know what this town is digging for first, and the man selling maps is the one to ask."

**THE DOORS, THE PIE WOMAN UNHEARD** *(WALK TO, OPEN or USE)* — "Not yet. I haven't had a word with the pie woman, and she looks like she knows where the money goes."

**THE DOORS, THE MAN WITH THE BAG UNHEARD** *(WALK TO, OPEN or USE)* — "Not yet. I haven't had a word with the man with the bag. He's been here longer than I have."

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
- `company_ledger` *(until `T_LEDGER_CRACKED`)* — "It shuts again the moment I take my hand away, as a book will that has never had company. A spine wants weight on it before it learns to stay open."
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

## THE SIDE SHE FACES

*Tyler, with a screenshot: "Thad stands to the right of the pie lady when he talks to her but she's looking left." Errata 321.*

A conversation stands in front of the face (errata 304). That rule held only for a figure that said which way it faced. Now every talker says it, judged by eye from the figure as drawn:
- **Turned left:** the pie woman, the dog's owner, Hob, Pratt, the man leaving tomorrow, both boarders, the second boundary man.
- **Turned right:** the first boundary man, the message boy, Fanshawe at the duel.
- **Every other talker:** front, which leaves the side to the way Thad comes.

The pie woman and the dog's owner were the two talked to from behind. Both are moved.

## THADDEUS GRUBB, TO THE PIE WOMAN

*Tyler: "'Grubb. Pianos. You may have heard.' -- such a random line. Fix it."*

The pie woman's `[COMIC]` row is Thad introducing himself, as a man of reputation, to a woman who sells nickel pies. Its three fragments read as nothing. Now: "Thaddeus Grubb. Pianos are my profession. You may have heard the name." Her answer is unchanged: "I haven't." *(beat)* "Still a nickel." It is not doc 27's "I'm Thaddeus Grubb. You'll have heard of me.", which another conversation already uses.

## THE WAYS BACK DOWN

*Tyler: "Once you go into the Road to the Claims room, is there a way out? I couldn't figure it out and could only leave via the map." Errata 322.*

Six rooms out past town had their way back in a strip of scrub at the left edge, with nothing drawn to say "path": the Road to the Claims, Claim Row, the creek, Mott's site, the high ridge and Pratt's claim. Walking to the end of the floor and clicking there now leaves, in all six.

## FOUR DOLLARS, SPENT

*Tyler: "If thad buys the deed before getting a room, does that mean he no longer has money for a room?" Errata 322.*

The room was never for sale to Thad: the clerk trades it for the piano. The only thing wrong was the clerk's menu, which still had Thad offering four dollars he had given Deke. After the swindle he offers what he has:

**HOTEL CLERK** · option 3, *after A3* — "I have nothing. Could nothing be persuaded?" → "Then you have nothing and no room. Those are compatible."

## THE MERCANTILE'S DOORS

*Tyler: "There's a weird background sfx in the mercantile that doesn't seem to match anything seen in the store. Also the way things look from inside the mercantile looking out, doesn't match what's actually outside." Errata 323.*

The sound was the batwings' hinge, looped every twelve seconds beside doors that do not move. Now they swing once, as he comes through them, as the Nugget's do. The view through them is to be repainted as the street really is (`reference/mercantile-doorway/brief.md`).

## THE COMPANY'S CLERK

*Tyler, told that the clerk at the Improvement Company's desk could not be clicked (pointing at him found Fanshawe's portrait behind him) and that no document had written him a line, chose: clickable, says little. Errata 323.*

He can be clicked; a click talks to him. His LOOK and LISTEN are doc 05's and doc 54's, his refusals doc 49's. Talked to, he will not help, and he sends Thad to the Colonel, in every act:

> **THE CLERK** · TALK TO — "Excuse me. Who would I speak to, about anything?" — **CLERK:** "The Colonel." — "And who would I speak to about speaking to the Colonel?" — **CLERK:** "The Colonel."

## THE NUGGET'S BARMAN

*Tyler: "Do we need a bartender in the Nugget?" Told that nobody stands behind the bar while three lines speak of a barman (he pays for the tuning, he watches Thad consider the bar, he keeps the lamps trimmed), he chose: add a barman. Errata 323.*

He stands behind the bar, polishing, and says nothing of his own. One image operation (`reference/nugget-barman/brief.md`).
## THE TOWN, ONE NIGHT AT A TIME

*Tyler: "As I'm starting to play more, I'm wondering if maybe the town is too open to start with too much to potentially do? Which may leave the player feeling a bit aimless? I liked in MI that sometimes you couldn't also figure out where to go or what to do until you could, but I want there to also be some narrative structure where it feels like a story is progressing vs feeling haphazard." Shown that about twenty-five places were open on Thad's first evening and about half had no part in Act I, he chose: open places as the story reaches them. Errata 324.*

Night one is the town: Main Street, Lower Street, the Lane, and their doors, and the road to the claims, which he can see from the street (errata 30c: the map never opens with fewer than two places). Everyone in town has something to say about Ezra Pike, which is Act I's first errand. The rest opens when the story gets there:
- **Mott's site**, once Sump has told him Prosperity borders it (A9).
- **The creek, Claim Row, Sheng's laundry, the high ridge, the boarding house, the bakehouse and the schoolhouse**, from Act II. Until then they are not on the map.

**A new drawing** (Tyler, 2026-11-14: "Can we get a good, new bartender?"). The first barman was too sharp, too bright and too white, and squeezing his numbers to Thad's in the cut made him flat and grey (errata 325; Tyler: "This looks awful"). Nothing of him was shipped. `reference/nugget-barman/brief.md` is now the second brief: the drinkers he stands among are the style reference, his colours are theirs, the cloth is in his hand in every frame, and nothing is regraded in the cut. A miss is a second operation, shown the side-by-side.

**Drawn again** (errata 326): one new drawing and one correction, in the drinkers' colours. He polishes and looks along the bar, and Tyler sees him before he goes in.

### THE PIANIST

*Tyler, 2026-11-15: "TALK TO THE PIANIST has the tiniest little sliver of an interactable area. It needs to be much bigger so that a player knows they can actually interact with him." He stood inside the piano's hotspot, so only the edge of him outside it answered, and nothing was written for him to answer with. Now he answers wherever he is drawn in front of the piano (errata 330), with lines of his own. He still says nothing: he plays.*

**LOOK** 1 "The man at the piano plays with tremendous confidence. The piano plays back with none." · 2 "A glass on the lid and a song in his head. Only the glass is going down well." · 3 "He hit a wrong note, looked at it, and hit it again, harder. I admire the conviction. I wince at the rest."
**LISTEN** 1 "Every key, played with feeling. Several of the feelings are wrong." · 2 "He hums along, a shade off his own piano. Between the two of them they cover most of the notes." · 3 "A chord with an extra finger in it. Possibly two."

**THE TRIES**
- TALK TO — "I said hello. He answered on the piano, at length, in a key I can't place."
- PICK UP — "He and that stool are held together by music. I wouldn't come between them."
- PUSH — "Push a man mid-song? He'd only go on playing from the floor."

## THE PIE WOMAN'S TASTE

*Tyler: "The insult Thad gives, and then corrects, with the pie lady still doesn't land well. He's just arrived in town, he doesn't actually try a pie, and he's ready to insult them? If she lets him sample it first, maybe? But then I think we'd have to create more animations." Errata 329.*

No new drawing: she already has a frame holding a pie out. Thad asks to try a little first. She holds out a pie ("Corner's free. Go on.") and asks "Well?", and only then can he give his verdict, and catch himself. Her two identical answers are now two: "Course you will." for "I'll take a pie.", and "Pie'll be here. So will you." for the goodbye.

## THE ACT ONE REVIEW: LINES THAT WAIT FOR THEIR MOMENT

*Errata 336 (Tyler, 2026-11-15, approved). The review team found lines true only after an event the player may not have reached. Each of these is said in the state named, and the line it stands in for is said after.*

**THE REGISTER** · *the hotel lobby, before he has given his name*
- LOOK — "A register, open, with a pen beside it. Forty-one names, and none of them mine yet."

**THE MUD** · *Prosperity, before the deed is filed*
- USE — "I am using it. I'm standing in it. That's most of what it offers."

**THE PIANO** · *the Nugget, tuned this visit*
- LISTEN — "C-sharp, where it belongs. Nobody's noticed that either."

## THE ACT ONE REVIEW: A LOOK FOR EVERYBODY

*Errata 344 (Tyler, 2026-11-15, approved). The playtester found that LOOK AT on nearly everyone in Act I answered with the one line written for a person nobody had written for. Each of these is what the figure is drawn doing, and is said where the figure first stands.*

**THE PIE WOMAN**
- LOOK — "A woman with a basket of pies and the look of somebody who has never once been haggled down."

**THE MAP SELLER**
- LOOK — "A man holding up a map the way a watchman holds up a lantern. He has a pencil behind his ear, in case the gold moves."

**THE MAN LEAVING TOMORROW**
- LOOK — "Hands in his pockets, a bag at his feet. He looks like a man waiting for a coach, and the bag looks like it's heard that before."

**HOB**
- LOOK — "An old man with a lantern, looking at the gap between two buildings as if it owed him money."

**THE DOG'S OWNER**
- LOOK — "A man with a coiled leash and nothing on the end of it. He keeps looking up the alley."

**THE LETTER-WRITER**
- LOOK — "A man in a bowler with a writing case under his arm. He looks like he charges by the word and thinks in long ones."

**THE BELL-RINGER**
- LOOK — "A man standing under a bell with a mallet. I've rarely seen anyone so plainly between jobs."

**THE MESSAGE BOY**
- LOOK — "A boy with a note in one hand and a penny in the other. He's weighing which to deliver."

**THE CARD SHARP**
- LOOK — "He holds his cards closer than his drink. His drink I could reach."

**THE FIDDLER**
- LOOK — "A fiddler, keeping time with a piano that isn't keeping time with anything. I admire the loyalty."

**THE ONE-STRIKE MAN**
- LOOK — "A man who was right once, loudly, and has been dining on it since."

**THE MEN AT THE BAR**
- LOOK — "Men at a bar, facing the bottles. Whatever they came to forget, they're being thorough."
- TALK TO — "I said good evening to the row of them. One nodded. I'm counting it."

**COLONEL FANSHAWE**
- LOOK — "A silver gentleman with his hands on his waistcoat. He looks delighted to see me. He looked delighted before I came in."

**THE COMPANY'S CLERK**
- LOOK — "A clerk with both hands flat on a bare desk, guarding it."

**IGNATIUS FRAME**
- LOOK — "A tall man with a notebook. The pencil over his ear has never rested there long."

**REGISTRAR SUMP**
- LOOK — "A man behind a ledger, in spectacles. He hasn't looked up. I don't think the ledger has finished with him."

**WINNIE LEDGER**
- LOOK — "A woman writing, in a hand I can tell is neat from here. She hasn't looked up either, but hers feels like a decision."

**THE LIVERY MAN**
- LOOK — "Tipped back in a chair with his hat over his eyes. He's either asleep or the most relaxed man in the territory. There may be no difference."

**MADAME OZYMANDIA**
- LOOK — "Fingertips at her temples, eyes closed. Either the spirits are speaking or she has a headache. I'd charge for both."

**NICKEL PRATT**
- LOOK — "A man leaning on a rake, checking the sky between strokes, as though the weather might be up to something."

**THE BOUNDARY MAN**
- LOOK — "Arms folded. He's standing exactly on what he believes is the line."

**THE OTHER BOUNDARY MAN**
- LOOK — "Hands on his hips. He's standing exactly on what he believes is the line, a foot to the left."
## THE ACT ONE REVIEW: TRUE WHEN SAID

*Errata 342 (Tyler, 2026-11-15, approved). Two lines that are true in one state and not the other. Each is said in the state named; the line it stands beside is said in the other.*

**THE ROAD TO THE CLAIMS** · *Main Street, once the deed is his*
- LOOK — "Somewhere down there is forty feet of mud, and I'm the man fool enough to have bought it."

**THE LETTER** · *used on anything, before he knows Mr. Pike is dead (doc 24's pool line is said after)*
> *(until `T_PIKE_DEAD`)* "It's sealed, and it's addressed to Mr. Pike. I'm not opening it for this."

## THE ACT ONE REVIEW: CLAIM ONE, KEPT BACK

*Errata 340 (Tyler, 2026-11-15, approved). The act turns on Sump reading out that Prosperity lies beside Claim One, and the review found three places that told the player first: the Colonel's map wall, the survey map, and the Registrar's ledger. Before the deed is filed the map wall says this; the survey map's Claim One and the ledger's second and third looks wait for the filing.*

**THE MAP WALL** · *the Colonel's office, before the deed is filed*
- LOOK — "Every claim in the district, pinned. Green pins for the Company, a great many. There's one red pin, and it isn't in the map. It's stuck in the frame."

## THE ACT ONE REVIEW: THE RACCOON

*Errata 340 (Tyler, 2026-11-15, approved). The review found the raccoon was never given a reason to matter: nothing said the hole was worth having. Said the first time Thad looks at the hole with the raccoon in it; the hole's own lines follow as they were.*

**THE HOLE** · *Prosperity, the first look, with the raccoon in it*
- LOOK — "A hole, on my claim, and something in it. If there's gold under this mud, that's the way down. And it's occupied."

## THE ACT ONE REVIEW: ARRIVING AT PROSPERITY

*Errata 339 (Tyler, 2026-11-15, approved). The review found the feeling in Act I sat in optional clicks: on the required path Thad said nothing on first seeing the mud he gave his father's watch for. Said once, the first time he walks onto the claim.*

**ARRIVING** · *the first time on Prosperity*
> "Forty feet of mud, a stake, and a hole. I gave my father's watch for this."
> "It's mine, though. Every wet inch."


## THE ACTS TWO TO FOUR REVIEW: THE NEXT THING IS SAID

*Errata 352. The reviewers found places where the player had done what was asked and nothing said what came next, or where the right try was refused without a reason. Each line below is said in a state the player is already in, and says what stands in the way, never the action that removes it (doc 94's rules).*

**NICKEL PRATT** · *on the claim*
- LOOK, *at first* — "Mr. Pratt, on my claim, beside a stake that is newer than mine and better driven."
- LOOK, *once he has said he is paid* — "A man paid two dollars a week to stand on forty feet of mud. Money that regular gets written down somewhere, and the one man in town who writes everything down keeps the laundry."

**THE SEALED ARCHIVE DOOR**
- OPEN, *dead on paper, with no executor* — "Locked. The statute lets in the executor of a dead man. I am the dead man. It is the other one I have not got."
- OPEN, *with an executor and no obituary* — "Locked. I have an executor and no obituary, and in this town nothing has happened until the Clarion has misspelled it."
- OPEN, *with both, and no burial* — "Locked. Dead on paper, dead in print, and not yet in the ground. Boot Hill is expecting me, and it would be rude to be late."

**THE STATUTE BOOK**
- OPEN, *once the strike is found* — "Section nineteen has a sub-section four. A neighbor holding a Certificate of Contiguity may file an amended location on behalf of an absent claimholder." "I hold a certificate that says I am a neighbor. I had taken it for a ticket to look at a page."

## THE ACTS TWO TO FOUR REVIEW: THE SOUND OF THINGS

*Errata 354. A room answers LISTEN with one bare "Nothing." at most (errata 343, settled by the Act I review); a silent thing gets a small real sound instead. Each line below replaces a bare "Nothing." at the click it names (the first answer is click 1, the first repeat click 2, and so on), and is true in every state the object is seen in. The room keeps its one "Nothing." where it has earned it. Three silences are designed and kept whole: the watchman's shack (doc 05: "the truest room in Consolation is the one that makes no sound"), Boot Hill's nineteen and claim row's markers (doc 08: "the same word, eleven times").*

- `archive` · `executors_ledger` · click 1 — "A dry tick from the binding as the shelf settles. Every name in it opened it once."
- `archive` · `dust` · click 1 — "A faint hiss where my sleeve brushes the shelf. The dust, putting itself back."
- `assay_records` · `register_of_assays` · click 2 — "My own breath on the open page, and nothing coming back off it. Nineteen names make a very small sound."
- `back_alley` · `ash_pile` · click 1 — "A soft collapse deep in the heap. It sits a little lower every time I look at it."
- `church` · `collection_plate` · click 2 — "Silence, while it hangs empty. It only speaks when somebody gives it something, which is a policy I respect."
- `church` · `window_glass` · click 2 — "A fly against the inside of the pane, trying to leave by the light."
- `church` · `pews` · click 2 — "A knot in the end of one pew, ticking as the wood dries out."
- `claims_registrar` · `ledger` · click 1 — "The ribbon marker, stirring in the draft from the street. It keeps today's page, and every page was today once."
- `claims_registrar` · `sumps_pen` · click 1 — "A nib, drying. It has the patient tick of a thing that will outlast everyone who signs with it."
- `claims_registrar` · `map_of_claims` · click 1 — "One pin, loose in its hole, rattling faintly. Somebody's claim, coming unstuck."
- `claims_registrar` · `bench` · click 1 — "The bench creaking under nobody. It seats nine, and it remembers every one of them."
- `claims_registrar` · `bench` · click 2 — "A slat, ticking now and then. Waiting, done in wood."
- `claims_registrar` · `counter` · click 1 — "Wood, worn hollow where a great many elbows have waited, giving back a little of the room."
- `company_lobby` · `testimonials` · click 1 — "Four frames, tapping the wall in the stove's draft, slightly out of step with each other."
- `company_lobby` · `subscription_book` · click 1 — "The pencil on its string, swinging against the stand. An invitation to every passer-by."
- `company_lobby` · `map_wall` · click 1 — "The cord behind one frame, creaking under a great deal of confidence."
- `company_vault` · `unsold_deeds` · click 1 — "Ribbon, under strain. Two hundred deeds, tied as if they might get away."
- `company_vault` · `original_subscription` · click 1 — "The paper crackles when the air moves past it. Boston paper. It has never liked the West."
- `company_vault` · `stock_portrait_boxes` · click 1 — "A box lid lifting a hair in the draft and setting down again, like a man clearing his throat."
- `company_vault` · `maps` · click 1 — "A map curling at one corner, flattening, and curling again. It cannot settle on a shape either."
- `creek` · `riffles` · click 2 — "Water, mostly. The gold, if there is any, is keeping its voice down."
- `empty_storefront` · `sign` · click 1 — "Wind running along the top edge of the board, a thin note it cannot hold."
- `funeral` · `headboard` · click 2 — "The board knocking against its stake whenever the wind pushes."
- `funeral` · `one_who_knows` · click 2 — "His hat brim, turning slowly in his hands. Round once, and again."
- `funeral` · `coffin` · click 2 — "The handles, knocking softly as somebody brushes past. They were extra."
- `laundry` · `collar_advertisement` · click 2 — "The paper ticking against the door each time the boilers knock."
- `laundry` · `ledger` · click 1 — "The iron, through the steam, setting down and lifting, and the book on the shelf giving a small jump each time."
- `laundry` · `chair` · click 2 — "The rush seat crackling as it cools by the door."
- `livery` · `board_of_names` · click 1 — "A loose card, tapping at its pin. Somebody's hire, still trying to leave."
- `livery` · `grievance_s_blanket` · click 2 — "Straw, sifting out of the weave, one stalk at a time."
- `mercantile` · `catalogue` · click 2 — "The binding groaning on the counter. Eleven hundred pages, and it carries every one of them personally."
- `mercantile` · `credit_ledger` · click 2 — "The cover easing open by itself, the way a book does when it is opened too often."
- `mercantile` · `shovels` · click 1 — "The blades, ringing very faintly when a wagon passes in the street."
- `motts_site` · `offerings` · click 1 — "Wind across the coins, a thin tin whisper, like change in a pocket a long way off."
- `motts_site` · `marker_stone` · click 1 — "A beetle, walking the groove of a letter. It takes the O very slowly."
- `motts_site` · `pits` · click 1 — "Wind dropping into the nearest pit and coming out of another, farther off."
- `nugget_back` · `judges_pencil` · click 2 — "Graphite, settling against the wood. It is sharpened for a verdict and waiting for one."
- `nugget_back` · `scoreboard` · click 2 — "The slate, knocking on its nail. It hangs a little crooked, and so, I would guess, do the standings."
- `ozymandias_tent` · `price_list` · click 2 — "Canvas breathing behind it. The tent moves; the prices don't."
- `ozymandias_tent` · `testimonial_board` · click 2 — "One letter rustling louder than the rest, as though it wants to be read first."
- `pratts_claim` · `tally_post` · click 1 — "Wind across the notches, a dry little rattle of days."
- `pratts_claim` · `tool_rack` · click 2 — "The pick, ticking against its peg. Even his tools wait their turn in order."
- `pratts_claim` · `tailings_pile` · click 2 — "A pebble rolling from the coarse side over to the fines and stopping there, out of place."
- `schoolhouse` · `desks` · click 1 — "New wood, ticking to itself. Still settling into being furniture."
- `thads_room` · `tuning_fork_case` · click 3 — "The hinge, which squeaks in no key at all. My father never tuned the hinges."
- `thads_room` · `his_mother_s_letters` · click 2 — "Paper, folded and refolded until the creases do most of the talking."
- `thads_room` · `coat_on_the_door` · click 1 — "The hook, complaining a little under the weight of it."
- `thads_room` · `coat_on_the_door` · click 2 — "Wool, brushing the door when the hallway draft gets under it."
- `thads_room` · `coat_on_the_door` · click 3 — "A button, tapping the wood. It has been loose for a year and declines to fall off."
- `thads_room` · `washstand` · click 3 — "The pitcher's lip, singing very faintly when somebody climbs the stairs."
- `thads_room` · `washstand` · click 4 — "The drip again, a beat behind where I'd put it."
- `thads_room` · `desk` · click 3 — "The short leg, rocking on the claim notice when I lean. The only claim in town that pushes back."
- `thads_room` · `bed` · click 2 — "The frame, creaking as the building settles round it."
- `thads_room` · `bed` · click 3 — "One spring, still letting go of the shape of somebody, slowly."
- `thads_room` · `door` · click 4 — "The key, turning a fraction in the lock by itself. It has its own ideas about security."
- `undertaker` · `teeth` · click 3 — "A faint click from the jar when the floor shifts. I am choosing to believe it's the lid."
- `undertaker` · `price_board` · click 2 — "The board, knocking on a loose nail. Commerce, rattling to be let in."
- `undertaker` · `price_board` · click 3 — "A crumb of chalk dropping from the bottom figure. The total gets lighter by the hour, and never light enough."
- `undertaker` · `price_board` · click 4 — "Nothing it has not already said in chalk."
- `undertaker` · `tools` · click 1 — "The saw, ringing faintly on its hook when the floor takes a step."
- `undertaker` · `tools` · click 2 — "The plane's blade ticking against the wall. Sharp things settle louder."
- `undertaker` · `good_suit` · click 2 — "The hanger turning a quarter-inch on its peg, as if the suit had heard its name."
- `undertaker` · `good_suit` · click 3 — "Moths, perhaps. Or the wool, sighing at the prospect of another viewing."
- `undertaker` · `good_suit` · click 4 — "It has heard every word said in this room and repeats none of them. A professional."
- `undertaker` · `ledger_of_accounts` · click 2 — "The ribbon marker slipping a page further on. More of Boot Hill, owing."
- `undertaker` · `ledger_of_accounts` · click 3 — "The cover creaking under its own weight. It is heaviest at the back, where the debts are."
- `undertaker` · `ledger_of_accounts` · click 4 — "A long, slow book of patience. You can almost hear him not asking."
- `undertaker` · `waiting_bench` · click 1 — "The cushion, sighing out the last of somebody's waiting."
- `undertaker` · `waiting_bench` · click 2 — "A slat, ticking. It has been sat on by people who did not want to be here, and it has learned patience from them."
- `undertaker` · `viewing_table` · click 2 — "The oak, ticking dry after its last scrubbing."
- `undertaker` · `viewing_table` · click 3 — "A drop of water somewhere underneath, finding the floor at its leisure."
- `undertaker` · `viewing_table` · click 4 — "The legs, creaking as I lean near. It takes weight seriously."
- `undertaker` · `coffins` · click 3 — "A trestle shifting under the pine. The coffins are steadier than the furniture."
- `undertaker` · `back_to_street` · click 2 — "A wagon, passing the door without slowing. Nobody slows for this door."
- `undertaker` · `back_to_street` · click 3 — "The latch lifting a little in the wind, and thinking better of it."

## THE ACTS TWO TO FOUR REVIEW: A LOOK FOR EVERYBODY

*Errata 354. The rest of the cast who answered LOOK AT with the line written for nobody ("A person! I've decided to be polite about it."), in Acts II to IV and the Lane, each in the place they stand.*

**AH-LAM SHENG** · *at his ironing board*
- LOOK — "Mr. Sheng, ironing. He presses a collar as if signing a contract: once, and meaning it."

**REVEREND SOWERBY** · *with the pencil*
- LOOK — "The Reverend Sowerby, holding the pencil. He keeps the score the way he keeps a funeral, by the word, and the words are not cheap."

**THE JUDGES** · *the first*
- LOOK — "A judge of the Assay, sitting where the lamp can't reach him. I suspect that's in the rules."

**THE JUDGES** · *the second*
- LOOK — "The middle judge. He has not blinked once while I've stood here, which is either judicial or taxidermy."

**THE JUDGES** · *the third*
- LOOK — "The third judge, at the dark end of the table, writing nothing down and remembering all of it."

**IGNATIUS FRAME** · *stood back from his press*
- LOOK — "Mr. Frame, arms folded, stood back from his own press. A newspaperman letting somebody else make the news. It does not suit him."

**NICKEL PRATT** · *at the Registrar's counter*
- LOOK — "Mr. Pratt, at the counter with his mallet, waiting his turn to swear. He has never met a queue he couldn't outstand."

**WINNIE LEDGER** · *at the loose board*
- LOOK — "Winnie, out from behind her counter and down at the floor. In all my visits it's the first I've seen of her below the window."

**WINNIE LEDGER** · *at the filing*
- LOOK — "Winnie, at the end of Sump's counter, arms folded. She has come to sign something true, and she would like it done before anyone argues."
- TALK TO — "Not now, Mr. Grubb. I came to sign one thing, and I'd like to do it before I think better of it."

**THE UNDERTAKER** · *at the coffin*
- LOOK — "The undertaker, at my coffin. He is the only man here who knows how full it will be, and he is keeping it professional."

**MADAME OZYMANDIA** · *on Prosperity*
- LOOK — "Madame Ozymandia, on my claim, holding the rod and saying nothing. I've paid two dollars for less."

**COLONEL FANSHAWE** · *in the street*
- LOOK — "The Colonel, out in the open street with the town behind him, looking like a man who has already had the portrait done."

**REVEREND SOWERBY** · *on the porch*
- LOOK — "The Reverend on the porch, holding the pencil out here exactly as he holds it indoors, as if the street had a lamp over it."

**THE BALD JUDGE**
- LOOK — "A judge, out of the back room and into the street. He stands like a man who has never been seen below the knees."

**THE GAUNT JUDGE**
- LOOK — "The gaunt judge. In the open air he looks exactly as he did in the dark, which I find unsettling."

**THE BEARDED JUDGE**
- LOOK — "The bearded judge, as solemn on a porch as at a table. He has brought the back room with him in his face."

**THE TOWN** · *at the saloon end*
- LOOK — "Half of Consolation, at the saloon end, ready to be on whichever side wins."

**THE TOWN** · *at the road end*
- LOOK — "The rest of Consolation, at the road end. They have the better view and the shorter walk home."

**THE BARBER-DENTIST-SURGEON**
- LOOK — "The barber, who is also the dentist, who is also the surgeon. One chair, one set of instruments, and a great deal of confidence."

**THE PHOTOGRAPHER**
- LOOK — "The photographer, beside his camera, standing as close as he can to the one thing in the room he trusts."

**THE BOARDING HOUSE WOMAN**
- LOOK — "One of the two women who keep the boarding house. She regards the gold rush as weather, and has dressed for it."

**THE OTHER BOARDING HOUSE WOMAN**
- LOOK — "The other proprietress. Between them they run the one business in Consolation that has never once gone looking for gold."

**GRIEVANCE** · *out of her stall*
- LOOK — "Grievance, stepping out of her stall as if she'd only been waiting for somebody to get the note right."

**GRIEVANCE** · *at the washout*
- LOOK — "Grievance, on the one patch of grass for a mile, eating it slowly so it lasts."


## THE ACTS TWO TO FOUR REVIEW: AN ITEM BEFORE IT IS FINISHED

*Errata 355. A LOOK said first while the flag named is unset; the item's own lines follow once it is set.*

- `executor_form` *(until `T_HOB_SIGNED`)* — "Form 31-E, Appointment of Executor. Blank where the executor signs. Mr. Sump wants somebody with no interest in any claim in this town, which in Consolation narrows it to nearly nobody." · "A space for a signature, and beside it, in Mr. Sump's hand, the word EXECUTOR, underlined once." · "The rest is filled in: my name, and DECEASED. All it lacks is a man who wants nothing from me."
