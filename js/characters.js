// ===== CONFIGURAÇÃO DOS PERSONAGENS =====
// name: nome | color/accent: cores | stats (1-10): speed (velocidade), power (força), health (vida)
// parts: pasta com sprites por partes (guard/punch/upper/block = tronco, leg_l/leg_r = pernas, win = corpo inteiro).
// punchSprite: versão do tronco com o braço esticado (usada no soco).
// sprite: caminho da imagem (null = desenho procedural). spriteLegs: true se a imagem é só do tronco (o jogo desenha as pernas).
// specials: nomes dos golpes especiais (os comandos são iguais para todos).
// quote: frase de vitória. boss: true = Chefão (último da escada do Arcade; selecionável só no Versus). scale: tamanho do desenho.
const CHARACTERS = [
  { name: "Maués", color: "#1f4fc4", accent: "#ffd23f", stats: { speed: 6, power: 7, health: 6 },
    sprite: "assets/maues.png", spriteLegs: true, skin: "#e9a57e", legX: [9, 24], punchSprite: "assets/maues_punch.png", projectile: "chinelo",
    specials: { fireball: "CHINELADA", dp: "GANCHO DO MAUÉS", spin: "FURACÃO DE CHINELO", super: "SUPER CHINELADA" },
    quote: "Chinelo branco não perdoa ninguém!" },
  { name: "João Pedro", color: "#4a5530", accent: "#3fa34d", stats: { speed: 4, power: 8, health: 9 }, sprite: null, parts: "assets/joao/", partsMeta: { ox: -13, legX: [1, 12] }, projectile: "granada",
    specials: { fireball: "GRANADA", dp: "GANCHO DE COMANDO", spin: "RAJADA DE COTURNO", super: "BOMBARDEIO TÁTICO" },
    quote: "Missão cumprida. Próximo da fila!" },
  { name: "Lutador 3", color: "#3bd16f", accent: "#1a1a1a", stats: { speed: 4, power: 9, health: 8 }, sprite: null,
    specials: { fireball: "PEDRADA", dp: "GANCHO DE PEDRA", spin: "ROLO COMPRESSOR", super: "TERREMOTO TOTAL" },
    quote: "Força bruta resolve tudo." },
  { name: "Lutador 4", color: "#b03be8", accent: "#ff9ff3", stats: { speed: 7, power: 7, health: 4 }, sprite: null,
    specials: { fireball: "RAIO ROXO", dp: "GANCHO VOADOR", spin: "PIÃO ROXO", super: "FÚRIA VIOLETA" },
    quote: "Volte quando treinar mais." },
  { name: "Chefão", color: "#2b2b33", accent: "#e83b3b", stats: { speed: 7, power: 9, health: 10 }, sprite: null, boss: true, scale: 1.2,
    specials: { fireball: "BOLA SOMBRIA", dp: "GANCHO DO CHEFÃO", spin: "FURACÃO SOMBRIO", super: "APOCALIPSE" },
    quote: "Ninguém derruba o Chefão!" },
];
