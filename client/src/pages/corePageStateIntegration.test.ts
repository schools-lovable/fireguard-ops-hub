import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = (name: string) => readFileSync(resolve(process.cwd(), "client/src/pages", name), "utf8");

describe("core operational page state integration", () => {
  it("adopts recoverable shared loading and error states across the core operations workspace", () => {
    ["Dashboard.tsx", "Clients.tsx", "Service.tsx", "Reviews.tsx", "Exceptions.tsx"].forEach(name => {
      const source = pageSource(name);
      expect(source).toContain("CorePageState");
      expect(source).toContain('state="loading"');
      expect(source).toContain('state="error"');
      expect(source).toContain("refetch");
    });
  });

  it("keeps a visible success or empty path for every selected core workflow", () => {
    const dashboard = pageSource("Dashboard.tsx");
    expect(dashboard).toContain("LoadSuccessCue");
    expect(dashboard).toContain("workspaceHealth.isEmpty");
    ["Clients.tsx", "Service.tsx", "Reviews.tsx", "Exceptions.tsx"].forEach(name => {
      const source = pageSource(name);
      expect(source).toContain("LoadSuccessCue");
      expect(source).toContain('state="empty"');
    });
  });
});
