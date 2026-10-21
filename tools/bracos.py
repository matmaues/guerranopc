# Braços no estilo do Maués para João Pedro e Milk (roda depois de gerar_joao.py / gerar_milk.py).
# Igual ao Maués: braço da frente pendurado ao lado do corpo na guarda (pixels originais),
# braço de trás dobrado no cotovelo com o antebraço na frente da barriga,
# soco = braço INTEIRO (manga + braço + punho) girado a partir do ombro, como maues_punch.png.
from PIL import Image
OL=(26,16,16,255)
CFG={ # sy=ombro, hb=fim da mão, cl/cr = colunas de corte (braço esq x<cl, dir x>=cr), el=linha do cotovelo
 'milk':dict(ref='assets/milk_ref_normalizado.png',HIP=75,PADR=34,PADT=16,sy=46,hb=73,cl=10,cr=37,el=57,px=37,py=37,uy=50,tk=9,bl=1.35),  # manga curta fica no tronco; braço sai da barra da manga
 'joao':dict(ref='assets/joao_ref_normalizado.png',HIP=60,PADR=34,PADT=14,sy=36,hb=63,cl=10,cr=35,el=50,px=34,py=34,uy=42,tk=8,bl=1.35),  # manga comprida gira junto
}
def dark(p): return p[3] and sum(p[:3])<=110
def outline(im):
    a=im.load(); o=im.copy(); b=o.load()
    for y in range(im.height):
        for x in range(im.width):
            if a[x,y][3]==0 and any(0<=x+i<im.width and 0<=y+j<im.height and a[x+i,y+j][3] and sum(a[x+i,y+j][:3])>110 for i,j in((1,0),(-1,0),(0,1),(0,-1))): b[x,y]=OL
    return o
def strip_ol(im):
    im=im.copy(); a=im.load()
    for y in range(im.height):
        for x in range(im.width):
            if dark(a[x,y]): a[x,y]=(0,0,0,0)
    return im
def build(n):
    c=CFG[n]; S=Image.open(c['ref']).convert('RGBA'); W=S.width; HIP=c['HIP']; sy,hb,cl,cr,el=c['sy'],c['hb'],c['cl'],c['cr'],c['el']
    up=S.crop((0,0,W,HIP+2)); a=up.load()
    def take(x0,x1):
        im=Image.new('RGBA',(x1-x0,hb-sy)); p=im.load()
        for y in range(sy,min(hb,HIP+2)):
            for x in range(x0,x1):
                if a[x,y][3] and (y<hb-4 or a[x,y][0]>a[x,y][1]+25): p[x-x0,y-sy]=a[x,y]
        return im
    L=take(0,cl); R=take(cr,W)
    body=up.copy(); q=body.load()
    for y in range(sy,HIP+2):
        for x in list(range(0,cl))+list(range(cr,W)):
            if y<hb-4 or (y<hb and q[x,y][0]>q[x,y][1]+25): q[x,y]=(0,0,0,0)   # perto do quadril só tira pele (mão)
    # tira contornos soltos que sobraram da mão (o contorno é refeito depois)
    for _ in range(2):
        for y in range(sy,HIP+2):
            for x in list(range(0,cl+1))+list(range(cr-1,W)):
                if dark(q[x,y]) and not any(0<=x+i<W and 0<=y+j<HIP+2 and q[x+i,y+j][3] and not dark(q[x+i,y+j]) for i,j in((1,0),(-1,0),(0,1),(0,-1))): q[x,y]=(0,0,0,0)
    # fecha o tronco onde os braços saíam
    for y in range(sy,HIP+2):
        if q[cl,y][3] and not dark(q[cl,y]): q[cl,y]=OL
        if q[cr-1,y][3] and not dark(q[cr-1,y]): q[cr-1,y]=OL
    PADR,PADT=c['PADR'],c['PADT']
    def canvas(): return Image.new('RGBA',(W+PADR,HIP+2+PADT))
    def put(cv,im,x,y): cv.alpha_composite(im,(x,y+PADT))
    def arm(parts):
        """junta pedaços sem contorno interno e contorna o conjunto (ombro/cotovelo fechados)"""
        Lr=canvas()
        for im,x,y in parts: put(Lr,strip_ol(im),x,y)
        return outline(Lr)
    e=el-sy
    # braço de trás (esquerda da imagem) dobrado: parte de cima original, antebraço girado p/ frente
    def bb(im):  # recorta à caixa do conteúdo
        b=im.getbbox(); return im.crop(b) if b else im
    def thick(im,w,h): return strip_ol(bb(im)).resize((w,h),Image.NEAREST)   # engrossa/alonga sem borrar o pixel
    bl=c['bl']
    Lup0=bb(strip_ol(L.crop((0,0,cl,e+2)))); Lup=thick(Lup0,Lup0.width,round(Lup0.height*bl))     # braço mais comprido
    Lfa0=bb(strip_ol(L.crop((0,e,cl,hb-sy)))); Lfa=thick(Lfa0,Lfa0.width+1,round(Lfa0.height*1.45)).transpose(Image.ROTATE_90)  # antebraço cruza mais
    ex=L.getbbox()[0]
    def back(dy=0): ey=sy+Lup.height; return arm([(Lup,ex+1,sy),(Lfa,ex+2,ey-Lfa.height+2+dy)])
    hang=arm([(R,cr,sy)])
    R0=bb(strip_ol(R)); RT=thick(R0,c['tk'],round(R0.height*1.15))   # braço de soco grosso (manga+braço+punho)                                   # braço da frente pendurado (como o Maués)
    def fwd(dy=0): return arm([(RT.transpose(Image.ROTATE_90),c['px'],c['py']+dy)])      # soco: braço inteiro na horizontal
    upr=arm([(RT.transpose(Image.ROTATE_180),cr-2,c['uy']-RT.height)])                    # gancho: braço p/ cima
    poses={'guard':[back(-3),hang],'block':[back(-6),hang],'punch':[back(-3),fwd()],'upper':[back(-3),upr]}
    for k,ls in poses.items():
        cv=canvas(); put(cv,body,0,0)
        for l in ls: cv.alpha_composite(l)
        outline(cv).save(f'assets/{n}/{k}.png')
for n in CFG: build(n)
print('ok')
