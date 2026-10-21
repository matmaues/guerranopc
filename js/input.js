// Mapeamento de controles por jogador (pronto para adicionar P2 local no futuro)
const CONTROLS = {
  p1: { left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"], up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], punch: ["KeyJ"], kick: ["KeyK"], special: ["KeyL"] },
  // p2: { left:["Numpad4"], right:["Numpad6"], up:["Numpad8"], down:["Numpad5"], punch:["Numpad1"], kick:["Numpad2"], special:["Numpad3"] },
};
const Input = (() => {
  const down = new Set(), pressed = new Set();
  const press = k => { if (!down.has(k)) pressed.add(k); down.add(k); Audio8.init(); };
  const release = k => down.delete(k);
  addEventListener("keydown", e => { press(e.code); if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault(); });
  addEventListener("keyup", e => release(e.code));
  document.querySelectorAll(".tb").forEach(b => {
    const k = b.dataset.k;
    b.addEventListener("touchstart", e => { e.preventDefault(); press(k); });
    b.addEventListener("touchend", e => { e.preventDefault(); release(k); });
    b.addEventListener("mousedown", () => press(k)); b.addEventListener("mouseup", () => release(k));
  });
  return {
    isDown: k => down.has(k), wasPressed: k => pressed.has(k), endFrame: () => pressed.clear(),
    // Lê o estado de um jogador humano a partir de CONTROLS
    player(map) { const s = {}, p = {}; for (const a in map) { s[a] = map[a].some(k => down.has(k)); p[a] = map[a].some(k => pressed.has(k)); } return { held: s, pressed: p }; },
  };
})();
