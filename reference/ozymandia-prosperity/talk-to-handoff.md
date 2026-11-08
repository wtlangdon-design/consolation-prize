# Handoff: what TALK TO Ozymandia does at Prosperity (Act IV)

For Claude, the writer. Tyler wants this decided. It is a writing decision, so the builder made no choice and wrote nothing.

## Where things stand (errata 186)

- She is built. Prosperity (Room 23), Act IV, from `T_VOID_FOUND`. She stands on the near ground below the hole with her brass rod, looking down. The render is `renders/room-23-ozymandia-act-iv.png`.
- **Doc 04, MADAME OZYMANDIA, Act IV** (`docs/04-dialogue-trees.md`, line 662):
  > if Thad returns after `T_VOID`, she is at Prosperity, holding the rod, staring at the ground, saying nothing. Her only line: *"…It's loud here."*
- **That line is her bark.** It is extracted from doc 04 into `content/ambient/prosperity-ozymandia.json`, the same in every reputation state. It plays once when Thad comes within 230 px of her, which takes in the spot in front of her (1080, 790).
- **She has no tree.** Every dialogue node needs three or more options and a `[COMIC]` one, and doc 04 gives her one line.

## What TALK TO does now, and why it is wrong

TALK TO on her does not walk Thad over. He answers from wherever he stands with the general **object** pool for TALK TO (`content/ui/verb-fallbacks.json`), in turn:

1. "I have decided against it."
2. "It has said nothing and I have said nothing and we are both content."
3. "I would like it on record that I considered it."

The pool was written for things, so it calls her "it". The pool for people has no TALK TO, because TALK TO on a person always opened a tree until now. She is the first person in a built room who can be talked to and has no tree.

## The decision

**A · Her line again, nothing new written.** TALK TO plays "…It's loud here." from her, in her colour, after Thad walks up. This keeps doc 04's "her only line" literally true. It needs no new words, only a ruling that the bark answers TALK TO too. The builder wires it.

**B · A line for Thad, said to her.** One new line (or a short set of repeat variants) in Thad's voice for TALK TO on her. It is new writing, and **no current permission covers it**. Errata 113, 127, 171 and 183 each name their own scope, and this is in none of them. Tyler has to authorise it, as errata 184 did for its four gaps. It must keep doc 04's "saying nothing" true: she does not answer beyond her one line.

**C · A + B.** Thad says his line, and she says hers.

**D · Leave it.** The object pool stays. The builder recommends against this one: "It has said nothing" is about a person.

## If words are written (B or C)

- **Where they go:** `docs/54-batch-c.md`, in **ROOM 23 & 24 · PROSPERITY, AND THE HOLE**, under an `## Overrides` heading, in the same form the back alley uses for Hob:
  > **MADAME OZYMANDIA** · TALK TO — "…"
- Repeat variants follow doc 54's own form for repeats.
- **Rules:** doc 59's voice and doc 99's sheet. Act IV is after the void, after the funeral is long past, and near the end. Nothing the plate does not show. No puzzle, flag or LISTEN line is touched; this is not a clue and must not read as one.
- **Then the builder:**
  - maps `MADAME OZYMANDIA` to `prosperity_ozymandia` in `reference/room-23/annotation.json` (`people`) and compiles Room 23, keeping Pratt's stake where main has it;
  - makes TALK TO on a figure with no tree walk Thad to its `walkTo` before answering (a small engine change, with a test);
  - for A or C, has her bark answer TALK TO too.

## Also open, for the same pass

- **Every other wrong verb on her** (LOOK AT, PICK UP, PUSH, PULL, USE, OPEN, CLOSE) now gets the general **people** pool ("A person. I have decided to be polite about it." and the rest). That is acceptable, but doc 54 can override any of them in the same rows if a line is wanted.
- **LISTEN TO her** gets the people pool's LISTEN. If she is to be listened to, that line also belongs in doc 54. It must not be one of the three load-bearing LISTENs, and nothing may mark it.

Reply with A, B, C or D. For B or C, also say whether Tyler has authorised the new words.
