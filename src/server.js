'use strict';
/*
 * MajooKit server — zero external dependencies.
 * Node >= 22.5 (uses the built-in node:sqlite module).
 *
 *   public storefront   GET  /            -> public/index.html
 *   admin panel         GET  /admin       -> public/admin/index.html
 *   public API          /api/...
 *   admin API           /api/admin/...    (session cookie)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { open } = require('./db');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const UPLOADS = path.join(DATA, 'uploads');
const PORT = Number(process.env.PORT || 3000);
const SECURE_COOKIE = process.env.COOKIE_SECURE === '1';
const SESSION_DAYS = 14;
const MAX_JSON = 12 * 1024 * 1024; // 12 MB (image uploads arrive as base64 JSON)

fs.mkdirSync(UPLOADS, { recursive: true });
const db = open(DATA);

/* ---------- password + admin bootstrap ---------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored).split('$');
  if (alg !== 'scrypt') return false;
  const key = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  const want = Buffer.from(keyHex, 'hex');
  return key.length === want.length && crypto.timingSafeEqual(key, want);
}
(function bootstrapAdmin() {
  const row = db.prepare('SELECT id FROM admin WHERE id = 1').get();
  if (row) return;
  let pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    pw = crypto.randomBytes(9).toString('base64url');
    console.log('\n  ┌───────────────────────────────────────────────┐');
    console.log(`  │  Admin password (first run): ${pw.padEnd(17)}│`);
    console.log('  │  Change it in the panel: Settings → Password   │');
    console.log('  └───────────────────────────────────────────────┘\n');
  }
  db.prepare('INSERT INTO admin (id, pass_hash) VALUES (1, ?)').run(hashPassword(pw));
})();

/* ---------- helpers ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.usdz': 'model/vnd.usdz+zip', '.txt': 'text/plain; charset=utf-8'
};
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()'
};
function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
function json(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store', ...headers });
}
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg) => new HttpError(400, msg);

function readJson(req) {
  return new Promise((resolve, reject) => {
    const ct = req.headers['content-type'] || '';
    if (!ct.startsWith('application/json')) return reject(new HttpError(415, 'Content-Type باید application/json باشد'));
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_JSON) { reject(new HttpError(413, 'حجم درخواست زیاد است')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(bad('JSON نامعتبر')); } });
    req.on('error', reject);
  });
}
function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('='); if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const int = (v, min = 0, max = 1e12) => { const n = Math.round(Number(v)); if (!Number.isFinite(n)) return min; return Math.min(max, Math.max(min, n)); };
const num = (v, min = 0, max = 1e6) => { const n = Number(v); if (!Number.isFinite(n)) return min; return Math.min(max, Math.max(min, n)); };
const enumOf = (v, list, dflt) => (list.includes(v) ? v : dflt);
const toDigitsLatin = (s) => String(s || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const safeUrl = (u) => { u = str(u, 1000); if (!u) return ''; if (u.startsWith('/uploads/')) return u; try { const x = new URL(u); return ['http:', 'https:'].includes(x.protocol) ? x.href : ''; } catch { return ''; } };

const CATEGORIES = ['shelves', 'storage', 'desk', 'decor'];
const SPACES = ['home', 'office', 'small'];
const MODELS = ['cube', 'stair', 'column', 'doorcube', 'drawer', 'shoe', 'desk', 'riser', 'organizer', 'hex', 'plant', 'key', 'wallfold'];
const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'canceled'];

function rowToProduct(r, admin = false) {
  const p = {
    id: r.id, name: r.name, cat: r.category, type: r.model, spaces: JSON.parse(r.spaces), w: r.width_cm, d: r.depth_cm, h: r.height_cm,
    exp: !!r.expandable, compat: JSON.parse(r.compatible), diff: r.difficulty, time: r.assembly_min, parts: r.parts, price: r.price,
    use: r.use_case, description: r.description, images: JSON.parse(r.images), manual: r.manual_url, video: r.video_url,
    ref: [r.ref_name, r.ref_note, r.ref_url], inStock: r.stock > 0
  };
  if (admin) Object.assign(p, { stock: r.stock, active: !!r.active, sort: r.sort, created_at: r.created_at, updated_at: r.updated_at });
  return p;
}
function cleanProduct(b) {
  const spaces = Array.isArray(b.spaces) ? b.spaces.filter((s) => SPACES.includes(s)) : [];
  const compat = Array.isArray(b.compat) ? [...new Set(b.compat.map((x) => int(x, 1)))].slice(0, 20) : [];
  const images = Array.isArray(b.images) ? b.images.map(safeUrl).filter(Boolean).slice(0, 12) : [];
  const name = str(b.name, 120); if (!name) throw bad('نام محصول لازم است');
  return {
    name, category: enumOf(b.cat, CATEGORIES, 'shelves'), model: enumOf(b.type, MODELS, 'cube'),
    spaces: JSON.stringify(spaces), width_cm: num(b.w, 0, 1000), depth_cm: num(b.d, 0, 1000), height_cm: num(b.h, 0, 1000),
    expandable: b.exp ? 1 : 0, compatible: JSON.stringify(compat), difficulty: int(b.diff, 1, 3), assembly_min: int(b.time, 0, 1000),
    parts: int(b.parts, 0, 10000), price: int(b.price, 0, 1e11), use_case: str(b.use, 300), description: str(b.description, 4000),
    images: JSON.stringify(images), manual_url: safeUrl(b.manual), video_url: safeUrl(b.video),
    ref_name: str(b.ref?.[0], 80), ref_note: str(b.ref?.[1], 120), ref_url: safeUrl(b.ref?.[2]),
    stock: int(b.stock, 0, 1e6), active: b.active === false ? 0 : 1, sort: int(b.sort, 0, 1e6)
  };
}
function getSettings(publicOnly) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (!publicOnly) return s;
  return { store_name: s.store_name, whatsapp_number: s.whatsapp_number, whatsapp_display: s.whatsapp_display,
    announcement: s.announcement, shipping_note: s.shipping_note, show_reference: s.show_reference };
}

/* ---------- sessions + rate limit ---------- */
function createSession() {
  const token = crypto.randomBytes(32).toString('base64url');
  const exp = Date.now() + SESSION_DAYS * 864e5;
  db.prepare('INSERT INTO sessions (token, expires_at) VALUES (?, ?)').run(token, exp);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  return token;
}
function sessionCookie(token, maxAge) {
  return `mk_sess=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${SECURE_COOKIE ? '; Secure' : ''}`;
}
function isAuthed(req) {
  const t = parseCookies(req).mk_sess; if (!t) return false;
  const row = db.prepare('SELECT expires_at FROM sessions WHERE token = ?').get(t);
  return !!row && row.expires_at > Date.now();
}
const hits = new Map(); // ip -> [timestamps]
function rateLimit(req, key, limit, windowMs) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
  const k = key + ':' + ip; const now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(k, arr);
  if (arr.length > limit) throw new HttpError(429, 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره امتحان کنید.');
}

/* ---------- uploads (base64 JSON, images + pdf) ---------- */
const UPLOAD_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf', 'video/mp4': '.mp4' };
function saveUpload(dataUrl) {
  const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUrl || ''));
  if (!m || !UPLOAD_TYPES[m[1]]) throw bad('فقط JPG، PNG، WEBP، PDF یا MP4');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 10 * 1024 * 1024) throw new HttpError(413, 'حداکثر حجم فایل ۱۰ مگابایت است');
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}${UPLOAD_TYPES[m[1]]}`;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  return `/uploads/${name}`;
}

/* ---------- order code ---------- */
function orderCode() {
  const d = new Date(); const y = String(d.getFullYear()).slice(2);
  return `MK${y}${String(d.getMonth() + 1).padStart(2, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/* ---------- routes ---------- */
const routes = [];
const route = (method, pattern, handler, opts = {}) => {
  const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler, admin: pattern.startsWith('/api/admin/') && !opts.open });
};

// public
route('GET', '/api/products', () => db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort, id').all().map((r) => rowToProduct(r)));
route('GET', '/api/settings', () => getSettings(true));
route('POST', '/api/orders', async (req) => {
  rateLimit(req, 'order', 10, 10 * 60e3);
  const b = await readJson(req);
  const list = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  const get = db.prepare('SELECT id, name, price FROM products WHERE id = ? AND active = 1');
  const items = [];
  for (const it of list) { const p = get.get(int(it.id, 1)); const qty = int(it.qty, 1, 99); if (p) items.push({ id: p.id, name: p.name, price: p.price, qty }); }
  if (!items.length) throw bad('سبد خالی است');
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);
  const code = orderCode();
  db.prepare('INSERT INTO orders (code,name,phone,city,note,items,total) VALUES (?,?,?,?,?,?,?)')
    .run(code, str(b.name, 80), toDigitsLatin(str(b.phone, 20)), str(b.city, 60), str(b.note, 600), JSON.stringify(items), total);
  return { code, total, items };
});
route('POST', '/api/leads', async (req) => {
  rateLimit(req, 'lead', 8, 10 * 60e3);
  const b = await readJson(req);
  const kind = enumOf(b.kind, ['guide', 'custom-notify', 'question'], 'question');
  const phone = toDigitsLatin(str(b.phone, 20)).replace(/[^\d+]/g, '');
  if (kind !== 'guide' && phone.length < 8) throw bad('شماره‌ی موبایل معتبر نیست');
  db.prepare('INSERT INTO leads (kind, phone, note) VALUES (?,?,?)').run(kind, phone, str(b.note, 300));
  return { ok: true };
});

// admin auth
route('POST', '/api/admin/login', async (req, res) => {
  rateLimit(req, 'login', 8, 15 * 60e3);
  const b = await readJson(req);
  const row = db.prepare('SELECT pass_hash FROM admin WHERE id = 1').get();
  if (!row || !verifyPassword(str(b.password, 200), row.pass_hash)) throw new HttpError(401, 'رمز عبور اشتباه است');
  res.setHeader('Set-Cookie', sessionCookie(createSession(), SESSION_DAYS * 86400));
  return { ok: true };
}, { open: true });
route('POST', '/api/admin/logout', async (req, res) => {
  const t = parseCookies(req).mk_sess; if (t) db.prepare('DELETE FROM sessions WHERE token = ?').run(t);
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  return { ok: true };
}, { open: true });
route('GET', '/api/admin/me', (req) => ({ authed: isAuthed(req) }), { open: true });
route('PUT', '/api/admin/password', async (req) => {
  const b = await readJson(req);
  const row = db.prepare('SELECT pass_hash FROM admin WHERE id = 1').get();
  if (!verifyPassword(str(b.current, 200), row.pass_hash)) throw new HttpError(401, 'رمز فعلی اشتباه است');
  const next = str(b.next, 200); if (next.length < 8) throw bad('رمز جدید حداقل ۸ کاراکتر باشد');
  db.prepare("UPDATE admin SET pass_hash = ?, updated_at = datetime('now') WHERE id = 1").run(hashPassword(next));
  db.prepare('DELETE FROM sessions').run();
  return { ok: true };
});

// admin data
route('GET', '/api/admin/stats', () => {
  const q = (sql, ...a) => db.prepare(sql).get(...a);
  const days = db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS n, SUM(CASE WHEN status != 'canceled' THEN total ELSE 0 END) AS sum
    FROM orders WHERE created_at >= datetime('now','-13 days','start of day') GROUP BY day`).all();
  const top = db.prepare('SELECT items FROM orders WHERE status != \'canceled\'').all();
  const tally = {};
  for (const o of top) for (const i of JSON.parse(o.items)) { tally[i.id] = tally[i.id] || { id: i.id, name: i.name, qty: 0 }; tally[i.id].qty += i.qty; }
  return {
    products: q('SELECT COUNT(*) AS n FROM products').n,
    activeProducts: q('SELECT COUNT(*) AS n FROM products WHERE active = 1').n,
    lowStock: db.prepare('SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 3 ORDER BY stock').all(),
    ordersNew: q("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").n,
    ordersToday: q("SELECT COUNT(*) AS n FROM orders WHERE date(created_at) = date('now')").n,
    revenue30: q("SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE status != 'canceled' AND created_at >= datetime('now','-30 days')").s,
    orders30: q("SELECT COUNT(*) AS n FROM orders WHERE status != 'canceled' AND created_at >= datetime('now','-30 days')").n,
    leadsOpen: q('SELECT COUNT(*) AS n FROM leads WHERE handled = 0').n,
    days, top: Object.values(tally).sort((a, b) => b.qty - a.qty).slice(0, 5),
    recent: db.prepare('SELECT id, code, name, city, total, status, created_at FROM orders ORDER BY id DESC LIMIT 6').all()
  };
});
route('GET', '/api/admin/products', () => db.prepare('SELECT * FROM products ORDER BY sort, id').all().map((r) => rowToProduct(r, true)));
route('POST', '/api/admin/products', async (req) => {
  const p = cleanProduct(await readJson(req));
  const cols = Object.keys(p);
  const r = db.prepare(`INSERT INTO products (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...Object.values(p));
  return rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid), true);
});
route('PUT', '/api/admin/products/:id', async (req, res, { id }) => {
  const p = cleanProduct(await readJson(req));
  const r = db.prepare(`UPDATE products SET ${Object.keys(p).map((k) => k + ' = ?').join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(p), int(id, 1));
  if (!r.changes) throw new HttpError(404, 'محصول پیدا نشد');
  return rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(int(id, 1)), true);
});
route('PATCH', '/api/admin/products/:id', async (req, res, { id }) => {
  const b = await readJson(req); const sets = []; const vals = [];
  if ('active' in b) { sets.push('active = ?'); vals.push(b.active ? 1 : 0); }
  if ('stock' in b) { sets.push('stock = ?'); vals.push(int(b.stock, 0, 1e6)); }
  if ('price' in b) { sets.push('price = ?'); vals.push(int(b.price, 0, 1e11)); }
  if ('sort' in b) { sets.push('sort = ?'); vals.push(int(b.sort, 0, 1e6)); }
  if (!sets.length) throw bad('فیلدی برای تغییر نیست');
  db.prepare(`UPDATE products SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...vals, int(id, 1));
  return rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(int(id, 1)), true);
});
route('DELETE', '/api/admin/products/:id', (req, res, { id }) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(int(id, 1));
  return { ok: true };
});
route('POST', '/api/admin/upload', async (req) => ({ url: saveUpload((await readJson(req)).data) }));

route('GET', '/api/admin/orders', (req) => {
  const u = new URL(req.url, 'http://x'); const st = u.searchParams.get('status');
  const rows = STATUSES.includes(st) ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all(st) : db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  return rows.map((o) => ({ ...o, items: JSON.parse(o.items) }));
});
route('PUT', '/api/admin/orders/:id', async (req, res, { id }) => {
  const b = await readJson(req);
  db.prepare("UPDATE orders SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?")
    .run(enumOf(b.status, STATUSES, 'new'), str(b.admin_note, 1000), int(id, 1));
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(int(id, 1)); if (!o) throw new HttpError(404, 'سفارش پیدا نشد');
  return { ...o, items: JSON.parse(o.items) };
});
route('DELETE', '/api/admin/orders/:id', (req, res, { id }) => { db.prepare('DELETE FROM orders WHERE id = ?').run(int(id, 1)); return { ok: true }; });
route('GET', '/api/admin/orders.csv', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['code', 'date', 'status', 'name', 'phone', 'city', 'items', 'total_toman', 'note'].join(',')];
  for (const o of rows) lines.push([o.code, o.created_at, o.status, o.name, o.phone, o.city, JSON.parse(o.items).map((i) => `${i.name} x${i.qty}`).join(' | '), o.total, o.note].map(esc).join(','));
  send(res, 200, '﻿' + lines.join('\n'), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="majookit-orders.csv"' });
  return undefined;
});

route('GET', '/api/admin/leads', () => db.prepare('SELECT * FROM leads ORDER BY id DESC').all());
route('PATCH', '/api/admin/leads/:id', async (req, res, { id }) => {
  const b = await readJson(req); db.prepare('UPDATE leads SET handled = ? WHERE id = ?').run(b.handled ? 1 : 0, int(id, 1)); return { ok: true };
});
route('DELETE', '/api/admin/leads/:id', (req, res, { id }) => { db.prepare('DELETE FROM leads WHERE id = ?').run(int(id, 1)); return { ok: true }; });

route('GET', '/api/admin/settings', () => getSettings(false));
route('PUT', '/api/admin/settings', async (req) => {
  const b = await readJson(req);
  const allowed = { store_name: 60, whatsapp_number: 20, whatsapp_display: 30, announcement: 200, shipping_note: 300, show_reference: 1 };
  const up = db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const [k, max] of Object.entries(allowed)) if (k in b) {
    let v = str(b[k], max);
    if (k === 'whatsapp_number') v = toDigitsLatin(v).replace(/\D/g, '');
    if (k === 'show_reference') v = b[k] ? '1' : '0';
    up.run(k, v);
  }
  return getSettings(false);
});

/* ---------- static ---------- */
function serveStatic(req, res, pathname) {
  let file;
  if (pathname.startsWith('/uploads/')) file = path.join(UPLOADS, path.basename(pathname));
  else if (pathname === '/admin' || pathname === '/admin/') file = path.join(PUBLIC, 'admin', 'index.html');
  else file = path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname);
  file = path.normalize(file);
  if (!file.startsWith(PUBLIC) && !file.startsWith(UPLOADS)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      // unknown paths fall back to the storefront (hash-routed SPA)
      if (!path.extname(pathname)) return serveStatic(req, res, '/');
      return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    const ext = path.extname(file).toLowerCase();
    const cache = file.startsWith(UPLOADS) ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'no-cache' : 'public, max-age=3600';
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- server ---------- */
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname.startsWith('/api/')) {
      const r = routes.find((x) => x.method === req.method && x.re.test(pathname));
      if (!r) throw new HttpError(404, 'مسیر پیدا نشد');
      if (r.admin && !isAuthed(req)) throw new HttpError(401, 'وارد پنل شوید');
      const m = r.re.exec(pathname); const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const out = await r.handler(req, res, params);
      if (out !== undefined && !res.headersSent) json(res, 200, out);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed');
    serveStatic(req, res, decodeURIComponent(pathname));
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) json(res, status, { error: status === 500 ? 'خطای سرور' : e.message });
  }
});

server.listen(PORT, () => console.log(`MajooKit running → http://localhost:${PORT}  (admin: /admin)`));
module.exports = server;
