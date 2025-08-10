(function () {
  'use strict';
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    var text = 'CMDR, welcome to "StellarOps"';
    var splash = document.getElementById('splash-screen');
    var splashText = document.getElementById('splash-text');
    var btn = document.getElementById('enter-btn');
    var hint = document.getElementById('enter-hint');

    // Start locked
    document.documentElement.classList.add('splash-active');
    document.body.classList.add('splash-active');
    window.scrollTo(0,0);

    // Typewriter
    var i = 0;
    (function typeNext(){
      if (i < text.length){
        splashText.textContent += text.charAt(i++);
        setTimeout(typeNext, 70);
      } else {
        setTimeout(function(){
          btn.style.display = 'inline-block';
          if (hint) hint.style.display = 'block';
          btn.focus();
        }, 300);
      }
    })();

    function dismiss(){
      // Fade overlay
      splash.classList.add('splash-hide');
      // Ensure user is at top and unlock after fade
      setTimeout(function(){
        window.scrollTo(0,0);
        document.documentElement.classList.remove('splash-active');
        document.body.classList.remove('splash-active');
        splash.remove(); // remove from DOM to avoid any stacking
      }, 650);
    }

    btn.addEventListener('click', dismiss);
    document.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && btn.style.display !== 'none') dismiss();
    });
    splash.addEventListener('click', function(e){
      if (btn.style.display !== 'none' && !e.target.closest('button')) dismiss();
    });
  });
})();
