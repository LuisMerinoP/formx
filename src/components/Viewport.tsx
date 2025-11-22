import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { Renderer, type ProgressData, type EventData } from "../renderer/renderer";
import "./Viewport.css";

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { debugMode, envMapQuality } = useAppSelector((state) => state.renderer);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData>({ type: 'progress', progress: 0, message: 'Initializing...' });

  useEffect(() => {
    if (!containerRef.current) {
      console.log('Viewport: containerRef not ready yet');
      return;
    }

    console.log('Viewport: Starting renderer initialization');
    const renderer = Renderer.getInstance();

    // Subscribe to events
    const handleProgress = (data: EventData) => {
      if (data.type === 'progress') {
        setProgress(data);
      }
    };

    const handleReady = () => {
      console.log('Viewport: Renderer ready');
      setIsLoading(false);
    };

    const handleError = (data: EventData) => {
      if (data.type === 'error') {
        console.error('Viewport: Renderer error', data.error);
        setError(data.message);
        setIsLoading(false);
      }
    };

    renderer.on('progress', handleProgress);
    renderer.on('ready', handleReady);
    renderer.on('error', handleError);

    // Initialize renderer (no need to await, we handle completion via events)
    console.log('Viewport: Starting renderer initialization');
    renderer.initialize(containerRef.current!, debugMode, envMapQuality);

    // Handle window resize
    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      console.log('Viewport: Cleaning up');
      renderer.off('progress', handleProgress);
      renderer.off('ready', handleReady);
      renderer.off('error', handleError);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="viewport-container">
      <div ref={containerRef} className="viewport-canvas" />

      {error && (
        <div className="viewport-overlay viewport-error">
          Error: {error}
        </div>
      )}

      {isLoading && (
        <div className="viewport-overlay">
          <div className="viewport-progress">
            <div className="viewport-progress-message">
              {progress.message}
            </div>

            <div className="viewport-progress-bar">
              <div
                className="viewport-progress-fill"
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            <div className="viewport-progress-percent">
              {progress.progress}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
