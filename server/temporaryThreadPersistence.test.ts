import { describe, expect, it, vi } from "vitest";
import { persistTemporaryGroupChat } from "./db";

describe("persistTemporaryGroupChat", () => {
  it("writes the linked client, custom expiry, and selected membership rows", async () => {
    const conversationValues = vi.fn().mockResolvedValue([{ insertId: 64 }]);
    const memberValues = vi.fn().mockResolvedValue([{ insertId: 1 }]);
    const database = {
      insert: vi.fn()
        .mockReturnValueOnce({ values: conversationValues })
        .mockReturnValueOnce({ values: memberValues }),
    };

    const id = await persistTemporaryGroupChat(database as never, 12, {
      title: "Riverside handoff",
      contextLabel: "Riverside Tower annual service",
      clientId: 7,
      durationHours: 36,
    }, [12, 18, 21], new Date("2026-08-24T10:00:00.000Z"));

    expect(id).toBe(64);
    expect(conversationValues).toHaveBeenCalledWith(expect.objectContaining({
      title: "Riverside handoff",
      contextLabel: "Riverside Tower annual service",
      clientId: 7,
      isTemporary: true,
      expiresAt: new Date("2026-08-25T22:00:00.000Z"),
      createdByUserId: 12,
    }));
    expect(memberValues).toHaveBeenCalledWith([
      { conversationId: 64, userId: 12, role: "owner" },
      { conversationId: 64, userId: 18, role: "member" },
      { conversationId: 64, userId: 21, role: "member" },
    ]);
  });
});
