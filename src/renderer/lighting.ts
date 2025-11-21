import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import type { EnvMapQuality } from '../types';

export async function setupLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  quality: EnvMapQuality = '1k',
  skipLights: boolean = false
): Promise<THREE.Texture | null> {
  // Only add lights on initial setup, not when reloading
  if (!skipLights) {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
  }

  // Load the environment map
  const exrLoader = new EXRLoader();

  const envMapPath = `/src/assets/golden_gate_hills_${quality}.exr`;

  return new Promise((resolve) => {
    exrLoader.load(
      envMapPath,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        console.log(`Original texture size: ${texture.image.width}x${texture.image.height}`);

        // Generate PMREM (Pre-filtered Mipmapped Radiance Environment Map)
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        const renderTarget = pmremGenerator.fromEquirectangular(texture);
        const envMap = renderTarget.texture;

        console.log(`PMREM cubemap size: ${renderTarget.width}x${renderTarget.height}`);

        // Apply environment map to scene
        scene.environment = envMap;
        scene.background = envMap;

        // Clean up
        texture.dispose();
        pmremGenerator.dispose();

        console.log(`Environment map (${quality}) loaded successfully`);
        resolve(envMap);
      },
      undefined,
      (error) => {
        console.error('Error loading environment map:', error);
        // Fallback to basic lighting
        const fallbackLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fallbackLight.position.set(-5, 2, -5);
        scene.add(fallbackLight);
        resolve(null);
      }
    );
  });
}
