import type {
  IRenderer,
  MaterialType,
  FaceIndex,
  FaceStyle,
  EnvMapQuality,
  TransformMode,
  EventData,
  EventCallback,
} from './types';

export class MockRenderer implements IRenderer {
  private static instance: MockRenderer | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private mockFps = 60;
  private mockIsWebGPU = false;

  private constructor() {
    console.log('[MockRenderer] Constructor called');
  }

  static getInstance(): IRenderer {
    console.log('[MockRenderer] getInstance() called');
    if (!MockRenderer.instance) {
      MockRenderer.instance = new MockRenderer();
    }
    return MockRenderer.instance;
  }

  static hasInstance(): boolean {
    return MockRenderer.instance !== null;
  }

  async initialize(container: HTMLElement, debugMode: boolean, envMapQuality: EnvMapQuality): Promise<void> {
    console.log('[MockRenderer] initialize() called', { container, debugMode, envMapQuality });

    // Simulate async initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    // Emit progress events
    this.emit('progress', { type: 'progress', progress: 0, message: 'Mock: Starting...' });
    await new Promise(resolve => setTimeout(resolve, 50));
    this.emit('progress', { type: 'progress', progress: 50, message: 'Mock: Loading...' });
    await new Promise(resolve => setTimeout(resolve, 50));
    this.emit('progress', { type: 'progress', progress: 100, message: 'Mock: Ready!' });

    this.emit('ready', { type: 'empty' });

    console.log('[MockRenderer] Initialization complete');
  }

  dispose(): void {
    console.log('[MockRenderer] dispose() called');
    this.eventListeners.clear();
    MockRenderer.instance = null;
  }

  setMaterialType(type: MaterialType, faceStyle: FaceStyle, face?: FaceIndex | null): void {
    console.log('[MockRenderer] setMaterialType() called', { type, faceStyle, face });
  }

  setFaceStyle(type: MaterialType, style: FaceStyle, face?: FaceIndex | null): void {
    console.log('[MockRenderer] setFaceStyle() called', { type, style, face });
  }

  setSelectedFace(face: FaceIndex | null): void {
    console.log('[MockRenderer] setSelectedFace() called', { face });
  }

  setDebugMode(enabled: boolean): void {
    console.log('[MockRenderer] setDebugMode() called', { enabled });
  }

  setTransformMode(mode: TransformMode): void {
    console.log('[MockRenderer] setTransformMode() called', { mode });
  }

  setBackgroundVisible(visible: boolean, envMapQuality: EnvMapQuality): void {
    console.log('[MockRenderer] setBackgroundVisible() called', { visible, envMapQuality });
  }

  setEnvMapQuality(quality: EnvMapQuality, showBackground: boolean): void {
    console.log('[MockRenderer] setEnvMapQuality() called', { quality, showBackground });
  }

  setAutoRotate(enabled: boolean): void {
    console.log('[MockRenderer] setAutoRotate() called', { enabled });
  }

  resetCamera(): void {
    console.log('[MockRenderer] resetCamera() called');
    this.emit('cameraReset', { type: 'empty' });
  }

  resize(width: number, height: number): void {
    console.log('[MockRenderer] resize() called', { width, height });
  }

  getFPS(): number {
    return this.mockFps;
  }

  isWebGPU(): boolean {
    return this.mockIsWebGPU;
  }

  on(event: string, callback: EventCallback): void {
    console.log('[MockRenderer] on() called', { event });
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    console.log('[MockRenderer] off() called', { event });
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: EventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}
