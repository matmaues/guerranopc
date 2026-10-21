# Braços do João Pedro e do Milk = os MESMOS pixels dos braços do Maués (assets/maues.png e maues_punch.png),
# só recoloridos: pele do Maués -> pele do personagem; manga azul -> manga do personagem (camuflado / roxo).
# Roda no fim de gerar_joao.py / gerar_milk.py. Versão anterior (braços feitos à mão): git tag bracos-v2.
from PIL import Image
OL=(26,16,16,255)
M=Image.open('assets/maues.png').convert('RGBA'); MP=Image.open('assets/maues_punch.png').convert('RGBA')
def lum(p): return 0.3*p[0]+0.59*p[1]+0.11*p[2]
def dark(p): return p[3] and sum(p[:3])<=110
def is_skin(p): return p[3] and p[0]>p[2]+40 and p[0]>120
def is_blue(p): return p[3] and p[2]>p[0]+40
def cut(im,box,keep):
    """recorta box mantendo só os pixels aceitos por keep(p,x,y)"""
    o=Image.new('RGBA',(box[2]-box[0],box[3]-box[1])); a=im.load(); b=o.load()
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            p=a[x,y]
            if p[3] and keep(p,x,y): b[x-box[0],y-box[1]]=p
    return o
# peças do Maués (coordenadas no sprite dele)
BACK =cut(M,(0,35,27,52),lambda p,x,y: (not is_blue(p) or x<9) and not (p[0]>235 and p[2]>235))               # braço dobrado na barriga (com a mão/relógio)
FRONT=cut(M,(33,37,43,66),lambda p,x,y: (not is_blue(p) or x>=36) and not (p[0]>200 and p[2]>200))      # braço pendurado
PUNCH=cut(MP,(33,24,67,38),lambda p,x,y: x>=40 or is_blue(p) and x>=36 or dark(p) and x>=35)           # manga + braço esticado
def ramp(samples):
    s=sorted(samples,key=lum); return s
def mapper(skin_t, sleeve_tex, hand_test):
    ms=sorted({p[:3] for im in (BACK,FRONT,PUNCH) for p in im.get_flattened_data() if is_skin(p)},key=lum)
    mb=sorted({p[:3] for im in (PUNCH,) for p in im.get_flattened_data() if is_blue(p)},key=lum)
    def q(v,src,dst):
        i=[lum(c) for c in src].index(lum(v)) if v in src else 0
        return dst[min(len(dst)-1,int(i/max(1,len(src)-1)*(len(dst)-1)+.5))]
    def f(im,name):
        o=im.copy(); a=o.load()
        for y in range(o.height):
            for x in range(o.width):
                p=a[x,y]
                if not p[3]: continue
                if dark(p): a[x,y]=OL
                elif is_skin(p):
                    if sleeve_tex and not hand_test(name,x,y,o): a[x,y]=sleeve_tex(x,y,lum(p))   # manga comprida
                    else: a[x,y]=q(p[:3],ms,skin_t)+(255,)
                elif is_blue(p): a[x,y]=sleeve_tex(x,y,lum(p)) if sleeve_tex else p
        return o
    return f
def skin_ramp(S,box):
    a=S.load(); c={}
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            p=a[x,y]
            if is_skin(p): c[p[:3]]=c.get(p[:3],0)+1
    cs=[k for k,v in sorted(c.items(),key=lambda kv:-kv[1])[:6]]
    return sorted(cs,key=lum)
def tex_from(S,box,shift=0):
    t=S.crop(box); a=t.load(); W,H=t.size
    cols=sorted({a[x,y][:3] for x in range(W) for y in range(H) if a[x,y][3] and not dark(a[x,y])},key=lum)
    def f(x,y,l):
        p=a[(x+shift)%W,y%H]
        if not p[3] or dark(p): p=cols[len(cols)//2]+(255,)
        return p[:3]+(255,)
    return f
def solid_ramp(S,box):
    a=S.load(); cs={}
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            p=a[x,y]
            if p[3] and not dark(p) and not (p[0]>220 and p[1]>220): cs[p[:3]]=cs.get(p[:3],0)+1
    r=sorted([k for k,v in sorted(cs.items(),key=lambda kv:-kv[1])[:4]],key=lum)
    lo,hi=60,140
    def f(x,y,l):
        i=int(max(0,min(.999,(l-lo)/(hi-lo)))*len(r)); return r[i]+(255,)
    return f
def outline(im):
    a=im.load(); o=im.copy(); b=o.load()
    for y in range(im.height):
        for x in range(im.width):
            if a[x,y][3]==0 and any(0<=x+i<im.width and 0<=y+j<im.height and a[x+i,y+j][3] and not dark(a[x+i,y+j]) for i,j in((1,0),(-1,0),(0,1),(0,-1))): b[x,y]=OL
    return o
CFG={
 # sy/cl/cr: onde o braço original sai do corpo; bk/fr/pu = posição (x,y) das peças do Maués no corpo
 'milk':dict(ref='assets/milk_ref_normalizado.png',HIP=75,PADR=34,PADT=16,sy=46,hb=73,cl=10,cr=37,shoulder=33,face=(14,8,34,30),
             sleeve=('solid',(14,36,30,44)),bk=(0,45),fr=(33,44),pu=(32,33)),
 'joao':dict(ref='assets/joao_ref_normalizado.png',HIP=60,PADR=34,PADT=14,sy=34,hb=63,cl=10,cr=35,shoulder=32,face=(14,8,30,28),
             sleeve=('tex',(2,38,10,50)),bk=(0,35),fr=(32,35),pu=(31,31)),
}
def hand_joao(name,x,y,im):
    if name=='back': return x>=12          # mão (joinha + relógio) fica pele
    if name=='front': return y>=im.height-9
    return x>=im.width-9                   # punho do soco
def build(n):
    c=CFG[n]; S=Image.open(c['ref']).convert('RGBA'); W=S.width; HIP=c['HIP']; sy,hb,cl,cr=c['sy'],c['hb'],c['cl'],c['cr']
    st=c['sleeve']; tex=tex_from(S,st[1]) if st[0]=='tex' else solid_ramp(S,st[1])
    rec=mapper(skin_ramp(S,c['face']), tex, hand_joao) if n=='joao' else mapper(skin_ramp(S,c['face']), tex, lambda *a: True)
    back,front,punch=rec(BACK,'back'),rec(FRONT,'front'),rec(PUNCH,'punch')
    up=S.crop((0,0,W,HIP+2)); body=up.copy(); q=body.load()
    def clear(x0,x1,y0,y1,soft=True):
        for y in range(y0,min(y1,HIP+2)):
            for x in range(x0,x1):
                if not soft or y<hb-4 or q[x,y][0]>q[x,y][1]+25: q[x,y]=(0,0,0,0)
    clear(0,cl,sy,hb); clear(cr,W,sy,hb)                       # tira os braços originais (pendurados)
    for _ in range(2):                                         # contornos soltos da mão antiga
        for y in range(sy,HIP+2):
            for x in list(range(0,cl+1))+list(range(cr-1,W)):
                if dark(q[x,y]) and not any(0<=x+i<W and 0<=y+j<HIP+2 and q[x+i,y+j][3] and not dark(q[x+i,y+j]) for i,j in((1,0),(-1,0),(0,1),(0,-1))): q[x,y]=(0,0,0,0)
    for y in range(sy,HIP+2):                                  # restos de pele das mãos antigas
        for x in list(range(0,cl+3))+list(range(cr-3,W)):
            if q[x,y][3] and q[x,y][0]>q[x,y][1]+25: q[x,y]=(0,0,0,0)
    for _ in range(2):
        for y in range(sy,HIP+2):
            for x in list(range(0,cl+3))+list(range(cr-3,W)):
                if dark(q[x,y]) and not any(0<=x+i<W and 0<=y+j<HIP+2 and q[x+i,y+j][3] and not dark(q[x+i,y+j]) for i,j in((1,0),(-1,0),(0,1),(0,-1))): q[x,y]=(0,0,0,0)
    punchbody=body.copy(); pq=punchbody.load()
    for y in range(c['shoulder'],sy):                          # no soco a manga da frente vai junto com o braço
        for x in range(cr-1,W): pq[x,y]=(0,0,0,0)
    PADR,PADT=c['PADR'],c['PADT']
    def make(bd,parts):
        cv=Image.new('RGBA',(W+PADR,HIP+2+PADT)); cv.alpha_composite(bd,(0,PADT))
        for im,(x,y) in parts: cv.alpha_composite(im,(x,y+PADT))
        return outline(cv)
    bk=c['bk']; fr=c['fr']; pu=c['pu']
    up_arm=punch.transpose(Image.ROTATE_90)                    # gancho: o mesmo braço do soco apontando p/ cima
    poses={'guard':make(body,[(back,bk),(front,fr)]),
           'block':make(body,[(back,(bk[0],bk[1]-3)),(front,fr)]),
           'punch':make(punchbody,[(back,bk),(punch,pu)]),
           'upper':make(punchbody,[(back,bk),(up_arm,(pu[0]+2,pu[1]+punch.height-up_arm.height+4))])}
    for k,im in poses.items(): im.save(f'assets/{n}/{k}.png')
for n in CFG: build(n)
print('ok')
