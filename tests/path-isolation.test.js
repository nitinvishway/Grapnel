import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import app from '../server/app.js';
import { authStore } from '../server/utils/authStore.js';
import { isPathRestrictedForStandard } from '../server/middleware/auth.js';

const tempAuthFile = path.join(os.tmpdir(), `grapnel_test_path_iso_${Date.now()}.json`);
process.env.GRAPNEL_AUTH_FILE = tempAuthFile;

describe('Path Isolation & 403 Security Boundaries', () => {
  let masterCookie;
  let standardCookie;

  beforeEach(async () => {
    authStore.clearSessions();
    if (fs.existsSync(tempAuthFile)) {
      fs.unlinkSync(tempAuthFile);
    }

    // Set up Master and Standard credentials
    await request(app)
      .post('/api/auth/setup')
      .send({
        masterPassword: 'MasterPassword123',
        standardPassword: 'StandardPassword123',
      });

    // Obtain Master session cookie
    const masterLogin = await request(app)
      .post('/api/auth/login')
      .send({ password: 'MasterPassword123' });
    masterCookie = masterLogin.headers['set-cookie'];

    // Obtain Standard session cookie
    const standardLogin = await request(app)
      .post('/api/auth/login')
      .send({ password: 'StandardPassword123' });
    standardCookie = standardLogin.headers['set-cookie'];
  });

  afterAll(() => {
    if (fs.existsSync(tempAuthFile)) {
      fs.unlinkSync(tempAuthFile);
    }
    delete process.env.GRAPNEL_AUTH_FILE;
  });

  describe('Unit: isPathRestrictedForStandard', () => {
    it('allows "drives" and "home" views', () => {
      expect(isPathRestrictedForStandard('drives')).toBe(false);
      expect(isPathRestrictedForStandard('home')).toBe(false);
      expect(isPathRestrictedForStandard('')).toBe(false);
    });

    it('allows full access to the E: drive partition', () => {
      expect(isPathRestrictedForStandard('E:\\')).toBe(false);
      expect(isPathRestrictedForStandard('E:/')).toBe(false);
      expect(isPathRestrictedForStandard('E:\\Movies\\Holiday.mp4')).toBe(false);
      expect(isPathRestrictedForStandard('e:\\shared_folder')).toBe(false);
    });

    it('allows access to safe user content subdirectories', () => {
      const home = os.homedir();
      expect(isPathRestrictedForStandard(path.join(home, 'Downloads'))).toBe(false);
      expect(isPathRestrictedForStandard(path.join(home, 'Documents'))).toBe(false);
      expect(isPathRestrictedForStandard(path.join(home, 'Pictures'))).toBe(false);
      expect(isPathRestrictedForStandard(path.join(home, 'Videos'))).toBe(false);
      expect(isPathRestrictedForStandard(path.join(home, 'Music'))).toBe(false);
      expect(isPathRestrictedForStandard(path.join(home, 'Desktop'))).toBe(false);
    });

    it('blocks user root home directory from guest navigation', () => {
      const home = os.homedir();
      expect(isPathRestrictedForStandard(home)).toBe(true);
    });

    it('blocks root Windows C: drive, D: drive, and system folders', () => {
      expect(isPathRestrictedForStandard('C:\\')).toBe(true);
      expect(isPathRestrictedForStandard('C:\\Windows')).toBe(true);
      expect(isPathRestrictedForStandard('C:\\Program Files')).toBe(true);
      expect(isPathRestrictedForStandard('D:\\')).toBe(true);
      expect(isPathRestrictedForStandard('D:\\PrivateData')).toBe(true);
    });
  });

  describe('HTTP 403 Enforcement via Express Middleware', () => {
    it('returns 403 Forbidden when Standard user requests restricted C: path', async () => {
      const res = await request(app)
        .get('/api/files?path=C:\\Windows')
        .set('Cookie', standardCookie);

      expect(res.status).toBe(403);
      expect(res.body.lockedDrive).toBe(true);
      expect(res.body.error).toMatch(/Master password required/i);
    });

    it('returns 403 Forbidden when Standard user requests restricted D: path', async () => {
      const res = await request(app)
        .get('/api/files?path=D:\\SecretProjects')
        .set('Cookie', standardCookie);

      expect(res.status).toBe(403);
      expect(res.body.lockedDrive).toBe(true);
      expect(res.body.error).toMatch(/Master password required/i);
    });

    it('returns 403 Forbidden when Standard user attempts write/mkdir in restricted path', async () => {
      const res = await request(app)
        .post('/api/files/mkdir')
        .set('Cookie', standardCookie)
        .send({ parentPath: 'C:\\Windows', folderName: 'MaliciousDir' });

      expect(res.status).toBe(403);
      expect(res.body.lockedDrive).toBe(true);
      expect(res.body.error).toMatch(/Master password required to modify files/i);
    });

    it('allows Master user to query without 403 path isolation block', async () => {
      // Master should not be blocked with 403 by the path restriction middleware
      const res = await request(app)
        .get('/api/files?path=C:\\')
        .set('Cookie', masterCookie);

      // Should not be 403 locked drive
      expect(res.status).not.toBe(403);
    });

    it('annotates C: and D: as locked in drives view for Standard user', async () => {
      const res = await request(app)
        .get('/api/files?path=drives')
        .set('Cookie', standardCookie);

      expect(res.status).toBe(200);
      expect(res.body.isDrivesView).toBe(true);

      const drives = res.body.drives;
      const cDrive = drives.find((d) => d.name.toUpperCase().startsWith('C'));
      const dDrive = drives.find((d) => d.name.toUpperCase().startsWith('D'));
      const eDrive = drives.find((d) => d.name.toUpperCase().startsWith('E'));

      if (cDrive) expect(cDrive.isLocked).toBe(true);
      if (dDrive) expect(dDrive.isLocked).toBe(true);
      if (eDrive) expect(eDrive.isLocked).toBe(false);
    });

    it('keeps all drives unlocked in drives view for Master user', async () => {
      const res = await request(app)
        .get('/api/files?path=drives')
        .set('Cookie', masterCookie);

      expect(res.status).toBe(200);
      const drives = res.body.drives;
      drives.forEach((d) => {
        expect(d.isLocked).toBe(false);
      });
    });
  });
});

