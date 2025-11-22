import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality, TransformMode } from '../renderer/types';

interface RendererState {
  materialType: MaterialType;
  selectedFace: FaceIndex | null;
  faceStyle: FaceStyle;
  debugMode: boolean;
  showBackground: boolean;
  envMapQuality: EnvMapQuality;
  transformMode: TransformMode;
  fps: number;
  isWebGPU: boolean;
}

const initialState: RendererState = {
  materialType: 'basic',
  selectedFace: null,
  faceStyle: 'wood',
  debugMode: false,
  showBackground: true,
  envMapQuality: '1k',
  transformMode: 'translate',
  fps: 0,
  isWebGPU: false,
};

const rendererSlice = createSlice({
  name: 'renderer',
  initialState,
  reducers: {
    setMaterialType(state, action: PayloadAction<MaterialType>) {
      state.materialType = action.payload;
    },
    setSelectedFace(state, action: PayloadAction<FaceIndex | null>) {
      state.selectedFace = action.payload;
    },
    setFaceStyle(state, action: PayloadAction<FaceStyle>) {
      state.faceStyle = action.payload;
    },
    toggleDebugMode(state) {
      state.debugMode = !state.debugMode;
    },
    toggleBackground(state) {
      state.showBackground = !state.showBackground;
    },
    setEnvMapQuality(state, action: PayloadAction<EnvMapQuality>) {
      state.envMapQuality = action.payload;
    },
    setTransformMode(state, action: PayloadAction<TransformMode>) {
      state.transformMode = action.payload;
    },
    setFps(state, action: PayloadAction<number>) {
      state.fps = action.payload;
    },
    setIsWebGPU(state, action: PayloadAction<boolean>) {
      state.isWebGPU = action.payload;
    },
    resetToDefaults(state) {
      state.materialType = initialState.materialType;
      state.selectedFace = initialState.selectedFace;
      state.faceStyle = initialState.faceStyle;
      state.debugMode = initialState.debugMode;
      state.showBackground = initialState.showBackground;
      state.envMapQuality = initialState.envMapQuality;
      state.transformMode = initialState.transformMode;
      // Note: fps and isWebGPU are not reset as they're runtime metadata
    },
  },
});

export const {
  setMaterialType,
  setSelectedFace,
  setFaceStyle,
  toggleDebugMode,
  toggleBackground,
  setEnvMapQuality,
  setTransformMode,
  setFps,
  setIsWebGPU,
  resetToDefaults,
} = rendererSlice.actions;

export default rendererSlice.reducer;
