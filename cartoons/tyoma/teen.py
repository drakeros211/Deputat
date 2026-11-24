"""Тёма-подросток: капюшон на голове, наушники поверх, ухмылка. Аватарка TikTok.
Запуск: python3 teen.py && node render.js"""
from gen import svg, OUT, C, LW
from blogger import rays, bubble, mic, spark

W = 1024
l = C["line"]

defs = '''<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6a5cff"/><stop offset=".5" stop-color="#c25bff"/><stop offset="1" stop-color="#ff6f8f"/></linearGradient>
  <radialGradient id="sunC" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe2f4" stop-opacity=".7"/><stop offset="1" stop-color="#ffe2f4" stop-opacity="0"/></radialGradient>
  <filter id="sh"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#2a1060" flood-opacity=".4"/></filter>
</defs>'''


def torso_teen():
    s = []
    s.append(f'<path d="M466 660 L466 750 L558 750 L558 660 Z" fill="{C["skin_sh"]}" stroke="{l}" stroke-width="{LW}"/>')
    s.append(f'<path d="M140 1030 C150 860 220 760 370 730 L654 730 C804 760 874 860 884 1030 Z" fill="{C["hood"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M140 1030 C150 860 220 760 370 730 L340 800 C262 840 232 920 228 1030Z" fill="{C["hood_sh"]}"/>')
    s.append(f'<path d="M884 1030 C874 860 804 760 654 730 L690 800 C770 850 800 930 804 1030Z" fill="{C["hood_sh"]}"/>')
    # V-вырез капюшона, уходящий вверх к голове
    s.append(f'<path d="M370 730 C420 800 604 800 654 730 L620 720 C580 770 444 770 404 720Z" fill="{C["hood_dk"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>')
    # шнурки
    for x, sway in ((470, -10), (556, 12)):
        s.append(f'<path d="M{x} 770 q{sway} 80 {sway/2} 170" fill="none" stroke="{C["string"]}" stroke-width="9" stroke-linecap="round"/>')
        s.append(f'<rect x="{x+sway/2-7}" y="936" width="14" height="28" rx="3" fill="#9aa0a8" stroke="{l}" stroke-width="3"/>')
    # значки на худи
    s.append(f'<circle cx="340" cy="870" r="38" fill="#ffd23f" stroke="{l}" stroke-width="{LW}"/>'
             f'<path d="M322 862 a4 4 0 1 0 0.1 0 M358 862 a4 4 0 1 0 0.1 0" stroke="{l}" stroke-width="8" stroke-linecap="round"/>'
             f'<path d="M320 880 q20 18 40 0" fill="none" stroke="{l}" stroke-width="5" stroke-linecap="round"/>')
    return "".join(s)


def head_teen():
    s = []
    # капюшон: внешняя часть
    s.append(f'<path d="M292 600 C270 390 350 215 512 208 C674 215 754 390 732 600 C724 680 700 730 664 760 Q512 830 360 760 C324 730 300 680 292 600Z" '
             f'fill="{C["hood"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M292 600 C270 390 350 215 512 208 C420 230 340 330 336 520 C334 620 350 700 380 760 L360 760 C324 730 300 680 292 600Z" fill="{C["hood_sh"]}"/>')
    # внутренняя тень капюшона
    s.append(f'<path d="M334 590 C326 420 396 280 512 274 C628 280 698 420 690 590 C686 670 664 720 634 750 Q512 800 390 750 C360 720 338 670 334 590Z" '
             f'fill="{C["hood_dk"]}" stroke="{l}" stroke-width="{LW}"/>')
    # волосы под капюшоном (за лицом)
    s.append(f'<path d="M352 520 C346 420 400 330 512 326 C624 330 678 420 672 520 C660 480 640 450 620 440 L404 440 C384 450 364 480 352 520Z" fill="{C["hair"]}"/>')
    # лицо — вытянутее, с подбородком
    s.append(f'<path d="M512 346 C626 346 668 420 666 506 C664 594 626 656 562 686 Q512 704 462 686 C398 656 360 594 358 506 C356 420 398 346 512 346Z" '
             f'fill="{C["skin"]}" stroke="{l}" stroke-width="{LW}"/>')
    s.append(f'<path d="M366 560 C384 640 440 684 512 694 C446 676 400 636 384 560Z" fill="{C["skin_sh"]}" opacity=".5"/>')
    # тень от капюшона на лбу
    s.append(f'<path d="M370 470 C390 400 450 360 512 358 C574 360 634 400 654 470 C610 430 560 418 512 418 C464 418 414 430 370 470Z" fill="{C["skin_sh"]}" opacity=".55"/>')
    # чёлка торчит из-под капюшона
    s.append(f'''<path d="M380 470 C380 400 430 352 512 350 C600 352 650 400 646 466
        C630 440 616 430 602 428 C606 446 602 458 594 466 C580 440 560 428 540 424
        C546 444 540 458 530 466 C514 438 494 428 470 428 C476 446 470 458 460 464
        C448 444 430 436 414 440 C410 456 400 466 380 470Z"
        fill="{C["hair"]}" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>''')
    s.append(f'<path d="M450 376 C480 366 520 366 548 378" fill="none" stroke="{C["hair_hl"]}" stroke-width="8" stroke-linecap="round"/>')
    # глаза: чуть меньше, полуприкрыты — «уверенный» взгляд
    for i, (cx, cy) in enumerate(((450, 516), (576, 516))):
        rx, ry = 34, 36
        cid = f"teye{i}"
        s.append(f'<clipPath id="{cid}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>')
        s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{C["eye"]}"/>')
        s.append(f'<g clip-path="url(#{cid})"><circle cx="{cx+6}" cy="{cy+5}" r="22" fill="{C["iris"]}"/>'
                 f'<circle cx="{cx+6}" cy="{cy+5}" r="13" fill="{C["pupil"]}"/>'
                 f'<circle cx="{cx-2}" cy="{cy-3}" r="6" fill="#fff"/>'
                 f'<rect x="{cx-rx}" y="{cy-ry-2}" width="{rx*2}" height="{ry*0.55}" fill="{C["skin_sh"]}"/>'
                 f'<line x1="{cx-rx}" y1="{cy-ry*0.45}" x2="{cx+rx}" y2="{cy-ry*0.45}" stroke="{l}" stroke-width="{LW+1}"/></g>')
        s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{l}" stroke-width="{LW}"/>')
    # брови: левая ровная, правая приподнята
    s.append(f'<path d="M412 470 L486 466" stroke="{C["hair"]}" stroke-width="15" stroke-linecap="round"/>')
    s.append(f'<path d="M540 458 Q578 440 616 452" fill="none" stroke="{C["hair"]}" stroke-width="15" stroke-linecap="round"/>')
    # нос
    s.append(f'<path d="M512 548 q-12 26 4 30 q10 2 14 -4" fill="none" stroke="{C["skin_sh"]}" stroke-width="7" stroke-linecap="round"/>')
    # ухмылка с зубами
    s.append(f'<path d="M470 612 q48 22 96 -14 q-8 42 -50 46 q-34 2 -46 -32z" fill="#5a2228" stroke="{l}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M478 618 q40 14 82 -12 l-4 12 q-36 20 -74 8z" fill="#fff"/>')
    s.append(f'<path d="M572 594 q8 6 6 16" fill="none" stroke="{l}" stroke-width="4" stroke-linecap="round"/>')
    # пластырь
    s.append(f'''<g transform="rotate(-24 616 572)">
      <rect x="584" y="560" width="64" height="26" rx="11" fill="{C["plaster"]}" stroke="{l}" stroke-width="4"/>
      <rect x="605" y="563" width="22" height="20" rx="3" fill="#f3dcb8"/></g>''')
    # наушники поверх капюшона
    s.append(f'<path d="M312 520 C290 230 734 230 712 520" fill="none" stroke="{l}" stroke-width="34" stroke-linecap="round"/>')
    s.append(f'<path d="M312 520 C290 230 734 230 712 520" fill="none" stroke="{C["phone_band"]}" stroke-width="22" stroke-linecap="round"/>')
    s.append(f'<path d="M360 330 C420 270 470 262 512 260" fill="none" stroke="#5a5e69" stroke-width="6" stroke-linecap="round"/>')
    for cx in (308, 716):
        s.append(f'<rect x="{cx-44}" y="470" width="88" height="130" rx="40" fill="{C["phone_cup"]}" stroke="{l}" stroke-width="{LW}"/>'
                 f'<rect x="{cx-30}" y="488" width="60" height="94" rx="28" fill="{C["phone_band"]}"/>'
                 f'<circle cx="{cx}" cy="535" r="14" fill="{C["phone_acc"]}"/>')
    return "".join(s)


body = (
    defs +
    f'<rect width="{W}" height="{W}" fill="url(#sky)"/>' + rays(512, 470) +
    '<circle cx="512" cy="470" r="380" fill="url(#sunC)"/>' +
    bubble(170, 250, 0.95, -10, "#ffffff",
           '<text x="0" y="22" font-size="64" text-anchor="middle" style="font-family:Inter" font-weight="900" fill="#c25bff">!</text>'
           '<circle cx="-40" cy="5" r="9" fill="#6a5cff"/><circle cx="40" cy="5" r="9" fill="#6a5cff"/>') +
    bubble(860, 230, 0.8, 12, "#ffd23f",
           '<text x="0" y="20" font-size="56" text-anchor="middle" style="font-family:Inter" font-weight="900" fill="#1d1a1c">?</text>') +
    spark(140, 560, 1.2, "#fff6c8") + spark(900, 480, 0.9) + spark(300, 110, 0.7) + spark(740, 100, 0.8, "#fff6c8") +
    f'<g transform="translate(512 560) scale(1.1) translate(-512 -540)">{torso_teen()}{head_teen()}</g>' +
    mic
)
open(f"{OUT}/avatar_teen.svg", "w").write(svg(W, W, body))
prev = (f'<defs><clipPath id="circ"><circle cx="512" cy="512" r="480"/></clipPath></defs>'
        f'<rect width="{W}" height="{W}" fill="#fff"/><g clip-path="url(#circ)">{body}</g>')
open(f"{OUT}/avatar_teen_circle.svg", "w").write(svg(W, W, prev))
print("ok")
