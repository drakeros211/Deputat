// Обложка «Глубинный»: 1080x1920, всё важное в центральной зоне 3:4 (y 240..1680)
window.renderCover = function () {
  uid = 0;
  const t = 2.0, f = 50;
  const sky = `<defs><linearGradient id="cskyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030712"/><stop offset=".6" stop-color="#0c1d3a"/><stop offset="1" stop-color="#123050"/></linearGradient>
    <radialGradient id="cglow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7fe9ff" stop-opacity=".45"/><stop offset="1" stop-color="#7fe9ff" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#cskyG)"/>`;
  const monster = `<ellipse cx="540" cy="760" rx="520" ry="620" fill="url(#cglow)"/>` + mon(540, 2350, 1.45, 1, { t });
  const city = `<g transform="translate(-200 520)">${A.CITY_LIT.replace(/^<rect[^>]*>/, '')}</g><rect y="700" width="${W}" height="1000" fill="#020610" opacity=".55"/>` + `<rect y="1520" width="${W}" height="400" fill="#03060d"/>` + waterGlow(t, 540, 1540, 520, .55);
  const helis = [[170, 520, -12], [900, 430, 10]].map(([x, y, r]) => `<path d="M${x} ${y} L${520 + (x - 540) * .2} 1100 L${560 + (x - 540) * .2} 1100Z" fill="#fff8d0" opacity=".13"/><g transform="translate(${x} ${y}) rotate(${r}) scale(.7)">${A.HELI}</g>`).join('');
  const tyoma = char('T', { x: 770, y: 2090, s: 1.15, emo: 'terrified', t: 0, f: 0, talk: false, headRot: -6 });
  const light = `<rect width="${W}" height="${H}" fill="#3ad0ff" opacity=".1" style="mix-blend-mode:screen"/>`;
  const title = `<g style="${RUB}" font-weight="900" text-anchor="middle">
    <text x="540" y="430" font-size="150" fill="#7fe9ff" opacity=".55" filter="url(#glow)">ГЛУБИННЫЙ</text>
    <text x="540" y="430" font-size="150" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#03121c" stroke-width="22" stroke-linejoin="round">ГЛУБИННЫЙ</text></g>`;
  const live = `<g style="${RUB}" font-weight="900"><rect x="70" y="210" width="190" height="64" rx="10" fill="#c4121c"/><circle cx="100" cy="242" r="10" fill="#fff"/><text x="185" y="256" text-anchor="middle" font-size="38" fill="#fff">LIVE</text>
    <rect x="270" y="210" width="380" height="64" rx="10" fill="#000" fill-opacity=".7"/><text x="460" y="255" text-anchor="middle" font-size="34" fill="#fff">ВЫСОТА: 87 М</text></g>`;
  const pill = `<g style="${RUB}" font-weight="900" transform="translate(540 1170) rotate(-4)"><rect x="-420" y="-62" width="840" height="110" rx="20" fill="#c4121c" stroke="#000" stroke-width="6"/>
    <text y="18" text-anchor="middle" font-size="54" fill="#fff">ОН СМОТРИТ НА НАШ ДОМ</text></g>`;
  const meter = `<g style="${RUB}" font-weight="900" transform="translate(90 1610)">
    <text x="0" y="0" font-size="40" fill="#fff" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="8">ШАНС ВЫЖИТЬ</text>
    <rect x="0" y="20" width="640" height="40" rx="20" fill="#000" fill-opacity=".7" stroke="#fff" stroke-width="4"/>
    <rect x="6" y="26" width="44" height="28" rx="14" fill="#ff2f3f"/>
    <text x="900" y="58" text-anchor="end" font-size="96" fill="#ff2f3f" style="paint-order:stroke;${RUB}" stroke="#000" stroke-width="12">7%</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS2}
    <rect width="${W}" height="${H}" fill="#000"/>${sky}${monster}${helis}${city}${rain(t, .35, 90)}${tyoma}${light}
    ${vignette(.7)}${grain(f, .1)}${live}${title}${pill}${meter}</svg>`;
};
