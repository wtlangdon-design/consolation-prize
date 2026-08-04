import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/**
 * Directories served verbatim in dev and copied into the build unchanged.
 *
 * `tools/beat11` IS HERE SO SOMEBODY CAN OPEN IT. It is a standalone page with
 * no bundle and no imports -- it does not need building -- but a tool that
 * only exists on a developer's disk is a tool the person who has to use it
 * cannot reach, and he works from a Chromebook. Copied, it lands at
 * /consolation-prize/tools/beat11/trace-path.html on the Pages site, where its
 * `../../art/...` paths resolve exactly as they do from a local checkout.
 *
 * R5o, applied before it could happen: a fix is not finished until something
 * reaches it, and neither is a tool.
 */
const DATA_DIRS = ['content', 'art', 'tools/beat11'];

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
 *
 * PREVIEW SERVES WHAT BUILD EMITTED, which is why `isPreview` is here.
 * Vite runs the preview server under command "serve", so this used to resolve
 * to "/" while the index.html it was serving had /consolation-prize/ baked
 * into every asset URL -- a 200 on the page and a 404 on the bundle, and
 * `npm run preview` could never work. Q33.
 *
 * The fix is on the PREVIEW side on purpose. Making build emit "/" instead
 * would fix preview by breaking Pages, which serves a project site under
 * /<repo>/ and is where the game is actually looked at. A local inconvenience
 * is not worth a broken live game.
 */
const PAGES_BASE = process.env.BASE_PATH ?? '/consolation-prize/';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
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
