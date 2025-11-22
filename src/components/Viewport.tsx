import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { Renderer, type ProgressData, type EventData } from "../renderer/renderer";

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

    // Subscribe to progress events
    const handleProgress = (data: EventData) => {
      if (data.type === 'progress') {
        setProgress(data);
      }
    };

    renderer.on('progress', handleProgress);

    // Initialize renderer with initial state from Redux
    const initializeRenderer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Viewport: Calling renderer.initialize()');
        await renderer.initialize(containerRef.current!, debugMode, envMapQuality);
        console.log('Viewport: Renderer initialized successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('Viewport: Renderer initialization failed', err);
        setError(err instanceof Error ? err.message : "Failed to initialize renderer");
        setIsLoading(false);
      }
    };

    initializeRenderer();

    // Handle window resize
    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      console.log('Viewport: Cleaning up');
      renderer.off('progress', handleProgress);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {error && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          color: "#ff4444",
          fontSize: "14px",
          fontFamily: "monospace",
        }}>
          Error: {error}
        </div>
      )}

      {isLoading && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
        }}>
          <div style={{
            width: "300px",
            maxWidth: "80%",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "12px",
              color: "#888",
              marginBottom: "8px",
              fontFamily: "monospace",
            }}>
              {progress.message}
            </div>

            <div style={{
              width: "100%",
              height: "4px",
              backgroundColor: "#333",
              borderRadius: "2px",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${progress.progress}%`,
                height: "100%",
                backgroundColor: "#fff",
                transition: "width 0.3s ease",
              }} />
            </div>

            <div style={{
              fontSize: "11px",
              color: "#666",
              marginTop: "4px",
              fontFamily: "monospace",
            }}>
              {progress.progress}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
