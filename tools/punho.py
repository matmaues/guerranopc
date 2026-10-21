# Punho fechado detalhado (aponta p/ direita): nós dos dedos, dedos dobrados com linhas, polegar por cima.
# Mesma escala de pixel do Maués. Contorno externo preto; linhas internas em tom escuro de pele (não são "contorno").
from PIL import Image
OL=(26,16,16,255)
FIST=[ # O=contorno H=luz S=pele D=sombra L=linha entre dedos (sombra forte) T=polegar
"..OOOOOO..",
".OSSHHSHO.",
"OSSSSHHHSO",
"OSSSSLLLDO",
"OSSSSHHSSO",
"OSLLLLLLDO",
"OSTTTTTSDO",
".OSDDDDDO.",
"..OOOOOO..",
]
def ramp_maues():
    M=Image.open('assets/maues.png').convert('RGBA'); a=M.load(); c={}
    for y in range(M.height):
        for x in range(M.width):
            p=a[x,y]
            if p[3] and p[0]>p[2]+40 and p[0]>120: c[p[:3]]=c.get(p[:3],0)+1
    top=sorted([k for k,v in sorted(c.items(),key=lambda kv:-kv[1])[:5]],key=lambda p:0.3*p[0]+0.59*p[1]+0.11*p[2])
    return top
def fist(ramp):
    """ramp: tons de pele do escuro ao claro"""
    lo=ramp[0]; mid=ramp[len(ramp)//2]; hi=ramp[-1]
    dd=tuple(max(0,int(v*0.62)) for v in lo)        # linha entre dedos (escura, mas não preta)
    col={'O':OL,'H':hi+(255,),'S':mid+(255,),'D':lo+(255,),'L':dd+(255,),'T':tuple(min(255,int(v*1.0)) for v in hi)+(255,)}
    im=Image.new('RGBA',(len(FIST[0]),len(FIST))); p=im.load()
    for y,r in enumerate(FIST):
        for x,ch in enumerate(r):
            if ch!='.': p[x,y]=col[ch]
    return im
