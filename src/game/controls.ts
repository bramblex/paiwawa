import * as THREE from 'three';

export interface FirstPersonControlsOptions {
  element?: HTMLElement;
  moveSpeed?: number;
  sprintMultiplier?: number;
  lookSensitivity?: number;
  minPitch?: number;
  maxPitch?: number;
  maxDelta?: number;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  cameraHeight?: number;
}

type TouchMove = { x: number; z: number };

const GROUND_UP = new THREE.Vector3(0, 1, 0);

/** Small, dependency-free first-person controller for the game's camera. */
export class FirstPersonControls {
  readonly camera: THREE.PerspectiveCamera;

  private readonly moveSpeed: number;
  private readonly sprintMultiplier: number;
  private readonly lookSensitivity: number;
  private readonly minPitch: number;
  private readonly maxPitch: number;
  private readonly maxDelta: number;
  private readonly bounds?: FirstPersonControlsOptions['bounds'];
  private readonly cameraHeight?: number;
  private readonly lockElement?: HTMLElement;
  private readonly keys = new Set<string>();
  private touchMove: TouchMove = { x: 0, z: 0 };
  private readonly movementForward = new THREE.Vector3();
  private readonly movementRight = new THREE.Vector3();
  private yaw: number;
  private pitch: number;
  private gyroYaw = 0;
  private gyroPitch = 0;
  private pointerLocked = false;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
      event.preventDefault();
      this.keys.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (this.keys.has(event.code)) event.preventDefault();
    this.keys.delete(event.code);
  };

  private readonly onBlur = (): void => this.keys.clear();

  private readonly onPointerLockChange = (): void => {
    this.pointerLocked = typeof document !== 'undefined' && document.pointerLockElement === this.lockElement;
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (this.pointerLocked) this.rotateBy(event.movementX, event.movementY);
  };

  constructor(camera: THREE.PerspectiveCamera, options: FirstPersonControlsOptions = {}) {
    this.camera = camera;
    this.moveSpeed = options.moveSpeed ?? 3.5;
    this.sprintMultiplier = options.sprintMultiplier ?? 1.8;
    this.lookSensitivity = options.lookSensitivity ?? 0.0022;
    this.minPitch = options.minPitch ?? -Math.PI * 0.46;
    this.maxPitch = options.maxPitch ?? Math.PI * 0.38;
    this.maxDelta = options.maxDelta ?? 0.1;
    this.bounds = options.bounds;
    this.cameraHeight = options.cameraHeight;
    this.lockElement = options.element ?? (typeof document !== 'undefined' ? document.body : undefined);
    this.camera.rotation.order = 'YXZ';
    this.yaw = camera.rotation.y;
    this.pitch = camera.rotation.x;
    this.applyRotation();

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDown, { passive: false });
      window.addEventListener('keyup', this.onKeyUp, { passive: false });
      window.addEventListener('blur', this.onBlur);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerlockchange', this.onPointerLockChange);
      document.addEventListener('mousemove', this.onMouseMove);
    }
  }

  get isLocked(): boolean {
    return this.pointerLocked;
  }

  lock(): void {
    const element = this.lockElement;
    if (element?.requestPointerLock) element.requestPointerLock();
  }

  /** Point the camera at a world-space target and synchronize internal look state. */
  lookAt(target: THREE.Vector3): void {
    this.camera.lookAt(target);
    this.camera.rotation.order = 'YXZ';
    this.yaw = this.camera.rotation.y;
    this.pitch = THREE.MathUtils.clamp(this.camera.rotation.x, this.minPitch, this.maxPitch);
    this.gyroYaw = 0;
    this.gyroPitch = 0;
    this.applyRotation();
  }

  /** Apply a calibrated device-orientation offset without replacing touch look. */
  setGyroOffset(yaw: number, pitch: number): void {
    this.gyroYaw = Number.isFinite(yaw) ? yaw : 0;
    this.gyroPitch = Number.isFinite(pitch) ? pitch : 0;
    this.applyRotation();
  }

  /** Inject normalized touch/virtual-stick movement. x is strafe, z is forward. */
  setTouchMove(x: number, z: number): void {
    this.touchMove.x = THREE.MathUtils.clamp(Number.isFinite(x) ? x : 0, -1, 1);
    this.touchMove.z = THREE.MathUtils.clamp(Number.isFinite(z) ? z : 0, -1, 1);
  }

  /** Inject a mouse-like look delta (usually touch drag pixels). */
  rotateBy(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    const safeDx = THREE.MathUtils.clamp(dx, -160, 160);
    const safeDy = THREE.MathUtils.clamp(dy, -160, 160);
    this.yaw -= safeDx * this.lookSensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch - safeDy * this.lookSensitivity, this.minPitch, this.maxPitch);
    this.applyRotation();
  }

  update(dt: number): void {
    const delta = THREE.MathUtils.clamp(Number.isFinite(dt) ? dt : 0, 0, this.maxDelta);
    if (this.cameraHeight !== undefined) this.camera.position.y = this.cameraHeight;

    let strafe = this.touchMove.x;
    let forward = this.touchMove.z;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;

    const length = Math.hypot(strafe, forward);
    if (length > 1) { strafe /= length; forward /= length; }
    const speed = this.moveSpeed * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? this.sprintMultiplier : 1);
    if (strafe !== 0 || forward !== 0) {
      // Derive the ground-plane basis from the camera itself so movement stays
      // aligned after lookAt(), mouse turns, touch turns, or an anchored camera.
      this.movementForward.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
      this.movementForward.y = 0;
      if (this.movementForward.lengthSq() < 1e-8) {
        this.movementForward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      } else {
        this.movementForward.normalize();
      }
      this.movementRight.crossVectors(this.movementForward, GROUND_UP).normalize();

      const step = speed * delta;
      this.camera.position.addScaledVector(this.movementForward, forward * step);
      this.camera.position.addScaledVector(this.movementRight, strafe * step);
    }
    if (this.bounds) {
      this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, this.bounds.minX, this.bounds.maxX);
      this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, this.bounds.minZ, this.bounds.maxZ);
    }
  }

  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.onBlur);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerlockchange', this.onPointerLockChange);
      document.removeEventListener('mousemove', this.onMouseMove);
    }
    this.keys.clear();
    this.setTouchMove(0, 0);
  }

  private applyRotation(): void {
    const renderedPitch = THREE.MathUtils.clamp(this.pitch + this.gyroPitch, this.minPitch, this.maxPitch);
    this.camera.rotation.set(renderedPitch, this.yaw + this.gyroYaw, 0, 'YXZ');
  }
}
