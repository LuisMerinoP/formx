import * as THREE from 'three';
import { createCube } from './cube';
import { setupLighting } from './lighting';
import { createControls } from './controls';
import { createFaceLabels } from './faceLabels';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality } from '../types';

interface RendererConfig {
  initialState?: {
    materialType?: MaterialType;
    selectedFace?: FaceIndex | null;
    faceStyle?: FaceStyle;
    debugMode?: boolean;
    showBackground?: boolean;
    envMapQuality?: EnvMapQuality;
  };
}

export type RendererEvent =
  | 'ready'
  | 'envMapLoaded'
  | 'envMapError'
  | 'cameraReset'
  | 'error';

type EventCallback = (data?: unknown) => void;

export class Renderer {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private cube: THREE.Mesh | null = null;
  private controls: { update: () => void; dispose: () => void } | null = null;
  private axesHelper: THREE.AxesHelper | null = null;
  private faceLabels: THREE.Group | null = null;
  private envMap: THREE.Texture | null = null;

  private animationId: number | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  private state: {
    materialType: MaterialType;
    selectedFace: FaceIndex | null;
    faceStyle: FaceStyle;
    debugMode: boolean;
    showBackground: boolean;
    envMapQuality: EnvMapQuality;
  } = {
    materialType: 'basic',
    selectedFace: null,
    faceStyle: 'wood',
    debugMode: false,
    showBackground: true,
    envMapQuality: '1k',
  };

  constructor(config?: RendererConfig) {
    if (config?.initialState) {
      this.state = { ...this.state, ...config.initialState };
    }
  }

  initialize(container: HTMLElement): void {
    try {
      const canvas = document.createElement('canvas');
      canvas.tabIndex = 1;
      container.appendChild(canvas);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a1a);

      this.camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 7;

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;

      this.cube = createCube();
      this.scene.add(this.cube);

      this.controls = createControls(this.cube, canvas, this.camera);
      canvas.focus();

      this.axesHelper = new THREE.AxesHelper(1.5);
      this.axesHelper.visible = this.state.debugMode;
      this.scene.add(this.axesHelper);

      this.faceLabels = createFaceLabels();
      this.faceLabels.visible = this.state.debugMode;
      this.cube.add(this.faceLabels);

      this.loadEnvironmentMap(this.state.envMapQuality);
      this.emit('ready');
    } catch (error) {
      this.emit('error', { message: 'Initialization failed', error });
    }
  }

  start(): void {
    if (this.animationId !== null) return;

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose(): void {
    this.stop();

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    if (this.envMap) {
      this.envMap.dispose();
    }

    this.eventListeners.clear();
  }

  resize(width: number, height: number): void {
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  setMaterialType(type: MaterialType, face?: FaceIndex | null): void {
    this.state.materialType = type;
    this.updateMaterials(face);
  }

  setFaceStyle(style: FaceStyle, face?: FaceIndex | null): void {
    this.state.faceStyle = style;
    this.updateMaterials(face);
  }

  setSelectedFace(face: FaceIndex | null): void {
    this.state.selectedFace = face;
  }

  setDebugMode(enabled: boolean): void {
    this.state.debugMode = enabled;

    if (this.axesHelper) {
      this.axesHelper.visible = enabled;
    }

    if (this.faceLabels) {
      this.faceLabels.visible = enabled;
    }
  }

  setBackgroundVisible(visible: boolean): void {
    this.state.showBackground = visible;

    if (this.scene && this.envMap) {
      this.scene.background = visible ? this.envMap : null;
      this.scene.environment = visible ? this.envMap : null;
    }
  }

  setEnvMapQuality(quality: EnvMapQuality): void {
    this.state.envMapQuality = quality;
    this.loadEnvironmentMap(quality);
  }

  resetCamera(): void {
    if (this.camera) {
      this.camera.position.set(0, 0, 7);
      this.camera.lookAt(0, 0, 0);
      this.emit('cameraReset');
    }
  }

  getState() {
    return { ...this.state };
  }

  on(event: RendererEvent, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: RendererEvent, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: RendererEvent, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  private async loadEnvironmentMap(quality: EnvMapQuality): Promise<void> {
    if (!this.scene || !this.renderer) return;

    try {
      if (this.envMap) {
        this.envMap.dispose();
      }

      const envMap = await setupLighting(
        this.scene,
        this.renderer,
        quality,
        this.envMap !== null
      );

      if (envMap) {
        this.envMap = envMap;

        if (this.state.showBackground) {
          this.scene.environment = envMap;
          this.scene.background = envMap;
        }

        if (this.cube) {
          const materials = Array.isArray(this.cube.material)
            ? this.cube.material
            : [this.cube.material];

          materials.forEach((material) => {
            material.needsUpdate = true;
          });
        }

        this.emit('envMapLoaded', { quality });
      } else {
        this.emit('envMapError', { quality });
      }
    } catch (error) {
      this.emit('envMapError', { quality, error });
    }
  }

  private updateMaterials(targetFace?: FaceIndex | null): void {
    if (!this.cube) return;

    const materials = Array.isArray(this.cube.material)
      ? this.cube.material
      : [this.cube.material];

    materials.forEach((material, index) => {
      const shouldUpdate =
        targetFace === undefined ? false :
        targetFace === null ? true :
        targetFace === index;

      if (shouldUpdate) {
        if (this.state.materialType === 'pbr') {
          this.updateToPBR(material as THREE.MeshStandardMaterial);
        } else {
          this.updateToBasic(material as THREE.MeshStandardMaterial);
        }
      }
    });
  }

  private updateToPBR(material: THREE.MeshStandardMaterial): void {
    material.roughness = this.getStyleRoughness(this.state.faceStyle);
    material.metalness = this.getStyleMetalness(this.state.faceStyle);
    material.color.setHex(this.getStyleColor(this.state.faceStyle));
    material.needsUpdate = true;
  }

  private updateToBasic(material: THREE.MeshStandardMaterial): void {
    material.roughness = 0.5;
    material.metalness = 0;
    material.color.setHex(0x00aaff);
    material.needsUpdate = true;
  }

  private getStyleRoughness(style: FaceStyle): number {
    const roughnessMap: Record<FaceStyle, number> = {
      wood: 0.8,
      glass: 0.05,
      fur: 0.9,
      metal: 0.1,
      plastic: 0.5,
    };
    return roughnessMap[style] ?? 0.5;
  }

  private getStyleMetalness(style: FaceStyle): number {
    const metalnessMap: Record<FaceStyle, number> = {
      wood: 0,
      glass: 0,
      fur: 0,
      metal: 1,
      plastic: 0,
    };
    return metalnessMap[style] ?? 0;
  }

  private getStyleColor(style: FaceStyle): number {
    const colorMap: Record<FaceStyle, number> = {
      wood: 0x8B4513,
      glass: 0x87CEEB,
      fur: 0xD2691E,
      metal: 0xC0C0C0,
      plastic: 0xFF6347,
    };
    return colorMap[style] ?? 0x00aaff;
  }
}
