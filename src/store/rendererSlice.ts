import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality } from '../renderer/types';

interface RendererState {
  materialType: MaterialType;
  selectedFace: FaceIndex | null;
  faceStyle: FaceStyle;
  debugMode: boolean;
  showBackground: boolean;
  envMapQuality: EnvMapQuality;
}

const initialState: RendererState = {
  materialType: 'basic',
  selectedFace: null,
  faceStyle: 'wood',
  debugMode: false,
  showBackground: true,
  envMapQuality: '1k',
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
  },
});

export const {
  setMaterialType,
  setSelectedFace,
  setFaceStyle,
  toggleDebugMode,
  toggleBackground,
  setEnvMapQuality,
} = rendererSlice.actions;

export default rendererSlice.reducer;
