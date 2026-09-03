import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("FireGuard responsive sidebar styles", () => {
  const styles = readFileSync("client/src/index.css", "utf8");

  it("uses an expanded labeled rail on desktop and collapses to an icon rail on tablet", () => {
    expect(styles).toContain("grid-template-columns: 244px minmax(0,1fr)");
    expect(styles).toContain("@media (max-width: 1180px) {");
    expect(styles).toContain("grid-template-columns: 72px minmax(0,1fr)");
    expect(styles).toContain(".fg-rail-brand-wordmark, .rail-section-label, .rail-link-label { display: none; }");
    expect(styles).toContain(".fg-rail .rail-link { width: 44px; min-height: 44px; height: 44px; }");
  });

  it("retains the established mobile bottom-navigation handoff", () => {
    expect(styles).toContain("@media (max-width: 680px) {");
    expect(styles).toContain(".fg-rail { display: none; }");
    expect(styles).toContain(".fg-mobile-nav { position: fixed;");
  });
});
