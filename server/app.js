import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import filesRouter from './routes/files.js';
import uploadRouter from './routes/upload.js';
import systemRouter from './routes/system.js';
import shareRouter from './routes/share.js';
import { requireAuth } from './middleware/auth.js';

export function createApp() {
  const app = express();

  // Enable CORS for LAN access
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Public Routes (No authentication required)
  app.use('/api/auth', authRouter);
  app.use('/api/share', shareRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Protected Routes (Require Master or Standard session)
  app.use('/api/files', requireAuth, filesRouter);
  app.use('/api/upload', requireAuth, uploadRouter);
  app.use('/api/system', requireAuth, systemRouter);

  return app;
}

const app = createApp();
export default app;
