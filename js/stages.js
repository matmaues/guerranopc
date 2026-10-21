// ===== CONFIGURAÇÃO DOS CENÁRIOS =====
// image: imagem 640x360 (fundo da luta). thumb: miniatura (opcional). groundY: linha do chão (0-180, coordenadas lógicas).
// Para adicionar um cenário, copie um bloco. Cenários com locked: true aparecem como "???".
const STAGES = [
  { name: "CSM Nova Suíça", image: "assets/stage_csm_nova_suica.png", thumb: "assets/stage_csm_nova_suica_thumb.png", groundY: 157 },
  { name: "Clube Chalézinho", image: "assets/stage_clube_chalezinho.png", thumb: "assets/stage_clube_chalezinho_thumb.png", groundY: 163 },
  { name: "Monte Pascoal", image: "assets/stage_monte_pascoal.png", thumb: "assets/stage_monte_pascoal_thumb.png", groundY: 163 },
  { name: "???", locked: true },
];
