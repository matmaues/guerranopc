let GROUND = 152; const STAGE_W = 320;
// Golpes: s = startup, a = frames ativos, r = recuperação, hs/bs = hit/block stun, lvl = mid/low/high, box = [alcance, topo, base]
const MOVES = {
  lp: { s: 3, a: 3, r: 7, dmg: 4, hs: 13, bs: 9, push: 1.6, lvl: "mid", box: [20, -38, -28], pose: "punch", chain: 1 },
  hp: { s: 5, a: 4, r: 14, dmg: 10, hs: 19, bs: 13, push: 2.6, lvl: "mid", heavy: 1, box: [26, -40, -28], pose: "punch" },
  lk: { s: 4, a: 3, r: 9, dmg: 5, hs: 14, bs: 9, push: 1.8, lvl: "mid", box: [24, -24, -12], pose: "kick", chain: 1 },
  hk: { s: 7, a: 4, r: 16, dmg: 11, hs: 19, bs: 13, push: 3, lvl: "mid", heavy: 1, box: [30, -32, -18], pose: "kick" },
  clp: { s: 3, a: 3, r: 7, dmg: 3, hs: 12, bs: 8, push: 1.4, lvl: "mid", box: [20, -24, -14], pose: "cpunch", chain: 1 },
  chp: { s: 5, a: 5, r: 15, dmg: 9, hs: 18, bs: 12, push: 2, lvl: "mid", heavy: 1, box: [18, -58, -20], pose: "cupper" },
  clk: { s: 4, a: 3, r: 8, dmg: 4, hs: 13, bs: 8, push: 1.4, lvl: "low", box: [26, -8, 0], pose: "ckick", chain: 1 },
  chk: { s: 7, a: 4, r: 20, dmg: 10, hs: 0, bs: 14, push: 2, lvl: "low", heavy: 1, kd: 1, box: [32, -8, 0], pose: "ckick" },
  jlp: { s: 3, a: 8, r: 0, dmg: 5, hs: 15, bs: 10, push: 1.5, lvl: "high", box: [20, -30, -8], pose: "jpunch", air: 1 },
  jhp: { s: 5, a: 6, r: 0, dmg: 10, hs: 19, bs: 13, push: 2, lvl: "high", heavy: 1, box: [22, -30, -6], pose: "jpunch", air: 1 },
  jlk: { s: 4, a: 10, r: 0, dmg: 6, hs: 15, bs: 10, push: 1.5, lvl: "high", box: [22, -16, 4], pose: "jkick", air: 1 },
  jhk: { s: 6, a: 6, r: 0, dmg: 11, hs: 20, bs: 13, push: 2.4, lvl: "high", heavy: 1, box: [26, -18, 4], pose: "jkick", air: 1 },
  fireball: { s: 12, a: 0, r: 26, pose: "punch", special: 1 },
  dp: { s: 3, a: 12, r: 18, dmg: 13, hs: 30, bs: 16, push: 1.5, lvl: "mid", heavy: 1, kd: 1, juggle: 1, chip: 3, box: [16, -62, -10], pose: "upper", special: 1 },
  spin: { s: 6, a: 30, r: 12, dmg: 5, hs: 16, bs: 10, push: 1.2, lvl: "mid", multi: 10, maxHits: 3, kdLast: 1, chip: 1, box: [26, -42, -18], pose: "spin", special: 1 },
  super: { s: 2, a: 0, r: 30, pose: "punch", special: 1, superMove: 1 },
  throw: { s: 3, a: 1, r: 22, pose: "punch" },
};
const FREE = ["idle", "walk", "crouch"];
class Fighter {
  static cache = {};
  constructor(cfg, x, facing, controller) {
    this.cfg = cfg; this.ctrl = controller; this.x = x; this.y = GROUND; this.vx = 0; this.vy = 0; this.facing = facing;
    this.maxHp = 60 + cfg.stats.health * 8; this.hp = this.maxHp; this.spd = 0.7 + cfg.stats.speed * 0.13; this.pow = 0.6 + cfg.stats.power * 0.09;
    this.state = "idle"; this.t = 0; this.m = null; this.mf = 0; this.meter = 0; this.invuln = 0; this.flash = 0; this.anim = 0;
    this.buffer = null; this.input = {}; this.comboTaken = 0; this.comboShow = null; this.juggle = 0; this.popup = null; this.inFight = false;
    this.img = null; if (cfg.sprite) { const c = Fighter.cache[cfg.sprite] || (Fighter.cache[cfg.sprite] = Object.assign(new Image(), { src: cfg.sprite + "?v=" + (window.BUILD || 1) })); if (c.complete && c.naturalWidth) this.img = c; else c.addEventListener("load", () => this.img = c); }
  }
  get grounded() { return this.y >= GROUND; }
  get crouching() { return this.state === "crouch" || (this.m && this.m.crouch) || (FREE.includes(this.state) && this.input.down) || (this.state === "blockstun" && this.input.down); }
  update(opp, game) {
    this.anim++; if (this.flash > 0) this.flash--; if (this.invuln > 0) this.invuln--;
    if (this.comboShow && --this.comboShow.t <= 0) this.comboShow = null; if (this.popup && --this.popup.t <= 0) this.popup = null;
    if (this.buffer && ++this.buffer.age > 8) this.buffer = null;
    const inp = this.input || {};
    switch (this.state) {
      case "ko": case "win": break;
      case "fall": break;
      case "down": if (--this.t <= 0) { this.state = "getup"; this.t = 16; } break;
      case "getup": if (--this.t <= 0) { this.state = "idle"; this.invuln = 4; } break;
      case "hitstun": this.vx *= 0.86; if (--this.t <= 0) { this.state = "idle"; this.comboTaken = 0; this.juggle = 0; } break;
      case "blockstun": this.vx *= 0.86; if (--this.t <= 0) this.state = "idle"; break;
      case "attack": this.runMove(opp, game); break;
      default: this.free(inp, opp, game);
    }
    // física
    if (!this.grounded || this.vy < 0) { this.vy += 0.35; this.y += this.vy; }
    this.x += this.vx;
    if (this.y >= GROUND && this.vy >= 0) {
      const wasAir = this.y > GROUND || this.vy > 0; this.y = GROUND; const vy = this.vy; this.vy = 0;
      if (wasAir && vy > 0) this.land(game);
    }
    if (this.grounded && ["idle", "crouch", "down", "getup", "win"].includes(this.state)) this.vx = 0;
    if (this.state === "ko" && this.grounded) this.vx *= 0.85;
    this.x = Math.max(14, Math.min(STAGE_W - 14, this.x));
  }
  land(game) {
    if (this.state === "jump") { this.state = "idle"; this.vx = 0; game.dust(this.x, 3); }
    else if (this.state === "attack" && this.m.air) { this.state = "idle"; this.vx = 0; game.dust(this.x, 3); }
    else if (this.state === "attack" && this.mn === "dp") { this.vx = 0; this.mf = Math.max(this.mf, this.m.s + this.m.a); this.landed = true; game.dust(this.x, 4); }
    else if (this.state === "fall") {
      if (this.reset) { this.state = "idle"; this.vx = 0; this.comboTaken = 0; this.juggle = 0; game.dust(this.x, 4); }
      else { this.state = "down"; this.t = 34; this.invuln = 60; this.vx *= 0.3; this.comboTaken = 0; this.juggle = 0; game.dust(this.x, 10); game.shake(3); Audio8.thud(); }
    } else if (this.state === "ko") { game.dust(this.x, 12); Audio8.thud(); game.shake(5); }
    else if (this.state === "hitstun") game.dust(this.x, 3);
  }
  free(inp, opp, game) {
    if (this.grounded) this.facing = opp.x > this.x ? 1 : opp.x < this.x ? -1 : this.facing;
    if (this.buffer && this.tryStart(this.buffer.cmd, inp, opp, game)) { this.buffer = null; return; }
    if (!this.grounded) return;
    this.airUsed = false;
    if (inp.up) { this.vy = -6.4; this.vx = (inp.fwd ? 1.5 : inp.back ? -1.5 : 0) * this.facing * (0.8 + this.spd * 0.15); this.state = "jump"; this.y -= 1; Audio8.whoosh(); return; }
    if (inp.down) { this.state = "crouch"; this.vx = 0; return; }
    this.vx = inp.fwd ? this.spd * this.facing : inp.back ? -this.spd * 0.75 * this.facing : 0;
    this.state = this.vx ? "walk" : "idle";
  }
  canThrow(opp) { return this.grounded && opp.grounded && Math.abs(opp.x - this.x) < 28 && FREE.includes(opp.state) && opp.invuln <= 0; }
  tryStart(cmd, inp, opp, game) {
    let n = cmd.n;
    if (!this.grounded) {
      if (this.airUsed || !["lp", "hp", "lk", "hk"].includes(n)) return false;
      this.airUsed = true; this.start("j" + n, null, game); return true;
    }
    if (n === "super") { if (this.meter < 100) return false; this.meter = 0; this.start("super", "h", game); game.superFreeze(this); return true; }
    if (n === "fireball" && game.projectiles.some(p => p.owner === this)) n = cmd.s === "h" ? "hp" : "lp";
    if (n === "throw" || (n === "hp" && (inp.fwd || inp.back) && !inp.down && this.canThrow(opp))) { this.throwBack = !!inp.back; this.start("throw", null, game); return true; }
    if (n === "throw") return false;
    if (["lp", "hp", "lk", "hk"].includes(n) && inp.down) n = "c" + n;
    this.start(n, cmd.s, game); return true;
  }
  start(n, s, game) {
    this.mn = n; this.m = MOVES[n]; this.mf = 0; this.hits = 0; this.mhit = false; this.lastHitF = -99; this.str = s || "l"; this.landed = false;
    this.state = "attack"; if (!this.m.air) this.vx = 0;
    if (this.m.special) {
      this.meter = Math.min(100, this.meter + 3); const sp = this.cfg.specials || {};
      if (n !== "super") { this.popup = { text: (sp[n] || n.toUpperCase()) + "!", t: 50 }; Audio8.special(); }
      if (n === "dp") this.invuln = 8;
    } else Audio8.whoosh();
  }
  runMove(opp, game) {
    const m = this.m, f = ++this.mf, n = this.mn, F = this.facing;
    if (n === "fireball" && f === m.s) game.projectiles.push({ x: this.x + F * 18, y: this.y - 30, vx: F * (this.str === "h" ? 3.4 : 2.4), owner: this, hits: 1, cd: 0,
      mv: { dmg: 9, hs: 18, bs: 14, push: 2.5, lvl: "mid", chip: 2, heavy: 1 }, r: 6, life: 200, kind: this.cfg.projectile });
    if (n === "super" && f === m.s) { game.projectiles.push({ x: this.x + F * 20, y: this.y - 30, vx: F * 3.2, owner: this, hits: 5, cd: 0, superP: 1,
      mv: { dmg: 6, hs: 22, bs: 10, push: 1.2, lvl: "mid", chip: 1.5, heavy: 1, juggle: 1 }, r: 11, life: 200, kind: this.cfg.projectile }); Audio8.superSfx(); }
    if (n === "dp") {
      if (f === m.s) { this.vy = -(this.str === "h" ? 7.4 : 6.2); this.vx = F * (this.str === "h" ? 1.6 : 1.0); this.y -= 1; }
      if (f > m.s + m.a && !this.grounded && !this.landed) this.mf = m.s + m.a;
    }
    if (n === "spin") {
      if (f >= m.s && f < m.s + m.a) { this.vx = F * (this.str === "h" ? 3 : 2.3); if (this.grounded) { this.y = GROUND - 1; this.vy = -1.2; } else this.vy = Math.min(this.vy, 0.05) - 0.32; }
      else if (f === m.s + m.a) this.vx = 0;
    }
    if (n === "throw" && f === m.s) {
      if (this.canThrow(opp)) {
        const dir = this.throwBack ? -F : F; if (this.throwBack) { opp.x = this.x - F * 16; }
        const dmg = 13 * this.pow; opp.hp = Math.max(0, opp.hp - dmg); this.meter = Math.min(100, this.meter + 10);
        game.spark(opp.x, opp.y - 30, "#ff0", 1); game.shake(8); game.hitstop(8); Audio8.hit(1); this.popup = { text: "AGARRÃO!", t: 40 };
        if (opp.hp <= 0) opp.ko(this, game); else opp.knockdown(dir * 3, -4, false);
      }
    }
    if (m.box && f >= m.s && f < m.s + m.a) {
      const can = m.multi ? (f - this.lastHitF >= m.multi && this.hits < m.maxHits) : !this.mhit;
      if (can && this.overlap(opp, m)) { this.hits++; this.mhit = true; this.lastHitF = f; opp.takeHit(this, m, game, !!(m.kd || (m.kdLast && this.hits >= m.maxHits))); }
    }
    // cancelamentos: normal -> especial/super; fracos encadeiam
    if (this.buffer && this.mhit && !m.air && !m.special && f <= m.s + m.a + 9) {
      const c = this.buffer.cmd;
      if (["fireball", "dp", "spin", "super"].includes(c.n) || (m.chain && (c.n === "lp" || c.n === "lk") && f >= m.s + m.a)) {
        this.state = "idle"; if (this.tryStart(c, this.input, opp, game)) { this.buffer = null; return; } this.state = "attack";
      }
    }
    if (m.air) { if (f >= m.s + m.a) this.state = "jump"; }
    else if (f >= m.s + m.a + m.r && (this.grounded || n === "spin")) { this.state = this.grounded ? "idle" : "jump"; this.m = null; }
  }
  hurtbox() { const s = this.cfg.scale || 1, top = this.state === "down" || this.state === "ko" ? 10 : this.crouching ? 30 : 46; return [this.x - 10 * s, this.y - top * s, this.x + 10 * s, this.y]; }
  vulnerable(m) {
    if (this.invuln > 0 || ["down", "getup", "ko"].includes(this.state)) return false;
    if (this.state === "fall") return !!(m.juggle && this.juggle < 2);
    return true;
  }
  overlap(opp, m) {
    if (!opp.vulnerable(m)) return false;
    const b = m.box, F = this.facing, x1 = this.x + F * 4, x2 = this.x + F * (6 + b[0] + (alturaPx(this.cfg) - 88) * 0.5);  // alcance extra p/ mais alto
    const [hx1, hy1, hx2, hy2] = opp.hurtbox();
    return Math.max(x1, x2) > hx1 && Math.min(x1, x2) < hx2 && this.y + b[2] > hy1 && this.y + b[1] < hy2;
  }
  canBlock(lvl) {
    if (!this.grounded || !(FREE.includes(this.state) || this.state === "blockstun")) return false;
    if (!this.input || !this.input.back) return false;
    const cr = !!this.input.down;
    return !((lvl === "low" && !cr) || (lvl === "high" && cr));
  }
  takeHit(att, m, game, kd) {
    const dir = att.x < this.x ? 1 : -1;
    if (this.canBlock(m.lvl)) {
      const chip = (m.chip || 0) * att.pow; this.hp = Math.max(0, this.hp - chip); this.state = "blockstun"; this.t = m.bs; this.vx = dir * m.push;
      game.hitstop(4); game.spark(this.x - dir * 8, this.y - (this.input.down ? 22 : 32), "#8cf"); Audio8.block();
      att.meter = Math.min(100, att.meter + 2); this.meter = Math.min(100, this.meter + 3);
      if (this.hp <= 0) this.ko(att, game); return;
    }
    const inCombo = ["hitstun", "fall"].includes(this.state);
    this.comboTaken = inCombo ? this.comboTaken + 1 : 1;
    const dmg = m.dmg * att.pow * Math.max(0.4, 1 - 0.12 * (this.comboTaken - 1));
    this.hp = Math.max(0, this.hp - dmg); this.flash = 10; this.m = null;
    att.meter = Math.min(100, att.meter + dmg * 1.3); this.meter = Math.min(100, this.meter + dmg * 0.6);
    game.hitstop(m.heavy ? 11 : 6); game.shake(m.heavy ? 8 : 3); game.spark(this.x - dir * 6, this.y - (this.crouching ? 20 : 32), m.heavy ? "#ff0" : "#fff", m.heavy); Audio8.hit(m.heavy);
    game.stats.maxCombo = Math.max(game.stats.maxCombo, this.comboTaken); game.stats.hits++;
    if (this.comboTaken >= 2) att.comboShow = { n: this.comboTaken, t: 70 };
    if (this.hp <= 0) { this.ko(att, game); return; }
    if (this.state === "fall") this.juggle++;
    if (kd || !this.grounded || this.state === "fall") this.knockdown(dir * (m.push + 1), kd ? -4 : -3, !kd && !m.juggle && this.state !== "fall");
    else { this.state = "hitstun"; this.t = m.hs; this.vx = dir * m.push; }
  }
  knockdown(vx, vy, reset) { this.state = "fall"; this.vx = vx; this.vy = vy; this.reset = reset; this.y = Math.min(this.y, GROUND - 1); this.m = null; }
  ko(att, game) { this.state = "ko"; this.vy = -4.5; this.vx = (att.x < this.x ? 1 : -1) * 2.5; this.y = Math.min(this.y, GROUND - 1); this.m = null; game.onKO(this, att); }
  pose() {
    const st = this.state;
    if (st === "ko" || st === "fall") return this.grounded ? "down" : "fall";
    if (st === "down") return "down"; if (st === "getup") return "crouch";
    if (st === "hitstun") return this.crouching ? "crouch" : "hit";
    if (st === "blockstun") return this.input.down ? "cblock" : "block";
    if (st === "attack") { const m = this.m, ext = this.mf >= m.s && this.mf < m.s + m.a + Math.max(3, m.r / 2); return ext || m.air || this.mn === "spin" || this.mn === "dp" ? m.pose : (m.crouch ? "crouch" : m.air ? "jump" : "idle"); }
    if (st === "jump") return "jump"; if (st === "win") return "win";
    if (st === "crouch") return this.input.back ? "cblock" : "crouch";
    if (FREE.includes(st) && this.input.back && this.inFight && this.guardNear) return "block";
    return st === "walk" ? "walk" : "idle";
  }
  draw(g) {
    const c = this.cfg, hs = c.alturaArte ? alturaPx(c) / c.alturaArte : 1;
    if (hs === 1) return this.drawBody(g);
    g.save(); g.translate(Math.round(this.x), Math.round(this.y)); g.scale(hs, hs); g.translate(-Math.round(this.x), -Math.round(this.y)); this.drawBody(g); g.restore();
  }
  drawBody(g) {
    const x = Math.round(this.x), y = Math.round(this.y), s = this.cfg.scale || 1;
    let f = this.facing; const pose = this.pose();
    if (pose === "spin" && Math.floor(this.anim / 4) % 2) f = -f;
    g.fillStyle = "#0006"; g.fillRect(x - 12 * s, (this.inFight ? GROUND : y) + 1, 24 * s, 3);
    if (this.cfg.parts) return this.drawParts(g, x, y, f, pose);
    if (this.img && this.cfg.fullSprite) return this.drawFull(g, x, y, f, pose);
    if (this.img && this.cfg.spriteLegs) return this.drawLegged(g, x, y, f, pose);
    g.save(); g.translate(x, y); g.scale(f * s, s); this.drawProc(g, pose); g.restore();
  }
  drawProc(g, pose) {
    const c = this.cfg.color, ac = this.cfg.accent, sk = "#f2c49b", dk = "#222", W = this.flash % 4 > 1;
    const R = (x, y, w, h, col) => { g.fillStyle = W ? "#fff" : col; g.fillRect(x, y, w, h); };
    const head = (hy, hx = 0) => { R(-5 + hx, hy, 11, 11, sk); R(-6 + hx, hy - 1, 13, 4, ac); R(3 + hx, hy + 4, 2, 2, "#000"); };
    if (pose === "down" || pose === "fall") { if (pose === "fall") g.rotate(-0.5); R(-24, -7, 20, 6, c); R(-4, -10, 16, 10, c); R(-4, -10, 3, 10, ac); R(12, -11, 10, 10, sk); R(20, -12, 3, 11, ac); return; }
    const crouchP = ["crouch", "cpunch", "ckick", "cblock"].includes(pose), jumpP = ["jump", "jpunch", "jkick", "upper"].includes(pose);
    const bob = pose === "idle" ? Math.floor(this.anim / 15) % 2 : 0, wk = pose === "walk" ? (Math.floor(this.anim / 6) % 2 ? 2 : -2) : 0;
    let lean = pose === "hit" ? -3 : pose === "kick" ? -2 : 0;
    // pernas
    if (crouchP) { R(-8, -10, 7, 10, c); if (pose !== "ckick") R(2, -10, 7, 10, c); R(-9, -2, 8, 2, dk); }
    else if (jumpP) { R(-7, -16, 6, 10, c); if (pose !== "jkick") R(2, -16, 6, 10, c); }
    else if (pose === "kick") { R(-6, -18, 6, 18, c); R(-7, -2, 8, 2, dk); }
    else { R(-7 + wk, -18, 6, 18, c); R(1 - wk, -18, 6, 18, c); R(-8 + wk, -2, 8, 2, dk); R(1 - wk, -2, 8, 2, dk); }
    const by = crouchP ? -22 : jumpP ? -30 : -32 + bob, hy = by - 11;
    R(-8 + lean, by, 16, crouchP ? 12 : 16, c); R(-8 + lean, by + (crouchP ? 9 : 13), 16, 3, ac); head(hy, lean);
    const ay = by + 2, heavy = this.m && this.m.heavy ? 4 : 0;
    switch (pose) {
      case "punch": case "cpunch": R(4, ay, 20 + heavy, 5, sk); R(22 + heavy, ay - 1, 6, 7, ac); break;
      case "jpunch": R(4, ay + 2, 16, 5, sk); R(18, ay + 3, 6, 6, ac); break;
      case "kick": R(0, (heavy ? -30 : -22), 26, 6, c); R(24, (heavy ? -31 : -23), 4, 7, ac); R(6, ay, 5, 9, sk); break;
      case "ckick": R(0, -6, 30, 6, c); R(28, -7, 4, 7, ac); R(6, ay, 5, 8, sk); break;
      case "jkick": R(2, -14, 22, 6, c); R(22, -13, 4, 7, ac); R(6, ay, 5, 8, sk); break;
      case "spin": R(0, -24, 26, 6, c); R(24, -25, 4, 7, ac); R(-26, -24, 22, 5, c); break;
      case "upper": case "cupper": case "win": R(4, hy - 18, 5, 24, sk); R(3, hy - 22, 7, 6, ac); break;
      case "block": case "cblock": R(6, ay - 8, 5, 16, sk); R(9, ay - 10, 5, 6, ac); break;
      case "hit": R(-12, ay, 5, 8, sk); break;
      default: R(6, ay, 5, 10, sk); R(9, ay + 6 - bob, 7, 5, ac); R(-10, ay, 4, 10, sk);
    }
    if (pose === "upper" && this.anim % 4 < 2) { g.fillStyle = ac + "66"; g.fillRect(-14, -60, 6, 50); }
  }
  static load(src) { const c = Fighter.cache[src] || (Fighter.cache[src] = Object.assign(new Image(), { src: src + "?v=" + (window.BUILD || 1) })); return c.complete && c.naturalWidth ? c : null; }
  // Lutador por partes (pixels da arte original): tronco por pose + pernas que giram no quadril
  drawParts(g, x, y, f, pose) {
    const b = this.cfg.parts, I = n => Fighter.load(b + n + ".png");
    const win = I("win"), legL = I("leg_l"), legR = I("leg_r");
    const up = I(["punch", "cpunch", "jpunch"].includes(pose) ? "punch" : ["upper", "cupper"].includes(pose) ? "upper" : ["block", "cblock"].includes(pose) ? "block" : "guard");
    if (!win || !legL || !legR || !up) return;
    g.save(); g.translate(x, y); g.scale(f * 0.5, 0.5); if (this.flash % 4 > 1) g.globalAlpha = 0.5;
    if (pose === "down") { g.rotate(-Math.PI / 2); g.drawImage(win, 0, -win.height / 2); g.restore(); return; }  // deitado: corpo inteiro apoiado no chão
    if (pose === "fall") { g.rotate(-1.0); g.drawImage(win, -win.width / 2 + 6, -win.height + 4); g.restore(); return; }
    if (pose === "win") { g.drawImage(win, -win.width / 2, -win.height); g.restore(); return; }
    const M = this.cfg.partsMeta || { ox: -15, legX: [1, 12] }, LH = legL.height, ox = M.ox, heavy = this.m && this.m.heavy;
    let hipY = -LH + 2, rot = 0, dx = 0, sy = 1, rl = 0, rr = 0;
    const crouchP = ["crouch", "cpunch", "ckick", "cblock", "cupper"].includes(pose), air = ["jump", "jpunch", "jkick", "upper"].includes(pose);
    if (crouchP) { sy = 0.6; hipY = -LH * 0.6 + 2; }
    if (air) { sy = 0.8; rl = -0.35; rr = -0.75; hipY = -LH + 2; }
    if (pose === "walk") { const w = Math.floor(this.anim / 7) % 2 ? 0.2 : -0.2; rl = w; rr = -w; }
    if (pose === "kick" || pose === "spin") { rr = heavy ? -1.85 : -1.5; rl = 0.12; rot = -0.15; }
    if (pose === "jkick") rr = -1.1;
    if (pose === "ckick") { rr = -1.5; sy = 0.6; }
    if (pose === "hit") { dx = -5; rot = -0.12; }
    if (["punch", "cpunch", "jpunch"].includes(pose)) { dx = 3; rot = 0.05; }
    const leg = (im, lx, r, s2) => { g.save(); g.translate(lx + im.width / 2, hipY); g.rotate(r); g.scale(1, s2); g.drawImage(im, -im.width / 2, 0); g.restore(); };
    g.translate(dx, 0);
    leg(legL, ox + M.legX[0], rl, sy); leg(legR, ox + M.legX[1], rr, rr < -1 ? 1 : sy);
    g.save(); g.translate(0, hipY + 2); g.rotate(rot); g.drawImage(up, ox, -up.height); g.restore();
    if (pose === "upper" && this.anim % 4 < 2) { g.fillStyle = this.cfg.accent + "88"; g.fillRect(-30, -110, 12, 90); }
    g.restore();
  }
  // Sprite de imagem (tronco em resolução total) + pernas e chinelos desenhados; poses movem/inclinam a imagem inteira
  // sprite inteiro (saída do tools/normalizar.py): poses por inclinação/deslocamento
  drawFull(g, x, y, f, pose) {
    const im = this.img, iw = im.width, ih = im.height;
    g.save(); g.translate(x, y); g.scale(f * 0.5, 0.5);
    if (this.flash % 4 > 1) g.globalAlpha = 0.55;
    if (pose === "down" || pose === "fall") { g.rotate(pose === "fall" ? -1.1 : -Math.PI / 2); g.drawImage(im, -ih / 2, -iw / 2 - 4); g.restore(); return; }
    let rot = 0, dx = 0, dy = 0, sy = 1;
    if (["punch", "cpunch", "jpunch"].includes(pose)) { dx = 6; rot = 0.08; }
    else if (pose === "kick" || pose === "spin" || pose === "jkick") { rot = -0.2; }
    else if (pose === "hit") { dx = -5; rot = -0.12; }
    else if (pose === "upper" || pose === "cupper") { rot = -0.1; dy = -6; }
    else if (pose === "walk") dy = -(Math.floor(this.anim / 7) % 2) * 2;
    else if (pose === "idle") dy = Math.floor(this.anim / 15) % 2;
    if (["crouch", "cpunch", "ckick", "cblock", "cupper"].includes(pose)) sy = 0.75;
    g.translate(dx, dy); g.scale(1, sy); g.rotate(rot); g.drawImage(im, -Math.round(iw / 2), -ih);
    if (pose === "block" || pose === "cblock") { g.globalAlpha = 0.6; g.fillStyle = "#7fd8ff"; g.fillRect(iw / 2 + 2, -ih + 14, 4, 40); }
    g.restore();
  }
  drawLegged(g, x, y, f, pose) {
    const im = this.img, sk = this.cfg.skin || "#e9a57e", OL = "#1a1010";
    const iw = im.width, ih = im.height, ox = -Math.round(iw / 2), LEN = 16, top = -(ih + LEN + 4), legX = this.cfg.legX || [9, 24];
    g.save(); g.translate(x, y); g.scale(f * 0.5, 0.5);
    if (this.flash % 4 > 1) g.globalAlpha = 0.55;
    const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
    const leg = (lx, ly, len) => {
      R(OL, lx, ly, 10, len - 5); R(sk, lx + 1, ly, 8, len - 5); R(OL, lx + 1, ly + len - 6, 8, 6); R(sk, lx + 2, ly + len - 6, 6, 6);
      const fy = ly + len; R(OL, lx + 1, fy - 1, 12, 5); R(sk, lx + 2, fy, 10, 3); R(OL, lx, fy + 3, 15, 3); R("#ffffff", lx + 1, fy + 3, 13, 2);
      R("#ffffff", lx + 3, fy, 1, 1); R("#ffffff", lx + 4, fy + 1, 1, 1); R("#ffffff", lx + 9, fy, 1, 1); R("#ffffff", lx + 8, fy + 1, 1, 1); R("#ffffff", lx + 5, fy + 1, 3, 1); R(OL, lx + 6, fy + 2, 1, 1);
    };
    const hLeg = (hx, hy) => { g.save(); g.translate(hx, hy); g.rotate(-Math.PI / 2 + 0.12); leg(-5, -2, LEN + 4); g.restore(); };
    // caído / KO: corpo + pernas + chinelos giram juntos (deitado no chão)
    if (pose === "down") { g.translate(44, -iw / 2 + 2); g.rotate(-Math.PI / 2); pose = "lying"; }
    else if (pose === "fall") { g.translate(30, -14); g.rotate(-1.1); pose = "lying"; }
    let ly = top + ih, rot = 0; const bob = pose === "idle" ? Math.floor(this.anim / 15) % 2 : 0, L = ox + legX[0], Rr = ox + legX[1];
    const lean = ["punch", "cpunch", "jpunch"].includes(pose), crouchP = ["crouch", "cpunch", "ckick", "cblock", "cupper"].includes(pose);
    const punchIm = lean && this.cfg.punchSprite ? Fighter.load(this.cfg.punchSprite) : null;
    if (lean) { g.translate(punchIm ? 3 : 8, 0); rot = punchIm ? 0.03 : 0.08; }
    if (pose === "hit") { g.translate(-5, 0); rot = -0.12; }
    if (pose === "upper" || pose === "win" || pose === "cupper") rot = -0.08;
    if (crouchP) { ly += 12; leg(L - 2, ly, LEN - 12); if (pose === "ckick") hLeg(Rr + 5, ly + LEN - 14); else leg(Rr + 2, ly, LEN - 12); }
    else if (["jump", "jpunch", "upper"].includes(pose)) { ly -= 4; leg(L, ly, LEN - 6); leg(Rr, ly, LEN - 2); }
    else if (pose === "jkick") { ly -= 4; leg(L, ly, LEN - 6); g.save(); g.translate(Rr + 5, ly + 2); g.rotate(-Math.PI / 2 + 0.6); leg(-5, -2, LEN + 4); g.restore(); }
    else if (pose === "kick" || pose === "spin") { leg(L - 4, ly, LEN); rot = -0.18; hLeg(Rr + 5, ly + 2); }
    else if (pose === "walk") { const w = Math.floor(this.anim / 7) % 2 ? 3 : -3; leg(L + w, ly - (w > 0 ? 2 : 0), LEN); leg(Rr - w, ly - (w < 0 ? 2 : 0), LEN); }
    else { leg(L, ly, LEN); leg(Rr, ly, LEN); }
    g.save(); g.translate(0, ly + bob); g.rotate(rot); g.drawImage(punchIm || im, ox, -ih); g.restore();
    if (lean && this.m && !punchIm) { const a = this.cfg.accent; R(a, iw / 2 + 4, ly - ih + 30, 10, 2); R(a, iw / 2 + 8, ly - ih + 36, 8, 2); R("#fff", iw / 2 + 2, ly - ih + 24, 6, 2); }
    if (pose === "block" || pose === "cblock") { g.globalAlpha = 0.6; R("#7fd8ff", iw / 2 + 2, ly - ih + 14, 4, 40); g.globalAlpha = 1; }
    if (pose === "upper" && this.anim % 4 < 2) { g.fillStyle = this.cfg.accent + "88"; g.fillRect(-30, -110, 12, 90); }
    g.restore();
  }
}
