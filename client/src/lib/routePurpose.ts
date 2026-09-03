export type RoutePurpose = {
  path: string;
  aliases?: string[];
  title: string;
  description: string;
};

/**
 * Canonical primary-route copy. It keeps operational intent explicit without
 * duplicating the sidebar navigation model or exposing protected data.
 */
export const primaryRoutePurposes: RoutePurpose[] = [
  { path: "/", title: "Safety overview", description: "See site readiness, work underway, and the few operational items that need an owner." },
  { path: "/service", title: "Service schedule", description: "Coordinate scheduled work, field progress, evidence readiness, and review handoffs." },
  { path: "/service/:id", title: "Service workbench", description: "Complete the selected service record with its checklist, evidence, readiness, and review history." },
  { path: "/reviews", title: "Evidence review", description: "Review submitted field evidence and return clear, accountable decisions to the service workflow." },
  { path: "/clients", title: "Client portfolio", description: "Manage the accounts and managed locations that connect readiness, service work, and exceptions." },
  { path: "/clients/map", title: "Client Map", description: "Locate managed sites, inspect map readiness, and hand off to the correct operational record." },
  { path: "/academy", title: "Learn with confidence", description: "Progress through approved internal learning paths, practice checks, and visible learning status." },
  { path: "/team", aliases: ["/staff"], title: "Team supervision", description: "Monitor operator presence, routes, and arrival alerts for active operational coverage." },
  { path: "/chat", title: "FireGuard Chat", description: "Keep incident updates, handoffs, and coordination within the accountable operating workspace." },
  { path: "/notifications", title: "In-app notifications", description: "Review durable operational alerts, reminders, and exception history in one recoverable queue." },
  { path: "/exceptions", title: "Exceptions", description: "Assign, acknowledge, and track open safety gaps without losing their operational context." },
  { path: "/reports", title: "Operational reporting", description: "Prepare authorized operational exports with clear scope, dates, and current readiness context." },
  { path: "/profile", title: "Your operating profile", description: "Maintain your identity, access context, work readiness, and personal delivery settings." },
  { path: "/settings", title: "Personal preferences", description: "Choose how FireGuard delivers assignment, exception, and Academy prompts during your operational day." },
  { path: "/settings/access", title: "Access controls", description: "Review your role, access-PIN status, and permission history without exposing protected credentials." },
  { path: "/support", title: "Operational support", description: "Find the right FireGuard help path for current work, learning, or account access." },
  { path: "/access", title: "Enter operations with a role PIN", description: "Start an approved time-limited operational role session with the required access code." },
];

export function getRoutePurpose(path: string): RoutePurpose | undefined {
  const pathname = path.split("?")[0] ?? path;
  return primaryRoutePurposes.find(item => item.path === pathname)
    ?? primaryRoutePurposes.find(item => item.aliases?.includes(pathname))
    ?? (pathname.startsWith("/service/") ? primaryRoutePurposes.find(item => item.path === "/service/:id") : undefined);
}

/** Provides a short, route-specific browser title without exposing record names or protected details. */
export function getFireGuardDocumentTitle(path: string) {
  const routePurpose = getRoutePurpose(path);
  return routePurpose ? `${routePurpose.title} · FireGuard` : "FireGuard Operations · FireGuard";
}

export function getProfileRoutePurpose(path: string): RoutePurpose {
  return getRoutePurpose(path) ?? primaryRoutePurposes.find(item => item.path === "/profile")!;
}
