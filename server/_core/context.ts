import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { FIREGUARD_DIRECT_ACCESS } from "@shared/accessMode";
import { getDirectAccessUser } from "../localPinAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function resolveContextUser(req: CreateExpressContextOptions["req"], directAccessEnabled = FIREGUARD_DIRECT_ACCESS): Promise<User | null> {
  if (directAccessEnabled) return getDirectAccessUser();

  try {
    return await sdk.authenticateRequest(req);
  } catch (error) {
    // Authentication is optional for public procedures.
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await resolveContextUser(opts.req);
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
