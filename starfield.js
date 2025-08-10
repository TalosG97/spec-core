(function () {
  'use strict';

  // Config
  var STAR_COUNT_BASE = 220;     // base number of stars (scaled by screen area)
  var STAR_COUNT_MAX  = 420;
  var TWINKLE_SPEED   = 0.0035;  // lower = slower twinkle
  var LAYERS = [                // depth layers for subtle parallax
    {depth: 0.35, size:[0.7,1.2], glow:'#7aa2ff'},
    {depth: 0.55, size:[0.9,1.6], glow:'#9bbcff'},
    {depth: 0.85, size:[1.2,2.2], glow:'#cfe0ff'}
  ];

  // Canvas
  var canvas = document.createElement('canvas');
  canvas.id = 'starfield';
  var ctx, dpr = Math.max(1, window.devicePixelRatio || 1);
  var width=0, height=0;

  // Mouse parallax
  var mx = 0, my = 0, targetMX = 0, targetMY = 0;

  // Stars
  var stars = [];
  function makeStar(layer) {
    var smin = layer.size[0], smax = layer.size[1];
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(smin, smax),
      t: Math.random() * Math.PI * 2,   // phase for twinkle
      depth: layer.depth,
      glow: layer.glow
    };
  }

  function resetStars() {
    var area = width * height;
    var count = Math.min(STAR_COUNT_MAX, Math.max(STAR_COUNT_BASE, Math.floor(area/14000)));
    stars.length = 0;
    // distribute stars roughly evenly across layers
    for (var i=0; i<count; i++) {
      var layer = LAYERS[(i % LAYERS.length)];
      stars.push(makeStar(layer));
    }
  }

  function resize() {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    resetStars();
  }

  function onMouseMove(e) {
    targetMX = (e.clientX / width) * 2 - 1;   // -1..1
    targetMY = (e.clientY / height) * 2 - 1;  // -1..1
  }

  function onTouchMove(e) {
    if (e.touches && e.touches.length) {
      var t = e.touches[0];
      targetMX = (t.clientX / width) * 2 - 1;
      targetMY = (t.clientY / height) * 2 - 1;
    }
  }

  function draw(now) {
    requestAnimationFrame(draw);
    // ease mouse so movement is smooth
    mx += (targetMX - mx) * 0.05;
    my += (targetMY - my) * 0.05;

    ctx.clearRect(0, 0, width, height);

    // faint nebula tint
    var g = ctx.createRadialGradient(width*0.7, height*0.3, 0, width*0.7, height*0.3, Math.max(width,height));
    g.addColorStop(0, 'rgba(120,150,255,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    for (var i=0; i<stars.length; i++) {
      var s = stars[i];
      // parallax offset based on depth and mouse
      var px = s.x + mx * (1 - s.depth) * 25;
      var py = s.y + my * (1 - s.depth) * 25;

      // twinkle
      s.t += TWINKLE_SPEED;
      var alpha = 0.65 + 0.35 * Math.sin(s.t);

      // glow
      ctx.globalAlpha = alpha * 0.25;
      ctx.beginPath();
      ctx.arc(px, py, s.r * 3, 0, Math.PI*2);
      ctx.fillStyle = s.glow;
      ctx.fill();

      // core
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function init() {
    ctx = canvas.getContext('2d', { alpha: true });
    document.body.insertBefore(canvas, document.body.firstChild || null);
    resize();
    draw();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', init);

  function rand(min, max){ return min + Math.random() * (max - min); }
})();
