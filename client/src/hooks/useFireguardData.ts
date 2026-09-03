/** FireGuard data hooks share cached tRPC workspace state across the operations surfaces. */
import { trpc } from "@/lib/trpc";

export function useFireguardWorkspace() {
  return trpc.fireguard.workspace.useQuery(undefined, { staleTime: 20_000, refetchOnWindowFocus: false });
}

export function useFireguardPermissions() {
  return trpc.fireguard.permissions.useQuery(undefined, { staleTime: 20_000, refetchOnWindowFocus: false });
}

export const formatOperationalDate = (value: Date | string | null | undefined) => {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
};
