import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Local-only synthetic storage and session; never uses live accounts or data.
const oldDirectory = process.cwd();
const directory = mkdtempSync(join(tmpdir(), 'portfolio-backup-parts-'));
const oldEnv = Object.fromEntries(['SESSION_SECRET', 'NETLIFY', 'NETLIFY_BLOBS_CONTEXT', 'NODE_ENV', 'APP_URL'].map(k => [k, process.env[k]]));
process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
delete process.env.NETLIFY;
delete process.env.NETLIFY_BLOBS_CONTEXT;
delete process.env.APP_URL;
process.env.NODE_ENV = 'test';
process.chdir(directory);

let server: any;
try {
  const { createExpressApp } = await import('../server/app');
  const { AUTHORIZED_ADMIN_EMAIL, createSignedSessionToken } = await import('../server/auth');
  const { portfolioStorage } = await import('../server/storage');
  const { downloadServerBackup } = await import('../src/services/backupExport');
  const { defaultSiteContent } = await import('../src/data/defaultSiteContent');

  const published = structuredClone(defaultSiteContent);
  published.hero.name = 'Synthetic test only — 다훈 ☕';
  published.heroPhoto!.imageUrl = 'data:image/png;base64,QUJDREVGRw==';
  const draft = structuredClone(published);
  draft.hero.name = 'Unpublished draft — 日本語';
  const largeText = '写真と珈琲 ☕'.repeat(180_000);
  const history = Array.from({ length: 3 }, (_, index) => ({ id: `test-${index}`, versionNumber: index + 1, content: { text: largeText } }));
  await portfolioStorage.setPublishedContent(published);
  await portfolioStorage.setDraftContent(draft);
  await portfolioStorage.setVersionHistory(history);

  server = createExpressApp().listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const session = createSignedSessionToken({ email: AUTHORIZED_ADMIN_EMAIL, name: 'Test-only administrator' });
  const headers = { Cookie: `admin_session=${session}` };
  const unauthorized = await fetch(base + '/api/content/backups/export-part?part=0');
  assert.equal(unauthorized.status, 401);

  let partRequests = 0;
  const getPart = async (path: string) => {
    const response = await fetch(base + path, { headers });
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.ok(Buffer.byteLength(text) < 6_000_000, 'Individual response exceeds safe size');
    partRequests++;
    return JSON.parse(text);
  };
  const bytes = await downloadServerBackup(undefined, getPart);
  assert.ok(bytes.byteLength > 6_291_556, 'Fixture must exceed the production response limit');
  assert.ok(partRequests > 1);
  const backup = JSON.parse(new TextDecoder().decode(bytes));
  assert.equal(backup.format, 'dahoon-portfolio-documents');
  assert.deepEqual(backup.published, await portfolioStorage.getPublishedContent());
  assert.deepEqual(backup.draft, await portfolioStorage.getDraftContent());
  assert.deepEqual(backup.history, history);
  assert.equal(backup.inquiries, 'excluded');
  console.log('[PASS] Large authenticated backup is reconstructed intact from safe-sized parts');

  const first = await getPart('/api/content/backups/export-part?part=0');
  await portfolioStorage.setVersionHistory([...history, { id: 'changed-during-export' }]);
  const query = new URLSearchParams({ part: '1', hash: first.hash, exportedAt: first.exportedAt });
  const conflict = await fetch(base + '/api/content/backups/export-part?' + query.toString(), { headers });
  assert.equal(conflict.status, 409);
  console.log('[PASS] A changing server snapshot cannot be combined into a misleading backup');

  await portfolioStorage.setVersionHistory(history);
  let tampered = false;
  await assert.rejects(downloadServerBackup(undefined, async (path) => {
    const part = await getPart(path);
    if (!tampered) {
      tampered = true;
      part.data = (part.data[0] === 'A' ? 'B' : 'A') + part.data.slice(1);
    }
    return part;
  }), /integrity/i);
  assert.deepEqual(await portfolioStorage.getPublishedContent(), backup.published);
  assert.deepEqual(await portfolioStorage.getDraftContent(), backup.draft);
  console.log('[PASS] Corrupt data is rejected and export leaves published and draft content unchanged');
} finally {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  process.chdir(oldDirectory);
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(directory, { recursive: true, force: true });
}
