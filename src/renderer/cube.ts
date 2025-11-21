import * as THREE from 'three';

export function createCube(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(2, 2, 2);

  // Create 6 materials for each face
  const materials = Array.from({ length: 6 }, () =>
    new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      roughness: 0.5,
      metalness: 0,
    })
  );

  const cube = new THREE.Mesh(geometry, materials);

  // Set initial rotation to see the 3D effect
  cube.rotation.x = 0.4;
  cube.rotation.y = 0.4;

  return cube;
}
