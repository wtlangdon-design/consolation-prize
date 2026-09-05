# 53 · Room 5 later-state contract

**What this is.** The state contract the next Room 5 implementation task consumes: C5, WIN_B2, WIN_B3, C6, E4, WIN_F1 and F5, each as the five kinds of state errata 66 keeps apart. It records ids and dependencies. It contains no dialogue, no examine copy and no staging; those stay in docs 04, 05, 08 and 25. Authority: errata 66 (rulings A–K), errata 57 and 60, doc 02, doc 04, doc 36 Q111 and Q112.

**Five kinds of state, never collapsed into one another.**

| Kind | Where it lives | Examples |
|---|---|---|
| TOPIC / knowledge | `content/flags/flags.json` booleans | `T_BORDERS_MOTT`, `T_ASSAY_QUEUE`, `T_NO_MOTT_GOLD`, `T_SECOND_LEDGER`, `T_STRIKE_FOUND`, `T_QUEUE_PADDED` (declared by doc 04; not yet in the build) |
| PUZZLE completion | `puzzles` in the save (`GameState.puzzles`), canonical ids from doc 02 | `C5`, `C6`, `E4`, `F3`, `F5` |
| INVENTORY | `content/items/*.json`, item ids | `padded_log`, `document_b`, `death_certificate` (to be declared), `deed`, `company_map`, `pickaxe`, `tuning_fork` |
| DIALOGUE selection counts | `dialogueProgress` in the save, tree → `node:option` → count | `WINNIE/WIN_B1:winnie5` (the raccoon), `WINNIE/WIN_A1:winnie1` (removed at 1) |
| WORLD / prop | `objectStates` in the save, `room/object` → state | `assay_office/floorboard` (rest/pressed today; a lifted state when WIN_B3 is staged), the queue bench's act gate |

**The ACT counter** (errata 60) is its own thing: written at the act turns only, read by gates. It is not a puzzle state and not a topic.

## The contract, by scene

```json
{
  "schema": 1,
  "authority": ["docs/00-errata.md#66", "docs/00-errata.md#57", "docs/00-errata.md#60", "docs/02-puzzle-graph.md", "docs/04-dialogue-trees.md"],
  "scenes": {
    "C5": {
      "room": "assay_office",
      "prerequisites": { "puzzles": ["C4"], "inventory": ["padded_log"], "topics": ["T_ASSAY_QUEUE"], "act": 2 },
      "input": "USE (show) padded_log on winnie -- the ambient character, TALK_TO's target; errata 66 A",
      "success": { "puzzles": { "C5": "complete" }, "inventory": "padded_log stays held (errata 66 A)", "dialogue": "WIN_B2 opens at once, its authored opening verbatim (errata 66 C)" },
      "notTopic": "T_QUEUE_PADDED is knowledge and may not stand in for C5 (errata 66 B)",
      "unbuilt": ["padded_log item", "C2-C4 (Fanshawe's office, the funeral window)", "USE-item-on-ambient-character resolution", "an opener that starts a tree from a puzzle action rather than TALK_TO"]
    },
    "WIN_B2": {
      "entry": "opened by C5's success action, not by the entry table; also reachable by TALK_TO afterwards? -- UNSPECIFIED: doc 04 titles it 'after the padded log (C5)' and names no entry gate; the next task adds an entry gated on puzzles.C5 or documents why not",
      "rows": { "winnie1": "grants the assay -> C6 pending (errata 66 F)", "winnie2": "sets T_NO_MOTT_GOLD", "winnie3": "sets T_SECOND_LEDGER" },
      "aftermath": "as authored in doc 04 (errata 57); counts persist per W1"
    },
    "WIN_B3": {
      "availability": { "topics": ["T_SECOND_LEDGER"] },
      "extraction": "verbatim, one row, doc 04 rules 1-2 waived by errata 66 E; the extractor's SKIP is lifted by the next task",
      "worldState": "assay_office/floorboard: Winnie's retrieval is staged (a lifted state, her chore) -- not built; the ledger is not an inventory item unless the scene rules it; after-state on the counter UNDECIDED (errata 66 E)",
      "location": "Room 5's loose floorboard (errata 66 D); doc 08's Room 6 board superseded"
    },
    "C6": {
      "prerequisites": { "puzzles": ["C5"], "dialogue": "WIN_B2 winnie1 taken" },
      "pending": { "puzzles": { "C6": "pending" }, "note": "the queued assay already has its material -- no soil-sample item (errata 66 G)" },
      "completed": { "puzzles": { "C6": "complete" }, "inventory": ["document_b"], "dialogue": "Winnie's five Liar's-Assay pairs available (errata 3; doc 03 Tier 2)", "offscreen": true },
      "unbuilt": ["document_b item and its examination copy (not authored)", "the collection action and its lines (not authored: doc 36 Q111)", "ASSAY_PAIRS counter", "the Liar's Assay sparring runtime"]
    },
    "E4": {
      "room": "assay_office",
      "prerequisites": { "puzzles": ["E3", "C5"], "act": 3 },
      "input": "TALK_TO -> WIN_C1 (verbatim, errata 66 J); the advancing row is 'You're right. Forget it.'; the signing exchange follows",
      "completion": { "puzzles": { "E4": "complete" }, "inventory": ["death_certificate"], "cannotBeLost": true },
      "unbuilt": ["WIN_C1 extraction (rule 2 waived)", "death_certificate item and its examination copy (not authored)", "E0-E3", "ACT 3's writer (doc 48 S2)"]
    },
    "WIN_F1": {
      "prerequisites": { "topics": ["T_STRIKE_FOUND"], "puzzles": ["F3"], "act": 4, "inventory": ["pickaxe"] },
      "rows": { "winnie1": "Run it. -- the on-screen assay (the first the player watches); outcome UNSPECIFIED in doc 04: no flag, item or signature named", "winnie2": "presumes WIN_B3 seen", "winnie3": "counted-repeat, authored to selection 2" },
      "unbuilt": ["the assay's staging and its result state", "the gold sample (not an item; doc 04 has her 'look at the sample')"]
    },
    "F5": {
      "room": "registrar (Room 7), doc 48 S6",
      "prerequisites": { "puzzles": ["F3", "F4"], "signature": "Winnie's -- the dependency doc 02 names; how it is carried (a puzzle state F5-signature, or Document D bearing it) UNSPECIFIED" },
      "dialogue": "WIN_F2, a scripted exchange, not a node; the name choice is S6's own tree",
      "completion": { "puzzles": { "F5": "complete" }, "topics": ["T_FILED"] },
      "unbuilt": ["everything: Room 7, S6, WIN_F2"]
    }
  },
  "itemContracts": {
    "padded_log": { "acquiredAt": "C4", "usedAt": "C5 (shown, kept)", "examineCopy": "NOT AUTHORED" },
    "document_b": { "acquiredAt": "C6", "keptAs": "souvenir, examinable", "examineCopy": "NOT AUTHORED" },
    "death_certificate": { "acquiredAt": "E4", "usedAt": ["E6", "E9"], "cannotBeLost": true, "examineCopy": "NOT AUTHORED" }
  },
  "openBindings": {
    "rephrase C5": "WIN_A2 winnie2's rephrase reads puzzles.C5; nothing writes it until C5's success action exists",
    "WIN_B2 entry": "see WIN_B2.entry",
    "ledger afterState": "see WIN_B3.worldState",
    "F5 signature carrier": "see F5.prerequisites.signature"
  }
}
```

**Reading the contract.** `unbuilt` names what the build lacks; `UNSPECIFIED` and `NOT AUTHORED` name what the documents lack. The second kind is reported to Tyler and never filled by an implementation task.
