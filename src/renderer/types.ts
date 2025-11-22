export type MaterialType = 'basic' | 'pbr';

// Bounded indices to loop arrays type-safely.
export const FACE_INDICES = [0, 1, 2, 3, 4, 5] as const;
export type FaceIndex = typeof FACE_INDICES[number];

export type FaceStyle = 'wood' | 'glass' | 'fur' | 'metal' | 'plastic' | 'gold';

export type EnvMapQuality = '1k' | '2k' | '4k';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export type RendererEvent =
  | 'ready'
  | 'progress'
  | 'envMapLoaded'
  | 'envMapError'
  | 'cameraReset'
  | 'error';

export interface ProgressData {
  type: 'progress';
  progress: number;
  message: string;
}

export interface ErrorData {
  type: 'error';
  message: string;
  error?: unknown;
}

export interface EnvMapData {
  type: 'envMap';
  quality: EnvMapQuality;
  error?: unknown;
}

export interface EmptyData {
  type: 'empty';
}

export type EventData = ProgressData | ErrorData | EnvMapData | EmptyData;

export type EventCallback = (data: EventData) => void;

export interface IRenderer {
  // Lifecycle
  initialize(container: HTMLElement, debugMode: boolean, envMapQuality: EnvMapQuality): Promise<void>;
  dispose(): void;

  // Renderer operations (stateless - accept state as parameters)
  setMaterialType(type: MaterialType, faceStyle: FaceStyle, face?: FaceIndex | null): void;
  setFaceStyle(type: MaterialType, style: FaceStyle, face?: FaceIndex | null): void;
  setSelectedFace(face: FaceIndex | null): void;
  setDebugMode(enabled: boolean): void;
  setTransformMode(mode: TransformMode): void;
  setBackgroundVisible(visible: boolean, envMapQuality: EnvMapQuality): void;
  setEnvMapQuality(quality: EnvMapQuality, showBackground: boolean): void;
  setAutoRotate(enabled: boolean): void;
  resetCamera(): void;
  resize(width: number, height: number): void;

  // Metadata access
  getFPS(): number;
  isWebGPU(): boolean;

  // Event system
  on(event: RendererEvent, callback: EventCallback): void;
  off(event: RendererEvent, callback: EventCallback): void;
}
