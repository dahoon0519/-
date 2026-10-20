import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './apiRouter';
import { isProductionEnvironment } from './auth';

export function createExpressApp() {
  const app = express();

  // Parse JSON payloads up to 25MB (for base64 uploaded photos/videos in portfolio)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  // CSRF cookie initialization middleware:
  // If client doesn't have XSRF-TOKEN cookie yet, issue one
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies?.['XSRF-TOKEN']) {
      const isProd = isProductionEnvironment();
      const token = crypto.randomBytes(24).toString('hex');
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
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
