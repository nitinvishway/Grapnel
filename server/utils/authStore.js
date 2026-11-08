import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory active sessions: token -> { role: 'master' | 'standard', createdAt: number }
const activeSessions = new Map();

// Helper to hash password with salt
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

// Verify password against stored hash & salt
function verifyHash(password, storedHash, storedSalt) {
  try {
    const { hash } = hashPassword(password, storedSalt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch (err) {
    return false;
  }
}

// Load auth configuration from disk
function loadAuthConfig() {
  if (!fs.existsSync(AUTH_FILE)) return null;
  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse auth.json:', err);
    return null;
  }
}

export const authStore = {
  isConfigured() {
    const config = loadAuthConfig();
    return !!(config && config.master && config.master.hash);
  },

  setupPasswords({ masterPassword, password, standardPassword }) {
    const mainPass = (masterPassword || password || '').trim();
    if (!mainPass) {
      throw new Error('Password cannot be empty');
    }

    const master = hashPassword(mainPass);
    const standard = standardPassword && standardPassword.trim() ? hashPassword(standardPassword.trim()) : null;

    const config = {
      master,
      ...(standard ? { standard } : {}),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  },

  verifyPassword(password) {
    if (!password) return null;
    const config = loadAuthConfig();
    if (!config) return null;

    // Check Master password
    if (config.master && verifyHash(password, config.master.hash, config.master.salt)) {
      return 'master';
    }

    // Check Standard (E: drive) password
    if (config.standard && verifyHash(password, config.standard.hash, config.standard.salt)) {
      return 'standard';
    }

    return null;
  },

  createSession(role) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      role,
      createdAt: Date.now(),
    });
    return token;
  },

  getSession(token) {
    if (!token) return null;
    return activeSessions.get(token) || null;
  },

  destroySession(token) {
    if (token) {
      activeSessions.delete(token);
    }
  },
};
