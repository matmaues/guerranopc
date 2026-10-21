#!/usr/bin/env python3
"""Planilha de personagens — GUERRA no P.C
  python3 tools/planilha.py exportar   -> cria/atualiza kit/personagens.xlsx com os dados atuais do jogo
  python3 tools/planilha.py importar   -> lê kit/personagens.xlsx e grava as mudanças em js/characters.js
                                          (bloco PLANILHA no fim do arquivo; o resto do arquivo não é mexido)
Precisa de: python3 com openpyxl (pip install openpyxl) e node (para ler o js/characters.js).
"""
import sys, json, subprocess, re, os
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation
RAIZ=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS=os.path.join(RAIZ,'js','characters.js'); FIG=os.path.join(RAIZ,'js','fighter.js'); XLSX=os.path.join(RAIZ,'kit','personagens.xlsx')
INI='// >>> PLANILHA (gerado por tools/planilha.py importar — edite a planilha, não aqui)'; FIM='// <<< PLANILHA'
ESP=[('fireball','Projétil','↓ ↘ → + soco'),('dp','Gancho anti-aéreo','→ ↓ ↘ + soco'),('spin','Furacão','↓ ↙ ← + chute'),('super','Super','↓↘→ ↓↘→ + soco (barra cheia)')]
PADRAO={'fireball':{'dmg':9,'s':12,'a':0,'r':26,'vel':1,'hits':1},'dp':{'dmg':13,'s':3,'a':12,'r':18,'vel':'','hits':1},
        'spin':{'dmg':5,'s':6,'a':30,'r':12,'vel':'','hits':3},'super':{'dmg':6,'s':2,'a':0,'r':30,'vel':1,'hits':5}}
def ler_jogo():
    code=open(JS,encoding='utf-8').read()+"\n;process.stdout.write(JSON.stringify(CHARACTERS))"
    out=subprocess.run(['node','-e','const window={};'+code],capture_output=True,text=True,check=True).stdout
    return json.loads(out)
def efetivo(c,k):
    d=dict(PADRAO[k]); o=(c.get('moves') or {}).get(k,{})
    if 'maxHits' in o: d['hits']=o['maxHits']
    d.update({x:o[x] for x in o if x!='maxHits'}); return d
H=Font(bold=True,color='FFFFFF'); HF=PatternFill('solid',fgColor='1F4FC4'); ED=PatternFill('solid',fgColor='FFF7CC')
def cab(ws,cols,w):
    ws.append(cols)
    for i,c in enumerate(ws[1]): c.font=H; c.fill=HF; c.alignment=Alignment(wrap_text=True,vertical='center'); ws.column_dimensions[c.column_letter].width=w[i]
    ws.row_dimensions[1].height=32; ws.freeze_panes='B2'
def exportar():
    C=ler_jogo(); wb=Workbook()
    ws=wb.active; ws.title='COMO USAR'
    for l in ["PLANILHA DE PERSONAGENS — GUERRA no P.C","",
      "1. Mude só as células AMARELAS (nas abas Personagens e Especiais).",
      "2. Não mude a coluna Nome (é ela que liga a linha ao personagem). Não apague linhas.",
      "3. Salve a planilha (formato .xlsx, mesmo nome, mesma pasta: kit/personagens.xlsx).",
      "4. No terminal, na pasta do jogo:  python3 tools/planilha.py importar",
      "   Frases de vitória: aba Frases (uma por linha; o jogo sorteia uma).",
      "5. Troque o número BUILD no index.html e publique. Pronto!","",
      "Dicas de balanceamento:",
      "- Velocidade, Força e Vida vão de 1 a 10. Vida real = 60 + Vida × 8. Dano real = dano base × (0,6 + Força × 0,09).",
      "- Personagens devem ser DIFERENTES (ex.: rápido e fraco x lento e forte). Mire em 45–55% de vitórias:",
      "  node tools/sim.js '<stats>' 200  (com o servidor local ligado) mede isso.",
      "- Frames: 60 frames = 1 segundo. Início menor = golpe sai mais rápido. Recuperação maior = mais fácil de punir.",
      "- Para voltar tudo ao padrão: python3 tools/planilha.py exportar (recria a planilha a partir do jogo)."]:
        ws.append([l])
    ws.column_dimensions['A'].width=110; ws['A1'].font=Font(bold=True,size=14)
    p=wb.create_sheet('Personagens')
    cab(p,['Nome','Altura (m)','Velocidade (1-10)','Força (1-10)','Vida (1-10)','Vida real (HP)','Pontos totais','Cor (#hex)','Cor destaque (#hex)','Projétil (desenho)'],[16,11,12,11,11,12,11,12,14,14])
    dv=DataValidation(type='whole',operator='between',formula1='1',formula2='10',showErrorMessage=True,error='Use um número de 1 a 10'); p.add_data_validation(dv)
    for i,c in enumerate(C,start=2):
        st=c['stats']; p.append([c['name'],c.get('alturaReal'),st['speed'],st['power'],st['health'],f'=60+E{i}*8',f'=C{i}+D{i}+E{i}',c.get('color'),c.get('accent'),c.get('projectile') or ''])
        for col in 'BCDEHI': p[f'{col}{i}'].fill=ED
        dv.add(f'C{i}:E{i}')
    e=wb.create_sheet('Especiais')
    cab(e,['Nome','Tipo','Comando','Nome do golpe','Dano base','Início (frames)','Ativo (frames)','Recuperação (frames)','Velocidade (×)','Acertos','Chave'],[16,18,26,24,10,11,11,13,12,9,10])
    r=2
    for c in C:
        for k,t,cmd in ESP:
            d=efetivo(c,k); e.append([c['name'],t,cmd,(c.get('specials') or {}).get(k,''),d['dmg'],d['s'],d['a'],d['r'],d['vel'],d['hits'],k])
            for col in 'DEFGHIJ': e[f'{col}{r}'].fill=ED
            r+=1
    e.column_dimensions['K'].hidden=True
    fr=wb.create_sheet('Frases')
    cab(fr,['Nome','Frase de vitória (uma por linha; o jogo sorteia uma)'],[16,90])
    r=2
    for c in C:
        for q in (c.get('quotes') or [c.get('quote','')]):
            fr.append([c['name'],q]); fr[f'B{r}'].fill=ED; r+=1
    fr.append([]); fr.append(['(para adicionar uma frase, insira uma linha com o Nome do personagem e a frase)'])
    b=wb.create_sheet('Golpes básicos (ref.)')
    cab(b,['Golpe','Dano','Início','Ativo','Recuperação','Altura'],[14,8,8,8,12,10])
    mv=subprocess.run(['node','-e',open(FIG,encoding='utf-8').read().split('const FREE')[0]+';process.stdout.write(JSON.stringify(MOVES))'],capture_output=True,text=True).stdout
    try:
        nomes={'lp':'Soco fraco','hp':'Soco forte','lk':'Chute fraco','hk':'Chute forte','clp':'Soco baixo','chp':'Gancho baixo','clk':'Rasteira fraca','chk':'Rasteira forte','jlp':'Soco no ar','jhp':'Soco forte no ar','jlk':'Chute no ar','jhk':'Chute forte no ar'}
        for k,v in json.loads(mv).items():
            if k in nomes: b.append([nomes[k],v.get('dmg'),v.get('s'),v.get('a'),v.get('r'),{'mid':'meio','low':'baixo','high':'alto'}.get(v.get('lvl'),'')])
    except Exception: pass
    b.append([]); b.append(['(só referência: iguais para todos; não são importados)'])
    wb.save(XLSX); print('ok:',XLSX)
def num(v,cast=float):
    if v in (None,''): return None
    return cast(str(v).replace(',','.'))
def importar():
    wb=load_workbook(XLSX,data_only=False); C={c['name']:c for c in ler_jogo()}; dados={}
    for row in wb['Personagens'].iter_rows(min_row=2,values_only=True):
        if not row or not row[0]: continue
        nome=str(row[0]).strip()
        if nome not in C: print('aviso: personagem desconhecido na planilha:',nome); continue
        d={'stats':{}}
        for i,k in ((2,'speed'),(3,'power'),(4,'health')):
            v=num(row[i],int)
            if v is None or not 1<=v<=10: sys.exit(f'erro: {nome}: {k} precisa ser de 1 a 10 (veio {row[i]})')
            d['stats'][k]=v
        if row[1] not in (None,''): d['alturaReal']=round(num(row[1]),2)
        for i,k in ((7,'color'),(8,'accent')):
            if row[i] and re.fullmatch(r'#[0-9a-fA-F]{6}',str(row[i]).strip()): d[k]=str(row[i]).strip()
            elif row[i]: sys.exit(f'erro: {nome}: cor inválida "{row[i]}" (use #RRGGBB)')
        dados[nome]=d
    for row in wb['Especiais'].iter_rows(min_row=2,values_only=True):
        if not row or not row[0]: continue
        nome=str(row[0]).strip(); k=row[10]
        if nome not in dados or k not in PADRAO: continue
        d=dados[nome]; d.setdefault('specials',{}); d.setdefault('moves',{})
        if row[3]: d['specials'][k]=str(row[3]).upper()
        mv={}
        for i,key in ((4,'dmg'),(5,'s'),(6,'a'),(7,'r')):
            v=num(row[i])
            if v is not None: mv[key]=int(v) if key!='dmg' else v
        v=num(row[8])
        if v is not None: mv['vel']=v
        v=num(row[9],int)
        if v is not None: mv['maxHits' if k=='spin' else 'hits']=v
        if k=='fireball': mv.pop('a',None)
        if k=='super': mv.pop('a',None)
        d['moves'][k]={x:y for x,y in mv.items() if PADRAO[k].get('hits' if x=='maxHits' else x)!=y}
    if 'Frases' in wb.sheetnames:
        for row in wb['Frases'].iter_rows(min_row=2,values_only=True):
            if not row or not row[0] or len(row)<2 or not row[1]: continue
            nome=str(row[0]).strip()
            if nome in dados: dados[nome].setdefault('quotes',[]).append(str(row[1]).strip())
        for d in dados.values():
            if d.get('quotes'): d['quote']=d['quotes'][0]
    bloco=(INI+'\nconst PLANILHA = '+json.dumps(dados,ensure_ascii=False,indent=1)+';\n'
      'PLANILHA && CHARACTERS.forEach(c => { const d = PLANILHA[c.name]; if (!d) return; const { stats, specials, moves, ...resto } = d;\n'
      '  Object.assign(c, resto); if (stats) c.stats = { ...c.stats, ...stats }; if (specials) c.specials = { ...c.specials, ...specials };\n'
      '  if (moves) { c.moves = c.moves || {}; for (const k in moves) c.moves[k] = { ...(c.moves[k] || {}), ...moves[k] }; } });\n'+FIM+'\n')
    js=open(JS,encoding='utf-8').read()
    js=re.sub(re.escape(INI)+r'.*?'+re.escape(FIM)+r'\n?','',js,flags=re.S).rstrip()+'\n'+bloco
    open(JS,'w',encoding='utf-8').write(js)
    subprocess.run(['node','--check',JS],check=True); print('ok: js/characters.js atualizado com',len(dados),'personagens')
if __name__=='__main__':
    {'exportar':exportar,'importar':importar}.get(sys.argv[1] if len(sys.argv)>1 else '',lambda:print(__doc__))()
