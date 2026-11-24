// Обложка (превью) для TikTok: 1080x1920, главное — в центральной зоне 3:4 (y 240..1680)
window.renderCover = function () {
  uid = 0;
  const t = 1.3, f = 40;
  const corridor = cam(A.BG_corr_plain + nurse(470, 1720, .66, { t: 0, tilt: 5 }), 560, 900, 1.25);
  const bg = `<g filter="url(#redtint)">${corridor}</g>
    <defs><radialGradient id="nglow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff3344" stop-opacity=".35"/><stop offset="1" stop-color="#ff3344" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="420" cy="980" rx="380" ry="520" fill="url(#nglow)"/>` + spotlight(450, 950, 900, .5);
  const tyoma = char('T', { x: 760, y: 2080, s: 1.18, emo: 'terrified', t: 0, f: 0, talk: false, headRot: -6 });
  const phoneLight = `<rect width="${W}" height="${H}" fill="#2a6cff" opacity=".12" style="mix-blend-mode:screen"/>`;
  const hand = `<g transform="translate(760 1330) rotate(14)"><rect x="-40" y="-90" width="230" height="250" rx="30" fill="${'#f0c39b'}" stroke="#1d1a1c" stroke-width="5" opacity="0"/>
     <path d="M-70 -260 C-30 -300 40 -300 70 -270 L120 -150 L90 -120 L40 -210 Z" fill="#e9e5dc" stroke="#1d1a1c" stroke-width="5" opacity="0"/></g>`;
  const corners = `<g stroke="#fff" stroke-width="7" fill="none" opacity=".85"><path d="M60 300 v-80 h80 M1020 300 v-80 h-80 M60 1640 v80 h80 M1020 1640 v80 h-80"/></g>`;
  const rec = `<g style="${MONO}" font-weight="800"><circle cx="110" cy="270" r="14" fill="#ff2f3f"/><text x="136" y="284" font-size="40" fill="#fff">REC 03:33</text></g>`;
  const title = `<g style="${RUB}" font-weight="900" text-anchor="middle">
    <text x="540" y="470" font-size="190" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="26" stroke-linejoin="round">ПАЛАТА</text>
    <text x="540" y="700" font-size="260" fill="#ff2236" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="30" stroke-linejoin="round">33</text></g>`;
  const pill = `<g style="${RUB}" font-weight="900" transform="translate(540 1170) rotate(-4)"><rect x="-450" y="-62" width="900" height="110" rx="20" fill="#c4121c" stroke="#000" stroke-width="6"/>
    <text y="18" text-anchor="middle" font-size="58" fill="#fff">НЕ СМОТРИ ЧЕРЕЗ КАМЕРУ</text></g>`;
  const meter = `<g style="${RUB}" font-weight="900" transform="translate(90 1610)">
    <text x="0" y="0" font-size="40" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">ШАНС ВЫЖИТЬ</text>
    <rect x="0" y="20" width="640" height="40" rx="20" fill="#000" fill-opacity=".7" stroke="#fff" stroke-width="4"/>
    <rect x="6" y="26" width="28" height="28" rx="14" fill="#ff2f3f"/>
    <text x="860" y="58" text-anchor="end" font-size="96" fill="#ff2f3f" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="12">4%</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS2}
    <defs><filter id="redtint" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.9 0.3 0.1 0 0.04  0.12 0.35 0.08 0 0  0.1 0.18 0.3 0 0  0 0 0 1 0"/></filter></defs>
    <rect width="${W}" height="${H}" fill="#000"/>${bg}${tyoma}${phoneLight}${hand}
    ${vignette(.75)}${grain(f, .1)}${corners}${rec}${title}${pill}${meter}</svg>`;
};
