import { useEffect, useRef } from "react";
import { useAppSelector } from "../store/hooks";
import { Renderer } from "../renderer/renderer";

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { debugMode, envMapQuality } = useAppSelector((state) => state.renderer);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = Renderer.getInstance();

    // Initialize renderer with initial state from Redux
    renderer.initialize(containerRef.current, debugMode, envMapQuality);

    // Handle window resize
    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      Renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
