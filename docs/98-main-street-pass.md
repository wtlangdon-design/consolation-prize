# THE LAST CLAIM IN CONSOLATION
## 98 · The Main Street pass — Thad's first errand, and the townspeople given a point of view

*Tyler, 2026-11-07, playing Main Street: "I think nearly ALL of the dialogue on main street could be better. It's all rather lame … No one really has a personality or point of view … I feel like Thad pretty quickly needs something to 'do' on Main Street?" and "Does someone on Main Street need to direct him into a specific building first?" Shown the draft, he chose "Yes, write it", then "Go". Errata 170 records it. One voice, written in the documents and extracted, under doc 59's rules; Main Street is the sample for the rest of the town, and no other room's lines change until Tyler has ruled on it.*

## The errand

The design already gave Thad one: **A1, deliver the letter of introduction to Ezra Pike — "every character redirects you elsewhere"**, until the undertaker says Pike died six years ago (doc 02). The driver had pointed him at the undertaker in Room 1, and Hob and Frame redirected him, but nothing on Main Street knew Pike existed. Now:

- **He arrives with the errand.** After his first look at the street: "Now. Mr. Ezra Pike, and my father's letter." / "The driver said ask the undertaker. An undertaker knows everybody, eventually." (`reference/room-02/annotation.json` `onEnterSay`, compiled into the room.)
- **Every townsperson, asked after Pike, sends him to the undertaker down the lane — and none of them will say why.** Each one dodges in their own way. The player understands long before Thad does, and the run of dodges is the joke (doc 59 §6). It follows the euphemisms Hob ("Pike's up the hill") and Frame ("He has moved somewhere very quiet") already use. The question is offered only while Thad does not know (`T_PIKE_DEAD` false).
- **After the undertaker, each of them answers "You knew Pike was dead."** That is the payoff, gated on `T_PIKE_DEAD`.

## What changed, by character (doc 07)

- **The letter-writer** greets Thad with his own bark ("Letters home. Ten cents the page."), so the first thing he says is what he is. Tyler had asked whether that was established, and it was only half established. He keeps the best of his lines and gains the Pike exchange ("Very close. Closer every year.").
- **The pie woman** no longer answers everything with "Pie's a nickel." Tyler, of her and the message boy: "both ignore him by saying their same phrase multiple times. I don't like it with either of them." She prices him on sight, answers in pricing ("It's a nickel's worth of answer. The filling's a dime."), and keeps "Course you will." — one of the game's running gags.
- **The message boy** keeps the penny economy but explains it ("Knowing does. Not knowing's free. Most of the town's on that plan."), and keeps the Colonel's Boston letter and the school line.
- **The man leaving tomorrow.** "You said that last week" is gone: Thad arrived tonight and cannot know it (Tyler: "Thad just arrived in town"; doc 59 §11). In its place, Thad notices the bag he can see: "That bag's been packed a while." / "Four years."
- **The map seller** explains his "accounts" ("Hundreds, sir. And every one of them agrees it's somewhere.").
- **The boundary men** finish each other's Pike answer ("He's not *up* the hill. He's *in* the hill." / "He has a mine?").
- **Every question now has an "asked again" answer that differs from the first** (doc 04 rule 4), so nobody repeats themselves word for word. `tests/repeats.test.ts` holds it for these six trees, and later rooms are added to it as they are written.

## What did not change

Every flag, gate and puzzle fact is untouched: the Colonel's letter, the man's four years, the boundary men's forty feet, the map seller's "accounts". Every `[COMIC]` option still does nothing. The barks are unchanged. No line names Pike as dead before the undertaker does.

## Structure

The letter-writer's, pie woman's and map seller's trees were hand-transcribed into `content/`. They are now extracted from doc 07 by the same reader as the other townspeople (`tools/town-barks.json`), which gained doc 07's ***Opening:*** line. The map seller's "This makes no sense and he is very firm about it." is an actor's note, now hidden by name (doc 58). The letter-writer's "He puts his pen down." is doc 95 row 69, class B: physical, and printed until a pen-down pose is drawn.
