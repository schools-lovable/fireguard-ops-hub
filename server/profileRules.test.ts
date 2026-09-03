import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { certificationExpiryState, isValidProfilePin, profileRoleTitle } from "./profileRules";
import type { TrpcContext } from "./_core/context";

function createFieldContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "profile-test-user",
      name: "Profile test operator",
      email: "profile@example.com",
      loginMethod: "test",
      role: "field",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      lastSignedIn: new Date("2026-08-01T00:00:00.000Z"),
      lastActiveAt: null,
      currentRoute: null,
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("profile access and readiness rules", () => {
  it("accepts only a four-to-six digit access PIN", () => {
    expect(isValidProfilePin("4816")).toBe(true);
    expect(isValidProfilePin("481690")).toBe(true);
    expect(isValidProfilePin("481")).toBe(false);
    expect(isValidProfilePin("48ab")).toBe(false);
    expect(isValidProfilePin("4816902")).toBe(false);
  });

  it("maps roles to an operator-facing title without elevating unknown roles", () => {
    expect(profileRoleTitle("manager")).toBe("Operations manager");
    expect(profileRoleTitle("unexpected")).toBe("FireGuard operator");
  });

  it("flags expired and soon-expiring certifications predictably", () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    expect(certificationExpiryState(new Date("2026-08-23T12:00:00.000Z"), now)).toMatchObject({ tone: "risk", label: "Expired" });
    expect(certificationExpiryState(new Date("2026-09-20T12:00:00.000Z"), now)).toMatchObject({ tone: "warning", label: "27d remaining" });
    expect(certificationExpiryState(new Date("2026-11-01T12:00:00.000Z"), now)).toMatchObject({ tone: "good", label: "Current" });
  });

  it("rejects an invalid PIN at the protected procedure boundary before persistence", async () => {
    const caller = appRouter.createCaller(createFieldContext());
    await expect(caller.fireguard.profile.resetPin({ pin: "not-a-pin" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks a non-administrator from changing a FireGuard role", async () => {
    const caller = appRouter.createCaller(createFieldContext());
    await expect(caller.fireguard.profile.updateRole({ role: "manager" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
