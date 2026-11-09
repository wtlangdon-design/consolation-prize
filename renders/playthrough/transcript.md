# The Last Claim in Consolation -- playthrough transcript

Played in the real build (Chromium, dev server) by `npm run gauntlet:full -- --record`, 2026-11-09, at commit 587a579e + this branch.
Every line the screen showed, in play order. `>` marks the player's action; option menus list every row offered, `[x]` the one picked, `(asked)` a row already chosen before. Directions are in parentheses as the game shows them; a direction marked *[acted, no words on screen]* is played by the figures and never printed (doc 95), and *[a silence is held]* is a written pause. Barks (remarks thrown in passing) and written sounds are marked.

> **open.1** -- NEW GAME -- the opening plays

## ACT I

### STAGE ROAD & COACH STOP

**STAGE DRIVER:** This is your stop, kid.
**THAD:** Already? I had hoped to see it coming.
**STAGE DRIVER:** I put your case over there.
**THAD:** In the mud?
**STAGE DRIVER:** Where else would I put it?
**THAD:** My name is Thaddeus Grubb. I have come to Consolation to make my fortune.
**STAGE DRIVER:** Course you have.
> **open.2** -- chooses
*Options (STAGE_DRIVER/root):*
- [x] Where can I find Ezra Pike?
- [ ] Where am I supposed to sleep?
- [ ] You don't think much of my chances.
**THAD:** Where can I find Ezra Pike?
**STAGE DRIVER:** Ask the undertaker. He knows everybody.
*Options (STAGE_DRIVER/root):*
- [ ] Where can I find Ezra Pike? (asked)
- [x] Where am I supposed to sleep?
- [ ] You don't think much of my chances.
**THAD:** Where am I supposed to sleep?
**STAGE DRIVER:** Hotel's five dollars.
**THAD:** I have four.
**STAGE DRIVER:** You've all got four.
*Options (STAGE_DRIVER/root):*
- [ ] Where can I find Ezra Pike? (asked)
- [ ] Where am I supposed to sleep? (asked)
- [x] You don't think much of my chances.
**THAD:** You don't think much of my chances.
**STAGE DRIVER:** I don't think about them at all.
*Options (STAGE_DRIVER/root):*
- [ ] Where can I find Ezra Pike? (asked)
- [ ] Where am I supposed to sleep? (asked)
- [ ] You don't think much of my chances. (asked)
- [x] Thank you for the ride.
**THAD:** Thank you for the ride.
**STAGE DRIVER:** Wasn't for you.

**[ PART ONE — In Which Our Hero Is Robbed, and Enjoys It ]**

> **open.3** -- LOOK AT THE WATCHMAN'S LAMP
**THAD:** A lamp, crossing the road, with a man behind it. He hasn't looked at me. I'm the newest thing on this road, and he hasn't looked.
**HOB:** Wouldn't stand there.
**THAD:** Why not?
**HOB:** No reason.
> **open.4** -- PICK UP HIS CASE
**THAD:** I have it.
> **open.5** -- WALK TO CONSOLATION
**THAD:** Well. Consolation. A fresh beginning.
**THAD:** I appear to be stuck.
**THAD:** Quite securely.
**THAD:** A firm welcome.

### MAIN STREET

**THAD:** So this is Consolation.
**THAD:** Half of it is two stories tall in front and one story deep.
**THAD:** The other half is real, and is doing better.
**THAD:** Now. Mr. Ezra Pike, and my father's letter.
**THAD:** The driver said ask the undertaker. An undertaker knows everybody, eventually.
> **A1.hob.1** -- goes to THE BACK ALLEY
> **A1.hob.2** -- TALK TO HOB

### THE BACK ALLEY

*Options (HOB/HOB_A1):*
- [ ] Good evening.
- [ ] Do you know anything about Claim One?
- [x] Did you know Obadiah Mott?
- [ ] How long have you been in Consolation?
- [ ] Do you ever sleep?
- [ ] I know where Mott's strike is.
- [ ] I should go.
**THAD:** Did you know Obadiah Mott?
HOB: *(He stops. Then:)*
**HOB:** No.
HOB: *(He does not walk on for four seconds.)*
*Options (HOB/HOB_A1):*
- [ ] Good evening.
- [ ] Do you know anything about Claim One?
- [ ] Did you know Obadiah Mott? (asked)
- [ ] How long have you been in Consolation?
- [ ] Do you ever sleep?
- [x] I know where Mott's strike is.
- [ ] I should go.
**THAD:** I know where Mott's strike is.
**HOB:** So does everybody. That's the town. Try again.
*Options (HOB/HOB_A1):*
- [ ] Good evening.
- [ ] Do you know anything about Claim One?
- [ ] Did you know Obadiah Mott? (asked)
- [ ] How long have you been in Consolation?
- [ ] Do you ever sleep?
- [ ] I know where Mott's strike is. (asked)
- [x] I should go.
**THAD:** I should go.
> **A1.1** -- goes to THE UNDERTAKER'S
*(bark)* **THE DOG'S OWNER:** You seen a dog?

### THE LANE

*(bark)* **THE MESSAGE BOY:** Message? Penny.
> **A1.2** -- TALK TO THE UNDERTAKER

### THE UNDERTAKER'S

**THE UNDERTAKER:** Yes.
*Options (UNDERTAKER/root):*
- [x] I'm looking for a man named Ezra Pike.
- [ ] Do you know everybody?
- [ ] Thank you.
**THAD:** I'm looking for a man named Ezra Pike.
**THE UNDERTAKER:** Eighteen fifty-two.
**THAD:** I'm sorry?
**THE UNDERTAKER:** Eighteen fifty-two. He's up the hill.
*Options (UNDERTAKER/root):*
- [ ] I'm looking for a man named Ezra Pike. (asked)
- [x] Up the hill?
- [ ] What did he die of?
- [ ] I had a letter for him.
- [ ] Do you know everybody?
- [ ] Thank you.
**THAD:** Up the hill?
**THE UNDERTAKER:** Boot Hill. Third row, second from the end. He's got a marker.
*Options (UNDERTAKER/root):*
- [ ] I'm looking for a man named Ezra Pike. (asked)
- [ ] Up the hill? (asked)
- [ ] What did he die of?
- [ ] I had a letter for him.
- [ ] Everybody in town sent me to you.
- [ ] Do you know everybody?
- [x] Thank you.
**THAD:** Thank you.
**THE UNDERTAKER:** Mm.
> **A1.3** -- goes to BOOT HILL
> **A2.1** -- goes to HOTEL LOBBY
> **A2.2** -- TALK TO THE HOTEL CLERK

### HOTEL LOBBY

**THE HOTEL CLERK:** Mr. Grubbe.
*Options (HOTEL_CLERK/root):*
- [ ] It's Grubb.
- [ ] Is this your hotel?
- [x] I'd like a room.
- [ ] I'll think about it.
**THAD:** I'd like a room.
**THE HOTEL CLERK:** Five dollars.
*Options (HOTEL_CLERK/root):*
- [ ] It's Grubb.
- [ ] Is this your hotel?
- [ ] I'd like a room. (asked)
- [x] I have four.
- [ ] Is there anything cheaper?
- [ ] I'll think about it.
**THAD:** I have four.
**THE HOTEL CLERK:** Then you have four dollars and no room. Those are compatible.
*Options (HOTEL_CLERK/root):*
- [ ] It's Grubb.
- [ ] Is this your hotel?
- [ ] I'd like a room. (asked)
- [ ] I have four. (asked)
- [x] Your piano is out of tune.
- [ ] Is there anything cheaper?
- [ ] I'll think about it.
**THAD:** Your piano is out of tune.
**THE HOTEL CLERK:** It is.
**THAD:** I could put it right.
**THE HOTEL CLERK:** For a room?
**THAD:** For a room.
**THE HOTEL CLERK:** Nineteen.
*Options (HOTEL_CLERK/root):*
- [ ] It's Grubb.
- [ ] Is this your hotel?
- [ ] I'd like a room. (asked)
- [ ] I have four. (asked)
- [ ] Your piano is out of tune. (asked)
- [ ] Is there anything cheaper?
- [x] I'll think about it.
**THAD:** I'll think about it.
**THE HOTEL CLERK:** Mr. Grubbe.
> **A2.3** -- LISTEN TO THE PARLOR PIANO
**THAD:** Nothing, until a cart goes by.
**THAD:** Then every string answers, and every one of them is wrong in its own direction.
> **A2.4** -- USE The tuning fork ON THE PARLOR PIANO
**THAD:** Four minutes. It is the first honest work done in this building in some time.
**THE HOTEL CLERK:** Top of the stairs, second door. The key sticks. You have to want it.
> **A3.1** -- goes to THE BOUNTIFUL NUGGET

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Pie.

### THE BOUNTIFUL NUGGET

**DEKE VESSEL:** You're the piano man.
> **A3.2** -- chooses
*Options (DEKE_VESSEL/root):*
- [ ] How did you know?
- [x] What are you selling?
- [ ] You knew Pike was dead.
- [ ] I'll think about it.
**THAD:** What are you selling?
**DEKE VESSEL:** Nothing. I'm getting out.
**DEKE VESSEL:** …
**DEKE VESSEL:** Which is a kind of selling, I suppose.
*Options (DEKE_VESSEL/root):*
- [ ] How did you know?
- [ ] What are you selling? (asked)
- [x] Getting out of what?
- [ ] You knew Pike was dead.
- [ ] I'll think about it.
**THAD:** Getting out of what?
**DEKE VESSEL:** Claim Two. A producing claim, mind you. It's never once stopped producing. But my sister's poorly, and Sacramento's four days.
*Options (DEKE_VESSEL/root):*
- [ ] How did you know?
- [ ] What are you selling? (asked)
- [ ] Getting out of what? (asked)
- [x] How much?
- [ ] Is there gold on it?
- [ ] You seem cheerful for a man with a poorly sister.
- [ ] You knew Pike was dead.
- [ ] I'll think about it.
**THAD:** How much?
**DEKE VESSEL:** What have you got?
**THAD:** Four dollars.
**DEKE VESSEL:** Four dollars.
*[acted, no words on screen]* DEKE VESSEL: *(He looks at the watch.)*
**DEKE VESSEL:** And that.
*Options (DEKE_VESSEL/root):*
- [ ] How did you know?
- [ ] What are you selling? (asked)
- [ ] Getting out of what? (asked)
- [ ] How much? (asked)
- [ ] Is there gold on it?
- [ ] You seem cheerful for a man with a poorly sister.
- [ ] You knew Pike was dead.
- [x] All right.
- [ ] I'll think about it.
**THAD:** All right.
**DEKE VESSEL:** Pleasure, son. Look after her. She's got character.
*[acted, no words on screen]* DEKE VESSEL: *(He finishes his drink, collects his hat, and leaves the Nugget.)*

### THE CLARION OFFICE

**IGNATIUS FRAME:** ‘Eastern gentleman buys Claim Two.’
**IGNATIUS FRAME:** ‘Is delighted.’
**IGNATIUS FRAME:** Grubb.
**IGNATIUS FRAME:** No. Grubb looks like a misprint.
**IGNATIUS FRAME:** Grubbs. Now it looks like a family.
**IGNATIUS FRAME:** ‘Mr. T. Grubbs of Providence.’ Front page. Within the hour.
> **A8.1** -- USE The tuning fork ON THE PIANO

### THE BOUNTIFUL NUGGET

**THAD:** Four minutes. C-sharp has come home, and nobody in this room has looked up.
**THAD:** The barman has paid me. Neither of us has mentioned it. It is the most professional transaction of my life.
> **A4.1** -- goes to FANSHAWE'S OFFICE
> **A4.2** -- TALK TO COLONEL FANSHAWE

### FANSHAWE'S OFFICE

**COLONEL FANSHAWE:** Mr. Grubb! Sit down, sit down. You've the look of a man who's been sold something.
**THAD:** I have been.
**COLONEL FANSHAWE:** Everyone here has. It's how we get our start. Which claim?
*Options (FANSHAWE/FAN_A1):*
- [x] Number two. Prosperity.
- [ ] I'd rather not say.
- [ ] Were you really a colonel?
- [ ] You have a great many chairs.
- [ ] Is there gold under Prosperity?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Number two. Prosperity.
**COLONEL FANSHAWE:** Prosperity! You've named it. Nobody names them. I like you enormously.
*Options (FANSHAWE/FAN_A1):*
- [ ] I'd rather not say.
- [ ] Were you really a colonel?
- [ ] You have a great many chairs.
- [ ] Is there gold under Prosperity?
- [x] I've taken enough of your time. I'll be taking more later.
**THAD:** I've taken enough of your time. I'll be taking more later.
> **A4.3** -- goes to THE ROAD TO THE CLAIMS
> **A5.1** -- goes to THE LIVERY STABLE
> **A5.2** -- TALK TO THE LIVERY MAN

### THE LIVERY STABLE

*Options (LIVERY_MAN/LIV_A1):*
- [ ] I need the mule for the diggings road.
- [ ] Why 'Grievance'?
- [ ] You knew Pike was dead.
- [ ] Is the mule all right?
- [x] Could I borrow a blanket?
- [ ] Has she ever moved for anybody?
- [ ] Have you ever been in the Liar's Assay?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** Could I borrow a blanket?
**THE LIVERY MAN:** Hers?
**THE LIVERY MAN:** She's not using it. Bring it back before she notices.
*Options (LIVERY_MAN/LIV_A1):*
- [ ] I need the mule for the diggings road.
- [ ] Why 'Grievance'?
- [ ] You knew Pike was dead.
- [ ] Is the mule all right?
- [ ] Has she ever moved for anybody?
- [ ] Have you ever been in the Liar's Assay?
- [x] I am going to leave now, in a dignified manner.
**THAD:** I am going to leave now, in a dignified manner.
> **A5.3** -- goes to PROSPERITY
> **A5.4** -- USE Grievance's blanket, on loan ON THE HOLE

### PROSPERITY

**THAD:** The blanket, over the mouth of the hole.
*[acted, no words on screen]* THAD: *(The cloth settles. A long pause. The raccoon emerges, gives Thad one look of complete contempt, and leaves at a walk.)*
**THAD:** The hole has gone cold, and he has gone with it. I appear to have evicted him by weather.
> **A6.1** -- goes to THE CLAIMS REGISTRAR

### LOWER STREET

*(bark)* **THE LETTER-WRITER:** I could make the raccoon sound better.
> **A6.2** -- TALK TO REGISTRAR SUMP

### THE CLAIMS REGISTRAR

*Options (SUMP/SUM_A1):*
- [x] I need to file this deed.
- [ ] The deed's drawn wrong side up.
- [ ] You knew Pike was dead.
- [ ] Is there a form for that?
- [ ] Thank you. This has been clarifying.
**THAD:** I need to file this deed.
**REGISTRAR SUMP:** Form 12-C requires a boundary by survey. Your deed says 'from the stake, thereabouts.'
**REGISTRAR SUMP:** Thereabouts is not a unit, Mr. Grubb. I have checked.
*Options (SUMP/SUM_A1):*
- [x] Where would I find a surveyor?
- [ ] The deed's drawn wrong side up.
- [ ] You knew Pike was dead.
- [ ] Is there a form for that?
- [ ] Thank you. This has been clarifying.
**THAD:** Where would I find a surveyor?
**REGISTRAR SUMP:** The territory licenses surveyors. Consolation has none. The statute accepts a boundary 'attested in good form by any person holding a trade license from this office.'
**REGISTRAR SUMP:** I have issued one license this year. It was to a diviner.
*Options (SUMP/SUM_A1):*
- [ ] The deed's drawn wrong side up.
- [ ] You knew Pike was dead.
- [ ] Is there a form for that?
- [x] Thank you. This has been clarifying.
**THAD:** Thank you. This has been clarifying.
> **A7.1** -- goes to MADAME OZYMANDIA'S TENT

### LOWER STREET

*(bark)* **THE BELL-RINGER:** Raccoon.
> **A7.2** -- TALK TO MADAME OZYMANDIA

### MADAME OZYMANDIA'S TENT

**MADAME OZYMANDIA:** The rod has been expecting you.
*Options (OZYMANDIA/OZY_A1):*
- [x] I need a boundary divined.
- [ ] How does the rod work?
- [ ] Could the rod find gold on my claim?
- [ ] You knew Pike was dead.
- [ ] Does it ever not work?
- [ ] Do you ever hear anything?
- [ ] Have you ever been in the Liar's Assay, Madame?
- [ ] I should go.
**THAD:** I need a boundary divined.
**MADAME OZYMANDIA:** The earth will speak — two dollars — the earth will speak to me of lines and limits — in advance —
*Options (OZYMANDIA/OZY_A1):*
- [ ] How does the rod work?
- [ ] Could the rod find gold on my claim?
- [ ] You knew Pike was dead.
- [ ] Does it ever not work?
- [ ] Do you ever hear anything?
- [ ] Have you ever been in the Liar's Assay, Madame?
- [x] I should go.
**THAD:** I should go.
> **A7.3** -- USE The filing fee ON MADAME OZYMANDIA
**THAD:** That was the filing fee. It is now a divining fee. Money out here changes careers faster than men do.
**MADAME OZYMANDIA:** The earth thanks you. I shall pass it on.
**MADAME OZYMANDIA:** Now. Show me the ground.
**THAD:** It is two miles away and up a hill.
**MADAME OZYMANDIA:** Then show me a picture of it.
> **A7.4** -- USE The Improvement Company map ON MADAME OZYMANDIA
**MADAME OZYMANDIA:** The earth has spoken. The earth was brief.
**THAD:** You keep Form 12-C?
**MADAME OZYMANDIA:** The earth prefers them.
> **A8.2** -- goes to THE BOUNTIFUL NUGGET

### THE LANE

*(bark)* **THE MESSAGE BOY:** She does that to everyone.

### MAIN STREET

*(bark)* **THE PIE WOMAN:** That woman charged you two dollars to point at dirt. Pie.
> **A8.3** -- USE The tuning fork ON THE PIANO

### THE BOUNTIFUL NUGGET

**THAD:** Flat again. A man at the bar says the right note was making him nervous. Four minutes. Two dollars, on the bar, unmentioned. We have a routine.
> **A9.1** -- goes to THE CLAIMS REGISTRAR

### MAIN STREET

*(bark)* **THE PIE WOMAN:** That woman charged you two dollars to point at dirt. Pie.
> **A9.2** -- USE The deed to Prosperity ON THE COUNTER

### THE CLAIMS REGISTRAR

**THAD:** Filed. Mr Sump has written a number in a book, and the number is mine.
> **A9.3** -- USE Madame Ozymandia's survey of Prosperity ON THE COUNTER
**THAD:** The survey, on the correct form. He has read it without expression, which I am told is the highest mark this office gives.
> **A9.4** -- USE The filing fee ON REGISTRAR SUMP
**THAD:** Two dollars, for a number in a book. He has taken it without looking at me, which I am told is the correct procedure.
**REGISTRAR SUMP:** Claim Two. 'Prosperity,' in pencil. Commencing at the stake, thereabouts; thence uphill, with feeling, to the larger of the two rocks; thence along the line the rod preferred, some forty feet, until the humming stopped; thence home.
**REGISTRAR SUMP:** Bounded west by Claim Three. North by the creek. South by the road.
**REGISTRAR SUMP:** East by Claim One.
**THAD:** Claim One.
**REGISTRAR SUMP:** O. Mott. Filed eighteen forty-six.
**REGISTRAR SUMP:** Your neighbor, Mr. Grubb.
**REGISTRAR SUMP:** Next.
**REGISTRAR SUMP:** There is a note for you. It arrived before you did.
**REGISTRAR SUMP:** And your copy.
REGISTRAR SUMP: *(He goes into the back. He is gone some time.)*
**REGISTRAR SUMP:** The third. For the applicant.
**THAD:** There aren't any in the slots.
**REGISTRAR SUMP:** No applicant has ever asked for one.
> **A10.1** -- goes to FANSHAWE'S OFFICE

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Pie, Mr. Grubb. On the house. On the house today.
*(bark)* **THE PIE WOMAN:** Pie, Mr. Grubb. On the house. On the house today.

### FANSHAWE'S OFFICE

**COLONEL FANSHAWE:** You'll take wine. It takes itself, mostly.
> **A10.2** -- chooses
*Options (FANSHAWE/FAN_A2):*
- [ ] I'd be glad of a partner in it.
- [x] You're welcome to the working of it while I learn the trade.
- [ ] This is very good wine.
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** You're welcome to the working of it while I learn the trade.
**COLONEL FANSHAWE:** A lease! How modern of you. I'll have Sump draw something up.
COLONEL FANSHAWE: *(He will not. Sump is never asked.)*
*Options (FANSHAWE/FAN_A2):*
- [ ] I'd be glad of a partner in it.
- [ ] You're welcome to the working of it while I learn the trade. (asked)
- [ ] Put it down as a kindness, and I'll owe you.
- [x] I mean to work it myself.
- [ ] This is very good wine.
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** I mean to work it myself.
**COLONEL FANSHAWE:** Of course you do.
**COLONEL FANSHAWE:** Keep it. I have dozens.
> **A10.3** -- goes to THE IMPROVEMENT COMPANY LOBBY

## ACT II

### FANSHAWE'S OFFICE

**THAD:** A very fine dinner.
**THAD:** I believe I own something.

### THE IMPROVEMENT COMPANY LOBBY

**[ PART TWO — THREE PIECES OF PAPER ]**

### MAIN STREET

**THAD:** I have decided. The richest strike in the territory is next door to my mud, and gold doesn't stop at a fence. Mr. Sump has Claim One's filing, and I am going to read it.
> **B1.1** -- goes to THE CLARION OFFICE
> **B1.2** -- TALK TO IGNATIUS FRAME

### THE CLARION OFFICE

**IGNATIUS FRAME:** You're new! Say something quotable.
**THAD:** I'd rather not.
**IGNATIUS FRAME:** 'I'd… rather… not,' says mystery man.
*Options (FRAME/FRA_A1):*
- [ ] Where did Deke Vessel go?
- [ ] What do you know about Mott?
- [ ] You knew Pike was dead.
- [ ] You've spelled my name wrong.
- [x] Have you ever been in the Liar's Assay?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Have you ever been in the Liar's Assay?
**IGNATIUS FRAME:** Once! Fellow told me he'd found a nugget shaped exactly like the President, and I said—
IGNATIUS FRAME: *(he savors it)*
**IGNATIUS FRAME:** 'So did four men this month. It is a popular shape.' I printed it. Front page. He moved to Sacramento.
*Options (FRAME/FRA_A1):*
- [x] Where did Deke Vessel go?
- [ ] What do you know about Mott?
- [ ] You knew Pike was dead.
- [ ] You've spelled my name wrong.
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Where did Deke Vessel go?
**IGNATIUS FRAME:** I print the stage schedules! I know where everyone goes. Give me a story and I'll give you a coach.
**IGNATIUS FRAME:** A story for a schedule. That's the rate. It's always been the rate.
**THAD:** I'd pay you instead, but Mr. Vessel has my four dollars.
**IGNATIUS FRAME:** Money doesn't PRINT, Mr. Grubbe. Tell me something humiliating about yourself.
*Options (FRAME/FRA_B1):*
- [x] A piano tuner bought the worst claim in the district on purpose.
- [ ] There's a raccoon in my hole with a name.
- [ ] What did you print about Vessel leaving?
- [ ] Print a correction: my name.
- [ ] I've never done anything humiliating in my life.
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** A piano tuner bought the worst claim in the district on purpose.
**IGNATIUS FRAME:** ON PURPOSE! Is it true?
**IGNATIUS FRAME:** Don't tell me. It's better not knowing.
**IGNATIUS FRAME:** Vessel took the Tuesday coach to Fiddler's Gulch. Two days out, if the road holds, and the road never holds.
**IGNATIUS FRAME:** Take a copy. Page one.
*[acted, no words on screen]* IGNATIUS FRAME: *(He presses it on Thad, still damp.)*
**IGNATIUS FRAME:** Nobody ever buys the one they're in.
*Options (FRAME/FRA_B1):*
- [ ] There's a raccoon in my hole with a name.
- [ ] What did you print about Vessel leaving?
- [ ] Print a correction: my name.
- [ ] I've never done anything humiliating in my life.
- [x] I've taken enough of your time. I'll be taking more later.
**THAD:** I've taken enough of your time. I'll be taking more later.
> **B2.1** -- goes to THE LIVERY STABLE

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Pie, Mr. Grubb. On the house. On the house today.
*(bark)* **THE PIE WOMAN:** Pie, Mr. Grubb. On the house. On the house today.
*(bark)* **THE PIE WOMAN:** Pie, Mr. Grubb. On the house. On the house today.

### LOWER STREET

*(bark)* **THE LETTER-WRITER:** Now you've got something to write about. Twenty cents.
> **B2.2** -- TALK TO THE LIVERY MAN

### THE LIVERY STABLE

*Options (LIVERY_MAN/LIV_A1):*
- [ ] I need the mule for the diggings road.
- [ ] Why 'Grievance'?
- [ ] You knew Pike was dead.
- [ ] Is the mule all right?
- [ ] Has she ever moved for anybody?
- [x] Have you ever been in the Liar's Assay?
- [ ] I am going to leave now, in a dignified manner. (asked)
**THAD:** Have you ever been in the Liar's Assay?
**THE LIVERY MAN:** Once. Fella told me, 'I once bought a saloon with a single nugget.' I said, 'I have been in it. You overpaid.'
**THE LIVERY MAN:** He's never forgiven me. Still owns the saloon.
*Options (LIVERY_MAN/LIV_A1):*
- [ ] I need the mule for the diggings road.
- [ ] Why 'Grievance'?
- [ ] You knew Pike was dead.
- [ ] Is the mule all right?
- [x] Has she ever moved for anybody?
- [ ] I am going to leave now, in a dignified manner. (asked)
**THAD:** Has she ever moved for anybody?
**THE LIVERY MAN:** Once. Twelve years back. Fella came in at night, whistled at her, and she walked out after him like she'd been waiting.
**THE LIVERY MAN:** Never saw him again. Never saw her move again, either.
*Options (LIVERY_MAN/LIV_A1):*
- [ ] I need the mule for the diggings road.
- [ ] Why 'Grievance'?
- [ ] You knew Pike was dead.
- [ ] Is the mule all right?
- [x] What's that tune?
- [ ] I am going to leave now, in a dignified manner. (asked)
**THAD:** What's that tune?
**THE LIVERY MAN:** That's what the fella whistled. Twelve years I've been getting it wrong.
*Options (LIVERY_MAN/LIV_A1):*
- [ ] I need the mule for the diggings road.
- [ ] Why 'Grievance'?
- [ ] You knew Pike was dead.
- [ ] Is the mule all right?
- [x] I am going to leave now, in a dignified manner. (asked)
**THAD:** I am going to leave now, in a dignified manner.
> **G1.1** -- goes to THE BOUNTIFUL NUGGET

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Pie, Mr. Grubb. On the house. On the house today.
> **G1.2** -- USE The tuning fork ON THE PIANO

### THE BOUNTIFUL NUGGET

**THAD:** C-sharp, home again. Two dollars, again. I am, by the narrowest definition, employed.
> **G1.3** -- goes to MADAME OZYMANDIA'S TENT

### THE LANE

*(bark)* **THE MESSAGE BOY:** Three men paid me to find out where you're staying.
> **G1.4** -- TALK TO MADAME OZYMANDIA

### MADAME OZYMANDIA'S TENT

**MADAME OZYMANDIA:** The rod has been expecting you.
*Options (OZYMANDIA/OZY_A1):*
- [ ] How does the rod work?
- [ ] Could the rod find gold on my claim?
- [ ] You knew Pike was dead.
- [ ] Does it ever not work?
- [ ] Do you ever hear anything?
- [ ] Have you ever been in the Liar's Assay, Madame?
- [x] Could I hire the rod?
- [ ] Thank you. This has been clarifying. (asked)
**THAD:** Could I hire the rod?
**MADAME OZYMANDIA:** Hire the rod? The rod is not a mule, darling.
**MADAME OZYMANDIA:** Two dollars a week — in advance —
*[acted, no words on screen]* MADAME OZYMANDIA: *(She takes a second, identical rod from under the table.)*
**MADAME OZYMANDIA:** This one. The other one is working.
**MADAME OZYMANDIA:** Keep it as long as you like. It will come back. They always come back.
*Options (OZYMANDIA/OZY_A1):*
- [ ] How does the rod work?
- [ ] Could the rod find gold on my claim?
- [ ] You knew Pike was dead.
- [ ] Does it ever not work?
- [ ] Do you ever hear anything?
- [ ] Have you ever been in the Liar's Assay, Madame?
- [x] Thank you. This has been clarifying. (asked)
**THAD:** Thank you. This has been clarifying.
> **G1.5** -- goes to THE LIVERY STABLE
> **B3.1** -- USE The tuning fork ON GRIEVANCE

### THE LIVERY STABLE

*[acted, no words on screen]* THAD: *(Thad strikes the fork on his boot heel and listens to it. Then he whistles the livery man's tune, corrected: the fourth bar lifted where the livery man let it sag. Grievance's ears come round. She looks at Thad for a long moment. Then she walks out of her stall.)*
**THE LIVERY MAN:** Twelve years.
**THAD:** Two days on Grievance. The road held for a day and a half, which Mr. Frame would call a miracle.

### washout

**THAD:** So that's what Mr. Frame meant.
> **G2.1** -- goes to ledge

### mine_adit

**THAD:** It isn't as dark as I'd feared. The hill's been dug so often that the daylight gets in through the holes.

### ledge

**THAD:** Daylight. And below it, a whole camp in a ravine, with a river at the bottom. Fiddler's Gulch.
> **G3.1** -- goes to gulch_tents
> **G3.2** -- USE The Clarion ON THE LOOKOUT

### gulch_tents

THE LOOKOUT: *(He reads page one twice, moving his lips at the good part. Then he looks at Thad with something like envy.)*
**THE LOOKOUT:** You own nothing.
**THAD:** Nothing worth jumping.
**THE LOOKOUT:** …Come down, then. You'll be the only man in this camp who sleeps.
THE LOOKOUT: *(He folds the paper into his shirt, over his heart, like a deed.)*
> **G4.1** -- goes to grog_tent
*(bark)* **THE LOOKOUT:** There he is. Mr. Nothing.

### grog_tent

**THAD:** A grog tent, with a plank for a bar. The man behind it looks at me as if he's been expecting me.
> **G4.2** -- LOOK AT THE WATCH
**THAD:** A pocket watch on a nail in the ridgepole, so the whole camp can see the time.
**THAD:** It's my father's watch.
**THAD:** That's my father's watch.
THAD: *(He turns, slowly, to the man behind the plank. The man behind the plank is beaming.)*
**THE DEACON:** Grubb! You came all this way. Was the claim not to your liking?
**THAD:** The claim contains a raccoon and an opinion.
**THE DEACON:** It contained a raccoon when I sold it. You bought the whole thing.
**THAD:** You shaved.
**THE DEACON:** For the heat, son. You'd never have known me.
**THE DEACON:** You didn't.
> **G5.1** -- USE The tuning fork ON THE FIDDLE
*[acted, no words on screen]* THAD: *(Thad strikes the fork on the plank, holds it to the fiddle's body, and turns the pegs one at a time. The rule-keeper puts his glass down.)*
**THAD:** There. Four strings, on speaking terms again.
**THE RULE-KEEPER:** That fiddle hasn't been right since we struck.
THE RULE-KEEPER: *(He tips a pinch of dust onto the plank in front of Thad.)*
**THE RULE-KEEPER:** That's your seat paid.
*[acted, no words on screen]* THE RULE-KEEPER: *(He takes the fiddle down and plays it, very badly and very happily.)*
> **B4.1** -- TALK TO THE DEACON
*Options (DEACON/VES_G1):*
- [ ] You sold me a worthless claim.
- [ ] I want my four dollars back.
- [ ] You'll answer for this someday.
- [x] I need you to sign an affidavit.
- [ ] I should go.
**THAD:** I need you to sign an affidavit.
**THE DEACON:** Sign a paper saying I sold you mud under false pretenses? Son, that's a confession with a stamp on it.
**THE DEACON:** Tell you what. We'll settle it the local way.
THE DEACON: *(He points down the bank, at the bar.)*
**THE DEACON:** The local way's out on the bar, son. Bring your boots.
> **B5.0** -- goes to gulch_river

### gulch_river

**THE RULE-KEEPER:** The rules of the bar.
**THE RULE-KEEPER:** One. A man may not be interrupted, except by me.
**THE RULE-KEEPER:** Two. A man's account may be doubted by a better one, or a louder.
**THE RULE-KEEPER:** Three. Truth is admissible. Nobody's tried.
**THE RULE-KEEPER:** Four. The judge is me, and I've decided.
**THE RULE-KEEPER:** Five. No firearms, no knives, no—
THE RULE-KEEPER: *(He thinks.)*
**THE RULE-KEEPER:** There was a third one.
THE RULE-KEEPER: *(He gives up.)*
**THE RULE-KEEPER:** Begin.
**THE DEACON:** I pulled a nugget out of the Feather River the size of a bishop's fist.
> **B5.1** -- the duel
*Options (DEACON/VES_G1):*
- [x] That is a very large fist.
- [ ] I don't believe in bishops.
- [ ] I have a small nugget.
**THAD:** That is a very large fist.
**DEKE VESSEL:** It is. That's the point of the account.
*[a silence is held (THE RULE-KEEPER)]*
**THE PANNER:** I've seen your bishop. He was malnourished.
**THAD:** Malnourished. Bishop. Yes.
**THE DEACON:** My claim assayed at nine hundred dollars to the ton.
*Options (DEACON/VES_G1):*
- [x] Assayed by whom?
- [ ] That is forty-five cents a pound. I have done the arithmetic.
- [ ] Congratulations.
**THAD:** Assayed by whom?
**DEKE VESSEL:** By a man I trust entirely. I see him every morning when I shave.
*[a silence is held (THE RULE-KEEPER)]*
**THE PANNER:** So did my grandmother, and she was mostly gravel.
**THAD:** Grandmother. Gravel. Yes.
**THE DEACON:** I've washed more gold than you've washed shirts.
*Options (DEACON/VES_G1):*
- [x] I send my shirts out.
- [ ] I have four shirts. I am wearing the good one.
- [ ] Gold does not need washing. It is famously inert.
**THAD:** I send my shirts out.
**DEKE VESSEL:** Then I've washed more gold than your laundress, and she won't mind hearing it.
*[a silence is held (THE RULE-KEEPER)]*
**THE PANNER:** That's true of everyone here, and it's a matter of some concern.
**THAD:** Everyone. Shirts. Concern. Yes.
**THE DEACON:** My luck is famous from here to Sacramento.
*Options (DEACON/VES_G1):*
- [x] I have never been to Sacramento.
- [ ] Luck is what a man calls the parts he did not arrange.
- [ ] I once found a dollar in a hymnal.
**THAD:** I have never been to Sacramento.
**THE DEACON:** Then you'll have to take my word for it, and you just have.
*[a silence is held (THE RULE-KEEPER)]*
**THE PANNER:** It's famous in Sacramento. That's why you're here.
**THAD:** In Sacramento. Not from. Yes.
**THE DEACON:** I pulled a nugget out of the Feather River the size of a bishop's fist.
*Options (DEACON/VES_G1):*
- [x] I've seen your bishop. He was malnourished.
- [ ] That is a very large fist.
- [ ] I don't believe in bishops.
- [ ] I have a small nugget.
**THAD:** I've seen your bishop. He was malnourished.
*[a silence is held (THE RULE-KEEPER)]*
**THE DEACON:** You've no account in you at all, have you.
**THAD:** I have an account. It is scrupulously accurate.
**THE DEACON:** That's the trouble.
**THE DEACON:** Son, you've told the truth. In front of people.
**THE RULE-KEEPER:** Five to nothing. Rule four.
> **G8.1** -- TALK TO THE PANNER
**THE PANNER:** If he sent you, tell him I've found nothing. Nothing at all.
*Options (PANNER/PAN_G1):*
- [ ] Who sent me?
- [ ] Have you found anything?
- [ ] Why stand in the river all day?
- [ ] Do you know Deke Vessel?
- [ ] Can I have some gold?
- [x] Any message for upstream?
- [ ] I should go.
**THAD:** Any message for upstream?
THE PANNER: *(He lowers his voice. Nobody is near.)*
**THE PANNER:** Tell him I took a nugget out of the river so big it needs its own tent.
*Options (PANNER/PAN_G1):*
- [ ] Who sent me?
- [ ] Have you found anything?
- [ ] Why stand in the river all day?
- [ ] Do you know Deke Vessel?
- [ ] Can I have some gold?
- [ ] Any message for upstream? (asked)
- [x] I should go.
**THAD:** I should go.
> **G8.2** -- goes to upstream
> **G8.3** -- TALK TO THE MAN UPSTREAM

### upstream

**THE MAN UPSTREAM:** Did he send you? Tell him it's mine. All of it, to the falls.
*Options (MAN_UPSTREAM/UPS_G1):*
- [ ] Who's 'he'?
- [ ] Whose ground is it?
- [ ] Why not share it?
- [ ] Do you know Deke Vessel?
- [ ] I could measure it for you.
- [x] He says he took a nugget out of the river so big it needs its own tent.
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** He says he took a nugget out of the river so big it needs its own tent.
**THE MAN UPSTREAM:** Does he.
**THE MAN UPSTREAM:** Tell him I've been in that tent. It's mostly tent.
**THAD:** Tent. Mostly tent. Yes.
**THE MAN UPSTREAM:** And tell him my ground runs so rich the gravel pays me rent.
*Options (MAN_UPSTREAM/UPS_G1):*
- [ ] Who's 'he'?
- [ ] Whose ground is it?
- [ ] Why not share it?
- [ ] Do you know Deke Vessel?
- [ ] I could measure it for you.
- [x] I've taken enough of your time. I'll be taking more later.
**THAD:** I've taken enough of your time. I'll be taking more later.
> **G8.4** -- goes to gulch_river
> **G8.5** -- TALK TO THE PANNER

### gulch_river

**THE PANNER:** If he sent you, tell him I've found nothing. Nothing at all.
*Options (PANNER/PAN_G1):*
- [ ] Who sent me?
- [ ] Have you found anything?
- [ ] Why stand in the river all day?
- [ ] Do you know Deke Vessel?
- [ ] Can I have some gold?
- [x] He says his ground runs so rich the gravel pays him rent.
- [ ] I am going to leave now, in a dignified manner. (asked)
**THAD:** He says his ground runs so rich the gravel pays him rent.
THE PANNER: *(He snorts.)*
**THE PANNER:** Tell him I've collected that rent. It was paid in buttons.
**THAD:** Rent. Buttons. Yes.
**THE PANNER:** Don't tell him, mind. He'll only send another.
*Options (PANNER/PAN_G1):*
- [ ] Who sent me?
- [ ] Have you found anything?
- [ ] Why stand in the river all day?
- [ ] Do you know Deke Vessel?
- [ ] Can I have some gold?
- [x] I am going to leave now, in a dignified manner. (asked)
**THAD:** I am going to leave now, in a dignified manner.
> **G9.1** -- goes to grog_tent
> **G9.2** -- TALK TO THE DEACON

### grog_tent

*Options (DEACON/VES_G1):*
- [ ] You sold me a worthless claim.
- [ ] I want my four dollars back.
- [ ] Teach me to lie like that.
- [ ] You'll answer for this someday.
- [x] I'd like a rematch.
- [ ] Thank you. This has been clarifying.
**THAD:** I'd like a rematch.
**THE DEACON:** Not here, son. Beat me on that bar and you'd have nothing. That bar can't witness a signature.
**THE DEACON:** Beat me in the Nugget's back room, with judges and a pencil, and I'll sign whatever you like.
**THAD:** You'd come back to Consolation?
**THE DEACON:** Losing a man in front of strangers is business. Beating him in front of his own town is art. I'll take the coach.
> **G9.3** -- goes to washout

### gulch_tents

*(bark)* **THE LOOKOUT:** You're late again. We all are, but you're later.
> **G9.4** -- USE GRIEVANCE

### washout

THAD: *(Thad climbs on. Grievance considers it, then turns for home.)*
**THAD:** Two days back on Grievance. Vessel took the coach, and was in the Nugget's back room before me, with a drink and the good chair.
> **C1.1** -- goes to THE ASSAY OFFICE

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Pie. You'll want the big one.
> **C1.2** -- TALK TO WINNIE LEDGER

### THE ASSAY OFFICE

*(sound)* CREEEAK
**WINNIE LEDGER:** You're the piano man with Claim Two.
**THAD:** Prosperity.
**WINNIE LEDGER:** It's Claim Two.
*Options (WINNIE/WIN_B1):*
- [x] I need a certified assay.
- [ ] Has anyone ever brought in Mott gold?
- [ ] You have very good handwriting.
- [ ] Thank you. This has been clarifying.
**THAD:** I need a certified assay.
**WINNIE LEDGER:** You need to be in a queue. It's eight months long, and it got longer while you were asking.
> **C2.1** -- chooses
*Options (WINNIE/WIN_B1):*
- [x] Eight months? Who's ahead of me?
- [ ] Has anyone ever brought in Mott gold?
- [ ] You have very good handwriting.
- [ ] Thank you. This has been clarifying.
**THAD:** Eight months? Who's ahead of me?
**WINNIE LEDGER:** The Improvement Company. Perpetually. Priority submissions.
*Options (WINNIE/WIN_B1):*
- [ ] Eight months? Who's ahead of me? (asked)
- [ ] Has anyone ever brought in Mott gold?
- [ ] You have very good handwriting.
- [x] Who keeps the Company's log of submissions?
- [ ] Thank you. This has been clarifying.
**THAD:** Who keeps the Company's log of submissions?
**WINNIE LEDGER:** The Company. In the Colonel's office, in a drawer he sits in front of all day. I asked to see it once. He sent me a very kind note.
*Options (WINNIE/WIN_B1):*
- [ ] Eight months? Who's ahead of me? (asked)
- [ ] Has anyone ever brought in Mott gold?
- [ ] You have very good handwriting.
- [x] Thank you. This has been clarifying.
**THAD:** Thank you. This has been clarifying.
> **D1.1** -- goes to THE CLAIMS REGISTRAR
*(sound)* CREEEAK
> **D1.2** -- TALK TO REGISTRAR SUMP

### THE CLAIMS REGISTRAR

**THAD:** I'd like to see how Claim One was filed. We're neighbors now.
**REGISTRAR SUMP:** Neighbors may view a sealed filing on a Certificate of Contiguity. Document C. It is issued on presentation of Documents A, B and D.
**THAD:** Not A, B and C?
**REGISTRAR SUMP:** C is the certificate. It cannot require itself. That would be circular, and this office is linear.
*Options (SUMP/SUM_B1):*
- [ ] About Document A—
- [ ] About Document B—
- [x] About Document D—
- [ ] Who else may see a sealed filing?
- [ ] Do you ever stamp anything just for the pleasure of it?
- [ ] I should go.
**THAD:** About Document D—
**REGISTRAR SUMP:** Proof of Continuous Occupancy. Ninety days, attested by a neighbor. The office accepts one neighbor. It does not inquire into his character. It has never found that useful.
*Options (SUMP/SUM_B1):*
- [ ] About Document A—
- [ ] About Document B—
- [ ] Who else may see a sealed filing?
- [ ] Do you ever stamp anything just for the pleasure of it?
- [x] I should go.
**THAD:** I should go.
> **B6.pairs.1** -- goes to MADAME OZYMANDIA'S TENT
> **B6.pairs.2** -- TALK TO MADAME OZYMANDIA

### MADAME OZYMANDIA'S TENT

**MADAME OZYMANDIA:** The rod has been expecting you.
*Options (OZYMANDIA/OZY_A1):*
- [ ] How does the rod work?
- [ ] Could the rod find gold on my claim?
- [ ] You knew Pike was dead.
- [ ] Does it ever not work?
- [ ] Do you ever hear anything?
- [x] Have you ever been in the Liar's Assay, Madame?
- [ ] I've taken enough of your time. I'll be taking more later. (asked)
**THAD:** Have you ever been in the Liar's Assay, Madame?
**MADAME OZYMANDIA:** Once. A prospector told me he had panned a pound before breakfast, and the rod moved me to say—
*[acted, no words on screen]* MADAME OZYMANDIA: *(she closes her eyes)*
**MADAME OZYMANDIA:** 'You have never seen breakfast.'
*[acted, no words on screen]* MADAME OZYMANDIA: *(She opens them.)*
**MADAME OZYMANDIA:** Two dollars.
**THAD:** For the story?
**MADAME OZYMANDIA:** For the counter. The story was free.
*Options (OZYMANDIA/OZY_A1):*
- [ ] How does the rod work?
- [ ] Could the rod find gold on my claim?
- [ ] You knew Pike was dead.
- [ ] Does it ever not work?
- [ ] Do you ever hear anything?
- [x] I've taken enough of your time. I'll be taking more later. (asked)
**THAD:** I've taken enough of your time. I'll be taking more later.
> **C3.1** -- goes to THE CLARION OFFICE

### THE LANE

*(bark)* **THE MESSAGE BOY:** I heard. You were bad.
> **C3.2** -- TALK TO IGNATIUS FRAME

### THE CLARION OFFICE

**IGNATIUS FRAME:** You're new! Say something quotable.
**THAD:** I'd rather not.
**IGNATIUS FRAME:** 'I'd… rather… not,' says mystery man.
*Options (FRAME/FRA_A1):*
- [ ] What do you know about Mott?
- [ ] You knew Pike was dead.
- [ ] You've spelled my name wrong.
- [x] Does Fanshawe ever leave his office?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** Does Fanshawe ever leave his office?
**IGNATIUS FRAME:** For funerals! Every one. Front pew, black gloves, a wreath the size of a cartwheel. I print the notices, and he's the only man in town who reads them.
*Options (FRAME/FRA_A1):*
- [ ] What do you know about Mott?
- [ ] You knew Pike was dead.
- [ ] You've spelled my name wrong.
- [x] I am going to leave now, in a dignified manner.
**THAD:** I am going to leave now, in a dignified manner.
> **C3.3** -- goes to CHURCH & MEETING HALL
> **C3.4** -- TALK TO REVEREND SOWERBY

### CHURCH & MEETING HALL

**REVEREND SOWERBY:** My deepest— are you well?
**THAD:** Quite well.
**REVEREND SOWERBY:** …How wonderful, how wonderful for you.
*Options (SOWERBY/SOW_A1):*
- [ ] Tell me about the bell.
- [ ] What do your services cost?
- [ ] Do you believe in Mott's gold?
- [ ] You knew Pike was dead.
- [ ] You have a fine speaking voice.
- [ ] I'd like to arrange a funeral.
- [x] Have you ever won an Assay, Reverend?
- [ ] Thank you. This has been clarifying.
**THAD:** Have you ever won an Assay, Reverend?
**REVEREND SOWERBY:** Once, God forgive me. A mourner told me at the graveside, 'My father died rich,' and I said, 'Your father died owing me two dollars, and I have chosen to regard it as a legacy.'
**REVEREND SOWERBY:** …
**REVEREND SOWERBY:** The whole hill applauded. It was a very successful funeral.
*Options (SOWERBY/SOW_A1):*
- [ ] Tell me about the bell.
- [ ] What do your services cost?
- [ ] Do you believe in Mott's gold?
- [ ] You knew Pike was dead.
- [ ] You have a fine speaking voice.
- [x] I'd like to arrange a funeral.
- [ ] Thank you. This has been clarifying.
**THAD:** I'd like to arrange a funeral.
REVEREND SOWERBY: *(He brightens, and then remembers to be grave.)*
**REVEREND SOWERBY:** A funeral. For whom?
**THAD:** Ezra Pike.
**REVEREND SOWERBY:** Pike! Six years in the ground and never sung over. The undertaker did him on credit and nobody came.
**REVEREND SOWERBY:** …
**REVEREND SOWERBY:** Who speaks for the deceased?
*Options (SOWERBY/SOW_A1):*
- [ ] Tell me about the bell.
- [ ] What do your services cost?
- [ ] Do you believe in Mott's gold?
- [ ] You knew Pike was dead.
- [ ] You have a fine speaking voice.
- [x] Thank you. This has been clarifying.
**THAD:** Thank you. This has been clarifying.
> **C3.5** -- USE The letter of introduction ON REVEREND SOWERBY
**THAD:** A letter of introduction to Mr. Pike, from my father. Sealed. I have carried it three thousand miles.
**REVEREND SOWERBY:** Then you are practically family, Mr. Grubb. The estate will be billed. Mr. Pike's estate is six years behind with the undertaker, so I shall be paid after him, which is to say in spirit.
**REVEREND SOWERBY:** Have it printed. Nobody comes to a funeral he hasn't read about.
> **D2.1** -- goes to PROSPERITY

### PROSPERITY

**THAD:** You're standing on my claim.
**NICKEL PRATT:** Yep.
> **D2.2** -- TALK TO NICKEL PRATT
*Options (PRATT_JUMP/PRA_D2):*
- [x] That's my stake you're pulling up.
- [ ] I'll fetch the law.
- [ ] We got off on the wrong foot.
- [ ] I should go.
**THAD:** That's my stake you're pulling up.
**NICKEL PRATT:** Was in the way.
NICKEL PRATT: *(Of what?)*
**NICKEL PRATT:** The new stake.
*Options (PRATT_JUMP/PRA_D2):*
- [ ] I'll fetch the law.
- [ ] We got off on the wrong foot.
- [x] I should go.
**THAD:** I should go.
**NICKEL PRATT:** Nine dollars.

### PRATT'S CLAIM

**CUTAWAY VOICE:** Still on it?
**NICKEL PRATT:** Yep.
**CUTAWAY VOICE:** And the Easterner?
**NICKEL PRATT:** Says it's his claim.
**CUTAWAY VOICE:** Keep standing on it.
**NICKEL PRATT:** Who is this?
**NICKEL PRATT:** …
**NICKEL PRATT:** Nobody ever says.
> **D2.3** -- goes to PRATT'S CLAIM
> **D2.4** -- TALK TO NICKEL PRATT
*Options (PRATT/PRA_B1):*
- [x] Why do you want my claim?
- [ ] How's the bite?
- [ ] Would you swear I've lived on my claim ninety days?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Why do you want my claim?
**NICKEL PRATT:** Told to.
NICKEL PRATT: *(He does not consider this strange.)*
*Options (PRATT/PRA_B1):*
- [x] Told by whom?
- [ ] How's the bite?
- [ ] Would you swear I've lived on my claim ninety days?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Told by whom?
**NICKEL PRATT:** Fella.
*Options (PRATT/PRA_B1):*
- [x] Which fella?
- [ ] How's the bite?
- [ ] Would you swear I've lived on my claim ninety days?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Which fella?
**NICKEL PRATT:** Didn't say. Paid, though. Regular.
*Options (PRATT/PRA_B1):*
- [x] How much are they paying you?
- [ ] How's the bite?
- [ ] Would you swear I've lived on my claim ninety days?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** How much are they paying you?
**NICKEL PRATT:** Two dollars a week.
*Options (PRATT/PRA_B1):*
- [ ] How's the bite?
- [x] Would you swear I've lived on my claim ninety days?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Would you swear I've lived on my claim ninety days?
**NICKEL PRATT:** Nope.
**NICKEL PRATT:** …
**NICKEL PRATT:** Told not to.
**NICKEL PRATT:** …
**NICKEL PRATT:** Nine dollars.
*Options (PRATT/PRA_B1):*
- [ ] How's the bite?
- [x] I've taken enough of your time. I'll be taking more later.
**THAD:** I've taken enough of your time. I'll be taking more later.
**NICKEL PRATT:** Nine dollars and a hen.
> **D3.1** -- goes to SHENG'S LAUNDRY
> **D3.2** -- TALK TO AH-LAM SHENG

### SHENG'S LAUNDRY

*Options (SHENG/SHE_A1):*
- [ ] Who's paying Nickel Pratt?
- [ ] You knew Pike was dead.
- [ ] I have four dollars.
- [x] Have you ever been in the Liar's Assay?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** Have you ever been in the Liar's Assay?
**AH-LAM SHENG:** Once. A Company man told me, 'The Improvement Company came to me on their knees.' I said, 'The Company comes to everyone on their knees. It is how they get under the door.'
**AH-LAM SHENG:** …
**AH-LAM SHENG:** He paid his account the next morning. In full.
*Options (SHENG/SHE_A1):*
- [x] Who's paying Nickel Pratt?
- [ ] You knew Pike was dead.
- [ ] I have four dollars.
- [ ] I am going to leave now, in a dignified manner.
**THAD:** Who's paying Nickel Pratt?
**AH-LAM SHENG:** A man who pays through a second man, so that he has paid nobody. It is a common arrangement here. I hold paper on both of them.
**AH-LAM SHENG:** You want money.
**THAD:** I want information.
**AH-LAM SHENG:** Information is money that has learned to read. Sit down.
*Options (SHENG/SHE_D1):*
- [x] Show me the Thursday ledger.
- [ ] Why help me?
- [ ] What do you think is under Claim One?
- [ ] Do you ever take a day off?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** Show me the Thursday ledger.
**AH-LAM SHENG:** I will read it to you, when you have done me a service. Reverend Sowerby owes me for nine funerals' linens. He pays only on funeral days, because only on funeral days does he have money. Collect it.
*Options (SHENG/SHE_D1):*
- [ ] Why help me?
- [ ] What do you think is under Claim One?
- [ ] Do you ever take a day off?
- [x] I am going to leave now, in a dignified manner.
**THAD:** I am going to leave now, in a dignified manner.
> **C3.6** -- goes to THE CLARION OFFICE
> **C3.7** -- TALK TO IGNATIUS FRAME

### THE CLARION OFFICE

**IGNATIUS FRAME:** You're new! Say something quotable.
**THAD:** I'd rather not.
**IGNATIUS FRAME:** 'I'd… rather… not,' says mystery man.
*Options (FRAME/FRA_A1):*
- [ ] What do you know about Mott?
- [ ] You knew Pike was dead.
- [ ] You've spelled my name wrong.
- [x] I need a funeral notice printed.
- [ ] Thank you. This has been clarifying. (asked)
**THAD:** I need a funeral notice printed.
**IGNATIUS FRAME:** A FUNERAL!
IGNATIUS FRAME: *(He has the type set before Thad has finished the name.)*
**IGNATIUS FRAME:** 'MEMORIAL FOR E. PIKE, LATE. ALL WELCOME. REFRESHMENTS.' I've added refreshments. It doubles the turnout.
*Options (FRAME/FRA_A1):*
- [ ] What do you know about Mott?
- [ ] You knew Pike was dead.
- [ ] You've spelled my name wrong.
- [ ] I need a funeral notice printed. (asked)
- [x] Thank you. This has been clarifying. (asked)
**THAD:** Thank you. This has been clarifying.
> **C4.1** -- goes to FANSHAWE'S OFFICE

### MAIN STREET

**THAD:** The street's quieter than usual. Everyone in town who owns a black coat is up the hill.

### FANSHAWE'S OFFICE

**THAD:** Empty. It is the first time I have seen this room without somebody being generous in it.
> **C4.2** -- PICK UP THE SUBMISSION LOG
**THAD:** Nine years of priority submissions, filed one day a month, every month, in one hand. Winnie is going to want to see this, and she is not going to enjoy it.
> **C4.3** -- OPEN THE STOCK PORTRAIT DRAWER
**THAD:** The drawer is full of the same gentleman. Dozens of him, stacked, all looking nobly at nothing. Every one of him is Obadiah Mott.
> **D4.1** -- goes to BOOT HILL

### BOOT HILL

**THAD:** The service is over. Mr. Pike has been remembered, six years late and very thoroughly. The town is coming back down the hill, Colonel Fanshawe in front, holding his hat.
**THAD:** Reverend. Mr. Sheng's linens.
**REVEREND SOWERBY:** Today? Today of all days?
**THAD:** It's the only day you have it.
REVEREND SOWERBY: *(He looks at the collection plate for a long time. Then he counts out of it with his eyes shut.)*
**REVEREND SOWERBY:** Nine funerals of linen. He starches with feeling.
> **D4.2** -- goes to SHENG'S LAUNDRY
> **D4.3** -- TALK TO AH-LAM SHENG

### SHENG'S LAUNDRY

*Options (SHENG/SHE_D1):*
- [x] I have the Reverend's money.
- [ ] Why help me?
- [ ] What do you think is under Claim One?
- [ ] Do you ever take a day off?
- [ ] I should go. (asked)
**THAD:** I have the Reverend's money.
**AH-LAM SHENG:** Then I will read. A ledger leaves this room, my customers leave town.
**AH-LAM SHENG:** And on the Company's own books, a line you will want: Claim Two, contingent, eleven thousand dollars.
*Options (SHENG/SHE_D1):*
- [ ] Why help me?
- [ ] What do you think is under Claim One?
- [ ] Do you ever take a day off?
- [x] I should go. (asked)
**THAD:** I should go.
> **C5.1** -- goes to THE ASSAY OFFICE
> **C5.2** -- USE The Improvement Company submission log ON WINNIE LEDGER

### THE ASSAY OFFICE

*(sound)* CREEEAK
**THAD:** Your queue is padded. Two-thirds of these submissions are the same sample.
**WINNIE LEDGER:** …Nine years.
**THAD:** I'm sorry.
**WINNIE LEDGER:** Don't be sorry. Be quiet. I'm counting.
> **C5.3** -- chooses
*Options (WINNIE/WIN_B2):*
- [x] Will you run my assay?
- [ ] Now can I ask about Mott gold?
- [ ] Has nobody ever noticed?
- [ ] Are you all right?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Will you run my assay?
**WINNIE LEDGER:** I'll run your assay. I'd run your assay if it were a bucket of rain.
*Options (WINNIE/WIN_B2):*
- [x] Now can I ask about Mott gold?
- [ ] Has nobody ever noticed?
- [ ] Are you all right?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Now can I ask about Mott gold?
**WINNIE LEDGER:** No Mott gold has ever crossed this window. Not one flake. Not in nine years. Not one.
*Options (WINNIE/WIN_B2):*
- [x] Has nobody ever noticed?
- [ ] Are you all right?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Has nobody ever noticed?
**WINNIE LEDGER:** I noticed. I wrote it down. I've been writing it down since eighteen and forty-nine, in a book that is not this book.
WINNIE LEDGER: *(She produces it from under the floor.)*
**WINNIE LEDGER:** Nineteen names. Men who came to this window with a question about Claim One.
**THAD:** What happened to them?
**WINNIE LEDGER:** They stopped coming to the window.
**THAD:** That's all it says.
**WINNIE LEDGER:** That's all I know. I write down what I know. It's the entire discipline.
*Options (WINNIE/WIN_B3):*
- [ ] Am I in the book?
- [x] I've taken enough of your time. I'll be taking more later.
**THAD:** I've taken enough of your time. I'll be taking more later.
> **C6.1** -- goes to MAIN STREET
*(sound)* CREEEAK
> **C6.2** -- goes to THE ASSAY OFFICE
> **C6.3** -- TALK TO WINNIE LEDGER
*(sound)* CREEEAK
**WINNIE LEDGER:** Your assay.
**THAD:** And?
**WINNIE LEDGER:** Mud, rock, and a mineral I've recorded as disappointment. No gold. Not a color.
**THAD:** Then there's no Document B.
**WINNIE LEDGER:** The form requires an assay. It doesn't require a good one.
> **C6.4** -- chooses
*Options (WINNIE/WIN_B4):*
- [x] Teach me to answer a boast.
- [ ] So my claim is worthless.
- [ ] Thank you.
- [ ] Was it the raccoon?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** Teach me to answer a boast.
**WINNIE LEDGER:** Sit.
**THAD:** My strike was so rich the assayer wept.
**WINNIE LEDGER:** He weeps at everything. It's why we stopped inviting him.
**THAD:** I turned down ten thousand dollars for my claim.
**WINNIE LEDGER:** I was there. He offered four, and you cried.
**THAD:** I've never filed a claim that didn't pay.
**WINNIE LEDGER:** You've never filed a claim.
**THAD:** Every man in this territory owes me money.
**WINNIE LEDGER:** Every man in this territory owes someone money. You have described the territory.
**WINNIE LEDGER:** Say it again. And don't apologize in the middle of it.
**THAD:** I've had three fortunes and lost —
**WINNIE LEDGER:** No. You've had one fortune and told it twice. That's the answer. Say the answer.
**THAD:** Why do you know this so well?
**WINNIE LEDGER:** Because I sign the paper that says whether men are lying, Mr. Grubb, and I have never once been asked.
*Options (WINNIE/WIN_B4):*
- [ ] So my claim is worthless.
- [ ] Thank you.
- [ ] Was it the raccoon?
- [x] I am going to leave now, in a dignified manner.
**THAD:** I am going to leave now, in a dignified manner.
> **D5.1** -- goes to PRATT'S CLAIM
> **D5.2** -- TALK TO NICKEL PRATT

### PRATT'S CLAIM

*Options (PRATT/PRA_B1):*
- [ ] How's the bite?
- [x] Do you know what the Company thinks my claim is worth?
- [ ] Thank you. This has been clarifying. (asked)
**THAD:** Do you know what the Company thinks my claim is worth?
**THAD:** The Company has my claim on its books at eleven thousand dollars.
**NICKEL PRATT:** For the mud.
**THAD:** For the mud.
**NICKEL PRATT:** …
**THAD:** …
**NICKEL PRATT:** Two dollars a week is a hundred and four dollars a year.
**THAD:** It is.
**NICKEL PRATT:** That ain't the same number.
**NICKEL PRATT:** Grubb.
**THAD:** Yes?
**NICKEL PRATT:** Eleven dollars for the claim.
**THAD:** …Still?
**NICKEL PRATT:** I like the claim.
> **D5.3** -- chooses
*Options (PRATT/PRA_D6):*
- [ ] Who was the second man who paid you?
- [ ] What will you do now?
- [ ] Twenty dollars and the hen.
- [x] Will you help me practice for the Assay?
- [ ] Will you swear to the ninety days now?
- [ ] Thank you. This has been clarifying.
**THAD:** Will you help me practice for the Assay?
**NICKEL PRATT:** Try me.
**THAD:** There's more gold in my tailings than in your whole claim.
**NICKEL PRATT:** There's more gold in my boot, and I would like it back.
**THAD:** My vein runs forty feet wide.
**NICKEL PRATT:** So does the road, and it's about as productive.
**THAD:** I've dug through solid granite with my hands.
**NICKEL PRATT:** I have shaken your hands. They disagree.
**THAD:** I hired forty men to work my claim.
**NICKEL PRATT:** I've met them. They are still waiting to be paid and they have formed opinions.
**THAD:** The gold came up so fast it followed me home.
**NICKEL PRATT:** Everything follows you home. That is not gold. That is the dog.
**THAD:** There's a mountain named for me.
**NICKEL PRATT:** There's a hole named for you and I've fallen in it.
**NICKEL PRATT:** …
**NICKEL PRATT:** Where'd that come from?
**THAD:** You.
**NICKEL PRATT:** Huh.
> **D6.1** -- TALK TO NICKEL PRATT
*Options (PRATT/PRA_D6):*
- [ ] Who was the second man who paid you?
- [ ] What will you do now?
- [ ] Twenty dollars and the hen.
- [x] Will you swear to the ninety days now?
- [ ] Thank you. This has been clarifying.
**THAD:** Will you swear to the ninety days now?
**NICKEL PRATT:** Yep.
*[acted, no words on screen]* NICKEL PRATT: *(He puts his hat on.)*
**NICKEL PRATT:** Sump closes at four.
*Options (PRATT/PRA_D6):*
- [ ] Who was the second man who paid you?
- [ ] What will you do now?
- [ ] Twenty dollars and the hen.
- [x] Thank you. This has been clarifying.
**THAD:** Thank you. This has been clarifying.
**NICKEL PRATT:** Eleven dollars, and I'll take the raccoon.
> **D6.2** -- goes to THE CLAIMS REGISTRAR

### LOWER STREET

*(bark)* **THE LETTER-WRITER:** I'd leave the duel out entirely.

### THE CLAIMS REGISTRAR

**REGISTRAR SUMP:** You attest that Thaddeus Grubb has occupied Claim Two continuously for ninety days.
**NICKEL PRATT:** Yep.
**REGISTRAR SUMP:** You are his neighbor.
**NICKEL PRATT:** Yep.
**REGISTRAR SUMP:** How long have you known him?
NICKEL PRATT: *(a very long pause)*
**NICKEL PRATT:** …Ninety days.
*[acted, no words on screen]* REGISTRAR SUMP: *(He notarizes it. He stamps it. He does not look up.)*
**REGISTRAR SUMP:** Document D.
**THAD:** It has been eleven days.
**REGISTRAR SUMP:** The stamp did not ask.
> **B6.1** -- goes to THE NUGGET BACK ROOM

### THE BOUNTIFUL NUGGET

*(bark)* **THE CARD SHARP:** Lying's a skill, son. So's this.
> **B6.2** -- TALK TO DEKE VESSEL

### THE NUGGET BACK ROOM

**DEKE VESSEL:** Grubb! You came all this way. Again.
*Options (DEKE_VESSEL/VES_B1):*
- [ ] You sold me a worthless claim.
- [ ] I want my four dollars back.
- [ ] You'll answer for this someday.
- [x] I'd like a rematch.
- [ ] I should go.
**THAD:** I'd like a rematch.
**DEKE VESSEL:** Every man does, son. It's what keeps me in practice. Pull up the chair; the judges are getting bored.
**REVEREND SOWERBY:** The rules of the Assay—
**DEKE VESSEL:** He knows the rules, Reverend.
**REVEREND SOWERBY:** Then he will enjoy them twice.
**REVEREND SOWERBY:** 1. A man may not be interrupted in his account.
**REVEREND SOWERBY:** 2. A man's account may be doubted only by a better one.
**REVEREND SOWERBY:** 3. Truth is admissible but has never been raised.
**REVEREND SOWERBY:** 4. The judges' decision is final, and may be appealed to the same judges.
**REVEREND SOWERBY:** 5. No firearms. No knives. No arithmetic.
**DEKE VESSEL:** I pulled a nugget out of the Feather River the size of a bishop's fist.
> **B6.3** -- the duel
*Options (DEKE_VESSEL/VES_B1):*
- [x] I've seen your bishop. He was malnourished.
- [ ] That is a very large fist.
- [ ] I don't believe in bishops.
- [ ] I have a small nugget.
**THAD:** I've seen your bishop. He was malnourished.
*[a silence is held (REVEREND SOWERBY)]*
**DEKE VESSEL:** My claim assayed at nine hundred dollars to the ton.
*Options (DEKE_VESSEL/VES_B1):*
- [ ] Assayed by whom?
- [ ] That is forty-five cents a pound. I have done the arithmetic.
- [ ] Congratulations.
- [x] So did my grandmother, and she was mostly gravel.
**THAD:** So did my grandmother, and she was mostly gravel.
*[a silence is held (REVEREND SOWERBY)]*
**DEKE VESSEL:** I've washed more gold than you've washed shirts.
*Options (DEKE_VESSEL/VES_B1):*
- [ ] I send my shirts out.
- [ ] I have four shirts. I am wearing the good one.
- [x] That's true of everyone here, and it's a matter of some concern.
- [ ] Gold does not need washing. It is famously inert.
**THAD:** That's true of everyone here, and it's a matter of some concern.
*[a silence is held (REVEREND SOWERBY)]*
**DEKE VESSEL:** My luck is famous from here to Sacramento.
*Options (DEKE_VESSEL/VES_B1):*
- [ ] I have never been to Sacramento.
- [x] It's famous in Sacramento. That's why you're here.
- [ ] Luck is what a man calls the parts he did not arrange.
- [ ] I once found a dollar in a hymnal.
**THAD:** It's famous in Sacramento. That's why you're here.
*[a silence is held (REVEREND SOWERBY)]*
**DEKE VESSEL:** My ground runs so rich the gravel pays me rent.
*Options (DEKE_VESSEL/VES_B1):*
- [ ] Gravel can't pay rent.
- [ ] What does it pay?
- [ ] My raccoon pays no rent at all.
- [x] I've collected that rent. It was paid in buttons.
**THAD:** I've collected that rent. It was paid in buttons.
*[a silence is held (REVEREND SOWERBY)]*
**DEKE VESSEL:** Fine. Fine! I'll sign the cursed affidavit.
**THAD:** Thank you.
**DEKE VESSEL:** You didn't enjoy that at all, did you.
**THAD:** I found it educational.
**DEKE VESSEL:** That's worse.
*Options (DEKE_VESSEL/VES_B1):*
- [ ] You sold me a worthless claim.
- [ ] I want my four dollars back.
- [ ] You'll answer for this someday.
- [x] I should go.
**THAD:** I should go.
> **E0.1** -- goes to THE CLAIMS REGISTRAR

### THE BOUNTIFUL NUGGET

*(bark)* **THE CARD SHARP:** There it is.

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Beat Deke Vessel! Pie's still a nickel.
> **E0.2** -- TALK TO REGISTRAR SUMP

### THE CLAIMS REGISTRAR

**THAD:** I'd like to see how Claim One was filed. We're neighbors now.
**REGISTRAR SUMP:** Neighbors may view a sealed filing on a Certificate of Contiguity. Document C. It is issued on presentation of Documents A, B and D.
**THAD:** Not A, B and C?
**REGISTRAR SUMP:** C is the certificate. It cannot require itself. That would be circular, and this office is linear.
*Options (SUMP/SUM_B1):*
- [ ] About Document A—
- [ ] About Document B—
- [x] About Document C—
- [ ] Who else may see a sealed filing?
- [ ] Do you ever stamp anything just for the pleasure of it?
- [ ] I've taken enough of your time. I'll be taking more later. (asked)
**THAD:** About Document C—
**REGISTRAR SUMP:** Present A, B and D together and the office issues C, the Certificate of Contiguity. It is the only document that comes after D. I find that restful.
*[acted, no words on screen]* REGISTRAR SUMP: *(He brings Claim One's filing to the window, under its glass.)*
**REGISTRAR SUMP:** Claim One. Obadiah Mott, eighteen forty-six. 'The richest strike in the history of this territory, lying at the place herein described.'
**THAD:** Where is it described?
**REGISTRAR SUMP:** Herein.
REGISTRAR SUMP: *(He turns the glass over. The back of the sheet is blank.)*
**REGISTRAR SUMP:** The office accepted it. It was a busy year.
*Options (SUMP/SUM_B1):*
- [ ] About Document A—
- [ ] About Document B—
- [ ] Who else may see a sealed filing?
- [ ] Do you ever stamp anything just for the pleasure of it?
- [x] I've taken enough of your time. I'll be taking more later. (asked)
**THAD:** I've taken enough of your time. I'll be taking more later.
> **E0b.1** -- goes to FANSHAWE'S OFFICE

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Beat Deke Vessel! Pie's still a nickel.
*(bark)* **THE PIE WOMAN:** Beat Deke Vessel! Pie's still a nickel.

### FANSHAWE'S OFFICE

**COLONEL FANSHAWE:** Eleven thousand dollars.
**THAD:** For forty feet of mud.
**COLONEL FANSHAWE:** For forty feet of mud.
> **E0b.2** -- chooses
*Options (FANSHAWE/FAN_C1):*
- [x] May I read the contract?
- [ ] Yes.
- [ ] No.
- [ ] Why does a worthless claim cost eleven thousand dollars?
- [ ] I've named a raccoon after you.
- [ ] Who did you serve under in the war?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** May I read the contract?
**COLONEL FANSHAWE:** Of course! Read every word. I want you to read every word.
**THAD:** He doesn't want the claim. He wants it quiet.

## ACT III

### FANSHAWE'S OFFICE

*Options (FANSHAWE/FAN_C1):*
- [ ] Yes.
- [ ] No.
- [ ] Why does a worthless claim cost eleven thousand dollars?
- [ ] I've named a raccoon after you.
- [ ] Who did you serve under in the war?
- [x] I am going to leave now, in a dignified manner.
**THAD:** I am going to leave now, in a dignified manner.

**[ PART THREE — THADDEUS GRUBB IS LEGALLY DEAD ]**

### MAIN STREET

**THAD:** I have decided. Claim One's filing is a blank page, and Mr. Fanshawe will pay eleven thousand dollars to keep it blank. The rest of Claim One is behind Mr. Sump's sealed door, and I am going through it.

### FANSHAWE'S OFFICE

**COLONEL FANSHAWE:** He said no.
**COLONEL FANSHAWE:** They do, at first. It's the coat. A man in a good coat still thinks he's in Providence.
**COLONEL FANSHAWE:** Eleven chairs. Every one of them sat in by a man who said no.
**COLONEL FANSHAWE:** Most of them are still looking.
**COLONEL FANSHAWE:** Good. Let him look.

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Beat Deke Vessel! Pie's still a nickel.
*(bark)* **THE PIE WOMAN:** Beat Deke Vessel! Pie's still a nickel.
> **E1.1** -- goes to THE CLAIMS REGISTRAR
> **E1.2** -- TALK TO REGISTRAR SUMP

### THE CLAIMS REGISTRAR

**REGISTRAR SUMP:** Mr. Grubb. You have the look of a man with a petition.
*Options (SUMP/SUM_E1):*
- [x] I'd like Obadiah Mott declared dead.
- [ ] Is dying difficult here?
- [ ] Thank you. This has been clarifying.
**THAD:** I'd like Obadiah Mott declared dead.
**REGISTRAR SUMP:** Seven years' absence, which Mr. Mott has comfortably achieved, and a petitioner with standing: kin, or a creditor. Mr. Mott has no kin on file, and he owes nobody.
**REGISTRAR SUMP:** It is the most suspicious thing about him.
> **E2.1** -- chooses
*Options (SUMP/SUM_E1):*
- [x] Section nineteen. The executor of a deceased claimholder.
- [ ] Is dying difficult here?
- [ ] Thank you. This has been clarifying.
**THAD:** Section nineteen. The executor of a deceased claimholder.
**REGISTRAR SUMP:** May open the archive. Correct.
**THAD:** I hold a claim.
**REGISTRAR SUMP:** You do.
**THAD:** If I were deceased—
**REGISTRAR SUMP:** Your executor would have the archive, and you would have a plot.
**REGISTRAR SUMP:** An executor may hold no interest in any claim touching the estate. Sub-section two. It was written after a family in Placerville.
**REGISTRAR SUMP:** The office does not advise. It answers.
*Options (SUMP/SUM_E1):*
- [ ] Is dying difficult here?
- [x] Thank you. This has been clarifying.
**THAD:** Thank you. This has been clarifying.
> **E3.1** -- goes to CHURCH & MEETING HALL
> **E3.2** -- TALK TO REVEREND SOWERBY

### CHURCH & MEETING HALL

**REVEREND SOWERBY:** And how shall we remember the departed?
**THAD:** Cheaply.
*Options (SOWERBY/SOW_C1):*
- [ ] He was a beloved and industrious young man of rare promise.
- [ ] He was a man.
- [x] He was present.
- [ ] He tuned pianos.
- [ ] I should go.
**THAD:** He was present.
REVEREND SOWERBY: *(A long, painful pause. He writes it down.)*
**REVEREND SOWERBY:** …Present. Three words, and one of them is 'was'. I shall add an 'amen' at no charge; I cannot send a man into the ground on three.
*Options (SOWERBY/SOW_C1):*
- [ ] He was a beloved and industrious young man of rare promise.
- [ ] He was a man.
- [ ] He tuned pianos.
- [x] I should go.
**THAD:** I should go.
> **E3.3** -- goes to SHENG'S LAUNDRY
> **E3.4** -- TALK TO AH-LAM SHENG

### SHENG'S LAUNDRY

*Options (SHENG/SHE_D1):*
- [x] I need four dollars.
- [ ] Why help me?
- [ ] What do you think is under Claim One?
- [ ] Do you ever take a day off?
- [ ] I've taken enough of your time. I'll be taking more later. (asked)
**THAD:** I need four dollars.
**AH-LAM SHENG:** You need two dollars and sixty cents, and you will have it at ten per cent, and you will pay it back, because I have watched you and you are honest in the one way that matters: absently.
*Options (SHENG/SHE_D1):*
- [ ] Why help me?
- [ ] What do you think is under Claim One?
- [ ] Do you ever take a day off?
- [x] I've taken enough of your time. I'll be taking more later. (asked)
**THAD:** I've taken enough of your time. I'll be taking more later.
> **E3.5** -- goes to THE UNDERTAKER'S

### LOWER STREET

*(bark)* **THE LETTER-WRITER:** Beat Deke Vessel. That's a page and a half right there.

### THE LANE

*(bark)* **THE MESSAGE BOY:** I watched. You were less bad.
> **E3.6** -- TALK TO THE UNDERTAKER

### THE UNDERTAKER'S

*Options (UNDERTAKER/UND_C1):*
- [x] I'll need your best pine, handles, plate.
- [ ] You haven't asked who it's for.
- [ ] Could you make it roomy?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** I'll need your best pine, handles, plate.
**THE UNDERTAKER:** Sizing's free. It's the only thing that is. Stand straight.
*Options (UNDERTAKER/UND_C1):*
- [ ] You haven't asked who it's for.
- [ ] Could you make it roomy?
- [x] I am going to leave now, in a dignified manner.
**THAD:** I am going to leave now, in a dignified manner.
> **E3.7** -- USE Two dollars and sixty cents from Mr. Sheng ON THE UNDERTAKER
**THE UNDERTAKER:** Pine. Handles. Plate. The hole. The Reverend's four words.
**THE UNDERTAKER:** Paid.
> **E4.1** -- goes to THE ASSAY OFFICE

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Beat Deke Vessel! Pie's still a nickel.
> **E4.2** -- TALK TO WINNIE LEDGER

### THE ASSAY OFFICE

*(sound)* CREEEAK
**THAD:** I need you to certify that I'm dead.
**WINNIE LEDGER:** No.
*Options (WINNIE/WIN_C1):*
- [ ] It's the only way into the archive.
- [ ] It's just a form.
- [ ] Nineteen names, Miss Ledger.
- [x] You're right. Forget it.
- [ ] Thank you. This has been clarifying.
**THAD:** You're right. Forget it.
**WINNIE LEDGER:** …Sit down, Mr. Grubb.
**WINNIE LEDGER:** If I sign this and you are wrong, I have ended my own office and killed you for nothing.
**THAD:** Yes.
**WINNIE LEDGER:** You're not going to reassure me.
**THAD:** I don't think I can. I've checked.
*[acted, no words on screen]* WINNIE LEDGER: *(signing)*
**WINNIE LEDGER:** That's the first honest transaction at this window in nine years.
*Options (WINNIE/WIN_C1):*
- [ ] It's the only way into the archive.
- [ ] It's just a form.
- [ ] Nineteen names, Miss Ledger.
- [x] Thank you. This has been clarifying.
**THAD:** Thank you. This has been clarifying.
> **E5.1** -- goes to THE CLAIMS REGISTRAR
*(sound)* CREEEAK
> **E5.2** -- TALK TO REGISTRAR SUMP

### THE CLAIMS REGISTRAR

*Options (SUMP/SUM_C1):*
- [x] I have a death to record. Mine.
- [ ] You know I'm not dead.
- [ ] Is there a form for this?
- [ ] I should go.
**THAD:** I have a death to record. Mine.
**REGISTRAR SUMP:** The office does not require the deceased to be absent. An oversight, possibly. I do not correct statute. I administer it.
*Options (SUMP/SUM_C1):*
- [ ] You know I'm not dead.
- [ ] Is there a form for this?
- [x] I should go.
**THAD:** I should go.
> **E5.3** -- goes to THE CLARION OFFICE
> **E5.4** -- TALK TO IGNATIUS FRAME

### THE CLARION OFFICE

**IGNATIUS FRAME:** An obituary. For the piano man.
**THAD:** Did you know him?
**IGNATIUS FRAME:** Everyone knew him. He was— —he was the only man in town who fixed anything.
*Options (FRAME/FRA_E1):*
- [x] What will you write?
- [ ] He owed you a quote.
- [ ] Spell it right.
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** What will you write?
**IGNATIUS FRAME:** The truth. It's an obituary. There are rules.
*Options (FRAME/FRA_E1):*
- [ ] He owed you a quote.
- [ ] Spell it right.
- [x] I've taken enough of your time. I'll be taking more later.
**THAD:** I've taken enough of your time. I'll be taking more later.
> **E6.1** -- goes to THE BACK ALLEY

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Thought you'd passed.
> **E6.2** -- TALK TO HOB

### THE BACK ALLEY

**THAD:** I need an executor. Somebody with no interest in any claim in this town.
**HOB:** That's me.
**THAD:** …You haven't heard what it is.
**HOB:** Don't need to. Nobody's ever asked me for anything. I'd like to see how it goes.
*Options (HOB/HOB_E6):*
- [x] You'd be executor of my estate. It's forty feet of mud.
- [ ] Will you come to the archive with me?
- [ ] Have you ever been an executor before?
- [ ] Why would you do this for me?
- [ ] Do you ever sleep?
- [ ] I am going to leave now, in a dignified manner.
**THAD:** You'd be executor of my estate. It's forty feet of mud.
**HOB:** I know the mud.
HOB: *(He signs Form 31-E against the lamp post, and hands it back.)*
*Options (HOB/HOB_E6):*
- [ ] Will you come to the archive with me?
- [ ] Have you ever been an executor before?
- [ ] Why would you do this for me?
- [ ] Do you ever sleep?
- [x] I am going to leave now, in a dignified manner.
**THAD:** I am going to leave now, in a dignified manner.
> **E6.3** -- goes to THE CLAIMS REGISTRAR
*(bark)* **THE DOG'S OWNER:** You seen a — You seen a dog?
> **E6.4** -- USE Form 31-E, Appointment of Executor ON REGISTRAR SUMP

### THE CLAIMS REGISTRAR

**REGISTRAR SUMP:** Hob.
**REGISTRAR SUMP:** Surname.
**THAD:** He didn't give one.
**REGISTRAR SUMP:** The statute does not require one. It never imagined it would need to.
**REGISTRAR SUMP:** The night watchman. Holds no claim, owes nothing, is owed nothing, and has never filed so much as a complaint.
**REGISTRAR SUMP:** Accepted.
> **E7.1** -- goes to THE FUNERAL
> **E7.2** -- LOOK AT THE GRAVE

### THE FUNERAL

**THAD:** Dug neat, in a good spot, uphill of the seepage — the undertaker does honest work for dishonest occasions. I am oddly touched by the drainage.
*(bark)* **REVEREND SOWERBY:** …a man of music, taken flat…
> **E7.3** -- LOOK AT THE GRAVE
**THAD:** Six feet, measured. I am two inches shorter than the hole, which is the first time this town has given me room.
**HOB:** Good turnout.
*(bark)* **REVEREND SOWERBY:** …a man of music, taken flat…
**HOB:** Better than mine.
> **E7.4** -- USE THE COFFIN
**THAD:** This is the part of the plan where I lie down.
**THE UNDERTAKER:** Lid stays loose. Knock twice when they've gone.
> **E8.1** -- waits

### INSIDE THE COFFIN

**HOB:** You were down four minutes. I counted. I always count.
**THAD:** …You've done this before.
**HOB:** I've watched them do it. It's not the same.
> **E8.2** -- chooses
*Options (HOB/HOB_C1):*
- [x] How did you know I was in there?
- [ ] You said you didn't know Mott.
- [ ] Who are you?
- [ ] You have very neat handwriting.
- [ ] Thank you. This has been clarifying.
**THAD:** How did you know I was in there?
**HOB:** I know where every hole in this town is. It's the job.
*Options (HOB/HOB_C1):*
- [x] You said you didn't know Mott.
- [ ] Who are you?
- [ ] You have very neat handwriting.
- [ ] Thank you. This has been clarifying.
**THAD:** You said you didn't know Mott.
**HOB:** I said no. I didn't say I didn't know him.
*Options (HOB/HOB_C1):*
- [ ] Who are you?
- [x] You have very neat handwriting.
- [ ] Thank you. This has been clarifying.
**THAD:** You have very neat handwriting.
HOB: *(He looks at Thad for a long time.)*
**HOB:** …Yes.
*Options (HOB/HOB_C1):*
- [ ] Who are you?
- [ ] You have very neat handwriting. (asked)
- [x] Thank you. This has been clarifying.
**THAD:** Thank you. This has been clarifying.

### THE FUNERAL

**THAD:** Out. I have been buried and dug up in one evening, and of the two I preferred the second.
> **E9.1** -- goes to THE CLAIMS REGISTRAR
> **E9.2** -- OPEN THE SEALED ARCHIVE DOOR

### THE CLAIMS REGISTRAR

**REGISTRAR SUMP:** The executor of the late Mr. Grubb.
**THAD:** His agent.
**REGISTRAR SUMP:** You resemble him.
**THAD:** So I'm told.
**REGISTRAR SUMP:** Twenty minutes. The archive closes at four, and so do I.
> **E9.3** -- USE Form 31-E, Appointment of Executor ON THE MOTT FILE

### THE REGISTRAR'S ARCHIVE

**THAD:** Hob's signature. Mott's signature. The same small, upright hand, twelve years apart, in no hurry either time.
> **E10.1** -- goes to THE WATCHMAN'S SHACK

### THE WATCHMAN'S SHACK

**HOB:** You'll have noticed I talk more at night.
**THAD:** Claim One is in your hand.
**HOB:** Yes.
**THAD:** Where's the gold, Mr. Mott?
**HOB:** There isn't any.
**THAD:** Where is it.
**HOB:** There isn't any, son. There never was. I made it up in a room in Boston to get three hundred dollars out of a man in a good coat, and I picked the spot off a map with my thumb.
> **E10.2** -- leaves the conversation
*Options (HOB/HOB_C2):*
- [ ] Two thousand people live here.
- [ ] Why didn't you leave?
- [ ] Twelve years.
- [ ] Did you ever think about telling them?
- [ ] You could have picked a better thumb.
- [ ] Grievance walked out after you, twelve years ago.
- [ ] This photograph isn't you.
- [x] I should go.
**THAD:** I should go.
**HOB:** Twelve years I watched them look. You're the first that listened.

## ACT IV

### THE WATCHMAN'S SHACK

**[ PART FOUR — THE QUIETEST PART OF THE GAME ]**

### THAD'S ROOM

**THAD:** Packed. It took four minutes; there was less to pack than there was to leave. The coach is at noon. I am going to look at my mud once more first, because nobody else will.
> **F1.1** -- goes to PROSPERITY
> **F1.2** -- LOOK AT THE HOLE

### PROSPERITY

**THAD:** The hole is warm. It has been warm since the day I bought it: warm air, out of solid rock, all autumn.
**THAD:** Air does not come out of rock. It comes through it.
> **F1.3** -- goes to THE MERCANTILE

### MAIN STREET

*(bark)* **THE PIE WOMAN:** Thought you'd passed.
*(bark)* **THE PIE WOMAN:** Thought you'd passed.
> **F1.4** -- PICK UP THE PICKAXES

### THE MERCANTILE

**THAD:** The one with the loose head, on my account. It's the only one I can afford, and the only one honest about itself.
> **F1.5** -- goes to PROSPERITY
> **F1.6** -- USE A pickaxe with a loose head ON THE HOLE

### PROSPERITY

**THAD:** Three days. Forty feet. The head came off once, forwards, which I took as encouragement. I have borrowed the lamp from my room, and I will return it, which is the second time I have promised that to something in this territory. The draught got warmer the whole way down.
> **F2.1** -- goes to THE LISTENING CHAMBER
> **F2.2** -- LISTEN TO the rock (the tap)

### THE LISTENING CHAMBER

**THAD:** …There's a room down there.
> **F3.1** -- USE A pickaxe with a loose head ON EVERY ROCK SURFACE
THAD: *(Thad swings. The head flies off into the dark and lands somewhere he cannot see.)*
**THAD:** The Mercantile's pickaxe, performing to its price.
*[acted, no words on screen]* THAD: *(He finds it and fits it back.)*
> **F3.2** -- USE A pickaxe with a loose head ON EVERY ROCK SURFACE
THAD: *(The head comes off again, gently, as if apologizing.)*
**THAD:** Twice. It is consistent. Down here I have come to value that.
*[acted, no words on screen]* THAD: *(He fits it back.)*
> **F3.3** -- USE A pickaxe with a loose head ON EVERY ROCK SURFACE
THAD: *(Thad holds the head on with one hand and swings with the other. The rock gives. Warm air comes through, and behind it a dark that goes a long way down.)*
THAD: *(A piece of the wall comes away in his hand. It is much heavier than a piece of wall should be.)*
> **F4.1** -- goes to THE ASSAY OFFICE
> **F4.2** -- TALK TO WINNIE LEDGER

### THE ASSAY OFFICE

*(sound)* CREEEAK
**THAD:** I need an assay certified.
**WINNIE LEDGER:** Where.
**THAD:** Claim Two.
**WINNIE LEDGER:** …Get in the book. You're the book.
*Options (WINNIE/WIN_F1):*
- [x] Run it.
- [ ] You knew the nineteen names meant something.
- [ ] Aren't you going to congratulate me?
- [ ] I've taken enough of your time. I'll be taking more later.
**THAD:** Run it.
**WINNIE LEDGER:** Twenty-two hundred dollars to the ton.
**WINNIE LEDGER:** Nine years I've waited to write down a number I believed.
**WINNIE LEDGER:** File it. I'll be at the Registrar's when you do.
*Options (WINNIE/WIN_F1):*
- [ ] You knew the nineteen names meant something.
- [ ] Aren't you going to congratulate me?
- [x] I've taken enough of your time. I'll be taking more later.
**THAD:** I've taken enough of your time. I'll be taking more later.
> **F4.3** -- goes to MAIN STREET
*(sound)* CREEEAK

### MAIN STREET

**COLONEL FANSHAWE:** No hard feelings, Mr. Grubb. It's simply how we settle things here. You'll find it very fair.
**REVEREND SOWERBY:** 1. A man may not be interrupted in his account.
**REVEREND SOWERBY:** 2. A man's account may be doubted only by a better one.
**REVEREND SOWERBY:** 3. Truth is admissible but has never been raised.
**REVEREND SOWERBY:** 4. The judges' decision is final, and may be appealed to the same judges.
**REVEREND SOWERBY:** 5. No firearms. No knives. No arithmetic.
**COLONEL FANSHAWE:** My luck is famous from here to Sacramento.
> **F4.4** -- the duel
*Options (FANSHAWE/FAN_B1):*
- [ ] I have never been to Sacramento.
- [x] It's famous in Sacramento. That's why you're here.
- [ ] Luck is what a man calls the parts he did not arrange.
- [ ] I once found a dollar in a hymnal.
**THAD:** It's famous in Sacramento. That's why you're here.
*[a silence is held (REVEREND SOWERBY)]*
**COLONEL FANSHAWE:** Every man in this territory owes me money.
*Options (FANSHAWE/FAN_B1):*
- [x] Every man in this territory owes someone money. You have described the territory.
- [ ] I do not owe you money.
- [ ] Would you like it in writing?
- [ ] Then you must be very rich, on paper.
**THAD:** Every man in this territory owes someone money. You have described the territory.
*[a silence is held (REVEREND SOWERBY)]*
**COLONEL FANSHAWE:** I built this town.
*Options (FANSHAWE/FAN_B1):*
- [ ] It is a very nice town.
- [ ] Some of it is level.
- [ ] With your own hands?
- [x] You sold this town a map to a place that isn't there, and then sold it shovels.
**THAD:** You sold this town a map to a place that isn't there, and then sold it shovels.
*[a silence is held (REVEREND SOWERBY)]*
**COLONEL FANSHAWE:** I have never been wrong about a claim in my life.
*Options (FANSHAWE/FAN_B1):*
- [ ] I have been wrong about several. I find it restful.
- [ ] Neither have I. I have only had the one.
- [x] You have been right about exactly one, Colonel, and you have spent twelve years making sure nobody digs it.
- [ ] That must be very lonely.
**THAD:** You have been right about exactly one, Colonel, and you have spent twelve years making sure nobody digs it.
*[a silence is held (REVEREND SOWERBY)]*
**COLONEL FANSHAWE:** I have never told a lie in my life.
*Options (FANSHAWE/FAN_B1):*
- [ ] Neither have I, and look where it got me.
- [x] There is no gold in Mott's claim. There never was. Obadiah Mott invented it to raise a grubstake off men in Boston, and every one of you built a house on top of it.
- [ ] You just did.
- [ ] I tune pianos.
**THAD:** There is no gold in Mott's claim. There never was. Obadiah Mott invented it to raise a grubstake off men in Boston, and every one of you built a house on top of it.
*[a silence is held (REVEREND SOWERBY)]*
*[a silence is held (REVEREND SOWERBY)]*
**REVEREND SOWERBY:** ...That's the biggest one I ever heard.
**THAD:** It's true.
**REVEREND SOWERBY:** Better still!
*[acted, no words on screen]* COLONEL FANSHAWE: *(He puts on his hat.)*
**COLONEL FANSHAWE:** Well played, Mr. Grubb.
> **F5.1** -- goes to THE CLAIMS REGISTRAR
> **F5.2** -- USE The certificate of my death ON THE COUNTER

### THE CLAIMS REGISTRAR

**REGISTRAR SUMP:** You are deceased.
**THAD:** I was. I'd like to stop.
**REGISTRAR SUMP:** Form 31-F. Notice of Return. It was printed in hope.
REGISTRAR SUMP: *(Stamp. Thad is alive.)*
> **F5.3** -- USE The deed to Prosperity ON THE COUNTER
**REGISTRAR SUMP:** Claim Two. The adjoining holder.
*[acted, no words on screen]* REGISTRAR SUMP: *(Stamp.)*
> **F5.4** -- USE The Certificate of Contiguity ON THE COUNTER
**REGISTRAR SUMP:** Contiguity. A neighbor holding a Certificate of Contiguity may file an amended location on behalf of an absent claimholder. Section nineteen, sub-section four.
**REGISTRAR SUMP:** …
**REGISTRAR SUMP:** Nobody has ever read sub-section four.
**THAD:** I have.
**REGISTRAR SUMP:** Yes. I saw you.
> **F5.5** -- USE A piece of the rock under Prosperity ON THE COUNTER
**WINNIE LEDGER:** Twenty-two hundred to the ton. Assayed this morning, at my window, by me.
*[acted, no words on screen]* WINNIE LEDGER: *(She signs beside it.)*
> **F5.6** -- TALK TO REGISTRAR SUMP
**REGISTRAR SUMP:** Form 12-C, Amended. Location of Claim One. And the holder's name, in the holder's box.
*Options (SUMP/SUM_F1):*
- [x] Obadiah Mott.
- [ ] Thaddeus Grubb.
- [ ] Winnie Ledger.
- [ ] The raccoon.
- [ ] I am going to leave now, in a dignified manner.
**THAD:** Obadiah Mott.
**REGISTRAR SUMP:** …That's a very old claim number.
**WINNIE LEDGER:** You're putting it in his name.
**THAD:** Yes.
**WINNIE LEDGER:** You understand you get nothing.
**THAD:** I get to stop lying. I've only just learned how and I'm already tired of it.
*[acted, no words on screen]* WINNIE LEDGER: *(stamping)*
**WINNIE LEDGER:** …Certified.
**REGISTRAR SUMP:** …
REGISTRAR SUMP: *(reading, toneless)*
**REGISTRAR SUMP:** Amended location, Claim One. Holder, Obadiah Mott. 'The strike lies at the place herein described.'
**REGISTRAR SUMP:** …
**REGISTRAR SUMP:** Which is now described.
**REGISTRAR SUMP:** …
**REGISTRAR SUMP:** Under statute, a claim must be worked by its holder within thirty days, or it reverts to the Territory.
**THAD:** So Mr. Mott will have to come forward.
**REGISTRAR SUMP:** In person. To this window. Within thirty days.
*[acted, no words on screen]* REGISTRAR SUMP: *(He blots it.)*
**REGISTRAR SUMP:** I shall look forward to it.
> **END.1** -- WALK TO THE COACH STOP

### THE COACH STOP

**THAD:** Leave the mud.
**THAD:** Dear Mother.
**THAD:** I was robbed, and it was the making of me.
**THAD:** The gold is real. The story is better. I will tell you both in the spring.
**THAD:** — Your Thaddeus.

**[ THE END (the title returns) ]**
