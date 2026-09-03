import { describe, expect, it } from "vitest";
import { canonicalDirectKey, compareChatInbox, isMuted } from "./chatRules";

describe("Fireguard Chat rules", () => {
  it("creates one canonical key for either direct-conversation order", () => {
    expect(canonicalDirectKey(19, 4)).toBe("4:19");
    expect(canonicalDirectKey(4, 19)).toBe("4:19");
  });

  it("rejects a direct conversation with the same operator on both sides", () => {
    expect(() => canonicalDirectKey(7, 7)).toThrow("two distinct operators");
  });

  it("keeps pinned conversations ahead of newer unpinned conversations", () => {
    const olderPinned = { pinnedAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-02T00:00:00Z") };
    const newerUnpinned = { pinnedAt: null, updatedAt: new Date("2026-02-01T00:00:00Z") };
    expect(compareChatInbox(olderPinned, newerUnpinned)).toBeLessThan(0);
  });

  it("treats expired mute windows as unmuted", () => {
    const now = new Date("2026-08-24T10:00:00Z");
    expect(isMuted(new Date("2026-08-24T09:59:59Z"), now)).toBe(false);
    expect(isMuted(new Date("2026-08-24T10:00:01Z"), now)).toBe(true);
  });
});
