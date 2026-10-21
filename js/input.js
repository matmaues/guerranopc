// Mapas de controle. lp/hp = soco fraco/forte, lk/hk = chute fraco/forte, sp = especial simples, su = super simples
const CONTROLS = {
  p1: { left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"], up: ["KeyW", "ArrowUp"], down: ["KeyS", "ArrowDown"],
        lp: ["KeyU"], hp: ["KeyI"], lk: ["KeyJ"], hk: ["KeyK"], sp: ["KeyL"], su: ["KeyO"] },
  p1vs: { left: ["KeyA"], right: ["KeyD"], up: ["KeyW"], down: ["KeyS"], lp: ["KeyU"], hp: ["KeyI"], lk: ["KeyJ"], hk: ["KeyK"], sp: ["KeyL"], su: ["KeyO"] },
  p2: { left: ["ArrowLeft"], right: ["ArrowRight"], up: ["ArrowUp"], down: ["ArrowDown"],
        lp: ["Numpad4", "Comma"], hp: ["Numpad5", "Period"], lk: ["Numpad1", "Semicolon"], hk: ["Numpad2", "Slash"], sp: ["Numpad6", "Quote"], su: ["Numpad3", "BracketRight"] },
};
const Input = (() => {
  const down = new Set(), pressed = new Set();
  const press = k => { if (!down.has(k)) pressed.add(k); down.add(k); Audio8.init(); };
  const release = k => down.delete(k);
  addEventListener("keydown", e => { press(e.code); if (e.code.startsWith("Arrow") || e.code === "Space" || e.code === "Quote" || e.code === "Slash") e.preventDefault(); });
  addEventListener("keyup", e => release(e.code));
  addEventListener("blur", () => down.clear());
  document.querySelectorAll(".tb").forEach(b => {
    const k = b.dataset.k;
    b.addEventListener("touchstart", e => { e.preventDefault(); press(k); });
    b.addEventListener("touchend", e => { e.preventDefault(); release(k); });
    b.addEventListener("mousedown", () => press(k)); b.addEventListener("mouseup", () => release(k));
  });
  return {
    isDown: k => down.has(k), wasPressed: k => pressed.has(k), any: ks => ks.some(k => pressed.has(k)), endFrame: () => pressed.clear(),
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
