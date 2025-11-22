import * as THREE from 'three';

const FACE_NAMES = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'] as const;
const LABEL_OFFSET = 1.1;

const POSITIONS: [number, number, number][] = [
  [LABEL_OFFSET, 0, 0],   // Right
  [-LABEL_OFFSET, 0, 0],  // Left
  [0, LABEL_OFFSET, 0],   // Top
  [0, -LABEL_OFFSET, 0],  // Bottom
  [0, 0, LABEL_OFFSET],   // Front
  [0, 0, -LABEL_OFFSET],  // Back
];

// Rotations for each face (in radians) to make plane face outward
const ROTATIONS: [number, number, number][] = [
  [0, Math.PI / 2, 0],      // Right: rotate around Y
  [0, -Math.PI / 2, 0],     // Left: rotate around Y
  [-Math.PI / 2, 0, 0],     // Top: rotate around X
  [Math.PI / 2, 0, 0],      // Bottom: rotate around X
  [0, 0, 0],                // Front: no rotation
  [0, Math.PI, 0],          // Back: rotate 180 around Y
];

// Canvas dimensions for label texture
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 128;

export function createFaceLabels(): THREE.Group {
  const group = new THREE.Group();

  FACE_NAMES.forEach((name, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    const texture = new THREE.CanvasTexture(canvas);

    // Use PlaneGeometry instead of Sprite to avoid billboarding
    const geometry = new THREE.PlaneGeometry(1, 0.5);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const pos = POSITIONS[index];
    const rot = ROTATIONS[index];
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);

    group.add(mesh);
  });

  return group;
}
