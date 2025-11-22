import * as THREE from 'three';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import { WebGPURenderer } from 'three/webgpu';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { createCube } from './cube';
import { createControls, type Controls } from './controls';
import { createFaceLabels } from './faceLabels';
import { AssetManager } from './assetManager';
import type {
  MaterialType,
  FaceIndex,
  FaceStyle,
  EnvMapQuality,
  TransformMode,
  RendererEvent,
  EventData,
  EventCallback,
  IRenderer,
  RendererConfig,
  RendererResetConfig,
  CubeFaceOptions,
} from './types';

export class Renderer implements IRenderer {
  private static instance: Renderer | null = null;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | WebGPURenderer;
  private cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[]>;
  private controls: Controls;
  private transformControls: TransformControls;
  private faceLabels: THREE.Group;
  private assetManager: AssetManager;
  private usingWebGPU = false;
  private lights: THREE.Light[] = [];

  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private currentFps = 0;
  private renderRequested = false;
  private lastFrameTime = 0;
  private frameCount = 0;
  private animationId: number | null = null;
  private isInitialized = false;

  private constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.cube = new THREE.Mesh();
    this.controls = {
      update: () => {},
      dispose: () => {},
      enabled: false,
      keyboardEnabled: false,
      setAutoRotate: () => {},
    };
    this.transformControls = new TransformControls(this.camera, document.createElement('canvas'));
    this.faceLabels = new THREE.Group();
    this.assetManager = new AssetManager(this.scene, this.renderer, false);
  }

  static getInstance(): IRenderer {
    if (!Renderer.instance) {
      Renderer.instance = new Renderer();
    }
    return Renderer.instance;
  }

  static hasInstance(): boolean {
    return Renderer.instance !== null;
  }

  async initialize(container: HTMLElement, config: RendererConfig): Promise<void> {
    const { debugMode, envMapQuality } = config;
    try {
      this.emit('progress', { type: 'progress', progress: 0, message: 'Creating canvas...' });
      const canvas = document.createElement('canvas');
      canvas.tabIndex = 1;
      container.appendChild(canvas);

      this.emit('progress', { type: 'progress', progress: 10, message: 'Setting up scene...' });
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a1a);

      // Add lights for when environment map is disabled
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);
      this.lights.push(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      this.scene.add(directionalLight);
      this.lights.push(directionalLight);

      this.camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 7;

      this.emit('progress', { type: 'progress', progress: 20, message: 'Initializing renderer...' });
      // Try WebGPU first, fallback to WebGL
      if (WebGPU.isAvailable()) {
        console.log('WebGPU is available! Using WebGPU renderer.');
        this.renderer = new WebGPURenderer({ canvas, antialias: true });
        this.usingWebGPU = true;
        await this.renderer.init();
      } else {
        console.log('WebGPU not available. Using WebGL renderer.');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.usingWebGPU = false;
      }

      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;

      this.emit('progress', { type: 'progress', progress: 40, message: 'Creating scene objects...' });
      this.cube = createCube();
      this.scene.add(this.cube);

      this.controls = createControls(this.cube, canvas, this.camera, () => this.requestRender());
      canvas.focus();

      // Create TransformControls for debug visualization
      this.transformControls = new TransformControls(this.camera, canvas);
      this.transformControls.attach(this.cube);
      this.transformControls.size = 0.8;
      this.transformControls.space = 'world';
      this.transformControls.setMode('translate');
      this.transformControls.enabled = debugMode;

      // Request render when transform controls are being used
      this.transformControls.addEventListener('change', () => this.requestRender());
      this.transformControls.addEventListener('dragging-changed', () => this.requestRender());

      if (debugMode) {
        const gizmo = this.transformControls.getHelper();
        this.scene.add(gizmo);
      }

      this.faceLabels = createFaceLabels();
      this.faceLabels.visible = debugMode;
      this.cube.add(this.faceLabels);

      this.emit('progress', { type: 'progress', progress: 50, message: 'Loading assets...' });

      // Initialize AssetManager and pre-load all environment maps
      this.assetManager = new AssetManager(this.scene, this.renderer, this.usingWebGPU);
      await this.assetManager.initialize();

      this.emit('progress', { type: 'progress', progress: 80, message: 'Applying environment map...' });
      await this.loadEnvironmentMap(envMapQuality, true);

      this.emit('progress', { type: 'progress', progress: 95, message: 'Starting render loop...' });
      this.isInitialized = true;
      this.startRenderLoop();

      this.emit('progress', { type: 'progress', progress: 100, message: 'Ready!' });
      this.emit('ready', { type: 'empty' });

      // Initial render
      this.requestRender();
    } catch (error) {
      this.emit('error', { type: 'error', message: 'Initialization failed', error });
      throw error;
    }
  }

  dispose(): void {
    this.isInitialized = false;
    this.stopRenderLoop();

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.transformControls) {
      this.transformControls.dispose();
    }

    if (this.assetManager) {
      this.assetManager.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    this.eventListeners.clear();

    Renderer.instance = null;
  }

  resize(width: number, height: number): void {
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
    }

    this.requestRender();
  }

  setMaterial(type: MaterialType, style: FaceStyle, options?: CubeFaceOptions): void {
    const updateOptions = options ?? { allFaces: true as const };
    this.updateMaterials(type, style, updateOptions);
    this.requestRender();
  }

  setDebugMode(enabled: boolean): void {
    if (this.transformControls && this.scene) {
      this.transformControls.enabled = enabled;
      const gizmo = this.transformControls.getHelper();
      if (enabled) {
        this.scene.add(gizmo);
      } else {
        this.scene.remove(gizmo);
      }
    }

    if (this.controls) {
      this.controls.enabled = !enabled;

      if (enabled) {
        this.controls.setAutoRotate(false);
      }
    }

    if (this.faceLabels) {
      this.faceLabels.visible = enabled;
    }

    this.requestRender();
  }

  setTransformMode(mode: TransformMode): void {
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
    this.requestRender();
  }

  setBackgroundVisible(visible: boolean, envMapQuality: EnvMapQuality): void {
    this.loadEnvironmentMap(envMapQuality, visible);
    this.requestRender();
  }

  setEnvMapQuality(quality: EnvMapQuality, showBackground: boolean): void {
    this.loadEnvironmentMap(quality, showBackground);
    this.requestRender();
  }

  setAutoRotate(enabled: boolean): void {
    this.controls.setAutoRotate(enabled);
    this.requestRender();
  }

  resetToDefaults(config: RendererResetConfig): void {
    this.camera.position.set(config.cameraPosition.x, config.cameraPosition.y, config.cameraPosition.z);
    this.camera.lookAt(config.cameraLookAt.x, config.cameraLookAt.y, config.cameraLookAt.z);

    this.cube.position.set(config.cubePosition.x, config.cubePosition.y, config.cubePosition.z);
    this.cube.rotation.set(config.cubeRotation.x, config.cubeRotation.y, config.cubeRotation.z);
    this.cube.scale.set(config.cubeScale.x, config.cubeScale.y, config.cubeScale.z);

    this.setDebugMode(config.debugMode);
    this.setBackgroundVisible(config.showBackground, config.envMapQuality);
    this.setEnvMapQuality(config.envMapQuality, config.showBackground);
    const materialOptions = config.selectedFace === null
      ? { allFaces: true as const }
      : { targetFace: config.selectedFace };
    this.setMaterial(config.materialType, config.faceStyle, materialOptions);
    this.setAutoRotate(true);

    this.emit('cameraReset', { type: 'empty' });
    this.requestRender();
  }

  getFPS(): number {
    return this.currentFps;
  }

  isWebGPU(): boolean {
    return this.usingWebGPU;
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

  private requestRender(): void {
    this.renderRequested = true;
  }

  private updateFPS(): void {
    const targetFrames = 30;
    const now = performance.now();
    this.frameCount++;

    if (this.frameCount >= targetFrames) {
      const deltaTime = now - this.lastFrameTime;
      this.currentFps = Math.round((this.frameCount * 1000) / deltaTime);
      this.lastFrameTime = now;
      this.frameCount = 0;
    }
  }

  private startRenderLoop(): void {
    if (this.animationId !== null) return;

    const loop = () => {
      this.animationId = requestAnimationFrame(loop);

      if (!this.isInitialized) return;
      if (!this.renderRequested) return;

      this.renderer.render(this.scene, this.camera);
      this.renderRequested = false;

      this.updateFPS();
      
      this.controls.update();
    };

    this.lastFrameTime = performance.now();
    loop();
  }

  private stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private emit(event: RendererEvent, data: EventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  private async loadEnvironmentMap(quality: EnvMapQuality, showBackground: boolean): Promise<void> {
    if (!this.scene || !this.assetManager) return;

    try {
      const envMap = await this.assetManager.getEnvMap(quality);

      if (envMap) {
        this.assetManager.applyEnvMapToScene(envMap, showBackground);

        if (this.cube) {
          const materials = Array.isArray(this.cube.material)
            ? this.cube.material
            : [this.cube.material];

          materials.forEach((material) => {
            material.needsUpdate = true;
          });
        }

        this.emit('envMapLoaded', { type: 'envMap', quality });
      } else {
        this.emit('envMapError', { type: 'envMap', quality });
      }
    } catch (error) {
      this.emit('envMapError', { type: 'envMap', quality, error });
    }
  }

  private updateMaterials(materialType: MaterialType, faceStyle: FaceStyle, options: CubeFaceOptions): void {
    if (!this.cube || !this.assetManager) return;

    const sourceMaterial = this.assetManager.getMaterial(materialType, faceStyle);
    if (!sourceMaterial) return;

    const materials = this.cube.material;

    materials.forEach((material, index) => {
      const shouldUpdate = 'allFaces' in options ? options.allFaces : options.targetFace === index;

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
        material.envMap = sourceMaterial.envMap;
        material.envMapIntensity = sourceMaterial.envMapIntensity;
        material.needsUpdate = true;
      }
    });
  }
}
