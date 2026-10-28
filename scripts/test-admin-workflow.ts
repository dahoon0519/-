import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// This is an EPHEMERAL LOCAL API integration test. It never contacts Netlify,
// Cloudinary, Google, or a live administrator account. The test signs a
// correctly authenticated session with an ephemeral, test-only HMAC secret.
const previousDirectory = process.cwd();
const directory = mkdtempSync(join(tmpdir(), 'portfolio-admin-workflow-'));
const previousEnv = Object.fromEntries(
  ['SESSION_SECRET', 'NETLIFY', 'NETLIFY_BLOBS_CONTEXT', 'NODE_ENV', 'APP_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].map(key => [key, process.env[key]])
);
process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
delete process.env.NETLIFY;
delete process.env.NETLIFY_BLOBS_CONTEXT;
delete process.env.APP_URL;
process.env.NODE_ENV = 'test';
process.chdir(directory);

let httpServer: any;
try {
  const { createExpressApp } = await import('../server/app');
  const { AUTHORIZED_ADMIN_EMAIL, createSignedSessionToken } = await import('../server/auth');
  const { setSimulateStorageFailureForTest } = await import('../server/storage');

  async function startServer() {
    const server = createExpressApp().listen(0, '127.0.0.1');
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    return server;
  }
  async function stopServer(server: any) {
    await new Promise<void>((resolve, reject) => server.close((error: Error) => error ? reject(error) : resolve()));
  }
  httpServer = await startServer();
  let base = 'http://127.0.0.1:' + httpServer.address().port;
  const csrfRes = await fetch(base + '/api/auth/csrf');
  assert.equal(csrfRes.status, 200);
  const { csrfToken } = await csrfRes.json() as { csrfToken: string };
  assert.match(csrfToken, /^[0-9a-f]{48}$/);

  const validToken = createSignedSessionToken({ email: AUTHORIZED_ADMIN_EMAIL, name: 'Test-only administrator' });
  const badToken = createSignedSessionToken({ email: 'attacker@example.invalid' });
  const headers = {
    Cookie: 'XSRF-TOKEN=' + csrfToken + '; admin_session=' + validToken,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  };
  const request = async (method: string, endpoint: string, body?: unknown, customHeaders = headers) => {
    const res = await fetch(base + endpoint, {
      method,
      headers: customHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() as any };
  };
  const pass = (message: string) => console.log('[PASS] ' + message);

  let res = await request('GET', '/api/content/published');
  assert.equal(res.status, 200);
  assert.equal(res.data.published, null);
  pass('Initial local published data is empty and isolated from production');

  res = await request('GET', '/api/content/draft', undefined, {});
  assert.equal(res.status, 401);
  res = await request('POST', '/api/content/publish', { content: { shouldNeverPublish: true } }, { Cookie: headers.Cookie, 'Content-Type': 'application/json' });
  assert.equal(res.status, 403);
  res = await request('GET', '/api/content/draft', undefined, { Cookie: 'admin_session=' + badToken });
  assert.equal(res.status, 401);
  pass('Authentication and CSRF protections remain enforced');
  // Validate the authenticated Cloudinary signing flow WITHOUT uploading a
  // media file or using any production API credentials.
  process.env.CLOUDINARY_CLOUD_NAME = 'local-test-cloud';
  process.env.CLOUDINARY_API_KEY = '1234567890123';
  process.env.CLOUDINARY_API_SECRET = 'local-test-cloudinary-secret';
  res = await request('POST', '/api/media/cloudinary/sign', {}, { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: 'XSRF-TOKEN=' + csrfToken });
  assert.equal(res.status, 401);
  res = await request('POST', '/api/media/cloudinary/sign', {});
  assert.equal(res.status, 200);
  assert.equal(res.data.cloudName, 'local-test-cloud');
  assert.equal(res.data.folder, 'dahoon-portfolio');
  assert.match(res.data.publicId, /^[0-9a-f-]{36}$/);
  const check = 'folder=' + res.data.folder + '&public_id=' + res.data.publicId + '&timestamp=' + res.data.timestamp + process.env.CLOUDINARY_API_SECRET;
  assert.equal(res.data.signature, crypto.createHash('sha1').update(check).digest('hex'));
  assert.equal(res.data.apiSecret, undefined);
  pass('Cloudinary upload signing requires administrator and returns valid test SHA-1 signature with no secret leakage');
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;


  const initial = {
    heroPhoto: {
      imageUrl: 'https://res.cloudinary.com/test/video/upload/v123/dahoon-portfolio/sample.mp4',
      mediaType: 'video',
      title: 'Safe test media',
    },
    cafeVisits: [{ id: 'test-visit', name: 'Test coffee shop', notes: 'Preserve data' }],
    lattePhotos: [{ id: 'test-latte', imageUrl: '/api/media/legacy.jpg', title: 'Legacy media' }],
    foodPhotos: [{ id: 'test-food', imageUrl: 'https://example.invalid/food.jpg', title: 'Test food' }],
  };

  res = await request('POST', '/api/content/draft', { content: initial });
  assert.equal(res.status, 200);
  assert.equal(res.data.draft.heroPhoto.imageUrl, initial.heroPhoto.imageUrl);
  res = await request('GET', '/api/content/published');
  assert.equal(res.data.published, null);
  res = await request('GET', '/api/content/draft');
  assert.equal(res.data.draft.cafeVisits[0].name, 'Test coffee shop');
  pass('Draft is persisted without changing published content');

  // Recreate the actual HTTP app to mimic a refresh/new session; storage is
  // read from a temporary file, not from React memory.
  await stopServer(httpServer);
  httpServer = await startServer();
  base = 'http://127.0.0.1:' + httpServer.address().port;
  res = await request('GET', '/api/content/draft');
  assert.equal(res.status, 200);
  assert.equal(res.data.draft.heroPhoto.mediaType, 'video');
  pass('Draft remains available after application server restart');

  res = await request('POST', '/api/content/publish', { content: res.data.draft, summary: 'Local integration test publish' });
  assert.equal(res.status, 200);
  const firstVersionId = res.data.version.id;
  assert.ok(firstVersionId);
  res = await request('GET', '/api/content/published');
  assert.equal(res.status, 200);
  assert.equal(res.data.published.heroPhoto.mediaType, 'video');
  assert.deepEqual(res.data.published.cafeVisits, initial.cafeVisits);
  assert.deepEqual(res.data.published.lattePhotos, initial.lattePhotos);
  assert.deepEqual(res.data.published.foodPhotos, initial.foodPhotos);
  res = await request('GET', '/api/content/draft');
  assert.equal(res.data.draft, null);
  res = await request('GET', '/api/content/history');
  assert.equal(res.status, 200);
  assert.equal(res.data.history[0].id, firstVersionId);
  pass('Publish persists all existing media/records, clears draft, and creates history');

  const changed = structuredClone(initial);
  changed.heroPhoto.title = 'Unpublished change';
  res = await request('POST', '/api/content/draft', { content: changed });
  assert.equal(res.status, 200);
  res = await request('GET', '/api/content/published');
  assert.equal(res.data.published.heroPhoto.title, initial.heroPhoto.title);
  pass('Editing a new draft never changes the previous published version');

  // A second publication followed by a history restore tests preservation.
  res = await request('POST', '/api/content/publish', { content: changed, summary: 'Local test second version' });
  assert.equal(res.status, 200);
  res = await request('POST', '/api/content/restore', { versionId: firstVersionId });
  assert.equal(res.status, 200);
  res = await request('GET', '/api/content/published');
  assert.equal(res.data.published.heroPhoto.title, initial.heroPhoto.title);
  assert.deepEqual(res.data.published.cafeVisits, initial.cafeVisits);
  res = await request('GET', '/api/content/history');
  assert.equal(res.data.history.length, 2);
  pass('Version restore recovers original media, coffee records and published text');

  // Server backup endpoints must be protected; no backend content is changed
  // when non-admin visitors attempt to export or restore documents.
  res = await request('GET', '/api/content/backups/export', undefined, {});
  assert.equal(res.status, 401);
  res = await request('POST', '/api/content/backups/create', {}, { Cookie: headers.Cookie, 'Content-Type': 'application/json' });
  assert.equal(res.status, 403);
  pass('Server backup export and restore actions require administrator and CSRF');

  res = await request('GET', '/api/content/backups/export');
  assert.equal(res.status, 200);
  assert.equal(res.data.format, 'dahoon-portfolio-documents');
  assert.equal(res.data.media, 'references-only');
  assert.equal(res.data.inquiries, 'excluded');
  assert.equal(res.data.published.heroPhoto.imageUrl, initial.heroPhoto.imageUrl);
  assert.equal(res.data.history.length, 2);
  pass('Server export includes published content/history and media URLs, never inquiry data');

  res = await request('GET', '/api/content/backups');
  assert.equal(res.status, 200);
  assert.ok(res.data.backups.length >= 3);
  assert.ok(res.data.backups.some((item: any) => item.reason === 'Before Publish'));
  assert.ok(res.data.backups.some((item: any) => item.reason === 'Before version restore'));
  pass('Automatic immutable recovery points exist before Publish and live Restore');

  const { defaultSiteContent } = await import('../src/data/defaultSiteContent');
  res = await request('POST', '/api/content/draft', { content: defaultSiteContent });
  assert.equal(res.status, 200);
  res = await request('POST', '/api/content/backups/create', {});
  assert.equal(res.status, 201);
  const manualBackupId: string = res.data.backup.id;
  assert.match(manualBackupId, /^[0-9]{13}-[a-f0-9-]{36}$/);
  res = await request('POST', '/api/content/draft', { content: initial });
  assert.equal(res.status, 200);
  res = await request('POST', '/api/content/backups/restore-draft', { id: manualBackupId, source: 'draft' });
  assert.equal(res.status, 200);
  res = await request('GET', '/api/content/draft');
  assert.equal(res.data.draft.hero.name, defaultSiteContent.hero.name);
  res = await request('GET', '/api/content/published');
  assert.equal(res.data.published.heroPhoto.title, initial.heroPhoto.title);
  pass('Manual recovery point restores a real document to Draft without modifying published data');

  res = await request('POST', '/api/content/backups/import-draft', {
    backup: { format: 'dahoon-portfolio-documents', version: 1, published: { invalid: true } },
    source: 'published',
  });
  assert.equal(res.status, 422);
  res = await request('POST', '/api/content/backups/import-draft', {
    backup: { format: 'dahoon-portfolio-documents', version: 1, published: defaultSiteContent },
    source: 'published',
  });
  assert.equal(res.status, 200);
  res = await request('GET', '/api/content/draft');
  assert.equal(res.data.draft.hero.name, defaultSiteContent.hero.name);
  res = await request('GET', '/api/content/published');
  assert.equal(res.data.published.heroPhoto.imageUrl, initial.heroPhoto.imageUrl);
  pass('Backup JSON import validates structure and restores only Draft, not the live homepage');

  // Verify failed persistent writes do not give a success response.
  setSimulateStorageFailureForTest(true);
  try {
    res = await request('POST', '/api/content/draft', { content: { dangerous: 'test' } });
    assert.equal(res.status, 503);
  } finally {
    setSimulateStorageFailureForTest(false);
  }
  res = await request('GET', '/api/content/published');
  assert.equal(res.data.published.heroPhoto.title, initial.heroPhoto.title);
  pass('Storage failures return 503 and preserve published data');

  // Nothing outside the temporary filesystem can have been written.
  const stored = JSON.parse(readFileSync(join(directory, '.data', 'portfolio-store.json'), 'utf8'));
  assert.equal(stored.published.heroPhoto.title, initial.heroPhoto.title);
  assert.equal(stored.history.length, 2);
  assert.ok(stored.safetyBackups.length >= 5);
  pass('All writes are contained within the ephemeral test directory');
  console.log('All authenticated LOCAL Draft/Publish/Restore HTTP integration tests passed.');
} finally {
  if (httpServer) await new Promise<void>(resolve => httpServer.close(() => resolve()));
  process.chdir(previousDirectory);
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(directory, { recursive: true, force: true });
}
