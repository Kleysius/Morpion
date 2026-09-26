/**
 * Effets : sons synthétisés (Web Audio, aucun fichier à charger),
 * confettis sur canvas, et persistance locale.
 */
(function (root) {
  'use strict';

  const reducedMotion = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sons ---------- */
  const Sound = (() => {
    let ctx = null;
    let enabled = true;

    function audio() {
      if (!ctx) {
        const Ctx = root.AudioContext || root.webkitAudioContext;
        if (!Ctx) return null;
        ctx = new Ctx();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function tone(freq, { at = 0, duration = 0.12, type = 'sine', volume = 0.12, slide = 0 } = {}) {
      const ac = audio();
      if (!ac) return;
      const t = ac.currentTime + at;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + duration);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    }

    const sounds = {
      x: () => tone(660, { type: 'triangle', slide: 1.25, duration: 0.1 }),
      o: () => tone(440, { type: 'triangle', slide: 0.8, duration: 0.12 }),
      vanish: () => tone(900, { type: 'sine', slide: 0.4, duration: 0.18, volume: 0.05 }),
      invalid: () => tone(140, { type: 'square', duration: 0.08, volume: 0.05 }),
      hint: () => { tone(880, { duration: 0.08, volume: 0.06 }); tone(1320, { at: 0.08, duration: 0.12, volume: 0.06 }); },
      win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.09, duration: 0.25, type: 'triangle' })),
      lose: () => [392, 330, 262].forEach((f, i) => tone(f, { at: i * 0.14, duration: 0.3, type: 'sawtooth', volume: 0.05 })),
      draw: () => { tone(440, { duration: 0.2 }); tone(440, { at: 0.18, duration: 0.25, slide: 0.9 }); },
    };

    return {
      play(name) { if (enabled && sounds[name]) try { sounds[name](); } catch (_) { /* audio indisponible */ } },
      get enabled() { return enabled; },
      set enabled(value) { enabled = Boolean(value); },
    };
  })();

  /* ---------- Confettis ---------- */
  function confetti(canvas, colors) {
    if (!canvas || reducedMotion()) return;
    const ctx = canvas.getContext('2d');
    const dpr = root.devicePixelRatio || 1;
    const w = (canvas.width = root.innerWidth * dpr);
    const h = (canvas.height = root.innerHeight * dpr);
    const pieces = Array.from({ length: 160 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.45,
      vx: (Math.random() - 0.5) * 22 * dpr,
      vy: (-Math.random() * 22 - 8) * dpr,
      size: (Math.random() * 8 + 5) * dpr,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      round: Math.random() < 0.35,
    }));
    const start = performance.now();
    const gravity = 0.55 * dpr;

    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 1800) / 900);
      for (const p of pieces) {
        p.vy += gravity;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
      if (elapsed < 2700) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Persistance ---------- */
  const Storage = {
    load(key, fallback) {
      try {
        const raw = root.localStorage.getItem(key);
        return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
      } catch (_) {
        return { ...fallback };
      }
    },
    save(key, value) {
      try { root.localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* navigation privée, quota… */ }
    },
  };

  root.Morpion = root.Morpion || {};
  Object.assign(root.Morpion, { Sound, confetti, Storage, reducedMotion });
})(typeof window !== 'undefined' ? window : globalThis);
