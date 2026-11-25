#!/bin/bash
# Проверка ролика с баннерами: зелёные пиксели, длительности дорожек, кадры вокруг баннеров
F=$1; O=$2; mkdir -p $O; rm -f $O/*
ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 $F
for t in $3; do ffmpeg -v error -y -ss $t -i $F -frames:v 1 -vf scale=270:480 $O/$t.png; done
python3 - "$O" <<'P'
import sys,glob
from PIL import Image,ImageDraw; import numpy as np
O=sys.argv[1]; fs=sorted(glob.glob(O+'/*.png'),key=lambda f:float(f.split('/')[-1][:-4]))
g=Image.new('RGB',(270*len(fs),480)); mx=0
for i,f in enumerate(fs):
  a=np.asarray(Image.open(f).convert('RGB')).astype(int)
  n=((a[:,:,1]>150)&(a[:,:,1]>a[:,:,0]+80)&(a[:,:,1]>a[:,:,2]+80)).sum(); mx=max(mx,n)
  im=Image.open(f); ImageDraw.Draw(im).text((5,5),f.split('/')[-1]+f' g={n}',fill=(255,0,255)); g.paste(im,(i*270,0))
g.save(O+'/sheet.jpg'); print('max green px:',mx)
P
