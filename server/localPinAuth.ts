import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";

export const legacyPinRoles = ["admin", "manager", "technician", "sales", "finance"] as const;
export type LegacyPinRole = (typeof legacyPinRoles)[number];

export type PinEnvironment = Record<string, string | undefined>;

export function pinEnvironmentKey(role: LegacyPinRole) {
  return `FIREGUARD_AUTH_${role.toUpperCase()}_PIN`;
}

export function getRoleForSignInPin(pin: string, selectedRole: LegacyPinRole, environment: PinEnvironment = process.env) {
  const configuredPin = environment[pinEnvironmentKey(selectedRole)];
  if (!configuredPin) return null;
  const candidate = Buffer.from(pin);
  const expected = Buffer.from(configuredPin);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected) ? selectedRole : null;
}

const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
type Attempt = { failures: number; blockedUntil: number; windowStartedAt: number };
const attempts = new Map<string, Attempt>();

export function roleAccountOpenId(role: LegacyPinRole) { return `fireguard-role:${role}`; }
export function roleAccountName(role: LegacyPinRole) { return `FireGuard ${role[0].toUpperCase()}${role.slice(1)}`; }

/** Stable administrator identity used only while the temporary direct-access policy is enabled. */
export async function getDirectAccessUser() {
  await provisionLocalRoleAccounts();
  const database = await getDb();
  if (!database) throw new Error("The FireGuard database is unavailable.");
  const user = (await database.select().from(users).where(eq(users.openId, roleAccountOpenId("admin"))).limit(1))[0];
  if (!user || !user.isActive) throw new Error("The FireGuard direct-access administrator is unavailable.");
  return user;
}

export async function provisionLocalRoleAccounts() {
  const database = await getDb();
  if (!database) throw new Error("The FireGuard database is unavailable.");
  for (const role of legacyPinRoles) {
    const openId = roleAccountOpenId(role);
    const existing = await database.select({ id: users.id }).from(users).where(eq(users.openId, openId)).limit(1);
    if (!existing[0]) await database.insert(users).values({ openId, name: roleAccountName(role), email: null, loginMethod: "role_pin", role, isActive: true, lastSignedIn: new Date() });
  }
}

export function getRequestThrottleKey(headers: Record<string, string | string[] | undefined>) {
  const forwarded = headers["x-forwarded-for"];
  return Array.isArray(forwarded) ? forwarded[0] ?? "unknown" : forwarded?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(key: string, now: number) { const attempt = attempts.get(key); return attempt && attempt.blockedUntil > now ? attempt : null; }
function recordFailure(key: string, now: number) {
  const previous = attempts.get(key); const withinWindow = previous && now - previous.windowStartedAt < FAILURE_WINDOW_MS;
  const next = { failures: (withinWindow ? previous!.failures : 0) + 1, windowStartedAt: withinWindow ? previous!.windowStartedAt : now, blockedUntil: 0 };
  if (next.failures >= MAX_FAILURES) next.blockedUntil = now + FAILURE_WINDOW_MS;
  attempts.set(key, next); return next;
}

export async function authenticateWithLocalRolePin({ pin, role, requestKey, now = Date.now() }: { pin: string; role: LegacyPinRole; requestKey: string; now?: number }) {
  const limited = isRateLimited(requestKey, now);
  if (limited) return { ok: false as const, reason: "rate_limited" as const, retryAfterSeconds: Math.ceil((limited.blockedUntil - now) / 1000) };
  if (!getRoleForSignInPin(pin, role)) { recordFailure(requestKey, now); return { ok: false as const, reason: "invalid_pin" as const }; }
  await provisionLocalRoleAccounts();
  const database = await getDb();
  if (!database) throw new Error("The FireGuard database is unavailable.");
  const openId = roleAccountOpenId(role); const user = (await database.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
  if (!user || !user.isActive) return { ok: false as const, reason: "inactive_account" as const };
  const lastSignedIn = new Date(now); await database.update(users).set({ lastSignedIn }).where(eq(users.id, user.id)); attempts.delete(requestKey);
  return { ok: true as const, role, user: { ...user, lastSignedIn } };
}

export function resetLocalPinAuthForTests() { attempts.clear(); }
