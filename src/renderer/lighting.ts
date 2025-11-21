import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import type { EnvMapQuality } from './types';

export async function setupLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  quality: EnvMapQuality = '1k',
  skipLights: boolean = false
): Promise<THREE.Texture | null> {
  if (!skipLights) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
  }

  const hdrLoader = new HDRLoader();
  const envMapPath = `/src/assets/golden_gate_hills_${quality}.hdr`;

  return new Promise((resolve) => {
    hdrLoader.load(
      envMapPath,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        try {
          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          pmremGenerator.compileEquirectangularShader();

          const renderTarget = pmremGenerator.fromEquirectangular(texture);
          const envMap = renderTarget.texture;

          scene.environment = envMap;
          scene.background = envMap;

          texture.dispose();
          pmremGenerator.dispose();

          resolve(envMap);
        } catch (error) {
          resolve(null);
        }
      },
      undefined,
      () => {
        const fallbackLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fallbackLight.position.set(-5, 2, -5);
        scene.add(fallbackLight);
        resolve(null);
      }
    );
  });
}
