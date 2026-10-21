# GUERRA no P.C

Jogo de luta 8-bit para navegador (HTML/CSS/JS puro, sem build). Abra `index.html` por um servidor local:
`python3 -m http.server 8000` e acesse http://localhost:8000

## Controles
| Ação | Tecla |
|---|---|
| Mover | Setas ou A/D |
| Pular | Seta ↑ ou W |
| Agachar | Seta ↓ ou S |
| Soco | J |
| Chute | K |
| Especial | L (tem recarga, barrinha abaixo da vida) |
| Defender | Segure para TRÁS (longe do oponente) |
| Mudo | M |
| Menu | Enter confirma, Esc volta |

No celular aparecem botões de toque. Na seleção, ▲/▼ muda a dificuldade (a CPU também fica mais forte a cada round que você vence).
Melhor de 3 rounds, 60 segundos cada.

## Como trocar personagens (nomes, stats e imagens)
Tudo fica em **`js/characters.js`**. Cada lutador tem:
```js
{ name: "Lutador 1", color: "#e83b3b", accent: "#ffd23f",
  stats: { speed: 6, power: 6, health: 6 },      // valores de 1 a 10
  sprite: null,                                    // ex.: "assets/meu_lutador.png"
  special: { name: "Bola de Fogo", type: "projetil" } }
```
- **name**: nome que aparece no jogo.
- **color / accent**: cores do desenho procedural e dos efeitos.
- **stats**: velocidade, força (dano) e vida.
- **sprite**: coloque sua imagem PNG (de preferência fundo transparente, virada para a DIREITA, ~48x48 px) na pasta `assets/` e escreva o caminho aqui. Com `null`, o boneco é desenhado por código.
- **special.type**: `projetil`, `investida`, `uppercut` ou `terremoto`.

Para adicionar um 5º lutador, basta copiar um bloco e adicionar à lista.

## Estrutura
- `js/characters.js` – configuração dos lutadores
- `js/fighter.js` – física, golpes, desenho
- `js/ai.js` – controladores (humano e CPU)
- `js/input.js` – teclado/toque e mapa `CONTROLS` (já tem espaço para `p2`)
- `js/audio.js` – sons chiptune WebAudio e música
- `js/game.js` – telas, HUD, cenário, loop

**2 jogadores (futuro):** descomente `CONTROLS.p2` em `input.js` e, em `game.js` (`startRound`), troque `new CPUController(lvl)` por `new HumanController(CONTROLS.p2)`.

## Sprite só do tronco (`spriteLegs: true`)
O canvas tem 640x360 pixels reais; a lógica do jogo usa 320x180 (cada "pixel" dos bonecos procedurais = 2x2).
Imagens de lutador com `spriteLegs: true` são desenhadas em resolução total (1 pixel da imagem = 1 pixel real), então
ficam com o dobro de detalhe. O Maués usa `assets/maues.png` (43x66 px, grade original da arte, do cabelo até o short).
O jogo completa as pernas (cor `skin`, contorno preto) com chinelos brancos, e anima as poses movendo/inclinando a imagem
inteira, sem redesenhar o rosto, braços ou roupa. `legX` = colunas da imagem onde começam as duas pernas.

## Cenários
Ficam em **`js/stages.js`**: `name`, `image` (640x360), `thumb` (miniatura) e `groundY` (linha do chão, 0–180; o CSM Nova Suíça usa 157 = em cima do piso da praça). Entradas com `locked: true` aparecem como "???" na tela de escolha de cenário.
