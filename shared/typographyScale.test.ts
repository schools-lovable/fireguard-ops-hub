import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("FireGuard typography scale", () => {
  it("defines the approved exact-scale typography roles for operational content", () => {
    expect(styles).toContain("--fg-reading-size: 13px");
    expect(styles).toContain("--fg-control-size: 13px");
    expect(styles).toContain("--fg-card-title-size: 22px");
    expect(styles).toContain("--fg-section-title-size: 22px");
    expect(styles).toContain("--fg-tertiary-heading-size: 16px");
    expect(styles).toContain("--fg-page-title-size: 38px");
    expect(styles).toContain("--fg-number-size: 30px");
  });

  it("preserves legible forms, adaptable headings, and tabular operational values", () => {
    expect(styles).toContain(".fg-main :is(input, select, textarea) { min-height: 44px; font-size: var(--fg-reading-size); }");
    expect(styles).toContain("font-size: var(--fg-page-title-size)");
    expect(styles).toContain("font-variant-numeric: tabular-nums");
    expect(styles).toContain("text-wrap: balance");
    expect(styles).toContain(".metric-unit");
    expect(styles).toContain(".fg-rail-brand-wordmark strong { font-size: var(--fg-card-title-size); }");
    expect(styles).toContain(".fg-rail .rail-link, .fg-rail .rail-command-tag { font-size: var(--fg-control-size); }");
    expect(styles).toContain(".fg-main :is(.quiet-button, .command-button");
    expect(styles).toContain(".chat-conversation-copy strong");
    expect(styles).toContain(".client-map-meta strong");
    expect(styles).toContain(".client-map-fallback button { min-height: 36px; font-size: var(--fg-meta-size); }");
    expect(styles).toContain(".fg-main h2:not(.brief-headline) { font-size: var(--fg-section-title-size)");
    expect(styles).toContain(".fg-shell.is-compact-density .fg-main");
    expect(styles).toContain(".fg-shell.is-compact-density .service-table :is(th, td) { padding-block: 10px; }");
    expect(styles).toContain(".fg-chart-axis { margin-top: 7px; font-size: var(--fg-chart-label-size, 12px)");
    expect(styles).toContain(".fg-bar-chart .fg-chart-axis span { overflow: visible; text-overflow: clip; white-space: normal; }");
  });
});
