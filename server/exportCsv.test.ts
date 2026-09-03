/** FireGuard export tests verify current operational rows produce safe, portable CSV output. */
import { describe, expect, it } from "vitest";
import { buildCsv } from "./exportCsv";

describe("FireGuard CSV export", () => {
  it("quotes values and safely escapes embedded quotation marks", () => {
    expect(buildCsv(["Client", "Status"], [["Riverside House", "ready"], ["Northline \"Studios\"", "review"]])).toBe('"Client","Status"\n"Riverside House","ready"\n"Northline ""Studios""","review"');
  });
});
