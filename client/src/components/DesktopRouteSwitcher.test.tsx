// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { DesktopRouteSwitcher, getRouteSwitcherDestinations } from "./DesktopRouteSwitcher";

const managerPermissions = { canReviewEvidence: true, canManageOperations: true };
const fieldPermissions = { canReviewEvidence: false, canManageOperations: false };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});

function renderSwitcher(permissions = managerPermissions) {
  const location = memoryLocation({ path: "/service", record: true });
  render(<Router hook={location.hook}><DesktopRouteSwitcher activeTabId="work" permissions={permissions} /></Router>);
  return location;
}

describe("DesktopRouteSwitcher", () => {
  it("lists only role-permitted primary and contextual routes without duplicated destinations", () => {
    const fieldRoutes = getRouteSwitcherDestinations("work", fieldPermissions);
    expect(fieldRoutes.map(route => route.path)).toEqual(["/", "/service", "/academy", "/chat", "/settings", "/support"]);
    expect(fieldRoutes.find(route => route.path === "/reviews")).toBeUndefined();
    expect(fieldRoutes.find(route => route.path === "/exceptions")).toBeUndefined();

    const managerRoutes = getRouteSwitcherDestinations("work", managerPermissions);
    expect(managerRoutes.find(route => route.path === "/reviews")?.group).toBe("Current workspace");
    expect(managerRoutes.filter(route => route.path === "/service")).toHaveLength(1);
  });

  it("opens from the keyboard shortcut, focuses search, filters, and selects a route with Enter", async () => {
    const user = userEvent.setup();
    const location = renderSwitcher();

    await user.keyboard("{Control>}k{/Control}");
    const search = screen.getByRole("combobox", { name: "FireGuard route switcher" });
    expect(document.activeElement).toBe(search);
    await user.type(search, "Evidence review");
    expect(screen.getByRole("option", { name: /Evidence review/i })).toBeTruthy();
    await user.keyboard("{Enter}");

    expect(location.history.at(-1)).toBe("/reviews");
    expect(screen.queryByRole("combobox", { name: "FireGuard route switcher" })).toBeNull();
  });

  it("does not open from the desktop shortcut on the mobile breakpoint", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const user = userEvent.setup();
    renderSwitcher();

    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("combobox", { name: "FireGuard route switcher" })).toBeNull();
  });
});
