import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/** Directories served verbatim in dev and copied into the build unchanged. */
const DATA_DIRS = ['content', 'art'];

/**
 * Content and art stay at the repository root, as the technical spec lays
 * them out, rather than moving under a bundler-owned public directory.
 * Vite serves them from root in dev; this copies them into dist for a build,
 * so a line of dialogue stays a JSON file you can edit in place.
 */
function copyDataDirs(): Plugin {
  return {
    name: 'consolation-copy-data-dirs',
    apply: 'build',
    closeBundle() {
      for (const dir of DATA_DIRS) {
        if (existsSync(dir)) {
          cpSync(dir, `dist/${dir}`, { recursive: true });
        }
      }
    },
  };
}

/**
 * Where the built game is served from.
 *
 * GitHub Pages serves a project site under /<repo>/, so the build needs that
 * prefix. Dev stays at the root, because typing a subdirectory into the
 * address bar every time is a tax on the person who has to play this most.
 *
 * BASE_PATH overrides it, so the same build can be pointed at a custom
 * domain or a preview host without editing this file.
 */
const PAGES_BASE = process.env.BASE_PATH ?? '/consolation-prize/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PAGES_BASE : '/',
  plugins: [copyDataDirs()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./engine', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: ['.'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}));
