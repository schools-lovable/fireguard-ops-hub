import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const glossary = readFileSync(resolve(process.cwd(), "FIREGUARD_DOMAIN_GLOSSARY.md"), "utf8");

describe("FireGuard domain glossary", () => {
  it("documents the requested operational objects and their schema relationships", () => {
    ["Client", "Site", "Unit", "Work order", "Checklist", "Evidence", "Review", "Certificate", "Exception", "Operator", "Notification"].forEach(term => {
      expect(glossary).toContain(`**${term}**`);
    });
    expect(glossary).toContain("Client → Site → Unit → Work order → Checklist / Evidence");
    expect(glossary).toContain("`service_checklist_items.workOrderId`");
    expect(glossary).toContain("`service_evidence.workOrderId`");
    expect(glossary).toContain("`service_certificates.workOrderId`");
    expect(glossary).toContain("`notifications.recipientUserId`");
  });

  it("states the real certificate and sensitive-data boundaries", () => {
    expect(glossary).toContain("authority to issue a real certificate");
    expect(glossary).toContain("must never be documented in operational records");
  });
});
