# Gera screens/resumo_jogo.png (cartaz-resumo) com dados reais de js/characters.js
import json, subprocess
from PIL import Image, ImageDraw, ImageFont
js=open('js/characters.js',encoding='utf-8').read()+';process.stdout.write(JSON.stringify(CHARACTERS))'
C={c['name']:c for c in json.loads(subprocess.run(['node','-e','const window={};'+js],capture_output=True,text=True,check=True).stdout)}
PX='/usr/share/fonts/truetype/sand-box/google/Pixelify Sans/PixelifySans-VariableFont_wght.ttf'
F=lambda s: ImageFont.truetype(PX,s)
W,H=1280,1720; P=Image.new('RGB',(W,H),(12,12,36)); d=ImageDraw.Draw(P)
for y in range(0,H,6): d.line([0,y,W,y],fill=(17,17,58))
def T(x,y,s,size,col,anchor='la',sh=True):
    if sh: d.text((x+3,y+3),s,font=F(size),fill=(0,0,0),anchor=anchor)
    d.text((x,y),s,font=F(size),fill=col,anchor=anchor)
up=lambda im,k: im.resize((im.width*k,im.height*k),Image.NEAREST)
# título: GUERRA e P.C em destaque, "no" pequeno
w1=d.textlength('GUERRA',font=F(120)); w2=d.textlength(' no ',font=F(44)); w3=d.textlength('P.C',font=F(120)); x=(W-(w1+w2+w3))//2
T(x,40,'GUERRA',120,(255,210,63)); T(x+w1,110,' no ',44,(220,220,255)); T(x+w1+w2,40,'P.C',120,(255,59,59))
T(W//2,190,'jogo de luta 8-bit no navegador  •  Arcade • Luta Livre • Versus',26,(140,200,255),'ma',False)
OL=(26,16,16)
def maues():
    im=Image.open('assets/maues.png').convert('RGBA'); sk=(233,165,126); c=Image.new('RGBA',(45,90)); dd=ImageDraw.Draw(c)
    R=lambda x,y,w,h,col: dd.rectangle([x,y,x+w-1,y+h-1],fill=col)
    for lx in (10,25):
        L=16; ly=66; R(lx,ly,10,L-5,OL);R(lx+1,ly,8,L-5,sk);R(lx+1,ly+L-6,8,6,OL);R(lx+2,ly+L-6,6,6,sk)
        fy=ly+L;R(lx+1,fy-1,12,5,OL);R(lx+2,fy,10,3,sk);R(lx,fy+3,15,3,OL);R(lx+1,fy+3,13,2,(255,255,255))
    c.alpha_composite(im,(1,0)); return c
def granada():
    c=Image.new('RGBA',(14,16)); dd=ImageDraw.Draw(c)
    dd.rectangle([2,5,11,14],fill=(17,17,17)); dd.rectangle([3,6,10,13],fill=(74,85,48)); dd.rectangle([4,7,6,9],fill=(107,110,69))
    dd.rectangle([6,2,8,4],fill=(153,153,153)); dd.rectangle([8,0,9,1],fill=(255,200,0)); return c
chars=[('Maués',maues(),Image.open('assets/maues_taco.png').convert('RGBA'),2,'rápido e ágil, golpes mais leves'),
       ('João Pedro',Image.open('assets/joao/win.png').convert('RGBA'),granada(),4,'lento, forte e resistente'),
       ('Milk',Image.open('assets/milk/win.png').convert('RGBA'),Image.open('assets/milk_pituxo.png').convert('RGBA'),4,'tanque de meio-campo')]
y0=250; RH=330
for i,(n,spr,proj,pk,arq) in enumerate(chars):
    c=C[n]; y=y0+i*RH; col=c['color']
    d.rectangle([30,y,W-30,y+RH-20],fill=(20,20,50),outline=(255,210,63),width=3)
    alt=c.get('alturaReal'); hpx=max(80,min(96,round(88+(alt-1.8)/0.05*3))) if alt else 88
    k=3; s=spr.resize((round(spr.width*hpx/c.get('alturaArte',spr.height))*k, round(spr.height*hpx/c.get('alturaArte',spr.height))*k),Image.NEAREST)
    d.rectangle([50,y+20,330,y+RH-40],fill=tuple(int(col[j:j+2],16)//2 for j in (1,3,5)))
    P.paste(s,(190-s.width//2,y+RH-45-s.height),s)
    T(360,y+20,n.upper(),54,(255,255,255)); T(360,y+82,f"{alt:.2f} m".replace('.',',')+'  •  '+arq,26,(255,210,63),sh=False)
    for j,(lab,key) in enumerate((('VELOCIDADE','speed'),('FORÇA','power'),('VIDA','health'))):
        yy=y+130+j*36; T(360,yy,lab,24,(200,200,220),sh=False); v=c['stats'][key]
        for b in range(10): d.rectangle([540+b*26,yy+4,540+b*26+20,yy+24],fill=(255,210,63) if b<v else (50,50,80))
        T(820,yy,str(v),24,(255,255,255),sh=False)
    sp=c['specials']; T(360,y+240,'ESPECIAIS:',22,(140,200,255),sh=False)
    T(500,y+240,f"{sp['fireball']} (projétil)  •  {sp['dp']}",22,(255,255,255),sh=False)
    T(500,y+270,f"{sp['spin']}  •  {sp['super']} (super)",22,(255,255,255),sh=False)
    pr=up(proj,pk); d.rectangle([980,y+30,W-60,y+220],fill=(10,10,30),outline=(80,80,140))
    P.paste(pr,(1110-pr.width//2,y+125-pr.height//2),pr); T(1110,y+192,sp['fireball'],24,(255,210,63),'ma',False)
yb=y0+3*RH+10
T(W//2,yb,'CENÁRIOS',44,(255,210,63),'ma')
from_json=[('CSM Nova Suíça','assets/stage_csm_nova_suica.png'),('Clube Chalézinho','assets/stage_clube_chalezinho.png'),('Monte Pascoal','assets/stage_monte_pascoal.png')]
for i,(n,pth) in enumerate(from_json):
    im=Image.open(pth).convert('RGB').resize((384,216),Image.NEAREST); x=34+i*412; d.rectangle([x-6,yb+64,x+390,yb+286],fill=(255,210,63)); P.paste(im,(x,yb+70))
    T(x+192,yb+298,n,28,(255,255,255),'ma')
T(W//2,H-50,'genéricos: Lutador 3 • Lutador 4 • Chefão (último do Arcade)',22,(150,150,180),'ma',False)
P.save('screens/resumo_jogo.png'); print(P.size)
