
// bootlog.js - temporary diagnostics
(function(){
  var tag = function(msg){ return "[StellarOps DEBUG] " + msg; };
  try {
    // Log global errors
    window.addEventListener('error', function(e){
      try { console.log(tag("window.error:"), e.message, e.filename+":"+e.lineno+":"+e.colno, e.error && e.error.stack); }
      catch(_) {}
    });
    window.addEventListener('unhandledrejection', function(e){
      try { console.log(tag("unhandledrejection:"), e.reason && e.reason.message || e.reason, e.reason && e.reason.stack); }
      catch(_) {}
    });

    // Trace script execution order
    (function traceScripts(){
      var scripts = document.querySelectorAll('script[src]');
      var list = Array.prototype.map.call(scripts, s => s.getAttribute('src'));
      console.log(tag("scripts on page:"), list);
    })();

    // Stamp when main bundle starts
    var stamp = Date.now();
    (function waitForBundle(){
      setTimeout(function(){
        var ok = !!(window.stellarops);
        console.log(tag("bundle loaded? " + ok + " (+" + (Date.now()-stamp) + "ms)"));
      }, 50);
    })();
  } catch(e){
    console.log(tag("bootlog init failed:"), e);
  }
})();
