/**
 * A SERVER ALREADY ON THE PORT IS SOMEBODY ELSE'S (errata 143, and again errata 248). The loop above takes the first
 * answer on the port as its own server coming up. A dev server left behind by an earlier run -- in this checkout or in
 * another worktree -- answers at once, the --strictPort child exits unnoticed, and the whole run is played against
 * whatever tree that server was started in. On 2026-11-10 a replay in one worktree was played against another's
 * content for a quarter of an hour, and reported breaks that were not there. So: nothing may be listening before we
 * start, and what we start is stopped whole.
 */
export async function refuseAnothersServer(url) {
  let answered = false;
  try {
    await fetch(`${url}/`, { signal: AbortSignal.timeout(1500) });
    answered = true;
  } catch { /* nothing there: the port is ours to take */ }
  if (answered) {
    throw new Error(`something is already answering on ${url}: a dev server left over from another run would serve `
      + 'that tree, not this one. Stop it (pkill -f "vite --port"), or set GAUNTLET_PORT to a free port.');
  }
}

/** Stops the server and everything it started: npm's own SIGTERM left vite running on the port. */
export function stopGroup(child) {
  try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
}
