import assert from 'node:assert/strict';

// Isolated client-side failures: fake storage, fake network and a test identity.
const entries = new Map<string, string>();
const fakeStorage = {
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => { entries.set(key, String(value)); },
  removeItem: (key: string) => { entries.delete(key); },
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: fakeStorage });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: fakeStorage });
Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie: 'XSRF-TOKEN=test-token' } });
const originalFetch = globalThis.fetch;
const requests: Array<{ path: string; method: string }> = [];
let allowDelete = false;
globalThis.fetch = (async (input: string | URL | Request, options?: RequestInit) => {
  const path = String(input);
  const method = options?.method || 'GET';
  requests.push({ path, method });
  const success = path === '/api/content/draft' && method === 'DELETE' && allowDelete;
  return new Response(JSON.stringify(success ? { success: true } : { error: 'simulated storage failure' }), {
    status: success ? 200 : 503, headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

try {
  const { authService, AUTHORIZED_ADMIN_EMAIL } = await import('../src/services/authService');
  const { discardDraftContent, restoreContentVersion } = await import('../src/services/siteContentService');
  authService.setAdminUser({ email: AUTHORIZED_ADMIN_EMAIL, name: 'Synthetic test admin', loginMethod: 'google' });
  fakeStorage.setItem('dahoon_site_content_draft', '{"sentinel":"keep"}');
  fakeStorage.setItem('dahoon_site_content_history', JSON.stringify([{ id: 'old-version', versionNumber: 1, content: { shouldNotPublish: true } }]));

  await assert.rejects(discardDraftContent(), /simulated storage failure/);
  assert.equal(fakeStorage.getItem('dahoon_site_content_draft'), '{"sentinel":"keep"}');
  console.log('[PASS] Failed draft deletion is reported and the local draft remains');

  await assert.rejects(restoreContentVersion('old-version'), /simulated storage failure/);
  assert.ok(!requests.some(r => r.path === '/api/content/publish'));
  console.log('[PASS] Failed server restore never falls back to publishing cached content');

  allowDelete = true;
  await discardDraftContent();
  assert.equal(fakeStorage.getItem('dahoon_site_content_draft'), null);
  console.log('[PASS] Local draft is cleared after confirmed server deletion');
  authService.setAdminUser(null);
} finally {
  globalThis.fetch = originalFetch;
}
