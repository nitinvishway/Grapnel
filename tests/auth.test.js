import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import app from '../server/app.js';
import { authStore } from '../server/utils/authStore.js';

// Use an isolated temporary auth file for tests
const tempAuthFile = path.join(os.tmpdir(), `grapnel_test_auth_${Date.now()}.json`);
process.env.GRAPNEL_AUTH_FILE = tempAuthFile;

describe('Backend Auth Engine (/api/auth)', () => {
  beforeEach(() => {
    authStore.clearSessions();
    if (fs.existsSync(tempAuthFile)) {
      fs.unlinkSync(tempAuthFile);
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempAuthFile)) {
      fs.unlinkSync(tempAuthFile);
    }
    delete process.env.GRAPNEL_AUTH_FILE;
  });

  it('GET /api/auth/status reports unconfigured server initially', async () => {
    const res = await request(app).get('/api/auth/status');
    expect(res.status).toBe(200);
    expect(res.body.isConfigured).toBe(false);
    expect(res.body.authenticated).toBe(false);
    expect(res.body.role).toBeNull();
  });

  it('Protected routes return 401 with setupRequired when unconfigured', async () => {
    const res = await request(app).get('/api/files');
    expect(res.status).toBe(401);
    expect(res.body.setupRequired).toBe(true);
  });

  it('POST /api/auth/setup configures master and standard passwords', async () => {
    const res = await request(app)
      .post('/api/auth/setup')
      .send({
        masterPassword: 'MasterSecret123',
        standardPassword: 'GuestSecret456',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('master');
    expect(res.body.token).toBeDefined();

    // Verify session cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('grapnel_session='))).toBe(true);

    // Status should now be configured and authenticated
    const statusRes = await request(app)
      .get('/api/auth/status')
      .set('Cookie', cookies);
    expect(statusRes.body.isConfigured).toBe(true);
    expect(statusRes.body.authenticated).toBe(true);
    expect(statusRes.body.role).toBe('master');
  });

  it('POST /api/auth/setup rejects reconfiguration without active master session', async () => {
    // 1. Initial setup
    await request(app)
      .post('/api/auth/setup')
      .send({ masterPassword: 'FirstPassword' });

    // 2. Attempt reconfiguration without session
    const unauthorizedRes = await request(app)
      .post('/api/auth/setup')
      .send({ masterPassword: 'HackedPassword' });

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.error).toMatch(/already configured/i);
  });

  it('POST /api/auth/login authenticates Master password', async () => {
    await request(app)
      .post('/api/auth/setup')
      .send({
        masterPassword: 'MasterPassword!',
        standardPassword: 'GuestPassword!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ password: 'MasterPassword!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.role).toBe('master');
    expect(loginRes.body.token).toBeDefined();
  });

  it('POST /api/auth/login authenticates Standard/Guest password', async () => {
    await request(app)
      .post('/api/auth/setup')
      .send({
        masterPassword: 'MasterPassword!',
        standardPassword: 'GuestPassword!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ password: 'GuestPassword!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.role).toBe('standard');
    expect(loginRes.body.token).toBeDefined();
  });

  it('POST /api/auth/login rejects incorrect passwords with 401', async () => {
    await request(app)
      .post('/api/auth/setup')
      .send({ masterPassword: 'ValidPassword123' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ password: 'WrongPassword' });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.error).toMatch(/invalid password/i);
  });

  it('POST /api/auth/logout invalidates session and clears cookie', async () => {
    const setupRes = await request(app)
      .post('/api/auth/setup')
      .send({ masterPassword: 'ValidPassword123' });

    const cookie = setupRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Verify session token is no longer valid
    const statusRes = await request(app)
      .get('/api/auth/status')
      .set('Cookie', cookie);

    expect(statusRes.body.authenticated).toBe(false);
  });
});

