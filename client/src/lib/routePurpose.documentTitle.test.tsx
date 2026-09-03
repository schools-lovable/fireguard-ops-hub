import { describe, expect, it } from "vitest";
import { getFireGuardDocumentTitle, getRoutePurpose, primaryRoutePurposes } from "./routePurpose";

const examplePath = (path: string) => path === "/service/:id" ? "/service/42" : path;

describe("FireGuard document titles", () => {
  it("maps every canonical route purpose to a concise FireGuard browser title", () => {
    for (const purpose of primaryRoutePurposes) {
      expect(getFireGuardDocumentTitle(examplePath(purpose.path))).toBe(`${purpose.title} · FireGuard`);
    }
  });

  it("resolves aliases, ignores filters, handles dynamic service records, and keeps unknown URLs neutral", () => {
    expect(getRoutePurpose("/staff")?.title).toBe("Team supervision");
    expect(getFireGuardDocumentTitle("/clients?view=sites")).toBe("Client portfolio · FireGuard");
    expect(getFireGuardDocumentTitle("/service/verified-work-order")).toBe("Service workbench · FireGuard");
    expect(getFireGuardDocumentTitle("/unknown")).toBe("FireGuard Operations · FireGuard");
  });
});
