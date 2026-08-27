import type { CompositionResult, ScreenRect, ViewportSize } from './alignment';

export const GREETING_CAPTION_BONUS_POINTS = 10;

export interface ScoredPhotoResult extends CompositionResult {
  /** Composition quality converted to the game's 100-point scale. */
  basePoints: number;
  /** Extra points earned by framing a visible pedestrian greeting. */
  bonusPoints: number;
  /** Final photo score. A perfect composition with the bonus can reach 110. */
  points: number;
  /** Number of visible greeting captions found inside the captured frame. */
  capturedGreetingCount: number;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const visibleFraction = (rect: ScreenRect, viewport: ViewportSize): number => {
  const width = Math.max(0, rect.right - rect.left);
  const height = Math.max(0, rect.bottom - rect.top);
  if (!rect.visible || width === 0 || height === 0) return 0;

  const visibleWidth = Math.max(
    0,
    Math.min(rect.right, viewport.width) - Math.max(rect.left, 0),
  );
  const visibleHeight = Math.max(
    0,
    Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0),
  );
  return (visibleWidth * visibleHeight) / (width * height);
};

export const isGreetingCaptionCaptured = (rect: ScreenRect, viewport: ViewportSize): boolean =>
  Number.isFinite(viewport.width) &&
  Number.isFinite(viewport.height) &&
  viewport.width > 0 &&
  viewport.height > 0 &&
  visibleFraction(rect, viewport) >= 0.8;

export const scorePhoto = (
  composition: CompositionResult,
  greetingCaptions: readonly ScreenRect[],
  viewport: ViewportSize,
): ScoredPhotoResult => {
  const capturedGreetingCount = greetingCaptions.filter((caption) =>
    isGreetingCaptionCaptured(caption, viewport),
  ).length;
  const basePoints = Math.round(clamp(composition.score, 0, 1) * 100);
  // The greeting system only speaks one pedestrian at a time. Keep the reward
  // a single optional flourish even if future scene changes overlap captions.
  const bonusPoints = capturedGreetingCount > 0 ? GREETING_CAPTION_BONUS_POINTS : 0;

  return {
    ...composition,
    basePoints,
    bonusPoints,
    points: basePoints + bonusPoints,
    capturedGreetingCount,
  };
};
