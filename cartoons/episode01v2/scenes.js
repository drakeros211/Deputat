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
  const m = o.talk === false ? 0 : mouthAt(p, o.f);
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

// ------------------------------------------------------------ ШОТЫ
const SHOT = {
  black: (c) => ({ body: `<rect width="${W}" height="${H}" fill="#020202"/>` + (hash(c.f) > .9 ? `<rect width="${W}" height="${H}" fill="#300" opacity=".3"/>` : '') }),
  chance4: (c) => {
    const k = easeOut(c.lt / .5);
    return {
      body: `<rect width="${W}" height="${H}" fill="#0a0000"/>` + bigMeter(lerp(60, 4, k), c), glitch: c.lt < .2 || hash(c.f) > .8 ? .8 : 0, noHud: true
    };
  },
  rewind: (c) => {
    const pool = ['empty_bed', 'rule4', 'yard', 'journal_zoom', 'cam_far', 'school'];
    const nm = pool[Math.floor(c.lt * 9) % pool.length];
    const inner = SHOT[nm]({ ...c, lt: 1 - c.k, k: 1 - c.k, i: 0 }).body;
    let lines = '';
    for (let i = 0; i < 6; i++) lines += `<rect x="0" y="${(hash(c.f * 2 + i) * H)}" width="${W}" height="${6 + hash(i + c.f) * 20}" fill="#fff" opacity=".25"/>`;
    return {
      body: `<g filter="url(#bw)">${inner}</g>` + lines + `<rect width="${W}" height="${H}" fill="#000" opacity=".35"/>
      <text x="540" y="860" text-anchor="middle" font-size="150" style="${RUB}" font-weight="900" fill="#fff">◀◀</text>
      <text x="540" y="1010" text-anchor="middle" font-size="84" style="${RUB};paint-order:stroke" stroke="#000" stroke-width="12" font-weight="900" fill="#fff">47 МИНУТ НАЗАД</text>`, noHud: true, glitch: .3
    };
  },
  newspaper: (c) => ({ body: drift(c, newspaper(c.f), 540, 900, 1.0, 1.08) + dark(.15) + warmBeam(540, 700, 900, .2) }),
  newspaper_zoom: (c) => ({ body: cam(newspaper(c.f), lerp(820, 820, c.k), lerp(870, 880, c.k), lerp(2.2, 2.6, ease(c.k))) + dark(.1) }),
  beds_nurse: (c) => ({ body: sepia(`<g transform="translate(${lerp(-150, -350, ease(c.k))} 0)">${A.BG_ward}${nurse(980, 1430, .55, { t: c.t })}</g>`) + dark(.3) + scratches(c.f), glitch: hash(c.f) > .95 ? .3 : 0 }),
  nurse_close: (c) => ({ body: sepia(cam(`<rect width="${W}" height="${H}" fill="#3a3025"/>` + nurse(540, 3000, 1.9, { t: c.t }), 540, 700, lerp(1.0, 1.15, ease(c.k)))) + scratches(c.f) + spotlight(540, 700, 800, .85), glitch: hash(c.f * 3) > .9 ? .4 : 0 }),
  cam_far: (c) => ({ body: nv(cam(A.BG_corr_plain + nurse(540, 1040, .2, { t: c.t }), 540, 980, lerp(1.05, 1.25, ease(c.k)), wob(c.t, 1) * 5, wob(c.t, 2) * 5)) + A.CAM_UI, glitch: c.lt < .15 ? 1 : (hash(c.f * 7) > .9 ? .4 : 0), rec: 1 }),
  cam_far2: (c) => {
    const step = Math.floor(c.lt * 4) / 4;
    return { body: nv(cam(A.BG_corr_plain + nurse(540, 1100 + step * 120, .3 + step * .12, { t: c.t }), 540, 1000, 1.25 + step * .08, wob(c.t, 1) * 8, wob(c.t, 2) * 8)) + A.CAM_UI, glitch: hash(c.f * 7) > .75 ? .6 : 0, rec: 1 };
  },
  school: (c) => ({ body: drift(c, A.BG_class + char('D', { x: 540, y: 1790, s: .8, emo: 'stare', t: c.t, f: c.f, talk: false }), 540, 900, 1.0, 1.1) + dark(.15) }),
  dima_far: (c) => ({ body: drift(c, A.BG_class + char('D', { x: 540, y: 1600, s: 1.05, emo: 'stare', t: c.t, f: c.f, talk: false }), 540, 960, 1.05, 1.15) + dark(.2) }),
  dima_close: (c) => ({ body: cam(A.BG_class + char('D', { x: 540, y: 1700, s: 1.6, emo: 'stare', t: c.t, f: c.f, talk: false }), 540, lerp(1000, 900, c.k), lerp(1.0, 1.15, ease(c.k))) + spotlight(540, 900, 1000, .6) }),
  dima_eyes: (c) => ({ body: cam(A.BG_class + char('D', { x: 540, y: 1700, s: 1.6, emo: 'stare', t: c.t, f: c.f }), 540, lerp(880, 940, c.k), lerp(1.8, 1.9, c.k)) + spotlight(540, 960, 900, .7), glitch: c.lt < .1 ? .7 : 0 }),
  yard: (c) => {
    let b = A.BG_street.replace('class="lampglow"', `opacity="${hash(Math.floor(c.t * 12)) > .12 ? 1 : .3}"`);
    b += char('T', { x: 330, y: 1580, s: .95, emo: 'scared', t: c.t, f: c.f }) + char('L', { x: 780, y: 1480, s: 1.0, emo: 'grin', t: c.t, f: c.f });
    return { body: drift(c, b, 540, 1050, 1.0, 1.07) + dark(.15), hud: 1 };
  },
  yard_lyoha: (c) => ({ body: drift(c, A.BG_street + char('L', { x: 540, y: 1760, s: 1.5, emo: 'grin', t: c.t, f: c.f }), 540, 960, 1.0, 1.06) + dark(.2) + warmBeam(540, 900, 600, .2), hud: 1 }),
  goal: (c) => {
    const k = easeBack(c.lt / .3);
    return {
      body: drift(c, A.BG_street + char('L', { x: 540, y: 1760, s: 1.5, emo: 'grin', t: c.t, f: c.f }), 540, 960, 1.06, 1.1) + dark(.45) +
        `<g transform="translate(540 760) scale(${k}) rotate(-3)"><rect x="-470" y="-120" width="940" height="240" rx="24" fill="#c4121c"/>
        <text y="-30" text-anchor="middle" font-size="54" style="${RUB}" font-weight="900" fill="#ffd6d6">ЦЕЛЬ:</text>
        <text y="55" text-anchor="middle" font-size="62" style="${RUB}" font-weight="900" fill="#fff">ДОКАЗАТЬ, ЧТО ЛЕГЕНДА ВРЁТ</text></g>`, hud: 1
    };
  },
  gate: (c) => {
    let b = cam(A.BG_hospital.replace('class="win33"', `opacity="${hash(Math.floor(c.t * 8)) > .4 ? .8 : 0}"`) + fog(c.t, 1300, .18), 610, 950, lerp(1.0, 1.15, ease(c.k)));
    b += cam(A.FENCE + char('T', { x: 330, y: 2120, s: .62, back: true, t: c.t, f: c.f }) + char('L', { x: 760, y: 2140, s: .72, back: true, t: c.t, f: c.f }), 540, 1100, lerp(1.0, 1.08, c.k), 0, 40);
    return { body: b + spotlight(600, 900, 1100, .5), hud: 1 };
  },
  wall: (c) => ({ body: cam(rulesWall(0), 540, 400, lerp(1.4, 1.2, ease(c.k))) + flash(c, 540, 400), hud: 1 }),
  rule1: (c) => ruleShot(c, 0), rule2: (c) => ruleShot(c, 1), rule3: (c) => ruleShot(c, 2), rule4: (c) => ruleShot(c, 3),
  signature: (c) => ({ body: cam(rulesWall(4, -1, c.lt * 2.2), 820, 1380, lerp(1.6, 1.9, ease(c.k))) + flash(c, 540, 960, 700), hud: 1, glitch: c.lt > .9 && c.lt < 1.0 ? .6 : 0 }),
  lyoha_laugh: (c) => ({ body: cam(`<rect width="${W}" height="${H}" fill="#141210"/>` + char('L', { x: 540 + Math.sin(c.t * 14) * 6, y: 1760 - Math.abs(Math.sin(c.t * 12)) * 12, s: 1.55, emo: 'grin', t: c.t, f: c.f }), 540, 960, lerp(1.0, 1.06, c.k)) + warmBeam(470, 950, 600, .28) + spotlight(470, 950, 900, .88), hud: 1 }),
  door: (c) => {
    const o = ease((c.lt - .2) / 1.4);
    return { body: cam(A.BG_doorframe + `<g transform="translate(230 420) skewY(${lerp(0, -18, o)}) scale(${lerp(1, .12, o)} 1)">${A.DOOR}</g>`, 540, 1000, lerp(1.0, 1.15, c.k), wob(c.t, 1) * 6) + spotlight(540 + wob(c.t, 3) * 40, 900, 600, .95), hud: 1 };
  },
  beds: (c) => ({ body: `<g transform="translate(${lerp(0, -520, ease(c.k))} 0)">${A.BG_ward}</g>` + dust(c.t, 600, 900, 400, 40) + `<rect width="${W}" height="${H}" fill="#06101e" opacity=".45"/>` + spotlight(540, 1200, 900, .7), hud: 1 }),
  journal: (c) => ({ body: drift(c, journal(0), 540, 900, 1.0, 1.08) + flash(c, 540, 800, 700), hud: 1 }),
  journal_zoom: (c) => ({ body: cam(journal(clamp(c.lt / 1.6), clamp(c.lt - 1.6)), lerp(480, 420, c.k), 1130, lerp(1.5, 1.85, ease(c.k)), (hash(c.f) - .5) * 4) + flash(c, 540, 960, 800), hud: 1, glitch: hash(c.f * 5) > .93 ? .4 : 0 }),
  timer_zero: (c) => {
    const off = c.lt > 1.0;
    const body = off ? `<rect width="${W}" height="${H}" fill="#000"/>` : `<g transform="translate(${(hash(c.f) - .5) * 10} 0)">${SHOT.beds({ ...c, k: .5 }).body}</g>` + (hash(c.f) > .6 ? dark(.6) : '');
    return { body, hud: 1, bigTimer: 1, glitch: c.lt > .9 && c.lt < 1.1 ? 1 : 0 };
  },
  eyes_closed: (c) => ({ body: eyelids(c.t, c.f), hud: 1 }),
  eyes_closed2: (c) => ({ body: eyelids(c.t, c.f, .3), hud: 1 }),
  eyes_closed3: (c) => ({ body: eyelids(c.t, c.f, .8), hud: 1 }),
  lyoha_cam: (c) => ({ body: cam(`<rect width="${W}" height="${H}" fill="#05070c"/>` + char('L', { x: 540, y: 1760, s: 1.5, emo: 'scared', t: c.t, f: c.f, talk: false }), 540, 960, lerp(1.0, 1.08, c.k)) + `<rect width="${W}" height="${H}" fill="#3a7bff" opacity=".12" style="mix-blend-mode:screen"/>` + spotlight(540, 1100, 800, .9, '#01020a'), hud: 1 }),
  cam_nurse_bed: (c) => {
    const lean = ease(c.lt / 1.5);
    return { body: nv(cam(`<g transform="translate(-260 0)">${A.BG_ward}</g>` + nurse(560, 1700, .8, { t: c.t, tilt: lerp(0, 22, lean) }), 560, 900, lerp(1.1, 1.4, lean), wob(c.t * 3) * 10)) + A.CAM_UI, hud: 1, glitch: c.lt < .25 ? 1 : (hash(c.f * 3) > .7 ? .5 : 0), rec: 1 };
  },
  lyoha_frozen: (c) => ({ body: cam(`<rect width="${W}" height="${H}" fill="#05070c"/>` + char('L', { x: 540, y: 1760, s: 1.5, emo: 'stare', t: 0, f: 0, talk: false }), 540, 900, lerp(1.1, 1.3, c.k)) + `<rect width="${W}" height="${H}" fill="#3a7bff" opacity=".12" style="mix-blend-mode:screen"/>` + spotlight(540, 1000, 700, .93, '#01020a'), hud: 1 }),
  open_eyes: (c) => ({ body: SHOT.beds({ ...c, k: .3 }).body + eyelids(c.t, c.f, 0, easeOut(c.lt / .6)), hud: 1 }),
  empty_bed: (c) => ({ body: cam(A.BG_bed, 540, 1150, lerp(1.0, 1.2, ease(c.k)), 0, 0) + spotlight(540 + wob(c.t) * 30, 1150, 700, .93) + warmBeam(540, 1150, 400, .2), hud: 1, glitch: c.lt < .1 ? .5 : 0 }),
  run: (c) => {
    const ph = (c.lt % .5) / .5;
    let b = cam(A.BG_corr_plain, 540, 960, lerp(1.0, 1.45, ph), wob(c.t * 9) * 40, wob(c.t * 11, 3) * 40 + Math.abs(Math.sin(c.t * 11)) * 30, wob(c.t * 5) * 6);
    if (Math.floor(c.lt / .5) === 2 && ph < .25) b = cam(A.BG_corr_plain + nurse(800, 1300, .55, { t: c.t }), 540, 960, 1.2);
    return { body: `<g filter="url(#mblur)">${b + spotlight(540 + Math.sin(c.t * 9) * 260, 900 + Math.cos(c.t * 7) * 200, 480, .97)}</g>`, hud: 1 };
  },
  outside: (c) => ({ body: drift(c, A.BG_street + dark(.4) + warmBeam(540, 1300, 500, .3), 540, 1100, 1.0, 1.05), hud: 1 }),
  lyoha_outside: (c) => {
    const w = easeOut(c.lt / 1.0);
    return { body: cam(A.BG_street + dark(.35) + warmBeam(540, 1000, 600, .35) + char('L', { x: 540, y: lerp(1500, 1700, w), s: lerp(.9, 1.4, w), emo: 'grin', t: c.t, f: c.f }), 540, 960, 1.0) + spotlight(540, 1000, 900, .6), hud: 1 };
  },
  tyoma_relief: (c) => ({ body: drift(c, A.BG_street + dark(.35) + char('T', { x: 540, y: 1760 + Math.abs(Math.sin(c.t * 5)) * 14, s: 1.45, emo: 'neutral', t: c.t, f: c.f }), 540, 960, 1.0, 1.05) + spotlight(540, 950, 1000, .55), hud: 1 }),
  room: (c) => ({ body: drift(c, A.BG_room + char('T', { x: 540, y: 1760, s: 1.45, emo: 'neutral', t: c.t, f: c.f }), 540, 1000, 1.0, 1.05) + `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".1" style="mix-blend-mode:screen"/>` + spotlight(540, 1000, 900, .82, '#02030a'), hud: 1 }),
  msg: (c) => ({ body: cam(chat(c.t, c.lt), 540, 700, lerp(1.0, 1.08, ease(c.k))), hud: 1 }),
  behind: (c) => {
    const ap = clamp(c.lt / 1.6);
    let b = A.BG_room + `<g opacity="${.15 + ap * .85}">${char('L', { x: 850, y: 1000, s: .55, emo: 'stare', t: 0, f: c.f, talk: false })}</g>` + `<rect x="690" y="1000" width="330" height="430" fill="#020203"/>`;
    b += char('T', { x: 470, y: 1760, s: 1.4, emo: 'terrified', t: c.t, f: c.f });
    return { body: cam(b, 600, 900, lerp(1.0, 1.12, ease(c.k))) + `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".1" style="mix-blend-mode:screen"/>` + spotlight(560, 900, 1000, .8, '#02030a'), hud: 1 };
  },
};
function ruleShot(c, i) {
  const rv = i + clamp(c.lt / .9);
  const ys = [520, 730, 940, 1150];
  return { body: cam(rulesWall(rv, i), 540, ys[i] + 60, lerp(1.0, 1.07, c.k) + punch(c, .05, .04), wob(c.t, i) * 4) + flash(c, 300 + clamp(c.lt / .9) * 500, ys[i] - 30, 650), hud: 1, label: `ПРАВИЛО №${i + 1}` };
}
function flash(c, x, y, r = 600) { return dust(c.t, x, y, 260, 16) + warmBeam(x, y, r * .7, .22) + spotlight(x + wob(c.t, 7) * 30, y + wob(c.t, 8) * 20, r, .93); }

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
function storySecs(t) {
  const pts = [[SC.dispute.start, 47 * 60], [SC.rules.start, 38 * 60 + 12], [SC.ward.start, 14 * 60 + 40], [firstShot('timer_zero'), 9], [firstShot('timer_zero') + 1.0, 0]];
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (t < pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return 0;
}
function hudTimer(t, big) {
  const s = Math.max(0, Math.ceil(storySecs(t)));
  const txt = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  if (big) return `<g style="${MONO}" font-weight="800"><text x="540" y="900" text-anchor="middle" font-size="60" fill="#ff8a8a">ДО 03:33</text>
     <text x="540" y="1080" text-anchor="middle" font-size="220" fill="${s === 0 ? '#ff2f3f' : '#fff'}" style="paint-order:stroke;${MONO}" stroke="#000" stroke-width="14">${txt}</text></g>`;
  if (s === 0 && ['fake', 'final'].includes(sceneOf(t))) return '';
  if (s === 0) return `<g style="${RUB}" font-weight="900"><rect x="60" y="148" width="420" height="58" rx="29" fill="#c4121c" opacity="${Math.floor(t * 2) % 2 ? 1 : .6}"/><text x="270" y="189" text-anchor="middle" font-size="32" fill="#fff">● ОБХОД НАЧАЛСЯ</text></g>`;
  return `<g style="${MONO}" font-weight="800"><rect x="60" y="148" width="420" height="58" rx="12" fill="#000" fill-opacity=".65" stroke="#ff2f3f" stroke-width="3"/>
    <circle cx="92" cy="177" r="10" fill="#ff2f3f"/><text x="115" y="190" font-size="34" fill="#ffd0d0">ДО 03:33 · ${txt}</text></g>`;
}
const LABELS = {
  yard: 'ЛЁХА НЕ ВЕРИТ В ЛЕГЕНДУ', yard_lyoha: 'ЛЁХА НЕ ВЕРИТ В ЛЕГЕНДУ', lyoha_laugh: 'ЛЁХА СМЕЁТСЯ НАД ПРАВИЛАМИ', door: 'ПАЛАТА №33',
  beds: 'ПАЛАТА №33', journal: 'ЖУРНАЛ ДЕЖУРСТВ', journal_zoom: 'ПОСЛЕДНЯЯ ЗАПИСЬ', eyes_closed: 'ПРАВИЛО №1 · ГЛАЗА ЗАКРЫТЫ',
  lyoha_cam: 'ЛЁХА НАРУШИЛ ПРАВИЛО №3', cam_nurse_bed: 'ЛЁХА НАРУШИЛ ПРАВИЛО №3', lyoha_frozen: 'ЛЁХА МОЛЧИТ', eyes_closed2: 'ПРАВИЛО №2 · НЕ ОТВЕЧАЙ',
  eyes_closed3: 'ПРАВИЛО №2 · НЕ ОТВЕЧАЙ', open_eyes: 'СКРИПНУЛА КАТАЛКА', empty_bed: 'ЛЁХА ПРОПАЛ', run: 'ПРАВИЛО №4 · УХОДИ ОДИН',
  outside: 'УЛИЦА', lyoha_outside: 'ЛЁХА ВЕРНУЛСЯ', tyoma_relief: 'ЛЁХА ВЕРНУЛСЯ', room: 'ДОМА · 03:41', msg: 'СООБЩЕНИЕ ОТ ЛЁХИ', behind: 'КТО-ТО ЗА СПИНОЙ',
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

const KEY2 = ['33', '33-й', '03:33', '03:34', 'шестеро', 'детей', 'медсестру', 'камеру', 'камеру.', 'моргнул', 'постанова', 'правила', 'глаза', 'не', 'один', 'дима', 'заправлены', 'кроме', 'двоих', 'лёха', 'пусто', 'смене', 'побежал', 'сообщение', 'обход', 'спят'];
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
  if (showHud) out += hudMeter(t, f) + hudTimer(t, r.bigTimer && c.lt < 1.0) + (r.bigTimer ? '' : label(r.label || LABELS[c.s.name], t));
  out += subtitle2(t) + '</svg>';
  return out;
};
