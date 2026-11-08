import path from 'path';
import fs from 'fs';
import os from 'os';
import mime from 'mime-types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Format raw bytes into human readable string
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Classify file type for UI icons and custom preview rendering
 */
export function getFileTypeCategory(filename, isDirectory) {
  if (isDirectory) return 'directory';

  const ext = path.extname(filename).toLowerCase().replace('.', '');
  
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'];
  const videoExts = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'];
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sh', 'bat', 'ps1', 'sql', 'xml', 'yaml', 'yml', 'md', 'env', 'gitignore'];
  const docExts = ['doc', 'docx', 'txt', 'rtf', 'odt', 'log'];
  const sheetExts = ['xls', 'xlsx', 'csv', 'ods'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (codeExts.includes(ext)) return 'code';
  if (docExts.includes(ext)) return 'document';
  if (sheetExts.includes(ext)) return 'spreadsheet';
  if (archiveExts.includes(ext)) return 'archive';

  return 'file';
}

/**
 * Detect mime type for a file
 */
export function getMimeType(filePath) {
  return mime.lookup(filePath) || 'application/octet-stream';
}

/**
 * List Windows drive letters (C:\, D:\, etc.) or default root '/' on Unix
 */
export async function getSystemDrives() {
  const isWindows = process.platform === 'win32';
  if (!isWindows) {
    return [{ name: 'Root (/)', path: '/', isDirectory: true, type: 'drive' }];
  }

  try {
    // Windows wmic or powershell command to get logical drives
    const { stdout } = await execAsync('wmic logicaldisk get caption,volumename,size,freespace');
    const lines = stdout.split('\r\n').filter(line => line.trim() !== '');
    const drives = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(/\s+/);
      const caption = parts[0]; // e.g. "C:"
      if (caption && caption.includes(':')) {
        const drivePath = caption + '\\';
        let freeSpace = null;
        let totalSize = null;
        
        // Match numbers if present in parts
        if (parts.length >= 3) {
          freeSpace = parseInt(parts[1], 10) || null;
          totalSize = parseInt(parts[2], 10) || null;
        }

        drives.push({
          name: caption,
          path: drivePath,
          isDirectory: true,
          type: 'drive',
          freeSpace,
          totalSize,
          formattedFree: freeSpace ? formatBytes(freeSpace) : null,
          formattedTotal: totalSize ? formatBytes(totalSize) : null,
        });
      }
    }

    if (drives.length === 0) {
      drives.push({ name: 'C:', path: 'C:\\', isDirectory: true, type: 'drive' });
    }
    return drives;
  } catch (e) {
    // Fallback standard C: and D: drives
    const fallbackDrives = ['C:\\', 'D:\\', 'E:\\'];
    const drives = [];
    for (const d of fallbackDrives) {
      if (fs.existsSync(d)) {
        drives.push({ name: d.replace('\\', ''), path: d, isDirectory: true, type: 'drive' });
      }
    }
    return drives.length > 0 ? drives : [{ name: 'C:', path: 'C:\\', isDirectory: true, type: 'drive' }];
  }
}

/**
 * Get system user standard folders (Home, Desktop, Downloads, Documents, Pictures, Videos, Music)
 */
export function getQuickAccessFolders() {
  const home = os.homedir();

  // Resolve Desktop — on OneDrive-synced Windows setups the Desktop
  // may live at ~/OneDrive/Desktop instead of ~/Desktop.
  const desktopCandidates = [
    path.join(home, 'Desktop'),
    path.join(home, 'OneDrive', 'Desktop'),
    path.join(home, 'OneDrive - Personal', 'Desktop'),
  ];
  const desktopPath = desktopCandidates.find(p => fs.existsSync(p));

  const folders = [
    { name: 'Home',      path: home,                              icon: 'Home'     },
    { name: 'Downloads', path: path.join(home, 'Downloads'),      icon: 'Download' },
    { name: 'Documents', path: path.join(home, 'Documents'),      icon: 'FileText' },
    { name: 'Pictures',  path: path.join(home, 'Pictures'),       icon: 'Image'    },
    { name: 'Videos',    path: path.join(home, 'Videos'),         icon: 'Film'     },
    { name: 'Music',     path: path.join(home, 'Music'),          icon: 'Music'    },
    ...(desktopPath ? [{ name: 'Desktop', path: desktopPath, icon: 'Monitor' }] : []),
  ];

  return folders.filter(f => fs.existsSync(f.path));
}
