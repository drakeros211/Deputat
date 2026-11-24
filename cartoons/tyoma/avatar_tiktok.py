"""Аватарка для TikTok: Тёма косится на руку существа у себя на плече.
Запуск: python3 avatar_tiktok.py && node render.js"""
from gen import svg, torso, head, OUT

W = 1024
defs = '''<defs>
  <radialGradient id="bgR" cx="55%" cy="52%" r="65%">
    <stop offset="0" stop-color="#8e1a26"/><stop offset=".45" stop-color="#3b0a11"/><stop offset="1" stop-color="#060203"/></radialGradient>
  <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".45" stop-color="#000" stop-opacity=".05"/>
    <stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
  <linearGradient id="phoneLight" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#9fd8ff" stop-opacity=".45"/><stop offset=".6" stop-color="#9fd8ff" stop-opacity="0"/></linearGradient>
  <filter id="blur30"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <pattern id="grain2" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#fff" opacity=".07"/><circle cx="3.5" cy="3.5" r=".7" fill="#000" opacity=".2"/></pattern>
  <radialGradient id="vig2" cx="50%" cy="50%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
</defs>'''

bg = f'<rect width="{W}" height="{W}" fill="url(#bgR)"/>'

# Существо за спиной: вытянутая голова, светящиеся глаза, тонкая улыбка
creature = '''
<g>
  <path d="M-40 1024 L-40 520 C-20 380 40 300 90 230 C110 120 170 40 230 40 C300 40 350 120 352 240
           C356 330 330 420 300 480 C340 560 360 640 360 700 L360 1024 Z" fill="#070204" stroke="#ff3a4c" stroke-opacity=".35" stroke-width="4"/>
  <g filter="url(#glow)">
    <ellipse cx="186" cy="250" rx="20" ry="10" fill="#ffe9c2" transform="rotate(14 186 250)"/>
    <ellipse cx="280" cy="236" rx="20" ry="10" fill="#ffe9c2" transform="rotate(-12 280 236)"/>
    <circle cx="188" cy="251" r="5" fill="#d1121f"/><circle cx="278" cy="237" r="5" fill="#d1121f"/>
  </g>
  <path d="M150 330 Q230 380 318 316" fill="none" stroke="#e8ddd0" stroke-width="5" stroke-linecap="round" opacity=".85"/>
  <path d="M168 338 l6 14 M190 348 l5 15 M214 354 l4 15 M240 354 l3 14 M264 348 l2 14 M288 336 l1 13" stroke="#e8ddd0" stroke-width="3" opacity=".75"/>
</g>'''

# Рука существа на плече Тёмы (рисуется поверх худи)
hand = '''
<g>
  <path d="M-20 760 C60 740 150 760 230 800 L250 860 C170 850 80 840 -20 860 Z" fill="#0b0507" stroke="#000" stroke-width="5"/>
  <path d="M200 790 C240 770 300 770 340 790 C350 820 330 850 300 860 L230 860 Z" fill="#120a0d" stroke="#000" stroke-width="5"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M300 790 C360 780 400 800 410 840 L416 880" stroke="#000" stroke-width="20"/>
    <path d="M300 790 C360 780 400 800 410 840 L416 880" stroke="#1a1014" stroke-width="12"/>
    <path d="M316 806 C380 806 420 840 424 880 L420 930" stroke="#000" stroke-width="20"/>
    <path d="M316 806 C380 806 420 840 424 880 L420 930" stroke="#1a1014" stroke-width="12"/>
    <path d="M314 826 C370 836 396 870 396 910 L388 960" stroke="#000" stroke-width="20"/>
    <path d="M314 826 C370 836 396 870 396 910 L388 960" stroke="#1a1014" stroke-width="12"/>
    <path d="M300 846 C340 866 356 896 352 930 L344 966" stroke="#000" stroke-width="18"/>
    <path d="M300 846 C340 866 356 896 352 930 L344 966" stroke="#1a1014" stroke-width="10"/>
  </g>
  <g fill="#d8cfc4" stroke="#000" stroke-width="2">
    <path d="M410 874 l14 4 l-6 22z"/><path d="M414 924 l14 2 l-10 22z"/>
    <path d="M382 954 l14 2 l-12 20z"/><path d="M338 960 l12 2 l-12 18z"/>
  </g>
</g>'''

# Тёма крупнее и чуть правее центра
tyoma = f'''
<ellipse cx="560" cy="470" rx="250" ry="270" fill="#ff3046" opacity=".55" filter="url(#blur30)"/>
<g transform="translate(560 560) scale(1.12) translate(-512 -540)">
  {torso()}{head("side", sweat=True)}
</g>
<rect width="{W}" height="{W}" fill="url(#phoneLight)"/>'''

body = (defs + bg + creature + tyoma + hand +
        f'<rect width="{W}" height="{W}" fill="url(#shade)"/>'
        f'<rect width="{W}" height="{W}" fill="url(#grain2)"/>'
        f'<rect width="{W}" height="{W}" fill="url(#vig2)"/>')
open(f"{OUT}/avatar_tiktok.svg", "w").write(svg(W, W, body))

# Превью: как аватарка будет выглядеть в круге TikTok
prev = (f'<defs><clipPath id="circ"><circle cx="512" cy="512" r="470"/></clipPath></defs>'
        f'<rect width="{W}" height="{W}" fill="#ffffff"/>'
        f'<g clip-path="url(#circ)">{body}</g>'
        f'<circle cx="512" cy="512" r="470" fill="none" stroke="#e5e5e5" stroke-width="4"/>')
open(f"{OUT}/avatar_tiktok_circle.svg", "w").write(svg(W, W, prev))
print("ok")
