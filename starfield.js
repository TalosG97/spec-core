(function () {
  'use strict';

  // Create and insert the canvas
  var canvas = document.createElement('canvas');
  canvas.id = 'starfield';
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('starfield')) {
      document.body.insertBefore(canvas, document.body.firstChild || null);
    }
    init();
  });

  var ctx, dpr, width, height, stars, running = true;

  function init() {
    ctx = canvas.getContext('2d', { alpha: true });
    dpr = Math.max(1, window.devicePixelRatio || 1);
    resize();
    createStars();
    loop();

    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', function () {
      running = document.visibilityState === 'visible';
      if (running) loop();
    });
  }

  function onResize() {
    // throttle resize
    if (resize._raf) cancelAnimationFrame(resize._raf);
    resize._raf = requestAnimationFrame(function () {
      resize();
      createStars();
    });
  }

  function resize() {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createStars() {
    // Number of stars scales with area but is capped for perf
    var base = Math.ceil((width * height) / 12000);
    var count = Math.min(350, Math.max(120, base));

    stars = new Array(count);
    for (var i = 0; i < count; i++) {
      stars[i] = spawnStar(true);
    }
  }

  function spawnStar(init) {
    // Layers: slow, medium, fast for parallax
    var layer = Math.random();
    var speed = layer < 0.6 ? 0.08 : (layer < 0.9 ? 0.16 : 0.32); // px per ms
    var size = layer < 0.6 ? rand(0.6, 1.0) : (layer < 0.9 ? rand(0.9, 1.6) : rand(1.3, 2.2));
    return {
      x: init ? Math.random() * width : rand(-10, width + 10),
      y: init ? Math.random() * height : -10,
      vx: rand(-0.02, 0.02),
      vy: speed,
      r: size,
      twinkle: rand(0, Math.PI * 2)
    };
  }

  var last = performance.now();
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    now = now || performance.now();
    var dt = Math.min(32, now - last); // clamp delta for stability
    last = now;

    ctx.clearRect(0, 0, width, height);

    // subtle nebula gradient (very faint)
    var g = ctx.createRadialGradient(width * 0.7, height * 0.3, 0, width * 0.7, height * 0.3, Math.max(width, height));
    g.addColorStop(0, 'rgba(80,110,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // draw stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // wrap
      if (s.y - s.r > height) {
        stars[i] = spawnStar(false);
        continue;
      }
      if (s.x < -20) s.x = width + 20;
      if (s.x > width + 20) s.x = -20;

      // twinkle
      s.twinkle += dt * 0.006;
      var alpha = 0.6 + 0.4 * Math.sin(s.twinkle);

      // soft glow
      ctx.globalAlpha = alpha * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = '#9bbcff';
      ctx.fill();

      // core
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
})();