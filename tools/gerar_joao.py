from PIL import Image
S=Image.open('assets/joao_ref_normalizado.png').convert('RGBA'); W,H=S.size; OL=(26,16,16,255); PADR=34; PADT=14
HIP=60
def crop(b): return S.crop(b)
legL=crop((8,HIP,23,77)); legR=crop((22,HIP,39,77))
# remove a outra perna que vaza em cada recorte
for im,keep in ((legL,lambda x,y:x<=14),(legR,lambda x,y:x>=1 and not(y<4 and x>=13))):
    p=im.load()
    for y in range(im.height):
        for x in range(im.width):
            if not keep(x,y): p[x,y]=(0,0,0,0)
up=crop((0,0,W,HIP+2))
front=crop((34,30,42,60)); back=crop((0,31,12,60))
body=up.copy(); p=body.load()
for y in range(34,HIP+2):
    for x in range(35,W): p[x,y]=(0,0,0,0)
    for x in range(0,10): p[x,y]=(0,0,0,0)
# limpa mãos que sobram por baixo
for y in range(52,HIP+2):
    for x in range(0,12): p[x,y]=(0,0,0,0)
    for x in range(33,W): p[x,y]=(0,0,0,0)
def outline(im):
    a=im.load(); o=im.copy(); b=o.load()
    for y in range(im.height):
        for x in range(im.width):
            if a[x,y][3]==0 and any(0<=x+i<im.width and 0<=y+j<im.height and a[x+i,y+j][3] and sum(a[x+i,y+j][:3])>200 for i,j in((1,0),(-1,0),(0,1),(0,-1))): b[x,y]=OL
    return o
def canvas(): return Image.new('RGBA',(W+PADR,HIP+2+PADT))
def put(c,im,x,y): c.alpha_composite(im,(x,y+PADT))
fa_up=front.crop((0,0,8,12)); fa_lo=front.crop((0,10,8,30))   # braço (manga) / antebraço+mão
ba_up=back.crop((0,0,12,12)); ba_lo=back.crop((0,10,12,29))
R90=lambda im:im.transpose(Image.ROTATE_90)    # aponta p/ direita? (topo->esquerda)
UPV=lambda im: im.transpose(Image.ROTATE_180).transpose(Image.FLIP_LEFT_RIGHT)   # antebraço apontando p/ cima (mão no topo)
def pose(kind):
    c=canvas()
    put(c,ba_up,0,31)
    put(c,body,0,0)
    if kind in('guard','punch','upper'): put(c,UPV(ba_lo).crop((3,0,12,19)),27,24)   # punho de trás na frente do peito
    if kind=='block': put(c,UPV(ba_lo).crop((3,0,12,19)),28,10)
    if kind=='guard':  put(c,UPV(fa_lo),36,18)                         # punho na altura do queixo
    elif kind=='punch': put(c,front.transpose(Image.ROTATE_270),35,30)  # braço esticado
    elif kind=='upper': put(c,UPV(front),33,1)                          # punho p/ cima
    elif kind=='block': put(c,UPV(fa_lo),35,6)                          # antebraço protegendo o rosto
    return outline(c)
import os; d='assets/joao/'
for f in os.listdir(d): os.remove(d+f)
for k in('guard','punch','upper','block'): pose(k).save(d+k+'.png')
legL.save(d+'leg_l.png'); legR.save(d+'leg_r.png')
S.save(d+'win.png')   # vitória: arte original, braços para baixo
big=Image.new('RGBA',(5*(W+PADR)*4,(HIP+2+PADT+17)*4),'white')
for i,k in enumerate(['guard','punch','upper','block','win']):
    im=Image.open(d+k+'.png'); t=Image.new('RGBA',(W+PADR,HIP+PADT+19)); t.alpha_composite(im,(0,0) if k=='win' else (0,0))
    if k!='win': t.alpha_composite(legR,(22,PADT+HIP)); t.alpha_composite(legL,(8,PADT+HIP)); t.alpha_composite(im,(0,0))
    big.alpha_composite(t.resize((t.width*4,t.height*4),0),(i*(W+PADR)*4,0))
big.save('/tmp/jp3sheet.png')
