var canvas;
var ctx;

function main() {  
  // Retrieve <canvas> element
  canvas = document.getElementById('canvas');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  ctx = canvas.getContext('2d');

  // Draw a black rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color
}

function drawVector(v, color){
  ctx.beginPath();
  ctx.strokeStyle = color;
  let cx = canvas.width/2;
  let cy = canvas.height/2;
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + v.elements[0]*20, cy - v.elements[1]*20);
  ctx.stroke();
}

function handleDrawEvent(){ 
  if (!canvas || !ctx) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
  }
  
  ctx.clearRect(0,0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height); 
  
  let x1 = document.getElementById('x1').value;
  let y1 = document.getElementById('y1').value;
  
  let v1 = new Vector3([parseFloat(x1), parseFloat(y1), 0]);

  let x2 = document.getElementById('x2').value;
  let y2 = document.getElementById('y2').value;
  
  let v2 = new Vector3([parseFloat(x2), parseFloat(y2), 0]);
  
  drawVector(v1,"red");
  drawVector(v2,"blue");
}

function handleDrawOperationEvent(){
  if (!canvas || !ctx) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
  }
  
  ctx.clearRect(0,0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let x1 = document.getElementById('x1').value;
  let y1 = document.getElementById('y1').value;
  
  let v1 = new Vector3([parseFloat(x1), parseFloat(y1), 0]);

  let x2 = document.getElementById('x2').value;
  let y2 = document.getElementById('y2').value;
  
  let v2 = new Vector3([parseFloat(x2), parseFloat(y2), 0]);

  drawVector(v1,"red");
  drawVector(v2,"blue");

  let op = document.getElementById('operation-select').value;
  let scalar = document.getElementById('scalar').value;
  let v3 = new Vector3();
  if(op == "add" || op == "sub"){

    if(op == "add"){
      v3 = v1.add(v2);
    }
    else{
      v3 = v1.sub(v2);
    }
    drawVector(v3, "green");
  }
  else if(op == "mul" || op == "div"){
    let v4 = new Vector3();
    if(op == "mul"){
      v3 = v1.mul(scalar);
      v4 = v2.mul(scalar);
    }
    else{
      v3 = v1.div(scalar);
      v4 = v2.div(scalar);
    }
    drawVector(v3, "green");
    drawVector(v4, "green");

  }
  else if(op == "mag"){
    let mag1 = v1.magnitude();
    let mag2 = v2.magnitude();
    console.log("Magnitude v1:", mag1);
    console.log("Magnitude v2:", mag2);
  }
  else if(op == "normal"){
    v1.normalize();
    v2.normalize();
    drawVector(v1, "green");
    drawVector(v2, "green");
  }
  else if(op == "ang"){
    let angle = angleBetween(v1,v2);
    console.log("Angle:", angle);
  }
  else if(op == "area"){
    let area = areaTriangle(v1,v2);
    console.log("Area of the triangle:", area);
  }


}

function angleBetween(v1,v2){
  let d = Vector3.dot(v1,v2);
  let c = d/(v1.magnitude()*v2.magnitude());
  let angleRad = Math.acos(c);
  let angle = angleRad * (180 / Math.PI);
  return angle;
}
function areaTriangle(v1,v2){
  let c = Vector3.cross(v1, v2);
  let c1 = Math.abs(c.elements[0] + c.elements[1] + c.elements[2]);
  c1 = c1/2;
  return c1;
}