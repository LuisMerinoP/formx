import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene): void {
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Main directional light (key light)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Fill light from opposite side with slight blue tint
  const directionalLight2 = new THREE.DirectionalLight(0x8888ff, 0.6);
  directionalLight2.position.set(-5, 2, -5);
  scene.add(directionalLight2);

  // Rim light from top for edge definition
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
  rimLight.position.set(0, 10, 0);
  scene.add(rimLight);

  // Create a gradient environment map using PMREMGenerator
  const pmremGenerator = new THREE.PMREMGenerator(new THREE.WebGLRenderer());
  pmremGenerator.compileEquirectangularShader();

  // Create a simple scene for the environment
  const envScene = new THREE.Scene();

  // Add colored lights to the environment scene for reflections
  const envLight1 = new THREE.PointLight(0xffffff, 1, 100);
  envLight1.position.set(10, 10, 10);
  envScene.add(envLight1);

  const envLight2 = new THREE.PointLight(0x4488ff, 0.5, 100);
  envLight2.position.set(-10, 5, -10);
  envScene.add(envLight2);

  const envLight3 = new THREE.PointLight(0xff8844, 0.3, 100);
  envLight3.position.set(0, -10, 0);
  envScene.add(envLight3);

  // Use the scene's background as environment
  const environmentTexture = pmremGenerator.fromScene(envScene).texture;
  scene.environment = environmentTexture;

  pmremGenerator.dispose();
}
