import { describe, expect, it } from "vitest";
import { getRoleForSignInPin, legacyPinRoles, pinEnvironmentKey } from "./localPinAuth";

describe("FireGuard role-PIN secret configuration", () => {
  it("accepts each supplied role PIN and rejects a nonmatching attempt", () => {
    for (const role of legacyPinRoles) {
      const configuredPin = process.env[pinEnvironmentKey(role)];
      expect(configuredPin).toMatch(/^\d{4,12}$/);
      expect(getRoleForSignInPin(configuredPin!, role)).toBe(role);
      expect(getRoleForSignInPin(`${configuredPin!}0`, role)).toBeNull();
    }
  });
});
