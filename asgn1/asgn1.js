// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
  gl_Position = a_Position;
    //gl_PointSize = 20.0;
    gl_PointSize = u_Size;
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

  //Get the storage location of u_FragColor
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if(!u_Size){
    console.log('Failed to get the storage location of u_size');
    return;
  }

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

//animations 
let g_cloud= -0.65; //cloud horizontal position (to move)
let g_cloud2 = 0.35;
let g_animationId = null; //store animation frame ID 
let g_isAnimate = false;


//add actions for HTML
function actions(){
    document.getElementById('clear').onclick = function(){ g_shapesList=[]; renderAllShapes();
         document.getElementById('dra').textContent = ""
    };
    document.getElementById('square').onclick = function(){ g_selectedType=POINT};
    document.getElementById('triangle').onclick = function(){ g_selectedType=TRIANGLE};
    document.getElementById('circle').onclick = function(){ g_selectedType=CIRCLE;};
    document.getElementById('drawing').onclick = function(){ mountains(); 
            document.getElementById('dra').textContent = "Note: The grass is a huge triangle that goes offscreen. Click on Clear Canvas to remove this drawing";
    };

    //slide
    document.getElementById('red').addEventListener('mouseup', function(){ g_selectedColor[0] = this.value/100;});
    document.getElementById('green').addEventListener('mouseup', function(){ g_selectedColor[1] = this.value/100;});
    document.getElementById('blue').addEventListener('mouseup', function(){ g_selectedColor[2] = this.value/100;});
    //size slide
    document.getElementById('size').addEventListener('mouseup', function(){ g_selectedSize = this.value;});
    //segment slide
    document.getElementById('count').addEventListener('mouseup', function(){ g_selectedCount = this.value;});
    document.getElementById('showImageBtn').onclick = function () {
        document.getElementById('myImage').style.display = "block";};
    //awesomeness
    document.getElementById('Awesomeness').onclick = function(){ 
        if(!g_isAnimate){
            startCloud();
        }
        else{
            stopCloud();
        }

    };
    
}

function startCloud(){
    g_isAnimate = true;
    document.getElementById('Awesomeness').textContent = "Stop Animation";
    document.getElementById('explanation').textContent = "The awesomeness is that the clouds animate! Click on stop animation, then click clear canvas to go back to normal.";
    animateCloud();
}

function stopCloud(){
    g_isAnimate = false;
    cancelAnimationFrame(g_animationId);
    document.getElementById('Awesomeness').textContent = "Awesomeness";
    document.getElementById('explanation').textContent = "";
}

function animateCloud(){
    //moving to the right
    g_cloud += 0.005;

    g_cloud2 += 0.007;

    //once offscreen resets
    if(g_cloud > 1.2){
        g_cloud = -1.2;
    }
     if(g_cloud2 > 1.2){
        g_cloud2 = -1.2;
    }

    mountains();
    if(g_isAnimate){
        g_animationId = requestAnimationFrame(animateCloud);
    }
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    actions();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev){if(ev.buttons == 1){ click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}



function renderAllShapes(){
     // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //var len = g_points.length;
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();

  }
  

}

var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];

function click(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  // Store the coordinates to g_points array
    let point;
    if(g_selectedType==POINT){
        point = new Point();
    }
    else if(g_selectedType==TRIANGLE){
        point = new Triangle();
    }
    else{
        point = new Circle();
        point.segments = g_selectedCount;
    }
    point.position = [x,y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point);
  //g_points.push([x, y]);
//changes color individually and not all shapes
//slice forces a copy of the elements in the array
  //g_colors.push(g_selectedColor.slice());

  //store the size to the g_sizes array
  //g_sizes.push(g_selectedSize);
  // Store the coordinates to g_points array
//   if (x >= 0.0 && y >= 0.0) {      // First quadrant
//     g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
//   } else if (x < 0.0 && y < 0.0) { // Third quadrant
//     g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
//   } else {                         // Others
//     g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
//   }

 renderAllShapes();
}

function mountains() {
    gl.clearColor(0.6, 0.8, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

  //CLOUD (TOP LEFT)
  let white = [1, 1, 1, 1];

//   drawTriangle([-0.9,  0.7,  -0.7,  0.7,  -0.8,  0.85]);
  gl.uniform4f(u_FragColor, ...white);
  drawTriangle([g_cloud - 0.10, 0.7,  g_cloud + 0.10, 0.7,  g_cloud, 0.6]);
  drawTriangle([g_cloud - 0.10, 0.7,  g_cloud + 0.10, 0.7,  g_cloud, 0.85]);
  drawTriangle([g_cloud - 0.20, 0.6,  g_cloud, 0.6,  g_cloud - 0.10, 0.78]);
  drawTriangle([g_cloud , 0.6,  g_cloud + 0.20, 0.6,  g_cloud + 0.10, 0.78]);

  drawTriangle([g_cloud2 - 0.10, 0.75,  g_cloud2 + 0.10, 0.75,  g_cloud2, 0.65]);
  drawTriangle([g_cloud2 - 0.10, 0.75,  g_cloud2 + 0.10, 0.75,  g_cloud2, 0.9]);
  drawTriangle([g_cloud2 - 0.20, 0.65,  g_cloud2, 0.65,  g_cloud2 - 0.10, 0.83]);
  drawTriangle([g_cloud2 , 0.65,  g_cloud2 + 0.20, 0.65,  g_cloud2 + 0.10, 0.83]);
  // drawTriangle([-0.65, 0.6,  -0.45, 0.6,  -0.55, 0.78]);


  //BACK MOUNTAIN (DARK GREEN)
  let darkGreen = [0.1, 0.45, 0.25, 1.0];

 let grass = [0.1, 0.5, 0.25, 1.0];
  gl.uniform4f(u_FragColor, ...grass);

 drawTriangle([-3,-0.5,   3,-0.5,   0,-2]);

  gl.uniform4f(u_FragColor, ...darkGreen);


  drawTriangle([0.0, -0.6,  0.9, -0.6,  0.45, 0.45]);

  //Snow cap(back)
  gl.uniform4f(u_FragColor, ...white);
  drawTriangle([0.32, 0.15,  0.58, 0.15,  0.45, 0.45]);

  //FRONT MOUNTAIN (LIGHT GREEN) 
  let lightGreen = [0.3, 0.75, 0.4, 1.0];

  gl.uniform4f(u_FragColor, ...lightGreen);
  drawTriangle([-0.9, -0.6,  0.1, -0.6,  -0.4, 0.45]);

  //SNOW (FRONT MOUNTAIN)
  gl.uniform4f(u_FragColor, ...white);
  drawTriangle([-0.57, 0.1,  -0.23, 0.1,  -0.4, 0.45]);

  //TENT (BOTTOM)
  let orange = [1.0, 0.55, 0.15, 1.0];
  let darkOrange = [0.6, 0.3, 0.1, 1.0];

  gl.uniform4f(u_FragColor, ...orange);
  drawTriangle([-0.15, -0.75,  0.15, -0.75,  0.0, -0.45]);

  gl.uniform4f(u_FragColor, ...darkOrange);
  drawTriangle([-0.02, -0.75,  0.02, -0.75,  0.0, -0.55]);

   // FLOWER 1 
  // Petals (pink)
  gl.uniform4f(u_FragColor, 1.0, 0.6, 0.8, 1.0);

  // top petal
  drawTriangle([-0.86, -0.72, -0.84, -0.72, -0.85, -0.68]);
  // left petal
  drawTriangle([-0.88, -0.75, -0.86, -0.73, -0.86, -0.77]);
  // right petal
  drawTriangle([-0.84, -0.73, -0.82, -0.75, -0.84, -0.77]);
  // bottom petal
  drawTriangle([-0.86, -0.78, -0.84, -0.78, -0.85, -0.82]);

  // center (yellow)
  gl.uniform4f(u_FragColor, 1.0, 0.9, 0.2, 1.0);
  drawTriangle([-0.86, -0.75, -0.84, -0.75, -0.85, -0.73]);

  // FLOWER 2 
  // Petals (pink)
  gl.uniform4f(u_FragColor, 1.0, 0.6, 0.8, 1.0);

  drawTriangle([-0.71, -0.72, -0.69, -0.72, -0.70, -0.68]);
  drawTriangle([-0.73, -0.75, -0.71, -0.73, -0.71, -0.77]);
  drawTriangle([-0.69, -0.73, -0.67, -0.75, -0.69, -0.77]);
  drawTriangle([-0.71, -0.78, -0.69, -0.78, -0.70, -0.82]);

  // center (yellow)
  gl.uniform4f(u_FragColor, 1.0, 0.9, 0.2, 1.0);
  drawTriangle([-0.71, -0.75, -0.69, -0.75, -0.70, -0.73]);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

