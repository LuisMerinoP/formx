import type { IRenderer } from './types';
import { Renderer } from './renderer';
import { MockRenderer } from './mockRenderer';

/**
 * Factory function to get the appropriate renderer implementation.
 * Set VITE_USE_MOCK_RENDERER=true in .env to use the mock renderer for testing.
 */
export function getRenderer(): IRenderer {
  const useMock = import.meta.env['VITE_USE_MOCK_RENDERER'] === 'true';

  if (useMock) {
    console.log('Using MockRenderer (logging implementation)');
    return MockRenderer.getInstance();
  }

  return Renderer.getInstance();
}

/**
 * Check if a renderer instance exists (useful for cleanup)
 */
export function hasRendererInstance(): boolean {
  const useMock = import.meta.env['VITE_USE_MOCK_RENDERER'] === 'true';

  if (useMock) {
    return MockRenderer.hasInstance();
  }

  return Renderer.hasInstance();
}
