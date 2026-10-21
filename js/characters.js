// ===== CONFIGURAÇÃO DOS PERSONAGENS =====
// name: nome | color/accent: cores | stats (1-10): speed (velocidade), power (força), health (vida)
// parts: pasta com sprites por partes (guard/punch/upper/block = tronco, leg_l/leg_r = pernas, win = corpo inteiro).
// punchSprite: versão do tronco com o braço esticado (usada no soco).
// sprite: caminho da imagem (null = desenho procedural). spriteLegs: true se a imagem é só do tronco (o jogo desenha as pernas).
// specials: nomes dos golpes especiais (os comandos são iguais para todos).
// skins: roupas. { nome: "Original" } = visual padrão; { nome, pasta: "assets/skins/x/" } usa imagens próprias com os mesmos nomes de arquivo
//   (veja assets/skins/LEIA-ME.txt). Com 2+ skins, ▲/▼ troca na seleção e o espelho dá outra skin ao P2; com 1 só, os dois usam a Original.
// moves: ajustes por personagem dos especiais (editáveis na planilha kit/personagens.xlsx): fireball/super { dmg, vel, hits }, dp/spin { dmg, s, a, r, maxHits }.
// quote: frase de vitória (padrão). quotes: lista de frases (sorteia uma por vitória; editável na aba Frases da planilha). boss: true = Chefão (último da escada do Arcade; selecionável só no Versus). scale: tamanho do desenho.
// ALTURA: alturaReal (m) -> altura em jogo (px de arte, pés até o topo da cabeça, sem cabelo/chapéu alto)
// 1,80 m = 88 px; ±3 px a cada 5 cm; limite 80–96 px. alturaArte = altura do sprite em 1:1 (o jogo escala).
function alturaPx(c) { return c.alturaReal ? Math.max(80, Math.min(96, Math.round(88 + (c.alturaReal - 1.80) / 0.05 * 3))) : 88; }
function alturaTxt(c) { return c.alturaReal ? c.alturaReal.toFixed(2).replace(".", ",") + " m" : ""; }
// Milk: tanque de meio-campo (VEL 5, FOR 6, VID 8). Sim 140 lutas: Milk 50,7% x Maués, 49,3% x João.
// BALANCEAMENTO: arquétipos diferentes. Maués = rápido/ágil, golpes mais fracos; João = lento, mais forte e resistente.
// Medido com tools/sim (CPU x CPU nível 4, 200 lutas, lados alternados): Maués 47,5% x João 52,5%.
const CHARACTERS = [
  { name: "Maués", alturaReal: 1.80, alturaArte: 88, color: "#1f4fc4", accent: "#ffd23f", stats: { speed: 9, power: 6, health: 7 },
    sprite: "assets/maues.png", spriteLegs: true, skin: "#e9a57e", legX: [9, 24], punchSprite: "assets/maues_punch.png", projectile: "taco", projSprite: "assets/maues_taco.png", projR: 9,
    specials: { fireball: "TACO VOADOR", dp: "GANCHO DO MAUÉS", spin: "FURACÃO DE CHINELO", super: "SUPER TACADA" },
    quote: "Chinelo branco não perdoa ninguém!",
    skins: [{ nome: "Original" }] },
  { name: "João Pedro", alturaReal: 1.78, alturaArte: 77, color: "#4a5530", accent: "#3fa34d", stats: { speed: 3, power: 7, health: 8 }, sprite: null, parts: "assets/joao/", partsMeta: { ox: -21, legX: [8, 22] }, projectile: "granada",
    specials: { fireball: "GRANADA", dp: "GANCHO DE COMANDO", spin: "RAJADA DE COTURNO", super: "BOMBARDEIO TÁTICO" },
    quote: "Missão cumprida. Próximo da fila!",
    skins: [{ nome: "Original" }] },
  { name: "Milk", alturaReal: 1.78, alturaArte: 93, color: "#5b3fa0", accent: "#f4f4ff", stats: { speed: 5, power: 6, health: 8 }, sprite: null, parts: "assets/milk/", partsMeta: { ox: -21, legX: [8, 23] },
    projectile: "pituxo", projSprite: "assets/milk_pituxo.png", projR: 7,
    specials: { fireball: "PITUXO", dp: "GANCHO DO MILK", spin: "BARRIGADA GIRATÓRIA", super: "SUPER PITUXO" },
    quote: "Pix sem taxa no pv", quotes: ["Pix sem taxa no pv"],
    skins: [{ nome: "Original" }] },
  { name: "Lutador 3", color: "#3bd16f", accent: "#1a1a1a", stats: { speed: 4, power: 9, health: 8 }, sprite: null,
    specials: { fireball: "PEDRADA", dp: "GANCHO DE PEDRA", spin: "ROLO COMPRESSOR", super: "TERREMOTO TOTAL" },
    quote: "Força bruta resolve tudo.",
    skins: [{ nome: "Original" }] },
  { name: "Lutador 4", color: "#b03be8", accent: "#ff9ff3", stats: { speed: 7, power: 7, health: 4 }, sprite: null,
    specials: { fireball: "RAIO ROXO", dp: "GANCHO VOADOR", spin: "PIÃO ROXO", super: "FÚRIA VIOLETA" },
    quote: "Volte quando treinar mais.",
    skins: [{ nome: "Original" }] },
  { name: "Chefão", color: "#2b2b33", accent: "#e83b3b", stats: { speed: 7, power: 9, health: 10 }, sprite: null, boss: true, scale: 1.2,
    specials: { fireball: "BOLA SOMBRIA", dp: "GANCHO DO CHEFÃO", spin: "FURACÃO SOMBRIO", super: "APOCALIPSE" },
    quote: "Ninguém derruba o Chefão!",
    skins: [{ nome: "Original" }] },
];
// >>> PLANILHA (gerado por tools/planilha.py importar — edite a planilha, não aqui)
const PLANILHA = {
 "Maués": {
  "stats": {
   "speed": 9,
   "power": 6,
   "health": 7
  },
  "alturaReal": 1.8,
  "color": "#1f4fc4",
  "accent": "#ffd23f",
  "specials": {
   "fireball": "TACO VOADOR",
   "dp": "GANCHO DO MAUÉS",
   "spin": "FURACÃO DE CHINELO",
   "super": "SUPER TACADA"
  },
  "moves": {
   "fireball": {},
   "dp": {},
   "spin": {},
   "super": {}
  },
  "quotes": [
   "Chinelo branco não perdoa ninguém!"
  ],
  "quote": "Chinelo branco não perdoa ninguém!"
 },
 "João Pedro": {
  "stats": {
   "speed": 3,
   "power": 7,
   "health": 8
  },
  "alturaReal": 1.78,
  "color": "#4a5530",
  "accent": "#3fa34d",
  "specials": {
   "fireball": "GRANADA",
   "dp": "GANCHO DE COMANDO",
   "spin": "RAJADA DE COTURNO",
   "super": "BOMBARDEIO TÁTICO"
  },
  "moves": {
   "fireball": {},
   "dp": {},
   "spin": {},
   "super": {}
  },
  "quotes": [
   "Missão cumprida. Próximo da fila!"
  ],
  "quote": "Missão cumprida. Próximo da fila!"
 },
 "Milk": {
  "stats": {
   "speed": 5,
   "power": 6,
   "health": 8
  },
  "alturaReal": 1.78,
  "color": "#5b3fa0",
  "accent": "#f4f4ff",
  "specials": {
   "fireball": "PITUXO",
   "dp": "GANCHO DO MILK",
   "spin": "BARRIGADA GIRATÓRIA",
   "super": "SUPER PITUXO"
  },
  "moves": {
   "fireball": {},
   "dp": {},
   "spin": {},
   "super": {}
  },
  "quotes": [
   "Pix sem taxa no pv"
  ],
  "quote": "Pix sem taxa no pv"
 },
 "Lutador 3": {
  "stats": {
   "speed": 4,
   "power": 9,
   "health": 8
  },
  "color": "#3bd16f",
  "accent": "#1a1a1a",
  "specials": {
   "fireball": "PEDRADA",
   "dp": "GANCHO DE PEDRA",
   "spin": "ROLO COMPRESSOR",
   "super": "TERREMOTO TOTAL"
  },
  "moves": {
   "fireball": {},
   "dp": {},
   "spin": {},
   "super": {}
  },
  "quotes": [
   "Força bruta resolve tudo."
  ],
  "quote": "Força bruta resolve tudo."
 },
 "Lutador 4": {
  "stats": {
   "speed": 7,
   "power": 7,
   "health": 4
  },
  "color": "#b03be8",
  "accent": "#ff9ff3",
  "specials": {
   "fireball": "RAIO ROXO",
   "dp": "GANCHO VOADOR",
   "spin": "PIÃO ROXO",
   "super": "FÚRIA VIOLETA"
  },
  "moves": {
   "fireball": {},
   "dp": {},
   "spin": {},
   "super": {}
  },
  "quotes": [
   "Volte quando treinar mais."
  ],
  "quote": "Volte quando treinar mais."
 },
 "Chefão": {
  "stats": {
   "speed": 7,
   "power": 9,
   "health": 10
  },
  "color": "#2b2b33",
  "accent": "#e83b3b",
  "specials": {
   "fireball": "BOLA SOMBRIA",
   "dp": "GANCHO DO CHEFÃO",
   "spin": "FURACÃO SOMBRIO",
   "super": "APOCALIPSE"
  },
  "moves": {
   "fireball": {},
   "dp": {},
   "spin": {},
   "super": {}
  },
  "quotes": [
   "Ninguém derruba o Chefão!"
  ],
  "quote": "Ninguém derruba o Chefão!"
 }
};
PLANILHA && CHARACTERS.forEach(c => { const d = PLANILHA[c.name]; if (!d) return; const { stats, specials, moves, ...resto } = d;
  Object.assign(c, resto); if (stats) c.stats = { ...c.stats, ...stats }; if (specials) c.specials = { ...c.specials, ...specials };
  if (moves) { c.moves = c.moves || {}; for (const k in moves) c.moves[k] = { ...(c.moves[k] || {}), ...moves[k] }; } });
// <<< PLANILHA
