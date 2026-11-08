import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import filesRouter from './routes/files.js';
import uploadRouter from './routes/upload.js';
import systemRouter from './routes/system.js';
import shareRouter from './routes/share.js';
import { requireAuth } from './middleware/auth.js';
import { getLocalIpAddresses } from './utils/network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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

// Bind to 0.0.0.0 (All local interfaces)
app.listen(PORT, '0.0.0.0', () => {
  const ipList = getLocalIpAddresses();
  console.log('\n=============================================================');
  console.log('       ⚓ GRAPNEL LAN FILE SERVER IS ACTIVE & RUNNING         ');
  console.log('=============================================================');
  console.log(` Server bound to: 0.0.0.0:${PORT}`);
  console.log(` Local access:    http://localhost:${PORT}`);
  
  if (ipList.length > 0) {
    console.log('\n📱 LAN Client Access Links (Open on Phone/Browser):');
    ipList.forEach(({ interface: iface, ip }) => {
      console.log(`   ➜ ${iface}: http://${ip}:3000`);
    });
  } else {
    console.log('\n⚠️ No active non-internal IPv4 interfaces found.');
  }
  console.log('=============================================================\n');
});
