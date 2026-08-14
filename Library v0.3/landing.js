// ============================================================
// Intelligaia AI UX Pattern Library — landing.js
//
// 1. Strong reveal on intersect (fade-in + translate)
// 2. Continuous parallax: data-parallax-y="-0.06" → --py
// 3. Particle cluster: 6-stop morph + slower easing
//    hex → grid → network → wave → ring → spiral
//    Persists across hero + framework + cats. Fades 0.70..0.95.
// ============================================================
(function () {
  // ─── Reveal on intersect ──────────────────────────────────
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "-60px 0px -60px 0px", threshold: 0.05 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ─── Continuous parallax ──────────────────────────────────
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax-y]"));
  let lastScroll = 0, pTicking = false;
  function updateParallax() {
    const y = window.scrollY;
    for (const el of parallaxEls) {
      const rect = el.getBoundingClientRect();
      const elTop = rect.top + y;
      const rel = y - elTop + window.innerHeight; // 0 when element bottom hits viewport top
      const speed = parseFloat(el.dataset.parallaxY) || 0;
      const py = rel * speed;
      el.style.setProperty("--py", `${py.toFixed(1)}px`);
    }
    pTicking = false;
  }
  function onScroll() {
    lastScroll = window.scrollY;
    if (!pTicking) {
      pTicking = true;
      requestAnimationFrame(updateParallax);
    }
  }
  if (parallaxEls.length) {
    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateParallax);
  }

  // ─── Particle cluster ─────────────────────────────────────
  const canvas = document.getElementById("hero-canvas");
  // Runs on mobile too (kept subtle behind the copy via CSS). Only skipped when
  // the user prefers reduced motion.
  if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const scene = document.querySelector(".scene");
  if (!scene) return;

  const N = 130;

  const state = {
    w: 0, h: 0,
    cx: 0, cy: 0, R: 0,
    t: 0, targetT: 0,
    opacity: 1, targetOpacity: 1,
    mouse: { x: -9999, y: -9999, inside: false },
    particles: [],
  };

  // ─── Shape generators ────────────────────────────────
  function hexTarget(i) {
    if (i === 0) return [0, 0];
    let ring = 1, acc = 1;
    while (acc + 6 * ring <= i) { acc += 6 * ring; ring++; }
    const inRing = i - acc;
    const a = (inRing / (6 * ring)) * Math.PI * 2;
    const step = state.R / 6;
    return [Math.cos(a) * ring * step, Math.sin(a) * ring * step];
  }

  function gridTarget(i) {
    // Square grid
    const cols = Math.ceil(Math.sqrt(N));
    const rows = Math.ceil(N / cols);
    const cell = (state.R * 1.8) / cols;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return [(col - (cols - 1) / 2) * cell, (row - (rows - 1) / 2) * cell];
  }

  function networkTarget(i) {
    const cluster = i % 4;
    const cx = [-0.45, 0.45, -0.45, 0.45][cluster] * state.R;
    const cy = [-0.4, -0.4, 0.4, 0.4][cluster] * state.R;
    const seed = Math.floor(i / 4);
    const a = (seed * 2.39996) % (Math.PI * 2);
    const r = Math.sqrt((seed + 1) / (N / 4)) * state.R * 0.34;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }

  function waveTarget(i) {
    const span = state.R * 2.0;
    const x = ((i / N) * span) - span / 2;
    const phase = (i / N) * Math.PI * 3.5;
    const amp = state.R * 0.45;
    const y = Math.sin(phase) * amp * (0.4 + (i % 3) * 0.2);
    return [x, y];
  }

  function ringTarget(i) {
    const ringIdx = i % 3;
    const ringR = state.R * (0.32 + ringIdx * 0.27);
    const within = Math.floor(i / 3);
    const ringN = Math.ceil(N / 3);
    const a = (within / ringN) * Math.PI * 2 + ringIdx * 0.45;
    return [Math.cos(a) * ringR, Math.sin(a) * ringR];
  }

  function spiralTarget(i) {
    const a = i * 2.39996;
    const r = Math.sqrt(i / N) * state.R * 1.3;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  const smooth = (x) => x * x * (3 - 2 * x);

  // 6 shape stops
  const STOPS = [
    { at: 0.00, fn: hexTarget },
    { at: 0.16, fn: gridTarget },
    { at: 0.34, fn: networkTarget },
    { at: 0.52, fn: waveTarget },
    { at: 0.72, fn: ringTarget },
    { at: 0.92, fn: spiralTarget },
  ];

  function targetFor(i, t) {
    if (t <= STOPS[0].at) return STOPS[0].fn(i);
    if (t >= STOPS[STOPS.length - 1].at) return STOPS[STOPS.length - 1].fn(i);
    for (let s = 0; s < STOPS.length - 1; s++) {
      const a = STOPS[s], b = STOPS[s + 1];
      if (t >= a.at && t <= b.at) {
        const localT = smooth((t - a.at) / (b.at - a.at));
        return lerp2(a.fn(i), b.fn(i), localT);
      }
    }
    return STOPS[0].fn(i);
  }

  // ─── Sizing ──────────────────────────────────────────
  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.w = rect.width;
    state.h = rect.height;
    canvas.width  = Math.floor(rect.width  * DPR);
    canvas.height = Math.floor(rect.height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    state.cx = state.w * (state.w < 900 ? 0.5 : 0.74);
    state.cy = state.h * 0.5;
    state.R  = Math.min(state.w, state.h) * 0.28;
    spawn();
  }

  function spawn() {
    state.particles = [];
    for (let i = 0; i < N; i++) {
      const [tx, ty] = targetFor(i, 0);
      state.particles.push({
        i,
        x: state.cx + tx + (Math.random() - 0.5) * 8,
        y: state.cy + ty + (Math.random() - 0.5) * 8,
        vx: 0, vy: 0,
        r: 1.2 + Math.random() * 1.0,
      });
    }
  }

  // ─── Input ───────────────────────────────────────────
  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    state.mouse.x = x;
    state.mouse.y = y;
    const dx = x - state.cx, dy = y - state.cy;
    state.mouse.inside = dx*dx + dy*dy < (state.R * 1.6) * (state.R * 1.6);
  }
  function onLeave() { state.mouse.inside = false; state.mouse.x = -9999; state.mouse.y = -9999; }

  function onCanvasScroll() {
    const r = scene.getBoundingClientRect();
    const vp = window.innerHeight;
    const total = r.height - vp;
    const progressed = Math.max(0, -r.top);
    const t = Math.min(1, total > 0 ? progressed / total : 0);

    // Freeze shape at the 4-cluster network stage
    state.targetT = Math.min(t, 0.38);

    // Fade out as the CPG image scrolls into view — fully gone when image top hits viewport centre
    const img = document.querySelector(".practices__scenario-img img");
    if (img) {
      const ir = img.getBoundingClientRect();
      const fadeStart = vp;          // image top enters viewport bottom → start fading
      const fadeEnd   = vp * 0.4;   // image top at 40% viewport → fully gone
      state.targetOpacity = Math.max(0, Math.min(1, (ir.top - fadeEnd) / (fadeStart - fadeEnd)));
    } else {
      if (t < 0.82) state.targetOpacity = 1;
      else if (t > 0.97) state.targetOpacity = 0;
      else state.targetOpacity = 1 - (t - 0.82) / (0.97 - 0.82);
    }

    if (r.bottom < 0) state.targetOpacity = 0;
  }

  // ─── Frame loop ──────────────────────────────────────
  function tick() {
    state.t       += (state.targetT - state.t) * 0.03;     // slow morph
    state.opacity += (state.targetOpacity - state.opacity) * 0.08;

    ctx.clearRect(0, 0, state.w, state.h);

    if (state.opacity < 0.01) { requestAnimationFrame(tick); return; }

    const REPEL_R = 160;
    const REPEL_R2 = REPEL_R * REPEL_R;
    const SPRING = 0.020;
    const DAMP = 0.89;

    for (const p of state.particles) {
      const [tx, ty] = targetFor(p.i, state.t);
      const targetX = state.cx + tx;
      const targetY = state.cy + ty;

      p.vx += (targetX - p.x) * SPRING;
      p.vy += (targetY - p.y) * SPRING;

      if (state.mouse.inside) {
        const ddx = p.x - state.mouse.x;
        const ddy = p.y - state.mouse.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < REPEL_R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / REPEL_R) * 0.65;
          p.vx += (ddx / d) * f * 5;
          p.vy += (ddy / d) * f * 5;
        }
      }

      p.vx *= DAMP;
      p.vy *= DAMP;
      p.x  += p.vx;
      p.y  += p.vy;
    }

    // Lines — peak at grid (0.16), network (0.34), ring (0.72)
    const t = state.t;
    let linePresence = 0;
    linePresence = Math.max(linePresence, 1 - Math.min(1, Math.abs(t - 0.16) / 0.18));
    linePresence = Math.max(linePresence, 1 - Math.min(1, Math.abs(t - 0.34) / 0.20));
    linePresence = Math.max(linePresence, (1 - Math.min(1, Math.abs(t - 0.72) / 0.18)) * 0.6);

    if (linePresence > 0.03) {
      const LD = 85;
      const LD2 = LD * LD;
      ctx.lineWidth = 1;
      const ps = state.particles;
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LD2) {
            const o = (1 - Math.sqrt(d2) / LD) * 0.24 * linePresence * state.opacity;
            ctx.strokeStyle = `rgba(12,12,10,${o.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    // Dots — stronger base opacity so they read through glass sections
    for (const p of state.particles) {
      let o = 0.42 * state.opacity;
      if (state.mouse.inside) {
        const ddx = p.x - state.mouse.x;
        const ddy = p.y - state.mouse.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < REPEL_R2) {
          o = (0.42 + (1 - Math.sqrt(d2) / REPEL_R) * 0.45) * state.opacity;
        }
      }
      ctx.fillStyle = `rgba(12,12,10,${o.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  // ─── Boot ────────────────────────────────────────────
  resize();
  onCanvasScroll();
  tick();

  window.addEventListener("resize", resize);
  scene.addEventListener("mousemove", onMove);
  scene.addEventListener("touchmove", onMove, { passive: true });
  scene.addEventListener("mouseleave", onLeave);
  window.addEventListener("scroll", onCanvasScroll, { passive: true });
})();


// ============================================================
// PINNED HERO STORM — the hero pins while you scroll a tall
// .hero-scroll track. Scroll progress (--warp, 0→1) drives:
//   • the big surrounding words flying out + fading (CSS)
//   • the centre heading cross-fading to the section-two text (CSS)
//   • the component cards drifting in from the back (here)
// Honours reduced-motion (pin collapses, no animation).
// ============================================================
(function () {
  var track = document.querySelector(".hero-scroll");
  var hero  = document.querySelector(".hero--tunnel");
  if (!track || !hero) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards = Array.prototype.slice.call(hero.querySelectorAll(".hero-card"));
  var swap  = hero.querySelector(".hero__swap");
  cards.forEach(function (c, i) {
    c._x  = parseFloat(c.style.getPropertyValue("--x")) || 0;
    c._y  = parseFloat(c.style.getPropertyValue("--y")) || 0;
    c._d  = parseFloat(c.style.getPropertyValue("--d")) || 0;
    c._jx = Math.random() * 6.28;                 // jitter phase
    c._jy = Math.random() * 6.28;
  });

  var Z0 = -1700, ZT = 1700;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function apply() {
    if (reduce) { hero.style.setProperty("--warp", "0"); return; }

    var r = track.getBoundingClientRect();
    var span = track.offsetHeight - window.innerHeight;
    var p = clamp01(-r.top / (span || 1));
    hero.style.setProperty("--warp", p.toFixed(3));

    if (r.bottom < -40 || r.top > window.innerHeight + 40) return;  // offscreen: skip card work

    var pa = clamp01((p - 0.18) / 0.60);           // cards arrive by ~0.78
    var mp = clamp01((p - 0.80) / 0.20);           // then merge into one over the last stretch
    var sc = Math.max(0.4, Math.min(1, window.innerWidth / 1320));
    var t  = (window.performance ? performance.now() : Date.now()) / 1000;

    for (var i = 0; i < cards.length; i++) {
      var c  = cards[i];
      var ep = clamp01(pa * 1.6 - c._d);
      var z  = Z0 + ep * ZT;                        // -1700 (deep) → 0 (arrived)
      var rx = c._x * sc, ry = c._y * sc;
      // merge: converge to centre, drift down, shrink into one
      var mx = rx * (1 - mp);
      var my = ry * (1 - mp) + mp * 140;
      var scl = 1 - mp * 0.72;
      // gentle continuous jitter so they never sit in a rigid grid
      var jx = Math.sin(t * 0.7 + c._jx) * 5;
      var jy = Math.cos(t * 0.62 + c._jy) * 5;
      var op = clamp01(ep * 2) * (1 - clamp01((mp - 0.55) / 0.45));
      c.style.opacity = op.toFixed(3);
      c.style.transform =
        "translate(-50%,-50%) translate3d(" + (mx + jx).toFixed(1) + "px," +
        (my + jy).toFixed(1) + "px," + z.toFixed(1) + "px) scale(" + scl.toFixed(3) + ")";
    }

    // second heading: fade in, then out as the cards merge away
    if (swap) swap.style.opacity = (clamp01((p - 0.5) / 0.25) * (1 - mp)).toFixed(3);
  }

  function loop() { requestAnimationFrame(loop); apply(); }
  loop();
})();
