import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import archiver from 'archiver';
import { authStore } from '../utils/authStore.js';
import {
  formatBytes,
  getFileTypeCategory,
  getMimeType,
  getSystemDrives,
  getQuickAccessFolders,
} from '../utils/fileHelpers.js';

const router = express.Router();

/**
 * Check if a path is a protected system directory or root drive that cannot be deleted
 */
export function isProtectedPath(targetPath) {
  if (!targetPath) return true;
  const normalized = path.normalize(targetPath).trim().toUpperCase();
  const parsed = path.parse(targetPath);

  // 1. Root drives (C:\, D:\, E:\, or any [A-Z]:\ or [A-Z]:)
  if (normalized === parsed.root.toUpperCase() || /^[A-Z]:\\?$/i.test(normalized)) {
    return true;
  }

  // 2. User home root (C:\Users\<user>)
  const home = path.normalize(os.homedir()).toUpperCase();
  if (normalized === home) {
    return true;
  }

  // 3. Critical system & user top-level content roots
  const protectedDirs = [
    'C:\\WINDOWS',
    'C:\\PROGRAM FILES',
    'C:\\PROGRAM FILES (X86)',
    'C:\\PROGRAMDATA',
    'C:\\USERS',
    path.join(home, 'DOWNLOADS'),
    path.join(home, 'DOCUMENTS'),
    path.join(home, 'PICTURES'),
    path.join(home, 'VIDEOS'),
    path.join(home, 'MUSIC'),
    path.join(home, 'DESKTOP'),
    path.join(home, 'ONEDRIVE'),
    path.join(home, 'ONEDRIVE', 'DESKTOP'),
    path.join(home, 'ONEDRIVE', 'DOCUMENTS'),
    path.join(home, 'ONEDRIVE', 'PICTURES'),
  ];

  return protectedDirs.includes(normalized);
}

// Helper to normalize path and handle default path based on user role
function resolvePath(requestedPath, userRole = 'master') {
  if (!requestedPath || requestedPath === '' || requestedPath === 'home') {
    if (userRole === 'standard') {
      return fs.existsSync('E:\\') ? 'E:\\' : path.join(os.homedir(), 'Downloads');
    }
    return os.homedir();
  }
  return path.normalize(requestedPath);
}

// Helper to filter quick access folders by role
function getQuickAccessForRole(userRole = 'master') {
  const allFolders = getQuickAccessFolders();
  if (userRole === 'standard') {
    // Exclude root user Home directory for guest users to prevent browsing C: drive user root
    return allFolders.filter(folder => folder.name !== 'Home');
  }
  return allFolders;
}

/**
 * GET /api/files
 * Browse contents of a folder or list drives
 */
router.get('/', async (req, res) => {
  try {
    const rawPath = req.query.path;
    const userRole = req.user?.role || 'master';

    if (rawPath === 'drives') {
      const rawDrives = await getSystemDrives();
      const quickAccess = getQuickAccessForRole(userRole);

      // If user is standard, annotate C: and D: as locked, while E: is unlocked
      const drives = rawDrives.map(drive => {
        const driveUpper = drive.name.toUpperCase();
        const isLocked = userRole === 'standard' && (driveUpper.startsWith('C') || driveUpper.startsWith('D'));
        return {
          ...drive,
          isLocked,
          lockedReason: isLocked ? 'Master password required' : null,
        };
      });

      return res.json({
        currentPath: 'drives',
        breadcrumbs: [{ name: 'Drives & Devices', path: 'drives' }],
        parentPath: null,
        isDrivesView: true,
        drives,
        quickAccess,
        items: drives,
      });
    }

    const targetPath = resolvePath(rawPath, userRole);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: `Path not found: ${targetPath}` });
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: `Target path is a file, not a directory` });
    }

    // Read directory items — wrap in try-catch for Windows junction points
    // that throw EPERM (e.g. "Application Data", "My Documents")
    let filenames;
    try {
      filenames = fs.readdirSync(targetPath);
    } catch (readErr) {
      return res.status(403).json({ error: `Permission denied reading "${targetPath}": ${readErr.message}` });
    }
    const items = [];

    for (const filename of filenames) {
      // Ignore system/hidden Windows files that should never appear in the browser
      const skipList = ['System Volume Information', '$RECYCLE.BIN', 'desktop.ini', 'thumbs.db', 'Thumbs.db'];
      if (skipList.includes(filename)) continue;

      const itemPath = path.join(targetPath, filename);
      try {
        const itemStat = fs.statSync(itemPath);
        const isDir = itemStat.isDirectory();
        const category = getFileTypeCategory(filename, isDir);
        const mimeType = isDir ? null : getMimeType(itemPath);

        items.push({
          name: filename,
          path: itemPath,
          isDirectory: isDir,
          size: isDir ? 0 : itemStat.size,
          formattedSize: isDir ? '--' : formatBytes(itemStat.size),
          mtime: itemStat.mtime,
          category,
          mimeType,
          isProtected: isProtectedPath(itemPath),
        });
      } catch (err) {
        // Skip files that throw permission denied
        continue;
      }
    }

    // Sort directories first, then alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Generate breadcrumbs
    const parts = targetPath.split(path.sep).filter(Boolean);
    const breadcrumbs = [];
    
    // Add Drives root if on Windows
    if (process.platform === 'win32') {
      breadcrumbs.push({ name: 'Drives', path: 'drives' });
    } else {
      breadcrumbs.push({ name: 'Root (/)', path: '/' });
    }

    let accumulatedPath = process.platform === 'win32' ? '' : '/';
    parts.forEach((part, idx) => {
      if (process.platform === 'win32') {
        accumulatedPath = idx === 0 ? part + '\\' : path.join(accumulatedPath, part);
      } else {
        accumulatedPath = path.join(accumulatedPath, part);
      }
      breadcrumbs.push({ name: part, path: accumulatedPath });
    });

    // Parent path calculation
    const parsed = path.parse(targetPath);
    const parentPath = targetPath === parsed.root ? 'drives' : path.dirname(targetPath);

    return res.json({
      currentPath: targetPath,
      parentPath,
      breadcrumbs,
      isDrivesView: false,
      items,
      totalItems: items.length,
      quickAccess: getQuickAccessForRole(userRole),
    });
  } catch (err) {
    console.error('Error in GET /api/files:', err);
    res.status(500).json({ error: err.message || 'Failed to list directory' });
  }
});

/**
 * GET /api/files/download
 * Download file attachment
 */
router.get('/download', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Cannot directly download directory, use /zip' });
    }

    const filename = path.basename(filePath);
    res.download(filePath, filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/files/stream
 * Range-supported media streaming (for video and audio HTML5 playback)
 */
router.get('/stream', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const mimeType = getMimeType(filePath);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/files/preview
 * Read raw text/code content for preview
 */
router.get('/preview', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    if (stat.size > 2 * 1024 * 1024) {
      return res.json({
        truncated: true,
        content: 'File is too large to preview directly (exceeds 2MB). Download the file to view.',
        size: stat.size,
      });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.json({
      content,
      size: stat.size,
      mimeType: getMimeType(filePath),
      filename: path.basename(filePath),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/mkdir
 * Create new directory
 */
router.post('/mkdir', (req, res) => {
  try {
    const { parentPath, folderName } = req.body;
    if (!parentPath || !folderName) {
      return res.status(400).json({ error: 'parentPath and folderName are required' });
    }

    const newFolderPath = path.join(parentPath, folderName);
    if (fs.existsSync(newFolderPath)) {
      return res.status(400).json({ error: 'Folder already exists' });
    }

    fs.mkdirSync(newFolderPath, { recursive: true });
    res.json({ success: true, path: newFolderPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/files/rename
 * Rename file or directory
 */
router.put('/rename', (req, res) => {
  try {
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) {
      return res.status(400).json({ error: 'oldPath and newName are required' });
    }

    if (isProtectedPath(oldPath)) {
      return res.status(403).json({ error: 'Cannot rename a protected system or root directory.' });
    }

    const parentDir = path.dirname(oldPath);
    const newPath = path.join(parentDir, newName);

    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: 'A file or folder with that name already exists' });
    }

    fs.renameSync(oldPath, newPath);
    res.json({ success: true, newPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/files/delete
 * Delete file or directory (Guarded by Doom Password and System Protected Check)
 */
router.delete('/delete', (req, res) => {
  try {
    const { targetPath, doomPassword } = req.body;
    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Target path does not exist' });
    }

    // 1. Immutable protection check
    if (isProtectedPath(targetPath)) {
      return res.status(403).json({
        error: `Protected directory: "${path.basename(targetPath)}" is a critical system/root directory and cannot be deleted.`,
        isProtected: true,
      });
    }

    // 2. Doom Password verification
    if (!doomPassword || !doomPassword.trim()) {
      return res.status(400).json({ error: 'Doom Password is required to confirm deletion.' });
    }

    const isMasterValid = authStore.verifyPassword(doomPassword.trim()) === 'master';
    if (!isMasterValid) {
      return res.status(401).json({ error: 'Incorrect Doom Password. Deletion cancelled.' });
    }

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }

    res.json({ success: true, message: `Successfully deleted "${path.basename(targetPath)}"` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/search
 * Recursive file search within directory
 */
router.post('/search', (req, res) => {
  try {
    const { basePath, query } = req.body;
    if (!query || query.trim() === '') {
      return res.json({ results: [] });
    }

    const searchDir = resolvePath(basePath);
    if (!fs.existsSync(searchDir)) {
      return res.status(404).json({ error: 'Search directory does not exist' });
    }

    const lowerQuery = query.toLowerCase();
    const results = [];
    const maxResults = 150;

    function walk(currentDir, depth = 0) {
      if (depth > 5 || results.length >= maxResults) return;

      try {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
          if (results.length >= maxResults) break;
          if (file === 'System Volume Information' || file === '$RECYCLE.BIN' || file === 'node_modules') continue;

          const fullPath = path.join(currentDir, file);
          try {
            const stat = fs.statSync(fullPath);
            const isDir = stat.isDirectory();

            if (file.toLowerCase().includes(lowerQuery)) {
              results.push({
                name: file,
                path: fullPath,
                isDirectory: isDir,
                size: isDir ? 0 : stat.size,
                formattedSize: isDir ? '--' : formatBytes(stat.size),
                mtime: stat.mtime,
                category: getFileTypeCategory(file, isDir),
              });
            }

            if (isDir) {
              walk(fullPath, depth + 1);
            }
          } catch (e) {
            // Ignore unreadable
          }
        }
      } catch (e) {
        // Ignore unreadable dirs
      }
    }

    walk(searchDir, 0);
    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/files/zip
 * Download directory or multiple files as ZIP archive
 */
router.get('/zip', (req, res) => {
  try {
    const targetPath = req.query.path;
    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Path not found' });
    }

    const filename = `${path.basename(targetPath) || 'archive'}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      archive.directory(targetPath, path.basename(targetPath));
    } else {
      archive.file(targetPath, { name: path.basename(targetPath) });
    }

    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
