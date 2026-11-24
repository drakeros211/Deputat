"""Графика серии «Глубинный»: монстр, тёмная тварь, город у воды и т.д. Дописывает ключи в build/assets.js."""
import json
import math
import random

import assets as B  # базовые персонажи и фоны (Тёма, Лёха, медсестра...)

A = B.A
LN, LW, W, H = B.LN, B.LW, B.W, B.H
random.seed(11)

ROCK = "#2b3437"; ROCK2 = "#1d2427"; ROCK3 = "#3b4649"; GLOW = "#7fe9ff"


# ================================================================ ГЛУБИННЫЙ (в рост): 1000 x 1700, ноги внизу (500,1700)
def plates(cx, top, n, w0, h0, shrink=0.86):
    s = []
    y = top
    for i in range(n):
        w = w0 * (shrink ** i); h = h0 * (shrink ** i)
        s.append(f'<path d="M{cx - w/2:.0f} {y + h:.0f} L{cx - w*0.12:.0f} {y:.0f} L{cx + w*0.18:.0f} {y + h*0.15:.0f} L{cx + w/2:.0f} {y + h:.0f}Z" fill="{ROCK3}" stroke="{LN}" stroke-width="6" stroke-linejoin="round"/>')
        y += h * 0.8
    return "".join(s)


def monster():
    s = []
    # хвост
    s.append(f'<path d="M640 1400 C820 1460 960 1560 1000 1700 L900 1700 C860 1600 760 1530 620 1480Z" fill="{ROCK2}" stroke="{LN}" stroke-width="8"/>')
    # шипы хребта, видные за силуэтом
    for side in (-1, 1):
        for i in range(8):
            y = 520 + i * 105; x = 500 + side * (230 - i * 8)
            h = 150 - i * 10
            s.append(f'<path d="M{x - 34} {y + 50} L{x + side * 60} {y - h + 30} L{x + 34} {y + 60}Z" fill="{ROCK3}" stroke="{LN}" stroke-width="7" stroke-linejoin="round"/>')
    # ноги
    s.append(f'<path d="M300 1250 C260 1400 250 1560 260 1650 L200 1700 L440 1700 L420 1640 C430 1520 440 1400 450 1300Z" fill="{ROCK2}" stroke="{LN}" stroke-width="8" stroke-linejoin="round"/>')
    s.append(f'<path d="M700 1250 C740 1400 750 1560 740 1650 L800 1700 L560 1700 L580 1640 C570 1520 560 1400 550 1300Z" fill="{ROCK2}" stroke="{LN}" stroke-width="8" stroke-linejoin="round"/>')
    s.append(f'<path d="M200 1700 l20 -40 l30 40 l25 -40 l30 40 M560 1700 l25 -40 l30 40 l25 -40 l30 40" stroke="#c9d2d6" stroke-width="8" fill="none"/>')
    # туловище — сутулое, широкие плечи
    s.append(f'<path d="M290 1330 C250 1100 210 860 190 700 C200 620 290 570 380 560 L620 560 C710 570 800 620 810 700 C790 860 750 1100 710 1330 C620 1380 380 1380 290 1330Z" fill="{ROCK}" stroke="{LN}" stroke-width="8"/>')
    # тень сбоку
    s.append(f'<path d="M190 700 C210 860 250 1100 290 1330 C320 1345 350 1355 380 1360 C330 1150 300 900 300 640Z" fill="#000" opacity=".25"/>')
    # пластины груди и живота
    for r in range(7):
        w = 170 - abs(r - 3) * 12
        s.append(f'<path d="M{500 - w} {720 + r * 85} Q500 {700 + r * 85} {500 + w} {720 + r * 85} L{500 + w - 15} {780 + r * 85} Q500 {765 + r * 85} {500 - w + 15} {780 + r * 85}Z" fill="{ROCK3}" stroke="{ROCK2}" stroke-width="5"/>')
    # длинные руки с когтями
    s.append(f'<path d="M250 640 C150 700 100 860 110 1060 C112 1120 130 1160 150 1180 L205 1170 C190 1100 180 1000 200 880 C215 800 260 740 320 700Z" fill="{ROCK2}" stroke="{LN}" stroke-width="8" stroke-linejoin="round"/>')
    s.append(f'<path d="M750 640 C850 700 900 860 890 1060 C888 1120 870 1160 850 1180 L795 1170 C810 1100 820 1000 800 880 C785 800 740 740 680 700Z" fill="{ROCK2}" stroke="{LN}" stroke-width="8" stroke-linejoin="round"/>')
    s.append(f'<path d="M140 1170 l-25 90 M165 1178 l-6 100 M190 1175 l14 90 M860 1170 l25 90 M835 1178 l6 100 M810 1175 l-14 90" stroke="#d9e0e3" stroke-width="12" stroke-linecap="round"/>')
    # шея и голова, выдвинутая вперёд
    s.append(f'<path d="M400 580 C400 520 430 470 500 460 C570 470 600 520 600 580Z" fill="{ROCK2}" stroke="{LN}" stroke-width="7"/>')
    s.append(f'<path d="M370 470 C350 360 410 270 500 260 C590 270 650 360 630 470 C610 520 560 545 500 548 C440 545 390 520 370 470Z" fill="{ROCK}" stroke="{LN}" stroke-width="8"/>')
    s.append(f'<path d="M395 455 C430 500 570 500 605 455 L595 505 C560 535 440 535 405 505Z" fill="{ROCK2}" stroke="{LN}" stroke-width="5"/>')
    for i in range(7):
        s.append(f'<path d="M{415 + i*28} 480 l10 22 l10 -22z" fill="#e8e6dc"/>')
    # рога-гребень
    s.append(f'<path d="M430 300 L380 180 L460 280Z M570 300 L620 180 L540 280Z M500 262 L500 150 L525 260Z" fill="{ROCK3}" stroke="{LN}" stroke-width="7" stroke-linejoin="round"/>')
    # надбровья
    s.append(f'<path d="M395 380 L480 400 M605 380 L520 400" stroke="{ROCK2}" stroke-width="22" stroke-linecap="round"/>')
    return "".join(s)


def monster_dots():
    s = []
    for side in (-1, 1):
        for i in range(8):
            s.append(f'<circle cx="{500 + side * (230 - i * 8 + 20)}" cy="{520 + i * 105 - 20}" r="9" fill="{GLOW}"/>')
        for i in range(5):
            s.append(f'<circle cx="{500 + side * (150 - i * 6)}" cy="{760 + i * 120}" r="8" fill="{GLOW}"/>')
        for i in range(4):
            s.append(f'<circle cx="{500 + side * (330 + i * 30)}" cy="{760 + i * 90}" r="7" fill="{GLOW}"/>')
    for i in range(6):
        s.append(f'<circle cx="500" cy="{740 + i * 100}" r="10" fill="{GLOW}"/>')
    # глаза
    s.append(f'<path d="M410 410 L478 420 L420 440Z M590 410 L522 420 L580 440Z" fill="#e6fdff"/>')
    s.append(f'<path d="M410 410 L478 420 L420 440Z M590 410 L522 420 L580 440Z" fill="{GLOW}" opacity=".6"/>')
    return "".join(s)


def head_close():
    """Голова крупно в профиль (смотрит влево). Пасть — отдельный элемент JAW."""
    s = [f'<path d="M1100 700 C1060 420 900 300 700 300 C500 300 300 380 120 520 C80 560 90 620 140 640 L600 650 C800 660 980 760 1100 900Z" fill="{ROCK}" stroke="{LN}" stroke-width="10"/>']
    for i in range(7):
        x = 640 + i * 70
        s.append(f'<path d="M{x} {330 + i*12} L{x + 30} {170 + i*25} L{x + 70} {350 + i*16}Z" fill="{ROCK3}" stroke="{LN}" stroke-width="8" stroke-linejoin="round"/>')
    for i in range(12):
        x = 200 + i * 70; y = 450 + (i % 3) * 40
        s.append(f'<path d="M{x} {y} l35 -20 l40 15 l-6 40 l-40 18 l-32 -20z" fill="{ROCK3}" stroke="{ROCK2}" stroke-width="5" opacity=".85"/>')
    # зубы верхние
    for i in range(10):
        x = 160 + i * 52
        s.append(f'<path d="M{x} 638 l16 60 l16 -60z" fill="#e8e6dc" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<ellipse cx="520" cy="470" rx="46" ry="22" fill="{GLOW}"/><ellipse cx="520" cy="470" rx="10" ry="20" fill="#06202a"/>')
    return "".join(s)


def jaw():
    s = [f'<path d="M140 0 L600 10 C780 20 930 90 1040 200 C900 300 600 330 300 280 C180 260 110 200 110 120 C110 60 120 20 140 0Z" fill="{ROCK2}" stroke="{LN}" stroke-width="10"/>']
    for i in range(9):
        x = 180 + i * 54
        s.append(f'<path d="M{x} 12 l16 -58 l16 58z" fill="#e8e6dc" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<path d="M160 40 C300 90 500 90 700 60" stroke="#5b1a22" stroke-width="30" fill="none" opacity=".8"/>')
    return "".join(s)


def ridge():
    s = []
    for i in range(9):
        x = 60 + i * 120; h = 260 - abs(i - 4) * 40
        s.append(f'<path d="M{x} 400 L{x + 40} {400 - h} L{x + 110} 400Z" fill="{ROCK3}" stroke="{LN}" stroke-width="8" stroke-linejoin="round"/>'
                 f'<circle cx="{x + 52}" cy="{400 - h*0.35:.0f}" r="10" fill="{GLOW}" class="gd"/>')
    s.append(f'<path d="M0 400 C300 360 800 360 1140 400 L1140 520 L0 520Z" fill="{ROCK}" stroke="{LN}" stroke-width="8"/>')
    return "".join(s)


def eye_close():
    s = [f'<rect width="{W}" height="{H}" fill="{ROCK}"/>']
    for i in range(70):
        x = random.randint(-50, W); y = random.randint(-50, H)
        s.append(f'<path d="M{x} {y} l{random.randint(40,90)} -{random.randint(10,40)} l{random.randint(30,70)} {random.randint(10,40)} l-10 {random.randint(40,70)} l-{random.randint(60,90)} 20z" fill="{random.choice([ROCK3, ROCK2, "#34403f"])}" stroke="{ROCK2}" stroke-width="4"/>')
    # веко
    s.append(f'<ellipse cx="540" cy="960" rx="470" ry="300" fill="#141a1c" stroke="{LN}" stroke-width="14"/>')
    s.append(f'<clipPath id="eyeK"><ellipse cx="540" cy="960" rx="440" ry="270"/></clipPath>')
    s.append(f'<g clip-path="url(#eyeK)"><rect width="{W}" height="{H}" fill="#0e3946"/>'
             f'<circle cx="540" cy="960" r="300" fill="#1a8fb0"/>'
             + "".join(f'<line x1="540" y1="960" x2="{540 + 300*math.cos(a/30*math.pi):.0f}" y2="{960 + 300*math.sin(a/30*math.pi):.0f}" stroke="#7fe9ff" stroke-width="4" opacity=".5"/>' for a in range(60))
             + f'<circle cx="540" cy="960" r="300" fill="none" stroke="#062a35" stroke-width="30"/>'
             f'<ellipse cx="540" cy="960" rx="44" ry="250" fill="#020708" class="pupil"/>'
             f'<ellipse cx="420" cy="840" rx="70" ry="40" fill="#fff" opacity=".55"/>'
             # отражение окна с Тёмой
             f'<g opacity=".5"><rect x="600" y="760" width="120" height="150" fill="none" stroke="#dff" stroke-width="6"/><line x1="660" y1="760" x2="660" y2="910" stroke="#dff" stroke-width="5"/>'
             f'<circle cx="630" cy="860" r="14" fill="#3f7d68"/><rect x="618" y="872" width="24" height="34" fill="#3f7d68"/></g>'
             f'<rect x="0" y="0" width="{W}" height="{H}" fill="url(#lidShade)"/></g>')
    s.insert(0, '<defs><linearGradient id="lidShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>')
    return "".join(s)


def dark_thing():
    """Тьма из глубины: огромная масса без единого огонька, только контур. 1400 x 2000, основание (700,2000)."""
    s = ['<defs><radialGradient id="voidG" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#000"/><stop offset=".8" stop-color="#05030a"/><stop offset="1" stop-color="#1a0c2a"/></radialGradient></defs>']
    path = "M0 2000 C40 1500 120 1100 260 800 C330 640 380 420 470 260 C520 170 600 60 700 40 C800 60 880 170 930 260 C1020 420 1070 640 1140 800 C1280 1100 1360 1500 1400 2000Z"
    s.append(f'<path d="{path}" fill="none" stroke="#6a2fa8" stroke-width="40" opacity=".35"/>')
    s.append(f'<path d="{path}" fill="url(#voidG)" stroke="#8a4ad0" stroke-width="8" opacity=".98"/>')
    # щупальца-выросты
    for i in range(7):
        x = 200 + i * 170
        s.append(f'<path d="M{x} {900 + (i%3)*120} C{x - 120} {700 - i*20} {x - 60} {500} {x - 180} {380 + (i%2)*80}" stroke="#05030a" stroke-width="{40 - i*3}" fill="none" stroke-linecap="round"/>')
    # вертикальная пасть-щель (еле заметна)
    s.append('<path d="M700 520 C660 700 660 1000 700 1200 C740 1000 740 700 700 520Z" fill="#000" stroke="#4a1530" stroke-width="5" class="maw"/>')
    return "".join(s)


# ---------------------------------------------------------------- город у воды
def city(lit=True, wide=1600):
    s = [f'<rect width="{wide}" height="{H}" fill="{"#0b1328" if lit else "#04060c"}"/>']
    for i in range(50):
        s.append(f'<circle cx="{random.randint(0, wide)}" cy="{random.randint(0, 700)}" r="2" fill="#fff" opacity="{random.uniform(.2,.7):.2f}"/>')
    x = -20
    random.seed(5)
    while x < wide:
        w = random.randint(140, 260); h = random.randint(380, 820)
        s.append(f'<rect x="{x}" y="{1150 - h}" width="{w}" height="{h}" fill="{"#1b2340" if lit else "#0a0d16"}" stroke="#05070d" stroke-width="4"/>')
        for wy in range(1150 - h + 30, 1130, 44):
            for wx in range(x + 16, x + w - 24, 34):
                if lit and random.random() < 0.35:
                    s.append(f'<rect x="{wx}" y="{wy}" width="18" height="22" fill="{random.choice(["#ffcf6b", "#ffe2a0", "#9fd0ff"])}"/>')
        x += w + random.randint(4, 30)
    # вода
    s.append(f'<rect y="1150" width="{wide}" height="{H - 1150}" fill="{"#0a1730" if lit else "#03060d"}"/>')
    if lit:
        for i in range(70):
            xx = random.randint(0, wide); yy = random.randint(1170, 1500)
            s.append(f'<rect x="{xx}" y="{yy}" width="{random.randint(20,60)}" height="4" fill="#ffcf6b" opacity="{random.uniform(.15,.45):.2f}"/>')
    return "".join(s)


def bridge():
    s = [f'<path d="M0 1080 L1600 1040 L1600 1070 L0 1110Z" fill="#2a3142" stroke="{LN}" stroke-width="5"/>']
    for i in range(9):
        x = 60 + i * 190
        s.append(f'<rect x="{x}" y="{1075 - i*2.5}" width="26" height="160" fill="#1f2533" stroke="{LN}" stroke-width="4"/>')
        s.append(f'<path d="M{x+13} {1078 - i*2.5} L{x+13} 900 M{x+13} 900 L{x+108} {1070 - i*2.5}" stroke="#3a4255" stroke-width="5"/>')
    return "".join(s)


def shore_fish():
    s = ['<defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f5c"/><stop offset=".5" stop-color="#a46a5a"/><stop offset="1" stop-color="#e0a070"/></linearGradient></defs>',
         f'<rect width="{W}" height="900" fill="url(#dusk)"/>',
         f'<rect y="700" width="{W}" height="300" fill="#3c5263"/>',
         f'<path d="M0 960 C300 920 700 980 {W} 930 L{W} {H} L0 {H}Z" fill="#7d7158"/>']
    for i in range(140):
        x = random.randint(-20, W); y = random.randint(980, H)
        sc = 0.5 + (y - 980) / 900 * 1.2
        r = random.randint(-40, 40)
        s.append(f'<g transform="translate({x} {y}) rotate({r}) scale({sc:.2f})"><path d="M-40 0 C-20 -18 20 -18 40 0 C20 18 -20 18 -40 0Z M40 0 l22 -16 l0 32z" fill="{random.choice(["#c9d3d8", "#aeb9c0", "#dfe6ea"])}" stroke="#4a5560" stroke-width="3"/><circle cx="-24" cy="-3" r="3.5" fill="#222"/></g>')
    return "".join(s)


def kitchen_cup():
    return (f'<rect width="{W}" height="{H}" fill="#2b2620"/>'
            f'<rect x="80" y="200" width="420" height="520" fill="#4b6a8a" stroke="#111" stroke-width="12"/><line x1="290" y1="200" x2="290" y2="720" stroke="#111" stroke-width="10"/>'
            f'<rect y="1100" width="{W}" height="820" fill="#7a5a3c"/><rect y="1100" width="{W}" height="20" fill="#5c432c"/>'
            f'<ellipse cx="540" cy="1420" rx="300" ry="60" fill="#000" opacity=".3"/>'
            f'<path d="M300 1000 L300 1380 C300 1440 780 1440 780 1380 L780 1000Z" fill="#e8e3da" stroke="{LN}" stroke-width="8"/>'
            f'<path d="M780 1080 C900 1080 900 1300 780 1300" fill="none" stroke="#e8e3da" stroke-width="40"/><path d="M780 1080 C900 1080 900 1300 780 1300" fill="none" stroke="{LN}" stroke-width="8"/>'
            f'<ellipse cx="540" cy="1000" rx="240" ry="54" fill="#5a3a22" stroke="{LN}" stroke-width="8"/>')


def hospital_water():
    s = [f'<rect width="{W}" height="{H}" fill="#060a14"/>',
         f'<rect x="80" y="700" width="920" height="600" fill="#2e3443" stroke="{LN}" stroke-width="6"/>',
         f'<rect x="460" y="540" width="160" height="160" fill="#f2f2f2"/><path d="M515 560 h50 v45 h45 v50 h-45 v45 h-50 v-45 h-45 v-50 h45z" fill="#d0202a"/>']
    for r in range(4):
        for c in range(7):
            s.append(f'<rect x="{120 + c*125}" y="{750 + r*130}" width="80" height="90" fill="{"#fff1c0" if (r+c)%3 else "#9fd0ff"}" opacity=".85"/>')
    s.append(f'<rect y="1300" width="{W}" height="620" fill="#040812"/>')
    return "".join(s)


def heli():
    return ('<g><rect x="-90" y="-30" width="160" height="60" rx="30" fill="#0c0f14"/><path d="M60 -10 L200 -4 L200 6 L60 14Z" fill="#0c0f14"/>'
            '<rect x="-160" y="-50" width="320" height="6" fill="#0c0f14" class="rotor"/><circle cx="-60" cy="0" r="5" fill="#ff2a2a"/></g>')


def person():
    return '<path d="M0 -150 a18 18 0 1 1 0.1 0 M-18 -128 h36 l10 70 h-12 l-6 -45 l-4 120 h-14 l-4 -70 l-4 70 h-14 l-4 -120 l-6 45 h-12z" fill="#05070c"/>'


def window_frame():
    return (f'<path d="M0 0 H{W} V{H} H0Z M130 240 V1680 H950 V240Z" fill="#1a1712" fill-rule="evenodd"/>'
            f'<rect x="130" y="240" width="820" height="1440" fill="none" stroke="#3a342a" stroke-width="40"/>'
            f'<line x1="540" y1="240" x2="540" y2="1680" stroke="#3a342a" stroke-width="34"/>'
            f'<line x1="130" y1="900" x2="950" y2="900" stroke="#3a342a" stroke-width="30"/>'
            f'<rect x="80" y="1680" width="920" height="60" fill="#d9d3c4"/>')


A.update(MON=monster(), MON_DOTS=monster_dots(), HEAD=head_close(), JAW=jaw(), RIDGE=ridge(), EYE=eye_close(), DARK=dark_thing(),
         CITY_LIT=city(True), CITY_DARK=city(False), BRIDGE=bridge(), FISH=shore_fish(), CUP=kitchen_cup(), HOSP=hospital_water(),
         HELI=heli(), PERSON=person(), WINDOW=window_frame())
open(f"{B.OUT}/assets.js", "w").write("window.A=" + json.dumps(A, ensure_ascii=False) + ";")
print("assets:", len(A))
