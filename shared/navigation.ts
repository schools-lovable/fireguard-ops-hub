/**
 * FireGuard navigation model.
 *
 * The sidebar exposes only primary workflows. The top section bar is reserved
 * for routes within the currently active workflow, never a duplicate app-wide
 * navigation layer.
 */
export type NavigationPermissions = {
  canReviewEvidence: boolean;
  canManageOperations: boolean;
};

export type HeaderTab = {
  id: "overview" | "work" | "clients" | "people" | "coordination" | "intelligence" | "settings" | "support";
  label: string;
  path: string;
  icon: "overview" | "work" | "clients" | "people" | "coordination" | "intelligence" | "settings" | "support";
  requires?: "review" | "manage";
};

export type ContextualSubpage = {
  label: string;
  path: string;
  requires?: "review" | "manage";
};

export const headerTabs: HeaderTab[] = [
  { id: "overview", label: "Overview", path: "/", icon: "overview" },
  { id: "work", label: "Work", path: "/service", icon: "work" },
  { id: "clients", label: "Clients", path: "/clients", icon: "clients", requires: "review" },
  { id: "people", label: "People", path: "/academy", icon: "people" },
  { id: "coordination", label: "Coordination", path: "/chat", icon: "coordination" },
  { id: "intelligence", label: "Intelligence", path: "/exceptions", icon: "intelligence", requires: "manage" },
  { id: "settings", label: "Settings", path: "/settings", icon: "settings" },
  { id: "support", label: "Support", path: "/support", icon: "support" },
];

export const settingsSubpages: ContextualSubpage[] = [
  { label: "Profile & work", path: "/profile" },
  { label: "Access & PIN", path: "/settings/access", requires: "manage" },
  { label: "Preferences", path: "/settings" },
];

export const contextualSubpages: Partial<Record<HeaderTab["id"], ContextualSubpage[]>> = {
  work: [
    { label: "Service schedule", path: "/service" },
    { label: "Evidence review", path: "/reviews", requires: "review" },
  ],
  clients: [
    { label: "Client portfolio", path: "/clients" },
    { label: "Client map", path: "/clients/map" },
  ],
  people: [
    { label: "Academy", path: "/academy" },
    { label: "Team", path: "/team", requires: "manage" },
  ],
  coordination: [
    { label: "Team chat", path: "/chat" },
    { label: "Exception centre", path: "/notifications" },
  ],
  intelligence: [
    { label: "Risk queue", path: "/exceptions", requires: "manage" },
    { label: "Reports", path: "/reports", requires: "manage" },
  ],
  settings: settingsSubpages,
};

function isPermitted(item: { requires?: "review" | "manage" }, permissions: NavigationPermissions) {
  if (item.requires === "review") return permissions.canReviewEvidence || permissions.canManageOperations;
  if (item.requires === "manage") return permissions.canManageOperations;
  return true;
}

export function getHeaderTabs(permissions: NavigationPermissions): HeaderTab[] {
  return headerTabs.filter(tab => isPermitted(tab, permissions));
}

/** The sidebar is the sole desktop primary navigation, filtered by role. */
export function getSidebarTabs(permissions: NavigationPermissions): HeaderTab[] {
  return getHeaderTabs(permissions);
}

/** Top section buttons are limited to visible routes inside the active primary workflow. */
export function getContextualSubpages(mainTabId: HeaderTab["id"], permissions: NavigationPermissions): ContextualSubpage[] {
  return (contextualSubpages[mainTabId] ?? []).filter(item => isPermitted(item, permissions));
}

const routePrefixes: Record<HeaderTab["id"], string[]> = {
  overview: ["/"],
  work: ["/service", "/reviews"],
  clients: ["/clients"],
  people: ["/academy", "/team", "/staff"],
  coordination: ["/chat", "/notifications"],
  intelligence: ["/exceptions", "/reports"],
  settings: ["/profile", "/settings"],
  support: ["/support"],
};

export function getActiveHeaderTabId(path: string): HeaderTab["id"] {
  const pathname = path.split("?")[0] ?? path;
  for (const tab of headerTabs) {
    if (routePrefixes[tab.id].some(prefix => prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`))) return tab.id;
  }
  return "overview";
}

export function isSettingsSection(path: string) {
  return getActiveHeaderTabId(path) === "settings";
}
