class Sphere {
  constructor(segments = 12, rings = 12) {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.segments = segments;
    this.rings = rings;
  }

  render() {
    const rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    for (let i = 0; i < this.rings; i++) {
      let theta1 = i * Math.PI / this.rings;
      let theta2 = (i + 1) * Math.PI / this.rings;

      for (let j = 0; j < this.segments; j++) {
        let phi1 = j * 2 * Math.PI / this.segments;
        let phi2 = (j + 1) * 2 * Math.PI / this.segments;

        // Four points on the sphere
        let p1 = this.sph(theta1, phi1);
        let p2 = this.sph(theta2, phi1);
        let p3 = this.sph(theta2, phi2);
        let p4 = this.sph(theta1, phi2);

        // Two triangles per quad
        drawTriangle3D([...p1, ...p2, ...p3]);
        drawTriangle3D([...p1, ...p3, ...p4]);
      }
    }
  }

  // spherical → cartesian
  sph(theta, phi) {
    return [
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi)
    ];
  }
}
