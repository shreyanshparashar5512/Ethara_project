import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { config } from './config/env.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));

  const allowedOrigins = config.clientOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(null, config.isProduction ? false : true);
      },
      credentials: true,
    })
  );

  app.use(
    '/api/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }),
    authRoutes
  );
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, env: config.nodeEnv, time: new Date().toISOString() });
  });

  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
