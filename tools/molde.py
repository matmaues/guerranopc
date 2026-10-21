# Gera kit/molde_base.png e kit/molde_comparacao.png
# Manequim nas proporções do Maués em jogo (corpo 43x66 + pernas = ~45x88 px de arte)
from PIL import Image, ImageDraw, ImageFont
OL=(26,16,16); F=(205,205,205); S=(165,165,165); WH=(255,255,255)
def manequim():
    m=Image.new('RGB',(45,90),WH); d=ImageDraw.Draw(m); o=1
    R=lambda b,c: d.rectangle([b[0]+o,b[1]+o,b[2]+o,b[3]+o],fill=c,outline=OL)
    R((10,64,19,82),F); R((24,64,33,82),F)            # pernas
    R((9,82,21,86),S); R((23,82,35,86),S)              # pés
    R((8,47,35,65),S)                                  # quadril/short
    d.polygon([(8+o,24+o),(35+o,24+o),(36+o,48+o),(7+o,48+o)],fill=F,outline=OL)  # tronco
    R((1,26,7,55),F); R((36,26,42,55),F)               # braços soltos ao lado
    R((1,55,7,60),S); R((36,55,42,60),S)               # mãos
    R((18,19,27,25),F)                                 # pescoço
    d.ellipse([12+o,0+o,34+o,23+o],fill=F,outline=OL)  # cabeça (mesmo tamanho do Maués)
    R((34,10,36,13),F)                                 # nariz -> virado 3/4 p/ direita
    d.point((30+o,9+o),fill=OL); d.point((31+o,9+o),fill=OL)  # olho
    return m
def maues():
    im=Image.open('assets/maues.png').convert('RGBA'); sk=(233,165,126); c=Image.new('RGBA',(45,90),(0,0,0,0)); d=ImageDraw.Draw(c)
    ly=66; R=lambda x,y,w,h,col: d.rectangle([x,y,x+w-1,y+h-1],fill=col)
    for lx in (10,25):
        L=16; R(lx,ly,10,L-5,OL);R(lx+1,ly,8,L-5,sk);R(lx+1,ly+L-6,8,6,OL);R(lx+2,ly+L-6,6,6,sk)
        fy=ly+L;R(lx+1,fy-1,12,5,OL);R(lx+2,fy,10,3,sk);R(lx,fy+3,15,3,OL);R(lx+1,fy+3,13,2,WH)
    c.alpha_composite(im,(1,0)); return c
def up(im,k):return im.resize((im.width*k,im.height*k),Image.NEAREST)
fnt=lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s)
m=manequim(); m.save('kit/molde_1x.png')
K=10; big=up(m,K).convert('RGB'); g=ImageDraw.Draw(big)
for x in range(0,big.width,K): g.line([x,0,x,big.height],fill=(232,232,240))
for y in range(0,big.height,K): g.line([0,y,big.width,y],fill=(232,232,240))
big=Image.composite(up(m,K),big,up(m.convert('L').point(lambda v:255 if v<250 else 0),K))  # grade só no fundo
P=Image.new('RGB',(big.width+560,big.height+480),WH); P.paste(big,(60,190)); d=ImageDraw.Draw(P)
d.text((20,15),"MOLDE BASE — GUERRA no P.C   (1 quadrado = 1 pixel de arte)",fill=OL,font=fnt(24))
red=(220,30,30); X0=60; Y0=190; gx=X0+big.width+20
def vg(y1,y2,txt,xx):
    d.line([xx,Y0+y1*K,xx,Y0+y2*K],fill=red,width=3)
    for yy in (y1,y2): d.line([xx-8,Y0+yy*K,xx+8,Y0+yy*K],fill=red,width=3)
    d.text((xx+14,Y0+(y1+y2)/2*K-14),txt,fill=red,font=fnt(22))
vg(1,25,"cabeça: 24 px",gx); vg(25,66,"tronco+short: 41 px",gx); vg(66,88,"pernas+pés: 22 px",gx); vg(1,88,"",gx+290)
d.text((gx+305,Y0+40*K),"altura\ntotal:\n88 px",fill=red,font=fnt(24))
d.line([X0+2*K,Y0-8,X0+43*K,Y0-8],fill=(30,90,220),width=3); d.text((X0+5*K,Y0-40),"ombros/braços: 41 px · cabeça: 23 px",fill=(30,90,220),font=fnt(20))
yb=Y0+big.height+30; d.text((60,yb),"tamanho real 1x  e  2x:",fill=OL,font=fnt(20)); P.paste(m,(330,yb)); P.paste(up(m,2),(400,yb))
for hpx,nome,col in ((80,'BAIXO ≤1,65 m = 80 px',(0,150,0)),(88,'MÉDIO 1,80 m = 88 px',(30,90,220)),(96,'ALTO ≥1,95 m = 96 px',(200,0,160))):
    yy=Y0+(89-hpx)*K
    for xx in range(X0-40,X0+big.width,14): d.line([xx,yy,xx+7,yy],fill=col,width=2)
    d.text((X0+big.width+20 if hpx!=88 else X0+big.width+20,yy-22),nome,fill=col,font=fnt(18))
d.text((20,Y0+big.height+210),"Pés SEMPRE na mesma linha de base. Altura = pés até o topo da cabeça (cabelo alto/chapéu não contam).",fill=OL,font=fnt(15))
P.save('kit/molde_base.png')
# comparação
row=[('MOLDE',m.convert('RGBA')),('MAUÉS',maues()),('JOÃO PEDRO',Image.open('assets/joao/win.png').convert('RGBA'))]
K=6; C=Image.new('RGB',(3*45*K+4*40,90*K+120),WH); d=ImageDraw.Draw(C)
for i,(n,im) in enumerate(row):
    x=40+i*(45*K+40); y=60+(90-im.height-(0 if n!='JOÃO PEDRO' else 2))*K
    C.paste(up(im,K),(x+(45-im.width)//2*K,y),up(im,K)); d.text((x+40,15),n,fill=OL,font=fnt(30))
d.line([0,60+88*K,C.width,60+88*K],fill=(220,30,30),width=2); d.line([0,60+K,C.width,60+K],fill=(220,30,30),width=2)
C.save('kit/molde_comparacao.png')
# --- variantes permitidas (silhueta livre, estilo igual) ---
def var(kind):
    m=Image.new('RGB',(61,104),WH); d=ImageDraw.Draw(m); o=8; oy=14
    R=lambda b,c: d.rectangle([b[0]+o,b[1]+oy,b[2]+o,b[3]+oy],fill=c,outline=OL)
    E=lambda b,c: d.ellipse([b[0]+o,b[1]+oy,b[2]+o,b[3]+oy],fill=c,outline=OL)
    skin=(233,165,126); sh=(196,126,92)
    R((10,64,19,82),skin); R((24,64,33,82),skin); R((9,82,21,86),(60,60,70)); R((23,82,35,86),(60,60,70))
    shirt={'barriga':(220,60,60),'cabelo':(250,200,40),'bone':(40,40,48)}[kind]
    R((8,47,35,65),(40,70,140))
    if kind=='barriga': E((2,26,42,62),shirt); d.arc([12+o,40+oy,34+o,60+oy],20,160,fill=(170,40,40))
    else: d.polygon([(8+o,24+oy),(35+o,24+oy),(36+o,48+oy),(7+o,48+oy)],fill=shirt,outline=OL)
    ax=(-3,40) if kind=='barriga' else (1,36)
    R((ax[0],26,ax[0]+6,55),skin); R((ax[1],26,ax[1]+6,55),skin)
    R((18,19,27,25),skin)
    if kind=='cabelo': E((4,-14,42,16),(40,24,16))
    E((12,0,34,23),skin); R((34,10,36,13),skin)
    d.point((30+o,9+oy),fill=OL); d.point((31+o,9+oy),fill=OL)
    d.line([25+o,18+oy,32+o,18+oy],fill=sh)
    if kind=='cabelo': d.chord([10+o,-4+oy,36+o,12+oy],180,360,fill=(40,24,16),outline=OL)
    if kind=='barriga': d.rectangle([20+o,14+oy,34+o,23+oy],fill=(60,40,30))  # barba
    if kind=='bone':
        d.chord([11+o,-2+oy,35+o,14+oy],180,360,fill=(200,30,30),outline=OL); R((30,4,42,7),(200,30,30))
        d.arc([14+o,20+oy,32+o,40+oy],20,160,fill=(240,200,40),width=2)
    return m
V=[('MOLDE',m)]+[(n,var(k)) for n,k in (('BARRIGA',"barriga"),('CABELÃO',"cabelo"),('BONÉ+CORRENTE',"bone"))]
K=6; C=Image.new('RGB',(4*61*K+5*30,104*K+200),WH); d=ImageDraw.Draw(C)
for i,(n,im) in enumerate(V):
    x=30+i*(61*K+30); y=80+(104-im.height)*K if n!='MOLDE' else 80+14*K-K; C.paste(up(im,K),(x+((61-im.width)//2)*K,y)); d.text((x+30,20),n,fill=OL,font=fnt(30))
gy=80+(14+87)*K; d.line([0,gy,C.width,gy],fill=(220,30,30),width=2); d.line([0,80+13*K,C.width,80+13*K],fill=(220,30,30),width=2)
d.text((30,C.height-80),"Silhueta pode mudar (barriga, cabelo, chapéu, acessórios). O ESTILO não: grade, contorno preto 1px,\n2-3 tons por cor, cabeça grande, pés na mesma linha, virado p/ direita, braços para baixo, fundo branco.",fill=OL,font=fnt(20))
C.save('kit/variacoes_permitidas.png')
