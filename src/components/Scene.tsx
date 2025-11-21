import { useEffect, useRef } from 'react';
import { useRenderer } from '../contexts/RendererContext';

export function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useRenderer();

  // Initialize renderer once when container AND renderer are ready
  useEffect(() => {
    if (containerRef.current && state.rendererCreated && !state.isInitialized) {
      actions.initialize(containerRef.current);
    }
  }, [actions, state.isInitialized, state.rendererCreated]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      actions.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [actions]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
