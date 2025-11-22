import * as THREE from 'three';

const CUBE_SIZE = 2;
const FACE_COUNT = 6;
const INITIAL_ROTATION = 0.4;

// Default material properties
const DEFAULT_MATERIAL = {
  color: 0x00aaff,
  roughness: 0.5,
  metalness: 0,
} as const;

export function createCube(): THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[]> {
  const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

  // Create 6 materials for each face
  const materials = Array.from({ length: FACE_COUNT }, () =>
    new THREE.MeshStandardMaterial(DEFAULT_MATERIAL)
  );

  const cube = new THREE.Mesh(geometry, materials);

  // Set initial rotation to see the 3D effect
  cube.rotation.x = INITIAL_ROTATION;
  cube.rotation.y = INITIAL_ROTATION;

  return cube;
}
