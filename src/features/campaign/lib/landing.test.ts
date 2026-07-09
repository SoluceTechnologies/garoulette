import { describe, expect, it } from "vitest";
import { landingRotationFor, POINTER_ANGLE_DEG } from "./landing";

const norm = (deg: number) => ((deg % 360) + 360) % 360;

describe("landingRotationFor", () => {
  it("lands the wedge centre at the left pointer (270deg)", () => {
    const seg = 60; // 6 prizes
    for (let i = 0; i < 6; i++) {
      const r = landingRotationFor(i, seg, 0, 0);
      // on-screen angle of wedge centre = i*seg + r
      expect(norm(i * seg + r)).toBeCloseTo(POINTER_ANGLE_DEG, 5);
    }
  });

  it("spins forward past the current rotation", () => {
    const r = landingRotationFor(0, 60, 720, 0);
    expect(r).toBeGreaterThan(720);
  });

  it("keeps jitter within half a segment", () => {
    const seg = 60;
    const r = landingRotationFor(2, seg, 0, seg * 0.3);
    const offset = norm(2 * seg + r);
    expect(Math.abs(offset - POINTER_ANGLE_DEG)).toBeLessThanOrEqual(seg * 0.5);
  });
});
