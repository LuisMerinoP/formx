import { Scene } from './components/Scene';
import { Controls } from './components/Controls';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setMaterialType, setSelectedFace, setFaceStyle, toggleDebugMode, toggleBackground, triggerResetCamera, resetCameraComplete, setEnvMapQuality } from './store/cubeSlice';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const { materialType, selectedFace, faceStyle, debugMode, showBackground, resetCamera, envMapQuality } = useAppSelector((state) => state.cube);

  return (
    <div className="app">
      <Scene
        materialType={materialType}
        selectedFace={selectedFace}
        faceStyle={faceStyle}
        debugMode={debugMode}
        showBackground={showBackground}
        resetCamera={resetCamera}
        envMapQuality={envMapQuality}
        onResetCameraComplete={() => dispatch(resetCameraComplete())}
      />
      <Controls
        materialType={materialType}
        onMaterialTypeChange={(type) => dispatch(setMaterialType(type))}
        selectedFace={selectedFace}
        onFaceSelect={(face) => dispatch(setSelectedFace(face))}
        faceStyle={faceStyle}
        onFaceStyleChange={(style) => dispatch(setFaceStyle(style))}
        debugMode={debugMode}
        onDebugToggle={() => dispatch(toggleDebugMode())}
        showBackground={showBackground}
        onBackgroundToggle={() => dispatch(toggleBackground())}
        onResetCamera={() => dispatch(triggerResetCamera())}
        envMapQuality={envMapQuality}
        onEnvMapQualityChange={(quality) => dispatch(setEnvMapQuality(quality))}
      />
    </div>
  );
}

export default App;
