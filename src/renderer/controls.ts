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

  // Keyboard events - FPS style camera movement (translation)
  function onKeyDown(event: KeyboardEvent) {
    const moveSpeed = 0.1;
    let handled = false;

    // Get camera's forward and right vectors
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(forward);
    right.crossVectors(camera.up, forward).normalize();

    // Use event.code instead of event.key to avoid extension conflicts
    const key = event.key.toLowerCase();
    const code = event.code;

    // Forward movement
    if (key === 'w' || key === 'arrowup' || code === 'KeyW') {
      camera.position.addScaledVector(forward, moveSpeed);
      autoRotate = false;
      handled = true;
    }
    // Backward movement
    else if (key === 's' || key === 'arrowdown' || code === 'KeyS') {
      camera.position.addScaledVector(forward, -moveSpeed);
      autoRotate = false;
      handled = true;
    }
    // Strafe left
    else if (key === 'a' || key === 'arrowleft' || code === 'KeyA') {
      camera.position.addScaledVector(right, -moveSpeed);
      autoRotate = false;
      handled = true;
    }
    // Strafe right
    else if (key === 'd' || key === 'arrowright' || code === 'KeyD') {
      camera.position.addScaledVector(right, moveSpeed);
      autoRotate = false;
      handled = true;
    }
    // Toggle auto-rotate
    else if (key === 'r' || code === 'KeyR') {
      autoRotate = !autoRotate;
      handled = true;
    }

    // Don't call camera.lookAt here - let camera direction stay fixed for true FPS movement

    // Prevent default browser behavior for handled keys
    if (handled) {
      event.preventDefault();
    }
  }

  // Add event listeners
  domElement.addEventListener('mousedown', onMouseDown);
  domElement.addEventListener('mousemove', onMouseMove);
  domElement.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('touchstart', onTouchStart);
  domElement.addEventListener('touchmove', onTouchMove);
  domElement.addEventListener('touchend', onTouchEnd);
  document.addEventListener('keydown', onKeyDown);

  return {
    enabled: true,
    update: () => {
      if (autoRotate) {
        mesh.rotation.y += autoRotateSpeed;
      }
    },
    dispose: () => {
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('mousemove', onMouseMove);
      domElement.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
