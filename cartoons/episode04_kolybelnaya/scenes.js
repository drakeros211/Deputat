// Движок кадров серии 1. renderFrame(t) -> SVG-строка 1080x1920.
const W = 1080, H = 1920;
const TL = window.TL, A = window.A, FPS = TL.fps;

// ------------------------------------------------------------ утилиты
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k = clamp(k), k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const easeBack = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const wob = (t, s = 0) => Math.sin(t * 1.7 + s) * .5 + Math.sin(t * 3.1 + s * 2) * .3 + Math.sin(t * 7.3 + s * 3) * .2;
let uid = 0; const id = p => `${p}${uid++}`;

function sceneAt_old(t) { for (const s of TL.scenes) if (t >= s.start && t < s.end) return s; return TL.scenes[TL.scenes.length - 1]; }
function shotAt(s, t) { let cur = s.shots[0] || null; for (const sh of s.shots) if (t >= sh.start) cur = sh; return cur; }
function linesOf(sid) { return TL.lines.filter(l => l.scene === sid); }

// ------------------------------------------------------------ персонажи
function blinkAt(t, seed) { const p = 3.1 + seed; const ph = (t + seed * 1.3) % p; return ph < 0.12; }
function mouthAt(who, f) { const m = TL['mouth_' + who]; return m ? (m[f] || 0) : 0; }

function char(p, o) {
  // p: 'T' | 'L'; o: {x,y,s,emo,t,f,talk,headRot,back,rot}
  const s = o.s || 1;
  const tr = `translate(${o.x} ${o.y}) rotate(${o.rot || 0}) scale(${s}) translate(-512 -1030)`;
  if (o.back) return `<g transform="${tr}">${A[p + '_back']}</g>`;
  const breathe = 1 + Math.sin(o.t * 2.2 + (p === 'L' ? 1 : 0)) * 0.008;
  const m = o.mouth ?? (o.talk === false ? 0 : mouthAt(p, o.f));
  const hr = (o.headRot || 0) + wob(o.t * .8, p === 'L' ? 3 : 0) * 1.5 + (m ? Math.sin(o.t * 9) * 1.2 : 0);
  const emo = o.emo || (p === 'T' ? 'neutral' : 'grin');
  const blink = o.blink ?? (blinkAt(o.t, p === 'L' ? 0.7 : 0) && emo !== 'stare' && emo !== 'terrified');
  return `<g transform="${tr}"><g transform="translate(512 1030) scale(1 ${breathe}) translate(-512 -1030)">${A[p + '_torso']}</g>
    <g transform="rotate(${hr} 512 720) translate(0 ${(1 - breathe) * 600})">${A[p + '_base']}${A[`${p}_eyes_${emo}`]}${A[`${p}_mouth_${emo}`][m]}${blink ? A[p + '_blink'] : ''}</g></g>`;
}

function nurse(x, y, s, o = {}) {
  const sway = Math.sin((o.t || 0) * 1.3) * 2;
  return `<g transform="translate(${x} ${y}) rotate(${sway + (o.tilt || 0)}) scale(${s}) translate(-300 -1600)" opacity="${o.op ?? 1}">${o.reach ? A.N_reach : A.N_full}</g>`;
}

// ------------------------------------------------------------ эффекты
function spotlight(cx, cy, r, dark = .93, col = '#000') {
  const g = id('sp');
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">
    <stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset=".55" stop-color="${col}" stop-opacity="${dark * .35}"/>
    <stop offset="1" stop-color="${col}" stop-opacity="${dark}"/></radialGradient></defs>
    <rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#${g})"/>`;
}
function warmBeam(cx, cy, r, op = .18) {
  const g = id('wb');
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="#fff1c9" stop-opacity="${op}"/><stop offset="1" stop-color="#fff1c9" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>`;
}
function dust(t, cx, cy, r, n = 26) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i) * 6.28, d = Math.sqrt(hash(i + 50)) * r;
    const x = cx + Math.cos(a) * d + Math.sin(t * .4 + i) * 30, y = cy + Math.sin(a) * d - ((t * 18 + i * 37) % 120) + 60;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${1.5 + hash(i + 9) * 3}" fill="#fff" opacity="${(.15 + hash(i + 3) * .35).toFixed(2)}"/>`;
  }
  return s;
}
function fog(t, y, op = .16) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const g = id('fg'); const x = ((t * (20 + i * 8) + i * 400) % 1800) - 400;
    s += `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#c9d2e3" stop-opacity="${op}"/><stop offset="1" stop-color="#c9d2e3" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${x}" cy="${y + Math.sin(i * 2) * 120}" rx="${500 + i * 60}" ry="${140 + i * 20}" fill="url(#${g})"/>`;
  }
  return s;
}
function staticNoise(f, op = 1) {
  const g = id('st');
  return `<defs><filter id="${g}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85 0.35" numOctaves="1" seed="${f % 97}"/>
    <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="1 1"/></feComponentTransfer></filter></defs>
    <rect width="${W}" height="${H}" filter="url(#${g})" opacity="${op}"/>`;
}
function grain(f, op = .09) {
  const g = id('gr');
  return `<defs><filter id="${g}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="${f % 13}"/><feColorMatrix type="saturate" values="0"/></filter></defs>
    <rect width="${W}" height="${H}" filter="url(#${g})" opacity="${op}" style="mix-blend-mode:overlay"/>`;
}
function vignette(op = .7) {
  return `<defs><radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${op}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vg)"/>`;
}
function glitch(f, amt = 1) {
  // полосы-сдвиги кадра + цветные полосы
  let s = '';
  const n = Math.round(3 + amt * 6);
  for (let i = 0; i < n; i++) {
    const y = hash(f * 7 + i) * H, h = 20 + hash(f * 3 + i) * 140 * amt, dx = (hash(f + i * 11) - .5) * 160 * amt;
    const c = id('gc');
    s += `<clipPath id="${c}"><rect x="0" y="${y}" width="${W}" height="${h}"/></clipPath><use href="#scene" clip-path="url(#${c})" transform="translate(${dx} 0)"/>`;
    if (hash(f * 5 + i) > .6) s += `<rect x="0" y="${y}" width="${W}" height="${h * .3}" fill="${hash(i + f) > .5 ? '#ff2a4f' : '#2af0ff'}" opacity="${.25 * amt}" style="mix-blend-mode:screen"/>`;
  }
  s += `<use href="#scene" transform="translate(${8 * amt} 0)" opacity="${.35 * amt}" filter="url(#redOnly)" style="mix-blend-mode:screen"/>`;
  return s;
}

function rec(t, clock, extra = '') {
  const on = Math.floor(t * 1.5) % 2 === 0;
  return `<g style="font-family:'JetBrains Mono'" font-weight="800">
    <rect x="70" y="100" width="${extra ? 470 : 330}" height="74" rx="10" fill="#111" fill-opacity=".75" stroke="#e7b545" stroke-width="3"/>
    <circle cx="106" cy="137" r="13" fill="#ff2f3f" opacity="${on ? 1 : .25}"/>
    <text x="132" y="150" font-size="38" fill="#ffd47a">REC ${clock}</text>
    ${extra ? `<text x="340" y="148" font-size="24" fill="#ffd47a">${extra}</text>` : ''}</g>`;
}
function cam(content, cx, cy, z, dx = 0, dy = 0, rot = 0) {
  return `<g transform="translate(${540 + dx} ${960 + dy}) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})">${content}</g>`;
}
// ============================================================ «Палата 33» v2 — монтаж по шотам
const SC = {}; TL.scenes.forEach(s => SC[s.id] = s);
const SHOTS = TL.shots.slice().sort((a, b) => a.start - b.start);
const firstShot = n => (SHOTS.find(s => s.name === n) || { start: 0 }).start;
const lineAt = (sid, i) => TL.lines.filter(l => l.scene === sid)[i];
const RUB = "font-family:Rubik", CAV = "font-family:Caveat", MONO = "font-family:'JetBrains Mono'";

function shotAtT(t) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (SHOTS[k].start <= t) i = k;
  const s = SHOTS[i], nx = SHOTS[i + 1];
  const end = nx ? nx.start : TL.cut;
  return { s, i, lt: t - s.start, d: end - s.start, k: clamp((t - s.start) / Math.max(.01, end - s.start)) };
}
function sceneOf(t) { for (const s of TL.scenes) if (t >= s.start && t < s.end) return s.id; return 'final'; }

// плавный «дрейф» камеры по шоту
function drift(c, content, cx = 540, cy = 960, z0 = 1.0, z1 = 1.09) {
  const dir = c.i % 2 ? 1 : -1;
  const k = ease(c.k);
  return cam(content, cx + dir * lerp(-18, 18, k), cy + lerp(10, -10, k), lerp(z0, z1, k));
}
function punch(c, at = 0, amt = .06) { const k = (c.lt - at) / .18; return k > 0 && k < 1 ? amt * Math.sin(k * Math.PI) : 0; }
const sepia = c => `<g filter="url(#sepia)">${c}</g>`;
const nv = c => `<g filter="url(#nightvision)">${c}</g>`;
const dark = (op) => `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="#000" opacity="${op}"/>`;
const scratches = f => { let s = ''; for (let i = 0; i < 4; i++) { const x = hash(f * 3 + i) * W; if (hash(f + i * 7) > .5) s += `<line x1="${x}" y1="0" x2="${x + (hash(i + f) - .5) * 30}" y2="${H}" stroke="#f3e6c8" stroke-width="${1 + hash(i) * 2}" opacity=".35"/>`; } return s; };

// ------------------------------------------------------------ элементы
function newspaper(f) {
  let cols = '';
  for (let c = 0; c < 2; c++) for (let r = 0; r < 14; r++) cols += `<rect x="${110 + c * 440}" y="${1150 + r * 34}" width="${370 - (r % 5 === 4 ? 140 : 0)}" height="12" fill="#6e6250" opacity=".55"/>`;
  return `<rect width="${W}" height="${H}" fill="#2a1d14"/>
   <g transform="rotate(-3 540 960)">
    <rect x="60" y="180" width="960" height="1560" fill="#e9dfc6"/>
    <rect x="60" y="180" width="960" height="1560" fill="#b08a50" opacity=".18"/>
    <text x="540" y="290" text-anchor="middle" font-size="78" style="${RUB}" font-weight="900" fill="#2b2418">ВЕЧЕРНИЙ ГОРОД</text>
    <line x1="100" y1="320" x2="980" y2="320" stroke="#2b2418" stroke-width="5"/>
    <text x="100" y="360" font-size="28" style="${RUB}" font-weight="800" fill="#2b2418">№ 214 · 18 НОЯБРЯ 1998</text>
    <text x="540" y="470" text-anchor="middle" font-size="74" style="${RUB}" font-weight="900" fill="#1d1810">ПРОПАЛИ ШЕСТЕРО</text>
    <text x="540" y="555" text-anchor="middle" font-size="74" style="${RUB}" font-weight="900" fill="#8b1f1f">ДЕТЕЙ</text>
    <text x="540" y="615" text-anchor="middle" font-size="34" style="${RUB}" font-weight="800" fill="#3b3226">Трагедия в детской больнице «Берёзка»</text>
    <g transform="translate(110 660)"><rect width="520" height="430" fill="#222"/>
      <clipPath id="npc"><rect width="520" height="430"/></clipPath><g clip-path="url(#npc)" filter="url(#bw)"><g transform="translate(-20 -260) scale(.52)">${A.BG_hospital}</g></g>
      <rect width="520" height="430" fill="none" stroke="#2b2418" stroke-width="4"/></g>
    <text x="110" y="1125" font-size="24" style="${RUB}" font-weight="800" fill="#4a3f30">Палата № 33, третий этаж</text>
    <g transform="translate(670 660)"><rect width="300" height="430" fill="#2a2a2a"/>
      <g filter="url(#bw)"><g transform="translate(40 30) scale(.4)">${A.N_full}</g></g>
      <rect width="300" height="430" fill="none" stroke="#2b2418" stroke-width="4"/></g>
    <text x="670" y="1125" font-size="24" style="${RUB}" font-weight="800" fill="#4a3f30">Медсестра В. Петрова</text>
    ${cols}
    <rect x="60" y="180" width="960" height="1560" fill="none" stroke="#c7b48e" stroke-width="3"/>
   </g>`;
}

const RULES = ['В 03:33 — закрой глаза.', 'Зовут по имени — не отвечай.', 'Не смотри на неё через камеру.', 'Уходи один. Даже если друг остался.'];
function rulesWall(reveal, hl = -1, sig = 0) {
  let s = `<rect width="${W}" height="${H}" fill="#9fa196"/><rect y="1080" width="${W}" height="840" fill="#3d6155"/><rect y="1070" width="${W}" height="14" fill="#25403a"/>
    <path d="M60 200 q80 -40 160 10 q-40 70 -140 40z M900 1500 q60 -50 120 0 q-30 50 -110 30z M820 300 l40 90 l-25 60" fill="#b9bbb0" stroke="#7d7f74" stroke-width="3"/>
    <text x="540" y="330" text-anchor="middle" font-size="120" style="${CAV}" font-weight="700" fill="#151515" transform="rotate(-2 540 330)">ПРАВИЛА</text>
    <path d="M300 360 q240 20 480 -6" stroke="#151515" stroke-width="7" fill="none"/>`;
  RULES.forEach((r, i) => {
    const k = clamp(reveal - i);
    if (k <= 0) return;
    const y = 520 + i * 210, cid = `rl${i}`;
    const col = i === hl ? '#a3141c' : '#151515';
    s += `<clipPath id="${cid}"><rect x="0" y="${y - 120}" width="${80 + k * 1000}" height="200"/></clipPath>
      <g clip-path="url(#${cid})" transform="rotate(${(i % 2 ? 1.5 : -1.2)} 540 ${y})"><text x="70" y="${y}" font-size="${r.length > 28 ? 66 : 76}" style="${CAV}" font-weight="700" fill="${col}">${i + 1}. ${r}</text></g>`;
  });
  if (sig > 0) s += `<g opacity="${clamp(sig)}"><text x="1010" y="1430" text-anchor="end" font-size="80" style="${CAV}" font-weight="700" fill="#151515" transform="rotate(-4 900 1430)">Дима, 9 «Б»</text></g>`;
  if (sig > 1) s += `<ellipse cx="820" cy="1410" rx="${260 * clamp(sig - 1)}" ry="80" fill="none" stroke="#c4121c" stroke-width="9" transform="rotate(-4 820 1410)"/>`;
  return s;
}

function journal(showLast, glow = 0) {
  const rows = [['01:00', 'обход. все спят'], ['02:00', 'обход. все спят'], ['03:00', 'обход. все спят']];
  let s = `<rect width="${W}" height="${H}" fill="#24180f"/>
    <g transform="rotate(4 540 960)"><rect x="70" y="330" width="940" height="1280" rx="16" fill="#efe9d8"/>
    <rect x="70" y="330" width="940" height="1280" rx="16" fill="#a6844a" opacity=".15"/>
    <text x="540" y="440" text-anchor="middle" font-size="60" style="${RUB}" font-weight="900" fill="#3b3326">ЖУРНАЛ ДЕЖУРСТВ</text>
    <text x="540" y="500" text-anchor="middle" font-size="36" style="${RUB}" font-weight="800" fill="#6b5f4b">палата № 33</text>`;
  for (let i = 0; i < 14; i++) s += `<line x1="110" y1="${580 + i * 70}" x2="970" y2="${580 + i * 70}" stroke="#a9b7cf" stroke-width="3"/>`;
  rows.forEach((r, i) => s += `<text x="130" y="${640 + i * 140}" font-size="66" style="${CAV}" font-weight="700" fill="#24324d">${r[0]} — ${r[1]}</text>`);
  if (showLast > 0) {
    s += `<clipPath id="jl"><rect x="100" y="980" width="${60 + showLast * 900}" height="300"/></clipPath>
      <g clip-path="url(#jl)"><text x="130" y="1060" font-size="70" style="${CAV}" font-weight="700" fill="#8e1010">03:33 — все спят.</text>
      <text x="130" y="1190" font-size="86" style="${CAV}" font-weight="700" fill="#8e1010">Кроме двоих.</text></g>`;
    if (glow) s += `<rect x="110" y="1110" width="560" height="110" fill="#ff2a2a" opacity="${glow * .15}"/>`;
  }
  return s + '</g>';
}

function eyelids(t, f, shadow = 0, open = 0) {
  const pulse = .5 + .5 * Math.pow(Math.max(0, Math.sin(t * 7.2)), 8);
  let s = `<defs><radialGradient id="lid" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#5a0f12" stop-opacity="${.55 + pulse * .25}"/><stop offset="1" stop-color="#0a0102"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#lid)"/>`;
  for (let i = 0; i < 7; i++) s += `<path d="M${hash(i) * W} ${hash(i + 5) * H} q${80 - hash(i + 2) * 160} ${120} ${160 - hash(i + 3) * 320} ${260}" stroke="#2a0306" stroke-width="5" fill="none" opacity=".5"/>`;
  if (shadow) s += `<g opacity="${.1 + shadow * .2 + (hash(f) > .92 ? .15 : 0)}" filter="url(#mblur)">${nurse(540 + Math.sin(t * .6) * 120, 1500 + shadow * 500, .7 + shadow * .7, { t, tilt: Math.sin(t * .9) * 6 })}</g>`;
  else s += `<ellipse cx="${540 + Math.sin(t * .7) * 140}" cy="900" rx="260" ry="620" fill="#000" opacity=".3"/>`;
  if (open) {
    const h = (1 - open) * H / 2;
    s = `<rect width="${W}" height="${h}" fill="#000"/><rect y="${H - h}" width="${W}" height="${h}" fill="#000"/>`;
  }
  return s;
}

function chat(t, lt) {
  const typing = lt > .3 && lt < 1.0;
  const shown = lt > 1.0;
  const b = easeBack((lt - 1.0) / .3);
  return `<rect width="${W}" height="${H}" fill="#0b0d12"/>
    <rect width="${W}" height="220" fill="#151922"/>
    <text x="70" y="90" font-size="38" style="${RUB}" font-weight="800" fill="#fff">03:41</text>
    <circle cx="190" cy="160" r="44" fill="#f2c230"/><text x="190" y="178" text-anchor="middle" font-size="48" style="${RUB}" font-weight="900" fill="#d63a35">Л</text>
    <text x="260" y="152" font-size="44" style="${RUB}" font-weight="900" fill="#fff">Лёха</text>
    <text x="260" y="196" font-size="30" style="${RUB}" font-weight="800" fill="#4cd964">в сети</text>
    <g transform="translate(0 0)"><rect x="560" y="360" width="440" height="110" rx="40" fill="#2d6cdf"/><text x="600" y="430" font-size="40" style="${RUB}" font-weight="800" fill="#fff">ты дома? жесть была</text></g>
    ${typing ? `<rect x="80" y="540" width="170" height="90" rx="40" fill="#262b36"/>${[0, 1, 2].map(i => `<circle cx="${125 + i * 40}" cy="585" r="11" fill="#9aa3b5" opacity="${.4 + .6 * Math.abs(Math.sin(t * 6 + i))}"/>`).join('')}` : ''}
    ${shown ? `<g transform="translate(80 540) scale(${b})"><rect width="760" height="210" rx="40" fill="#262b36"/>
      <text x="40" y="85" font-size="46" style="${RUB}" font-weight="800" fill="#fff">тём. я всё ещё в 33.</text>
      <text x="40" y="160" font-size="46" style="${RUB}" font-weight="800" fill="#ff5a5a">кто ушёл с тобой?</text></g>` : ''}`;
}

// ------------------------------------------------------------ ШОТЫ «Колыбельная из радионяни»
window.METER_TITLE = 'ШАНС ДОЖИТЬ ДО УТРА';
const tm = (o) => char('T', Object.assign({ x: 540, y: 1760, s: 1.45, emo: 'neutral', t: 0, f: 0 }, o));
const mm = (o) => char('M', Object.assign({ x: 540, y: 1760, s: 1.45, emo: 'neutral', t: 0, f: 0 }, o));
const blueGlow = (op = .14) => `<rect width="${W}" height="${H}" fill="#3a7bff" opacity="${op}" style="mix-blend-mode:screen"/>`;
function crib(x, y, s, which = 'N_CRIB', rock = 0) { return `<g transform="translate(${x} ${y}) rotate(${rock}) scale(${s})">${A[which]}</g>`; }
function nurseryScene(t, o = {}) {
  let b = A.N_NURS_D + crib(540, 1150, 1.0, o.crib || 'N_CRIB', o.rock || 0);
  b += `<g transform="translate(540 760) scale(1)"><g transform="rotate(0)">${''}</g></g>`;
  b += `<g transform="translate(540 980) scale(${o.mobScale || .9})"><g transform="scale(${Math.cos((o.spin || 0) * 1.0)} 1)">${A.N_MOBILE}</g></g>`;
  if (o.figure) b += o.figure;
  return b;
}
// высокая фигура на камере: вытянутый силуэт (это Тёма во сне — зритель поймёт в конце)
function figure(x, y, o = {}) {
  const ch = char('T', { x: 0, y: 0, s: 1.0, emo: 'neutral', t: 0, f: 0, talk: false, back: !!o.back, blink: true, headRot: o.headRot || 0 });
  let hand = '';
  if (o.shh) hand = `<g transform="translate(0 -420)"><ellipse cx="0" cy="0" rx="46" ry="58" fill="#f0c39b" stroke="#1d1a1c" stroke-width="5"/><rect x="-10" y="-120" width="22" height="110" rx="10" fill="#f0c39b" stroke="#1d1a1c" stroke-width="5"/></g>`;
  const inner = `<g transform="translate(${x} ${y}) rotate(${o.lean || 0}) scale(${o.s || 1} ${(o.s || 1) * 1.28})">${ch}${hand}</g>`;
  return o.clear ? inner : `<g filter="url(#sil)">${inner}</g>`;
}
function camFeed(inner, t, f, o = {}) {
  const ts = o.time || '03:12:0' + (Math.floor(t) % 10);
  return `<g filter="url(#camBW)">${inner}</g>${o.blur ? '' : ''}
    <rect width="${W}" height="${H}" fill="url(#scan)" opacity=".35"/>
    <g style="${MONO}" font-weight="800"><text x="80" y="160" font-size="44" fill="#fff">CAM 1</text><circle cx="900" cy="145" r="14" fill="#ff2f3f" opacity="${Math.floor(t * 2) % 2 ? 1 : .3}"/><text x="1000" y="160" text-anchor="end" font-size="44" fill="#fff">LIVE</text>
    <text x="80" y="1820" font-size="40" fill="#fff">${ts}</text></g>`;
}
function unit(screen, t, o = {}) {
  const cid = id('scr');
  return `<rect width="${W}" height="${H}" fill="#0a0c12"/>${o.bg || ''}
    <g transform="translate(540 960) rotate(${o.rot || -3}) scale(${o.s || 1})">
      <rect x="-330" y="-560" width="660" height="1120" rx="90" fill="#e8e4dc" stroke="#1d1a1c" stroke-width="10"/>
      <rect x="-70" y="-640" width="40" height="100" rx="16" fill="#cfc9bd" stroke="#1d1a1c" stroke-width="6"/>
      <clipPath id="${cid}"><rect x="-270" y="-470" width="540" height="560" rx="30"/></clipPath>
      <g clip-path="url(#${cid})"><g transform="translate(-270 -470) scale(${540 / 1080} ${560 / 1120})">${screen}</g></g>
      <rect x="-270" y="-470" width="540" height="560" rx="30" fill="none" stroke="#1d1a1c" stroke-width="8"/>
      ${[0, 1, 2, 3, 4].map(i => `<circle cx="${-120 + i * 60}" cy="200" r="16" fill="${i < (o.lv || 0) ? '#ff5a3a' : '#7a756b'}"/>`).join('')}
      <circle cx="-150" cy="380" r="56" fill="#cfc9bd" stroke="#1d1a1c" stroke-width="6"/><circle cx="150" cy="380" r="56" fill="#cfc9bd" stroke="#1d1a1c" stroke-width="6"/>
      <text x="150" y="398" text-anchor="middle" font-size="40" style="${RUB}" font-weight="900" fill="#1d1a1c">${o.btn || '▶'}</text>
      <text x="-150" y="396" text-anchor="middle" font-size="30" style="${RUB}" font-weight="900" fill="#1d1a1c">VIDEO</text>
    </g>`;
}
function soundBars(t, amp = 1) { let s = `<rect width="1080" height="1120" fill="#10202a"/>`; for (let i = 0; i < 24; i++) { const h = 60 + Math.abs(Math.sin(t * 9 + i * .8)) * 500 * amp * (.4 + hash(i + Math.floor(t * 8)) * .6); s += `<rect x="${60 + i * 40}" y="${560 - h / 2}" width="26" height="${h}" rx="12" fill="#7fe9ff"/>`; } return s; }
function staticScr(f) { return `<rect width="1080" height="1120" fill="#333"/>` + staticNoise(f, .9).replace(/width="1080" height="1920"/g, 'width="1080" height="1120"'); }
function withBundle(o) { const ch = tm(o); return ch + `<g transform="translate(${o.x || 540} ${o.y || 1760}) scale(${o.s || 1.45}) translate(-512 -1030)">${A.N_BUNDLE}</g>`; }
function phoneScreen(inner) { return `<rect width="${W}" height="${H}" fill="#0a0c12"/><g transform="translate(540 960) rotate(-2)"><rect x="-380" y="-760" width="760" height="1520" rx="80" fill="#111" stroke="#2b2f3a" stroke-width="14"/><g transform="translate(-350 -730)">${inner}</g></g>`; }

const SHOT = {
  monitor_dark: (c) => ({ body: cam(unit(soundBars(c.t, .7), c.t, { lv: 3 }), 540, 960, lerp(1.0, 1.15, c.k)) + dark(.3) + spotlight(540, 900, 700, .85, '#01020a') }),
  monitor_close: (c) => ({ body: cam(unit(soundBars(c.t, .4), c.t, { lv: 2 }), 540, 700, lerp(1.8, 2.2, c.k), (hash(c.f) - .5) * 4) + dark(.2) + spotlight(540, 960, 700, .8, '#01020a') }),
  chance: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#03040a"/>` + bigMeter(lerp(60, 6, easeOut(c.lt / .5)), c), glitch: c.lt < .2 || hash(c.f) > .8 ? .8 : 0, noHud: true }),
  rewind: (c) => {
    const pool = ['recording', 'cam_figure', 'hall_song', 'mobile_spin', 'sms', 'mom_scared'];
    const nm = pool[Math.floor(c.lt * 9) % pool.length];
    const inner = SHOT[nm]({ ...c, lt: 1 - c.k, k: 1 - c.k, i: 0 }).body;
    let lines = ''; for (let i = 0; i < 6; i++) lines += `<rect x="0" y="${hash(c.f * 2 + i) * H}" width="${W}" height="${6 + hash(i + c.f) * 20}" fill="#fff" opacity=".25"/>`;
    return { body: `<g filter="url(#bw)">${inner}</g>${lines}<rect width="${W}" height="${H}" fill="#000" opacity=".35"/>
      <text x="540" y="860" text-anchor="middle" font-size="150" style="${RUB}" font-weight="900" fill="#fff">◀◀</text>
      <text x="540" y="1010" text-anchor="middle" font-size="90" style="${RUB};paint-order:stroke" stroke="#000" stroke-width="12" font-weight="900" fill="#fff">5 ЧАСОВ НАЗАД</text>`, noHud: true, glitch: .3 };
  },
  mom_door: (c) => ({ body: drift(c, A.N_HALL + `<rect width="${W}" height="${H}" fill="#ffcf8a" opacity=".12" style="mix-blend-mode:screen"/>` + mm({ t: c.t, f: c.f }), 540, 960, 1.0, 1.05), hud: 1 }),
  monitor_table: (c) => ({ body: cam(unit(soundBars(c.t, .2), c.t, { lv: 1 }), 540, 900, lerp(1.0, 1.1, c.k)) + dark(.1), hud: 1 }),
  varya_crib: (c) => ({ body: drift(c, nurseryScene(c.t), 400, 1150, 1.3, 1.45) + spotlight(400, 1150, 800, .6), hud: 1 }),
  tyoma_game: (c) => ({ body: drift(c, A.BG_room + tm({ t: c.t, f: c.f }) + blueGlow(.16), 540, 960, 1.0, 1.05) + spotlight(540, 1000, 900, .7, '#01020a'), hud: 1 }),
  monitor_static: (c) => ({ body: cam(unit(staticScr(c.f), c.t, { lv: 4 }), 540, 860, lerp(1.2, 1.4, c.k)) + dark(.2), hud: 1 }),
  tyoma_laugh: (c) => ({ body: drift(c, A.BG_room + tm({ t: c.t, f: c.f, y: 1760 - Math.abs(Math.sin(c.t * 10)) * 8 }) + blueGlow(.16), 540, 960, 1.0, 1.05) + spotlight(540, 1000, 900, .7, '#01020a'), hud: 1 }),
  monitor_breath: (c) => ({ body: cam(unit(soundBars(c.t * .3, .5 + .5 * Math.max(0, Math.sin(c.t * 4))), c.t, { lv: Math.round(2 + 2 * Math.max(0, Math.sin(c.t * 4))) }), 540, 700, lerp(1.6, 2.0, c.k)) + spotlight(540, 900, 700, .85, '#01020a'), hud: 1, label: 'КТО-ТО ДЫШИТ' }),
  varya_laugh: (c) => ({ body: cam(nurseryScene(c.t, { crib: 'N_CRIB_LAUGH' }), 380, 1250, lerp(2.0, 2.3, c.k)) + spotlight(380, 1250, 600, .7), hud: 1 }),
  clock3: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#020203"/><g style="${MONO}" font-weight="800"><text x="540" y="1040" text-anchor="middle" font-size="260" fill="${hash(Math.floor(c.t * 3)) > .5 ? '#7fe9ff' : '#3a7f9a'}">03:00</text></g>`, hud: 1 }),
  monitor_song: (c) => ({ body: cam(unit(soundBars(c.t, 1), c.t, { lv: 5 }), 540, 900, lerp(1.1, 1.3, c.k)) + spotlight(540, 900, 700, .8, '#01020a'), hud: 1, label: 'КОЛЫБЕЛЬНАЯ' }),
  hall_walk: (c) => ({ body: cam(A.N_HALL, 540, 960, lerp(1.0, 1.35, ease(c.k)), wob(c.t, 1) * 6, Math.abs(Math.sin(c.t * 4)) * 8) + spotlight(540, 960, 600, .92), hud: 1 }),
  nursery_dark: (c) => ({ body: drift(c, nurseryScene(c.t), 540, 1100, 1.0, 1.08) + spotlight(540, 1100, 800, .75), hud: 1 }),
  mobile_spin: (c) => ({ body: cam(nurseryScene(c.t, { spin: c.t * 2.5 }), 540, 1000, lerp(1.5, 1.8, ease(c.k))) + spotlight(540, 1000, 600, .75), hud: 1, label: 'КАРУСЕЛЬ КРУТИТСЯ САМА' }),
  monitor_video_on: (c) => ({ body: cam(unit(c.lt < .6 ? staticScr(c.f) : camFeed(nurseryScene(c.t), c.t, c.f), c.t, { lv: 2, btn: '●' }), 540, 860, lerp(1.2, 1.5, ease(c.k))) + spotlight(540, 860, 700, .8, '#01020a'), hud: 1 }),
  cam_figure: (c) => ({ body: camFeed(nurseryScene(c.t, { rock: Math.sin(c.t * 2) * 3, figure: figure(800, 1560, { back: true, lean: -12, s: .7 }) }), c.t, c.f), hud: 1, glitch: c.lt < .15 ? .7 : (hash(c.f) > .93 ? .3 : 0), label: 'КТО ЭТО?' }),
  cam_figure_close: (c) => ({ body: camFeed(cam(nurseryScene(c.t, { rock: Math.sin(c.t * 2) * 3, figure: figure(800, 1560, { back: true, lean: -12, s: .7 }) }), 760, 1100, lerp(1.5, 1.8, c.k)), c.t, c.f), hud: 1, glitch: hash(c.f) > .9 ? .4 : 0 }),
  cam_live: (c) => ({ body: camFeed(cam(nurseryScene(c.t, { rock: Math.sin(c.t * 2) * 3, figure: figure(800, 1560, { back: true, lean: -12, s: .7 }) }), 540, 960, 1.1), c.t, c.f) + `<g transform="translate(540 1500)"><rect x="-260" y="-60" width="520" height="110" rx="20" fill="#c4121c"/><text y="20" text-anchor="middle" font-size="60" style="${RUB}" font-weight="900" fill="#fff">● ПРЯМОЙ ЭФИР</text></g>`, hud: 1 }),
  crib_rocking: (c) => ({ body: cam(nurseryScene(c.t, { rock: Math.sin(c.t * 2.2) * 4 }), 540, 1150, lerp(1.2, 1.35, c.k)) + spotlight(540, 1150, 700, .75), hud: 1, label: 'НИКОГО НЕТ' }),
  cam_shh: (c) => ({ body: camFeed(cam(nurseryScene(c.t, { figure: figure(800, 1560, { shh: true, s: .7 }) }), 760, 1150, lerp(1.15, 1.35, ease(c.k))), c.t, c.f), hud: 1, glitch: hash(c.f * 3) > .85 ? .5 : 0, label: '«ТСС»' }),
  call_mom: (c) => ({ body: phoneScreen(`<rect width="700" height="1460" rx="60" fill="#0b0d12"/><circle cx="350" cy="400" r="110" fill="#ff8fab"/><text x="350" y="436" text-anchor="middle" font-size="100" style="${RUB}" font-weight="900" fill="#fff">М</text>
      <text x="350" y="600" text-anchor="middle" font-size="60" style="${RUB}" font-weight="900" fill="#fff">Мама ❤</text><text x="350" y="680" text-anchor="middle" font-size="40" style="${RUB}" font-weight="800" fill="#9aa3b5">Вызов… ${Math.floor(c.lt) + 1}</text>
      <circle cx="350" cy="1200" r="80" fill="#c4121c"/>`), hud: 1 }),
  sms: (c) => {
    const b = easeBack((c.lt - .2) / .3);
    return { body: phoneScreen(`<rect width="700" height="1460" rx="60" fill="#0b0d12"/><rect width="700" height="200" rx="60" fill="#151922"/><text x="350" y="130" text-anchor="middle" font-size="54" style="${RUB}" font-weight="900" fill="#fff">Мама ❤</text>
      <g transform="translate(40 400) scale(${clamp(b)})"><rect width="600" height="200" rx="40" fill="#262b36"/><text x="40" y="85" font-size="46" style="${RUB}" font-weight="800" fill="#fff">Тёма, ложись спать.</text><text x="40" y="155" font-size="46" style="${RUB}" font-weight="800" fill="#7fe9ff">Я с вами.</text></g>
      <text x="350" y="700" text-anchor="middle" font-size="34" style="${RUB}" font-weight="800" fill="#9aa3b5">03:14</text>`), hud: 1, label: 'СООБЩЕНИЕ ОТ МАМЫ' };
  },
  monitor_close2: (c) => ({ body: cam(unit(soundBars(c.t, .5), c.t, { lv: 3 }), 540, 700, lerp(2.0, 2.4, c.k), (hash(c.f) - .5) * 6) + spotlight(540, 900, 600, .85, '#01020a'), hud: 1 }),
  tyoma_mouth: (c) => ({ body: cam(A.BG_room + tm({ emo: 'terrified', t: c.t, f: c.f, talk: false }) + `<g transform="translate(540 1760) scale(1.45) translate(-512 -1030)"><ellipse cx="512" cy="640" rx="110" ry="70" fill="#f0c39b" stroke="#1d1a1c" stroke-width="6"/><path d="M420 640 h184 M430 670 h170" stroke="#d79f78" stroke-width="6"/></g>` + blueGlow(.16), 540, 900, lerp(1.1, 1.3, c.k)) + spotlight(540, 900, 800, .75, '#01020a'), hud: 1 }),
  monitor_close3: (c) => ({ body: cam(unit(soundBars(c.t, .3), c.t, { lv: 1 }), 540, 700, lerp(2.4, 2.9, ease(c.k))) + spotlight(540, 900, 500, .9, '#01020a'), hud: 1, glitch: c.lt > .8 ? .5 : 0, label: '«Я ЗНАЮ»' }),
  grab_varya: (c) => ({ body: cam(nurseryScene(c.t, { crib: 'N_CRIB_EMPTY' }) + withBundle({ x: 540, y: 1900, s: 1.3, emo: 'terrified', t: c.t, f: c.f }), 540, 1000, 1.05, (hash(c.f) - .5) * 8) + spotlight(540, 1000, 800, .75), hud: 1 }),
  hall_run: (c) => ({ body: `<g filter="url(#mblur)">${cam(A.N_HALL, 540, 960, lerp(1.0, 1.4, (c.lt % .6) / .6), wob(c.t * 6) * 20, Math.abs(Math.sin(c.t * 9)) * 20)}</g>` + spotlight(540, 960, 600, .92), hud: 1 }),
  cam_turn: (c) => {
    const turn = ease(clamp(c.lt / 2.0));
    const fig = turn < .5 ? figure(800, 1560, { back: true, lean: -12 * (1 - turn * 2), s: .7 }) : figure(800, 1560, { s: .7, headRot: (1 - turn) * 30 });
    return { body: cam(unit(camFeed(nurseryScene(c.t, { crib: 'N_CRIB_EMPTY', figure: fig }), c.t, c.f), c.t, { lv: 4 }), 540, 860, lerp(1.4, 1.8, ease(c.k)), (hash(c.f) - .5) * 6) + spotlight(540, 860, 600, .8, '#01020a'), hud: 1, glitch: turn > .45 && turn < .6 ? .8 : 0, label: 'ОНА ПОВЕРНУЛАСЬ' };
  },
  hall_song: (c) => ({ body: cam(A.N_HALL + `<rect x="380" y="500" width="320" height="900" fill="#000"/>` + `<g opacity="${.35 + .2 * Math.sin(c.t * 3)}">${figure(540, 1450, { s: .45 })}</g>`, 540, 960, lerp(1.2, 1.5, ease(c.k))) + spotlight(540, 960, 500, .95), hud: 1, label: 'ПЕСНЯ В КОРИДОРЕ' }),
  door_lock: (c) => ({ body: cam(A.N_DOOR, 745, 960, lerp(2.0, 2.3, c.k), (hash(c.f) - .5) * 6) + spotlight(745, 960, 500, .85), hud: 1 }),
  stairs: (c) => ({ body: `<g filter="url(#mblur)">${cam(A.N_STAIRS, 540, 1200, 1.1 + (c.lt % .5) * .4, wob(c.t * 7) * 30, Math.abs(Math.sin(c.t * 10)) * 30)}</g>` + dark(.3), hud: 1 }),
  street_dawn: (c) => ({ body: drift(c, A.BG_street + `<rect width="${W}" height="${H}" fill="#ffb070" opacity=".22" style="mix-blend-mode:screen"/>` + withBundle({ x: 540, y: 1850, s: 1.35, emo: 'scared', t: c.t, f: c.f }), 540, 1000, 1.0, 1.06), hud: 1 }),
  mom_taxi: (c) => ({ body: drift(c, A.BG_street + `<rect width="${W}" height="${H}" fill="#ffb070" opacity=".2" style="mix-blend-mode:screen"/>` + `<g transform="translate(${lerp(1500, 760, easeOut(c.lt / .8))} 1450) scale(.8)">${A.N_TAXI}</g>` + mm({ x: 400, y: 1900, s: 1.2, emo: 'scared', t: c.t, f: c.f }), 540, 1000, 1.0, 1.05), hud: 1 }),
  tyoma_cry: (c) => ({ body: drift(c, A.BG_street + `<rect width="${W}" height="${H}" fill="#ffb070" opacity=".2" style="mix-blend-mode:screen"/>` + withBundle({ emo: 'scared', t: c.t, f: c.f }), 540, 960, 1.0, 1.06), hud: 1 }),
  mom_phone: (c) => ({ body: drift(c, A.BG_street + `<rect width="${W}" height="${H}" fill="#ffb070" opacity=".2" style="mix-blend-mode:screen"/>` + mm({ emo: 'scared', t: c.t, f: c.f }), 540, 960, 1.0, 1.05), hud: 1 }),
  mom_close: (c) => ({ body: cam(A.BG_street + mm({ emo: 'neutral', t: c.t, f: c.f }), 540, 860, lerp(1.3, 1.5, c.k)) + spotlight(540, 860, 800, .5), hud: 1 }),
  tyoma_ask: (c) => ({ body: cam(A.BG_street + `<rect width="${W}" height="${H}" fill="#ffb070" opacity=".15" style="mix-blend-mode:screen"/>` + withBundle({ emo: 'terrified', t: c.t, f: c.f }), 540, 860, lerp(1.2, 1.45, ease(c.k))) + spotlight(540, 860, 800, .55), hud: 1 }),
  recording: (c) => {
    const inner = camFeed(nurseryScene(c.t, { rock: Math.sin(c.t * 2) * 3, figure: char('T', { x: 640, y: 1500, s: .95, emo: 'neutral', t: 0, f: c.f, blink: true, headRot: 12, mouth: Math.floor(c.t * 4) % 2 }) }), c.t, c.f, { time: 'ЗАПИСЬ · 03:12:41' });
    return { body: phoneScreen(`<g transform="scale(${700 / 1080} ${1460 / 1920})">${inner}</g>`), hud: 1, label: 'ЗАПИСЬ ИЗ ПРИЛОЖЕНИЯ' };
  },
  mom_scared: (c) => ({ body: cam(A.BG_street + mm({ emo: 'scared', t: c.t, f: c.f }), 540, 860, lerp(1.3, 1.6, ease(c.k))) + spotlight(540, 860, 700, .6), hud: 1 }),
  recording_shh: (c) => {
    const fig = char('T', { x: 600, y: 1500, s: 1.0, emo: 'neutral', t: 0, f: c.f, blink: true, talk: false });
    const hand = `<g transform="translate(600 920)"><ellipse rx="46" ry="58" fill="#f0c39b" stroke="#1d1a1c" stroke-width="5"/><rect x="-10" y="-120" width="22" height="110" rx="10" fill="#f0c39b" stroke="#1d1a1c" stroke-width="5"/></g>`;
    const inner = camFeed(cam(nurseryScene(c.t, { crib: 'N_CRIB_EMPTY', figure: fig + (c.lt > .8 ? hand : '') }), 600, 900, lerp(1.2, 1.9, ease(c.k))), c.t, c.f, { time: 'ЗАПИСЬ · 03:12:58' });
    return { body: phoneScreen(`<g transform="scale(${700 / 1080} ${1460 / 1920})">${inner}</g>`), hud: 1, glitch: c.lt > .75 && c.lt < .95 ? .8 : 0, label: 'ЭТО БЫЛ ТЁМА' };
  },
};
function ruleShot() { return { body: '' }; }
function flash(c, x, y, r = 600) { return dust(c.t, x, y, 260, 16) + warmBeam(x, y, r * .7, .22) + spotlight(x, y, r, .93); }

// ------------------------------------------------------------ интерфейс «ШАНС ВЫЖИТЬ» + таймер
function meterAt(t) {
  let prev = 100, cur = 100, t0 = -10;
  for (const m of TL.meter) if (m.t <= t) { prev = cur; cur = m.v; t0 = m.t; }
  const k = easeOut((t - t0) / .7);
  return { v: lerp(prev, cur, k), changing: t - t0 < .7, drop: cur < prev, since: t - t0 };
}
function meterColor(v) { return v > 60 ? '#3ddc68' : v > 30 ? '#ffc93a' : '#ff2f3f'; }
function hudMeter(t, f) {
  const m = meterAt(t);
  const sh = m.changing && m.drop ? (hash(f) - .5) * 14 : 0;
  const col = meterColor(m.v);
  const flashOp = m.changing && m.drop ? (1 - m.since / .7) * .5 : 0;
  return `<g transform="translate(${60 + sh} 70)" style="${RUB}" font-weight="900">
    <text x="0" y="0" font-size="34" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="6">${window.METER_TITLE || 'ШАНС ВЫЖИТЬ'}</text>
    <rect x="0" y="18" width="760" height="30" rx="15" fill="#000" fill-opacity=".6" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>
    <rect x="4" y="22" width="${752 * m.v / 100}" height="22" rx="11" fill="${col}"/>
    <text x="960" y="44" text-anchor="end" font-size="64" fill="${col}" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">${Math.round(m.v)}%</text></g>
    ${flashOp ? `<rect width="${W}" height="${H}" fill="#ff0000" opacity="${flashOp * .35}"/>` : ''}`;
}
function storyLeft(t) {
  const p = [['evening', 8 * 3600], ['noise', 4 * 3600], ['lullaby', 3 * 3600], ['camera', 2 * 3600 + 55 * 60], ['sms', 2 * 3600 + 48 * 60], ['escape', 2 * 3600 + 40 * 60], ['street', 0]];
  if (t < SC.evening.start) return null;
  if (t >= SC.street.start) return 0;
  for (let i = 0; i < p.length - 1; i++) if (t < SC[p[i + 1][0]].start) return lerp(p[i][1], p[i + 1][1], (t - SC[p[i][0]].start) / (SC[p[i + 1][0]].start - SC[p[i][0]].start));
  return 0;
}
function hudTimer(t) {
  let s = storyLeft(t); if (s === null) return '';
  s = Math.max(0, Math.round(s));
  const txt = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  let verse = '';
  const vs = [['lullaby', 2], ['camera', 3], ['sms', 5], ['escape', 7]];
  let v = 0; for (const [id, n] of vs) if (t >= SC[id].start) v = n;
  if (v && t < SC.street.start) verse = `<g style="${RUB}" font-weight="900"><rect x="560" y="148" width="250" height="58" rx="12" fill="#3a7bff" opacity=".85"/><text x="685" y="189" text-anchor="middle" font-size="32" fill="#fff">♪ КУПЛЕТ ${v}/7</text></g>`;
  return `<g style="${MONO}" font-weight="800"><rect x="60" y="148" width="480" height="58" rx="12" fill="#000" fill-opacity=".65" stroke="#e7b545" stroke-width="3"/>
    <circle cx="92" cy="177" r="10" fill="#ff2f3f"/><text x="115" y="190" font-size="30" fill="#ffd0d0">ДО ПРИХОДА МАМЫ · ${txt}</text></g>` + verse;
}
const LABELS = {
  mom_door: 'МАМА НА НОЧНУЮ СМЕНУ', monitor_table: 'РАДИОНЯНЯ С КАМЕРОЙ', varya_crib: 'ВАРЕ 2 ГОДА', tyoma_game: 'ИДЕАЛЬНАЯ НОЧЬ', monitor_static: 'ПОМЕХИ',
  tyoma_laugh: 'ТЁМА НЕ ВЕРИТ', varya_laugh: 'ВАРЯ СМЕЁТСЯ ВО СНЕ', clock3: '03:00', hall_walk: 'В ДЕТСКУЮ', nursery_dark: 'ВАРЯ СПИТ ОДНА', monitor_video_on: 'ВИДЕО',
  monitor_close2: '«КАК ТЕБЯ ЗОВУТ?»', tyoma_mouth: 'НЕ ОТВЕЧАЙ', grab_varya: 'БЕЖАТЬ', hall_run: 'БЕЖАТЬ', door_lock: 'ВЫХОД', stairs: 'ПОДЪЕЗД',
  street_dawn: 'РАССВЕТ · 06:00', mom_taxi: 'МАМА ВЕРНУЛАСЬ', tyoma_cry: 'МАМА ВЕРНУЛАСЬ', mom_phone: '«ЭТО Я ПЕЛА»', mom_close: '«ТЫ УСНУЛ В 2:40»', tyoma_ask: 'КТО СТОЯЛ НАД КРОВАТКОЙ?', mom_scared: 'КОЛЫБЕЛЬНАЯ БАБУШКИ',
};
function label(txt, t) {
  if (!txt) return '';
  const w = 60 + txt.length * 22;
  return `<g style="${RUB}" font-weight="900" transform="translate(540 300)"><rect x="${-w / 2}" y="-38" width="${w}" height="64" rx="12" fill="#111" fill-opacity=".85" stroke="#c4121c" stroke-width="3"/>
    <circle cx="${-w / 2 + 30}" cy="-6" r="9" fill="#ff2f3f" opacity="${Math.floor(t * 2) % 2 ? 1 : .4}"/><text x="14" y="6" text-anchor="middle" font-size="32" fill="#fff">${txt}</text></g>`;
}
function bigMeter(v, c) {
  const col = meterColor(v);
  return `<g style="${RUB}" font-weight="900" transform="translate(540 900)">
    <text y="-120" text-anchor="middle" font-size="${(window.METER_TITLE||'ШАНС ВЫЖИТЬ').length > 14 ? 58 : 76}" fill="#fff">${window.METER_TITLE || 'ШАНС ВЫЖИТЬ'}</text>
    <rect x="-420" y="-60" width="840" height="70" rx="35" fill="#000" stroke="#fff" stroke-width="5"/>
    <rect x="-412" y="-52" width="${824 * v / 100}" height="54" rx="27" fill="${col}"/>
    <text y="210" text-anchor="middle" font-size="240" fill="${col}" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="14">${Math.round(v)}%</text></g>`;
}

const KEY2 = ['варей.', 'варя', 'варю', 'радионяня', 'радионяне', 'дышал.', 'засмеялась.', 'карусель', 'сама.', 'фигура', 'фигура.', 'качала', 'пусто.', 'губам.', 'сообщение.', 'знаю.', 'коридора.', 'ушли.', 'пела.', 'приложение.', 'кроваткой?', 'колыбельную?', 'умерла', 'рождения.', 'эфир.', 'камеру.', 'бабушки', 'бабушка', 'бабушки.', 'огород.', 'огорода', 'зеркала', 'замка.', 'сквозняков.', 'подпол.', 'подпол', 'правило.', 'записок.', 'деда', 'деда?', 'упала...', 'спала.', 'калитка.', 'стеклу.', 'дом.', 'открыты.', 'утра.', 'блины.', 'умерла', 'сутки.', 'телефона.', 'никогда', 'рыбы', 'рыбы.', 'дохлых', 'кругами', 'грузовик', 'светилась', 'тень', 'погас', 'хребет', 'голова', 'рёва', 'окна', 'сирены', 'мост', 'мама', 'больнице', 'к', 'него', 'второй', 'объект', 'закрывал', 'убегал', 'закипела', 'тёмное', 'днём', 'маму', 'глаз', 'помочь', 'спиной', '33', '33-й', '03:33', '03:34', 'шестеро', 'детей', 'медсестру', 'камеру', 'камеру.', 'моргнул', 'постанова', 'правила', 'глаза', 'не', 'один', 'дима', 'заправлены', 'кроме', 'двоих', 'лёха', 'пусто', 'смене', 'побежал', 'сообщение', 'обход', 'спят'];
function subtitle2(t) {
  const sub = TL.subs.find(s => t >= s.start && t < s.end + 0.04);
  if (!sub || t >= TL.cut) return '';
  const sc = lerp(.6, 1, easeBack((t - sub.start) / .12));
  const txt = sub.text.toUpperCase();
  const size = Math.min(96, 1380 / Math.max(7, txt.length));
  let fill = '#fff';
  if (sub.style === 'whisper') fill = '#d9dbe8';
  if (sub.style === 'mom') fill = '#ffc2d1';
  if (sub.style === 'dima') fill = '#bcd3ff';
  if (sub.style === 'radio') fill = '#bff6ff';
  if (sub.style === 'granny') fill = '#ffe0c0';
  if (sub.style === 'creepy') fill = '#ff5a5a';
  const spans = txt.split(' ').map(w => {
    const n = w.toLowerCase().replace(/[.,!?…«»:—]/g, '');
    const hl = sub.style === 'normal' && KEY2.includes(n) && n !== 'не';
    const red = n === 'не' && sub.style === 'normal';
    return `<tspan fill="${hl ? '#ffd23f' : red ? '#ff4a4a' : fill}">${w}</tspan>`;
  }).join(' ');
  return `<g transform="translate(540 1300) scale(${sc})"><text text-anchor="middle" font-size="${size}" style="${RUB};paint-order:stroke" font-weight="900"
    stroke="#000" stroke-width="${size * .2}" stroke-linejoin="round" ${sub.style === 'whisper' || sub.style === 'mom' ? 'font-style="italic"' : ''}>${spans}</text></g>`;
}

const DEFS2 = `<defs>
  <filter id="camBW" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.25" intercept="-.08"/><feFuncG type="linear" slope="1.25" intercept="-.08"/><feFuncB type="linear" slope="1.35" intercept="-.04"/></feComponentTransfer><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="sil" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.12 0.12 0.12 0 0.02  0.12 0.12 0.12 0 0.02  0.12 0.12 0.12 0 0.03  0 0 0 1 0"/><feGaussianBlur stdDeviation="5"/></filter>
  <pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="3" fill="#000"/></pattern>
  <filter id="nightvision" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.06 0.16 0.03 0 0  0.22 0.5 0.12 0 0.03  0.05 0.12 0.04 0 0  0 0 0 1 0"/></filter>
  <filter id="sepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.39 0.69 0.17 0 0  0.31 0.6 0.15 0 0  0.24 0.47 0.12 0 0  0 0 0 1 0"/></filter>
  <filter id="bw" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter>
  <filter id="redOnly"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter><filter id="blur20"><feGaussianBlur stdDeviation="20"/></filter>
  <filter id="dusk" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.2 0.2 0 0 0.12  0.1 0.8 0.1 0 0.05  0.1 0.2 0.8 0 0.08  0 0 0 1 0"/></filter>
  <filter id="silhouette"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0.02  0 0 0 1 0"/></filter>
  <filter id="mblur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6 14"/></filter>
</defs>`;

window.renderFrame = function (t) {
  uid = 0;
  const f = Math.round(t * FPS);
  if (t >= TL.cut) {
    const k = Math.round((t - TL.cut) * FPS);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#000"/>${k < 3 ? staticNoise(f) : ''}</svg>`;
  }
  const c = shotAtT(t); c.t = t; c.f = f;
  const r = SHOT[c.s.name](c);
  const sid = sceneOf(t);
  const showHud = r.hud && !r.noHud;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS2}
    <rect width="${W}" height="${H}" fill="#000"/><g id="scene">${r.body}</g>`;
  if (r.glitch) out += glitch(f, r.glitch);
  out += vignette(.6) + grain(f, .08);
  // вспышка на склейке
  if (c.lt < .05 && c.i > 0) out += `<rect width="${W}" height="${H}" fill="#000" opacity=".5"/>`;
  if (r.rec) out += rec(t, firstShot('cam_far') <= t && sid === 'legend' ? '03:33' : '03:33', 'НОЧН. РЕЖИМ').replace('y="100"', 'y="230"').replace('cy="137"', 'cy="267"').replace('y="150"', 'y="280"').replace('y="148"', 'y="278"');
  if (r.labelOnly) out += label(r.label, t);
  if (showHud) out += hudMeter(t, f) + hudTimer(t, r.bigTimer && c.lt < 1.0) + (r.bigTimer ? '' : label(r.label || LABELS[c.s.name], t));
  out += subtitle2(t) + '</svg>';
  return out;
};
