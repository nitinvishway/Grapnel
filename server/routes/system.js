import express from 'express';
import os from 'os';
import { getLocalIpAddresses, generateQrDataUrl } from '../utils/network.js';
import { getSystemDrives, getQuickAccessFolders, formatBytes } from '../utils/fileHelpers.js';

const router = express.Router();

/**
 * GET /api/system/stats
 * Return LAN IP addresses, scannable pairing QR code Data URL, OS stats, disk drives
 */
router.get('/stats', async (req, res) => {
  try {
    const ipAddresses = getLocalIpAddresses();
    const port = 3000;

    // Primary connection URL (first non-internal LAN IPv4 or fallback localhost)
    const primaryIp = ipAddresses.length > 0 ? ipAddresses[0].ip : '127.0.0.1';
    const primaryUrl = `http://${primaryIp}:${port}`;

    const qrDataUrl = await generateQrDataUrl(primaryUrl);
    const drives = await getSystemDrives();
    const quickAccess = getQuickAccessFolders();

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      primaryUrl,
      ipAddresses: ipAddresses.map((item) => ({
        ...item,
        url: `http://${item.ip}:${port}`,
      })),
      qrDataUrl,
      drives,
      quickAccess,
      memory: {
        total: formatBytes(totalMem),
        free: formatBytes(freeMem),
        used: formatBytes(usedMem),
        usedPercentage: Math.round((usedMem / totalMem) * 100),
      },
    });
  } catch (err) {
    console.error('Error fetching system stats:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
