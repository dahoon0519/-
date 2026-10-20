import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './apiRouter';

export function createExpressApp() {
  const app = express();

  // Parse JSON payloads up to 25MB (for base64 uploaded photos/videos in portfolio)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  // Mount API router at /api
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
