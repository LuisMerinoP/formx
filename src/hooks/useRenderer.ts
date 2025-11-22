import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import * as rendererActions from '../store/rendererSlice';
import { getRenderer } from '../renderer/rendererFactory';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality, TransformMode, IRenderer, RendererConfig } from '../renderer/types';

const FPS_POLL_INTERVAL = 500;

export function useRenderer(): IRenderer {
  const dispatch = useAppDispatch();
  const rendererState = useAppSelector((state) => state.renderer);
  const renderer: IRenderer = getRenderer();

  // Poll FPS and update Redux
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(rendererActions.setFps(renderer.getFPS()));
    }, FPS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [dispatch, renderer]);

  // Return an object that implements IRenderer interface (strict checking with explicit return type)
  return useMemo((): IRenderer => ({
    // Lifecycle methods
    initialize: (container: HTMLElement, config: RendererConfig) => {
      return renderer.initialize(container, config);
    },

    dispose: () => {
      renderer.dispose();
    },

    setMaterialType: (type: MaterialType, faceStyle: FaceStyle, face?: FaceIndex | null) => {
      dispatch(rendererActions.setMaterialType(type));
      renderer.setMaterialType(type, faceStyle, face);
    },

    setFaceStyle: (type: MaterialType, style: FaceStyle, face?: FaceIndex | null) => {
      dispatch(rendererActions.setFaceStyle(style));
      renderer.setFaceStyle(type, style, face);
    },

    setSelectedFace: (face: FaceIndex | null) => {
      dispatch(rendererActions.setSelectedFace(face));
      renderer.setSelectedFace(face);
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

    resetCamera: () => {
      // Reset Redux state to defaults
      dispatch(rendererActions.resetToDefaults());

      // Reset renderer to defaults
      renderer.resetCamera();
      renderer.setDebugMode(false);
      renderer.setBackgroundVisible(true, '1k');
      renderer.setEnvMapQuality('1k', true);
      renderer.setMaterialType('basic', 'wood', null);
      renderer.setAutoRotate(true);
    },

    resize: (width: number, height: number) => {
      renderer.resize(width, height);
    },

    // Metadata access (pass through)
    getFPS: () => renderer.getFPS(),
    isWebGPU: () => renderer.isWebGPU(),

    // Event system (pass through)
    on: (event, callback) => renderer.on(event, callback),
    off: (event, callback) => renderer.off(event, callback),
  }), [dispatch, renderer, rendererState.selectedFace]);
}
