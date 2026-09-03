export type FireGuardChangeRole = "user" | "field" | "reviewer" | "manager" | "admin" | "technician" | "sales" | "finance";

type WorkRecord = { id: number; title: string; siteName: string; status: string; scheduledFor: Date | string | null; evidenceProgress: number };
type ExceptionRecord = { id: number; title: string; siteName: string; status: string; severity: "high" | "medium" | "low"; createdAt: Date | string | null };

export type WhatChangedItem = { id: string; kind: "work" | "risk"; title: string; summary: string; occurredAt: Date | string | null; tone: "good" | "warning" | "risk" | "neutral" };

const operationalRoles: FireGuardChangeRole[] = ["field", "reviewer", "manager", "admin", "technician"];
const reviewRoles: FireGuardChangeRole[] = ["reviewer", "manager", "admin"];

export function getWhatChanged({ workOrders, exceptions }: { workOrders: WorkRecord[]; exceptions: ExceptionRecord[] }, role: FireGuardChangeRole | undefined) {
  if (!role || !operationalRoles.includes(role)) return [] as WhatChangedItem[];
  const workChanges = workOrders
    .filter(work => role === "field" || role === "technician" ? work.status !== "complete" : true)
    .map(work => ({ id: `work-${work.id}`, kind: "work" as const, title: work.title, summary: `${work.siteName} · ${work.status.replaceAll("_", " ")} · ${work.evidenceProgress}% evidence`, occurredAt: work.scheduledFor, tone: work.status === "blocked" ? "risk" as const : work.status === "complete" ? "good" as const : "neutral" as const }));
  const riskChanges = reviewRoles.includes(role)
    ? exceptions.map(item => ({ id: `risk-${item.id}`, kind: "risk" as const, title: item.title, summary: `${item.siteName} · ${item.status === "acknowledged" ? "owner assigned" : item.status.replaceAll("_", " ")}`, occurredAt: item.createdAt, tone: item.severity === "high" ? "risk" as const : item.severity === "medium" ? "warning" as const : "neutral" as const }))
    : [];
  return [...workChanges, ...riskChanges].sort((left, right) => Number(new Date(right.occurredAt ?? 0)) - Number(new Date(left.occurredAt ?? 0))).slice(0, 4);
}

export function getWhatChangedEmptyCopy(role: FireGuardChangeRole | undefined) {
  return role && operationalRoles.includes(role) ? "There are no recent operational updates visible for your current scope." : "No recent operational updates are available for your current role.";
}
