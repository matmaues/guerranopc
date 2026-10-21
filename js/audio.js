const Audio8 = (() => {
  let ctx = null, muted = false, musicOn = false, musicTimer = null, step = 0;
  const init = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === "suspended") ctx.resume(); };
  function tone(f, d, type = "square", v = 0.12, slide = 0, delay = 0) {
    if (!ctx || muted) return; const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d, v = 0.2, delay = 0, hp = 0) {
    if (!ctx || muted) return; const b = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * d), ctx.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
    const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = v; s.buffer = b;
    let n = s; if (hp) { const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp; s.connect(f); n = f; }
    n.connect(g).connect(ctx.destination); s.start(ctx.currentTime + delay);
  }
  // "voz" sintética: sílabas com formantes de vogais (som original, estilo locutor de fliperama)
  const FORM = { a: [800, 1200], e: [450, 2100], i: [300, 2600], o: [480, 820], u: [330, 700] };
  function syl(v, pitch, dur, delay) {
    if (!ctx || muted) return; const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(pitch * 1.15, t); o.frequency.linearRampToValueAtTime(pitch * 0.85, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.02); g.gain.setValueAtTime(0.5, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    FORM[v].forEach((fr, i) => { const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fr; bp.Q.value = 7; const gg = ctx.createGain(); gg.gain.value = i ? 0.25 : 0.4; o.connect(bp).connect(gg).connect(g); });
    g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const WORDS = {
    round: [["c", 0.03], ["a", 150, 0.13], ["u", 125, 0.28]], fight: [["c", 0.06], ["a", 175, 0.1], ["i", 210, 0.26]],
    ko: [["c", 0.04], ["e", 130, 0.18], ["o", 95, 0.55]], perfect: [["c", 0.03], ["e", 160, 0.12], ["e", 185, 0.1], ["e", 140, 0.25]],
    vs: [["c", 0.05], ["e", 150, 0.14], ["i", 175, 0.3]], win: [["u", 160, 0.14], ["i", 210, 0.32]], super: [["c", 0.08], ["u", 140, 0.14], ["e", 180, 0.3]],
    one: [["u", 150, 0.3]], two: [["o", 150, 0.15], ["i", 170, 0.2]], final: [["c", 0.05], ["i", 160, 0.15], ["a", 140, 0.3]],
  };
  function say(w) { init(); let t = 0; (WORDS[w] || []).forEach(s => { if (s[0] === "c") { noise(s[1], 0.25, t, 2500); t += s[1]; } else { syl(s[0], s[1], s[2], t); t += s[2] * 0.9; } }); }
  const melody = [262, 0, 311, 0, 392, 349, 311, 0, 262, 0, 233, 262, 311, 0, 196, 0, 262, 0, 311, 0, 392, 466, 523, 0, 466, 392, 349, 311, 349, 0, 311, 0];
  const bass = [65, 65, 78, 78, 98, 98, 87, 87];
  function tick() { const n = melody[step % 32]; if (n) tone(n * 2, 0.11, "square", 0.035); if (step % 2 === 0) tone(bass[(step / 2) % 8], 0.18, "triangle", 0.09); if (step % 4 === 2) noise(0.03, 0.05, 0, 5000); step++; }
  return {
    init, say, get muted() { return muted; }, toggleMute() { muted = !muted; },
    menu() { tone(660, 0.06); tone(990, 0.08, "square", 0.12, 0, 0.05); },
    coin() { tone(988, 0.08, "square", 0.12); tone(1319, 0.35, "square", 0.12, 0, 0.08); },
    hit(heavy) { noise(heavy ? 0.18 : 0.08, heavy ? 0.35 : 0.22); tone(heavy ? 120 : 220, 0.12, "square", 0.12, -80); },
    block() { tone(1200, 0.04, "square", 0.06); noise(0.04, 0.08, 0, 3000); },
    whoosh() { noise(0.06, 0.06, 0, 1500); },
    special() { tone(220, 0.25, "sawtooth", 0.08, 500); },
    superSfx() { tone(110, 0.6, "sawtooth", 0.12, 900); noise(0.5, 0.15, 0.1); },
    thud() { tone(70, 0.2, "triangle", 0.25, -30); noise(0.12, 0.15); },
    ko() { [523, 392, 262, 131].forEach((f, i) => tone(f, 0.25, "square", 0.12, 0, i * 0.18)); noise(0.6, 0.2); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, "square", 0.12, 0, i * 0.13)); },
    tick() { tone(440, 0.05, "square", 0.08); },
    startMusic() { if (musicOn) return; musicOn = true; musicTimer = setInterval(() => { if (!muted) tick(); }, 140); },
    stopMusic() { musicOn = false; clearInterval(musicTimer); },
  };
})();
