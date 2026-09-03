import React from "react";
import { FlaskConical, X } from "lucide-react";

/** A read-only workspace indicator; it never changes records, roles, or access. */
export function DemoEnvironmentBanner({ isDemo, onDismiss }: { isDemo?: boolean; onDismiss?: () => void }) {
  if (!isDemo) return null;
  return <aside className="fg-environment-banner" role="status" aria-live="polite"><FlaskConical size={15} aria-hidden="true" /><span><strong>Demonstration workspace</strong><small>Sample records are visible. Operational workflows remain unchanged until your team adds live data.</small></span>{onDismiss && <button type="button" className="fg-environment-banner-dismiss" onClick={onDismiss} aria-label="Dismiss demonstration workspace notice" title="Dismiss notice"><X size={16} aria-hidden="true" /></button>}</aside>;
}
