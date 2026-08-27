import { describe, expect, it } from 'vitest';

import type { CompositionResult, ScreenRect } from './alignment';
import {
  GREETING_CAPTION_BONUS_POINTS,
  isGreetingCaptionCaptured,
  scorePhoto,
} from './photo-score';

const viewport = { width: 1200, height: 800 };

const composition = (score: number, success = true): CompositionResult => ({
  success,
  score,
  reason: success ? 'aligned' : 'horizontal-misalignment',
  hint: success ? '构图成立：箭头指向 WAWA。' : '左右移动，让箭头尖端更靠近 WAWA。',
  dx: 0,
  gap: 20,
});

const caption = (overrides: Partial<ScreenRect> = {}): ScreenRect => ({
  left: 420,
  top: 180,
  right: 700,
  bottom: 250,
  visible: true,
  ...overrides,
});

describe('photo score', () => {
  it('awards ten extra points when most of a visible 遥遥领先 caption is captured', () => {
    const result = scorePhoto(composition(0.91), [caption()], viewport);

    expect(result.basePoints).toBe(91);
    expect(result.bonusPoints).toBe(GREETING_CAPTION_BONUS_POINTS);
    expect(result.points).toBe(101);
    expect(result.capturedGreetingCount).toBe(1);
  });

  it('does not award a caption that is hidden or mostly outside the photo', () => {
    expect(isGreetingCaptionCaptured(caption({ visible: false }), viewport)).toBe(false);
    expect(isGreetingCaptionCaptured(caption({ left: -250, right: 50 }), viewport)).toBe(false);

    const result = scorePhoto(
      composition(0.72, false),
      [caption({ visible: false }), caption({ left: -250, right: 50 })],
      viewport,
    );
    expect(result.bonusPoints).toBe(0);
    expect(result.points).toBe(72);
    expect(result.success).toBe(false);
  });

  it('caps the reward at one bonus even if multiple captions overlap', () => {
    const result = scorePhoto(
      composition(1),
      [caption(), caption({ top: 300, bottom: 370 })],
      viewport,
    );

    expect(result.capturedGreetingCount).toBe(2);
    expect(result.points).toBe(110);
    expect(result.bonusPoints).toBe(10);
  });
});
