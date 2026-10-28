import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Exercise Netlify build-context generation in a temporary directory only.
// Never write to production Blobs or mutate the real generated source.
const root = mkdtempSync(join(tmpdir(), 'portfolio-storage-test-'));
try {
  const scripts = join(root, 'scripts');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(join(root, 'server'), { recursive: true });
  const source = readFileSync(new URL('./prepare-deploy-context.mjs', import.meta.url), 'utf8');
  const entry = join(scripts, 'prepare-deploy-context.mjs');
  writeFileSync(entry, source, 'utf8');

  const scenarios = [
    { label: 'PR #3 is isolated', env: { NETLIFY: 'true', CONTEXT: 'deploy-preview', REVIEW_ID: '3' }, success: true, expected: '"preview-pr3"' },
    { label: 'a different PR has a separate store', env: { NETLIFY: 'true', CONTEXT: 'deploy-preview', REVIEW_ID: '4' }, success: true, expected: '"preview-pr4"' },
    { label: 'missing review ID is rejected', env: { NETLIFY: 'true', CONTEXT: 'deploy-preview', REVIEW_ID: '' }, success: false },
    { label: 'production retains the original store', env: { NETLIFY: 'true', CONTEXT: 'production', REVIEW_ID: '3' }, success: true, expected: 'BUILD_STORAGE_NAMESPACE: string | null = null' },
    { label: 'missing Netlify context is rejected', env: { NETLIFY: 'true', CONTEXT: '', REVIEW_ID: '3' }, success: false },
    { label: 'branch deployments are isolated', env: { NETLIFY: 'true', CONTEXT: 'branch-deploy', BRANCH: 'feature/example' }, success: true, expected: '"nonprod-' },
    { label: 'local development is supported', env: { NETLIFY: '', CONTEXT: '', REVIEW_ID: '' }, success: true, expected: 'BUILD_DEPLOY_CONTEXT: string = "dev"' },
  ];
  for (const test of scenarios) {
    const env = { ...process.env, NETLIFY: '', CONTEXT: '', REVIEW_ID: '', BRANCH: '', HEAD: '', DEPLOY_ID: '', ...test.env };
    const result = spawnSync(process.execPath, [entry], { env, encoding: 'utf8' });
    const ok = result.status === 0;
    assert.equal(ok, test.success, `${test.label}: ${result.stderr || result.stdout}`);
    if (ok) {
      const generated = readFileSync(join(root, 'server', 'deployContext.ts'), 'utf8');
      assert.ok(generated.includes(test.expected), `${test.label}: wrong build metadata`);
    }
    console.log(`[PASS] ${test.label}`);
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
