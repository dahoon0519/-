import { Router, Request, Response, NextFunction } from 'express';
import {
  AUTHORIZED_ADMIN_EMAIL,
  verifyGoogleIdToken,
  createSignedSessionToken,
  verifySessionToken,
  SessionPayload,
} from './auth';
import { portfolioStorage } from './storage';

export const apiRouter = Router();

// Extend Request type to include session
export interface AuthenticatedRequest extends Request {
  adminSession?: SessionPayload;
}

const COOKIE_NAME = 'admin_session';

/**
 * Extracts and verifies the admin session from either:
 * 1. The HttpOnly cookie 'admin_session'
 * 2. The 'Authorization: Bearer <token>' header (for iframe/cross-site fallback)
 */
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = cookieToken || bearerToken;
  const result = verifySessionToken(token);

  if (!result.valid || !result.session) {
    return res.status(401).json({
      error: 'Unauthorized: Valid administrator session required.',
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
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken || bearerToken;
  const result = verifySessionToken(token);
  return result.valid && result.session ? result.session : null;
}

// Cookie options
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    path: '/',
  };
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

/**
 * POST /api/auth/google
 * Genuine Google Identity Services (GIS) token verification.
 * Only dahoon0519@gmail.com is authorized.
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
  res.cookie(COOKIE_NAME, token, getCookieOptions());

  return res.json({
    success: true,
    authorized: true,
    token, // Also provided in payload for clients where cookies might be blocked
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
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
    return res.status(500).json({ error: 'Failed to read published content', details: err.message });
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
    return res.status(500).json({ error: 'Failed to read draft content', details: err.message });
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
    return res.status(500).json({ error: 'Failed to save draft content', details: err.message });
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
    return res.status(500).json({ error: 'Failed to clear draft', details: err.message });
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

  try {
    // 1. Save published content
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
    return res.status(500).json({ error: 'Failed to publish content', details: err.message });
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
    return res.status(500).json({ error: 'Failed to read version history', details: err.message });
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
    return res.status(500).json({ error: 'Failed to restore version', details: err.message });
  }
});

// -------------------------------------------------------------
// Contact Inquiries Endpoints
// -------------------------------------------------------------

/**
 * POST /api/inquiries
 * Public endpoint: visitors submit messages.
 */
apiRouter.post('/inquiries', async (req: Request, res: Response) => {
  const { name, email, message, company } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  const newInquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name || '',
    email: email.trim(),
    message: message.trim(),
    company: company || '',
    createdAt: new Date().toISOString(),
  };

  try {
    await portfolioStorage.addContactInquiry(newInquiry);
    return res.json({ success: true, inquiry: newInquiry });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit inquiry', details: err.message });
  }
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
    return res.status(500).json({ error: 'Failed to read inquiries', details: err.message });
  }
});

/**
 * DELETE /api/inquiries
 * Admin-only endpoint: administrator clears inquiries.
 */
apiRouter.delete('/inquiries', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await portfolioStorage.clearContactInquiries();
    return res.json({ success: true, message: 'Inquiries cleared' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to clear inquiries', details: err.message });
  }
});
