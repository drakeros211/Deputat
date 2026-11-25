// 10 аватарок для TikTok (1024x1024). renderAvatar(i) -> SVG
window.renderAvatar = function (i) {
  uid = 0;
  const S = 1024;
  const T = (o = {}) => char('T', Object.assign({ x: 512, y: 1010, s: 1.05, emo: 'neutral', t: 1.5, f: 0, talk: false }, o));
  const L = (o = {}) => char('L', Object.assign({ x: 512, y: 1010, s: 1.05, emo: 'grin', t: 1.5, f: 0, talk: false }, o));
  const grad = (id, a, b, c) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="${S}" height="${S}" fill="url(#${id})"/>`;
  const rad = (id, a, b) => `<defs><radialGradient id="${id}" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><rect width="${S}" height="${S}" fill="url(#${id})"/>`;
  const rays = (n, col, op) => { let d = ''; for (let k = 0; k < n; k++) { const a1 = k / n * 6.283, a2 = a1 + 3.1416 / n; d += `M512 480 L${512 + 1200 * Math.cos(a1)} ${480 + 1200 * Math.sin(a1)} L${512 + 1200 * Math.cos(a2)} ${480 + 1200 * Math.sin(a2)}Z `; } return `<path d="${d}" fill="${col}" opacity="${op}"/>`; };
  const rim = (col, w = 26, op = .9) => `<g filter="url(#glow)" opacity="${op}"><circle cx="512" cy="512" r="470" fill="none" stroke="${col}" stroke-width="${w}"/></g>`;
  const halftone = (col) => { let s = ''; for (let y = 0; y < S; y += 34) for (let x = (y / 34 % 2) * 17; x < S; x += 34) s += `<circle cx="${x}" cy="${y}" r="${5 + 6 * (y / S)}" fill="${col}"/>`; return s; };
  const glowHalo = (col, r = 380, op = .6) => `<defs><radialGradient id="gh${i}"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><circle cx="512" cy="470" r="${r}" fill="url(#gh${i})"/>`;
  const V = [
    // 1. Неон: тёмный фон, неоновое кольцо, ухмылка
    () => rad('a1', '#1a0b2e', '#05020a') + glowHalo('#ff2bd6', 420, .45) + rim('#2bf0ff', 18) + T() + `<rect width="${S}" height="${S}" fill="#ff2bd6" opacity=".08" style="mix-blend-mode:screen"/>`,
    // 2. Страшилки: красный коридор, медсестра за спиной
    () => `<g filter="url(#redtint2)">${cam(A.BG_corr_plain + nurse(700, 1180, .5, { t: 0, tilt: 6 }), 640, 900, 1.15)}</g>` + spotlight(560, 560, 700, .55) + T({ x: 470, emo: 'scared', headRot: -6, mouth: 1 }),
    // 3. Глубинный: глаз монстра позади
    () => `<g transform="translate(-60 -420) scale(1.05)">${A.EYE}</g>` + `<rect width="${S}" height="${S}" fill="#001018" opacity=".35"/>` + T({ emo: 'scared' }) + `<rect width="${S}" height="${S}" fill="#3ad0ff" opacity=".12" style="mix-blend-mode:screen"/>`,
    // 4. Ночной город под дождём
    () => `<g transform="translate(-260 -160) scale(.95)">${A.CITY_LIT}</g>` + `<rect width="${S}" height="${S}" fill="#050a1a" opacity=".35"/>` + glowHalo('#ffcf6b', 330, .25) + rain(1.2, .35, 80) + T(),
    // 5. VHS: запись 03:33, сканлайны
    () => rad('a5', '#2a2f3a', '#07080c') + T() + (() => { let s = ''; for (let y = 0; y < S; y += 6) s += `<rect y="${y}" width="${S}" height="2" fill="#000" opacity=".25"/>`; return s; })() +
      `<g style="${MONO}" font-weight="800"><circle cx="300" cy="190" r="16" fill="#ff2f3f"/><text x="330" y="205" font-size="46" fill="#fff">REC</text><text x="760" y="205" text-anchor="end" font-size="46" fill="#fff">03:33</text></g>`,
    // 6. Комикс: жёлтый фон, полутон, «!»
    () => `<rect width="${S}" height="${S}" fill="#ffd23f"/>` + halftone('#f0a400') + rays(20, '#fff', .35) +
      `<path d="M860 120 l40 90 l80 -30 l-40 90 l90 40 l-100 20 l20 100 l-70 -70 l-60 80 l-10 -100 l-100 10 l70 -70 l-60 -80 l100 20z" fill="#ff3b3b" stroke="#1d1a1c" stroke-width="8"/><text x="870" y="300" text-anchor="middle" font-size="110" style="${RUB}" font-weight="900" fill="#fff" stroke="#1d1a1c" stroke-width="6" style="paint-order:stroke">!</text>` + T({ emo: 'terrified', mouth: 2 }),
    // 7. Свет телефона в темноте
    () => `<rect width="${S}" height="${S}" fill="#02040a"/>` + T({ emo: 'scared' }) + `<defs><radialGradient id="ph7" cx="50%" cy="85%" r="60%"><stop offset="0" stop-color="#6fb6ff" stop-opacity=".55"/><stop offset="1" stop-color="#6fb6ff" stop-opacity="0"/></radialGradient></defs><rect width="${S}" height="${S}" fill="url(#ph7)" style="mix-blend-mode:screen"/>` + spotlight(512, 600, 700, .75, '#01020a'),
    // 8. Дуэт: Тёма и Лёха
    () => grad('a8', '#ff8a4c', '#ff5f7e', '#7a4cff') + rays(18, '#fff', .12) + L({ x: 720, y: 1040, s: .82, mouth: 2 }) + T({ x: 340, y: 1060, s: .86, mouth: 1 }),
    // 9. Минимал: тёплый градиент, крупный план
    () => grad('a9', '#ffcf4a', '#ff8a4c', '#ff3d6e') + glowHalo('#fff6c8', 360, .5) + T({ y: 1130, s: 1.25, mouth: 2, headRot: 4 }),
    // 10. Глитч + ночное видение
    () => `<g filter="url(#nightvision)">${cam(A.BG_corr_plain, 540, 960, 1.4)}</g>` + `<g filter="url(#nightvision)">${T()}</g>` +
      `<g opacity=".25" style="mix-blend-mode:screen"><g transform="translate(10 0)" filter="url(#redOnly)">${T()}</g></g>` +
      [120, 380, 610, 820].map((y, k) => `<rect x="0" y="${y}" width="${S}" height="${10 + k * 6}" fill="${k % 2 ? '#2af0ff' : '#ff2a4f'}" opacity=".35" style="mix-blend-mode:screen"/>`).join(''),
  ];
  const body = V[i]();
  const vig = `<defs><radialGradient id="avv" cx="50%" cy="50%" r="72%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs><rect width="${S}" height="${S}" fill="url(#avv)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${DEFS2}
    <defs><filter id="redtint2" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.9 0.3 0.1 0 0.04  0.12 0.35 0.08 0 0  0.1 0.18 0.3 0 0  0 0 0 1 0"/></filter></defs>
    <rect width="${S}" height="${S}" fill="#000"/>${body}${vig}${grain(7 + i, .07).replace(/width="1080" height="1920"/g, 'width="1024" height="1024"')}</svg>`;
};
