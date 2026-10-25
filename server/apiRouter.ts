import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import {
  AUTHORIZED_ADMIN_EMAIL,
  verifyGoogleIdToken,
  createSignedSessionToken,
  verifySessionToken,
  SessionPayload,
  isProductionEnvironment,
} from './auth';
import { portfolioStorage } from './storage';
import { MAX_MEDIA_BYTES, savePortfolioMedia, getPortfolioMedia } from './mediaStorage';

export const apiRouter = Router();

export interface AuthenticatedRequest extends Request {
  adminSession?: SessionPayload;
}

const SESSION_COOKIE_NAME = 'admin_session';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

function getSessionCookieOptions() {
  const isProd = isProductionEnvironment();
  const isPreviewHttps = Boolean(process.env.APP_URL?.startsWith('https://'));
  const isSecure = isProd || isPreviewHttps;
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isPreviewHttps && !isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    path: '/',
  };
}

function getCsrfCookieOptions() {
  const isProd = isProductionEnvironment();
  const isPreviewHttps = Boolean(process.env.APP_URL?.startsWith('https://'));
  const isSecure = isProd || isPreviewHttps;
  return {
    httpOnly: false, // Must be readable by client JS to set X-CSRF-Token header
    secure: isSecure,
    sameSite: (isPreviewHttps && !isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  };
}

/**
 * Generates a cryptographically random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * CSRF Protection Middleware for state-changing HTTP requests (POST, PUT, DELETE, PATCH).
 * Enforces Double-Submit Cookie pattern with cryptographic timing-safe comparison.
 */
export function verifyCsrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) as string | undefined;

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      error: 'CSRF validation failed: Missing CSRF token in request header or cookie.',
    });
  }

  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
    return res.status(403).json({
      error: 'CSRF validation failed: Invalid CSRF token mismatch.',
    });
  }

  next();
}

/**
 * Administrator Authentication Middleware.
 * Strictly checks the HttpOnly session cookie 'admin_session'.
 * Client-side tokens or localStorage values are NOT accepted.
 */
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];

  if (!cookieToken) {
    return res.status(401).json({
      error: 'Unauthorized: Valid administrator HttpOnly session cookie required.',
    });
  }

  const result = verifySessionToken(cookieToken);

  if (!result.valid || !result.session) {
    return res.status(401).json({
      error: 'Unauthorized: Administrator session is invalid or expired.',
      details: result.error,
    });
  }

  req.adminSession = result.session;
  next();
}

/**
 * Optional session check helper
 */
function getOptionalSession(req: Request): SessionPayload | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!cookieToken) return null;
  const result = verifySessionToken(cookieToken);
  return result.valid && result.session ? result.session : null;
}

// Apply CSRF verification to all mutating routes
apiRouter.use(verifyCsrfProtection);


// Media files are stored separately from published/draft JSON.
// All new writes require the existing verified administrator session + CSRF.
apiRouter.post('/media', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const bytes = req.body;
  if (!Buffer.isBuffer(bytes)) {
    return res.status(415).json({ error: 'Upload a JPEG, PNG, WebP, GIF, MP4, or WebM file with its correct Content-Type.' });
  }
  if (!bytes.length || bytes.length > MAX_MEDIA_BYTES) {
    return res.status(413).json({ error: 'Media exceeds the 3 MB upload limit. Compress the image or use a smaller video.' });
  }
  try {
    const url = await savePortfolioMedia(bytes, String(req.headers['content-type'] || ''));
    return res.status(201).json({ success: true, url });
  } catch (error: any) {
    if (/Unsupported media format|File contents do not match|Media file size/.test(error?.message || '')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Media upload failed:', error);
    return res.status(503).json({ error: 'Could not save uploaded media. No content has been changed.' });
  }
});

// Public read-only access for media referenced from published content.
// Random opaque keys are immutable; uploads may also exist in an unpublished draft.
apiRouter.get('/media/:id', async (req: Request, res: Response) => {
  try {
    const item = await getPortfolioMedia(req.params.id);
    if (!item) return res.status(404).json({ error: 'Media not found' });
    res.setHeader('Content-Type', item.mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(item.bytes);
  } catch (error) {
    console.error('Media read failed:', error);
    return res.status(503).json({ error: 'Media temporarily unavailable' });
  }
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

/**
 * GET /api/auth/csrf
 * Issues or returns a CSRF token and sets the XSRF-TOKEN cookie.
 */
apiRouter.get('/auth/csrf', (req: Request, res: Response) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  }
  return res.json({ csrfToken: token });
});

/**
 * POST /api/auth/google
 * Genuine Google Identity Services (GIS) token verification.
 * Only dahoon0519@gmail.com is authorized.
 * Sets HttpOnly session cookie and does NOT return raw session token to the client.
 */
apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing Google ID token credential in request body.' });
  }

  const verification = await verifyGoogleIdToken(credential);
  if (!verification.valid || !verification.email) {
    return res.status(401).json({
      error: 'Google authentication failed.',
      details: verification.error,
    });
  }

  // Strictly check against authorized admin email
  if (verification.email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL) {
    return res.status(403).json({
      error: `Access Denied: The Google account (${verification.email}) is not authorized. Sole administrator: ${AUTHORIZED_ADMIN_EMAIL}`,
    });
  }

  // Create signed session token
  const token = createSignedSessionToken({
    email: verification.email,
    name: verification.name || 'HAN DAHOON',
    picture: verification.picture,
  });

  // Set secure HttpOnly cookie
  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  // Return success without leaking the signed session token to client-side storage
  return res.json({
    success: true,
    authorized: true,
    user: {
      email: verification.email,
      name: verification.name || 'HAN DAHOON',
      picture: verification.picture,
      loginMethod: 'google',
      loggedInAt: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/auth/me
 * Returns the currently active session if valid, or authorized: false.
 */
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const session = getOptionalSession(req);
  if (!session) {
    return res.json({
      authorized: false,
      user: null,
      adminEmail: AUTHORIZED_ADMIN_EMAIL,
    });
  }

  return res.json({
    authorized: true,
    user: {
      email: session.email,
      name: session.name || 'HAN DAHOON',
      picture: session.picture,
      loginMethod: 'google',
    },
    adminEmail: AUTHORIZED_ADMIN_EMAIL,
  });
});

/**
 * POST /api/auth/logout
 * Clears the HttpOnly session cookie.
 */
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProductionEnvironment(),
    sameSite: 'lax',
    path: '/',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// Content Management Endpoints
// -------------------------------------------------------------

/**
 * GET /api/content/published
 * Public endpoint: reads the live published content.
 */
apiRouter.get('/content/published', async (req: Request, res: Response) => {
  try {
    const published = await portfolioStorage.getPublishedContent();
    return res.json({ published });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to read published content',
      details: err.message,
    });
  }
});

/**
 * GET /api/content/draft
 * Admin-only endpoint: reads the current draft.
 */
apiRouter.get('/content/draft', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const draft = await portfolioStorage.getDraftContent();
    return res.json({ draft });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to read draft content',
      details: err.message,
    });
  }
});

/**
 * POST /api/content/draft
 * Admin-only endpoint: saves draft content.
 */
apiRouter.post('/content/draft', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { content } = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Invalid content payload' });
  }

  try {
    const draft = {
      ...content,
      updatedAt: new Date().toISOString(),
      updatedBy: req.adminSession?.email,
    };
    await portfolioStorage.setDraftContent(draft);
    return res.json({ success: true, draft });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to save draft',
      details: err.message,
    });
  }
});

/**
 * DELETE /api/content/draft
 * Admin-only endpoint: discards the draft.
 */
apiRouter.delete('/content/draft', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await portfolioStorage.clearDraftContent();
    return res.json({ success: true, message: 'Draft cleared successfully' });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to clear draft',
      details: err.message,
    });
  }
});

/**
 * POST /api/content/publish
 * Admin-only endpoint: publishes content live and creates version history snapshot.
 */
apiRouter.post('/content/publish', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { content, summary } = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Invalid content payload' });
  }

  const now = new Date().toISOString();
  const published = {
    ...content,
    updatedAt: now,
    publishedBy: req.adminSession?.email,
  };

  if (process.env.NODE_ENV !== 'production' && req.headers['x-test-simulate-storage-failure'] === 'true') {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to write to Netlify Blobs storage in production environment.',
      details: 'Simulated persistent storage failure for automated test verification',
    });
  }

  try {
    // 1. Save published content to authoritative storage
    await portfolioStorage.setPublishedContent(published);

    // 2. Clear draft
    await portfolioStorage.clearDraftContent();

    // 3. Save version snapshot
    const existingHistory = await portfolioStorage.getVersionHistory();
    const newVersionNumber =
      existingHistory.length > 0 ? (existingHistory[0].versionNumber || 1) + 1 : 1;

    const versionSnapshot = {
      id: `ver-${Date.now()}`,
      versionNumber: newVersionNumber,
      timestamp: now,
      author: req.adminSession?.email || AUTHORIZED_ADMIN_EMAIL,
      summary: summary || '관리자 콘텐츠 업데이트 게시 (Published)',
      content: JSON.parse(JSON.stringify(published)),
    };

    const updatedHistory = [versionSnapshot, ...existingHistory].slice(0, 15);
    await portfolioStorage.setVersionHistory(updatedHistory);

    return res.json({
      success: true,
      published,
      version: versionSnapshot,
    });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to publish content',
      details: err.message,
    });
  }
});

/**
 * GET /api/content/history
 * Admin-only endpoint: retrieves version history snapshots.
 */
apiRouter.get('/content/history', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await portfolioStorage.getVersionHistory();
    return res.json({ history });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to read version history',
      details: err.message,
    });
  }
});

/**
 * POST /api/content/restore
 * Admin-only endpoint: restores a previous version from history.
 */
apiRouter.post('/content/restore', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { versionId } = req.body;
  if (!versionId) {
    return res.status(400).json({ error: 'Missing versionId' });
  }

  try {
    const history = await portfolioStorage.getVersionHistory();
    const target = history.find((v) => v.id === versionId);
    if (!target || !target.content) {
      return res.status(404).json({ error: 'Version not found in history' });
    }

    const now = new Date().toISOString();
    const restored = {
      ...target.content,
      updatedAt: now,
      restoredBy: req.adminSession?.email,
    };

    await portfolioStorage.setPublishedContent(restored);
    await portfolioStorage.clearDraftContent();

    return res.json({ success: true, restored });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to restore version',
      details: err.message,
    });
  }
});

import { sendInquiryNotification } from './emailNotifier';

// Simple in-memory IP rate limiter for spam prevention on public contact form
const ipSubmissionMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 10;
const MIN_SUBMISSION_INTERVAL_MS = 500; // 0.5s minimum gap between submits from same IP

export function clearRateLimitCacheForTest(): void {
  ipSubmissionMap.clear();
}

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const timestamps = (ipSubmissionMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length > 0) {
    const lastTimestamp = timestamps[timestamps.length - 1];
    if (now - lastTimestamp < MIN_SUBMISSION_INTERVAL_MS) {
      return { allowed: false, reason: 'Rapid duplicate submission detected. Please slow down.' };
    }
  }

  if (timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return { allowed: false, reason: 'Too many submissions from your network. Please try again later.' };
  }

  timestamps.push(now);
  ipSubmissionMap.set(ip, timestamps);
  return { allowed: true };
}

// -------------------------------------------------------------
// Contact Inquiries Endpoints
// -------------------------------------------------------------

/**
 * POST /api/inquiries
 * Public endpoint: visitors submit messages.
 * Enforces:
 * - Request body size limit <= 10KB
 * - Honeypot trap (_gotcha / website field)
 * - IP rate limiting
 * - Strict field validation (name <= 80, email, message <= 2000, phone <= 30)
 * - Persistent storage first (fails safely with 503 if persistent store fails)
 * - Resend email dispatch with graceful fallback
 */
apiRouter.post('/inquiries', async (req: Request, res: Response) => {
  // 1. Request body size check (<= 10KB)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 10 * 1024 || JSON.stringify(req.body).length > 10 * 1024) {
    return res.status(413).json({
      error: 'Payload Too Large: Maximum contact submission request size is 10KB.',
    });
  }

  const { name, email, message, phone, company, targetEmail, _gotcha, website } = req.body;

  // 2. Honeypot check for spam bots
  if ((_gotcha && String(_gotcha).trim().length > 0) || (website && String(website).trim().length > 0)) {
    // Silently drop spam submission: return 200 success without storing or dispatching email
    return res.json({
      success: true,
      inquiryId: `inq-bot-discarded-${Date.now()}`,
      notificationStatus: 'not_configured',
      dropped: true,
    });
  }

  // 3. Rate limiting per IP
  const isSecurityTestBypass =
    process.env.NODE_ENV !== 'production' && req.headers['x-test-bypass-rate-limit'] === 'true';
  const clientIp =
    ((req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown').trim();
  const rateLimit = isSecurityTestBypass ? { allowed: true } : checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: rateLimit.reason || 'Too many requests. Please wait a moment before sending another message.',
    });
  }

  // 4. Input validation
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';

  if (!trimmedName) {
    return res.status(400).json({ error: 'Sender name is required.' });
  }
  if (trimmedName.length > 80) {
    return res.status(400).json({ error: 'Sender name must not exceed 80 characters.' });
  }

  if (!trimmedEmail) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 120) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (trimmedPhone.length > 30) {
    return res.status(400).json({ error: 'Phone number must not exceed 30 characters.' });
  }

  if (!trimmedMessage) {
    return res.status(400).json({ error: 'Message content is required.' });
  }
  if (trimmedMessage.length > 2000) {
    return res.status(400).json({ error: 'Message must not exceed 2,000 characters.' });
  }

  // 5. Construct stored inquiry model
  const inquiryId = `inq-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  // 5. Authoritative administrator-published recipient email
  // Reads strictly from published SiteContent (never draft, and NEVER from visitor input)
  let recipientEmail = (process.env.NOTIFY_EMAIL || AUTHORIZED_ADMIN_EMAIL).trim();
  try {
    const published = await portfolioStorage.getPublishedContent();
    const publishedEmail =
      published?.contact?.notificationEmail ||
      published?.contact?.emailValue;
    if (
      typeof publishedEmail === 'string' &&
      publishedEmail.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publishedEmail.trim())
    ) {
      recipientEmail = publishedEmail.trim();
    }
  } catch (contentErr) {
    console.warn('Could not read published content for recipient email; falling back to NOTIFY_EMAIL:', contentErr);
  }

  const newInquiry = {
    id: inquiryId,
    name: trimmedName,
    email: trimmedEmail,
    phone: trimmedPhone,
    message: trimmedMessage,
    company: typeof company === 'string' ? company.trim() : '',
    createdAt: now,
    targetEmail: recipientEmail,
    notificationStatus: 'pending' as 'pending' | 'sent' | 'failed' | 'not_configured',
    notificationError: null as string | null,
    notifiedAt: null as string | null,
  };

  // 6. Save persistently to storage first (must succeed before reporting success)
  try {
    await portfolioStorage.addContactInquiry(newInquiry);
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to submit inquiry',
      details: err.message,
    });
  }

  // 7. Dispatch Gmail notification via Resend
  let notificationStatus: 'sent' | 'failed' | 'not_configured' = 'not_configured';
  let notificationError: string | null = null;

  if (
    process.env.NODE_ENV !== 'production' &&
    req.headers['x-test-simulate-resend-failure'] === 'true'
  ) {
    notificationStatus = 'failed';
    notificationError = 'Simulated Resend notification delivery failure for automated testing';
  } else {
    try {
      const notifResult = await sendInquiryNotification({
        id: inquiryId,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        message: trimmedMessage,
        createdAt: now,
        recipientEmail,
      });
      notificationStatus = notifResult.status;
      notificationError = notifResult.error || null;
    } catch (notifErr: any) {
      notificationStatus = 'failed';
      notificationError = notifErr?.message || 'Failed to dispatch email';
    }
  }

  // Update persisted inquiry with the recorded notification status
  try {
    await portfolioStorage.updateContactInquiry(inquiryId, {
      notificationStatus,
      notificationError,
      notifiedAt: new Date().toISOString(),
    });
    newInquiry.notificationStatus = notificationStatus;
    newInquiry.notificationError = notificationError;
  } catch (updateErr) {
    console.warn('Could not update inquiry notification status in store:', updateErr);
  }

  // Return success to the visitor (inquiry is guaranteed stored permanently)
  return res.json({
    success: true,
    inquiryId,
    notificationStatus,
    emailSent: notificationStatus === 'sent',
    inquiry: newInquiry,
  });
});

/**
 * GET /api/inquiries
 * Admin-only endpoint: administrator reads received inquiries.
 */
apiRouter.get('/inquiries', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inquiries = await portfolioStorage.getContactInquiries();
    return res.json({ inquiries });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to read inquiries',
      details: err.message,
    });
  }
});

/**
 * DELETE /api/inquiries/:id
 * Admin-only endpoint: administrator deletes a single inquiry by ID.
 */
apiRouter.delete('/inquiries/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Missing inquiry ID' });
  }

  try {
    await portfolioStorage.deleteContactInquiry(id);
    return res.json({ success: true, message: `Inquiry ${id} deleted` });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to delete inquiry',
      details: err.message,
    });
  }
});

/**
 * DELETE /api/inquiries
 * Admin-only endpoint: administrator clears all inquiries.
 */
apiRouter.delete('/inquiries', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await portfolioStorage.clearContactInquiries();
    return res.json({ success: true, message: 'All inquiries cleared' });
  } catch (err: any) {
    return res.status(503).json({
      error: 'Persistent storage unavailable: Failed to clear inquiries',
      details: err.message,
    });
  }
});
