import os from 'os';
import QRCode from 'qrcode';

/**
 * Get active non-internal IPv4 LAN addresses
 */
export function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
        });
      }
    }
  }
  return addresses;
}

/**
 * Generate QR code data URL for a given URL string
 */
export async function generateQrDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, {
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code data URL:', err);
    return null;
  }
}
