import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("FireGuard analytical graph theme", () => {
  it("uses shared graphite, line, semantic accent, and grid tokens across chart cards", () => {
    expect(styles).toContain("--fg-chart-surface: #1d1f1e;");
    expect(styles).toContain("--fg-chart-line: #f5f7f1;");
    expect(styles).toContain("--fg-chart-accent: #c7d59c;");
    expect(styles).toContain("--fg-chart-mint: #79d1ae;");
    expect(styles).toContain("--fg-chart-risk: #ef8f7d;");
    expect(styles).toContain(".chart-card { position: relative;");
    expect(styles).toContain(".fg-chart-grid line");
    expect(styles).toContain(".fg-chart-active-guide");
  });

  it("keeps graph cards in a readable one-column composition at compact widths", () => {
    expect(styles).toMatch(/@media \(max-width: 680px\) \{[\s\S]*?\.dashboard-grid \{ grid-template-columns: 1fr; gap: 13px; \}[\s\S]*?\.spend-layout \{ grid-template-columns: 1fr; \}/);
    expect(styles).toMatch(/@media \(max-width: 960px\) \{[\s\S]*?\.content-grid, \.queue-grid, \.report-grid \{ grid-template-columns: 1fr; \}/);
  });
});
