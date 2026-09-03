import { describe, expect, it } from "vitest";
import { getActiveHeaderTabId, getContextualSubpages, getSidebarTabs, isSettingsSection } from "./navigation";

describe("FireGuard consolidated navigation", () => {
  it("reduces primary navigation to workflow tabs while preserving role-aware visibility", () => {
    expect(getSidebarTabs({ canReviewEvidence: false, canManageOperations: false }).map(tab => tab.id)).toEqual([
      "overview", "work", "people", "coordination", "settings", "support",
    ]);
    expect(getSidebarTabs({ canReviewEvidence: true, canManageOperations: true }).map(tab => tab.id)).toEqual([
      "overview", "work", "clients", "people", "coordination", "intelligence", "settings", "support",
    ]);
  });

  it("limits top sections to subpages belonging to the active workflow and current permission set", () => {
    const fieldPermissions = { canReviewEvidence: false, canManageOperations: false };
    const managerPermissions = { canReviewEvidence: true, canManageOperations: true };
    expect(getContextualSubpages("work", fieldPermissions).map(item => item.path)).toEqual(["/service"]);
    expect(getContextualSubpages("work", managerPermissions).map(item => item.path)).toEqual(["/service", "/reviews"]);
    expect(getContextualSubpages("clients", managerPermissions).map(item => item.path)).toEqual(["/clients", "/clients/map"]);
    expect(getContextualSubpages("coordination", fieldPermissions).map(item => item.path)).toEqual(["/chat", "/notifications"]);
    expect(getContextualSubpages("overview", managerPermissions)).toEqual([]);
  });

  it("maps detail routes to their workflow parent rather than creating duplicate primary tabs", () => {
    expect(getActiveHeaderTabId("/service/22")).toBe("work");
    expect(getActiveHeaderTabId("/reviews")).toBe("work");
    expect(getActiveHeaderTabId("/clients/map?site=19")).toBe("clients");
    expect(getActiveHeaderTabId("/notifications")).toBe("coordination");
    expect(getActiveHeaderTabId("/reports")).toBe("intelligence");
    expect(isSettingsSection("/profile")).toBe(true);
  });
});
