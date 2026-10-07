/* ============================================================
   TEXT LOOP — a vanilla-JS port of React Bits' <TextLoop />
   (JavaScript + CSS variant, GSAP-driven). Same props, same
   geometry, same two-textPath seamless loop; no React needed,
   because this site is static HTML.

   Usage
     <div data-text-loop='{"text":"Blogs coming soon","shape":"wave"}'></div>
     <script src="vendor/gsap.min.js"></script>
     <script src="text-loop.js"></script>

   or  TextLoop.mount(el, { text: '…', shape: 'wave', … })

   Props (same names and defaults as the React component):
     text, shape (wave|circle|infinity|arch|line), path, speed,
     direction (forward|reverse), separator, curviness, fontSize,
     fontWeight, letterSpacing, uppercase, color, ribbon,
     ribbonColor, ribbonWidth, pauseOnHover, className, style
   ============================================================ */
(function () {
  var VIEW_W = 1200, VIEW_H = 520, CX = VIEW_W / 2, CY = VIEW_H / 2, EDGE_PAD = 6;
  var SVG = 'http://www.w3.org/2000/svg';
  var uid = 0;

  var DEFAULTS = {
    text: 'React ✦ Bits', shape: 'wave', path: undefined, speed: 90, direction: 'forward',
    separator: '✦', curviness: 90, fontSize: 46, fontWeight: 800, letterSpacing: 2,
    uppercase: true, color: '#ffffff', ribbon: true, ribbonColor: '#5227FF', ribbonWidth: 86,
    pauseOnHover: true, className: '', style: {}
  };

  function buildPath(shape, curviness, ribbonWidth) {
    var c = Math.max(0, curviness);
    var room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);
    switch (shape) {
      case 'circle': {
        var r = Math.min(90 + c * 0.95, room);
        return 'M ' + (CX - r) + ' ' + CY + ' A ' + r + ' ' + r + ' 0 1 1 ' + (CX + r) + ' ' + CY +
               ' A ' + r + ' ' + r + ' 0 1 1 ' + (CX - r) + ' ' + CY + ' Z';
      }
      case 'infinity': {
        var ri = 150 + c * 1.4, h = Math.min(60 + c * 0.95, room);
        return [
          'M ' + CX + ' ' + CY,
          'C ' + (CX + ri * 0.55) + ' ' + (CY - h) + ' ' + (CX + ri) + ' ' + (CY - h) + ' ' + (CX + ri) + ' ' + CY,
          'C ' + (CX + ri) + ' ' + (CY + h) + ' ' + (CX + ri * 0.55) + ' ' + (CY + h) + ' ' + CX + ' ' + CY,
          'C ' + (CX - ri * 0.55) + ' ' + (CY - h) + ' ' + (CX - ri) + ' ' + (CY - h) + ' ' + (CX - ri) + ' ' + CY,
          'C ' + (CX - ri) + ' ' + (CY + h) + ' ' + (CX - ri * 0.55) + ' ' + (CY + h) + ' ' + CX + ' ' + CY,
          'Z'
        ].join(' ');
      }
      case 'arch': {
        var rise = Math.min(120 + c * 1.1, room * 2);
        return 'M 120 ' + (CY + rise / 2) + ' Q ' + CX + ' ' + (CY - rise * 1.5) + ' ' + (VIEW_W - 120) + ' ' + (CY + rise / 2);
      }
      case 'line':
        return 'M -320 ' + CY + ' L ' + (VIEW_W + 320) + ' ' + CY;
      case 'wave':
      default: {
        var a = Math.min(c * 2.2, room * 2);
        return 'M -320 ' + CY + ' Q -160 ' + (CY - a) + ' 0 ' + CY + ' T 320 ' + CY + ' T 640 ' + CY +
               ' T 960 ' + CY + ' T 1280 ' + CY + ' T ' + (VIEW_W + 320) + ' ' + CY;
      }
    }
  }

  function el(name, attrs) {
    var n = document.createElementNS(SVG, name);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k]);
    return n;
  }

  function mount(root, opts) {
    if (!root || root.__textLoop) return root && root.__textLoop;
    var p = {};
    for (var k in DEFAULTS) p[k] = DEFAULTS[k];
    for (var j in (opts || {})) if (opts[j] !== undefined) p[j] = opts[j];

    var pathId = 'text-loop-' + (++uid);
    var d = p.path || buildPath(p.shape, p.curviness, p.ribbonWidth);
    var base = p.uppercase ? String(p.text).toUpperCase() : String(p.text);
    var unit = base + (p.separator ? ' ' + p.separator + ' ' : '   ');
    var textStyle = 'font-size:' + p.fontSize + 'px;font-weight:' + p.fontWeight + ';letter-spacing:' + p.letterSpacing + 'px';

    root.classList.add('text-loop');
    if (p.className) String(p.className).split(/\s+/).forEach(function (c) { if (c) root.classList.add(c); });
    for (var s in (p.style || {})) root.style[s] = p.style[s];

    var svg = el('svg', { 'class': 'text-loop-svg', viewBox: '0 0 ' + VIEW_W + ' ' + VIEW_H,
                          preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': p.text });
    var pathEl = el('path', { id: pathId, d: d, fill: 'none',
                              stroke: p.ribbon ? p.ribbonColor : 'none', 'stroke-width': p.ribbon ? p.ribbonWidth : 0,
                              'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var measureEl = el('text', { 'class': 'text-loop-measure', style: textStyle, 'aria-hidden': 'true' });
    measureEl.textContent = unit;
    function loopText() {
      var t = el('text', { 'class': 'text-loop-text', style: textStyle, fill: p.color,
                           'dominant-baseline': 'central', 'aria-hidden': 'true', lengthAdjust: 'spacing' });
      var tp = el('textPath', { href: '#' + pathId, startOffset: 0 });
      tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + pathId);
      t.appendChild(tp);
      return { text: t, path: tp };
    }
    var head = loopText(), tail = loopText();
    svg.appendChild(pathEl); svg.appendChild(measureEl); svg.appendChild(head.text); svg.appendChild(tail.text);
    root.textContent = '';
    root.appendChild(svg);

    var length = 0, tween = null, raf = null;

    function apply(offset) {
      var partner = offset >= 0 ? offset - length : offset + length;
      head.path.setAttribute('startOffset', String(offset));
      tail.path.setAttribute('startOffset', String(partner));
    }

    function stop() {
      if (tween) { tween.kill(); tween = null; }
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    function start() {
      stop();
      apply(0);
      var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || p.speed <= 0 || !length) return;
      var target = p.direction === 'reverse' ? -length : length;
      if (window.gsap) {
        var state = { offset: 0 };
        tween = window.gsap.to(state, { offset: target, duration: length / p.speed, ease: 'none', repeat: -1,
                                        onUpdate: function () { apply(state.offset); } });
      } else {
        /* No GSAP on the page: the same linear, repeating motion with rAF. */
        var t0 = null, paused = false, acc = 0;
        api.pause = function () { paused = true; };
        api.resume = function () { paused = false; t0 = null; };
        (function frame(ts) {
          if (!paused) {
            if (t0 !== null) acc += (ts - t0) / 1000;
            t0 = ts;
            var o = (acc * p.speed) % length;
            apply(p.direction === 'reverse' ? -o : o);
          }
          raf = requestAnimationFrame(frame);
        })(performance.now());
      }
    }

    function measure() {
      var len = 0, unitW = 0;
      try { len = pathEl.getTotalLength(); unitW = measureEl.getComputedTextLength(); } catch (e) { return; }
      if (!len) return;
      var reps = unitW > 0 ? Math.max(1, Math.round(len / unitW)) : 1;
      var str = new Array(reps + 1).join(unit);
      [head, tail].forEach(function (x) {
        x.path.textContent = str;
        x.text.setAttribute('textLength', String(len));
      });
      if (len !== length) { length = len; start(); }
    }

    var api = {
      pause: function () { if (tween) tween.pause(); },
      resume: function () { if (tween) tween.resume(); },
      destroy: function () { stop(); root.textContent = ''; root.__textLoop = null; }
    };

    if (p.pauseOnHover) {
      root.addEventListener('pointerenter', function () { api.pause(); });
      root.addEventListener('pointerleave', function () { api.resume(); });
    }

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(function () {});

    root.__textLoop = api;
    return api;
  }

  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-text-loop]'), function (n) {
      var o = {};
      try { o = JSON.parse(n.getAttribute('data-text-loop') || '{}'); } catch (e) {}
      mount(n, o);
    });
  }

  window.TextLoop = { mount: mount, buildPath: buildPath };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
