import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';


// ─── RENDERER ────────────────────────────────────────────────────────────────
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── CSS3D RENDERER ──────────────────────────────────────────────────────────
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('css3d-container').appendChild(cssRenderer.domElement);

// ─── SCENE ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0015, 20, 60);

// ─── CAMERA ──────────────────────────────────────────────────────────────────
// Far plane set to 200 so the skybox (behind far clip) is always visible
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(6, 5, 9);

// ─── ORBIT CONTROLS ──────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.1;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2 + 0.1;
controls.update();

controls.mouseButtons = {
  LEFT:   THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT:  THREE.MOUSE.ROTATE,
};


// ═══════════════════════════════════════════════════════════════════════════
//  SKYBOX  —  Procedural Cubemap (no image files needed)
//
//  A cubemap is 6 square textures mapped to the inside of a cube.
//  Three.js uses it as scene.background, drawing it behind everything.
//  The 6 faces are ordered: +X, -X, +Y, -Y, +Z, -Z
//                         = right, left, top, bottom, front, back
//
//  We procedurally draw each face with the Canvas 2D API:
//    1. A dark purple-to-black space gradient
//    2. Soft nebula glow blobs (radial gradients layered on top)
//    3. ~220 randomised stars per face (dots with size/brightness variation)
//
//  A seeded LCG (Linear Congruential Generator) keeps star positions
//  deterministic across reloads and unique per face.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Draws one 512x512 skybox face onto an HTML canvas.
 * @param {string} gradTop    CSS color at top of the background gradient
 * @param {string} gradBottom CSS color at bottom of the background gradient
 * @param {number} seed       Seed for the deterministic star generator
 * @returns {HTMLCanvasElement}
 */
function makeSkyFace(gradTop, gradBottom, seed) {
  const SIZE = 512;
  const cv   = document.createElement('canvas');
  cv.width   = SIZE;
  cv.height  = SIZE;
  const ctx  = cv.getContext('2d');

  // 1. Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, gradTop);
  grad.addColorStop(1, gradBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 2. Nebula blobs — soft radial gradients for an atmospheric haze
  const nebulas = [
    { x: SIZE * 0.30, y: SIZE * 0.40, r: SIZE * 0.35, color: 'rgba(120,0,200,0.13)' },
    { x: SIZE * 0.72, y: SIZE * 0.55, r: SIZE * 0.30, color: 'rgba(0,60,200,0.10)'  },
    { x: SIZE * 0.50, y: SIZE * 0.20, r: SIZE * 0.28, color: 'rgba(200,0,120,0.09)' },
    { x: SIZE * 0.15, y: SIZE * 0.75, r: SIZE * 0.22, color: 'rgba(80,0,180,0.08)'  },
  ];
  for (const n of nebulas) {
    const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    ng.addColorStop(0, n.color);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // 3. Stars — LCG pseudo-random number generator seeded per face
  //    Formula: s = (s * 1664525 + 1013904223) mod 2^32
  let s = seed >>> 0;
  function rand() {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0xffffffff;
  }

  for (let i = 0; i < 220; i++) {
    const x      = rand() * SIZE;
    const y      = rand() * SIZE;
    const radius = rand() * 1.3 + 0.25;
    const alpha  = rand() * 0.65 + 0.35;

    // Tinted stars: mostly white, some blue-white / pink / teal
    const tint = rand();
    let col;
    if      (tint < 0.12) col = `rgba(160,160,255,${alpha.toFixed(2)})`;
    else if (tint < 0.20) col = `rgba(255,160,255,${alpha.toFixed(2)})`;
    else if (tint < 0.26) col = `rgba(160,255,255,${alpha.toFixed(2)})`;
    else                  col = `rgba(255,255,255,${alpha.toFixed(2)})`;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  }

  return cv;
}

// Generate all 6 faces with subtle gradient and seed variation per face
const skyCanvases = [
  makeSkyFace('#0a001f', '#120035', 111),  // +X right
  makeSkyFace('#08001a', '#0e002e', 222),  // -X left
  makeSkyFace('#04000e', '#08001e', 333),  // +Y top   (darkest)
  makeSkyFace('#10002a', '#1a0040', 444),  // -Y bottom
  makeSkyFace('#0c0022', '#160036', 555),  // +Z front
  makeSkyFace('#09001a', '#110030', 666),  // -Z back
];

// THREE.CubeTexture accepts an array of 6 Image/Canvas elements.
// needsUpdate = true tells Three.js to upload the pixel data to the GPU.
const skyboxTexture = new THREE.CubeTexture(skyCanvases);
skyboxTexture.needsUpdate = true;
scene.background = skyboxTexture;  // renders as the background behind all geometry


// ═══════════════════════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURE HELPERS  (Canvas 2D — no image files needed)
// ═══════════════════════════════════════════════════════════════════════════

function makeColorTexture(hex, gridHex = null, gridSize = 8) {
  const SIZE = 128;
  const cv   = document.createElement('canvas');
  cv.width   = SIZE; cv.height = SIZE;
  const ctx  = cv.getContext('2d');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, SIZE, SIZE);
  if (gridHex) {
    ctx.strokeStyle = gridHex;
    ctx.lineWidth   = 1;
    for (let i = 0; i < SIZE; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(i, 0);    ctx.lineTo(i, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i);    ctx.lineTo(SIZE, i); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCheckerTexture(col1, col2) {
  const SIZE     = 128;
  const cv       = document.createElement('canvas');
  cv.width       = SIZE; cv.height = SIZE;
  const ctx      = cv.getContext('2d');
  const tileSize = SIZE / 8;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? col1 : col2;
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── TEXTURES ────────────────────────────────────────────────────────────────
const floorTex   = makeCheckerTexture('#110022', '#1a0035');
floorTex.repeat.set(8, 8);
const wallTex    = makeColorTexture('#0d001a', '#1a0033', 32);
wallTex.repeat.set(4, 2);
const deskTex    = makeColorTexture('#1a0a2e', '#2a1050', 16);
const screenTex  = makeColorTexture('#00ffcc');
const lightTex  = makeColorTexture('#ffffff');
const screenTex2 = makeColorTexture('#ff44aa');
const screenTex3 = makeColorTexture('#262626');

// ─── MATERIALS ───────────────────────────────────────────────────────────────
const matFloor = new THREE.MeshStandardMaterial({ map: floorTex,   roughness: 0.8, metalness: 0.1 });
const matWall = new THREE.MeshStandardMaterial({ map: wallTex,    roughness: 0.9, metalness: 0.0 });
const matDesk = new THREE.MeshStandardMaterial({ color: 0xFFFFFF ,    roughness: 0.8, metalness: 0.3 });
const matScreen1 = new THREE.MeshStandardMaterial({ map: screenTex,  emissive: new THREE.Color(0x00ffcc), emissiveIntensity: 0.8, roughness: 0.2 });
const matScreen2 = new THREE.MeshStandardMaterial({ map: screenTex2, emissive: new THREE.Color(0xff44aa), emissiveIntensity: 0.8, roughness: 0.2 });
const matScreen3 = new THREE.MeshStandardMaterial({ map: screenTex3,  emissive: new THREE.Color(0x8b8b8c), emissiveIntensity: 0.8, roughness: 0.2 });
const matNeonPurple = new THREE.MeshStandardMaterial({ color: 0xaa44ff, emissive: new THREE.Color(0x9900ff), emissiveIntensity: 1.5, roughness: 0.3 });
const matNeonBlue = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: new THREE.Color(0x0088ff), emissiveIntensity: 1.5, roughness: 0.3 });
const matChair = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.2 });
const matChairAccent = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: new THREE.Color(0x00ffcc), emissiveIntensity: 0.5 });
const matMetal = new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.3, metalness: 0.8 });
const matDiamond = new THREE.MeshStandardMaterial({ color: 0xaa44ff, emissive: new THREE.Color(0x6600cc), emissiveIntensity: 0.8, roughness: 0.2 });
const matGlass = new THREE.MeshStandardMaterial({ color: 0xA9A9A9, roughness: 0, metalness: 0, transparent: true, opacity: 0.7 });
const matLight = new THREE.MeshStandardMaterial({ map: lightTex,  emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.8, roughness: 0.2 });

// ─── COUCH TEXTURE ───────────────────────────────────────────────────────────
// TextureLoader loads an image file and converts it into a Three.js texture.
// The image must be in the same folder as index.html.
// Must be served via Live Server — won't work with file:// directly.

const textureLoader = new THREE.TextureLoader();

const couchTexture = textureLoader.load('./textures/couchMaterial.jpg');

// Optional tweaks — try these if the texture looks stretched or tiled weird
couchTexture.wrapS = THREE.RepeatWrapping;  // tile horizontally
couchTexture.wrapT = THREE.RepeatWrapping; // tile vertically
couchTexture.repeat.set(2, 1); // repeat 2x wide, 1x tall
// set both to 1 for one full image across

// Now create the material using the texture as the 'map'
// 'map' is the base color/diffuse texture slot
const matCouch = new THREE.MeshStandardMaterial({
  map: couchTexture,
  roughness: 0.9,
  metalness: 0.0,
});

// ─── MESH HELPER ─────────────────────────────────────────────────────────────
function makeMesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow    = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ROOM GEOMETRY
// ═══════════════════════════════════════════════════════════════════════════

// Floor & walls (PlaneGeometry = flat rectangle, rotated/positioned into place)
const floor = makeMesh(new THREE.PlaneGeometry(14, 12), matFloor);
floor.rotation.x = -Math.PI / 2;
const backWall  = makeMesh(new THREE.PlaneGeometry(14, 8), matWall, 0, 4, -6);
const leftWall  = makeMesh(new THREE.PlaneGeometry(12, 8), matWall, -7, 4, 0);
leftWall.rotation.y  =  Math.PI / 2;
const rightWall = makeMesh(new THREE.PlaneGeometry(12, 8), matWall, 7, 4, 0);
rightWall.rotation.y = -Math.PI / 2;
const ceiling   = makeMesh(new THREE.PlaneGeometry(14, 12), matWall, 0, 8, 0);
ceiling.rotation.x   =  Math.PI / 2;

// Neon floor strip lights
makeMesh(new THREE.BoxGeometry(13.5, 0.05, 0.08), matNeonPurple,  0,   0.025, -5.9);
makeMesh(new THREE.BoxGeometry(13.5, 0.05, 0.08), matNeonPurple,  0,   0.025,  5.9);
makeMesh(new THREE.BoxGeometry(0.08, 0.05, 11.5), matNeonPurple, -6.9, 0.025,  0  );
makeMesh(new THREE.BoxGeometry(0.08, 0.05, 11.5), matNeonPurple,  6.9, 0.025,  0  );

// L-shaped desk
makeMesh(new THREE.BoxGeometry(5,   0.12, 1.7), matDesk, -1,   1.5, -4.2 );
makeMesh(new THREE.BoxGeometry(1.4, 0.12, 3), matDesk,  1.7, 1.5, -3.55);
const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
makeMesh(legGeo, matDesk, -3.3, 0.75, -3.5);
makeMesh(legGeo, matDesk, -3.3, 0.75, -4.9);
//makeMesh(legGeo, matDesk,  1.2, 0.75, -3.5);
//makeMesh(legGeo, matDesk,  0.6, 0.75, -4.9);
//L side of leg
makeMesh(legGeo, matDesk, 2.2, 0.75, -4.6);
makeMesh(legGeo, matDesk,  2.2, 0.75, -2.4);
makeMesh(legGeo, matDesk,  1.2, 0.75, -2.4);

makeMesh(new THREE.BoxGeometry(5, 0.04, 0.04), matNeonPurple, -1, 1.44, -3.45);

// Monitors (stand + base + screen)
const monStandGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
const monBaseGeo  = new THREE.BoxGeometry(0.5, 0.04, 0.3);
//Center monitor
makeMesh(monStandGeo, matMetal, -1, 1.82, -5); 
makeMesh(monBaseGeo,  matMetal, -1, 1.62, -4.9);
makeMesh(new THREE.BoxGeometry(2.2, 1.2, 0.06), matScreen1, -1, 2.4, -4.95);
makeMesh(new THREE.BoxGeometry(2.2, 1.2, 0.06), matMetal, -1, 2.4, -5);
//Left monitor
makeMesh(monStandGeo, matMetal, -3, 1.82, -5);
makeMesh(monBaseGeo,  matMetal, -3, 1.62, -4.9);
const monLeft = makeMesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), matScreen2, -3, 2.35, -4.95);
monLeft.rotation.y = 0.25;
const monLeftB = makeMesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), matMetal, -3, 2.35, -5);
monLeftB.rotation.y = 0.25;
//Right monitor
makeMesh(monStandGeo, matMetal, 1, 1.82, -5);
makeMesh(monBaseGeo,  matMetal, 1, 1.62, -4.9);
const monRight = makeMesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), matScreen1, 1, 2.35, -4.95);
monRight.rotation.y = -0.25;
const monRightB = makeMesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), matMetal, 1, 2.35, -5);
monRightB.rotation.y = -0.25;

// Keyboard & mouse
makeMesh(new THREE.BoxGeometry(0.9, 0.04, 0.3), matMetal, -1,   1.56, -3.9);
makeMesh(new THREE.SphereGeometry(0.1, 8, 8),  matNeonPurple, 0.2, 1.57, -3.9);

// Gaming chair

//the seat
makeMesh(new THREE.BoxGeometry(0.9, 0.12, 0.85), matChair, 0, 1.0, -1.5);
//the backrest
makeMesh(new THREE.BoxGeometry(0.9, 1.52,  0.12), matChair, 0, 1.7, -1.9);
makeMesh(new THREE.BoxGeometry(0.1, 1.1,  0.02), matChairAccent, 0, 1.72, -1.83);
//armrest
makeMesh(new THREE.BoxGeometry(0.13, 0.09, 0.6),  matMetal, -0.5, 1.45, -1.5);
makeMesh(new THREE.BoxGeometry(0.05, 0.5, 0.15),  matMetal, -0.47, 1.2, -1.5);

makeMesh(new THREE.BoxGeometry(0.13, 0.09, 0.6),  matMetal, 0.5, 1.45, -1.5);
makeMesh(new THREE.BoxGeometry(0.05, 0.5, 0.15),  matMetal, 0.47, 1.2, -1.5);
//legs
const LEG_RADIUS  = 0.42;   
const LEG_COUNT = 5;
const CHAIR_X = 0;      
const CHAIR_Y = 0.15;   
const CHAIR_Z = -1.5;
// Central cylinder that the legs radiate from
makeMesh(
  new THREE.CylinderGeometry(0.06, 0.08, 0.06, 12),
  matMetal,
  CHAIR_X, CHAIR_Y, CHAIR_Z
);

for (let i = 0; i < LEG_COUNT; i++) {
  const angle = (i / LEG_COUNT) * Math.PI * 2;  // 0, 72°, 144°, 216°, 288° in radians

  // Tip of the leg (the far end)
  const tipX = CHAIR_X + Math.cos(angle) * LEG_RADIUS;
  const tipZ = CHAIR_Z + Math.sin(angle) * LEG_RADIUS;

  // Midpoint between center and tip 
  const midX = CHAIR_X + Math.cos(angle) * (LEG_RADIUS / 2);
  const midZ = CHAIR_Z + Math.sin(angle) * (LEG_RADIUS / 2);

  // The leg 
  const leg = makeMesh(
    new THREE.BoxGeometry(LEG_RADIUS, 0.04, 0.055),
    matMetal,
    midX, CHAIR_Y, midZ
  );

  leg.rotation.y = -Math.atan2(tipZ - CHAIR_Z, tipX - CHAIR_X);
}

//that long thingy that holds the chair
makeMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.81, 8), matMetal, 0, 0.6, -1.5);

//wheels
for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2;
  makeMesh(new THREE.SphereGeometry(0.07, 8, 6), matMetal,
    Math.cos(a) * 0.38, 0.07, -1.5 + Math.sin(a) * 0.38);
}

// PC tower
makeMesh(new THREE.BoxGeometry(0.45, 1.1, 0.55), matMetal,    2,  2.11, -4.0);
makeMesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), matNeonBlue, 1.76, 2.11, -4.0);
makeMesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), matNeonPurple, 2, 2.25,  -3.7);
makeMesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), matNeonPurple, 2, 1.9,  -3.7);

// Wall shelves
const shelfGeo = new THREE.BoxGeometry(4, 0.06, 0.3);
makeMesh(shelfGeo, matDesk, -1, 4.5, -5.85);
makeMesh(shelfGeo, matDesk, -1, 5.8, -5.85);

//Couch
//seat
makeMesh(new THREE.BoxGeometry(1, 0.4, 3.5), matCouch,  6, 0.8, 2);  
makeMesh(new THREE.BoxGeometry(1.05, 0.55, 3.55), matCouch,  6, 0.35, 2); 
//back rest
makeMesh(new THREE.BoxGeometry(0.3, 2, 3.69), matCouch,  6.67, 1.01, 2);
//left arm
makeMesh(new THREE.BoxGeometry(1.05, 1.4, 0.3), matCouch, 6, 0.71, 0.3);
//right arm
makeMesh(new THREE.BoxGeometry(1.05, 1.4, 0.3), matCouch,  6, 0.71, 3.7);


// Coffee table
const coffeeTable1 = makeMesh(new THREE.BoxGeometry(0.15, 1, 0.1), matMetal,  4, 0.3, 2);
coffeeTable1.rotation.x = - Math.PI / 3;

const coffeeTable2 = makeMesh(new THREE.BoxGeometry(0.15, 1, 0.1), matMetal,  4, 0.3, 2);
coffeeTable2.rotation.x = Math.PI / 3;

const coffeeTable3 = makeMesh(new THREE.CylinderGeometry(1, 1, 0.06, 64), matGlass,  4, 0.6, 2);
coffeeTable3.scale.set(0.5, 1, 1);


// ─── TV REMOTE — sits on coffee table, click to toggle TV ────────────────────
const matRemote    = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.6, metalness: 0.3 });
const matRemoteBtn = new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: new THREE.Color(0x00ff44), emissiveIntensity: 1.2, roughness: 0.3 });

const remoteBody = makeMesh(new THREE.BoxGeometry(0.12, 0.03, 0.28), matRemote, 4.2, 0.64, 1.7);
const remoteBtn  = makeMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16), matRemoteBtn, 4.2, 0.658, 1.62);
makeMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8), matMetal, 4.2,  0.658, 1.75);
makeMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8), matMetal, 4.16, 0.658, 1.75);
makeMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8), matMetal, 4.24, 0.658, 1.75);

//TV Table
//Bottom shelf
makeMesh(new THREE.BoxGeometry(0.7, 0.1, 4.5), matDesk,  -6.67, 1, 2);
//Top shelf
makeMesh(new THREE.BoxGeometry(0.7, 0.1, 4.5), matDesk,  -6.67, 1.7, 2);
//back shelf
makeMesh(new THREE.BoxGeometry(0.1, 0.7, 4.5), matDesk,  -6.97, 1.3, 2);
//left shelf
makeMesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), matDesk,  -6.67, 1.3, 4.2);
makeMesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), matDesk,  -6.67, 1.3, 3);
//right shelf
makeMesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), matDesk,  -6.67, 1.3, -0.2);
makeMesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), matDesk,  -6.67, 1.3, 1);

makeMesh(new THREE.BoxGeometry(0.09, 0.68, 1.2), matGlass,  -6.37, 1.38, 3.6);
makeMesh(new THREE.BoxGeometry(0.03, 0.05, 0.3), matMetal,  -6.32, 1.36, 3.6);

makeMesh(new THREE.BoxGeometry(0.09, 0.68, 1.2), matGlass,  -6.37, 1.38, 0.4);
makeMesh(new THREE.BoxGeometry(0.03, 0.05, 0.3), matMetal,  -6.32, 1.36, 0.4);
//light
makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 64), matLight,  -6.67, 1.60, 2);

//TV
const tvMesh = makeMesh(new THREE.BoxGeometry(0.1, 2.3, 4.3), matScreen3,  -6.97, 3, 2);
makeMesh(new THREE.BoxGeometry(0.1, 2.6, 4.5), matMetal,  -6.99, 3, 2);

//Speaker
makeMesh(new THREE.BoxGeometry(0.6, 2.5, 0.6), matMetal,  -6.68, 2.3, 4.8);
makeMesh(new THREE.BoxGeometry(0.6, 2.5, 0.6), matMetal,  -6.68, 2.3, -0.8);

// Light for the TV stand 
const tvGlow = new THREE.PointLight(0xffffff, 2, 8);
tvGlow.position.set(-5, 3, 2);  // above and in front of the TV stand
scene.add(tvGlow);

// Shelf decorations
const collectColors = [0xff4488, 0x44ffaa, 0xffaa00, 0x4488ff, 0xff8800];
for (let i = 0; i < 5; i++) {
  const m = new THREE.MeshStandardMaterial({ color: collectColors[i], emissive: new THREE.Color(collectColors[i]), emissiveIntensity: 0.3 });
  makeMesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), m, -2.8 + i * 0.65, 4.66, -5.82);
}
for (let i = 0; i < 4; i++) {
  const m = new THREE.MeshStandardMaterial({ color: collectColors[i], emissive: new THREE.Color(collectColors[i]), emissiveIntensity: 0.4 });
  makeMesh(new THREE.SphereGeometry(0.1, 12, 8), m, -2.4 + i * 0.7, 5.92, -5.82);
}
makeMesh(new THREE.CylinderGeometry(0.07, 0.09, 0.28, 12), matNeonPurple, 0.5, 4.66, -5.82);
makeMesh(new THREE.CylinderGeometry(0.07, 0.09, 0.28, 12), matNeonBlue,   0.9, 4.66, -5.82);

// Floating diamond decorations (animated in the loop below)
const diamondGeo = new THREE.OctahedronGeometry(0.2);
for (let i = 0; i < 6; i++) {
  const d = makeMesh(diamondGeo, matDiamond, -3.5 + i * 1.2, 0.2, -4);
  d.userData.floatOffset = i * 0.8;  // stagger phase for the bobbing animation
}

// // Wall posters
// [[0x0033aa, -5.8, 3, -2], [0x440066, -5.8, 3, 1]].forEach(([col, x, y, z]) => {
//   const m = new THREE.MeshStandardMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: 0.15 });
//   const p = makeMesh(new THREE.BoxGeometry(0.8, 1.1, 0.04), m, x, y, z);
//   p.rotation.y = Math.PI / 2;
// });


// ═══════════════════════════════════════════════════════════════════════════
//  GLTF 3D MODEL LOADER
//
//  GLTFLoader loads .glb / .gltf — the modern web-standard 3D format.
//
//  We load the official Three.js "Soldier" demo model:
//    - Fully rigged and animated humanoid figure
//    - Hosted on the Three.js CDN — no CORS issues
//    - Has 4 animation clips: Idle, Walk, Run, TPose
//
//  ── How to swap in your own model ────────────────────────────────────────
//    1. Download a .glb from https://poly.pizza or https://sketchfab.com
//    2. Copy it into the same folder as index.html and main.js
//    3. Change MODEL_URL to just the filename:  './your_model.glb'
//       (must be served via a local server — see README note about file:// URLs)
//    4. Adjust model.scale and model.position to fit your scene
//
//  ── What gltfLoader.load() returns ───────────────────────────────────────
//    The onLoad callback receives a 'gltf' object:
//      gltf.scene      — THREE.Group containing all meshes (add this to scene)
//      gltf.animations — array of THREE.AnimationClip objects
//      gltf.cameras    — cameras baked into the file (usually empty)
//      gltf.asset      — metadata (version, generator string, etc.)
// ═══════════════════════════════════════════════════════════════════════════


const loadingEl = document.getElementById('loading');

// gltfMixer is assigned once the model loads so animate() can call update()
let gltfMixer = null;

const gltfLoader = new GLTFLoader();



const MODEL_URL = 'https://threejs.org/examples/models/gltf/Soldier.glb';
//const MODEL_URL = 'https://threejs.org/examples/models/gltf/duck.glb';

gltfLoader.load(
  MODEL_URL,

  // ── onLoad ───────────────────────────────────────────────────────────────
  (gltf) => {
    const model = gltf.scene;  // the root THREE.Group of the loaded model

    // Fit the model onto the right wing of the L-shaped desk
    model.scale.set(0.55, 0.55, 0.55);
    model.position.set(-2, 1.56, -3.8);
    model.rotation.y = -Math.PI * 0.6;  // face diagonally into the room

    // model.traverse() walks the entire node hierarchy recursively.
    // We use it to: (a) enable shadows on every mesh, and
    //               (b) add a purple emissive tint that fits the room aesthetic.
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow    = true;
        node.receiveShadow = true;
        // Clone the material so we only affect this instance, not a shared one
        node.material = node.material.clone();
        node.material.emissive         = new THREE.Color(0x220044);
        node.material.emissiveIntensity = 0.4;
      }
    });

    scene.add(model);

    // ── Play the model's first animation ────────────────────────────────
    // AnimationMixer drives clips on a specific object.
    // mixer.update(delta) must be called each frame (see animate loop below).
    if (gltf.animations && gltf.animations.length > 0) {
      gltfMixer = new THREE.AnimationMixer(model);

      // Log animation names — useful when picking a specific clip by name
      console.log('Animations found:', gltf.animations.map(a => a.name));

      // clipAction() creates a playable action from a clip.
      // gltf.animations[0] is "Idle" for Soldier.glb.
      // Swap to a different index or use:
      //   THREE.AnimationClip.findByName(gltf.animations, 'Walk')
      const action = gltfMixer.clipAction(gltf.animations[0]);
      action.play();
    }

    if (loadingEl) loadingEl.style.display = 'none';
    console.log('GLTF model loaded');
  },

  // ── onProgress ───────────────────────────────────────────────────────────
  (xhr) => {
    if (xhr.lengthComputable && loadingEl) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      loadingEl.textContent = `Loading 3D model… ${pct}%`;
    }
  },

  // ── onError ──────────────────────────────────────────────────────────────
  (error) => {
    console.error('GLTF load error:', error);
    if (loadingEl) loadingEl.textContent = 'Model failed — see console';
    // Room is fully functional without the model; only the figure is missing
  }
);


// ═══════════════════════════════════════════════════════════════════════════
//  LIGHTS
// ═══════════════════════════════════════════════════════════════════════════

// 1. AmbientLight — flat fill light, no direction, no shadows
const ambientLight = new THREE.AmbientLight(0x110022, 0.8);
scene.add(ambientLight);

// 2. HemisphereLight(skyColor, groundColor, intensity)
//    Surfaces facing up get skyColor, surfaces facing down get groundColor
const hemiLight = new THREE.HemisphereLight(0x0044ff, 0x440088, 0.6);
scene.add(hemiLight);

// 3. DirectionalLight — infinite parallel rays (like sunlight), casts shadows
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(2, 8, 2);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near   = 0.5;
dirLight.shadow.camera.far    = 30;
dirLight.shadow.camera.left   = -10;
dirLight.shadow.camera.right  =  10;
dirLight.shadow.camera.top    =  10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// 4. PointLight — purple neon underglow along the floor
const floorGlow = new THREE.PointLight(0xaa00ff, 3, 12);
floorGlow.position.set(0, 0.5, -2);
scene.add(floorGlow);

// 5. PointLight — teal glow from the monitor bank
const monitorGlow = new THREE.PointLight(0x00ffcc, 2, 5);
monitorGlow.position.set(-1, 2.5, -4.2);
scene.add(monitorGlow);

// 6. SpotLight(color, intensity, distance, angle, penumbra)
//    Cone of light with soft edges aimed at the desk
const spotLight = new THREE.SpotLight(0xcc88ff, 3, 10, Math.PI / 6, 0.4);
spotLight.position.set(-1, 7, -3);
spotLight.target.position.set(-1, 1.5, -4.5);
spotLight.castShadow = true;
scene.add(spotLight);
scene.add(spotLight.target);  // target must be added to the scene separately

// 7. PointLight — hot pink accent on the right side
const pinkGlow = new THREE.PointLight(0xff44aa, 1.5, 6);
pinkGlow.position.set(4, 2, -4);
scene.add(pinkGlow);


// ═══════════════════════════════════════════════════════════════════════════
//  RESIZE HANDLER
// ═══════════════════════════════════════════════════════════════════════════
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();  // must call after changing any camera property
});


// ═══════════════════════════════════════════════════════════════════════════
//  ANIMATION LOOP
//
//  requestAnimationFrame(fn) schedules fn before the next screen repaint
//  (~60fps). The browser passes the current timestamp in milliseconds.
//
//  THREE.Clock.getDelta() returns seconds since last call — we need this to
//  advance AnimationMixer at the correct speed regardless of frame rate.
// ═══════════════════════════════════════════════════════════════════════════
const clock = new THREE.Clock();

function animate(time) {
  requestAnimationFrame(animate);

  const t     = time * 0.001;     // total elapsed seconds
  const delta = clock.getDelta(); // seconds since the previous frame

  // Advance GLTF animation — without this the model would be frozen on frame 0
  if (gltfMixer) gltfMixer.update(delta);

  // Float and spin the diamond decorations
  scene.children.forEach(child => {
    if (child.geometry instanceof THREE.OctahedronGeometry) {
      child.rotation.y = t * 1.2 + child.userData.floatOffset;
      child.rotation.x = t * 0.7;
      child.position.y = 0.2 + Math.sin(t * 2 + child.userData.floatOffset) * 0.07;
    }
  });

  // Pulse the neon lights and screen glow
  floorGlow.intensity          = 2.5 + Math.sin(t * 1.5)        * 0.8;
  monitorGlow.intensity        = 1.8 + Math.sin(t * 2.3 + 1.0)  * 0.5;
  matScreen1.emissiveIntensity = 0.6 + Math.abs(Math.sin(t * 0.4)) * 0.4;

  controls.update();  // required every frame when enableDamping = true
  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);

  
}


animate(0);


// ─── REMOTE RAYCASTER — click remote to toggle TV ────────────────────────────
const raycaster  = new THREE.Raycaster();
const pointer    = new THREE.Vector2();
let   tvOn       = true;

function onPointerClick(event) {
  // Normalise mouse coords to -1..+1
  pointer.x =  (event.clientX / window.innerWidth)  * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([remoteBody, remoteBtn]);

  if (hits.length > 0) {
    tvOn = !tvOn;

    // Toggle the CSS3D 
    browserDiv.style.opacity = tvOn ? '1' : '0';

    // Toggle the WebGL TV screen glow
    tvMesh.material.emissiveIntensity = tvOn ? 0.8 : 0;
    tvMesh.material.color.set(tvOn ? 0x8b8b8c : 0x000000);

    // Pulse the power button red/green as feedback
    remoteBtn.material.color.set(tvOn ? 0x00ff44 : 0xff2200);
    remoteBtn.material.emissive.set(tvOn ? 0x00ff44 : 0xff2200);
  }
}

window.addEventListener('click', onPointerClick);

// ─── CSS3D TV SCREEN — Wikipedia, decorative, always visible ─────────────────
// TV mesh is at (-6.97, 3, 2), face pointing +X into the room.
// Div is 880x480px. Scale = 4.3/880 = 0.00489 so it fills the TV face.
// rotation.y = PI/2 turns the div to face +X.
// x nudged to -6.85 to float just in front of the screen surface.
const browserDiv = document.getElementById('monitor-browser');
const cssObject   = new CSS3DObject(browserDiv);
cssObject.position.set(-6.94, 3, 2);
cssObject.rotation.y = Math.PI / 2;
cssObject.scale.setScalar(0.00489);
scene.add(cssObject);

// pointer-events none so orbit/pan/zoom always work
browserDiv.style.pointerEvents = 'none';

// ─── WALL CLOCK ──────────────────────────────────────────────────────────────
gltfLoader.load('./models/clock.gltf', (gltf) => {
  const model = gltf.scene;
  model.scale.setScalar(0.133);
  model.position.set(3.5, 3.5, -6);
  model.rotation.x = Math.PI / 2;
  model.traverse((node) => {
    if (node.isMesh) { node.castShadow = node.receiveShadow = true; }
  });
  scene.add(model);
}, undefined, (err) => console.error('Clock load error:', err));

// ─── PLANT ───────────────────────────────────────────────────────────────────
gltfLoader.load('./models/plant.gltf', (gltf) => {
  const model = gltf.scene;
  model.scale.setScalar(3);
  model.position.set(5.5, 0, -4);
  model.traverse((node) => {
    if (node.isMesh) { node.castShadow = node.receiveShadow = true; }
  });
  scene.add(model);
}, undefined, (err) => console.error('Plant load error:', err));