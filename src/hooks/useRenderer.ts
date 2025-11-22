import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import * as rendererActions from '../store/rendererSlice';
import { getRenderer } from '../renderer/rendererFactory';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality, TransformMode } from '../renderer/types';

const FPS_POLL_INTERVAL = 500;

export function useRenderer() {
  const dispatch = useAppDispatch();
  const rendererState = useAppSelector((state) => state.renderer);
  const renderer = getRenderer();

  // Poll FPS and WebGPU status and update Redux
  useEffect(() => {
    // Set initial values
    dispatch(rendererActions.setIsWebGPU(renderer.isWebGPU()));

    const interval = setInterval(() => {
      dispatch(rendererActions.setFps(renderer.getFPS()));
    }, FPS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [dispatch, renderer]);

  const setMaterialType = useCallback((type: MaterialType) => {
    dispatch(rendererActions.setMaterialType(type));
    // Pass current faceStyle from Redux state to renderer
    renderer.setMaterialType(type, rendererState.faceStyle, rendererState.selectedFace);
  }, [dispatch, renderer, rendererState.faceStyle, rendererState.selectedFace]);

  const setFaceStyle = useCallback((style: FaceStyle) => {
    dispatch(rendererActions.setFaceStyle(style));
    // Pass current materialType from Redux state to renderer
    renderer.setFaceStyle(rendererState.materialType, style, rendererState.selectedFace);
  }, [dispatch, renderer, rendererState.materialType, rendererState.selectedFace]);

  const setSelectedFace = useCallback((face: FaceIndex | null) => {
    dispatch(rendererActions.setSelectedFace(face));
    renderer.setSelectedFace(face);
  }, [dispatch, renderer]);

  const setDebugMode = useCallback((enabled: boolean) => {
    dispatch(rendererActions.toggleDebugMode());
    renderer.setDebugMode(enabled);
  }, [dispatch, renderer]);

  const setBackgroundVisible = useCallback((visible: boolean) => {
    dispatch(rendererActions.toggleBackground());
    // Pass current envMapQuality from Redux state to renderer
    renderer.setBackgroundVisible(visible, rendererState.envMapQuality);
  }, [dispatch, renderer, rendererState.envMapQuality]);

  const setEnvMapQuality = useCallback((quality: EnvMapQuality) => {
    dispatch(rendererActions.setEnvMapQuality(quality));
    // Pass current showBackground from Redux state to renderer
    renderer.setEnvMapQuality(quality, rendererState.showBackground);
  }, [dispatch, renderer, rendererState.showBackground]);

  const setTransformMode = useCallback((mode: TransformMode) => {
    dispatch(rendererActions.setTransformMode(mode));
    renderer.setTransformMode(mode);
  }, [dispatch, renderer]);

  const resetCamera = useCallback(() => {
    // Reset Redux state to defaults
    dispatch(rendererActions.resetToDefaults());

    // Reset renderer to defaults
    renderer.resetCamera();
    renderer.setDebugMode(false);
    renderer.setBackgroundVisible(true, '1k');
    renderer.setEnvMapQuality('1k', true);
    renderer.setMaterialType('basic', 'wood', null);
    renderer.setAutoRotate(true);
  }, [dispatch, renderer]);

  const resize = useCallback((width: number, height: number) => {
    renderer.resize(width, height);
  }, [renderer]);

  return {
    setMaterialType,
    setFaceStyle,
    setSelectedFace,
    setDebugMode,
    setTransformMode,
    setBackgroundVisible,
    setEnvMapQuality,
    resetCamera,
    resize,
  };
}
