
// Config matching the demo (1:1 look). Adjust as needed.
window.GALAXY_OGL_OPTIONS = {
  mouseRepulsion: true,
  mouseInteraction: true,
  density: 1.5,
  glowIntensity: 0.5,
  saturation: 0.8,
  hueShift: 240,
  transparent: false,      // black background
  rotationSpeed: 0.08,
  starSpeed: 0.5,
  speed: 1.0,
  repulsionStrength: 2.0,
  autoCenterRepulsion: 0.0,
  focal: [0.5, 0.5],
  rotation: [1.0, 0.0],
  twinkleIntensity: 0.35
};

window.addEventListener('DOMContentLoaded', function () {
  window.__galaxy = GalaxyOGL.init(window.GALAXY_OGL_OPTIONS);
});
