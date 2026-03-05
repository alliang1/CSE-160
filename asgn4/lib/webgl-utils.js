WebGLUtils = function() {
  var makeFailHTML = function(msg) { return '<div style="margin:auto;width:500px;z-index:10000;margin-top:20em;text-align:center;">'+msg+'</div>'; };
  var GET_A_WEBGL_BROWSER = 'This page requires a browser that supports WebGL.<br/><a href="http://get.webgl.org">Click here to upgrade your browser.</a>';
  var OTHER_PROBLEM = "It doesn't appear your computer can support WebGL.<br/><a href=\"http://get.webgl.org\">Click here for more information.</a>";
  var setupWebGL = function(canvas, opt_attribs, opt_onError) {
    function handleCreationError(msg) {
      var container = document.getElementsByTagName("body")[0];
      if (container) { var str = window.WebGLRenderingContext ? OTHER_PROBLEM : GET_A_WEBGL_BROWSER; if(msg) str += "<br/><br/>Status: "+msg; container.innerHTML = makeFailHTML(str); }
    }
    opt_onError = opt_onError || handleCreationError;
    if (canvas.addEventListener) { canvas.addEventListener("webglcontextcreationerror", function(event){ opt_onError(event.statusMessage); }, false); }
    var context = create3DContext(canvas, opt_attribs);
    if (!context) { if (!window.WebGLRenderingContext) { opt_onError(""); } else { opt_onError(""); } }
    return context;
  };
  var create3DContext = function(canvas, opt_attribs) {
    var names = ["webgl","experimental-webgl","webkit-3d","moz-webgl"];
    var context = null;
    for (var ii=0;ii<names.length;++ii) { try { context=canvas.getContext(names[ii],opt_attribs); } catch(e){} if(context) break; }
    return context;
  };
  return { create3DContext: create3DContext, setupWebGL: setupWebGL };
}();
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback,element){ window.setTimeout(callback,1000/60); };
  })();
}
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (window.cancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelAnimationFrame || window.mozCancelRequestAnimationFrame || window.msCancelAnimationFrame || window.msCancelRequestAnimationFrame || window.oCancelAnimationFrame || window.oCancelRequestAnimationFrame || window.clearTimeout);
}
