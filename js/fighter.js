let GROUND = 152; const STAGE_W = 320;
const ATTACKS = {
  punch: { dur: 16, act: [4, 8], dmg: 6, range: 22, h: 10, oy: -30, knock: 1.5, stun: 14 },
  kick: { dur: 24, act: [7, 13], dmg: 9, range: 28, h: 12, oy: -16, knock: 2.5, stun: 18 },
  special: { dur: 32, act: [8, 20], dmg: 14, range: 30, h: 30, oy: -30, knock: 4, stun: 26 },
};
class Fighter {
  static cache = {};
  constructor(cfg, x, facing, controller) {
    this.cfg = cfg; this.ctrl = controller; this.x = x; this.y = GROUND; this.vx = 0; this.vy = 0; this.facing = facing;
    this.maxHp = 60 + cfg.stats.health * 8; this.hp = this.maxHp; this.spd = 0.7 + cfg.stats.speed * 0.13; this.pow = 0.6 + cfg.stats.power * 0.09;
    this.state = "idle"; this.t = 0; this.atk = null; this.atkT = 0; this.hitDone = false; this.stun = 0; this.cool = 0; this.flash = 0; this.anim = 0;
    this.img = null; if (cfg.sprite) { const c = Fighter.cache[cfg.sprite] || (Fighter.cache[cfg.sprite] = Object.assign(new Image(), { src: cfg.sprite })); if (c.complete && c.naturalWidth) this.img = c; else c.addEventListener("load", () => this.img = c); }
  }
  get grounded() { return this.y >= GROUND; }
  update(opp, game) {
    this.anim++; if (this.cool > 0) this.cool--; if (this.flash > 0) this.flash--;
    if (this.state === "ko") { this.vy += 0.4; this.y = Math.min(GROUND, this.y + this.vy); this.x += this.vx; this.vx *= 0.92; this.clamp(); return; }
    const inp = this.ctrl.get(this, opp, game) || { held: {}, pressed: {} }, h = inp.held, p = inp.pressed;
    if (this.grounded && !this.atk && this.stun <= 0) this.facing = opp.x > this.x ? 1 : -1;
    const back = this.facing === 1 ? h.left : h.right;
    this.blocking = false;
    if (this.stun > 0) { this.stun--; this.state = "hit"; }
    else if (this.atk) {
      this.atkT++; const a = this.atk;
      if (a.name === "special") this.doSpecialMotion(game);
      if (this.atkT >= a.act[0] && this.atkT <= a.act[1] && !this.hitDone && a.melee !== false) this.tryHit(opp, game);
      if (this.atkT >= a.dur) { this.atk = null; this.state = "idle"; }
    } else {
      const crouch = h.down && this.grounded;
      if (p.special && this.cool <= 0) this.startAttack("special", game);
      else if (p.punch) this.startAttack("punch", game);
      else if (p.kick) this.startAttack("kick", game);
      else if (this.grounded) {
        this.vx = 0;
        if (crouch) { this.state = "crouch"; this.blocking = back; }
        else {
          if (h.left) this.vx = -this.spd * (this.facing === -1 ? 1 : 0.75);
          if (h.right) this.vx = this.spd * (this.facing === 1 ? 1 : 0.75);
          this.blocking = back;
          if (h.up) { this.vy = -6.2; this.state = "jump"; Audio8.whoosh(); }
          else this.state = this.vx ? "walk" : "idle";
        }
      }
    }
    if (!this.grounded || this.vy < 0) { this.vy += 0.35; if (this.state !== "hit" && !this.atk) this.state = "jump"; }
    this.y += this.vy; this.x += this.vx;
    if (this.y >= GROUND) { this.y = GROUND; this.vy = 0; if (this.state === "jump") this.state = "idle"; if (this.stun > 0) this.vx *= 0.8; }
    // empurrar oponente
    if (Math.abs(this.x - opp.x) < 18 && Math.abs(this.y - opp.y) < 30) { const d = this.x < opp.x ? -1 : 1; this.x += d * 0.8; }
    this.clamp();
  }
  clamp() { this.x = Math.max(12, Math.min(STAGE_W - 12, this.x)); }
  startAttack(name, game) {
    const base = ATTACKS[name]; this.atk = { ...base, name }; this.atkT = 0; this.hitDone = false; this.state = name;
    if (this.grounded && name !== "special") this.vx = 0;
    if (name === "special") {
      this.cool = 100; Audio8.special(); const ty = this.cfg.special.type; this.atk.type = ty;
      if (ty === "projetil") { this.atk.melee = false; this.atk.dur = 26; }
      if (ty === "terremoto") { this.atk.melee = false; this.atk.dur = 34; }
      if (ty === "uppercut") { this.vy = -7; this.atk.oy = -40; this.atk.range = 20; }
      if (ty === "investida") { this.atk.act = [4, 18]; }
    } else Audio8.whoosh();
  }
  doSpecialMotion(game) {
    const a = this.atk, ty = a.type;
    if (ty === "investida") this.vx = this.atkT < 18 ? this.facing * 5 : 0;
    if (ty === "uppercut") this.vx = this.facing * 1.2;
    if (ty === "projetil" && this.atkT === 8) game.projectiles.push({ x: this.x + this.facing * 16, y: this.y - 30, vx: this.facing * 3.5, owner: this, dmg: 12 * this.pow, color: this.cfg.accent, life: 120 });
    if (ty === "terremoto" && this.atkT === 12) { game.shake(10); game.waves.push({ x: this.x, dir: this.facing, owner: this, t: 0, hit: false, dmg: 13 * this.pow }); }
  }
  tryHit(opp, game) {
    const a = this.atk, hx = this.x + this.facing * (10 + a.range / 2), hy = this.y + a.oy;
    if (Math.abs(hx - opp.x) < a.range / 2 + 9 && hy > opp.y - (opp.state === "crouch" ? 26 : 44) - a.h / 2 && hy < opp.y + a.h / 2) {
      this.hitDone = true; opp.receive(a.dmg * this.pow, this.facing * a.knock, a.stun, game, hx, hy);
    }
  }
  receive(dmg, knock, stun, game, sx, sy) {
    if (this.state === "ko") return;
    if (this.blocking && !this.atk && this.stun <= 0) { this.hp -= dmg * 0.15; this.vx = knock * 0.6; this.stun = 6; Audio8.block(); game.spark(sx, sy, "#aaf"); }
    else { this.hp -= dmg; this.vx = knock; this.stun = stun; this.atk = null; this.flash = 8; Audio8.hit(); game.spark(sx, sy, "#ff0"); game.shake(4 + dmg / 3); if (!this.grounded) this.vy = -2; }
    this.hp = Math.max(0, this.hp);
    if (this.hp <= 0) { this.state = "ko"; this.vy = -4; this.vx = knock * 1.5; game.onKO(this); }
  }
  draw(g) {
    const x = Math.round(this.x), y = Math.round(this.y), f = this.facing, c = this.cfg.color, ac = this.cfg.accent;
    g.fillStyle = "#0006"; g.fillRect(x - 12, y + 1, 24, 3);
    if (this.img && this.cfg.spriteLegs) return this.drawLegged(g, x, y, f);
    if (this.img) { g.save(); g.translate(x, y); g.scale(f, 1); g.drawImage(this.img, -24, -48, 48, 48); g.restore(); return; }
    const R = (dx, dy, w, h, col) => { g.fillStyle = this.flash % 4 > 1 ? "#fff" : col; g.fillRect(f === 1 ? x + dx : x - dx - w, y + dy, w, h); };
    const st = this.state, at = this.atk, active = at && this.atkT >= at.act[0] && this.atkT <= at.act[1];
    if (st === "ko" && this.grounded) { R(-20, -8, 40, 8, c); R(14, -10, 9, 9, "#f2c49b"); return; }
    const cr = st === "crouch", bob = st === "idle" ? (Math.floor(this.anim / 15) % 2) : 0;
    const top = cr ? -30 : -46 + bob, walk = st === "walk" ? Math.floor(this.anim / 6) % 2 : 0;
    // pernas
    if (st === "kick" && active) { R(-6, -18, 6, 18, c); R(0, -20, 26, 6, c); R(24, -21, 4, 7, ac); }
    else if (st === "jump") { R(-7, -16, 6, 10, c); R(2, -16, 6, 10, c); }
    else { const lh = cr ? 10 : 18; R(-7 + walk * 2, -lh, 6, lh, c); R(2 - walk * 2, -lh, 6, lh, c); R(-8 + walk * 2, -2, 8, 2, "#222"); R(2 - walk * 2, -2, 8, 2, "#222"); }
    // corpo
    const by = cr ? -22 : -32 + bob; R(-8, by, 16, cr ? 12 : 16, c); R(-8, by + (cr ? 9 : 13), 16, 3, ac);
    // cabeça
    R(-5, top, 11, 11, "#f2c49b"); R(-6, top - 1, 13, 4, ac); R(3, top + 4, 2, 2, "#000");
    // braços
    const ay = by + 2;
    if ((st === "punch" || (st === "special" && at && at.type !== "terremoto")) && active) { R(4, ay, 22, 5, "#f2c49b"); R(24, ay - 1, 6, 7, ac); }
    else if (st === "special" && at && at.type === "terremoto") { R(-10, top - 8, 5, 12, "#f2c49b"); R(6, top - 8, 5, 12, "#f2c49b"); }
    else if (this.blocking) { R(6, ay - 6, 5, 14, "#f2c49b"); R(9, ay - 7, 4, 6, ac); }
    else { R(6, ay, 5, 10, "#f2c49b"); R(9, ay + 6 - bob, 7, 5, ac); R(-10, ay, 4, 10, "#f2c49b"); }
    if (st === "special" && at && (at.type === "investida" || at.type === "uppercut") && this.anim % 4 < 2) { g.fillStyle = ac + "88"; g.fillRect(x - f * 18 - 6, y - 40, 12, 36); }
  }

  // Sprite de imagem (tronco, em resolução nativa = 2x mais detalhe que o resto) + pernas e chinelos desenhados
  drawLegged(g, x, y, f) {
    const im = this.img, sk = this.cfg.skin || "#e9a57e", OL = "#1a1010", st = this.state, at = this.atk;
    const active = at && this.atkT >= at.act[0] && this.atkT <= at.act[1];
    const iw = im.width, ih = im.height, ox = -Math.round(iw / 2), LEN = 16, top = -(ih + LEN + 4);
    const legX = this.cfg.legX || [9, 24];
    g.save(); g.translate(x, y); g.scale(f * 0.5, 0.5); // 1 unidade = 1 pixel real do canvas
    if (this.flash % 4 > 1) g.globalAlpha = 0.55;
    const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
    // perna com chinelo branco; (lx,ly) = topo da coxa
    const leg = (lx, ly, len) => {
      R(OL, lx, ly, 10, len - 5); R(sk, lx + 1, ly, 8, len - 5);
      R(OL, lx + 1, ly + len - 6, 8, 6); R(sk, lx + 2, ly + len - 6, 6, 6);          // canela
      const fy = ly + len;                                                             // pé
      R(OL, lx + 1, fy - 1, 12, 5); R(sk, lx + 2, fy, 10, 3);
      R(OL, lx, fy + 3, 15, 3); R("#ffffff", lx + 1, fy + 3, 13, 2);                 // sola do chinelo
      R("#ffffff", lx + 3, fy, 1, 1); R("#ffffff", lx + 4, fy + 1, 1, 1);             // tira em V
      R("#ffffff", lx + 9, fy, 1, 1); R("#ffffff", lx + 8, fy + 1, 1, 1);
      R("#ffffff", lx + 5, fy + 1, 3, 1); R(OL, lx + 6, fy + 2, 1, 1);
    };
    if (st === "ko" && this.grounded) { g.rotate(-Math.PI / 2); g.drawImage(im, -ih / 2 + 10, ox - 10); g.restore(); return; }
    let ly = top + ih, dx = 0, rot = 0, bob = st === "idle" ? Math.floor(this.anim / 15) % 2 : 0;
    const L = ox + legX[0], Rr = ox + legX[1];
    if ((st === "punch" || st === "special") && at) { const k = active ? 1 : 0.4; g.translate(8 * k, 0); rot = 0.08 * k; }
    if (st === "hit") { g.translate(-5, 0); rot = -0.12; }
    if (st === "crouch") { ly += 12; leg(L - 2, ly, LEN - 12); leg(Rr + 2, ly, LEN - 12); }
    else if (st === "jump" || (st === "special" && at && at.type === "uppercut")) { ly -= 4; leg(L, ly, LEN - 6); leg(Rr, ly, LEN - 2); }
    else if (st === "kick" && active) {
      leg(L - 4, ly, LEN); rot = -0.18;
      g.save(); g.translate(Rr + 5, ly + 2); g.rotate(-Math.PI / 2 + 0.15); leg(-5, -2, LEN + 4); g.restore();
    }
    else if (st === "walk") { const w = Math.floor(this.anim / 7) % 2 ? 3 : -3; leg(L + w, ly - (w > 0 ? 2 : 0), LEN); leg(Rr - w, ly - (w < 0 ? 2 : 0), LEN); }
    else { leg(L, ly, LEN); leg(Rr, ly, LEN); }
    // tronco: imagem original intacta, só deslocada/rotacionada a partir do quadril
    g.save(); g.translate(dx, ly + bob); g.rotate(rot); g.drawImage(im, ox, -ih); g.restore();
    if ((st === "punch" || st === "special") && active) { R(this.cfg.accent, iw / 2 + dx + 4, ly - ih + 30, 10, 2); R(this.cfg.accent, iw / 2 + dx + 8, ly - ih + 36, 8, 2); R("#fff", iw / 2 + dx + 2, ly - ih + 24, 6, 2); }
    if (this.blocking) { g.globalAlpha = 0.6; R("#7fd8ff", iw / 2 + 2, ly - ih + 14, 4, 40); g.globalAlpha = 1; }
    if (st === "special" && at && (at.type === "investida" || at.type === "uppercut") && this.anim % 4 < 2) { g.fillStyle = this.cfg.accent + "88"; g.fillRect(-44, -88, 20, 72); }
    g.restore();
  }
}
