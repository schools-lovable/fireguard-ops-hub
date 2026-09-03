import { describe, expect, it } from "vitest";
import { getClientPortfolioFilter, getClientWorkspaceView, getExceptionStatusFilter, getServiceStatusFilter } from "./workspaceDestinations";
import { getWorkspaceHealth } from "./workspaceHealth";

describe("Workspace Health destinations", () => {
  it("maps every metric to a concrete operational list destination", () => {
    const destinations = getWorkspaceHealth({ clients: [], sites: [], workOrders: [], exceptions: [] }).items.map(item => item.href);
    expect(destinations).toEqual(["/clients?filter=all", "/clients?view=sites", "/service?status=all", "/exceptions?status=all"]);
  });

  it("parses only supported filters and falls back safely", () => {
    expect(getClientPortfolioFilter("?filter=ready")).toBe("ready");
    expect(getClientPortfolioFilter("?filter=unknown")).toBe("all");
    expect(getClientWorkspaceView("?view=sites")).toBe("sites");
    expect(getClientWorkspaceView("?view=unexpected")).toBe("clients");
    expect(getServiceStatusFilter("?status=complete")).toBe("complete");
    expect(getServiceStatusFilter("?status=stale")).toBe("all");
    expect(getExceptionStatusFilter("?status=all")).toBe("all");
    expect(getExceptionStatusFilter("?status=stale")).toBe("open");
  });
});
