/** Pure profile rules keep access PIN validation and compliance signals consistent across FireGuard surfaces. */
export function isValidProfilePin(pin: string) {
  return /^\d{4,6}$/.test(pin);
}

export function profileRoleTitle(role: string) {
  return {
    admin: "FireGuard administrator",
    manager: "Operations manager",
    reviewer: "Compliance reviewer",
    field: "Field operator",
    user: "Workspace member",
  }[role] ?? "FireGuard operator";
}

export function certificationExpiryState(expiresAt: Date, now = new Date()) {
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);
  if (daysRemaining < 0) return { tone: "risk" as const, label: "Expired", daysRemaining };
  if (daysRemaining <= 45) return { tone: "warning" as const, label: `${daysRemaining}d remaining`, daysRemaining };
  return { tone: "good" as const, label: "Current", daysRemaining };
}
