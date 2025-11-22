import * as THREE from 'three';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import { WebGPURenderer } from 'three/webgpu';
import { createCube } from './cube';
import { createControls } from './controls';
import { createFaceLabels } from './faceLabels';
import { AssetManager } from './assetManager';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality } from './types';

export type RendererEvent =
  | 'ready'
  | 'envMapLoaded'
  | 'envMapError'
  | 'cameraReset'
  | 'error';

type EventCallback = (data?: unknown) => void;

export interface IRenderer {
  // Lifecycle
  initialize(container: HTMLElement, debugMode: boolean, envMapQuality: EnvMapQuality): Promise<void>;

  // Renderer operations (stateless - accept state as parameters)
  setMaterialType(type: MaterialType, faceStyle: FaceStyle, face?: FaceIndex | null): void;
  setFaceStyle(type: MaterialType, style: FaceStyle, face?: FaceIndex | null): void;
  setSelectedFace(face: FaceIndex | null): void;
  setDebugMode(enabled: boolean): void;
  setBackgroundVisible(visible: boolean, envMapQuality: EnvMapQuality): void;
  setEnvMapQuality(quality: EnvMapQuality, showBackground: boolean): void;
  resetCamera(): void;
  resize(width: number, height: number): void;

  // Metadata access
  getFPS(): number;
  isWebGPU(): boolean;

  // Event system
  on(event: RendererEvent, callback: EventCallback): void;
  off(event: RendererEvent, callback: EventCallback): void;
}

export class Renderer implements IRenderer {
  private static instance: Renderer | null = null;

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | WebGPURenderer | null = null;
  private cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[]> | null = null;
  private controls: { update: () => void; dispose: () => void } | null = null;
  private axesHelper: THREE.AxesHelper | null = null;
  private faceLabels: THREE.Group | null = null;
  private assetManager: AssetManager | null = null;
  private _isWebGPU = false;

  private animationId: number | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private currentFps = 0;

  private constructor() {}

  static getInstance(): IRenderer {
    if (!Renderer.instance) {
      Renderer.instance = new Renderer();
    }
    return Renderer.instance;
  }

  static dispose(): void {
    if (Renderer.instance) {
      Renderer.instance.cleanup();
      Renderer.instance = null;
    }
  }

  static hasInstance(): boolean {
    return Renderer.instance !== null;
  }

  async initialize(container: HTMLElement, debugMode: boolean, envMapQuality: EnvMapQuality): Promise<void> {
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

      // Try WebGPU first, fallback to WebGL
      if (WebGPU.isAvailable()) {
        console.log('WebGPU is available! Using WebGPU renderer.');
        this.renderer = new WebGPURenderer({ canvas, antialias: true });
        this._isWebGPU = true;
        await this.renderer.init();
      } else {
        console.log('WebGPU not available. Using WebGL renderer.');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this._isWebGPU = false;
      }

      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      // Configure tone mapping
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;

      this.cube = createCube();
      this.scene.add(this.cube);

      this.controls = createControls(this.cube, canvas, this.camera);
      canvas.focus();

      this.axesHelper = new THREE.AxesHelper(1.5);
      this.axesHelper.visible = debugMode;
      this.scene.add(this.axesHelper);

      this.faceLabels = createFaceLabels();
      this.faceLabels.visible = debugMode;
      this.cube.add(this.faceLabels);

      // Initialize AssetManager and pre-load all environment maps
      this.assetManager = new AssetManager(this.scene, this.renderer, this._isWebGPU);
      await this.assetManager.initialize();

      // Apply the initial environment map quality
      await this.loadEnvironmentMap(envMapQuality, true);

      // Start animation loop
      this.start();

      this.emit('ready');
    } catch (error) {
      this.emit('error', { message: 'Initialization failed', error });
    }
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

  setMaterialType(type: MaterialType, faceStyle: FaceStyle, face?: FaceIndex | null): void {
    this.updateMaterials(type, faceStyle, face);
  }

  setFaceStyle(type: MaterialType, style: FaceStyle, face?: FaceIndex | null): void {
    this.updateMaterials(type, style, face);
  }

  setSelectedFace(_face: FaceIndex | null): void {
    // No-op - selectedFace is purely UI state, doesn't affect renderer
  }

  setDebugMode(enabled: boolean): void {
    if (this.axesHelper) {
      this.axesHelper.visible = enabled;
    }

    if (this.faceLabels) {
      this.faceLabels.visible = enabled;
    }
  }

  setBackgroundVisible(visible: boolean, envMapQuality: EnvMapQuality): void {
    // Re-apply the current environment map with new visibility setting
    this.loadEnvironmentMap(envMapQuality, visible);
  }

  setEnvMapQuality(quality: EnvMapQuality, showBackground: boolean): void {
    this.loadEnvironmentMap(quality, showBackground);
  }

  resetCamera(): void {
    if (this.camera) {
      this.camera.position.set(0, 0, 7);
      this.camera.lookAt(0, 0, 0);
      this.emit('cameraReset');
    }
  }

  getFPS(): number {
    return this.currentFps;
  }

  isWebGPU(): boolean {
    return this._isWebGPU;
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

  private start(): void {
    if (this.animationId !== null) return;

    // FPS monitoring
    let lastFrameTime = performance.now();
    let frameCount = 0;
    const targetFrames = 30; // Update FPS every 30 frames

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Calculate FPS every N frames
      const now = performance.now();
      frameCount++;

      if (frameCount >= targetFrames) {
        const deltaTime = now - lastFrameTime;
        this.currentFps = Math.round((frameCount * 1000) / deltaTime);
        lastFrameTime = now;
        frameCount = 0;
      }

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    animate();
  }

  private stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private cleanup(): void {
    this.stop();

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.assetManager) {
      this.assetManager.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    this.eventListeners.clear();
  }

  private emit(event: RendererEvent, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  private async loadEnvironmentMap(quality: EnvMapQuality, showBackground: boolean): Promise<void> {
    if (!this.scene || !this.assetManager) return;

    try {
      // Get the cached environment map from AssetManager
      const envMap = await this.assetManager.getEnvMap(quality);

      if (envMap) {
        // Apply to scene with visibility settings
        this.assetManager.applyEnvMapToScene(envMap, showBackground);

        // Force material update to use new environment map
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

  private updateMaterials(materialType: MaterialType, faceStyle: FaceStyle, targetFace?: FaceIndex | null): void {
    if (!this.cube || !this.assetManager) return;

    // Get the pre-instantiated material from AssetManager
    const sourceMaterial = this.assetManager.getMaterial(materialType, faceStyle);
    if (!sourceMaterial) return;

    const materials = this.cube.material;

    materials.forEach((material, index) => {
      const shouldUpdate =
        targetFace === undefined ? false :
        targetFace === null ? true :
        targetFace === index;

      if (shouldUpdate) {
        // Copy properties from pre-instantiated material template
        // NOTE: We copy properties instead of replacing the material instance because:
        // 1. Each face needs its own material instance (can't share one instance across faces)
        // 2. Replacing material instances would require careful disposal and re-application
        // 3. Property copying is simpler and avoids memory leaks
        //
        // In a more complex app, you might pre-instantiate 6 materials per style combination
        // and swap material instances directly: materials[index] = preInstantiatedMaterials[index]
        material.roughness = sourceMaterial.roughness;
        material.metalness = sourceMaterial.metalness;
        material.color.copy(sourceMaterial.color);
        material.needsUpdate = true;
      }
    });
  }
}
