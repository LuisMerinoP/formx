import * as THREE from 'three';

const CUBE_SIZE = 2;
const FACE_COUNT = 6;
const INITIAL_ROTATION = 0.4;

const DEFAULT_MATERIAL = {
  color: 0x00aaff,
  roughness: 0.5,
  metalness: 0,
} as const;

export function createCube(): THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[]> {
  const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

  const materials = Array.from({ length: FACE_COUNT }, () =>
    new THREE.MeshStandardMaterial(DEFAULT_MATERIAL)
  );

  const cube = new THREE.Mesh(geometry, materials);

  cube.rotation.x = INITIAL_ROTATION;
  cube.rotation.y = INITIAL_ROTATION;

  return cube;
}
