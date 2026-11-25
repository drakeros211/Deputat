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
  const blink = blinkAt(o.t, p === 'L' ? 0.7 : 0) && emo !== 'stare' && emo !== 'terrified';
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

// ------------------------------------------------------------ ШОТЫ «Глубинный»
function mon(x, y, s, glow = .7, o = {}) {
  const br = 1 + Math.sin((o.t || 0) * 1.1) * .006;
  return `<g transform="translate(${x} ${y}) rotate(${o.rot || 0}) scale(${s * (o.flip ? -1 : 1)} ${s * br}) translate(-500 -1700)" opacity="${o.op ?? 1}">
    ${A.MON}${o.dark ? `<path d="M0 0 H1000 V1700 H0Z" fill="#000" opacity="${o.dark}"/>` : ''}
    <g filter="url(#glow)" opacity="${glow}">${A.MON_DOTS}</g></g>`;
}
function rain(t, op = .35, n = 70) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (hash(i) * 1300 + t * 260) % 1300 - 110, y = (hash(i + 99) * 2100 + t * 1900 * (0.8 + hash(i + 3) * .4)) % 2100 - 100;
    s += `<line x1="${x}" y1="${y}" x2="${x - 14}" y2="${y + 60}" stroke="#bcd4ff" stroke-width="2" opacity="${op}"/>`;
  }
  return s;
}
function waterGlow(t, x = 540, y = 1400, r = 600, op = .5) {
  const g = id('wg'); const p = .7 + .3 * Math.sin(t * 2.3);
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${x}" cy="${y}" r="${r}"><stop offset="0" stop-color="#7fe9ff" stop-opacity="${op * p}"/><stop offset="1" stop-color="#1a6fa0" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${x}" cy="${y}" rx="${r * 1.4}" ry="${r * .5}" fill="url(#${g})"/>`;
}
function bubbleField(t, y0 = 1200, y1 = 1900, n = 30, sc = 1) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const ph = (t * (0.6 + hash(i) * .8) + hash(i + 7)) % 1;
    const x = hash(i + 1) * 1080, y = lerp(y1, y0, ph), r = (6 + hash(i + 2) * 22) * sc * (0.4 + ph);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#bff6ff" stroke-width="3" opacity="${(1 - ph) * .7}"/>`;
  }
  return s;
}
function phoneAlert(t, lt, title = 'ЭКСТРЕННОЕ ОПОВЕЩЕНИЕ', body = ['НЕ ПОДХОДИТЕ', 'К ОКНАМ.', 'Оставайтесь дома.']) {
  const pulse = Math.floor(t * 3) % 2;
  return `<rect width="${W}" height="${H}" fill="#120203"/>
    <g transform="translate(540 980) rotate(-4)">
      <rect x="-360" y="-700" width="720" height="1400" rx="70" fill="#0b0b0d"/>
      <rect x="-330" y="-670" width="660" height="1340" rx="50" fill="${pulse ? '#a3121b' : '#8a0f17'}"/>
      <text x="-280" y="-560" font-size="40" style="${RUB}" font-weight="800" fill="#ffd0d0">МЧС РОССИИ</text>
      <text x="0" y="-460" text-anchor="middle" font-size="120" style="${RUB}" font-weight="900" fill="#fff">⚠</text>
      <text x="0" y="-340" text-anchor="middle" font-size="46" style="${RUB}" font-weight="900" fill="#fff">${title}</text>
      ${body.map((b, i) => `<text x="0" y="${-160 + i * 120}" text-anchor="middle" font-size="${i < 2 ? 92 : 50}" style="${RUB}" font-weight="900" fill="${i === 1 ? '#ffd23f' : '#fff'}">${b}</text>`).join('')}
      <text x="0" y="560" text-anchor="middle" font-size="36" style="${RUB}" font-weight="800" fill="#ffd0d0">03:12 · сейчас</text>
    </g>
    <path d="M150 1900 C150 1700 260 1560 380 1520 L700 1520 C820 1560 930 1700 930 1900Z" fill="#e8b48c" stroke="#1d1a1c" stroke-width="6"/>`;
}
function shards(t, lt, n = 40) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x0 = hash(i) * 1080, y0 = 400 + hash(i + 5) * 900;
    const vx = (hash(i + 9) - .5) * 900, vy = -200 - hash(i + 4) * 500;
    const x = x0 + vx * lt, y = y0 + vy * lt + 900 * lt * lt, r = lt * 400 * (hash(i) - .5);
    const sz = 10 + hash(i + 2) * 40;
    s += `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 0 l${sz} ${sz * .3} l${-sz * .4} ${sz}z" fill="#cfefff" opacity="${clamp(1 - lt * .6) * .85}" stroke="#fff" stroke-width="2"/>`;
  }
  return s;
}
function cracks(op = 1) {
  return `<g stroke="#fff" stroke-width="3" fill="none" opacity="${op * .7}"><path d="M540 900 L300 600 L120 520 M540 900 L860 560 L1000 300 M540 900 L620 1300 L560 1700 M540 900 L200 1100 L60 1400 M540 900 L900 1150 M300 600 L260 380 M860 560 L960 700"/></g>`;
}
function emergencyLights(t, op = .25) {
  const a = Math.sin(t * 9) > 0;
  return `<rect width="${W}" height="${H}" fill="${a ? '#ff1a2a' : '#1a4bff'}" opacity="${op}" style="mix-blend-mode:screen"/>`;
}
function newsUI(t) {
  return `<g style="${RUB}" font-weight="900"><rect x="40" y="1560" width="1000" height="140" fill="#b3101a"/><rect x="40" y="1560" width="230" height="140" fill="#fff"/>
    <text x="155" y="1648" text-anchor="middle" font-size="48" fill="#b3101a">LIVE</text>
    <text x="300" y="1620" font-size="40" fill="#fff">ЭКСТРЕННО</text>
    <text x="300" y="1675" font-size="34" fill="#ffd6d6">Второй объект в водохранилище</text></g>`;
}
function radar(t, lt) {
  const sweep = (t * 120) % 360;
  const d2 = lerp(330, 170, clamp(lt / 3));
  let s = `<rect width="${W}" height="${H}" fill="#020a06"/><g transform="translate(540 860)">`;
  for (let r = 100; r <= 400; r += 100) s += `<circle r="${r}" fill="none" stroke="#1fa35a" stroke-width="3" opacity=".6"/>`;
  s += `<line x1="-420" y1="0" x2="420" y2="0" stroke="#1fa35a" opacity=".4" stroke-width="2"/><line x1="0" y1="-420" x2="0" y2="420" stroke="#1fa35a" opacity=".4" stroke-width="2"/>
    <path d="M0 0 L${420 * Math.cos(sweep * Math.PI / 180)} ${420 * Math.sin(sweep * Math.PI / 180)} A420 420 0 0 0 ${420 * Math.cos((sweep - 30) * Math.PI / 180)} ${420 * Math.sin((sweep - 30) * Math.PI / 180)}Z" fill="#2cff8a" opacity=".18"/>
    <circle cx="-40" cy="60" r="22" fill="#7fe9ff"/><text x="-10" y="120" font-size="30" style="${MONO}" font-weight="800" fill="#7fe9ff">ОБЪЕКТ 1 · 87 м</text>
    <circle cx="${d2 * .4}" cy="${-d2}" r="${66 + Math.sin(t * 6) * 6}" fill="#ff2a3a" opacity=".85"/>
    <text x="${d2 * .4 + 80}" y="${-d2 + 10}" font-size="30" style="${MONO}" font-weight="800" fill="#ff6a75">ОБЪЕКТ 2 · 260 м</text></g>`;
  return s + newsUI(t);
}
function momChat(t, lt) {
  const b = easeBack((lt - .2) / .3);
  return `<rect width="${W}" height="${H}" fill="#0b0d12"/><rect width="${W}" height="220" fill="#151922"/>
    <circle cx="150" cy="140" r="50" fill="#ff8fab"/><text x="150" y="160" text-anchor="middle" font-size="50" style="${RUB}" font-weight="900" fill="#fff">М</text>
    <text x="230" y="130" font-size="46" style="${RUB}" font-weight="900" fill="#fff">Мама ❤</text><text x="230" y="180" font-size="30" style="${RUB}" font-weight="800" fill="#9aa3b5">была в сети только что</text>
    <rect x="80" y="380" width="620" height="110" rx="40" fill="#262b36"/><text x="120" y="450" font-size="40" style="${RUB}" font-weight="800" fill="#fff">Тёма сиди дома!!!</text>
    <g transform="translate(80 520) scale(${clamp(b)})"><rect width="820" height="190" rx="40" fill="#262b36"/><text x="40" y="80" font-size="40" style="${RUB}" font-weight="800" fill="#fff">я в больнице, вода уже у окон</text><text x="40" y="145" font-size="40" style="${RUB}" font-weight="800" fill="#ff6a75">связь пропадает</text></g>
    <g transform="translate(540 1150)"><rect x="-300" y="-60" width="600" height="120" rx="60" fill="#c4121c"/><text y="16" text-anchor="middle" font-size="44" style="${RUB}" font-weight="900" fill="#fff">✆ Пропущенный (3)</text></g>`;
}

const SHOT = {
  alert: (c) => ({ body: `<g transform="translate(${(hash(c.f) - .5) * c.lt * 16} ${(hash(c.f + 1) - .5) * c.lt * 16})">${phoneAlert(c.t, c.lt)}</g>`, glitch: hash(c.f) > .9 ? .4 : 0 }),
  alert_shake: (c) => {
    const sh = 10 + c.k * 20;
    let b = A.BG_room + `<rect x="60" y="300" width="300" height="420" fill="#7fe9ff" opacity="${.35 + .25 * Math.sin(c.t * 3)}"/>` + waterGlow(c.t, 210, 510, 400, .6);
    b += char('T', { x: 560, y: 1780, s: 1.45, emo: 'terrified', t: c.t, f: c.f });
    return { body: cam(b, 540, 1000, lerp(1.0, 1.1, c.k), (hash(c.f) - .5) * sh, (hash(c.f + 3) - .5) * sh) + `<rect width="${W}" height="${H}" fill="#ff1a2a" opacity=".12" style="mix-blend-mode:screen"/>` + spotlight(560, 1000, 900, .7), glitch: hash(c.f * 3) > .85 ? .5 : 0 };
  },
  chance7: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#00080c"/>` + bigMeter(lerp(60, 7, easeOut(c.lt / .5)), c), glitch: c.lt < .2 || hash(c.f) > .8 ? .8 : 0, noHud: true }),
  rewind: (c) => {
    const pool = ['eye', 'glass', 'crowd', 'dark_close', 'fish', 'helis'];
    const nm = pool[Math.floor(c.lt * 9) % pool.length];
    const inner = SHOT[nm]({ ...c, lt: 1 - c.k, k: 1 - c.k, i: 0 }).body;
    let lines = ''; for (let i = 0; i < 6; i++) lines += `<rect x="0" y="${hash(c.f * 2 + i) * H}" width="${W}" height="${6 + hash(i + c.f) * 20}" fill="#fff" opacity=".25"/>`;
    return { body: `<g filter="url(#bw)">${inner}</g>${lines}<rect width="${W}" height="${H}" fill="#000" opacity=".35"/>
      <text x="540" y="860" text-anchor="middle" font-size="150" style="${RUB}" font-weight="900" fill="#fff">◀◀</text>
      <text x="540" y="1010" text-anchor="middle" font-size="90" style="${RUB};paint-order:stroke" stroke="#000" stroke-width="12" font-weight="900" fill="#fff">6 ЧАСОВ НАЗАД</text>`, noHud: true, glitch: .3 };
  },
  fish: (c) => ({ body: drift(c, A.FISH, 540, 1100, 1.0, 1.1) + dark(.1) }),
  fish_close: (c) => ({ body: cam(A.FISH, 540, 1500, lerp(1.9, 2.3, ease(c.k))) + dark(.15) + vignette(.5) }),
  radio_city: (c) => ({
    body: drift(c, `<g filter="url(#dusk)">${A.CITY_LIT}</g>`, 700, 900, 1.0, 1.06) +
      `<g transform="translate(540 1500)"><rect x="-360" y="-150" width="720" height="300" rx="30" fill="#3a2a1e" stroke="#000" stroke-width="8"/><circle cx="-200" cy="0" r="100" fill="#1e1712" stroke="#000" stroke-width="6"/>
       ${[...Array(8).keys()].map(i => `<circle cx="-200" cy="0" r="${12 + i * 11}" fill="none" stroke="#3b2e24" stroke-width="3"/>`).join('')}
       <rect x="-40" y="-90" width="340" height="90" rx="10" fill="#f0c674"/><line x1="${40 + Math.sin(c.t) * 6}" y1="-90" x2="${40 + Math.sin(c.t) * 6}" y2="0" stroke="#c4121c" stroke-width="6"/>
       <text x="130" y="-30" text-anchor="middle" font-size="40" style="${MONO}" font-weight="800" fill="#3a2a1e">102.4 FM</text>
       <circle cx="60" cy="70" r="30" fill="#1e1712"/><circle cx="220" cy="70" r="30" fill="#1e1712"/></g>`
  }),
  cup: (c) => {
    let rip = '';
    for (let i = 0; i < 5; i++) { const ph = (c.t * 1.2 + i / 5) % 1; rip += `<ellipse cx="540" cy="1000" rx="${ph * 230}" ry="${ph * 50}" fill="none" stroke="#c89a6a" stroke-width="5" opacity="${1 - ph}"/>`; }
    return { body: cam(A.CUP + rip, 540, 1050, lerp(1.2, 1.45, ease(c.k)), (hash(c.f) - .5) * 4, (hash(c.f + 2) - .5) * 4) + dark(.15) };
  },
  lyoha_kitchen: (c) => ({ body: drift(c, `<g filter="url(#blur6)">${A.CUP}</g>` + char('L', { x: 540, y: 1760, s: 1.45, emo: 'grin', t: c.t, f: c.f }), 540, 960, 1.0, 1.05) + dark(.2) }),
  embank: (c) => ({ body: drift(c, A.CITY_LIT + `<rect y="1600" width="${W * 2}" height="40" fill="#1a1d27"/>` + [...Array(14).keys()].map(i => `<rect x="${i * 90}" y="1520" width="12" height="90" fill="#1a1d27"/>`).join('') + char('T', { x: 330, y: 2280, s: .75, back: true, t: c.t, f: c.f }) + char('L', { x: 760, y: 2300, s: .82, back: true, t: c.t, f: c.f }), 600, 1100, 1.0, 1.06) + rain(c.t, .25) }),
  glow_water: (c) => ({ body: drift(c, A.CITY_LIT + waterGlow(c.t, 540, 1450, 500, .65) + bubbleField(c.t, 1250, 1900, 20), 540, 1250, 1.05, 1.15) + rain(c.t, .25) }),
  glow_close: (c) => {
    let b = `<rect width="${W}" height="${H}" fill="#031326"/>` + waterGlow(c.t, 540, 1000, 700, .8) + waterGlow(c.t + 1, 300, 1400, 400, .6) + waterGlow(c.t + 2, 800, 700, 350, .5);
    for (let i = 0; i < 8; i++) { const ph = (c.t * .5 + i / 8) % 1; b += `<ellipse cx="540" cy="1000" rx="${ph * 900}" ry="${ph * 300}" fill="none" stroke="#9ff3ff" stroke-width="3" opacity="${(1 - ph) * .5}"/>`; }
    return { body: cam(b + bubbleField(c.t, 300, 1900, 40, 1.4), 540, 960, lerp(1.0, 1.1, c.k)) };
  },
  shadow_under: (c) => ({ body: cam(`<rect width="${W}" height="${H}" fill="#02060f"/>` + char('L', { x: 540, y: 1760, s: 1.5, emo: 'scared', t: c.t, f: c.f }), 540, 960, lerp(1.0, 1.07, c.k)) + `<rect width="${W}" height="${H}" fill="#3ad0ff" opacity=".14" style="mix-blend-mode:screen"/>` + spotlight(540, 1250, 800, .85, '#01040a') + rain(c.t, .2) }),
  shadow_top: (c) => {
    let b = `<rect width="${W}" height="${H}" fill="#04213a"/>` + waterGlow(c.t, 540, 960, 900, .5);
    b += `<g transform="translate(${lerp(-500, 400, c.k)} 960) rotate(-20)"><ellipse rx="700" ry="200" fill="#000" opacity=".8" filter="url(#blur20)"/><ellipse cx="-500" rx="300" ry="60" fill="#000" opacity=".7" filter="url(#blur20)"/></g>`;
    b += `<g style="${RUB}" font-weight="900" opacity="${clamp((c.lt - .6) * 3)}"><line x1="140" y1="1500" x2="940" y2="1500" stroke="#fff" stroke-width="5"/><path d="M140 1480 v40 M940 1480 v40" stroke="#fff" stroke-width="5"/>
      <text x="540" y="1470" text-anchor="middle" font-size="44" fill="#fff">≈ 36 МЕТРОВ</text></g>`;
    return { body: b + bubbleField(c.t, 0, 1920, 25) };
  },
  blackout: (c) => {
    const k = clamp((c.lt - .5) / .9);
    let b = A.CITY_DARK + `<g opacity="${1 - k}" ${hash(Math.floor(c.t * 18)) > .5 && k > 0 ? 'visibility="hidden"' : ''}>${A.CITY_LIT}</g>`;
    return { body: drift(c, b, 600, 900, 1.0, 1.05) + rain(c.t, .2) };
  },
  ridge: (c) => {
    const up = easeOut(c.lt / 3.5);
    let b = A.CITY_DARK + `<g transform="translate(-30 ${lerp(1500, 1090, up)}) scale(1)"><g>${A.RIDGE.replace(/class="gd"/g, `opacity="${.5 + .5 * Math.sin(c.t * 3)}" filter="url(#glow)"`)}</g></g>`;
    b += `<rect y="1490" width="${W * 2}" height="500" fill="#03060d"/>` + waterGlow(c.t, 540, 1500, 500, .5) + bubbleField(c.t, 1300, 1900, 25);
    return { body: cam(b, 540, 1150, lerp(1.0, 1.12, c.k), (hash(c.f) - .5) * 10, (hash(c.f + 1) - .5) * 10) + rain(c.t, .3) };
  },
  head_rise: (c) => {
    const up = easeOut(c.lt / 2.6);
    let b = A.CITY_DARK + mon(540, lerp(3300, 2150, up), 1.15, .9, { t: c.t }) + `<rect y="1500" width="${W * 2}" height="600" fill="#03060d" opacity=".92"/>` + waterGlow(c.t, 540, 1550, 600, .6);
    return { body: cam(b, 540, lerp(1200, 800, up), 1.0, (hash(c.f) - .5) * 16, (hash(c.f + 1) - .5) * 16) + rain(c.t, .35) };
  },
  roar: (c) => {
    const open = easeOut(c.lt / .5) * (c.lt < 2.6 ? 1 : clamp(1 - (c.lt - 2.6) / .4));
    const sh = open * 30;
    let b = `<rect width="${W}" height="${H}" fill="#02050c"/>` + rain(c.t, .4);
    for (let i = 0; i < 5; i++) { const ph = (c.t * 1.5 + i / 5) % 1; b += `<circle cx="200" cy="1000" r="${ph * 1100}" fill="none" stroke="#9ff3ff" stroke-width="${8 * (1 - ph)}" opacity="${(1 - ph) * .4 * open}"/>`; }
    b += `<g transform="translate(-120 300)">${A.HEAD}<g transform="translate(40 640) rotate(${open * 28} 1040 200)">${A.JAW}</g></g>`;
    return { body: cam(b, 540, 960, lerp(1.0, 1.15, c.k), (hash(c.f) - .5) * sh, (hash(c.f + 1) - .5) * sh), glitch: open > .8 && hash(c.f) > .7 ? .5 : 0, label: 'ВЫСОТА: 87 МЕТРОВ', hud: 0, labelOnly: 1 };
  },
  glass: (c) => ({ body: cam(A.CITY_DARK + mon(800, 1600, .7, .8, { t: c.t }) + `<rect y="1150" width="${W * 2}" height="800" fill="#03060d" opacity=".9"/>`, 540, 1000, 1.05, (hash(c.f) - .5) * 20) + shards(c.t, c.lt * 1.2, 50) + cracks(clamp(c.lt * 3)) + (c.lt < .1 ? `<rect width="${W}" height="${H}" fill="#fff" opacity=".6"/>` : ''), hud: 1 }),
  sirens: (c) => ({ body: drift(c, A.CITY_DARK + mon(560, 1750, .9, .8, { t: c.t }) + `<rect y="1300" width="${W * 2}" height="700" fill="#02040a"/>`, 540, 1100, 1.0, 1.06) + emergencyLights(c.t, .2) + rain(c.t, .3), hud: 1 }),
  crowd: (c) => {
    let b = A.CITY_DARK + mon(700, 1500, .75, .8, { t: c.t }) + `<rect y="1300" width="${W * 2}" height="700" fill="#06080e"/>`;
    for (let i = 0; i < 22; i++) {
      const sp = 260 + hash(i) * 200, x = 1300 - ((c.t * sp + hash(i + 4) * 1600) % 1700), y = 1580 + hash(i + 8) * 300, sc = .7 + (y - 1580) / 300 * .8;
      b += `<g transform="translate(${x} ${y - Math.abs(Math.sin(c.t * 12 + i)) * 12}) scale(${-sc} ${sc})">${A.PERSON}</g>`;
    }
    return { body: cam(b, 540, 1200, 1.0, (hash(c.f) - .5) * 8) + emergencyLights(c.t, .18) + rain(c.t, .3), hud: 1 };
  },
  helis: (c) => {
    let b = A.CITY_DARK + mon(540, 1800, 1.0, .9, { t: c.t }) + `<rect y="1450" width="${W * 2}" height="600" fill="#02040a"/>`;
    [[200, 420, 0], [820, 320, 1], [600, 620, 2]].forEach(([x, y, i]) => {
      const xx = x + Math.sin(c.t * .8 + i) * 40, yy = y + Math.sin(c.t * 1.3 + i) * 20;
      b += `<path d="M${xx} ${yy} L${540 + (i - 1) * 150 - 120} 1300 L${540 + (i - 1) * 150 + 120} 1300Z" fill="#fff8d0" opacity=".12"/>`;
      b += `<g transform="translate(${xx} ${yy}) scale(.8)">${A.HELI.replace('class="rotor"', `transform="scale(${Math.abs(Math.sin(c.t * 40 + i))} 1)"`)}</g>`;
    });
    return { body: drift(c, b, 540, 1000, 1.0, 1.08) + rain(c.t, .3), hud: 1 };
  },
  bridge: (c) => {
    const fall = easeOut(clamp((c.lt - .3) / 1.4));
    let b = A.CITY_DARK + mon(1150, 1700, .9, .8, { t: c.t }) + `<rect y="1150" width="${W * 2}" height="800" fill="#03060d"/>`;
    b += `<clipPath id="brL"><rect x="-100" y="0" width="${700}" height="${H}"/></clipPath><clipPath id="brR"><rect x="600" y="0" width="1200" height="${H}"/></clipPath>
      <g clip-path="url(#brL)">${A.BRIDGE}</g><g clip-path="url(#brR)" transform="rotate(${fall * 22} 600 1080) translate(0 ${fall * 200})">${A.BRIDGE}</g>`;
    if (fall > .6) b += bubbleField(c.t, 1150, 1500, 25, 2);
    return { body: cam(b, 600, 1050, 1.15, (hash(c.f) - .5) * 24 * (1 - fall * .5), (hash(c.f + 1) - .5) * 24) + rain(c.t, .3), hud: 1, glitch: c.lt > .3 && c.lt < .5 ? .6 : 0 };
  },
  phone_mom: (c) => ({ body: cam(momChat(c.t, c.lt), 540, 700, lerp(1.0, 1.06, c.k)), hud: 1 }),
  lyoha_run: (c) => ({ body: cam(A.CITY_DARK + dark(.4) + char('L', { x: 540 + Math.sin(c.t * 10) * 10, y: 1760 - Math.abs(Math.sin(c.t * 10)) * 20, s: 1.45, emo: 'scared', t: c.t, f: c.f }), 540, 960, 1.0, (hash(c.f) - .5) * 10) + emergencyLights(c.t, .2) + rain(c.t, .35), hud: 1 }),
  run_to: (c) => ({ body: `<g filter="url(#mblur)">${cam(A.CITY_DARK + mon(540, 1750, lerp(.8, 1.0, c.k), 1, { t: c.t }) + `<rect y="1400" width="${W * 2}" height="700" fill="#06080e"/>` + char('T', { x: 540 + Math.sin(c.t * 9) * 20, y: 2250 - Math.abs(Math.sin(c.t * 9)) * 30, s: .9, back: true, t: c.t, f: c.f }), 540, 1100, lerp(1.0, 1.15, c.k), (hash(c.f) - .5) * 14, (hash(c.f + 2) - .5) * 14)}</g>` + rain(c.t, .4), hud: 1 }),
  radar: (c) => ({ body: radar(c.t, c.lt), hud: 1 }),
  back_view: (c) => ({ body: drift(c, A.CITY_DARK + `<rect y="1150" width="${W * 2}" height="800" fill="#03060d"/>` + mon(540, 2300, 1.3, .35, { t: c.t, dark: .35 }) + `<rect y="1550" width="${W * 2}" height="400" fill="#02050c" opacity=".95"/>` + waterGlow(c.t, 540, 1560, 600, .4), 540, 1150, 1.0, 1.07) + rain(c.t, .3), hud: 1 }),
  shield: (c) => ({ body: drift(c, A.CITY_DARK + mon(540, 1900, 1.2, .55, { t: c.t, dark: .25 }) + `<g transform="translate(140 820) scale(.75)">${A.HOSP.replace(/^<rect[^>]*>/, '')}</g>` + `<rect y="1600" width="${W * 2}" height="400" fill="#02050c"/>`, 540, 1100, 1.0, 1.06) + rain(c.t, .3), hud: 1 }),
  shield_close: (c) => ({ body: cam(A.CITY_DARK + mon(540, 2700, 2.2, .8, { t: c.t, dark: .2 }), 540, lerp(1000, 900, c.k), 1.0) + spotlight(540, 900, 1000, .5) + rain(c.t, .35), hud: 1 }),
  boil: (c) => {
    let b = `<rect width="${W}" height="${H}" fill="#04060e"/>` + `<rect y="900" width="${W}" height="1020" fill="#060c1a"/>`;
    b += `<rect y="900" width="${W}" height="1020" fill="#5a1a8a" opacity="${.15 + .1 * Math.sin(c.t * 8)}"/>` + bubbleField(c.t * 2.5, 900, 1920, 90, 1.8);
    for (let i = 0; i < 12; i++) b += `<ellipse cx="${hash(i) * W}" cy="${950 + hash(i + 3) * 900}" rx="${60 + hash(i) * 80 + Math.sin(c.t * 9 + i) * 20}" ry="${20 + hash(i + 2) * 20}" fill="#e8f4ff" opacity=".25"/>`;
    return { body: cam(b, 540, 1200, lerp(1.0, 1.1, c.k), (hash(c.f) - .5) * 10), hud: 1 };
  },
  dark_rise: (c) => {
    const up = easeOut(c.lt / 3);
    let b = `<defs><linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430"/><stop offset=".7" stop-color="#22305a"/><stop offset="1" stop-color="#3a3f6a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#skyD)"/>` + fog(c.t, 900, .12) + `<g transform="translate(-160 ${lerp(1900, 120, up)}) scale(1)">${A.DARK}</g>` + mon(540, 1900, .75, 1, { t: c.t }) + `<rect y="1500" width="${W}" height="500" fill="#02040a"/>` + waterGlow(c.t, 540, 1500, 400, .5);
    return { body: cam(b, 540, 1000, lerp(1.0, .92, c.k), (hash(c.f) - .5) * 14, (hash(c.f + 1) - .5) * 14) + rain(c.t, .3), hud: 1 };
  },
  dark_close: (c) => {
    const o = clamp(c.lt / 2);
    const b = `<defs><linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430"/><stop offset=".7" stop-color="#22305a"/><stop offset="1" stop-color="#3a3f6a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#skyD)"/>` + fog(c.t, 900, .12) + `<g transform="translate(540 960) scale(2.2) translate(-700 -900)">${A.DARK.replace('class="maw"', `transform="translate(700 860) scale(${1 + o * 1.5} 1) translate(-700 -860)"`)}</g>`;
    return { body: cam(b, 540, 960, lerp(1.0, 1.1, c.k), (hash(c.f) - .5) * 6) + grain(c.f, .2), hud: 1, glitch: hash(c.f * 3) > .85 ? .6 : 0 };
  },
  glow_max: (c) => {
    const g = clamp(c.lt / 1.6);
    const b = `<defs><linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430"/><stop offset=".7" stop-color="#22305a"/><stop offset="1" stop-color="#3a3f6a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#skyD)"/>` + fog(c.t, 900, .12) + `<g transform="translate(-160 120)">${A.DARK}</g>` + `<g filter="url(#glow)">${mon(540, 1900, .8, 1, { t: c.t })}</g>` + waterGlow(c.t, 540, 1100, 900 + g * 600, .4 + g * .6);
    return { body: cam(b, 540, 1000, 1.0, (hash(c.f) - .5) * g * 30, (hash(c.f + 1) - .5) * g * 30) + `<rect width="${W}" height="${H}" fill="#bff6ff" opacity="${g * .55}" style="mix-blend-mode:screen"/>`, hud: 1 };
  },
  impact: (c) => {
    const k = c.lt;
    let b = `<defs><linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430"/><stop offset=".7" stop-color="#22305a"/><stop offset="1" stop-color="#3a3f6a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#skyD)"/>` + fog(c.t, 900, .12) + `<g transform="translate(-160 120)">${A.DARK}</g>` + mon(540, 1900, .8, 1, { t: c.t });
    b += `<circle cx="540" cy="900" r="${k * 1800}" fill="none" stroke="#e8fdff" stroke-width="${80 * (1 - clamp(k))}" opacity="${clamp(1 - k)}"/>`;
    b += shards(c.t, k * 1.5, 60);
    const fl = k < .25 ? 1 - k * 4 : 0;
    return { body: cam(b, 540, 960, 1.0, (hash(c.f) - .5) * 60 * clamp(1.5 - k), (hash(c.f + 1) - .5) * 60 * clamp(1.5 - k)) + `<rect width="${W}" height="${H}" fill="#fff" opacity="${fl}"/>`, hud: 1, glitch: k < .6 ? 1 : 0 };
  },
  cover_mom: (c) => ({ body: cam(`<g filter="url(#bw)">${A.HOSP}</g>` + `<rect width="${W}" height="${H}" fill="#bff6ff" opacity=".55" style="mix-blend-mode:screen"/>` + `<g filter="url(#silhouette)">${char('T', { x: 540, y: 2200, s: 1.2, back: true, t: c.t, f: c.f })}</g>`, 540, 1100, lerp(1.0, 1.08, c.k), (hash(c.f) - .5) * 12) + dust(c.t, 540, 900, 600, 40), hud: 1 }),
  silence: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#000"/>` + `<g opacity="${clamp(c.lt / 1.2) * .6}">${A.BG_room}</g>`, hud: 1 }),
  alert2: (c) => ({ body: `<g opacity="${clamp(c.lt / .3)}">${phoneAlert(c.t, c.lt, 'ПОВТОРНОЕ ОПОВЕЩЕНИЕ')}</g>` + dark(.25), hud: 1 }),
  to_window: (c) => {
    const k = ease(c.k);
    const outside = `<rect width="${W}" height="${H}" fill="#04131c"/>` + waterGlow(c.t, 540, 960, 700 + k * 300, .4 + k * .4);
    return { body: cam(outside + A.WINDOW + char('T', { x: 540, y: lerp(2600, 2350, k), s: lerp(1.0, 1.35, k), back: true, t: c.t, f: c.f }), 540, 960, lerp(1.0, 1.1, k)) + dark(.2), hud: 1 };
  },
  eye: (c) => {
    const open = easeOut(c.lt / .9);
    const pupil = lerp(.35, 1, open);
    const e = A.EYE.replace('class="pupil"', `transform="translate(540 960) scale(${pupil} 1) translate(-540 -960)"`);
    const lid = `<rect x="0" y="0" width="${W}" height="${(1 - open) * 960}" fill="#141a1c"/><rect x="0" y="${960 + open * 960}" width="${W}" height="${(1 - open) * 960}" fill="#141a1c"/>`;
    return { body: cam(e + lid, 540, 960, 1.15) + A.WINDOW + `<rect width="${W}" height="${H}" fill="#7fe9ff" opacity=".08" style="mix-blend-mode:screen"/>`, hud: 1, glitch: c.lt < .1 ? .6 : 0 };
  },
  eye_close: (c) => {
    const pupil = lerp(1, .45, ease(c.k));
    const e = A.EYE.replace('class="pupil"', `transform="translate(540 960) scale(${pupil} 1) translate(-540 -960)"`);
    return { body: cam(e, lerp(540, 640, ease(c.k)), lerp(960, 840, ease(c.k)), lerp(1.2, 2.6, ease(c.k)), (hash(c.f) - .5) * 4) + `<rect width="${W}" height="${H}" fill="#7fe9ff" opacity=".06" style="mix-blend-mode:screen"/>`, hud: 1 };
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
    <text x="0" y="0" font-size="34" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="6">ШАНС ВЫЖИТЬ</text>
    <rect x="0" y="18" width="760" height="30" rx="15" fill="#000" fill-opacity=".6" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>
    <rect x="4" y="22" width="${752 * m.v / 100}" height="22" rx="11" fill="${col}"/>
    <text x="960" y="44" text-anchor="end" font-size="64" fill="${col}" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">${Math.round(m.v)}%</text></g>
    ${flashOp ? `<rect width="${W}" height="${H}" fill="#ff0000" opacity="${flashOp * .35}"/>` : ''}`;
}
function hudTimer(t, big) {
  const sid = sceneOf(t);
  if (!['panic', 'twist', 'fight'].includes(sid)) return '';
  return `<g style="${RUB}" font-weight="900"><rect x="60" y="148" width="300" height="58" rx="12" fill="#c4121c" opacity="${Math.floor(t * 2) % 2 ? 1 : .7}"/><text x="210" y="189" text-anchor="middle" font-size="32" fill="#fff">● ЭВАКУАЦИЯ</text></g>`;
}
const LABELS = {
  glass: 'ВСЕ ОКНА НА НАБЕРЕЖНОЙ ВЫБИТЫ', sirens: 'СИРЕНЫ ПО ВСЕМУ ГОРОДУ', crowd: 'ЛЮДИ БЕГУТ', helis: 'ВОЕННЫЕ ВЕРТОЛЁТЫ', bridge: 'МОСТ РУШИТСЯ',
  phone_mom: 'МАМА В БОЛЬНИЦЕ У ВОДЫ', lyoha_run: 'ЛЁХА В ПАНИКЕ', run_to: 'ТЁМА БЕЖИТ К МОНСТРУ', radar: 'ВТОРОЙ ОБЪЕКТ', back_view: 'ОН НЕ НАПАДАЕТ',
  shield: 'ОН ЗАКРЫВАЕТ ГОРОД', shield_close: 'ОН ЧЕГО-ТО БОИТСЯ', boil: 'ВОДА КИПИТ', dark_rise: 'ОБЪЕКТ №2 · 260 М', dark_close: 'ОБЪЕКТ №2 · 260 М',
  glow_max: 'СХВАТКА', impact: 'УДАРНАЯ ВОЛНА', cover_mom: 'ТЁМА ЗАКРЫВАЕТ МАМУ', silence: 'ТИШИНА', to_window: 'НЕ ПОДХОДИ К ОКНУ', eye: 'ОН У НАШЕГО ОКНА', eye_close: 'ОН У НАШЕГО ОКНА',
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
    <text y="-120" text-anchor="middle" font-size="76" fill="#fff">ШАНС ВЫЖИТЬ</text>
    <rect x="-420" y="-60" width="840" height="70" rx="35" fill="#000" stroke="#fff" stroke-width="5"/>
    <rect x="-412" y="-52" width="${824 * v / 100}" height="54" rx="27" fill="${col}"/>
    <text y="210" text-anchor="middle" font-size="240" fill="${col}" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="14">${Math.round(v)}%</text></g>`;
}

const KEY2 = ['рыбы', 'рыбы.', 'дохлых', 'кругами', 'грузовик', 'светилась', 'тень', 'погас', 'хребет', 'голова', 'рёва', 'окна', 'сирены', 'мост', 'мама', 'больнице', 'к', 'него', 'второй', 'объект', 'закрывал', 'убегал', 'закипела', 'тёмное', 'днём', 'маму', 'глаз', 'помочь', 'спиной', '33', '33-й', '03:33', '03:34', 'шестеро', 'детей', 'медсестру', 'камеру', 'камеру.', 'моргнул', 'постанова', 'правила', 'глаза', 'не', 'один', 'дима', 'заправлены', 'кроме', 'двоих', 'лёха', 'пусто', 'смене', 'побежал', 'сообщение', 'обход', 'спят'];
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
