
/*!
 * Galaxy Background (EDSY-friendly)
 * Lightweight, dependency-free canvas starfield with configurable options.
 * (c) 2025 Gerald + ChatGPT. MIT License.
 */
(function (global) {
  'use strict';

  const DEFAULTS = {
    focal: [0.5, 0.5],          // [x, y] in 0..1
    rotation: [1.0, 0.0],       // [cosθ, sinθ] or arbitrary x,y; will be normalized
    starSpeed: 0.5,             // base star speed
    density: 1.0,               // 1 = 2000 stars on 1920x1080 (scaled by area)
    hueShift: 140,              // degrees 0..360
    disableAnimation: false,
    speed: 1.0,                 // global speed multiplier
    mouseInteraction: true,
    glowIntensity: 0.3,         // 0..1
    saturation: 0.0,            // 0..1
    mouseRepulsion: true,
    twinkleIntensity: 0.3,      // 0..1
    rotationSpeed: 0.1,         // radians per second
    repulsionStrength: 2.0,     // 0..∞
    autoCenterRepulsion: 0.0,   // 0..∞
    transparent: true
  };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return min + Math.random() * (max - min); }

  function createCanvas(zIndex) {
    const c = document.createElement('canvas');
    c.id = 'galaxy_bg';
    c.style.position = 'fixed';
    c.style.left = '0';
    c.style.top = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.pointerEvents = 'none';
    c.style.zIndex = (zIndex != null ? String(zIndex) : '-1');
    c.style.opacity = '1';
    return c;
  }

  function colorFromHSV(h, s, v) {
    // h: 0..360, s:0..1, v:0..1
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r=0,g=0,b=0;
    if (h < 60) [r,g,b] = [c,x,0];
    else if (h < 120) [r,g,b] = [x,c,0];
    else if (h < 180) [r,g,b] = [0,c,x];
    else if (h < 240) [r,g,b] = [0,x,c];
    else if (h < 300) [r,g,b] = [x,0,c];
    else [r,g,b] = [c,0,x];
    const R = Math.round((r + m) * 255);
    const G = Math.round((g + m) * 255);
    const B = Math.round((b + m) * 255);
    return `rgb(${R},${G},${B})`;
  }

  function Galaxy(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: !!opts.transparent });
    this.opts = Object.assign({}, DEFAULTS, opts || {});
    this.pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.stars = [];
    this.t = 0;
    this.lastTS = 0;
    this.width = 0;
    this.height = 0;
    this.cx = 0;
    this.cy = 0;
    this.mouse = { x: 0, y: 0, inside: false };
    this.theta = 0;
    this._raf = null;

    // normalize rotation
    const [rx, ry] = this.opts.rotation;
    const len = Math.max(1e-6, Math.hypot(rx, ry));
    this.rot = { x: rx / len, y: ry / len };

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * this.pixelRatio;
      this.mouse.y = (e.clientY - rect.top) * this.pixelRatio;
      this.mouse.inside = true;
    };
    this._onMouseLeave = () => { this.mouse.inside = false; };

    if (this.opts.mouseInteraction) {
      window.addEventListener('mousemove', this._onMouseMove, { passive: true });
      window.addEventListener('mouseout', this._onMouseLeave, { passive: true });
    }

    this.resize();
    this._spawnStars();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  Galaxy.prototype.resize = function () {
    const pr = this.pixelRatio;
    const w = Math.floor(window.innerWidth * pr);
    const h = Math.floor(window.innerHeight * pr);
    if (w === this.width && h === this.height) return;
    this.width = this.canvas.width = w;
    this.height = this.canvas.height = h;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.cx = this.width * clamp(this.opts.focal[0], 0, 1);
    this.cy = this.height * clamp(this.opts.focal[1], 0, 1);
  };

  Galaxy.prototype._spawnStars = function () {
    const area = (this.width * this.height) / (1920 * 1080);
    const count = Math.floor(lerp(800, 2200, clamp(this.opts.density, 0, 3))) * area;
    this.stars.length = 0;
    for (let i = 0; i < count; i++) {
      this.stars.push(this._makeStar(true));
    }
  };

  Galaxy.prototype._makeStar = function (randomPos) {
    const r = Math.random();
    const dist = Math.pow(r, 1.5); // bias towards outer rim
    const angle = rand(0, Math.PI * 2);
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const radius = Math.min(this.width, this.height) * 0.7 * dist;
    const x = this.cx + radius * cosA;
    const y = this.cy + radius * sinA;
    const depth = rand(0.3, 1.0);         // z-like factor for parallax
    const size = lerp(0.5, 1.8, Math.pow(Math.random(), 2)) * depth;
    const speed = (this.opts.starSpeed * 20) * depth; // px/sec base
    const hueJitter = rand(-25, 25);
    const twinklePhase = rand(0, Math.PI * 2);

    return {
      x: randomPos ? x : this.cx,
      y: randomPos ? y : this.cy,
      vx: 0, vy: 0,
      depth,
      size,
      speed,
      hue: (this.opts.hueShift + hueJitter + 360) % 360,
      twinklePhase
    };
  };

  Galaxy.prototype._applyForces = function (dt) {
    const pr = this.pixelRatio;
    const centerRepel = this.opts.autoCenterRepulsion;
    const useMouse = this.opts.mouseInteraction && (this.opts.mouseRepulsion || centerRepel > 0);
    const mx = useMouse && this.mouse.inside ? this.mouse.x : this.cx;
    const my = useMouse && this.mouse.inside ? this.mouse.y : this.cy;

    const theta = this.theta;
    const cosR = Math.cos(theta) * this.rot.x - Math.sin(theta) * this.rot.y;
    const sinR = Math.sin(theta) * this.rot.x + Math.cos(theta) * this.rot.y;

    for (let s of this.stars) {
      // base outflow velocity (from focal point), rotated by rotation matrix
      let dx = s.x - this.cx;
      let dy = s.y - this.cy;
      let len = Math.hypot(dx, dy) + 1e-6;
      let dirx = (dx / len), diry = (dy / len);
      // rotate direction
      const rdx = dirx * cosR - diry * sinR;
      const rdy = dirx * sinR + diry * cosR;

      // base velocity
      const v = (s.speed * this.opts.speed);
      s.vx = rdx * v;
      s.vy = rdy * v;

      // repulsion
      if (useMouse) {
        const rdxm = s.x - mx;
        const rdym = s.y - my;
        const d2 = rdxm * rdxm + rdym * rdym + 1;
        const f = (this.opts.repulsionStrength * 1200) / d2;
        s.vx += (rdxm / Math.sqrt(d2)) * f * (this.mouse.inside ? 1 : centerRepel);
        s.vy += (rdym / Math.sqrt(d2)) * f * (this.mouse.inside ? 1 : centerRepel);
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // wrap-around respawn if out of bounds
      if (s.x < -50 || s.x > this.width + 50 || s.y < -50 || s.y > this.height + 50) {
        const ns = this._makeStar(false);
        s.x = ns.x; s.y = ns.y; s.depth = ns.depth; s.size = ns.size;
        s.speed = ns.speed; s.hue = ns.hue; s.twinklePhase = ns.twinklePhase;
      }
    }
  };

  Galaxy.prototype._draw = function (dt) {
    const ctx = this.ctx;
    if (!this.opts.transparent) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      ctx.clearRect(0, 0, this.width, this.height);
    }

    const glow = clamp(this.opts.glowIntensity, 0, 1);
    const sat = clamp(this.opts.saturation, 0, 1);
    const twi = clamp(this.opts.twinkleIntensity, 0, 1);

    for (let s of this.stars) {
      // twinkle factor
      const tw = (1 - twi) + twi * (0.5 + 0.5 * Math.sin(s.twinklePhase + this.t * 6.283));
      const v = clamp(0.6 + 0.4 * s.depth, 0.6, 1.0) * tw;
      const color = colorFromHSV(s.hue, sat, v);

      // draw glow with radial gradient
      if (glow > 0.01) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * (3 + 5 * glow));
        g.addColorStop(0.0, color.replace('rgb', 'rgba').replace(')', `,${0.8 * glow})`));
        g.addColorStop(1.0, color.replace('rgb', 'rgba').replace(')', `,0)`));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (3 + 5 * glow), 0, Math.PI * 2);
        ctx.fill();
      }

      // bright core
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  Galaxy.prototype.start = function () {
    if (this._raf) return;
    this.lastTS = performance.now();
    const loop = (ts) => {
      if (this.opts.disableAnimation) {
        this._draw(0);
        return;
      }
      const dt = Math.min(0.05, (ts - this.lastTS) / 1000);
      this.lastTS = ts;
      this.t += dt;
      this.theta += this.opts.rotationSpeed * dt;
      this._applyForces(dt);
      this._draw(dt);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  };

  Galaxy.prototype.stop = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  };

  Galaxy.prototype.destroy = function () {
    this.stop();
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseout', this._onMouseLeave);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  };

  function init(options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    let canvas = document.getElementById('galaxy_bg');
    if (!canvas) {
      canvas = createCanvas(-1);
      document.body.appendChild(canvas);
    }
    const g = new Galaxy(canvas, opts);
    g.start();
    return g;
  }

  global.GalaxyBackground = { init, DEFAULTS };
})(window);
