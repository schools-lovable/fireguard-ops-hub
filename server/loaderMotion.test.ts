import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("FireGuard loader motion", () => {
  it("preserves a calm static gas signal when motion reduction is requested", () => {
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.fg-loader-device, \.fg-loader-gas i \{ animation: none; \}[\s\S]*?\.fg-loader-gas i \{ opacity: \.58; \}/);
  });

  it("keeps the completion confirmation as a gentle opacity cue when motion reduction is requested", () => {
    expect(styles).toMatch(/\.fg-load-success, \.fg-load-success\.is-visible, \.fg-load-success\.is-leaving \{ animation: none; transform: translateX\(-50%\); transition: opacity 180ms ease; \}/);
  });
});
