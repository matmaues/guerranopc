// ===== CONFIGURAÇÃO DOS PERSONAGENS =====
// Edite livremente: name, cor, stats (1-10) e sprite (caminho da imagem, ou null para desenho procedural).
// special.type: "projetil" | "investida" | "uppercut" | "terremoto"
const CHARACTERS = [
  { name: "Maués", color: "#1f4fc4", accent: "#ffd23f", stats: { speed: 6, power: 7, health: 6 },
    // spriteLegs: true = a imagem é só do tronco pra cima (até o short); o jogo desenha pernas/tênis animados.
    // Use false (ou omita) para imagens de corpo inteiro.
    sprite: "assets/maues.png", spriteLegs: true, skin: "#e9a57e", legX: [9, 24], // legX = posição x (px da imagem) onde começam as pernas
    special: { name: "Bola de Fogo do Maués", type: "projetil" } },
  { name: "Lutador 2", color: "#3b7be8", accent: "#ffffff", stats: { speed: 9, power: 4, health: 5 },
    sprite: null, special: { name: "Investida Relâmpago", type: "investida" } },
  { name: "Lutador 3", color: "#3bd16f", accent: "#1a1a1a", stats: { speed: 4, power: 9, health: 8 },
    sprite: null, special: { name: "Terremoto", type: "terremoto" } },
  { name: "Lutador 4", color: "#b03be8", accent: "#ff9ff3", stats: { speed: 7, power: 7, health: 4 },
    sprite: null, special: { name: "Gancho Voador", type: "uppercut" } },
];
