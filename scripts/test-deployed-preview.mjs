import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const prNumber = process.env.PR_NUMBER?.trim();
const commit = process.env.EXPECTED_COMMIT?.trim();
assert.match(prNumber || '', /^[1-9][0-9]*$/, 'A PR number is required.');
assert.match(commit || '', /^[a-f0-9]{40}$/, 'Full expected commit SHA is required.');

const preview = `https://deploy-preview-${prNumber}--dahoon-hospitality.netlify.app`;
const production = 'https://dahoon-hospitality.netlify.app';

async function request(url, options = {}) {
  return fetch(url, {
    ...options,
    redirect: 'error',
    signal: AbortSignal.timeout(12000),
    headers: { Accept: 'application/json', ...(options.headers || {}) },
  });
}

async function readJSON(url) {
  const response = await request(url);
  assert.equal(response.status, 200, `${url} returned HTTP ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /application\/json/);
  return { data: await response.json(), headers: response.headers };
}

async function waitForExactPreviewDeploy() {
  const attempts = 36;
  for (let i = 1; i <= attempts; i++) {
    try {
      const { data } = await readJSON(`${preview}/api/health`);
      if (data.status === 'ok'
          && data.deployContext === 'deploy-preview'
          && data.isolatedStorage === true
          && data.deployCommit === commit) {
        console.log('[PASS] Preview API is healthy and running the exact PR commit in isolated mode');
        return;
      }
      console.log(`[WAIT] Preview returned a different deploy (${i}/${attempts}); retrying`);
    } catch (error) {
      console.log(`[WAIT] Preview not ready yet (${i}/${attempts}): ${error.message}`);
    }
    if (i < attempts) await new Promise(resolve => setTimeout(resolve, 8000));
  }
  throw new Error('Timed out awaiting this PR commit with preview isolation enabled');
}

function digestContent(payload) {
  return createHash('sha256').update(JSON.stringify(payload ?? null)).digest('hex').slice(0, 16);
}

async function assertDenied(url, options) {
  // Netlify may briefly return a routing 404 immediately after the Functions
  // bundle becomes healthy. Retry this transient status, but do not accept it
  // as evidence of functioning authorization checks.
  let lastStatus = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await request(url, options);
    lastStatus = response.status;
    if ([401, 403].includes(response.status)) {
      console.log(`[PASS] ${options.method} ${new URL(url).pathname} without admin session is denied (HTTP ${response.status})`);
      return;
    }
    if (response.status !== 404 || attempt === 5) break;
    console.log(`[WAIT] Routing 404 for ${options.method} ${new URL(url).pathname}; retrying authentication check`);
    await new Promise(resolve => setTimeout(resolve, 3500));
  }
  assert.fail(`Expected HTTP 401/403 for unauthenticated ${options.method} ${url}; got ${lastStatus}`);
}

await waitForExactPreviewDeploy();

const previewPublished = await readJSON(`${preview}/api/content/published`);
const productionPublished = await readJSON(`${production}/api/content/published`);
assert.ok(Object.hasOwn(previewPublished.data, 'published'), 'Preview published response malformed');
assert.ok(Object.hasOwn(productionPublished.data, 'published'), 'Production published response malformed');
assert.match(previewPublished.headers.get('cache-control') || '', /no-store/);
console.log('[PASS] Both production and preview published endpoints return JSON');
console.log('[PASS] Preview published JSON is not HTTP-cached');
console.log('Production published content checksum:', digestContent(productionPublished.data.published));
console.log('Preview published content checksum:   ', digestContent(previewPublished.data.published));
console.log('Content currently identical:', digestContent(productionPublished.data.published) === digestContent(previewPublished.data.published));

await assertDenied(`${preview}/api/content/draft`, { method: 'GET' });
await assertDenied(`${preview}/api/content/draft`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
await assertDenied(`${preview}/api/content/publish`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
await assertDenied(`${preview}/api/media/cloudinary/sign`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
await assertDenied(`${preview}/api/content/draft`, { method: 'DELETE' });

console.log('All read-only preview/production HTTP smoke checks passed.');
