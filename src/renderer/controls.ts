import * as THREE from 'three';

export interface Controls {
  update: () => void;
  dispose: () => void;
  enabled: boolean;
  keyboardEnabled: boolean;
  setAutoRotate: (enabled: boolean) => void;
}

// Configuration constants
const ROTATION_SPEED = 0.005;
const AUTO_ROTATE_SPEED = 0.005;
const ZOOM_SPEED = 0.001;
const MOVE_SPEED = 0.1;

export function createControls(
  mesh: THREE.Mesh,
  domElement: HTMLElement,
  camera: THREE.Camera,
  onNeedRender: () => void
): Controls {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let autoRotate = true;

  // Camera look direction (independent of position)
  const lookTarget = new THREE.Vector3();
  lookTarget.copy(mesh.position);
  camera.lookAt(lookTarget);

  // Track pressed keys for continuous movement
  const keysPressed = new Set<string>();

  // Reusable workspace objects to avoid garbage collection pressure
  const workspace = {
    mouse: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    direction: new THREE.Vector3(),
  };

  // Make sure canvas can receive focus
  if (domElement instanceof HTMLCanvasElement) {
    domElement.tabIndex = 1;
  }

  // Controls state
  const controlsState = { enabled: true };

  // Mouse events
  function onMouseDown(event: MouseEvent) {
    if (!controlsState.enabled) return;
    isDragging = true;
    autoRotate = false;
    // Focus the canvas when clicking on it
    if (domElement instanceof HTMLCanvasElement) {
      domElement.focus();
    }
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function onMouseMove(event: MouseEvent) {
    if (!controlsState.enabled || !isDragging) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    mesh.rotation.y += deltaX * ROTATION_SPEED;
    mesh.rotation.x += deltaY * ROTATION_SPEED;

    previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };

    onNeedRender();
  }

  function onMouseUp() {
    isDragging = false;
  }

  // Touch events
  function onTouchStart(event: TouchEvent) {
    if (!controlsState.enabled) return;
    const touch = event.touches[0];
    if (touch && event.touches.length === 1) {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (!controlsState.enabled || !isDragging || event.touches.length !== 1) return;

    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - previousMousePosition.x;
    const deltaY = touch.clientY - previousMousePosition.y;

    mesh.rotation.y += deltaX * ROTATION_SPEED;
    mesh.rotation.x += deltaY * ROTATION_SPEED;

    previousMousePosition = {
      x: touch.clientX,
      y: touch.clientY,
    };

    onNeedRender();
  }

  function onTouchEnd() {
    isDragging = false;
  }

  // Mouse wheel zoom towards cursor
  function onWheel(event: WheelEvent) {
    event.preventDefault();

    const delta = event.deltaY * ZOOM_SPEED;

    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = domElement.getBoundingClientRect();
    workspace.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    workspace.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Use raycaster to find the direction from camera through mouse position
    workspace.raycaster.setFromCamera(workspace.mouse, camera);

    // Get the direction vector (where the mouse is pointing in 3D space)
    workspace.direction.copy(workspace.raycaster.ray.direction).normalize();

    // Move camera along this direction
    camera.position.addScaledVector(workspace.direction, -delta);

    onNeedRender();
  }

  // Keyboard events - track key state for continuous movement
  // Note: Keyboard controls should work even when mouse controls are disabled
  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const code = event.code;

    // Check if this is a movement key
    const isMovementKey =
      key === 'w' || key === 'arrowup' || code === 'KeyW' ||
      key === 's' || key === 'arrowdown' || code === 'KeyS' ||
      key === 'a' || key === 'arrowleft' || code === 'KeyA' ||
      key === 'd' || key === 'arrowright' || code === 'KeyD';

    if (isMovementKey) {
      // Add to pressed keys set
      keysPressed.add(code || key);
      autoRotate = false;
      onNeedRender();
      event.preventDefault();
    }
    // Toggle auto-rotate
    else if (key === 'r' || code === 'KeyR') {
      autoRotate = !autoRotate;
      onNeedRender();
      event.preventDefault();
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const code = event.code;

    // Remove from pressed keys set
    keysPressed.delete(code || key);
  }

  // Add event listeners
  domElement.addEventListener('mousedown', onMouseDown);
  domElement.addEventListener('mousemove', onMouseMove);
  domElement.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('touchstart', onTouchStart);
  domElement.addEventListener('touchmove', onTouchMove);
  domElement.addEventListener('touchend', onTouchEnd);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return {
    get enabled() {
      return controlsState.enabled;
    },
    set enabled(value: boolean) {
      controlsState.enabled = value;
    },
    get keyboardEnabled() {
      return controlsState.enabled;
    },
    set keyboardEnabled(value: boolean) {
      // Keyboard enabled state follows mouse controls for now
      controlsState.enabled = value;
    },
    setAutoRotate: (enabled: boolean) => {
      autoRotate = enabled;
    },
    update: () => {
      let needsRender = false;

      // Handle continuous movement based on pressed keys (always enabled)
      if (keysPressed.size > 0) {
        // Reuse workspace vectors instead of creating new ones every frame
        camera.getWorldDirection(workspace.forward);
        workspace.right.crossVectors(camera.up, workspace.forward).normalize();

        // Check each possible key
        keysPressed.forEach((keyOrCode) => {
          if (keyOrCode === 'w' || keyOrCode === 'arrowup' || keyOrCode === 'KeyW') {
            camera.position.addScaledVector(workspace.forward, MOVE_SPEED);
          }
          if (keyOrCode === 's' || keyOrCode === 'arrowdown' || keyOrCode === 'KeyS') {
            camera.position.addScaledVector(workspace.forward, -MOVE_SPEED);
          }
          if (keyOrCode === 'a' || keyOrCode === 'arrowleft' || keyOrCode === 'KeyA') {
            camera.position.addScaledVector(workspace.right, MOVE_SPEED);
          }
          if (keyOrCode === 'd' || keyOrCode === 'arrowright' || keyOrCode === 'KeyD') {
            camera.position.addScaledVector(workspace.right, -MOVE_SPEED);
          }
        });
        needsRender = true;
      }

      // Auto-rotate mesh
      if (autoRotate) {
        mesh.rotation.y += AUTO_ROTATE_SPEED;
        needsRender = true;
      }

      if (needsRender) {
        onNeedRender();
      }
    },
    dispose: () => {
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('mousemove', onMouseMove);
      domElement.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    },
  };
}
