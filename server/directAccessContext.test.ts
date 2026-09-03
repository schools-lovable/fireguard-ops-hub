import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  directUser: vi.fn(),
  oauthUser: vi.fn(),
}));

vi.mock("./localPinAuth", () => ({ getDirectAccessUser: mocks.directUser }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.oauthUser } }));

import { resolveContextUser } from "./_core/context";

describe("direct access context", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supplies the stable direct-access user without invoking Manus OAuth", async () => {
    const directUser = { id: 7, openId: "fireguard-role:admin", name: "FireGuard Admin", email: null, loginMethod: "role_pin", role: "admin", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    mocks.directUser.mockResolvedValue(directUser);
    await expect(resolveContextUser({} as never, true)).resolves.toEqual(directUser);
    expect(mocks.oauthUser).not.toHaveBeenCalled();
  });

  it("keeps the OAuth resolver available when direct access is disabled again", async () => {
    const oauthUser = { id: 8, openId: "manus-user", name: "OAuth User", email: null, loginMethod: "manus", role: "user", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    mocks.oauthUser.mockResolvedValue(oauthUser);
    await expect(resolveContextUser({} as never, false)).resolves.toEqual(oauthUser);
    expect(mocks.directUser).not.toHaveBeenCalled();
  });
});
