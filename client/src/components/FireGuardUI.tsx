/** FireGuard visual system: shared Quiet Incident Command primitives use graphite controls, rounded white field cards, ember risk signals, and signal-mint verification states. */
import React, { type ReactNode, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight, Inbox, RefreshCw, type LucideIcon } from "lucide-react";

export type StatusTone = "good" | "warning" | "risk" | "neutral";

export function StatusBadge({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <div className="crumb"><span>FireGuard</span><ChevronRight size={12} /><span>{eyebrow}</span></div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function ActionButton({
  children,
  icon: Icon,
  tone = "dark",
  size = "default",
  ariaLabel,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: "dark" | "ember" | "quiet";
  size?: "default" | "compact";
  ariaLabel?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const className = `${tone === "quiet" ? "quiet-button" : `command-button ${tone === "ember" ? "is-ember" : ""}`} ${size === "compact" ? "is-compact" : ""}`;
  return <button type={type} onClick={onClick} className={className} aria-label={ariaLabel}>{Icon && <Icon size={size === "compact" ? 13 : 15} />}{children}</button>;
}

export function SurfaceTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="card-heading"><div><h2 className="card-title">{title}</h2>{subtitle && <p className="card-subtitle">{subtitle}</p>}</div>{action}</div>;
}

export function OpenIcon() {
  return <span className="icon-button" aria-label="Open details"><ArrowUpRight size={15} /></span>;
}

export function MetricDelta({ risk = false, children }: { risk?: boolean; children: ReactNode }) {
  return <span className={`metric-delta ${risk ? "is-risk" : ""}`}>{children}</span>;
}

/** A calm FireGuard loading signal: an extinguisher releases a controlled, low-risk gas burst while information arrives. */
export function ExtinguisherLoader({ label = "Loading operational information", detail, compact = false }: { label?: string; detail?: string; compact?: boolean }) {
  return <div className={`fg-extinguisher-loader ${compact ? "is-compact" : ""}`} role="status" aria-live="polite">
    <div className="fg-loader-device" aria-hidden="true"><span className="fg-loader-cylinder" /><span className="fg-loader-handle" /><span className="fg-loader-hose" /><span className="fg-loader-nozzle" /><span className="fg-loader-gas"><i /><i /><i /><i /><i /></span></div>
    <div className="fg-loader-copy"><span className="soft-label">FireGuard is checking</span><strong>{label}</strong>{detail && <span>{detail}</span>}</div>
  </div>;
}

export type CorePageStateKind = "loading" | "empty" | "error" | "success";

/** Shared non-destructive state treatment for core operational pages. */
export function CorePageState({ state, title, description, actionLabel, onAction, compact = false }: { state: CorePageStateKind; title: string; description: string; actionLabel?: string; onAction?: () => void; compact?: boolean }) {
  if (state === "loading") return <section className={`fg-core-state is-loading ${compact ? "is-compact" : ""}`} role="status" aria-live="polite"><ExtinguisherLoader compact={compact} label={title} detail={description} /></section>;
  const Icon = state === "error" ? AlertTriangle : state === "empty" ? Inbox : CheckCircle2;
  return <section className={`fg-core-state is-${state} ${compact ? "is-compact" : ""}`} role={state === "error" ? "alert" : "status"} aria-live="polite"><span className="fg-core-state-icon" aria-hidden="true"><Icon size={20} /></span><div><h2>{title}</h2><p>{description}</p>{onAction && <button type="button" className="quiet-button" onClick={onAction}><RefreshCw size={14} />{actionLabel ?? "Try again"}</button>}</div></section>;
}

type LoadSuccessPhase = "hidden" | "visible" | "leaving";

/** Signals that a real initial load has completed; it never delays the data or blocks interaction. */
export function useLoadSuccessCue(isLoading: boolean) {
  const wasLoading = useRef(isLoading);
  const [phase, setPhase] = useState<LoadSuccessPhase>("hidden");

  useEffect(() => {
    if (isLoading) {
      wasLoading.current = true;
      setPhase("hidden");
      return;
    }
    if (!wasLoading.current) return;
    wasLoading.current = false;
    setPhase("visible");
    const leaveTimer = window.setTimeout(() => setPhase("leaving"), 1200);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), 1400);
    return () => { window.clearTimeout(leaveTimer); window.clearTimeout(hideTimer); };
  }, [isLoading]);

  return phase;
}

export function LoadSuccessCue({ phase, label = "Information ready", detail = "Latest FireGuard records are now live" }: { phase: LoadSuccessPhase; label?: string; detail?: string }) {
  if (phase === "hidden") return null;
  return <div className={`fg-load-success is-${phase}`} role="status" aria-live="polite"><span className="fg-load-success-mark" aria-hidden="true"><CheckCircle2 size={17} strokeWidth={2.6} /></span><span><strong>{label}</strong><small>{detail}</small></span></div>;
}
