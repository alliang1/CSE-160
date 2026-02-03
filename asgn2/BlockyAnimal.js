// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  } `

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

//Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;




function setupWebGL(){
    // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);

}

function connectVariablesToGLSL(){
      
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  //Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix){
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_GlobalRotateMatrix){
    console.log('Failed to get the stoarge location of u_GlobalRotateMatrix');
    return;
  }

  //Set an initial value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}
//constants 
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
//global related to UI elements
let g_selectedColor = [1.0, 1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedCount = 10;
let g_selectedType = POINT;
let g_globalAngle=0;
let g_globalAngle2=0; //up down camera

let g_rotateMouseDown = false;
let g_lastMouseX = null;
let g_lastMouseY = null;


let rightarman=135;
let rightforearman=0;
let rightfistan=0;
let leftforearman = 0;
let leftfistan = 0;
let leftarman=135;
let wavingAnimation=false;
let shiftMouseAnimation = false;
let winkScale = 1.0;


//add actions for HTML
function actions(){
    //Button Events
    document.getElementById('animationOn').onclick = function(){wavingAnimation=true;}
    document.getElementById('animationOff').onclick = function(){wavingAnimation=false;}

    //Color Slider Events
    document.getElementById('yellowSlide').addEventListener('mousemove', function(){rightarman = this.value; renderScene();})

    //size slider events 
    document.getElementById('angleSlide').addEventListener('mousemove', function(){ g_globalAngle = this.value; renderScene();})
    document.getElementById('angleSlide2').addEventListener('mousemove', function(){ g_globalAngle2 = this.value; renderScene();})

    //shift key 

    
}

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

    g_globalAngle += deltaX * 0.5;
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


  // Specify the color for clearing <canvas>
  gl.clearColor(0.902, 0.902, 0.980, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //renderScene();
  
  requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

//called by browser repeatedly whenever its time
function tick(){
  g_seconds=performance.now()/1000.0-g_startTime;
  //Print some debug info so we know we are running
  console.log(performance.now());
  //update animation angles
  updateAnimationAngles()

  //draw everything
  renderScene();
  //Tell the browser to update again when it has time
  requestAnimationFrame(tick);

}

function updateAnimationAngles(){
  if(wavingAnimation){
    rightarman = (115+45*Math.sin(g_seconds));
    leftarman = (135+10*Math.sin(g_seconds));
    rightforearman = (-30*Math.sin(g_seconds));
    rightfistan = (-30*Math.sin(g_seconds));

    leftforearman = (-30*Math.sin(g_seconds));
    leftfistan = (-30*Math.sin(g_seconds));
  }
  if(shiftMouseAnimation){
    var winkSin = Math.sin(g_seconds * 3);
    if (winkSin > 0) {
      winkScale = 1.0 - winkSin;
    } else {
      winkScale = 1.0;
    }
  } else {
    winkScale = 1.0;
  }
}

function renderScene(){
  //Check the time at the start of this function
  var startTime = performance.now();

  var globalRotMat=new Matrix4().rotate(g_globalAngle,0,1,0).rotate(-g_globalAngle2,1,0,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  

     // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Head-------------------------------------
  var head = new Cube();
  head.color = [1,1,1,1]; //white
  head.matrix.translate(-0.47,-0.2,0);
  head.matrix.scale(0.8,0.4,0.65);
  head.render();

  var hat = new Cube();
  hat.color = [0.1,0.1,0.1,1]; //black
  hat.matrix.translate(-0.5,-0.22,0.02);
  hat.matrix.scale(0.85,0.60,0.7);
  hat.render();

  var hatflap = new Prism();
  hatflap.color = [0.1,0.1,0.1,1]; //black
  hatflap.matrix.translate(0.335,0.38,-0.0001);
  hatflap.matrix.rotate(180,0,0,1);
  hatflap.matrix.scale(0.8,0.3,0.4);
  hatflap.render();

  var hatupper = new Cube();
  hatupper.color = [0.1,0.1,0.1,1]; //black
  hatupper.matrix.translate(-0.35,0.05,0.0001);
  hatupper.matrix.scale(0.55,0.50,0.55);
  hatupper.render();

  var hatright = new Pyramid();
  hatright.color = [0.1,0.1,0.1,1]; //black
  hatright.matrix.translate(0.2,0.7, 0.1);
  hatright.matrix.rotate(-45,0,0,1);
  hatright.matrix.scale(0.50,0.50,0.50);
  hatright.render();

  var hatrightlow = new Prism();
  hatrightlow.color = [0.1,0.1,0.1,1]; //black
  hatrightlow.matrix.translate(0.56,0.34, 0.1);
  hatrightlow.matrix.rotate(135,0,0,1);
  hatrightlow.matrix.scale(0.50,0.50,0.50);
  hatrightlow.render();

  var hatleft = new Pyramid();
  hatleft.color = [0.1,0.1,0.1,1]; //black
  hatleft.matrix.translate(-0.7,0.35,0.1);
  hatleft.matrix.rotate(45,0,0,1);
  hatleft.matrix.scale(0.5,0.5,0.5);
  hatleft.render();

  var hatleftlow = new Prism();
  hatleftlow.color = [0.1,0.1,0.1,1]; //black
  hatleftlow.matrix.translate(-0.35,0.7, 0.1);
  hatleftlow.matrix.rotate(225,0,0,1);
  hatleftlow.matrix.scale(0.50,0.50,0.50);
  hatleftlow.render();

  var hatd = new Cube();
  hatd.color = [0.1,0.1,0.1,1]; //black
  hatd.matrix.translate(-0.42,-0.25,0.05);
  hatd.matrix.scale(0.7,0.50,0.70);
  hatd.render();

  var circleft = new Sphere();
  circleft.color = [0.1,0.1,0.1,1]; //black
  circleft.matrix.translate(-0.9,0.9, 0.35);
  circleft.matrix.scale(0.05,0.05,0.05);
  circleft.render();

  var circright = new Sphere();
  circright.color = [0.1,0.1,0.1,1]; //black
  circright.matrix.translate(0.75,0.9, 0.35);
  circright.matrix.scale(0.05,0.05,0.05);
  circright.render();

  var hatptleft = new Pyramid();
  hatptleft.color = [0.1,0.1,0.1,1]; //black
  hatptleft.matrix.translate(-0.35,-0.25, 0.1);
  hatptleft.matrix.rotate(-140,1,0,0);
  hatptleft.matrix.scale(0.25,0.10,0.05);
  hatptleft.render();

  var hatptleft2 = new Pyramid();
  hatptleft2.color = [0.1,0.1,0.1,1]; //black
  hatptleft2.matrix.translate(-0.35,-0.23, 0.05);
  hatptleft2.matrix.rotate(-90,0,1,0);
  hatptleft2.matrix.rotate(130,1,0,0);
  hatptleft2.matrix.scale(0.55,0.10,0.05);
  hatptleft2.render();

  var ballleft2 = new Sphere();
  ballleft2.color = [1,0,1,1]; //magenta
  ballleft2.matrix.translate(-0.42,-0.33, 0.35);
  ballleft2.matrix.scale(0.03,0.03,0.03);
  ballleft2.render();

  var hatptright = new Pyramid();
  hatptright.color = [0.1,0.1,0.1,1]; //black
  hatptright.matrix.translate(-0.05,-0.25, 0.1);
  hatptright.matrix.rotate(-140,1,0,0);
  hatptright.matrix.scale(0.25,0.10,0.05);
  hatptright.render();

  var hatptright2 = new Pyramid();
  hatptright2.color = [0.1,0.1,0.1,1]; //black 
  hatptright2.matrix.translate(0.2,-0.23, 0.63);
  hatptright2.matrix.rotate(90,0,1,0);
  hatptright2.matrix.rotate(130,1,0,0);
  hatptright2.matrix.scale(0.55,0.10,0.05);
  hatptright2.render();

  var ballleft = new Sphere();
  ballleft.color = [1,0,1,1]; //magenta
  ballleft.matrix.translate(-0.23,-0.33, 0);
  ballleft.matrix.scale(0.03,0.03,0.03);
  ballleft.render();

  var ballright = new Sphere();
  ballright.color = [1,0,1,1]; //magenta
  ballright.matrix.translate(0.07,-0.33, 0);
  ballright.matrix.scale(0.03,0.03,0.03);
  ballright.render();


  var ballright = new Sphere();
  ballright.color = [1,0,1,1]; //magenta
  ballright.matrix.translate(0.25,-0.32, 0.35);
  ballright.matrix.scale(0.03,0.03,0.03);
  ballright.render();


  //headpiece
  var skull = new Sphere();
  skull.color = [1,0,1,1]; //magenta
  skull.matrix.translate(-0.06,0.35, -0.01);
  skull.matrix.scale(0.12,0.1,0.0001);
  skull.render();

  var skulleyeleft = new Sphere();
  skulleyeleft.color = [0.1,0.1,0.1,1]; //black
  skulleyeleft.matrix.translate(-0.11,0.35, -0.015);
  skulleyeleft.matrix.rotate(155,0,0,1);
  skulleyeleft.matrix.scale(0.020,0.03,0.0001);
  skulleyeleft.render();

  var skulleyeright = new Sphere();
  skulleyeright.color = [0.1,0.1,0.1,1]; //black
  skulleyeright.matrix.translate(-0.,0.35, -0.015);
  skulleyeright.matrix.rotate(25,0,0,1);
  skulleyeright.matrix.scale(0.020,0.03,0.0001);
  skulleyeright.render();

  var teeth1 = new Cube();
  teeth1.color = [1,0,1,1]; //magenta
  teeth1.matrix.translate(-0.12,0.23, -0.015);
  teeth1.matrix.scale(0.035,0.05,0.0001);
  teeth1.render();

  var teeth2 = new Cube();
  teeth2.color = [1,0,1,1]; //magenta
  teeth2.matrix.translate(-0.075,0.23, -0.015);
  teeth2.matrix.scale(0.035,0.05,0.0001);
  teeth2.render();

  var teeth3 = new Cube();
  teeth3.color = [1,0,1,1]; //magenta
  teeth3.matrix.translate(-0.03,0.23, -0.015);
  teeth3.matrix.scale(0.035,0.05,0.0001);
  teeth3.render();

  //eyes

  var eyeright = new Sphere();
  eyeright.color = [0.1,0.1,0.1,1]; //black
  eyeright.matrix.translate(0.15,0, -0.01);
  eyeright.matrix.scale(0.050,0.07* winkScale,0.005); //middle can change
  eyeright.render();

  var eyerightd = new Cube();
  eyerightd.color = [1,1,1,1]; //white
  eyerightd.matrix.translate(0.1,0.03 * winkScale, -0.014);
  eyerightd.matrix.rotate(15,0,0,1);
  eyerightd.matrix.scale(0.1,0.05 * winkScale,0.03); //middle can change
  eyerightd.render();

  var eyerightlash = new Cube();
  eyerightlash.color = [0.1,0.1,0.1,1]; //black
  eyerightlash.matrix.translate(0.12,0.02 * winkScale, -0.014);
  eyerightlash.matrix.rotate(15,0,0,1);
  eyerightlash.matrix.scale(0.11,0.01,0.03); //middle can change
  eyerightlash.render();

  var eyerightlash2 = new Cube();
  eyerightlash2.color = [0.1,0.1,0.1,1]; //black
  eyerightlash2.matrix.translate(0.12,0.0, -0.014);
  eyerightlash2.matrix.rotate(15,0,0,1);
  eyerightlash2.matrix.scale(0.11,0.01,0.03); //middle can change
  eyerightlash2.render();

  var eyeleft = new Sphere();
  eyeleft.color = [0.1,0.1,0.1,1]; //black
  eyeleft.matrix.translate(-0.3,0, -0.01);
  eyeleft.matrix.scale(0.050,0.07,0.005); //middle can change
  eyeleft.render();

  var eyeleftd = new Cube();
  eyeleftd.color = [1,1,1,1]; //white
  eyeleftd.matrix.translate(-0.35,0.05, -0.015);
  eyeleftd.matrix.rotate(-15,0,0,1);
  eyeleftd.matrix.scale(0.1,0.05,0.03); //middle can change
  eyeleftd.render();

  var eyeleftlash = new Cube();
  eyeleftlash.color = [0.1,0.1,0.1,1]; //black
  eyeleftlash.matrix.translate(-0.37,0.04, -0.015);
  eyeleftlash.matrix.rotate(-15,0,0,1);
  eyeleftlash.matrix.scale(0.11,0.01,0.03); //middle can change
  eyeleftlash.render();

  var eyeleftlash2 = new Cube();
  eyeleftlash2.color = [0.1,0.1,0.1,1]; //black
  eyeleftlash2.matrix.translate(-0.37,0.02, -0.015);
  eyeleftlash2.matrix.rotate(-15,0,0,1);
  eyeleftlash2.matrix.scale(0.11,0.01,0.03); //middle can change
  eyeleftlash2.render();

  //nose
  var nose = new Sphere();
  nose.color = [1,0,0.8,1]; //magenta
  nose.matrix.translate(-0.06,-0.05, -0.);
  nose.matrix.scale(0.03,0.02,0.03);
  nose.render();

  //mouth
  var mouth = new Sphere();
  mouth.color = [0,0,0,1]; //black
  //mouth.color = [0.9,0,0.6,1]; //pink
  mouth.matrix.translate(-0.06,-0.13, -0.);
  mouth.matrix.scale(0.05,0.02,0.01);
  mouth.render();

  var mouth2 = new Sphere();
  mouth2.color = [1,1,1,1]; //white
  mouth2.matrix.translate(-0.06,-0.12, -0.);
  mouth2.matrix.scale(0.05,0.02,0.013);
  mouth2.render();


  // //Body---------------------------------------------------------------
  var body = new Cube();
  body.color = [1,1,1,1]; //white
  body.matrix.translate(-0.33,-0.7,0.08); //left right,up down,in out
  body.matrix.scale(0.5,1,0.55);
  body.render();

  var belly = new Cube();
  belly.color = [1,1,1,1]; //white
  belly.matrix.translate(-0.33,-0.65,0.06); //left right,up down,in out
  belly.matrix.scale(0.45,0.6,0.02);
  belly.render();

  //lower body
  var lobody = new Cube();
  lobody.color = [1,1,1,1]; //white
  lobody.matrix.translate(-0.275,-0.75,0.08); //left right,up down,in out
  lobody.matrix.scale(0.4,0.1,0.55);
  lobody.render();

  //Arms-----------------------------------------------------------

  //Left Arm
  var leftarm = new Cube();
  leftarm.color = [1,1,1,1]; //white
  leftarm.matrix.translate(-0.25,-0.40,0.25); 
  //maybe connect hat piece with arm?
  leftarm.matrix.rotate(leftarman,0,0,1); //180 to -290 
  var leftarmcoord = new Matrix4(leftarm.matrix);
  leftarm.matrix.scale(0.1,0.15,0.2);
  leftarm.render();

  var leftelbow = new Cube();
  leftelbow.color = [1,1,1,1]; //white (offwhite)
  leftelbow.matrix = new Matrix4(leftarmcoord);
  leftelbow.matrix.translate(0,0.15,0);
  leftelbow.matrix.rotate(leftforearman,0,0,1);
  var leftelbowcoord = new Matrix4(leftelbow.matrix);
  leftelbow.matrix.scale(0.1, 0.15, 0.2);
  leftelbow.render();

  //Left fist 
  var leftfist = new Cube();
  leftfist.color = [1,1,1,1]; //white
  leftfist.matrix = new Matrix4(leftelbowcoord);
  leftfist.matrix.translate(0,0.15,0);
  leftfist.matrix.rotate(leftfistan, 0,0,1); 
  leftfist.matrix.scale(0.15,0.08,0.25);
  leftfist.render();


  //Right Arm
  var rightarm = new Cube();
  rightarm.color = [1.11,1.11,1.11,1]; //white (offwhite)
  rightarm.matrix.translate(0.1,-0.4,0.5); 
  rightarm.matrix.rotate(180,0,1,0); //rotating to make shoulders match
  rightarm.matrix.rotate(rightarman,0,0,1); //-180 to -290 
  var rightarmcoord = new Matrix4(rightarm.matrix);
  rightarm.matrix.scale(0.1,0.15,0.2);
  rightarm.render();

  var rightelbow = new Cube();
  rightelbow.color = [1.11,1.11,1.11,1]; //white (offwhite)
  rightelbow.matrix =new Matrix4(rightarmcoord);
  rightelbow.matrix.translate(0,0.15,0);
  rightelbow.matrix.rotate(rightforearman,0,0,1);
  var rightelbowcoord = new Matrix4(rightelbow.matrix);
  rightelbow.matrix.scale(0.1,0.15,0.2);
  rightelbow.render();

  //maybe connect hat piece with arm?
  var rightfist = new Cube();
  rightfist.color = [1.11,1.11,1.11,1]; //white
  rightfist.matrix = new Matrix4(rightelbowcoord);
  rightfist.matrix.translate(0,0.15,0); 
  rightfist.matrix.rotate(rightfistan,0,0,1);
  rightfist.matrix.scale(0.15,0.08,0.25);
  rightfist.render();


  //Legs----------------------------------------------------------------

  var leftleg = new Cube();
  leftleg.color = [1,1,1,1]; //white
  var leftlegcoord = leftleg.matrix;
  leftleg.matrix.translate(-0.25,-0.9,0.2); 
  leftleg.matrix.scale(0.15,0.2,0.3);
  leftleg.render();

  var leftfoot = new Cube();
  leftfoot.color = [1,1,1,1]; //white
  leftfoot.matrix = leftlegcoord;
  leftfoot.matrix.translate(-0.1,-0.25,-0.1); 
  leftfoot.matrix.scale(1.2,0.4,1.1);
  leftfoot.render();


  var rightleg = new Cube();
  rightleg.color = [1,1,1,1]; //white
  var rightlegcoord = rightleg.matrix;
  rightleg.matrix.translate(-0.05,-0.9,0.2); 
  rightleg.matrix.scale(0.15,0.2,0.3);
  rightleg.render();

  var rightfoot = new Cube();
  rightfoot.color = [1,1,1,1]; //white
  rightfoot.matrix = rightlegcoord;
  rightfoot.matrix.translate(-0.07,-0.25,-0.1);
  rightfoot.matrix.scale(1.2,0.4,1.1);
  rightfoot.render();



  








  // // Draw a left arm 
  // var leftArm = new Cube();
  // leftArm.color = [1,1,0,1]; //yellow
  // leftArm.matrix.translate(0,-0.5,0.0);
  // leftArm.matrix.rotate(-g_yellowAngle,0,0,1);
  // var yellowCoord= leftArm.matrix;
  // //var yellowCoord= new Matrix4(leftArm.matrix);
  // leftArm.matrix.scale(0.25,.7, .5);
  // leftArm.render();

  // //Test box 
  // var box = new Cube();
  // box.color = [1,0,1,1]; //magenta
  // box.matrix = yellowCoord;
  // box.matrix.translate(0.001,0.7,-0.001);
  // // box.matrix.rotate(-30,1,0,0);
  // // box.matrix.scale(0.5,0.5,0.5);
  // box.render();


  //Check the time at the end of the function, and show on web page 
  var duration = performance.now()- startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");

}

//Set the text of a HTML element
function sendTextToHTML(text, htmlID){
var htmlElm = document.getElementById(htmlID);
if(!htmlElm){
  console.log("Failed to get " + htmlID + " from HTML");
  return;
}
htmlElm.innerHTML = text;
}


var g_shapesList = [];



function click(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  // // Store the coordinates to g_points array
  //   let point;
  //   if(g_selectedType==POINT){
  //       point = new Point();
  //   }
  //   else if(g_selectedType==TRIANGLE){
  //       point = new Triangle();
  //   }
  //   else{
  //       point = new Circle();
  //       point.segments = g_selectedCount;
  //   }
  //   point.position = [x,y];
  //   point.color = g_selectedColor.slice();
  //   point.size = g_selectedSize;
  //   g_shapesList.push(point);
}



