import crypto from 'crypto';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

export const AUTHORIZED_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.VITE_ADMIN_EMAIL ||
  'dahoon0519@gmail.com'
)
  .trim()
  .toLowerCase();

export const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'dahoon-portfolio-secure-session-key-must-be-at-least-32-chars-long';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface SessionPayload {
  email: string;
  name?: string;
  picture?: string;
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
}

export interface AuthValidationResult {
  valid: boolean;
  error?: string;
  session?: SessionPayload;
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID);

/**
 * Signs a session payload using HMAC-SHA256
 */
export function createSignedSessionToken(payload: Omit<SessionPayload, 'issuedAt' | 'expiresAt' | 'sessionId'>): string {
  const now = Date.now();
  const sessionData: SessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
    sessionId: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
  };

  const jsonStr = JSON.stringify(sessionData);
  const encodedPayload = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token, checking cryptographic signature and expiration.
 */
export function verifySessionToken(token: string | undefined): AuthValidationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No authentication token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed authentication token' };
  }

  const [encodedPayload, signature] = parts;

  // Re-compute expected HMAC
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  // Timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const session: SessionPayload = JSON.parse(jsonStr);

    if (!session || !session.email || !session.expiresAt) {
      return { valid: false, error: 'Invalid session structure' };
    }

    if (Date.now() > session.expiresAt) {
      return { valid: false, error: 'Session has expired' };
    }

    if (session.email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL) {
      return { valid: false, error: 'Session email is not authorized' };
    }

    return { valid: true, session };
  } catch (err: any) {
    return { valid: false, error: `Session decode error: ${err.message}` };
  }
}

/**
 * Validates a Google ID Token received from Google Identity Services.
 * Verifies cryptographic signature against Google's public keys, issuer, audience, and expiration.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<{
  valid: boolean;
  email?: string;
  name?: string;
  picture?: string;
  error?: string;
}> {
  if (!idToken || typeof idToken !== 'string') {
    return { valid: false, error: 'Missing Google ID token credential' };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId ? clientId : undefined,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return { valid: false, error: 'Empty token payload returned from Google' };
    }

    if (!payload.email_verified) {
      return { valid: false, error: 'Google account email is not verified' };
    }

    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      return { valid: false, error: 'No email found in Google token' };
    }

    return {
      valid: true,
      email,
      name: payload.name || 'HAN DAHOON',
      picture: payload.picture,
    };
  } catch (err: any) {
    return { valid: false, error: `Google token verification failed: ${err.message}` };
  }
}
