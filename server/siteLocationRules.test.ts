import { describe, expect, it } from "vitest";
import { assertValidCoordinates, coordinateQualityNotice } from "./siteLocationRules";

describe("site location rules", () => {
  it("accepts valid coordinates and rejects impossible GPS input", () => {
    expect(() => assertValidCoordinates(-1.9441, 30.0619, 12)).not.toThrow();
    expect(() => assertValidCoordinates(-91, 30)).toThrow("Latitude");
    expect(() => assertValidCoordinates(-1, 181)).toThrow("Longitude");
    expect(() => assertValidCoordinates(-1, 30, -2)).toThrow("accuracy");
  });

  it("flags low-trust or out-of-region pins without blocking capture", () => {
    expect(coordinateQualityNotice(-1.9441, 30.0619, 12)).toEqual([]);
    expect(coordinateQualityNotice(-1.9441, 30.0619, 130)[0]).toContain("accuracy");
    expect(coordinateQualityNotice(51.5, -0.12, 8)[0]).toContain("outside");
  });
});
