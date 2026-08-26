import type { ScreenRect, ViewportSize } from './alignment';

export const SECURITY_LEVEL_START_INDEX = 5;
export const SECURITY_INITIAL_GRACE_SECONDS = 1.5;
export const SECURITY_ENTER_DWELL_SECONDS = 0.15;
export const SECURITY_ALERT_FILL_SECONDS = 6;
export const SECURITY_EXIT_DWELL_SECONDS = 0.2;
export const SECURITY_ALERT_DECAY_SECONDS = 1.5;
export const SECURITY_ALERT_CRITICAL_RATIO = 0.72;
export const SECURITY_MAX_DELTA_SECONDS = 0.1;

interface SecurityZone {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SecurityAlertSnapshot {
  ratio: number;
  targeted: boolean;
  caught: boolean;
  graceRemaining: number;
}

const DESKTOP_ENTER_ZONE: SecurityZone = {
  minX: 0.38,
  maxX: 0.62,
  minY: 0.32,
  maxY: 0.68,
};

const MOBILE_ENTER_ZONE: SecurityZone = {
  minX: 0.25,
  maxX: 0.75,
  minY: 0.3,
  maxY: 0.7,
};

const EXIT_ZONE_EXPANSION = 0.04;
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const expandZone = (zone: SecurityZone): SecurityZone => ({
  minX: zone.minX - EXIT_ZONE_EXPANSION,
  maxX: zone.maxX + EXIT_ZONE_EXPANSION,
  minY: zone.minY - EXIT_ZONE_EXPANSION,
  maxY: zone.maxY + EXIT_ZONE_EXPANSION,
});

export const isSecurityLevel = (levelIndex: number): boolean =>
  Number.isFinite(levelIndex) && Math.trunc(levelIndex) >= SECURITY_LEVEL_START_INDEX;

export const isTargetInsideSecurityZone = (
  target: ScreenRect,
  viewport: ViewportSize,
  mobile: boolean,
  useExitZone = false,
): boolean => {
  if (
    !target.visible
    || !Number.isFinite(viewport.width)
    || !Number.isFinite(viewport.height)
    || viewport.width <= 0
    || viewport.height <= 0
  ) {
    return false;
  }

  const centerX = (target.left + target.right) / 2;
  const centerY = (target.top + target.bottom) / 2;
  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) return false;

  const enterZone = mobile ? MOBILE_ENTER_ZONE : DESKTOP_ENTER_ZONE;
  const zone = useExitZone ? expandZone(enterZone) : enterZone;
  const normalizedX = centerX / viewport.width;
  const normalizedY = centerY / viewport.height;
  return normalizedX >= zone.minX
    && normalizedX <= zone.maxX
    && normalizedY >= zone.minY
    && normalizedY <= zone.maxY;
};

export class SecurityAlertTracker {
  private ratioValue = 0;
  private targetedValue = false;
  private caughtValue = false;
  private graceRemainingValue = SECURITY_INITIAL_GRACE_SECONDS;
  private enterDwell = 0;
  private exitDwell = 0;

  constructor(private readonly mobile: boolean) {}

  get snapshot(): SecurityAlertSnapshot {
    return {
      ratio: this.ratioValue,
      targeted: this.targetedValue,
      caught: this.caughtValue,
      graceRemaining: this.graceRemainingValue,
    };
  }

  reset(): SecurityAlertSnapshot {
    this.ratioValue = 0;
    this.targetedValue = false;
    this.caughtValue = false;
    this.graceRemainingValue = SECURITY_INITIAL_GRACE_SECONDS;
    this.enterDwell = 0;
    this.exitDwell = 0;
    return this.snapshot;
  }

  update(
    target: ScreenRect,
    viewport: ViewportSize,
    deltaSeconds: number,
  ): SecurityAlertSnapshot {
    if (this.caughtValue || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return this.snapshot;
    }

    let remainingDelta = Math.min(deltaSeconds, SECURITY_MAX_DELTA_SECONDS);
    if (this.graceRemainingValue > 0) {
      const graceDelta = Math.min(this.graceRemainingValue, remainingDelta);
      this.graceRemainingValue = Math.max(0, this.graceRemainingValue - graceDelta);
      remainingDelta -= graceDelta;
      this.targetedValue = false;
      this.enterDwell = 0;
      this.exitDwell = 0;
      if (remainingDelta <= 0) return this.snapshot;
    }

    const insideEnterZone = isTargetInsideSecurityZone(target, viewport, this.mobile);
    const insideExitZone = isTargetInsideSecurityZone(target, viewport, this.mobile, true);

    if (this.targetedValue) {
      if (insideExitZone) {
        this.exitDwell = 0;
      } else {
        const requiredExitDwell = Math.max(0, SECURITY_EXIT_DWELL_SECONDS - this.exitDwell);
        const dwellDelta = Math.min(requiredExitDwell, remainingDelta);
        this.exitDwell += dwellDelta;
        remainingDelta -= dwellDelta;
        if (this.exitDwell >= SECURITY_EXIT_DWELL_SECONDS) {
          this.targetedValue = false;
          this.exitDwell = 0;
        }
      }
    } else if (insideEnterZone) {
      const requiredEnterDwell = Math.max(0, SECURITY_ENTER_DWELL_SECONDS - this.enterDwell);
      const dwellDelta = Math.min(requiredEnterDwell, remainingDelta);
      this.enterDwell += dwellDelta;
      remainingDelta -= dwellDelta;
      if (this.enterDwell >= SECURITY_ENTER_DWELL_SECONDS) {
        this.targetedValue = true;
        this.enterDwell = 0;
      }
    } else {
      this.enterDwell = 0;
    }

    if (remainingDelta > 0) {
      const change = this.targetedValue
        ? remainingDelta / SECURITY_ALERT_FILL_SECONDS
        : -remainingDelta / SECURITY_ALERT_DECAY_SECONDS;
      this.ratioValue = clamp01(this.ratioValue + change);
    }

    if (this.ratioValue >= 1) {
      this.ratioValue = 1;
      this.caughtValue = true;
      this.targetedValue = false;
    }

    return this.snapshot;
  }
}
