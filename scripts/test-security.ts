import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

import {
  AUTHORIZED_ADMIN_EMAIL,
  getSessionSecret,
  createSignedSessionToken,
  verifySessionToken,
  verifyGoogleIdToken,
  MIN_SECRET_LENGTH,
} from '../server/auth';
import {
  portfolioStorage,
  setSimulateStorageFailureForTest,
} from '../server/storage';

const BASE_URL = 'http://localhost:3000';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('COMPREHENSIVE SECURITY & AUDIT VERIFICATION SUITE');
  console.log(`Sole Authorized Admin Account: ${AUTHORIZED_ADMIN_EMAIL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: SESSION_SECRET Security & Production Entropy Requirements
  // -------------------------------------------------------------------------
  console.log('--- Section 1: SESSION_SECRET Security & Validation ---');

  // 1a. Missing secret in production fails securely
  const originalEnvSecret = process.env.SESSION_SECRET;
  try {
    delete process.env.SESSION_SECRET;
    let threw = false;
    try {
      getSessionSecret(true); // force production check
    } catch (err: any) {
      threw = err.message.includes('SESSION_SECRET environment variable is missing');
    }
    assert(threw, 'Production mode fails securely if SESSION_SECRET is missing');

    // 1b. Weak/short secret in production (< 32 chars) fails securely
    process.env.SESSION_SECRET = 'short-1590-key';
    threw = false;
    try {
      getSessionSecret(true);
    } catch (err: any) {
      threw = err.message.includes('too short');
    }
    assert(threw, `Production mode strictly rejects secrets shorter than ${MIN_SECRET_LENGTH} characters`);

    // 1c. Insecure placeholder secret in production fails securely
    process.env.SESSION_SECRET = 'your-secure-32-plus-character-secret-key-for-sessions';
    threw = false;
    try {
      getSessionSecret(true);
    } catch (err: any) {
      threw = err.message.includes('insecure placeholder');
    }
    assert(threw, 'Production mode strictly rejects known placeholder secrets');

    // 1d. High entropy 32+ character secret succeeds
    const validTestSecret = crypto.randomBytes(32).toString('hex'); // 64 chars
    process.env.SESSION_SECRET = validTestSecret;
    const resolvedSecret = getSessionSecret(true);
    assert(resolvedSecret === validTestSecret, 'Production mode accepts high-entropy 256-bit secret');
  } finally {
    if (originalEnvSecret) {
      process.env.SESSION_SECRET = originalEnvSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 2: Google Authentication Configuration & Audience Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Section 2: Google Authentication Configuration ---');

  // 2a. Require configured GOOGLE_CLIENT_ID
  const origClientId = process.env.GOOGLE_CLIENT_ID;
  const origViteClientId = process.env.VITE_GOOGLE_CLIENT_ID;
  try {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.VITE_GOOGLE_CLIENT_ID;

    const noClientRes = await verifyGoogleIdToken('sample-fake-id-token');
    assert(
      Boolean(noClientRes.valid === false && noClientRes.error?.includes('GOOGLE_CLIENT_ID is not configured')),
      'verifyGoogleIdToken fails securely when GOOGLE_CLIENT_ID is missing (disallows unvalidated audience)'
    );
  } finally {
    if (origClientId) process.env.GOOGLE_CLIENT_ID = origClientId;
    if (origViteClientId) process.env.VITE_GOOGLE_CLIENT_ID = origViteClientId;
  }

  // 2b. Attempt with invalid token when client ID is provided
  process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
  const badTokenRes = await verifyGoogleIdToken('malformed-token');
  assert(badTokenRes.valid === false, 'Malformed Google ID token is strictly rejected');

  // -------------------------------------------------------------------------
  // Fetch CSRF Token helper for API testing
  // -------------------------------------------------------------------------
  let csrfCookie = '';
  let csrfTokenValue = '';

  try {
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfHeaders = csrfRes.headers.get('set-cookie') || '';
    const match = csrfHeaders.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      csrfTokenValue = match[1];
      csrfCookie = `XSRF-TOKEN=${csrfTokenValue}`;
    }
    const body = await csrfRes.json();
    if (!csrfTokenValue && body.csrfToken) {
      csrfTokenValue = body.csrfToken;
      csrfCookie = `XSRF-TOKEN=${csrfTokenValue}`;
    }
  } catch (err) {
    console.warn('Could not connect to running server on port 3000:', err);
  }

  // -------------------------------------------------------------------------
  // SECTION 3: CSRF Protection on State-Changing Endpoints
  // -------------------------------------------------------------------------
  console.log('\n--- Section 3: CSRF Protection on Mutating Endpoints ---');
  try {
    // 3a. POST /api/content/publish without CSRF token is rejected with 403 Forbidden
    const noCsrfRes = await fetch(`${BASE_URL}/api/content/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: {} }),
    });
    assert(
      noCsrfRes.status === 403,
      'State-changing POST /api/content/publish without CSRF headers is rejected with 403 Forbidden',
      `Got status ${noCsrfRes.status}`
    );

    // 3b. POST with mismatched CSRF header & cookie is rejected with 403 Forbidden
    const badCsrfRes = await fetch(`${BASE_URL}/api/content/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'attacker-forged-token-value-1234567890abcdef',
        Cookie: 'XSRF-TOKEN=different-server-issued-token-1234567890abcdef',
      },
      body: JSON.stringify({ content: {} }),
    });
    assert(
      badCsrfRes.status === 403,
      'POST with mismatched CSRF token is rejected with 403 Forbidden',
      `Got status ${badCsrfRes.status}`
    );
  } catch (err: any) {
    assert(false, 'Section 3 execution error', err.message);
  }

  // -------------------------------------------------------------------------
  // SECTION 4: Session Security (HttpOnly Cookies & Removal of Bearer Mechanism)
  // -------------------------------------------------------------------------
  console.log('\n--- Section 4: Pure HttpOnly Session Cookie Enforcement ---');
  try {
    const validAdminToken = createSignedSessionToken({
      email: AUTHORIZED_ADMIN_EMAIL,
      name: 'HAN DAHOON',
    });

    // 4a. Authorization: Bearer token is NO LONGER accepted for admin mutations
    // (Admin privileges require the HttpOnly session cookie)
    const bearerOnlyRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: {
        Authorization: `Bearer ${validAdminToken}`,
        'X-CSRF-Token': csrfTokenValue,
        Cookie: csrfCookie,
      },
    });
    assert(
      bearerOnlyRes.status === 401,
      'Authorization: Bearer header is rejected for admin operations (HttpOnly cookie strictly required)',
      `Got status ${bearerOnlyRes.status}`
    );

    // 4b. Valid HttpOnly admin_session cookie is accepted
    const cookieHeader = `${csrfCookie}; admin_session=${validAdminToken}`;
    const cookieDraftRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: {
        Cookie: cookieHeader,
      },
    });
    assert(
      cookieDraftRes.status === 200,
      'Valid HttpOnly admin_session cookie grants access to GET /api/content/draft',
      `Got status ${cookieDraftRes.status}`
    );

    // 4c. Session cookie with unauthorized email is rejected
    const unauthorizedToken = createSignedSessionToken({
      email: 'attacker@evil.com',
      name: 'Attacker',
    });
    const unauthorizedRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: {
        Cookie: `${csrfCookie}; admin_session=${unauthorizedToken}`,
      },
    });
    assert(
      unauthorizedRes.status === 401,
      'Session cookie for attacker@evil.com is rejected with 401 Unauthorized',
      `Got status ${unauthorizedRes.status}`
    );

    // 4d. Session cookie for legacy email dhgh159030@gmail.com is rejected
    const oldFallbackToken = createSignedSessionToken({
      email: 'dhgh159030@gmail.com',
      name: 'Old Admin',
    });
    const oldRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: {
        Cookie: `${csrfCookie}; admin_session=${oldFallbackToken}`,
      },
    });
    assert(
      oldRes.status === 401,
      'Session cookie for former email dhgh159030@gmail.com is strictly rejected with 401',
      `Got status ${oldRes.status}`
    );

    // 4e. Expired session cookie is rejected
    const expiredPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      issuedAt: Date.now() - 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 5000, // expired
      sessionId: 'expired-test-id',
    };
    const expB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const secret = getSessionSecret();
    const expSig = crypto.createHmac('sha256', secret).update(expB64).digest('base64url');
    const expiredToken = `${expB64}.${expSig}`;

    const expiredRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: {
        Cookie: `${csrfCookie}; admin_session=${expiredToken}`,
      },
    });
    assert(
      expiredRes.status === 401,
      'Expired session cookie is rejected with 401 Unauthorized',
      `Got status ${expiredRes.status}`
    );

    // 4f. Tampered HMAC signature is rejected
    const [origB64] = validAdminToken.split('.');
    const tamperedToken = `${origB64}.forgedsignature1234567890abcdef`;
    const tamperedRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: {
        Cookie: `${csrfCookie}; admin_session=${tamperedToken}`,
      },
    });
    assert(
      tamperedRes.status === 401,
      'Tampered session cookie HMAC signature is rejected with 401 Unauthorized',
      `Got status ${tamperedRes.status}`
    );
  } catch (err: any) {
    assert(false, 'Section 4 execution error', err.message);
  }

  // -------------------------------------------------------------------------
  // SECTION 5: Netlify Blobs & Persistent Storage Reliability
  // -------------------------------------------------------------------------
  console.log('\n--- Section 5: Persistent Storage Failure & Error Responses ---');
  try {
    const validAdminToken = createSignedSessionToken({
      email: AUTHORIZED_ADMIN_EMAIL,
      name: 'HAN DAHOON',
    });
    const cookieHeader = `${csrfCookie}; admin_session=${validAdminToken}`;

    // 5a. Normal save works in local dev
    const saveRes = await fetch(`${BASE_URL}/api/content/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfTokenValue,
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ content: { testProp: 'persisted-value-ok' } }),
    });
    assert(saveRes.status === 200, 'Admin can save draft when persistent storage is functional');

    // 5b. When persistent storage fails, API must return clear 503 error (NO silent fallback)
    const failedPublishRes = await fetch(`${BASE_URL}/api/content/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfTokenValue,
        'X-Test-Simulate-Storage-Failure': 'true',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ content: { testProp: 'should-fail-gracefully' } }),
    });
    const failedData = await failedPublishRes.json();
    assert(
      failedPublishRes.status === 503,
      'API returns HTTP 503 Service Unavailable when persistent storage fails (disallowing silent disk fallback)',
      `Status: ${failedPublishRes.status}`
    );
    assert(
      Boolean(failedData.error?.includes('Persistent storage unavailable')),
      'API error payload clearly identifies persistent storage unavailability'
    );

    // 5c. Unit check: portfolioStorage directly in production throws on Netlify Blobs failure
    setSimulateStorageFailureForTest(true);
    let directStorageThrew = false;
    try {
      await portfolioStorage.setPublishedContent({ test: 1 });
    } catch (err: any) {
      directStorageThrew = err.message.includes('Simulated persistent storage failure');
    }
    assert(directStorageThrew, 'portfolioStorage.setPublishedContent strictly throws and refuses disk fallback when storage fails');
    setSimulateStorageFailureForTest(false);

    // Reset storage failure simulation
    setSimulateStorageFailureForTest(false);

    // Clean up draft
    await fetch(`${BASE_URL}/api/content/draft`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfTokenValue,
        Cookie: cookieHeader,
      },
    });
  } catch (err: any) {
    assert(false, 'Section 5 execution error', err.message);
  }

  // -------------------------------------------------------------------------
  // SECTION 6: Public Visitor vs Admin Isolation
  // -------------------------------------------------------------------------
  console.log('\n--- Section 6: Public Visitor Access & Isolation ---');
  try {
    // 6a. Public visitor can read published content
    const pubRes = await fetch(`${BASE_URL}/api/content/published`);
    assert(pubRes.status === 200, 'Visitor can read published content without credentials');

    // 6b. Public visitor can submit contact inquiry with CSRF
    const inqRes = await fetch(`${BASE_URL}/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfTokenValue,
        Cookie: csrfCookie,
      },
      body: JSON.stringify({
        name: 'Han Visitor',
        email: 'visitor@example.com',
        message: 'Inquiry for barista consulting.',
      }),
    });
    assert(inqRes.status === 200, 'Visitor can submit contact inquiry with CSRF protection');

    // 6c. Public visitor cannot read inquiries
    const readInqRes = await fetch(`${BASE_URL}/api/inquiries`);
    assert(readInqRes.status === 401, 'Logged-out visitor cannot read contact inquiries (401 Unauthorized)');

    // 6d. GET /api/auth/me returns authorized: false for visitor
    const meRes = await fetch(`${BASE_URL}/api/auth/me`);
    const meData = await meRes.json();
    assert(meData.authorized === false && meData.user === null, 'GET /api/auth/me returns authorized: false for visitors');
  } catch (err: any) {
    assert(false, 'Section 6 execution error', err.message);
  }

  console.log('\n====================================================');
  console.log(`TOTAL SECURITY TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
