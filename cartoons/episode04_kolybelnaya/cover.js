// Обложка «Колыбельная из радионяни»
window.renderCover = function () {
  uid = 0;
  const feed = camFeed(nurseryScene(1.0, { rock: 3, figure: figure(800, 1560, { back: true, lean: -12, s: .7 }) }), 1.0, 0, { time: '03:12:07' });
  const mon = unit(feed, 1.0, { lv: 5, s: 1.05, rot: 4 });
  const tyoma = char('T', { x: 300, y: 2120, s: 1.1, emo: 'terrified', t: 1.5, f: 0, talk: false, mouth: 1, headRot: 6 });
  const title = `<g style="${RUB}" font-weight="900" text-anchor="middle">
    <text x="540" y="330" font-size="96" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="20" stroke-linejoin="round">КТО ПОЁТ</text>
    <text x="540" y="470" font-size="112" fill="#7fe9ff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="22" stroke-linejoin="round">В РАДИОНЯНЕ?</text></g>`;
  const pill = `<g style="${RUB}" font-weight="900" transform="translate(560 1300) rotate(-4)"><rect x="-430" y="-62" width="860" height="110" rx="20" fill="#c4121c" stroke="#000" stroke-width="6"/>
    <text y="18" text-anchor="middle" font-size="48" fill="#fff">НАД КРОВАТКОЙ КТО-ТО ЕСТЬ</text></g>`;
  const verse = `<g style="${RUB}" font-weight="900"><rect x="70" y="160" width="300" height="64" rx="12" fill="#3a7bff"/><text x="220" y="204" text-anchor="middle" font-size="36" fill="#fff">♪ КУПЛЕТ 7/7</text></g>`;
  const meter = `<g style="${RUB}" font-weight="900" transform="translate(90 1610)">
    <text x="0" y="0" font-size="40" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">ШАНС ДОЖИТЬ ДО УТРА</text>
    <rect x="0" y="20" width="640" height="40" rx="20" fill="#000" fill-opacity=".7" stroke="#fff" stroke-width="4"/><rect x="6" y="26" width="44" height="28" rx="14" fill="#ff2f3f"/>
    <text x="900" y="58" text-anchor="end" font-size="96" fill="#ff2f3f" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="12">6%</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS2}
    <rect width="${W}" height="${H}" fill="#000"/><g transform="translate(560 940) scale(.82) translate(-540 -960)">${mon}</g>
    ${tyoma}<rect width="${W}" height="${H}" fill="#3a7bff" opacity=".12" style="mix-blend-mode:screen"/>${spotlight(560, 900, 1000, .5, '#01020a')}
    ${vignette(.75)}${grain(9, .1)}${verse}${title}${pill}${meter}</svg>`;
};
