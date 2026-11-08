import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import app from '../server/app.js';
import { tokenStore, purgeExpired } from '../server/routes/share.js';

const tempSharedFile = path.join(os.tmpdir(), `grapnel_share_test_${Date.now()}.txt`);
const fileContent = 'Hello Grapnel Shared World! Secret Payload.';

describe('Share-Link Lifecycle & Expiry (/api/share)', () => {
  beforeAll(() => {
    fs.writeFileSync(tempSharedFile, fileContent, 'utf8');
    tokenStore.clear();
  });

  afterAll(() => {
    if (fs.existsSync(tempSharedFile)) fs.unlinkSync(tempSharedFile);
    tokenStore.clear();
  });

  it('POST /api/share/create generates a valid time-limited token', async () => {
    const res = await request(app)
      .post('/api/share/create')
      .send({
        filePath: tempSharedFile,
        expiresIn: 3600, // 1 hour
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toHaveLength(40);
    expect(res.body.shareUrl).toContain(`/share/${res.body.token}`);
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());
    expect(res.body.filename).toBe(path.basename(tempSharedFile));

    // Verify token exists in the memory store
    expect(tokenStore.has(res.body.token)).toBe(true);
  });

  it('POST /api/share/create enforces minimum 60s and maximum 7 days bounds', async () => {
    // Below minimum
    const minRes = await request(app)
      .post('/api/share/create')
      .send({ filePath: tempSharedFile, expiresIn: 10 });

    const expectedMinExpiry = Date.now() + 60 * 1000;
    // Should be at least 60 seconds from now (allow a small clock drift margin)
    expect(minRes.body.expiresAt).toBeGreaterThanOrEqual(expectedMinExpiry - 1000);

    // Above maximum (e.g. 30 days)
    const maxRes = await request(app)
      .post('/api/share/create')
      .send({ filePath: tempSharedFile, expiresIn: 30 * 86400 });

    const maxAllowedExpiry = Date.now() + (7 * 86400 * 1000) + 1000;
    expect(maxRes.body.expiresAt).toBeLessThanOrEqual(maxAllowedExpiry);
  });

  it('GET /api/share/:token/info returns metadata without authentication', async () => {
    const createRes = await request(app)
      .post('/api/share/create')
      .send({ filePath: tempSharedFile, expiresIn: 1800 });

    const token = createRes.body.token;

    const infoRes = await request(app)
      .get(`/api/share/${token}/info`);

    expect(infoRes.status).toBe(200);
    expect(infoRes.body.filename).toBe(path.basename(tempSharedFile));
    expect(infoRes.body.expiresAt).toBe(createRes.body.expiresAt);
    expect(infoRes.body.mimeType).toBe('text/plain');
  });

  it('GET /api/share/:token/download streams the file attachment', async () => {
    const createRes = await request(app)
      .post('/api/share/create')
      .send({ filePath: tempSharedFile, expiresIn: 1800 });

    const token = createRes.body.token;

    const dlRes = await request(app)
      .get(`/api/share/${token}/download`);

    expect(dlRes.status).toBe(200);
    expect(dlRes.headers['content-disposition']).toContain(`attachment; filename="${path.basename(tempSharedFile)}"`);
    expect(dlRes.text).toBe(fileContent);
  });

  it('DELETE /api/share/:token revokes link early', async () => {
    const createRes = await request(app)
      .post('/api/share/create')
      .send({ filePath: tempSharedFile, expiresIn: 3600 });

    const token = createRes.body.token;

    // Revoke
    const delRes = await request(app)
      .delete(`/api/share/${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify token is removed from store
    expect(tokenStore.has(token)).toBe(false);

    // Subsequent info request should return 404
    const infoRes = await request(app)
      .get(`/api/share/${token}/info`);

    expect(infoRes.status).toBe(404);
    expect(infoRes.body.error).toMatch(/not found or has expired/i);
  });

  it('Expired tokens are purged and reject access with 404', async () => {
    const createRes = await request(app)
      .post('/api/share/create')
      .send({ filePath: tempSharedFile, expiresIn: 3600 });

    const token = createRes.body.token;

    // Artificially simulate expiration in the token store
    const item = tokenStore.get(token);
    expect(item).toBeDefined();
    item.expiresAt = Date.now() - 5000; // Expired 5 seconds ago

    // Attempting to access info triggers purge and returns 404
    const infoRes = await request(app)
      .get(`/api/share/${token}/info`);

    expect(infoRes.status).toBe(404);
    expect(infoRes.body.error).toMatch(/not found or has expired/i);

    // Token must no longer exist in the store
    expect(tokenStore.has(token)).toBe(false);

    // Attempting download also returns 404
    const dlRes = await request(app)
      .get(`/api/share/${token}/download`);

    expect(dlRes.status).toBe(404);
  });

  it('purgeExpired() cleans all expired tokens in memory', () => {
    tokenStore.set('valid_token_1', { expiresAt: Date.now() + 100000 });
    tokenStore.set('expired_token_1', { expiresAt: Date.now() - 10000 });
    tokenStore.set('expired_token_2', { expiresAt: Date.now() - 500 });

    purgeExpired();

    expect(tokenStore.has('valid_token_1')).toBe(true);
    expect(tokenStore.has('expired_token_1')).toBe(false);
    expect(tokenStore.has('expired_token_2')).toBe(false);
  });
});
