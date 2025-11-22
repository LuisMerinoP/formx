import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { WebGPURenderer } from 'three/webgpu';
import type { EnvMapQuality, FaceStyle, MaterialType } from './types';

interface EnvMapAsset {
  texture: THREE.Texture | null;
  promise: Promise<THREE.Texture | null>;
  isLoaded: boolean;
}

/**
 * Material configuration for a specific style.
 */
interface MaterialConfig {
  roughness: number;
  metalness: number;
  color: number;
}

/**
 * AssetManager handles loading and caching of HDR environment maps and materials.
 * All assets are pre-loaded during initialization to ensure smooth runtime performance.
 *
 * NOTE ON MATERIAL PRE-INSTANTIATION:
 * In this simple cube application, pre-instantiating materials is overkill because:
 * - Material property updates are extremely cheap (~0.1ms for setting roughness/color)
 * - We only have 1 object with 6 faces and 5 styles
 * - The real performance bottleneck is HDR loading + PMREM processing (~500-2000ms)
 *
 * However, this pattern becomes valuable in larger applications with:
 * - Complex shader graphs (custom shaders, multiple texture maps, procedural generation)
 * - Large object counts (10,000+ objects each needing materials)
 *   * Architectural visualization with complex buildings
 *   * CAD applications with massive assemblies
 *   * Material switching becomes a bottleneck at this scale
 * - Strict performance requirements (VR/XR needing guaranteed 90+ FPS)
 * - Material libraries (100+ pre-configured materials like in Blender/Unity/Unreal)
 *
 * This implementation demonstrates the pattern for educational purposes and as a
 * foundation for scaling to more complex scenarios.
 */
export class AssetManager {
  private readonly scene: THREE.Scene;
  private readonly isWebGPU: boolean;
  private readonly pmremGenerator: THREE.PMREMGenerator | null = null;
  private readonly materials: Map<string, THREE.MeshStandardMaterial> = new Map();
  private readonly envMaps: Map<EnvMapQuality, EnvMapAsset> = new Map();

  private isInitialized = false;

  // Material configuration presets
  private static readonly MATERIAL_CONFIGS: Record<FaceStyle, MaterialConfig> = {
    wood: { roughness: 0.8, metalness: 0, color: 0x8B4513 },
    glass: { roughness: 0.05, metalness: 0, color: 0x87CEEB },
    fur: { roughness: 0.9, metalness: 0, color: 0xD2691E },
    metal: { roughness: 0.1, metalness: 1, color: 0xC0C0C0 },
    plastic: { roughness: 0.5, metalness: 0, color: 0xFF6347 },
    gold: { roughness: 0.3, metalness: 1, color: 0xFFD700 },
  };

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer | WebGPURenderer, isWebGPU: boolean) {
    this.scene = scene;
    this.isWebGPU = isWebGPU;

    // PMREMGenerator is only used for WebGL
    // WebGPU handles environment maps natively
    if (!isWebGPU && renderer instanceof THREE.WebGLRenderer) {
      this.pmremGenerator = new THREE.PMREMGenerator(renderer);
      this.pmremGenerator.compileEquirectangularShader();
    }

    this.initializeMaterials();
  }

  /**
   * Pre-load all environment maps at all quality levels.
   * Returns a promise that resolves when all assets are loaded.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const qualities: EnvMapQuality[] = ['1k', '2k', '4k'];

    // Start loading all qualities concurrently (asynchronous I/O operations)
    const loadPromises = qualities.map(quality => this.loadEnvMap(quality));

    // Wait for all to complete (failures are handled gracefully)
    await Promise.allSettled(loadPromises);

    this.isInitialized = true;
  }

  /**
   * Get an environment map texture by quality.
   * Returns immediately if already loaded, otherwise waits for the load to complete.
   */
  async getEnvMap(quality: EnvMapQuality): Promise<THREE.Texture | null> {
    const asset = this.envMaps.get(quality);

    if (asset) {
      // Already loading or loaded, return the promise
      return asset.promise;
    }

    // Not yet started, load it now
    return this.loadEnvMap(quality);
  }

  /**
   * Apply an environment map to the scene.
   */
  applyEnvMapToScene(texture: THREE.Texture | null, showBackground: boolean): void {
    if (texture && showBackground) {
      // Show both background and environment reflections
      this.scene.environment = texture;
      this.scene.background = texture;
    } else if (texture && !showBackground) {
      // Keep environment lighting for materials, but hide the background visual
      this.scene.environment = texture;
      this.scene.background = new THREE.Color(0x1a1a1a);
    } else {
      // No texture at all
      this.scene.environment = null;
      this.scene.background = new THREE.Color(0x1a1a1a);
    }
  }

  /**
   * Get a pre-instantiated material by type and style.
   * Returns immediately with no creation overhead.
   */
  getMaterial(type: MaterialType, style: FaceStyle): THREE.MeshStandardMaterial | null {
    const key = this.getMaterialKey(type, style);
    return this.materials.get(key) || null;
  }

  /**
   * Dispose of all loaded assets and cleanup resources.
   */
  dispose(): void {
    this.envMaps.forEach(asset => {
      if (asset.texture) {
        asset.texture.dispose();
      }
    });

    this.materials.forEach(material => {
      material.dispose();
    });

    this.envMaps.clear();
    this.materials.clear();

    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }

    this.isInitialized = false;
  }

  /**
   * Check if a specific quality level is loaded.
   */
  isLoaded(quality: EnvMapQuality): boolean {
    const asset = this.envMaps.get(quality);
    return asset?.isLoaded ?? false;
  }

  /**
   * Get loading status for all qualities.
   */
  getLoadingStatus(): Record<EnvMapQuality, boolean> {
    return {
      '1k': this.isLoaded('1k'),
      '2k': this.isLoaded('2k'),
      '4k': this.isLoaded('4k'),
    };
  }

  /**
   * Pre-instantiate all material combinations.
   * Creates materials for: 2 types (basic/pbr) × 6 styles = 12 materials
   */
  private initializeMaterials(): void {
    const materialTypes: MaterialType[] = ['basic', 'pbr'];
    const faceStyles: FaceStyle[] = ['wood', 'glass', 'fur', 'metal', 'plastic', 'gold'];

    materialTypes.forEach(type => {
      faceStyles.forEach(style => {
        const key = this.getMaterialKey(type, style);
        const config = type === 'pbr'
          ? AssetManager.MATERIAL_CONFIGS[style]
          : { roughness: 0.5, metalness: 0, color: 0x00aaff }; // Basic material defaults

        const material = new THREE.MeshStandardMaterial({
          color: config.color,
          roughness: config.roughness,
          metalness: config.metalness,
        });

        this.materials.set(key, material);
      });
    });
  }

  /**
   * Generate a unique key for material lookup.
   */
  private getMaterialKey(type: MaterialType, style: FaceStyle): string {
    return `${type}-${style}`;
  }

  /**
   * Internal method to load and cache an environment map.
   */
  private loadEnvMap(quality: EnvMapQuality): Promise<THREE.Texture | null> {
    const asset: EnvMapAsset = {
      texture: null,
      promise: this.loadAndProcessHDR(quality),
      isLoaded: false,
    };

    this.envMaps.set(quality, asset);

    // Update the asset once loaded
    asset.promise.then(texture => {
      asset.texture = texture;
      asset.isLoaded = true;
      return texture;
    }).catch(() => {
      asset.isLoaded = true;
      return null;
    });

    return asset.promise;
  }

  /**
   * Load an HDR file and process it for optimal PBR rendering.
   * WebGL: Uses PMREM for pre-filtered environment maps
   * WebGPU: Uses native environment mapping (no PMREM needed)
   */
  private loadAndProcessHDR(quality: EnvMapQuality): Promise<THREE.Texture | null> {
    return new Promise((resolve) => {
      const loader = new HDRLoader();
      const path = `/src/assets/golden_gate_hills_${quality}.hdr`;

      loader.load(
        path,
        (texture) => {
          try {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            if (this.isWebGPU) {
              // WebGPU handles environment maps natively, no PMREM needed
              resolve(texture);
            } else {
              // WebGL needs PMREM processing for optimal performance
              if (!this.pmremGenerator) {
                throw new Error('PMREMGenerator not initialized for WebGL');
              }

              const renderTarget = this.pmremGenerator.fromEquirectangular(texture);
              const envMap = renderTarget.texture;

              // Clean up the original texture after processing
              texture.dispose();

              resolve(envMap);
            }
          } catch (error) {
            console.error(`Failed to process HDR texture (${quality}):`, error);
            resolve(null);
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load HDR texture (${quality}):`, error);
          resolve(null);
        }
      );
    });
  }
}
