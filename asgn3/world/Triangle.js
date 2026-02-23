class Triangle{
    constructor(){
        this.type = 'triangle';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
    }
    render(){
        var xy = this.position;
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle([xy[0], xy[1], xy[0]+0.1, xy[1], xy[0], xy[1]+0.1]);
    }
}


var _posBuffer = null;
var _uvBuffer  = null;

function _ensureBuffers() {
    if (!_posBuffer) _posBuffer = gl.createBuffer();
    if (!_uvBuffer)  _uvBuffer  = gl.createBuffer();
}


function drawTriangle(vertices) {
    _ensureBuffers();
    var n = vertices.length / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, _posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}


function drawTriangle3D(vertices) {
    _ensureBuffers();
    var n = vertices.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, _posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, _uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n * 2), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}


function drawTriangle3DUV(vertices, uv) {
    _ensureBuffers();
    var n = vertices.length / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, _posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, _uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}