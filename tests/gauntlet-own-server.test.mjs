import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import test from 'node:test';

import { refuseAnothersServer } from '../tools/gauntlet/own-server.mjs';

/**
 * A REPLAY IS PLAYED AGAINST ITS OWN TREE (errata 143; again errata 248).
 *
 * Each gauntlet starts a dev server on a fixed port and took the first answer on that port as its own. A server left
 * behind by an earlier run answers at once, so the run was played against whatever checkout that server belonged to:
 * on 2026-11-10 a replay in one worktree reported five breaks that were another worktree's content. Stopping the
 * server stopped npm and left vite listening, which is how one was left behind every time.
 */
test('a server already answering on the port is refused, and a free port is not', async () => {
  const other = createServer((_request, response) => { response.end('somebody else'); });
  await new Promise((ready) => other.listen(0, '127.0.0.1', ready));
  const { port } = other.address();
  await assert.rejects(refuseAnothersServer(`http://127.0.0.1:${port}`), /already answering/);
  await new Promise((closed) => other.close(closed));
  await refuseAnothersServer(`http://127.0.0.1:${port}`);
});

test('both gauntlets ask before they start one, start it in its own group, and stop the group', () => {
  for (const file of ['tools/gauntlet/proof.mjs', 'tools/gauntlet/run.mjs']) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const serve = source.slice(source.indexOf('async function serve('));
    const body = serve.slice(0, serve.indexOf('\n}\n'));
    assert.ok(body.indexOf('await refuseAnothersServer(') > 0 && body.indexOf('await refuseAnothersServer(') < body.indexOf('spawn('),
      `${file}: asks before it spawns`);
    assert.match(body, /detached: true/, `${file}: its own process group`);
    assert.match(body, /stop: \(\) => stopGroup\(child\)/, `${file}: stopped whole`);
  }
});
