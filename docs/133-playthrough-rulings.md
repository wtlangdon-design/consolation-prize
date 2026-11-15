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
