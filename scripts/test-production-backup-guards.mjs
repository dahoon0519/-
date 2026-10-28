import assert from 'node:assert/strict';

// This security smoke test sends no authenticated requests and never writes
// backups, drafts, published content, or media. All POSTs must be rejected
// by the server's administrator session/CSRF middleware.
const base = 'https://dahoon-hospitality.netlify.app';
const cases = [
  ['GET', '/api/content/backups'],
  ['GET', '/api/content/backups/export'],
  ['POST', '/api/content/backups/create'],
  ['POST', '/api/content/backups/restore-draft'],
  ['POST', '/api/content/backups/import-draft'],
  ['POST', '/api/media/cloudinary/sign'],
];
for (const [method, path] of cases) {
  const response = await fetch(base + path, {
    method,
    signal: AbortSignal.timeout(12000),
    redirect: 'error',
    headers: { Accept: 'application/json', ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: '{}' } : {}),
  });
  assert.ok([401, 403].includes(response.status), `${method} ${path}: expected denied, got ${response.status}`);
  console.log('[PASS] Unauthorized ' + method + ' ' + path + ' denied (HTTP ' + response.status + ')');
}
console.log('All production backup and Cloudinary security smoke checks passed.');
