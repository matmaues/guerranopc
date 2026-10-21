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
| Maués | 6/7/6 | Chinelada, Gancho do Maués, Furacão de Chinelo, SUPER CHINELADA |
| João Pedro | 4/8/9 | Granada, Gancho de Comando, Rajada de Coturno, BOMBARDEIO TÁTICO |
| Lutador 3 | 4/9/8 | Pedrada, Gancho de Pedra, Rolo Compressor, Terremoto Total |
| Lutador 4 | 7/7/4 | Raio Roxo, Gancho Voador, Pião Roxo, Fúria Violeta |
| Chefão | 7/9/10 | chefe final do Arcade (no Versus pode ser escolhido) |

Campos de cada lutador: `name`, `color`/`accent`, `stats` (1-10), `specials` (nomes), `quote` (frase de vitória), `projectile`
(`chinelo`, `granada` ou padrão), `boss`, `scale`, e o visual:
- `sprite` + `spriteLegs: true` + `punchSprite` (Maués): tronco com os pixels exatos da arte original (`assets/maues.png`), pernas e chinelos brancos desenhados pelo jogo, e `assets/maues_punch.png` com o braço esticado no mesmo estilo para os socos.
- `parts: "assets/joao/"` (João Pedro): pixels da arte original divididos em partes — tronco em guarda/soco/gancho/defesa (braços de luta pintados no mesmo camuflado), pernas `leg_l`/`leg_r` que giram no quadril para chutes, e `win.png` (braços cruzados originais) para vitória.
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
Extraído na grade nativa da arte original (`assets/joao/`: guard, punch, upper, block, leg_l, leg_r, win). Pernas são peças separadas; a vitória usa a pose original de braços cruzados. Ajuste em `partsMeta` (`ox`, `legX`) no `js/characters.js`.

## Cache / deploy
Todos os scripts e imagens usam `?v=BUILD` (definido em `index.html`, `window.BUILD`). **Troque o valor de BUILD (e dos `?v=` nas tags script) a cada deploy**, senão navegadores podem misturar JS antigo do cache com JS novo.
