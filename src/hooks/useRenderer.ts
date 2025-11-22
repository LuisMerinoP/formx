import { useCallback, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import * as rendererActions from '../store/rendererSlice';
import { Renderer } from '../renderer/renderer';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality } from '../renderer/types';

export function useRenderer() {
  const dispatch = useAppDispatch();
  const rendererState = useAppSelector((state) => state.renderer);
  const renderer = Renderer.getInstance();
  const [fps, setFps] = useState(0);
  const [isWebGPU, setIsWebGPU] = useState(false);

  // Poll FPS and WebGPU status every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(renderer.getFPS());
      setIsWebGPU(renderer.isWebGPU());
    }, 500);
    return () => clearInterval(interval);
  }, [renderer]);

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

  const resetCamera = useCallback(() => {
    // No Redux state to update - purely a renderer operation
    renderer.resetCamera();
  }, [renderer]);

  const resize = useCallback((width: number, height: number) => {
    renderer.resize(width, height);
  }, [renderer]);

  return {
    rendererState,
    fps,
    isWebGPU,
    rendererApi: {
      setMaterialType,
      setFaceStyle,
      setSelectedFace,
      setDebugMode,
      setBackgroundVisible,
      setEnvMapQuality,
      resetCamera,
      resize,
    },
  };
}
