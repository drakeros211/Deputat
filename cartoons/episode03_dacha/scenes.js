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

// ------------------------------------------------------------ ШОТЫ «Дача у бабушки»
window.METER_TITLE = 'ШАНС ДОЖИТЬ ДО РАССВЕТА';
const gr = (o) => char('B', Object.assign({ x: 540, y: 1760, s: 1.45, emo: 'smile', t: 0, f: 0 }, o));
const tm = (o) => char('T', Object.assign({ x: 540, y: 1760, s: 1.45, emo: 'neutral', t: 0, f: 0 }, o));
const warmTint = (op = .12) => `<rect width="${W}" height="${H}" fill="#ffb060" opacity="${op}" style="mix-blend-mode:screen"/>`;
const nightTint = (op = .35) => `<rect width="${W}" height="${H}" fill="#050a1a" opacity="${op}"/>`;
function paper(lines, reveal, hl = -1) {
  let s = `<rect width="${W}" height="${H}" fill="#3a2716"/><g transform="rotate(-3 540 960)"><rect x="110" y="260" width="860" height="1400" fill="#efe6cf"/>
    <rect x="110" y="260" width="860" height="1400" fill="#a6844a" opacity=".12"/>
    <text x="540" y="400" text-anchor="middle" font-size="96" style="${CAV}" font-weight="700" fill="#1c2a4a">Тёмочке</text>`;
  for (let i = 0; i < 28; i++) s += `<line x1="150" y1="${470 + i * 42}" x2="930" y2="${470 + i * 42}" stroke="#b9c6d8" stroke-width="2"/>`;
  lines.forEach((l, i) => {
    const k = clamp(reveal - i); if (k <= 0) return;
    const cid = `pp${i}`, y = 560 + i * 250;
    s += `<clipPath id="${cid}"><rect x="0" y="${y - 90}" width="${130 + k * 900}" height="250"/></clipPath><g clip-path="url(#${cid})">` +
      l.map((ln, j) => `<text x="150" y="${y + j * 72}" font-size="64" style="${CAV}" font-weight="700" fill="${i === hl ? '#8e1010' : '#1c2a4a'}">${j === 0 ? (i + 1) + '. ' : '    '}${ln}</text>`).join('') + '</g>';
  });
  return s + '</g>';
}
const RULES_D = [['Не открывай подпол.'], ['Зовут из огорода — не отвечай.', 'Я ночью в огород не хожу.'], ['В 4 утра не смотри в окно.'], ['Постучусь — спроси,', 'как звали деда.']];
function notesPile(t, hlTyoma = 0) {
  const N = [['Не отвечай ей', -8, 170, 520], ['Она не бабушка', 6, 560, 440], ['Спроси про деда', -4, 300, 900], ['НЕ СПИ', 10, 700, 1000], ['она в огороде', -12, 160, 1300], ['не смотри в окно', 4, 600, 1380]];
  let s = `<rect width="${W}" height="${H}" fill="#140d07"/>`;
  N.forEach(([txt, r, x, y]) => s += `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-20" y="-80" width="${txt.length * 28 + 60}" height="140" fill="#e8dfc4"/><text x="10" y="10" font-size="58" style="${CAV}" font-weight="700" fill="#2a2a2a">${txt}</text></g>`);
  if (hlTyoma) s += `<g transform="translate(260 1640) rotate(-3) scale(${1 + hlTyoma * .15})"><rect x="-20" y="-90" width="600" height="150" fill="#f2ead2" stroke="#8e1010" stroke-width="6"/><text x="10" y="10" font-size="70" style="${CAV}" font-weight="700" fill="#8e1010">Тёма, 2019</text></g>`;
  return s;
}

const SHOT = {
  door_night: (c) => ({ body: cam(A.D_DOOR + nightTint(.6), 540, 960, lerp(1.05, 1.2, c.k), (hash(c.f) - .5) * 4) + `<rect x="230" y="1650" width="620" height="20" fill="#ffd98a" opacity="${.3 + .3 * Math.sin(c.t * 2)}"/>` + spotlight(540, 1500, 900, .9) }),
  chance: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#0a0303"/>` + bigMeter(lerp(60, 9, easeOut(c.lt / .5)), c), glitch: c.lt < .2 || hash(c.f) > .8 ? .8 : 0, noHud: true }),
  rewind: (c) => {
    const pool = ['grandma_behind', 'garden_dark', 'notes', 'window_scratch', 'grandma_stare', 'reflection'];
    const nm = pool[Math.floor(c.lt * 9) % pool.length];
    const inner = SHOT[nm]({ ...c, lt: 1 - c.k, k: 1 - c.k, i: 0 }).body;
    let lines = ''; for (let i = 0; i < 6; i++) lines += `<rect x="0" y="${hash(c.f * 2 + i) * H}" width="${W}" height="${6 + hash(i + c.f) * 20}" fill="#fff" opacity=".25"/>`;
    return { body: `<g filter="url(#bw)">${inner}</g>${lines}<rect width="${W}" height="${H}" fill="#000" opacity=".35"/>
      <text x="540" y="860" text-anchor="middle" font-size="150" style="${RUB}" font-weight="900" fill="#fff">◀◀</text>
      <text x="540" y="1010" text-anchor="middle" font-size="90" style="${RUB};paint-order:stroke" stroke="#000" stroke-width="12" font-weight="900" fill="#fff">24 ЧАСА НАЗАД</text>`, noHud: true, glitch: .3 };
  },
  car: (c) => ({ body: cam(A.D_CAR, 540, 960, lerp(1.0, 1.05, c.k), wob(c.t * 3) * 4, Math.abs(Math.sin(c.t * 9)) * 4), hud: 1 }),
  road_forest: (c) => ({ body: cam(A.D_FOREST, 540, lerp(1100, 1000, c.k), lerp(1.0, 1.25, c.k)) + dark(.15), hud: 1 }),
  village: (c) => ({ body: drift(c, A.D_VILLAGE, 540, 1150, 1.0, 1.1), hud: 1 }),
  no_signal: (c) => ({
    body: `<rect width="${W}" height="${H}" fill="#0b0d12"/><g transform="translate(540 900)"><rect x="-300" y="-560" width="600" height="1120" rx="60" fill="#151922" stroke="#2b2f3a" stroke-width="14"/>
      <g transform="translate(-180 -470)">${[0, 1, 2, 3].map(i => `<rect x="${i * 30}" y="${30 - i * 10}" width="20" height="${20 + i * 10}" fill="#3a4152"/>`).join('')}</g>
      <text x="0" y="-60" text-anchor="middle" font-size="64" style="${RUB}" font-weight="900" fill="#ff4a4a">Нет сети</text>
      <text x="0" y="20" text-anchor="middle" font-size="40" style="${RUB}" font-weight="800" fill="#9aa3b5">Только экстренные вызовы</text></g>`, hud: 1, glitch: hash(c.f) > .9 ? .3 : 0
  }),
  grandma_hello: (c) => ({ body: drift(c, A.D_KITCHEN + warmTint() + gr({ t: c.t, f: c.f, mouthEmo: 'smile' }), 540, 960, 1.0, 1.06), hud: 1 }),
  pies: (c) => ({ body: cam(A.D_PIES + warmTint(), 540, 1200, lerp(1.6, 1.8, c.k)), hud: 1 }),
  grandma_window: (c) => ({ body: cam(A.D_KITCHEN + warmTint() + gr({ x: 760, y: 1900, s: 1.2, t: c.t, f: c.f, emo: 'stare', headRot: 10 }), 700, 700, lerp(1.0, 1.1, c.k)) + spotlight(780, 560, 900, .5), hud: 1 }),
  mirror: (c) => ({ body: drift(c, A.D_MIRROR, 540, 800, 1.0, 1.12) + dark(.2) + spotlight(540, 800, 800, .6), hud: 1 }),
  locks: (c) => ({ body: cam(A.D_DOOR, 760, lerp(560, 1360, ease(c.k)), 1.6) + dark(.15), hud: 1 }),
  grandma_stare: (c) => ({ body: cam(A.D_KITCHEN + warmTint(.08) + gr({ t: 1.7, f: c.f, emo: 'stare', talk: true }), 540, 900, lerp(1.1, 1.35, ease(c.k))) + spotlight(540, 900, 800, .5), hud: 1 }),
  rules_paper: (c) => ({ body: drift(c, paper(RULES_D, 0), 540, 800, 1.0, 1.06) + warmBeam(540, 700, 700, .2), hud: 1 }),
  rule1: (c) => ({ body: cam(paper(RULES_D, 0 + clamp(c.lt / 1.0), 0), 540, 640, 1.25) + warmBeam(540, 600, 600, .15), hud: 1, label: 'ПРАВИЛО №1' }),
  rule2: (c) => ({ body: cam(paper(RULES_D, 1 + clamp(c.lt / 1.5), 1), 540, 870, 1.25) + warmBeam(540, 850, 600, .15), hud: 1, label: 'ПРАВИЛО №2' }),
  rule3: (c) => ({ body: cam(paper(RULES_D, 2 + clamp(c.lt / 1.0), 2), 540, 1120, 1.25) + warmBeam(540, 1100, 600, .15), hud: 1, label: 'ПРАВИЛО №3' }),
  rule4: (c) => ({ body: cam(paper(RULES_D, 3 + clamp(c.lt / 1.5), 3), 540, 1370, 1.25) + warmBeam(540, 1350, 600, .15), hud: 1, label: 'ПРАВИЛО №4' }),
  tyoma_laugh: (c) => ({ body: drift(c, A.D_KITCHEN + warmTint() + tm({ t: c.t, f: c.f, y: 1760 - Math.abs(Math.sin(c.t * 10)) * 10 }), 540, 960, 1.0, 1.05), hud: 1 }),
  grandma_stare2: (c) => ({ body: cam(A.D_KITCHEN + gr({ t: 1.7, f: c.f, emo: 'stare', talk: false }), 540, 860, lerp(1.4, 1.9, ease(c.k))) + spotlight(540, 860, 700, .75), hud: 1, glitch: c.lt < .1 ? .4 : 0 }),
  hatch: (c) => ({ body: cam(A.D_HATCH0, lerp(900, 540, ease(c.k)), 900, 1.15) + dark(.25) + spotlight(540, 950, 700, .6), hud: 1 }),
  hatch_open: (c) => {
    const o = ease(c.lt / 1.4);
    const lid = `<rect x="290" y="760" width="500" height="420" fill="#050302"/><g transform="translate(290 760) scale(1 ${1 - o})"><rect width="500" height="420" fill="#5c3f27" stroke="#1d1a1c" stroke-width="8"/><circle cx="250" cy="210" r="30" fill="none" stroke="#b7bec8" stroke-width="10"/></g>`;
    return { body: cam(A.D_HATCH0 + lid, 540, 970, lerp(1.1, 1.3, c.k)) + dark(.3) + spotlight(540, 970, 600, .8), hud: 1, label: 'ПРАВИЛО №1 НАРУШЕНО' };
  },
  cellar: (c) => ({ body: drift(c, A.D_CELLAR, 540, 1000, 1.0, 1.1) + dust(c.t, 540, 1000, 300) + warmBeam(540 + wob(c.t) * 60, 1000, 400, .25) + spotlight(540 + wob(c.t) * 60, 1000, 560, .95), hud: 1 }),
  notes: (c) => ({ body: cam(notesPile(c.t), lerp(300, 700, ease(c.k)), lerp(600, 1100, ease(c.k)), 1.3) + spotlight(lerp(300, 700, ease(c.k)), lerp(600, 1100, ease(c.k)), 500, .9), hud: 1 }),
  note_tyoma: (c) => ({ body: cam(notesPile(c.t, clamp(c.lt / .8)), 520, 1620, lerp(1.4, 1.9, ease(c.k)), (hash(c.f) - .5) * 4) + spotlight(520, 1620, 500, .9), hud: 1, glitch: c.lt > 1.2 && c.lt < 1.35 ? .6 : 0 }),
  garden_night: (c) => ({ body: drift(c, A.D_GARDEN, 540, 1000, 1.0, 1.08) + fog(c.t, 1200, .14) + dark(.2), hud: 1 }),
  garden_dark: (c) => ({ body: cam(A.D_GARDEN + fog(c.t, 1300, .2), 540, lerp(1200, 1300, c.k), lerp(1.2, 1.6, ease(c.k))) + spotlight(540, 1300, 700, .85), hud: 1, label: 'ЗОВУТ ИЗ ОГОРОДА' }),
  house_corridor: (c) => ({ body: cam(A.D_CORR, 540, 960, lerp(1.0, 1.3, ease(c.k)), wob(c.t, 1) * 6, Math.abs(Math.sin(c.t * 4)) * 8) + spotlight(540, 960, 600, .9), hud: 1 }),
  grandma_sleep: (c) => ({ body: drift(c, A.D_BED, 300, 960, 1.4, 1.5) + nightTint(.3) + spotlight(300, 950, 700, .7), hud: 1, label: 'БАБУШКА СПИТ' }),
  garden_scream: (c) => ({ body: cam(A.D_GARDEN, 540, 1250, 1.8 + c.lt * .3, (hash(c.f) - .5) * 40, (hash(c.f + 1) - .5) * 40) + `<rect width="${W}" height="${H}" fill="#ff0010" opacity="${clamp(.4 - c.lt * .4)}"/>`, hud: 1, glitch: c.lt < .4 ? 1 : 0 }),
  gate_creak: (c) => ({ body: cam(A.D_GATE + fog(c.t, 1200, .15), 540, 960, lerp(1.2, 1.35, c.k)) + spotlight(540, 960, 800, .7), hud: 1 }),
  clock4: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#020203"/><g style="${MONO}" font-weight="800"><text x="540" y="1040" text-anchor="middle" font-size="260" fill="${hash(Math.floor(c.t * 3)) > .5 ? '#ff2f3f' : '#9a1a22'}">04:00</text></g>`, hud: 1, label: 'ПРАВИЛО №3' }),
  window_scratch: (c) => {
    let fingers = '';
    const p = clamp(c.lt / 2.5);
    for (let i = 0; i < 4; i++) fingers += `<path d="M${300 + i * 40 + p * 300} 520 C${310 + i * 40 + p * 300} 700 ${300 + i * 45 + p * 300} 820 ${320 + i * 40 + p * 300} 900" stroke="#cfcac0" stroke-width="16" stroke-linecap="round" fill="none" opacity=".75"/>`;
    return { body: cam(A.D_WINDOW + `<g filter="url(#blur6)">${fingers}</g>`, 540, 860, 1.2, (hash(c.f) - .5) * 6) + spotlight(540, 860, 700, .7), hud: 1, label: 'НЕ СМОТРИ В ОКНО' };
  },
  eyes_closed: (c) => ({ body: eyelids(c.t, c.f, .3), hud: 1, label: 'ГЛАЗА ЗАКРЫТЫ' }),
  house_top: (c) => {
    const a = c.t * 1.2;
    const x = 540 + Math.cos(a) * 380, y = 960 + Math.sin(a) * 420;
    return { body: A.D_HOUSETOP + `<ellipse cx="${x}" cy="${y}" rx="60" ry="90" fill="#000" filter="url(#blur20)" transform="rotate(${a * 57} ${x} ${y})"/>` + dark(.35), hud: 1, label: 'ОНО ОБХОДИТ ДОМ' };
  },
  reflection: (c) => ({ body: cam(A.D_WINDOW_R, 540, 900, lerp(1.1, 1.5, ease(c.k))) + spotlight(540, 900, 700, .6), hud: 1, glitch: c.lt > 1.4 && hash(c.f) > .6 ? .7 : 0 }),
  door_knock: (c) => ({ body: cam(A.D_DOOR + nightTint(.6), 540, 960, 1.1, (c.lt % .35 < .06 ? (hash(c.f) - .5) * 30 : 0)) + `<rect x="230" y="1650" width="620" height="20" fill="#ffd98a" opacity=".5"/>` + spotlight(540, 1300, 900, .85), hud: 1, label: 'СТУЧАТ В ДВЕРЬ' }),
  tyoma_door: (c) => ({ body: cam(A.D_DOOR + nightTint(.6) + tm({ x: 540, y: 1800, s: 1.4, emo: 'terrified', t: c.t, f: c.f }), 540, 1000, lerp(1.0, 1.12, c.k), (hash(c.f) - .5) * 5) + spotlight(540, 1000, 800, .8), hud: 1, label: 'ПРАВИЛО №4' }),
  door_dark: (c) => ({ body: cam(A.D_DOOR + nightTint(.75), 540, 1650, lerp(1.6, 2.4, ease(c.k))) + `<rect x="230" y="1650" width="620" height="20" fill="#ffd98a" opacity=".4"/><g opacity="${clamp((c.lt - .8) * 2)}"><rect x="420" y="1645" width="60" height="25" fill="#000"/><rect x="600" y="1645" width="60" height="25" fill="#000"/></g>` + spotlight(540, 1660, 500, .9), hud: 1, glitch: c.lt > .9 && c.lt < 1.1 ? 1 : 0 }),
  chair_door: (c) => ({ body: drift(c, A.D_DOOR + `<g transform="translate(560 1150)"><rect x="-160" y="0" width="320" height="40" fill="#8a5a32" stroke="#1d1a1c" stroke-width="6"/><path d="M-140 40 v400 M140 40 v400" stroke="#6b4a2e" stroke-width="30"/><path d="M-160 0 L-200 -360 M160 0 L200 -360 M-200 -360 L200 -360" stroke="#6b4a2e" stroke-width="30"/></g>` + nightTint(.4), 540, 1100, 1.0, 1.08) + `<rect width="${W}" height="${H}" fill="#ffd9a0" opacity="${c.k * .25}" style="mix-blend-mode:screen"/>`, hud: 1 }),
  sunrise: (c) => ({ body: drift(c, A.D_VILLAGE, 540, 1150, 1.0, 1.08) + `<rect width="${W}" height="${H}" fill="#ffc070" opacity=".25" style="mix-blend-mode:screen"/>`, hud: 1 }),
  pancakes: (c) => ({ body: drift(c, A.D_PANCAKES + warmTint(.18) + gr({ x: 820, y: 1950, s: 1.0, t: c.t, f: c.f }), 600, 1100, 1.0, 1.08), hud: 1 }),
  rotary: (c) => ({ body: drift(c, A.D_CELLAR, 540, 1050, 1.3, 1.5) + warmTint(.1) + spotlight(540, 1050, 700, .7), hud: 1 }),
  rotary_close: (c) => ({ body: `<g transform="rotate(${-ease(clamp(c.lt / 1.2)) * 60} 540 1050)">${A.D_ROTARY}</g>` + dark(.2) + spotlight(540, 1050, 800, .6), hud: 1 }),
  phone_line: (c) => {
    let wave = ''; for (let i = 0; i < 60; i++) { const h = 20 + Math.abs(Math.sin(c.t * 12 + i * .7)) * 120 * (hash(i + Math.floor(c.t * 10)) * .8 + .2); wave += `<rect x="${120 + i * 14}" y="${960 - h / 2}" width="8" height="${h}" rx="4" fill="#ffb3c4"/>`; }
    return { body: `<rect width="${W}" height="${H}" fill="#0b0d12"/><circle cx="540" cy="520" r="110" fill="#ff8fab"/><text x="540" y="555" text-anchor="middle" font-size="100" style="${RUB}" font-weight="900" fill="#fff">М</text>
      <text x="540" y="720" text-anchor="middle" font-size="60" style="${RUB}" font-weight="900" fill="#fff">Мама ❤</text>` + wave, hud: 1 };
  },
  grandma_behind: (c) => {
    const ap = ease(clamp(c.lt / 1.0));
    let b = A.D_KITCHEN + warmTint(.1) + gr({ x: 760, y: lerp(2300, 1900, ap), s: 1.15, emo: 'smile', t: c.t, f: c.f }) + tm({ x: 340, y: 1900, s: 1.25, emo: 'terrified', t: c.t, f: c.f, talk: false, headRot: 8 });
    return { body: cam(b, 600, 900, lerp(1.0, 1.12, ease(c.k))) + spotlight(600, 900, 900, .55), hud: 1, label: 'ТЕБЕ ЕЩЁ СУТКИ' };
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
  const p = [['road', 24 * 3600], ['granny', 23 * 3600 + 10 * 60], ['rules', 15 * 3600], ['podpol', 13 * 3600 + 20 * 60], ['night', 5 * 3600 + 12 * 60], ['four', 2 * 3600], ['knock', 1 * 3600 + 20 * 60], ['dawn', 600]];
  const pts = p.map(([id, v]) => [SC[id].start, v]); pts.push([firstShot('sunrise'), 0]);
  if (t < pts[0][0]) return null;
  for (let i = 0; i < pts.length - 1; i++) if (t < pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return 0;
}
function hudTimer(t) {
  let s = storyLeft(t); if (s === null) return '';
  let reset = t >= firstShot('grandma_behind') + .6;
  if (reset) s = 24 * 3600;
  s = Math.max(0, Math.round(s));
  const txt = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const col = reset ? '#ff2f3f' : '#ffd0d0';
  return `<g style="${MONO}" font-weight="800" ${reset ? `transform="translate(${(hash(t * 50) - .5) * 10} 0)"` : ''}><rect x="60" y="148" width="480" height="58" rx="12" fill="#000" fill-opacity=".65" stroke="${reset ? '#ff2f3f' : '#e7b545'}" stroke-width="3"/>
    <circle cx="92" cy="177" r="10" fill="#ff2f3f"/><text x="115" y="190" font-size="32" fill="${col}">ДО РАССВЕТА · ${txt}</text></g>`;
}
const LABELS = {
  car: 'СУТКИ У БАБУШКИ', road_forest: 'СУТКИ У БАБУШКИ', village: 'ДЕРЕВНЯ НА 3 ДОМА', no_signal: 'НЕТ СВЯЗИ', grandma_window: 'СМОТРИТ НА ОГОРОД',
  mirror: 'ЗЕРКАЛА ЗАВЕШЕНЫ', locks: '3 ЗАМКА ИЗНУТРИ', grandma_stare: '«ОТ СКВОЗНЯКОВ»', rules_paper: 'ПРАВИЛА БАБУШКИ', tyoma_laugh: 'ТЁМА НЕ ВЕРИТ',
  grandma_stare2: 'БАБУШКА НЕ СМЕЁТСЯ', hatch: 'ПОДПОЛ', cellar: 'ПОДПОЛ', notes: 'ЗАПИСКИ', note_tyoma: '«ТЁМА, 2019»', garden_night: '03:12 · ОГОРОД',
  house_corridor: 'ГДЕ БАБУШКА?', gate_creak: 'СКРИПНУЛА КАЛИТКА', reflection: 'ГЛАЗА ОТКРЫТЫ?', door_dark: '«…ТЁМА»', chair_door: 'ДЕРЖАТЬ ДВЕРЬ',
  sunrise: 'РАССВЕТ', pancakes: 'УТРО', rotary: 'ЗВОНОК МАМЕ', rotary_close: 'ЗВОНОК МАМЕ', phone_line: 'МАМА НА ЛИНИИ',
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

const KEY2 = ['бабушки', 'бабушка', 'бабушки.', 'огород.', 'огорода', 'зеркала', 'замка.', 'сквозняков.', 'подпол.', 'подпол', 'правило.', 'записок.', 'деда', 'деда?', 'упала...', 'спала.', 'калитка.', 'стеклу.', 'дом.', 'открыты.', 'утра.', 'блины.', 'умерла', 'сутки.', 'телефона.', 'никогда', 'рыбы', 'рыбы.', 'дохлых', 'кругами', 'грузовик', 'светилась', 'тень', 'погас', 'хребет', 'голова', 'рёва', 'окна', 'сирены', 'мост', 'мама', 'больнице', 'к', 'него', 'второй', 'объект', 'закрывал', 'убегал', 'закипела', 'тёмное', 'днём', 'маму', 'глаз', 'помочь', 'спиной', '33', '33-й', '03:33', '03:34', 'шестеро', 'детей', 'медсестру', 'камеру', 'камеру.', 'моргнул', 'постанова', 'правила', 'глаза', 'не', 'один', 'дима', 'заправлены', 'кроме', 'двоих', 'лёха', 'пусто', 'смене', 'побежал', 'сообщение', 'обход', 'спят'];
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
