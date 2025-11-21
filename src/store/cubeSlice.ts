import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MaterialType, FaceIndex, FaceStyle } from '../types';

interface CubeState {
  materialType: MaterialType;
  selectedFace: FaceIndex | null;
  faceStyle: FaceStyle;
  debugMode: boolean;
}

const initialState: CubeState = {
  materialType: 'basic',
  selectedFace: null,
  faceStyle: 'wood',
  debugMode: false,
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
  },
});

export const { setMaterialType, setSelectedFace, setFaceStyle, toggleDebugMode } = cubeSlice.actions;
export default cubeSlice.reducer;
