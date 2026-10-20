import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

/**
 * The SOLE authorized administrator email account for the portfolio.
 * Hardcoded to dahoon0519@gmail.com and cannot be overridden by client or untrusted env.
 */
export const AUTHORIZED_ADMIN_EMAIL = 'dahoon0519@gmail.com';

export const MIN_SECRET_LENGTH = 32;

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const LOCAL_DATA_DIR = path.resolve(process.cwd(), '.data');
const DEV_SECRET_FILE = path.join(LOCAL_DATA_DIR, '.dev_session_secret');

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

export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.NETLIFY_BLOBS_CONTEXT)
  );
}

/**
 * Retrieves the cryptographic SESSION_SECRET.
 * - In production: strictly requires process.env.SESSION_SECRET with >= 32 characters. Fails securely if missing or too weak.
 * - In local development: uses process.env.SESSION_SECRET if set, or generates an ephemeral local 256-bit random key saved in gitignored .data/.
 * Never hardcodes or exposes secret values.
 */
export function getSessionSecret(forceProductionCheck?: boolean): string {
  const isProd = forceProductionCheck ?? isProductionEnvironment();
  const envSecret = process.env.SESSION_SECRET?.trim();

  if (isProd) {
    if (!envSecret) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION ERROR: SESSION_SECRET environment variable is missing. In production, a cryptographically secure SESSION_SECRET of at least 32 characters is strictly required.'
      );
    }
    if (envSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `FATAL SECURITY CONFIGURATION ERROR: SESSION_SECRET is too short (${envSecret.length} characters). It must be at least ${MIN_SECRET_LENGTH} characters of high entropy.`
      );
    }
    // Check against obvious placeholder strings
    if (
      envSecret.includes('your-secure-32-plus-character') ||
      envSecret === '1590' ||
      envSecret === 'password'
    ) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION ERROR: SESSION_SECRET contains an insecure placeholder value. Please generate a cryptographically random secret string.'
      );
    }
    return envSecret;
  }

  // Non-production (local development / testing)
  if (envSecret && envSecret.length >= MIN_SECRET_LENGTH) {
    return envSecret;
  }

  // Check if an ephemeral local secret exists in .data/
  try {
    if (fs.existsSync(DEV_SECRET_FILE)) {
      const stored = fs.readFileSync(DEV_SECRET_FILE, 'utf-8').trim();
      if (stored.length >= MIN_SECRET_LENGTH) {
        return stored;
      }
    }
  } catch {}

  // Generate ephemeral 256-bit random key for local development
  const newDevSecret = crypto.randomBytes(32).toString('hex');
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DEV_SECRET_FILE, newDevSecret, 'utf-8');
  } catch {}

  return newDevSecret;
}

const googleClient = new OAuth2Client();

/**
 * Signs a session payload using HMAC-SHA256 with the validated SESSION_SECRET.
 */
export function createSignedSessionToken(
  payload: Omit<SessionPayload, 'issuedAt' | 'expiresAt' | 'sessionId'>,
  secretOverride?: string
): string {
  const secret = secretOverride || getSessionSecret();
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
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token, checking cryptographic HMAC signature, expiration,
 * and exact match against AUTHORIZED_ADMIN_EMAIL.
 */
export function verifySessionToken(
  token: string | undefined,
  secretOverride?: string
): AuthValidationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No session token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed session token format' };
  }

  const [encodedPayload, signature] = parts;

  let secret: string;
  try {
    secret = secretOverride || getSessionSecret();
  } catch (err: any) {
    return { valid: false, error: err.message };
  }

  // Re-compute expected HMAC
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  // Timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Invalid token HMAC signature' };
  }

  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const session: SessionPayload = JSON.parse(jsonStr);

    if (!session || !session.email || !session.expiresAt) {
      return { valid: false, error: 'Invalid session payload structure' };
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
 * Strictly requires GOOGLE_CLIENT_ID to be configured.
 * Never accepts a Google token without verifying its intended audience against GOOGLE_CLIENT_ID.
 * The only permitted administrator email is dahoon0519@gmail.com.
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

  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID)?.trim();

  if (!clientId) {
    return {
      valid: false,
      error:
        'Server configuration error: GOOGLE_CLIENT_ID is not configured. Google ID tokens cannot be verified without audience validation.',
    };
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId, // Mandatory audience verification
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return { valid: false, error: 'Empty token payload returned from Google verification' };
    }

    // Verify audience matches configured client ID explicitly
    if (payload.aud !== clientId) {
      return { valid: false, error: 'Google ID token audience mismatch' };
    }

    if (!payload.email_verified) {
      return { valid: false, error: 'Google account email is not verified' };
    }

    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      return { valid: false, error: 'No email found in Google token payload' };
    }

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      return {
        valid: false,
        error: `Access denied: Account ${email} is not authorized. The only administrator is ${AUTHORIZED_ADMIN_EMAIL}.`,
      };
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
