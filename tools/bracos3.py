# Braços v3 — João Pedro e Milk montados com as PEÇAS do braço do Maués (segmento de braço + manga do soco),
# sem esticar pixel, em ângulos de 90°; cada um com sua guarda. Punho fechado detalhado (tools/punho.py) para todos.
# Versões anteriores: tag bracos-v2 (tools/bracos.py) e commit dcd9aed (tools/bracos_maues.py).
import sys; sys.path.insert(0,'tools')
from PIL import Image
OL=(26,16,16,255)
BASE=Image.open('assets/src/maues_punch_base.png').convert('RGBA')
RM=[(188,120,84),(231,163,118),(246,192,152)]           # pele do Maués: sombra, base, luz
def lum(p): return 0.3*p[0]+0.59*p[1]+0.11*p[2]
def dark(p): return p[3] and sum(p[:3])<=110
def is_blue(p): return p[3] and p[2]>p[0]+40
def is_skin(p): return p[3] and p[0]>p[2]+40 and p[0]>90 and not dark(p)
FIST=[ # O=contorno H=luz S=pele D=sombra L=vinco entre dedos T=polegar (luz) por cima dos dedos
"..OOOOOO..",
".OSHHSHHO.",
"OSSSSSSSHO",
"OSSSLLLLSO",
"OSSSSHHSDO",
"OSLLLLLLDO",
"OSTTTTTLDO",
".ODDDDDDO.",
"..OOOOOO..",
]
def fist(r):  # r = [linha, sombra, base, luz]
    col={'O':OL,'L':r[0],'D':r[1],'S':r[2],'H':r[3],'T':r[3]}
    im=Image.new('RGBA',(10,9)); p=im.load()
    for y,row in enumerate(FIST):
        for x,ch in enumerate(row):
            if ch!='.': p[x,y]=col[ch]+(255,) if len(col[ch])==3 else col[ch]
    return im
def line_of(lo): return tuple(int(v*0.68) for v in lo)
def punch_arm_maues():
    """braço de soco do Maués com o punho novo; fica em assets/maues_punch.png"""
    mp=BASE.copy(); a=mp.load()
    for y in range(24,38):
        for x in range(57,mp.width): a[x,y]=(0,0,0,0)
    mp.alpha_composite(fist([line_of(RM[0])]+RM),(56,26))
    return mp
def seg(n):   # pedaço reto do braço do Maués (7 px de grossura com contorno), comprimento n
    return BASE.crop((44,28,44+n,35))
def arm_fwd(n, r):  # segmento + punho, apontando p/ direita
    s=seg(n); im=Image.new('RGBA',(n+9,9)); im.alpha_composite(s,(0,1)); im.alpha_composite(fist(r),(n-1,0)); return im
def DOWN(im): return im.transpose(Image.ROTATE_270)
def UP(im): return im.transpose(Image.ROTATE_90)
def outline(im):
    a=im.load(); o=im.copy(); b=o.load()
    for y in range(im.height):
        for x in range(im.width):
            if a[x,y][3]==0 and any(0<=x+i<im.width and 0<=y+j<im.height and a[x+i,y+j][3] and not dark(a[x+i,y+j]) for i,j in((1,0),(-1,0),(0,1),(0,-1))): b[x,y]=OL
    return o
def strip(im):
    im=im.copy(); a=im.load()
    for y in range(im.height):
        for x in range(im.width):
            if dark(a[x,y]): a[x,y]=(0,0,0,0)
    return im
def skin_ramp(S,box):
    a=S.load(); c={}
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            p=a[x,y]
            if is_skin(p): c[p[:3]]=c.get(p[:3],0)+1
    cs=sorted(c.items(),key=lambda kv:lum(kv[0])); tot=sum(v for _,v in cs); out=[]
    for qn in (0.12,0.5,0.9):
        acc=0
        for k,v in cs:
            acc+=v
            if acc>=qn*tot: out.append(k); break
    return [line_of(out[0])]+out
def tex_from(S,box):
    t=S.crop(box); a=t.load(); W,H=t.size
    cols=[a[x,y][:3] for x in range(W) for y in range(H) if a[x,y][3] and not dark(a[x,y])]
    def f(x,y,l): p=a[x%W,y%H]; return (p[:3] if p[3] and not dark(p) else cols[len(cols)//2])+(255,)
    return f
def solid_ramp(S,box):
    a=S.load(); cs={}
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            p=a[x,y]
            if p[3] and not dark(p) and not (p[0]>220 and p[1]>220): cs[p[:3]]=cs.get(p[:3],0)+1
    r=sorted([k for k,v in sorted(cs.items(),key=lambda kv:-kv[1])[:4]],key=lum)
    def f(x,y,l): i=int(max(0,min(.999,(l-60)/80))*len(r)); return r[i]+(255,)
    return f
ML=line_of(RM[0])
def recolor(im, R, sleeve, skin_to_sleeve=False):
    """pele do Maués -> pele R (por tom); azul -> manga; skin_to_sleeve: braço todo coberto pela manga"""
    o=im.copy(); a=o.load()
    for y in range(o.height):
        for x in range(o.width):
            p=a[x,y]
            if not p[3] or dark(p): continue
            if is_blue(p): a[x,y]=sleeve(x,y,lum(p)); continue
            if p[:3]==ML: a[x,y]=R[0]+(255,); continue
            i=min(range(3),key=lambda k:abs(lum(RM[k])-lum(p)))
            a[x,y]=sleeve(x,y,60+40*i) if skin_to_sleeve else R[i+1]+(255,)
    return o
CFG={
 'milk':dict(ref='assets/milk_ref_normalizado.png',HIP=75,PADR=34,PADT=16,sy=46,hb=73,cl=10,cr=37,shoulder=33,skinbox=(0,46,10,70),
             sleeve=('solid',(14,36,30,44)),pu=(32,33),cover=False,bk=(0,45),fr=(33,44)),
 'joao':dict(ref='assets/joao_ref_normalizado.png',HIP=60,PADR=34,PADT=14,sy=34,hb=63,cl=10,cr=35,shoulder=32,skinbox=(0,50,12,62),
             sleeve=('tex',(2,38,10,50)),pu=(31,31),cover=True,bk=(0,35),fr=(32,35),erase=[(9,53,13,56)]),
}
PUNCH_M=punch_arm_maues()
MA=Image.open('assets/maues.png').convert('RGBA')
def _cut(box,keep):
    o=Image.new('RGBA',(box[2]-box[0],box[3]-box[1])); a=MA.load(); b=o.load()
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            p=a[x,y]
            if p[3] and keep(p,x,y): b[x-box[0],y-box[1]]=p
    return o
# braço dobrado do Maués (linhas 35-52, x<15): ombro/braço/cotovelo/antebraço; a mão (x>=15) sai
GBACK=_cut((0,35,15,52),lambda p,x,y: (not is_blue(p) or x<9))
_a=GBACK.load()
for _y in range(GBACK.height):          # relógio (x 11-14) vira antebraço: copia a coluna x=9
    for _x in range(11,15):
        if 6<=_y<=12: _a[_x,_y]=_a[9,_y]
        elif _a[_x,_y][3] and not is_blue(_a[_x,_y]): _a[_x,_y]=(0,0,0,0)
GFRONT=_cut((33,37,43,66),lambda p,x,y: (not is_blue(p) or x>=36) and not (p[0]>200 and p[2]>200))
def build(n):
    c=CFG[n]; S=Image.open(c['ref']).convert('RGBA'); W=S.width; HIP=c['HIP']; sy,hb,cl,cr=c['sy'],c['hb'],c['cl'],c['cr']
    st=c['sleeve']; sl=tex_from(S,st[1]) if st[0]=='tex' else solid_ramp(S,st[1]); R=skin_ramp(S,c['skinbox']); cov=c['cover']
    F=fist(R)
    def SEG(k): return recolor(seg(k),R,sl,cov)
    def FWD(k):  # antebraço (manga até o pulso no João) + punho de pele
        s=SEG(k); im=Image.new('RGBA',(k+9,9)); im.alpha_composite(s,(0,1)); im.alpha_composite(F,(k-1,0)); return im
    # corpo sem os braços originais
    up=S.crop((0,0,W,HIP+2)); body=up.copy(); q=body.load()
    for y in range(sy,HIP+2):
        for x in list(range(0,cl))+list(range(cr,W)):
            if y<hb-4 or q[x,y][0]>q[x,y][1]+25: q[x,y]=(0,0,0,0)
        for x in list(range(0,cl+3))+list(range(cr-3,W)):
            if q[x,y][3] and q[x,y][0]>q[x,y][1]+25 and y>=hb-8: q[x,y]=(0,0,0,0)
    for _ in range(3):
        for y in range(sy,HIP+2):
            for x in list(range(0,cl+3))+list(range(cr-3,W)):
                if dark(q[x,y]) and not any(0<=x+i<W and 0<=y+j<HIP+2 and q[x+i,y+j][3] and not dark(q[x+i,y+j]) for i,j in((1,0),(-1,0),(0,1),(0,-1))): q[x,y]=(0,0,0,0)
    for x0,y0,x1,y1 in c.get('erase',[]):                       # sobra da mão antiga
        for y in range(y0,y1):
            for x in range(x0,x1): q[x,y]=(0,0,0,0)
        for y in range(y0-1,y1+1):                                 # refaz a borda do tronco
            for x in range(x1,x1+3):
                if q[x,y][3] and not dark(q[x,y]): q[x,y]=OL; break
    punchbody=body.copy(); pq=punchbody.load()
    for y in range(c['shoulder'],sy):
        for x in range(cr-1,W): pq[x,y]=(0,0,0,0)
    PADR,PADT=c['PADR'],c['PADT']; CW,CH=W+PADR,HIP+2+PADT
    def layer(parts):   # junta as peças de UM braço sem contorno interno e contorna o conjunto
        L=Image.new('RGBA',(CW,CH))
        for im,x,y in parts: L.alpha_composite(strip(im),(x,y+PADT))
        L=outline(L)
        # devolve os detalhes internos do punho (vincos ficam por serem tons de pele, não preto)
        return L
    # guarda = braço dobrado do Maués (mesmos pixels), sem a mão dele: relógio vira antebraço e entra o punho fechado
    bk,fr=c['bk'],c['fr']
    def guard_back():
        im=GBACK.copy(); a=im.load(); W2,H2=im.size; o=Image.new('RGBA',(W2+10,H2)); o.alpha_composite(F,(13,5)); b=o.load()
        for y in range(H2):
            for x in range(W2):
                p=a[x,y]
                if not p[3]: continue
                if cov and x<15 and not dark(p): b[x,y]=sl(x,y,90)
                else: b[x,y]=recolor(Image.new('RGBA',(1,1),p),R,sl,False).getpixel((0,0))
        return o
    def guard_front():
        im=recolor(GFRONT,R,sl,False)
        if cov:
            a=im.load()
            for y in range(im.height-9):
                for x in range(im.width):
                    if a[x,y][3] and not dark(a[x,y]): a[x,y]=sl(x,y,90)
        return im
    back=layer([(guard_back(),bk[0],bk[1])]); front=layer([(guard_front(),fr[0],fr[1])]); backP=back
    P=recolor(PUNCH_M.crop((33,24,67,38)),R,sl,False)
    if cov:   # João: braço do soco coberto de camuflado até o pulso
        a=P.load()
        for y in range(P.height):
            for x in range(P.width-10):
                p=a[x,y]
                if p[3] and not dark(p): a[x,y]=sl(x,y,90)
    # o punho do soco usa a pele do personagem (o recolor acima já fez); recorte só o braço (sem cabeça/corpo do Maués)
    pa=P.load()
    for y in range(P.height):
        for x in range(P.width):
            if x<3 and not dark(pa[x,y]) and not is_blue(pa[x,y]): pass
    P=Image.composite(P,Image.new('RGBA',P.size),cutmask(PUNCH_M.crop((33,24,67,38))))
    def make(bd,arms):
        cv=Image.new('RGBA',(CW,CH)); cv.alpha_composite(bd,(0,PADT))
        for L in arms: cv.alpha_composite(L)
        a=cv.load()                                   # tapa buraquinhos de 1 px entre braço e tronco
        for y in range(cv.height):
            for x in range(1,cv.width-1):
                if not a[x,y][3] and a[x-1,y][3] and a[x+1,y][3]: a[x,y]=OL
        return outline(cv)
    pu=c['pu']; upP=UP(P)
    def punch_layer(im,x,y): L=Image.new('RGBA',(CW,CH)); L.alpha_composite(im,(x,y+PADT)); return L
    poses={'guard':make(body,[back,front]),'block':make(body,[back,front]),
           'punch':make(punchbody,[backP,punch_layer(P,*pu)]),
           'upper':make(punchbody,[backP,punch_layer(upP,pu[0]+2,pu[1]+P.height-upP.height+4)])}
    for k,im in poses.items(): im.save(f'assets/{n}/{k}.png')
def cutmask(im):
    """máscara do braço de soco do Maués: manga (azul fora do tronco), braço e punho"""
    m=Image.new('L',im.size); a=im.load(); b=m.load()
    for y in range(im.height):
        for x in range(im.width):
            p=a[x,y]
            if p[3] and (x>=7 or is_blue(p) and x>=3 or dark(p) and x>=2): b[x,y]=255
    return m
PUNCH_M.save('assets/maues_punch.png')
for n in CFG: build(n)
print('ok')
