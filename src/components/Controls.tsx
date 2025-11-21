import type { MaterialType, FaceIndex, FaceStyle, EnvMapQuality } from '../types';
import formxLogo from '../assets/formx.svg';
import './Controls.css';

interface ControlsProps {
  materialType: MaterialType;
  onMaterialTypeChange: (type: MaterialType) => void;
  selectedFace: FaceIndex | null;
  onFaceSelect: (face: FaceIndex | null) => void;
  faceStyle: FaceStyle;
  onFaceStyleChange: (style: FaceStyle) => void;
  debugMode: boolean;
  onDebugToggle: () => void;
  showBackground: boolean;
  onBackgroundToggle: () => void;
  onResetCamera: () => void;
  envMapQuality: EnvMapQuality;
  onEnvMapQualityChange: (quality: EnvMapQuality) => void;
}

const FACE_NAMES = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'];
const STYLES: FaceStyle[] = ['wood', 'glass', 'fur', 'metal', 'plastic'];

export function Controls({
  materialType,
  onMaterialTypeChange,
  selectedFace,
  onFaceSelect,
  faceStyle,
  onFaceStyleChange,
  debugMode,
  onDebugToggle,
  showBackground,
  onBackgroundToggle,
  onResetCamera,
  envMapQuality,
  onEnvMapQualityChange,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="logo-section">
        <img src={formxLogo} alt="formx" className="logo" />
      </div>

      <div className="controls-section">
        <h3>Material Mode</h3>
        <div className="button-group">
          <button
            className={materialType === 'basic' ? 'active' : ''}
            onClick={() => onMaterialTypeChange('basic')}
          >
            Basic
          </button>
          <button
            className={materialType === 'pbr' ? 'active' : ''}
            onClick={() => onMaterialTypeChange('pbr')}
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
            onClick={onDebugToggle}
          >
            {debugMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h3>Background</h3>
        <div className="button-group">
          <button
            className={showBackground ? 'active' : ''}
            onClick={onBackgroundToggle}
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
            onClick={() => onEnvMapQualityChange('1k')}
          >
            1K
          </button>
          <button
            className={envMapQuality === '2k' ? 'active' : ''}
            onClick={() => onEnvMapQualityChange('2k')}
          >
            2K
          </button>
          <button
            className={envMapQuality === '4k' ? 'active' : ''}
            onClick={() => onEnvMapQualityChange('4k')}
          >
            4K
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h3>Camera</h3>
        <div className="button-group">
          <button onClick={onResetCamera}>
            Reset Position
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
                onClick={() => onFaceSelect(null)}
              >
                All Faces
              </button>
              {FACE_NAMES.map((name, index) => (
                <button
                  key={index}
                  className={selectedFace === index ? 'active' : ''}
                  onClick={() => onFaceSelect(index as FaceIndex)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="controls-section">
            <h3>Face Style</h3>
            <div className="button-group">
              {STYLES.map((style) => (
                <button
                  key={style}
                  className={faceStyle === style ? 'active' : ''}
                  onClick={() => onFaceStyleChange(style)}
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
