"""Генератор графики персонажа Тёма (SVG). Запуск: python3 gen.py -> svg/*.svg"""
import os

OUT = os.path.join(os.path.dirname(__file__), "svg")
os.makedirs(OUT, exist_ok=True)

# Палитра персонажа
C = dict(
    line="#1d1a1c",
    skin="#f0c39b", skin_sh="#d79f78", blush="#e9967f",
    hair="#2a211d", hair_hl="#4a3a31",
    hood="#3f7d68", hood_sh="#2c5b4c", hood_dk="#22463b",
    string="#e8e2d0",
    phone_band="#2b2d33", phone_cup="#3a3d45", phone_acc="#f08a3c",
    eye="#fbf8f1", iris="#4a3324", pupil="#141012",
    plaster="#e9c79a", plaster_dot="#c9a172",
    jeans="#3c5a8c", jeans_sh="#2c4470",
    shoe="#f2f0ea", shoe_acc="#c8343a", sole="#9a958c",
)
LW = 5  # толщина контура


def eyes(emo):
    """Глаза + брови. Центры глаз: (445,495) и (580,495)."""
    L, R = (445, 495), (580, 495)
    out = []
    rx, ry = 40, 48
    pup_r, pdx, pdy = 19, 4, 4
    lid = 0  # опущенное веко (0..1)
    brow = dict(neutral=(0, 0), scared=(-22, 14), shocked=(-30, 0),
                smirk=(-4, -6), tired=(6, -10), angry=(10, -18))[emo]
    if emo == "scared":
        pup_r, pdx, pdy = 9, -6, 2
        ry = 52
    if emo == "shocked":
        pup_r, ry, rx = 11, 56, 44
        pdx, pdy = 0, 0
    if emo == "smirk":
        lid = 0.35; pdx = 8
    if emo == "tired":
        lid = 0.45; pdy = 10
    if emo == "angry":
        lid = 0.2; pup_r = 16
    for i, (cx, cy) in enumerate((L, R)):
        cid = f"eyeclip{i}{emo}"
        out.append(f'<clipPath id="{cid}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>')
        out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{C["eye"]}"/>')
        g = f'<g clip-path="url(#{cid})">'
        g += f'<circle cx="{cx+pdx}" cy="{cy+pdy}" r="{pup_r+9}" fill="{C["iris"]}"/>'
        g += f'<circle cx="{cx+pdx}" cy="{cy+pdy}" r="{pup_r}" fill="{C["pupil"]}"/>'
        g += f'<circle cx="{cx+pdx-pup_r*0.45-4}" cy="{cy+pdy-pup_r*0.5-4}" r="{max(5, pup_r*0.38)}" fill="#fff"/>'
        if lid:
            top = cy - ry
            g += f'<rect x="{cx-rx-2}" y="{top-2}" width="{rx*2+4}" height="{ry*2*lid+2}" fill="{C["skin_sh"]}"/>'
            g += f'<line x1="{cx-rx}" y1="{top+ry*2*lid}" x2="{cx+rx}" y2="{top+ry*2*lid}" stroke="{C["line"]}" stroke-width="{LW}"/>'
        g += "</g>"
        out.append(g)
        out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{C["line"]}" stroke-width="{LW}"/>')
        if emo == "tired":
            out.append(f'<path d="M{cx-28} {cy+ry+10} q28 12 56 0" fill="none" stroke="{C["skin_sh"]}" stroke-width="5" stroke-linecap="round"/>')
        # бровь
        inner_dy, outer_dy = brow
        by = cy - ry - 22
        if i == 0:
            x1, x2 = cx - 38, cx + 34
            y1, y2 = by + outer_dy * 0.3, by + inner_dy
        else:
            x1, x2 = cx - 34, cx + 38
            y1, y2 = by + inner_dy, by + outer_dy * 0.3
            if emo == "smirk":
                y1 -= 14; y2 -= 18
        out.append(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{C["hair"]}" stroke-width="15" stroke-linecap="round"/>')
    return "".join(out)


def mouth(emo):
    l = C["line"]
    if emo == "neutral":
        return f'<path d="M478 612 q34 14 68 -2" fill="none" stroke="{l}" stroke-width="{LW+1}" stroke-linecap="round"/>'
    if emo == "scared":
        return (f'<path d="M470 622 q12 -18 28 -4 q14 -14 28 0 q14 -14 30 4 q-44 28 -86 0z" fill="#5a2228" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>'
                f'<path d="M478 618 h68" stroke="#fff" stroke-width="6"/>')
    if emo == "shocked":
        return (f'<ellipse cx="512" cy="628" rx="26" ry="34" fill="#5a2228" stroke="{l}" stroke-width="{LW}"/>'
                f'<ellipse cx="512" cy="646" rx="15" ry="10" fill="#c45a5f"/>')
    if emo == "smirk":
        return f'<path d="M476 618 q40 10 76 -18" fill="none" stroke="{l}" stroke-width="{LW+1}" stroke-linecap="round"/>'
    if emo == "tired":
        return f'<path d="M482 626 q30 -8 60 0" fill="none" stroke="{l}" stroke-width="{LW+1}" stroke-linecap="round"/>'
    if emo == "angry":
        return (f'<path d="M474 628 q38 -26 76 0 z" fill="#5a2228" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>'
                f'<path d="M482 622 h60" stroke="#fff" stroke-width="5"/>')


def head(emo="neutral", sweat=False):
    l = C["line"]
    s = []
    # уши
    for cx, flip in ((340, 1), (684, -1)):
        s.append(f'<ellipse cx="{cx}" cy="515" rx="30" ry="40" fill="{C["skin"]}" stroke="{l}" stroke-width="{LW}"/>')
        s.append(f'<path d="M{cx+8*flip} 500 q-14*{flip} 15 0 32" fill="none"/>')
        s.append(f'<path d="M{cx-6*flip} 498 q{12*flip} 18 0 34" fill="none" stroke="{C["skin_sh"]}" stroke-width="6" stroke-linecap="round"/>')
    # голова
    s.append(f'<path d="M512 300 C640 300 690 390 688 500 C686 610 620 690 512 690 C404 690 338 610 336 500 C334 390 384 300 512 300Z" fill="{C["skin"]}" stroke="{l}" stroke-width="{LW}"/>')
    # тень под волосами / скулы
    s.append(f'<path d="M352 560 C370 640 430 680 512 684 C440 670 390 630 372 560Z" fill="{C["skin_sh"]}" opacity=".5"/>')
    s.append(f'<ellipse cx="412" cy="585" rx="30" ry="14" fill="{C["blush"]}" opacity=".45"/>')
    s.append(f'<ellipse cx="616" cy="585" rx="30" ry="14" fill="{C["blush"]}" opacity=".45"/>')
    # волосы: растрёпанные пряди
    s.append(f'''<path d="M330 470 C318 400 336 330 392 292 C372 262 400 236 432 250
      C440 214 494 206 512 236 C534 200 590 210 598 248 C632 230 668 250 660 290
      C708 312 712 388 694 470 C684 430 668 400 650 384 C660 410 656 430 648 440
      C630 400 600 380 580 372 C590 396 586 410 578 420 C556 386 520 372 488 376
      C500 392 500 408 492 418 C468 392 432 384 410 392 C420 410 416 424 406 432
      C392 412 374 410 362 418 C352 432 340 450 330 470Z"
      fill="{C["hair"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>''')
    # блики/пряди
    s.append(f'<path d="M430 268 C460 256 500 258 520 280" fill="none" stroke="{C["hair_hl"]}" stroke-width="10" stroke-linecap="round"/>')
    s.append(f'<path d="M560 262 C590 262 620 278 632 300" fill="none" stroke="{C["hair_hl"]}" stroke-width="8" stroke-linecap="round"/>')
    # торчащий вихор
    s.append(f'<path d="M520 240 C530 200 560 186 580 190 C560 200 552 216 548 238Z" fill="{C["hair"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(eyes(emo))
    # нос
    s.append(f'<path d="M508 540 q-14 26 4 32 q10 2 16 -4" fill="none" stroke="{C["skin_sh"]}" stroke-width="7" stroke-linecap="round"/>')
    s.append(mouth(emo))
    # пластырь на щеке
    s.append(f'''<g transform="rotate(-24 630 560)">
      <rect x="596" y="546" width="70" height="28" rx="12" fill="{C["plaster"]}" stroke="{l}" stroke-width="4"/>
      <rect x="619" y="549" width="24" height="22" rx="3" fill="#f3dcb8"/>
      <circle cx="606" cy="556" r="2.5" fill="{C["plaster_dot"]}"/><circle cx="606" cy="566" r="2.5" fill="{C["plaster_dot"]}"/>
      <circle cx="656" cy="556" r="2.5" fill="{C["plaster_dot"]}"/><circle cx="656" cy="566" r="2.5" fill="{C["plaster_dot"]}"/></g>''')
    if sweat:
        s.append(f'<path d="M676 420 q-18 30 0 40 q18 -10 0 -40z" fill="#bfe3f5" stroke="{l}" stroke-width="4"/>')
    return "".join(s)


def torso():
    """Плечи, худи, капюшон, шнурки, наушники на шее (для бюста)."""
    l = C["line"]
    s = []
    # капюшон сзади
    s.append(f'<path d="M330 760 C330 690 400 660 512 660 C624 660 694 690 694 760 Z" fill="{C["hood_dk"]}" stroke="{l}" stroke-width="{LW}"/>')
    # шея
    s.append(f'<path d="M462 650 L462 740 L562 740 L562 650 Z" fill="{C["skin_sh"]}" stroke="{l}" stroke-width="{LW}"/>')
    # тело худи
    s.append(f'<path d="M150 1030 C160 860 220 770 360 740 L664 740 C804 770 864 860 874 1030 Z" fill="{C["hood"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>')
    # тени на худи
    s.append(f'<path d="M150 1030 C160 860 220 770 360 740 L330 800 C260 840 230 920 226 1030Z" fill="{C["hood_sh"]}"/>')
    s.append(f'<path d="M874 1030 C864 860 804 770 664 740 L700 800 C770 850 800 930 804 1030Z" fill="{C["hood_sh"]}"/>')
    # ворот капюшона
    s.append(f'<path d="M352 744 C400 820 624 820 672 744 C640 780 384 780 352 744Z" fill="{C["hood_sh"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>')
    # шнурки
    for x, sway in ((462, -8), (562, 10)):
        s.append(f'<path d="M{x} 800 q{sway} 70 {sway/2} 140" fill="none" stroke="{C["string"]}" stroke-width="8" stroke-linecap="round"/>')
        s.append(f'<rect x="{x+sway/2-6}" y="938" width="12" height="24" rx="3" fill="#9aa0a8" stroke="{l}" stroke-width="3"/>')
    # наушники на шее
    s.append(f'<path d="M392 770 C400 850 624 850 632 770" fill="none" stroke="{l}" stroke-width="26" stroke-linecap="round"/>')
    s.append(f'<path d="M392 770 C400 850 624 850 632 770" fill="none" stroke="{C["phone_band"]}" stroke-width="16" stroke-linecap="round"/>')
    for cx, rot in ((380, -20), (644, 20)):
        s.append(f'<g transform="rotate({rot} {cx} 790)"><rect x="{cx-38}" y="752" width="76" height="86" rx="30" fill="{C["phone_cup"]}" stroke="{l}" stroke-width="{LW}"/>'
                 f'<rect x="{cx-26}" y="766" width="52" height="58" rx="20" fill="{C["phone_band"]}"/>'
                 f'<circle cx="{cx}" cy="795" r="11" fill="{C["phone_acc"]}"/></g>')
    return "".join(s)


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<style>text{{font-family:"DejaVu Sans Mono",monospace;font-weight:bold}}</style>{body}</svg>')


def bg_podezd(w=1024, h=1024):
    """Фон: стена подъезда (низ — зелёная краска, верх — побелка), полумрак."""
    return f'''<defs>
      <radialGradient id="lamp" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#fff3c4" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="50%" cy="50%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
      <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="none"/><circle cx="1" cy="2" r=".8" fill="#000" opacity=".12"/><circle cx="4" cy="5" r=".7" fill="#fff" opacity=".06"/></pattern>
    </defs>
    <rect width="{w}" height="{h}" fill="#a9ab9f"/>
    <rect y="{h*0.55}" width="{w}" height="{h*0.45}" fill="#3e6658"/>
    <rect y="{h*0.55-6}" width="{w}" height="10" fill="#2c4b40"/>
    <path d="M90 {h*0.25} l40 60 l-15 50 l30 40" stroke="#7d7f74" stroke-width="3" fill="none"/>
    <rect x="{w-210}" y="{h*0.12}" width="130" height="90" fill="#c7c8bd" stroke="#6d6f66" stroke-width="3"/>
    <text x="{w-195}" y="{h*0.12+38}" font-size="22" fill="#4b4d46">ОБЪЯВЛЕНИЕ</text>
    <path d="M{w-190} {h*0.12+56} h90 M{w-190} {h*0.12+70} h70" stroke="#7d7f74" stroke-width="4"/>
    <rect width="{w}" height="{h}" fill="url(#grain)"/>
    <rect width="{w}" height="{h}" fill="#0b1a24" opacity=".35"/>
    <rect width="{w}" height="{h}" fill="url(#lamp)"/>'''


def hud(text="03:03", sub="НОЧЬ", x=40, y=40):
    return (f'<g><rect x="{x}" y="{y}" width="230" height="54" rx="8" fill="#141414" fill-opacity=".85" stroke="#d9a23a" stroke-width="3"/>'
            f'<circle cx="{x+28}" cy="{y+27}" r="9" fill="#e0353b"/>'
            f'<text x="{x+48}" y="{y+38}" font-size="30" fill="#f3d27a">{text}</text>'
            f'<text x="{x+150}" y="{y+37}" font-size="18" fill="#f3d27a">{sub}</text></g>')


# ---------- 1. Аватарка ----------
avatar = svg(1024, 1024, bg_podezd() + torso() + head("smirk") +
             '<rect width="1024" height="1024" fill="url(#vig)"/>' + hud())
open(f"{OUT}/avatar.svg", "w").write(avatar)

# ---------- 2. Лист эмоций ----------
emos = [("neutral", "СПОКОЕН"), ("smirk", "УХМЫЛКА"), ("scared", "СТРАХ"),
        ("shocked", "ШОК"), ("tired", "УСТАЛ"), ("angry", "ЗЛИТСЯ")]
cells = []
for i, (e, name) in enumerate(emos):
    cx, cy = (i % 3) * 400, (i // 3) * 460 + 120
    cells.append(f'<g transform="translate({cx+20} {cy}) scale(0.36)">'
                 f'<rect x="0" y="0" width="1024" height="1000" rx="40" fill="#24313a"/>'
                 f'<g transform="translate(0 -120)">{torso()}{head(e, sweat=e in ("scared","shocked"))}</g></g>'
                 f'<text x="{cx+204}" y="{cy+400}" font-size="28" fill="#f3d27a" text-anchor="middle">{name}</text>')
sheet = svg(1200, 1060, '<rect width="1200" height="1060" fill="#151c22"/>'
            '<text x="600" y="72" font-size="44" fill="#fff" text-anchor="middle">ТЁМА — ЭМОЦИИ</text>' + "".join(cells))
open(f"{OUT}/emotions.svg", "w").write(sheet)

# ---------- 3. Полный рост ----------
l = C["line"]
legs = f'''
  <path d="M410 1240 L392 1720 L492 1720 L512 1330 L532 1720 L632 1720 L614 1240Z" fill="{C["jeans"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <path d="M512 1330 L532 1720 L560 1720 L530 1300Z" fill="{C["jeans_sh"]}"/>
  <path d="M392 1720 L380 1790 L500 1790 L492 1720Z M532 1720 L524 1790 L644 1790 L632 1720Z" fill="{C["jeans_sh"]}" opacity=".0"/>
'''
shoes = ""
for x0, d in ((376, -1), (532, 1)):
    shoes += (f'<path d="M{x0} 1715 h120 l6 60 q0 26 -30 26 h-{110 if d<0 else 70} q-{40 if d<0 else 0} 0 -{40 if d<0 else 0} -24 z" fill="none"/>')
shoes = f'''
  <path d="M388 1712 L496 1712 L500 1772 L340 1772 Q330 1740 360 1728 Z" fill="{C["shoe"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <path d="M528 1712 L636 1712 L664 1728 Q694 1740 684 1772 L524 1772 Z" fill="{C["shoe"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <rect x="336" y="1768" width="168" height="18" rx="6" fill="{C["sole"]}" stroke="{l}" stroke-width="4"/>
  <rect x="520" y="1768" width="168" height="18" rx="6" fill="{C["sole"]}" stroke="{l}" stroke-width="4"/>
  <path d="M400 1730 l20 30 M424 1730 l20 30 M448 1730 l20 30" stroke="{C["shoe_acc"]}" stroke-width="8"/>
  <path d="M580 1730 l20 30 M604 1730 l20 30 M628 1730 l20 30" stroke="{C["shoe_acc"]}" stroke-width="8"/>
'''
body_full = f'''
  <path d="M330 760 C330 690 400 660 512 660 C624 660 694 690 694 760 Z" fill="{C["hood_dk"]}" stroke="{l}" stroke-width="{LW}"/>
  <path d="M462 650 L462 740 L562 740 L562 650 Z" fill="{C["skin_sh"]}" stroke="{l}" stroke-width="{LW}"/>
  <!-- руки -->
  <path d="M318 770 C270 800 252 900 250 1040 L246 1170 L316 1176 L326 1050 C330 960 340 880 360 840Z" fill="{C["hood"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <path d="M706 770 C754 800 772 900 774 1040 L778 1170 L708 1176 L698 1050 C694 960 684 880 664 840Z" fill="{C["hood"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <rect x="242" y="1160" width="80" height="34" rx="12" fill="{C["hood_sh"]}" stroke="{l}" stroke-width="{LW}"/>
  <rect x="702" y="1160" width="80" height="34" rx="12" fill="{C["hood_sh"]}" stroke="{l}" stroke-width="{LW}"/>
  <ellipse cx="282" cy="1226" rx="36" ry="40" fill="{C["skin"]}" stroke="{l}" stroke-width="{LW}"/>
  <!-- телефон в правой руке -->
  <rect x="704" y="1180" width="66" height="116" rx="12" fill="#1b1c22" stroke="{l}" stroke-width="{LW}" transform="rotate(8 737 1238)"/>
  <rect x="714" y="1192" width="46" height="84" rx="6" fill="#4e86c9" transform="rotate(8 737 1238)"/>
  <circle cx="738" cy="1236" r="8" fill="#e0353b" transform="rotate(8 737 1238)"/>
  <ellipse cx="742" cy="1250" rx="38" ry="40" fill="{C["skin"]}" stroke="{l}" stroke-width="{LW}"/>
  <!-- корпус -->
  <path d="M360 740 L664 740 C700 760 712 800 708 900 L696 1260 L328 1260 L316 900 C312 800 324 760 360 740Z" fill="{C["hood"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <path d="M328 1210 h368 v50 h-368z" fill="{C["hood_sh"]}" stroke="{l}" stroke-width="{LW}"/>
  <path d="M400 1050 h224 l20 110 h-264z" fill="{C["hood_sh"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>
  <path d="M352 744 C400 820 624 820 672 744 C640 780 384 780 352 744Z" fill="{C["hood_sh"]}" stroke="{l}" stroke-width="{LW}"/>
  <path d="M462 800 q-8 70 -4 140 M562 800 q10 70 5 140" fill="none" stroke="{C["string"]}" stroke-width="8" stroke-linecap="round"/>
  <path d="M392 770 C400 850 624 850 632 770" fill="none" stroke="{l}" stroke-width="26" stroke-linecap="round"/>
  <path d="M392 770 C400 850 624 850 632 770" fill="none" stroke="{C["phone_band"]}" stroke-width="16" stroke-linecap="round"/>
  <g transform="rotate(-20 380 790)"><rect x="342" y="752" width="76" height="86" rx="30" fill="{C["phone_cup"]}" stroke="{l}" stroke-width="{LW}"/><circle cx="380" cy="795" r="11" fill="{C["phone_acc"]}"/></g>
  <g transform="rotate(20 644 790)"><rect x="606" y="752" width="76" height="86" rx="30" fill="{C["phone_cup"]}" stroke="{l}" stroke-width="{LW}"/><circle cx="644" cy="795" r="11" fill="{C["phone_acc"]}"/></g>
'''
full = svg(1024, 1900, '<rect width="1024" height="1900" fill="#1f2a31"/>'
           '<ellipse cx="512" cy="1790" rx="260" ry="26" fill="#000" opacity=".35"/>'
           + legs + shoes + body_full + head("neutral"))
open(f"{OUT}/fullbody.svg", "w").write(full)

# ---------- 4. Палитра ----------
pal = [("Кожа", C["skin"]), ("Тень кожи", C["skin_sh"]), ("Волосы", C["hair"]),
       ("Худи", C["hood"]), ("Тень худи", C["hood_sh"]), ("Шнурки", C["string"]),
       ("Наушники", C["phone_cup"]), ("Акцент", C["phone_acc"]), ("Джинсы", C["jeans"]),
       ("Кроссовки", C["shoe"]), ("Полоски", C["shoe_acc"]), ("Контур", C["line"])]
sw = "".join(f'<rect x="{40+(i%4)*290}" y="{110+(i//4)*170}" width="110" height="110" rx="14" fill="{c}" stroke="#fff" stroke-width="2"/>'
             f'<text x="{165+(i%4)*290}" y="{155+(i//4)*170}" font-size="24" fill="#fff">{n}</text>'
             f'<text x="{165+(i%4)*290}" y="{188+(i//4)*170}" font-size="22" fill="#9fb0bb">{c}</text>'
             for i, (n, c) in enumerate(pal))
open(f"{OUT}/palette.svg", "w").write(svg(1200, 640, '<rect width="1200" height="640" fill="#151c22"/>'
     '<text x="40" y="70" font-size="40" fill="#fff">ТЁМА — ПАЛИТРА</text>' + sw))
print("ok")
