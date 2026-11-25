import sys,glob
from PIL import Image,ImageDraw
ts=sys.argv[2].split(','); w,h=270,480
g=Image.new('RGB',(w*6,h*((len(ts)+5)//6)))
for i,t in enumerate(ts):
    im=Image.open(f'build/preview/t{float(t):.2f}.jpg').resize((w,h)); ImageDraw.Draw(im).text((5,5),t,fill=(255,0,255))
    g.paste(im,((i%6)*w,(i//6)*h))
g.save(sys.argv[1])
