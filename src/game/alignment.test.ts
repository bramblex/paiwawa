import { describe, expect, it } from "vitest";

import {
  evaluateComposition,
  type CompositionInput,
  type ScreenPoint,
  type ScreenRect,
} from "./alignment";

const viewport = { width: 1200, height: 800 };

const rect = (
  left: number,
  top: number,
  right: number,
  bottom: number,
  visible = true,
): ScreenRect => ({ left, top, right, bottom, visible });

const point = (x: number, y: number, visible = true): ScreenPoint => ({
  x,
  y,
  visible,
});

const validInput = (
  overrides: Partial<CompositionInput> = {},
): CompositionInput => ({
  viewport,
  toiletSign: rect(110, 90, 690, 330),
  arrowTip: point(800, 350),
  waweiSign: rect(740, 375, 860, 495),
  ...overrides,
});

describe("evaluateComposition", () => {
  it("accepts a clean composition with both signs below the frame edge", () => {
    const result = evaluateComposition(validInput());

    expect(result.success).toBe(true);
    expect(result.reason).toBe("aligned");
    expect(result.hint).toContain("构图成立");
    expect(result.dx).toBe(0);
    expect(result.gap).toBe(25);
    expect(result.score).toBeGreaterThan(0.8);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("rejects a target that is too far to either side", () => {
    const left = evaluateComposition(
      validInput({ waweiSign: rect(540, 375, 660, 495) }),
    );
    const right = evaluateComposition(
      validInput({ waweiSign: rect(940, 375, 1060, 495) }),
    );

    expect(left.success).toBe(false);
    expect(left.reason).toBe("horizontal-misalignment");
    expect(left.dx).toBe(-200);
    expect(right.success).toBe(false);
    expect(right.reason).toBe("horizontal-misalignment");
    expect(right.dx).toBe(200);
  });

  it("accepts a moderate horizontal offset", () => {
    const result = evaluateComposition(
      validInput({ waweiSign: rect(670, 375, 790, 495) }),
    );

    expect(result.success).toBe(true);
    expect(result.dx).toBe(-70);
  });

  it("rejects WAWA when it is above or overlapping the toilet sign", () => {
    const result = evaluateComposition(
      validInput({ waweiSign: rect(740, 245, 860, 365) }),
    );

    expect(result.success).toBe(false);
    expect(result.reason).toBe("wawei-not-below");
    expect(result.hint).toContain("下方");
  });

  it("accepts a rough vertical range and rejects clearly unrelated gaps", () => {
    const tooHigh = evaluateComposition(
      validInput({ waweiSign: rect(740, 245, 860, 365) }),
    );
    const looseButValid = evaluateComposition(
      validInput({ waweiSign: rect(740, 500, 860, 620) }),
    );
    const tooLow = evaluateComposition(
      validInput({ waweiSign: rect(740, 540, 860, 660) }),
    );

    expect(tooHigh.success).toBe(false);
    expect(tooHigh.reason).toBe("wawei-not-below");
    expect(looseButValid.success).toBe(true);
    expect(tooLow.success).toBe(false);
    expect(tooLow.reason).toBe("vertical-gap");
  });

  it("rejects either sign when its visible flag is false", () => {
    const toiletHidden = evaluateComposition(
      validInput({ toiletSign: rect(110, 90, 690, 330, false) }),
    );
    const waweiHidden = evaluateComposition(
      validInput({ waweiSign: rect(740, 375, 860, 495, false) }),
    );

    expect(toiletHidden.success).toBe(false);
    expect(toiletHidden.reason).toBe("toilet-out-of-frame");
    expect(waweiHidden.success).toBe(false);
    expect(waweiHidden.reason).toBe("wawei-out-of-frame");
  });

  it("does not reject signs because their text is small", () => {
    const result = evaluateComposition(
      validInput({
        toiletSign: rect(280, 180, 340, 200),
        arrowTip: point(360, 205),
        waweiSign: rect(350, 210, 370, 230),
      }),
    );

    expect(result.success).toBe(true);
    expect(result.reason).toBe("aligned");
  });

  it("allows a partial crop but still rejects a mostly missing sign", () => {
    const partial = evaluateComposition(
      validInput({ toiletSign: rect(-200, 90, 690, 330) }),
    );
    const mostlyMissing = evaluateComposition(
      validInput({ toiletSign: rect(-650, 90, 110, 330) }),
    );

    expect(partial.success).toBe(true);
    expect(mostlyMissing.success).toBe(false);
    expect(mostlyMissing.reason).toBe("toilet-out-of-frame");
  });

  it("responds to viewport size instead of using one fixed pixel tolerance", () => {
    const smallViewportResult = evaluateComposition({
      viewport: { width: 390, height: 844 },
      toiletSign: rect(20, 120, 300, 420),
      arrowTip: point(325, 438),
      waweiSign: rect(307, 452, 378, 523),
    });
    const largeViewportResult = evaluateComposition({
      viewport: { width: 2400, height: 1400 },
      toiletSign: rect(240, 160, 1340, 500),
      arrowTip: point(1500, 530),
      waweiSign: rect(1450, 555, 1610, 715),
    });

    expect(smallViewportResult.success).toBe(true);
    expect(largeViewportResult.success).toBe(true);
  });
});
