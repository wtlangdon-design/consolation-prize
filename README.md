# Consolation Prize

A 2D point-and-click comedy adventure. Phaser 3 + TypeScript, built with Vite,
native 320×200 with a nine-verb SCUMM-style panel.

The design lives in `/docs`. **`docs/00-errata.md` overrides every other
document on every point it addresses — read it first.** `CLAUDE.md` is binding
for anyone, human or agent, working in this repository.

## Running it

```sh
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

Keys: `F5` save · `F9` load · `F6` reset. Click a verb, then a hotspot.
Double-click the same hotspot to walk.

## Scripts

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                         |
| `npm run build`     | Type-check, then build to `dist/`                  |
| `npm run preview`   | Serve the built `dist/` locally                    |
| `npm run typecheck` | Type-check only                                    |
| `npm run validate`  | The validation pass — see below                    |
| `npm test`          | Engine tests (save/load, dialogue, verb interface) |
| `npm run check`     | Typecheck, validate and test together              |

## The one architecture rule

> **No content lives in code. All content lives in JSON.**

The engine reads JSON and knows nothing about Consolation. `npm run validate`
enforces this: it fails if a `.ts` file names the fiction, carries a
player-facing sentence as a literal, or imports content JSON at build time.

## Layout

```
index.html          entry point
engine/             the engine. Knows nothing about Consolation.
  main.ts           Phaser config, integer upscale
  core/             flag store, dialogue runner, verb system, save, room state
  render/           1-bit bitmap font, screen primitives, frame renderer
  scenes/           Phaser boot + game scenes
content/            all game content, loaded at runtime
  manifest.json     the only path the engine knows; everything else hangs off it
  rooms/            rooms, hotspots, exits, per-verb responses
  dialogue/         trees, nodes, options, tags, gates, state changes
  flags/            flag definitions and initial state
  ui/               verb labels and every string the interface can draw
art/ui/             1-bit font, placeholder palette
tools/              the validation pass
tests/              engine tests
docs/               the design. 00-errata.md wins over all of it.
```

## Validation, not judgement

`npm run validate` runs seven checks, each readable in under a minute:

| Check | Enforces |
| --- | --- |
| No content strings in code | The one architecture rule |
| Content structure | Every cross-reference resolves |
| Examine lines | Every hotspot has a distinct LOOK and LISTEN line, no duplicates game-wide |
| Dialogue nodes | ≥3 options and ≥1 `[COMIC]` option per node |
| Flag order | No gate can be read before something can write it |
| Glyph coverage | Every character in content has a font glyph |
| Puzzle graph | All 45 puzzles reachable; win reachable from every reachable state |

The puzzle-graph check is inert until the graph lands — it reports that it
traversed nothing rather than passing on no evidence.

## Current phase

**Phase 1 — engine skeleton.** No content. The two rooms and one dialogue tree
under `content/` are engine test fixtures, not Consolation.
