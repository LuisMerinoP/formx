import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCube } from '../renderer/cube';
import { setupLighting } from '../renderer/lighting';
import { createControls } from '../renderer/controls';
import { createFaceLabels } from '../renderer/faceLabels';
import type { MaterialType, FaceIndex, EnvMapQuality } from '../types';

interface SceneProps {
  materialType: MaterialType;
  selectedFace: FaceIndex | null;
  faceStyle: string;
  debugMode: boolean;
  showBackground: boolean;
  resetCamera: boolean;
  envMapQuality: EnvMapQuality;
  onResetCameraComplete: () => void;
}

export function Scene({ materialType, selectedFace, faceStyle, debugMode, showBackground, resetCamera, envMapQuality, onResetCameraComplete }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const faceLabelsRef = useRef<THREE.Group | null>(null);
  const envMapRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create cube
    const cube = createCube();
    scene.add(cube);
    cubeRef.current = cube;

    // Setup controls
    const controls = createControls(cube, renderer.domElement, camera);

    // Focus the canvas so keyboard controls work immediately
    renderer.domElement.focus();

    // Create axes helper for debug mode (shows X, Y, Z axes)
    const axesHelper = new THREE.AxesHelper(1.5);
    axesHelper.visible = false;
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // Create face labels
    const faceLabels = createFaceLabels();
    faceLabels.visible = false;
    cube.add(faceLabels);
    faceLabelsRef.current = faceLabels;

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Setup lighting async (loads environment map)
    setupLighting(scene, renderer, envMapQuality).then((envMap) => {
      if (envMap) {
        envMapRef.current = envMap;
      }
      console.log('Scene fully initialized with environment map');
    });

    // Handle resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update debug mode visibility
  useEffect(() => {
    if (axesHelperRef.current && faceLabelsRef.current) {
      axesHelperRef.current.visible = debugMode;
      faceLabelsRef.current.visible = debugMode;
    }
  }, [debugMode]);

  // Update background and environment visibility
  useEffect(() => {
    if (sceneRef.current && envMapRef.current) {
      // Toggle both background and environment reflections
      sceneRef.current.background = showBackground ? envMapRef.current : null;
      sceneRef.current.environment = showBackground ? envMapRef.current : null;
    }
  }, [showBackground]);

  // Reload environment map when quality changes
  useEffect(() => {
    if (sceneRef.current && rendererRef.current) {
      console.log(`Loading ${envMapQuality} environment map...`);

      // Dispose old environment map
      if (envMapRef.current) {
        envMapRef.current.dispose();
      }

      // Load new environment map with selected quality (skip adding lights again)
      setupLighting(sceneRef.current, rendererRef.current, envMapQuality, true).then((envMap) => {
        if (envMap) {
          envMapRef.current = envMap;

          // Update scene with new environment map
          if (sceneRef.current) {
            sceneRef.current.environment = showBackground ? envMap : null;
            sceneRef.current.background = showBackground ? envMap : null;
          }

          // Force material update to use new environment map
          if (cubeRef.current) {
            const materials = Array.isArray(cubeRef.current.material)
              ? cubeRef.current.material
              : [cubeRef.current.material];

            materials.forEach((material) => {
              material.needsUpdate = true;
            });
          }

          console.log(`${envMapQuality} environment map loaded successfully`);
        }
      });
    }
  }, [envMapQuality, showBackground]);

  // Reset camera position when requested
  useEffect(() => {
    if (resetCamera && cameraRef.current) {
      // Reset to default position
      cameraRef.current.position.set(0, 0, 7);
      cameraRef.current.lookAt(0, 0, 0);

      // Notify that reset is complete
      onResetCameraComplete();
    }
  }, [resetCamera, onResetCameraComplete]);

  // Update materials when props change
  useEffect(() => {
    if (!cubeRef.current) return;

    const materials = Array.isArray(cubeRef.current.material)
      ? cubeRef.current.material
      : [cubeRef.current.material];

    // Update material based on selection
    materials.forEach((material, index) => {
      const shouldUpdateFace = selectedFace === null || selectedFace === index;

      if (shouldUpdateFace) {
        if (materialType === 'pbr') {
          updateToPBR(material as THREE.MeshStandardMaterial, faceStyle);
        } else {
          updateToBasic(material as THREE.MeshStandardMaterial);
        }
      }
    });
  }, [materialType, selectedFace, faceStyle]);

  return <div ref={containerRef} />;
}

function updateToPBR(material: THREE.MeshStandardMaterial, style: string) {
  material.roughness = getStyleRoughness(style);
  material.metalness = getStyleMetalness(style);
  material.color.setHex(getStyleColor(style));
  material.needsUpdate = true;
}

function updateToBasic(material: THREE.MeshStandardMaterial) {
  material.roughness = 0.5;
  material.metalness = 0;
  material.color.setHex(0x00aaff);
  material.needsUpdate = true;
}

function getStyleRoughness(style: string): number {
  const roughnessMap: Record<string, number> = {
    wood: 0.8,
    glass: 0.05,  // Very smooth for clear reflections
    fur: 0.9,
    metal: 0.1,   // Very smooth metal for mirror-like reflections
    plastic: 0.5,
  };
  return roughnessMap[style] ?? 0.5;
}

function getStyleMetalness(style: string): number {
  const metalnessMap: Record<string, number> = {
    wood: 0,
    glass: 0,     // Glass is dielectric, not metal
    fur: 0,
    metal: 1,     // Fully metallic for maximum reflections
    plastic: 0,
  };
  return metalnessMap[style] ?? 0;
}

function getStyleColor(style: string): number {
  const colorMap: Record<string, number> = {
    wood: 0x8B4513,
    glass: 0x87CEEB,
    fur: 0xD2691E,
    metal: 0xC0C0C0,
    plastic: 0xFF6347,
  };
  return colorMap[style] ?? 0x00aaff;
}
