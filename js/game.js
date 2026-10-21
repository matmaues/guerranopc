const cv = document.getElementById("c"), g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
const W = 320, H = 180, SCALE = 2; // lógica 320x180, canvas real 640x360 (sprites de imagem usam resolução total)
function resize() { const s = Math.max(0.5, Math.floor(Math.min(innerWidth / (W * 2), innerHeight / (H * 2))) * 2 || 1); cv.style.width = W * s + "px"; cv.style.height = H * s + "px"; }
addEventListener("resize", resize); resize();
const DIFFS = [{ n: "FÁCIL", l: 1 }, { n: "NORMAL", l: 2 }, { n: "DIFÍCIL", l: 4 }];
const game = {
  screen: "title", frame: 0, sel: 0, stageSel: 0, diff: 1, p: [], projectiles: [], waves: [], sparks: [], shakeT: 0, wins: [0, 0], round: 1, timer: 60, phase: "", phaseT: 0, winner: null,
  shake(n) { this.shakeT = Math.max(this.shakeT, n); },
  spark(x, y, c) { for (let i = 0; i < 8; i++) this.sparks.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, l: 12 + Math.random() * 6, c }); },
  onKO(f) { if (this.phase !== "fight") return; this.phase = "ko"; this.phaseT = 0; Audio8.ko(); this.shake(14); },
  startMatch(cpuIdx) {
    this.stage = STAGES[this.stageSel]; GROUND = this.stage.groundY || 152;
    this.cpuIdx = cpuIdx ?? Math.floor(Math.random() * CHARACTERS.length); this.wins = [0, 0]; this.round = 1; this.screen = "fight"; this.startRound(); Audio8.startMusic();
  },
  startRound() {
    const lvl = DIFFS[this.diff].l + this.wins[0]; // dificuldade escala com as vitórias do jogador
    this.p = [new Fighter(CHARACTERS[this.sel], 90, 1, new HumanController(CONTROLS.p1)),
              new Fighter(CHARACTERS[this.cpuIdx], 230, -1, new CPUController(lvl))]; // para 2P: trocar por new HumanController(CONTROLS.p2)
    this.projectiles = []; this.waves = []; this.sparks = []; this.timer = 60; this.phase = "intro"; this.phaseT = 0;
  },
};
window.game = game;
// ---------- texto ----------
function txt(s, x, y, size = 8, col = "#fff", align = "center", glow) {
  g.font = `bold ${size}px "Courier New", monospace`; g.textAlign = align; g.textBaseline = "middle";
  g.fillStyle = "#000"; g.fillText(s, x + 1, y + 1);
  if (glow) { g.shadowColor = glow; g.shadowBlur = 6; }
  g.fillStyle = col; g.fillText(s, x, y); g.shadowBlur = 0;
}
// ---------- cenário ----------
const stars = Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * 90]);
const IMG = {}; const img = src => IMG[src] || (IMG[src] = Object.assign(new Image(), { src }));
STAGES.forEach(s => { if (s.image) img(s.image); if (s.thumb) img(s.thumb); });
function drawStage(t) {
  const st = game.stage; if (st && st.image) { const im = img(st.image); if (im.complete && im.naturalWidth) { g.drawImage(im, 0, 0, W, H); return; } }
  drawArena(t);
}
function drawArena(t) {
  for (let i = 0; i < 12; i++) { g.fillStyle = `rgb(${20 + i * 6},${10 + i * 3},${50 + i * 8})`; g.fillRect(0, i * 10, W, 10); }
  g.fillStyle = "#fff"; stars.forEach(([x, y], i) => { if ((t + i * 7) % 60 < 50) g.fillRect(x | 0, y | 0, 1, 1); });
  g.fillStyle = "#ffe9a8"; g.fillRect(40, 44, 16, 16); g.fillStyle = "#d9c582"; g.fillRect(44, 48, 3, 3);
  // arquibancada
  for (let r = 0; r < 3; r++) for (let i = 0; i < 40; i++) { const x = i * 8 + (r % 2) * 4, y = 96 + r * 10 + ((t / 8 + i + r) % 4 < 2 ? 0 : -1);
    g.fillStyle = ["#a33", "#3a3", "#33a", "#aa3", "#a3a"][(i * 3 + r) % 5]; g.fillRect(x, y, 6, 6); g.fillStyle = "#e8b88a"; g.fillRect(x + 1, y - 4, 4, 4); }
  g.fillStyle = "#2a2a3a"; g.fillRect(0, 124, W, 6);
  // chão
  for (let y = 130; y < H; y += 6) for (let x = 0; x < W; x += 12) { g.fillStyle = ((x / 12 + y / 6) % 2) ? "#7a5230" : "#6a4526"; g.fillRect(x, y, 12, 6); }
  g.fillStyle = "#c33"; g.fillRect(0, GROUND + 4, W, 2);
}
// ---------- telas ----------
function title() {
  const t = game.frame; g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { g.fillStyle = "#223"; g.fillRect((i * 37 + t) % W, (i * 23) % H, 2, 2); }
  const fl = Math.floor(t / 8) % 2, hue = (t * 4) % 360;
  txt("GUERRA", W / 2, 50, 40, fl ? "#ff3b3b" : "#ffd23f", "center", fl ? "#ff0" : "#f00");
  txt("no", W / 2, 76, 10, "#aaa");
  txt("P.C", W / 2, 102, 40, `hsl(${hue},100%,60%)`, "center", `hsl(${(hue + 180) % 360},100%,60%)`);
  if (Math.floor(t / 30) % 2) txt("PRESSIONE ENTER", W / 2, 140, 10, "#fff");
  txt("SETAS/WASD mover  J soco  K chute  L especial", W / 2, 160, 7, "#8cf");
  txt("Segure TRÁS p/ defender   M = mudo", W / 2, 170, 7, "#8cf");
  if (Input.wasPressed("Enter") || Input.wasPressed("Space")) { Audio8.menu(); game.screen = "select"; }
}
function drawPortrait(c, x, y, sel) {
  const f = new Fighter(c, x, 1, { get: () => null }); f.anim = game.frame; f.draw(g);
}
function select() {
  g.fillStyle = "#101028"; g.fillRect(0, 0, W, H); txt("ESCOLHA SEU LUTADOR", W / 2, 12, 10, "#ffd23f");
  const n = CHARACTERS.length, sp = W / n;
  CHARACTERS.forEach((c, i) => {
    const cx = sp * i + sp / 2, on = i === game.sel;
    g.fillStyle = on ? (game.frame % 20 < 10 ? "#fff" : c.color) : "#334"; g.fillRect(cx - 30, 24, 60, 64); g.fillStyle = "#000"; g.fillRect(cx - 28, 26, 56, 60);
    const f = new Fighter(c, cx, 1, null); f.y = 82; f.anim = on ? game.frame : 0; f.draw(g);
    txt(c.name, cx, 95, 8, on ? "#fff" : "#889");
  });
  const c = CHARACTERS[game.sel];
  const bar = (lbl, v, y) => { txt(lbl, 70, y, 8, "#ccc", "right"); g.fillStyle = "#333"; g.fillRect(76, y - 3, 100, 6); g.fillStyle = c.color; g.fillRect(76, y - 3, v * 10, 6); };
  bar("VELOCIDADE", c.stats.speed, 112); bar("FORÇA", c.stats.power, 122); bar("VIDA", c.stats.health, 132);
  txt("ESPECIAL:", 190, 112, 8, "#ccc", "left"); txt(c.special.name, 190, 122, 8, c.accent, "left");
  txt("◀ ▶ escolher   ▲ ▼ dificuldade: " + DIFFS[game.diff].n, W / 2, 152, 8, "#8cf");
  txt("ENTER para lutar   ESC voltar", W / 2, 166, 8, "#fff");
  const P = k => Input.wasPressed(k);
  if (P("ArrowLeft") || P("KeyA")) { game.sel = (game.sel + n - 1) % n; Audio8.menu(); }
  if (P("ArrowRight") || P("KeyD")) { game.sel = (game.sel + 1) % n; Audio8.menu(); }
  if (P("ArrowUp") || P("KeyW")) { game.diff = Math.min(2, game.diff + 1); Audio8.menu(); }
  if (P("ArrowDown") || P("KeyS")) { game.diff = Math.max(0, game.diff - 1); Audio8.menu(); }
  if (P("Escape")) game.screen = "title";
  if (P("Enter") || P("KeyJ")) { Audio8.menu(); game.screen = "stageSelect"; }
}
function hud() {
  const [a, b] = game.p, bw = 120;
  const hb = (f, x, rev) => { g.fillStyle = "#000"; g.fillRect(x - 1, 7, bw + 2, 9); g.fillStyle = "#a00"; g.fillRect(x, 8, bw, 7);
    const w = Math.ceil(bw * f.hp / f.maxHp); g.fillStyle = f.hp / f.maxHp < 0.3 ? "#f80" : "#ff0"; g.fillRect(rev ? x + bw - w : x, 8, w, 7); };
  hb(a, 8, false); hb(b, W - 8 - bw, true);
  txt(a.cfg.name, 8, 22, 8, "#fff", "left"); txt(b.cfg.name + " (CPU)", W - 8, 22, 8, "#fff", "right");
  txt(String(Math.ceil(game.timer)), W / 2, 13, 12, game.timer < 10 ? "#f44" : "#fff");
  txt("ROUND " + game.round, W / 2, 26, 7, "#ffd23f");
  for (let i = 0; i < 2; i++) { g.fillStyle = game.wins[0] > i ? "#ff0" : "#444"; g.fillRect(132 - i * 8, 30, 5, 5); g.fillStyle = game.wins[1] > i ? "#ff0" : "#444"; g.fillRect(184 + i * 8, 30, 5, 5); }
  const sc = (f, x) => { g.fillStyle = "#333"; g.fillRect(x, 17, 30, 2); g.fillStyle = f.cool <= 0 ? f.cfg.accent : "#888"; g.fillRect(x, 17, 30 * (1 - f.cool / 100), 2); };
  sc(a, 98); sc(b, W - 128);
  txt("J soco K chute L especial | segure trás = defesa | M mudo", W / 2, H - 5, 7, "#ddd");
  if (Audio8.muted) txt("MUDO", W - 4, H - 14, 7, "#f66", "right");
}
function fight() {
  const t = game.frame; game.phaseT++;
  const [a, b] = game.p;
  if (game.phase === "fight" || game.phase === "ko") { a.update(b, game); b.update(a, game); }
  if (game.phase === "intro" && game.phaseT > 90) game.phase = "fight";
  if (game.phase === "fight") {
    game.timer -= 1 / 60;
    if (game.timer <= 0) { game.timer = 0; game.phase = "ko"; game.phaseT = 0; game.timeUp = true; Audio8.ko(); }
  }
  // projéteis
  game.projectiles = game.projectiles.filter(p => { p.x += p.vx; p.life--; const o = p.owner === a ? b : a;
    if (Math.abs(p.x - o.x) < 12 && p.y > o.y - 46 && p.y < o.y && o.state !== "ko") { o.receive(p.dmg, Math.sign(p.vx) * 3, 22, game, p.x, p.y); return false; }
    return p.life > 0 && p.x > -10 && p.x < W + 10; });
  game.waves = game.waves.filter(w => { w.t++; w.x += w.dir * 4; const o = w.owner === a ? b : a;
    if (!w.hit && Math.abs(w.x - o.x) < 12 && o.grounded) { w.hit = true; o.receive(w.dmg, w.dir * 3, 26, game, o.x, GROUND - 6); } return w.t < 40; });
  // desenho
  g.save(); if (game.shakeT > 0) { g.translate(Math.round((Math.random() - .5) * game.shakeT), Math.round((Math.random() - .5) * game.shakeT)); game.shakeT *= 0.85; if (game.shakeT < 0.5) game.shakeT = 0; }
  drawStage(t);
  game.waves.forEach(w => { g.fillStyle = w.owner.cfg.accent; for (let i = 0; i < 3; i++) g.fillRect(w.x - i * 6 * w.dir, GROUND - 4 - ((w.t + i * 3) % 6) * 2, 4, 6); });
  [b, a].forEach(f => f.draw(g));
  game.projectiles.forEach(p => { g.fillStyle = p.color; g.fillRect(p.x - 5, p.y - 4, 10, 8); g.fillStyle = "#fff"; g.fillRect(p.x - 2, p.y - 2, 4, 4); g.fillStyle = p.owner.cfg.color; g.fillRect(p.x - p.vx * 3 - 2, p.y - 2, 4, 4); });
  game.sparks = game.sparks.filter(s => { s.x += s.vx; s.y += s.vy; s.l--; g.fillStyle = s.l % 4 < 2 ? s.c : "#fff"; g.fillRect(s.x | 0, s.y | 0, 2, 2); return s.l > 0; });
  g.restore(); hud();
  if (game.phase === "intro") txt(game.phaseT < 55 ? "ROUND " + game.round : "LUTEM!", W / 2, 80, 20, "#ffd23f", "center", "#f00");
  if (game.phase === "ko") {
    txt(game.timeUp ? "TEMPO!" : "K.O.!", W / 2, 80, 30, game.phaseT % 10 < 5 ? "#f33" : "#ff0", "center", "#f00");
    if (game.phaseT > 150) {
      const w = game.timeUp ? (a.hp / a.maxHp >= b.hp / b.maxHp ? 0 : 1) : (a.hp > 0 ? 0 : 1); game.timeUp = false;
      game.wins[w]++; game.round++;
      if (game.wins[w] >= 2) { game.winner = w; game.screen = "victory"; game.phaseT = 0; Audio8.stopMusic(); w === 0 ? Audio8.win() : Audio8.ko(); }
      else game.startRound();
    }
  }
  if (Input.wasPressed("Escape")) { Audio8.stopMusic(); game.screen = "title"; }
}
function victory() {
  game.phaseT++; g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  const won = game.winner === 0, f = game.p[game.winner]; f.state = "idle"; f.y = 130; f.x = W / 2; f.facing = 1; f.anim = game.frame; f.flash = 0; f.blocking = false; f.atk = null;
  for (let i = 0; i < 20; i++) { g.fillStyle = `hsl(${(i * 40 + game.frame * 3) % 360},90%,55%)`; g.fillRect((i * 53 + game.frame) % W, (i * 31 + game.frame * 2) % H, 3, 3); }
  f.draw(g);
  txt(won ? "VOCÊ VENCEU!" : "VOCÊ PERDEU!", W / 2, 34, 22, won ? "#ffd23f" : "#f44", "center", won ? "#fa0" : "#f00");
  txt(f.cfg.name + " é o campeão da GUERRA no P.C", W / 2, 60, 8, "#fff");
  txt(`Placar: ${game.wins[0]} x ${game.wins[1]}`, W / 2, 148, 8, "#8cf");
  if (game.frame % 40 < 28) txt("ENTER para voltar ao menu", W / 2, 164, 8, "#fff");
  if (game.phaseT > 30 && Input.wasPressed("Enter")) { Audio8.menu(); game.screen = "title"; }
}
function stageSelect() {
  g.fillStyle = "#101028"; g.fillRect(0, 0, W, H); txt("ESCOLHA O CENÁRIO", W / 2, 12, 10, "#ffd23f");
  const n = STAGES.length, tw = 80, th = 45, gap = 12, x0 = (W - (n * tw + (n - 1) * gap)) / 2;
  STAGES.forEach((s, i) => {
    const x = x0 + i * (tw + gap), y = 40, on = i === game.stageSel;
    g.fillStyle = on ? (game.frame % 20 < 10 ? "#fff" : "#ffd23f") : "#334"; g.fillRect(x - 2, y - 2, tw + 4, th + 4);
    g.fillStyle = "#000"; g.fillRect(x, y, tw, th);
    const t = s.thumb || s.image; if (!s.locked && t) g.drawImage(img(t), x, y, tw, th);
    else txt("?", x + tw / 2, y + th / 2, 20, "#556");
    txt(s.locked ? "???" : s.name, x + tw / 2, y + th + 10, 7, s.locked ? "#667" : on ? "#fff" : "#aab");
  });
  const s = STAGES[game.stageSel];
  if (!s.locked && s.image) { g.drawImage(img(s.image), 100, 108, 120, 40); g.strokeStyle = "#fff"; g.strokeRect(100.5, 108.5, 119, 39); }
  else txt("BLOQUEADO", W / 2, 128, 10, "#f66");
  txt("◀ ▶ escolher   ENTER lutar   ESC voltar", W / 2, 164, 8, "#8cf");
  const P = k => Input.wasPressed(k), mv = d => { game.stageSel = (game.stageSel + d + n) % n; Audio8.menu(); };
  if (P("ArrowLeft") || P("KeyA")) mv(-1);
  if (P("ArrowRight") || P("KeyD")) mv(1);
  if (P("Escape")) game.screen = "select";
  if ((P("Enter") || P("KeyJ")) && !s.locked) { Audio8.menu(); game.startMatch(); }
}
// ---------- loop ----------
const SCREENS = { title, select, stageSelect, fight, victory };
let last = 0, acc = 0;
function loop(ts) {
  acc += Math.min(100, ts - (last || ts)); last = ts;
  while (acc >= 1000 / 60) { acc -= 1000 / 60; game.frame++;
    if (Input.wasPressed("KeyM")) Audio8.toggleMute();
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0); g.imageSmoothingEnabled = false; SCREENS[game.screen](); Input.endFrame(); }
  requestAnimationFrame(loop);
}
// Atalho de teste: index.html?tela=luta
if (/tela=luta/.test(location.search)) game.startMatch(1);
requestAnimationFrame(loop);
