import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const shell = readFileSync(resolve(process.cwd(), "client/src/components/FireGuardShell.tsx"), "utf8");

describe("FireGuard sidebar scrolling", () => {
  it("keeps the desktop rail viewport-bound and gives its navigation an independent vertical scroll area", () => {
    expect(styles).toMatch(/\.fg-rail \{ position: sticky; top: 0;[\s\S]*?height: calc\(100dvh - 48px\); min-height: 0;[\s\S]*?\}/);
    expect(styles).toMatch(/\.rail-menu \{ display: flex; height: 100%; min-height: 0;[\s\S]*?overflow-y: auto; overscroll-behavior: contain;/);
    expect(styles).toContain(".rail-menu:focus-visible");
    expect(styles).toContain(".rail-scroll-fade.is-visible { opacity: 1; }");
    expect(styles).toContain(".rail-scroll-fade.is-top");
    expect(styles).toContain(".rail-scroll-fade.is-bottom");
    expect(shell).toContain('className="rail-menu" aria-label="Workspace sections" tabIndex={0} style={{ overflowY: "auto", overscrollBehavior: "contain" }}');
  });

  it("preserves the mobile handoff by hiding the desktop rail and retaining the fixed mobile navigation", () => {
    expect(styles).toMatch(/@media \(max-width: 680px\) \{[\s\S]*?\.fg-rail \{ display: none; \}[\s\S]*?\.fg-mobile-nav \{ position: fixed;/);
  });
});
