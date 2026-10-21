#!/usr/bin/env python3
"""Normalizador de sprites — GUERRA no P.C
Uso:  python3 tools/normalizar.py ENTRADA.png assets/NOME.png [--altura 1.80] [--cores 24] [--topo-extra 0.25]
  1. remove o fundo (branco/cor uniforme das bordas, por flood-fill)
  2. recorta no personagem
  3. detecta a grade de pixel-art (se a imagem veio ampliada) e reduz para 1 px = 1 pixel de arte
  4. escala pela ALTURA (pés até o topo da cabeça) para --altura px; cabelo alto/chapéu
     acima da cabeça pode passar disso (até --topo-extra, 25% por padrão). A largura é livre.
  5. limpa a paleta (no máx. --cores cores, sem semitons de antialias)
  6. garante contorno preto de 1 px em volta da silhueta
Saída: PNG transparente pronto para `sprite:` com `fullSprite:true` em js/characters.js.
"""
import sys, argparse
from collections import deque
from PIL import Image
OL=(26,16,16,255)
def tira_fundo(im,tol=40):
    im=im.convert('RGBA'); W,H=im.size; p=im.load()
    bg=p[0,0]; seen=set(); q=deque([(x,y) for x in range(W) for y in (0,H-1)]+[(x,y) for y in range(H) for x in (0,W-1)])
    near=lambda c: sum(abs(c[i]-bg[i]) for i in range(3))<tol or c[3]<20
    while q:
        x,y=q.popleft()
        if (x,y) in seen or not(0<=x<W and 0<=y<H): continue
        seen.add((x,y))
        if not near(p[x,y]): continue
        p[x,y]=(0,0,0,0); q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
    return im.crop(im.getbbox())
def grade(img):
    """detecta a grade de pixel-art ampliada (período fracionário, ex.: 11.38) pela coerência de fase
    das bordas. Retorna (k, fase_x, fase_y) ou None se a imagem já estiver em 1x."""
    import numpy as np
    a=np.array(img.convert('RGBA')).astype(float); L=a[...,:3].mean(2)*(a[...,3]>127)
    xs=np.nonzero(np.abs(np.diff(L,axis=1))>40)[1]+1.0; ys=np.nonzero(np.abs(np.diff(L,axis=0))>40)[0]+1.0
    if len(xs)<50 or len(ys)<50: return None
    best=None
    for k in np.arange(3,30,0.02):
        zx=np.exp(2j*np.pi*xs/k).mean(); zy=np.exp(2j*np.pi*ys/k).mean(); sc=min(abs(zx),abs(zy))
        if best is None or sc>best[0]+0.02 or (sc>0.6 and sc>=best[0]-0.02 and k>best[1]*1.5): best=(sc,k,zx,zy)
    sc,k,zx,zy=best
    if sc<0.6: return None
    return k,(np.angle(zx)/(2*np.pi)*k)%k,(np.angle(zy)/(2*np.pi)*k)%k
def nativo(img,k,fx,fy):
    """amostra a cor dominante do miolo de cada célula da grade -> 1 px = 1 pixel de arte"""
    import numpy as np
    a=np.array(img.convert('RGBA')); H,W=a.shape[:2]; nx=int((W-fx)//k); ny=int((H-fy)//k); out=np.zeros((ny,nx,4),np.uint8); r=max(1,int(k*0.25))
    for j in range(ny):
        for i in range(nx):
            cx,cy=int(fx+(i+0.5)*k),int(fy+(j+0.5)*k); c=a[cy-r:cy+r+1,cx-r:cx+r+1].reshape(-1,4)
            if (c[:,3]>127).mean()<0.5: continue
            out[j,i,:3]=np.median(c[c[:,3]>127][:,:3],0); out[j,i,3]=255
    o=Image.fromarray(out,'RGBA'); return o.crop(o.getbbox())
def amostra(im,esc):
    """reduz uma imagem grande tomando a cor MAIS COMUM de cada célula (pixels limpos, sem mistura)"""
    import numpy as np
    a=np.array(im); H,W=a.shape[:2]; nh,nw=max(1,round(H*esc)),max(1,round(W*esc)); out=np.zeros((nh,nw,4),np.uint8)
    for j in range(nh):
        y0,y1=int(j/esc),max(int(j/esc)+1,int((j+1)/esc))
        for i in range(nw):
            x0,x1=int(i/esc),max(int(i/esc)+1,int((i+1)/esc))
            c=a[y0:y1,x0:x1].reshape(-1,4); c=c[(c.shape[0]//4):] if False else c
            cy,cx=(y1-y0)//4,(x1-x0)//4; c=a[y0+cy:y1-cy or y1,x0+cx:x1-cx or x1].reshape(-1,4)   # miolo da célula
            if (c[:,3]>127).mean()<0.5: continue
            c=c[c[:,3]>127]; q=(c[:,:3]//12).astype(np.int32); k=q[:,0]*10000+q[:,1]*100+q[:,2]
            v,n=np.unique(k,return_counts=True); sel=c[k==v[n.argmax()]][:,:3]
            out[j,i,:3]=np.median(sel,0); out[j,i,3]=255
    return Image.fromarray(out,'RGBA')
def contorno(im):
    W,H=im.size; o=Image.new('RGBA',(W+2,H+2)); o.paste(im,(1,1)); a=o.load(); b=o.copy(); c=b.load()
    for y in range(H+2):
        for x in range(W+2):
            if a[x,y][3]==0 and any(0<=x+i<W+2 and 0<=y+j<H+2 and a[x+i,y+j][3] and sum(a[x+i,y+j][:3])>200 for i,j in((1,0),(-1,0),(0,1),(0,-1))): c[x,y]=OL  # só onde a borda não é escura
    return b.crop(b.getbbox())
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('entrada'); ap.add_argument('saida')
    ap.add_argument('--altura',type=float,default=1.80,help='altura REAL em metros (ex.: 1.78) ou em px se > 3. 1,80 m = 88 px, ±3 px a cada 5 cm, limite 80–96'); ap.add_argument('--cores',type=int,default=24)
    ap.add_argument('--topo-extra',type=float,default=0.25,help='fração da altura que cabelo/chapéu pode ultrapassar')
    ap.add_argument('--cabeca',type=int,default=0,help='(opcional) linha do topo da cabeça na imagem já recortada, ignorando cabelo/chapéu')
    ap.add_argument('--tolerancia',type=float,default=0.2,help='se a grade nativa der altura dentro de ±20%% do alvo, mantém 1:1 (pixels originais)')
    a=ap.parse_args()
    if a.altura<=3: a.altura=max(80,min(96,round(88+(a.altura-1.80)/0.05*3)))
    a.altura=int(a.altura)
    im=tira_fundo(Image.open(a.entrada)); G=grade(im); k=1
    if G: k=G[0]; im=nativo(im,*G)
    corpo=im.height-(round(a.cabeca/k) if a.cabeca else 0)       # pés -> topo da cabeça
    esc=a.altura/corpo
    if G and abs(esc-1)<=a.tolerancia: esc=1   # mesma densidade do Maués: não reamostra
    if im.height*esc>a.altura*(1+a.topo_extra): esc=a.altura*(1+a.topo_extra)/im.height
    im=im.resize((max(1,round(im.width*esc)),max(1,round(im.height*esc))),Image.NEAREST) if esc>=0.7 else amostra(im,esc)  # imagem grande: cor dominante de cada célula
    al=im.getchannel('A').point(lambda v:255 if v>=128 else 0)
    rgb=im.convert('RGB').quantize(colors=a.cores,method=Image.MEDIANCUT,dither=Image.NONE).convert('RGBA'); rgb.putalpha(al)
    out=contorno(rgb); out.save(a.saida)
    print(f"alvo {a.altura} px. Em js/characters.js use alturaReal (m) e alturaArte: {out.size[1]}  (o jogo escala p/ o alvo)")
    print(f"ok {a.saida}: {out.size[0]}x{out.size[1]} px (grade detectada {k:.2f}px, escala {esc:.2f})")
if __name__=='__main__': main()
