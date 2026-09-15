import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './src/index.mjs';
const origin = 'https://adon.com.tr';
const env = () => ({ CONTACT_ENABLED: 'true', ALLOWED_ORIGINS: origin, GOOGLE_CLIENT_ID: 'test', GOOGLE_CLIENT_SECRET: 'test', GOOGLE_REFRESH_TOKEN: 'test', CONTACT_LIMITER: { limit: async () => ({ success: true }) } });
const data = { name: 'Çağrı', email: 'visitor@example.com', company: 'Örnek', message: 'Ürün çekimi hakkında bilgi.' };
const req = (body = data, headers = {}) => new Request(origin + '/api/contact', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers }, body: JSON.stringify(body) });
test('unapproved origin rejected', async () => assert.equal((await worker.fetch(req(data, { Origin: 'https://elsewhere.example' }), env())).status, 403));
test('disabled endpoint fails closed', async () => assert.equal((await worker.fetch(req(), { ...env(), CONTACT_ENABLED: 'false' })).status, 503));
test('rate limit respected', async () => assert.equal((await worker.fetch(req(), { ...env(), CONTACT_LIMITER: { limit: async () => ({ success: false }) } })).status, 429));
test('oversized body rejected', async () => assert.equal((await worker.fetch(req({ ...data, message: 'x'.repeat(20000) }), env())).status, 413));
test('email header injection rejected', async () => assert.equal((await worker.fetch(req({ ...data, email: 'a@b.com\r\nBcc: x@y.com' }), env())).status, 400));
test('honeypot does not contact Google', async t => { t.mock.method(globalThis, 'fetch', () => { throw Error('must not call'); }); assert.equal((await worker.fetch(req({ ...data, website: 'spam' }), env())).status, 200); });
test('mail uses fixed recipient, visitor Reply-To and intact Turkish text', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    if (url.includes('/token')) return Response.json({ access_token: 'test-token' });
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    const mime = Buffer.from(JSON.parse(options.body).raw, 'base64url').toString('utf8');
    assert.match(mime, /To: info@adon.com.tr\r\n/);
    assert.match(mime, /Reply-To: visitor@example.com\r\n/);
    assert.match(Buffer.from(mime.split('\r\n\r\n')[1], 'base64').toString('utf8'), /Çağrı[\s\S]*Ürün çekimi/);
    return Response.json({ id: 'mock-message' });
  });
  const response = await worker.fetch(req(), env());
  assert.equal(response.status, 200); assert.equal(calls, 2);
});
test('Google failure never reported as success', async t => { t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 401 })); assert.equal((await worker.fetch(req(), env())).status, 502); });
