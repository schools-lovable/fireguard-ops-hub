import { describe, expect, it } from "vitest";
import { kigaliDemoClients, kigaliDemoSites } from "./kigaliDemoData";

describe("Kigali demonstration portfolio", () => {
  it("contains a substantial, clearly labelled and uniquely named demo portfolio", () => {
    expect(kigaliDemoClients.length).toBeGreaterThanOrEqual(12);
    expect(kigaliDemoSites.length).toBeGreaterThanOrEqual(20);
    expect(new Set(kigaliDemoClients.map(client => client.name)).size).toBe(kigaliDemoClients.length);
    expect(kigaliDemoClients.every(client => client.name.endsWith("· DEMO"))).toBe(true);
  });

  it("keeps every illustrative site inside the Kigali operating area for realistic map coverage", () => {
    for (const [, , , , latitude, longitude] of kigaliDemoSites) {
      expect(latitude).toBeGreaterThan(-2.05); expect(latitude).toBeLessThan(-1.88);
      expect(longitude).toBeGreaterThan(29.98); expect(longitude).toBeLessThan(30.16);
    }
  });

  it("supplies the exact expanded client-map distribution with a linked demo work order at every site", () => {
    expect(kigaliDemoClients).toHaveLength(12);
    expect(kigaliDemoSites).toHaveLength(22);
    expect(new Set(kigaliDemoSites.map(site => site[1])).size).toBe(22);
    expect(kigaliDemoSites.every(site => site[0].endsWith("· DEMO") && site[6].length > 0 && site[7].length > 0 && site[9] >= 0 && site[9] <= 100)).toBe(true);
  });
});
