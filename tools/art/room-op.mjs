// One image operation for a room asset under errata 72 (four per room, one asset id).
// No Authorization header: the environment's network secret is attached by the agent
// proxy, so the key never enters the session (Tyler, 2026-11-01). Checks the cap and the
// global baseline BEFORE the call, transmits every required baseline reference, and records
// the row in art/staging/ledger.json whatever the result.
// usage: NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs <spec.json>
// spec: { assetId, subject, role, purpose, baselineRoom, promptFile, out, size, images: [...], derivedFrom? }
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

const R = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const S = await import(`${R}/tools/art/staging.mjs`);
const I = await import(`${R}/tools/art/openai-image.mjs`);
const B = await import(`${R}/tools/art/baseline.mjs`);
const spec = JSON.parse(readFileSync(resolve(R, process.argv[2]), 'utf8'));
const model = 'gpt-image-2';
const b = S.budgetFor(spec.assetId);
if (!b.ok) { console.error('REFUSED:', b.reasons.join(' ')); process.exit(2); }
S.assertRecordable({ assetId: spec.assetId, subject: spec.subject, operation: 'edit', model, role: spec.role,
  ...(spec.derivedFrom ? { derivedFrom: spec.derivedFrom } : {}) });
I.assertStaged(spec.out);
const base = B.requireBaseline(spec.baselineRoom, { purpose: spec.purpose });
const images = [...spec.images];
for (const ref of base.references) if (!images.includes(ref.path)) images.push(ref.path);
const text = readFileSync(resolve(R, spec.promptFile), 'utf8');
const form = new FormData();
form.append('model', model); form.append('prompt', text); form.append('size', spec.size);
const references = [];
for (const p of images) {
  const bytes = readFileSync(resolve(R, p));
  references.push({ path: p, hash: I.sha256(bytes), transmitted: true });
  form.append('image[]', new Blob([bytes], { type: 'image/png' }), basename(p));
}
// STREAMED. An eight-reference edit takes longer than the ~30 s an idle connection
// survives on the way back through the proxy: two unstreamed calls on 2026-11-01 came
// back 502 at 30.7 s with no image (doc 36 Q148). Partial-image events keep the
// response moving; the operation is the same one, and only the completed image is kept.
form.append('stream', 'true');
form.append('partial_images', '2');
const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', body: form });
if (!res.ok) { console.error(res.status, (await res.text()).slice(0, 2000)); process.exit(3); }
let completed = null;
let buffer = '';
const decoder = new TextDecoder();
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true });
  let cut;
  while ((cut = buffer.indexOf('\n\n')) >= 0) {
    const event = buffer.slice(0, cut);
    buffer = buffer.slice(cut + 2);
    const data = event.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
    if (!data || data === '[DONE]') continue;
    const parsed = JSON.parse(data);
    if (parsed.type?.endsWith('.partial_image')) process.stderr.write(`  partial ${parsed.partial_image_index}\n`);
    if (parsed.type?.endsWith('.completed')) completed = parsed;
    if (parsed.error) { console.error(JSON.stringify(parsed.error)); process.exit(3); }
  }
}
if (!completed?.b64_json) { console.error('the stream ended without a completed image'); process.exit(3); }
const json = { data: [{ b64_json: completed.b64_json, revised_prompt: completed.revised_prompt }], usage: completed.usage };
const bytes = Buffer.from(json.data[0].b64_json, 'base64');
mkdirSync(resolve(R, dirname(spec.out)), { recursive: true });
writeFileSync(resolve(R, spec.out), bytes);
const row = S.record({ assetId: spec.assetId, subject: spec.subject, role: spec.role, operation: 'edit', model,
  ...(spec.derivedFrom ? { derivedFrom: spec.derivedFrom } : {}),
  parameters: { size: spec.size, quality: null, stream: true, partial_images: 2 }, prompt: null, promptFile: spec.promptFile,
  promptHash: I.sha256(Buffer.from(text)), references,
  baseline: { room: spec.baselineRoom, purpose: spec.purpose, visualType: base.visualType,
    ...(base.pendingAcknowledged ? { pendingAcknowledged: base.pendingAcknowledged } : {}),
    slots: base.references.map((r) => ({ slot: r.slot, role: r.role, path: r.path, hash: r.hash, transmitted: true })) },
  mask: null, sourceHash: references[0]?.hash ?? null, sourcePath: references[0]?.path ?? null,
  out: spec.out, outputHash: I.sha256(bytes), bytes: bytes.length, usage: json.usage ?? null,
  revisedPrompt: json.data[0].revised_prompt ?? null, at: new Date().toISOString(),
  auth: 'environment network secret attached by the agent proxy; no key in the session',
  authorizedBy: 'Tyler, errata 72 C: four operations per room under one asset id' });
console.log('recorded', spec.assetId, 'attempt', row.attempt, spec.out, row.outputHash, JSON.stringify(row.usage));
