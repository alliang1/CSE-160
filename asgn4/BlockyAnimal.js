// =========================================================
// VERTEX SHADER
// =========================================================
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;
  uniform mat4 u_NormalMatrix;

  varying vec3 v_Normal;
  varying vec3 v_WorldPos;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    v_WorldPos    = worldPos.xyz;
    v_Normal      = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    gl_Position   = u_ProjMatrix * u_ViewMatrix * u_GlobalRotateMatrix * worldPos;
  }
`;

// =========================================================
// FRAGMENT SHADER
// =========================================================
var FSHADER_SOURCE = `
  precision mediump float;

  uniform vec4  u_FragColor;
  uniform bool  u_ShowNormals;
  uniform bool  u_LightingOn;

  uniform bool  u_PointLightOn;
  uniform vec3  u_PointLightPos;
  uniform vec3  u_PointLightColor;

  uniform bool  u_SpotLightOn;
  uniform vec3  u_SpotLightPos;
  uniform vec3  u_SpotLightDir;
  uniform float u_SpotCutoff;

  uniform vec3  u_ViewPos;

  varying vec3 v_Normal;
  varying vec3 v_WorldPos;

  vec3 phong(vec3 N, vec3 L, vec3 V, vec3 lightCol, vec3 diffCol) {
    float amb  = 0.15;
    float diff = max(dot(N, L), 0.0);
    vec3  R    = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), 32.0);
    return amb * lightCol * diffCol
         + 0.8 * diff * lightCol * diffCol
         + 0.5 * spec * lightCol;
  }

  void main() {
    vec3 N = normalize(v_Normal);

    if (u_ShowNormals) {
      gl_FragColor = vec4(abs(N), 1.0);
      return;
    }

    if (!u_LightingOn) {
      gl_FragColor = u_FragColor;
      return;
    }

    vec3 base   = u_FragColor.rgb;
    vec3 V      = normalize(u_ViewPos - v_WorldPos);
    vec3 result = vec3(0.0);

    if (u_PointLightOn) {
      vec3 L = normalize(u_PointLightPos - v_WorldPos);
      result += phong(N, L, V, u_PointLightColor, base);
    } else {
      result += 0.15 * base;
    }

    if (u_SpotLightOn) {
      vec3  Ls    = normalize(u_SpotLightPos - v_WorldPos);
      float theta = dot(Ls, normalize(-u_SpotLightDir));
      if (theta > u_SpotCutoff) {
        float intensity = clamp((theta - u_SpotCutoff) / (1.0 - u_SpotCutoff), 0.0, 1.0);
        result += intensity * phong(N, Ls, V, vec3(1.0, 0.95, 0.7), base);
      }
    }

    gl_FragColor = vec4(clamp(result, 0.0, 1.0), u_FragColor.a);
  }
`;

// =========================================================
// GLOBALS
// =========================================================
let canvas;
let gl;
let a_Position;
let a_Normal;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjMatrix;
let u_NormalMatrix;
let u_ShowNormals;
let u_LightingOn;
let u_PointLightOn;
let u_PointLightPos;
let u_PointLightColor;
let u_SpotLightOn;
let u_SpotLightPos;
let u_SpotLightDir;
let u_SpotCutoff;
let u_ViewPos;

// Original globals
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize  = 5;
let g_globalAngle   = 0;
let g_globalAngle2  = 0;

let g_rotateMouseDown = false;
let g_lastMouseX = null;
let g_lastMouseY = null;

let rightarman     = 135;
let rightforearman = 0;
let rightfistan    = 0;
let leftforearman  = 0;
let leftfistan     = 0;
let leftarman      = 135;
let wavingAnimation   = false;
let shiftMouseAnimation = false;
let winkScale = 1.0;

// New lighting globals
let g_lightingOn   = true;
let g_showNormals  = false;
let g_pointLightOn = true;
let g_spotLightOn  = true;
let g_animLight    = true;
let g_lightAngle   = 0;
let g_lightHeight  = 1.5;
let g_lightColor   = [1.0, 1.0, 1.0];
let g_spotX = 0.0, g_spotY = 2.0, g_spotZ = 2.0;
let g_spotCutoffDeg = 20;

// OBJ
let g_objVertices = null;
let g_objNormals  = null;
let g_showObj     = true;
let g_objScale    = 0.5;
let g_objX        = 1.5;
let g_objY        = -0.5;

// =========================================================
// SETUP
// =========================================================
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) { console.log('Failed to get WebGL context'); return; }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders'); return;
  }

  a_Position  = gl.getAttribLocation(gl.program,  'a_Position');
  a_Normal    = gl.getAttribLocation(gl.program,  'a_Normal');

  u_FragColor        = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix      = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ViewMatrix       = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix       = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_NormalMatrix     = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_ShowNormals      = gl.getUniformLocation(gl.program, 'u_ShowNormals');
  u_LightingOn       = gl.getUniformLocation(gl.program, 'u_LightingOn');
  u_PointLightOn     = gl.getUniformLocation(gl.program, 'u_PointLightOn');
  u_PointLightPos    = gl.getUniformLocation(gl.program, 'u_PointLightPos');
  u_PointLightColor  = gl.getUniformLocation(gl.program, 'u_PointLightColor');
  u_SpotLightOn      = gl.getUniformLocation(gl.program, 'u_SpotLightOn');
  u_SpotLightPos     = gl.getUniformLocation(gl.program, 'u_SpotLightPos');
  u_SpotLightDir     = gl.getUniformLocation(gl.program, 'u_SpotLightDir');
  u_SpotCutoff       = gl.getUniformLocation(gl.program, 'u_SpotCutoff');
  u_ViewPos          = gl.getUniformLocation(gl.program, 'u_ViewPos');

  // Set identity defaults
  var identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identity.elements);

  // Set view/proj defaults
  gl.uniformMatrix4fv(u_ViewMatrix, false,
    new Matrix4().setLookAt(0,0,5, 0,0,0, 0,1,0).elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false,
    new Matrix4().setPerspective(30, canvas.width/canvas.height, 0.1, 100).elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, identity.elements);
}

// =========================================================
// ACTIONS
// =========================================================
function actions() {
  // Original buttons
  document.getElementById('animationOn').onclick  = function(){ wavingAnimation = true;  }
  document.getElementById('animationOff').onclick = function(){ wavingAnimation = false; }

  document.getElementById('yellowSlide').addEventListener('mousemove', function(){ rightarman = this.value; renderScene(); });
  document.getElementById('angleSlide').addEventListener('mousemove',  function(){ g_globalAngle  = this.value; renderScene(); });
  document.getElementById('angleSlide2').addEventListener('mousemove', function(){ g_globalAngle2 = this.value; renderScene(); });

  // --- NEW LIGHTING BUTTONS ---

  // Lighting on/off
  document.getElementById('btnLighting').onclick = function(){
    g_lightingOn = !g_lightingOn;
    this.textContent = g_lightingOn ? 'Lighting: ON' : 'Lighting: OFF';
  };

  // Normal visualization
  document.getElementById('btnNormals').onclick = function(){
    g_showNormals = !g_showNormals;
    this.textContent = g_showNormals ? 'Normals: ON' : 'Normals: OFF';
  };

  // Point light on/off
  document.getElementById('btnPointLight').onclick = function(){
    g_pointLightOn = !g_pointLightOn;
    this.textContent = g_pointLightOn ? 'Point Light: ON' : 'Point Light: OFF';
  };

  // Animate light on/off
  document.getElementById('btnAnimLight').onclick = function(){
    g_animLight = !g_animLight;
    this.textContent = g_animLight ? 'Animate Light: ON' : 'Animate Light: OFF';
  };

  // Spotlight on/off
  document.getElementById('btnSpotLight').onclick = function(){
    g_spotLightOn = !g_spotLightOn;
    this.textContent = g_spotLightOn ? 'Spot Light: ON' : 'Spot Light: OFF';
  };

  // Light angle slider (manual)
  document.getElementById('lightAngleSlide').addEventListener('mousemove', function(){
    if (!g_animLight) g_lightAngle = this.value;
  });

  // Light height slider
  document.getElementById('lightHeightSlide').addEventListener('mousemove', function(){
    g_lightHeight = parseFloat(this.value);
  });

  // Light color picker
  document.getElementById('lightColor').addEventListener('input', function(){
    var hex = this.value;
    g_lightColor = [
      parseInt(hex.slice(1,3),16)/255,
      parseInt(hex.slice(3,5),16)/255,
      parseInt(hex.slice(5,7),16)/255
    ];
  });

  // Spot cutoff
  document.getElementById('spotCutoffSlide').addEventListener('mousemove', function(){
    g_spotCutoffDeg = parseFloat(this.value);
  });

  // OBJ
  document.getElementById('objFile').addEventListener('change', loadOBJFile);
  document.getElementById('btnShowObj').onclick = function(){
    g_showObj = !g_showObj;
    this.textContent = g_showObj ? 'Show OBJ: ON' : 'Show OBJ: OFF';
  };
  document.getElementById('objScaleSlide').addEventListener('mousemove', function(){ g_objScale = parseFloat(this.value); });
  document.getElementById('objXSlide').addEventListener('mousemove',     function(){ g_objX = parseFloat(this.value); });
  document.getElementById('objYSlide').addEventListener('mousemove',     function(){ g_objY = parseFloat(this.value); });
}

// =========================================================
// MAIN
// =========================================================
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  actions();

  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      shiftMouseAnimation = !shiftMouseAnimation;
    } else {
      g_rotateMouseDown = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  };

  canvas.onmousemove = function(ev) {
    if (g_rotateMouseDown && !ev.shiftKey) {
      var deltaX = ev.clientX - g_lastMouseX;
      var deltaY = ev.clientY - g_lastMouseY;
      g_globalAngle  += deltaX * 0.5;
      g_globalAngle2 += deltaY * 0.5;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  };

  canvas.onmouseup = function() {
    g_rotateMouseDown = false;
    g_lastMouseX = null;
    g_lastMouseY = null;
  };

  gl.clearColor(0.902, 0.902, 0.980, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds   = 0;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  if (g_animLight) {
    g_lightAngle = (g_seconds * 60) % 360;
  }

  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (wavingAnimation) {
    rightarman     = 115 + 45 * Math.sin(g_seconds);
    leftarman      = 135 + 10 * Math.sin(g_seconds);
    rightforearman = -30 * Math.sin(g_seconds);
    rightfistan    = -30 * Math.sin(g_seconds);
    leftforearman  = -30 * Math.sin(g_seconds);
    leftfistan     = -30 * Math.sin(g_seconds);
  }
  if (shiftMouseAnimation) {
    var w = Math.sin(g_seconds * 3);
    winkScale = w > 0 ? 1.0 - w : 1.0;
  } else {
    winkScale = 1.0;
  }
}

// =========================================================
// RENDER
// =========================================================
function renderScene() {
  var startTime = performance.now();

  // Global rotation matrix (same as original)
  var globalRotMat = new Matrix4()
    .rotate(180, 0, 1, 0)
    .rotate(g_globalAngle,  0, 1, 0)
    .rotate(-g_globalAngle2, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // View + Projection
  gl.uniformMatrix4fv(u_ViewMatrix, false,
    new Matrix4().setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0).elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false,
    new Matrix4().setPerspective(30, canvas.width/canvas.height, 0.1, 100).elements);
  gl.uniform3f(u_ViewPos, 0, 0, 5);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Pass lighting state
  gl.uniform1i(u_ShowNormals,  g_showNormals  ? 1 : 0);
  gl.uniform1i(u_LightingOn,   g_lightingOn   ? 1 : 0);
  gl.uniform1i(u_PointLightOn, g_pointLightOn ? 1 : 0);
  gl.uniform1i(u_SpotLightOn,  g_spotLightOn  ? 1 : 0);

  // Point light position (orbiting)
  var rad = g_lightAngle * Math.PI / 180;
  var lx = 1.5 * Math.cos(rad);
  var lz = 1.5 * Math.sin(rad);
  var ly = g_lightHeight;
  gl.uniform3f(u_PointLightPos,   lx, ly, lz);
  gl.uniform3f(u_PointLightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

  // Spotlight aimed at origin
  gl.uniform3f(u_SpotLightPos, g_spotX, g_spotY, g_spotZ);
  gl.uniform3f(u_SpotLightDir, -g_spotX, -g_spotY, -g_spotZ);
  gl.uniform1f(u_SpotCutoff,   Math.cos(g_spotCutoffDeg * Math.PI / 180));

  // Draw light markers (small cubes at light positions)
  drawLightMarker(lx, ly, lz, [1.0, 1.0, 0.2, 1.0]);
  drawLightMarker(g_spotX, g_spotY, g_spotZ, [1.0, 0.5, 0.0, 1.0]);

  // Two extra spheres so lighting is obvious
  drawLightSphere(-0.8, -0.5,  0.3, [0.8, 0.2, 0.2, 1.0]);
  drawLightSphere( 0.8, -0.5, -0.3, [0.2, 0.4, 0.9, 1.0]);

  // Original animal
  drawAnimal();

  // OBJ model
  if (g_objVertices && g_showObj) {
    drawOBJModel();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

// =========================================================
// DRAW HELPERS
// =========================================================

// Draw a triangle with both position and normal buffers
function drawTriangle3DWithNormals(vertices, normals) {
  var n = vertices.length / 3;

  // Position buffer
  var vBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // Normal buffer
  var nBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

// Small cube at a world position to mark a light
function drawLightMarker(x, y, z, color) {
  var s = 0.06;
  var m = new Matrix4().translate(x - s/2, y - s/2, z - s/2).scale(s, s, s);
  var wasOn = g_lightingOn;
  g_lightingOn = false;
  gl.uniform1i(u_LightingOn, 0);
  _drawRawCube(color, m);
  g_lightingOn = wasOn;
  gl.uniform1i(u_LightingOn, wasOn ? 1 : 0);
}

// Sphere placed in world for lighting demo
function drawLightSphere(x, y, z, color) {
  var s = new Sphere(16, 16);
  s.color = color;
  s.matrix = new Matrix4().translate(x, y, z).scale(0.35, 0.35, 0.35);
  s.render();
}

// Raw cube using Cube class
function _drawRawCube(color, matrix) {
  var c = new Cube();
  c.color = color;
  c.matrix = matrix;
  c.render();
}

// =========================================================
// ORIGINAL ANIMAL (unchanged logic, same as your original)
// =========================================================
function drawAnimal() {

  //Head-------------------------------------
  var head = new Cube();
  head.color = [1,1,1,1];
  head.matrix.translate(-0.47,-0.2,0);
  head.matrix.scale(0.8,0.4,0.65);
  head.render();

  var hat = new Cube();
  hat.color = [0.1,0.1,0.1,1];
  hat.matrix.translate(-0.5,-0.22,0.02);
  hat.matrix.scale(0.85,0.60,0.7);
  hat.render();

  var hatflap = new Prism();
  hatflap.color = [0.1,0.1,0.1,1];
  hatflap.matrix.translate(0.335,0.38,-0.0001);
  hatflap.matrix.rotate(180,0,0,1);
  hatflap.matrix.scale(0.8,0.3,0.4);
  hatflap.render();

  var hatupper = new Cube();
  hatupper.color = [0.1,0.1,0.1,1];
  hatupper.matrix.translate(-0.35,0.05,0.0001);
  hatupper.matrix.scale(0.55,0.50,0.55);
  hatupper.render();

  var hatright = new Pyramid();
  hatright.color = [0.1,0.1,0.1,1];
  hatright.matrix.translate(0.2,0.7, 0.1);
  hatright.matrix.rotate(-45,0,0,1);
  hatright.matrix.scale(0.50,0.50,0.50);
  hatright.render();

  var hatrightlow = new Prism();
  hatrightlow.color = [0.1,0.1,0.1,1];
  hatrightlow.matrix.translate(0.56,0.34, 0.1);
  hatrightlow.matrix.rotate(135,0,0,1);
  hatrightlow.matrix.scale(0.50,0.50,0.50);
  hatrightlow.render();

  var hatleft = new Pyramid();
  hatleft.color = [0.1,0.1,0.1,1];
  hatleft.matrix.translate(-0.7,0.35,0.1);
  hatleft.matrix.rotate(45,0,0,1);
  hatleft.matrix.scale(0.5,0.5,0.5);
  hatleft.render();

  var hatleftlow = new Prism();
  hatleftlow.color = [0.1,0.1,0.1,1];
  hatleftlow.matrix.translate(-0.35,0.7, 0.1);
  hatleftlow.matrix.rotate(225,0,0,1);
  hatleftlow.matrix.scale(0.50,0.50,0.50);
  hatleftlow.render();

  var hatd = new Cube();
  hatd.color = [0.1,0.1,0.1,1];
  hatd.matrix.translate(-0.42,-0.25,0.05);
  hatd.matrix.scale(0.7,0.50,0.70);
  hatd.render();

  var circleft = new Sphere();
  circleft.color = [0.1,0.1,0.1,1];
  circleft.matrix.translate(-0.9,0.9, 0.35);
  circleft.matrix.scale(0.05,0.05,0.05);
  circleft.render();

  var circright = new Sphere();
  circright.color = [0.1,0.1,0.1,1];
  circright.matrix.translate(0.75,0.9, 0.35);
  circright.matrix.scale(0.05,0.05,0.05);
  circright.render();

  var hatptleft = new Pyramid();
  hatptleft.color = [0.1,0.1,0.1,1];
  hatptleft.matrix.translate(-0.35,-0.25, 0.1);
  hatptleft.matrix.rotate(-140,1,0,0);
  hatptleft.matrix.scale(0.25,0.10,0.05);
  hatptleft.render();

  var hatptleft2 = new Pyramid();
  hatptleft2.color = [0.1,0.1,0.1,1];
  hatptleft2.matrix.translate(-0.35,-0.23, 0.05);
  hatptleft2.matrix.rotate(-90,0,1,0);
  hatptleft2.matrix.rotate(130,1,0,0);
  hatptleft2.matrix.scale(0.55,0.10,0.05);
  hatptleft2.render();

  var ballleft2 = new Sphere();
  ballleft2.color = [1,0,1,1];
  ballleft2.matrix.translate(-0.42,-0.33, 0.35);
  ballleft2.matrix.scale(0.03,0.03,0.03);
  ballleft2.render();

  var hatptright = new Pyramid();
  hatptright.color = [0.1,0.1,0.1,1];
  hatptright.matrix.translate(-0.05,-0.25, 0.1);
  hatptright.matrix.rotate(-140,1,0,0);
  hatptright.matrix.scale(0.25,0.10,0.05);
  hatptright.render();

  var hatptright2 = new Pyramid();
  hatptright2.color = [0.1,0.1,0.1,1];
  hatptright2.matrix.translate(0.2,-0.23, 0.63);
  hatptright2.matrix.rotate(90,0,1,0);
  hatptright2.matrix.rotate(130,1,0,0);
  hatptright2.matrix.scale(0.55,0.10,0.05);
  hatptright2.render();

  var ballleft = new Sphere();
  ballleft.color = [1,0,1,1];
  ballleft.matrix.translate(-0.23,-0.33, 0);
  ballleft.matrix.scale(0.03,0.03,0.03);
  ballleft.render();

  var ballright = new Sphere();
  ballright.color = [1,0,1,1];
  ballright.matrix.translate(0.07,-0.33, 0);
  ballright.matrix.scale(0.03,0.03,0.03);
  ballright.render();

  var ballright2 = new Sphere();
  ballright2.color = [1,0,1,1];
  ballright2.matrix.translate(0.25,-0.32, 0.35);
  ballright2.matrix.scale(0.03,0.03,0.03);
  ballright2.render();

  // headpiece
  var skull = new Sphere();
  skull.color = [1,0,1,1];
  skull.matrix.translate(-0.06,0.35, -0.01);
  skull.matrix.scale(0.12,0.1,0.0001);
  skull.render();

  var skulleyeleft = new Sphere();
  skulleyeleft.color = [0.1,0.1,0.1,1];
  skulleyeleft.matrix.translate(-0.11,0.35, -0.015);
  skulleyeleft.matrix.rotate(155,0,0,1);
  skulleyeleft.matrix.scale(0.020,0.03,0.0001);
  skulleyeleft.render();

  var skulleyeright = new Sphere();
  skulleyeright.color = [0.1,0.1,0.1,1];
  skulleyeright.matrix.translate(-0.,0.35, -0.015);
  skulleyeright.matrix.rotate(25,0,0,1);
  skulleyeright.matrix.scale(0.020,0.03,0.0001);
  skulleyeright.render();

  var teeth1 = new Cube();
  teeth1.color = [1,0,1,1];
  teeth1.matrix.translate(-0.12,0.23, -0.015);
  teeth1.matrix.scale(0.035,0.05,0.0001);
  teeth1.render();

  var teeth2 = new Cube();
  teeth2.color = [1,0,1,1];
  teeth2.matrix.translate(-0.075,0.23, -0.015);
  teeth2.matrix.scale(0.035,0.05,0.0001);
  teeth2.render();

  var teeth3 = new Cube();
  teeth3.color = [1,0,1,1];
  teeth3.matrix.translate(-0.03,0.23, -0.015);
  teeth3.matrix.scale(0.035,0.05,0.0001);
  teeth3.render();

  // eyes
  var eyeright = new Sphere();
  eyeright.color = [0.1,0.1,0.1,1];
  eyeright.matrix.translate(0.15,0, -0.01);
  eyeright.matrix.scale(0.050,0.07*winkScale,0.005);
  eyeright.render();

  var eyerightd = new Cube();
  eyerightd.color = [1,1,1,1];
  eyerightd.matrix.translate(0.1,0.03*winkScale, -0.014);
  eyerightd.matrix.rotate(15,0,0,1);
  eyerightd.matrix.scale(0.1,0.05*winkScale,0.03);
  eyerightd.render();

  var eyerightlash = new Cube();
  eyerightlash.color = [0.1,0.1,0.1,1];
  eyerightlash.matrix.translate(0.12,0.02*winkScale, -0.014);
  eyerightlash.matrix.rotate(15,0,0,1);
  eyerightlash.matrix.scale(0.11,0.01,0.03);
  eyerightlash.render();

  var eyerightlash2 = new Cube();
  eyerightlash2.color = [0.1,0.1,0.1,1];
  eyerightlash2.matrix.translate(0.12,0.0, -0.014);
  eyerightlash2.matrix.rotate(15,0,0,1);
  eyerightlash2.matrix.scale(0.11,0.01,0.03);
  eyerightlash2.render();

  var eyeleft = new Sphere();
  eyeleft.color = [0.1,0.1,0.1,1];
  eyeleft.matrix.translate(-0.3,0, -0.01);
  eyeleft.matrix.scale(0.050,0.07,0.005);
  eyeleft.render();

  var eyeleftd = new Cube();
  eyeleftd.color = [1,1,1,1];
  eyeleftd.matrix.translate(-0.35,0.05, -0.015);
  eyeleftd.matrix.rotate(-15,0,0,1);
  eyeleftd.matrix.scale(0.1,0.05,0.03);
  eyeleftd.render();

  var eyeleftlash = new Cube();
  eyeleftlash.color = [0.1,0.1,0.1,1];
  eyeleftlash.matrix.translate(-0.37,0.04, -0.015);
  eyeleftlash.matrix.rotate(-15,0,0,1);
  eyeleftlash.matrix.scale(0.11,0.01,0.03);
  eyeleftlash.render();

  var eyeleftlash2 = new Cube();
  eyeleftlash2.color = [0.1,0.1,0.1,1];
  eyeleftlash2.matrix.translate(-0.37,0.02, -0.015);
  eyeleftlash2.matrix.rotate(-15,0,0,1);
  eyeleftlash2.matrix.scale(0.11,0.01,0.03);
  eyeleftlash2.render();

  // nose
  var nose = new Sphere();
  nose.color = [1,0,0.8,1];
  nose.matrix.translate(-0.06,-0.05, -0.);
  nose.matrix.scale(0.03,0.02,0.03);
  nose.render();

  // mouth
  var mouth = new Sphere();
  mouth.color = [0,0,0,1];
  mouth.matrix.translate(-0.06,-0.13, -0.);
  mouth.matrix.scale(0.05,0.02,0.01);
  mouth.render();

  var mouth2 = new Sphere();
  mouth2.color = [1,1,1,1];
  mouth2.matrix.translate(-0.06,-0.12, -0.);
  mouth2.matrix.scale(0.05,0.02,0.013);
  mouth2.render();

  // Body
  var body = new Cube();
  body.color = [1,1,1,1];
  body.matrix.translate(-0.33,-0.7,0.08);
  body.matrix.scale(0.5,1,0.55);
  body.render();

  var belly = new Cube();
  belly.color = [1,1,1,1];
  belly.matrix.translate(-0.33,-0.65,0.06);
  belly.matrix.scale(0.45,0.6,0.02);
  belly.render();

  var lobody = new Cube();
  lobody.color = [1,1,1,1];
  lobody.matrix.translate(-0.275,-0.75,0.08);
  lobody.matrix.scale(0.4,0.1,0.55);
  lobody.render();

  // Arms
  var leftarm = new Cube();
  leftarm.color = [1,1,1,1];
  leftarm.matrix.translate(-0.25,-0.40,0.25);
  leftarm.matrix.rotate(leftarman,0,0,1);
  var leftarmcoord = new Matrix4(leftarm.matrix);
  leftarm.matrix.scale(0.1,0.15,0.2);
  leftarm.render();

  var leftelbow = new Cube();
  leftelbow.color = [1,1,1,1];
  leftelbow.matrix = new Matrix4(leftarmcoord);
  leftelbow.matrix.translate(0,0.15,0);
  leftelbow.matrix.rotate(leftforearman,0,0,1);
  var leftelbowcoord = new Matrix4(leftelbow.matrix);
  leftelbow.matrix.scale(0.1,0.15,0.2);
  leftelbow.render();

  var leftfist = new Cube();
  leftfist.color = [1,1,1,1];
  leftfist.matrix = new Matrix4(leftelbowcoord);
  leftfist.matrix.translate(0,0.15,0);
  leftfist.matrix.rotate(leftfistan,0,0,1);
  leftfist.matrix.scale(0.15,0.08,0.25);
  leftfist.render();

  var rightarm = new Cube();
  rightarm.color = [1,1,1,1];
  rightarm.matrix.translate(0.1,-0.4,0.5);
  rightarm.matrix.rotate(180,0,1,0);
  rightarm.matrix.rotate(rightarman,0,0,1);
  var rightarmcoord = new Matrix4(rightarm.matrix);
  rightarm.matrix.scale(0.1,0.15,0.2);
  rightarm.render();

  var rightelbow = new Cube();
  rightelbow.color = [1,1,1,1];
  rightelbow.matrix = new Matrix4(rightarmcoord);
  rightelbow.matrix.translate(0,0.15,0);
  rightelbow.matrix.rotate(rightforearman,0,0,1);
  var rightelbowcoord = new Matrix4(rightelbow.matrix);
  rightelbow.matrix.scale(0.1,0.15,0.2);
  rightelbow.render();

  var rightfist = new Cube();
  rightfist.color = [1,1,1,1];
  rightfist.matrix = new Matrix4(rightelbowcoord);
  rightfist.matrix.translate(0,0.15,0);
  rightfist.matrix.rotate(rightfistan,0,0,1);
  rightfist.matrix.scale(0.15,0.08,0.25);
  rightfist.render();

  // Legs
  var leftleg = new Cube();
  leftleg.color = [1,1,1,1];
  var leftlegcoord = leftleg.matrix;
  leftleg.matrix.translate(-0.25,-0.9,0.2);
  leftleg.matrix.scale(0.15,0.2,0.3);
  leftleg.render();

  var leftfoot = new Cube();
  leftfoot.color = [1,1,1,1];
  leftfoot.matrix = leftlegcoord;
  leftfoot.matrix.translate(-0.1,-0.25,-0.1);
  leftfoot.matrix.scale(1.2,0.4,1.1);
  leftfoot.render();

  var rightleg = new Cube();
  rightleg.color = [1,1,1,1];
  var rightlegcoord = rightleg.matrix;
  rightleg.matrix.translate(-0.05,-0.9,0.2);
  rightleg.matrix.scale(0.15,0.2,0.3);
  rightleg.render();

  var rightfoot = new Cube();
  rightfoot.color = [1,1,1,1];
  rightfoot.matrix = rightlegcoord;
  rightfoot.matrix.translate(-0.07,-0.25,-0.1);
  rightfoot.matrix.scale(1.2,0.4,1.1);
  rightfoot.render();
}

// =========================================================
// OBJ LOADER
// =========================================================
function loadOBJFile(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    parseOBJ(e.target.result);
    document.getElementById('objStatus').textContent =
      'Loaded: ' + file.name + ' (' + (g_objVertices.length / 3) + ' verts)';
  };
  reader.readAsText(file);
}

function parseOBJ(text) {
  var posArr = [], normArr = [], faceV = [], faceN = [];
  var lines = text.split('\n');
  for (var line of lines) {
    line = line.trim();
    if (line.startsWith('v ')) {
      var p = line.split(/\s+/);
      posArr.push(+p[1], +p[2], +p[3]);
    } else if (line.startsWith('vn ')) {
      var n = line.split(/\s+/);
      normArr.push(+n[1], +n[2], +n[3]);
    } else if (line.startsWith('f ')) {
      var parts = line.split(/\s+/).slice(1);
      var tris = parts.map(function(tok) {
        var t = tok.split('/');
        return { vi: (+t[0])-1, ni: t[2] ? (+t[2])-1 : -1 };
      });
      for (var i = 1; i < tris.length - 1; i++) {
        for (var t of [tris[0], tris[i], tris[i+1]]) {
          faceV.push(posArr[t.vi*3], posArr[t.vi*3+1], posArr[t.vi*3+2]);
          if (t.ni >= 0 && normArr.length > 0) {
            faceN.push(normArr[t.ni*3], normArr[t.ni*3+1], normArr[t.ni*3+2]);
          } else {
            faceN.push(0, 1, 0);
          }
        }
      }
    }
  }

  // Compute face normals if none in file
  if (normArr.length === 0) {
    faceN = [];
    for (var i = 0; i < faceV.length; i += 9) {
      var ax=faceV[i],  ay=faceV[i+1], az=faceV[i+2];
      var bx=faceV[i+3],by=faceV[i+4],bz=faceV[i+5];
      var cx=faceV[i+6],cy=faceV[i+7],cz=faceV[i+8];
      var ux=bx-ax, uy=by-ay, uz=bz-az;
      var vx=cx-ax, vy=cy-ay, vz=cz-az;
      var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      var len = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1;
      for (var k = 0; k < 3; k++) faceN.push(nx/len, ny/len, nz/len);
    }
  }

  // Normalize to fit in unit box
  var mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity,mnZ=Infinity,mxZ=-Infinity;
  for (var i = 0; i < faceV.length; i+=3) {
    mnX=Math.min(mnX,faceV[i]);   mxX=Math.max(mxX,faceV[i]);
    mnY=Math.min(mnY,faceV[i+1]); mxY=Math.max(mxY,faceV[i+1]);
    mnZ=Math.min(mnZ,faceV[i+2]); mxZ=Math.max(mxZ,faceV[i+2]);
  }
  var span = Math.max(mxX-mnX, mxY-mnY, mxZ-mnZ) || 1;
  var cx=(mnX+mxX)/2, cy=(mnY+mxY)/2, cz=(mnZ+mxZ)/2;
  for (var i = 0; i < faceV.length; i+=3) {
    faceV[i]   = (faceV[i]  -cx)/span;
    faceV[i+1] = (faceV[i+1]-cy)/span;
    faceV[i+2] = (faceV[i+2]-cz)/span;
  }

  g_objVertices = faceV;
  g_objNormals  = faceN;
}

function drawOBJModel() {
  gl.uniform4f(u_FragColor, 0.7, 0.6, 0.9, 1.0);
  var mat = new Matrix4().translate(g_objX, g_objY, 0).scale(g_objScale, g_objScale, g_objScale);
  var normalMat = new Matrix4(mat).invert().transpose();
  gl.uniformMatrix4fv(u_ModelMatrix,  false, mat.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);
  drawTriangle3DWithNormals(g_objVertices, g_objNormals);
}

// =========================================================
// UTIL
// =========================================================
function sendTextToHTML(text, htmlID) {
  var el = document.getElementById(htmlID);
  if (!el) { console.log('Failed to get ' + htmlID); return; }
  el.innerHTML = text;
}
