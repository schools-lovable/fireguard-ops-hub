// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const heartbeat = vi.fn();
const sidebarTabs = [
  { id: "overview", label: "Overview", path: "/", icon: "overview" },
  { id: "work", label: "Work", path: "/service", icon: "work" },
  { id: "clients", label: "Clients", path: "/clients", icon: "clients" },
  { id: "people", label: "People", path: "/team", icon: "people" },
  { id: "coordination", label: "Coordination", path: "/chat", icon: "coordination" },
  { id: "intelligence", label: "Intelligence", path: "/reports", icon: "intelligence" },
  { id: "settings", label: "Settings", path: "/settings", icon: "settings" },
  { id: "support", label: "Support", path: "/support", icon: "support" },
];

vi.mock("wouter", () => ({ Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>, useLocation: () => ["/", vi.fn()] }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ logout: vi.fn(), loading: false }) }));
vi.mock("@/hooks/useFireguardData", () => ({ useFireguardPermissions: () => ({ data: { role: "manager", canReviewEvidence: true, canManageOperations: true } }), useFireguardWorkspace: () => ({ data: { isDemo: true } }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ fireguard: { presence: { active: { invalidate: vi.fn() } }, notifications: { list: { invalidate: vi.fn() } } } }), auth: { me: { useQuery: () => ({ data: { name: "FireGuard User" } }) } }, fireguard: { profile: { dashboard: { useQuery: () => ({ data: { preferences: { compactDensity: true } } }) } }, presence: { active: { useQuery: () => ({ data: [], isLoading: false }) }, heartbeat: { useMutation: () => ({ mutate: heartbeat }) } }, notifications: { list: { useQuery: () => ({ data: [], isLoading: false, error: null }) }, markRead: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } } }));
vi.mock("@shared/accessMode", () => ({ FIREGUARD_DIRECT_ACCESS: true }));
vi.mock("@shared/navigation", () => ({ getSidebarTabs: () => sidebarTabs, getActiveHeaderTabId: () => "overview", getContextualSubpages: () => [] }));
vi.mock("@/components/DemoEnvironmentBanner", () => ({ DemoEnvironmentBanner: () => null }));
vi.mock("@/components/DesktopRouteSwitcher", () => ({ DesktopRouteSwitcher: () => null }));
vi.mock("@/components/NotificationDropdown", () => ({ NotificationDropdown: () => null }));
vi.mock("@/components/ui/dialog", () => ({ Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>, DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p> }));
vi.mock("@/components/ui/dropdown-menu", () => ({ DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>, DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>, DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, DropdownMenuSeparator: () => <hr />, DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { FireGuardShell } from "./FireGuardShell";

afterEach(cleanup);

describe("FireGuardShell sidebar scroll structure", () => {
  it("renders a focusable desktop rail menu and a separate mobile navigation with every visible workspace link", () => {
    const { container } = render(<FireGuardShell><div>Workspace</div></FireGuardShell>);
    const desktopMenu = container.querySelector(".fg-rail .rail-menu");
    const mobileMenu = container.querySelector(".fg-mobile-nav");

    expect(desktopMenu?.getAttribute("tabindex")).toBe("0");
    expect(desktopMenu?.querySelectorAll("a")).toHaveLength(sidebarTabs.length - 1);
    expect(mobileMenu?.querySelectorAll("a")).toHaveLength(sidebarTabs.length);
    expect(container.querySelectorAll(".fg-rail a")).toHaveLength(sidebarTabs.length + 1);
    expect(container.querySelector(".fg-rail .rail-bottom .rail-link-support")).toBeTruthy();
    expect(container.querySelector(".fg-shell")?.classList.contains("is-compact-density")).toBe(true);
  });

  it("keeps the constrained-height desktop rail menu keyboard-reachable with an independent scroll offset", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 500 });
    const { container } = render(<FireGuardShell><div>Workspace</div></FireGuardShell>);
    const rail = container.querySelector<HTMLElement>(".fg-rail");
    const menu = container.querySelector<HTMLElement>(".fg-rail .rail-menu");

    expect(rail).toBeTruthy();
    expect(menu).toBeTruthy();
    expect(rail!.classList.contains("fg-rail")).toBe(true);
    expect(rail!.style.position).toBe("sticky");
    expect(rail!.style.height).toBe("calc(100dvh - 48px)");
    expect(menu!.style.overflowY).toBe("auto");
    expect(menu!.style.overscrollBehavior).toBe("contain");
    menu!.focus();
    expect(document.activeElement).toBe(menu);
    Object.defineProperties(menu!, { clientHeight: { configurable: true, value: 260 }, scrollHeight: { configurable: true, value: 520 } });
    menu!.scrollTop = 88;
    expect(menu!.scrollTop).toBe(88);
  });

  it("shows only the relevant restrained fade at the hidden edge of the desktop and tablet menu", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    const { container } = render(<FireGuardShell><div>Workspace</div></FireGuardShell>);
    const menu = container.querySelector<HTMLElement>(".fg-rail .rail-menu");
    const topFade = container.querySelector<HTMLElement>(".rail-scroll-fade.is-top");
    const bottomFade = container.querySelector<HTMLElement>(".rail-scroll-fade.is-bottom");
    Object.defineProperties(menu!, { clientHeight: { configurable: true, value: 220 }, scrollHeight: { configurable: true, value: 520 } });

    menu!.scrollTop = 0;
    fireEvent.scroll(menu!);
    expect(topFade?.classList.contains("is-visible")).toBe(false);
    expect(bottomFade?.classList.contains("is-visible")).toBe(true);

    menu!.scrollTop = 300;
    fireEvent.scroll(menu!);
    expect(topFade?.classList.contains("is-visible")).toBe(true);
    expect(bottomFade?.classList.contains("is-visible")).toBe(false);
  });
});
