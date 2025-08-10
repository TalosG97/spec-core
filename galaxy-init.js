// Where OGL lives on GitHub Pages:
window.OGL_SRC = '/spec-core/ogl.umd.js';  // exact path for your site

// Auto-start + settings
window.GALAXY_AUTO_INIT = true;
window.GALAXY_OGL_OPTIONS = {
  mouseRepulsion: true,
  mouseInteraction: true,
  density: 1.5,
  glowIntensity: 0.5,
  saturation: 0.8,
  hueShift: 240,
  transparent: false,
  rotationSpeed: 0.08,
  starSpeed: 0.5,
  speed: 1.0,
  repulsionStrength: 2.0,
  autoCenterRepulsion: 0.0,
  focal: [0.5, 0.5],
  rotation: [1.0, 0.0],
  twinkleIntensity: 0.35
};

// DO NOT call GalaxyOGL.init() here. galaxy.js will auto-init.
