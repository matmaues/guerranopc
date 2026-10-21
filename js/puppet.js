// ===== BONECOS PIXEL-ART (Maués e João Pedro) =====
// Cada pose é rasterizada pixel a pixel em um buffer 110x110 (1 px = 1 pixel real do canvas), com contorno preto
// automático por parte do corpo, e guardada em cache. Ângulos em graus: 0 = para baixo, 90 = para frente, 180 = para cima.
const Puppet = (() => {
  const SZ = 110, HX = 55, FEET = 106, OL = [16, 12, 12];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hash = (x, y) => { let n = x * 374761393 + y * 668265263; n = (n ^ (n >> 13)) * 1274126177; return ((n ^ (n >> 16)) >>> 0) / 4294967295; };
  class Buf {
    constructor() { this.d = new Array(SZ * SZ).fill(null); }
    set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < SZ && y < SZ) this.d[y * SZ + x] = c; }
    get(x, y) { return x >= 0 && y >= 0 && x < SZ && y < SZ ? this.d[y * SZ + x] : null; }
    outline() { const add = []; for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) if (!this.get(x, y) && (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1))) add.push([x, y]); add.forEach(([x, y]) => this.set(x, y, OL)); return this; }
    over(b) { b.d.forEach((c, i) => { if (c) this.d[i] = c; }); return this; }
  }
  // cápsula (membro) de p0 a p1 com raio r; color(x, y, t) decide a cor (t = 0..1 ao longo do membro)
  function capsule(b, x0, y0, x1, y1, r, color) {
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.ceil(Math.max(y0, y1) + r); y++)
      for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.ceil(Math.max(x0, x1) + r); x++) {
        const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L2)), px = x0 + t * dx - x, py = y0 + t * dy - y;
        if (px * px + py * py <= r * r) b.set(x, y, color(x, y, t));
      }
  }
  const P = (a, l, x, y) => [x + Math.sin(a * Math.PI / 180) * l, y + Math.cos(a * Math.PI / 180) * l];

  const STYLES = {
    maues: {
      skin: hex("#e9a57e"), skinD: hex("#c98560"), hair: hex("#2a1a14"),
      shirt: (x, y) => hex(hash(x >> 1, y >> 1) > 0.86 ? "#2a5ad6" : "#1f4fc4"), shirtD: hex("#163a94"),
      pants: hex("#f2f2f2"), pantsD: hex("#c8cbd6"), sleeve: 0.45, shortsLen: 0.45,
      head(b, x, y, s) {
        for (let j = 0; j < 15; j++) for (let i = 0; i < 13; i++) if (!((j < 2 || j > 13) && (i < 2 || i > 10))) b.set(x + i, y + j, j > 11 && i < 6 ? s.skinD : s.skin);
        for (let i = -1; i < 14; i++) for (let j = -2; j < 3 + (i < 5 ? 4 : 0); j++) if (!(j === -2 && (i < 1 || i > 11))) b.set(x + i, y + j, s.hair);
        b.set(x + 11, y + 3, s.hair); b.set(x + 12, y + 3, s.hair); b.set(x + 3, y + 8, s.skinD); b.set(x + 3, y + 9, s.skinD);
        const K = OL, G = hex("#bfe6ff");
        for (let i = 5; i < 14; i++) { b.set(x + i, y + 6, K); b.set(x + i, y + 9, K); } [5, 8, 9, 13].forEach(i => { b.set(x + i, y + 7, K); b.set(x + i, y + 8, K); });
        b.set(x + 7, y + 8, K); b.set(x + 11, y + 8, K); b.set(x + 6, y + 7, G); b.set(x + 10, y + 7, G); b.set(x + 4, y + 7, K);
        for (let i = 8; i < 13; i++) b.set(x + i, y + 11, hex("#4a2a1a")); b.set(x + 10, y + 13, s.skinD); b.set(x + 11, y + 13, s.skinD);
      },
      chest(b, sx, sy) { const W = [255, 255, 255]; [[-4, 6], [-3, 5], [-2, 6], [-5, 7], [-1, 7], [-3, 7]].forEach(([i, j]) => b.set(sx + i, sy + j, W)); [[3, 5], [5, 6], [4, 8], [6, 9], [2, 9]].forEach(([i, j]) => b.set(sx + i, sy + j, W)); },
      wrist: hex("#151515"), foot: "chinelo",
    },
    joao: {
      skin: hex("#e0a77a"), skinD: hex("#b9825a"), hair: hex("#1a1a1a"),
      shirt: (x, y) => { const h = hash(Math.floor(x / 3), Math.floor(y / 3)); return hex(h < 0.25 ? "#2a2a1a" : h < 0.5 ? "#4a5530" : h < 0.7 ? "#5b4b33" : h < 0.85 ? "#364121" : "#6b6e45"); },
      shirtD: hex("#2a2a1a"), sleeve: 0.92, shortsLen: 1,
      pants: null, head(b, x, y, s) {
        for (let j = 0; j < 15; j++) for (let i = 0; i < 13; i++) if (!((j < 2 || j > 13) && (i < 2 || i > 10))) b.set(x + i, y + j, j > 10 && i < 7 ? s.skinD : s.skin);
        for (let j = 2; j < 9; j++) for (let i = 0; i < 4; i++) b.set(x + i, y + j, s.hair);
        const B = hex("#22252c"); for (let i = -2; i < 14; i++) for (let j = -3; j < 3; j++) if (!(j === -3 && (i < 2 || i > 10))) b.set(x + i, y + j, B);
        for (let i = -3; i < 3; i++) b.set(x + i, y + 3, B); b.set(x - 3, y + 4, B); b.set(x - 2, y + 4, B);
        const S = hex("#3fa34d"); [[10, -1], [9, 0], [10, 0], [11, 0], [10, 1], [9, 2], [11, 2]].forEach(([i, j]) => b.set(x + i, y + j, S));
        for (let i = 7; i < 13; i++) if (i !== 10) b.set(x + i, y + 6, OL); b.set(x + 9, y + 8, OL); b.set(x + 12, y + 8, OL); b.set(x + 11, y + 10, s.skinD); b.set(x + 12, y + 10, s.skinD);
        for (let i = 9; i < 13; i++) b.set(x + i, y + 12, hex("#7a4a35")); b.set(x + 3, y + 9, s.skinD);
      },
      chest(b, sx, sy) { const C = hex("#7a7d55"); for (let i = -3; i < 4; i++) b.set(sx + i, sy, C); b.set(sx - 4, sy + 1, C); b.set(sx + 4, sy + 1, C); for (let j = 2; j < 22; j += 4) b.set(sx + 1, sy + j, hex("#1f2414")); },
      patch: [hex("#4f7e3a"), hex("#bfe0a0")], foot: "bota",
    },
  };
  STYLES.joao.pants = null;

  // ângulos das poses [braçoTrás(sup,inf), braçoFrente(sup,inf), pernaTrás(sup,inf), pernaFrente(sup,inf)], lean, y (pulo), hipH (auto)
  function poseDef(pose, v, heavy, who) {
    const guard = { ba: [25, 150], fa: [45, 160] };
    const D = { ...guard, bl: [-14, -6], fl: [16, 6], lean: 0, air: 0 };
    const bob = v ? 1 : 0;
    switch (pose) {
      case "idle": return { ...D, bob };
      case "walk": return v ? { ...D, bl: [-4, -12], fl: [22, 12] } : { ...D, bl: [-20, -2], fl: [6, 2] };
      case "punch": return { ...D, fa: [90, 90], ba: [10, 140], lean: 5, bl: [-20, -8], fl: [18, 8] };
      case "jpunch": return { ...D, fa: [115, 115], ba: [20, 150], bl: [40, -40], fl: [70, -20], air: 1 };
      case "kick": return { ...D, fl: [heavy ? 112 : 95, heavy ? 112 : 92], bl: [-10, -6], lean: -7, fa: [40, 150], ba: [-30, 120] };
      case "spin": return { ...D, fl: [92, 92], bl: [-10, -6], lean: -5, fa: [100, 100], ba: [-100, -100] };
      case "jkick": return { ...D, fl: [125, 125], bl: [50, -40], air: 1 };
      case "crouch": return { ...D, bl: [55, -45], fl: [75, -25], crouch: 1 };
      case "cblock": return { ...D, ba: [60, 175], fa: [70, 178], bl: [55, -45], fl: [75, -25], crouch: 1 };
      case "cpunch": return { ...D, fa: [90, 90], bl: [55, -45], fl: [75, -25], crouch: 1, lean: 4 };
      case "ckick": return { ...D, fl: [88, 92], bl: [65, -40], crouch: 1, lean: -6, low: 1 };
      case "cupper": case "upper": return { ...D, fa: [172, 176], ba: [10, 120], bl: pose === "upper" ? [40, -30] : [-14, -6], fl: pose === "upper" ? [80, 10] : [16, 6], lean: -4, air: pose === "upper" ? 1 : 0 };
      case "jump": return { ...D, bl: [45, -45], fl: [75, -20], air: 1 };
      case "block": return { ...D, ba: [55, 175], fa: [65, 178], lean: -2 };
      case "hit": return { ...D, fa: [-40, -20], ba: [-60, -30], lean: -9, bl: [-20, -10], fl: [10, 0] };
      case "win": return who === "joao" ? { ...D, ba: [40, 100], fa: [40, -80], bl: [-8, -4], fl: [8, 4], cross: 1 } : { ...D, fa: [175, 178], ba: [20, 60], bl: [-8, -4], fl: [8, 4] };
      case "down": return { ...D, fa: [100, 100], ba: [80, 80], bl: [-4, -4], fl: [4, 4] };
      default: return D;
    }
  }
  function render(who, pose, v, heavy) {
    const s = STYLES[who], p = poseDef(pose, v, heavy, who), main = new Buf();
    const UL = 15, LL = 15, UA = 12, LA = 12;
    const reach = l => Math.cos(l[0] * Math.PI / 180) * UL + Math.cos(l[1] * Math.PI / 180) * LL;
    let hipY = p.air ? FEET - 46 : FEET - 4 - Math.max(reach(p.bl), reach(p.fl), p.low ? 6 : 0);
    if (p.crouch && p.low) hipY = FEET - 22;
    hipY += p.bob || 0;
    const hipX = HX - 2, torso = p.crouch ? 24 : 27, sx = hipX + p.lean, sy = hipY - torso;
    const part = fn => { const b = new Buf(); fn(b); main.over(b.outline()); };
    const camo = s.shirt, skinT = (x, y) => s.skin;
    const leg = (a, front) => part(b => {
      const [kx, ky] = P(a[0], UL, hipX + (front ? 3 : -3), hipY), [fx, fy] = P(a[1], LL, kx, ky);
      const pc = (x, y, t) => s.pants ? (t < s.shortsLen * 2 ? s.pants : s.skin) : camo(x, y);
      capsule(b, hipX + (front ? 3 : -3), hipY, kx, ky, 4, (x, y, t) => s.pants ? (t < s.shortsLen ? (front ? s.pants : s.pantsD) : s.skin) : camo(x, y));
      capsule(b, kx, ky, fx, fy, 3.5, (x, y, t) => s.foot === "bota" ? (t > 0.6 ? hex(front ? "#b39a6c" : "#9a8258") : camo(x, y)) : (front ? s.skin : s.skinD));
      const dir = Math.abs(a[1]) > 60 ? 0 : 1;
      if (s.foot === "bota") { for (let i = -2; i < 7; i++) for (let j = 0; j < 4; j++) b.set(fx + i * dir, fy + j - (dir ? 0 : 0), hex(j === 3 ? "#5b4a30" : front ? "#b39a6c" : "#9a8258")); }
      else { for (let i = -2; i < 7; i++) { b.set(fx + i * dir, fy + 1, s.skin); b.set(fx + i * dir, fy + 2, s.skin); b.set(fx + i * dir, fy + 3, [255, 255, 255]); }
        b.set(fx + 2 * dir, fy + 1, [255, 255, 255]); b.set(fx + 3 * dir, fy + 2, [255, 255, 255]); b.set(fx + 1 * dir, fy + 2, [255, 255, 255]); }
    });
    const arm = (a, front) => part(b => {
      const shx = sx + (front ? 4 : -4), shy = sy + 3, [ex, ey] = P(a[0], UA, shx, shy), [hx, hy] = P(a[1], LA, ex, ey);
      const sl = (x, y, t) => t < s.sleeve * 2 ? (front ? camo(x, y) : s.shirtD) : s.skin;
      capsule(b, shx, shy, ex, ey, 3.2, (x, y, t) => t < s.sleeve * 1.6 ? (s.pants ? (front ? camo(x, y) : s.shirtD) : camo(x, y)) : (front ? s.skin : s.skinD));
      capsule(b, ex, ey, hx, hy, 3, (x, y, t) => s.pants ? (front ? s.skin : s.skinD) : (t < 0.8 ? camo(x, y) : s.skin));
      capsule(b, hx, hy, hx, hy, 3.6, () => front ? s.skin : s.skinD);
      if (s.wrist && front) { const [wx, wy] = P(a[1], LA - 4, ex, ey); capsule(b, wx, wy, wx, wy, 1.6, () => s.wrist); }
      if (s.patch && front) { const [px, py] = P(a[0], 4, shx, shy); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) b.set(px + i - 1, py + j - 1, s.patch[(i === 1 && j === 1) ? 1 : 0]); }
    });
    arm(p.ba, false); leg(p.bl, false);
    part(b => { // tronco + quadril
      for (let j = 0; j <= torso + 4; j++) { const t = j / torso, cx = Math.round(sx + (hipX - sx) * Math.min(1, t)), w = j < 3 ? 8 - (3 - j) : 9;
        for (let i = -w; i <= w; i++) { const x = cx + i, y = sy + j; b.set(x, y, j > torso - 3 && s.pants ? (i > 5 ? s.pantsD : s.pants) : i < -6 ? s.shirtD : camo(x, y)); } }
      if (!s.pants) for (let i = -9; i <= 9; i++) b.set(hipX + i, hipY - 2, hex("#1f2414"));
      s.chest(b, sx + 1, sy + 2);
    });
    leg(p.fl, true);
    part(b => s.head(b, sx - 6 + (p.lean > 0 ? 2 : p.lean < -4 ? -2 : 0), sy - 16, s));
    if (p.cross) part(b => { for (let i = -8; i < 9; i++) for (let j = 0; j < 5; j++) b.set(sx + i, sy + 9 + j + (i > 0 ? 0 : 1), i > 5 || i < -6 ? s.skin : camo(sx + i, sy + 9 + j)); });
    else arm(p.fa, true);
    const c = document.createElement("canvas"); c.width = c.height = SZ; const x = c.getContext("2d"), id = x.createImageData(SZ, SZ);
    main.d.forEach((col, i) => { if (col) { id.data[i * 4] = col[0]; id.data[i * 4 + 1] = col[1]; id.data[i * 4 + 2] = col[2]; id.data[i * 4 + 3] = 255; } });
    x.putImageData(id, 0, 0); return c;
  }
  const cache = {};
  return {
    SZ, HX, FEET,
    frame(who, pose, v, heavy) { const k = who + pose + (v ? 1 : 0) + (heavy ? 1 : 0); return cache[k] || (cache[k] = render(who, pose, v, heavy)); },
  };
})();
