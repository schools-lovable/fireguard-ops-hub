/** FireGuard presence tests protect the explicit five-minute active-session boundary. */
import { describe, expect, it } from "vitest";
import { PRESENCE_WINDOW_MS, isRecentlyActive, managerWantsPresenceAlert, presenceCutoff } from "./presence";

describe("FireGuard user presence", () => {
  const now = new Date("2026-08-23T22:00:00.000Z");

  it("includes users seen within the active presence window", () => {
    expect(isRecentlyActive(new Date(now.getTime() - PRESENCE_WINDOW_MS + 1), now)).toBe(true);
    expect(isRecentlyActive(new Date(now.getTime() - PRESENCE_WINDOW_MS), now)).toBe(true);
  });

  it("excludes users after the presence window has elapsed", () => {
    expect(isRecentlyActive(new Date(now.getTime() - PRESENCE_WINDOW_MS - 1), now)).toBe(false);
    expect(isRecentlyActive(null, now)).toBe(false);
    expect(presenceCutoff(now).toISOString()).toBe("2026-08-23T21:55:00.000Z");
  });

  it("only routes opt-in arrival alerts for field and reviewer roles", () => {
    expect(managerWantsPresenceAlert("field", { alertFieldTeam: true, alertReviewers: false })).toBe(true);
    expect(managerWantsPresenceAlert("reviewer", { alertFieldTeam: true, alertReviewers: false })).toBe(false);
    expect(managerWantsPresenceAlert("reviewer", { alertFieldTeam: false, alertReviewers: true })).toBe(true);
    expect(managerWantsPresenceAlert("manager", { alertFieldTeam: true, alertReviewers: true })).toBe(false);
  });
});
