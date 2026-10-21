const Audio8 = (() => {
  let ctx = null, muted = false, musicOn = false, musicTimer = null, step = 0;
  const init = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === "suspended") ctx.resume(); };
  function tone(f, d, type = "square", v = 0.12, slide = 0) {
    if (!ctx || muted) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d);
  }
  function noise(d, v = 0.2) {
    if (!ctx || muted) return; const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
    const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = v; s.buffer = b; s.connect(g).connect(ctx.destination); s.start();
  }
  const melody = [262, 0, 311, 0, 392, 349, 311, 0, 262, 0, 233, 262, 311, 0, 196, 0];
  const bass = [65, 65, 78, 78, 98, 98, 87, 87];
  function tick() { const n = melody[step % 16]; if (n) tone(n * 2, 0.12, "square", 0.04); if (step % 2 === 0) tone(bass[(step / 2) % 8], 0.2, "triangle", 0.08); step++; }
  return {
    init, get muted() { return muted; },
    toggleMute() { muted = !muted; },
    menu() { tone(660, 0.07); setTimeout(() => tone(990, 0.08), 60); },
    hit() { noise(0.1, 0.25); tone(180, 0.1, "square", 0.1, -100); },
    block() { tone(900, 0.05, "square", 0.06); },
    whoosh() { tone(400, 0.06, "sawtooth", 0.03, -200); },
    special() { tone(200, 0.3, "sawtooth", 0.1, 600); },
    ko() { [523, 392, 262, 131].forEach((f, i) => setTimeout(() => tone(f, 0.25, "square", 0.15), i * 180)); noise(0.6, 0.2); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.2), i * 130)); },
    startMusic() { if (musicOn) return; musicOn = true; musicTimer = setInterval(() => { if (!muted) tick(); }, 150); },
    stopMusic() { musicOn = false; clearInterval(musicTimer); },
  };
})();
