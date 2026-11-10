# 122 · The second audit: music, feel, and jokes that break the frame (2026-11-10)

Doc 116 said these three had not been looked at. Tyler, 2026-11-10: "Do all the Not Done things." This is the look, against the first *Monkey Island*, read from the content and the engine as they stand. One thing is built here (the verb keys, errata 252). The rest is findings, and seven proposals that are Tyler's to rule on, because each is a matter of ear, hand or taste.

**What this audit could not do:** hear the game, or hold it. Every finding about sound is read from what is wired and from doc 45; none is a judgement of how it sounds. Every finding about feel is read from the engine; none was felt on a Chromebook.

---

## 1 · Music and sound

| What Monkey Island does | Where Consolation is | Verdict |
|---|---|---|
| A theme for every place, so the ear knows where it is | 53 rooms have a bed (`content/manifest.json` `music.rooms`), from 21 files counting their through-the-wall and tuned variants. Room 32 and the undertaker's are silent on purpose | **There** |
| Themes that belong to people (LeChuck's, the Governor's) | THE COMPANY in the lobby, the office and, through the wall, the vault. WINNIE in both her rooms. THE ASSAY at the Registrar's. THADDEUS on every piece of open ground he owns or walks | **There** |
| Music that changes with what you did (the later games' iMUSE) | The Nugget's piano is flat until he tunes it and in tune after, everywhere it can be heard: in the room, through the wall of the back room, down the lane (`tunedFlag`). Rooms crossfade over two seconds | **There, and better than the first game had it** |
| The score as a joke teller | The whole score is 35 cents flat and resolves at the end (invariant 5). The church bell is half a step flat. He is a piano tuner in a town where nothing is in tune | **There.** It is the game's best sound joke and it is structural |
| Sound gags on objects | 43 cues. The stamp. The judges' pencil. The batwing doors, three swings, each smaller. The loose floorboard | **There, thinly.** See P1 |
| Stings for a solved puzzle | None, by rule: a sting would mark a line that matters (invariant 3) | **Absent on purpose. Keep** |

**Findings**

- **Five beds are still "placeholder composition by the builder"** in `audio/README.md` (THE STRIKE, THE ASSAY, WINNIE, THE COMPANY, and THADDEUS complete). They were approved by ear to ship; the word placeholder is still on them. That is Tyler's to settle either way.
- **The hill and the church share one bed** (`consolation-funeral.wav` on Boot Hill, in the church and at the funeral). The memorial for a man nobody met and Thad's own funeral sound the same. That may be the joke. If it is not, it is the one place a second statement would be heard.
- **New since doc 45, and silent:** Madame Ozymandia's hum over the map (errata 251), the press pulled (errata 249), the nail tapped in with the tuning fork, "each tap an A" (errata 250). Each is described in words and has no cue. See P1.

## 2 · Feel in the hand

| What Monkey Island does | Where Consolation is | Verdict |
|---|---|---|
| A verb under each finger (Q W E / A S D / Z X C) | **None until today.** Every verb change was a trip to the panel, which on a trackpad is most of the travelling in the game | **Built: errata 252** |
| Right click does the obvious thing | The secondary button takes each subject's default verb | **There** |
| A click skips a line | Click, SPACE or ENTER, one utterance at a time | **There** |
| Text speed | A menu option | **There** |
| Save anywhere | Menu, and Ctrl+S / Ctrl+L | **There** |
| You never wait to cross a screen you have crossed before | On the town map a click skips the walk. **In a room it does not:** an exit clicked twice is walked to once, at 194 px/s, across rooms up to 3700 px wide. Main Street is nineteen seconds end to end | **Missing.** See P2 |
| The sentence line tells you what a click will do | It does, for subjects, people, items and exits | **There** |
| Inventory you can see | Eight cells and arrows. At its fullest it is now fifteen items (it was twenty-four), so two pages | **There.** Better than last week |

**Findings**

- **Nothing here was measured on the Chromebook.** `?fps` shows the frame rate in the build; the acceptance line in CLAUDE.md (60 fps in Chrome on a Chromebook) is Tyler's to read off his own machine.
- **Walk speed was set by the stride** (194 px/s is 1.9 strides a second, a walking man's), not by how long a room takes to cross. That is the right way to set it. It leaves long rooms long, which is what P2 is for.

## 3 · Jokes that break the frame

Doc 01 rules on this already, and well: *"Anachronism: permitted in institutions, forbidden in technology... the sharper version of Monkey Island's anachronism."* Doc 59 allows "a wink, not a speech." So the game's frame-breaks are institutional: the take-a-number spindle, Form 12-C, the Registrar's hours.

| What Monkey Island does | Where Consolation is | Verdict |
|---|---|---|
| Options that are only jokes | About 40% of all dialogue options (invariant 1) | **There, more than the original** |
| A running gag that pays nothing | The letters home (invariant 10). The nine misspellings of his name. Mr. Pike, who is dead and is everywhere | **There** |
| The world admits it is a game (the stump, "insert disk 22", the rubber tree) | Nothing. Thad never knows he is in one, and the bureaucracy does the work those jokes did | **Absent on purpose.** See P5 |
| A joke on the genre's own rules ("Look behind you!") | The Liars' Assay is a town-wide joke about the insult duel. Thad's funeral is a joke about the game where you cannot die | **There** |
| Things to find that are not on any route | Since errata 250: the wardrobe that can be locked, the B on the coffin, the raccoon dressed. Before it, almost nothing a player could do that the route did not ask for | **Begun.** See P6 |
| A title or credits joke | The title card and the act cards are played straight | **Absent.** See P7 |

---

## 4 · Proposals, for Tyler's ruling

Not built. Each is small, and each is a matter of taste that a script cannot settle.

| # | Proposal | Why | Cost |
|---|---|---|---|
| **P1** | **Three cues** for things the last two days added: her hum over the map (one held note, a little flat, stopping where the line stops); the press coming down; the fork on the nail, three taps in A | They are described and not heard. The hum is also the one the mine pays off | Three sounds, by ear, in doc 45's process |
| **P2** | **A second click on an exit goes at once.** The first click walks him, as now. A second click on the same exit while he is walking cuts to the next room | Backtracking is most of an adventure game's minutes. The map already works this way | Engine only, about a day with its tests. No content |
| **P3** | **Settle the word "placeholder"** on the five beds: either they are the score, and the word comes off, or one is to be written again | So that nobody later replaces an approved bed because a README called it temporary | A sentence from Tyler |
| **P4** | **A second statement of the hill's bed for Thad's own funeral,** or a ruling that they are meant to match | It is the game's centre, and it currently sounds like Act II's errand | One bed, or one sentence |
| **P5** | **Keep the fourth wall.** No stump joke, no "insert Form 22" | Doc 01 chose its anachronism on purpose and the game is better for it. Recorded so that it is a decision and not an omission | None |
| **P6** | **Five more things to find that no route asks for,** one per act, each a line or two: the kind of thing errata 250's wardrobe is | Monkey Island rewards poking at what does not matter. Doc 116 Y9 holds this for wrong tries; nothing holds it for right ones | About ten lines, one voice, under a ruling |
| **P7** | **One joke on the title card,** in the game's own register: the card is filed. A stamp comes down on it | The first thing a player sees could be in the voice of the game | One sound that exists (U-STAMP) and one small picture |

## 5 · Built with this audit

**Errata 252: every verb has a key.** Q W E, A S D, Z X C, laid out as the panel is. The keys are content (`content/ui/verbs.json`), not code. A key selects its verb exactly as a click on its button does, and only where that click would land: not under the menu, in a conversation, during a cutscene, on the map, or in Room 32, which has no interface and must not be given one by a keypress.

## 6 · Tyler's rulings (2026-11-10)

| # | Ruling | What happened |
|---|---|---|
| P1 | "Can you give these to me to listen to?" Two of each were played. "The hums and press are good." Of the nails: "like the ring of hitting glass. The rings should be much fainter and quicker", and of the second pair, "Those are both good" | The three are in the game: `R16-HUM`, `R09-PULL`, `R14-NAIL` (errata 257; doc 45) |
| P2 | "Yes" | Built: a second click on a way out goes at once (errata 256) |
| P3 | "You decide" | **They are the score.** Each was approved by ear to ship. The word "placeholder" is off the README, the renderer and the proof, so nobody replaces an approved bed because a note called it temporary (errata 257) |
| P4 | "You decide" | **The hill and his funeral keep one bed.** Consolation has one funeral in it, and plays it for a man nobody met and for a man who is standing there. That the town cannot tell the two occasions apart is the scene. A second statement would tell the player this one is the real one, and it is not (errata 257) |
| P5 | "You decide" | **The fourth wall stays.** Doc 01's anachronism is in institutions, never in the frame; no line knows it is in a game (errata 257) |
| P6 | "Yes" | Written and built: doc 123, errata 258 |
| P7 | "Give me an example and/or mock up; did MI do this?" Then: "maybe there's a trigger in the game that once you reach a certain point where the stamp is used, then the stamp comes down on the title card?" and "Go" | Built his way (errata 259): a first title is clean; once the Registrar's stamp has been seen in play, SEEN comes down on the title each time it shows. The first Monkey Island plays its title straight |

