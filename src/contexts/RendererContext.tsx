import { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Renderer } from '../renderer/renderer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setMaterialType as setMaterialTypeAction,
  setSelectedFace as setSelectedFaceAction,
  setFaceStyle as setFaceStyleAction,
  toggleDebugMode as toggleDebugModeAction,
  toggleBackground as toggleBackgroundAction,
  setEnvMapQuality as setEnvMapQualityAction,
  triggerResetCamera as triggerResetCameraAction,
  resetCameraComplete,
} from '../store/cubeSlice';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality } from '../renderer/types';

interface RendererContextValue {
  state: {
    materialType: MaterialType;
    selectedFace: FaceIndex | null;
    faceStyle: FaceStyle;
    debugMode: boolean;
    showBackground: boolean;
    envMapQuality: EnvMapQuality;
    resetCamera: boolean;
    isReady: boolean;
    isInitialized: boolean;
    rendererCreated: boolean;
  };

  actions: {
    initialize: (container: HTMLElement) => void;
    resize: (width: number, height: number) => void;
    setMaterialType: (type: MaterialType) => void;
    setFaceStyle: (style: FaceStyle) => void;
    setSelectedFace: (face: FaceIndex | null) => void;
    setDebugMode: (enabled: boolean) => void;
    setBackgroundVisible: (visible: boolean) => void;
    setEnvMapQuality: (quality: EnvMapQuality) => void;
    resetCamera: () => void;
  };
}

const RendererContext = createContext<RendererContextValue | null>(null);

interface RendererProviderProps {
  children: ReactNode;
}

export function RendererProvider({ children }: RendererProviderProps) {
  const dispatch = useAppDispatch();
  const rendererRef = useRef<Renderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [rendererCreated, setRendererCreated] = useState(false);
  const cubeState = useAppSelector((state) => state.cube);

  useEffect(() => {
    const renderer = new Renderer({
      initialState: {
        materialType: cubeState.materialType,
        selectedFace: cubeState.selectedFace,
        faceStyle: cubeState.faceStyle,
        debugMode: cubeState.debugMode,
        showBackground: cubeState.showBackground,
        envMapQuality: cubeState.envMapQuality,
      },
    });

    // Set up default event listeners
    renderer.on('ready', () => setIsReady(true));
    renderer.on('cameraReset', () => dispatch(resetCameraComplete()));

    rendererRef.current = renderer;
    setRendererCreated(true);

    return () => {
      renderer.stop();
      renderer.dispose();
    };
  }, [dispatch]);
  const initialize = useCallback(async (container: HTMLElement) => {
    if (rendererRef.current && !isInitialized) {
      await rendererRef.current.initialize(container);
      rendererRef.current.start();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const resize = useCallback((width: number, height: number) => {
    rendererRef.current?.resize(width, height);
  }, []);

  const setMaterialType = useCallback((type: MaterialType) => {
    dispatch(setMaterialTypeAction(type));
    rendererRef.current?.setMaterialType(type, cubeState.selectedFace);
  }, [dispatch, cubeState.selectedFace]);

  const setFaceStyle = useCallback((style: FaceStyle) => {
    dispatch(setFaceStyleAction(style));
    rendererRef.current?.setFaceStyle(style, cubeState.selectedFace);
  }, [dispatch, cubeState.selectedFace]);

  const setSelectedFace = useCallback((face: FaceIndex | null) => {
    dispatch(setSelectedFaceAction(face));
    rendererRef.current?.setSelectedFace(face);
  }, [dispatch]);

  const setDebugMode = useCallback((enabled: boolean) => {
    dispatch(toggleDebugModeAction());
    rendererRef.current?.setDebugMode(enabled);
  }, [dispatch]);

  const setBackgroundVisible = useCallback((visible: boolean) => {
    dispatch(toggleBackgroundAction());
    rendererRef.current?.setBackgroundVisible(visible);
  }, [dispatch]);

  const setEnvMapQuality = useCallback((quality: EnvMapQuality) => {
    dispatch(setEnvMapQualityAction(quality));
    rendererRef.current?.setEnvMapQuality(quality);
  }, [dispatch]);

  const resetCamera = useCallback(() => {
    dispatch(triggerResetCameraAction());
    rendererRef.current?.resetCamera();
  }, [dispatch]);

  const contextValue: RendererContextValue = {
    state: {
      materialType: cubeState.materialType,
      selectedFace: cubeState.selectedFace,
      faceStyle: cubeState.faceStyle,
      debugMode: cubeState.debugMode,
      showBackground: cubeState.showBackground,
      envMapQuality: cubeState.envMapQuality,
      resetCamera: cubeState.resetCamera,
      isReady,
      isInitialized,
      rendererCreated,
    },
    actions: {
      initialize,
      resize,
      setMaterialType,
      setFaceStyle,
      setSelectedFace,
      setDebugMode,
      setBackgroundVisible,
      setEnvMapQuality,
      resetCamera,
    },
  };

  return (
    <RendererContext.Provider value={contextValue}>
      {children}
    </RendererContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRenderer() {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRenderer must be used within RendererProvider');
  }
  return context;
}
