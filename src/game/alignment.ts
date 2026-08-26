/**
 * Screen-space rules for the toilet-sign photography puzzle.
 *
 * This module deliberately knows nothing about Three.js. The game projects
 * its world-space landmarks to pixels, then passes those pixels here. Keeping
 * the rules in a small pure function makes them easy to test and tune without
 * a renderer or a browser.
 */

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
  visible: boolean;
}

export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  visible: boolean;
}

export interface CompositionInput {
  viewport: ViewportSize;
  toiletSign: ScreenRect;
  arrowTip: ScreenPoint;
  waweiSign: ScreenRect;
}

export type CompositionFailure =
  | "invalid-viewport"
  | "toilet-out-of-frame"
  | "wawei-out-of-frame"
  | "arrow-not-visible"
  | "wawei-not-below"
  | "horizontal-misalignment"
  | "vertical-gap";

export interface CompositionResult {
  /** True only when all composition rules are satisfied. */
  success: boolean;
  /** A continuous quality estimate, always clamped to [0, 1]. */
  score: number;
  /** Stable machine-readable reason for the first blocking rule. */
  reason: "aligned" | CompositionFailure;
  /** Short Chinese copy suitable for the HUD after pressing the shutter. */
  hint: string;
  /** WAWA center x minus arrow-tip x, in screen pixels. */
  dx: number;
  /** WAWA top y minus arrow-tip y, in screen pixels. */
  gap: number;
}

interface NormalizedRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface Thresholds {
  minimumVisibleFraction: number;
  horizontalTolerance: number;
  minimumGap: number;
  maximumGap: number;
}

interface GeometryChecks {
  toilet: NormalizedRect;
  wawei: NormalizedRect;
  toiletVisibleFraction: number;
  waweiVisibleFraction: number;
  thresholds: Thresholds;
  dx: number;
  gap: number;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const COMPARISON_EPSILON = 0.5;

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const normalizeRect = (rect: ScreenRect): NormalizedRect | null => {
  if (
    !isFiniteNumber(rect.left) ||
    !isFiniteNumber(rect.top) ||
    !isFiniteNumber(rect.right) ||
    !isFiniteNumber(rect.bottom)
  ) {
    return null;
  }

  const left = Math.min(rect.left, rect.right);
  const right = Math.max(rect.left, rect.right);
  const top = Math.min(rect.top, rect.bottom);
  const bottom = Math.max(rect.top, rect.bottom);
  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { left, top, right, bottom, width, height };
};

const visibleFraction = (
  rect: NormalizedRect,
  viewport: ViewportSize,
): number => {
  const visibleWidth = Math.max(
    0,
    Math.min(rect.right, viewport.width) - Math.max(rect.left, 0),
  );
  const visibleHeight = Math.max(
    0,
    Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0),
  );
  return (visibleWidth * visibleHeight) / (rect.width * rect.height);
};

/**
 * Derive all tolerances from the current viewport and the projected sign
 * sizes. This keeps a phone-sized scene from inheriting desktop pixel rules,
 * while still preventing tiny distant signs from counting as readable.
 */
const getThresholds = (
  viewport: ViewportSize,
  wawei: NormalizedRect,
): Thresholds => {
  const shortestEdge = Math.min(viewport.width, viewport.height);

  return {
    // Half-visible is enough for the visual joke; size/readability is not part
    // of success, so distant signs remain valid targets.
    minimumVisibleFraction: 0.5,
    // Treat the whole upper area around WAWA as a valid target instead of
    // requiring its center to sit on one narrow pixel column.
    horizontalTolerance: clamp(
      wawei.width * 0.78,
      Math.max(24, shortestEdge * 0.045),
      Math.max(72, viewport.width * 0.1),
    ),
    // The arrow may overlap the top of WAWA slightly and may also sit some
    // distance above it. Only clearly unrelated vertical placements fail.
    minimumGap: -Math.min(12, wawei.height * 0.15),
    maximumGap: Math.max(
      72,
      wawei.height * 1.4,
      shortestEdge * 0.18,
    ),
  };
};

const makeBaseResult = (
  reason: "aligned" | CompositionFailure,
  hint: string,
  dx = 0,
  gap = 0,
  score = 0,
): CompositionResult => ({
  success: reason === "aligned",
  score: clamp(score, 0, 1),
  reason,
  hint,
  dx,
  gap,
});

const buildGeometryChecks = (
  input: CompositionInput,
  toilet: NormalizedRect,
  wawei: NormalizedRect,
): GeometryChecks => {
  const thresholds = getThresholds(input.viewport, wawei);
  const waweiCenterX = (wawei.left + wawei.right) / 2;

  return {
    toilet,
    wawei,
    toiletVisibleFraction: visibleFraction(toilet, input.viewport),
    waweiVisibleFraction: visibleFraction(wawei, input.viewport),
    thresholds,
    dx: isFiniteNumber(input.arrowTip.x)
      ? waweiCenterX - input.arrowTip.x
      : 0,
    gap: isFiniteNumber(input.arrowTip.y)
      ? wawei.top - input.arrowTip.y
      : 0,
  };
};

/**
 * Evaluate one shutter press.
 *
 * Coordinates use browser pixel space: x increases rightward and y increases
 * downward. The caller should pass the projected rectangles in CSS pixels,
 * matching the viewport dimensions supplied in the same input.
 */
export function evaluateComposition(input: CompositionInput): CompositionResult {
  const { viewport, toiletSign, arrowTip, waweiSign } = input;

  if (
    !isFiniteNumber(viewport.width) ||
    !isFiniteNumber(viewport.height) ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    return makeBaseResult(
      "invalid-viewport",
      "取景框还没有准备好，请稍后再试。",
    );
  }

  const toilet = normalizeRect(toiletSign);
  if (!toilet) {
    return makeBaseResult(
      "toilet-out-of-frame",
      "先把厕所路牌放进画面里。",
    );
  }
  const wawei = normalizeRect(waweiSign);
  if (!wawei) {
    return makeBaseResult(
      "wawei-out-of-frame",
      "先把楼顶的 WAWA 牌放进画面里。",
    );
  }

  const geometry = buildGeometryChecks(input, toilet, wawei);
  const {
    thresholds,
    toiletVisibleFraction,
    waweiVisibleFraction,
    dx,
    gap,
  } = geometry;

  if (!toiletSign.visible || toiletVisibleFraction < thresholds.minimumVisibleFraction) {
    return makeBaseResult(
      "toilet-out-of-frame",
      "先把厕所路牌完整放进画面里。",
      dx,
      gap,
      0.16 * toiletVisibleFraction,
    );
  }

  if (!waweiSign.visible || waweiVisibleFraction < thresholds.minimumVisibleFraction) {
    return makeBaseResult(
      "wawei-out-of-frame",
      "楼顶的 WAWA 牌还没有完整入镜。",
      dx,
      gap,
      0.16 * waweiVisibleFraction,
    );
  }

  if (
    !arrowTip.visible ||
    !isFiniteNumber(arrowTip.x) ||
    !isFiniteNumber(arrowTip.y)
  ) {
    return makeBaseResult(
      "arrow-not-visible",
      "厕所牌的箭头尖端没有入镜。",
      dx,
      gap,
      0.34,
    );
  }

  // WAWA still needs to read below the toilet sign, while a few pixels of
  // perspective overlap remain acceptable.
  const allowedOverlap = Math.min(12, wawei.height * 0.15);
  const belowSign = wawei.top + COMPARISON_EPSILON >= toilet.bottom - allowedOverlap;
  if (!belowSign) {
    const belowScore = clamp(
      (wawei.top - toilet.top) / Math.max(toilet.height, 1),
      0,
      1,
    );
    return makeBaseResult(
      "wawei-not-below",
      "让 WAWA 再落到厕所路牌的下方。",
      dx,
      gap,
      0.42 + 0.08 * belowScore,
    );
  }

  const horizontalScore = clamp(
    1 - Math.abs(dx) / thresholds.horizontalTolerance,
    0,
    1,
  );
  if (Math.abs(dx) > thresholds.horizontalTolerance + COMPARISON_EPSILON) {
    return makeBaseResult(
      "horizontal-misalignment",
      "把 WAWA 大致移到向下箭头的下方。",
      dx,
      gap,
      0.56 + 0.19 * horizontalScore,
    );
  }

  const gapScore = clamp(
    gap < thresholds.minimumGap
      ? gap / Math.max(thresholds.minimumGap, 1)
      : gap > thresholds.maximumGap
        ? 1 - (gap - thresholds.maximumGap) / thresholds.maximumGap
        : 1,
    0,
    1,
  );
  if (
    gap < thresholds.minimumGap - COMPARISON_EPSILON ||
    gap > thresholds.maximumGap + COMPARISON_EPSILON
  ) {
    const hint =
      gap < thresholds.minimumGap
        ? "让 WAWA 和箭头尖端之间留一条细小的缝。"
        : "WAWA 离箭头太远了，再往上靠近一点。";
    return makeBaseResult(
      "vertical-gap",
      hint,
      dx,
      gap,
      0.75 + 0.15 * gapScore,
    );
  }

  // A successful composition rewards both the geometric fit and a clean
  // presentation, while still leaving a useful score for near misses.
  const cleanFrameScore =
    0.5 * clamp(toiletVisibleFraction, 0, 1) +
    0.5 * clamp(waweiVisibleFraction, 0, 1);
  const score = clamp(
    0.82 +
      0.12 * horizontalScore +
      0.04 * gapScore +
      0.02 * cleanFrameScore,
    0,
    1,
  );

  return makeBaseResult(
    "aligned",
    "构图成立：箭头指向 WAWA。",
    dx,
    gap,
    score,
  );
}
