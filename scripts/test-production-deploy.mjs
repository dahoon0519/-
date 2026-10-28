import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Public-only production verification. This script never sends an authorized
// write request, accesses secrets, or modifies production content.
const base = 'https://dahoon-hospitality.netlify.app';
const expected = process.env.EXPECTED_COMMIT || '';
assert.match(expected, /^[a-f0-9]{40}$/, 'Expected full Git commit SHA');

async function json(path) {
  const res = await fetch(base + path, {
    redirect: 'error',
    signal: AbortSignal.timeout(12000),
    headers: { Accept: 'application/json' },
  });
  assert.equal(res.status, 200, path + ': expected HTTP 200, got ' + res.status);
  assert.match(res.headers.get('content-type') || '', /application\/json/, path + ': expected JSON');
  return { body: await res.json(), headers: res.headers };
}

let ready = false;
for (let attempt = 0; attempt < 55; attempt++) {
  try {
    const { body: health } = await json('/api/health');
    if (health.status === 'ok'
      && health.deployCommit === expected
      && health.deployContext === 'production'
      && health.isolatedStorage === false) {
      ready = true;
      break;
    }
    console.log('[WAIT] Production has not yet deployed the expected main commit');
  } catch (err) {
    console.log('[WAIT] Production not yet ready:', String(err.message).slice(0, 140));
  }
  if (attempt !== 54) await new Promise(resolve => setTimeout(resolve, 8000));
}
assert.ok(ready, 'Production did not deploy the exact merge commit in production storage mode');
console.log('[PASS] Production is serving the exact merged Git commit in production storage mode');

const { body: content, headers } = await json('/api/content/published');
assert.match(headers.get('cache-control') || '', /no-store/, 'Published content must be uncacheable');
assert.ok(content.published && typeof content.published === 'object', 'Published content must not disappear');
const sum = createHash('sha256').update(JSON.stringify(content.published)).digest('hex').slice(0, 16);
console.log('Production published content checksum:', sum);
assert.equal(sum, '15bdc4adf134acc8',
  'Content differs from the verified pre-merge baseline: investigate before any additional writes');
console.log('[PASS] Production published content matches pre-merge baseline');

const hero = content.published.heroPhoto;
assert.ok(hero?.imageUrl, 'Original representative media must be preserved');
assert.ok(hero.mediaType === 'video' || /\.(mp4|webm)(?:[?#]|$)/i.test(hero.imageUrl),
  'Expected the published representative video to remain configured');
console.log('[PASS] Existing representative video reference is preserved');

const { body: auth } = await json('/api/auth/me');
assert.equal(auth.authorized, false, 'Unauthenticated visitors must not receive an admin session');
const unauthorizedDraft = await fetch(base + '/api/content/draft', {
  redirect: 'error',
  signal: AbortSignal.timeout(12000),
});
assert.equal(unauthorizedDraft.status, 401);
console.log('[PASS] Production visitor cannot access administrator draft');

console.log('All read-only production deployment checks passed.');
