import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MaterialType, FaceIndex, FaceStyle } from '../types';

interface CubeState {
  materialType: MaterialType;
  selectedFace: FaceIndex | null;
  faceStyle: FaceStyle;
  debugMode: boolean;
  showBackground: boolean;
  resetCamera: boolean;
}

const initialState: CubeState = {
  materialType: 'basic',
  selectedFace: null,
  faceStyle: 'wood',
  debugMode: false,
  showBackground: true,
  resetCamera: false,
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
      console.log('Redux: triggerResetCamera action dispatched');
      state.resetCamera = true;
    },
    resetCameraComplete: (state) => {
      console.log('Redux: resetCameraComplete action dispatched');
      state.resetCamera = false;
    },
  },
});

export const { setMaterialType, setSelectedFace, setFaceStyle, toggleDebugMode, toggleBackground, triggerResetCamera, resetCameraComplete } = cubeSlice.actions;
export default cubeSlice.reducer;
