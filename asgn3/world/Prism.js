class Prism {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
  }

  render() {
    const rgba = this.color;
    gl.uniform1i(u_whichTexture, -2);   // always solid color
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Front triangle
    drawTriangle3D([0,0,0,  1,0,0,  0.5,1,0]);

    // Back triangle
    gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
    drawTriangle3D([0,0,1,  0.5,1,1,  1,0,1]);

    // Bottom face
    gl.uniform4f(u_FragColor, rgba[0]*.85, rgba[1]*.85, rgba[2]*.85, rgba[3]);
    drawTriangle3D([0,0,0,  1,0,0,  1,0,1]);
    drawTriangle3D([0,0,0,  1,0,1,  0,0,1]);

    // Left face
    gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);
    drawTriangle3D([0,0,0,  0.5,1,0,  0.5,1,1]);
    drawTriangle3D([0,0,0,  0.5,1,1,  0,0,1]);

    // Right face
    gl.uniform4f(u_FragColor, rgba[0]*.75, rgba[1]*.75, rgba[2]*.75, rgba[3]);
    drawTriangle3D([1,0,0,  1,0,1,  0.5,1,1]);
    drawTriangle3D([1,0,0,  0.5,1,1,  0.5,1,0]);
  }
}