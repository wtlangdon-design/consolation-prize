# Consolation Prize

A Phaser 3 + TypeScript game, built with Vite.

## Running it

```sh
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                    |
| `npm run build`     | Type-check, then build to `dist/`             |
| `npm run preview`   | Serve the built `dist/` locally               |
| `npm run typecheck` | Type-check only                               |

## Layout

```
index.html          entry point
src/
  main.ts           game config + bootstrap
  style.css         page styling around the canvas
  scenes/
    BootScene.ts    asset loading
    MainScene.ts    placeholder scene
vite.config.ts      build config ('@' aliases to src/)
```
