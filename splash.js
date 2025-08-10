(function () {
  'use strict';
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    var text = 'CMDR, welcome to "StellarOps"';
    var splash = document.getElementById('splash-screen');
    var splashText = document.getElementById('splash-text');
    var btn = document.getElementById('enter-btn');
    var hint = document.getElementById('enter-hint');

    // Lock page scroll under splash
    document.documentElement.classList.add('splash-active');
    document.body.classList.add('splash-active');

    // Typewriter effect
    var i = 0;
    (function typeNext(){
      if (i < text.length){
        splashText.textContent += text.charAt(i++);
        setTimeout(typeNext, 70);
      } else {
        setTimeout(function(){
          btn.style.display = 'inline-block';
          hint.style.display = 'block';
          btn.focus();
        }, 300);
      }
    })();

    function dismiss(){
      if (!splash) return;
      splash.classList.add('splash-hide');
      setTimeout(function(){
        splash.style.display = 'none';
        document.documentElement.classList.remove('splash-active');
        document.body.classList.remove('splash-active');
      }, 650);
    }

    // Click button or press Enter to proceed
    btn.addEventListener('click', dismiss);
    document.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && btn.style.display !== 'none') dismiss();
    });

    // Also allow clicking the overlay to continue once visible
    splash.addEventListener('click', function(e){
      if (btn.style.display !== 'none' && !e.target.closest('button')) dismiss();
    });
  });
})();