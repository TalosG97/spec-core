(function () {
  'use strict';

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
    var base = Math.ceil((width * height) / 14000);
    var count = Math.min(320, Math.max(110, base));
    stars = new Array(count);
    for (var i = 0; i < count; i++) stars[i] = spawnStar(true);
  }

  function spawnStar(init) {
    var layer = Math.random();
    // random direction (unit vector) with slight bias to horizontal so it doesn't look like snow
    var angle = (Math.random() * Math.PI * 2);
    var dirx = Math.cos(angle), diry = Math.sin(angle) * 0.5; // reduce vertical component
    var speed = layer < 0.6 ? rand(0.02, 0.05) : (layer < 0.9 ? rand(0.05, 0.09) : rand(0.09, 0.14)); // px per ms
    var size  = layer < 0.6 ? rand(0.6, 1.0) : (layer < 0.9 ? rand(0.9, 1.6) : rand(1.3, 2.2));
    return {
      x: init ? Math.random() * width : (dirx < 0 ? width + 5 : -5),
      y: init ? Math.random() * height : (diry < 0 ? height + 5 : -5),
      vx: dirx * speed,
      vy: diry * speed,
      r: size,
      twinkle: rand(0, Math.PI * 2),
    };
  }

  var last = performance.now();
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    now = now || performance.now();
    var dt = Math.min(32, now - last);
    last = now;

    ctx.clearRect(0, 0, width, height);

    // faint radial tint for depth
    var g = ctx.createRadialGradient(width * 0.65, height * 0.35, 0, width * 0.65, height * 0.35, Math.max(width, height));
    g.addColorStop(0, 'rgba(90,120,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // wrap around screen edges
      if (s.x < -10) s.x = width + 10;
      else if (s.x > width + 10) s.x = -10;
      if (s.y < -10) s.y = height + 10;
      else if (s.y > height + 10) s.y = -10;

      // twinkle + slight color variance (cool whites)
      s.twinkle += dt * 0.006;
      var alpha = 0.6 + 0.4 * Math.sin(s.twinkle);
      var glow = '#a9c3ff';
      ctx.globalAlpha = alpha * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

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
