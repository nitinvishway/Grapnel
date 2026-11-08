import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import app from '../server/app.js';
import { authStore } from '../server/utils/authStore.js';

const tempAuthFile = path.join(os.tmpdir(), `grapnel_test_range_auth_${Date.now()}.json`);
const tempMediaFile = path.join(os.tmpdir(), `grapnel_test_media_${Date.now()}.mp4`);
process.env.GRAPNEL_AUTH_FILE = tempAuthFile;

// 100-byte known binary buffer
const testFileSize = 100;
const testBuffer = Buffer.alloc(testFileSize);
for (let i = 0; i < testFileSize; i++) {
  testBuffer[i] = i;
}

describe('Range Requests & Media Streaming (/api/files/stream)', () => {
  let masterCookie;

  beforeAll(async () => {
    fs.writeFileSync(tempMediaFile, testBuffer);

    await request(app)
      .post('/api/auth/setup')
      .send({ masterPassword: 'StreamMaster123' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ password: 'StreamMaster123' });
    masterCookie = loginRes.headers['set-cookie'];
  });

  afterAll(() => {
    if (fs.existsSync(tempAuthFile)) fs.unlinkSync(tempAuthFile);
    if (fs.existsSync(tempMediaFile)) fs.unlinkSync(tempMediaFile);
    delete process.env.GRAPNEL_AUTH_FILE;
  });

  it('GET /api/files/stream returns 200 and entire file when no Range header is supplied', async () => {
    const res = await request(app)
      .get(`/api/files/stream?path=${encodeURIComponent(tempMediaFile)}`)
      .set('Cookie', masterCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBe(String(testFileSize));
    expect(res.headers['content-type']).toBe('video/mp4');
    expect(Buffer.compare(res.body, testBuffer)).toBe(0);
  });

  it('GET /api/files/stream returns 206 Partial Content for byte range 0-19', async () => {
    const res = await request(app)
      .get(`/api/files/stream?path=${encodeURIComponent(tempMediaFile)}`)
      .set('Cookie', masterCookie)
      .set('Range', 'bytes=0-19');

    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 0-19/${testFileSize}`);
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['content-length']).toBe('20');
    expect(res.headers['content-type']).toBe('video/mp4');

    const expectedSlice = testBuffer.subarray(0, 20);
    expect(Buffer.compare(res.body, expectedSlice)).toBe(0);
  });

  it('GET /api/files/stream returns 206 Partial Content for byte range 50-99', async () => {
    const res = await request(app)
      .get(`/api/files/stream?path=${encodeURIComponent(tempMediaFile)}`)
      .set('Cookie', masterCookie)
      .set('Range', 'bytes=50-99');

    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 50-99/${testFileSize}`);
    expect(res.headers['content-length']).toBe('50');

    const expectedSlice = testBuffer.subarray(50, 100);
    expect(Buffer.compare(res.body, expectedSlice)).toBe(0);
  });

  it('GET /api/files/stream returns 206 for open-ended range bytes=80-', async () => {
    const res = await request(app)
      .get(`/api/files/stream?path=${encodeURIComponent(tempMediaFile)}`)
      .set('Cookie', masterCookie)
      .set('Range', 'bytes=80-');

    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 80-99/${testFileSize}`);
    expect(res.headers['content-length']).toBe('20');

    const expectedSlice = testBuffer.subarray(80, 100);
    expect(Buffer.compare(res.body, expectedSlice)).toBe(0);
  });

  it('GET /api/files/stream returns 404 for non-existent file', async () => {
    const fakePath = path.join(os.tmpdir(), 'non_existent_file.mp4');
    const res = await request(app)
      .get(`/api/files/stream?path=${encodeURIComponent(fakePath)}`)
      .set('Cookie', masterCookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
