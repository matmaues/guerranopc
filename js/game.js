const cv = document.getElementById("c"), g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
const W = 320, H = 180, SCALE = 2; // lógica 320x180, canvas real 640x360
function resize() { const s = Math.max(0.5, Math.floor(Math.min(innerWidth / (W * 2), innerHeight / (H * 2))) * 2 || 1); cv.style.width = W * s + "px"; cv.style.height = H * s + "px"; }
addEventListener("resize", resize); resize();
const DIFFS = [{ n: "FÁCIL", l: 1 }, { n: "NORMAL", l: 2 }, { n: "DIFÍCIL", l: 4 }];
const KEYS = { up: ["KeyW", "ArrowUp"], down: ["KeyS", "ArrowDown"], left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"], ok: ["Enter", "KeyU", "NumpadEnter"], back: ["Escape"] };
const P = k => Input.any(KEYS[k] || [k]);
const COMMANDS = [
  ["U / I", "soco fraco / forte"], ["J / K", "chute fraco / forte"], ["segure TRÁS", "defender (↓ p/ baixos)"],
  ["↓ ↘ → + soco", "projétil"], ["→ ↓ ↘ + soco", "gancho anti-aéreo"], ["↓ ↙ ← + chute", "furacão (vários hits)"],
  ["↓↘→ ↓↘→ + soco", "SUPER (barra cheia)"], ["perto → / ← + I", "agarrão"], ["L / O", "especial / super simples"], ["Enter / P", "pausa"],
];
const game = {
  screen: "title", frame: 0, coin: 0, menuSel: 0, diff: 1, mode: "arcade", sel: [0, 1], ready: [false, false], stageSel: 0, showCmds: false,
  p: [], projectiles: [], parts: [], shakeT: 0, hs: 0, freezeT: 0, freezer: null, slow: 0, flashT: 0, wins: [0, 0], round: 1, timer: 99, tAcc: 0,
  phase: "", phaseT: 0, paused: false, ladder: [], ladderPos: 0, stats: { maxCombo: 0, hits: 0 }, get fighting() { return this.phase === "fight"; },
  shake(n) { this.shakeT = Math.max(this.shakeT, n); }, hitstop(n) { this.hs = Math.max(this.hs, n); },
  spark(x, y, c, big) { for (let i = 0; i < (big ? 16 : 9); i++) { const a = Math.random() * 6.28, v = 1 + Math.random() * (big ? 4 : 2.5); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 10 + Math.random() * 8, c, sz: big ? 3 : 2 }); }
    this.parts.push({ x, y, vx: 0, vy: 0, l: 6, c: "#fff", ring: big ? 14 : 8 }); },
  dust(x, n) { for (let i = 0; i < n; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 16, y: GROUND - 2, vx: (Math.random() - 0.5) * 1.6, vy: -Math.random() * 0.8, l: 16 + Math.random() * 10, c: "#d8d0c0", sz: 3, dust: 1 }); },
  superFreeze(f) { this.freezeT = 45; this.freezer = f; this.flashT = 8; Audio8.say("super"); f.popup = { text: (f.cfg.specials || {}).super || "SUPER", t: 90 }; },
  onKO(loser) { if (this.phase !== "fight") return; this.phase = "ko"; this.phaseT = 0; this.slow = 70; this.flashT = 10; this.shake(14); Audio8.ko(); setTimeout(() => Audio8.say("ko"), 250); },
  level() { return DIFFS[this.diff].l + this.ladderPos; },
  startMatch() { this.wins = [0, 0]; this.round = 1; this.stage = STAGES[this.stageSel]; GROUND = this.stage.groundY || 152; this.screen = "fight"; this.startRound(); Audio8.startMusic(); },
  startRound() {
    const vs = this.mode === "versus";
    const c1 = new HumanController(vs ? CONTROLS.p1vs : CONTROLS.p1), c2 = vs ? new HumanController(CONTROLS.p2) : new CPUController(this.level());
    this.p = [new Fighter(CHARACTERS[this.sel[0]], 100, 1, c1), new Fighter(CHARACTERS[this.sel[1]], 220, -1, c2)];
    fixMirror(); this.p.forEach((f, i) => f.skin = skinFor(i));
    this.p.forEach(f => f.inFight = true);
    this.projectiles = []; this.parts = []; this.timer = 99; this.tAcc = 0; this.phase = "intro"; this.phaseT = 0; this.timeUp = false; this.perfect = false; this.roundWinner = -1;
  },
};
window.game = game;
// ---------- texto ----------
function txt(s, x, y, size = 8, col = "#fff", align = "center", glow, outline = 1) {
  g.font = `bold ${size}px "Courier New", monospace`; g.textAlign = align; g.textBaseline = "middle";
  if (outline) { g.fillStyle = "#000"; for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) g.fillText(s, x + a * outline * 0.6, y + b * outline * 0.6); }
  if (glow) { g.shadowColor = glow; g.shadowBlur = 6; } g.fillStyle = col; g.fillText(s, x, y); g.shadowBlur = 0;
}
function bigTxt(s, y, size, c1, c2) { const fl = game.frame % 8 < 4; txt(s, W / 2, y, size, fl ? c1 : c2, "center", c2, 2); }
// ---------- cenário ----------
const IMG = {}; const img = src => IMG[src] || (IMG[src] = Object.assign(new Image(), { src: src + "?v=" + (window.BUILD || 1) }));
STAGES.forEach(s => { if (s.image) img(s.image); if (s.thumb) img(s.thumb); });
function drawStage(t) {
  const st = game.stage; if (st && st.image) { const im = img(st.image); if (im.complete && im.naturalWidth) { g.drawImage(im, 0, 0, W, H); return; } }
  g.fillStyle = "#304060"; g.fillRect(0, 0, W, H); g.fillStyle = "#6a4526"; g.fillRect(0, GROUND, W, H - GROUND);
}
// ---------- retratos ----------
const PORTRAITS = CHARACTERS.map(c => new Fighter(c, 0, 1, null));
const skinsOf = i => (CHARACTERS[i] && CHARACTERS[i].skins) || [{ nome: "Original" }];
function fixMirror() { if (!game.skin) game.skin = [0, 0]; if (game.sel[0] === game.sel[1] && game.skin[0] === game.skin[1] && skinsOf(game.sel[1]).length > 1) game.skin[1] = (game.skin[1] + 1) % skinsOf(game.sel[1]).length; }
function skinFor(pi) { const l = skinsOf(game.sel[pi]); return l[((game.skin || [0, 0])[pi] || 0) % l.length]; }
function portrait(i, x, y, sc = 1, pose = "idle", flip = 1, dark, skin) {
  const f = PORTRAITS[i]; f.skin = skin || null; f.x = 0; f.y = 0; f.facing = flip; f.state = "idle"; f.anim = game.frame; f.flash = 0; f.input = {}; f.inFight = false; const op = f.pose; f.pose = () => pose;
  g.save(); try { g.translate(x, y); g.scale(sc, sc); if (dark) g.filter = "brightness(0)"; f.draw(g); } catch (e) { console.error("retrato", e); } finally { g.restore(); f.pose = op; }
}
function drawCommands(x, y, lh = 8, size = 6, cols = 2) {
  const per = Math.ceil(COMMANDS.length / cols);
  COMMANDS.forEach(([k, d], i) => { const cx = x + Math.floor(i / per) * 150, cy = y + (i % per) * lh; txt(k, cx, cy, size, "#ffd23f", "left"); txt(d, cx + 62, cy, size, "#fff", "left"); });
}
// ---------- TÍTULO ----------
function title() {
  const t = game.frame; g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? "#223" : "#335"; g.fillRect((i * 37 + t * (1 + i % 3)) % W, (i * 23) % H, 2, 2); }
  const fl = Math.floor(t / 8) % 2, hue = (t * 4) % 360;
  txt("GUERRA", W / 2, 38, 40, fl ? "#ff3b3b" : "#ffd23f", "center", fl ? "#ff0" : "#f00", 2);
  txt("no", W / 2, 62, 10, "#aaa");
  txt("P.C", W / 2, 86, 40, `hsl(${hue},100%,60%)`, "center", `hsl(${(hue + 180) % 360},100%,60%)`, 2);
  if (game.showCmds) { g.fillStyle = "#000c"; g.fillRect(10, 20, 300, 150); txt("COMANDOS", W / 2, 30, 9, "#ffd23f"); drawCommands(20, 46, 11, 6, 1); txt("ESC/ENTER voltar", W / 2, 162, 7, "#8cf"); if (P("ok") || P("back")) { game.showCmds = false; Audio8.menu(); } return; }
  if (game.coin === 0) {
    if (Math.floor(t / 25) % 2) txt("INSERT COIN", W / 2, 124, 12, "#fff");
    txt("aperte ENTER para pôr uma ficha", W / 2, 142, 7, "#8cf");
    if (P("ok") || Input.wasPressed("Space")) { game.coin = 1; Audio8.coin(); }
  } else if (game.coin === 1) {
    if (Math.floor(t / 15) % 2) txt("APERTE START", W / 2, 124, 12, "#ffd23f");
    if (P("ok")) { game.coin = 2; game.menuSel = 0; Audio8.menu(); }
  } else {
    const items = ["ARCADE", "LUTA LIVRE (VS CPU)", "VERSUS (2 JOGADORES)", "DIFICULDADE: ◀ " + DIFFS[game.diff].n + " ▶", "COMANDOS"];
    items.forEach((s, i) => txt((i === game.menuSel ? "▶ " : "  ") + s, W / 2, 110 + i * 11, 8, i === game.menuSel ? "#ffd23f" : "#bbb"));
    if (P("up")) { game.menuSel = (game.menuSel + 4) % 5; Audio8.menu(); }
    if (P("down")) { game.menuSel = (game.menuSel + 1) % 5; Audio8.menu(); }
    if (game.menuSel === 3 && (P("left") || P("right"))) { game.diff = (game.diff + (P("left") ? 2 : 1)) % 3; Audio8.menu(); }
    if (P("ok")) { Audio8.menu();
      if (game.menuSel <= 2) { game.mode = ["arcade", "free", "versus"][game.menuSel]; game.ready = [false, false]; game.ladderPos = 0; game.screen = "select"; game.sel = [0, 1]; }
      if (game.menuSel === 3) game.diff = (game.diff + 1) % 3;
      if (game.menuSel === 4) game.showCmds = true; }
    if (P("back")) game.coin = 1;
  }
  txt("CRÉDITO " + Math.min(1, game.coin), W - 6, H - 6, 7, "#aaa", "right");
  txt("M = som", 6, H - 6, 7, "#666", "left");
}
// ---------- SELEÇÃO ----------
const RANDOM = CHARACTERS.length; // célula "ALEATÓRIO" (Luta Livre)
function selectable(i, pi = 0) { if (i === RANDOM) return game.mode === "free" && pi === 1; return game.mode !== "arcade" || !CHARACTERS[i].boss; }
function select() {
  g.fillStyle = "#0c0c24"; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) { g.fillStyle = "#11113a"; g.fillRect(0, y, W, 1); }
  const free = game.mode === "free", cpuPick = free && game.ready[0];
  txt(cpuPick ? "ESCOLHA O ADVERSÁRIO" : "ESCOLHA SEU LUTADOR", W / 2, 9, 10, cpuPick ? "#3b9bff" : "#ffd23f", "center", "#f80");
  const n = CHARACTERS.length + (free ? 1 : 0), gap = 6, cw = Math.min(52, Math.floor((W - 12 - (n - 1) * gap) / n)), x0 = (W - (n * cw + (n - 1) * gap)) / 2, y0 = 18, ch = 56;
  if (free) { const x = x0 + RANDOM * (cw + gap); g.fillStyle = "#000"; g.fillRect(x, y0, cw, ch); g.fillStyle = "#333a"; g.fillRect(x + 1, y0 + 1, cw - 2, ch - 2);
    txt("?", x + cw / 2, y0 + ch / 2, 24, game.frame % 20 < 10 ? "#ffd23f" : "#fff"); txt("ALEATÓRIO", x + cw / 2, y0 + ch + 6, 6, cpuPick ? "#fff" : "#666"); }
  CHARACTERS.forEach((c, i) => {
    const x = x0 + i * (cw + gap), lock = !selectable(i);
    g.fillStyle = "#000"; g.fillRect(x, y0, cw, ch); g.fillStyle = c.color + "55"; g.fillRect(x + 1, y0 + 1, cw - 2, ch - 2);
    g.save(); g.beginPath(); g.rect(x + 1, y0 + 1, cw - 2, ch - 2); g.clip(); portrait(i, x + cw / 2, y0 + ch + 2, 1.05, "idle", 1, lock, cpuPick && game.sel[1] === i ? skinFor(1) : game.sel[0] === i ? skinFor(0) : game.sel[1] === i && game.mode === "versus" ? skinFor(1) : null); g.restore();
    if (lock) txt("?", x + cw / 2, y0 + ch / 2, 20, "#888");
    txt(lock ? "???" : c.name.toUpperCase(), x + cw / 2, y0 + ch + 6, 6, "#fff");
  });
  const cur = (pi, col) => { const x = x0 + game.sel[pi] * (cw + gap), blink = game.ready[pi] || game.frame % 16 < 11, both = game.mode === "versus" && game.sel[0] === game.sel[1];
    if (blink) { g.strokeStyle = col; g.lineWidth = 2; const o = both && pi ? 3 : 0; g.strokeRect(x - 1 + o, y0 - 1 + o, cw + 2 - o * 2, ch + 2 - o * 2); }
    txt(pi ? (game.mode === "free" ? "CPU" : "2P") : "1P", x + (pi ? cw - 9 : 8), y0 + 5, 7, col); };
  cur(0, "#ff3b3b"); if (game.mode === "versus" || cpuPick) cur(1, "#3b9bff");
  const info = (pi, x, al) => { if (game.sel[pi] === RANDOM) { txt("ALEATÓRIO", x, 92, 9, "#3b9bff", al); txt("sorteado na hora da luta", x, 104, 6, "#ccc", al); return; } const c = CHARACTERS[game.sel[pi]];
    txt(c.name, x, 92, 9, pi ? "#3b9bff" : "#ff3b3b", al);
    [["VEL", c.stats.speed], ["FOR", c.stats.power], ["VID", c.stats.health]].forEach(([l, v], j) => { const bx = al === "left" ? x + 20 : x - 70, by = 101 + j * 7;
      txt(l, al === "left" ? x : x - 74, by, 6, "#ccc", al === "left" ? "left" : "right"); g.fillStyle = "#333"; g.fillRect(bx, by - 2, 50, 4); g.fillStyle = c.accent; g.fillRect(bx, by - 2, v * 5, 4); });
    if (c.alturaReal) txt("ALT " + alturaTxt(c), x, 122, 6, "#ffd23f", al);
    if (skinsOf(game.sel[pi]).length > 1) txt("▲▼ SKIN: " + skinFor(pi).nome, al === "left" ? x + 80 : x - 80, 122, 6, "#8cf", al);
    if (game.ready[pi]) txt("PRONTO!", x, 130, 7, "#7f7", al); };
  info(0, 10, "left");
  if (game.mode === "versus" || cpuPick) info(1, W - 10, "right");
  else if (free) { txt("LUTA LIVRE: depois escolha", W - 10, 96, 6, "#ccc", "right"); txt("O ADVERSÁRIO (CPU)", W - 10, 106, 8, "#3b9bff", "right"); txt("Dificuldade: " + DIFFS[game.diff].n, W - 10, 118, 6, "#8cf", "right"); }
  else { txt("ARCADE: vença todos e enfrente o", W - 10, 96, 6, "#ccc", "right"); txt("CHEFÃO!", W - 10, 106, 8, "#e83b3b", "right"); txt("Dificuldade: " + DIFFS[game.diff].n, W - 10, 118, 6, "#8cf", "right"); }
  g.fillStyle = "#0008"; g.fillRect(4, 134, W - 8, 44); drawCommands(10, 139, 8.4, 6, 2);
  if (!game.skin) game.skin = [0, 0];
  const skinMv = (pi, d) => { if (game.ready[pi] || game.sel[pi] === RANDOM) return; const L = skinsOf(game.sel[pi]).length; game.skin[pi] = ((game.skin[pi] || 0) + d + L) % L;
    if (game.mode === "versus" && game.sel[0] === game.sel[1] && game.skin[0] === game.skin[1]) game.skin[pi] = (game.skin[pi] + d + L) % L; Audio8.menu(); };
  const move = (pi, d) => { if (game.ready[pi]) return; let s = game.sel[pi]; do { s = (s + d + n) % n; } while (!selectable(s, pi)); game.sel[pi] = s; Audio8.menu(); };
  if (game.mode === "versus") {
    if (Input.any(["KeyA"])) move(0, -1); if (Input.any(["KeyD"])) move(0, 1); if (Input.any(["KeyW"])) skinMv(0, -1); if (Input.any(["KeyS"])) skinMv(0, 1);
    if (Input.any(["ArrowUp"])) skinMv(1, -1); if (Input.any(["ArrowDown"])) skinMv(1, 1);
    if (Input.any(["ArrowLeft"])) move(1, -1); if (Input.any(["ArrowRight"])) move(1, 1);
    if (Input.any(["Enter", "KeyU"]) && !game.ready[0]) { game.ready[0] = true; Audio8.coin(); }
    if (Input.any(["NumpadEnter", "Numpad4", "Comma"]) && !game.ready[1]) { game.ready[1] = true; Audio8.coin(); }
    if (game.ready[0] && game.ready[1]) { game.readyT = (game.readyT || 0) + 1; if (game.readyT > 30) { game.readyT = 0; game.screen = "stageSelect"; } }
  } else if (cpuPick) {
    if (P("left")) move(1, -1); if (P("right")) move(1, 1); if (P("up")) skinMv(1, -1); if (P("down")) skinMv(1, 1);
    if (P("ok")) { Audio8.coin(); if (game.sel[1] === RANDOM) { game.randomCPU = true; } else game.randomCPU = false; game.ready[1] = true; game.screen = "stageSelect"; }
    if (P("back")) { game.ready[0] = false; Audio8.menu(); return; }
  } else {
    if (P("left")) move(0, -1); if (P("right")) move(0, 1); if (P("up")) skinMv(0, -1); if (P("down")) skinMv(0, 1);
    if (P("ok")) { game.ready[0] = true; Audio8.coin(); if (free) { if (!selectable(game.sel[1], 1) || game.sel[1] === game.sel[0]) game.sel[1] = (game.sel[0] + 1) % CHARACTERS.length; } else game.screen = "stageSelect"; }
  }
  if (P("back")) { game.screen = "title"; game.ready = [false, false]; }
}
function stageSelect() {
  g.fillStyle = "#101028"; g.fillRect(0, 0, W, H); txt("ESCOLHA O CENÁRIO", W / 2, 12, 10, "#ffd23f");
  const n = STAGES.length, tw = 80, th = 45, gap = 12, x0 = (W - (n * tw + (n - 1) * gap)) / 2;
  STAGES.forEach((s, i) => {
    const x = x0 + i * (tw + gap), y = 40, on = i === game.stageSel;
    g.fillStyle = on ? (game.frame % 20 < 10 ? "#fff" : "#ffd23f") : "#334"; g.fillRect(x - 2, y - 2, tw + 4, th + 4);
    g.fillStyle = "#000"; g.fillRect(x, y, tw, th);
    const t = s.thumb || s.image; if (!s.locked && t) g.drawImage(img(t), x, y, tw, th); else txt("?", x + tw / 2, y + th / 2, 20, "#556");
    txt(s.locked ? "???" : s.name, x + tw / 2, y + th + 10, 7, s.locked ? "#667" : on ? "#fff" : "#aab");
  });
  const s = STAGES[game.stageSel];
  if (!s.locked && s.image) { g.drawImage(img(s.image), 100, 108, 120, 40); g.strokeStyle = "#fff"; g.lineWidth = 1; g.strokeRect(100.5, 108.5, 119, 39); } else txt("BLOQUEADO", W / 2, 128, 10, "#f66");
  txt("◀ ▶ escolher   ENTER confirmar   ESC voltar", W / 2, 164, 8, "#8cf");
  const mv = d => { game.stageSel = (game.stageSel + d + n) % n; Audio8.menu(); };
  if (P("left")) mv(-1); if (P("right")) mv(1);
  if (P("back")) { game.screen = "select"; game.ready = [false, false]; if (game.randomCPU) game.sel[1] = RANDOM; }
  if (P("ok") && !s.locked) { Audio8.menu();
    if (game.mode === "arcade") { const others = CHARACTERS.map((c, i) => i).filter(i => i !== game.sel[0] && !CHARACTERS[i].boss).sort(() => Math.random() - 0.5);
      game.ladder = others.concat(CHARACTERS.findIndex(c => c.boss)); game.ladderPos = 0; game.sel[1] = game.ladder[0]; }
    if (game.mode === "free" && game.randomCPU) game.sel[1] = Math.floor(Math.random() * CHARACTERS.length);
    toVS(); }
}
// ---------- VS ----------
function toVS() { fixMirror(); game.screen = "vs"; game.vsT = 0; Audio8.stopMusic(); }
function vs() {
  const t = ++game.vsT; if (t === 20) Audio8.say("vs");
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  const sl = Math.min(1, t / 20);
  g.fillStyle = "#7a1010"; g.beginPath(); g.moveTo(0, 0); g.lineTo(W / 2 + 20, 0); g.lineTo(W / 2 - 20, H); g.lineTo(0, H); g.fill();
  g.fillStyle = "#10307a"; g.beginPath(); g.moveTo(W, 0); g.lineTo(W / 2 + 22, 0); g.lineTo(W / 2 - 18, H); g.lineTo(W, H); g.fill();
  for (let i = 0; i < 12; i++) { g.fillStyle = "#fff2"; g.fillRect(((i * 53 + t * 6) % (W + 40)) - 40, (i * 29) % H, 30, 2); }
  portrait(game.sel[0], -60 + sl * 140, 150, 2.4, "idle", 1, 0, skinFor(0)); portrait(game.sel[1], W + 60 - sl * 140, 150, 2.4, "idle", -1, 0, skinFor(1));
  txt(CHARACTERS[game.sel[0]].name.toUpperCase(), 10, 160, 12, "#fff", "left"); txt(CHARACTERS[game.sel[1]].name.toUpperCase(), W - 10, 160, 12, "#fff", "right");
  txt(alturaTxt(CHARACTERS[game.sel[0]]), 10, 172, 7, "#ffd23f", "left"); txt(alturaTxt(CHARACTERS[game.sel[1]]), W - 10, 172, 7, "#ffd23f", "right");
  if (t > 20) txt("VS", W / 2, 80, 34 + Math.max(0, 10 - (t - 20)) * 3, game.frame % 6 < 3 ? "#ffd23f" : "#fff", "center", "#f80", 2);
  if (game.mode === "free") txt("LUTA LIVRE", W / 2, 14, 9, "#fff");
  if (game.mode === "arcade") { const boss = CHARACTERS[game.sel[1]].boss; txt(boss ? "LUTA FINAL: CHEFÃO!" : `LUTA ${game.ladderPos + 1} DE ${game.ladder.length}`, W / 2, 14, 9, boss ? "#f44" : "#fff"); }
  if (t > 160 || (t > 30 && P("ok"))) game.startMatch();
}
// ---------- LUTA ----------
function updateFight() {
  const [a, b] = game.p, live = game.phase === "fight";
  for (const [f, o] of [[a, b], [b, a]]) {
    const inp = f.ctrl.get(f, o, game) || {}; f.input = live || game.phase === "ko" ? inp : {};
    if (live && inp.cmd) f.buffer = { cmd: inp.cmd, age: 0 };
    f.guardNear = o.state === "attack" || game.projectiles.some(p => p.owner === o);
  }
  if (game.freezeT > 0) { game.freezeT--; return; }
  if (game.hs > 0) { game.hs--; return; }
  if (game.slow > 0) { game.slow--; if (game.frame % 3) return; }
  a.update(b, game); b.update(a, game);
  // empurrar
  if (Math.abs(a.x - b.x) < 18 && Math.abs(a.y - b.y) < 40) { const d = a.x < b.x ? -1 : a.x > b.x ? 1 : -a.facing, push = (18 - Math.abs(a.x - b.x)) / 2;
    a.x += d * push; b.x -= d * push; [a, b].forEach(f => f.x = Math.max(14, Math.min(STAGE_W - 14, f.x)));
    if (Math.abs(a.x - b.x) < 18) { if (a.x <= 15) b.x = a.x + 18; else if (b.x <= 15) a.x = b.x + 18; else if (a.x >= STAGE_W - 15) b.x = a.x - 18; else if (b.x >= STAGE_W - 15) a.x = b.x - 18; } }
  // projéteis
  game.projectiles.forEach(p => { p.x += p.vx; p.life--; if (p.cd > 0) p.cd--; });
  for (const p of game.projectiles) for (const q of game.projectiles) if (p !== q && p.owner !== q.owner && p.hits > 0 && q.hits > 0 && Math.abs(p.x - q.x) < p.r + q.r) { p.hits--; q.hits--; game.spark((p.x + q.x) / 2, p.y, "#fff", 1); Audio8.block(); }
  game.projectiles.forEach(p => { const o = p.owner === a ? b : a; if (p.hits <= 0 || p.cd > 0) return;
    const [x1, y1, x2, y2] = o.hurtbox(); if (p.x + p.r > x1 && p.x - p.r < x2 && p.y + p.r > y1 && p.y - p.r < y2 && o.vulnerable(p.mv)) {
      p.hits--; p.cd = 6; o.takeHit(p.owner, { ...p.mv, dmg: p.mv.dmg * p.owner.pow / p.owner.pow }, game, p.superP ? p.hits <= 0 : false); if (p.superP) { game.flashT = 2; } } });
  game.projectiles = game.projectiles.filter(p => p.hits > 0 && p.life > 0 && p.x > -20 && p.x < W + 20);
  if (live) { if (++game.tAcc >= 60) { game.tAcc = 0; game.timer--; if (game.timer <= 10 && game.timer > 0) Audio8.tick(); }
    if (game.timer <= 0) { game.timer = 0; game.phase = "ko"; game.phaseT = 0; game.timeUp = true; Audio8.ko(); } }
}
function drawProjectile(p) {
  const x = Math.round(p.x), y = Math.round(p.y), c = p.owner.cfg.accent, big = p.superP ? 2 : 1, F = Math.sign(p.vx);
  for (let i = 1; i < 4; i++) { g.fillStyle = c + ["aa", "66", "33"][i - 1]; g.fillRect(x - F * i * 6 * big - 3, y - 3 * big + i, 6 * big, (6 - i) * big); }
  const ps = p.owner.cfg.projSprite && img(p.owner.cfg.projSprite);
  if (ps && ps.complete && ps.naturalWidth) { // sprite próprio (ex.: taco do Maués): gira em passos de 90° p/ manter os pixels nítidos; espelha pelo lado
    const k = Math.floor(game.frame / 4) % 4, s2 = 0.5;  // 1 pixel de arte = mesmo tamanho do Maués (super: brilho + 5 acertos)
    g.save(); g.translate(x, y); g.scale(F, 1); g.rotate(k * Math.PI / 2); g.scale(s2, s2); g.drawImage(ps, -ps.width / 2, -ps.height / 2);
    if (p.superP && game.frame % 4 < 2) { g.globalAlpha = 0.35; g.globalCompositeOperation = "lighter"; g.drawImage(ps, -ps.width / 2, -ps.height / 2); }
    g.restore(); }
  else if (p.kind === "chinelo") { g.save(); g.translate(x, y); g.rotate(game.frame * 0.4 * F); g.scale(big, big); g.fillStyle = "#111"; g.fillRect(-7, -4, 14, 8); g.fillStyle = "#fff"; g.fillRect(-6, -3, 12, 6); g.fillStyle = "#3c3cc8"; g.fillRect(-1, -3, 2, 4); g.fillRect(-4, -1, 8, 1); g.restore(); }
  else if (p.kind === "granada") { g.save(); g.translate(x, y); g.scale(big, big); g.fillStyle = "#111"; g.fillRect(-5, -5, 10, 10); g.fillStyle = "#4a5530"; g.fillRect(-4, -4, 8, 8); g.fillStyle = "#6b6e45"; g.fillRect(-3, -3, 3, 3); g.fillStyle = "#999"; g.fillRect(-1, -7, 3, 3); g.fillStyle = game.frame % 6 < 3 ? "#ff0" : "#f80"; g.fillRect(1, -8, 2, 2); g.restore(); }
  else { const r = 5 * big; g.fillStyle = c; g.fillRect(x - r, y - r, r * 2, r * 2); g.fillStyle = "#fff"; g.fillRect(x - r / 2, y - r / 2, r, r); }
}
function hud() {
  const [a, b] = game.p, bw = 124;
  const hb = (f, x, rev) => { g.fillStyle = "#000"; g.fillRect(x - 2, 6, bw + 4, 11); g.fillStyle = "#b00"; g.fillRect(x, 8, bw, 7);
    const w = Math.ceil(bw * f.hp / f.maxHp); g.fillStyle = f.hp / f.maxHp < 0.25 && game.frame % 20 < 10 ? "#f80" : "#ffe000"; g.fillRect(rev ? x + bw - w : x, 8, w, 7); g.fillStyle = "#fff6"; g.fillRect(rev ? x + bw - w : x, 8, w, 2); };
  hb(a, 6, true); hb(b, W - 6 - bw, false);
  const vs = game.mode === "versus";
  txt(a.cfg.name.toUpperCase(), 6, 23, 7, "#fff", "left"); txt(b.cfg.name.toUpperCase() + (vs ? "" : " (CPU)"), W - 6, 23, 7, "#fff", "right");
  g.fillStyle = "#000"; g.fillRect(W / 2 - 15, 4, 30, 20); txt(String(game.timer).padStart(2, "0"), W / 2, 14, 16, game.timer <= 10 ? "#f44" : "#ffd23f", "center", null, 1);
  for (let i = 0; i < 2; i++) { const v = (x, on) => { g.fillStyle = "#000"; g.fillRect(x - 1, 27, 9, 9); g.fillStyle = on ? "#ffd23f" : "#333"; g.fillRect(x, 28, 7, 7); if (on) txt("V", x + 3.5, 32, 6, "#a00", "center", null, 0); };
    v(110 - i * 11, game.wins[0] > i); v(203 + i * 11, game.wins[1] > i); }
  const sm = (f, x, rev) => { const w = 70, full = f.meter >= 100; g.fillStyle = "#000"; g.fillRect(x - 1, H - 12, w + 2, 6); g.fillStyle = "#226"; g.fillRect(x, H - 11, w, 4);
    g.fillStyle = full ? (game.frame % 10 < 5 ? "#fff" : "#3bf") : "#36f"; const fw = w * f.meter / 100; g.fillRect(rev ? x + w - fw : x, H - 11, fw, 4);
    txt(full ? "SUPER!" : "SUPER", rev ? x + w : x, H - 17, 6, full ? "#ffd23f" : "#99c", rev ? "right" : "left"); };
  sm(a, 6, false); sm(b, W - 76, true);
  [a, b].forEach((f, i) => { if (f.comboShow && f.comboShow.n >= 2) { const s = 1 + Math.max(0, f.comboShow.t - 60) * 0.08; txt(f.comboShow.n + " HITS!", i ? W - 8 : 8, 52, 12 * s, game.frame % 6 < 3 ? "#ffd23f" : "#ff6a00", i ? "right" : "left", "#f00", 1.5); }
    if (f.popup) txt(f.popup.text, Math.max(40, Math.min(W - 40, f.x)), f.y - 64, 7, "#fff", "center", f.cfg.accent); });
  txt(game.mode === "versus" ? "P1: WASD U I J K L O   P2: setas + Num 4 5 1 2 6 3   Enter/P pausa" : "WASD/setas  U/I soco  J/K chute  L esp.  O super  Enter pausa", W / 2, H - 3, 5, "#ddd", "center", null, 0.6);
}
function fight() {
  game.phaseT++;
  if (!game.paused) updateFight();
  const [a, b] = game.p;
  if (game.phase === "intro") { if (game.phaseT === 10) Audio8.say("round"); if (game.phaseT === 80) Audio8.say("fight"); if (game.phaseT > 110) game.phase = "fight"; }
  if (game.phase === "ko" && game.phaseT > 140) {
    let w; if (game.timeUp) w = a.hp / a.maxHp > b.hp / b.maxHp ? 0 : b.hp / b.maxHp > a.hp / a.maxHp ? 1 : -1; else w = a.hp > 0 ? 0 : b.hp > 0 ? 1 : -1;
    game.roundWinner = w; game.phase = "roundEnd"; game.phaseT = 0;
    if (w >= 0) { game.wins[w]++; game.perfect = game.p[w].hp >= game.p[w].maxHp; setTimeout(() => Audio8.say(game.perfect ? "perfect" : "win"), 300); }
  }
  if (game.phase === "roundEnd") {
    game.p.forEach((f, i) => { if (i === game.roundWinner && f.grounded && FREE.concat(["blockstun", "hitstun"]).includes(f.state)) f.state = "win"; });
    if (game.phaseT > 150) { const w = game.roundWinner; if (w >= 0 && game.wins[w] >= 2) endMatch(w); else { game.round++; game.startRound(); } return; }
  }
  // desenho
  g.save(); if (game.shakeT > 0) { g.translate(Math.round((Math.random() - .5) * game.shakeT), Math.round((Math.random() - .5) * game.shakeT)); if (!game.hs) game.shakeT *= 0.85; if (game.shakeT < 0.5) game.shakeT = 0; }
  drawStage(game.frame);
  if (game.freezeT > 0) { g.fillStyle = "#000a"; g.fillRect(0, 0, W, H); }
  const order = game.freezer && game.freezeT > 0 ? [game.p.find(f => f !== game.freezer), game.freezer] : [b, a];
  order.forEach(f => f.draw(g));
  game.projectiles.forEach(drawProjectile);
  game.parts = game.parts.filter(s => { s.x += s.vx; s.y += s.vy; if (s.dust) { s.vx *= 0.92; s.vy *= 0.92; } s.l--;
    if (s.ring) { g.strokeStyle = "#fff"; g.lineWidth = 1; g.strokeRect(s.x - s.ring * (1 - s.l / 6), s.y - s.ring * (1 - s.l / 6), s.ring * 2 * (1 - s.l / 6), s.ring * 2 * (1 - s.l / 6)); }
    else { g.fillStyle = s.dust ? `rgba(216,208,192,${s.l / 26})` : (s.l % 4 < 2 ? s.c : "#fff"); g.fillRect(s.x | 0, s.y | 0, s.sz, s.sz); } return s.l > 0; });
  g.restore();
  if (game.flashT > 0) { g.fillStyle = `rgba(255,255,255,${game.flashT / 12})`; g.fillRect(0, 0, W, H); game.flashT--; }
  hud();
  if (game.freezeT > 0 && game.freezer) txt(game.freezer.cfg.specials.super + "!", W / 2, 64, 14, "#ffd23f", "center", "#f00", 2);
  if (game.phase === "intro") { if (game.phaseT < 75) bigTxt("ROUND " + game.round, 80, 24, "#ffd23f", "#f60"); else bigTxt("FIGHT!", 80, 34, "#ff3b3b", "#ff0"); }
  if (game.phase === "ko") bigTxt(game.timeUp ? "TEMPO!" : "K.O.", 78, game.timeUp ? 28 : 46, "#ff2020", "#ffd23f");
  if (game.phase === "roundEnd") { const w = game.roundWinner;
    txt(w < 0 ? "EMPATE" : (game.mode === "versus" ? `P${w + 1} VENCE!` : w === 0 ? "VOCÊ VENCEU!" : "VOCÊ PERDEU!"), W / 2, 70, 16, "#fff", "center", "#00f", 1.5);
    if (game.perfect && w >= 0) bigTxt("PERFECT", 96, 26, "#ffd23f", "#f0f"); }
  if (game.paused) pauseMenu();
  else if (Input.any(["Enter", "KeyP"]) && (game.phase === "fight" || game.phase === "intro")) { game.paused = true; Audio8.menu(); }
}
function pauseMenu() {
  g.fillStyle = "#000c"; g.fillRect(0, 0, W, H); txt("PAUSA", W / 2, 18, 16, "#ffd23f", "center", "#f80", 1.5);
  txt("COMANDOS (direções relativas: → = para frente)", W / 2, 36, 6, "#8cf"); drawCommands(14, 48, 10, 6, 1);
  txt("P2 (Versus): setas | Num4/5 soco | Num1/2 chute | Num6 esp. | Num3 super", W / 2, 152, 6, "#ccc");
  txt("ENTER/P continuar    ESC sair para o título", W / 2, 166, 7, "#fff");
  if (Input.any(["Enter", "KeyP"])) { game.paused = false; Audio8.menu(); }
  if (P("back")) { game.paused = false; Audio8.stopMusic(); game.screen = "title"; game.coin = 1; }
}
function endMatch(w) { game.matchWinner = w; game.screen = "quote"; game.qT = 0; Audio8.stopMusic(); if (game.mode === "versus" || w === 0) Audio8.win(); else Audio8.ko(); }
function quote() {
  const t = ++game.qT, w = game.matchWinner, c = CHARACTERS[game.sel[w]];
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H); g.fillStyle = c.color; g.fillRect(0, 20, 130, 140);
  for (let i = 0; i < 20; i++) { g.fillStyle = "#fff1"; g.fillRect(0, 20 + i * 7, 130, 3); }
  portrait(game.sel[w], 65, 150, 2.4, "win", 1, 0, skinFor(w));
  txt(c.name.toUpperCase(), 140, 40, 12, "#ffd23f", "left");
  g.fillStyle = "#111"; g.fillRect(138, 56, 174, 60); g.strokeStyle = "#fff"; g.lineWidth = 1; g.strokeRect(138.5, 56.5, 173, 59);
  const q = "“" + c.quote + "”", shown = q.slice(0, Math.floor(t / 2)); const words = shown.split(" "); let line = "", ly = 68;
  words.forEach(wd => { if ((line + wd).length > 26) { txt(line, 146, ly, 7, "#fff", "left", null, 0); line = ""; ly += 11; } line += wd + " "; }); txt(line, 146, ly, 7, "#fff", "left", null, 0);
  if (t > 60 && game.frame % 30 < 20) txt("ENTER", 225, 150, 8, "#8cf");
  if (t > 40 && P("ok") || t > 420) {
    if (game.mode !== "arcade") { game.screen = "select"; game.ready = [false, false]; if (game.mode === "free" && game.randomCPU) game.sel[1] = RANDOM; }
    else if (w === 0) { if (game.ladderPos >= game.ladder.length - 1) { game.screen = "ending"; game.eT = 0; Audio8.win(); } else { game.ladderPos++; game.sel[1] = game.ladder[game.ladderPos]; toVS(); } }
    else { game.screen = "continue"; game.cT = 600; }
  }
}
function cont() {
  game.cT--; const n = Math.ceil(game.cT / 60) - 1;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  portrait(game.sel[0], W / 2, 120, 2, "hit", 1, 0, skinFor(0));
  txt("CONTINUAR?", W / 2, 30, 18, "#fff", "center", "#f00", 1.5);
  if (n >= 0) txt(String(n), W / 2, 150, 30, "#ffd23f", "center", "#f80", 2);
  if (game.cT % 60 === 0 && n >= 0) Audio8.tick();
  txt("aperte ENTER", W / 2, 172, 7, "#8cf");
  if (P("ok")) { Audio8.coin(); toVS(); }
  if (game.cT <= 0) { game.screen = "gameover"; game.goT = 0; }
}
function gameover() { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); bigTxt("GAME OVER", 90, 26, "#f33", "#800"); if (++game.goT > 180 || (game.goT > 40 && P("ok"))) { game.screen = "title"; game.coin = 0; } }
function ending() {
  const t = ++game.eT; g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { g.fillStyle = `hsl(${(i * 40 + t * 3) % 360},90%,55%)`; g.fillRect((i * 53 + t * (1 + i % 3)) % W, (i * 31 + t * 2) % H, 3, 3); }
  portrait(game.sel[0], W / 2, 150, 2.2, "win", 1, 0, skinFor(0));
  bigTxt("PARABÉNS!", 24, 22, "#ffd23f", "#f80");
  txt(CHARACTERS[game.sel[0]].name + " derrotou o Chefão e é o campeão", W / 2, 44, 7, "#fff"); txt("da GUERRA no P.C!", W / 2, 54, 8, "#ff3b3b");
  if (t > 90 && game.frame % 30 < 20) txt("ENTER", W / 2, 172, 8, "#8cf");
  if (t > 90 && P("ok")) { game.screen = "title"; game.coin = 0; }
}
// ---------- loop ----------
const SCREENS = { title, select, stageSelect, vs, fight, quote, continue: cont, gameover, ending };
let last = 0, acc = 0;
function loop(ts) {
  acc += Math.min(100, ts - (last || ts)); last = ts;
  while (acc >= 1000 / 60) { acc -= 1000 / 60; game.frame++;
    if (Input.wasPressed("KeyM")) Audio8.toggleMute();
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0); g.imageSmoothingEnabled = false; g.filter = "none";
    try { SCREENS[game.screen](); } catch (e) { console.error(e); if (!game.errShown) { game.errShown = 1; } }
    if (Audio8.muted) txt("MUDO", W - 4, H - 24, 6, "#f66", "right");
    Input.endFrame(); }
  requestAnimationFrame(loop);
}
if (/tela=luta/.test(location.search)) { game.sel = [0, 1]; game.startMatch(); }
requestAnimationFrame(loop);
