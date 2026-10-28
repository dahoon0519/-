import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './apiRouter';
import { isProductionEnvironment } from './auth';
import { getPortfolioStorageNamespace } from './storage';
import { BUILD_DEPLOY_CONTEXT } from './deployContext';

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

  // Fail closed for any non-production deploy missing its compiled namespace.
  // A Host header may ONLY add protection; it must never select the store.
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const hostname = (req.headers.host || '').split(':')[0].toLowerCase();
    const previewHost = /^deploy-preview-\\d+--dahoon-hospitality\\.netlify\\.app$/.test(hostname);
    const nonProductionBuild = ['deploy-preview', 'branch-deploy', 'preview-server'].includes(BUILD_DEPLOY_CONTEXT);
    try {
      const namespace = getPortfolioStorageNamespace();
      if ((previewHost || nonProductionBuild) && !namespace) {
        throw new Error('Missing preview storage isolation');
      }
    } catch {
      return res.status(503).json({
        error: 'Isolated preview storage unavailable. Changes are disabled to protect production data.',
        code: 'PREVIEW_STORAGE_NOT_CONFIGURED',
      });
    }
    next();
  });

  // Mount API router at /api
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      deployContext: BUILD_DEPLOY_CONTEXT,
      isolatedStorage: ['deploy-preview', 'branch-deploy', 'preview-server'].includes(BUILD_DEPLOY_CONTEXT),
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
