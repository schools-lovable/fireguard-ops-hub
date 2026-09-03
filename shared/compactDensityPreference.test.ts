import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const profile = readFileSync(resolve(process.cwd(), "client/src/pages/Profile.tsx"), "utf8");
const shell = readFileSync(resolve(process.cwd(), "client/src/components/FireGuardShell.tsx"), "utf8");

describe("compact density preference", () => {
  it("persists the preference through the schema, profile mutation, and shared workspace shell", () => {
    expect(schema).toContain('compactDensity: boolean("compactDensity").default(false).notNull()');
    expect(database).toContain("compactDensity: preferences?.compactDensity ?? false");
    expect(router).toContain("compactDensity: z.boolean()");
    expect(profile).toContain('label="Compact operational layout"');
    expect(shell).toContain('profileDashboard?.preferences.compactDensity ? "is-compact-density" : ""');
  });
});
