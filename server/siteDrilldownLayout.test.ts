import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("site drill-down responsive presentation", () => {
  it("uses a two-up evidence gallery that becomes a single-column card structure on narrow screens", () => {
    expect(styles).toMatch(/\.site-evidence-grid \{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; \}/);
    expect(styles).toMatch(/@media \(max-width: 680px\) \{[\s\S]*?\.site-evidence-grid \{ grid-template-columns: 1fr; \}[\s\S]*?\.site-evidence-card \{ display: grid; grid-template-columns: 116px minmax\(0,1fr\); \}/);
  });

  it("keeps the drill-down loading state still when reduced motion is requested", () => {
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.site-drilldown-loading > div \{ animation: none; \}/);
  });
});
