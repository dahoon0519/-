import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

import {
  AUTHORIZED_ADMIN_EMAIL,
  SESSION_SECRET,
  createSignedSessionToken,
  verifySessionToken,
} from '../server/auth';

const BASE_URL = 'http://localhost:3000';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED SECURITY & AUTHENTICATION AUDIT TESTS');
  console.log(`Target Authorized Admin Email: ${AUTHORIZED_ADMIN_EMAIL}`);
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
  // TEST 1: Logged-out visitor cannot perform administrator operations
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 1: Logged-out visitor authorization restrictions ---');
  try {
    const draftRes = await fetch(`${BASE_URL}/api/content/draft`);
    assert(draftRes.status === 401, 'Unauthenticated GET /api/content/draft returns 401 Unauthorized', `Got status ${draftRes.status}`);

    const pubRes = await fetch(`${BASE_URL}/api/content/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { test: 'malicious-overwrite' } }),
    });
    assert(pubRes.status === 401, 'Unauthenticated POST /api/content/publish returns 401 Unauthorized', `Got status ${pubRes.status}`);

    const inqRes = await fetch(`${BASE_URL}/api/inquiries`);
    assert(inqRes.status === 401, 'Unauthenticated GET /api/inquiries returns 401 Unauthorized', `Got status ${inqRes.status}`);

    const meRes = await fetch(`${BASE_URL}/api/auth/me`);
    const meData = await meRes.json();
    assert(meData.authorized === false && meData.user === null, 'GET /api/auth/me for logged-out visitor returns authorized: false');
  } catch (err: any) {
    assert(false, 'Scenario 1 network execution', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Google account other than dahoon0519@gmail.com is denied admin access
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Unauthorized account access rejection ---');
  try {
    // Generate a token signed for an unauthorized account
    const unauthorizedToken = createSignedSessionToken({
      email: 'attacker@evil.com',
      name: 'Malicious Attacker',
    });

    const verifyResult = verifySessionToken(unauthorizedToken);
    assert(verifyResult.valid === false, 'Session token for attacker@evil.com is rejected by verifySessionToken');

    const reqRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: { Authorization: `Bearer ${unauthorizedToken}` },
    });
    assert(reqRes.status === 401, 'Request with attacker@evil.com token is rejected with 401 by API middleware');

    // Test secondary old fallback dhgh159030@gmail.com is also rejected
    const oldFallbackToken = createSignedSessionToken({
      email: 'dhgh159030@gmail.com',
      name: 'Old Fallback Admin',
    });
    const oldVerify = verifySessionToken(oldFallbackToken);
    assert(oldVerify.valid === false, 'Former fallback email dhgh159030@gmail.com is strictly rejected');
  } catch (err: any) {
    assert(false, 'Scenario 2 execution', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Editing localStorage / sessionStorage cannot grant administrator privileges
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Browser storage tampering resistance ---');
  try {
    // Setting arbitrary fake tokens in Authorization header (simulating localStorage value sent)
    const fakeToken = 'adm-fake-client-hash-99999';
    const fakeRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    assert(fakeRes.status === 401, 'Client-invented storage token is rejected with 401', `Status: ${fakeRes.status}`);

    const fakeCookieRes = await fetch(`${BASE_URL}/api/content/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'admin_session=dahoon_is_admin=true; admin_email=dahoon0519@gmail.com',
      },
      body: JSON.stringify({ content: {} }),
    });
    assert(fakeCookieRes.status === 401, 'Manipulated cookie string without cryptographic HMAC is rejected with 401');
  } catch (err: any) {
    assert(false, 'Scenario 3 execution', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Forged, invalid, expired, or modified authentication tokens are rejected
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Forged and modified token cryptographic rejection ---');
  try {
    // 4a. Malformed token (not two parts)
    const malformed = verifySessionToken('invalid-token-without-dot');
    assert(malformed.valid === false, 'Malformed single-part token rejected');

    // 4b. Valid session modified payload (tampered base64)
    const validAdminToken = createSignedSessionToken({
      email: AUTHORIZED_ADMIN_EMAIL,
      name: 'HAN DAHOON',
    });
    const [payloadB64, sig] = validAdminToken.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    // Attacker tampers payload
    decoded.email = 'tampered@attacker.com';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedToken = `${tamperedPayloadB64}.${sig}`;

    const tamperedResult = verifySessionToken(tamperedToken);
    assert(tamperedResult.valid === false, 'Tampered token with forged payload is cryptographically rejected by HMAC signature check');

    // 4c. Expired token
    const expiredPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      issuedAt: Date.now() - 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1000, // expired 1s ago
      sessionId: 'test-session-expired',
    };
    const expiredPayloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const secret = SESSION_SECRET;
    const expiredSig = crypto.createHmac('sha256', secret).update(expiredPayloadB64).digest('base64url');
    const expiredToken = `${expiredPayloadB64}.${expiredSig}`;

    const expiredResult = verifySessionToken(expiredToken);
    assert(Boolean(expiredResult.valid === false && expiredResult.error?.includes('expired')), 'Expired session token is rejected');
  } catch (err: any) {
    assert(false, 'Scenario 4 execution', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Unauthorized API requests cannot modify portfolio content
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Unauthorized mutation rejection ---');
  try {
    const postDraft = await fetch(`${BASE_URL}/api/content/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { title: 'Hacked' } }),
    });
    assert(postDraft.status === 401, 'Unauthorized POST /api/content/draft rejected with 401');

    const deleteDraft = await fetch(`${BASE_URL}/api/content/draft`, {
      method: 'DELETE',
    });
    assert(deleteDraft.status === 401, 'Unauthorized DELETE /api/content/draft rejected with 401');

    const restoreVer = await fetch(`${BASE_URL}/api/content/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId: 'ver-123' }),
    });
    assert(restoreVer.status === 401, 'Unauthorized POST /api/content/restore rejected with 401');
  } catch (err: any) {
    assert(false, 'Scenario 5 execution', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Authorized administrator can authenticate and perform mutations
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Authorized admin session and operations ---');
  try {
    // Generate valid signed token for dahoon0519@gmail.com
    const adminToken = createSignedSessionToken({
      email: AUTHORIZED_ADMIN_EMAIL,
      name: 'HAN DAHOON',
    });

    const verifyAdmin = verifySessionToken(adminToken);
    assert(verifyAdmin.valid === true && verifyAdmin.session?.email === AUTHORIZED_ADMIN_EMAIL, 'Admin session token for dahoon0519@gmail.com is valid');

    // Test API operation with valid Bearer token
    const testDraft = {
      testField: 'verified-admin-draft-content',
      updatedAt: new Date().toISOString(),
    };
    const draftRes = await fetch(`${BASE_URL}/api/content/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ content: testDraft }),
    });
    assert(draftRes.status === 200, 'Authorized admin can successfully save draft via POST /api/content/draft', `Status: ${draftRes.status}`);

    const getDraftRes = await fetch(`${BASE_URL}/api/content/draft`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const draftData = await getDraftRes.json();
    assert(draftData?.draft?.testField === 'verified-admin-draft-content', 'Authorized admin can read saved draft from server');

    // Clean up test draft
    await fetch(`${BASE_URL}/api/content/draft`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  } catch (err: any) {
    assert(false, 'Scenario 6 execution', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: Public operations work (visitor reads published content & sends inquiries)
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Public visitor read and inquiry operations ---');
  try {
    const pubRes = await fetch(`${BASE_URL}/api/content/published`);
    assert(pubRes.status === 200, 'Public visitors can read published content via GET /api/content/published');

    const inqPost = await fetch(`${BASE_URL}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Visitor Test',
        email: 'visitor@example.com',
        message: 'Hello Han Dahoon, I would like to inquire about coffee consulting.',
      }),
    });
    const inqData = await inqPost.json();
    assert(inqPost.status === 200 && inqData.success === true, 'Public visitors can submit contact inquiries via POST /api/inquiries');
  } catch (err: any) {
    assert(false, 'Scenario 7 execution', err.message);
  }

  console.log('\n====================================================');
  console.log(`AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
