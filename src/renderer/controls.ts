import * as THREE from 'three';

interface Controls {
  update: () => void;
  dispose: () => void;
  enabled: boolean;
}

export function createControls(
  mesh: THREE.Mesh,
  domElement: HTMLElement,
  camera: THREE.Camera
): Controls {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  const rotationSpeed = 0.005;

  // Auto-rotation
  let autoRotate = true;
  const autoRotateSpeed = 0.005;

  // Camera look direction (independent of position)
  const lookTarget = new THREE.Vector3();
  lookTarget.copy(mesh.position);
  camera.lookAt(lookTarget);

  // Track pressed keys for continuous movement
  const keysPressed = new Set<string>();

  // Make sure canvas can receive focus
  if (domElement instanceof HTMLCanvasElement) {
    domElement.tabIndex = 1;
  }

  // Mouse events
  function onMouseDown(event: MouseEvent) {
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
    if (!isDragging) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    mesh.rotation.y += deltaX * rotationSpeed;
    mesh.rotation.x += deltaY * rotationSpeed;

    previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function onMouseUp() {
    isDragging = false;
  }

  // Touch events
  function onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (!isDragging || event.touches.length !== 1) return;

    const deltaX = event.touches[0].clientX - previousMousePosition.x;
    const deltaY = event.touches[0].clientY - previousMousePosition.y;

    mesh.rotation.y += deltaX * rotationSpeed;
    mesh.rotation.x += deltaY * rotationSpeed;

    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  function onTouchEnd() {
    isDragging = false;
  }

  // Mouse wheel zoom towards cursor
  function onWheel(event: WheelEvent) {
    event.preventDefault();

    const zoomSpeed = 0.001;
    const delta = event.deltaY * zoomSpeed;

    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Create a raycaster to find the direction from camera through mouse position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Get the direction vector (where the mouse is pointing in 3D space)
    const direction = raycaster.ray.direction.clone().normalize();

    // Move camera along this direction
    camera.position.addScaledVector(direction, -delta);
  }

  // Keyboard events - track key state for continuous movement
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
      event.preventDefault();
    }
    // Toggle auto-rotate
    else if (key === 'r' || code === 'KeyR') {
      autoRotate = !autoRotate;
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
    enabled: true,
    update: () => {
      // Handle continuous movement based on pressed keys
      if (keysPressed.size > 0) {
        const moveSpeed = 0.1;
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();

        camera.getWorldDirection(forward);
        right.crossVectors(camera.up, forward).normalize();

        // Check each possible key
        keysPressed.forEach((keyOrCode) => {
          if (keyOrCode === 'w' || keyOrCode === 'arrowup' || keyOrCode === 'KeyW') {
            camera.position.addScaledVector(forward, moveSpeed);
          }
          if (keyOrCode === 's' || keyOrCode === 'arrowdown' || keyOrCode === 'KeyS') {
            camera.position.addScaledVector(forward, -moveSpeed);
          }
          if (keyOrCode === 'a' || keyOrCode === 'arrowleft' || keyOrCode === 'KeyA') {
            camera.position.addScaledVector(right, -moveSpeed);
          }
          if (keyOrCode === 'd' || keyOrCode === 'arrowright' || keyOrCode === 'KeyD') {
            camera.position.addScaledVector(right, moveSpeed);
          }
        });
      }

      // Auto-rotate mesh
      if (autoRotate) {
        mesh.rotation.y += autoRotateSpeed;
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
