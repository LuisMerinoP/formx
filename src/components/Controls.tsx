import type { FaceIndex, FaceStyle } from '../renderer/types';
import { useRenderer } from '../hooks/useRenderer';
import { useAppSelector } from '../store/hooks';
import formxLogo from '../assets/formx.svg';
import './Controls.css';

const FACE_NAMES: Array<{ index: FaceIndex; name: string }> = [
  { index: 0, name: 'Right' },
  { index: 1, name: 'Left' },
  { index: 2, name: 'Top' },
  { index: 3, name: 'Bottom' },
  { index: 4, name: 'Front' },
  { index: 5, name: 'Back' },
];
const STYLES: FaceStyle[] = ['wood', 'glass', 'fur', 'metal', 'plastic', 'gold'];

export function Controls() {
  // Get renderer state from Redux
  const { materialType, selectedFace, faceStyle, debugMode, showBackground, envMapQuality, transformMode, fps, isWebGPU } = useAppSelector((state) => state.renderer);

  // Get renderer API functions from hook
  const {
    setMaterialType,
    setFaceStyle,
    setSelectedFace,
    setDebugMode,
    setTransformMode,
    setBackgroundVisible,
    setEnvMapQuality,
    resetCamera,
  } = useRenderer();

  return (
    <div className="controls">
      <div className="logo-section">
        <img src={formxLogo} alt="formx" className="logo" />
        <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
          {fps} FPS • {isWebGPU ? 'WebGPU' : 'WebGL'}
        </div>
      </div>

      <div className="controls-section">
        <h3>Material Mode</h3>
        <div className="button-group">
          <button
            className={materialType === 'basic' ? 'active' : ''}
            onClick={() => setMaterialType('basic')}
          >
            Basic
          </button>
          <button
            className={materialType === 'pbr' ? 'active' : ''}
            onClick={() => setMaterialType('pbr')}
          >
            PBR
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h3>Debug Mode</h3>
        <div className="button-group">
          <button
            className={debugMode ? 'active' : ''}
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {debugMode && (
        <div className="controls-section">
          <h3>Transform Mode</h3>
          <div className="button-group transform-grid">
            <button
              className={transformMode === 'translate' ? 'active' : ''}
              onClick={() => setTransformMode('translate')}
            >
              Position
            </button>
            <button
              className={transformMode === 'rotate' ? 'active' : ''}
              onClick={() => setTransformMode('rotate')}
            >
              Rotation
            </button>
            <button
              className={transformMode === 'scale' ? 'active' : ''}
              onClick={() => setTransformMode('scale')}
            >
              Scale
            </button>
          </div>
        </div>
      )}

      <div className="controls-section">
        <h3>Background</h3>
        <div className="button-group">
          <button
            className={showBackground ? 'active' : ''}
            onClick={() => setBackgroundVisible(!showBackground)}
          >
            {showBackground ? 'ENV MAP' : 'DARK'}
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h3>Env Map Quality</h3>
        <div className="button-group">
          <button
            className={envMapQuality === '1k' ? 'active' : ''}
            onClick={() => setEnvMapQuality('1k')}
          >
            1K
          </button>
          <button
            className={envMapQuality === '2k' ? 'active' : ''}
            onClick={() => setEnvMapQuality('2k')}
          >
            2K
          </button>
          <button
            className={envMapQuality === '4k' ? 'active' : ''}
            onClick={() => setEnvMapQuality('4k')}
          >
            4K
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h3>Reset</h3>
        <div className="button-group">
          <button onClick={resetCamera}>
            Reset All
          </button>
        </div>
      </div>

      {materialType === 'pbr' && (
        <>
          <div className="controls-section">
            <h3>Select Face</h3>
            <div className="button-group face-grid">
              <button
                className={selectedFace === null ? 'active' : ''}
                onClick={() => setSelectedFace(null)}
              >
                All Faces
              </button>
              {FACE_NAMES.map((face) => (
                <button
                  key={face.index}
                  className={selectedFace === face.index ? 'active' : ''}
                  onClick={() => setSelectedFace(face.index)}
                >
                  {face.name}
                </button>
              ))}
            </div>
          </div>

          <div className="controls-section">
            <h3>Face Style</h3>
            <div className="button-group style-grid">
              {STYLES.map((style) => (
                <button
                  key={style}
                  className={faceStyle === style ? 'active' : ''}
                  onClick={() => setFaceStyle(style)}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="controls-section help">
        <p>
          <strong>Controls:</strong> Drag to rotate • Arrow keys/WASD to move • Mouse wheel to zoom • R to toggle auto-rotate
        </p>
      </div>
    </div>
  );
}
