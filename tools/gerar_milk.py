# Gera as peças do Milk (assets/milk/) a partir de assets/milk_ref_normalizado.png (42x93, grade nativa)
from PIL import Image
S=Image.open('assets/milk_ref_normalizado.png').convert('RGBA'); W,H=S.size; OL=(26,16,16,255); PADR=34; PADT=16; HIP=75
legL=S.crop((8,HIP,24,H)); legR=S.crop((23,HIP,W,H))
for im,keep in ((legL,lambda x,y:x<=14),(legR,lambda x,y:x>=1)):
    p=im.load()
    for y in range(im.height):
        for x in range(im.width):
            if not keep(x,y): p[x,y]=(0,0,0,0)
up=S.crop((0,0,W,HIP+2))
front=S.crop((36,46,W,70)); back=S.crop((0,46,10,70))
body=up.copy(); q=body.load()
for y in range(46,HIP+2):
    for x in range(0,12):
        if x<9 or y<63: q[x,y]=(0,0,0,0)
    for x in range(37,W): q[x,y]=(0,0,0,0)
for y in range(56,HIP+2):
    for x in list(range(0,13))+list(range(33,W)):
        r,g,b,a=q[x,y]
        if a and r>g+25 and r>b+30: q[x,y]=(0,0,0,0)   # restos das mãos
# fecha o contorno do tronco onde os braços saíram
for y in range(46,63):
    q[11,y]=OL; q[37 if 37<W else W-1,y]=(0,0,0,0)
for y in range(46,64):
    if q[36,y][3]: q[36,y]=OL
def outline(im):
    a=im.load(); o=im.copy(); b=o.load()
    for y in range(im.height):
        for x in range(im.width):
            if a[x,y][3]==0 and any(0<=x+i<im.width and 0<=y+j<im.height and a[x+i,y+j][3] and sum(a[x+i,y+j][:3])>110 for i,j in((1,0),(-1,0),(0,1),(0,-1))): b[x,y]=OL
    return o
def canvas(): return Image.new('RGBA',(W+PADR,HIP+2+PADT))
def put(c,im,x,y): c.alpha_composite(im,(x,y+PADT))
UPV=lambda im: im.transpose(Image.ROTATE_180).transpose(Image.FLIP_LEFT_RIGHT)   # aponta p/ cima, mão no topo
FWD=lambda im: im.transpose(Image.ROTATE_90)                                       # horizontal, mão p/ frente
UA=front.crop((0,0,front.width,10))            # braço (do fim da manga até o cotovelo)
BUA=back.crop((0,0,back.width,6))
def pose(kind):
    c=canvas(); put(c,body,0,0)
    # braço de trás: manga -> braço curto -> cotovelo -> antebraço p/ frente na barriga
    if kind=='block': put(c,BUA,1,46); put(c,FWD(back),3,48)
    else: put(c,BUA,1,46); put(c,FWD(back),3,50)
    if kind=='guard':   put(c,UA,36,46); put(c,UPV(front),36,32)     # cotovelo em baixo (y~56), punho no queixo
    elif kind=='punch': put(c,FWD(front),36,38)                     # soco esticado (cotovelo encostado na manga)
    elif kind=='upper': put(c,UA,36,46); put(c,UPV(front),36,24)     # punho p/ cima
    elif kind=='block': put(c,UA,36,46); put(c,UPV(front),37,28)     # antebraço na frente do rosto
    return outline(c)
import os; d='assets/milk/'; os.makedirs(d,exist_ok=True)
for k in('guard','punch','upper','block'): pose(k).save(d+k+'.png')
legL.save(d+'leg_l.png'); legR.save(d+'leg_r.png'); S.save(d+'win.png')
sheet=Image.new('RGBA',(5*(W+PADR)*4,(H+PADT)*4),'white')
for i,k in enumerate(['guard','punch','upper','block','win']):
    im=Image.open(d+k+'.png'); t=Image.new('RGBA',(W+PADR,H+PADT))
    if k=='win': t.alpha_composite(im,(0,PADT))
    else: t.alpha_composite(legR,(23,PADT+HIP)); t.alpha_composite(legL,(8,PADT+HIP)); t.alpha_composite(im,(0,0))
    sheet.alpha_composite(t.resize((t.width*4,t.height*4),0),(i*(W+PADR)*4,0))
sheet.save('/tmp/milksheet.png')
