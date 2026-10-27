'use strict';
// Sample catalogue used on first run. Edit everything later from the admin panel.
const IK = 'https://www.ikea.com/us/en/search/?q=';

const SEED_PRODUCTS = [
  { id: 1, name: 'مکعب پایه', cat: 'shelves', type: 'cube', spaces: ['home', 'office', 'small'], w: 40, d: 30, h: 40, exp: true, compat: [2, 3, 4, 5], diff: 1, time: 15, parts: 6, price: 1450000, use: 'پایه‌ی همه‌ی ترکیب‌ها: تنها، کنار هم یا روی هم', ref: ['KALLAX', 'قفسه مکعبی', IK + 'kallax%20shelf%20unit'] },
  { id: 2, name: 'قفسه پلکانی سه‌طبقه', cat: 'shelves', type: 'stair', spaces: ['home', 'small'], w: 120, d: 30, h: 120, exp: true, compat: [1, 4], diff: 2, time: 40, parts: 18, price: 4900000, use: 'کتاب و گلدان کنار دیوار، یا جداکننده‌ی وسط پذیرایی', ref: ['EKET', 'ترکیب کابینت ماژولار', IK + 'eket'] },
  { id: 3, name: 'کتابخانه ستونی', cat: 'shelves', type: 'column', spaces: ['home', 'office', 'small'], w: 40, d: 30, h: 180, exp: true, compat: [1, 10], diff: 2, time: 35, parts: 14, price: 3800000, use: 'برای گوشه‌های باریک. دو ستون کنار هم یک کتابخانه‌ی کامل می‌شوند', ref: ['BILLY', 'کتابخانه', IK + 'billy%20bookcase'] },
  { id: 4, name: 'درِ ماژول مکعب', cat: 'storage', type: 'doorcube', spaces: ['home', 'office'], w: 40, d: 2, h: 40, exp: false, compat: [1, 2], diff: 1, time: 10, parts: 3, price: 750000, use: 'درِ لولایی که روی هر مکعب پایه سوار می‌شود و آن را کمد می‌کند', ref: ['KALLAX', 'درِ داخل مکعب', IK + 'kallax%20insert%20with%20door'] },
  { id: 5, name: 'باکس دو کشو', cat: 'storage', type: 'drawer', spaces: ['home', 'office'], w: 40, d: 30, h: 40, exp: true, compat: [1, 7], diff: 3, time: 50, parts: 22, price: 2650000, use: 'هم‌اندازه‌ی مکعب پایه. زیر میز تحریر یا در ردیف قفسه جا می‌گیرد', ref: ['KALLAX', 'کشوی داخل مکعب', 'https://www.ikea.com/us/en/p/kallax-insert-with-2-drawers-white-70286645/'] },
  { id: 6, name: 'جاکفشی باریک', cat: 'storage', type: 'shoe', spaces: ['home', 'small'], w: 80, d: 24, h: 60, exp: true, compat: [12], diff: 2, time: 30, parts: 12, price: 2300000, use: 'عمق ۲۴ سانتی‌متر برای راهروهای باریک آپارتمانی', ref: ['TRONES', 'جاکفشی کم‌عمق', IK + 'trones'] },
  { id: 7, name: 'میز تحریر ماژولار', cat: 'desk', type: 'desk', spaces: ['office', 'home'], w: 120, d: 60, h: 75, exp: true, compat: [1, 5, 8], diff: 3, time: 60, parts: 26, price: 6900000, use: 'یک سمتش جای مکعب پایه یا باکس کشو است', ref: ['MICKE', 'میز تحریر', IK + 'micke%20desk'] },
  { id: 8, name: 'رایزر مانیتور', cat: 'desk', type: 'riser', spaces: ['office', 'home'], w: 60, d: 22, h: 12, exp: false, compat: [7, 9], diff: 1, time: 8, parts: 5, price: 890000, use: 'مانیتور را هم‌سطح چشم می‌کند و زیرش جای کیبورد است', ref: ['ELLOVEN', 'رایزر مانیتور', IK + 'elloven'] },
  { id: 9, name: 'ارگانایزر رومیزی', cat: 'desk', type: 'organizer', spaces: ['office'], w: 30, d: 15, h: 12, exp: false, compat: [8], diff: 1, time: 10, parts: 7, price: 520000, use: 'جای خودکار، گوشی و یادداشت روی میز کار', ref: ['KVISSLE', 'ارگانایزر رومیزی', IK + 'kvissle'] },
  { id: 10, name: 'قفسه دیواری شش‌ضلعی', cat: 'decor', type: 'hex', spaces: ['home', 'small'], w: 35, d: 15, h: 30, exp: true, compat: [11, 3], diff: 1, time: 12, parts: 6, price: 680000, use: 'چند تا را کنار هم روی دیوار بچین و طرح کندوی خودت را بساز', ref: ['قفسه دیواری', 'قفسه‌های دیواری', IK + 'wall%20shelf'] },
  { id: 11, name: 'استند گیاه سه‌پله', cat: 'decor', type: 'plant', spaces: ['home', 'small'], w: 60, d: 25, h: 70, exp: false, compat: [10], diff: 2, time: 25, parts: 9, price: 1750000, use: 'سه گلدان در سه ارتفاع، کنار پنجره یا بالکن', ref: ['SATSUMAS', 'استند گیاه', 'https://www.ikea.com/us/en/p/20624035/'] },
  { id: 12, name: 'جاکلیدی با طاقچه', cat: 'decor', type: 'key', spaces: ['home', 'small'], w: 40, d: 10, h: 25, exp: false, compat: [6], diff: 1, time: 5, parts: 4, price: 420000, use: 'کنار در ورودی: کلید آویزان، نامه و عینک روی طاقچه', ref: ['جاکلیدی', 'جاکلیدی و طاقچه', IK + 'key%20holder'] },
  { id: 13, name: 'میز تاشو دیواری', cat: 'desk', type: 'wallfold', spaces: ['small', 'office'], w: 80, d: 50, h: 75, exp: false, compat: [10, 12], diff: 3, time: 45, parts: 15, price: 3200000, use: 'باز که باشد میز کار است و بسته که باشد یک قفسه‌ی کم‌عمق روی دیوار', ref: ['NORBERG', 'میز تاشو دیواری', IK + 'norberg'] }
];

const DEFAULT_SETTINGS = {
  store_name: 'ماجوکیت',
  whatsapp_number: '989000000000',   // international format, digits only
  whatsapp_display: '+98 900 000 0000',
  announcement: '',
  shipping_note: 'هزینه‌ی ارسال بر اساس شهر در واتس‌اپ اعلام می‌شود.',
  show_reference: '1'                 // show IKEA reference tickets on the storefront
};

module.exports = { SEED_PRODUCTS, DEFAULT_SETTINGS };
