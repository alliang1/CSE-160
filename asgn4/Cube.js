class Cube {
    constructor(){
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -1;
    }

    render(){
        var rgba = this.color;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Normal matrix
        var normalMat = new Matrix4(this.matrix).invert().transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);

        // Each face has a constant normal
        this._drawFace([0,0,0, 1,0,0, 1,1,0, 0,1,0],  [0, 0,-1]); // Front
        this._drawFace([0,0,1, 0,1,1, 1,1,1, 1,0,1],  [0, 0, 1]); // Back
        this._drawFace([0,0,0, 0,1,0, 0,1,1, 0,0,1],  [-1,0, 0]); // Left
        this._drawFace([1,0,0, 1,0,1, 1,1,1, 1,1,0],  [ 1,0, 0]); // Right
        this._drawFace([0,0,0, 1,0,0, 1,0,1, 0,0,1],  [0,-1, 0]); // Bottom
        this._drawFace([0,1,0, 0,1,1, 1,1,1, 1,1,0],  [0, 1, 0]); // Top
    }

    _drawFace(v, n){
        // Two triangles from a quad (v has 4 corners, each xyz)
        var verts = [
            v[0],v[1],v[2],  v[3],v[4],v[5],  v[6],v[7],v[8],
            v[0],v[1],v[2],  v[6],v[7],v[8],  v[9],v[10],v[11]
        ];
        var norms = [
            n[0],n[1],n[2],  n[0],n[1],n[2],  n[0],n[1],n[2],
            n[0],n[1],n[2],  n[0],n[1],n[2],  n[0],n[1],n[2]
        ];
        drawTriangle3DWithNormals(verts, norms);
    }
}
