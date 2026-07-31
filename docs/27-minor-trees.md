# THE LAST CLAIM IN CONSOLATION
## Three Act I trees — the undertaker, the hotel clerk, Deke Vessel

*Doc 04 sketches all three in a line each. Written out. Verbatim.*

---

# THE UNDERTAKER · Room 13
### Gates A1. Sets `T_PIKE_DEAD` and puts Boot Hill on the map, per errata 31b.

**Voice:** total indifference, and not unkind with it. He deals in facts about dead people and has no theatre about any of it. He is never named. He answers in the fewest words the question requires and then waits.

**Root:** "Yes."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "I'm looking for a man named Ezra Pike." | `[PROGRESS]` | *(He puts down what he is holding.)* "Eighteen fifty-two." — *"I'm sorry?"* — "Eighteen fifty-two. He's up the hill." |
| 2 | "Up the hill?" | `[PROGRESS]` | "Boot Hill. Third row, second from the end. He's got a marker." → **`T_PIKE_DEAD`**, Boot Hill on the map |
| 3 | "What did he die of?" | `[TOPIC]` | "Nothing interesting." |
| 4 | "I had a letter for him." | `[TOPIC]` | "You still have a letter for him." |
| 5 | "Do you know everybody?" | `[COMIC]` | "I know everybody who's finished." |
| 6 | `[EXIT]` "Thank you." | | "Mm." |

**Act III:** the same root and the same indifference. He is the only person in Consolation who finds nothing strange about a living man arranging his own funeral, and he does not remark on it.

---

# THE HOTEL CLERK · Room 18
### Gates A2. The fork's first real combination, per doc 24.

**Voice:** proprietorial about a building he does not own. The register is his and its spellings are authoritative. He is not rude; he is administering.

**Root:** *(reading from the register)* "Mr. Grubbe."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "It's Grubb." | `[TOPIC]` | "It's as given." |
| 2 | "I'd like a room." | `[PROGRESS]` | "Five dollars." |
| 3 | "I have four." | `[PROGRESS]` | "Then you have four dollars and no room. Those are compatible." |
| 4 | "Your piano is out of tune." | `[PROGRESS]` | "It is." — *"I could put it right."* — *(pause)* "For a room?" — *"For a room."* — *(He turns the register round.)* "Nineteen." → opens the A2 combination |
| 5 | "Is there anything cheaper?" | `[COMIC]` | "There is the road." |
| 6 | `[EXIT]` "I'll think about it." | | "Mr. Grubbe." |

**Option 4 does not complete the puzzle.** It grants permission. The fork on the parlour piano is what earns the room, per doc 24's A2 pair.

---

# DEKE VESSEL · Room 3
### Gates A3, the swindle. Returns in Act II for both duels, and in Act IV owning a hotel.

**Voice:** sunny, shameless, and visibly enjoying himself. He is not a good liar and does not need to be — he is selling to a man who wants to be sold to. **He never says anything untrue.** Read back afterwards, every word of this is technically accurate, which is the joke and which is why Thad cannot be angry about it later.

**He opens.** Thad does not approach him.

**Root:** "You're the piano man."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "How did you know?" | `[TOPIC]` | "Everybody knows. It's a small place and you're a new thing in it." |
| 2 | "What are you selling?" | `[PROGRESS]` | "Nothing. I'm getting out." *(beat)* "Which is a kind of selling, I suppose." |
| 3 | "Getting out of what?" | `[PROGRESS]` | "Claim Two. Producing, mind. But my sister's poorly and Sacramento's four days." |
| 4 | "How much?" | `[PROGRESS]` | **"What have you got?"** — *"Four dollars."* — "Four dollars." *(He looks at the watch.)* "And that." |
| 5 | "You seem cheerful for a man with a poorly sister." | `[COMIC]` | "I've made my peace with it." |
| 6 | "All right." | `[PROGRESS] ✓` | *(The swindle. Four dollars and the watch for the deed.)* → `T_SWINDLED` |
| 7 | `[EXIT]` "I'll think about it." | | "Course you will." |

**"What have you got?" is the entire con** and it is the only question in the scene. He does not price the claim. He prices Thad.

**"Producing, mind"** — Claim Two produces mud, which is a product. Nothing he says is false.

---

# EXAMINE LAYERS

*The eighteen lines. Each character is a hotspot in their room like anything else.*

## THE UNDERTAKER
**LOOK** 1 "A man in his fifties in a clean apron, doing something careful with a plane. He has not looked up." · 2 "His hands are a carpenter's. Everything else about him is a clerk's." · 3 "He is the only man in Consolation who is not waiting for something."
**LISTEN** 1 "Nothing. He works quietly and he does not hum." · 2 "Nothing." · 3 "Breathing, and a plane on pine. It is the most restful sound in the territory and I would rather it were anywhere else."

## THE HOTEL CLERK
**LOOK** 1 "A young man behind a counter, in a coat that has been brushed a great deal more often than it has been cleaned." · 2 "He is twenty-two at the outside and he has the manner of a man defending an institution." · 3 "He has not once looked at the door. Nobody is coming through it and he knows the timetable."
**LISTEN** 1 "A pen. He is writing something that is not the register." · 2 "Still writing." · 3 "Nothing. He has stopped, and he is waiting for me to go so that he can start again."

## DEKE VESSEL
**LOOK** 1 "A man at the bar with his hat pushed back, entirely at ease, watching the door." · 2 "His boots are good. Everything above the boots is not, and I have decided that is deliberate." · 3 "He has been in this territory a long time and he is leaving it in a very good mood."
**LISTEN** 1 "Talking. He has been talking since before I came in and he has not yet said anything." · 2 "Still talking." · 3 "He has stopped, which is worse."

---

# VESSEL'S AUTO-OPEN — what re-arms it

Doc 27 says *"He opens. Thad does not approach him."* `onEnter` carries flag writes and nothing else, so the tree is currently reached by TALK TO and the opening is unbuilt.

**The missing piece is that `onEnter` may carry a sequence, not only flag writes** — the same five-step runner, reused rather than a new mechanism.

**Vessel's, exactly:**

```
onEnter (room 3):
  when:  NOT T_SWINDLED  AND  NOT T_VESSEL_OPENED
  steps: wait 1500ms
         say "You're the piano man."
         openDialogue VESSEL
  then:  set T_VESSEL_OPENED
```

- **Gated on `NOT T_SWINDLED`.** After the swindle he never opens again — he has what he came for.
- **Once only**, via its own flag. A player who leaves and returns is not re-approached.
- **TALK TO still works and always did.** The auto-open is how Vessel finds Thad; it is not the only route to the tree.
- The `wait` is legal here because control is the player's but the sequence is non-interactive, which is 30a's fence read narrowly. **If that reading is wrong, drop the wait rather than widening the fence** — he can speak on entry.

**This is the pattern for every character who accosts the player**, and Act II has several. Do it once here.

---

## Notes

1. **"You still have a letter for him."** The undertaker is not being cruel. He is correcting a tense, because a man who deals in the dead notices when somebody uses the wrong one. It is the best line in Act I and it should be delivered completely flat.
2. **The undertaker never gets a name.** Everyone else in Consolation is named, several of them absurdly. He is the only person in town whose function is entirely sufficient.
3. **Vessel's exit line is "Course you will," which is the driver's line from the opening.** Two different men, an hour apart, in the same four words, about the same young man. Nothing points at it.
4. **Vessel is "watching the door" in his first LOOK.** He is not waiting for a friend.
5. **The undertaker's LISTEN 3 — "the most restful sound in the territory and I would rather it were anywhere else."** It is the only time in Act I that Thad admits a place is getting to him.
6. **The clerk's "Then you have four dollars and no room. Those are compatible."** He is not refusing. He is explaining that the situation is consistent.
