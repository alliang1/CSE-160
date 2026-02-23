class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = 0;
    }

    render() {
        const rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Front of cube
        drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

        gl.uniform1i(u_whichTexture, -2);

        // Back of cube
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
        drawTriangle3DUV([0,0,1, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

        // Top of cube
        gl.uniform4f(u_FragColor, rgba[0]*.95, rgba[1]*.95, rgba[2]*.95, rgba[3]);
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);

        // Bottom of cube
        gl.uniform4f(u_FragColor, rgba[0]*.85, rgba[1]*.85, rgba[2]*.85, rgba[3]);
        drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]);

        // Left of cube
        gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);
        drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [0,0, 1,0, 1,1]);
        drawTriangle3DUV([0,0,0, 0,1,1, 0,1,0], [0,0, 1,1, 0,1]);

        // Right of cube
        drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1]);
    }
    renderfast() {
        const rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        const verts = [
            // Front of cube
            0,0,0,  1,0,0,  1,1,0,
            0,0,0,  1,1,0,  0,1,0,
            // Back oc cube
            1,0,1,  0,0,1,  0,1,1,
            1,0,1,  0,1,1,  1,1,1,
            // Top of cube
            0,1,0,  1,1,0,  1,1,1,
            0,1,0,  1,1,1,  0,1,1,
            // Bottom of cube
            0,0,1,  1,0,1,  1,0,0,
            0,0,1,  1,0,0,  0,0,0,
            // Left of cube
            0,0,1,  0,0,0,  0,1,0,
            0,0,1,  0,1,0,  0,1,1,
            // Right of cube
            1,0,0,  1,0,1,  1,1,1,
            1,0,0,  1,1,1,  1,1,0,
        ];

        // UV coords
        const uvs = [
            // Front
            0,0,  1,0,  1,1,
            0,0,  1,1,  0,1,
            // Back
            0,0,  1,0,  1,1,
            0,0,  1,1,  0,1,
            // Top
            0,0,  1,0,  1,1,
            0,0,  1,1,  0,1,
            // Bottom
            0,0,  1,0,  1,1,
            0,0,  1,1,  0,1,
            // Left
            0,0,  1,0,  1,1,
            0,0,  1,1,  0,1,
            // Right
            0,0,  1,0,  1,1,
            0,0,  1,1,  0,1,
        ];

        drawTriangle3DUV(verts, uvs);
    }
}