import express from 'express';
import { authStore } from '../utils/authStore.js';

const router = express.Router();

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
 * GET /api/auth/status
 * Check if the server is configured and verify current session status
 */
router.get('/status', (req, res) => {
  const isConfigured = authStore.isConfigured();
  const token = getSessionToken(req);
  const session = token ? authStore.getSession(token) : null;

  return res.json({
    isConfigured,
    authenticated: !!session,
    role: session ? session.role : null,
  });
});

/**
 * POST /api/auth/setup
 * First-time configuration of Master and Standard passwords
 */
router.post('/setup', (req, res) => {
  try {
    const isConfigured = authStore.isConfigured();
    if (isConfigured) {
      // If already configured, only an active master session can reset/reconfigure
      const token = getSessionToken(req);
      const session = token ? authStore.getSession(token) : null;
      if (!session || session.role !== 'master') {
        return res.status(403).json({ error: 'Server is already configured. Master access required to change.' });
      }
    }

    const { masterPassword, password, standardPassword, guestPassword } = req.body;
    authStore.setupPasswords({
      masterPassword: masterPassword || password,
      standardPassword: standardPassword || guestPassword,
    });

    // Automatically log in as Master upon initial setup
    const token = authStore.createSession('master');
    res.cookie('grapnel_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    return res.json({
      success: true,
      role: 'master',
      token,
      message: 'Master and Standard passwords configured successfully!',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Log in using Master Password (unlocks C, D, E) or Standard Password (unlocks only E)
 */
router.post('/login', (req, res) => {
  try {
    if (!authStore.isConfigured()) {
      return res.status(400).json({ error: 'Security wall not yet configured. Please complete initial setup.' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const role = authStore.verifyPassword(password);
    if (!role) {
      return res.status(401).json({ error: 'Invalid password. Access denied.' });
    }

    const token = authStore.createSession(role);
    res.cookie('grapnel_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      role,
      token,
      message: role === 'master' 
        ? 'Unlocked full access (C:, D:, E: drives)' 
        : 'Unlocked standard access (E: drive only)',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/logout
 * Terminate active session
 */
router.post('/logout', (req, res) => {
  const token = getSessionToken(req);
  if (token) {
    authStore.destroySession(token);
  }
  res.clearCookie('grapnel_session', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
