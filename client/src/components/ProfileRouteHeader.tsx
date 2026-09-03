import React, { type ReactNode } from "react";
import { PageHeader } from "@/components/FireGuardUI";
import { getProfileRoutePurpose } from "@/lib/routePurpose";

export function ProfileRouteHeader({ path, children }: { path: string; children?: ReactNode }) {
  const purpose = getProfileRoutePurpose(path);
  return <PageHeader eyebrow={path.startsWith("/settings") ? "Settings" : "Operator profile"} title={purpose.title} description={purpose.description}>{children}</PageHeader>;
}
