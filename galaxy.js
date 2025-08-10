
/*! Galaxy (OGL) — robust + exposes window.GalaxyOGL.init
   - If window.OGL is missing, loads it from window.OGL_SRC (default: 'ogl.umd.js')
   - Exposes GalaxyOGL.init(options)
   - Auto-inits if window.GALAXY_AUTO_INIT !== false
*/
(function (global) {
  'use strict';

  var DEFAULTS = {
    focal: [0.5, 0.5],
    rotation: [1.0, 0.0],
    starSpeed: 0.5,
    density: 1.5,
    hueShift: 240,
    disableAnimation: false,
    speed: 1.0,
    mouseInteraction: true,
    glowIntensity: 0.5,
    saturation: 0.8,
    mouseRepulsion: true,
    twinkleIntensity: 0.35,
    rotationSpeed: 0.08,
    repulsionStrength: 2.0,
    autoCenterRepulsion: 0.0,
    transparent: false
  };

  // tiny helpers
  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }
  function loadScript(src, onload, onerror){
    var s = document.createElement('script');
    s.src = src;
    s.async = false; // preserve order
    s.onload = onload;
    s.onerror = function(){ console.error('Failed to load OGL from', src); if (onerror) onerror(); };
    document.head.appendChild(s);
  }

  // Shaders (same as the ReactBits demo)
  var VERT = "attribute vec2 uv;attribute vec2 position;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0.0,1.0);}";
  var FRAG = "precision highp float;uniform float uTime;uniform vec3 uResolution;uniform vec2 uFocal;uniform vec2 uRotation;uniform float uStarSpeed;uniform float uDensity;uniform float uHueShift;uniform float uSpeed;uniform vec2 uMouse;uniform float uGlowIntensity;uniform float uSaturation;uniform bool uMouseRepulsion;uniform float uTwinkleIntensity;uniform float uRotationSpeed;uniform float uRepulsionStrength;uniform float uMouseActiveFactor;uniform float uAutoCenterRepulsion;uniform bool uTransparent;varying vec2 vUv;#define NUM_LAYER 4.0#define STAR_COLOR_CUTOFF 0.2#define MAT45 mat2(0.7071,-0.7071,0.7071,0.7071)#define PERIOD 3.0 float Hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float tri(float x){return abs(fract(x)*2.0-1.0);}float tris(float x){float t=fract(x);return 1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0));}float trisn(float x){float t=fract(x);return 2.0*(1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)))-1.0;}vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0);vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);}float Star(vec2 uv,float flare){float d=length(uv);float m=(0.05*uGlowIntensity)/d;float rays=smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));m+=rays*flare*uGlowIntensity;uv*=MAT45;rays=smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));m+=rays*0.3*flare*uGlowIntensity;m*=smoothstep(1.0,0.2,d);return m;}vec3 StarLayer(vec2 uv){vec3 col=vec3(0.0);vec2 gv=fract(uv)-0.5;vec2 id=floor(uv);for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 offset=vec2(float(x),float(y));vec2 si=id+offset;float seed=Hash21(si);float size=fract(seed*345.32);float glossLocal=tri(uStarSpeed/(PERIOD*seed+1.0));float flareSize=smoothstep(0.9,1.0,size)*glossLocal;float red=smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+1.0))+STAR_COLOR_CUTOFF;float blu=smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+3.0))+STAR_COLOR_CUTOFF;float grn=min(red,blu)*seed;vec3 base=vec3(red,grn,blu);float hue=atan(base.g-base.r,base.b-base.r)/(2.0*3.14159)+0.5;hue=fract(hue+uHueShift/360.0);float sat=length(base-vec3(dot(base,vec3(0.299,0.587,0.114))))*uSaturation;float val=max(max(base.r,base.g),base.b);base=hsv2rgb(vec3(hue,sat,val));vec2 pad=vec2(tris(seed*34.0+uTime*uSpeed/10.0),tris(seed*38.0+uTime*uSpeed/30.0))-0.5;float star=Star(gv-offset-pad,flareSize);float twinkle=trisn(uTime*uSpeed+seed*6.2831)*0.5+1.0;twinkle=mix(1.0,twinkle,uTwinkleIntensity);star*=twinkle;col+=star*size*base;}}return col;}void main(){vec2 focalPx=uFocal*uResolution.xy;vec2 uv=(vUv*uResolution.xy-focalPx)/uResolution.y;vec2 mouseNorm=uMouse-vec2(0.5);if(uAutoCenterRepulsion>0.0){vec2 centerUV=vec2(0.0,0.0);float centerDist=length(uv-centerUV);vec2 repulsion=normalize(uv-centerUV)*(uAutoCenterRepulsion/(centerDist+0.1));uv+=repulsion*0.05;}else if(uMouseRepulsion){vec2 mousePosUV=(uMouse*uResolution.xy-focalPx)/uResolution.y;float mouseDist=length(uv-mousePosUV);vec2 repulsion=normalize(uv-mousePosUV)*(uRepulsionStrength/(mouseDist+0.1));uv+=repulsion*0.05*uMouseActiveFactor;}else{vec2 mouseOffset=mouseNorm*0.1*uMouseActiveFactor;uv+=mouseOffset;}float autoRotAngle=uTime*uRotationSpeed;mat2 autoRot=mat2(cos(autoRotAngle),-sin(autoRotAngle),sin(autoRotAngle),cos(autoRotAngle));uv=autoRot*uv;uv=mat2(uRotation.x,-uRotation.y,uRotation.y,uRotation.x)*uv;vec3 col=vec3(0.0);for(float i=0.0;i<1.0;i+=1.0/NUM_LAYER){float depth=fract(i+uStarSpeed*uSpeed);float scale=mix(20.0*uDensity,0.5*uDensity,depth);float fade=depth*smoothstep(1.0,0.9,depth);col+=StarLayer(uv*scale+i*453.32)*fade;}if(uTransparent){float alpha=length(col);alpha=smoothstep(0.0,0.3,alpha);alpha=min(alpha,1.0);gl_FragColor=vec4(col,alpha);}else{gl_FragColor=vec4(col,1.0);} }";

  function createInstance(options){
    var OGL = global.OGL;
    var opts = Object.assign({}, DEFAULTS, options||{});

    var renderer = new OGL.Renderer({
      alpha: !!opts.transparent,
      premultipliedAlpha: false,
      dpr: Math.min(2, global.devicePixelRatio||1)
    });
    var gl = renderer.gl;
    var cnv = gl.canvas;
    cnv.id = 'galaxy_ogl';
    cnv.style.position = 'fixed';
    cnv.style.left = '0'; cnv.style.top = '0';
    cnv.style.width = '100%'; cnv.style.height = '100%';
    cnv.style.zIndex = '0'; cnv.style.pointerEvents='none';
    document.body.appendChild(cnv);

    if (opts.transparent) { gl.clearColor(0,0,0,0); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
    else { gl.clearColor(0,0,0,1); }

    var geometry = new OGL.Triangle(gl);
    var program = new OGL.Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new OGL.Color(1,1,1) },
        uFocal: { value: new Float32Array(opts.focal) },
        uRotation: { value: new Float32Array(opts.rotation) },
        uStarSpeed: { value: opts.starSpeed },
        uDensity: { value: opts.density },
        uHueShift: { value: opts.hueShift },
        uSpeed: { value: opts.speed },
        uMouse: { value: new Float32Array([0.5,0.5]) },
        uGlowIntensity: { value: opts.glowIntensity },
        uSaturation: { value: opts.saturation },
        uMouseRepulsion: { value: opts.mouseRepulsion },
        uTwinkleIntensity: { value: opts.twinkleIntensity },
        uRotationSpeed: { value: opts.rotationSpeed },
        uRepulsionStrength: { value: opts.repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: opts.autoCenterRepulsion },
        uTransparent: { value: opts.transparent }
      }
    });
    var mesh = new OGL.Mesh(gl, { geometry: geometry, program: program });

    function resize(){
      renderer.setSize(global.innerWidth, global.innerHeight);
      program.uniforms.uResolution.value = new OGL.Color(gl.canvas.width, gl.canvas.height, gl.canvas.width/gl.canvas.height);
    }
    global.addEventListener('resize', resize, { passive:true }); resize();

    var targetMouse = { x:0.5, y:0.5, a:0.0 }, smoothMouse = { x:0.5, y:0.5, a:0.0 };
    function onMove(e){
      var r = cnv.getBoundingClientRect();
      targetMouse.x = (e.clientX - r.left)/r.width;
      targetMouse.y = 1 - (e.clientY - r.top)/r.height;
      targetMouse.a = 1.0;
    }
    function onLeave(){ targetMouse.a = 0.0; }
    if (opts.mouseInteraction){
      global.addEventListener('mousemove', onMove, { passive:true });
      global.addEventListener('mouseout', onLeave, { passive:true });
    }

    function loop(t){
      if (!opts.disableAnimation){
        program.uniforms.uTime.value = t*0.001;
        program.uniforms.uStarSpeed.value = (t*0.001*opts.starSpeed)/10.0;
      }
      var k=0.05;
      smoothMouse.x += (targetMouse.x - smoothMouse.x)*k;
      smoothMouse.y += (targetMouse.y - smoothMouse.y)*k;
      smoothMouse.a += (targetMouse.a - smoothMouse.a)*k;
      program.uniforms.uMouse.value[0] = smoothMouse.x;
      program.uniforms.uMouse.value[1] = smoothMouse.y;
      program.uniforms.uMouseActiveFactor.value = smoothMouse.a;
      renderer.render({ scene: mesh });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return { gl, renderer, program, mesh };
  }

  function ensureOGLAndStart(options){
    var src = global.OGL_SRC || 'ogl.umd.js';
    if (global.OGL) return createInstance(options);
    loadScript(src, function(){ createInstance(options); });
  }

  // expose API
  global.GalaxyOGL = {
    init: function(options){ onReady(function(){ ensureOGLAndStart(options || global.GALAXY_OGL_OPTIONS || global.GALAXY_OPTIONS || {}); }); }
  };

  // auto init (optional)
  if (global.GALAXY_AUTO_INIT !== false){
    global.GalaxyOGL.init(global.GALAXY_OGL_OPTIONS || global.GALAXY_OPTIONS || {});
  }

})(window);
