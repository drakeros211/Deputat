"""Тёма-блогер: аватарка + макет профиля TikTok.
Запуск: python3 blogger.py && node render.js"""
from gen import svg, torso, head, OUT, C, LW

W = 1024
l = C["line"]

defs = '''<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffcf4a"/><stop offset=".55" stop-color="#ff8a4c"/><stop offset="1" stop-color="#ff5f7e"/></linearGradient>
  <radialGradient id="sunC" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
  <filter id="sh"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#7a2a1a" flood-opacity=".35"/></filter>
</defs>'''


def rays(cx, cy, n=18, r=900):
    import math
    out = []
    for i in range(n):
        a1 = 2 * math.pi * i / n
        a2 = a1 + math.pi / n
        out.append(f'M{cx} {cy} L{cx + r*math.cos(a1):.0f} {cy + r*math.sin(a1):.0f} L{cx + r*math.cos(a2):.0f} {cy + r*math.sin(a2):.0f}Z')
    return f'<path d="{" ".join(out)}" fill="#fff" opacity=".13"/>'


def bubble(x, y, s, rot, fill, inner):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" filter="url(#sh)">'
            f'<path d="M-70 -50 h140 a30 30 0 0 1 30 30 v50 a30 30 0 0 1 -30 30 h-80 l-40 34 l6 -34 h-26 a30 30 0 0 1 -30 -30 v-50 a30 30 0 0 1 30 -30z" '
            f'fill="{fill}" stroke="{l}" stroke-width="6"/>{inner}</g>')


# Микрофон в руке (на переднем плане, справа)
mic = f'''
<g transform="translate(-25 -20) rotate(-22 790 820)">
  <rect x="762" y="760" width="56" height="240" rx="18" fill="#2d2f36" stroke="{l}" stroke-width="{LW}"/>
  <rect x="770" y="780" width="10" height="200" rx="5" fill="#4a4d57"/>
  <rect x="756" y="742" width="68" height="36" rx="10" fill="#f08a3c" stroke="{l}" stroke-width="{LW}"/>
  <circle cx="790" cy="690" r="66" fill="#c9ccd3" stroke="{l}" stroke-width="{LW}"/>
  <clipPath id="micclip"><circle cx="790" cy="690" r="62"/></clipPath>
  <g clip-path="url(#micclip)" stroke="#8d919b" stroke-width="4">
    {''.join(f'<line x1="{720+i*16}" y1="620" x2="{720+i*16}" y2="760"/>' for i in range(10))}
    {''.join(f'<line x1="720" y1="{620+i*16}" x2="860" y2="{620+i*16}"/>' for i in range(10))}
  </g>
  <path d="M748 660 a50 50 0 0 1 40 -30" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>
  <!-- кулак -->
  <rect x="730" y="830" width="120" height="120" rx="40" fill="{C["skin"]}" stroke="{l}" stroke-width="{LW}"/>
  <path d="M744 860 h50 M744 890 h50 M744 920 h46" stroke="{C["skin_sh"]}" stroke-width="7" stroke-linecap="round"/>
  <path d="M796 836 q40 6 40 44" fill="none" stroke="{l}" stroke-width="{LW}" stroke-linecap="round"/>
  <!-- рукав -->
  <path d="M720 940 h150 l40 120 h-230z" fill="{C["hood"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <rect x="716" y="930" width="158" height="40" rx="14" fill="{C["hood_sh"]}" stroke="{l}" stroke-width="{LW}"/>
</g>'''

# звёздочки-искры
def spark(x, y, s, c="#fff"):
    return f'<path transform="translate({x} {y}) scale({s})" d="M0 -30 Q4 -4 30 0 Q4 4 0 30 Q-4 4 -30 0 Q-4 -4 0 -30Z" fill="{c}" stroke="{l}" stroke-width="3"/>'


avatar_body = (
    defs +
    f'<rect width="{W}" height="{W}" fill="url(#sky)"/>' + rays(512, 470) +
    '<circle cx="512" cy="470" r="380" fill="url(#sunC)"/>' +
    bubble(190, 250, 1.0, -10, "#ffffff",
           '<text x="0" y="22" font-size="64" text-anchor="middle" style="font-family:Inter" font-weight="900" fill="#ff5f7e">!</text>'
           '<circle cx="-40" cy="5" r="9" fill="#ff8a4c"/><circle cx="40" cy="5" r="9" fill="#ff8a4c"/>') +
    bubble(850, 230, 0.8, 12, "#8fe3c8",
           '<text x="0" y="20" font-size="56" text-anchor="middle" style="font-family:Inter" font-weight="900" fill="#1d1a1c">?</text>') +
    spark(150, 560, 1.2, "#fff6c8") + spark(890, 470, 0.9) + spark(300, 120, 0.7) + spark(760, 110, 0.8, "#fff6c8") +
    f'<g transform="translate(512 560) scale(1.12) translate(-512 -540)">{torso()}{head("happy")}</g>' +
    mic
)
open(f"{OUT}/avatar_blogger.svg", "w").write(svg(W, W, avatar_body))

prev = (f'<defs><clipPath id="circ"><circle cx="512" cy="512" r="480"/></clipPath></defs>'
        f'<rect width="{W}" height="{W}" fill="#fff"/><g clip-path="url(#circ)">{avatar_body}</g>')
open(f"{OUT}/avatar_blogger_circle.svg", "w").write(svg(W, W, prev))

# ---------- Макет профиля TikTok ----------
PW, PH = 1080, 1500
font = 'style="font-family:Inter,\'Noto Color Emoji\'"'
stats = [("12", "Подписки"), ("0", "Подписчики"), ("0", "Лайки")]
st = "".join(
    f'<text x="{260 + i*280}" y="760" {font} font-size="44" font-weight="800" fill="#161823" text-anchor="middle">{n}</text>'
    f'<text x="{260 + i*280}" y="808" {font} font-size="30" fill="#8a8b91" text-anchor="middle">{t}</text>'
    for i, (n, t) in enumerate(stats))
bio = ["Привет, я Тёма 👋 14 лет, панелька, 7 этаж",
       "Рассказываю истории: смешные, жизненные,",
       "странные и немного страшные 🎧",
       "Пиши в комменты — о чём рассказать дальше 👇"]
bio_svg = "".join(f'<text x="540" y="{1000 + i*48}" {font} font-size="32" fill="#161823" text-anchor="middle">{b}</text>'
                  for i, b in enumerate(bio))
grid = "".join(
    f'<rect x="{6 + (i%3)*358}" y="{1250 + (i//3)*10}" width="352" height="420" fill="{c}"/>'
    for i, c in enumerate(["#ffcf4a", "#ff8a4c", "#ff5f7e"]))
profile = (
    f'<rect width="{PW}" height="{PH}" fill="#fff"/>'
    f'<text x="540" y="90" {font} font-size="38" font-weight="700" fill="#161823" text-anchor="middle">Тёма | Истории</text>'
    f'<defs><clipPath id="pc"><circle cx="540" cy="330" r="190"/></clipPath></defs>'
    f'<g clip-path="url(#pc)"><g transform="translate(350 140) scale(0.371)">{avatar_body}</g></g>'
    f'<text x="540" y="590" {font} font-size="38" font-weight="700" fill="#161823" text-anchor="middle">@tyoma.rasskazhet</text>'
    + st +
    f'<rect x="250" y="860" width="420" height="96" rx="10" fill="#fe2c55"/>'
    f'<text x="460" y="922" {font} font-size="36" font-weight="700" fill="#fff" text-anchor="middle">Подписаться</text>'
    f'<rect x="690" y="860" width="140" height="96" rx="10" fill="#f1f1f2"/>'
    f'<text x="760" y="922" {font} font-size="36" font-weight="700" fill="#161823" text-anchor="middle">▾</text>'
    + bio_svg +
    f'<line x1="0" y1="1235" x2="{PW}" y2="1235" stroke="#e3e3e4" stroke-width="2"/>'
    f'<rect x="135" y="1229" width="270" height="6" fill="#161823"/>'
    + grid +
    ''.join(f'<text x="{182 + i*358}" y="{1360}" {font} font-size="34" font-weight="800" fill="#fff" text-anchor="middle">Серия {i+1}</text>' for i in range(3))
)
open(f"{OUT}/profile_mockup.svg", "w").write(svg(PW, PH, profile))
print("ok")
