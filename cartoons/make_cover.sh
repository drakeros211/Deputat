#!/bin/bash
# cover.png (1080x1920) + cover_3x4.jpg (1080x1440) в папке серии
cd "$1" && node render.js --cover && python3 - <<'P'
from PIL import Image, ImageFilter, ImageEnhance
src = Image.open('cover.png').convert('RGB'); W,H=1080,1440
bg = src.resize((W, int(W*1920/1080))).crop((0,(1920-H)//2,W,(1920-H)//2+H))
bg = ImageEnhance.Brightness(bg.filter(ImageFilter.GaussianBlur(30))).enhance(.45)
w=int(H*1080/1920); bg.paste(src.resize((w,H), Image.LANCZOS), ((W-w)//2, 0)); bg.save('cover_3x4.jpg', quality=95)
src.resize((540,960)).save('build/cover_small.png')
P
