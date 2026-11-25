// Обложка «Дача у бабушки»
window.renderCover = function () {
  uid = 0;
  const bg = `<g transform="translate(-80 -120) scale(1.15)">${A.D_WINDOW}</g>` + `<g transform="translate(-10 0)"><g transform="translate(250 420) scale(.6)"><g filter="url(#blur6)">${A.D_GARDEN.replace(/^<rect[^>]*>/, '')}</g></g></g>`;
  const granny = char('B', { x: 720, y: 1760, s: 1.25, emo: 'stare', t: 1.5, f: 0, talk: false, mouth: 0, headRot: -8 });
  const grin = `<g transform="translate(720 1760) scale(1.25) translate(-512 -1030)"><path d="M440 636 q72 40 144 0 q-72 16 -144 0z" fill="#5a2228" stroke="#1d1a1c" stroke-width="5"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${456 + i * 20}" y="638" width="14" height="10" fill="#f2eee2"/>`).join('')}</g>`;
  const tyoma = char('T', { x: 290, y: 2080, s: 1.12, emo: 'terrified', t: 1.5, f: 0, talk: false, mouth: 1, headRot: 6 });
  const title = `<g style="${RUB}" font-weight="900" text-anchor="middle">
    <text x="540" y="400" font-size="128" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="22" stroke-linejoin="round">НЕ ОТВЕЧАЙ</text>
    <text x="540" y="560" font-size="150" fill="#ff2236" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="24" stroke-linejoin="round">БАБУШКЕ</text></g>`;
  const pill = `<g style="${RUB}" font-weight="900" transform="translate(540 720) rotate(-4)"><rect x="-440" y="-62" width="880" height="110" rx="20" fill="#c4121c" stroke="#000" stroke-width="6"/>
    <text y="18" text-anchor="middle" font-size="50" fill="#fff">ОНА ЗОВЁТ ИЗ ОГОРОДА</text></g>`;
  const timer = `<g style="${MONO}" font-weight="800"><rect x="70" y="210" width="560" height="64" rx="12" fill="#000" fill-opacity=".75" stroke="#e7b545" stroke-width="3"/><circle cx="102" cy="242" r="11" fill="#ff2f3f"/><text x="126" y="256" font-size="34" fill="#ffd0d0">ДО РАССВЕТА 04:00:00</text></g>`;
  const meter = `<g style="${RUB}" font-weight="900" transform="translate(90 1610)">
    <text x="0" y="0" font-size="38" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">ШАНС ДОЖИТЬ ДО РАССВЕТА</text>
    <rect x="0" y="20" width="640" height="40" rx="20" fill="#000" fill-opacity=".7" stroke="#fff" stroke-width="4"/><rect x="6" y="26" width="58" height="28" rx="14" fill="#ff2f3f"/>
    <text x="900" y="58" text-anchor="end" font-size="96" fill="#ff2f3f" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="12">9%</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS2}
    <rect width="${W}" height="${H}" fill="#000"/>${bg}<rect width="${W}" height="${H}" fill="#06040a" opacity=".45"/>${granny}${grin}
    <rect width="${W}" height="${H}" fill="#ff8a40" opacity=".08" style="mix-blend-mode:screen"/>${tyoma}${spotlight(600, 900, 1000, .5)}
    ${vignette(.75)}${grain(5, .1)}${timer}${title}${pill}${meter}</svg>`;
};
