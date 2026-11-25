"""Ассеты «Дача у бабушки»: бабушка + деревенские фоны. Дописывает ключи в build/assets.js."""
import json
import math
import random

import assets_k as K  # база + «Глубинный»

A = K.A
B_ = K.B
LN, LW, W, H = B_.LN, B_.LW, B_.W, B_.H
eye, brow = B_.eye, B_.brow
random.seed(21)
G = dict(skin="#f1d2bb", skin_sh="#d9ae92", scarf="#c8343a", scarf_sh="#9e2229", dot="#ffe9d6", hair="#d9d6d0",
         card="#7a5638", card_sh="#5c3f27", dress="#3f5f8a", glass="#c9b28a")


# ================================================================ БАБУШКА
def g_base():
    s = []
    # платок сзади
    s.append(f'<path d="M320 600 C290 380 380 240 512 236 C644 240 734 380 704 600 C690 700 640 760 600 790 L424 790 C384 760 334 700 320 600Z" fill="{G["scarf"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M512 350 C624 350 664 430 662 520 C660 610 620 676 512 704 C404 676 364 610 362 520 C360 430 400 350 512 350Z" fill="{G["skin"]}" stroke="{LN}" stroke-width="{LW}"/>')
    # седая чёлка из-под платка
    s.append(f'<path d="M380 450 C400 400 450 380 512 380 C574 380 624 400 644 450 C600 430 560 430 512 440 C464 430 424 430 380 450Z" fill="{G["hair"]}" stroke="{LN}" stroke-width="4"/>')
    # платок спереди (край)
    s.append(f'<path d="M340 470 C340 330 420 268 512 266 C604 268 684 330 684 470 C650 400 590 372 512 370 C434 372 374 400 340 470Z" fill="{G["scarf"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append('<clipPath id="scarfC"><path d="M340 470 C340 330 420 268 512 266 C604 268 684 330 684 470 C650 400 590 372 512 370 C434 372 374 400 340 470Z M320 600 C290 380 330 470 340 470 L362 520 C360 610 400 676 430 700 L424 790 C384 760 334 700 320 600Z M704 600 C734 380 694 470 684 470 L662 520 C664 610 624 676 594 700 L600 790 C640 760 690 700 704 600Z"/></clipPath>')
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="9" fill="{G["dot"]}"/>' for x in range(300, 730, 46) for y in range(260, 800, 46))
    s.append(f'<g clip-path="url(#scarfC)">{dots}</g>')
    # узел под подбородком
    s.append(f'<path d="M470 700 C490 740 534 740 554 700 L590 790 C560 780 540 770 512 760 C484 770 464 780 434 790Z" fill="{G["scarf_sh"]}" stroke="{LN}" stroke-width="{LW}"/>')
    # морщинки, щёки, нос
    s.append(f'<ellipse cx="420" cy="590" rx="34" ry="18" fill="#e89a8a" opacity=".5"/><ellipse cx="604" cy="590" rx="34" ry="18" fill="#e89a8a" opacity=".5"/>')
    s.append(f'<path d="M500 548 q-18 34 6 40 q14 2 20 -8" fill="none" stroke="{G["skin_sh"]}" stroke-width="8" stroke-linecap="round"/>')
    s.append(f'<path d="M440 620 q-14 20 -6 40 M584 620 q14 20 6 40 M470 440 q42 -10 84 0" fill="none" stroke="{G["skin_sh"]}" stroke-width="5" stroke-linecap="round"/>')
    return "".join(s)


def g_glasses():
    return (f'<g fill="none" stroke="{G["glass"]}" stroke-width="8"><circle cx="455" cy="520" r="48"/><circle cx="569" cy="520" r="48"/><path d="M503 516 q9 -8 18 0"/></g>'
            f'<path d="M430 492 l20 -6 M544 492 l20 -6" stroke="#fff" stroke-width="6" opacity=".7"/>')


def g_eyes(emo):
    if emo == "smile":
        e = "".join(f'<path d="M{x - 24} 528 q24 -26 48 0" fill="none" stroke="{LN}" stroke-width="{LW + 2}" stroke-linecap="round"/>' for x in (455, 569))
        b = brow(420, 466, 488, 462, "#bdb8b0", 10, 6) + brow(536, 462, 604, 466, "#bdb8b0", 10, 6)
    else:  # stare — жуткий неподвижный взгляд
        e = "".join(eye(x, 522, 24, 26, 5, 0, 0, tag="gs") for x in (455, 569))
        b = brow(420, 470, 488, 470, "#bdb8b0", 10) + brow(536, 470, 604, 470, "#bdb8b0", 10)
    return e + b + g_glasses()


def g_blink():
    return "".join(f'<ellipse cx="{x}" cy="522" rx="27" ry="29" fill="{G["skin"]}"/><path d="M{x-24} 526 q24 10 48 0" fill="none" stroke="{LN}" stroke-width="{LW}"/>' for x in (455, 569)) + g_glasses()


def g_mouths(emo):
    cx, cy = 512, 640
    if emo == "smile":
        closed = f'<path d="M{cx-40} {cy} q40 24 80 0" fill="none" stroke="{LN}" stroke-width="{LW+1}" stroke-linecap="round"/>'
    else:
        closed = f'<path d="M{cx-34} {cy+4} h68" stroke="{LN}" stroke-width="{LW+1}" stroke-linecap="round"/>'
    o1 = f'<path d="M{cx-36} {cy-4} q36 30 72 0 q-36 10 -72 0z" fill="#5a2228" stroke="{LN}" stroke-width="{LW}"/>'
    o2 = f'<path d="M{cx-38} {cy-8} q38 52 76 0 q-38 12 -76 0z" fill="#5a2228" stroke="{LN}" stroke-width="{LW}"/><ellipse cx="{cx}" cy="{cy+18}" rx="16" ry="7" fill="#c9585e"/>'
    return [closed, o1, o2]


def g_torso():
    s = [f'<path d="M470 700 L470 770 L554 770 L554 700Z" fill="{G["skin_sh"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M150 1030 C160 870 230 780 380 755 L644 755 C794 780 864 870 874 1030 L890 1900 L134 1900Z" fill="{G["card"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>',
         f'<path d="M420 760 L512 980 L604 760Z" fill="{G["dress"]}" stroke="{LN}" stroke-width="{LW}"/>']
    for i in range(14):
        s.append(f'<circle cx="{450 + (i % 4) * 38}" cy="{800 + (i // 4) * 40}" r="7" fill="#f2e6c9" opacity=".8"/>')
    for y in range(1060, 1900, 60):
        s.append(f'<path d="M150 {y} q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="{G["card_sh"]}" stroke-width="5" fill="none" opacity=".6"/>')
    s.append(f'<path d="M512 980 L512 1900" stroke="{G["card_sh"]}" stroke-width="10"/>')
    for y in (1040, 1160, 1280):
        s.append(f'<circle cx="540" cy="{y}" r="12" fill="#e8d9b0" stroke="{LN}" stroke-width="3"/>')
    # платок спадает на плечи
    s.append(f'<path d="M380 760 L300 900 L512 860 L724 900 L644 760Z" fill="{G["scarf"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    return "".join(s)


# ================================================================ ФОНЫ
def wood_wall(col="#7a5232", col2="#5e3d22"):
    s = [f'<rect width="{W}" height="{H}" fill="{col}"/>']
    for y in range(0, H, 90):
        s.append(f'<rect y="{y}" width="{W}" height="86" fill="{col}" stroke="{col2}" stroke-width="4"/><path d="M{random.randint(0,900)} {y+40} q60 -10 120 0" stroke="{col2}" stroke-width="3" fill="none"/>')
    return "".join(s)


def car():
    s = ['<defs><linearGradient id="dusk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2f55"/><stop offset=".6" stop-color="#b0705a"/><stop offset="1" stop-color="#e2a06c"/></linearGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#dusk2)"/>']
    for i in range(40):
        x = random.randint(-50, W); h = random.randint(300, 700)
        s.append(f'<path d="M{x} 1150 l40 -{h} l40 {h}z" fill="#1d2a22"/>')
    s.append(f'<rect y="1100" width="{W}" height="200" fill="#2a2d33"/><path d="M540 1100 L500 1300 M540 1100 L580 1300" stroke="#e8e0c0" stroke-width="6" stroke-dasharray="30 30"/>')
    # салон
    s.append(f'<path d="M0 0 H{W} V420 C800 360 280 360 0 420Z" fill="#141416"/>')
    s.append(f'<path d="M0 1250 C300 1180 780 1180 {W} 1250 V{H} H0Z" fill="#1a1a1d"/>')
    s.append(f'<rect x="420" y="380" width="240" height="60" rx="14" fill="#222"/>')
    # мама со спины (за рулём, справа)
    s.append(f'<ellipse cx="300" cy="1180" rx="170" ry="200" fill="#3a2418"/><path d="M120 1300 C140 1200 460 1200 480 1300 L520 1920 L80 1920Z" fill="#6b2f3a"/>')
    s.append(f'<circle cx="300" cy="1040" r="60" fill="#3a2418"/>')
    s.append(f'<circle cx="660" cy="1400" r="150" fill="none" stroke="#111" stroke-width="40"/>')
    return "".join(s)


def forest_road():
    s = [f'<rect width="{W}" height="{H}" fill="#3a4060"/>', '<circle cx="800" cy="500" r="70" fill="#f2d39a" opacity=".7"/>']
    for layer, col in ((0, "#2a3a32"), (1, "#1c2a24"), (2, "#121c18")):
        for i in range(14):
            x = random.randint(-100, W + 50); h = 500 + layer * 300 + random.randint(0, 200)
            s.append(f'<path d="M{x} 1300 l{60 + layer*20} -{h} l{60 + layer*20} {h}z" fill="{col}"/>')
    s.append(f'<path d="M300 {H} L520 1150 L560 1150 L780 {H}Z" fill="#3b3a38"/><path d="M540 1160 L540 {H}" stroke="#d8d0b0" stroke-width="6" stroke-dasharray="40 50"/>')
    s.append(f'<rect y="1300" width="300" height="620" fill="#141e18"/><rect x="780" y="1300" width="300" height="620" fill="#141e18"/>')
    return "".join(s)


def izba(x, y, s=1.0, lit=True, dark=False):
    wall = "#6b4a2e" if not dark else "#2a1d12"
    win = "#ffd98a" if lit else "#0b0d12"
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<path d="M-260 0 L0 -200 L260 0Z" fill="{"#3b3f45" if not dark else "#14161a"}" stroke="{LN}" stroke-width="8"/>'
            f'<rect x="-230" y="0" width="460" height="300" fill="{wall}" stroke="{LN}" stroke-width="8"/>'
            + "".join(f'<line x1="-230" y1="{yy}" x2="230" y2="{yy}" stroke="{LN}" stroke-width="4" opacity=".5"/>' for yy in range(40, 300, 40))
            + f'<rect x="-150" y="80" width="100" height="120" fill="{win}" stroke="#e8e0c8" stroke-width="10"/><rect x="50" y="80" width="100" height="120" fill="{win}" stroke="#e8e0c8" stroke-width="10"/>'
            f'<path d="M-170 70 h140 l-20 -20 h-100z M30 70 h140 l-20 -20 h-100z" fill="#e8e0c8"/></g>')


def village():
    s = ['<defs><linearGradient id="dusk3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2448"/><stop offset="1" stop-color="#c27a5a"/></linearGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#dusk3)"/>']
    for i in range(10):
        x = random.randint(-50, W); s.append(f'<path d="M{x} 1100 l50 -{random.randint(300,500)} l50 {random.randint(300,500)}z" fill="#1c2a24"/>')
    s.append(f'<rect y="1100" width="{W}" height="820" fill="#3c4a2e"/>')
    s.append(izba(200, 1150, .5, True) + izba(860, 1130, .45, False) + izba(540, 1280, .9, True))
    s.append(f'<path d="M0 1700 L{W} 1700" stroke="#5a4028" stroke-width="10"/>' + "".join(f'<rect x="{i}" y="1600" width="16" height="130" fill="#6b4a2e" stroke="{LN}" stroke-width="3"/>' for i in range(0, W, 60)))
    return "".join(s)


def kitchen():
    s = [wood_wall()]
    # окно на огород
    s.append(f'<rect x="580" y="300" width="400" height="460" fill="#9fb7c9" stroke="#e8e0c8" stroke-width="22"/><line x1="780" y1="300" x2="780" y2="760" stroke="#e8e0c8" stroke-width="16"/><line x1="580" y1="520" x2="980" y2="520" stroke="#e8e0c8" stroke-width="14"/>')
    s.append(f'<rect x="590" y="560" width="380" height="190" fill="#5a7a3c"/>' + "".join(f'<path d="M{600 + i*36} 700 q10 -40 20 0" stroke="#2f4a1e" stroke-width="6" fill="none"/>' for i in range(10)))
    s.append(f'<path d="M560 290 q-40 300 0 490 L600 780 L600 300Z M1000 290 q40 300 0 490 L960 780 L960 300Z" fill="#c9524a" opacity=".85"/>')
    # печка
    s.append(f'<rect x="40" y="380" width="420" height="900" fill="#e8e2d6" stroke="{LN}" stroke-width="8"/><rect x="160" y="900" width="180" height="130" rx="10" fill="#1d1a18" stroke="{LN}" stroke-width="6"/>')
    # стол
    s.append(f'<rect y="1300" width="{W}" height="620" fill="#4a3220"/><rect x="60" y="1250" width="960" height="70" fill="#c9a46c" stroke="{LN}" stroke-width="6"/>')
    s.append(f'<rect x="80" y="1262" width="920" height="40" fill="#f2f2f2" opacity=".5"/>')
    return "".join(s)


def mirror(covered=True):
    s = [wood_wall("#6a4a30", "#4d321d"), f'<rect x="300" y="420" width="480" height="760" rx="30" fill="#9aa8b5" stroke="#3a2a1a" stroke-width="30"/>']
    if covered:
        s.append(f'<path d="M260 380 L820 380 L840 1260 C700 1230 600 1290 540 1250 C460 1300 380 1230 250 1270Z" fill="#e9e2cf" stroke="{LN}" stroke-width="6"/>'
                 f'<path d="M320 380 L330 1250 M760 380 L770 1250" stroke="#c9302c" stroke-width="14"/>'
                 f'<path d="M400 600 q140 60 280 0" stroke="#cfc6b0" stroke-width="6" fill="none"/>')
    return "".join(s)


def bedroom_door(locks=True):
    s = [wood_wall("#5a3c25", "#432a17"), f'<rect x="230" y="260" width="620" height="1400" fill="#7a5638" stroke="{LN}" stroke-width="12"/>']
    for y in (420, 900, 1380):
        s.append(f'<rect x="290" y="{y}" width="500" height="220" fill="none" stroke="#5c3f27" stroke-width="8"/>')
    s.append(f'<circle cx="790" cy="960" r="22" fill="#c9a86a" stroke="{LN}" stroke-width="4"/>')
    if locks:
        for y in (560, 960, 1360):
            s.append(f'<rect x="700" y="{y - 30}" width="120" height="60" rx="8" fill="#8b929c" stroke="{LN}" stroke-width="5"/><rect x="620" y="{y - 12}" width="100" height="24" fill="#b7bec8" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<rect y="1660" width="{W}" height="260" fill="#3a2716"/><rect x="230" y="1650" width="620" height="20" fill="#000" opacity=".8"/>')
    return "".join(s)


def hatch(open_=0.0):
    s = [f'<rect width="{W}" height="{H}" fill="#6b4a2e"/>']
    for x in range(0, W, 120):
        s.append(f'<rect x="{x}" y="0" width="116" height="{H}" fill="#6b4a2e" stroke="#4d321d" stroke-width="4"/>')
    s.append(f'<rect x="290" y="760" width="500" height="420" fill="#050302"/>')
    if open_ < 1:
        s.append(f'<g transform="translate(290 760) scale(1 {1 - open_})"><rect width="500" height="420" fill="#5c3f27" stroke="{LN}" stroke-width="8"/>'
                 f'<circle cx="250" cy="210" r="30" fill="none" stroke="#b7bec8" stroke-width="10"/></g>')
    s.append(f'<path d="M780 760 C860 700 960 760 1080 720" stroke="#111" stroke-width="10" fill="none"/>')
    return "".join(s)


def cellar():
    s = [f'<rect width="{W}" height="{H}" fill="#1a120b"/>']
    for i in range(12):
        s.append(f'<rect x="{random.randint(0,W)}" y="{random.randint(0,H)}" width="{random.randint(80,180)}" height="{random.randint(40,90)}" rx="20" fill="#2a1d12" stroke="#120b06" stroke-width="4"/>')
    s.append(f'<rect x="120" y="1200" width="840" height="60" fill="#5c3f27" stroke="{LN}" stroke-width="6"/>')
    # дисковый телефон
    s.append(f'<g transform="translate(540 1080)"><path d="M-200 120 L-160 -40 L160 -40 L200 120Z" fill="#2a2a2e" stroke="{LN}" stroke-width="8"/>'
             f'<path d="M-230 -60 C-230 -150 230 -150 230 -60 L180 -40 C180 -100 -180 -100 -180 -40Z" fill="#111" stroke="{LN}" stroke-width="8"/>'
             f'<circle cx="0" cy="40" r="80" fill="#e8e2d6" stroke="{LN}" stroke-width="6"/>'
             + "".join(f'<circle cx="{58*math.cos(a/10*2*math.pi):.0f}" cy="{40 + 58*math.sin(a/10*2*math.pi):.0f}" r="12" fill="#2a2a2e"/>' for a in range(10))
             + '</g>')
    s.append(f'<path d="M740 1080 C900 1000 900 400 1080 300" stroke="#111" stroke-width="10" fill="none"/>')
    return "".join(s)


def garden(night=True):
    s = [f'<rect width="{W}" height="{H}" fill="{"#060a16" if night else "#7fb0d8"}"/>', '<circle cx="820" cy="320" r="80" fill="#dfe6f2" opacity=".9"/>']
    for i in range(30):
        s.append(f'<circle cx="{random.randint(0,W)}" cy="{random.randint(0,800)}" r="2" fill="#fff" opacity=".6"/>')
    s.append(f'<rect y="900" width="{W}" height="1020" fill="#0d140c"/>')
    for r in range(8):
        y = 980 + r * 120
        s.append(f'<path d="M0 {y} Q540 {y - 30} {W} {y}" stroke="#1a2614" stroke-width="40" fill="none"/>')
        for c in range(9):
            x = 60 + c * 120 + (r % 2) * 50
            s.append(f'<path d="M{x} {y} q-20 -60 -40 -70 M{x} {y} q20 -70 40 -76 M{x} {y} l0 -80" stroke="#22361a" stroke-width="{6 + r}" fill="none"/>')
    # пугало
    s.append(f'<g transform="translate(760 1000)"><line x1="0" y1="0" x2="0" y2="400" stroke="#2a1d12" stroke-width="16"/><line x1="-140" y1="80" x2="140" y2="80" stroke="#2a1d12" stroke-width="14"/>'
             f'<circle cx="0" cy="-30" r="50" fill="#3a2d1e"/><path d="M-70 -50 h140 l-30 -40 h-80z" fill="#1d150d"/><path d="M-90 80 L-60 300 L60 300 L90 80Z" fill="#2a2620" opacity=".9"/></g>')
    s.append(f'<path d="M0 860 L{W} 860" stroke="#1d150d" stroke-width="8"/>' + "".join(f'<rect x="{i}" y="780" width="14" height="140" fill="#1d150d"/>' for i in range(0, W, 50)))
    return "".join(s)


def gate():
    s = [garden()]
    s.append(f'<g transform="translate(380 760)"><rect width="320" height="420" fill="#2a1d12" stroke="#000" stroke-width="8"/>' + "".join(f'<rect x="{i*40+10}" y="10" width="24" height="400" fill="#3a2a1a"/>' for i in range(8)) + '</g>')
    return "".join(s)


def house_corridor():
    s = [wood_wall("#2a1d12", "#1d140c"), f'<rect x="380" y="300" width="320" height="1200" fill="#050302" stroke="#120b06" stroke-width="16"/>',
         f'<rect y="1500" width="{W}" height="420" fill="#1a120b"/>', f'<path d="M380 1500 L0 1920 M700 1500 L1080 1920" stroke="#120b06" stroke-width="8"/>']
    return "".join(s)


def bed_sleep():
    s = [wood_wall("#2a1d12", "#1d140c"), f'<rect x="80" y="1000" width="920" height="420" fill="#3a2716" stroke="{LN}" stroke-width="8"/>',
         f'<path d="M100 1000 C200 900 900 900 980 1000 L980 1100 L100 1100Z" fill="#c9c2b0" stroke="{LN}" stroke-width="6"/>',
         f'<rect x="120" y="880" width="300" height="160" rx="50" fill="#efe9dc" stroke="{LN}" stroke-width="6"/>']
    # голова бабушки в платке, спит
    s.append(f'<g transform="translate(270 900) scale(.32) translate(-512 -520)">{g_base()}{g_blink()}</g>')
    s.append(f'<rect x="60" y="1420" width="960" height="500" fill="#120b06"/>')
    return "".join(s)


def window_night(scratch=0, reflection=False):
    s = [wood_wall("#1d140c", "#120b06"), f'<rect x="190" y="420" width="700" height="900" fill="#05080f" stroke="#cfc6b0" stroke-width="28"/>',
         f'<line x1="540" y1="420" x2="540" y2="1320" stroke="#cfc6b0" stroke-width="20"/><line x1="190" y1="860" x2="890" y2="860" stroke="#cfc6b0" stroke-width="18"/>']
    if reflection:
        s.append(f'<g opacity=".35"><g transform="translate(540 1500) scale(.75) translate(-512 -1030)">{B_.t_torso()}{B_.t_head_base()}{B_.t_eyes("terrified")}</g></g>')
    return "".join(s)


def rotary_close():
    s = [f'<rect width="{W}" height="{H}" fill="#2a1d12"/>',
         f'<g transform="translate(540 1050) scale(2.2)"><circle r="190" fill="#2a2a2e" stroke="{LN}" stroke-width="6"/><circle r="150" fill="#e8e2d6" stroke="{LN}" stroke-width="5"/>'
         + "".join(f'<circle cx="{110*math.cos(a/10*2*math.pi - 1):.0f}" cy="{110*math.sin(a/10*2*math.pi - 1):.0f}" r="24" fill="#2a2a2e"/><text x="{110*math.cos(a/10*2*math.pi - 1):.0f}" y="{110*math.sin(a/10*2*math.pi - 1) + 8:.0f}" font-size="22" text-anchor="middle" fill="#fff" style="font-family:Rubik" font-weight="900">{(a+1)%10}</text>' for a in range(10))
         + '<circle r="40" fill="#c8343a"/></g>']
    return "".join(s)


def table_food(pancakes=False):
    s = [kitchen()]
    if pancakes:
        s.append(f'<g transform="translate(540 1240)"><ellipse rx="300" ry="60" fill="#f2f2f2" stroke="{LN}" stroke-width="6"/>' + "".join(f'<ellipse cy="{-14 - i*14}" rx="230" ry="44" fill="#e8b860" stroke="#b07a30" stroke-width="4"/>' for i in range(7)) + '</g>')
    else:
        s.append(f'<g transform="translate(540 1240)"><ellipse rx="300" ry="60" fill="#f2f2f2" stroke="{LN}" stroke-width="6"/>' + "".join(f'<ellipse cx="{-180 + (i%4)*120}" cy="{-30 - (i//4)*40}" rx="60" ry="34" fill="#d99a4a" stroke="#9a6224" stroke-width="4"/>' for i in range(8)) + '</g>')
    return "".join(s)


def house_top():
    s = [f'<rect width="{W}" height="{H}" fill="#0b120a"/>']
    for i in range(40):
        s.append(f'<circle cx="{random.randint(0,W)}" cy="{random.randint(0,H)}" r="{random.randint(20,60)}" fill="#142013"/>')
    s.append(f'<rect x="290" y="660" width="500" height="600" fill="#2b2f35" stroke="{LN}" stroke-width="10"/><line x1="290" y1="960" x2="790" y2="960" stroke="#1d2024" stroke-width="12"/>')
    s.append(f'<rect x="360" y="700" width="60" height="80" fill="#3a2a1a"/>')
    return "".join(s)


A.update(B_base=g_base(), B_torso=g_torso(), B_blink=g_blink(), B_eyes_smile=g_eyes("smile"), B_eyes_stare=g_eyes("stare"),
         B_mouth_smile=g_mouths("smile"), B_mouth_stare=g_mouths("stare"),
         D_CAR=car(), D_FOREST=forest_road(), D_VILLAGE=village(), D_KITCHEN=kitchen(), D_MIRROR=mirror(), D_DOOR=bedroom_door(),
         D_HATCH0=hatch(0), D_CELLAR=cellar(), D_GARDEN=garden(), D_GATE=gate(), D_CORR=house_corridor(), D_BED=bed_sleep(),
         D_WINDOW=window_night(), D_WINDOW_R=window_night(reflection=True), D_ROTARY=rotary_close(), D_PIES=table_food(False),
         D_PANCAKES=table_food(True), D_HOUSETOP=house_top(), D_IZBA_DAY=izba(0, 0, 1, True), D_IZBA_NIGHT=izba(0, 0, 1, False, True))
A["D_HATCH_FN"] = ""
open(f"{B_.OUT}/assets.js", "w").write("window.A=" + json.dumps(A, ensure_ascii=False) + ";")
print("assets:", len(A))
