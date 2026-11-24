"""Графика серии 1: персонажи (по частям для анимации) и фоны. -> build/assets.js"""
import json
import math
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "build")
os.makedirs(OUT, exist_ok=True)
random.seed(7)

LN = "#1d1a1c"
LW = 5
T = dict(skin="#f0c39b", skin_sh="#d79f78", hair="#2a211d", hair_hl="#4a3a31", hood="#3f7d68", hood_sh="#2c5b4c",
         hood_dk="#22463b", string="#e8e2d0", band="#2b2d33", cup="#3a3d45", acc="#f08a3c")
L = dict(skin="#f6d2b4", skin_sh="#dfa985", hair="#d9772e", hair_sh="#b45a1d", hat="#f2c230", hat_sh="#d19f17",
         coat="#d63a35", coat_sh="#a8292a", coat_dk="#7d1d20", brow="#b8551f", freck="#d0854f")
A = {}


def eye(cx, cy, rx, ry, pr, pdx=0, pdy=0, lid=0.0, lidc="#000", iris="#4a3324", tag=""):
    cid = f"c{tag}{cx}{cy}"
    s = (f'<clipPath id="{cid}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>'
         f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#fbf8f1"/>'
         f'<g clip-path="url(#{cid})"><circle cx="{cx+pdx}" cy="{cy+pdy}" r="{pr+8}" fill="{iris}"/>'
         f'<circle cx="{cx+pdx}" cy="{cy+pdy}" r="{pr}" fill="#141012"/>'
         f'<circle cx="{cx+pdx-pr*0.5-3}" cy="{cy+pdy-pr*0.5-3}" r="{max(4, pr*0.4)}" fill="#fff"/>')
    if lid:
        s += (f'<rect x="{cx-rx}" y="{cy-ry-2}" width="{rx*2}" height="{ry*2*lid+2}" fill="{lidc}"/>'
              f'<line x1="{cx-rx}" y1="{cy-ry+ry*2*lid}" x2="{cx+rx}" y2="{cy-ry+ry*2*lid}" stroke="{LN}" stroke-width="{LW+1}"/>')
    s += f'</g><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{LN}" stroke-width="{LW}"/>'
    return s


def brow(x1, y1, x2, y2, c, w=15, curve=0):
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2 - curve
    return f'<path d="M{x1} {y1} Q{mx} {my} {x2} {y2}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'


# ================================================================ ТЁМА
def t_head_base():
    s = []
    s.append(f'<path d="M292 600 C270 390 350 215 512 208 C674 215 754 390 732 600 C724 680 700 730 664 760 Q512 830 360 760 C324 730 300 680 292 600Z" fill="{T["hood"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M292 600 C270 390 350 215 512 208 C420 230 340 330 336 520 C334 620 350 700 380 760 L360 760 C324 730 300 680 292 600Z" fill="{T["hood_sh"]}"/>')
    s.append(f'<path d="M334 590 C326 420 396 280 512 274 C628 280 698 420 690 590 C686 670 664 720 634 750 Q512 800 390 750 C360 720 338 670 334 590Z" fill="{T["hood_dk"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M352 520 C346 420 400 330 512 326 C624 330 678 420 672 520 C660 480 640 450 620 440 L404 440 C384 450 364 480 352 520Z" fill="{T["hair"]}"/>')
    s.append(f'<path d="M512 346 C626 346 668 420 666 506 C664 594 626 656 562 686 Q512 704 462 686 C398 656 360 594 358 506 C356 420 398 346 512 346Z" fill="{T["skin"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M366 560 C384 640 440 684 512 694 C446 676 400 636 384 560Z" fill="{T["skin_sh"]}" opacity=".5"/>')
    s.append(f'<path d="M370 470 C390 400 450 360 512 358 C574 360 634 400 654 470 C610 430 560 418 512 418 C464 418 414 430 370 470Z" fill="{T["skin_sh"]}" opacity=".55"/>')
    s.append(f'''<path d="M380 470 C380 400 430 352 512 350 C600 352 650 400 646 466 C630 440 616 430 602 428 C606 446 602 458 594 466 C580 440 560 428 540 424 C546 444 540 458 530 466 C514 438 494 428 470 428 C476 446 470 458 460 464 C448 444 430 436 414 440 C410 456 400 466 380 470Z" fill="{T["hair"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>''')
    s.append(f'<path d="M450 376 C480 366 520 366 548 378" fill="none" stroke="{T["hair_hl"]}" stroke-width="8" stroke-linecap="round"/>')
    s.append(f'<path d="M512 548 q-12 26 4 30 q10 2 14 -4" fill="none" stroke="{T["skin_sh"]}" stroke-width="7" stroke-linecap="round"/>')
    s.append(f'<g transform="rotate(-24 616 572)"><rect x="584" y="560" width="64" height="26" rx="11" fill="#e9c79a" stroke="{LN}" stroke-width="4"/><rect x="605" y="563" width="22" height="20" rx="3" fill="#f3dcb8"/></g>')
    s.append(f'<path d="M312 520 C290 230 734 230 712 520" fill="none" stroke="{LN}" stroke-width="34" stroke-linecap="round"/>')
    s.append(f'<path d="M312 520 C290 230 734 230 712 520" fill="none" stroke="{T["band"]}" stroke-width="22" stroke-linecap="round"/>')
    for cx in (308, 716):
        s.append(f'<rect x="{cx-44}" y="470" width="88" height="130" rx="40" fill="{T["cup"]}" stroke="{LN}" stroke-width="{LW}"/>'
                 f'<rect x="{cx-30}" y="488" width="60" height="94" rx="28" fill="{T["band"]}"/><circle cx="{cx}" cy="535" r="14" fill="{T["acc"]}"/>')
    return "".join(s)


def t_eyes(emo):
    E = (450, 516), (576, 516)
    if emo == "neutral":
        e = "".join(eye(x, y, 34, 38, 13, 4, 4, 0.18, T["skin_sh"], tag="tn") for x, y in E)
        b = brow(412, 466, 486, 462, T["hair"]) + brow(540, 460, 614, 458, T["hair"], curve=6)
    elif emo == "scared":
        e = "".join(eye(x, y, 36, 42, 9, -3, 2, tag="ts") for x, y in E)
        b = brow(414, 456, 484, 446, T["hair"], curve=-4) + brow(542, 446, 612, 456, T["hair"], curve=-4)
    else:  # terrified
        e = "".join(eye(x, y, 38, 46, 6, 0, 0, tag="tt") for x, y in E)
        b = brow(414, 446, 484, 432, T["hair"], curve=-6) + brow(542, 432, 612, 446, T["hair"], curve=-6)
    return e + b


def t_blink():
    return "".join(f'<ellipse cx="{x}" cy="516" rx="37" ry="41" fill="{T["skin"]}"/><path d="M{x-34} 520 q34 14 68 0" fill="none" stroke="{LN}" stroke-width="{LW+1}" stroke-linecap="round"/>' for x in (450, 576))


def mouth_set(cx, cy, w, emo, braces=False):
    """0 — закрыт, 1 — приоткрыт, 2 — открыт."""
    out = []
    if emo in ("neutral", "grin"):
        out.append(f'<path d="M{cx-w/2} {cy} q{w/2} {14} {w} -6" fill="none" stroke="{LN}" stroke-width="{LW+1}" stroke-linecap="round"/>')
    else:
        out.append(f'<path d="M{cx-w/2} {cy+4} q{w/4} -10 {w/2} 0 q{w/4} 10 {w/2} 0" fill="none" stroke="{LN}" stroke-width="{LW+1}" stroke-linecap="round"/>')
    for h in (18, 40):
        ww = w * (0.9 if emo in ("neutral", "grin") else 0.75)
        teeth = f'<path d="M{cx-ww/2+6} {cy-h*0.35+3} h{ww-12} v{min(10, h*0.35)} h-{ww-12}z" fill="#fff"/>'
        if braces:
            teeth += f'<line x1="{cx-ww/2+8}" y1="{cy-h*0.35+8}" x2="{cx+ww/2-8}" y2="{cy-h*0.35+8}" stroke="#9aa3ad" stroke-width="3"/>' + "".join(
                f'<rect x="{cx-ww/2+12+i*(ww-24)/4-3}" y="{cy-h*0.35+5}" width="6" height="6" fill="#c9d0d8"/>' for i in range(5))
        out.append(f'<path d="M{cx-ww/2} {cy-h*0.35} Q{cx} {cy-h*0.35-6} {cx+ww/2} {cy-h*0.35} Q{cx+ww/2-4} {cy+h*0.75} {cx} {cy+h*0.75} Q{cx-ww/2+4} {cy+h*0.75} {cx-ww/2} {cy-h*0.35}Z" fill="#5a2228" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>'
                   f'<ellipse cx="{cx}" cy="{cy+h*0.5}" rx="{ww*0.28}" ry="{h*0.18}" fill="#c9585e"/>' + teeth)
    return out


def t_torso():
    s = []
    s.append(f'<path d="M466 660 L466 750 L558 750 L558 660 Z" fill="{T["skin_sh"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M140 1030 C150 860 220 760 370 730 L654 730 C804 760 874 860 884 1030 L900 1900 L124 1900 Z" fill="{T["hood"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M150 1030 L136 1900 L240 1900 L228 1030Z M874 1030 L888 1900 L790 1900 L804 1030Z" fill="{T["hood_sh"]}"/>')
    s.append(f'<path d="M330 1250 h364 l20 170 h-404z" fill="{T["hood_sh"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M140 1030 C150 860 220 760 370 730 L340 800 C262 840 232 920 228 1030Z" fill="{T["hood_sh"]}"/>')
    s.append(f'<path d="M884 1030 C874 860 804 760 654 730 L690 800 C770 850 800 930 804 1030Z" fill="{T["hood_sh"]}"/>')
    s.append(f'<path d="M370 730 C420 800 604 800 654 730 L620 720 C580 770 444 770 404 720Z" fill="{T["hood_dk"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    for x, sway in ((470, -10), (556, 12)):
        s.append(f'<path d="M{x} 770 q{sway} 80 {sway/2} 170" fill="none" stroke="{T["string"]}" stroke-width="9" stroke-linecap="round"/>')
        s.append(f'<rect x="{x+sway/2-7}" y="936" width="14" height="28" rx="3" fill="#9aa0a8" stroke="{LN}" stroke-width="3"/>')
    s.append(f'<circle cx="340" cy="870" r="38" fill="#ffd23f" stroke="{LN}" stroke-width="{LW}"/><circle cx="326" cy="862" r="5" fill="{LN}"/><circle cx="354" cy="862" r="5" fill="{LN}"/><path d="M322 880 q18 16 36 0" fill="none" stroke="{LN}" stroke-width="5" stroke-linecap="round"/>')
    return "".join(s)


def t_back():
    s = [f'<path d="M140 1030 C150 860 220 760 370 730 L654 730 C804 760 874 860 884 1030 Z" fill="{T["hood"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M300 620 C280 400 360 230 512 224 C664 230 744 400 724 620 C716 700 680 760 620 790 Q512 820 404 790 C344 760 308 700 300 620Z" fill="{T["hood"]}" stroke="{LN}" stroke-width="{LW}"/>',
         f'<path d="M512 230 C470 400 480 650 512 800" fill="none" stroke="{T["hood_sh"]}" stroke-width="8"/>',
         f'<path d="M312 520 C290 230 734 230 712 520" fill="none" stroke="{LN}" stroke-width="34" stroke-linecap="round"/>',
         f'<path d="M312 520 C290 230 734 230 712 520" fill="none" stroke="{T["band"]}" stroke-width="22" stroke-linecap="round"/>']
    for cx in (300, 724):
        s.append(f'<rect x="{cx-40}" y="470" width="80" height="130" rx="38" fill="{T["cup"]}" stroke="{LN}" stroke-width="{LW}"/>')
    return "".join(s)


# ================================================================ ЛЁХА
def l_head_base():
    s = []
    # волосы сзади/по бокам
    s.append(f'<path d="M352 470 C330 560 350 640 380 690 L400 560 Z M672 470 C694 560 674 640 644 690 L624 560Z" fill="{L["hair"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    for cx in (368, 656):
        s.append(f'<ellipse cx="{cx}" cy="540" rx="26" ry="38" fill="{L["skin"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M512 330 C622 330 660 420 658 520 C656 616 620 694 512 722 C404 694 368 616 366 520 C364 420 402 330 512 330Z" fill="{L["skin"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M376 590 C396 660 450 708 512 716 C452 690 410 650 392 590Z" fill="{L["skin_sh"]}" opacity=".55"/>')
    # веснушки
    for x, y in ((420, 600), (436, 588), (448, 606), (430, 616), (592, 600), (606, 588), (578, 606), (598, 616), (500, 590), (524, 592)):
        s.append(f'<circle cx="{x}" cy="{y}" r="4.5" fill="{L["freck"]}"/>')
    # чёлка
    s.append(f'<path d="M392 440 C410 500 440 520 470 512 C462 496 466 486 476 480 C490 506 520 510 540 496 C534 486 536 476 546 470 C566 492 600 498 630 470 L632 430 L392 430Z" fill="{L["hair"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    # шапка
    s.append(f'<path d="M352 452 C336 300 420 214 512 212 C604 214 688 300 672 452 Z" fill="{L["hat"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    for i in range(9):
        x = 400 + i * 28
        s.append(f'<path d="M{x} 260 C{x-4} 320 {x-6} 380 {x-6} 410" fill="none" stroke="{L["hat_sh"]}" stroke-width="5" opacity=".7"/>')
    s.append(f'<path d="M342 400 C420 380 604 380 682 400 L686 462 C604 444 420 444 338 462Z" fill="{L["hat_sh"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    for i in range(13):
        x = 356 + i * 26
        s.append(f'<line x1="{x}" y1="{398 + abs(i-6)*1.2}" x2="{x}" y2="{452 + abs(i-6)*1.2}" stroke="#b78812" stroke-width="5"/>')
    # помпон
    pts = []
    for k in range(18):
        a = 2 * math.pi * k / 18
        r = 52 + (8 if k % 2 else 0)
        pts.append(f"{512 + r*math.cos(a):.0f},{200 + r*math.sin(a):.0f}")
    s.append(f'<polygon points="{" ".join(pts)}" fill="{L["hat"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    # нос
    s.append(f'<path d="M508 556 q-22 34 0 42 q14 4 22 -6" fill="none" stroke="{L["skin_sh"]}" stroke-width="8" stroke-linecap="round"/>')
    return "".join(s)


def l_eyes(emo):
    E = (458, 540), (566, 540)
    if emo == "grin":
        e = "".join(eye(x, y, 28, 30, 11, 2, 2, 0.3, L["skin_sh"], iris="#3f6b3a", tag="lg") for x, y in E)
        b = brow(426, 494, 486, 488, L["brow"], 13, 8) + brow(536, 488, 596, 494, L["brow"], 13, 8)
    elif emo == "scared":
        e = "".join(eye(x, y, 31, 36, 7, -2, 0, iris="#3f6b3a", tag="ls") for x, y in E)
        b = brow(428, 488, 486, 474, L["brow"], 13, -3) + brow(538, 474, 596, 488, L["brow"], 13, -3)
    else:  # stare — смотрит прямо в камеру, пусто
        e = "".join(eye(x, y, 31, 34, 5, 0, 0, iris="#3f6b3a", tag="lt") for x, y in E)
        b = brow(428, 486, 486, 486, L["brow"], 13) + brow(538, 486, 596, 486, L["brow"], 13)
    return e + b


def l_blink():
    return "".join(f'<ellipse cx="{x}" cy="540" rx="31" ry="37" fill="{L["skin"]}"/><path d="M{x-28} 544 q28 12 56 0" fill="none" stroke="{LN}" stroke-width="{LW+1}" stroke-linecap="round"/>' for x in (458, 566))


def l_torso():
    s = []
    s.append(f'<path d="M472 690 L472 760 L552 760 L552 690Z" fill="{L["skin_sh"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M110 1030 C110 850 190 760 360 735 L664 735 C834 760 914 850 914 1030 L930 1900 L94 1900Z" fill="{L["coat"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    for y in (1080, 1180, 1280, 1380, 1480, 1580):
        s.append(f'<path d="M110 {y} Q512 {y+30} 914 {y}" fill="none" stroke="{L["coat_sh"]}" stroke-width="7"/>')
    s.append(f'<line x1="512" y1="1030" x2="512" y2="1900" stroke="{L["coat_dk"]}" stroke-width="8"/>')
    for y in (820, 900, 980):
        s.append(f'<path d="M{150 - (y-820)*0.15} {y} Q512 {y+30} {874 + (y-820)*0.15} {y}" fill="none" stroke="{L["coat_sh"]}" stroke-width="7"/>')
    s.append(f'<path d="M110 1030 C110 850 190 760 360 735 L330 820 C250 860 220 940 214 1030Z" fill="{L["coat_sh"]}" opacity=".7"/>')
    # высокий воротник
    s.append(f'<path d="M380 700 L644 700 L672 790 Q512 820 352 790Z" fill="{L["coat_sh"]}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<line x1="512" y1="790" x2="512" y2="1030" stroke="{L["coat_dk"]}" stroke-width="8"/>')
    s.append(f'<rect x="500" y="800" width="24" height="40" rx="5" fill="#c9ccd3" stroke="{LN}" stroke-width="3"/>')
    # фонарик на шнурке
    s.append(f'<path d="M440 790 Q470 900 560 930 M584 790 Q560 880 560 930" fill="none" stroke="#2b2d33" stroke-width="5"/>')
    s.append(f'<g transform="rotate(-15 570 960)"><rect x="548" y="924" width="44" height="90" rx="10" fill="#2b2d33" stroke="{LN}" stroke-width="{LW}"/><rect x="542" y="1000" width="56" height="26" rx="6" fill="#4a4d57" stroke="{LN}" stroke-width="4"/></g>')
    return "".join(s)


def l_back():
    s = [f'<path d="M110 1030 C110 850 190 760 360 735 L664 735 C834 760 914 850 914 1030Z" fill="{L["coat"]}" stroke="{LN}" stroke-width="{LW}"/>']
    for y in (820, 900, 980):
        s.append(f'<path d="M{150 - (y-820)*0.15} {y} Q512 {y+30} {874 + (y-820)*0.15} {y}" fill="none" stroke="{L["coat_sh"]}" stroke-width="7"/>')
    s.append(f'<path d="M380 700 L644 700 L672 790 Q512 820 352 790Z" fill="{L["coat_sh"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M366 520 C360 640 420 700 512 704 C604 700 664 640 658 520Z" fill="{L["hair"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M352 452 C336 300 420 214 512 212 C604 214 688 300 672 452 Z" fill="{L["hat"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M342 400 C420 380 604 380 682 400 L686 532 C604 514 420 514 338 532Z" fill="{L["hat_sh"]}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<circle cx="512" cy="200" r="56" fill="{L["hat"]}" stroke="{LN}" stroke-width="{LW}"/>')
    return "".join(s)


# ================================================================ МЕДСЕСТРА (600 x 1600, ступни на y=1600)
def nurse(arm_reach=False):
    g = "#d8d4c8"; gs = "#a9a597"; skin = "#e9e5dc"
    s = []
    # ноги
    s.append(f'<path d="M262 1250 L250 1585 L272 1585 L290 1250Z M330 1250 L346 1585 L368 1585 L352 1250Z" fill="#8f8b82" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<path d="M236 1580 h44 v20 h-56z M340 1580 h44 l12 20 h-56z" fill="#e6e3da" stroke="{LN}" stroke-width="4"/>')
    # волосы сзади
    s.append(f'<path d="M210 150 C190 300 200 420 220 470 L380 470 C400 420 410 300 390 150Z" fill="#111" />')
    # халат
    s.append(f'<path d="M230 300 C200 310 186 340 186 380 L150 1290 C240 1310 360 1310 450 1290 L414 380 C414 340 400 310 370 300Z" fill="{g}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M186 380 L150 1290 C190 1298 220 1302 250 1304 L240 400Z" fill="{gs}" opacity=".7"/>')
    s.append(f'<path d="M300 310 L300 1300" stroke="{gs}" stroke-width="4"/>')
    for y in (420, 540, 660, 780):
        s.append(f'<circle cx="300" cy="{y}" r="7" fill="#bdb8aa" stroke="{LN}" stroke-width="2"/>')
    # пятна
    for x, y, r in ((350, 900, 34), (230, 1100, 22), (370, 1180, 18), (260, 700, 14)):
        s.append(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*1.4}" fill="#7c5a48" opacity=".35"/>')
    # руки — очень длинные
    if arm_reach:
        s.append(f'<path d="M400 330 C470 360 520 420 560 470 L590 520 L572 536 L530 486 C490 440 440 400 404 380Z" fill="{g}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
        s.append(f'<path d="M580 520 l70 40 m-62 -20 l70 52 m-74 -32 l62 62 m-70 -40 l40 70" stroke="{skin}" stroke-width="10" stroke-linecap="round"/>')
    else:
        s.append(f'<path d="M412 330 C440 360 448 420 446 520 L440 1120 L420 1120 L416 520 C414 450 404 400 396 380Z" fill="{g}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
        s.append(f'<path d="M428 1116 l-6 120 m14 -120 l2 140 m12 -136 l10 126 m-46 -116 l-22 96" stroke="{skin}" stroke-width="9" stroke-linecap="round"/>')
    s.append(f'<path d="M188 330 C160 360 152 420 154 520 L160 1120 L180 1120 L184 520 C186 450 196 400 204 380Z" fill="{g}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M172 1116 l6 120 m-14 -120 l-2 140 m-12 -136 l-10 126 m46 -116 l22 96" stroke="{skin}" stroke-width="9" stroke-linecap="round"/>')
    # шея
    s.append(f'<path d="M280 240 L280 310 L320 310 L320 240Z" fill="{skin}" stroke="{LN}" stroke-width="4"/>')
    # лицо — гладкое белое пятно
    s.append(f'<ellipse cx="300" cy="170" rx="78" ry="100" fill="{skin}" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<ellipse cx="300" cy="190" rx="60" ry="70" fill="#fff" opacity=".35"/>')
    s.append(f'<ellipse cx="276" cy="160" rx="16" ry="10" fill="#cfcac0" opacity=".6"/><ellipse cx="324" cy="160" rx="16" ry="10" fill="#cfcac0" opacity=".6"/>')
    # пряди волос по лицу
    s.append(f'<path d="M226 120 C214 200 220 300 230 360 M240 100 C236 180 238 260 246 320 M374 120 C386 200 380 300 370 360" fill="none" stroke="#111" stroke-width="8" stroke-linecap="round"/>')
    # чепец
    s.append(f'<path d="M214 112 C220 50 380 50 386 112 L380 80 C340 54 260 54 220 80Z" fill="#fff" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M218 100 C230 30 370 30 382 100 C360 80 240 80 218 100Z" fill="#f0eee8" stroke="{LN}" stroke-width="{LW}"/>')
    s.append(f'<path d="M292 46 h16 v12 h12 v14 h-12 v12 h-16 v-12 h-12 v-14 h12z" fill="#9b2a2a" opacity=".8"/>')
    return "".join(s)


def nurse_hand():
    g = "#d8d4c8"; skin = "#e9e5dc"
    return (f'<path d="M470 390 C500 420 530 450 560 470 L590 520 L572 536 L530 486 C500 460 480 440 460 420Z" fill="{g}" stroke="{LN}" stroke-width="{LW}" stroke-linejoin="round"/>'
            f'<path d="M580 520 l70 40 m-62 -20 l70 52 m-74 -32 l62 62 m-70 -40 l40 70" stroke="{LN}" stroke-width="16" stroke-linecap="round"/>'
            f'<path d="M580 520 l70 40 m-62 -20 l70 52 m-74 -32 l62 62 m-70 -40 l40 70" stroke="{skin}" stroke-width="10" stroke-linecap="round"/>')


# ================================================================ ФОНЫ (1080 x 1920)
W, H = 1080, 1920


def bg_street():
    s = ['<defs><linearGradient id="skyS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1026"/><stop offset="1" stop-color="#1f2a4a"/></linearGradient>'
         '<radialGradient id="lampG" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#skyS)"/>']
    for i in range(40):
        s.append(f'<circle cx="{random.randint(0, W)}" cy="{random.randint(0, 500)}" r="{random.choice([1.5, 2, 2.5])}" fill="#fff" opacity="{random.uniform(.3, .8):.2f}"/>')
    # панелька
    s.append(f'<rect x="-40" y="180" width="{W+80}" height="1400" fill="#3a4258" stroke="{LN}" stroke-width="4"/>')
    for r in range(9):
        for c in range(7):
            x, y = 30 + c * 150, 230 + r * 140
            lit = random.random() < 0.18
            col = random.choice(["#ffcf6b", "#ffe2a0", "#9fd0ff"]) if lit else "#1b2033"
            s.append(f'<rect x="{x}" y="{y}" width="90" height="86" fill="{col}" stroke="{LN}" stroke-width="3"/>')
            s.append(f'<line x1="{x+45}" y1="{y}" x2="{x+45}" y2="{y+86}" stroke="{LN}" stroke-width="3"/>')
        s.append(f'<line x1="-40" y1="{218 + r*140}" x2="{W+40}" y2="{218 + r*140}" stroke="#2e3448" stroke-width="3"/>')
    # подъезд
    s.append(f'<rect x="380" y="1290" width="320" height="320" fill="#232735" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<rect x="430" y="1340" width="220" height="270" fill="#4b3a2e" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<rect x="350" y="1260" width="380" height="36" fill="#5c6274" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<rect x="525" y="1300" width="30" height="20" fill="#ffd98a"/>')
    s.append(f'<ellipse cx="540" cy="1310" rx="360" ry="420" fill="url(#lampG)" class="lampglow"/>')
    # асфальт
    s.append(f'<rect y="1560" width="{W}" height="360" fill="#1a1d27"/>')
    s.append(f'<ellipse cx="540" cy="1640" rx="300" ry="40" fill="#ffd98a" opacity=".12"/>')
    return "".join(s)


def bg_hospital():
    s = ['<defs><linearGradient id="skyH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070f"/><stop offset=".6" stop-color="#1b2234"/><stop offset="1" stop-color="#2c3346"/></linearGradient>'
         '<radialGradient id="moonG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e9ecf5" stop-opacity=".6"/><stop offset="1" stop-color="#e9ecf5" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="win33" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d9ffe9" stop-opacity=".9"/><stop offset="1" stop-color="#9ff0c4" stop-opacity="0"/></radialGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#skyH)"/>',
         '<circle cx="800" cy="300" r="260" fill="url(#moonG)"/><circle cx="800" cy="300" r="90" fill="#e8ebf2"/><circle cx="772" cy="282" r="16" fill="#cfd4df"/><circle cx="826" cy="326" r="11" fill="#cfd4df"/>']
    # здание
    s.append(f'<path d="M60 620 L1020 620 L1020 1380 L60 1380Z" fill="#4a4d52" stroke="{LN}" stroke-width="5"/>')
    s.append(f'<path d="M40 600 L1040 600 L1040 630 L40 630Z" fill="#35383d" stroke="{LN}" stroke-width="5"/>')
    s.append(f'<path d="M60 620 L1020 620 L1020 1380 L60 1380Z" fill="#000" opacity=".25"/>')
    for r in range(3):
        for c in range(6):
            x, y = 110 + c * 152, 680 + r * 230
            s.append(f'<rect x="{x}" y="{y}" width="100" height="150" fill="#0d0f14" stroke="{LN}" stroke-width="4"/>')
            if random.random() < 0.6:
                s.append(f'<path d="M{x} {y} l{random.randint(30,70)} {random.randint(20,60)} l{random.randint(-20,20)} {random.randint(30,70)} l-{random.randint(20,40)} 30 Z" fill="#2a2d33" opacity=".9"/>')
            s.append(f'<line x1="{x+50}" y1="{y}" x2="{x+50}" y2="{y+150}" stroke="#2a2d33" stroke-width="5"/>')
    # окно палаты 33 (3 этаж, 4-е окно)
    s.append('<g class="win33"><rect x="566" y="680" width="100" height="150" fill="#bff5d6" opacity=".55"/><circle cx="616" cy="755" r="170" fill="url(#win33)"/>'
             '<path d="M606 720 a10 12 0 1 1 20 0 l6 40 l-32 0z" fill="#0d0f14" opacity=".75"/></g>')
    # трещины, вход
    s.append(f'<path d="M200 640 l20 60 l-14 50 l30 60" stroke="#2a2d33" stroke-width="4" fill="none"/>')
    s.append(f'<rect x="460" y="1180" width="160" height="200" fill="#0d0f14" stroke="{LN}" stroke-width="5"/>')
    s.append(f'<rect x="420" y="1150" width="240" height="34" fill="#35383d" stroke="{LN}" stroke-width="4"/>')
    # земля
    s.append(f'<path d="M0 1380 L{W} 1380 L{W} {H} L0 {H}Z" fill="#14161c"/>')
    # деревья
    for x0, h0 in ((70, 900), (980, 820), (180, 700)):
        s.append(f'<path d="M{x0} 1400 L{x0+6} {1400-h0} M{x0+4} {1400-h0*0.6} l-80 -120 M{x0+4} {1400-h0*0.7} l90 -140 M{x0+4} {1400-h0*0.85} l-50 -90 M{x0+4} {1400-h0*0.45} l70 -80" stroke="#07080c" stroke-width="14" stroke-linecap="round"/>')
    return "".join(s)


def fence():
    s = [f'<rect x="0" y="1320" width="{W}" height="22" fill="#3b2a22" stroke="{LN}" stroke-width="4"/>',
         f'<rect x="0" y="1640" width="{W}" height="22" fill="#3b2a22" stroke="{LN}" stroke-width="4"/>']
    for i in range(0, W + 60, 54):
        s.append(f'<path d="M{i} 1700 L{i} 1300 l10 -26 l10 26 L{i+20} 1700Z" fill="#4a3428" stroke="{LN}" stroke-width="4"/>')
    s.append(f'<rect x="300" y="1400" width="480" height="140" rx="10" fill="#d6d1c4" stroke="{LN}" stroke-width="5"/>')
    s.append(f'<rect x="300" y="1400" width="480" height="140" rx="10" fill="#6d4a2e" opacity=".25"/>')
    s.append(f'<text x="540" y="1458" font-size="34" text-anchor="middle" fill="#2b2b2b" style="font-family:Inter" font-weight="800">ДЕТСКАЯ БОЛЬНИЦА</text>')
    s.append(f'<text x="540" y="1510" font-size="46" text-anchor="middle" fill="#8b1f1f" style="font-family:Inter" font-weight="900">«БЕРЁЗКА»</text>')
    s.append(f'<path d="M330 1420 l20 40 M740 1500 l20 20" stroke="#6d4a2e" stroke-width="6" opacity=".5"/>')
    return "".join(s)


DRAWINGS = [
    # солнце + домик
    '<circle cx="30" cy="30" r="18" fill="none" stroke="#e0a020" stroke-width="5"/><path d="M20 120 l40 -40 l40 40 v50 h-80z" fill="none" stroke="#c0392b" stroke-width="5"/>',
    # семья
    '<g stroke="#2a5db0" stroke-width="5" fill="none"><circle cx="30" cy="40" r="12"/><path d="M30 52 v40 M14 70 h32 M30 92 l-12 30 M30 92 l12 30"/><circle cx="80" cy="50" r="10"/><path d="M80 60 v34 M66 76 h28 M80 94 l-10 24 M80 94 l10 24"/></g>',
    # высокая фигура в чепце
    '<g stroke="#222" stroke-width="5" fill="none"><circle cx="60" cy="30" r="14"/><path d="M48 18 h24 M60 44 v90 M60 60 l-30 70 M60 60 l30 70 M60 134 l-14 30 M60 134 l14 30"/></g><path d="M52 12 h16 v6 h-16z" fill="#c0392b"/>',
    # кошка
    '<g stroke="#2d8a4e" stroke-width="5" fill="none"><circle cx="60" cy="70" r="30"/><path d="M38 48 l-6 -26 l20 14 M82 48 l6 -26 l-20 14"/></g>',
]


def drawing(i, x, y, rot):
    return (f'<g transform="translate({x} {y}) rotate({rot})"><rect width="130" height="170" fill="#f1ede2" stroke="#6b665b" stroke-width="3"/>'
            f'<rect x="55" y="-8" width="24" height="14" fill="#d9d3a8" opacity=".8"/>'
            f'<g transform="translate(5 5)">{DRAWINGS[i % len(DRAWINGS)]}</g></g>')


def bg_corridor(drawings=True):
    vx, vy = 540, 900  # точка схода
    s = ['<defs><linearGradient id="corrFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1d1a"/><stop offset="1" stop-color="#4c4a40"/></linearGradient></defs>']
    s.append(f'<rect width="{W}" height="{H}" fill="#1b1e1c"/>')
    # потолок
    s.append(f'<path d="M0 0 L{W} 0 L{vx+90} {vy-130} L{vx-90} {vy-130}Z" fill="#8f918a"/>')
    # стены: верх побелка, низ зелёная краска
    s.append(f'<path d="M0 0 L{vx-90} {vy-130} L{vx-90} {vy+130} L0 {H}Z" fill="#a7a99f"/>')
    s.append(f'<path d="M{W} 0 L{vx+90} {vy-130} L{vx+90} {vy+130} L{W} {H}Z" fill="#9c9e94"/>')
    s.append(f'<path d="M0 860 L{vx-90} {vy-10} L{vx-90} {vy+130} L0 {H}Z" fill="#3f6658"/>')
    s.append(f'<path d="M{W} 860 L{vx+90} {vy-10} L{vx+90} {vy+130} L{W} {H}Z" fill="#375d50"/>')
    s.append(f'<path d="M0 860 L{vx-90} {vy-10} M{W} 860 L{vx+90} {vy-10}" stroke="#243d34" stroke-width="10"/>')
    # пол — плитка
    s.append(f'<path d="M0 {H} L{vx-90} {vy+130} L{vx+90} {vy+130} L{W} {H}Z" fill="url(#corrFloor)"/>')
    for k in range(1, 12):
        f = (k / 12) ** 1.8
        y = vy + 130 + (H - vy - 130) * f
        x0 = vx - 90 - (vx - 90) * f
        s.append(f'<line x1="{x0}" y1="{y}" x2="{W-x0}" y2="{y}" stroke="#2a2a24" stroke-width="{1+3*f}"/>')
    for k in range(-6, 7):
        s.append(f'<line x1="{vx + k*15}" y1="{vy+130}" x2="{vx + k*200}" y2="{H}" stroke="#2a2a24" stroke-width="3"/>')
    # конец коридора — тьма
    s.append(f'<rect x="{vx-90}" y="{vy-130}" width="180" height="260" fill="#050505"/>')
    # двери по бокам
    for f in (0.25, 0.55, 0.78):
        def P(side, yy):
            x = (vx - 90) * f if side < 0 else W - (W - vx - 90) * f
            return x
        for side in (-1, 1):
            xa = (vx - 90) * f if side < 0 else W - (vx - 90) * f
            xb = (vx - 90) * (f + 0.1) if side < 0 else W - (vx - 90) * (f + 0.1)
            ya_t = (vy - 130) * f + 330 * (1 - f) * 0.9
            ya_b = H - (H - vy - 130) * f
            yb_t = (vy - 130) * (f + 0.1) + 330 * (1 - f - 0.1) * 0.9
            yb_b = H - (H - vy - 130) * (f + 0.1)
            s.append(f'<path d="M{xa} {ya_t} L{xb} {yb_t} L{xb} {yb_b} L{xa} {ya_b}Z" fill="#4d3b2e" stroke="{LN}" stroke-width="4"/>')
    # лампы на потолке
    for f in (0.2, 0.5, 0.75):
        y = (vy - 130) * f
        w = 300 * (1 - f) + 40
        s.append(f'<rect x="{vx-w/2}" y="{y}" width="{w}" height="{20*(1-f)+6}" fill="#c9cbc0" stroke="{LN}" stroke-width="3"/>')
    # трещины/облезлая краска
    s.append('<path d="M120 300 l40 80 l-20 60 l50 90 M960 420 l-30 70 l20 50" stroke="#6e7068" stroke-width="4" fill="none"/>')
    s.append('<path d="M60 980 q40 -30 80 0 q-10 40 -60 30z M980 1100 q-50 -20 -70 20 q30 30 70 0z" fill="#8b8c82"/>')
    if drawings:
        s.append(drawing(0, 60, 560, -6) + drawing(1, 230, 640, 4) + drawing(3, 860, 600, 5) + drawing(2, 720, 690, -3))
    return "".join(s)


def wheelchair():
    s = [f'<rect width="{W}" height="{H}" fill="#2a2b26"/>',
         f'<path d="M0 1100 L{W} 1050 L{W} {H} L0 {H}Z" fill="#45443a"/>']
    for k in range(8):
        s.append(f'<line x1="0" y1="{1120 + k*110}" x2="{W}" y2="{1070 + k*110}" stroke="#2e2d27" stroke-width="4"/>')
    s.append(f'<path d="M0 0 L{W} 0 L{W} 1050 L0 1100Z" fill="#7b7d73"/><path d="M0 700 L{W} 680 L{W} 1050 L0 1100Z" fill="#3a5a4e"/>')
    s.append(drawing(2, 680, 300, 6))
    # перевёрнутая коляска
    s.append(f'<g transform="translate(180 1150) rotate(-100 300 200)">'
             f'<path d="M100 100 h300 v40 h-300z M120 140 v200 M380 140 v200 M100 340 h300" fill="#55606b" stroke="{LN}" stroke-width="10"/>'
             f'<rect x="120" y="150" width="260" height="70" fill="#3b2e2e" stroke="{LN}" stroke-width="5"/></g>')
    s.append(f'<circle cx="300" cy="1500" r="60" fill="none" stroke="#2b2d33" stroke-width="18"/>')
    return "".join(s)


def wheel():
    s = [f'<circle cx="0" cy="0" r="210" fill="none" stroke="{LN}" stroke-width="34"/>',
         f'<circle cx="0" cy="0" r="210" fill="none" stroke="#3a3d45" stroke-width="24"/>',
         f'<circle cx="0" cy="0" r="180" fill="none" stroke="#8b929c" stroke-width="8"/>']
    for k in range(16):
        a = math.pi * 2 * k / 16
        s.append(f'<line x1="0" y1="0" x2="{180*math.cos(a):.1f}" y2="{180*math.sin(a):.1f}" stroke="#9aa2ad" stroke-width="5"/>')
    s.append(f'<circle r="30" fill="#5d636c" stroke="{LN}" stroke-width="6"/>')
    return "".join(s)


def doll_scene():
    s = [f'<rect width="{W}" height="{H}" fill="#3e3d35"/>']
    for k in range(-2, 12):
        s.append(f'<path d="M{k*140} 0 L{k*140 - 300} {H}" stroke="#2f2e28" stroke-width="5"/>')
    for k in range(14):
        s.append(f'<line x1="0" y1="{k*150}" x2="{W}" y2="{k*150 + 60}" stroke="#2f2e28" stroke-width="5"/>')
    # кукла
    d = (f'<g transform="translate(540 1000) rotate(-18)">'
         f'<path d="M-160 120 C-200 340 -120 470 0 470 C120 470 200 340 160 120Z" fill="#a33a4a" stroke="{LN}" stroke-width="6"/>'
         f'<path d="M-160 330 C-90 380 90 380 160 330" stroke="#f1e6d6" stroke-width="16" fill="none"/>'
         f'<path d="M-150 150 L-300 300 M150 150 L310 240" stroke="#f0d6c6" stroke-width="44" stroke-linecap="round"/>'
         f'<path d="M-120 -230 C-260 -200 -260 60 -150 120 M120 -230 C260 -200 260 60 150 120" fill="#c58b3a" stroke="{LN}" stroke-width="6"/>'
         f'<circle cx="0" cy="-60" r="170" fill="#f0d6c6" stroke="{LN}" stroke-width="7"/>'
         f'<path d="M-170 -100 C-150 -260 150 -260 170 -100 C120 -170 -120 -170 -170 -100Z" fill="#c58b3a" stroke="{LN}" stroke-width="6"/>'
         f'<circle cx="-62" cy="-50" r="34" fill="#0a0808"/><circle cx="62" cy="-50" r="34" fill="#0a0808"/>'
         f'<path d="M-66 -16 q-4 40 -10 70" stroke="#3a1a1a" stroke-width="5" opacity=".6"/>'
         f'<path d="M-40 50 q40 20 80 0" stroke="#8b3a3a" stroke-width="7" fill="none"/>'
         f'<path d="M30 -200 l20 60 l-16 40" stroke="#6b5a4a" stroke-width="4" fill="none"/>'
         f'<circle cx="-110" cy="10" r="20" fill="#e8a2a2" opacity=".6"/><circle cx="110" cy="10" r="20" fill="#e8a2a2" opacity=".6"/></g>')
    s.append(d)
    return "".join(s)


def door_frame():
    s = [f'<rect width="{W}" height="{H}" fill="#9c9e94"/>',
         f'<rect y="900" width="{W}" height="1020" fill="#3f6658"/>',
         f'<rect y="890" width="{W}" height="14" fill="#243d34"/>',
         f'<rect x="230" y="420" width="620" height="1300" fill="#050505" stroke="{LN}" stroke-width="10"/>',
         f'<rect x="200" y="390" width="680" height="40" fill="#6d6f66" stroke="{LN}" stroke-width="6"/>',
         f'<rect y="1720" width="{W}" height="200" fill="#4c4a40"/>',
         '<path d="M900 200 l40 80 l-20 70 M120 1200 l30 50" stroke="#6e7068" stroke-width="4" fill="none"/>']
    return "".join(s)


def door_leaf():
    # дверь шириной 620, высота 1300, петли слева (x=0)
    return (f'<rect x="0" y="0" width="620" height="1300" fill="#e3ded0" stroke="{LN}" stroke-width="8"/>'
            f'<rect x="50" y="60" width="520" height="520" fill="none" stroke="#b9b3a3" stroke-width="8"/>'
            f'<rect x="50" y="700" width="520" height="520" fill="none" stroke="#b9b3a3" stroke-width="8"/>'
            f'<path d="M80 300 l120 40 l-40 120 M400 900 l80 60" stroke="#a49d8c" stroke-width="5" fill="none"/>'
            f'<rect x="210" y="120" width="200" height="140" rx="10" fill="#f6f3ea" stroke="{LN}" stroke-width="6"/>'
            f'<text x="310" y="232" font-size="120" text-anchor="middle" fill="#222" style="font-family:Inter" font-weight="900">33</text>'
            f'<rect x="530" y="640" width="60" height="22" rx="8" fill="#8b929c" stroke="{LN}" stroke-width="4"/>')


def ward():
    s = ['<defs><linearGradient id="moonBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".35"/><stop offset="1" stop-color="#cfe6ff" stop-opacity="0"/></linearGradient></defs>',
         f'<rect width="1600" height="{H}" fill="#7f8b8a"/>',
         f'<rect y="820" width="1600" height="400" fill="#3b5a52"/>',
         f'<rect y="1200" width="1600" height="720" fill="#3a3a33"/>']
    for k in range(10):
        s.append(f'<line x1="0" y1="{1220 + k*80}" x2="1600" y2="{1240 + k*80}" stroke="#2c2c26" stroke-width="4"/>')
    # окно
    s.append(f'<rect x="620" y="260" width="360" height="460" fill="#0e1a2e" stroke="{LN}" stroke-width="8"/>'
             f'<line x1="800" y1="260" x2="800" y2="720" stroke="{LN}" stroke-width="8"/><line x1="620" y1="490" x2="980" y2="490" stroke="{LN}" stroke-width="8"/>'
             f'<circle cx="880" cy="360" r="40" fill="#e8ebf2"/>')
    s.append(f'<path d="M620 720 L980 720 L1300 1920 L200 1920Z" fill="url(#moonBeam)"/>')
    # облезлая стена
    s.append('<path d="M100 300 q60 -40 120 0 q-20 60 -90 40z M1300 500 q60 -30 100 20 q-40 40 -100 0z M200 900 q50 -20 80 10" fill="#a7a99f"/>')
    # 6 кроватей
    for i in range(6):
        x = 40 + i * 260
        y = 1060 + (i % 2) * 40
        s.append(f'<g transform="translate({x} {y})">'
                 f'<path d="M0 0 v280 M220 0 v280 M0 40 h220" stroke="#5d636c" stroke-width="12"/>'
                 f'<rect x="-6" y="120" width="232" height="110" rx="10" fill="#f7f6f1" stroke="{LN}" stroke-width="5"/>'
                 f'<rect x="20" y="96" width="120" height="44" rx="18" fill="#ffffff" stroke="{LN}" stroke-width="5"/>'
                 f'<path d="M-6 170 h232" stroke="#d9d8d0" stroke-width="5"/>'
                 f'<path d="M0 230 v70 M220 230 v70" stroke="#5d636c" stroke-width="12"/></g>')
    return "".join(s)


def bg_room():
    s = ['<defs><radialGradient id="roomL" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#1c2740"/><stop offset="1" stop-color="#05070c"/></radialGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#roomL)"/>',
         # окно с городом
         f'<rect x="60" y="300" width="300" height="420" fill="#0b1430" stroke="#000" stroke-width="10"/>',
         '<rect x="90" y="560" width="40" height="160" fill="#141c38"/><rect x="150" y="500" width="60" height="220" fill="#141c38"/><rect x="230" y="580" width="50" height="140" fill="#141c38"/>',
         '<rect x="160" y="520" width="8" height="8" fill="#ffcf6b"/><rect x="180" y="560" width="8" height="8" fill="#ffcf6b"/><rect x="100" y="600" width="8" height="8" fill="#ffcf6b"/>',
         '<line x1="210" y1="300" x2="210" y2="720" stroke="#000" stroke-width="10"/>',
         # постер
         '<rect x="430" y="330" width="200" height="270" fill="#2a2140" stroke="#000" stroke-width="5" transform="rotate(3 530 465)"/>',
         '<circle cx="530" cy="440" r="50" fill="#6a3a8a" opacity=".6"/>',
         # дверной проём
         f'<rect x="700" y="420" width="300" height="1000" fill="#020203" stroke="#0f1320" stroke-width="16"/>',
         f'<rect x="700" y="420" width="40" height="1000" fill="#0b0e18"/>',
         # кровать/стол
         f'<rect x="0" y="1300" width="{W}" height="620" fill="#0a0d16"/>']
    return "".join(s)


def phone_ui():
    """Интерфейс записи камеры (рамка)."""
    c = "#ffffff"
    return (f'<g stroke="{c}" stroke-width="6" fill="none" opacity=".85">'
            f'<path d="M60 160 v-70 h70 M1020 160 v-70 h-70 M60 1760 v70 h70 M1020 1760 v70 h-70"/></g>'
            f'<g opacity=".85"><rect x="890" y="110" width="80" height="36" rx="6" fill="none" stroke="#fff" stroke-width="4"/>'
            f'<rect x="896" y="116" width="40" height="24" fill="#fff"/><rect x="970" y="120" width="6" height="16" fill="#fff"/></g>'
            f'<text x="540" y="1820" font-size="34" text-anchor="middle" fill="#fff" opacity=".8" style="font-family:\'JetBrains Mono\'" font-weight="700">HD · 30FPS</text>'
            f'<g stroke="#fff" stroke-width="3" opacity=".5"><line x1="510" y1="960" x2="570" y2="960"/><line x1="540" y1="930" x2="540" y2="990"/></g>')


A.update(
    T_base=t_head_base(), T_torso=t_torso(), T_back=t_back(), T_blink=t_blink(),
    L_base=l_head_base(), L_torso=l_torso(), L_back=l_back(), L_blink=l_blink(),
    N_full=nurse(), N_reach=nurse(True), N_hand=nurse_hand(),
    BG_street=bg_street(), BG_hospital=bg_hospital(), FENCE=fence(), BG_corr=bg_corridor(), BG_corr_plain=bg_corridor(False),
    BG_wheel=wheelchair(), WHEEL=wheel(), BG_doll=doll_scene(), BG_doorframe=door_frame(), DOOR=door_leaf(),
    BG_ward=ward(), BG_room=bg_room(), CAM_UI=phone_ui(),
)
for e in ("neutral", "scared", "terrified"):
    A[f"T_eyes_{e}"] = t_eyes(e)
    A[f"T_mouth_{e}"] = mouth_set(512, 622, 92, e)
for e in ("grin", "scared", "stare"):
    A[f"L_eyes_{e}"] = l_eyes(e)
    A[f"L_mouth_{e}"] = mouth_set(512, 650, 100 if e == "grin" else 80, e, braces=True)

open(f"{OUT}/assets.js", "w").write("window.A=" + json.dumps(A, ensure_ascii=False) + ";")
print("assets:", len(A), "keys,", sum(len(json.dumps(v)) for v in A.values()) // 1024, "KB")
