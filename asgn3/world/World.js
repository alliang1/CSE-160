// World.js - Assignment 3
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform float u_nightFactor;   // 0.0 = day, 1.0 = full night
  void main() {
    vec4 color;
    if (u_whichTexture == -2) {
      color = u_FragColor;
    } else if (u_whichTexture == -1) {
      color = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      color = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      color = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      color = texture2D(u_Sampler2, v_UV);
    } else {
      color = vec4(1.0, 0.2, 0.2, 1.0);
    }
    // Darken everything by nightFactor, add slight blue tint at night
    float bright = 1.0 - u_nightFactor * 0.75;
    vec3 nightTint = mix(vec3(1.0), vec3(0.5, 0.55, 0.8), u_nightFactor);
    gl_FragColor = vec4(color.rgb * bright * nightTint, color.a);
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let u_nightFactor;

// Camera globals
var g_camera;
var g_globalAngle = 0;

// Night mode
var g_nightMode = false;

// Mouse rotation
let g_rotateMouseDown = false;
let g_lastMouseX = null;
let g_lastMouseY = null;

// Animation
let wavingAnimation = false;
let shiftMouseAnimation = false;
let winkScale = 1.0;
let rightarman = 135;
let rightforearman = 0;
let rightfistan = 0;
let leftforearman = 0;
let leftfistan = 0;
let leftarman = 135;

// ---- Gravity / Jump ----
var g_velocityY = 0.0;
var g_positionY = 1.0;   // camera eye Y
var g_onGround = true;
const GRAVITY    = 0.008;
const JUMP_FORCE = 0.18;
const GROUND_Y   = 1.0;

// 32x32 World Map
var g_map = [
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,3],
  [3,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,3],
  [3,0,2,2,2,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,2,0,0,0,0,0,0,0,0,0,3,3,3,0,3,3,3,0,0,0,0,0,0,0,0,0,2,0,0,3],
  [3,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3],
  [3,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
];

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) { console.log('Failed to get WebGL context'); return; }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.'); return;
  }
  a_Position       = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV             = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor      = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix    = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix     = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ProjectionMatrix   = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler0       = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1       = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2       = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_whichTexture   = gl.getUniformLocation(gl.program, 'u_whichTexture');
  u_nightFactor    = gl.getUniformLocation(gl.program, 'u_nightFactor');

  var id = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix,    false, id.elements);
  gl.uniformMatrix4fv(u_ViewMatrix,     false, id.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, id.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix,   false, id.elements);
  gl.uniform1f(u_nightFactor, 0.0);
}

function initTextures() {
  var img0 = new Image();
  img0.onload = function () { sendTextureToUnit(img0, 0); };
  img0.src = 'sky.jpg';

  var img1 = new Image();
  img1.onload = function () { sendTextureToUnit(img1, 1); };
  img1.src = 'brick.jpg';

  var img2 = new Image();
  img2.onload = function () { sendTextureToUnit(img2, 2); };
  img2.src = 'grass.jpg';
}

function sendTextureToUnit(image, unit) {
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (unit === 0) gl.uniform1i(u_Sampler0, 0);
  else if (unit === 1) gl.uniform1i(u_Sampler1, 1);
  else if (unit === 2) gl.uniform1i(u_Sampler2, 2);
  console.log('Texture ' + unit + ' loaded');
}

function toggleNightMode() {
  g_nightMode = !g_nightMode;
  // Update sky clear color
  if (g_nightMode) {
    gl.clearColor(0.02, 0.02, 0.08, 1.0);
  } else {
    gl.clearColor(0.53, 0.81, 0.98, 1.0);
  }
}

function actions() {
  var el;
  if (el = document.getElementById('animationOn'))  el.onclick = function () { wavingAnimation = true; };
  if (el = document.getElementById('animationOff')) el.onclick = function () { wavingAnimation = false; };
  if (el = document.getElementById('yellowSlide'))  el.addEventListener('mousemove', function () { rightarman = this.value; renderScene(); });
  if (el = document.getElementById('angleSlide'))   el.addEventListener('mousemove', function () { g_globalAngle = this.value; renderScene(); });
  if (el = document.getElementById('angleSlide2'))  el.addEventListener('mousemove', function () { renderScene(); });
}

function keydown(ev) {
  switch (ev.key) {
    case 'w': case 'W': g_camera.moveForward();   break;
    case 's': case 'S': g_camera.moveBackwards(); break;
    case 'a': case 'A': g_camera.moveLeft();      break;
    case 'd': case 'D': g_camera.moveRight();     break;
    case 'q': case 'Q': g_camera.panLeft();       break;
    case 'e': case 'E': g_camera.panRight();      break;
    case 'f': case 'F': addBlockInFront();        break;
    case 'g': case 'G': deleteBlockInFront();     break;
    case 'n': case 'N': toggleNightMode();        break;
    case 'j': case 'J':
      if (g_starFound) spawnConfetti();
      break;
    case ' ':  // spacebar - jump
      if (g_onGround) {
        g_velocityY = JUMP_FORCE;
        g_onGround = false;
      }
      ev.preventDefault();
      break;
  }
  renderScene();
}

function getBlockInFront() {
  let f = new Vector3(g_camera.at.elements);
  f.sub(g_camera.eye);
  f.normalize();
  f.mul(2.0);
  let lookX = g_camera.eye.elements[0] + f.elements[0];
  let lookZ = g_camera.eye.elements[2] + f.elements[2];
  let mapX = Math.round(lookX + 16);
  let mapZ = Math.round(lookZ + 16);
  mapX = Math.max(1, Math.min(30, mapX));
  mapZ = Math.max(1, Math.min(30, mapZ));
  return { x: mapX, z: mapZ };
}

function addBlockInFront() {
  let b = getBlockInFront();
  if (g_map[b.x][b.z] < 5) { g_map[b.x][b.z]++; invalidateWallCache(); }
}

function deleteBlockInFront() {
  let b = getBlockInFront();
  if (g_map[b.x][b.z] > 0) { g_map[b.x][b.z]--; invalidateWallCache(); }
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  actions();

  g_camera = new Camera();
  g_camera.eye = new Vector3([0, 1, 15]);
  g_camera.at  = new Vector3([0, 1, 0]);

  document.onkeydown = keydown;
  initTextures();

  canvas.onmousedown = function (ev) {
    if (ev.shiftKey) {
      shiftMouseAnimation = !shiftMouseAnimation;
    } else {
      g_rotateMouseDown = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  };
  canvas.onmousemove = function (ev) {
    if (g_rotateMouseDown) {
      var dx = ev.clientX - g_lastMouseX;
      var dy = ev.clientY - g_lastMouseY;
      g_camera.panLeft(-dx * 0.3);
      g_camera.panUpDown(dy * 0.3);
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
      renderScene();
    }
  };
  canvas.onmouseup = function () { g_rotateMouseDown = false; };

  gl.clearColor(0.53, 0.81, 0.98, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  updateGravity();
  renderScene();
  requestAnimationFrame(tick);
}

function updateGravity() {
  if (!g_onGround) {
    g_velocityY -= GRAVITY;
    g_positionY += g_velocityY;

    // Land on ground
    if (g_positionY <= GROUND_Y) {
      g_positionY = GROUND_Y;
      g_velocityY = 0;
      g_onGround = true;
    }

    // Apply vertical position to camera (keep eye-to-at offset the same)
    var dy = g_positionY - g_camera.eye.elements[1];
    g_camera.eye.elements[1] += dy;
    g_camera.at.elements[1]  += dy;
  }
}

function updateAnimationAngles() {
  if (wavingAnimation) {
    rightarman    = 115 + 45 * Math.sin(g_seconds);
    leftarman     = 135 + 10 * Math.sin(g_seconds);
    rightforearman = -30 * Math.sin(g_seconds);
    rightfistan   = -30 * Math.sin(g_seconds);
    leftforearman  = -30 * Math.sin(g_seconds);
    leftfistan    = -30 * Math.sin(g_seconds);
  }
  if (shiftMouseAnimation) {
    var w = Math.sin(g_seconds * 3);
    winkScale = w > 0 ? 1.0 - w : 1.0;
  } else {
    winkScale = 1.0;
  }
}

// ---- Wall cache ----
var _wallCubes = null;

function _buildWallCache() {
  _wallCubes = [];
  for (var x = 0; x < g_map.length; x++) {
    for (var z = 0; z < g_map[x].length; z++) {
      var h = g_map[x][z];
      for (var y = 0; y < h; y++) {
        var wall = new Cube();
        wall.color = [0.8, 0.8, 0.8, 1.0];
        wall.textureNum = 1;
        wall.matrix.translate(x - 16, y - 0.75, z - 16);
        _wallCubes.push(wall);
      }
    }
  }
}

function invalidateWallCache() { _wallCubes = null; }

function drawMap() {
  if (!_wallCubes) _buildWallCache();
  for (var i = 0; i < _wallCubes.length; i++) {
    _wallCubes[i].renderfast();
  }
}

// ---- Moon ----
function drawMoon() {
  if (!g_nightMode) return;
  var moon = new Cube();
  moon.color = [1.0, 1.0, 0.85, 1.0];
  moon.textureNum = -2;
  // Override night factor so moon glows full brightness
  gl.uniform1f(u_nightFactor, 0.0);
  moon.matrix.translate(8, 18, -20);
  moon.matrix.scale(2, 2, 0.5);
  moon.render();
  // Restore night factor
  gl.uniform1f(u_nightFactor, 1.0);
}

// ---- Main render ----
function renderScene() {
  var startTime = performance.now();

  var nightVal = g_nightMode ? 1.0 : 0.0;
  gl.uniform1f(u_nightFactor, nightVal);

  var projMat = new Matrix4();
  projMat.setPerspective(g_camera.fov, canvas.width / canvas.height, 0.1, 200);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
    g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Sky box
  var sky = new Cube();
  sky.color = g_nightMode ? [0.02, 0.02, 0.08, 1.0] : [0.53, 0.81, 0.98, 1.0];
  sky.textureNum = -2;
  sky.matrix.scale(-400, -400, -400);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  gl.uniform1f(u_nightFactor, 0.0); // sky box not darkened — its color already encodes day/night
  sky.render();
  gl.uniform1f(u_nightFactor, nightVal); // restore

  // Ground
  var ground = new Cube();
  ground.color = [0.3, 0.6, 0.2, 1.0];
  ground.textureNum = 2;
  ground.matrix.translate(-16, -0.76, -16);
  ground.matrix.scale(32, 0.01, 32);
  ground.renderfast();

  // Walls
  drawMap();

  // Moon (only at night)
  drawMoon();

  // Hidden star
  drawStarObject();
  checkStarProximity();
  drawStarHUD();
  updateAndDrawConfetti();

  // Animal
  drawAnimal();

  
}

function drawAnimal() {
  var baseMatrix = new Matrix4();
  baseMatrix.translate(0, 0.25, 5);
  baseMatrix.rotate(180, 0, 1, 0);
  baseMatrix.scale(0.5, 0.5, 0.5);

  function bm() { return new Matrix4(baseMatrix); }

  // HEAD
  var head = new Cube();
  head.color = [1,1,1,1]; head.textureNum = -2;
  head.matrix = bm(); head.matrix.translate(-0.47,-0.2,0); head.matrix.scale(0.8,0.4,0.65);
  head.render();

  // HAT - brim
  var hat = new Cube();
  hat.color = [0.1,0.1,0.1,1]; hat.textureNum = -2;
  hat.matrix = bm(); hat.matrix.translate(-0.5,-0.22,0.02); hat.matrix.scale(0.85,0.60,0.7);
  hat.render();

  // HAT - upper
  var hatupper = new Cube();
  hatupper.color = [0.1,0.1,0.1,1]; hatupper.textureNum = -2;
  hatupper.matrix = bm(); hatupper.matrix.translate(-0.35,0.05,0.0001); hatupper.matrix.scale(0.55,0.50,0.55);
  hatupper.render();

  // HAT - brim base
  var hatd = new Cube();
  hatd.color = [0.1,0.1,0.1,1]; hatd.textureNum = -2;
  hatd.matrix = bm(); hatd.matrix.translate(-0.42,-0.25,0.05); hatd.matrix.scale(0.7,0.50,0.70);
  hatd.render();

  // HAT flap (prism)
  var hatflap = new Prism();
  hatflap.color = [0.1,0.1,0.1,1];
  hatflap.matrix = bm(); hatflap.matrix.translate(0.335,0.38,-0.0001); hatflap.matrix.rotate(180,0,0,1); hatflap.matrix.scale(0.8,0.3,0.4);
  hatflap.render();

  // HAT right spike
  var hatright = new Pyramid();
  hatright.color = [0.1,0.1,0.1,1];
  hatright.matrix = bm(); hatright.matrix.translate(0.2,0.7,0.1); hatright.matrix.rotate(-45,0,0,1); hatright.matrix.scale(0.50,0.50,0.50);
  hatright.render();

  var hatrightlow = new Prism();
  hatrightlow.color = [0.1,0.1,0.1,1];
  hatrightlow.matrix = bm(); hatrightlow.matrix.translate(0.56,0.34,0.1); hatrightlow.matrix.rotate(135,0,0,1); hatrightlow.matrix.scale(0.50,0.50,0.50);
  hatrightlow.render();

  // HAT left spike
  var hatleft = new Pyramid();
  hatleft.color = [0.1,0.1,0.1,1];
  hatleft.matrix = bm(); hatleft.matrix.translate(-0.7,0.35,0.1); hatleft.matrix.rotate(45,0,0,1); hatleft.matrix.scale(0.5,0.5,0.5);
  hatleft.render();

  var hatleftlow = new Prism();
  hatleftlow.color = [0.1,0.1,0.1,1];
  hatleftlow.matrix = bm(); hatleftlow.matrix.translate(-0.35,0.7,0.1); hatleftlow.matrix.rotate(225,0,0,1); hatleftlow.matrix.scale(0.50,0.50,0.50);
  hatleftlow.render();

  // HAT corner balls
  var circleft = new Sphere();
  circleft.color = [0.1,0.1,0.1,1];
  circleft.matrix = bm(); circleft.matrix.translate(-0.9,0.9,0.35); circleft.matrix.scale(0.05,0.05,0.05);
  circleft.render();

  var circright = new Sphere();
  circright.color = [0.1,0.1,0.1,1];
  circright.matrix = bm(); circright.matrix.translate(0.75,0.9,0.35); circright.matrix.scale(0.05,0.05,0.05);
  circright.render();

  // HAT point decorations
  var hatptleft = new Pyramid();
  hatptleft.color = [0.1,0.1,0.1,1];
  hatptleft.matrix = bm(); hatptleft.matrix.translate(-0.35,-0.25,0.1); hatptleft.matrix.rotate(-140,1,0,0); hatptleft.matrix.scale(0.25,0.10,0.05);
  hatptleft.render();

  var hatptleft2 = new Pyramid();
  hatptleft2.color = [0.1,0.1,0.1,1];
  hatptleft2.matrix = bm(); hatptleft2.matrix.translate(-0.35,-0.23,0.05); hatptleft2.matrix.rotate(-90,0,1,0); hatptleft2.matrix.rotate(130,1,0,0); hatptleft2.matrix.scale(0.55,0.10,0.05);
  hatptleft2.render();

  var hatptright = new Pyramid();
  hatptright.color = [0.1,0.1,0.1,1];
  hatptright.matrix = bm(); hatptright.matrix.translate(-0.05,-0.25,0.1); hatptright.matrix.rotate(-140,1,0,0); hatptright.matrix.scale(0.25,0.10,0.05);
  hatptright.render();

  var hatptright2 = new Pyramid();
  hatptright2.color = [0.1,0.1,0.1,1];
  hatptright2.matrix = bm(); hatptright2.matrix.translate(0.2,-0.23,0.63); hatptright2.matrix.rotate(90,0,1,0); hatptright2.matrix.rotate(130,1,0,0); hatptright2.matrix.scale(0.55,0.10,0.05);
  hatptright2.render();

  // Magenta balls
  var ballleft = new Sphere();
  ballleft.color = [1,0,1,1];
  ballleft.matrix = bm(); ballleft.matrix.translate(-0.23,-0.33,0); ballleft.matrix.scale(0.03,0.03,0.03);
  ballleft.render();

  var ballright = new Sphere();
  ballright.color = [1,0,1,1];
  ballright.matrix = bm(); ballright.matrix.translate(0.07,-0.33,0); ballright.matrix.scale(0.03,0.03,0.03);
  ballright.render();

  var ballright2 = new Sphere();
  ballright2.color = [1,0,1,1];
  ballright2.matrix = bm(); ballright2.matrix.translate(0.25,-0.32,0.35); ballright2.matrix.scale(0.03,0.03,0.03);
  ballright2.render();

  var ballleft2 = new Sphere();
  ballleft2.color = [1,0,1,1];
  ballleft2.matrix = bm(); ballleft2.matrix.translate(-0.42,-0.33,0.35); ballleft2.matrix.scale(0.03,0.03,0.03);
  ballleft2.render();

  // Headpiece skull face
  var skull = new Sphere();
  skull.color = [1,0,1,1];
  skull.matrix = bm(); skull.matrix.translate(-0.06,0.35,-0.01); skull.matrix.scale(0.12,0.1,0.0001);
  skull.render();

  var skulleyeleft = new Sphere();
  skulleyeleft.color = [0.1,0.1,0.1,1];
  skulleyeleft.matrix = bm(); skulleyeleft.matrix.translate(-0.11,0.35,-0.015); skulleyeleft.matrix.rotate(155,0,0,1); skulleyeleft.matrix.scale(0.020,0.03,0.0001);
  skulleyeleft.render();

  var skulleyeright = new Sphere();
  skulleyeright.color = [0.1,0.1,0.1,1];
  skulleyeright.matrix = bm(); skulleyeright.matrix.translate(-0.0,0.35,-0.015); skulleyeright.matrix.rotate(25,0,0,1); skulleyeright.matrix.scale(0.020,0.03,0.0001);
  skulleyeright.render();

  var teeth1 = new Cube();
  teeth1.color = [1,0,1,1]; teeth1.textureNum = -2;
  teeth1.matrix = bm(); teeth1.matrix.translate(-0.12,0.23,-0.015); teeth1.matrix.scale(0.035,0.05,0.0001);
  teeth1.render();

  var teeth2 = new Cube();
  teeth2.color = [1,0,1,1]; teeth2.textureNum = -2;
  teeth2.matrix = bm(); teeth2.matrix.translate(-0.075,0.23,-0.015); teeth2.matrix.scale(0.035,0.05,0.0001);
  teeth2.render();

  var teeth3 = new Cube();
  teeth3.color = [1,0,1,1]; teeth3.textureNum = -2;
  teeth3.matrix = bm(); teeth3.matrix.translate(-0.03,0.23,-0.015); teeth3.matrix.scale(0.035,0.05,0.0001);
  teeth3.render();

  // EYES
  var eyeright = new Sphere();
  eyeright.color = [0.1,0.1,0.1,1];
  eyeright.matrix = bm(); eyeright.matrix.translate(0.15,0,-0.01); eyeright.matrix.scale(0.05,0.07*winkScale,0.005);
  eyeright.render();

  var eyeleft = new Sphere();
  eyeleft.color = [0.1,0.1,0.1,1];
  eyeleft.matrix = bm(); eyeleft.matrix.translate(-0.3,0,-0.01); eyeleft.matrix.scale(0.05,0.07,0.005);
  eyeleft.render();

  // NOSE
  var nose = new Sphere();
  nose.color = [1,0,0.8,1];
  nose.matrix = bm(); nose.matrix.translate(-0.06,-0.05,0); nose.matrix.scale(0.03,0.02,0.03);
  nose.render();

  // BODY
  var body = new Cube();
  body.color = [1,1,1,1]; body.textureNum = -2;
  body.matrix = bm(); body.matrix.translate(-0.33,-0.7,0.08); body.matrix.scale(0.5,1,0.55);
  body.render();

  // RIGHT ARM
  var rightarm = new Cube();
  rightarm.color = [1,1,1,1]; rightarm.textureNum = -2;
  rightarm.matrix = bm();
  rightarm.matrix.translate(0.1,-0.4,0.5);
  rightarm.matrix.rotate(180,0,1,0);
  rightarm.matrix.rotate(rightarman,0,0,1);
  var rightarmcoord = new Matrix4(rightarm.matrix);
  rightarm.matrix.scale(0.1,0.15,0.2);
  rightarm.render();

  var rightelbow = new Cube();
  rightelbow.color = [1,1,1,1]; rightelbow.textureNum = -2;
  rightelbow.matrix = new Matrix4(rightarmcoord);
  rightelbow.matrix.translate(0,0.15,0); rightelbow.matrix.rotate(rightforearman,0,0,1); rightelbow.matrix.scale(0.1,0.15,0.2);
  rightelbow.render();

  // LEFT ARM
  var leftarm = new Cube();
  leftarm.color = [1,1,1,1]; leftarm.textureNum = -2;
  leftarm.matrix = bm();
  leftarm.matrix.translate(-0.25,-0.40,0.25);
  leftarm.matrix.rotate(leftarman,0,0,1);
  var leftarmcoord = new Matrix4(leftarm.matrix);
  leftarm.matrix.scale(0.1,0.15,0.2);
  leftarm.render();

  var leftelbow = new Cube();
  leftelbow.color = [1,1,1,1]; leftelbow.textureNum = -2;
  leftelbow.matrix = new Matrix4(leftarmcoord);
  leftelbow.matrix.translate(0,0.15,0); leftelbow.matrix.rotate(leftforearman,0,0,1); leftelbow.matrix.scale(0.1,0.15,0.2);
  leftelbow.render();

  // LEGS
  var leftleg = new Cube();
  leftleg.color = [1,1,1,1]; leftleg.textureNum = -2;
  leftleg.matrix = bm(); leftleg.matrix.translate(-0.25,-0.9,0.2); leftleg.matrix.scale(0.15,0.2,0.3);
  leftleg.render();

  var rightleg = new Cube();
  rightleg.color = [1,1,1,1]; rightleg.textureNum = -2;
  rightleg.matrix = bm(); rightleg.matrix.translate(-0.05,-0.9,0.2); rightleg.matrix.scale(0.15,0.2,0.3);
  rightleg.render();
}

function sendTextToHTML(text, htmlID) {
  var el = document.getElementById(htmlID);
  if (!el) return;
  el.innerHTML = text;
}

var g_shapesList = [];

// ---- Hidden Star ----
// Star is placed at world position x=15, z=1 (behind the north wall, tucked inside)
// In map coords that's map[31][1] area — we place the star visually at (-1, 0.5, -14.5)
var STAR_POS = { wx: -1, wy: 0.5, wz: -14.5 }; // world coords
var g_starFound = false;
var g_starTextAlpha = 0;       // for fade in/out of the 2D overlay text
var g_starTextTimer = 0;

// ---- Confetti ----
var g_confettiActive = false;
var g_confettiParticles = [];
var g_confettiStartTime = 0;
const CONFETTI_DURATION = 3.0; // seconds

function spawnConfetti() {
  g_confettiParticles = [];
  for (var i = 0; i < 120; i++) {
    g_confettiParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      size: Math.random() * 10 + 5,
      color: 'rgba(200, 162, 200, 0.9)',
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8
    });
  }
  g_confettiActive = true;
  g_confettiStartTime = g_seconds;
}

function updateAndDrawConfetti() {
  if (!g_confettiActive) return;
  var elapsed = g_seconds - g_confettiStartTime;
  if (elapsed > CONFETTI_DURATION) {
    g_confettiActive = false;
    // clear confetti canvas overlay
    var cc = document.getElementById('confettiCanvas');
    if (cc) cc.getContext('2d').clearRect(0, 0, cc.width, cc.height);
    return;
  }
  var cc = document.getElementById('confettiCanvas');
  if (!cc) return;
  var ctx = cc.getContext('2d');
  ctx.clearRect(0, 0, cc.width, cc.height);
  var fade = Math.max(0, 1 - elapsed / CONFETTI_DURATION);
  for (var i = 0; i < g_confettiParticles.length; i++) {
    var p = g_confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.rotV;
    if (p.y > cc.height) { p.y = -10; p.x = Math.random() * cc.width; }
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
    ctx.restore();
  }
}

function checkStarProximity() {
  var ex = g_camera.eye.elements[0];
  var ez = g_camera.eye.elements[2];
  var dx = ex - STAR_POS.wx;
  var dz = ez - STAR_POS.wz;
  var dist = Math.sqrt(dx*dx + dz*dz);
  g_starFound = (dist < 4.0);
}

function drawStarObject() {
  // Animated spinning gold star made from 2 cubes rotated 45deg
  gl.uniform1f(u_nightFactor, 0.0); // always bright

  var t = g_seconds;
  var spin = (t * 90) % 360;
  var hover = Math.sin(t * 2) * 0.15;

  var star1 = new Cube();
  star1.color = [1.0, 0.9, 0.0, 1.0];
  star1.textureNum = -2;
  star1.matrix.translate(STAR_POS.wx, STAR_POS.wy + hover, STAR_POS.wz);
  star1.matrix.rotate(spin, 0, 1, 0);
  star1.matrix.translate(-0.2, -0.2, -0.2);
  star1.matrix.scale(0.4, 0.4, 0.4);
  star1.render();

  var star2 = new Cube();
  star2.color = [1.0, 0.75, 0.0, 1.0];
  star2.textureNum = -2;
  star2.matrix.translate(STAR_POS.wx, STAR_POS.wy + hover, STAR_POS.wz);
  star2.matrix.rotate(spin + 45, 0, 1, 0);
  star2.matrix.rotate(45, 1, 0, 0);
  star2.matrix.translate(-0.2, -0.2, -0.2);
  star2.matrix.scale(0.4, 0.4, 0.4);
  star2.render();

  // Restore night factor
  gl.uniform1f(u_nightFactor, g_nightMode ? 1.0 : 0.0);
}

function drawStarHUD() {
  var oc = document.getElementById('overlayCanvas');
  if (!oc) return;
  var ctx = oc.getContext('2d');
  ctx.clearRect(0, 0, oc.width, oc.height);

  if (g_starFound) {
    ctx.save();
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    // pulsing glow
    var pulse = 0.7 + 0.3 * Math.sin(g_seconds * 4);
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = 'rgba(255, 220, 0, ' + pulse + ')';
    ctx.fillText('You found the hidden star!', oc.width / 2, oc.height / 2 - 20);
    ctx.shadowBlur = 0;
    ctx.font = '15px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('Press J for your reward!', oc.width / 2, oc.height / 2 + 10);
    ctx.restore();
  }
}