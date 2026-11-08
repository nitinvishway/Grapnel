import path from 'path';
import os from 'os';
import { authStore } from '../utils/authStore.js';

function getSessionToken(req) {
  if (req.cookies && req.cookies.grapnel_session) {
    return req.cookies.grapnel_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.query && req.query.auth) {
    return req.query.auth;
  }
  return null;
}

/**
 * Check if a path is forbidden for Standard (Guest) users
 * - Allowed: E: drive, and specific media subfolders (Downloads, Desktop, Documents, Pictures, Videos, Music)
 * - Blocked: Root Home directory (C:\Users\<user>), Root C: drive, D: drive, and all system/hidden folders
 */
export function isPathRestrictedForStandard(targetPath) {
  if (!targetPath || targetPath === 'drives' || targetPath.toLowerCase() === 'home') {
    return false;
  }

  const normalized = path.normalize(targetPath).trim().toUpperCase();
  const homeDir = path.normalize(os.homedir()).toUpperCase();

  // 1. E: drive is fully allowed for guest/standard
  if (normalized.startsWith('E:')) {
    return false;
  }

  // 2. Specific safe content subfolders inside user profile are ALLOWED
  const safeContentDirs = [
    path.join(homeDir, 'DOWNLOADS'),
    path.join(homeDir, 'DOCUMENTS'),
    path.join(homeDir, 'PICTURES'),
    path.join(homeDir, 'VIDEOS'),
    path.join(homeDir, 'MUSIC'),
    path.join(homeDir, 'DESKTOP'),
    path.join(homeDir, 'ONEDRIVE', 'DESKTOP'),
    path.join(homeDir, 'ONEDRIVE', 'DOCUMENTS'),
    path.join(homeDir, 'ONEDRIVE', 'PICTURES'),
  ];

  const isInsideSafeDir = safeContentDirs.some(safeDir =>
    normalized === safeDir || normalized.startsWith(safeDir + '\\') || normalized.startsWith(safeDir + '/')
  );

  if (isInsideSafeDir) {
    return false;
  }

  // 3. User root directory (Home / C:\Users\<user>), Root C:\, D:\ drive, and any other system paths are RESTRICTED
  return true;
}

/**
 * Express middleware to authenticate session and enforce drive-level role restrictions
 */
export function requireAuth(req, res, next) {
  // If server has not been configured yet, return 401 with setupRequired flag
  if (!authStore.isConfigured()) {
    return res.status(401).json({
      error: 'Authentication setup required',
      setupRequired: true,
    });
  }

  const token = getSessionToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const session = authStore.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  req.user = {
    role: session.role, // 'master' | 'standard'
  };

  // Check path-based access restrictions for Standard users
  if (req.user.role === 'standard') {
    // Check query params (GET /api/files, /download, /stream, /preview, /zip)
    const queryPath = req.query.path;
    if (queryPath && isPathRestrictedForStandard(queryPath)) {
      return res.status(403).json({
        error: 'Access denied: Master password required to access this directory.',
        lockedDrive: true,
      });
    }

    // Check request body for modifications (POST /mkdir, PUT /rename, DELETE /delete, POST /upload)
    const bodyPath = req.body?.parentPath || req.body?.targetPath || req.body?.oldPath || req.body?.basePath;
    if (bodyPath && isPathRestrictedForStandard(bodyPath)) {
      return res.status(403).json({
        error: 'Access denied: Master password required to modify files on this drive.',
        lockedDrive: true,
      });
    }
  }

  next();
}
