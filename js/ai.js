// CPU: devolve o mesmo formato do HumanController ({fwd, back, up, down, cmd}). level 1..8
class CPUController {
  constructor(level = 2) { this.L = Math.max(1, Math.min(8, level)); this.plan = "walk"; this.timer = 0; this.hold = {}; this.react = 0; }
  get(me, op, game) {
    const L = this.L, R = Math.random, dist = Math.abs(op.x - me.x), out = { fwd: false, back: false, up: false, down: false, cmd: null };
    const k = 0.15 + L * 0.09; // reflexo/qualidade
    if (!game.fighting) return out;
    // continuar combo: normal acertou -> cancela em especial
    if (me.state === "attack" && me.m && me.mhit && !me.m.special && !me.m.air && R() < k * 0.6) {
      out.cmd = me.meter >= 100 && R() < 0.5 ? { n: "super" } : R() < 0.6 ? { n: "fireball", s: "h" } : R() < 0.5 ? { n: "spin", s: "h" } : { n: "dp", s: "h" };
      if (me.m.chain && R() < 0.4) out.cmd = { n: R() < 0.5 ? "lp" : "lk" };
      return out;
    }
    if (me.state !== "idle" && me.state !== "walk" && me.state !== "crouch" && me.state !== "blockstun" && me.state !== "jump") return out;
    // ataque aéreo ao cair perto
    if (me.state === "jump") { if (me.vy > 0 && dist < 40 && R() < k) out.cmd = { n: R() < 0.5 ? "hk" : "hp" }; return out; }
    // anti-aéreo
    if (!op.grounded && op.state === "jump" && dist < 70 && op.vy > -2 && Math.abs(op.vx) > 0.2 && R() < k * 0.5) { out.cmd = { n: R() < 0.7 ? "dp" : "hp", s: "h" }; if (out.cmd.n === "hp") out.down = true; return out; }
    // defesa
    const threat = (op.state === "attack" && dist < 70) || game.projectiles.some(p => p.owner !== me && Math.abs(p.x - me.x) < 90 && Math.sign(p.vx) === Math.sign(me.x - p.x));
    if (threat && R() < Math.min(0.92, k * 1.3)) {
      const proj = game.projectiles.find(p => p.owner !== me);
      if (proj && !op.m && R() < 0.06 * L && Math.abs(proj.x - me.x) > 50) { out.up = true; out.fwd = true; return out; }
      out.back = true; out.down = op.m ? op.m.lvl === "low" || (op.m.lvl === "mid" && op.crouching) : false; if (op.m && op.m.lvl === "high") out.down = false; return out;
    }
    if (me.state === "blockstun") { out.back = true; out.down = me.input.down; return out; }
    if (--this.timer <= 0) {
      const r = R();
      if (me.meter >= 100 && dist < 140 && r < 0.12 + L * 0.03) this.plan = "super";
      else if (dist > 110) this.plan = r < 0.35 + L * 0.03 ? "fireball" : r < 0.8 ? "walk" : "jumpin";
      else if (dist > 36) this.plan = r < 0.45 ? "walk" : r < 0.6 ? "fireball" : r < 0.75 ? "jumpin" : r < 0.88 ? "backoff" : "wait";
      else this.plan = r < 0.35 + L * 0.05 ? "combo" : r < 0.5 ? "throw" : r < 0.65 ? "sweep" : r < 0.82 ? "block" : "backoff";
      this.timer = 8 + R() * (40 - L * 3);
    }
    switch (this.plan) {
      case "walk": out.fwd = true; if (dist < 34) this.plan = "combo"; break;
      case "backoff": out.back = true; break;
      case "block": out.back = true; out.down = R() < 0.5; break;
      case "jumpin": out.up = true; out.fwd = true; this.plan = "wait"; break;
      case "fireball": out.cmd = { n: "fireball", s: R() < 0.5 ? "h" : "l" }; this.plan = "wait"; break;
      case "super": out.cmd = { n: "super" }; this.plan = "wait"; break;
      case "throw": if (dist < 26) { out.cmd = { n: "throw" }; this.plan = "wait"; } else out.fwd = true; break;
      case "sweep": if (dist < 36) { out.down = true; out.cmd = { n: "hk" }; this.plan = "wait"; } else out.fwd = true; break;
      case "combo":
        if (dist < 32) { const r = R(); out.cmd = { n: r < 0.35 ? "lk" : r < 0.6 ? "lp" : r < 0.8 ? "hp" : "hk" }; out.down = R() < 0.4; this.plan = R() < 0.5 ? "combo" : "wait"; this.timer = Math.min(this.timer, 10); }
        else out.fwd = true; break;
    }
    return out;
  }
}
