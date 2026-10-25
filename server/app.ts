import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './apiRouter';
import { isProductionEnvironment } from './auth';

export function createExpressApp() {
  const app = express();

  // Media uploads are binary: do not inflate them into JSON/base64 in SiteContent.
  // Netlify's buffered Lambda upload limit is smaller than 6MB for binary data.
  app.use('/api/media', express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
    limit: '3mb',
  }));
  // Keep legacy content support until existing inline-media snapshots are migrated.
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  // CSRF cookie initialization middleware:
  // If client doesn't have XSRF-TOKEN cookie yet, issue one
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies?.['XSRF-TOKEN']) {
      const isProd = isProductionEnvironment();
      const isPreviewHttps = Boolean(process.env.APP_URL?.startsWith('https://'));
      const isSecure = isProd || isPreviewHttps;
      const token = crypto.randomBytes(24).toString('hex');
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: isSecure,
        sameSite: (isPreviewHttps && !isProd ? 'none' : 'lax') as 'none' | 'lax',
        maxAge: 12 * 60 * 60 * 1000,
        path: '/',
      });
    }
    next();
  });

  // Mount API router at /api
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
