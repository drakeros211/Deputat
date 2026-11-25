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

// ------------------------------------------------------------ ШОТЫ «Стрим 24/7»
window.METER_TITLE = 'ШАНС ДОСИДЕТЬ ДО УТРА';
const tm = (o) => char('T', Object.assign({ x: 540, y: 1760, s: 1.45, emo: 'neutral', t: 0, f: 0 }, o));
const lh = (o) => char('L', Object.assign({ x: 540, y: 1760, s: 1.45, emo: 'grin', t: 0, f: 0 }, o));
const rgb = (t, op = .14) => `<rect width="${W}" height="${H}" fill="hsl(${(t * 40) % 360},90%,55%)" opacity="${op}" style="mix-blend-mode:screen"/>`;
const NICKS = ['user_0333', 'user_0334', 'user_0335', 'user_0336', 'user_0337', 'user_0338', 'user_0339', 'user_0340'];
// комната стримера: стол, микрофон, шкаф, дверь (открыта/закрыта), тень
function room(o = {}) {
  let s = A.BG_room;
  s += `<rect x="40" y="520" width="300" height="900" fill="#2a1f18" stroke="#120c08" stroke-width="10"/><line x1="190" y1="520" x2="190" y2="1420" stroke="#120c08" stroke-width="8"/><circle cx="170" cy="980" r="10" fill="#8b7355"/><circle cx="210" cy="980" r="10" fill="#8b7355"/>`;
  if (!o.doorOpen) s += `<rect x="700" y="420" width="300" height="1000" fill="#3a2a1d" stroke="#120c08" stroke-width="12"/><circle cx="960" cy="930" r="14" fill="#c9a86a"/>`;
  else s += `<path d="M700 420 L760 460 L760 1380 L700 1420Z" fill="#3a2a1d" stroke="#120c08" stroke-width="8"/>`;
  if (o.shadow) s += `<g opacity="${o.shadow}" filter="url(#blur6)"><path d="M${o.sx || 850} ${o.sy || 1420} l-90 0 l20 -620 c0 -90 30 -160 70 -170 c40 10 70 80 70 170 l20 620z" fill="#000"/><circle cx="${o.sx || 850}" cy="${(o.sy || 1420) - 830}" r="62" fill="#000"/></g><g opacity="${o.shadow * .8}"><circle cx="${(o.sx || 850) - 20}" cy="${(o.sy || 1420) - 840}" r="6" fill="#ff3040"/><circle cx="${(o.sx || 850) + 20}" cy="${(o.sy || 1420) - 840}" r="6" fill="#ff3040"/></g>`;
  if (o.light === false) s += `<rect width="${W}" height="${H}" fill="#000" opacity=".55"/>`;
  return s;
}
function desk(o = {}) {
  return `<rect x="-40" y="1560" width="1160" height="80" fill="#1a1d24" stroke="#000" stroke-width="6"/><rect y="1640" width="${W}" height="300" fill="#0d0f14"/>
    <g transform="translate(860 1380)"><rect x="-20" y="0" width="40" height="190" fill="#222"/><rect x="-55" y="-130" width="110" height="160" rx="55" fill="#2b2d33" stroke="#000" stroke-width="6"/>${[0, 1, 2, 3].map(i => `<line x1="-40" y1="${-100 + i * 30}" x2="40" y2="${-100 + i * 30}" stroke="#555" stroke-width="4"/>`).join('')}</g>`;
}
function streamer(o = {}) {
  const sc = room(o) + (o.empty ? '' : tm(Object.assign({ x: 540, y: 1720, s: 1.2 }, o.tyoma || {}))) + desk() + (o.hands ? `<g filter="url(#blur6)">${o.hands}</g>` : '') + rgb(o.t || 0, o.light === false ? .05 : .12);
  return sc + (o.light === false ? `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".1" style="mix-blend-mode:screen"/>` + spotlight(540, 1100, 700, .85, '#01020a') : '');
}
// интерфейс стрима
function chatPanel(t, msgs, o = {}) {
  let s = `<rect x="${o.x || 640}" y="${o.y || 780}" width="${o.w || 420}" height="${o.h || 760}" rx="18" fill="#0b0d12" fill-opacity=".72"/>`;
  msgs.slice(-9).forEach((m, i) => {
    const y = (o.y || 780) + 60 + i * 78;
    s += `<text x="${(o.x || 640) + 20}" y="${y}" font-size="${m.big ? 38 : 30}" style="${RUB}" font-weight="800"><tspan fill="${m.c || '#8fd3ff'}">${m.n}:</tspan> <tspan fill="${m.red ? '#ff4a4a' : '#fff'}">${m.m}</tspan></text>`;
  });
  return s;
}
function liveBar(t, viewers, o = {}) {
  return `<g style="${RUB}" font-weight="900"><rect x="40" y="250" width="150" height="62" rx="10" fill="#e91916"/><text x="115" y="294" text-anchor="middle" font-size="40" fill="#fff">LIVE</text>
    <rect x="200" y="250" width="${80 + String(viewers).length * 26}" height="62" rx="10" fill="#000" fill-opacity=".7"/><circle cx="232" cy="281" r="10" fill="#ff4a4a"/><text x="256" y="294" font-size="38" fill="#fff">${viewers.toLocaleString('ru-RU')}</text>
    <text x="40" y="370" font-size="34" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="6">СТРИМ 24 ЧАСА БЕЗ СНА 🔴 ${o.clock || ''}</text></g>`;
}
function donation(t, lt, who, sum, msg) {
  const k = easeBack(lt / .35);
  return `<g transform="translate(540 560) scale(${clamp(k)})" style="${RUB}" font-weight="900"><rect x="-460" y="-170" width="920" height="320" rx="30" fill="#1b0f2e" stroke="#9b5cff" stroke-width="8"/>
    <text y="-90" text-anchor="middle" font-size="50" fill="#c9a6ff">${who} — ${sum}</text>
    <text y="10" text-anchor="middle" font-size="${msg.length > 22 ? 46 : 62}" fill="#fff">${msg}</text>
    <text y="100" text-anchor="middle" font-size="60">💸</text></g>`;
}
function bigViewers(n, col = '#fff') { return `<g style="${RUB}" font-weight="900"><text x="540" y="960" text-anchor="middle" font-size="210" fill="${col}" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="16">${n.toLocaleString('ru-RU')}</text><text x="540" y="1060" text-anchor="middle" font-size="60" fill="#ccc">зрителей</text></g>`; }
function previewMonitor(inner, o = {}) {
  const cid = id('pm');
  return `<rect width="${W}" height="${H}" fill="#06070b"/><g transform="translate(540 900) rotate(${o.rot || 2})"><rect x="-500" y="-330" width="1000" height="640" rx="20" fill="#0b0b0e" stroke="#2a2d36" stroke-width="12"/>
    <clipPath id="${cid}"><rect x="-470" y="-300" width="940" height="580"/></clipPath><g clip-path="url(#${cid})"><g transform="translate(-470 -300) scale(${940 / 1080}) translate(0 -640)">${inner}</g></g>
    <rect x="-60" y="310" width="120" height="120" fill="#1a1c22"/><rect x="-200" y="420" width="400" height="30" rx="10" fill="#1a1c22"/>
    <g style="${RUB}" font-weight="900"><rect x="-460" y="-290" width="170" height="52" rx="8" fill="#e91916"/><text x="-375" y="-252" text-anchor="middle" font-size="32" fill="#fff">ПРЕВЬЮ</text></g></g>`;
}
function pv(o) { o.light = true; return `<g>${streamer(o)}<rect width="1080" height="1920" fill="#0a1030" opacity=".35"/></g>`; }
function countdownNum(lt) { const n = Math.max(1, 10 - Math.floor(lt / .4)); return `<g style="${MONO}" font-weight="800"><text x="540" y="1500" text-anchor="middle" font-size="200" fill="#ff2f3f" style="paint-order:stroke;${MONO}" stroke="#000" stroke-width="12">${n}</text></g>`; }

const SHOT = {
  hook_chat: (c) => {
    const msgs = []; const n = Math.floor(c.lt * 9);
    const pool = ['НЕ ОБОРАЧИВАЙСЯ', 'ОН СТОИТ СЗАДИ', 'ТЁМА БЕГИ', 'сзади!!!', 'НЕ ОБОРАЧИВАЙСЯ', 'он улыбается', 'ТЁМА', 'выключай!!!', 'он ближе'];
    for (let i = 0; i < n + 4; i++) msgs.push({ n: NICKS[i % 8], m: pool[i % pool.length], red: true, big: true, c: '#ff8f8f' });
    return { body: cam(streamer({ t: c.t, light: false, tyoma: { emo: 'terrified', t: c.t, f: c.f, talk: false } }), 540, 1000, lerp(1.1, 1.3, c.k)) + chatPanel(c.t, msgs, { x: 40, y: 560, w: 1000, h: 760 }) + liveBar(c.t, 1000000) };
  },
  chance: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#07030c"/>` + bigMeter(lerp(60, 3, easeOut(c.lt / .5)), c), glitch: c.lt < .2 || hash(c.f) > .8 ? .8 : 0, noHud: true }),
  rewind: (c) => {
    const pool = ['preview_smile', 'don_10k', 'chat_wardrobe', 'live_room', 'under_table', 'viewers_jump'];
    const nm = pool[Math.floor(c.lt * 9) % pool.length];
    const inner = SHOT[nm]({ ...c, lt: 1 - c.k, k: 1 - c.k, i: 0 }).body;
    let lines = ''; for (let i = 0; i < 6; i++) lines += `<rect x="0" y="${hash(c.f * 2 + i) * H}" width="${W}" height="${6 + hash(i + c.f) * 20}" fill="#fff" opacity=".25"/>`;
    return { body: `<g filter="url(#bw)">${inner}</g>${lines}<rect width="${W}" height="${H}" fill="#000" opacity=".35"/>
      <text x="540" y="860" text-anchor="middle" font-size="150" style="${RUB}" font-weight="900" fill="#fff">◀◀</text>
      <text x="540" y="1010" text-anchor="middle" font-size="90" style="${RUB};paint-order:stroke" stroke="#000" stroke-width="12" font-weight="900" fill="#fff">18 ЧАСОВ НАЗАД</text>`, noHud: true, glitch: .3 };
  },
  stream_start: (c) => ({ body: drift(c, streamer({ t: c.t, tyoma: { t: c.t, f: c.f, mouth: undefined } }), 540, 1000, 1.0, 1.05) + liveBar(c.t, 3, { clock: '21:00' }), hud: 1 }),
  stream_lemon: (c) => ({ body: drift(c, streamer({ t: c.t, tyoma: { t: c.t, f: c.f, y: 1720 - Math.abs(Math.sin(c.t * 10)) * 10 } }), 540, 1000, 1.05, 1.1) + `<g transform="translate(860 1100) rotate(${Math.sin(c.t * 4) * 10})"><ellipse rx="90" ry="70" fill="#f2d230" stroke="#000" stroke-width="6"/><path d="M80 -20 q30 -10 30 10" stroke="#3a7a2a" stroke-width="10" fill="none"/></g>` + liveBar(c.t, 3), hud: 1 }),
  don_lyoha: (c) => ({ body: streamer({ t: c.t, tyoma: { t: c.t, f: c.f } }) + liveBar(c.t, 3) + donation(c.t, c.lt, 'Лёха', '10 ₽', 'бро ты уже зевнул 😴'), hud: 1 }),
  viewers3: (c) => ({ body: cam(streamer({ t: c.t, tyoma: { t: c.t, f: c.f } }) + chatPanel(c.t, [{ n: 'Лёха', m: 'го лимон' }, { n: 'Мама', m: 'Тёма, спать в 12!' }, { n: 'bot', m: 'Добро пожаловать!' }]), 540, 900, 1.15) + liveBar(c.t, 3), hud: 1 }),
  room_alone: (c) => ({ body: drift(c, streamer({ t: c.t, empty: false, tyoma: { t: c.t, f: c.f, emo: 'neutral' } }), 760, 900, 1.0, 1.1) + dark(.2), hud: 1, label: 'ДОМА ОДИН' }),
  clock2: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#020203"/><g style="${MONO}" font-weight="800"><text x="540" y="1040" text-anchor="middle" font-size="260" fill="#9b5cff">02:00</text></g>`, hud: 1 }),
  viewers_jump: (c) => { const n = c.lt < .4 ? 3 : Math.round(lerp(3, 1000, easeOut((c.lt - .4) / .5))); return { body: `<rect width="${W}" height="${H}" fill="#08060f"/>` + bigViewers(n, c.lt > .5 ? '#ff5a5a' : '#fff'), hud: 1, glitch: c.lt > .4 && c.lt < .55 ? .8 : 0 }; },
  chat_users: (c) => { const msgs = NICKS.slice(0, Math.min(8, 1 + Math.floor(c.lt * 4))).map(n => ({ n, m: 'зашёл на стрим', c: '#9aa3b5' })); return { body: cam(streamer({ t: c.t, tyoma: { t: c.t, f: c.f } }) + chatPanel(c.t, msgs, { x: 60, y: 560, w: 960, h: 760 }), 540, 950, 1.05) + liveBar(c.t, 1000), hud: 1 }; },
  chat_silent: (c) => ({ body: cam(streamer({ t: c.t, tyoma: { emo: 'scared', t: c.t, f: c.f } }) + chatPanel(c.t, NICKS.map(n => ({ n, m: '…', c: '#9aa3b5' })), { x: 60, y: 560, w: 960, h: 760 }), 540, 950, lerp(1.05, 1.15, c.k)) + liveBar(c.t, 1000), hud: 1, label: 'ОНИ ПРОСТО СМОТРЯТ' }),
  tyoma_hype: (c) => ({ body: drift(c, streamer({ t: c.t * 3, tyoma: { t: c.t, f: c.f, y: 1720 - Math.abs(Math.sin(c.t * 12)) * 14 } }), 540, 1000, 1.05, 1.12) + liveBar(c.t, 1000), hud: 1, label: 'ЗАЛЕТЕЛ В РЕКИ?' }),
  don_333: (c) => ({ body: streamer({ t: c.t, tyoma: { t: c.t, f: c.f } }) + liveBar(c.t, 1333) + donation(c.t, c.lt, 'Аноним', '333 ₽', '…'), hud: 1 }),
  don_light: (c) => ({ body: streamer({ t: c.t, tyoma: { t: c.t, f: c.f, emo: 'scared' } }) + liveBar(c.t, 2400) + donation(c.t, c.lt, 'Аноним', '333 ₽', 'выключи свет'), hud: 1 }),
  light_off: (c) => ({ body: streamer({ t: c.t, light: c.lt < .3, tyoma: { t: c.t, f: c.f } }) + liveBar(c.t, c.lt < .6 ? 2400 : 5000), hud: 1, label: 'СВЕТ ВЫКЛЮЧЕН' }),
  don_wardrobe: (c) => ({ body: streamer({ t: c.t, light: false, tyoma: { t: c.t, f: c.f, emo: 'scared' } }) + liveBar(c.t, 5000) + donation(c.t, c.lt, 'Аноним', '333 ₽', 'повернись к шкафу'), hud: 1 }),
  chat_wardrobe: (c) => { const msgs = Array.from({ length: 9 }, (_, i) => ({ n: NICKS[i % 8], m: 'КТО У ТЕБЯ ЗА ШКАФОМ', red: true, big: true })); return { body: cam(streamer({ t: c.t, light: false, tyoma: { t: c.t, f: c.f, emo: 'scared' } }), 300, 960, 1.3) + chatPanel(c.t, msgs, { x: 60, y: 560, w: 960, h: 760 }) + liveBar(c.t, 5000), hud: 1, glitch: hash(c.f) > .9 ? .4 : 0 }; },
  wardrobe_check: (c) => ({ body: cam(room({ light: false }), 190, 960, lerp(1.6, 1.9, c.k), wob(c.t) * 10) + spotlight(190 + wob(c.t, 2) * 60, 960, 420, .95) + warmBeam(190, 960, 300, .2), hud: 1, label: 'ПУСТО' }),
  chat_corridor: (c) => { const msgs = [{ n: 'user_0333', m: 'он ушёл', red: true, big: true }, { n: 'user_0334', m: 'в коридор', red: true, big: true }, { n: 'user_0335', m: 'он в коридоре', red: true, big: true }, { n: 'user_0336', m: 'не выходи', red: true, big: true }]; return { body: cam(streamer({ t: c.t, light: false, tyoma: { t: c.t, f: c.f, emo: 'terrified' } }), 850, 900, 1.5) + chatPanel(c.t, msgs.slice(0, 1 + Math.floor(c.lt * 2)), { x: 60, y: 1100, w: 960, h: 420 }) + liveBar(c.t, 5000), hud: 1 }; },
  mouse_end: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#0b0d12"/><g transform="translate(540 900)"><rect x="-420" y="-260" width="840" height="520" rx="20" fill="#1b1e27"/><text y="-120" text-anchor="middle" font-size="52" style="${RUB}" font-weight="900" fill="#fff">Завершить трансляцию?</text>
    <rect x="-330" y="20" width="300" height="110" rx="20" fill="#e91916"/><text x="-180" y="92" text-anchor="middle" font-size="44" style="${RUB}" font-weight="900" fill="#fff">Завершить</text>
    <rect x="30" y="20" width="300" height="110" rx="20" fill="#3a3f4f"/><text x="180" y="92" text-anchor="middle" font-size="44" style="${RUB}" font-weight="900" fill="#fff">Отмена</text>
    <path transform="translate(${lerp(300, -170, ease(c.lt / 1.2))} ${lerp(300, 80, ease(c.lt / 1.2))})" d="M0 0 L0 70 L18 54 L32 84 L44 78 L30 50 L54 50Z" fill="#fff" stroke="#000" stroke-width="4"/></g>`, hud: 1 }),
  don_10k: (c) => ({ body: streamer({ t: c.t, light: false, tyoma: { t: c.t, f: c.f, emo: 'terrified' } }) + liveBar(c.t, 7777) + donation(c.t, c.lt, 'Аноним', '10 000 ₽', c.lt < 2.2 ? 'не выключай' : 'если выключишь — он зайдёт'), hud: 1, glitch: hash(c.f) > .93 ? .4 : 0 }),
  call_lyoha: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#0b0d12"/><circle cx="540" cy="620" r="120" fill="#f2c230"/><text x="540" y="660" text-anchor="middle" font-size="110" style="${RUB}" font-weight="900" fill="#d63a35">Л</text>
    <text x="540" y="840" text-anchor="middle" font-size="64" style="${RUB}" font-weight="900" fill="#fff">Лёха</text><text x="540" y="920" text-anchor="middle" font-size="40" style="${RUB}" font-weight="800" fill="#ff6a75">Абонент не отвечает</text>`, hud: 1 }),
  chat_lyoha_door: (c) => ({ body: cam(streamer({ t: c.t, light: false, doorOpen: true, tyoma: { t: c.t, f: c.f, emo: 'scared', talk: false } }), 540, 950, 1.1) + chatPanel(c.t, [{ n: 'Лёха', m: 'бро я смотрю', big: true, c: '#f2c230' }, { n: 'Лёха', m: 'у тебя дверь за спиной открыта', big: true, c: '#f2c230' }], { x: 40, y: 1150, w: 1000, h: 260 }) + liveBar(c.t, 7777), hud: 1, label: 'ЛЁХА В ЧАТЕ' }),
  door_closed: (c) => ({ body: cam(room({ light: false }), 850, 900, lerp(1.3, 1.5, c.k), (hash(c.f) - .5) * 6) + spotlight(850, 900, 600, .8, '#01020a'), hud: 1, label: 'ДВЕРЬ ЗАКРЫТА' }),
  preview_door: (c) => ({ body: previewMonitor(pv({ t: c.t, light: false, doorOpen: true, tyoma: { t: c.t, f: c.f, talk: false, emo: 'scared' } })) + dark(.1), hud: 1, label: 'НА ПРЕВЬЮ ДВЕРЬ ОТКРЫТА' }),
  door_creak: (c) => { const o = clamp((c.lt - .5) / 1.2); return { body: cam(room({ light: false, doorOpen: o > .5 }), 850, 900, 1.35, (hash(c.f) - .5) * 4) + spotlight(850, 900, 600, .8, '#01020a'), hud: 1, glitch: o > .45 && o < .6 ? .7 : 0 }; },
  realize: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#07040c"/><g style="${MONO}" font-weight="800"><text x="540" y="900" text-anchor="middle" font-size="150" fill="#ff2f3f">+10 СЕК</text><text x="540" y="1040" text-anchor="middle" font-size="54" fill="#fff">стрим показывает будущее</text></g>`, hud: 1, glitch: hash(c.f) > .85 ? .4 : 0 }),
  preview_shadow: (c) => ({ body: previewMonitor(pv({ t: c.t, light: false, doorOpen: true, shadow: clamp(c.lt / 1.5), sx: lerp(850, 700, ease(c.lt / 2.5)), sy: lerp(1420, 1560, ease(c.lt / 2.5)), tyoma: { t: c.t, f: c.f, talk: false, emo: 'scared' } })), hud: 1, label: 'ТЕНЬ ВОШЛА' }),
  countdown: (c) => ({ body: previewMonitor(pv({ t: c.t, light: false, doorOpen: true, shadow: 1, sx: 700, sy: 1560, tyoma: { t: c.t, f: c.f, talk: false, emo: 'scared' } })) + countdownNum(c.lt), hud: 1, label: 'ЧЕРЕЗ 10 СЕКУНД' }),
  under_table: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#020306"/><rect y="0" width="${W}" height="420" fill="#0d0f14"/><path d="M80 420 v1500 M1000 420 v1500" stroke="#14161c" stroke-width="40"/>` + tm({ x: 540, y: 1900, s: 1.35, emo: 'terrified', t: c.t, f: c.f }) + `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".1" style="mix-blend-mode:screen"/>` + spotlight(540, 1000, 700, .85, '#01020a'), hud: 1, label: 'ПОД СТОЛОМ' }),
  preview_self: (c) => ({ body: previewMonitor(pv({ t: c.t, light: false, doorOpen: true, shadow: 1, sx: 700, sy: 1560, tyoma: { t: c.t, f: c.f, talk: false, emo: 'neutral' } })), hud: 1, label: 'НО ТЁМА ПОД СТОЛОМ…', glitch: hash(c.f) > .9 ? .3 : 0 }),
  preview_smile: (c) => {
    const hands = `<path d="M380 1120 q60 -30 140 0 M700 1120 q-60 -30 -140 0" stroke="#000" stroke-width="40" stroke-linecap="round"/>`;
    return { body: previewMonitor(pv({ t: c.t, light: false, doorOpen: true, shadow: 1, sx: 560, sy: 1560, hands: c.lt > .8 ? hands : '', tyoma: { t: c.t, f: c.f, talk: false, emo: 'neutral', mouth: c.lt > 2 ? 2 : 0, headRot: c.lt > 2 ? 6 : 0 } })) + (c.lt > 2 ? dark(.1) : ''), hud: 1, glitch: c.lt > 2 && c.lt < 2.2 ? .8 : 0, label: 'ОН УЛЫБНУЛСЯ' };
  },
  under_table_dark: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#010103"/>` + tm({ x: 540, y: 1900, s: 1.35, emo: 'terrified', t: c.t, f: c.f, talk: false }) + `<rect width="${W}" height="${H}" fill="#000" opacity=".55"/>` + `<g opacity="${clamp((c.lt - .3) * 2)}"><rect x="660" y="0" width="70" height="300" fill="#000"/><ellipse cx="695" cy="300" rx="60" ry="20" fill="#000"/></g>` + spotlight(540, 1000, 600, .9, '#01020a'), hud: 1 }),
  plug: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#0b0b0d"/><rect x="200" y="1100" width="680" height="140" rx="20" fill="#e8e4dc" stroke="#000" stroke-width="6"/>${[0, 1, 2, 3].map(i => `<circle cx="${300 + i * 160}" cy="1170" r="34" fill="#222"/>`).join('')}
    <g transform="translate(${300 + (c.lt > .3 ? 0 : 0)} ${1170 - ease(clamp(c.lt / .4)) * 300})"><rect x="-50" y="-130" width="100" height="130" rx="20" fill="#1d1d22"/><path d="M0 -130 C0 -300 200 -400 300 -600" stroke="#1d1d22" stroke-width="24" fill="none"/></g>` + (c.lt > .4 ? dark(.6) : ''), hud: 1 }),
  morning: (c) => ({ body: drift(c, room({}) + `<rect width="${W}" height="${H}" fill="#ffcf8a" opacity=".25" style="mix-blend-mode:screen"/>` + desk(), 540, 1000, 1.0, 1.06), hud: 1, label: 'УТРО' }),
  lyoha_door: (c) => ({ body: drift(c, room({ doorOpen: true }) + `<rect width="${W}" height="${H}" fill="#ffcf8a" opacity=".2" style="mix-blend-mode:screen"/>` + lh({ x: 760, y: 1900, s: 1.25, t: c.t, f: c.f }) + `<g transform="translate(940 1500) rotate(12)"><rect x="-80" y="-120" width="160" height="220" rx="16" fill="#e92b2b" stroke="#000" stroke-width="6"/><text y="10" text-anchor="middle" font-size="44" style="${RUB}" font-weight="900" fill="#ffd23f">ЧИПСЫ</text></g>`, 700, 1000, 1.0, 1.05), hud: 1 }),
  tyoma_confused: (c) => ({ body: drift(c, room({}) + `<rect width="${W}" height="${H}" fill="#ffcf8a" opacity=".2" style="mix-blend-mode:screen"/>` + tm({ t: c.t, f: c.f, emo: 'scared' }), 540, 960, 1.0, 1.05), hud: 1, label: 'ЛЁХА НЕ ДОНАТИЛ?' }),
  lyoha_confused: (c) => ({ body: drift(c, room({ doorOpen: true }) + lh({ t: c.t, f: c.f, emo: 'scared' }), 540, 960, 1.0, 1.05), hud: 1, label: 'ТЕЛЕФОН СЕЛ В 21:00' }),
  channel: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#0b0d12"/><circle cx="540" cy="420" r="120" fill="#3f7d68"/><text x="540" y="460" text-anchor="middle" font-size="110" style="${RUB}" font-weight="900" fill="#fff">Т</text>
    <text x="540" y="620" text-anchor="middle" font-size="56" style="${RUB}" font-weight="900" fill="#fff">@tyoma.rasskazhet</text>
    <g transform="translate(140 760)"><rect width="800" height="460" rx="20" fill="#1b1e27"/><rect x="20" y="20" width="250" height="70" rx="10" fill="#e91916"/><text x="145" y="70" text-anchor="middle" font-size="40" style="${RUB}" font-weight="900" fill="#fff">LIVE</text>
    <text x="400" y="260" text-anchor="middle" font-size="64" style="${MONO}" font-weight="800" fill="#fff">31:12:0${Math.floor(c.t) % 10}</text><text x="400" y="360" text-anchor="middle" font-size="38" style="${RUB}" font-weight="800" fill="#9aa3b5">стрим идёт</text></g>`, hud: 1, label: 'КАНАЛ ТЁМЫ' }),
  live_room: (c) => {
    const k = ease(clamp(c.lt / 2.5));
    const onScreen = `<rect width="1080" height="1920" fill="#000"/>` + streamer({ t: c.t, light: false, doorOpen: true, tyoma: { t: c.t, f: c.f, talk: false, emo: 'neutral', mouth: 2, headRot: 6 } }) + liveBar(c.t, 1) + `<g style="${RUB}" font-weight="900"><text x="540" y="1760" text-anchor="middle" font-size="64" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">Зрителей: 1</text></g>`;
    const realRoom = room({ doorOpen: true }) + `<rect width="${W}" height="${H}" fill="#ffcf8a" opacity=".15" style="mix-blend-mode:screen"/>` + desk() + `<g transform="translate(540 1500)"><rect x="-140" y="-260" width="280" height="300" rx="30" fill="#2b2d33" stroke="#000" stroke-width="6"/><rect x="-160" y="40" width="320" height="50" fill="#1d1f24"/></g>`;
    const phone = `<g transform="translate(${lerp(540, 620, k)} ${lerp(1100, 1250, k)}) scale(${lerp(1.0, .72, k)}) rotate(${lerp(0, -4, k)})"><rect x="-360" y="-640" width="720" height="1280" rx="60" fill="#111" stroke="#2b2f3a" stroke-width="14"/><clipPath id="phc"><rect x="-330" y="-610" width="660" height="1220" rx="40"/></clipPath><g clip-path="url(#phc)"><g transform="translate(-330 -610) scale(${660 / 1080} ${1220 / 1920})">${onScreen}</g></g></g>`;
    return { body: realRoom + `<g opacity="${k}">${dark(0)}</g>` + phone, hud: 1, label: k > .6 ? 'СТУЛ ПУСТОЙ' : 'LIVE · 31:12:07', glitch: c.lt > 2.6 && hash(c.f) > .8 ? .5 : 0 };
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
function hudTimer(t) {
  if (t < SC.start.start || t >= SC.dawn.start) return '';
  const p = [['start', 0], ['two', 5 * 3600], ['don', 5 * 3600 + 40 * 60], ['dontoff', 6 * 3600 + 10 * 60], ['ten', 6 * 3600 + 30 * 60], ['table', 6 * 3600 + 40 * 60], ['dawn', 9 * 3600]];
  let s = 0;
  for (let i = 0; i < p.length - 1; i++) if (t >= SC[p[i][0]].start && t < SC[p[i + 1][0]].start) s = lerp(p[i][1], p[i + 1][1], (t - SC[p[i][0]].start) / (SC[p[i + 1][0]].start - SC[p[i][0]].start));
  s = Math.round(s);
  const txt = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `<g style="${MONO}" font-weight="800"><rect x="60" y="148" width="440" height="58" rx="12" fill="#000" fill-opacity=".65" stroke="#9b5cff" stroke-width="3"/>
    <circle cx="92" cy="177" r="10" fill="#ff2f3f"/><text x="115" y="190" font-size="32" fill="#e0d0ff">В ЭФИРЕ · ${txt}</text></g>`;
}
const LABELS = {
  stream_start: 'СТАРТ СТРИМА', viewers3: 'ЗРИТЕЛЕЙ: 3', don_light: 'ДОНАТ', don_wardrobe: 'ДОНАТ', don_10k: '10 000 ₽', chat_users: 'НОВЫЕ ЗРИТЕЛИ', viewers_jump: '02:00',
  mouse_end: 'ЗАКОНЧИТЬ СТРИМ', call_lyoha: 'ЛЁХА НЕ БЕРЁТ', realize: 'СТРИМ ОПЕРЕЖАЕТ НА 10 СЕКУНД', door_creak: 'СКРИП', under_table_dark: 'СКРИП У СТОЛА', plug: 'ВЫДЕРНУЛ ПРОВОД',
  lyoha_door: 'ПРИШЁЛ ЛЁХА',
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

const KEY2 = ['тёма,', 'стрим', 'стрим!', 'лимон', 'сотку', 'зевнул.', 'тысяча.', 'аккаунты.', 'смотрели.', 'реки!', 'свет.', 'шкафу.', 'шкафом?', 'пусто.', 'коридор.', 'выключай.', 'зайдёт.', 'открыта.', 'закрыта.', 'превью', 'скрип.', 'будет.', 'тень.', 'стулом.', 'столом.', 'стуле.', 'плечи.', 'улыбнулся', 'провод.', 'донатил...', 'сел.', 'шёл.', 'канал.', 'варей.', 'варя', 'варю', 'радионяня', 'радионяне', 'дышал.', 'засмеялась.', 'карусель', 'сама.', 'фигура', 'фигура.', 'качала', 'пусто.', 'губам.', 'сообщение.', 'знаю.', 'коридора.', 'ушли.', 'пела.', 'приложение.', 'кроваткой?', 'колыбельную?', 'умерла', 'рождения.', 'эфир.', 'камеру.', 'бабушки', 'бабушка', 'бабушки.', 'огород.', 'огорода', 'зеркала', 'замка.', 'сквозняков.', 'подпол.', 'подпол', 'правило.', 'записок.', 'деда', 'деда?', 'упала...', 'спала.', 'калитка.', 'стеклу.', 'дом.', 'открыты.', 'утра.', 'блины.', 'умерла', 'сутки.', 'телефона.', 'никогда', 'рыбы', 'рыбы.', 'дохлых', 'кругами', 'грузовик', 'светилась', 'тень', 'погас', 'хребет', 'голова', 'рёва', 'окна', 'сирены', 'мост', 'мама', 'больнице', 'к', 'него', 'второй', 'объект', 'закрывал', 'убегал', 'закипела', 'тёмное', 'днём', 'маму', 'глаз', 'помочь', 'спиной', '33', '33-й', '03:33', '03:34', 'шестеро', 'детей', 'медсестру', 'камеру', 'камеру.', 'моргнул', 'постанова', 'правила', 'глаза', 'не', 'один', 'дима', 'заправлены', 'кроме', 'двоих', 'лёха', 'пусто', 'смене', 'побежал', 'сообщение', 'обход', 'спят'];
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
  if (sub.style === 'donate') fill = '#d0b0ff';
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
