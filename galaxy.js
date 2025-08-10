
/*! Galaxy Background (auto-init) */
(function (global) {
  'use strict';
  const DEFAULTS = {
    focal: [0.5, 0.5],
    rotation: [1.0, 0.0],
    starSpeed: 0.5,
    density: 1.0,
    hueShift: 140,
    disableAnimation: false,
    speed: 1.0,
    mouseInteraction: true,
    glowIntensity: 0.3,
    saturation: 0.0,
    mouseRepulsion: true,
    twinkleIntensity: 0.3,
    rotationSpeed: 0.1,
    repulsionStrength: 2,
    autoCenterRepulsion: 0,
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
    c.style.zIndex = (zIndex != null ? String(zIndex) : '0'); // 0 so it's above page background but below UI
    c.style.opacity = '1';
    return c;
  }

  function colorFromHSV(h, s, v) {
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
    const dist = Math.pow(r, 1.5);
    const angle = Math.random() * Math.PI * 2;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const radius = Math.min(this.width, this.height) * 0.7 * dist;
    const x = this.cx + radius * cosA;
    const y = this.cy + radius * sinA;
    const depth = 0.3 + Math.random() * 0.7;
    const size = (0.5 + Math.random() * 1.3) * depth;
    const speed = (this.opts.starSpeed * 20) * depth;
    const hueJitter = (Math.random() * 50) - 25;
    const twinklePhase = Math.random() * Math.PI * 2;
    return {
      x: randomPos ? x : this.cx,
      y: randomPos ? y : this.cy,
      vx: 0, vy: 0,
      depth, size, speed,
      hue: (this.opts.hueShift + hueJitter + 360) % 360,
      twinklePhase
    };
  };

  Galaxy.prototype._applyForces = function (dt) {
    const centerRepel = this.opts.autoCenterRepulsion;
    const useMouse = this.opts.mouseInteraction && (this.opts.mouseRepulsion || centerRepel > 0);
    const mx = useMouse && this.mouse.inside ? this.mouse.x : this.cx;
    const my = useMouse && this.mouse.inside ? this.mouse.y : this.cy;

    const theta = this.theta;
    const cosT = Math.cos(theta) * this.rot.x - Math.sin(theta) * this.rot.y;
    const sinT = Math.sin(theta) * this.rot.x + Math.cos(theta) * this.rot.y;

    for (let s of this.stars) {
      let dx = s.x - this.cx;
      let dy = s.y - this.cy;
      let len = Math.hypot(dx, dy) + 1e-6;
      let dirx = dx / len, diry = dy / len;
      const rdx = dirx * cosT - diry * sinT;
      const rdy = dirx * sinT + diry * cosT;
      const v = (s.speed * this.opts.speed);
      s.vx = rdx * v;
      s.vy = rdy * v;

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

      if (s.x < -50 || s.x > this.width + 50 || s.y < -50 || s.y > this.height + 50) {
        const ns = this._makeStar(false);
        s.x = ns.x; s.y = ns.y; s.depth = ns.depth; s.size = ns.size;
        s.speed = ns.speed; s.hue = ns.hue; s.twinklePhase = ns.twinklePhase;
      }
    }
  };

  Galaxy.prototype._draw = function () {
    const ctx = this.ctx;
    if (!this.opts.transparent) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      ctx.clearRect(0, 0, this.width, this.height);
    }

    const glow = Math.max(0, Math.min(1, this.opts.glowIntensity));
    const sat = Math.max(0, Math.min(1, this.opts.saturation));
    const twi = Math.max(0, Math.min(1, this.opts.twinkleIntensity));

    for (let s of this.stars) {
      const tw = (1 - twi) + twi * (0.5 + 0.5 * Math.sin(s.twinklePhase + this.t * 6.283));
      const v = Math.max(0.6, Math.min(1.0, 0.6 + 0.4 * s.depth)) * tw;
      const color = colorFromHSV(s.hue, sat, v);

      if (glow > 0.01) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * (3 + 5 * glow));
        g.addColorStop(0.0, color.replace('rgb', 'rgba').replace(')', `,${0.8 * glow})`));
        g.addColorStop(1.0, color.replace('rgb', 'rgba').replace(')', `,0)`));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (3 + 5 * glow), 0, Math.PI * 2);
        ctx.fill();
      }

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
        this._draw();
        return;
      }
      const dt = Math.min(0.05, (ts - this.lastTS) / 1000);
      this.lastTS = ts;
      this.t += dt;
      this.theta += this.opts.rotationSpeed * dt;
      this._applyForces(dt);
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  };

  function init(options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    let canvas = document.getElementById('galaxy_bg');
    if (!canvas) {
      canvas = createCanvas(0);
      document.body.appendChild(canvas);
    }
    const g = new Galaxy(canvas, opts);
    g.start();
    return g;
  }

  // expose
  global.GalaxyBackground = { init, DEFAULTS };

  // auto-init: allows external config via window.GALAXY_OPTIONS and a flag to disable
  function autoInit() {
    if (global.GALAXY_AUTO_INIT === false) return;
    const opts = global.GALAXY_OPTIONS || {};
    init(opts);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
})(window);
