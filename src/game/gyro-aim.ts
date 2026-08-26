import * as THREE from 'three';

export type GyroAimState = 'idle' | 'requesting' | 'calibrating' | 'active' | 'denied' | 'unavailable';

export interface DeviceOrientationSample {
  alpha: number;
  beta: number;
  gamma: number;
  screenAngle: number;
}

export interface GyroAimTarget {
  setGyroOffset: (yaw: number, pitch: number) => void;
}

export interface GyroAimOptions {
  response?: number;
  sampleTimeoutMs?: number;
  onStateChange?: (state: GyroAimState) => void;
}

type PermissionAwareDeviceOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: (absolute?: boolean) => Promise<'granted' | 'denied'>;
};

const DEVICE_TO_CAMERA = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const SCREEN_NORMAL = new THREE.Vector3(0, 0, 1);

function normalizeRadians(value: number): number {
  return THREE.MathUtils.euclideanModulo(value + Math.PI, Math.PI * 2) - Math.PI;
}

function setQuaternionFromSample(
  target: THREE.Quaternion,
  euler: THREE.Euler,
  screenRotation: THREE.Quaternion,
  sample: DeviceOrientationSample,
): THREE.Quaternion {
  euler.set(
    THREE.MathUtils.degToRad(sample.beta),
    THREE.MathUtils.degToRad(sample.alpha),
    THREE.MathUtils.degToRad(-sample.gamma),
    'YXZ',
  );
  target.setFromEuler(euler);
  target.multiply(DEVICE_TO_CAMERA);
  target.multiply(screenRotation.setFromAxisAngle(SCREEN_NORMAL, -THREE.MathUtils.degToRad(sample.screenAngle)));
  return target.normalize();
}

/** Convert a pair of calibrated sensor readings into camera-local yaw and pitch offsets. */
export function relativeAimFromSamples(
  baseline: DeviceOrientationSample,
  current: DeviceOrientationSample,
): { yaw: number; pitch: number } {
  const euler = new THREE.Euler();
  const screenRotation = new THREE.Quaternion();
  const baselineQuaternion = setQuaternionFromSample(new THREE.Quaternion(), euler, screenRotation, baseline);
  const currentQuaternion = setQuaternionFromSample(new THREE.Quaternion(), euler, screenRotation, current);
  const relative = baselineQuaternion.clone().invert().multiply(currentQuaternion);
  const relativeEuler = new THREE.Euler().setFromQuaternion(relative, 'YXZ');
  return {
    yaw: normalizeRadians(relativeEuler.y),
    pitch: relativeEuler.x,
  };
}

function currentScreenAngle(): number {
  if (typeof window === 'undefined') return 0;
  const modernAngle = window.screen.orientation?.angle;
  if (Number.isFinite(modernAngle)) return THREE.MathUtils.euclideanModulo(modernAngle, 360);
  const legacyAngle = Number((window as Window & { orientation?: number }).orientation);
  return Number.isFinite(legacyAngle) ? THREE.MathUtils.euclideanModulo(legacyAngle, 360) : 0;
}

/** Relative, calibrated device-orientation aiming with touch look left intact. */
export class GyroAimControls {
  private readonly target: GyroAimTarget;
  private readonly response: number;
  private readonly sampleTimeoutMs: number;
  private readonly onStateChange?: GyroAimOptions['onStateChange'];
  private readonly sensorEuler = new THREE.Euler();
  private readonly screenRotation = new THREE.Quaternion();
  private readonly baselineQuaternion = new THREE.Quaternion();
  private readonly currentQuaternion = new THREE.Quaternion();
  private readonly baselineInverse = new THREE.Quaternion();
  private readonly relativeQuaternion = new THREE.Quaternion();
  private readonly relativeEuler = new THREE.Euler();
  private state: GyroAimState;
  private listening = false;
  private hasBaseline = false;
  private targetYaw = 0;
  private targetPitch = 0;
  private renderedYaw = 0;
  private renderedPitch = 0;
  private lastScreenAngle: number | null = null;
  private sampleTimer: number | null = null;

  private readonly onDeviceOrientation = (event: DeviceOrientationEvent): void => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!Number.isFinite(event.alpha) || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;

    const screenAngle = currentScreenAngle();
    if (this.lastScreenAngle !== null && screenAngle !== this.lastScreenAngle) {
      this.lastScreenAngle = screenAngle;
      this.recenter();
      return;
    }
    this.lastScreenAngle = screenAngle;

    setQuaternionFromSample(this.currentQuaternion, this.sensorEuler, this.screenRotation, {
      alpha: event.alpha as number,
      beta: event.beta as number,
      gamma: event.gamma as number,
      screenAngle,
    });

    if (!this.hasBaseline) {
      this.baselineQuaternion.copy(this.currentQuaternion);
      this.hasBaseline = true;
      this.clearSampleTimer();
      this.setState('active');
      return;
    }

    this.baselineInverse.copy(this.baselineQuaternion).invert();
    this.relativeQuaternion.copy(this.baselineInverse).multiply(this.currentQuaternion);
    this.relativeEuler.setFromQuaternion(this.relativeQuaternion, 'YXZ');
    this.targetYaw = normalizeRadians(this.relativeEuler.y);
    this.targetPitch = this.relativeEuler.x;
  };

  private readonly onScreenOrientationChange = (): void => this.recenter();

  private readonly onVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;
    if (!document.hidden) {
      this.recenter();
      return;
    }
    this.hasBaseline = false;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.renderedYaw = 0;
    this.renderedPitch = 0;
    this.target.setGyroOffset(0, 0);
    this.clearSampleTimer();
  };

  constructor(target: GyroAimTarget, options: GyroAimOptions = {}) {
    this.target = target;
    this.response = options.response ?? 13;
    this.sampleTimeoutMs = options.sampleTimeoutMs ?? 4000;
    this.onStateChange = options.onStateChange;
    this.state = this.detectSupport() ? 'idle' : 'unavailable';
  }

  get currentState(): GyroAimState {
    return this.state;
  }

  get isSupported(): boolean {
    return this.state !== 'unavailable';
  }

  async enable(): Promise<GyroAimState> {
    if (!this.detectSupport()) {
      this.setState('unavailable');
      return this.state;
    }
    if (this.listening) {
      this.recenter();
      return this.state;
    }

    this.setState('requesting');
    const orientationEvent = window.DeviceOrientationEvent as PermissionAwareDeviceOrientationEvent;
    const requestPermission = orientationEvent.requestPermission;
    if (typeof requestPermission === 'function') {
      try {
        const permission = await requestPermission.call(orientationEvent, false);
        if (permission !== 'granted') {
          this.setState('denied');
          return this.state;
        }
      } catch {
        this.setState('denied');
        return this.state;
      }
    }

    this.attach();
    this.recenter();
    return this.state;
  }

  recenter(): void {
    if (!this.listening) return;
    this.lastScreenAngle = currentScreenAngle();
    this.hasBaseline = false;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.renderedYaw = 0;
    this.renderedPitch = 0;
    this.target.setGyroOffset(0, 0);
    this.setState('calibrating');
    this.armSampleTimer();
  }

  update(dt: number): void {
    if (this.state !== 'active') return;
    const delta = THREE.MathUtils.clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    const response = 1 - Math.exp(-this.response * delta);
    this.renderedYaw += normalizeRadians(this.targetYaw - this.renderedYaw) * response;
    this.renderedPitch = THREE.MathUtils.lerp(this.renderedPitch, this.targetPitch, response);
    this.target.setGyroOffset(this.renderedYaw, this.renderedPitch);
  }

  dispose(): void {
    this.clearSampleTimer();
    if (this.listening && typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.onDeviceOrientation);
      window.removeEventListener('orientationchange', this.onScreenOrientationChange);
      window.screen.orientation?.removeEventListener('change', this.onScreenOrientationChange);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    this.listening = false;
    this.target.setGyroOffset(0, 0);
  }

  private detectSupport(): boolean {
    return typeof window !== 'undefined'
      && window.isSecureContext
      && typeof window.DeviceOrientationEvent !== 'undefined';
  }

  private attach(): void {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener('deviceorientation', this.onDeviceOrientation);
    window.addEventListener('orientationchange', this.onScreenOrientationChange);
    window.screen.orientation?.addEventListener('change', this.onScreenOrientationChange);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private armSampleTimer(): void {
    this.clearSampleTimer();
    this.sampleTimer = window.setTimeout(() => {
      if (!this.hasBaseline) this.setState('unavailable');
      this.sampleTimer = null;
    }, this.sampleTimeoutMs);
  }

  private clearSampleTimer(): void {
    if (this.sampleTimer === null || typeof window === 'undefined') return;
    window.clearTimeout(this.sampleTimer);
    this.sampleTimer = null;
  }

  private setState(nextState: GyroAimState): void {
    if (this.state === nextState) return;
    this.state = nextState;
    this.onStateChange?.(nextState);
  }
}
