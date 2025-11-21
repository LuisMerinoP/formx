import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export async function setupLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): Promise<THREE.Texture | null> {
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Main directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Load the environment map
  const exrLoader = new EXRLoader();

  return new Promise((resolve) => {
    exrLoader.load(
      '/src/assets/golden_gate_hills_4k.exr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        // Generate PMREM (Pre-filtered Mipmapped Radiance Environment Map)
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        // Apply environment map to scene
        scene.environment = envMap;
        scene.background = envMap;

        // Clean up
        texture.dispose();
        pmremGenerator.dispose();

        console.log('Environment map loaded successfully');
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
