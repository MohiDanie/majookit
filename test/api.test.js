'use strict';
// Smoke tests: boots the server on a random port with a temp data dir and exercises the API.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'majoo-'));
process.env.DATA_DIR = dir; process.env.PORT = '0'; process.env.ADMIN_PASSWORD = 'test-password-123';
let server, base, cookie = '';

before(async () => {
  server = require('../src/server.js');
  await new Promise((r) => server.listening ? r() : server.on('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); fs.rmSync(dir, { recursive: true, force: true }); });

const req = async (p, opts = {}) => {
  const r = await fetch(base + p, { method: opts.method || 'GET', headers: { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return { status: r.status, data: await r.json().catch(() => null) };
};

test('public catalogue is seeded', async () => {
  const r = await req('/api/products');
  assert.equal(r.status, 200); assert.equal(r.data.length, 13);
  assert.ok(r.data[0].name && r.data[0].price > 0);
});

test('order total is computed on the server', async () => {
  const r = await req('/api/orders', { method: 'POST', body: { items: [{ id: 1, qty: 2 }, { id: 999, qty: 1 }], name: 'تست', phone: '۰۹۱۲۱۲۳۴۵۶۷', city: 'تهران', price: 1 } });
  assert.equal(r.status, 200); assert.equal(r.data.total, 1450000 * 2); assert.match(r.data.code, /^MK\d{4}-/);
});

test('admin API requires login', async () => {
  assert.equal((await req('/api/admin/orders')).status, 401);
  assert.equal((await req('/api/admin/login', { method: 'POST', body: { password: 'wrong' } })).status, 401);
  assert.equal((await req('/api/admin/login', { method: 'POST', body: { password: 'test-password-123' } })).status, 200);
  const o = await req('/api/admin/orders'); assert.equal(o.status, 200); assert.equal(o.data.length, 1);
});

test('admin can create, hide and delete a product', async () => {
  const c = await req('/api/admin/products', { method: 'POST', body: { name: 'کیت تست', cat: 'decor', type: 'hex', price: 1000, stock: 2 } });
  assert.equal(c.status, 200);
  await req(`/api/admin/products/${c.data.id}`, { method: 'PATCH', body: { active: false } });
  assert.ok(!(await req('/api/products')).data.some((p) => p.id === c.data.id));
  assert.equal((await req(`/api/admin/products/${c.data.id}`, { method: 'DELETE' })).status, 200);
});

test('settings update is reflected publicly', async () => {
  await req('/api/admin/settings', { method: 'PUT', body: { whatsapp_number: '+98 ۹۱۲ 111 2233', announcement: 'ارسال رایگان' } });
  const s = await req('/api/settings'); assert.equal(s.data.whatsapp_number, '989121112233'); assert.equal(s.data.announcement, 'ارسال رایگان');
});
