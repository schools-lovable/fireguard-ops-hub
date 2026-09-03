import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("contextual subpage pill navigation", () => {
  it("keeps contextual links as accessible compact floating controls", () => {
    expect(styles).toContain(".header-context-tabs > div { display: flex; gap: 8px; }");
    expect(styles).toContain(".header-context-tabs a { min-height: 34px; border: 1px solid #2f2e2c; border-radius: 9px;");
    expect(styles).not.toContain(".header-context-tabs > div { display: flex; gap: 6px; border: 1px solid #0a0a09;");
    expect(styles).toContain(".header-context-tabs a.is-active { border-color: #4b4945; background: #0b0b0a; color: #fff;");
    expect(styles).toContain(".header-context-tabs a:focus-visible { outline: 3px solid #66b99f; outline-offset: 3px; }");
    expect(styles).toContain(".header-context-tabs a { min-height: 40px; border-radius: 8px; padding-inline: 12px; font-size: var(--fg-control-size); }");
  });
});
