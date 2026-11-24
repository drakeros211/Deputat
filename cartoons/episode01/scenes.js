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

function sceneAt(t) { for (const s of TL.scenes) if (t >= s.start && t < s.end) return s; return TL.scenes[TL.scenes.length - 1]; }
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

// ------------------------------------------------------------ интерфейс
function rec(t, clock, extra = '') {
  const on = Math.floor(t * 1.5) % 2 === 0;
  return `<g style="font-family:'JetBrains Mono'" font-weight="800">
    <rect x="70" y="100" width="${extra ? 470 : 330}" height="74" rx="10" fill="#111" fill-opacity=".75" stroke="#e7b545" stroke-width="3"/>
    <circle cx="106" cy="137" r="13" fill="#ff2f3f" opacity="${on ? 1 : .25}"/>
    <text x="132" y="150" font-size="38" fill="#ffd47a">REC ${clock}</text>
    ${extra ? `<text x="340" y="148" font-size="24" fill="#ffd47a">${extra}</text>` : ''}</g>`;
}
function clockStr(scene, t, s) {
  const map = { street: '02:31', gate: '02:44', inside: '02:52', ward: '03:02', run: '03:04', home: '03:31', msg: '03:33', end: '03:33' };
  if (scene === "nurse") return (t - s.start < 0.5) ? '03:02' : '03:03';
  return map[scene] || '03:03';
}

const KEY = ['хлоркой', '03:03', 'ближе', 'заправлены', '33', 'камеру', 'крутилось', 'берёзка', 'видео', 'бро', 'тикток', 'заброшке', 'ночной', 'медсестру', 'видишь', 'никого', 'побежали', '47-й', 'шёл'];
function subtitle(t) {
  const sub = TL.subs.find(s => t >= s.start && t < s.end + 0.05);
  if (!sub || t >= TL.cut) return '';
  const k = (t - sub.start) / 0.14;
  const sc = lerp(.55, 1, easeBack(k));
  const words = sub.text.split(' ');
  let size = Math.min(86, 1500 / Math.max(8, sub.text.length));
  let fill = '#fff', stroke = '#000', y = 1400;
  if (sub.style === 'whisper') { size *= .9; fill = '#e9e9f2'; }
  if (sub.style === 'creepy') { fill = '#ff3b3b'; }
  if (sub.who === 'L' && sub.style !== 'creepy') fill = '#ffe7a8';
  const jit = sub.style === 'creepy' ? `translate(${(hash(t * 30) - .5) * 8} ${(hash(t * 31) - .5) * 8})` : '';
  const tspans = words.map(w => {
    const n = w.toLowerCase().replace(/[.,!?…«»]/g, '');
    const hl = KEY.some(k => n === k || n.startsWith(k)) && sub.style === 'normal';
    return `<tspan fill="${hl ? '#ffd23f' : fill}">${w}</tspan>`;
  }).join(' ');
  return `<g transform="translate(540 ${y}) ${jit} scale(${sc})"><text text-anchor="middle" font-size="${size}" style="font-family:Inter;paint-order:stroke" font-weight="900"
     stroke="${stroke}" stroke-width="${size * .16}" stroke-linejoin="round" ${sub.style === 'whisper' ? 'font-style="italic"' : ''}>${tspans}</text></g>`;
}

// ------------------------------------------------------------ СЦЕНЫ
function cam(content, cx, cy, z, dx = 0, dy = 0, rot = 0) {
  return `<g transform="translate(${540 + dx} ${960 + dy}) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})">${content}</g>`;
}
const NV = 'filter="url(#nightvision)"';

function S_hook(t, f, s) {
  const lt = t - s.start;
  if (lt < .35 || (lt > .8 && lt < 1.0)) return { body: staticNoise(f), noGrain: true };
  if (lt < .8) {
    const body = `<g ${NV}>${cam(A.BG_corr_plain + nurse(540, 1040, .22, { t }), 540, 960, 1.15)}</g>` + A.CAM_UI;
    return { body, glitch: .8 };
  }
  const k = (lt - 1) / (s.end - s.start - 1);
  const body = cam(A.BG_corr_plain + nurse(540, 1040, .2, { t, op: hash(f) > .85 ? .7 : .35 }), 540, 960, lerp(1.05, 1.25, k)) + spotlight(540, 1000, 700, .96);
  return { body, glitch: hash(f * 3) > .93 ? .4 : 0 };
}

function S_street(t, f, s) {
  const lt = t - s.start, scareT = s.shots[0].start;
  const k = (t - s.start) / (s.end - s.start);
  const sc = t - scareT;
  let shake = sc > 0 && sc < .5 ? (1 - sc / .5) * 30 : 0;
  const lampOn = hash(Math.floor(t * 12)) > .12;
  let body = A.BG_street.replace('class="lampglow"', `opacity="${lampOn ? 1 : .3}"`);
  // персонажи
  const tx = sc > 0 ? lerp(540, 340, easeOut(sc / .4)) : 540;
  const temo = sc > 0 && sc < 1.3 ? 'scared' : 'neutral';
  const tyomaZ = 0.98;
  let chars = char('T', { x: tx, y: 1560, s: tyomaZ, emo: temo, t, f, rot: sc > 0 && sc < .3 ? -4 : 0 });
  if (sc > -0.05) {
    const lx = lerp(1500, 790, easeBack(sc / .32));
    const laugh = sc > .5 ? Math.abs(Math.sin(t * 14)) * 10 : 0;
    chars += char('L', { x: lx, y: 1470 - laugh, s: 1.02, emo: 'grin', t, f });
    if (sc < .9) chars += spotlight(lx, 960, 520, .55 * (1 - sc / .9), '#000') + warmBeam(lx, 1020, 360, .45 * (1 - sc / .9));
  }
  body = cam(body + chars, 540, 1100, lerp(1.0, 1.07, k), wob(t * 6) * shake, wob(t * 7, 2) * shake);
  if (sc > 0 && sc < .08) body += `<rect width="${W}" height="${H}" fill="#fff" opacity=".7"/>`;
  return { body, hud: rec(t, clockStr('street', t, s)) };
}

function S_gate(t, f, s) {
  const k = (t - s.start) / (s.end - s.start);
  const lines = linesOf('gate');
  const winOn = t > lines[2].start ? (hash(Math.floor(t * 10)) > .25 ? 1 : .3) : 0;
  let bg = A.BG_hospital.replace('class="win33"', `opacity="${winOn}"`);
  const z = lerp(1.0, 1.22, ease(k));
  let body = cam(bg + fog(t, 1300, .18) + fog(t + 50, 900, .1), lerp(540, 610, k), lerp(980, 900, k), z);
  // забор и ребята на переднем плане — параллакс
  const fz = lerp(1.0, 1.1, ease(k));
  const lyBob = t > lines[3].start ? Math.abs(Math.sin(t * 6)) * 6 : 0;
  body += cam(A.FENCE + char('T', { x: 330, y: 2120, s: .62, back: true, t, f }) + char('L', { x: 760, y: 2140 - lyBob, s: .72, back: true, t, f }), 540, 1100, fz, 0, 40);
  body += spotlight(600, 900, 1100, .5);
  return { body, hud: rec(t, clockStr('gate', t, s)) };
}

function S_inside(t, f, s) {
  const sh = shotAt(s, t); const st = t - sh.start; const d = ((s.shots[s.shots.indexOf(sh) + 1] || { start: s.end }).start) - sh.start;
  const k = st / d;
  let body = '', fx = 540, fy = 960;
  if (sh.name === 'corridor') {
    fx = lerp(200, 880, ease(k)); fy = 800 + Math.sin(t * 2) * 60;
    body = cam(A.BG_corr, 540, 900, lerp(1.0, 1.18, k));
  } else if (sh.name === 'doll') {
    fx = 540 + wob(t, 1) * 60; fy = 900 + wob(t, 2) * 40;
    body = cam(A.BG_doll, 540, 920, lerp(1.0, 1.35, ease(k)));
    if (k > .7 && hash(f) > .8) body += `<rect width="${W}" height="${H}" fill="#000" opacity=".6"/>`;
  } else {
    fx = 560 + wob(t, 3) * 50; fy = 1200 + wob(t, 4) * 40;
    const ang = (t - sh.start) * 55;
    body = cam(A.BG_wheel + `<g transform="translate(560 1240) rotate(${ang})">${A.WHEEL}</g>`, 560, 1150, lerp(1.0, 1.15, k));
  }
  body += dust(t, fx, fy, 260) + warmBeam(fx, fy, 380, .22) + spotlight(fx, fy, 520, .97);
  return { body, hud: rec(t, clockStr('inside', t, s)) };
}

function S_ward(t, f, s) {
  const sh = shotAt(s, t); const st = t - sh.start; const nx = s.shots[s.shots.indexOf(sh) + 1]; const d = (nx ? nx.start : s.end) - sh.start;
  const k = st / d; let body;
  if (sh.name === 'door') {
    const o = ease((st - .5) / 1.6);
    const sx = lerp(1, .12, o), sk = lerp(0, -18, o);
    const inside = o > .2 ? warmBeam(540, 1100, 420, .12 * o) : '';
    body = cam(A.BG_doorframe + inside + `<g transform="translate(230 420) skewY(${sk}) scale(${sx} 1)">${A.DOOR}</g>`, 540, 1000, lerp(1.0, 1.12, k), wob(t, 1) * 6, wob(t, 2) * 6);
    body += spotlight(540 + wob(t, 3) * 40, 900, 600, .95);
  } else if (sh.name === 'beds') {
    body = `<g transform="translate(${lerp(0, -520, ease(k))} 0)">${A.BG_ward}</g>` + dust(t, 600, 900, 400, 40) + `<rect width="${W}" height="${H}" fill="#06101e" opacity=".45"/>`;
    body += spotlight(540, 1200, 900, .7);
  } else {
    const tr = wob(t * 4) * 6;
    body = cam(`<rect width="${W}" height="${H}" fill="#14100e"/>` + char('L', { x: 540, y: 1760, s: 1.55, emo: 'scared', t, f }), 540, 960, lerp(1.0, 1.05, k), tr, wob(t * 4, 2) * 4);
    body += warmBeam(420, 950, 600, .25) + spotlight(470, 950, 900, .9);
  }
  return { body, hud: rec(t, clockStr('ward', t, s)) };
}

function S_nurse(t, f, s) {
  const lt = t - s.start; const sh = shotAt(s, t);
  let body, ui = true, gl = 0, nv = true;
  if (lt < 1.35) {
    // 03:02 -> 03:03, помехи
    body = cam(A.BG_corr_plain, 540, 960, 1.05 + lt * .02);
    gl = lt > .1 && lt < .7 ? 1 : (hash(f) > .9 ? .3 : 0);
  } else if (sh.name === 'cam_far') {
    const k = (t - sh.start) / 4;
    body = cam(A.BG_corr_plain + nurse(540, 1040, .22, { t }), 540, 980, lerp(1.08, 1.3, ease(k)), wob(t, 1) * 5, wob(t, 2) * 5);
    gl = hash(f * 7) > .9 ? .5 : 0;
  } else if (sh.name === 'eyes') {
    nv = false; ui = false;
    body = cam(A.BG_corr_plain, 540, 960, 1.1, wob(t, 4) * 10, wob(t, 5) * 8) + spotlight(540 + wob(t, 6) * 80, 1000, 560, .96) + warmBeam(540, 1000, 360, .15);
  } else {
    const st = t - sh.start;
    const stepK = Math.floor(st * 7.5) / 7.5; // стоп-моушен
    const ns = lerp(.6, 1.25, ease(stepK / Math.max(.1, s.end - sh.start)));
    body = cam(A.BG_corr_plain + nurse(540, 1040 + (ns - .22) * 1500, ns, { t, tilt: Math.sin(st * 20) * 3 }), 540, 980, 1.12 + st * .04, wob(t * 8) * 12, wob(t * 9, 1) * 12);
    gl = st < .3 ? 1 : (hash(f * 3) > .6 ? .7 : .25);
  }
  if (nv) body = `<g ${NV}>${body}</g>`;
  if (ui) body += A.CAM_UI;
  return { body, glitch: gl, hud: ui ? rec(t, clockStr('nurse', t, s), 'НОЧН. РЕЖИМ') : '' };
}

function S_run(t, f, s) {
  const out = s.shots.find(x => x.name === 'outside');
  if (t < out.start) {
    const lt = t - s.start;
    const ph = (lt % .55) / .55;
    const sh = 40;
    let body = cam(A.BG_corr_plain, 540, 960, lerp(1.0, 1.45, ph), wob(t * 9) * sh, wob(t * 11, 3) * sh + Math.abs(Math.sin(t * 11)) * 30, wob(t * 5) * 6);
    if (Math.floor(lt / .55) === 4 && ph < .2) body = cam(A.BG_corr_plain + nurse(800, 1300, .55, { t }), 540, 960, 1.2);  // мелькнула
    body += spotlight(540 + Math.sin(t * 9) * 260, 900 + Math.cos(t * 7) * 200, 480, .97);
    return { body: `<g filter="url(#mblur)">${body}</g>`, hud: rec(t, clockStr('run', t, s)) };
  }
  const st = t - out.start; const crL = linesOf('run')[2];
  const flick = hash(Math.floor(t * 14)) > .2 ? 1 : .35;
  const tilt = t > crL.start ? lerp(0, 16, ease((t - crL.start) / 2.5)) : 0;
  let body = A.BG_street + `<rect width="${W}" height="${H}" fill="#000" opacity=".35"/>`;
  body += warmBeam(760, 900, 500, .35 * flick);
  body += char('L', { x: 770, y: 1380, s: .55, back: true, t, f, rot: tilt });
  body += char('T', { x: 330, y: 1600 + Math.abs(Math.sin(t * 5)) * 18, s: 1.05, emo: 'scared', t, f, headRot: -6 });
  body = cam(body, 540, 1100, 1.0 + st * .02);
  body += spotlight(600, 1000, 1000, .75 * (2 - flick));
  return { body, hud: rec(t, clockStr('run', t, s)), glitch: st < .12 ? .8 : 0 };
}

function phoneFrame(inner, t, label) {
  const c = id('pf');
  return `<rect width="${W}" height="${H}" fill="#05060a"/>
    <clipPath id="${c}"><rect x="60" y="180" width="960" height="1560" rx="50"/></clipPath>
    <g clip-path="url(#${c})">${inner}</g>
    <rect x="60" y="180" width="960" height="1560" rx="50" fill="none" stroke="#2b2f3a" stroke-width="16"/>
    <rect x="120" y="1640" width="840" height="10" rx="5" fill="#ffffff" opacity=".3"/><rect x="120" y="1640" width="${lerp(300, 420, clamp((t % 4) / 4))}" height="10" rx="5" fill="#ff2f3f"/>
    <text x="120" y="1620" font-size="34" fill="#fff" style="font-family:'JetBrains Mono'" font-weight="700">${label}</text>
    <path d="M940 1590 v40 M960 1590 v40" stroke="#fff" stroke-width="8"/>`;
}

function S_home(t, f, s) {
  const sh = shotAt(s, t); const lines = linesOf('home');
  if (sh.name === 'face') {
    const k = (t - sh.start) / 2;
    let body = cam(A.BG_room + char('T', { x: 540, y: 1760, s: 1.5, emo: 'scared', t, f }), 540, 1000, lerp(1.0, 1.06, k));
    body += `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".12" style="mix-blend-mode:screen"/>` + spotlight(540, 1000, 900, .85, '#02030a');
    return { body };
  }
  // запись на телефоне: Лёха бежит, за ним она
  const st = t - sh.start; const whisper = lines[2];
  const step = Math.floor(st * 2.2);
  const zoomIn = t > whisper.start - .3 ? ease((t - whisper.start + .3) / .8) : 0;
  const ly = 1560 + step * 14;
  const face = ly - 400;
  const nur = `<g transform="translate(334 ${ly + 751}) scale(.95) translate(-300 -1600)">`;
  let inner = A.BG_corr_plain + nur + A.N_reach + '</g>'
    + char('L', { x: 470, y: ly, s: .82, emo: t > whisper.start - .3 ? 'stare' : 'scared', t, f, talk: t > whisper.start - .1 })
    + nur + A.N_hand + '</g>';
  inner = `<g filter="url(#redtint)">${cam(inner, lerp(540, 470, zoomIn), lerp(960, face, zoomIn), lerp(1.0, 2.0, zoomIn))}</g>`;
  const label = `0:${String(46 + Math.min(1, step)).padStart(2, '0')} / 1:12`;
  return { body: phoneFrame(inner + spotlight(540, 900, 900, .6), t, label), glitch: (st < .15 || (hash(f * 9) > .92)) ? .6 : 0 };
}

function notif(y, title, text, op) {
  return `<g transform="translate(0 ${y})" opacity="${op}"><rect x="50" y="0" width="980" height="190" rx="40" fill="#1d2230" fill-opacity=".93" stroke="#3a4152" stroke-width="2"/>
    <circle cx="140" cy="95" r="52" fill="#f2c230"/><text x="140" y="116" font-size="56" text-anchor="middle" style="font-family:Inter" font-weight="900" fill="#d63a35">Л</text>
    <text x="220" y="78" font-size="40" style="font-family:Inter" font-weight="800" fill="#fff">${title}</text>
    <text x="900" y="78" font-size="30" style="font-family:Inter" fill="#9aa3b5">сейчас</text>
    <text x="220" y="135" font-size="38" style="font-family:Inter" fill="#dfe4ee">${text}</text></g>`;
}

function S_msg(t, f, s) {
  const lt = t - s.start;
  let body = cam(A.BG_room + char('T', { x: 540, y: 1800, s: 1.5, emo: lt > 2 ? 'terrified' : 'scared', t, f }), 540, 1000, 1.06 + lt * .01, wob(t * 3) * 3, 0);
  body += `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".12" style="mix-blend-mode:screen"/>` + spotlight(540, 1050, 900, .85, '#02030a');
  const n1 = easeBack((lt - .05) / .35), n2 = easeBack((lt - 1.3) / .35);
  body += `<text x="540" y="90" font-size="34" text-anchor="middle" style="font-family:Inter" font-weight="700" fill="#fff">03:33</text>`;
  if (lt > 0) body += notif(lerp(-220, 130, n1), 'Лёха', 'бро ты где?? ты ушёл без меня', 1);
  if (lt > 1.3) body += notif(lerp(-220, 350, n2), 'Лёха', 'я всё ещё тут. в 33', 1);
  return { body };
}

function S_end(t, f, s) {
  const lt = t - s.start;
  const nop = clamp((lt - .6) / 1.8) * .92;
  let body = A.BG_room + nurse(850, 1480, .62, { t, op: nop, tilt: -5 }) + char('T', { x: 500, y: 1620, s: 1.25, emo: 'neutral', t, f });
  body = cam(body, 540, 1000, 1.0 + lt * .015) + spotlight(520, 950, 1000, .7, '#02030a');
  body += `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".1" style="mix-blend-mode:screen"/>`;
  const hud = `<g style="font-family:Inter" font-weight="800"><rect x="380" y="70" width="320" height="64" rx="32" fill="#000" fill-opacity=".55"/>
    <circle cx="420" cy="102" r="11" fill="#ff2f3f"/><text x="545" y="116" font-size="38" text-anchor="middle" fill="#fff">LIVE 03:33</text></g>`;
  return { body, hud };
}

const SCENE_FN = { hook: S_hook, street: S_street, gate: S_gate, inside: S_inside, ward: S_ward, nurse: S_nurse, run: S_run, home: S_home, msg: S_msg, end: S_end };

const DEFS = `<defs>
  <filter id="nightvision" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.06 0.16 0.03 0 0  0.22 0.5 0.12 0 0.03  0.05 0.12 0.04 0 0  0 0 0 1 0"/></filter>
  <filter id="redtint" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.9 0.3 0.1 0 0.05  0.15 0.5 0.1 0 0  0.1 0.2 0.45 0 0  0 0 0 1 0"/></filter>
  <filter id="redOnly"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
  <filter id="mblur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6 14"/></filter>
</defs>`;

window.renderFrame = function (t) {
  uid = 0;
  const f = Math.round(t * FPS);
  if (t >= TL.cut) {
    // резкий обрыв: 3 кадра помех, затем чёрный
    const k = Math.round((t - TL.cut) * FPS);
    const body = k < 3 ? staticNoise(f) + `<rect width="${W}" height="${H}" fill="#ff2a4f" opacity=".15"/>` : `<rect width="${W}" height="${H}" fill="#000"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#000"/>${body}</svg>`;
  }
  const s = sceneAt(t);
  const r = SCENE_FN[s.id](t, f, s);
  // короткое затемнение на стыке сцен
  const fromStart = t - s.start;
  const fade = s.id === 'hook' ? 0 : clamp(1 - fromStart / .12);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}
    <rect width="${W}" height="${H}" fill="#000"/><g id="scene">${r.body}</g>`;
  if (r.glitch) out += glitch(f, r.glitch);
  out += vignette(.65);
  if (!r.noGrain) out += grain(f);
  if (fade) out += `<rect width="${W}" height="${H}" fill="#000" opacity="${fade}"/>`;
  out += (r.hud || '') + subtitle(t) + '</svg>';
  return out;
};
