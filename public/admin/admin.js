'use strict';
/* MajooKit admin panel — vanilla JS, talks to /api/admin/* */

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const toLatin = (s) => String(s ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,]/g, '');
const money = (n) => `${fa(n)} تومان`;
const when = (iso) => { if (!iso) return ''; const d = new Date(iso.replace(' ', 'T') + 'Z'); return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }) + '، ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); };

async function api(url, opts = {}) {
  const init = { method: opts.method || 'GET', headers: {} };
  if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
  const r = await fetch(url, init);
  if (r.status === 401 && !url.endsWith('/login')) { App.authed = false; render(); throw new Error('وارد پنل شوید'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'خطا در ارتباط با سرور');
  return d;
}
function toast(msg, err) { const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2800); }
function confirmBox(text, okLabel = 'حذف') {
  return new Promise((res) => {
    $('#modal').innerHTML = `<div class="scrim" data-x></div><div class="dialog" role="alertdialog" aria-modal="true"><p>${esc(text)}</p><div class="btns"><button class="btn" data-x>انصراف</button><button class="btn danger" id="okBtn">${esc(okLabel)}</button></div></div>`;
    const done = (v) => { $('#modal').innerHTML = ''; res(v); };
    $$('[data-x]', $('#modal')).forEach((b) => (b.onclick = () => done(false)));
    $('#okBtn').onclick = () => done(true); $('#okBtn').focus();
  });
}
const fileToDataUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
async function shrinkImage(file, max = 1800) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return fileToDataUrl(file);
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
}
async function upload(file) {
  const data = file.type.startsWith('image/') ? await shrinkImage(file) : await fileToDataUrl(file);
  return (await api('/api/admin/upload', { method: 'POST', body: { data } })).url;
}

/* ---------- constants ---------- */
const CATS = { shelves: 'قفسه', storage: 'ذخیره‌سازی', desk: 'میز و کار', decor: 'دکور' };
const SPACES = { home: 'خانه', office: 'دفتر کار', small: 'فضاهای کوچک' };
const MODELS = { cube: 'مکعب پایه', stair: 'قفسه پلکانی', column: 'کتابخانه ستونی', doorcube: 'مکعب با در', drawer: 'باکس کشو', shoe: 'جاکفشی', desk: 'میز تحریر', riser: 'رایزر', organizer: 'ارگانایزر', hex: 'شش‌ضلعی دیواری', plant: 'استند گیاه', key: 'جاکلیدی', wallfold: 'میز تاشو دیواری' };
const STATUS = { new: 'جدید', confirmed: 'تأییدشده', shipped: 'ارسال‌شده', delivered: 'تحویل‌شده', canceled: 'لغوشده' };
const LEADS = { guide: 'راهنمای رایگان', 'custom-notify': 'خبرم کن (سفارشی‌سازی)', question: 'سؤال' };
const LOW = 3;

const I = {
  logo: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="16" height="16" rx="2" fill="var(--mdf)" stroke="var(--mdf-e)" stroke-width="3"/><rect x="21" y="3" width="16" height="16" rx="2" fill="var(--mdf)" stroke="var(--mdf-e)" stroke-width="3"/><rect x="3" y="21" width="16" height="16" rx="2" fill="var(--mdf)" stroke="var(--mdf-e)" stroke-width="3"/><path d="M29 23v12M23 29h12" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round"/></svg>',
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="7" height="9" rx="1"/><rect x="13" y="4" width="7" height="5" rx="1"/><rect x="13" y="11" width="7" height="9" rx="1"/><rect x="4" y="15" width="7" height="5" rx="1"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h14l-1.4 11H6.4z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 13h4l2 3h4l2-3h4"/><path d="M6 5h12l2 8v6H4v-6z"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9z"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/></svg>'
};
const NAV = [['dashboard', 'داشبورد', I.dash], ['products', 'محصولات', I.box], ['orders', 'سفارش‌ها', I.cart], ['leads', 'درخواست‌ها', I.inbox], ['settings', 'تنظیمات', I.gear]];

/* ---------- state ---------- */
const App = { authed: null, view: 'dashboard', stats: null, products: [], orders: [], leads: [], settings: {}, oFilter: 'all', pQuery: '', pCat: 'all' };

/* ---------- shell ---------- */
function render() {
  if (App.authed === null) { $('#app').innerHTML = '<div class="login"><div class="skel" style="width:320px"></div></div>'; return; }
  if (!App.authed) return renderLogin();
  const v = (location.hash.slice(1) || 'dashboard').split('/')[0];
  App.view = NAV.some((n) => n[0] === v) ? v : 'dashboard';
  const pill = (k) => (k === 'orders' && App.stats?.ordersNew ? `<span class="pill num">${fa(App.stats.ordersNew)}</span>` : k === 'leads' && App.stats?.leadsOpen ? `<span class="pill num">${fa(App.stats.leadsOpen)}</span>` : '');
  $('#app').innerHTML = `
  <div class="shell">
    <aside class="side">
      <a class="brand" href="#dashboard">${I.logo}<span>ماجوکیت<small>پنل مدیریت</small></span></a>
      <nav class="nav">${NAV.map(([k, n, ic]) => `<a href="#${k}" ${App.view === k ? 'aria-current="page"' : ''}>${ic}${n}${pill(k)}</a>`).join('')}</nav>
      <div class="foot nav"><a href="/" target="_blank" rel="noopener">${I.ext}دیدن فروشگاه</a><a href="#" id="logout">${I.out}خروج</a></div>
    </aside>
    <div class="topbar"><a class="brand" href="#dashboard">${I.logo}<span>ماجوکیت<small>پنل مدیریت</small></span></a><div class="tools"><a class="btn sm ghost" href="/" target="_blank" rel="noopener">${I.ext}فروشگاه</a><button class="btn sm ghost" id="logoutM" aria-label="خروج">${I.out}</button></div></div>
    <main class="main" id="main"><div class="skel"></div></main>
    <nav class="mnav">${NAV.map(([k, n, ic]) => `<a href="#${k}" ${App.view === k ? 'aria-current="page"' : ''}>${ic}${n}${pill(k)}</a>`).join('')}</nav>
  </div>`;
  ({ dashboard: viewDashboard, products: viewProducts, orders: viewOrders, leads: viewLeads, settings: viewSettings })[App.view]();
}
async function refreshStats() { try { App.stats = await api('/api/admin/stats'); } catch (e) { /* handled */ } }

function renderLogin() {
  $('#app').innerHTML = `<div class="login"><form id="loginForm">
    <a class="brand" href="/">${I.logo}<span>ماجوکیت<small>ورود به پنل مدیریت</small></span></a>
    <label class="field"><span>رمز عبور</span><input class="input ltr" id="pw" type="password" autocomplete="current-password" required></label>
    <p class="hint" id="loginErr" role="alert" hidden></p>
    <button class="btn primary">ورود</button>
    <p class="hint">رمز اولیه هنگام اولین اجرای سرور در کنسول چاپ می‌شود، یا با متغیر ADMIN_PASSWORD تعیین می‌شود.</p>
  </form></div>`;
  $('#pw').focus();
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault(); const err = $('#loginErr'); err.hidden = true;
    try { await api('/api/admin/login', { method: 'POST', body: { password: $('#pw').value } }); App.authed = true; await refreshStats(); render(); }
    catch (x) { err.hidden = false; err.textContent = x.message; }
  };
}

/* ---------- dashboard ---------- */
function barChart(days) {
  const map = Object.fromEntries((days || []).map((d) => [d.day, d]));
  const list = []; const today = new Date();
  for (let i = 13; i >= 0; i--) { const d = new Date(today); d.setUTCDate(d.getUTCDate() - i); const k = d.toISOString().slice(0, 10); list.push({ k, n: map[k]?.n || 0, d }); }
  const max = Math.max(4, ...list.map((x) => x.n)); const W = 560, H = 180, L = 28, B = 26, T = 10; const bw = (W - L) / list.length;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, Math.ceil(max / 2), max];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="تعداد سفارش در ۱۴ روز اخیر">
    ${ticks.map((t) => `<line class="grid" x1="0" x2="${W - L}" y1="${y(t)}" y2="${y(t)}"/><text x="${W - L + 6}" y="${y(t) + 3}">${fa(t)}</text>`).join('')}
    ${list.map((x, i) => { const xx = W - L - (i + 1) * bw + bw * 0.18, h = (H - T - B) * (x.n / max); return `<rect class="bar ${i === 13 ? 'today' : ''}" x="${xx}" y="${y(x.n)}" width="${bw * 0.64}" height="${Math.max(h, x.n ? 2 : 0)}" rx="3"><title>${x.d.toLocaleDateString('fa-IR')}: ${fa(x.n)} سفارش</title></rect>${i % 2 === 1 || i === 13 ? `<text x="${xx + bw * 0.32}" y="${H - 8}" text-anchor="middle">${x.d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'numeric' })}</text>` : ''}`; }).join('')}
  </svg>`;
}
async function viewDashboard() {
  await refreshStats(); const s = App.stats; if (!s) return;
  $('#main').innerHTML = `
    <div class="ph"><div><h1>داشبورد</h1><p>خلاصه‌ی وضعیت فروشگاه</p></div></div>
    <div class="kpis">
      <a class="kpi ${s.ordersNew ? 'hot' : ''}" href="#orders"><span>سفارش‌های جدید</span><b>${fa(s.ordersNew)}</b><small>منتظر تأیید</small></a>
      <div class="kpi"><span>سفارش امروز</span><b>${fa(s.ordersToday)}</b><small>${fa(s.orders30)} سفارش در ۳۰ روز</small></div>
      <div class="kpi"><span>فروش ۳۰ روز</span><b>${fa(Math.round(s.revenue30 / 1e6 * 10) / 10)}<small style="font-size:13px"> میلیون</small></b><small>بدون سفارش‌های لغوشده</small></div>
      <a class="kpi" href="#products"><span>محصولات فعال</span><b>${fa(s.activeProducts)}</b><small>از ${fa(s.products)} محصول</small></a>
    </div>
    <div class="grid2">
      <div class="card"><h2>سفارش‌ها در ۱۴ روز اخیر</h2>${barChart(s.days)}</div>
      <div class="card"><h2>آخرین سفارش‌ها <a href="#orders">همه</a></h2>
        <div class="rows">${s.recent.length ? s.recent.map((o) => `<a class="row" href="#orders/${o.id}" style="text-decoration:none"><div class="grow"><b>${esc(o.name || 'بدون نام')} · ${esc(o.city)}</b><small class="num">${esc(o.code)} · ${when(o.created_at)}</small></div><span class="badge st-${o.status}">${STATUS[o.status]}</span></a>`).join('') : '<p class="empty">هنوز سفارشی ثبت نشده است.</p>'}</div></div>
    </div>
    <div class="grid2" style="margin-top:12px">
      <div class="card"><h2>پرفروش‌ها</h2><div class="rows">${s.top.length ? s.top.map((t, i) => `<div class="row"><span class="num" style="width:20px;color:var(--muted)">${fa(i + 1)}</span><div class="grow"><b>${esc(t.name)}</b></div><span class="num">${fa(t.qty)} عدد</span></div>`).join('') : '<p class="empty">بعد از اولین سفارش‌ها اینجا پر می‌شود.</p>'}</div></div>
      <div class="card"><h2>موجودی کم ${s.lowStock.length ? `<span class="badge low">${fa(s.lowStock.length)}</span>` : ''}</h2><div class="rows">${s.lowStock.length ? s.lowStock.map((p) => `<div class="row"><div class="grow"><b>${esc(p.name)}</b></div><span class="badge ${p.stock ? 'low' : 'mute'}">${p.stock ? fa(p.stock) + ' عدد' : 'ناموجود'}</span><button class="btn sm" data-edit="${p.id}">ویرایش</button></div>`).join('') : '<p class="empty">موجودی همه‌ی محصولات کافی است.</p>'}</div></div>
    </div>`;
}

/* ---------- products ---------- */
async function loadProducts() { App.products = await api('/api/admin/products'); }
async function viewProducts() {
  await loadProducts();
  $('#main').innerHTML = `
    <div class="ph"><div><h1>محصولات</h1><p>${fa(App.products.length)} محصول · ${fa(App.products.filter((p) => p.active).length)} فعال در فروشگاه</p></div>
      <div class="tools">
        <label class="search">${I.search}<input class="input" id="pq" type="search" placeholder="جستجوی نام" value="${esc(App.pQuery)}" aria-label="جستجوی محصول"></label>
        <select class="input" id="pcat" style="width:auto" aria-label="دسته">${[['all', 'همه‌ی دسته‌ها'], ...Object.entries(CATS)].map(([k, n]) => `<option value="${k}" ${App.pCat === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <button class="btn primary" id="newProduct">${I.plus}محصول جدید</button>
      </div></div>
    <div class="tablewrap"><table>
      <thead><tr><th>محصول</th><th>دسته</th><th>قیمت (تومان)</th><th>موجودی</th><th>نمایش</th><th></th></tr></thead>
      <tbody id="ptbody"></tbody></table></div>
    <p class="hint" style="margin-top:8px">قیمت و موجودی را مستقیم در جدول تغییر دهید؛ با خروج از خانه ذخیره می‌شود.</p>`;
  fillProductRows();
  const ed = location.hash.split('/')[1]; if (ed) openProduct(ed === 'new' ? null : +ed);
}
function fillProductRows() {
  const q = App.pQuery.trim();
  const list = App.products.filter((p) => (App.pCat === 'all' || p.cat === App.pCat) && (!q || p.name.includes(q)));
  $('#ptbody').innerHTML = list.length ? list.map((p) => `
    <tr class="${p.active ? '' : 'off'}">
      <td><div class="pcell"><span class="thumb">${p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : I.img}</span><div><b>${esc(p.name)}</b><small class="num">${fa(p.w)}×${fa(p.d)}×${fa(p.h)} · ${MODELS[p.type] || ''}</small></div></div></td>
      <td>${CATS[p.cat]}</td>
      <td><input class="input mini-in num" data-quick="price" data-id="${p.id}" value="${p.price}" inputmode="numeric" aria-label="قیمت ${esc(p.name)}"></td>
      <td><input class="input mini-in num" style="width:70px" data-quick="stock" data-id="${p.id}" value="${p.stock}" inputmode="numeric" aria-label="موجودی ${esc(p.name)}"> ${p.stock <= LOW ? `<span class="badge ${p.stock ? 'low' : 'mute'}">${p.stock ? 'کم' : 'ناموجود'}</span>` : ''}</td>
      <td><label class="switch"><input type="checkbox" data-active="${p.id}" ${p.active ? 'checked' : ''} aria-label="نمایش ${esc(p.name)} در فروشگاه"></label></td>
      <td><div class="acts"><a class="btn icon ghost" href="/#p${p.id}" target="_blank" rel="noopener" aria-label="دیدن در فروشگاه">${I.ext}</a><button class="btn icon ghost" data-edit="${p.id}" aria-label="ویرایش">${I.edit}</button><button class="btn icon ghost" data-del="${p.id}" aria-label="حذف">${I.trash}</button></div></td>
    </tr>`).join('') : `<tr><td colspan="6"><p class="empty">محصولی با این جستجو پیدا نشد.</p></td></tr>`;
}

const blankProduct = () => ({ name: '', cat: 'shelves', type: 'cube', spaces: ['home'], w: 40, d: 30, h: 40, exp: true, compat: [], diff: 1, time: 15, parts: 6, price: 0, use: '', description: '', images: [], manual: '', video: '', ref: ['', '', ''], stock: 10, active: true, sort: App.products.length });
let draft = null;
async function openProduct(id) {
  if (!App.products.length) await loadProducts();
  const p = id ? App.products.find((x) => x.id === id) : blankProduct();
  if (!p) { toast('محصول پیدا نشد', true); return; }
  draft = JSON.parse(JSON.stringify(p));
  const others = App.products.filter((x) => x.id !== id);
  $('#modal').innerHTML = `<div class="scrim" data-close></div>
  <form class="drawer" id="pform" role="dialog" aria-modal="true" aria-label="${id ? 'ویرایش محصول' : 'محصول جدید'}">
    <header><h2>${id ? 'ویرایش: ' + esc(p.name) : 'محصول جدید'}</h2><button type="button" class="btn icon ghost" data-close aria-label="بستن">✕</button></header>
    <div class="body">
      <section class="sec"><h3>اطلاعات اصلی</h3>
        <label class="field"><span>نام محصول</span><input class="input" name="name" required maxlength="120" value="${esc(p.name)}"></label>
        <div class="f2">
          <label class="field"><span>دسته</span><select class="input" name="cat">${Object.entries(CATS).map(([k, n]) => `<option value="${k}" ${p.cat === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="field"><span>مدل سه‌بعدی</span><select class="input" name="type">${Object.entries(MODELS).map(([k, n]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        </div>
        <label class="field"><span>کاربرد (یک خط، روی کارت محصول)</span><input class="input" name="use" maxlength="300" value="${esc(p.use)}"></label>
        <label class="field"><span>توضیحات کامل</span><textarea class="input" name="description" maxlength="4000">${esc(p.description)}</textarea></label>
      </section>
      <section class="sec"><h3>قیمت و موجودی</h3>
        <div class="f3">
          <label class="field"><span>قیمت (تومان)</span><input class="input num" name="price" inputmode="numeric" value="${p.price}"></label>
          <label class="field"><span>موجودی</span><input class="input num" name="stock" inputmode="numeric" value="${p.stock}"></label>
          <label class="field"><span>ترتیب نمایش</span><input class="input num" name="sort" inputmode="numeric" value="${p.sort}"></label>
        </div>
        <label class="switch"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> نمایش در فروشگاه</label>
      </section>
      <section class="sec"><h3>ابعاد و مونتاژ</h3>
        <div class="f3">
          <label class="field"><span>عرض (cm)</span><input class="input num" name="w" inputmode="decimal" value="${p.w}"></label>
          <label class="field"><span>عمق (cm)</span><input class="input num" name="d" inputmode="decimal" value="${p.d}"></label>
          <label class="field"><span>ارتفاع (cm)</span><input class="input num" name="h" inputmode="decimal" value="${p.h}"></label>
          <label class="field"><span>تعداد قطعات</span><input class="input num" name="parts" inputmode="numeric" value="${p.parts}"></label>
          <label class="field"><span>زمان مونتاژ (دقیقه)</span><input class="input num" name="time" inputmode="numeric" value="${p.time}"></label>
          <label class="field"><span>سختی</span><select class="input" name="diff">${[1, 2, 3].map((d) => `<option value="${d}" ${p.diff === d ? 'selected' : ''}>${'★'.repeat(d)} ${['', 'آسان', 'متوسط', 'چالشی'][d]}</option>`).join('')}</select></label>
        </div>
        <div class="field"><span>مناسب برای فضای</span><div class="wrapchips">${Object.entries(SPACES).map(([k, n]) => `<label class="chk"><input type="checkbox" name="spaces" value="${k}" ${p.spaces.includes(k) ? 'checked' : ''}>${n}</label>`).join('')}</div></div>
      </section>
      <section class="sec"><h3>ماژولار بودن</h3>
        <label class="switch"><input type="checkbox" name="exp" ${p.exp ? 'checked' : ''}> قابل توسعه (برچسب «+ قابل توسعه»)</label>
        <div class="field"><span>کیت‌های سازگار («این کیت وصل می‌شود به»)</span><div class="wrapchips">${others.map((o) => `<label class="chk"><input type="checkbox" name="compat" value="${o.id}" ${p.compat.includes(o.id) ? 'checked' : ''}>${esc(o.name)}</label>`).join('') || '<small>محصول دیگری نیست.</small>'}</div></div>
      </section>
      <section class="sec"><h3>عکس‌ها</h3>
        <p class="hint">عکس اول، عکس اصلی کارت محصول است. تا ۱۲ عکس؛ عکس‌های بزرگ خودکار کوچک می‌شوند.</p>
        <div class="media" id="media"></div>
      </section>
      <section class="sec"><h3>دفترچه و ویدیو</h3>
        <div class="urlrow"><label class="field"><span>دفترچه‌ی PDF مونتاژ</span><input class="input ltr" name="manual" value="${esc(p.manual)}" placeholder="/uploads/... یا https://..."></label><label class="btn" style="position:relative">آپلود PDF<input type="file" accept="application/pdf" data-up="manual" style="position:absolute;opacity:0;width:1px"></label></div>
        <div class="urlrow"><label class="field"><span>ویدیوی مونتاژ (MP4)</span><input class="input ltr" name="video" value="${esc(p.video)}" placeholder="/uploads/... یا https://..."></label><label class="btn" style="position:relative">آپلود ویدیو<input type="file" accept="video/mp4" data-up="video" style="position:absolute;opacity:0;width:1px"></label></div>
      </section>
      <section class="sec"><h3>تیکت مرجع</h3>
        <div class="f2"><label class="field"><span>نام مرجع</span><input class="input" name="ref0" value="${esc(p.ref[0])}" placeholder="مثلاً KALLAX"></label><label class="field"><span>توضیح کوتاه</span><input class="input" name="ref1" value="${esc(p.ref[1])}"></label></div>
        <label class="field"><span>لینک صفحه‌ی مرجع</span><input class="input ltr" name="ref2" value="${esc(p.ref[2])}" placeholder="https://"></label>
      </section>
    </div>
    <footer>${id ? `<button type="button" class="btn danger" data-del="${id}">${I.trash}حذف</button>` : '<span></span>'}<div class="tools"><button type="button" class="btn" data-close>انصراف</button><button class="btn primary" id="psave">${id ? 'ذخیره‌ی تغییرات' : 'افزودن محصول'}</button></div></footer>
  </form>`;
  renderMedia();
  $('#pform [name="name"]').focus();
  $('#pform').onsubmit = (e) => { e.preventDefault(); saveProduct(id); };
}
function renderMedia() {
  $('#media').innerHTML = draft.images.map((u, i) => `<div class="mitem">${i === 0 ? '<span class="cover">اصلی</span>' : ''}<img src="${esc(u)}" alt=""><div class="mbar"><button type="button" data-mv="${i}" data-dir="-1" aria-label="جلوتر" ${i === 0 ? 'disabled' : ''}>→</button><button type="button" data-rm="${i}" aria-label="حذف عکس">✕</button><button type="button" data-mv="${i}" data-dir="1" aria-label="عقب‌تر" ${i === draft.images.length - 1 ? 'disabled' : ''}>←</button></div></div>`).join('')
    + (draft.images.length < 12 ? `<label class="drop" id="drop">${I.plus.replace('<svg', '<svg width="22" height="22"')}<span>افزودن عکس<br>یا رها کردن اینجا</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple id="imgIn"></label>` : '');
  const drop = $('#drop'); if (!drop) return;
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => addImages([...e.dataTransfer.files]));
  $('#imgIn').onchange = (e) => addImages([...e.target.files]);
}
async function addImages(files) {
  files = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type)).slice(0, 12 - draft.images.length);
  if (!files.length) return toast('فقط JPG، PNG یا WEBP', true);
  toast(`در حال آپلود ${fa(files.length)} عکس…`);
  for (const f of files) { try { draft.images.push(await upload(f)); renderMedia(); } catch (e) { toast(e.message, true); } }
}
function readForm() {
  const f = $('#pform'); const v = (n) => f.elements[n].value; const nm = (n) => Number(toLatin(v(n))) || 0;
  return { ...draft, name: v('name').trim(), cat: v('cat'), type: v('type'), use: v('use').trim(), description: v('description').trim(),
    price: nm('price'), stock: nm('stock'), sort: nm('sort'), active: f.elements.active.checked,
    w: nm('w'), d: nm('d'), h: nm('h'), parts: nm('parts'), time: nm('time'), diff: +v('diff'),
    spaces: $$('[name="spaces"]:checked', f).map((x) => x.value), exp: f.elements.exp.checked,
    compat: $$('[name="compat"]:checked', f).map((x) => +x.value),
    manual: v('manual').trim(), video: v('video').trim(), ref: [v('ref0').trim(), v('ref1').trim(), v('ref2').trim()] };
}
async function saveProduct(id) {
  const body = readForm(); if (!body.name) return toast('نام محصول لازم است', true);
  const btn = $('#psave'); btn.disabled = true;
  try {
    await api(id ? `/api/admin/products/${id}` : '/api/admin/products', { method: id ? 'PUT' : 'POST', body });
    toast(id ? 'تغییرات ذخیره شد' : 'محصول اضافه شد'); closeModal(); await loadProducts(); if ($('#ptbody')) fillProductRows();
  } catch (e) { toast(e.message, true); btn.disabled = false; }
}
async function deleteProduct(id) {
  const p = App.products.find((x) => x.id === id) || { name: 'این محصول' };
  if (!(await confirmBox(`«${p.name}» برای همیشه حذف شود؟ سفارش‌های قبلی دست نمی‌خورند. اگر فقط می‌خواهید پنهانش کنید، «نمایش» را خاموش کنید.`))) return;
  try { await api(`/api/admin/products/${id}`, { method: 'DELETE' }); toast('محصول حذف شد'); closeModal(); await loadProducts(); if ($('#ptbody')) fillProductRows(); } catch (e) { toast(e.message, true); }
}
function closeModal() { $('#modal').innerHTML = ''; draft = null; const [v, sub] = location.hash.slice(1).split('/'); if (sub) history.replaceState(null, '', '#' + v); }

/* ---------- orders ---------- */
async function viewOrders() {
  App.orders = await api('/api/admin/orders');
  const count = (k) => (k === 'all' ? App.orders.length : App.orders.filter((o) => o.status === k).length);
  $('#main').innerHTML = `
    <div class="ph"><div><h1>سفارش‌ها</h1><p>سفارش‌های ثبت‌شده از فروشگاه. هر سفارش در واتس‌اپ نهایی می‌شود.</p></div>
      <div class="tools"><a class="btn" href="/api/admin/orders.csv">${I.dl}خروجی اکسل (CSV)</a></div></div>
    <div class="tabs" role="group" aria-label="وضعیت">${[['all', 'همه'], ...Object.entries(STATUS)].map(([k, n]) => `<button data-of="${k}" aria-pressed="${App.oFilter === k}">${n}<span class="n num">${fa(count(k))}</span></button>`).join('')}</div>
    <div class="olist" id="olist"></div>`;
  fillOrders();
  const id = +location.hash.split('/')[1]; if (id) openOrder(id);
}
function fillOrders() {
  const list = App.orders.filter((o) => App.oFilter === 'all' || o.status === App.oFilter);
  $('#olist').innerHTML = list.length ? list.map((o) => `<button class="ocard" data-order="${o.id}">
    <span><span class="code num">${esc(o.code)}</span> · <b>${esc(o.name || 'بدون نام')}</b></span><span class="badge st-${o.status}">${STATUS[o.status]}</span>
    <span class="meta"><span>${esc(o.city || 'شهر نامشخص')}</span><span>${fa(o.items.reduce((a, i) => a + i.qty, 0))} قلم</span><span class="total num">${money(o.total)}</span><span>${when(o.created_at)}</span></span>
  </button>`).join('') : '<div class="card empty">سفارشی در این وضعیت نیست.</div>';
}
function waToCustomer(o) {
  let ph = toLatin(o.phone).replace(/\D/g, ''); if (ph.startsWith('0')) ph = '98' + ph.slice(1);
  const msg = `سلام ${o.name || ''}، سفارش ${o.code} شما در ماجوکیت ${STATUS[o.status]} است.`;
  return ph.length >= 10 ? `https://wa.me/${ph}?text=${encodeURIComponent(msg)}` : '';
}
function openOrder(id) {
  const o = App.orders.find((x) => x.id === id); if (!o) return;
  history.replaceState(null, '', '#orders/' + id);
  const wa = waToCustomer(o);
  $('#modal').innerHTML = `<div class="scrim" data-close></div>
  <form class="drawer" id="oform" role="dialog" aria-modal="true" aria-label="سفارش ${esc(o.code)}">
    <header><h2>سفارش <span class="num" dir="ltr">${esc(o.code)}</span></h2><button type="button" class="btn icon ghost" data-close aria-label="بستن">✕</button></header>
    <div class="body">
      <section class="sec"><h3>اقلام</h3><div class="items">${o.items.map((i) => `<div><span>${esc(i.name)} × ${fa(i.qty)}</span><span class="num">${money(i.price * i.qty)}</span></div>`).join('')}<div style="border-top:1px solid var(--line);padding-top:6px;font-weight:800"><span>جمع</span><span class="num">${money(o.total)}</span></div></div></section>
      <section class="sec"><h3>مشتری</h3><dl class="kv"><dt>نام</dt><dd>${esc(o.name) || '—'}</dd><dt>موبایل</dt><dd class="num" dir="ltr" style="text-align:right">${esc(o.phone) || '—'}</dd><dt>شهر</dt><dd>${esc(o.city) || '—'}</dd><dt>توضیح</dt><dd>${esc(o.note) || '—'}</dd><dt>ثبت</dt><dd>${when(o.created_at)}</dd></dl>
        <div class="tools">${wa ? `<a class="btn accent" href="${wa}" target="_blank" rel="noopener">${I.wa}پیام به مشتری در واتس‌اپ</a>` : ''}${o.phone ? `<a class="btn" href="tel:${esc(toLatin(o.phone))}">تماس</a>` : ''}</div></section>
      <section class="sec"><h3>وضعیت</h3>
        <div class="wrapchips">${Object.entries(STATUS).map(([k, n]) => `<label class="chk"><input type="radio" name="status" value="${k}" ${o.status === k ? 'checked' : ''}>${n}</label>`).join('')}</div>
        <label class="field"><span>یادداشت داخلی</span><textarea class="input" name="admin_note" maxlength="1000" placeholder="مثلاً کد رهگیری پست، هزینه‌ی ارسال اعلام‌شده">${esc(o.admin_note)}</textarea></label>
      </section>
    </div>
    <footer><button type="button" class="btn danger" data-odel="${o.id}">${I.trash}حذف</button><div class="tools"><button type="button" class="btn" data-close>بستن</button><button class="btn primary">ذخیره</button></div></footer>
  </form>`;
  $('#oform').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    try { const up = await api(`/api/admin/orders/${id}`, { method: 'PUT', body: { status: f.elements.status.value, admin_note: f.elements.admin_note.value } });
      Object.assign(o, up); toast('سفارش به‌روز شد'); closeModal(); await refreshStats(); render(); } catch (x) { toast(x.message, true); }
  };
}

/* ---------- leads ---------- */
async function viewLeads() {
  App.leads = await api('/api/admin/leads');
  $('#main').innerHTML = `
    <div class="ph"><div><h1>درخواست‌ها</h1><p>درخواست راهنمای رایگان و «خبرم کن» از فروشگاه</p></div></div>
    <div class="tablewrap"><table style="min-width:620px"><thead><tr><th>نوع</th><th>موبایل</th><th>زمان</th><th>وضعیت</th><th></th></tr></thead><tbody>
    ${App.leads.length ? App.leads.map((l) => { const wa = waToCustomer({ phone: l.phone, name: '', code: '', status: 'new' }); return `<tr class="${l.handled ? 'off' : ''}"><td>${LEADS[l.kind] || esc(l.kind)}</td><td class="num" dir="ltr" style="text-align:right">${esc(l.phone) || '—'}</td><td>${when(l.created_at)}</td>
      <td><label class="switch"><input type="checkbox" data-handled="${l.id}" ${l.handled ? 'checked' : ''}> ${l.handled ? 'پیگیری شد' : 'باز'}</label></td>
      <td><div class="acts">${l.phone && wa ? `<a class="btn icon ghost" href="https://wa.me/${toLatin(l.phone).replace(/\D/g, '').replace(/^0/, '98')}" target="_blank" rel="noopener" aria-label="واتس‌اپ">${I.wa}</a>` : ''}<button class="btn icon ghost" data-ldel="${l.id}" aria-label="حذف">${I.trash}</button></div></td></tr>`; }).join('') : '<tr><td colspan="5"><p class="empty">درخواستی ثبت نشده است.</p></td></tr>'}
    </tbody></table></div>`;
}

/* ---------- settings ---------- */
async function viewSettings() {
  App.settings = await api('/api/admin/settings'); const s = App.settings;
  $('#main').innerHTML = `
    <div class="ph"><div><h1>تنظیمات</h1><p>اطلاعات فروشگاه، واتس‌اپ و امنیت</p></div></div>
    <div class="grid2">
      <form class="card" id="sform" style="display:grid;gap:12px;align-content:start">
        <h2>فروشگاه</h2>
        <label class="field"><span>نام فروشگاه</span><input class="input" name="store_name" maxlength="60" value="${esc(s.store_name)}"></label>
        <div class="f2">
          <label class="field"><span>شماره‌ی واتس‌اپ (برای لینک)</span><input class="input ltr num" name="whatsapp_number" value="${esc(s.whatsapp_number)}" placeholder="98912xxxxxxx"><small>با کد کشور و بدون صفر اول، مثلاً 989121234567</small></label>
          <label class="field"><span>شماره‌ی نمایشی</span><input class="input ltr" name="whatsapp_display" value="${esc(s.whatsapp_display)}" placeholder="+98 912 123 4567"></label>
        </div>
        <label class="field"><span>نوار اطلاعیه بالای سایت</span><input class="input" name="announcement" maxlength="200" value="${esc(s.announcement)}" placeholder="مثلاً ارسال رایگان تا پایان آذر"><small>خالی بگذارید تا نمایش داده نشود.</small></label>
        <label class="field"><span>توضیح هزینه‌ی ارسال (صفحه‌ی سفارش)</span><input class="input" name="shipping_note" maxlength="300" value="${esc(s.shipping_note)}"></label>
        <label class="switch"><input type="checkbox" name="show_reference" ${s.show_reference === '1' ? 'checked' : ''}> نمایش تیکت‌های مرجع ایکیا در فروشگاه</label>
        <div><button class="btn primary">ذخیره‌ی تنظیمات</button></div>
      </form>
      <form class="card" id="pwform" style="display:grid;gap:12px;align-content:start">
        <h2>تغییر رمز عبور</h2>
        <label class="field"><span>رمز فعلی</span><input class="input ltr" type="password" name="current" autocomplete="current-password" required></label>
        <label class="field"><span>رمز جدید</span><input class="input ltr" type="password" name="next" autocomplete="new-password" minlength="8" required><small>حداقل ۸ کاراکتر. بعد از تغییر، همه‌ی ورودها خارج می‌شوند.</small></label>
        <div><button class="btn">تغییر رمز</button></div>
      </form>
    </div>`;
  $('#sform').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target; const body = {};
    for (const k of ['store_name', 'whatsapp_number', 'whatsapp_display', 'announcement', 'shipping_note']) body[k] = f.elements[k].value;
    body.show_reference = f.elements.show_reference.checked;
    try { App.settings = await api('/api/admin/settings', { method: 'PUT', body }); toast('تنظیمات ذخیره شد'); viewSettings(); } catch (x) { toast(x.message, true); }
  };
  $('#pwform').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    try { await api('/api/admin/password', { method: 'PUT', body: { current: f.elements.current.value, next: f.elements.next.value } }); toast('رمز تغییر کرد. دوباره وارد شوید.'); App.authed = false; render(); } catch (x) { toast(x.message, true); }
  };
}

/* ---------- events ---------- */
document.addEventListener('click', async (e) => {
  const t = e.target.closest('button,a,[data-close]'); if (!t) return;
  if (t.id === 'logout' || t.id === 'logoutM') { e.preventDefault(); await api('/api/admin/logout', { method: 'POST', body: {} }).catch(() => {}); App.authed = false; render(); return; }
  if (t.hasAttribute('data-close')) { closeModal(); return; }
  if (t.id === 'newProduct') { history.replaceState(null, '', '#products/new'); openProduct(null); return; }
  if (t.dataset.edit) { if (App.view !== 'products') { location.hash = 'products/' + t.dataset.edit; return; } history.replaceState(null, '', '#products/' + t.dataset.edit); openProduct(+t.dataset.edit); return; }
  if (t.dataset.del) { deleteProduct(+t.dataset.del); return; }
  if (t.dataset.rm !== undefined) { draft.images.splice(+t.dataset.rm, 1); renderMedia(); return; }
  if (t.dataset.mv !== undefined) { const i = +t.dataset.mv, j = i + (+t.dataset.dir); [draft.images[i], draft.images[j]] = [draft.images[j], draft.images[i]]; renderMedia(); return; }
  if (t.dataset.of) { App.oFilter = t.dataset.of; $$('[data-of]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.of === App.oFilter)); fillOrders(); return; }
  if (t.dataset.order) { openOrder(+t.dataset.order); return; }
  if (t.dataset.odel) { if (!(await confirmBox('این سفارش برای همیشه حذف شود؟'))) return; try { await api(`/api/admin/orders/${t.dataset.odel}`, { method: 'DELETE' }); toast('سفارش حذف شد'); closeModal(); await refreshStats(); render(); } catch (x) { toast(x.message, true); } return; }
  if (t.dataset.ldel) { if (!(await confirmBox('این درخواست حذف شود؟'))) return; await api(`/api/admin/leads/${t.dataset.ldel}`, { method: 'DELETE' }).catch((x) => toast(x.message, true)); viewLeads(); return; }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.active) { try { await api(`/api/admin/products/${t.dataset.active}`, { method: 'PATCH', body: { active: t.checked } }); const p = App.products.find((x) => x.id === +t.dataset.active); if (p) p.active = t.checked; t.closest('tr').classList.toggle('off', !t.checked); toast(t.checked ? 'در فروشگاه نمایش داده می‌شود' : 'از فروشگاه پنهان شد'); } catch (x) { t.checked = !t.checked; toast(x.message, true); } return; }
  if (t.dataset.quick) {
    const val = Number(toLatin(t.value)); if (!Number.isFinite(val) || val < 0) { toast('عدد معتبر وارد کنید', true); return; }
    try { const up = await api(`/api/admin/products/${t.dataset.id}`, { method: 'PATCH', body: { [t.dataset.quick]: val } }); const i = App.products.findIndex((x) => x.id === up.id); App.products[i] = up; toast('ذخیره شد'); if (t.dataset.quick === 'stock') fillProductRows(); } catch (x) { toast(x.message, true); }
    return;
  }
  if (t.dataset.handled) { await api(`/api/admin/leads/${t.dataset.handled}`, { method: 'PATCH', body: { handled: t.checked } }).catch((x) => toast(x.message, true)); await refreshStats(); viewLeads(); return; }
  if (t.dataset.up) { const f = t.files[0]; if (!f) return; toast('در حال آپلود…'); try { const url = await upload(f); $(`#pform [name="${t.dataset.up}"]`).value = url; toast('آپلود شد'); } catch (x) { toast(x.message, true); } return; }
  if (t.id === 'pcat') { App.pCat = t.value; fillProductRows(); }
});
document.addEventListener('input', (e) => { if (e.target.id === 'pq') { App.pQuery = e.target.value; fillProductRows(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#modal').innerHTML) closeModal(); });
window.addEventListener('hashchange', () => { if (App.authed) { $('#modal').innerHTML = ''; render(); } });

/* ---------- boot ---------- */
(async () => {
  try { App.authed = (await api('/api/admin/me')).authed; } catch { App.authed = false; }
  if (App.authed) await refreshStats();
  render();
})();
