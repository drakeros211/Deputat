// Обложка «Стрим 24/7»
window.renderCover = function () {
  uid = 0;
  const fig = `<g filter="url(#glow)"><path d="M790 1500 l-130 0 l30 -640 c0 -110 40 -190 100 -200 c60 10 100 90 100 200 l30 640z" fill="#030206" stroke="#9b5cff" stroke-width="6"/></g>
    <circle cx="735" cy="760" r="12" fill="#ff2a3a" filter="url(#glow)"/><circle cx="790" cy="760" r="12" fill="#ff2a3a" filter="url(#glow)"/>
    <path d="M640 1060 C560 1100 520 1160 500 1220 M940 1060 C1000 1110 1020 1170 1020 1230" stroke="#030206" stroke-width="34" stroke-linecap="round"/>`;
  const scene = room({ doorOpen: false }) + `<rect width="1080" height="1920" fill="#0a0820" opacity=".35"/>` + fig + tm({ t: 1.5, f: 0, talk: false, emo: 'terrified', mouth: 1, headRot: 6, x: 400, y: 1820, s: 1.05 }) + desk() + `<rect width="1080" height="1920" fill="#2a6cff" opacity=".1" style="mix-blend-mode:screen"/>`;
  const msgs = [{ n: 'user_0333', m: 'НЕ ОБОРАЧИВАЙСЯ', red: true, big: true }, { n: 'user_0334', m: 'ОН СТОИТ СЗАДИ', red: true, big: true }, { n: 'user_0335', m: 'ТЁМА БЕГИ', red: true, big: true }];
  const title = `<g style="${RUB}" font-weight="900" text-anchor="middle">
    <text x="540" y="460" font-size="90" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="20" stroke-linejoin="round">НЕ ОБОРАЧИВАЙСЯ</text></g>`;
  const pill = `<g style="${RUB}" font-weight="900" transform="translate(540 600) rotate(-3)"><rect x="-430" y="-62" width="860" height="110" rx="20" fill="#9b5cff" stroke="#000" stroke-width="6"/>
    <text y="18" text-anchor="middle" font-size="50" fill="#fff">СТРИМ ВИДИТ БУДУЩЕЕ</text></g>`;
  const meter = `<g style="${RUB}" font-weight="900" transform="translate(90 1610)">
    <text x="0" y="0" font-size="40" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">ШАНС ДОСИДЕТЬ ДО УТРА</text>
    <rect x="0" y="20" width="640" height="40" rx="20" fill="#000" fill-opacity=".7" stroke="#fff" stroke-width="4"/><rect x="6" y="26" width="30" height="28" rx="14" fill="#ff2f3f"/>
    <text x="900" y="58" text-anchor="end" font-size="96" fill="#ff2f3f" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="12">3%</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS2}
    <rect width="${W}" height="${H}" fill="#000"/>${cam(scene, 560, 1000, 1.0)}<rect width="${W}" height="${H}" fill="#9b5cff" opacity=".08" style="mix-blend-mode:screen"/>
    ${chatPanel(0, msgs, { x: 540, y: 1330, w: 520, h: 250 }).replace(/font-size="38"/g, 'font-size="30"')}
    ${vignette(.7)}${grain(4, .1)}${liveBar(0, 1000000)}${title}${pill}${meter}</svg>`;
};
