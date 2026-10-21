// Controladores: qualquer objeto com get(self, opp, game) -> {held, pressed}
class HumanController { constructor(map) { this.map = map; } get() { return Input.player(this.map); } }
class CPUController {
  constructor(level = 1) { this.level = level; this.plan = null; this.timer = 0; }
  get(me, op, game) {
    const L = Math.min(this.level, 5), held = {}, pressed = {}, dist = Math.abs(op.x - me.x), fw = me.facing === 1 ? "right" : "left", bk = me.facing === 1 ? "left" : "right";
    const react = 0.25 + L * 0.12;
    // defender ataques do oponente
    if (op.atk && dist < 50 && Math.random() < react) { held[bk] = true; if (op.atk.name === "kick" && Math.random() < 0.4) held.down = true; return { held, pressed }; }
    if (game.projectiles.some(p => p.owner !== me && Math.abs(p.x - me.x) < 60) && Math.random() < react) { if (Math.random() < 0.5) held.up = true; else held[bk] = true; return { held, pressed }; }
    if (--this.timer <= 0) {
      const r = Math.random();
      this.plan = dist > 40 ? (r < 0.65 ? "approach" : r < 0.8 ? "special" : r < 0.9 ? "jump" : "wait") : (r < 0.35 + L * 0.06 ? "attack" : r < 0.6 ? "block" : r < 0.75 ? "retreat" : r < 0.88 ? "jump" : "special");
      this.timer = 10 + Math.random() * (40 - L * 5);
    }
    switch (this.plan) {
      case "approach": held[fw] = true; break;
      case "retreat": held[bk] = true; break;
      case "block": held[bk] = true; if (Math.random() < 0.3) held.down = true; break;
      case "jump": held.up = true; held[fw] = Math.random() < 0.7; this.plan = "attack"; break;
      case "special": pressed.special = true; this.plan = "wait"; break;
      case "attack": if (dist < 34 && Math.random() < 0.15 + L * 0.06) pressed[Math.random() < 0.55 ? "punch" : "kick"] = true; else if (dist >= 34) held[fw] = true; break;
    }
    return { held, pressed };
  }
}
