class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([0, 0, 5]);
    this.at  = new Vector3([0, 0, 0]);
    this.up  = new Vector3([0, 1, 0]);
    this.speed = 0.2;
  }

  // Move forward (toward at)
  moveForward() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(this.speed);
    this.eye.add(f);
    this.at.add(f);
  }

  // Move backwards (away from at)
  moveBackwards() {
    let b = new Vector3(this.eye.elements);
    b.sub(this.at);
    b.normalize();
    b.mul(this.speed);
    this.eye.add(b);
    this.at.add(b);
  }

  // Move left 
  moveLeft() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
  }

  // Move right 
  moveRight() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
  }

  // Pan left (rotate camera left around up axis)
  panLeft(alpha) {
    alpha = alpha || 5;
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let rotMat = new Matrix4();
    rotMat.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    let f_prime = rotMat.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
  }

  // Pan right (rotate camera right around up axis)
  panRight(alpha) {
    alpha = alpha || 5;
    this.panLeft(-alpha);
  }

  // Pan up/down (rotate around side axis)
  panUpDown(delta) {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let s = Vector3.cross(f, this.up);
    s.normalize();
    let rotMat = new Matrix4();
    rotMat.setRotate(delta, s.elements[0], s.elements[1], s.elements[2]);
    let f_prime = rotMat.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
  }
}