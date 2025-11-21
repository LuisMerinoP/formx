import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import type { EnvMapQuality } from './types';

interface EnvMapAsset {
  texture: THREE.Texture | null;
  promise: Promise<THREE.Texture | null>;
  isLoaded: boolean;
}

/**
 * AssetManager handles loading and caching of HDR environment maps.
 * All assets are pre-loaded during initialization to ensure smooth runtime performance.
 */
export class AssetManager {
  private envMaps: Map<EnvMapQuality, EnvMapAsset> = new Map();
  private pmremGenerator: THREE.PMREMGenerator;
  private scene: THREE.Scene;
  private isInitialized = false;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
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
    if (texture) {
      this.scene.environment = texture;
      this.scene.background = showBackground ? texture : null;
    } else {
      this.scene.environment = null;
      this.scene.background = null;
    }
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

    this.envMaps.clear();
    this.pmremGenerator.dispose();
    this.isInitialized = false;
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
   * Load an HDR file and process it through PMREM for optimal PBR rendering.
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

            const renderTarget = this.pmremGenerator.fromEquirectangular(texture);
            const envMap = renderTarget.texture;

            // Clean up the original texture after processing
            texture.dispose();

            resolve(envMap);
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
}
