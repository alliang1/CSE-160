class Prism {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
  }

  render() {
    const rgba = this.color;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // ---- FRONT TRIANGLE ----
    drawTriangle3D([
      0, 0, 0,
      1, 0, 0,
      0.5, 1, 0
    ]);

    // ---- BACK TRIANGLE ----
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
    drawTriangle3D([
      0, 0, 1,
      0.5, 1, 1,
      1, 0, 1
    ]);

    // ---- BOTTOM FACE ----
    gl.uniform4f(u_FragColor, rgba[0]*0.85, rgba[1]*0.85, rgba[2]*0.85, rgba[3]);
    drawTriangle3D([
      0, 0, 0,
      1, 0, 0,
      1, 0, 1
    ]);
    drawTriangle3D([
      0, 0, 0,
      1, 0, 1,
      0, 0, 1
    ]);

    // ---- LEFT FACE ----
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3D([
      0, 0, 0,
      0.5, 1, 0,
      0.5, 1, 1
    ]);
    drawTriangle3D([
      0, 0, 0,
      0.5, 1, 1,
      0, 0, 1
    ]);

    // ---- RIGHT FACE ----
    gl.uniform4f(u_FragColor, rgba[0]*0.75, rgba[1]*0.75, rgba[2]*0.75, rgba[3]);
    drawTriangle3D([
      1, 0, 0,
      1, 0, 1,
      0.5, 1, 1
    ]);
    drawTriangle3D([
      1, 0, 0,
      0.5, 1, 1,
      0.5, 1, 0
    ]);
  }
}
