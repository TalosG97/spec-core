(function () {
  'use strict';

  var canvas = document.createElement('canvas');
  canvas.id = 'starfield';
  var ctx, dpr, width, height;
  var stars = [];
  var STAR_COUNT = 250;
  var SPEED = 0.015; // lower = slower warp
  var MAX_Z = 1.0;   // closest depth
  var MIN_Z = 0.1;   // farthest depth

  function init() {
    ctx = canvas.getContext('2d', { alpha: true });
    dpr = Math.max(1, window.devicePixelRatio || 1);
    document.body.insertBefore(canvas, document.body.firstChild || null);
    resize();
    createStars();
    requestAnimationFrame(loop);

    window.addEventListener('resize', resize, { passive: true });
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
    stars.length = 0;
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: Math.random(),
        pz: 0
      });
    }
  }

  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, width, height);

    // faint nebula glow
    var g = ctx.createRadialGradient(width*0.5, height*0.5, 0, width*0.5, height*0.5, Math.max(width,height));
    g.addColorStop(0, 'rgba(120,150,255,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    var cx = width / 2;
    var cy = height / 2;

    for (var i = 0; i < STAR_COUNT; i++) {
      var s = stars[i];
      s.pz = s.z;
      s.z -= SPEED;
      if (s.z < MIN_Z) {
        // reset star to far distance
        s.x = (Math.random() - 0.5) * width;
        s.y = (Math.random() - 0.5) * height;
        s.z = MAX_Z;
        s.pz = s.z;
      }

      var sx = cx + (s.x / s.z);
      var sy = cy + (s.y / s.z);
      var px = cx + (s.x / s.pz);
      var py = cy + (s.y / s.pz);

      var alpha = 0.7;
      ctx.strokeStyle = "rgba(255,255,255,"+alpha+")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();