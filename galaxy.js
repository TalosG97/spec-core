
/*! Galaxy (OGL) — standalone UMD version for static sites */
(function(global){'use strict';
  // Requires window.OGL (UMD). Include before this script:
  // <script src="https://unpkg.com/ogl@0.0.110/dist/ogl.umd.js"></script>

  var DEFAULTS = {
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
    repulsionStrength: 2.0,
    autoCenterRepulsion: 0.0,
    transparent: true
  };

  function GalaxyOGL(container, options) {
    var OGL = global.OGL;
    if (!OGL) throw new Error('OGL UMD not found. Include it before galaxy-ogl.js');

    this.opts = Object.assign({}, DEFAULTS, options||{});
    this.container = container || document.body;

    var renderer = this.renderer = new OGL.Renderer({
      alpha: !!this.opts.transparent,
      premultipliedAlpha: false,
      dpr: Math.min(2, global.devicePixelRatio || 1)
    });
    var gl = this.gl = renderer.gl;

    // mount canvas
    var cnv = gl.canvas;
    cnv.id = 'galaxy_ogl';
    cnv.style.position = 'fixed';
    cnv.style.left = '0';
    cnv.style.top = '0';
    cnv.style.width = '100%';
    cnv.style.height = '100%';
    cnv.style.zIndex = '0';
    cnv.style.pointerEvents = 'none';
    this.container.appendChild(cnv);

    if (this.opts.transparent) gl.clearColor(0,0,0,0); else gl.clearColor(0,0,0,1);
    if (this.opts.transparent) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }

    this.geometry = new OGL.Triangle(gl);
    this.program = new OGL.Program(gl, {
      vertex: '\nattribute vec2 uv;\nattribute vec2 position;\nvarying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4(position, 0.0, 1.0);\n}\n',
      fragment: '\nprecision highp float;\n\nuniform float uTime;\nuniform vec3 uResolution;\nuniform vec2 uFocal;\nuniform vec2 uRotation;\nuniform float uStarSpeed;\nuniform float uDensity;\nuniform float uHueShift;\nuniform float uSpeed;\nuniform vec2 uMouse;\nuniform float uGlowIntensity;\nuniform float uSaturation;\nuniform bool uMouseRepulsion;\nuniform float uTwinkleIntensity;\nuniform float uRotationSpeed;\nuniform float uRepulsionStrength;\nuniform float uMouseActiveFactor;\nuniform float uAutoCenterRepulsion;\nuniform bool uTransparent;\n\nvarying vec2 vUv;\n\n#define NUM_LAYER 4.0\n#define STAR_COLOR_CUTOFF 0.2\n#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)\n#define PERIOD 3.0\n\nfloat Hash21(vec2 p) {\n  p = fract(p * vec2(123.34, 456.21));\n  p += dot(p, p + 45.32);\n  return fract(p.x * p.y);\n}\n\nfloat tri(float x) { return abs(fract(x) * 2.0 - 1.0); }\n\nfloat tris(float x) {\n  float t = fract(x);\n  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));\n}\n\nfloat trisn(float x) {\n  float t = fract(x);\n  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;\n}\n\nvec3 hsv2rgb(vec3 c) {\n  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nfloat Star(vec2 uv, float flare) {\n  float d = length(uv);\n  float m = (0.05 * uGlowIntensity) / d;\n  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));\n  m += rays * flare * uGlowIntensity;\n  uv *= MAT45;\n  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));\n  m += rays * 0.3 * flare * uGlowIntensity;\n  m *= smoothstep(1.0, 0.2, d);\n  return m;\n}\n\nvec3 StarLayer(vec2 uv) {\n  vec3 col = vec3(0.0);\n  vec2 gv = fract(uv) - 0.5; \n  vec2 id = floor(uv);\n\n  for (int y = -1; y <= 1; y++) {\n    for (int x = -1; x <= 1; x++) {\n      vec2 offset = vec2(float(x), float(y));\n      vec2 si = id + offset;\n      float seed = Hash21(si);\n      float size = fract(seed * 345.32);\n      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));\n      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;\n\n      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;\n      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;\n      float grn = min(red, blu) * seed;\n      vec3 base = vec3(red, grn, blu);\n      \n      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;\n      hue = fract(hue + uHueShift / 360.0);\n      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;\n      float val = max(max(base.r, base.g), base.b);\n      base = hsv2rgb(vec3(hue, sat, val));\n\n      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;\n      float star = Star(gv - offset - pad, flareSize);\n      vec3 color = base;\n\n      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;\n      twinkle = mix(1.0, twinkle, uTwinkleIntensity);\n      star *= twinkle;\n      \n      col += star * size * color;\n    }\n  }\n  return col;\n}\n\nvoid main() {\n  vec2 focalPx = uFocal * uResolution.xy;\n  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;\n\n  vec2 mouseNorm = uMouse - vec2(0.5);\n  \n  if (uAutoCenterRepulsion > 0.0) {\n    vec2 centerUV = vec2(0.0, 0.0);\n    float centerDist = length(uv - centerUV);\n    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));\n    uv += repulsion * 0.05;\n  } else if (uMouseRepulsion) {\n    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;\n    float mouseDist = length(uv - mousePosUV);\n    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));\n    uv += repulsion * 0.05 * uMouseActiveFactor;\n  } else {\n    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;\n    uv += mouseOffset;\n  }\n\n  float autoRotAngle = uTime * uRotationSpeed;\n  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));\n  uv = autoRot * uv;\n\n  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;\n\n  vec3 col = vec3(0.0);\n\n  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {\n    float depth = fract(i + uStarSpeed * uSpeed);\n    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);\n    float fade = depth * smoothstep(1.0, 0.9, depth);\n    col += StarLayer(uv * scale + i * 453.32) * fade;\n  }\n\n  if (uTransparent) {\n    float alpha = length(col);\n    alpha = smoothstep(0.0, 0.3, alpha);\n    alpha = min(alpha, 1.0);\n    gl_FragColor = vec4(col, alpha);\n  } else {\n    gl_FragColor = vec4(col, 1.0);\n  }\n}\n',
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new OGL.Color(1,1,1) },
        uFocal: { value: new Float32Array(this.opts.focal) },
        uRotation: { value: new Float32Array(this.opts.rotation) },
        uStarSpeed: { value: this.opts.starSpeed },
        uDensity: { value: this.opts.density },
        uHueShift: { value: this.opts.hueShift },
        uSpeed: { value: this.opts.speed },
        uMouse: { value: new Float32Array([0.5,0.5]) },
        uGlowIntensity: { value: this.opts.glowIntensity },
        uSaturation: { value: this.opts.saturation },
        uMouseRepulsion: { value: this.opts.mouseRepulsion },
        uTwinkleIntensity: { value: this.opts.twinkleIntensity },
        uRotationSpeed: { value: this.opts.rotationSpeed },
        uRepulsionStrength: { value: this.opts.repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: this.opts.autoCenterRepulsion },
        uTransparent: { value: this.opts.transparent }
      }
    });
    this.mesh = new OGL.Mesh(gl, { geometry: this.geometry, program: this.program });

    // size / resize
    var self = this;
    this.resize = function() {
      var w = global.innerWidth, h = global.innerHeight;
      self.renderer.setSize(w, h);
      self.program.uniforms.uResolution.value = new OGL.Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    };
    global.addEventListener('resize', this.resize);
    this.resize();

    // mouse
    this.targetMouse = { x: 0.5, y: 0.5, active: 0.0 };
    this.smoothMouse = { x: 0.5, y: 0.5, active: 0.0 };
    this.onMove = function(e){
      var rect = cnv.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = 1.0 - (e.clientY - rect.top) / rect.height;
      self.targetMouse.x = x; self.targetMouse.y = y; self.targetMouse.active = 1.0;
    };
    this.onLeave = function(){ self.targetMouse.active = 0.0; };
    if (this.opts.mouseInteraction) {
      global.addEventListener('mousemove', this.onMove, { passive:true });
      global.addEventListener('mouseout', this.onLeave, { passive:true });
    }

    this._raf = null;
    this._tick = this._tick.bind(this);
    if (!this.opts.disableAnimation) this.start();
  }

  GalaxyOGL.prototype._tick = function(t) {
    var uniforms = this.program.uniforms;
    // smooth mouse
    var lerp = 0.05;
    this.smoothMouse.x += (this.targetMouse.x - this.smoothMouse.x) * lerp;
    this.smoothMouse.y += (this.targetMouse.y - this.smoothMouse.y) * lerp;
    this.smoothMouse.active += (this.targetMouse.active - this.smoothMouse.active) * lerp;
    uniforms.uMouse.value[0] = this.smoothMouse.x;
    uniforms.uMouse.value[1] = this.smoothMouse.y;
    uniforms.uMouseActiveFactor.value = this.smoothMouse.active;

    uniforms.uTime.value = t * 0.001;
    uniforms.uStarSpeed.value = (t * 0.001 * this.opts.starSpeed) / 10.0;
    this.renderer.render({ scene: this.mesh });
    this._raf = requestAnimationFrame(this._tick);
  };

  GalaxyOGL.prototype.start = function(){ if (!this._raf) this._raf = requestAnimationFrame(this._tick); };
  GalaxyOGL.prototype.stop  = function(){ if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; };
  GalaxyOGL.prototype.destroy = function(){
    this.stop();
    global.removeEventListener('resize', this.resize);
    global.removeEventListener('mousemove', this.onMove);
    global.removeEventListener('mouseout', this.onLeave);
    if (this.gl && this.gl.canvas && this.gl.canvas.parentNode) this.gl.canvas.parentNode.removeChild(this.gl.canvas);
    try{ this.gl.getExtension('WEBGL_lose_context')?.loseContext(); }catch(e){}
  };

  function init(options) {
    var mount = document.getElementById('galaxy_mount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'galaxy_mount';
      mount.style.position = 'fixed';
      mount.style.left = '0'; mount.style.top = '0';
      mount.style.width = '100%'; mount.style.height = '100%';
      mount.style.zIndex = '0'; mount.style.pointerEvents='none';
      document.body.appendChild(mount);
    }
    return new GalaxyOGL(mount, options);
  }

  global.GalaxyOGL = { init: init, DEFAULTS: DEFAULTS };
})(window);
