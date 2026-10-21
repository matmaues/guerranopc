// Mapas de controle. lp/hp = soco fraco/forte, lk/hk = chute fraco/forte, sp = especial simples, su = super simples
// Mapas de controle. lp/hp = soco fraco/forte, lk/hk = chute fraco/forte, sp = especial simples, su = super simples, start = pausa
// As teclas podem ser trocadas no jogo (menu CONTROLES) e ficam salvas no navegador (localStorage "guerra_controles").
const ACOES = [["up", "CIMA (pulo)"], ["down", "BAIXO"], ["left", "ESQUERDA"], ["right", "DIREITA"], ["lp", "SOCO FRACO"], ["hp", "SOCO FORTE"],
  ["lk", "CHUTE FRACO"], ["hk", "CHUTE FORTE"], ["sp", "ESPECIAL"], ["su", "SUPER"], ["start", "START / PAUSA"]];
const BINDS_PADRAO = {
  p1: { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", lp: "KeyU", hp: "KeyI", lk: "KeyJ", hk: "KeyK", sp: "KeyL", su: "KeyO", start: "KeyP" },
  p2: { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", lp: "Numpad4", hp: "Numpad5", lk: "Numpad1", hk: "Numpad2", sp: "Numpad6", su: "Numpad3", start: "NumpadAdd" },
};
let BINDS = JSON.parse(JSON.stringify(BINDS_PADRAO));
try { const sv = JSON.parse(localStorage.getItem("guerra_controles") || "null"); if (sv) for (const pl of ["p1", "p2"]) Object.assign(BINDS[pl], sv[pl] || {}); } catch (e) {}
const CONTROLS = { p1: {}, p1vs: {}, p2: {} };
function aplicarControles() {
  for (const [a] of ACOES) {
    const k1 = BINDS.p1[a], k2 = BINDS.p2[a], t = "T_" + a;          // T_* = botões de toque (sempre do P1)
    const alt = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[a];
    CONTROLS.p1[a] = [k1, t].concat(alt && !Object.values(BINDS.p1).includes(alt) ? [alt] : []);   // 1 jogador: setas também andam
    CONTROLS.p1vs[a] = [k1, t]; CONTROLS.p2[a] = [k2];
  }
}
function salvarControles() { try { localStorage.setItem("guerra_controles", JSON.stringify(BINDS)); } catch (e) {} aplicarControles(); }
aplicarControles();
const NOME_TECLA = k => !k ? "---" : k.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Numpad/, "Num ").replace("ArrowUp", "↑").replace("ArrowDown", "↓").replace("ArrowLeft", "←").replace("ArrowRight", "→")
  .replace("Comma", ",").replace("Period", ".").replace("Semicolon", ";").replace("Slash", "/").replace("Quote", "'").replace("BracketRight", "]").replace("BracketLeft", "[").replace("Space", "ESPAÇO").replace("ShiftLeft", "SHIFT E").replace("ShiftRight", "SHIFT D").replace("ControlLeft", "CTRL E").replace("ControlRight", "CTRL D");
const Input = (() => {
  const down = new Set(), pressed = new Set();
  let ultima = null;
  const press = k => { ultima = k; if (!down.has(k)) pressed.add(k); down.add(k); Audio8.init(); };
  const release = k => down.delete(k);
  addEventListener("keydown", e => { press(e.code); if (e.code.startsWith("Arrow") || e.code === "Space" || e.code === "Quote" || e.code === "Slash") e.preventDefault(); });
  addEventListener("keyup", e => release(e.code));
  addEventListener("blur", () => down.clear());
  document.querySelectorAll(".tb").forEach(b => {
    const k = b.dataset.k, t = b.dataset.a ? "T_" + b.dataset.a : null;   // tecla de menu + ação mapeada do P1
    const on = () => { press(k); if (t) press(t); }, off = () => { release(k); if (t) release(t); };
    b.addEventListener("touchstart", e => { e.preventDefault(); on(); });
    b.addEventListener("touchend", e => { e.preventDefault(); off(); });
    b.addEventListener("mousedown", on); b.addEventListener("mouseup", off);
  });
  return {
    takeLast() { const k = ultima; ultima = null; return k; }, isDown: k => down.has(k), wasPressed: k => pressed.has(k), any: ks => ks.some(k => pressed.has(k)), endFrame: () => pressed.clear(),
    player(map) { const h = {}, p = {}; for (const a in map) { h[a] = map[a].some(k => down.has(k)); p[a] = map[a].some(k => pressed.has(k)); } return { held: h, pressed: p }; },
  };
})();
// Controle humano com buffer de comandos (notação numérica: 6 = frente, 2 = baixo, 3 = baixo-frente...)
class HumanController {
  constructor(map) { this.map = map; this.hist = []; this.fr = 0; this.last = 5; }
  motion(seq, win) { let i = seq.length - 1; for (let k = this.hist.length - 1; k >= 0; k--) { const [d, t] = this.hist[k]; if (this.fr - t > win) break; if (d === seq[i] && --i < 0) return true; } return false; }
  get(me) {
    this.fr++; const { held: h, pressed: p } = Input.player(this.map), f = me.facing;
    const fwd = f === 1 ? h.right : h.left, back = f === 1 ? h.left : h.right;
    const d = 5 + (fwd ? 1 : back ? -1 : 0) + (h.up ? 3 : h.down ? -3 : 0);
    if (d !== this.last) { this.hist.push([d, this.fr]); this.last = d; if (this.hist.length > 40) this.hist.shift(); }
    let cmd = null;
    if (p.lp || p.hp) {
      const s = p.hp ? "h" : "l";
      if (me.meter >= 100 && this.motion([2, 3, 6, 2, 3, 6], 50)) cmd = { n: "super" };
      else if ((d === 3 || d === 2) && this.motion([6, 2, 3], 20)) cmd = { n: "dp", s };
      else if ((d === 6 || d === 3) && this.motion([2, 3, 6], 18)) cmd = { n: "fireball", s };
      else cmd = { n: p.hp ? "hp" : "lp" };
    } else if (p.lk || p.hk) {
      const s = p.hk ? "h" : "l";
      if ((d === 4 || d === 1) && this.motion([2, 1, 4], 18)) cmd = { n: "spin", s };
      else cmd = { n: p.hk ? "hk" : "lk" };
    } else if (p.sp) cmd = h.down ? { n: "dp", s: "h" } : back ? { n: "spin", s: "h" } : { n: "fireball", s: "h" };
    else if (p.su) cmd = { n: "super" };
    return { fwd, back, up: h.up, down: h.down, cmd };
  }
}
