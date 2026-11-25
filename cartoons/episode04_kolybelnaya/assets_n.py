"""Ассеты «Колыбельная из радионяни»: мама, детская, Варя, радионяня, коридор, подъезд, такси."""
import json
import math
import random

import assets_d as Dd

A = Dd.A
B_ = Dd.B_
LN, LW, W, H = B_.LN, B_.LW, B_.W, B_.H
eye, brow, mouth_set = B_.eye, B_.brow, B_.mouth_set
random.seed(33)
M = dict(skin="#f0c8ad", skin_sh="#d6a587", hair="#3a2418", hair_hl="#5a3a28", scrub="#2f8f9d", scrub_sh="#226d78", coat="#d9cbb2", coat_sh="#b8a88c")


def m_base():
    s = [f'<path d="M350 560 C330 380 410 290 512 286 C614 290 694 380 674 560 C660 640 600 700 512 700 C424 700 364 640 350 560Z" fill="{M["hair"]}"/>',
         f'<circle cx="512" cy="260" r="70" fill="{M["hair"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M512 336 C620 336 660 416 658 506 C656 596 620 664 512 692 C404 664 368 596 366 506 C364 416 404 336 512 336Z" fill="{M["skin"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M370 470 C380 380 440 330 512 330 C590 330 650 380 656 470 C620 410 570 390 520 392 C470 394 420 420 370 470Z" fill="{M["hair"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M380 470 C370 540 372 600 384 640 M644 470 C654 540 652 600 640 640" stroke="{M["hair"]}" stroke-width="14" fill="none" stroke-linecap="round"/>',
         f'<path d="M450 380 C480 370 520 370 550 380" stroke="{M["hair_hl"]}" stroke-width="8" fill="none" stroke-linecap="round"/>',
         f'<ellipse cx="420" cy="590" rx="30" ry="14" fill="#e89a8a" opacity=".45"/><ellipse cx="604" cy="590" rx="30" ry="14" fill="#e89a8a" opacity=".45"/>',
         f'<path d="M506 546 q-14 28 4 34 q10 2 16 -6" fill="none" stroke="{M["skin_sh"]}" stroke-width="7" stroke-linecap="round"/>',
         f'<circle cx="368" cy="580" r="8" fill="#e8d9b0"/><circle cx="656" cy="580" r="8" fill="#e8d9b0"/>']
    return "".join(s)


def m_eyes(emo):
    E = (458, 516), (566, 516)
    if emo == "neutral":
        e = "".join(eye(x, y, 30, 32, 11, 2, 2, 0.15, M["skin_sh"], iris="#5a3a24", tag="mn") for x, y in E)
        b = brow(424, 468, 490, 462, M["hair"], 11, 6) + brow(534, 462, 600, 468, M["hair"], 11, 6)
    else:
        e = "".join(eye(x, y, 32, 38, 7, 0, 0, iris="#5a3a24", tag="ms") for x, y in E)
        b = brow(426, 458, 490, 444, M["hair"], 11, -4) + brow(534, 444, 598, 458, M["hair"], 11, -4)
    lashes = "".join(f'<path d="M{x-30} {y-20} l-12 -10 M{x+30} {y-20} l12 -10" stroke="{LN}" stroke-width="5"/>' for x, y in E)
    return e + b + lashes


def m_blink():
    return "".join(f'<ellipse cx="{x}" cy="516" rx="33" ry="38" fill="{M["skin"]}"/><path d="M{x-30} 520 q30 12 60 0" fill="none" stroke="{LN}" stroke-width="{LW+1}" stroke-linecap="round"/>' for x in (458, 566))


def m_torso():
    s = [f'<path d="M472 680 L472 760 L552 760 L552 680Z" fill="{M["skin_sh"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M130 1030 C140 860 220 770 370 745 L654 745 C804 770 884 860 894 1030 L910 1900 L114 1900Z" fill="{M["coat"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>',
         f'<path d="M360 750 L512 1000 L664 750 L640 1900 L384 1900Z" fill="{M["scrub"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>',
         f'<path d="M440 750 L512 880 L584 750" fill="{M["skin_sh"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M360 750 L300 1100 L384 1900 M664 750 L724 1100 L640 1900" stroke="{M["coat_sh"]}" stroke-width="10" fill="none"/>',
         f'<path d="M460 760 L470 1050 M564 760 L554 1050" stroke="#c4121c" stroke-width="5"/><rect x="452" y="1040" width="120" height="80" rx="10" fill="#fff" stroke="{LN}" stroke-width="4"/>',
         f'<rect x="466" y="1056" width="40" height="46" fill="#9fb7c9"/><path d="M516 1066 h44 M516 1082 h36" stroke="#555" stroke-width="5"/>']
    return "".join(s)


def nursery(dark=True):
    wall = "#2b3550" if dark else "#9fb7d8"
    s = [f'<rect width="{W}" height="{H}" fill="{wall}"/>']
    for i in range(24):
        x = random.randint(0, W); y = random.randint(0, 1300)
        s.append(f'<path transform="translate({x} {y}) scale(.9)" d="M0 -20 L6 -6 L20 -6 L9 3 L13 18 L0 9 L-13 18 L-9 3 L-20 -6 L-6 -6Z" fill="#f2d67a" opacity="{.25 if dark else .6}"/>')
    s.append(f'<rect y="1300" width="{W}" height="620" fill="{"#1d2438" if dark else "#c8a77a"}"/>')
    s.append(f'<rect x="700" y="260" width="300" height="420" fill="#0b1430" stroke="#e8e0c8" stroke-width="16"/><circle cx="900" cy="360" r="40" fill="#dfe6f2" opacity=".8"/>')
    s.append(f'<g transform="translate(160 1150)"><rect x="-40" y="0" width="80" height="150" fill="#3a2a1a"/><ellipse cx="0" cy="-10" rx="70" ry="50" fill="#ffcf8a" opacity=".85"/></g>')
    return "".join(s)


def crib(varya="sleep"):
    s = [f'<g>']
    s.append(f'<rect x="-330" y="-40" width="660" height="40" fill="#efe9dc" stroke="{LN}" stroke-width="6"/><rect x="-330" y="340" width="660" height="40" fill="#efe9dc" stroke="{LN}" stroke-width="6"/>')
    s.append(f'<rect x="-310" y="120" width="620" height="230" fill="#cfe2f2" stroke="{LN}" stroke-width="5"/>')
    if varya:
        # Варя: голова на подушке, одеяло
        s.append(f'<rect x="-260" y="60" width="200" height="110" rx="40" fill="#fff" stroke="{LN}" stroke-width="5"/>')
        s.append(f'<circle cx="-160" cy="100" r="70" fill="#f6d6c0" stroke="{LN}" stroke-width="5"/><path d="M-220 70 C-200 20 -120 20 -100 70 C-130 50 -190 50 -220 70Z" fill="#c9884a"/>')
        if varya == "sleep":
            s.append('<path d="M-195 104 q12 8 24 0 M-149 104 q12 8 24 0" stroke="#1d1a1c" stroke-width="5" fill="none"/><path d="M-170 134 q10 6 20 0" stroke="#1d1a1c" stroke-width="4" fill="none"/>')
        else:  # смеётся во сне
            s.append('<path d="M-195 104 q12 8 24 0 M-149 104 q12 8 24 0" stroke="#1d1a1c" stroke-width="5" fill="none"/><path d="M-182 128 q22 22 44 0z" fill="#5a2228" stroke="#1d1a1c" stroke-width="4"/>')
        s.append(f'<ellipse cx="-195" cy="120" rx="14" ry="8" fill="#ff9a9a" opacity=".6"/><ellipse cx="-125" cy="120" rx="14" ry="8" fill="#ff9a9a" opacity=".6"/>')
        s.append(f'<path d="M-260 150 C-100 120 200 120 300 150 L300 340 L-300 340Z" fill="#f7b7c8" stroke="{LN}" stroke-width="5"/>')
    for i in range(12):
        x = -300 + i * 55
        s.append(f'<rect x="{x}" y="0" width="16" height="360" fill="#efe9dc" stroke="{LN}" stroke-width="3"/>')
    s.append(f'<path d="M-340 380 v200 M340 380 v200" stroke="#efe9dc" stroke-width="30"/>')
    return "".join(s) + '</g>'


def mobile():
    s = [f'<line x1="0" y1="-300" x2="0" y2="0" stroke="#d9d3c4" stroke-width="8"/><ellipse cx="0" cy="0" rx="200" ry="24" fill="none" stroke="#d9d3c4" stroke-width="8"/>']
    shapes = ["#f7b7c8", "#ffd97a", "#9fd8ff", "#b5e6a8"]
    for i in range(4):
        a = i * math.pi / 2
        x = 200 * math.cos(a)
        s.append(f'<line x1="{x:.0f}" y1="0" x2="{x:.0f}" y2="120" stroke="#d9d3c4" stroke-width="4"/><path transform="translate({x:.0f} 150)" d="M0 -30 L9 -9 L30 -9 L13 4 L19 26 L0 13 L-19 26 L-13 4 L-30 -9 L-9 -9Z" fill="{shapes[i]}" stroke="{LN}" stroke-width="4"/>')
    return "".join(s)


def hallway():
    s = [f'<rect width="{W}" height="{H}" fill="#2a2620"/>',
         f'<path d="M0 0 L380 500 L380 1400 L0 {H}Z" fill="#3a332a"/><path d="M{W} 0 L700 500 L700 1400 L{W} {H}Z" fill="#332d25"/>',
         f'<rect x="380" y="500" width="320" height="900" fill="#0a0907"/>',
         f'<path d="M0 {H} L380 1400 L700 1400 L{W} {H}Z" fill="#4a3a2a"/>']
    for k in range(6):
        y = 1400 + (520) * (k / 6) ** 1.6
        s.append(f'<line x1="{380 - 380 * (k / 6) ** 1.6}" y1="{y}" x2="{700 + 380 * (k / 6) ** 1.6}" y2="{y}" stroke="#3a2d20" stroke-width="4"/>')
    s.append(f'<rect x="80" y="700" width="160" height="900" fill="#5a4030" stroke="{LN}" stroke-width="6" transform="skewY(18)"/>')
    s.append(f'<g transform="translate(870 760)"><rect x="-60" y="0" width="120" height="200" fill="#6a5a4a" stroke="{LN}" stroke-width="6"/><circle cx="0" cy="40" r="20" fill="#2a2620"/></g>')
    return "".join(s)


def front_door():
    s = [f'<rect width="{W}" height="{H}" fill="#2a2620"/>', f'<rect x="240" y="240" width="600" height="1460" fill="#5a3a2a" stroke="{LN}" stroke-width="12"/>']
    for y in (300, 700, 1100, 1500):
        s.append(f'<line x1="240" y1="{y}" x2="840" y2="{y}" stroke="#3a2418" stroke-width="5"/>')
    s.append(f'<rect x="700" y="880" width="90" height="160" rx="10" fill="#c9a86a" stroke="{LN}" stroke-width="5"/><circle cx="745" cy="920" r="18" fill="#3a2a1a"/>')
    s.append(f'<circle cx="540" cy="560" r="20" fill="#111" stroke="#c9a86a" stroke-width="6"/>')
    return "".join(s)


def stairs():
    s = [f'<rect width="{W}" height="{H}" fill="#3e5a52"/>', f'<rect y="0" width="{W}" height="900" fill="#9a9c92"/>']
    for k in range(10):
        y = 900 + k * 110; x = k * 60
        s.append(f'<rect x="{x - 200}" y="{y}" width="{W + 400}" height="110" fill="{"#5a5c56" if k % 2 else "#64665e"}" stroke="#3a3c36" stroke-width="4"/>')
    s.append(f'<path d="M100 800 L900 1900" stroke="#2a2c26" stroke-width="18"/>' + "".join(f'<line x1="{100 + k*80}" y1="{800 + k*110}" x2="{100 + k*80}" y2="{1000 + k*110}" stroke="#2a2c26" stroke-width="8"/>' for k in range(10)))
    s.append(f'<rect x="760" y="200" width="200" height="300" fill="#bcd4ea" stroke="#5a5c56" stroke-width="12"/>')
    return "".join(s)


def taxi():
    return (f'<g><path d="M-420 0 L-380 -160 C-340 -230 -240 -260 -120 -260 L140 -260 C260 -260 340 -220 380 -160 L420 0 L420 120 L-420 120Z" fill="#f2c230" stroke="{LN}" stroke-width="8"/>'
            f'<path d="M-330 -150 C-290 -210 -220 -230 -130 -230 L-20 -230 L-20 -140Z M20 -230 L130 -230 C220 -230 290 -210 330 -150 L20 -140Z" fill="#9fc4e0" stroke="{LN}" stroke-width="6"/>'
            f'<rect x="-80" y="-310" width="160" height="50" rx="10" fill="#fff" stroke="{LN}" stroke-width="5"/><text x="0" y="-275" text-anchor="middle" font-size="30" style="font-family:Rubik" font-weight="900" fill="#1d1a1c">TAXI</text>'
            + "".join(f'<rect x="{-420 + i*56}" y="-10" width="28" height="28" fill="{"#1d1a1c" if i % 2 else "#f2c230"}"/>' for i in range(15))
            + f'<circle cx="-260" cy="120" r="80" fill="#1d1a1c"/><circle cx="260" cy="120" r="80" fill="#1d1a1c"/><circle cx="-260" cy="120" r="34" fill="#888"/><circle cx="260" cy="120" r="34" fill="#888"/></g>')


def bundle():
    """Варя в одеяле на руках (наложение на грудь Тёмы, система координат персонажа 1024)."""
    return (f'<g><ellipse cx="512" cy="1060" rx="260" ry="190" fill="#f7b7c8" stroke="{LN}" stroke-width="6"/>'
            f'<circle cx="600" cy="960" r="90" fill="#f6d6c0" stroke="{LN}" stroke-width="6"/><path d="M520 930 C540 860 660 860 680 930 C650 900 560 900 520 930Z" fill="#c9884a"/>'
            f'<path d="M565 968 q12 8 24 0 M612 968 q12 8 24 0" stroke="{LN}" stroke-width="5" fill="none"/><path d="M590 1000 q10 6 20 0" stroke="{LN}" stroke-width="4" fill="none"/>'
            f'<path d="M300 1040 C380 980 460 1000 500 1080" stroke="#2c5b4c" stroke-width="70" stroke-linecap="round" fill="none"/>'
            f'<path d="M740 1040 C660 980 580 1000 540 1080" stroke="#2c5b4c" stroke-width="70" stroke-linecap="round" fill="none"/></g>')


A.update(M_base=m_base(), M_torso=m_torso(), M_blink=m_blink(), M_eyes_neutral=m_eyes("neutral"), M_eyes_scared=m_eyes("scared"),
         M_mouth_neutral=mouth_set(512, 626, 80, "neutral"), M_mouth_scared=mouth_set(512, 630, 74, "scared"),
         N_NURS_D=nursery(True), N_NURS_L=nursery(False), N_CRIB=crib("sleep"), N_CRIB_LAUGH=crib("laugh"), N_CRIB_EMPTY=crib(None),
         N_MOBILE=mobile(), N_HALL=hallway(), N_DOOR=front_door(), N_STAIRS=stairs(), N_TAXI=taxi(), N_BUNDLE=bundle())
open(f"{B_.OUT}/assets.js", "w").write("window.A=" + json.dumps(A, ensure_ascii=False) + ";")
print("assets:", len(A))
