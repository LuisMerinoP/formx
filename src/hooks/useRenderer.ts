import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import * as rendererActions from '../store/rendererSlice';
import { initialState } from '../store/rendererSlice';
import { getRenderer } from '../renderer/rendererFactory';
import type { MaterialType, FaceStyle, EnvMapQuality, TransformMode, IRenderer, RendererConfig, CubeFaceOptions, RendererResetConfig } from '../renderer/types';

const FPS_POLL_INTERVAL = 500;

/**
 * React hook that bridges the renderer singleton with Redux state management.
 *
 * This is the central wiring point between the renderer and React sides:
 * - All renderer interactions MUST go through this hook's API
 * - Each renderer method call dispatches corresponding Redux actions
 * - Updates renderer and Redux state in sync, ensuring consistency
 * - Centralizes all state management in one place
 *
 * IMPORTANT: Do NOT operate the Renderer singleton directly outside this hook.
 * Direct renderer access bypasses Redux synchronization and breaks the single source of truth.
 *
 * Architecture:
 * - Redux is the single source of truth for all renderer/UI state
 * - Data flow starts from the UI (React) → Redux → Renderer
 * - This hook coordinates both sides to keep them in sync
 *
 * @returns IRenderer interface with Redux-coordinated methods
 */
export function useRenderer(): IRenderer {
  const dispatch = useAppDispatch();
  const rendererState = useAppSelector((state) => state.renderer);
  const renderer: IRenderer = getRenderer();

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(rendererActions.setFps(renderer.getFPS()));
    }, FPS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [dispatch, renderer]);

  return useMemo((): IRenderer => ({
    initialize: (container: HTMLElement, config: RendererConfig) => {
      return renderer.initialize(container, config);
    },

    dispose: () => {
      renderer.dispose();
    },

    setMaterial: (type: MaterialType, style: FaceStyle, options?: CubeFaceOptions) => {
      dispatch(rendererActions.setMaterialType(type));
      dispatch(rendererActions.setFaceStyle(style));
      renderer.setMaterial(type, style, options);
    },

    setDebugMode: (enabled: boolean) => {
      dispatch(rendererActions.toggleDebugMode());
      renderer.setDebugMode(enabled);
    },

    setTransformMode: (mode: TransformMode) => {
      dispatch(rendererActions.setTransformMode(mode));
      renderer.setTransformMode(mode);
    },

    setBackgroundVisible: (visible: boolean, envMapQuality: EnvMapQuality) => {
      dispatch(rendererActions.toggleBackground());
      renderer.setBackgroundVisible(visible, envMapQuality);
    },

    setEnvMapQuality: (quality: EnvMapQuality, showBackground: boolean) => {
      dispatch(rendererActions.setEnvMapQuality(quality));
      renderer.setEnvMapQuality(quality, showBackground);
    },

    setAutoRotate: (enabled: boolean) => {
      renderer.setAutoRotate(enabled);
    },

    resetToDefaults: (config: RendererResetConfig) => {
      dispatch(rendererActions.resetToDefaults());
      renderer.resetToDefaults(config);
    },

    resize: (width: number, height: number) => {
      renderer.resize(width, height);
    },

    getFPS: () => renderer.getFPS(),
    isWebGPU: () => renderer.isWebGPU(),

    on: (event, callback) => renderer.on(event, callback),
    off: (event, callback) => renderer.off(event, callback),
  }), [dispatch, renderer, rendererState.selectedFace]);
}
