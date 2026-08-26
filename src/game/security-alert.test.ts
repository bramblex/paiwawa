import { describe, expect, it } from 'vitest';

import type { ScreenRect, ViewportSize } from './alignment';
import {
  SECURITY_ALERT_DECAY_SECONDS,
  SECURITY_ALERT_FILL_SECONDS,
  SECURITY_ENTER_DWELL_SECONDS,
  SECURITY_EXIT_DWELL_SECONDS,
  SECURITY_INITIAL_GRACE_SECONDS,
  SecurityAlertTracker,
  isSecurityLevel,
  isTargetInsideSecurityZone,
} from './security-alert';

const viewport: ViewportSize = { width: 1000, height: 600 };
const centeredTarget: ScreenRect = {
  left: 470,
  right: 530,
  top: 270,
  bottom: 330,
  visible: true,
};
const outsideTarget: ScreenRect = {
  left: 40,
  right: 100,
  top: 270,
  bottom: 330,
  visible: true,
};

const advanceFor = (
  tracker: SecurityAlertTracker,
  target: ScreenRect,
  seconds: number,
): ReturnType<SecurityAlertTracker['update']> => {
  let remaining = seconds;
  let snapshot = tracker.snapshot;
  while (remaining > 0.000001) {
    const delta = Math.min(0.05, remaining);
    snapshot = tracker.update(target, viewport, delta);
    remaining -= delta;
  }
  return snapshot;
};

describe('security alert mechanic', () => {
  it('enables surveillance only for the final five levels', () => {
    expect(isSecurityLevel(4)).toBe(false);
    expect(isSecurityLevel(5)).toBe(true);
    expect(isSecurityLevel(9)).toBe(true);
  });

  it('uses responsive enter zones and a wider exit hysteresis zone', () => {
    const mobileOnlyTarget = {
      left: 280,
      right: 300,
      top: 290,
      bottom: 310,
      visible: true,
    };
    const desktopExitOnlyTarget = {
      left: 350,
      right: 370,
      top: 290,
      bottom: 310,
      visible: true,
    };

    expect(isTargetInsideSecurityZone(centeredTarget, viewport, false)).toBe(true);
    expect(isTargetInsideSecurityZone(mobileOnlyTarget, viewport, false)).toBe(false);
    expect(isTargetInsideSecurityZone(mobileOnlyTarget, viewport, true)).toBe(true);
    expect(isTargetInsideSecurityZone(desktopExitOnlyTarget, viewport, false)).toBe(false);
    expect(isTargetInsideSecurityZone(desktopExitOnlyTarget, viewport, false, true)).toBe(true);
  });

  it('rejects invisible targets and invalid projection data', () => {
    expect(isTargetInsideSecurityZone({ ...centeredTarget, visible: false }, viewport, false)).toBe(false);
    expect(isTargetInsideSecurityZone({ ...centeredTarget, left: Number.NaN }, viewport, false)).toBe(false);
    expect(isTargetInsideSecurityZone(centeredTarget, { width: 0, height: 600 }, false)).toBe(false);
  });

  it('waits through the initial grace period and stable aim dwell', () => {
    const tracker = new SecurityAlertTracker(false);

    expect(advanceFor(tracker, centeredTarget, SECURITY_INITIAL_GRACE_SECONDS).ratio).toBe(0);
    expect(advanceFor(tracker, centeredTarget, SECURITY_ENTER_DWELL_SECONDS - 0.01).targeted).toBe(false);

    const armed = advanceFor(tracker, centeredTarget, 0.02);
    expect(armed.targeted).toBe(true);
    expect(armed.ratio).toBeGreaterThan(0);
  });

  it('fills in six aimed seconds after arming', () => {
    const tracker = new SecurityAlertTracker(false);
    advanceFor(tracker, centeredTarget, SECURITY_INITIAL_GRACE_SECONDS + SECURITY_ENTER_DWELL_SECONDS);

    const almostCaught = advanceFor(tracker, centeredTarget, SECURITY_ALERT_FILL_SECONDS - 0.01);
    expect(almostCaught.ratio).toBeGreaterThan(0.99);
    expect(almostCaught.caught).toBe(false);

    const caught = advanceFor(tracker, centeredTarget, 0.02);
    expect(caught.ratio).toBe(1);
    expect(caught.caught).toBe(true);
  });

  it('requires a short exit dwell, then decays to zero', () => {
    const tracker = new SecurityAlertTracker(false);
    advanceFor(tracker, centeredTarget, SECURITY_INITIAL_GRACE_SECONDS + SECURITY_ENTER_DWELL_SECONDS + 1.5);
    const aimedRatio = tracker.snapshot.ratio;

    const stillTargeted = advanceFor(tracker, outsideTarget, SECURITY_EXIT_DWELL_SECONDS - 0.01);
    expect(stillTargeted.targeted).toBe(true);
    expect(stillTargeted.ratio).toBeCloseTo(aimedRatio, 5);

    const leftTarget = advanceFor(tracker, outsideTarget, 0.02);
    expect(leftTarget.targeted).toBe(false);
    expect(leftTarget.ratio).toBeLessThan(aimedRatio);

    expect(advanceFor(tracker, outsideTarget, SECURITY_ALERT_DECAY_SECONDS).ratio).toBe(0);
  });

  it('latches caught state until reset', () => {
    const tracker = new SecurityAlertTracker(true);
    advanceFor(
      tracker,
      centeredTarget,
      SECURITY_INITIAL_GRACE_SECONDS + SECURITY_ENTER_DWELL_SECONDS + SECURITY_ALERT_FILL_SECONDS + 0.1,
    );
    const caught = tracker.snapshot;

    expect(caught.caught).toBe(true);
    expect(advanceFor(tracker, outsideTarget, 8)).toEqual(caught);

    const reset = tracker.reset();
    expect(reset).toEqual({
      ratio: 0,
      targeted: false,
      caught: false,
      graceRemaining: SECURITY_INITIAL_GRACE_SECONDS,
    });
  });

  it('ignores invalid deltas without changing state', () => {
    const tracker = new SecurityAlertTracker(false);
    const initial = tracker.snapshot;
    expect(tracker.update(centeredTarget, viewport, Number.NaN)).toEqual(initial);
    expect(tracker.update(centeredTarget, viewport, -1)).toEqual(initial);
  });
});
