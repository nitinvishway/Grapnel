import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { getMimeType, formatBytes } from '../utils/fileHelpers.js';

const router = express.Router();

/**
 * In-memory token store.
 * Key: token (hex string)
 * Value: { filePath, filename, fileSize, mimeType, createdAt, expiresAt }
 */
const tokenStore = new Map();

/** Remove expired tokens on a rolling basis */
function purgeExpired() {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt <= now) tokenStore.delete(token);
  }
}
setInterval(purgeExpired, 60 * 1000); // every minute

/**
 * POST /api/share/create
 * Body: { filePath, expiresIn }
 *   expiresIn: seconds (e.g. 3600 = 1 hour, 86400 = 24 hours)
 * Returns: { token, shareUrl, expiresAt, filename, fileSize }
 */
router.post('/create', (req, res) => {
  try {
    const { filePath, expiresIn = 3600 } = req.body;

    if (!filePath) return res.status(400).json({ error: 'filePath is required' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return res.status(400).json({ error: 'Cannot share a directory directly. Use a file.' });

    const expirySecs = Math.min(Math.max(Number(expiresIn) || 3600, 60), 7 * 24 * 3600); // 1 min – 7 days
    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = Date.now() + expirySecs * 1000;
    const filename = path.basename(filePath);
    const mimeType = getMimeType(filePath) || 'application/octet-stream';
    const fileSize = stat.size;

    tokenStore.set(token, { filePath, filename, fileSize, mimeType, createdAt: Date.now(), expiresAt });

    // Determine the LAN URL from the request host (client sends X-Forwarded-Host or Host)
    const proto = req.headers['x-forwarded-proto'] || 'http';
    // Replace API port (3001) with client port (3000) in the URL
    const host = req.headers.host || 'localhost:3001';
    const clientHost = host.replace(':3001', ':3000');
    const shareUrl = `${proto}://${clientHost}/share/${token}`;

    return res.json({ token, shareUrl, expiresAt, filename, fileSize: formatBytes(fileSize) });
  } catch (err) {
    console.error('Share create error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/share/:token/info
 * Returns file metadata — safe to call without downloading (for the share preview page)
 */
router.get('/:token/info', (req, res) => {
  purgeExpired();
  const data = tokenStore.get(req.params.token);
  if (!data) return res.status(404).json({ error: 'Link not found or has expired.' });

  return res.json({
    filename: data.filename,
    fileSize: formatBytes(data.fileSize),
    mimeType: data.mimeType,
    expiresAt: data.expiresAt,
    createdAt: data.createdAt,
  });
});

/**
 * GET /api/share/:token/download
 * Validates the token and streams the file — only this specific file, nothing else.
 */
router.get('/:token/download', (req, res) => {
  purgeExpired();
  const data = tokenStore.get(req.params.token);

  if (!data) return res.status(404).json({ error: 'Link not found or has expired.' });
  if (!fs.existsSync(data.filePath)) {
    tokenStore.delete(req.params.token);
    return res.status(410).json({ error: 'The shared file no longer exists on the host.' });
  }

  res.setHeader('Content-Type', data.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
  res.setHeader('Content-Length', data.fileSize);

  const stream = fs.createReadStream(data.filePath);
  stream.pipe(res);
  stream.on('error', (err) => {
    console.error('Share stream error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
  });
});

/**
 * DELETE /api/share/:token
 * Revoke a shared link early.
 */
router.delete('/:token', (req, res) => {
  if (tokenStore.has(req.params.token)) {
    tokenStore.delete(req.params.token);
    return res.json({ success: true, message: 'Link revoked.' });
  }
  return res.status(404).json({ error: 'Token not found.' });
});

export default router;
