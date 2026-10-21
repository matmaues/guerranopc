# GUERRA no P.C

Jogo de luta 8-bit estilo fliperama (inspirado nos clássicos de luta dos anos 90, com código, arte e sons 100% originais).
HTML/CSS/JS puro, sem build. Rode um servidor local na pasta: `python3 -m http.server 8000` e abra http://localhost:8000

## Modos
- **ARCADE**: escolha um lutador e vença todos os outros em sequência; no fim, o **CHEFÃO**. Perdeu? Tela de **CONTINUAR?** com contagem (aperte Enter).
- **VERSUS**: 2 jogadores no mesmo teclado. Cada um escolhe o lutador (P1 confirma com Enter/U, P2 com Num4/Num Enter/vírgula).
- Título: Enter põe a ficha (INSERT COIN), Enter de novo = START. Menu: modo, dificuldade (◀ ▶) e lista de comandos.

## Comandos
Direções relativas ao lado em que você está virado (→ = para frente).

| Ação | P1 | P2 (Versus) |
|---|---|---|
| Andar / pular / agachar | A D / W / S (no Arcade também setas) | setas |
| Soco fraco / forte | U / I | Num4 / Num5 (ou , .) |
| Chute fraco / forte | J / K | Num1 / Num2 (ou ; /) |
| Especial simples | L (neutro = projétil, ↓+L = gancho, trás+L = furacão) | Num6 (ou ') |
| Super simples (barra cheia) | O | Num3 (ou ]) |
| Pausa (com lista de comandos) | Enter ou P | |
| Sair para o título (na pausa) | Esc | |
| Som liga/desliga | M | |

**Golpes de comando (iguais para todos):**
- **Projétil**: ↓ ↘ → + soco (forte = mais rápido)
- **Gancho anti-aéreo**: → ↓ ↘ + soco (invencível no começo, derruba)
- **Furacão**: ↓ ↙ ← + chute (avança girando, até 3 hits)
- **SUPER**: ↓ ↘ → ↓ ↘ → + soco com a barra SUPER cheia (congela a tela, 5 hits)
- **Agarrão**: perto do oponente, → ou ← + soco forte
- **Defesa**: segure TRÁS. Em pé defende golpes aéreos; agachado (↙) defende rasteiras. Especiais tiram um pouco de vida mesmo defendidos (chip).
- Agachado + chute forte = **rasteira** (derruba).

**Combos:** golpes fracos encadeiam (U, U, U...), e qualquer golpe normal que acertar pode ser cancelado em especial ou super
(ex.: J → ↓↘→ + U). O contador "N HITS!" aparece na tela. Dano diminui um pouco a cada hit do combo; um oponente caindo
pode receber no máximo 2 golpes de "juggle" (gancho/super). Melhor de 3 rounds, 99 segundos.

## Personagens (`js/characters.js`)
| Lutador | Vel/For/Vida | Especiais |
|---|---|---|
| Maués | 9/6/7 | Taco Voador (taco de hóquei girando), Gancho do Maués, Furacão de Chinelo, SUPER TACADA |
| Milk | 5/6/8 | Pituxo (garrafa de gin azul girando), Gancho do Milk, Barrigada Giratória, SUPER PITUXO |
| João Pedro | 3/7/8 | Granada, Gancho de Comando, Rajada de Coturno, BOMBARDEIO TÁTICO |
| Lutador 3 | 4/9/8 | Pedrada, Gancho de Pedra, Rolo Compressor, Terremoto Total |
| Lutador 4 | 7/7/4 | Raio Roxo, Gancho Voador, Pião Roxo, Fúria Violeta |
| Chefão | 7/9/10 | chefe final do Arcade (no Versus pode ser escolhido) |

Campos de cada lutador: `name`, `color`/`accent`, `stats` (1-10), `specials` (nomes), `quote` (frase de vitória), `projectile`
(`chinelo`, `granada` ou padrão), `boss`, `scale`, e o visual:
- `sprite` + `spriteLegs: true` + `punchSprite` (Maués): tronco com os pixels exatos da arte original (`assets/maues.png`), pernas e chinelos brancos desenhados pelo jogo, e `assets/maues_punch.png` com o braço esticado no mesmo estilo para os socos.
- `parts: "assets/joao/"` (João Pedro): pixels da arte original divididos em partes — tronco em guarda/soco/gancho/defesa (braços de luta pintados no mesmo camuflado), pernas `leg_l`/`leg_r` que giram no quadril para chutes, e `win.png` (arte original com braços para baixo) para vitória.
- `sprite: "assets/arquivo.png"`: imagem própria (fundo transparente, virada para a direita). Com `spriteLegs: true` a imagem é só do tronco e o jogo desenha pernas.
- nenhum dos dois: boneco procedural simples (como Lutador 3/4).

## Cenários (`js/stages.js`)
`name`, `image` (640x360), `thumb`, `groundY` (linha do chão 0-180; CSM Nova Suíça = 157, em cima do piso da praça). `locked: true` = "???".

## Estrutura
- `js/input.js` – teclado/toque, mapas `CONTROLS` (P1, P2) e leitura de comandos com buffer (meias-luas, gancho)
- `js/fighter.js` – golpes (tabela `MOVES`), hit/block stun, combos, agarrão, knockdown, desenho
- `js/ai.js` – CPU (anti-aéreo, defesa alta/baixa, combos, especiais, super; fica mais forte a cada luta do Arcade)
- `js/audio.js` – sons chiptune, "voz" sintética do locutor (ROUND, FIGHT, K.O., PERFECT) e música — tudo gerado por WebAudio
- `js/game.js` – telas (título, seleção, cenário, VS, luta, pausa, frase de vitória, continue, final), HUD e loop

## Luta Livre (vs CPU)
No menu, escolha **LUTA LIVRE (VS CPU)**. Primeiro escolha seu lutador, depois **ESCOLHA O ADVERSÁRIO** (cursor "CPU") — inclusive **ALEATÓRIO**, sorteado na hora da luta. Depois da luta você volta à seleção. O modo Arcade continua igual.

## João Pedro (sprite)
Gerado com o kit no Gemini (`assets/joao_ref_gemini.png`), normalizado com `tools/normalizar.py` na mesma grade do Maués (`assets/joao_ref_normalizado.png`, 42x77) e dividido em peças por `tools/gerar_joao.py` (`assets/joao/`: guard, punch, upper, block, leg_l, leg_r, win). Cabeça, corpo e coturnos são os pixels originais; os braços de luta são os braços originais reposicionados. A vitória usa a arte original com braços para baixo. Ajuste em `partsMeta` (`ox`, `legX`) no `js/characters.js`.

## Cache / deploy
Todos os scripts e imagens usam `?v=BUILD` (definido em `index.html`, `window.BUILD`). **Troque o valor de BUILD (e dos `?v=` nas tags script) a cada deploy**, senão navegadores podem misturar JS antigo do cache com JS novo.

## Kit de padronização de personagens (`kit/`)
Molde, exemplos e prompt para o Gemini: veja `kit/LEIA-ME.txt`. O kit fixa o estilo (grade, contorno, tons, proporção, pose, fundo branco), não a silhueta.
- `tools/normalizar.py ENTRADA.png assets/NOME.png [--altura 88] [--cores 24] [--cabeca N]` faz o seguinte:
  - tira o fundo e recorta;
  - reduz a grade de pixel art;
  - escala pela altura;
  - limpa a paleta e refaz o contorno de 1 px.
- No `js/characters.js`, use `sprite: "assets/NOME.png", fullSprite: true`. O personagem é desenhado inteiro, e as poses vêm de inclinação e deslocamento.
- `tools/molde.py` regenera as imagens do kit.

## Altura dos personagens
Em `js/characters.js` cada personagem tem `alturaReal` (m) e `alturaArte`, que é a altura do PNG em 1:1, dos pés até o topo da cabeça.
- A altura em jogo é 1,80 m = 88 px, ±3 px a cada 5 cm, limitada entre 80 e 96 px (`alturaPx()`).
- O jogo escala o sprite até esse alvo usando o vizinho mais próximo.
- Mais alto ganha um alcance levemente maior.
- A altura aparece na seleção e no VS.
- Maués: 1,80 m, 88 px, em 1:1.
- João Pedro: 1,78 m, 87 px; a arte de 77 px é escalada ×1,13.
O `tools/normalizar.py` aceita `--altura 1.78` (em metros).

## Balanceamento
Os arquétipos são diferentes de propósito:
- Maués: VEL 9, FOR 6, VID 7. Rápido e ágil, com golpes mais fracos.
- João Pedro: VEL 3, FOR 7, VID 8. Lento, forte e resistente.

Simulação CPU x CPU (nível 4, 200 lutas, lados alternados): Maués 47,5% x João 52,5%. Rode `node tools/sim.js '<stats JSON>' 200` com o servidor local ligado.

## Planilha de personagens
`kit/personagens.xlsx` reúne atributos, altura, cores, frase e cada golpe especial (nome, dano, frames, velocidade e acertos). As células amarelas são editáveis.
- `python3 tools/planilha.py importar` grava as mudanças em `js/characters.js`, no bloco PLANILHA no fim do arquivo.
- `python3 tools/planilha.py exportar` recria a planilha a partir do jogo.
- Os ajustes de especiais por personagem ficam em `moves` (fireball/super: `dmg`, `vel`, `hits`; dp/spin: `dmg`, `s`, `a`, `r`, `maxHits`).

## Skins
Hoje todo personagem tem só a skin `Original`. Para adicionar roupas novas:
1. Crie uma pasta `assets/skins/<nome>/` com imagens de mesmo nome e tamanho dos originais (veja `assets/skins/LEIA-ME.txt`).
2. Adicione `{ nome: "...", pasta: "assets/skins/<nome>/" }` na lista `skins` do personagem.

Com mais de uma skin, ▲/▼ troca a skin na seleção (no Versus: W/S para o P1 e ▲/▼ para o P2), e num espelho o P2 recebe outra skin automaticamente. Com uma skin só, a dica não aparece e os dois lados usam a Original, sem tingimento.

## Milk e Clube Chalézinho
- O Milk veio de uma arte do Gemini (`assets/milk_ref_gemini.png`). Foi normalizado em 42x93 na grade nativa e é escalado para 87 px (1,78 m). As peças ficam em `assets/milk/` e são geradas por `tools/gerar_milk.py`.
- O projétil é `assets/milk_pituxo.png`.
- Arquétipo: tanque de meio-campo. Na simulação: Milk 50,7% x Maués e 49,3% x João.
- Cenário novo: `Clube Chalézinho` (`assets/stage_clube_chalezinho.png`, chão em groundY 163). No Arcade, os cenários se alternam a cada luta.
- Frases de vitória: `quotes` (lista; o jogo sorteia uma) ou `quote`. Ficam editáveis na aba Frases da planilha.
- Cartaz-resumo: `python3 tools/poster.py` gera `screens/resumo_jogo.png`.

## Novidades (BUILD 202610211530)
- **Monte Pascoal**: terceiro cenário (`assets/stage_monte_pascoal.png`); entra na escolha de cenário e no rodízio do Arcade.
- **CONTROLES**: no menu principal (e na pausa, tecla **C**) dá para trocar as teclas do P1 e do P2: escolha a ação, ENTER e aperte a nova tecla. Se a tecla já tiver dono, as duas trocam de lugar (aparece um aviso). Use **PADRÃO** para voltar às teclas originais e **SALVAR E VOLTAR** para guardar (fica salvo no navegador, em localStorage). Os botões de toque continuam valendo para o P1.
- **Braços no estilo do Maués** para João Pedro e Milk (`tools/bracos.py`, que já roda no fim de `gerar_joao.py`/`gerar_milk.py`): braço da frente pendurado ao lado do corpo, braço de trás dobrado na barriga, soco com o braço inteiro saindo da manga, cotovelos fechados com contorno.
