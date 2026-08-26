import { describe, expect, it } from 'vitest';

import { relativeAimFromSamples, type DeviceOrientationSample } from './gyro-aim';

const portraitUpright = (overrides: Partial<DeviceOrientationSample> = {}): DeviceOrientationSample => ({
  alpha: 0,
  beta: 90,
  gamma: 0,
  screenAngle: 0,
  ...overrides,
});

describe('relativeAimFromSamples', () => {
  it('uses the current phone pose as a zeroed aiming baseline', () => {
    const sample = portraitUpright({ alpha: 42, beta: 77, gamma: -8 });
    const result = relativeAimFromSamples(sample, sample);
    expect(result.yaw).toBeCloseTo(0);
    expect(result.pitch).toBeCloseTo(0);
  });

  it('turns a short heading movement into a bounded relative yaw', () => {
    const result = relativeAimFromSamples(
      portraitUpright({ alpha: 350 }),
      portraitUpright({ alpha: 10 }),
    );
    expect(Math.abs(result.yaw)).toBeGreaterThan(0.1);
    expect(Math.abs(result.yaw)).toBeLessThan(Math.PI / 2);
    expect(Number.isFinite(result.pitch)).toBe(true);
  });

  it('keeps tilt changes finite in landscape calibration', () => {
    const result = relativeAimFromSamples(
      portraitUpright({ beta: 72, gamma: 4, screenAngle: 90 }),
      portraitUpright({ beta: 84, gamma: -9, screenAngle: 90 }),
    );
    expect(Number.isFinite(result.yaw)).toBe(true);
    expect(Number.isFinite(result.pitch)).toBe(true);
    expect(Math.hypot(result.yaw, result.pitch)).toBeGreaterThan(0.05);
  });
});
