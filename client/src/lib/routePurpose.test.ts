import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileRouteHeader } from "@/components/ProfileRouteHeader";
import { getProfileRoutePurpose, primaryRoutePurposes } from "./routePurpose";

describe("FireGuard primary route purposes", () => {
  it("keeps each audited primary route uniquely titled and outcome-oriented", () => {
    expect(primaryRoutePurposes).toHaveLength(17);
    expect(new Set(primaryRoutePurposes.map(route => route.path)).size).toBe(primaryRoutePurposes.length);
    expect(new Set(primaryRoutePurposes.map(route => route.title)).size).toBe(primaryRoutePurposes.length);
    primaryRoutePurposes.forEach(route => expect(route.description.length).toBeGreaterThan(45));
  });

  it("covers every canonical route in the application table", () => {
    const applicationRoutes = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    primaryRoutePurposes.flatMap(route => [route.path, ...(route.aliases ?? [])]).forEach(path => expect(applicationRoutes).toContain(`path="${path}"`));
  });

  it("keeps each audited page module aligned with its visible heading and operational-purpose copy", () => {
    const expectations = [
      ["Dashboard.tsx", ["Safety overview", "Live data flow using clearly labelled FireGuard demonstration records"]],
      ["Service.tsx", ["Service schedule", "Work-order state is persisted as field teams start work"]],
      ["ServiceDetail.tsx", ["workOrder.reference", "Complete the asset checklist, capture paired evidence"]],
      ["Reviews.tsx", ["Evidence review", "Only reviewers, managers, and administrators can approve"]],
      ["Clients.tsx", ["Client portfolio", "Live account and site records feed every readiness"]],
      ["ClientMap.tsx", ["Client Map", "A readiness-aware site map with trusted GPS"]],
      ["Academy.tsx", ["Learn with confidence", "A replacement Academy workspace for training staff"]],
      ["Staff.tsx", ["Team supervision", "Live operator presence pairs current routes"]],
      ["Chat.tsx", ["Fireguard Chat", "Keep incident updates, handoffs, and on-site coordination"]],
      ["Notifications.tsx", ["In-app notifications", "A durable alert history for exception ownership"]],
      ["Exceptions.tsx", ["Exceptions", "Live safety gaps are assigned, acknowledged"]],
      ["Reports.tsx", ["Operational reporting", "Generate CSV exports directly from current FireGuard records"]],
      ["ProfileRouteHeader.tsx", ["getProfileRoutePurpose", "path.startsWith(\"/settings\")"]],
      ["Support.tsx", ["Operational support", "Use the right FireGuard resource"]],
      ["RolePinAccess.tsx", ["Enter operations with a role PIN", "Choose the shared operational role approved for this session"]],
    ] as const;

    expectations.forEach(([file, snippets]) => {
      const source = readFileSync(resolve(process.cwd(), "client/src", file === "ProfileRouteHeader.tsx" ? `components/${file}` : `pages/${file}`), "utf8");
      snippets.forEach(snippet => expect(source).toContain(snippet));
    });
  });

  it("uses route-specific headings for the profile, preferences, and access workspaces", () => {
    expect(getProfileRoutePurpose("/profile").title).toBe("Your operating profile");
    expect(getProfileRoutePurpose("/settings?tab=preferences").title).toBe("Personal preferences");
    expect(getProfileRoutePurpose("/settings/access").title).toBe("Access controls");
  });

  it("renders the delegated Settings headings and descriptions through the shared header component", () => {
    const preferences = renderToStaticMarkup(<ProfileRouteHeader path="/settings" />);
    const access = renderToStaticMarkup(<ProfileRouteHeader path="/settings/access" />);
    expect(preferences).toContain("Personal preferences");
    expect(preferences).toContain("Choose how FireGuard delivers assignment, exception, and Academy prompts during your operational day.");
    expect(access).toContain("Access controls");
    expect(access).toContain("Review your role, access-PIN status, and permission history without exposing protected credentials.");
  });
});
