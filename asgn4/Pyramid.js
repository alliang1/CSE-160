class Pyramid {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
  }

  render() {
    gl.uniform4f(
      u_FragColor,
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3]
    );

    gl.uniformMatrix4fv(
      u_ModelMatrix,
      false,
      this.matrix.elements
    );

    // APEX
    const ax = 0.5, ay = 1.0, az = 0.5;

    // BASE
    const A = [0, 0, 0];
    const B = [1, 0, 0];
    const C = [1, 0, 1];
    const D = [0, 0, 1];

    // ---- SIDES ----

    // Front
    drawTriangle3D([
      A[0], A[1], A[2],
      B[0], B[1], B[2],
      ax, ay, az
    ]);

    // Right
    drawTriangle3D([
      B[0], B[1], B[2],
      C[0], C[1], C[2],
      ax, ay, az
    ]);

    // Back
    drawTriangle3D([
      C[0], C[1], C[2],
      D[0], D[1], D[2],
      ax, ay, az
    ]);

    // Left
    drawTriangle3D([
      D[0], D[1], D[2],
      A[0], A[1], A[2],
      ax, ay, az
    ]);

    // ---- BOTTOM (2 triangles) ----
    drawTriangle3D([
      A[0], A[1], A[2],
      B[0], B[1], B[2],
      C[0], C[1], C[2]
    ]);

    drawTriangle3D([
      A[0], A[1], A[2],
      C[0], C[1], C[2],
      D[0], D[1], D[2]
    ]);
  }
}
