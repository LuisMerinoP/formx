import * as THREE from 'three';

export function createFaceLabels(): THREE.Group {
  const group = new THREE.Group();

  const faceNames = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'];
  const positions = [
    [1.1, 0, 0],   // Right
    [-1.1, 0, 0],  // Left
    [0, 1.1, 0],   // Top
    [0, -1.1, 0],  // Bottom
    [0, 0, 1.1],   // Front
    [0, 0, -1.1],  // Back
  ];

  // Rotations for each face (in radians) to make plane face outward
  const rotations: [number, number, number][] = [
    [0, Math.PI / 2, 0],      // Right: rotate around Y
    [0, -Math.PI / 2, 0],     // Left: rotate around Y
    [-Math.PI / 2, 0, 0],     // Top: rotate around X
    [Math.PI / 2, 0, 0],      // Bottom: rotate around X
    [0, 0, 0],                // Front: no rotation
    [0, Math.PI, 0],          // Back: rotate 180 around Y
  ];

  faceNames.forEach((name, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 128);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);

    // Use PlaneGeometry instead of Sprite to avoid billboarding
    const geometry = new THREE.PlaneGeometry(1, 0.5);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(...positions[index] as [number, number, number]);
    mesh.rotation.set(...rotations[index]);

    group.add(mesh);
  });

  return group;
}
