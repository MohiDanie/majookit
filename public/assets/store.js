/* MajooKit storefront — data comes from /api/products and /api/settings */
const SET = {whatsapp_number:'', whatsapp_display:'', show_reference:'1', shipping_note:'', announcement:''};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa = n => Number(n).toLocaleString('fa-IR');
const toLatin = s => String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const waLink = t => `https://wa.me/${SET.whatsapp_number}?text=${encodeURIComponent(t)}`;
const waShow = () => SET.whatsapp_display || ('+' + SET.whatsapp_number);
const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function api(url, body){
  const r = await fetch(url, body ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)} : {});
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error || 'ارتباط با سرور برقرار نشد');
  return d;
}

const CATS = {shelves:'قفسه', storage:'ذخیره‌سازی', desk:'میز و کار', decor:'دکور'};
const SPACES = {home:'خانه', office:'دفتر کار', small:'فضاهای کوچک'};
const DIFF = ['', 'آسان', 'متوسط', 'چالشی'];
let P = [];
const okUrl = u => /^(\/uploads\/|https?:\/\/)/.test(u||'') ? u : '';
function normalize(p){
  return {...p, raw:{name:p.name,use:p.use}, name:esc(p.name), use:esc(p.use), description:esc(p.description||''),
    ref:(p.ref||['','','']).map(esc), images:(p.images||[]).map(okUrl).filter(Boolean), manual:okUrl(p.manual), video:okUrl(p.video)};
}
const refTag = p => (SET.show_reference!=='1'||!p.ref[2]) ? '' : `<a class="reftag" href="${p.ref[2]}" target="_blank" rel="noopener" title="صفحه‌ی مرجع در ایکیا"><span>مرجع</span>IKEA ${p.ref[0]} ↗</a>`;
const byId = id => P.find(p=>p.id===id);
const toman = n => `${fa(n)}<small>تومان</small>`;
const stars = d => `<span class="stars" aria-label="سختی ${DIFF[d]}">${'★'.repeat(d)}<i>${'★'.repeat(3-d)}</i></span>`;
const sizeOf = p => p.w<=50?'s':p.w<=90?'m':'l';

const ico = {
  modular:`<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="12" height="12" rx="1.5"/><rect x="20" y="4" width="12" height="12" rx="1.5"/><rect x="4" y="20" width="12" height="12" rx="1.5"/><path d="M26 21v10M21 26h10" stroke-linecap="round"/></svg>`,
  diy:`<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 30h16V10"/><path d="M24 10l-4 4"/></svg>`,
  price:`<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 18 18 4h12v12L16 30z"/><circle cx="24" cy="10" r="2.2"/></svg>`,
  cnc:`<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="18" cy="18" r="9"/><path d="M18 3v8M18 25v8M3 18h8M25 18h8"/><circle cx="18" cy="18" r="2" fill="currentColor"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>`,
  play:`<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  ar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2z"/><path d="M4.5 7.2 12 11.4l7.5-4.2M12 11.4V21"/></svg>`,
  drag:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3"/></svg>`,
  explode:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M3 3l3 3M21 3l-3 3M3 21l3-3M21 21l-3-3"/></svg>`,
  spin:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/></svg>`,
  close:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  camera:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`,
  photo:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/></svg>`,
  rotL:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/></svg>`,
  rotR:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/></svg>`,
  cartPlus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h14l-1.4 11H6.4z"/><path d="M9 8a3 3 0 0 1 6 0"/><path d="M12 11.5v5M9.5 14h5" stroke-linecap="round"/></svg>`,
  sliders:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>`,
  tick:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4 10-10"/></svg>`,
  arrow:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>`
};

/* ===== 2D MDF drawings ===== */
const F='var(--mdf)', E='var(--mdf-e)';
const R=(x,y,w,h,f=F,rx=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"/>`;
const box=(x,y,w,h,t=4)=>R(x,y,w,h,E)+R(x+t,y+t,w-2*t,h-2*t,F);
const solid=(x,y,w,h)=>R(x,y,w,h,E)+R(x+1.5,y+1.5,w-3,h-3,F);
const knob=(x,y)=>`<circle cx="${x}" cy="${y}" r="2.4" fill="var(--olive)"/>`;
const pot=(x,y,s=1)=>`<path d="M${x-7*s} ${y}h${14*s}l-2 ${11*s}h${-10*s}z" fill="var(--wood)"/><path d="M${x} ${y}c-6-8-2-15 0-17 2 2 6 9 0 17zM${x} ${y}c-9-3-11-9-10-12 3 0 9 3 10 12zM${x} ${y}c9-3 11-9 10-12-3 0-9 3-10 12z" fill="var(--olive)"/>`;
const bookset=(x,y,n,h=20)=>{let s='';const c=['var(--olive)','var(--wood)','var(--muted)','var(--floor)'];for(let i=0;i<n;i++)s+=R(x+i*6,y-(h-(i%2)*4),5,h-(i%2)*4,c[i%4],.8);return s;};
function art(type){
  let s='';
  switch(type){
    case 'cube': s=box(70,58,60,60)+bookset(82,113,4)+`<rect x="134" y="58" width="60" height="60" rx="1" fill="none" stroke="var(--olive)" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M164 80v16M156 88h16" stroke="var(--olive)" stroke-width="2.4" stroke-linecap="round"/>`; break;
    case 'stair': s=box(40,96,40,40)+box(80,96,40,40)+box(120,96,40,40)+box(80,56,40,40)+box(120,56,40,40)+box(120,16,40,40)+bookset(46,132,4)+pot(140,52)+bookset(126,92,3); break;
    case 'column': s=R(80,8,40,128,E)+R(84,12,32,120,F)+[38,64,90].map(y=>R(84,y,32,4,E)).join('')+bookset(88,38,3,18)+pot(100,64,.8)+bookset(88,90,4,18)+bookset(90,132,3,16); break;
    case 'doorcube': s=box(56,60,60,60)+solid(120,60,40,60)+`<path d="M116 62l4-2v60l-4-2z" fill="${E}"/>`+knob(150,90); break;
    case 'drawer': s=box(70,58,60,60,4)+solid(74,62,52,25)+solid(74,89,52,25)+R(92,72,16,3,'var(--olive)',1.5)+R(92,99,16,3,'var(--olive)',1.5); break;
    case 'shoe': s=box(40,70,120,62)+R(80,74,4,54,E)+R(116,74,4,54,E)+R(44,100,112,4,E)+`<g fill="var(--muted)"><path d="M50 98h22c3 0 4-5 0-6l-8-3-4-4h-10z"/><path d="M88 98h22c3 0 4-5 0-6l-8-3-4-4h-10z"/><path d="M124 126h24c2 0 3-4 0-5l-7-3-4-6h-13z"/></g>`; break;
    case 'desk': s=R(20,56,160,8,E)+R(22,57,156,6,F)+solid(26,64,6,70)+box(118,72,56,56)+solid(122,76,48,48)+R(140,92,12,3,'var(--olive)',1.5)+R(50,36,32,20,'var(--muted)',2)+R(64,54,4,3,'var(--muted)'); break;
    case 'riser': s=R(36,82,128,8,E)+R(38,83,124,6,F)+solid(40,90,8,30)+solid(152,90,8,30)+R(60,30,80,50,'var(--muted)',3)+R(64,34,72,40,'var(--olive-soft)',2)+R(56,108,88,10,'var(--line)',2); break;
    case 'organizer': s=box(56,78,88,42)+R(84,82,4,34,E)+R(112,82,4,34,E)+`<g stroke-linecap="round" stroke-width="3"><path d="M66 82l-4-26" stroke="var(--olive)"/><path d="M72 82l2-30" stroke="var(--muted)"/></g>`+R(92,58,16,24,'var(--ink)',2)+R(120,68,18,14,'var(--wood)',1); break;
    case 'hex': {const hx=(cx,cy,r)=>{const p=[...Array(6)].map((_,i)=>{const a=Math.PI/3*i;return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`}).join(' ');return `<polygon points="${p}" fill="${F}" stroke="${E}" stroke-width="5" stroke-linejoin="round"/>`;};
      s=hx(78,58,30)+hx(124,84,30)+hx(78,110,30)+pot(78,68,.8)+bookset(114,104,4,18); break;}
    case 'plant': s=solid(40,110,40,6)+solid(80,80,40,6)+solid(120,50,40,6)+solid(40,116,6,20)+solid(154,56,6,80)+R(46,128,108,4,E)+pot(60,110)+pot(100,80)+pot(140,50); break;
    case 'key': s=solid(50,50,100,60)+R(50,44,100,8,E)+R(52,45,96,6,F)+bookset(60,44,3,14)+[70,90,110,130].map(x=>`<path d="M${x} 96v8a3 3 0 0 0 6 0" fill="none" stroke="var(--muted)" stroke-width="2.4" stroke-linecap="round"/>`).join(''); break;
    case 'wallfold': s=solid(50,22,100,46)+R(54,30,92,4,E)+bookset(60,30,4,10)+R(46,70,108,7,E)+R(48,71,104,5,F)+`<path d="M60 77l20 24M140 77l-20 24" stroke="${E}" stroke-width="5" stroke-linecap="round"/>`+R(64,52,20,16,'var(--muted)',2); break;
  }
  return `<svg class="prod" viewBox="0 0 200 150" role="img" aria-hidden="true"><ellipse cx="100" cy="138" rx="74" ry="4.5" fill="var(--shadow)"/>${s}</svg>`;
}
function partsArt(p){
  const L='الف ب پ ت ث ج چ ح خ د ذ ر'.split(' '); const n=Math.min(p.parts,10); let s='',x=16,y=16,row=0;
  const sizes=[[52,34],[52,34],[30,48],[30,48],[64,20],[40,28],[24,24],[64,20],[30,30],[40,22]];
  for(let i=0;i<n;i++){const [w,h]=sizes[i%sizes.length]; if(x+w>184){x=16;y+=row+10;row=0;}
    s+=solid(x,y,w,h)+`<text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="11" font-weight="800" font-family="Vazirmatn" fill="var(--ink)">${L[i]}</text>`;
    x+=w+8; row=Math.max(row,h);}
  s+=`<path d="M150 136h28v-16" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 200 150" role="img" aria-label="قطعات جدا">${s}</svg>`;
}
function stepsArt(p){
  return `<svg viewBox="0 0 200 150" role="img" aria-label="مراحل مونتاژ">
   <g font-family="Vazirmatn" font-size="9" font-weight="800" fill="var(--olive)" text-anchor="middle"><text x="170" y="22">۱</text><text x="100" y="22">۲</text><text x="30" y="22">۳</text></g>
   ${solid(150,40,40,6)+solid(150,50,40,6)+solid(150,60,40,6)+solid(150,70,40,6)}
   ${R(80,40,6,44,E)+R(80,78,40,6,E)}
   ${box(10,40,40,44)}
   <path d="M146 60h-20M76 60H56" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/>
   <text x="100" y="132" text-anchor="middle" font-family="Vazirmatn" font-size="10" fill="var(--ink)">${fa(p.parts)} قطعه، حدود ${fa(p.time)} دقیقه</text>
  </svg>`;
}

/* ===== 3D engine ===== */
const HAS3D = (()=>{ if(!window.THREE) return false; try{const c=document.createElement('canvas'); return !!(c.getContext('webgl')||c.getContext('experimental-webgl'));}catch(e){return false;} })();
const T = window.THREE;
const M = {};
const lin = hex => new T.Color(hex).convertSRGBToLinear();
function initMats(){
  if(M.face) return;
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  x.fillStyle='#ECDCC8'; x.fillRect(0,0,256,256);
  for(let i=0;i<5000;i++){x.fillStyle=`rgba(${140+Math.random()*50|0},${95+Math.random()*35|0},55,${Math.random()*.09})`; x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*2.5,1+Math.random()*2.5);}
  const tex=new T.CanvasTexture(c); tex.wrapS=tex.wrapT=T.RepeatWrapping; tex.encoding=T.sRGBEncoding; tex.anisotropy=4;
  M.face=new T.MeshStandardMaterial({map:tex,roughness:.82,metalness:0});
  M.edge=new T.MeshStandardMaterial({color:lin('#C9AC8E'),roughness:.95});
  M.line=new T.LineBasicMaterial({color:lin('#9A6C3E'),transparent:true,opacity:.28});
  M.olive=new T.MeshStandardMaterial({color:lin('#8C6A52'),roughness:.5});
  M.pot=new T.MeshStandardMaterial({color:lin('#E7DCC8'),roughness:.6});
  M.leaf=new T.MeshStandardMaterial({color:lin('#8E9A78'),roughness:.8});
  M.dark=new T.MeshStandardMaterial({color:lin('#34322D'),roughness:.4,metalness:.4});
  M.screen=new T.MeshStandardMaterial({color:lin('#C9D6B0'),roughness:.3,emissive:lin('#20281A'),emissiveIntensity:.4});
  M.books=['#B79F8A','#EFE6DB','#8C6A52','#D9C7B3','#6E6259','#C4A68A'].map(h=>new T.MeshStandardMaterial({color:lin(h),roughness:.85}));
}
function part(G,m,x,y,z,ex=[0,0,0]){
  m.position.set(x/100,y/100,z/100);
  m.userData.home=m.position.clone(); m.userData.ex=new T.Vector3(ex[0]/100,ex[1]/100,ex[2]/100);
  G.add(m); return m;
}
function panel(G,w,h,d,x,y,z,ex){
  const g=new T.BoxGeometry(w/100,h/100,d/100);
  const dims=[w,h,d]; const thin=dims.indexOf(Math.min(...dims));
  const m=new T.Mesh(g,[0,0,1,1,2,2].map(a=>a===thin?M.face:M.edge));
  m.add(new T.LineSegments(new T.EdgesGeometry(g),M.line));
  return part(G,m,x,y,z,ex);
}
const mesh=(geo,mat)=>new T.Mesh(geo,mat);
function books(G,x,y,z,n,maxH=24,d=20){let cx=x;for(let i=0;i<n;i++){const h=maxH-(i%3)*3, w=2.4+(i%2);
  part(G,mesh(new T.BoxGeometry(w/100,h/100,d/100),M.books[(i+Math.abs(Math.round(x)))%M.books.length]),cx+w/2,y+h/2,z); cx+=w+.3;}}
function plant(G,x,y,z,s=1){
  part(G,mesh(new T.CylinderGeometry(.055*s,.04*s,.1*s,20),M.pot),x,y+5*s,z);
  const l=mesh(new T.IcosahedronGeometry(.075*s,1),M.leaf); l.scale.set(1,1.25,1); part(G,l,x,y+(10+9.4)*s,z);
}
const TK=1.6;
function cubeG(variant='',ex=1){
  const G=new T.Group(), w=40,h=40,d=30;
  panel(G,TK,h,d,-w/2+TK/2,h/2,0,[-12*ex,0,0]);
  panel(G,TK,h,d, w/2-TK/2,h/2,0,[12*ex,0,0]);
  panel(G,w-2*TK,TK,d,0,TK/2,0,[0,-3*ex,0]);
  panel(G,w-2*TK,TK,d,0,h-TK/2,0,[0,12*ex,0]);
  panel(G,w-2*TK,h-2*TK,.4,0,h/2,-d/2+.2,[0,0,-14*ex]);
  if(variant==='books'){books(G,-15,TK,0,7,26); plant(G,10,TK,2,.9);}
  if(variant==='plant') plant(G,0,TK,0,1.1);
  if(variant==='door'){const dr=panel(G,w-.4,h-.4,TK,0,h/2,d/2+TK/2,[0,0,18*ex]); const k=mesh(new T.CylinderGeometry(.012,.012,.03,16),M.olive); k.rotation.x=Math.PI/2; k.position.set(.14,0,.018); dr.add(k);}
  if(variant==='drawer'){[0,1].forEach(i=>{const ih=(h-2*TK)/2; const dr=panel(G,w-2*TK-.4,ih-.4,TK,0,TK+ih/2+i*ih,d/2-TK/2,[0,0,(16+i*10)*ex]); const hd=mesh(new T.BoxGeometry(.12,.012,.016),M.olive); hd.position.set(0,.04,.012); dr.add(hd);});}
  return G;
}
function build(type){
  initMats();
  const G=new T.Group(); G.userData.subs=[];
  const sub=(g,x,y,z,delay)=>{g.position.set(x/100,y/100,z/100); g.userData.base=g.position.clone(); g.userData.delay=delay; G.add(g); G.userData.subs.push(g); return g;};
  switch(type){
    case 'cube': sub(cubeG('books'),0,0,0,0); break;
    case 'doorcube': sub(cubeG('door'),0,0,0,0); break;
    case 'drawer': sub(cubeG('drawer'),0,0,0,0); break;
    case 'stair': [[-40,0,'books'],[0,0,''],[40,0,'door'],[0,40,'books'],[40,40,''],[40,80,'plant']].forEach((c,i)=>sub(cubeG(c[2],.7),c[0],c[1],0,i*140)); break;
    case 'hero': [[-40,0,'books'],[0,0,'drawer'],[40,0,'door'],[-40,40,'plant'],[0,40,'books'],[40,40,'']].forEach((c,i)=>sub(cubeG(c[2],.8),c[0],c[1],0,i*170)); break;
    case 'column': {const g=new T.Group(),h=180,d=30,w=40;
      panel(g,TK,h,d,-w/2+TK/2,h/2,0,[-14,0,0]); panel(g,TK,h,d,w/2-TK/2,h/2,0,[14,0,0]);
      for(let i=0;i<6;i++) panel(g,w-2*TK,TK,d,0,TK/2+i*((h-TK)/5),0,[0,(i-1)*6,i%2?10:-10]);
      panel(g,w-2*TK,h-2*TK,.4,0,h/2,-d/2+.2,[0,0,-18]);
      books(g,-16,TK,0,7,26); books(g,-16,TK+35.7,0,8,24); plant(g,0,TK+71.4,0,1); books(g,-14,TK+107.1,0,6,22);
      sub(g,0,0,0,0); break;}
    case 'shoe': {const g=new T.Group(),w=80,h=60,d=24;
      panel(g,TK,h,d,-w/2+TK/2,h/2,0,[-14,0,0]); panel(g,TK,h,d,w/2-TK/2,h/2,0,[14,0,0]);
      panel(g,w-2*TK,TK,d,0,TK/2+4,0,[0,-2,0]); panel(g,w,TK,d,0,h-TK/2,0,[0,14,0]); panel(g,w-2*TK,TK,d,0,h/2,0,[0,4,10]);
      panel(g,TK,h/2-TK*1.5-4,d,-w/6,h/4+2.6,0,[-4,0,12]); panel(g,TK,h/2-TK*1.5,d,w/6,h*3/4-TK/2,0,[4,0,12]);
      panel(g,w-2*TK,h-2*TK,.4,0,h/2,-d/2+.2,[0,0,-16]);
      [[-26,TK+5.6],[0,TK+5.6],[-26,h/2+TK/2],[26,TK+5.6]].forEach(([x,y])=>part(g,mesh(new T.BoxGeometry(.2,.07,.09),M.dark),x,y+3.5,2));
      sub(g,0,0,0,0); break;}
    case 'desk': {const g=new T.Group(),w=120,h=75,d=60;
      panel(g,w,TK,d,0,h-TK/2,0,[0,24,0]);
      panel(g,TK,h-TK,d-4,-w/2+TK/2+1,(h-TK)/2,0,[-18,0,0]);
      panel(g,TK,h-TK,d-4,w/2-TK/2-1,(h-TK)/2,0,[18,0,0]);
      panel(g,TK,h-TK,d-4,w/2-42,(h-TK)/2,0,[8,0,0]);
      panel(g,w-6,20,TK,0,h-TK-12,-d/2+4,[0,0,-16]);
      [0,1].forEach(i=>{const dr=panel(g,38,22,TK,w/2-21.5,14+i*28,d/2-3,[0,0,16+i*8]); const hd=mesh(new T.BoxGeometry(.12,.012,.016),M.olive); hd.position.set(0,.07,.012); dr.add(hd);});
      const mon=mesh(new T.BoxGeometry(.5,.3,.02),M.dark); part(g,mon,-14,h+24,-14,[0,30,0]); const scr=mesh(new T.PlaneGeometry(.47,.27),M.screen); scr.position.z=.0105; mon.add(scr);
      part(g,mesh(new T.BoxGeometry(.04,.09,.04),M.dark),-14,h+4.5,-15,[0,30,0]);
      plant(g,-48,h,-12,.9);
      sub(g,0,0,0,0); break;}
    case 'riser': {const g=new T.Group();
      panel(g,60,TK,22,0,12-TK/2,0,[0,12,0]); panel(g,TK,12-TK,22,-29.2,(12-TK)/2,0,[-12,0,0]); panel(g,TK,12-TK,22,29.2,(12-TK)/2,0,[12,0,0]);
      const mon=mesh(new T.BoxGeometry(.54,.32,.02),M.dark); part(g,mon,0,12+26,-2,[0,26,0]); const scr=mesh(new T.PlaneGeometry(.51,.29),M.screen); scr.position.z=.0105; mon.add(scr);
      part(g,mesh(new T.BoxGeometry(.04,.1,.04),M.dark),0,12+5,-3,[0,26,0]);
      part(g,mesh(new T.BoxGeometry(.4,.015,.12),M.pot),0,1,4);
      sub(g,0,0,0,0); break;}
    case 'organizer': {const g=new T.Group();
      panel(g,30,TK,15,0,TK/2,0,[0,-1,0]); panel(g,30,12,TK,0,6,-7.5+TK/2,[0,0,-8]); panel(g,TK,10,15,-15+TK/2,5+TK,0,[-8,0,0]); panel(g,TK,10,15,15-TK/2,5+TK,0,[8,0,0]);
      panel(g,TK,8,13,-5,4+TK,0,[0,8,0]); panel(g,TK,8,13,5,4+TK,0,[0,10,0]);
      [M.olive,M.dark,M.books[5]].forEach((m,i)=>{const p=mesh(new T.CylinderGeometry(.004,.004,.15,10),m); p.rotation.z=(i-1)*.15; part(g,p,-11+i*1.5,9,i*2-2);});
      const ph=mesh(new T.BoxGeometry(.075,.15,.01),M.dark); ph.rotation.x=-.25; part(g,ph,0,9,0);
      sub(g,0,0,0,0); break;}
    case 'hex': {
      const r=17, ap=r*Math.cos(Math.PI/6);
      const mk=(cx,cy,delay)=>{const g=new T.Group();
        for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/2; const x=Math.cos(a)*ap,y=Math.sin(a)*ap;
          const m=panel(g,r+.9,TK,15,x,y,0,[Math.cos(a)*10,Math.sin(a)*10,0]); m.rotation.z=a+Math.PI/2;}
        return sub(g,cx,cy,0,delay);};
      const a=mk(-16,ap+TK,0), b=mk(16,ap*3+TK*2,160);
      plant(a,0,-ap+TK/2,0,.8); books(b,-8,-ap+TK/2,0,5,14,12);
      break;}
    case 'plant': {const g=new T.Group(),d=25;
      [[-20,22],[0,46],[20,70]].forEach(([x,h],i)=>{panel(g,20,TK,d,x,h-TK/2,0,[0,10+i*4,0]); panel(g,TK,h-TK,d,x-10+TK/2,(h-TK)/2,0,[-6,0,0]); if(i===2) panel(g,TK,h-TK,d,x+10-TK/2,(h-TK)/2,0,[8,0,0]); plant(g,x,h,0,1);});
      sub(g,0,0,0,0); break;}
    case 'key': {const g=new T.Group();
      panel(g,40,25,TK,0,12.5,0,[0,0,-10]); panel(g,40,TK,10,0,25+TK/2,5,[0,10,6]);
      [-12,-4,4,12].forEach(x=>{const h=mesh(new T.CylinderGeometry(.004,.004,.035,10),M.olive); h.rotation.x=Math.PI/2; part(g,h,x,8,2.5,[0,0,6]);});
      books(g,-16,25+TK,6,3,10,8); part(g,mesh(new T.TorusGeometry(.012,.003,8,20),M.dark),-4,4,3);
      sub(g,0,0,0,0); break;}
    case 'wallfold': {const g=new T.Group();
      panel(g,80,46,TK,0,75+23,-25,[0,0,-12]); panel(g,80,TK,50,0,75-TK/2,0,[0,0,14]);
      panel(g,76,TK,12,0,75+30,-19,[0,10,0]); books(g,-30,75+30+TK,-19,9,16,10);
      const br1=panel(g,TK,30,4,-34,62,-15,[-8,-8,0]); br1.rotation.x=.75; const br2=panel(g,TK,30,4,34,62,-15,[8,-8,0]); br2.rotation.x=.75;
      part(g,mesh(new T.BoxGeometry(.32,.012,.22),M.dark),-6,75+.6,2); plant(g,28,75,-10,.8);
      sub(g,0,0,0,0); break;}
  }
  G.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return G;
}
const easeOutBack=t=>{const c=1.3;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const VIEWERS=new Set();
function makeViewer(host,type,opts={}){
  if(!HAS3D) return null;
  initMats();
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:!!opts.ar});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const scene=new T.Scene();
  const cam=new T.PerspectiveCamera(opts.ar?42:30,1,.01,60);
  scene.add(new T.HemisphereLight(0xFFF4E2,0x7A6A52,.85));
  const sun=new T.DirectionalLight(0xFFF1DA,1.25); sun.position.set(-2.2,3.4,2.4); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-.0004; sun.shadow.normalBias=.01;
  Object.assign(sun.shadow.camera,{left:-2.2,right:2.2,top:2.2,bottom:-2.2,near:.5,far:10}); scene.add(sun); scene.add(sun.target);
  const fill=new T.DirectionalLight(0xDDE6FF,.25); fill.position.set(2.5,1.5,-1); scene.add(fill);
  const ground=new T.Mesh(new T.PlaneGeometry(12,12),new T.ShadowMaterial({opacity:opts.ar?.4:.2})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
  const pivot=new T.Group(); scene.add(pivot);
  const st={yaw:opts.yaw??-.55,tYaw:opts.yaw??-.55,pitch:opts.pitch??.26,tPitch:opts.pitch??.26,dist:2,tDist:2,auto:opts.auto??true,ex:0,exT:0,
    model:null,target:new T.Vector3(),radius:1,t0:performance.now(),visible:true,drag:null,pts:new Map(),px:0,py:0,pos:new T.Vector3(),scale:1,arYaw:-.35};
  function setModel(t){
    if(st.model){pivot.remove(st.model);disposeObj(st.model);}
    const m=build(t); st.model=m; pivot.add(m);
    const b=new T.Box3().setFromObject(m), s=b.getSize(new T.Vector3()), c=b.getCenter(new T.Vector3());
    m.position.x-=c.x; m.position.z-=c.z; m.position.y-=b.min.y;
    st.radius=Math.max(s.x,s.y,s.z*1.2)*.62+.05; st.target.set(0,s.y*.46,0);
    st.tDist=st.dist=st.radius/Math.sin(T.MathUtils.degToRad(cam.fov/2))*(opts.hero?1.02:.92);
    st.t0=performance.now();
  }
  setModel(type);
  function resize(){const w=host.clientWidth,h=host.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix();}
  const ro=new ResizeObserver(resize); ro.observe(host); resize();
  const io=new IntersectionObserver(es=>es.forEach(e=>st.visible=e.isIntersecting)); io.observe(host);
  const el=renderer.domElement; const ray=new T.Raycaster(), plane=new T.Plane(new T.Vector3(0,1,0),0), v2=new T.Vector2(), hit=new T.Vector3();
  function groundAt(cx,cy){const r=el.getBoundingClientRect(); v2.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1); ray.setFromCamera(v2,cam); return ray.ray.intersectPlane(plane,hit)?hit.clone():null;}
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId); st.pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); st.drag=true;
    if(opts.ar){const g=groundAt(e.clientX,e.clientY); st.grab=g?g.sub(st.pos):null;} st.auto=false; host.dispatchEvent(new Event('interact'));});
  el.addEventListener('pointermove',e=>{
    const r=host.getBoundingClientRect(); st.px=((e.clientX-r.left)/r.width-.5); st.py=((e.clientY-r.top)/r.height-.5);
    if(!st.drag||!st.pts.has(e.pointerId)) return;
    const prev=st.pts.get(e.pointerId);
    if(st.pts.size===2){
      const ids=[...st.pts.keys()]; const other=st.pts.get(ids.find(i=>i!==e.pointerId));
      const d0=Math.hypot(prev.x-other.x,prev.y-other.y), d1=Math.hypot(e.clientX-other.x,e.clientY-other.y);
      const a0=Math.atan2(prev.y-other.y,prev.x-other.x), a1=Math.atan2(e.clientY-other.y,e.clientX-other.x);
      st.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(opts.ar){st.scale=T.MathUtils.clamp(st.scale*d1/Math.max(d0,1),.3,2.5); st.arYaw-=(a1-a0); opts.onChange&&opts.onChange();}
      else st.tDist=T.MathUtils.clamp(st.tDist*d0/Math.max(d1,1),st.radius*1.4,st.radius*6);
      return;}
    st.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const dx=e.clientX-prev.x, dy=e.clientY-prev.y;
    if(opts.ar){const g=groundAt(e.clientX,e.clientY); if(g&&st.grab){st.pos.copy(g.sub(st.grab)); st.pos.y=0;}}
    else {st.tYaw+=dx*.009; st.tPitch=T.MathUtils.clamp(st.tPitch+dy*.005,.02,1.05);}
  });
  const up=e=>{st.pts.delete(e.pointerId); if(!st.pts.size) st.drag=null;};
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
  el.addEventListener('pointerleave',()=>{st.px=0;st.py=0;});
  if(!opts.ar) el.addEventListener('wheel',e=>{e.preventDefault(); st.tDist=T.MathUtils.clamp(st.tDist*(1+e.deltaY*.0012),st.radius*1.4,st.radius*6);},{passive:false});
  let raf=0, last=performance.now();
  function frame(now){
    raf=requestAnimationFrame(frame);
    if(!st.visible) return;
    const dt=Math.min((now-last)/1000,.05); last=now; const k=1-Math.pow(.0008,dt);
    if(st.auto&&!RM) st.tYaw+=dt*(opts.hero?.22:.35);
    st.yaw+=(st.tYaw-st.yaw)*k; st.pitch+=(st.tPitch-st.pitch)*k; st.dist+=(st.tDist-st.dist)*k;
    st.ex+=(st.exT-st.ex)*(1-Math.pow(.004,dt));
    const m=st.model, age=now-st.t0;
    m.userData.subs.forEach(g=>{const t=RM?1:T.MathUtils.clamp((age-g.userData.delay)/700,0,1); g.position.y=g.userData.base.y+(1-easeOutBack(t))*.9;});
    const e=Math.max(0,st.ex);
    m.traverse(o=>{if(o.userData.home) o.position.copy(o.userData.home).addScaledVector(o.userData.ex,e);});
    if(opts.ar){
      pivot.position.copy(st.pos); pivot.scale.setScalar(st.scale); pivot.rotation.y=st.arYaw;
      cam.position.set(0,1.35,2.6); cam.lookAt(0,.35,0);
    } else {
      const free=opts.hero&&!st.drag&&!RM;
      pivot.rotation.y=st.yaw+(free?st.px*.5:0);
      pivot.position.y=e*.06;
      const p=st.pitch+(free?st.py*.15:0);
      cam.position.set(st.target.x,st.target.y+Math.sin(p)*st.dist,Math.cos(p)*st.dist); cam.lookAt(st.target.x,st.target.y+e*.06,st.target.z);
    }
    sun.target.position.copy(pivot.position);
    renderer.render(scene,cam);
  }
  raf=requestAnimationFrame(frame);
  const v={renderer,scene,cam,st,setModel,host,
    explode(on){st.exT=on?1:0;},
    render(){renderer.render(scene,cam);},
    dispose(){cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); disposeObj(scene); renderer.dispose(); try{renderer.forceContextLoss();}catch(e){} el.remove(); VIEWERS.delete(v);}};
  VIEWERS.add(v); return v;
}
function disposeObj(o){o.traverse(c=>{if(c.geometry) c.geometry.dispose();});}
function killViewers(){[...VIEWERS].forEach(v=>{if(!AR||v!==AR.v) v.dispose();});}

/* ===== state ===== */
const S = {f:{cat:'all',space:'all',size:'all',exp:'all',diff:'all'}, q:'', cart:{}, gal:HAS3D?'3d':'img', qty:1, hl:null};
try{const c=JSON.parse(localStorage.getItem('majoo-cart')||'null'); if(c) S.cart=c;}catch(e){}
const save=()=>{try{localStorage.setItem('majoo-cart',JSON.stringify(S.cart))}catch(e){}};
const cartN=()=>Object.values(S.cart).reduce((a,b)=>a+b,0);
function counts(b){const n=cartN(); document.querySelectorAll('[data-count]').forEach(el=>{el.hidden=!n; el.textContent=fa(n); if(b){el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');}});}
let tT; function toast(m){let t=$('.toast'); if(t) t.remove(); t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t); t.textContent=m; t.animate([{transform:'translate(-50%,20px)',opacity:0},{transform:'translate(-50%,0)',opacity:1}],{duration:300,easing:'ease-out'}); clearTimeout(tT);tT=setTimeout(()=>t.remove(),2400);}

/* ===== fragments ===== */
function pcard(p,i=0){
  return `<article class="pcard" style="--i:${i}">
    <a class="ph" href="#p${p.id}" tabindex="-1" aria-hidden="true">${!p.inStock?`<span class="xbadge oos">ناموجود</span>`:p.exp?`<span class="xbadge">+ قابل توسعه</span>`:''}${p.images[0]?`<img src="${p.images[0]}" alt="" loading="lazy">`:art(p.type)}</a>
    <div class="body">
      <a class="pname" href="#p${p.id}"><h3>${p.name}</h3><span class="use">${p.use}</span></a>
      <span class="meta num">${fa(p.w)}×${fa(p.d)}×${fa(p.h)} سانتی‌متر</span>
      <div class="buyrow"><div class="price">${toman(p.price)}</div>
        <div class="minis">${HAS3D?`<button class="arbtn" data-ar="${p.id}" aria-label="دیدن ${p.name} در اتاق خودت" title="در اتاق خودت ببین">${ico.ar}</button>`:''}<button class="arbtn add" data-add="${p.id}" data-one ${p.inStock?'':'disabled'} aria-label="افزودن ${p.name} به سبد" title="افزودن به سبد">${ico.cartPlus}</button></div></div>
      <div class="meta2">${stars(p.diff)}<span>مونتاژ ${DIFF[p.diff]}</span></div>
      ${refTag(p)}
    </div>
  </article>`;
}
const why = [
  ['modular','ماژولار و قابل توسعه','امروز یک مکعب بخر، سال بعد کنارش اضافه کن. همه‌ی کیت‌ها با یک سیستم اتصال کار می‌کنند.'],
  ['diy','تجربه‌ی واقعی ساختن','قطعات برچسب‌دار، راهنمای تصویری و ویدیوی کوتاه. ساختن خودش بخشی از لذت است.'],
  ['price','قیمت منصفانه','واسطه‌ای در کار نیست. مستقیم از کارگاه به خانه‌ی تو، با قیمت شفاف روی هر کیت.'],
  ['cnc','برش دقیق CNC','MDF ۱۶ میلی‌متری با برش و سوراخ‌کاری CNC. قطعات بدون دردسر جا می‌افتند.']
];
const flow = [['کیت را انتخاب کن','از سایت یا واتس‌اپ.'],['بسته را تحویل بگیر','بسته‌بندی تخت و ایمن، با پیچ‌های شماره‌دار.'],['راحت مونتاژ کن','آچار آلن داخل بسته است. بیشتر کیت‌ها زیر یک ساعت.'],['استفاده کن و بعداً گسترش بده','هر وقت لازم شد ماژول تازه اضافه کن.']];
const POSTS=[['چیدمان یک اتاق ۹ متری با چهار مکعب','ایده‌ی چیدمان','stair'],['قبل و بعد: راهروی ورودی با جاکفشی باریک','قبل و بعد','shoe'],['ایکیا‌هک ایرانی: میز تحریر + باکس کشو','ایکیا‌هک ایرانی','desk']];
const postsHTML=()=>`<div class="posts">${POSTS.map(p=>`<article class="post">${art(p[2])}<div><span class="eyebrow" style="margin:0">${p[1]}</span><h3>${p[0]}</h3><p>به‌زودی در بلاگ ماجوکیت.</p></div></article>`).join('')}</div>`;
function workshopArt(){
  return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="260" fill="var(--sand)"/>
    <rect x="40" y="150" width="320" height="14" fill="${E}"/><rect x="60" y="164" width="12" height="96" fill="${E}"/><rect x="328" y="164" width="12" height="96" fill="${E}"/>
    <rect x="70" y="60" width="200" height="90" fill="${F}" stroke="${E}" stroke-width="4"/>
    <g fill="none" stroke="var(--olive)" stroke-width="2.2" stroke-dasharray="6 4"><rect x="90" y="76" width="60" height="40"/><rect x="164" y="76" width="40" height="58"/><circle cx="234" cy="96" r="14"/></g>
    <rect x="80" y="20" width="200" height="8" fill="var(--muted)"/>
    <g><rect x="0" y="20" width="18" height="40" fill="var(--muted)"/><path d="M9 60v14" stroke="var(--ink)" stroke-width="3"/>${RM?'':'<animateTransform attributeName="transform" type="translate" values="96 0;246 0;96 0" dur="7s" repeatCount="indefinite"/>'}</g>
    ${[0,1,2,3].map(i=>solid(286+i*3,96-i*10,58,8)).join('')}
    <text x="200" y="210" text-anchor="middle" font-family="Vazirmatn" font-size="12" fill="var(--muted)">جای عکس: کارگاه و دستگاه CNC</text>
  </svg>`;
}
function phoneArt(){
  const b=(x,y)=>`<rect x="${x}" y="${y}" width="18" height="18" fill="#BD925B"/><rect x="${x+2}" y="${y+2}" width="14" height="14" fill="#E8CDA5"/>`;
  return `<svg viewBox="0 0 90 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="pw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFE7DA"/><stop offset="1" stop-color="#E2D5C1"/></linearGradient></defs>
  <rect width="90" height="180" fill="url(#pw)"/><rect y="118" width="90" height="62" fill="#C8B394"/><rect x="56" y="18" width="26" height="46" fill="#FFF8E8" opacity=".85"/>
  <ellipse cx="42" cy="119" rx="30" ry="3.5" fill="rgba(0,0,0,.2)"/>
  ${b(15,100)+b(33,100)+b(51,100)+b(33,82)+b(51,82)+b(51,64)}
  <g fill="none" stroke="#fff" stroke-width="1.5" opacity=".9"><path d="M8 40V30h10M82 40V30H72M8 140v10h10M82 140v10H72"/></g></svg>`;
}
function stageHTML(id,type,{hero=false,dims='',tools=false}={}){
  return `<div class="stage3d" id="${id}">${hero?'<span class="window"></span>':''}
    ${HAS3D?'':`<div class="fallback">${art(type==='hero'?'stair':type)}</div>`}
    ${dims?`<span class="dimchip num">${dims}</span>`:''}
    ${HAS3D?`<span class="hint" id="${id}-hint">${ico.drag} بکشید تا بچرخد</span>`:''}
    ${tools&&HAS3D?`<div class="stagebar"><button class="sbtn" data-explode aria-pressed="false">${ico.explode}<span>نمای انفجاری</span></button><button class="sbtn" data-spin aria-pressed="true" aria-label="چرخش خودکار">${ico.spin}</button></div>`:''}
  </div>`;
}
function mountStage(id,type,opts){const host=document.getElementById(id); if(!host||!HAS3D) return null; const v=makeViewer(host,type,opts);
  host.addEventListener('interact',()=>{const h=document.getElementById(id+'-hint'); if(h) h.style.opacity=0; const sp=host.querySelector('[data-spin]'); if(sp) sp.setAttribute('aria-pressed','false');},{once:true}); return v;}

/* ===== views ===== */
function vHome(){
  const cc=k=>P.filter(p=>p.cat===k).length;
  const catArt={shelves:'stair',storage:'drawer',desk:'desk',decor:'hex'};
  const mq=['MDF ۱۶ میلی‌متری','برش CNC','مونتاژ با یک آچار','ارسال به همه‌ی شهرها','ضمانت قطعه','پشتیبانی واتس‌اپ','مدول ۴۰ سانتی‌متری'];
  return `
  <div class="wrap">
    <section class="hero enter">
      <div style="--i:0">
        <div class="feats"><span class="feat">${ico.ar} سه‌بعدی ببین</span><span class="feat">${ico.camera} در اتاقت امتحان کن</span></div>
        <h1><span class="brand">ماجوکیت</span>خودت بساز، به سبک خودت</h1>
        <div class="sub"><span>کیت‌های ماژولار MDF</span><span>مونتاژ آسان</span><span>قیمت شفاف</span></div>
        <div class="actions"><a class="btn olive" href="#products">مشاهده کیت‌ها</a><a class="btn ghost" href="#how">چطور کار می‌کند</a></div>
      </div>
      <div style="--i:1">${stageHTML('heroStage','hero',{hero:true})}</div>
    </section>
  </div>
  <div class="marq" aria-hidden="true"><div>${[...mq,...mq,...mq].map(t=>`<span>${t}</span>`).join('')}</div></div>
  <div class="wrap">
    <section>
      <div class="sh"><div><div class="eyebrow">چرا ماجوکیت</div><h2>یک بار بخر، بارها گسترش بده</h2></div></div>
      <div class="why">${why.map(w=>`<div>${ico[w[0]]}<h3>${w[1]}</h3><p>${w[2]}</p></div>`).join('')}</div>
    </section>
    <section>
      <div class="sh"><h2>دسته‌بندی کیت‌ها</h2><a class="link" href="#products" data-cat="all">همه‌ی کیت‌ها ←</a></div>
      <div class="cats">${Object.entries(CATS).map(([k,n])=>`<a class="cat" href="#products" data-cat="${k}">${art(catArt[k])}<span>${n}<small>${fa(cc(k))} کیت</small></span><i class="go">${ico.arrow}</i></a>`).join('')}</div>
      <div class="spaces"><b>بر اساس فضا:</b>${Object.entries(SPACES).map(([k,n])=>`<a class="chip" href="#products" data-space="${k}">${n}</a>`).join('')}</div>
    </section>
    ${HAS3D?`<section>
      <div class="arpromo">
        <div class="txt">
          <div class="eyebrow" style="color:var(--wood)">جدید · AR</div>
          <h2>قبل از خرید، در اتاق خودت ببینش</h2>
          <p>از گوشه‌ی اتاقت عکس بگیر، کیت سه‌بعدی را رویش بچین، بچرخان و اندازه کن. بعد از نتیجه عکس بگیر و برای خانواده بفرست.</p>
          <button class="btn" data-ar="${(P.find(q=>q.type==='stair')||P[0]||{}).id}">${ico.ar} امتحان در اتاق خودت</button>
        </div>
        <div class="phone"><div class="phonebox">${phoneArt()}<span class="shut"></span></div></div>
      </div>
    </section>`:''}
    <section>
      <div class="sh"><div><div class="eyebrow">چطور کار می‌کند</div><h2>از انتخاب تا گسترش در چهار قدم</h2></div></div>
      <ol class="flow">${flow.map((f,i)=>`<li><span class="n">${fa(i+1)}</span><div><h3>${f[0]}</h3><p>${f[1]}</p></div></li>`).join('')}</ol>
    </section>
    <section>
      <div class="trust">
        <div class="art">${workshopArt()}</div>
        <div class="txt">
          <div class="eyebrow">از کارگاه ما</div>
          <h2 style="font-size:24px;font-weight:900">هر کیت را خودمان برش می‌زنیم، بسته می‌کنیم و پشتش می‌ایستیم</h2>
          <p class="lead" style="font-size:14.5px">ماجوکیت یک کارگاه کوچک است، نه یک انبار بزرگ. اگر وسط مونتاژ گیر کردی، آدم واقعی جوابت را در واتس‌اپ می‌دهد.</p>
          <ul>
            <li>${ico.check}<span><b>پشتیبانی واتس‌اپ</b> قبل و بعد از خرید، حتی وسط مونتاژ</span></li>
            <li>${ico.check}<span><b>ارسال ایمن</b> با بسته‌بندی تخت و محافظ لبه</span></li>
            <li>${ico.check}<span><b>ضمانت قطعه</b> اگر قطعه‌ای آسیب دید یا کم بود، رایگان می‌فرستیم</span></li>
          </ul>
        </div>
      </div>
    </section>
    <section><div class="sh"><h2>ایده‌ها</h2><a class="link" href="#blog">همه ←</a></div>${postsHTML()}</section>
  </div>`;
}
const FOPTS={space:['فضا',{all:'همه‌ی فضاها',...SPACES}],size:['ابعاد',{all:'همه‌ی اندازه‌ها',s:'کوچک (تا ۵۰ سانت)',m:'متوسط (۵۰ تا ۹۰)',l:'بزرگ (بیش از ۹۰)'}],exp:['قابلیت توسعه',{all:'همه',true:'قابل توسعه',false:'تکی'}],diff:['سختی مونتاژ',{all:'همه',1:'★ آسان',2:'★★ متوسط',3:'★★★ چالشی'}]};
const fresh=()=>({cat:'all',space:'all',size:'all',exp:'all',diff:'all'});
function filtered(){const f=S.f, q=(S.q||'').trim(); return P.filter(p=>(f.cat==='all'||p.cat===f.cat)&&(f.space==='all'||p.spaces.includes(f.space))&&(f.size==='all'||sizeOf(p)===f.size)&&(f.exp==='all'||String(p.exp)===f.exp)&&(f.diff==='all'||p.diff===+f.diff)&&(!q||(p.name+' '+p.use+' '+CATS[p.cat]+' '+p.ref[0]).toLowerCase().includes(q.toLowerCase())));}
function filterSelects(pre){return Object.entries(FOPTS).map(([k,[lab,o]])=>`<label for="${pre}${k}">${lab}<select id="${pre}${k}" data-f="${k}">${Object.entries(o).map(([v,n])=>`<option value="${v}" ${S.f[k]===v?'selected':''}>${n}</option>`).join('')}</select></label>`).join('');}
const activeF=()=>Object.keys(FOPTS).filter(k=>S.f[k]!=='all');
function vProducts(){
  const f=S.f;
  return `<div class="wrap"><section style="padding-top:20px">
    <div class="pagehead"><h1 id="phTitle"></h1></div>
    <div class="fbar">
      <button class="chip fbtn" id="openFilters">${ico.sliders} فیلترها<span class="fcount num" id="fcount"></span></button>
      <div class="chiprow" role="group" aria-label="دسته">${[['all','همه'],...Object.entries(CATS)].map(([k,n])=>`<button class="chip" data-fcat="${k}" aria-pressed="${f.cat===k}">${n}</button>`).join('')}</div>
    </div>
    <div class="filters" id="filtersInline">${filterSelects('f')}</div>
    <div class="resbar"><span id="resN"></span><div class="activef" id="activeF"></div></div>
    <div class="plist" id="plist"></div>
  </section></div>`;
}
function fillProducts(){
  const r=filtered(); $('#resN').textContent=S.q?`${fa(r.length)} نتیجه برای «${S.q}»`:`${fa(r.length)} کیت`;
  const pl=$('#plist'); pl.classList.remove('enter'); void pl.offsetWidth; pl.classList.add('enter');
  pl.innerHTML = r.length? r.map((p,i)=>pcard(p,i)).join('') : `<div class="empty">کیتی پیدا نشد. ${S.q||activeF().length?'<button class="link" id="fclear">جستجو و فیلترها را پاک کن</button> یا ':''}<a class="link" href="${waLink('سلام ماجوکیت، دنبال کیتی هستم که در سایت پیدا نکردم.')}" target="_blank" rel="noopener">در واتس‌اپ بپرس</a>.</div>`;
  document.querySelectorAll('[data-fcat]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.fcat===S.f.cat));
  const h=$('#phTitle'); if(h) h.textContent=S.f.cat==='all'?'همه‌ی کیت‌ها':CATS[S.f.cat];
  const a=activeF(); const fc=$('#fcount'); if(fc) fc.textContent=a.length?fa(a.length):'';
  const box=$('#activeF'); if(box) box.innerHTML=a.map(k=>`<button class="tag" data-unf="${k}" aria-label="حذف فیلتر ${FOPTS[k][1][S.f[k]]}">${FOPTS[k][1][S.f[k]]} ✕</button>`).join('')+((a.length||S.q)?'<button class="link" id="fclear">پاک کردن همه</button>':'');
  Object.keys(FOPTS).forEach(k=>document.querySelectorAll(`[data-f="${k}"]`).forEach(sel=>sel.value=S.f[k]));
  const sb=$('#sheetShow'); if(sb) sb.textContent=`نمایش ${fa(r.length)} کیت`;
}
function openFilters(){
  $('#layer').innerHTML=`<div class="scrim" data-close></div><div class="sheet" role="dialog" aria-modal="true" aria-label="فیلترها">
   <button class="iconbtn x" data-close aria-label="بستن">✕</button>
   <h2 style="font-size:20px;margin-bottom:14px">فیلترها</h2>
   <div class="filters sheetf">${filterSelects('s')}</div>
   <button class="btn olive block" id="sheetShow" data-close>نمایش</button>
  </div>`; document.body.style.overflow='hidden'; fillProducts();
}
function galleryBody(p){
  const g=S.gal;
  if(g==='photo'&&p.images.length){ const n=p.images.length, i=((S.img%n)+n)%n;
    return `<div class="photos"><img src="${p.images[i]}" alt="${p.name}، عکس ${fa(i+1)}">${n>1?`<button class="sbtn pnav prev" data-img="-1" aria-label="عکس قبلی">›</button><button class="sbtn pnav next" data-img="1" aria-label="عکس بعدی">‹</button><span class="dimchip num">${fa(i+1)} از ${fa(n)}</span>`:''}</div>`; }
  if(g==='video'&&p.video) return `<video class="pvideo" src="${p.video}" controls playsinline preload="metadata"></video>`;
  if(g==='3d') return stageHTML('pdStage',p.type,{dims:`${fa(p.w)}×${fa(p.d)}×${fa(p.h)} سانتی‌متر`,tools:true});
  if(g==='img') return art(p.type);
  if(g==='parts') return partsArt(p);
  if(g==='steps') return stepsArt(p);
  return `<div class="video"><span class="play">${ico.play}</span><b style="color:var(--ink)">ویدیوی مونتاژ ${p.name}</b><span>۴۰ ثانیه، به‌زودی</span></div>`;
}
const FAV_KEY='majoo-fav';
let FAV=[]; try{FAV=JSON.parse(localStorage.getItem(FAV_KEY)||'[]')}catch(e){}
const saveFav=()=>{try{localStorage.setItem(FAV_KEY,JSON.stringify(FAV))}catch(e){}};
const icoExt=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;
const icoHeart=`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>`;
const icoShield=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>`;
const icoMedia=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-4 4 3 3-2 6 4M8.5 9.2h.01"/></svg>`;
const icoCube=`<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>`;
function mediaList(p){
  const m=[]; p.images.forEach((src,i)=>m.push({k:'photo',i,src,label:`عکس ${fa(i+1)}`}));
  if(HAS3D) m.push({k:'3d',label:'سه‌بعدی'});
  m.push({k:'img',label:'تصویر'},{k:'parts',label:'قطعات جدا'},{k:'steps',label:'مراحل مونتاژ'},{k:'video',label:'ویدیو'});
  return m;
}
const mediaOn=(m)=>S.gal===m.k&&(m.k!=='photo'||(((S.img%(byId(+location.hash.slice(2))?.images.length||1))+(byId(+location.hash.slice(2))?.images.length||1))%(byId(+location.hash.slice(2))?.images.length||1))===m.i);
function thumbInner(p,m){
  if(m.k==='photo') return `<img src="${m.src}" alt="${m.label}" loading="lazy">`;
  if(m.k==='img') return art(p.type);
  if(m.k==='3d') return `<span class="tg">${icoCube}<small>سه‌بعدی</small></span>`;
  if(m.k==='video') return `<span class="tg">${ico.play}<small>ویدیو</small></span>`;
  return `<span class="tg"><small>${m.label}</small></span>`;
}
function syncThumbs(){ const p=byId(+location.hash.slice(2)); if(!p) return; const ms=mediaList(p);
  document.querySelectorAll('.gthumbs [data-gal]').forEach((b,i)=>{ const on=mediaOn(ms[i]); b.setAttribute('aria-pressed',on); if(on&&innerWidth<860) b.scrollIntoView({block:'nearest',inline:'center'}); }); }
function gallery(p){
  const ms=mediaList(p);
  return `<div class="gthumbs" role="group" aria-label="رسانه‌های محصول">${ms.map((m,i)=>`<button data-gal="${m.k}" ${m.k==='photo'?`data-set="${m.i}"`:''} aria-label="${m.label}" aria-pressed="${mediaOn(m)}">${thumbInner(p,m)}</button>`).join('')}</div>
   <div class="gmain"><div class="stage" id="gstage">${galleryBody(p)}</div><button class="allmedia" data-allmedia>${icoMedia}<span>همه‌ی رسانه‌ها</span></button></div>`;
}
function mountGallery(p){ killViewers(); if(S.gal==='3d') mountStage('pdStage',p.type,{auto:true}); }
function openAllMedia(p){
  const ms=mediaList(p);
  $('#layer').innerHTML=`<div class="scrim" data-close></div><div class="sheet wide" role="dialog" aria-modal="true" aria-label="همه‌ی رسانه‌ها">
   <button class="iconbtn x" data-close aria-label="بستن">✕</button>
   <h2 style="font-size:20px;margin-bottom:14px">همه‌ی رسانه‌ها · ${p.name}</h2>
   <div class="mgrid">${ms.map(m=>`<button class="mtile" data-gal="${m.k}" ${m.k==='photo'?`data-set="${m.i}"`:''} data-close>${thumbInner(p,m)}<span>${m.label}</span></button>`).join('')}</div></div>`;
  document.body.style.overflow='hidden';
}
function vProduct(id){
  const p=byId(id); if(!p) return vProducts();
  const comp=p.compat.map(byId).filter(Boolean);
  const same=P.filter(q=>q.cat===p.cat&&q.id!==p.id&&!p.compat.includes(q.id)).slice(0,6);
  const dims=`${fa(p.w)}×${fa(p.d)}×${fa(p.h)} سانتی‌متر`;
  const code=`MK-${String(p.id).padStart(3,'0')}`;
  const fav=FAV.includes(p.id);
  const wall=['hex','key','wallfold'].includes(p.type);
  const card=c=>`<a href="#p${c.id}">${c.images&&c.images[0]?`<img src="${c.images[0]}" alt="" loading="lazy">`:art(c.type)}<span>${c.name}<small>${fa(c.price)} تومان</small></span></a>`;
  return `<div class="wrap">
   <nav class="crumbs" aria-label="مسیر"><a href="#products" data-cat="all">محصولات</a><i>›</i><a href="#products" data-cat="${p.cat}">${CATS[p.cat]}</a><i>›</i><span aria-current="page">${p.name}</span></nav>
   <div class="pd enter">
    <div class="gallery" id="gal">${gallery(p)}</div>
    <div class="pinfo">
      <a class="serieslink" href="#products" data-cat="${p.cat}">بیشتر از دسته‌ی ${CATS[p.cat]}</a>
      <div class="ptitle"><div><h1>${p.name}</h1><p class="psub">${p.use} <a class="dimlink" href="#measure">${dims}</a></p></div>
        <button class="heart" data-fav="${p.id}" aria-pressed="${fav}" aria-label="علاقه‌مندی">${icoHeart}</button></div>
      <div class="pprice"><b class="num">${fa(p.price)}</b><span>تومان</span></div>
      <div class="prate">${stars(p.diff)}<span>مونتاژ ${DIFF[p.diff]} · حدود ${fa(p.time)} دقیقه</span>${p.exp?`<span class="xbadge inline">+ قابل توسعه</span>`:''}</div>
      <div class="opt"><b>جنس و رنگ</b><span class="optv">MDF طبیعی</span>
        <div class="swatches"><button class="sw on" aria-pressed="true" aria-label="MDF طبیعی"><i></i></button></div></div>
      <a class="rowlink" href="#custom"><span><b>خودت طراحی کن</b><small>ترکیب ماژول‌ها با ابزار طراحی ماجوکیت</small></span>${icoExt}</a>
      <div class="getit"><b>چطور تحویل بگیرم</b><a class="avail" href="${waLink(`سلام، ارسال «${p.raw.name}» به شهر من چقدر زمان می‌برد؟`)}" target="_blank" rel="noopener"><i class="dot ${p.inStock?'ok':'no'}"></i>${p.inStock?'موجود است · بررسی زمان و هزینه‌ی ارسال به شهر شما':'فعلاً ناموجود · خبرم کنید'}</a></div>
      <div class="buy" id="buyMain"><div class="qty"><button data-pq="-1" aria-label="کمتر">−</button><output id="pq" class="num">${fa(S.qty)}</output><button data-pq="1" aria-label="بیشتر">+</button></div>${p.inStock?`<button class="btn olive pbag" data-add="${p.id}"><span>افزودن به سبد</span></button>`:`<a class="btn ghost" href="${waLink(`سلام، «${p.raw.name}» کی موجود می‌شود؟`)}" target="_blank" rel="noopener">ناموجود؛ خبرم کنید</a>`}</div>
      ${HAS3D?`<button class="arcta" data-ar="${p.id}"><span class="ic">${ico.ar}</span><span><b>در اتاق خودت ببین</b><small>عکس بگیر، کیت را رویش بچین و از نتیجه عکس بگیر</small></span></button>`:''}
      <div class="pbox">
        <div class="pbx"><b>ضمانت قطعه ${icoShield}</b><p>قطعه‌ی آسیب‌دیده یا کم‌شده را رایگان می‌فرستیم. عکسش را در واتس‌اپ بفرست.</p></div>
        <div class="pbx"><b>پشتیبانی وسط مونتاژ</b><p>اگر جایی گیر کردی، در واتس‌اپ بپرس. <a class="link" href="${waLink(`سلام ماجوکیت، درباره‌ی «${p.raw.name}» سؤال دارم.`)}" target="_blank" rel="noopener">شروع گفتگو</a></p></div>
      </div>
      <div class="pays"><b>روش پرداخت</b><p>پرداخت هنگام هماهنگی سفارش در واتس‌اپ انجام می‌شود.</p></div>
      ${SET.show_reference==='1'&&p.ref[2]?`<div class="refticket">
        <div class="rt-h"><span class="rt-badge">تیکت مرجع</span><b>IKEA ${p.ref[0]}</b><small>${p.ref[1]}</small></div>
        <p>عکس‌ها، ویدیو، مشخصات، اطلاعات بسته‌بندی و PDF مونتاژ محصول مشابه را در صفحه‌ی ایکیا ببینید. محتوای ماجوکیت این کیت در همین سطح تولید می‌شود.</p>
        <a class="btn ghost" href="${p.ref[2]}" target="_blank" rel="noopener">باز کردن صفحه‌ی مرجع ↗</a>
      </div>`:''}
    </div>
   </div>
   <section class="pdetails">
    <details class="acc" open><summary>معرفی</summary><div class="accb">
      ${p.description?`<p class="pdesc">${p.description.replace(/\n/g,'<br>')}</p>`:`<p class="pdesc">${p.use}</p>`}
      <p class="code">کد محصول <b class="num">${code}</b></p></div></details>
    <details class="acc"><summary>جزئیات محصول</summary><div class="accb"><dl class="specs">
      <div><dt>جنس</dt><dd>MDF ۱۶ میلی‌متر، برش CNC</dd></div>
      <div><dt>قابل توسعه</dt><dd>${p.exp?'بله، با پیچ و سوراخ‌کاری استاندارد ماجوکیت':'خیر'}</dd></div>
      <div><dt>مراقبت</dt><dd>با پارچه‌ی نرم و کمی نمدار پاک کنید. از آب مستقیم دور نگه دارید.</dd></div>
      <div><dt>محل استفاده</dt><dd>فضای داخلی خانه و دفتر</dd></div></dl></div></details>
    <details class="acc" id="measure"><summary>ابعاد</summary><div class="accb"><dl class="specs">
      <div><dt>عرض</dt><dd class="num">${fa(p.w)} سانتی‌متر</dd></div>
      <div><dt>عمق</dt><dd class="num">${fa(p.d)} سانتی‌متر</dd></div>
      <div><dt>ارتفاع</dt><dd class="num">${fa(p.h)} سانتی‌متر</dd></div></dl></div></details>
    <details class="acc"><summary>مونتاژ و دفترچه</summary><div class="accb"><dl class="specs">
      <div><dt>زمان</dt><dd>حدود ${fa(p.time)} دقیقه</dd></div>
      <div><dt>سختی</dt><dd>${stars(p.diff)} ${DIFF[p.diff]}</dd></div>
      <div><dt>تعداد قطعات</dt><dd>${fa(p.parts)} قطعه</dd></div>
      <div><dt>ابزار</dt><dd>داخل بسته (آچار آلن)${wall?' + دریل برای نصب دیواری':''}</dd></div></dl>
      <a class="btn ghost" href="#guide" data-guide="${p.id}">دفترچه و ویدیوی مونتاژ</a></div></details>
    <details class="acc"><summary>خوب است بدانید</summary><div class="accb"><ul class="know">
      <li>MDF استاندارد برای فضای داخلی مناسب است؛ برای حمام و بالکن باز توصیه نمی‌کنیم.</li>
      <li>پیچ‌ها را اول نیمه‌سفت ببندید و آخر کار، وقتی بدنه گونیا شد، سفت کنید.</li>
      ${wall?'<li>برای نصب روی دیوار، پیچ و رولپلاک متناسب با جنس دیوار را جداگانه تهیه کنید.</li>':''}</ul></div></details>
    <details class="acc"><summary>بسته‌بندی</summary><div class="accb"><dl class="specs">
      <div><dt>نوع بسته</dt><dd>بسته‌ی تخت</dd></div>
      <div><dt>تعداد قطعات</dt><dd>${fa(p.parts)} قطعه، با کیسه‌ی پیچ شماره‌دار</dd></div></dl></div></details>
   </section>
   ${comp.length?`<section class="pcar"><div class="connects"><h2>لوازم جانبی و کیت‌های سازگار</h2><p>${p.exp?'با همان پیچ‌ها و سوراخ‌کاری استاندارد ماجوکیت، این کیت‌ها کنار یا روی هم سوار می‌شوند.':'این کیت‌ها کنار هم یک مجموعه‌ی هماهنگ می‌سازند.'}</p>
     <div class="mini">${comp.map(card).join('')}</div></div></section>`:''}
   ${same.length?`<section class="pcar"><h2 class="sec">بیشتر از دسته‌ی ${CATS[p.cat]}</h2><div class="mini flat">${same.map(card).join('')}</div></section>`:''}
   <div style="height:24px"></div>
  </div>`;
}
function infographic(){
  const st=[['انتخاب','کیت یا ترکیب'],['تحویل','بسته‌ی تخت'],['مونتاژ','آچار آلن'],['گسترش','ماژول تازه']];
  return `<svg viewBox="0 0 720 200" role="img" aria-label="اینفوگرافیک چهار مرحله">
   ${st.map((s,i)=>{const x=630-i*180; return `
     <circle cx="${x}" cy="70" r="46" fill="var(--sand)"/>
     <text x="${x}" y="152" text-anchor="middle" font-family="Vazirmatn" font-weight="800" font-size="17" fill="var(--ink)">${s[0]}</text>
     <text x="${x}" y="176" text-anchor="middle" font-family="Vazirmatn" font-size="13" fill="var(--muted)">${s[1]}</text>
     <text x="${x+34}" y="34" text-anchor="middle" font-family="Vazirmatn" font-weight="900" font-size="15" fill="var(--olive)">${fa(i+1)}</text>
     ${i<3?`<path class="dash" d="M${x-58} 70h-62" stroke="var(--olive)" stroke-width="2.4" stroke-dasharray="6 6"/><path d="M${x-120} 70l10-7v14z" fill="var(--olive)"/>`:''}`}).join('')}
   <g transform="translate(608 48)">${box(0,0,44,44,4)}</g>
   <g transform="translate(428 52)">${solid(0,0,48,8)+solid(0,12,48,8)+solid(0,24,48,8)}</g>
   <g transform="translate(250 50)"><path d="M6 40h26V6" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${box(26,14,28,28,3)}</g>
   <g transform="translate(66 46)">${box(0,10,30,30,3)+box(30,10,30,30,3)}<rect x="15" y="-20" width="30" height="30" fill="none" stroke="var(--olive)" stroke-width="1.8" stroke-dasharray="4 3"/><path d="M30 -10v10M25 -5h10" stroke="var(--olive)" stroke-width="2" stroke-linecap="round"/></g>
  </svg>`;
}
function vHow(){
  return `<div class="wrap"><section style="padding-top:24px" class="enter">
    <div><div class="eyebrow">چطور کار می‌کند</div><div class="pagehead"><h1>یک مکعب، بی‌نهایت ترکیب</h1></div>
    <p class="lead" style="margin:8px 0 20px">همه‌ی کیت‌های ماجوکیت روی یک مدول ۴۰ سانتی‌متری طراحی شده‌اند. هر قطعه‌ای که امروز می‌خری، با کیت‌هایی که بعداً می‌خری هم جور است.</p></div>
    <div class="infog">${infographic()}</div>
  </section>
  <section style="padding-top:0"><div class="info-grid c2">
    ${HAS3D?`<div style="display:grid;gap:8px">${stageHTML('howStage','cube',{tools:true})}<p style="font-size:13px;color:var(--muted)">«نمای انفجاری» را بزن تا ببینی یک مکعب از چه قطعه‌هایی ساخته می‌شود.</p></div>`:`<div class="vthumb"><span class="play">${ico.play}</span><time>۰:۴۵</time></div>`}
    <div class="panel" style="align-content:center">
      <h3 style="font-size:19px">به زبان ساده</h3>
      <p>۱. کیتی را که لازم داری انتخاب کن. اگر مطمئن نیستی، عکس فضایت را در واتس‌اپ بفرست.</p>
      <p>۲. بسته به‌صورت تخت می‌رسد. هر قطعه یک حرف دارد و هر کیسه‌ی پیچ یک شماره.</p>
      <p>۳. راهنمای تصویری را دنبال کن. ابزار اضافه لازم نیست.</p>
      <p>۴. بعداً که جا یا نیازت عوض شد، فقط ماژول تازه بخر و وصلش کن.</p>
      <a class="btn olive" href="#products" style="margin-top:8px;justify-self:start">انتخاب اولین کیت</a>
    </div>
  </div></section></div>`;
}
const FAQ=[
 ['بدون تجربه هم می‌توانم مونتاژ کنم؟','بله. کیت‌های یک‌ستاره را بیشتر مشتری‌ها بار اول و زیر ۱۵ دقیقه می‌بندند. راهنما تصویری است و متن فنی ندارد.'],
 ['MDF در برابر رطوبت چطور است؟','MDF استاندارد برای فضای داخلی خانه و دفتر مناسب است. برای حمام و بالکن باز توصیه نمی‌کنیم.'],
 ['اگر قطعه‌ای شکسته یا کم بود چه کنم؟','عکسش را در واتس‌اپ بفرست. قطعه‌ی جایگزین را رایگان ارسال می‌کنیم.'],
 ['کیت‌ها را می‌شود باز کرد و دوباره بست؟','بله. اتصال‌ها پیچی هستند و برای اسباب‌کشی چند بار باز و بسته شدن را تحمل می‌کنند.'],
 ['«در اتاق خودت ببین» چطور کار می‌کند؟','از گوشه‌ی اتاقت عکس بگیر یا یک عکس انتخاب کن. مدل سه‌بعدی کیت روی عکس می‌نشیند. آن را بکش، بچرخان و اندازه‌اش را تنظیم کن، بعد از نتیجه عکس بگیر.'],
 ['ارسال به شهرستان دارید؟','بله، به همه‌ی شهرها. زمان و هزینه را هنگام ثبت سفارش در واتس‌اپ اعلام می‌کنیم.']
];
const faqHTML=()=>FAQ.map(q=>`<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('');
const MISTAKES=[['پیچ‌ها را از اول سفت نکن','همه را نیمه‌سفت ببند و آخر کار، وقتی بدنه گونیا شد، سفت کن.'],['پشت و روی صفحه را چک کن','سوراخ‌های نیمه‌عمق همیشه رو به داخل کیت هستند.'],['دریل برقی برای پیچ‌های اتصال نه','MDF زیر فشار دریل می‌شکند. با آچار آلن ببند.'],['کیسه‌ی پیچ‌ها را با هم خالی نکن','هر مرحله از کیسه‌ی هم‌شماره‌اش استفاده کن.']];
function vGuide(){
  return `<div class="wrap"><section style="padding-top:24px" class="enter">
   <div><div class="eyebrow">راهنمای مونتاژ</div><div class="pagehead"><h1>هر چیزی که برای ساختن لازم داری</h1></div>
   <p class="lead" style="margin:8px 0 20px">دفترچه‌ی PDF هر کیت، ویدیوهای کوتاه، اشتباه‌های رایج و جواب سؤال‌های پرتکرار.</p></div>
   <div class="info-grid c2">
    <div class="panel" id="manuals"><h3>دفترچه‌های PDF</h3>
      ${P.map(p=>`<div class="manual ${S.hl===p.id?'hl':''}" id="m${p.id}"><span class="pdf">PDF</span><div><b>${p.name}</b><span>${fa(p.parts)} قطعه · ${stars(p.diff)}</span><br>${refTag(p)}</div><a class="btn soft" href="${p.manual||waLink(`سلام، لطفاً دفترچه‌ی PDF مونتاژ «${p.raw.name}» را بفرستید.`)}" target="_blank" rel="noopener">${p.manual?'دانلود':'دریافت'}</a></div>`).join('')}
    </div>
    <div style="display:grid;gap:12px;align-content:start">
      <div class="panel"><h3>ویدیوهای آموزشی</h3>
        <div class="info-grid" style="grid-template-columns:1fr 1fr">${[['مونتاژ مکعب پایه','۰:۴۰'],['اتصال دو ماژول','۰:۳۵'],['نصب در روی مکعب','۰:۳۰'],['نصب قفسه دیواری','۰:۴۵']].map(v=>`<div><div class="vthumb"><span class="play">${ico.play}</span><time>${v[1]}</time></div><p style="font-size:13px;margin-top:4px;color:var(--ink);font-weight:700">${v[0]}</p></div>`).join('')}</div>
        <p style="font-size:12.5px">ویدیوها به‌زودی بارگذاری می‌شوند.</p>
      </div>
      <div class="panel"><h3>اشتباه‌های رایج</h3>
        ${MISTAKES.map(m=>`<div class="mistake"><span class="x">!</span><div><b style="font-size:14.5px">${m[0]}</b><p>${m[1]}</p></div></div>`).join('')}
      </div>
    </div>
   </div>
  </section>
  <section style="padding-top:0"><h2 style="font-size:22px;font-weight:900;margin-bottom:12px">سؤال‌های مونتاژ</h2>${faqHTML()}</section></div>`;
}
function vFaq(){return `<div class="wrap"><section style="padding-top:24px"><div class="pagehead"><h1 style="margin-bottom:16px">سؤالات متداول</h1></div>${faqHTML()}<p class="lead" style="margin-top:20px">جوابت را پیدا نکردی؟ <a class="link" href="${waLink('سلام ماجوکیت، سؤالی دارم.')}" target="_blank" rel="noopener">در واتس‌اپ بپرس</a></p></section></div>`;}
function vAbout(){return `<div class="wrap"><section style="padding-top:24px;display:grid;gap:20px">
  <div><div class="eyebrow">درباره‌ی ماجوکیت</div><div class="pagehead"><h1>برای خانه‌هایی که مدام عوض می‌شوند</h1></div></div>
  <div class="trust"><div class="art">${workshopArt()}</div><div class="txt">
  <p>خانه‌ها در ایران کوچک‌تر شده‌اند و آدم‌ها بیشتر اسباب‌کشی می‌کنند. مبلمان سنگین و یک‌تکه با این زندگی جور نیست.</p>
  <p>ماجوکیت را ساختیم تا مبلمان هم مثل زندگی قابل تغییر باشد: سبک، قابل حمل، و قابل گسترش. منطق ماژولار را از ایکیا یاد گرفتیم و آن را ساده‌تر و ایرانی‌تر کردیم.</p>
  <p>هر کیت در کارگاه خودمان با دستگاه CNC برش می‌خورد و مستقیم به دست تو می‌رسد.</p>
  <a class="btn olive" href="#products" style="justify-self:start">دیدن کیت‌ها</a></div></div></section></div>`;}
function vBlog(){return `<div class="wrap"><section style="padding-top:24px"><div class="eyebrow">بلاگ و ایده‌ها</div><div class="pagehead"><h1 style="margin-bottom:16px">ایده‌های چیدمان، قبل و بعد، ایکیا‌هک ایرانی</h1></div>${postsHTML()}</section></div>`;}
function vCustom(){return `<div class="wrap"><section style="padding-top:24px;display:grid;gap:20px">
  <div><span class="soon">به‌زودی</span><div class="pagehead"><h1 style="margin-top:8px">کیت را با اندازه‌ی فضای خودت طراحی کن</h1></div>
  <p class="lead" style="margin-top:8px">پیکربند آنلاین: ابعاد دیوار را بده، ماژول‌ها را بچین، پیش‌نمایش سه‌بعدی ببین و همان را سفارش بده.</p></div>
  ${HAS3D?stageHTML('customStage','stair',{tools:true}):''}
  <div class="info-grid c3">
    <div class="panel"><h3>پیکربند ماژول</h3><p>ترکیب مکعب، کشو و در را روی یک شبکه بچین و قیمت را همان لحظه ببین.</p></div>
    <div class="panel"><h3>پیش‌نمایش سه‌بعدی</h3><p>چیدمانت را از هر زاویه ببین، قبل از اینکه بخری.</p></div>
    <div class="panel"><h3>واقعیت افزوده‌ی زنده</h3><p>نسخه‌ی عکسی‌اش همین حالا روی صفحه‌ی هر محصول هست. نسخه‌ی زنده با دوربین در فاز بعد.</p></div>
  </div>
  <form class="form panel" id="notify" style="max-width:480px"><h3>وقتی آماده شد خبرت کنیم؟</h3>
    <label for="nphone">شماره‌ی موبایل<input id="nphone" inputmode="tel" required placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"></label>
    <button class="btn olive">خبرم کن</button><p class="demo">فقط برای خبر دادن درباره‌ی سفارشی‌سازی استفاده می‌شود.</p></form>
  </section></div>`;}
function orderText(f={},code=''){
  const ids=Object.keys(S.cart).map(Number).filter(id=>byId(id));
  const lines=ids.map(id=>`- ${byId(id).raw.name} × ${fa(S.cart[id])}`).join('\n');
  const sum=ids.reduce((a,id)=>a+byId(id).price*S.cart[id],0);
  return `سلام ماجوکیت، می‌خواهم سفارش بدهم${code?` (کد ${code})`:''}:\n${lines||'- (هنوز کیتی انتخاب نکرده‌ام)'}\nجمع: ${fa(sum)} تومان\n\nنام: ${f.name||''}\nموبایل: ${f.phone||''}\nشهر: ${f.city||''}\nتوضیح: ${f.note||''}`;
}
function orderForm(){ return {name:$('#oname').value.trim(),phone:toLatin($('#ophone').value).trim(),city:$('#ocity').value.trim(),note:$('#onote').value.trim()}; }
async function submitOrder(btn){
  const ids=Object.keys(S.cart).filter(id=>byId(+id)); const err=$('#orderErr'); err.hidden=true;
  if(!ids.length){ toast('سبد خالی است'); return; }
  const f=orderForm();
  if(!f.name){ err.hidden=false; err.textContent='نامت را بنویس تا سفارش را به اسم تو ثبت کنیم.'; $('#oname').focus(); return; }
  if(f.phone.replace(/\D/g,'').length<10){ err.hidden=false; err.textContent='شماره‌ی موبایل را کامل بنویس، مثلاً ۰۹۱۲۱۲۳۴۵۶۷.'; $('#ophone').focus(); return; }
  btn.disabled=true; btn.textContent='در حال ثبت…';
  const w=window.open('about:blank','_blank');
  try{
    const r=await api('/api/orders',{items:ids.map(id=>({id:+id,qty:S.cart[id]})),...f});
    const link=waLink(orderText(f,r.code));
    if(w) w.location.href=link;
    S.cart={}; save(); counts(); updateWa();
    $('#view').innerHTML=`<div class="wrap"><section class="done enter"><div class="donebox"><span class="doneic">${ico.tick}</span><h1>سفارشت ثبت شد</h1><p class="lead">کد پیگیری: <b class="num" dir="ltr">${esc(r.code)}</b></p><p class="lead">برای نهایی کردن، پیام آماده را در واتس‌اپ بفرست. زمان ارسال و هزینه را همان‌جا اعلام می‌کنیم.</p><a class="btn olive" href="${link}" target="_blank" rel="noopener">باز کردن واتس‌اپ</a><a class="link" href="#products">ادامه‌ی خرید</a></div></section></div>`;
    window.scrollTo(0,0);
  }catch(e){ if(w) w.close(); err.hidden=false; err.textContent=e.message; btn.disabled=false; btn.textContent='ثبت سفارش و ارسال در واتس‌اپ'; }
}
function vContact(){
  const ids=Object.keys(S.cart).map(Number).filter(id=>S.cart[id]>0);
  const sum=ids.reduce((a,id)=>a+byId(id).price*S.cart[id],0);
  return `<div class="wrap"><section style="padding-top:24px">
   <div class="eyebrow">تماس و سفارش</div>
   <div class="pagehead"><h1>سفارش از طریق واتس‌اپ</h1></div>
   <p class="lead" style="margin:8px 0 20px">سبدت را مرور کن، نام و شهرت را بنویس و دکمه را بزن. پیام آماده‌ی سفارش در واتس‌اپ باز می‌شود و ما زمان ارسال و هزینه را همان‌جا اعلام می‌کنیم.</p>
   <div class="info-grid c2">
    <div class="panel"><h3>سبد سفارش</h3>
      ${ids.length?`<div>${ids.map(id=>{const p=byId(id);return `<div class="oline"><div class="th">${art(p.type)}</div><div><b>${p.name}</b><span class="num">${fa(p.price*S.cart[id])} تومان</span></div><div class="qty sm"><button data-cq="${id}" data-d="-1" aria-label="کمتر">−</button><output class="num">${fa(S.cart[id])}</output><button data-cq="${id}" data-d="1" aria-label="بیشتر">+</button></div></div>`}).join('')}</div>
      <div class="tot"><span>جمع کالاها</span><span class="num">${fa(sum)} تومان</span></div><p style="font-size:12.5px">${esc(SET.shipping_note)}</p>`
      :`<div class="empty" style="padding:28px 12px">سبد خالی است. <a class="link" href="#products">کیت‌ها را ببین</a> یا مستقیم در واتس‌اپ بپرس.</div>`}
    </div>
    <form class="form panel" id="orderForm">
      <h3>اطلاعات تو</h3>
      <label for="oname">نام<input id="oname" autocomplete="name" placeholder="مثلاً مریم رضایی"></label>
      <label for="ophone">موبایل<input id="ophone" inputmode="tel" autocomplete="tel" placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"></label>
      <label for="ocity">شهر<input id="ocity" placeholder="مثلاً شیراز"></label>
      <label for="onote">توضیح (اختیاری)<textarea id="onote" placeholder="مثلاً ابعاد دیوار یا زمان تحویل"></textarea></label>
      <p class="formerr" id="orderErr" role="alert" hidden></p><button class="btn olive block" id="sendOrder" type="button" ${ids.length?'':'disabled'}>ثبت سفارش و ارسال در واتس‌اپ</button>
      <div class="wanum">اگر واتس‌اپ باز نشد، به این شماره پیام بده: <code>${esc(waShow())}</code><button type="button" class="link" id="copyNum">کپی</button></div>
    </form>
   </div>
  </section></div>`;
}

/* ===== AR on photo ===== */
let AR=null, ROOM=null;
const DL={save:async({filename,data})=>{const a=document.createElement('a');a.href=URL.createObjectURL(data);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);return {status:'saved'};}};
function sampleRoom(){
  const c=document.createElement('canvas'); c.width=1080; c.height=1440; const x=c.getContext('2d');
  let g=x.createLinearGradient(0,0,0,960); g.addColorStop(0,'#EFE7DA'); g.addColorStop(1,'#E3D7C4'); x.fillStyle=g; x.fillRect(0,0,1080,960);
  g=x.createLinearGradient(0,960,0,1440); g.addColorStop(0,'#C9AE88'); g.addColorStop(1,'#A98C66'); x.fillStyle=g; x.fillRect(0,960,1080,480);
  x.strokeStyle='rgba(90,60,30,.12)'; x.lineWidth=3; for(let i=-10;i<20;i++){x.beginPath(); x.moveTo(540+i*40,960); x.lineTo(540+i*160,1440); x.stroke();}
  x.fillStyle='#F7F1E6'; x.fillRect(0,940,1080,22);
  x.fillStyle='rgba(255,250,235,.9)'; x.fillRect(640,170,300,420); x.strokeStyle='#fff'; x.lineWidth=14; x.strokeRect(640,170,300,420); x.beginPath(); x.moveTo(790,170); x.lineTo(790,590); x.moveTo(640,380); x.lineTo(940,380); x.stroke();
  g=x.createLinearGradient(640,590,420,1300); g.addColorStop(0,'rgba(255,248,225,.55)'); g.addColorStop(1,'rgba(255,248,225,0)'); x.fillStyle=g; x.beginPath(); x.moveTo(640,960); x.lineTo(940,960); x.lineTo(700,1440); x.lineTo(260,1440); x.fill();
  x.fillStyle='#7C8B5A'; x.beginPath(); x.ellipse(150,780,70,120,0,0,7); x.fill(); x.fillStyle='#D9C9AE'; x.fillRect(110,860,80,100);
  return c.toDataURL('image/jpeg',.85);
}
function openAR(id){
  if(!HAS3D) return;
  const p=byId(id); if(!p) return; closeLayer(); closeAR();
  if(!ROOM) ROOM=sampleRoom();
  $('#arLayer').innerHTML=`<div class="ar" role="dialog" aria-modal="true" aria-label="دیدن ${p.name} در اتاق">
    <div class="ar-stage" id="arStage"><img id="arBg" alt="" src="${ROOM}"></div>
    <div class="ar-top"><button class="arx" data-arclose aria-label="بستن">${ico.close}</button><b><span id="arName">${p.name}</span><small id="arSrc">اتاق نمونه · عکس اتاق خودت را بگذار</small></b>
      <select id="arPick" aria-label="انتخاب کیت">${P.map(q=>`<option value="${q.id}" ${q.id===id?'selected':''}>${q.name}</option>`).join('')}</select></div>
    <div class="ar-hint" id="arHint">مدل را بکشید تا جابه‌جا شود · با دو انگشت بچرخانید</div>
    <div class="ar-bottom">
      <div class="ar-src">
        ${navigator.mediaDevices?.getUserMedia?`<button class="arlive" id="arLive" type="button">${ico.ar} دوربین زنده</button>`:''}
        <label for="arCam">${ico.camera} عکس از اتاقم<input id="arCam" type="file" accept="image/*" capture="environment"></label>
        <label for="arGal">${ico.photo} انتخاب از گالری<input id="arGal" type="file" accept="image/*"></label>
      </div>
      <div class="ar-sliders">
        <label for="arScale">اندازه</label><input id="arScale" type="range" min="30" max="250" value="100">
        <label for="arRot">چرخش</label><input id="arRot" type="range" min="-180" max="180" value="-20">
      </div>
      <div class="ar-row">
        <div class="ar-tools"><button class="arx" data-arrot="-1" aria-label="چرخش به چپ">${ico.rotL}</button><button class="arx" data-arrot="1" aria-label="چرخش به راست">${ico.rotR}</button></div>
        <button class="shutter" id="arShutter" aria-label="عکس بگیر"><span></span></button>
        <div class="ar-tools end"><button class="thumb" id="arThumb" aria-label="آخرین عکس" hidden></button></div>
      </div>
    </div>
  </div>`;
  document.body.style.overflow='hidden';
  const v=makeViewer($('#arStage'),p.type,{ar:true,auto:false,onChange:syncSliders});
  v.st.arYaw=-20*Math.PI/180;
  AR={v,p,shots:[]};
  setTimeout(()=>{const h=$('#arHint'); if(h) h.style.opacity=0;},4500);
}
function syncSliders(){ if(!AR) return; $('#arScale').value=Math.round(AR.v.st.scale*100); let d=AR.v.st.arYaw*180/Math.PI; d=((d+180)%360+360)%360-180; $('#arRot').value=Math.round(d); }
async function startLive(){
  if(!AR) return;
  try{
    const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
    stopLive(); if(!AR){ st.getTracks().forEach(t=>t.stop()); return; }
    const v=document.createElement('video'); v.id='arVid'; v.playsInline=true; v.muted=true; v.autoplay=true; v.srcObject=st;
    $('#arStage').insertBefore(v,$('#arStage').firstChild); $('#arBg').hidden=true; AR.stream=st; await v.play().catch(()=>{});
    $('#arSrc').textContent='دوربین زنده: گوشی را ثابت نگه دار و مدل را روی زمین بکش'; const b=$('#arLive'); if(b) b.hidden=true;
  }catch(e){ toast('دسترسی به دوربین داده نشد. از «عکس از اتاقم» استفاده کن.'); }
}
function stopLive(){ if(AR?.stream){ AR.stream.getTracks().forEach(t=>t.stop()); AR.stream=null; } const v=$('#arVid'); if(v) v.remove(); const i=$('#arBg'); if(i) i.hidden=false; const b=$('#arLive'); if(b) b.hidden=false; }
function closeAR(){ if(!AR) return; stopLive(); AR.v.dispose(); AR.shots.forEach(s=>URL.revokeObjectURL(s.url)); AR=null; $('#arLayer').innerHTML=''; document.body.style.overflow=''; }
function setRoom(file){ if(!file) return; stopLive(); $('#arBg').src=URL.createObjectURL(file); $('#arSrc').textContent='عکس اتاق خودت'; toast('عکس اتاق گذاشته شد. حالا مدل را جابه‌جا کن'); }
async function takeShot(){
  if(!AR) return;
  const stage=$('#arStage'); const fl=document.createElement('div'); fl.className='flash'; stage.appendChild(fl); setTimeout(()=>fl.remove(),500);
  const img=$('#arBg'); const W=stage.clientWidth,H=stage.clientHeight,dpr=Math.min(devicePixelRatio,2);
  const c=document.createElement('canvas'); c.width=Math.round(W*dpr); c.height=Math.round(H*dpr); const x=c.getContext('2d');
  const src=AR.stream?$('#arVid'):img; if(!AR.stream){ try{await img.decode();}catch(e){} }
  const sw=src.videoWidth||src.naturalWidth, sh=src.videoHeight||src.naturalHeight;
  const s=Math.max(c.width/sw,c.height/sh), iw=sw*s, ih=sh*s;
  x.drawImage(src,(c.width-iw)/2,(c.height-ih)/2,iw,ih);
  AR.v.render(); x.drawImage(AR.v.renderer.domElement,0,0,c.width,c.height);
  const pad=16*dpr; x.font=`800 ${15*dpr}px Vazirmatn, Tahoma, sans-serif`; x.direction='rtl'; x.textAlign='right';
  const label=`ماجوکیت · ${AR.p.raw.name}`; const tw=x.measureText(label).width;
  x.fillStyle='rgba(0,0,0,.45)'; x.beginPath(); const bx=c.width-pad-tw-24*dpr, by=c.height-pad-34*dpr;
  if(x.roundRect) x.roundRect(bx,by,tw+24*dpr,34*dpr,17*dpr); else x.rect(bx,by,tw+24*dpr,34*dpr); x.fill();
  x.fillStyle='#fff'; x.fillText(label,c.width-pad-12*dpr,c.height-pad-11*dpr);
  c.toBlob(b=>{ if(!b||!AR) return; const url=URL.createObjectURL(b); AR.shots.unshift({b,url}); const th=$('#arThumb'); th.hidden=false; th.style.backgroundImage=`url(${url})`; th.animate([{transform:'scale(1.6)'},{transform:'scale(1)'}],{duration:400,easing:'cubic-bezier(.34,1.56,.64,1)'}); showShot(0); },'image/jpeg',.92);
}
function canShareFile(b){ try{ return !!(navigator.canShare&&navigator.canShare({files:[new File([b],'x.jpg',{type:'image/jpeg'})]})); }catch(e){ return false; } }
function showShot(i){
  const s=AR.shots[i]; const L=document.createElement('div'); L.className='shot'; L.id='shotView';
  L.innerHTML=`<div class="card"><img src="${s.url}" alt="عکس ${AR.p.name} در اتاق">
    <div class="row">${DL?`<button class="btn olive" id="shotSave">ذخیره‌ی عکس</button>`:''}<button class="btn soft" id="shotBack">عکس دیگر</button></div>${canShareFile(s.b)?'<button class="btn ghost" id="shotShare" style="background:#fff;color:#000">اشتراک‌گذاری</button>':''}
    ${DL?'':'<p>برای ذخیره، روی عکس طولانی لمس کنید یا راست‌کلیک کنید.</p>'}</div>`;
  $('#arLayer').appendChild(L);
  L.querySelector('#shotBack').onclick=()=>L.remove();
  const sh=L.querySelector('#shotShare'); if(sh) sh.onclick=async()=>{ try{ await navigator.share({files:[new File([s.b],`majookit-${AR.p.id}.jpg`,{type:'image/jpeg'})],title:AR.p.raw.name}); }catch(e){} };
  const sv=L.querySelector('#shotSave'); if(sv) sv.onclick=async()=>{ try{ await DL.save({filename:`majookit-${AR.p.id}-${Date.now()}.jpg`,data:s.b}); toast('عکس ذخیره شد'); }catch(e){ if(e?.code!=='declined') toast('ذخیره ممکن نشد. روی عکس طولانی لمس کنید.'); } };
}

/* ===== router ===== */
const VIEWS={home:vHome,products:vProducts,how:vHow,guide:vGuide,faq:vFaq,about:vAbout,blog:vBlog,custom:vCustom,contact:vContact};
function route(){
  closeAR(); killViewers(); if(stickyIO){stickyIO.disconnect();stickyIO=null;} $('#sbuy').hidden=true;
  const h=(location.hash||'#home').slice(1);
  let html,key=h,pid=null;
  if(/^p\d+$/.test(h)&&byId(+h.slice(1))){pid=+h.slice(1); if(S.galFor!==pid){const pp=byId(pid); S.gal=pp.images.length?'photo':(HAS3D?'3d':'img'); S.img=0; S.qty=1; S.galFor=pid;} html=vProduct(pid); key='products';}
  else {if(!VIEWS[h]) key='home'; html=VIEWS[key]();}
  $('#view').innerHTML=html;
  if(key==='products'&&!pid) fillProducts();
  if(key==='home') mountStage('heroStage','hero',{hero:true,auto:true,yaw:-.45,pitch:.22});
  if(key==='how') mountStage('howStage','cube',{auto:true});
  if(key==='custom') mountStage('customStage','stair',{auto:true});
  if(pid){ mountGallery(byId(pid)); setupSticky(byId(pid)); }
  document.querySelectorAll('.mainnav a').forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')==='#'+key?'page':'false'));
  document.querySelectorAll('.tabbar a').forEach(a=>a.setAttribute('aria-current',a.dataset.tab===key?'page':'false'));
  closeLayer(); counts();
  if(key==='guide'&&S.hl){const m=$('#m'+S.hl); if(m) setTimeout(()=>m.scrollIntoView({block:'center'}),30);} else window.scrollTo(0,0);
  updateWa(h);
}
let stickyIO=null;
function setupSticky(p){
  const bar=$('#sbuy'); if(!p.inStock){bar.hidden=true;return;} bar.innerHTML=`<div class="sb-t"><b>${p.name}</b><span class="price">${toman(p.price)}</span></div><button class="btn olive" data-add="${p.id}">افزودن به سبد</button>`;
  stickyIO=new IntersectionObserver(([e])=>{bar.hidden=e.isIntersecting||e.boundingClientRect.top>0;}); stickyIO.observe($('#buyMain'));
}
function updateWa(h=location.hash.slice(1)){
  let t='سلام ماجوکیت، یک سؤال داشتم.';
  if(/^p\d+$/.test(h)&&byId(+h.slice(1))) t=`سلام ماجوکیت، درباره‌ی «${byId(+h.slice(1)).raw.name}» سؤال دارم.`;
  else if(cartN()) t=orderText();
  $('#waFab').href=waLink(t); $('#waTab').href=waLink(t);
}

/* ===== overlays ===== */
function closeLayer(){$('#layer').innerHTML=''; if(!AR) document.body.style.overflow='';}
function openMenu(){
  $('#layer').innerHTML=`<div class="scrim" data-close></div><div class="sheet menu" role="dialog" aria-modal="true" aria-label="منو">
   <button class="iconbtn x" data-close aria-label="بستن">✕</button>
   <div style="font-weight:900;font-size:18px;margin-bottom:8px">منو</div>
   <a href="#home">خانه</a>
   <a href="#products" data-cat="all">محصولات <small>همه‌ی کیت‌ها</small></a>
   <div class="sub">${Object.entries(CATS).map(([k,n])=>`<a href="#products" data-cat="${k}">${n}</a>`).join('')}${Object.entries(SPACES).map(([k,n])=>`<a href="#products" data-space="${k}">${n} <small>بر اساس فضا</small></a>`).join('')}</div>
   <a href="#how">چطور کار می‌کند</a><a href="#guide">راهنمای مونتاژ</a>
   <a href="#custom">سفارشی‌سازی <span class="soon">به‌زودی</span></a>
   <a href="#about">درباره‌ی ماجوکیت</a><a href="#blog">بلاگ و ایده‌ها</a><a href="#faq">سؤالات متداول</a><a href="#contact">تماس و سفارش</a>
  </div>`; document.body.style.overflow='hidden';
}
function exitPopup(){
  if($('#layer').innerHTML||AR) return;
  $('#layer').innerHTML=`<div class="scrim" data-close></div><div class="sheet" role="dialog" aria-modal="true" aria-label="راهنمای رایگان">
   <button class="iconbtn x" data-close aria-label="بستن">✕</button>
   <div style="display:grid;gap:10px">
    <div style="background:var(--sand);border-radius:14px;aspect-ratio:2/1;max-width:100%">${partsArt(P[0]||{parts:6})}</div>
    <span class="soon" style="justify-self:start">رایگان</span>
    <h2 style="font-size:22px;font-weight:900">راهنمای رایگان مونتاژ MDF</h2>
    <p style="color:var(--muted);font-size:14px">۱۲ صفحه: ابزار درست، ترتیب بستن پیچ‌ها، و هفت اشتباهی که کیت را خراب می‌کند. در واتس‌اپ برایت می‌فرستیم.</p>
    <a class="btn olive block" href="${waLink('سلام، راهنمای رایگان مونتاژ MDF را می‌خواهم.')}" target="_blank" rel="noopener" data-close data-lead="guide">دریافت در واتس‌اپ</a>
    <button class="link" data-close style="min-height:40px">نه، ممنون</button>
   </div></div>`;
}
let exitShown=false; try{exitShown=sessionStorage.getItem('majoo-exit')==='1'}catch(e){}
document.addEventListener('mouseout',e=>{ if(exitShown||e.relatedTarget||e.clientY>8) return; exitShown=true; try{sessionStorage.setItem('majoo-exit','1')}catch(err){} exitPopup(); });

/* ===== micro-interactions ===== */
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn'); if(!b||RM) return; const r=b.getBoundingClientRect(), s=Math.max(r.width,r.height);
  const sp=document.createElement('span'); sp.className='rip'; sp.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`; b.appendChild(sp); setTimeout(()=>sp.remove(),650);});
document.addEventListener('pointermove',e=>{ if(RM||e.pointerType!=='mouse') return; const c=e.target.closest('[data-tilt]');
  document.querySelectorAll('[data-tilt].tilting').forEach(o=>{if(o!==c){o.classList.remove('tilting');o.style.setProperty('--rx','0deg');o.style.setProperty('--ry','0deg');}});
  if(!c) return; const r=c.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; c.classList.add('tilting'); c.style.setProperty('--ry',`${x*7}deg`); c.style.setProperty('--rx',`${-y*7}deg`);});
function flyToCart(fromEl,p){
  if(RM||!fromEl) return; const target=innerWidth>=860?$('#cartIcon'):$('.tabbar [data-tab="contact"]'); if(!target) return;
  const a=fromEl.getBoundingClientRect(), b=target.getBoundingClientRect();
  const f=document.createElement('div'); f.className='flyer'; f.innerHTML=art(p.type); f.style.left=(a.left+a.width/2-35)+'px'; f.style.top=(a.top+a.height/2-28)+'px'; document.body.appendChild(f);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.transform=`translate(${b.left+b.width/2-(a.left+a.width/2)}px,${b.top+b.height/2-(a.top+a.height/2)}px) scale(.25) rotate(-20deg)`; f.style.opacity='.4';}));
  setTimeout(()=>f.remove(),720);
}
const viewerIn=host=>[...VIEWERS].find(v=>v.host===host);

/* ===== events ===== */
document.addEventListener('click',e=>{
  const t=e.target.closest('a,button'); if(!t) return;
  if(t.dataset.ar){ e.preventDefault(); openAR(+t.dataset.ar); return; }
  if(t.hasAttribute('data-arclose')){ closeAR(); return; }
  if(t.dataset.arrot&&AR){ AR.v.st.arYaw+=(+t.dataset.arrot)*Math.PI/8; syncSliders(); return; }
  if(t.id==='arShutter'){ takeShot(); return; }
  if(t.id==='arLive'){ startLive(); return; }
  if(t.id==='sendOrder'){ submitOrder(t); return; }
  if(t.dataset.img){ S.img+=(+t.dataset.img); $('#gstage').innerHTML=galleryBody(byId(+location.hash.slice(2))); syncThumbs(); return; }
  if(t.dataset.lead){ api('/api/leads',{kind:t.dataset.lead}).catch(()=>{}); }
  if(t.id==='arThumb'&&AR&&AR.shots.length){ showShot(0); return; }
  if(t.hasAttribute('data-explode')){ const on=t.getAttribute('aria-pressed')!=='true'; t.setAttribute('aria-pressed',on); const host=t.closest('.stage3d'); const v=viewerIn(host); if(v){v.explode(on); host.dispatchEvent(new Event('interact'));} t.querySelector('span').textContent=on?'جمع کردن':'نمای انفجاری'; return; }
  if(t.hasAttribute('data-spin')){ const on=t.getAttribute('aria-pressed')!=='true'; t.setAttribute('aria-pressed',on); const v=viewerIn(t.closest('.stage3d')); if(v) v.st.auto=on; return; }
  if(t.dataset.cat){ S.f={cat:t.dataset.cat,space:'all',size:'all',exp:'all',diff:'all'}; if(location.hash==='#products'){fillProducts(); closeLayer();} }
  if(t.dataset.space){ S.f={cat:'all',space:t.dataset.space,size:'all',exp:'all',diff:'all'}; if(location.hash==='#products') route(); }
  if(t.dataset.guide){ S.hl=+t.dataset.guide; }
  if(t.getAttribute('href')==='#guide'&&!t.dataset.guide) S.hl=null;
  if(t.dataset.fcat){ S.f.cat=t.dataset.fcat; fillProducts(); return; }
  if(t.id==='fclear'){ S.f=fresh(); S.q=''; $('#q').value=''; fillProducts(); return; }
  if(t.dataset.unf){ S.f[t.dataset.unf]='all'; fillProducts(); return; }
  if(t.id==='openFilters'){ openFilters(); return; }
  if(t.dataset.gal){ S.gal=t.dataset.gal; if(t.dataset.set!=null) S.img=+t.dataset.set; const p=byId(+location.hash.slice(2)); killViewers(); const gs=$('#gstage'); gs.innerHTML=galleryBody(p); gs.animate([{opacity:.3,transform:'scale(.98)'},{opacity:1,transform:'none'}],{duration:300,easing:'ease-out'}); syncThumbs(); mountGallery(p); if(t.hasAttribute('data-close')) setTimeout(closeLayer,0); return; }
  if(t.hasAttribute('data-allmedia')){ openAllMedia(byId(+location.hash.slice(2))); return; }
  if(t.dataset.fav){ const id=+t.dataset.fav, i=FAV.indexOf(id); if(i<0) FAV.push(id); else FAV.splice(i,1); saveFav(); t.setAttribute('aria-pressed',i<0); toast(i<0?'به علاقه‌مندی‌ها اضافه شد':'از علاقه‌مندی‌ها برداشته شد'); return; }
  if(t.getAttribute('href')==='#measure'){ e.preventDefault(); const d=$('#measure'); d.open=true; d.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'}); return; }
  if(t.dataset.pq){ S.qty=Math.max(1,S.qty+(+t.dataset.pq)); const o=$('#pq'); o.textContent=fa(S.qty); o.classList.remove('roll'); void o.offsetWidth; o.classList.add('roll'); return; }
  if(t.dataset.add){ const id=+t.dataset.add; const q=t.hasAttribute('data-one')?1:S.qty; S.cart[id]=(S.cart[id]||0)+q; save(); flyToCart(t.closest('.pcard')?.querySelector('.ph')||$('#gstage')||t,byId(id)); setTimeout(()=>counts(true),RM?0:650); updateWa(); toast(`«${byId(id).raw.name}» به سبد اضافه شد`); if(t.classList.contains('pbag')){ const sp=t.querySelector('span'); t.classList.add('done'); sp.textContent='✓ به سبد اضافه شد'; setTimeout(()=>{t.classList.remove('done'); sp.textContent='افزودن به سبد';},1700); } return; }
  if(t.dataset.cq){ const id=+t.dataset.cq; S.cart[id]=Math.max(0,(S.cart[id]||0)+(+t.dataset.d)); if(!S.cart[id]) delete S.cart[id]; save(); const keep={name:$('#oname')?.value,phone:$('#ophone')?.value,city:$('#ocity')?.value,note:$('#onote')?.value}; route(); if(keep.name!=null){for(const k of ['name','phone','city','note']) $('#o'+k).value=keep[k]||'';} return; }
  if(t.id==='menuBtn'){ openMenu(); return; }
  if(t.id==='copyNum'){ navigator.clipboard?.writeText(waShow()).then(()=>toast('شماره کپی شد'),()=>toast('شماره را انتخاب و کپی کن')); return; }
  if(t.hasAttribute('data-close')&&t.tagName==='BUTTON'){ closeLayer(); return; }
  if(t.hasAttribute('data-close')) setTimeout(closeLayer,0);
});
document.addEventListener('click',e=>{ if(e.target.classList?.contains('scrim')) closeLayer(); });
document.addEventListener('change',e=>{
  const f=e.target.dataset?.f; if(f){ S.f[f]=e.target.value; fillProducts(); return; }
  if(e.target.id==='arCam'||e.target.id==='arGal'){ setRoom(e.target.files[0]); e.target.value=''; return; }
  if(e.target.id==='arPick'&&AR){ const p=byId(+e.target.value); AR.p=p; AR.v.setModel(p.type); $('#arName').textContent=p.raw.name; }
});
document.addEventListener('input',e=>{
  if(e.target.id==='q'){ S.q=e.target.value; if(location.hash!=='#products'){ location.hash='products'; } else fillProducts(); return; }
  if(['oname','ocity','onote'].includes(e.target.id)) syncOrder();
  if(AR&&e.target.id==='arScale') AR.v.st.scale=e.target.value/100;
  if(AR&&e.target.id==='arRot') AR.v.st.arYaw=e.target.value*Math.PI/180;
});
function syncOrder(){}
document.addEventListener('submit',e=>{ e.preventDefault(); if(e.target.id==='notify'){ api('/api/leads',{kind:'custom-notify',phone:toLatin($('#nphone').value)}).then(()=>{toast('ثبت شد. وقتی آماده شد خبرت می‌کنیم.'); e.target.reset();},err=>toast(err.message)); } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if($('#shotView')) $('#shotView').remove(); else if(AR) closeAR(); else closeLayer(); } });
window.addEventListener('hashchange',route);
/* ===== photo zoom ===== */
document.addEventListener('click',e=>{ const ph=e.target.closest('.photos'); if(!ph||e.target.closest('button')) return; ph.classList.toggle('zoom'); const im=ph.querySelector('img'); if(!ph.classList.contains('zoom')) im.style.transformOrigin=''; else { const r=ph.getBoundingClientRect(); im.style.transformOrigin=`${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`; } });
document.addEventListener('pointermove',e=>{ const ph=e.target.closest?.('.photos.zoom'); if(!ph||e.pointerType==='touch') return; const r=ph.getBoundingClientRect(); ph.querySelector('img').style.transformOrigin=`${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`; });


(async function boot(){
  try{
    const [prods,set]=await Promise.all([api('/api/products'),api('/api/settings')]);
    P=prods.map(normalize); Object.assign(SET,set);
  }catch(e){
    $('#view').innerHTML=`<div class="wrap"><section><div class="empty">${esc(e.message)}. صفحه را دوباره بارگذاری کنید.</div></section></div>`; return;
  }
  for(const id of Object.keys(S.cart)) if(!byId(+id)) delete S.cart[id];
  if(SET.announcement){ const a=$('#announce'); a.textContent=SET.announcement; a.hidden=false; }
  route();
})();
