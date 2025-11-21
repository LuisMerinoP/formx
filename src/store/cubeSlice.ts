import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality } from '../renderer/types';

interface CubeState {
  materialType: MaterialType;
  selectedFace: FaceIndex | null;
  faceStyle: FaceStyle;
  debugMode: boolean;
  showBackground: boolean;
  resetCamera: boolean;
  envMapQuality: EnvMapQuality;
}

const initialState: CubeState = {
  materialType: 'basic',
  selectedFace: null,
  faceStyle: 'wood',
  debugMode: false,
  showBackground: true,
  resetCamera: false,
  envMapQuality: '1k',
};

const cubeSlice = createSlice({
  name: 'cube',
  initialState,
  reducers: {
    setMaterialType: (state, action: PayloadAction<MaterialType>) => {
      state.materialType = action.payload;
    },
    setSelectedFace: (state, action: PayloadAction<FaceIndex | null>) => {
      state.selectedFace = action.payload;
    },
    setFaceStyle: (state, action: PayloadAction<FaceStyle>) => {
      state.faceStyle = action.payload;
    },
    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode;
    },
    toggleBackground: (state) => {
      state.showBackground = !state.showBackground;
    },
    triggerResetCamera: (state) => {
      state.resetCamera = true;
    },
    resetCameraComplete: (state) => {
      state.resetCamera = false;
    },
    setEnvMapQuality: (state, action: PayloadAction<EnvMapQuality>) => {
      state.envMapQuality = action.payload;
    },
  },
});

export const { setMaterialType, setSelectedFace, setFaceStyle, toggleDebugMode, toggleBackground, triggerResetCamera, resetCameraComplete, setEnvMapQuality } = cubeSlice.actions;
export default cubeSlice.reducer;
