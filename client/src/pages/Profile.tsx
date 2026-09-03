/** FireGuard Profile: an operator-owned control surface for identity, access, work readiness, and personal settings. */
import React, { useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, BellRing, CalendarClock, CheckCircle2, Clock3, FileKey2, Fingerprint, GraduationCap, KeyRound, MapPin, Pencil, Plus, Rows3, Save, ShieldCheck, Sparkles, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, StatusBadge, SurfaceTitle } from "@/components/FireGuardUI";
import { ProfileRouteHeader } from "@/components/ProfileRouteHeader";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type ProfileTab = "overview" | "access" | "settings";
type OperationalRole = "user" | "field" | "reviewer" | "manager" | "admin";

const tabOptions: Array<{ id: ProfileTab; label: string; icon: typeof UserRound }> = [
  { id: "overview", label: "Profile & work", icon: UserRound },
  { id: "access", label: "Access & PIN", icon: ShieldCheck },
  { id: "settings", label: "Preferences", icon: BellRing },
];

const formatDate = (value: Date | string | null | undefined, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) => value ? new Intl.DateTimeFormat(undefined, options).format(new Date(value)) : "Not recorded";
const formatTime = (value: Date | string) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
const initialValue = (name: string) => name.split(" ").filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "FG";
const expiryTone = (expiresAt: Date | string) => {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { tone: "risk" as const, label: "Expired" };
  if (days <= 45) return { tone: "warning" as const, label: `${days}d remaining` };
  return { tone: "good" as const, label: "Current" };
};

function PreferenceToggle({ label, description, checked, onClick }: { label: string; description: string; checked: boolean; onClick: () => void }) {
  return <div className="profile-setting-row"><div><strong>{label}</strong><p>{description}</p></div><button type="button" className={`presence-toggle ${checked ? "is-on" : ""}`} aria-label={label} aria-pressed={checked} onClick={onClick}><span /></button></div>;
}

export default function Profile() {
  const [location] = useLocation();
  const defaultTab: ProfileTab = location === "/settings/access" ? "access" : location === "/settings" ? "settings" : "overview";
  const [activeTab, setActiveTab] = useState<ProfileTab>(defaultTab);
  const [isEditing, setEditing] = useState(false);
  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [isCertificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [isRoleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [roleDraft, setRoleDraft] = useState<OperationalRole>("field");
  const [certificationName, setCertificationName] = useState("");
  const [certificationAuthority, setCertificationAuthority] = useState("");
  const [certificationExpiry, setCertificationExpiry] = useState("");
  const [identity, setIdentity] = useState({ name: "", employeeId: "", phone: "", title: "", photoUrl: "", locations: "", employmentStatus: "active" as "active" | "on_leave" | "terminated", hireDate: "" });
  const [preferences, setPreferences] = useState({ notifyAssignments: true, notifyExceptions: true, notifyLearning: true, language: "en-US" as "en-US" | "es-ES" | "fr-FR" | "pt-BR", compactDensity: false });
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.fireguard.profile.dashboard.useQuery();

  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  useEffect(() => {
    if (!data) return;
    setIdentity({
      name: data.user.name,
      employeeId: data.profile.employeeId,
      phone: data.profile.phone,
      title: data.profile.title,
      photoUrl: data.profile.photoUrl,
      locations: data.profile.locations.join(", "),
      employmentStatus: data.profile.employmentStatus,
      hireDate: data.profile.hireDate ? new Date(data.profile.hireDate).toISOString().slice(0, 10) : "",
    });
    setPreferences({
      notifyAssignments: data.preferences.notifyAssignments,
      notifyExceptions: data.preferences.notifyExceptions,
      notifyLearning: data.preferences.notifyLearning,
      language: data.preferences.language as "en-US" | "es-ES" | "fr-FR" | "pt-BR",
      compactDensity: data.preferences.compactDensity,
    });
    setRoleDraft(data.permissions.role as OperationalRole);
  }, [data]);

  const refreshProfile = async () => { await utils.fireguard.profile.dashboard.invalidate(); };
  const updateIdentity = trpc.fireguard.profile.updateIdentity.useMutation({ onSuccess: async () => { await refreshProfile(); setEditing(false); toast.success("Profile information saved."); }, onError: issue => toast.error(issue.message) });
  const updatePreferences = trpc.fireguard.profile.updatePreferences.useMutation({ onSuccess: async () => { await refreshProfile(); toast.success("Preferences updated."); }, onError: issue => toast.error(issue.message) });
  const resetPin = trpc.fireguard.profile.resetPin.useMutation({ onSuccess: async () => { await refreshProfile(); setPin(""); setPinDialogOpen(false); toast.success("Your access PIN is set."); }, onError: issue => toast.error(issue.message) });
  const updateRole = trpc.fireguard.profile.updateRole.useMutation({ onSuccess: async () => { await refreshProfile(); setRoleDialogOpen(false); toast.success("Role and permissions updated. The change was added to the audit trail."); }, onError: issue => toast.error(issue.message) });
  const addCertification = trpc.fireguard.profile.addCertification.useMutation({ onSuccess: async () => { await refreshProfile(); setCertificationName(""); setCertificationAuthority(""); setCertificationExpiry(""); setCertificationDialogOpen(false); toast.success("Certification added."); }, onError: issue => toast.error(issue.message) });
  const deleteCertification = trpc.fireguard.profile.deleteCertification.useMutation({ onSuccess: refreshProfile, onError: issue => toast.error(issue.message) });
  const clockIn = trpc.fireguard.profile.clockIn.useMutation({ onSuccess: async () => { await refreshProfile(); toast.success("Clock-in recorded."); }, onError: issue => toast.error(issue.message) });
  const clockOut = trpc.fireguard.profile.clockOut.useMutation({ onSuccess: async () => { await refreshProfile(); toast.success("Clock-out recorded."); }, onError: issue => toast.error(issue.message) });

  const submitIdentity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateIdentity.mutate({ ...identity, locations: identity.locations.split(",").map(location => location.trim()).filter(Boolean), hireDate: identity.hireDate || null });
  };
  const submitCertification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addCertification.mutate({ name: certificationName, authority: certificationAuthority, expiresAt: new Date(`${certificationExpiry}T12:00:00`).toISOString() });
  };

  if (isLoading) return <div className="profile-loading surface-card">Loading your secure profile workspace…</div>;
  if (error || !data) return <div className="profile-loading surface-card">Your profile is temporarily unavailable. Refresh the page or try again shortly.</div>;

  const { user, profile, permissions, certifications, timeEntries, openTimeEntry, upcomingShifts, audits, metrics } = data;
  const profileStatus = profile.employmentStatus === "active" ? "Active" : profile.employmentStatus === "on_leave" ? "On leave" : "Terminated";
  const statusTone = profile.employmentStatus === "active" ? "good" : profile.employmentStatus === "on_leave" ? "warning" : "risk";

  return <div className="page-enter profile-page">
    <ProfileRouteHeader path={location}>
      {activeTab === "overview" && <ActionButton tone="quiet" icon={Pencil} onClick={() => setEditing(value => !value)}>{isEditing ? "Discard changes" : "Edit profile"}</ActionButton>}
      {activeTab === "settings" && <ActionButton icon={Save} onClick={() => updatePreferences.mutate(preferences)}>{updatePreferences.isPending ? "Saving…" : "Save preferences"}</ActionButton>}
    </ProfileRouteHeader>

    <section className="profile-hero surface-card">
      <div className="profile-portrait" aria-hidden="true">{profile.photoUrl ? <img src={profile.photoUrl} alt="" /> : <span>{initialValue(user.name)}</span>}</div>
      <div className="profile-hero-copy"><div className="profile-hero-heading"><div><span className="soft-label">Authenticated operator</span><h2>{user.name}</h2><p>{profile.title} <span aria-hidden="true">·</span> {user.email || "Email unavailable"}</p></div><StatusBadge tone={statusTone}>{profileStatus}</StatusBadge></div><div className="profile-hero-meta"><span><Fingerprint size={14} />{profile.employeeId || "Employee ID pending"}</span><span><MapPin size={14} />{profile.locations.length ? profile.locations.join(" · ") : "Location not assigned"}</span><span><CalendarClock size={14} />Joined {formatDate(profile.hireDate, { month: "short", year: "numeric" })}</span></div></div>
      <div className="profile-clock-box"><span className="soft-label">Shift status</span><strong>{openTimeEntry ? "Clocked in" : "Off shift"}</strong><p>{openTimeEntry ? `Since ${formatTime(openTimeEntry.clockedInAt)}` : "Use your profile to start a time entry."}</p><ActionButton tone={openTimeEntry ? "quiet" : "dark"} icon={Clock3} onClick={() => openTimeEntry ? clockOut.mutate() : clockIn.mutate()}>{openTimeEntry ? (clockOut.isPending ? "Clocking out…" : "Clock out") : (clockIn.isPending ? "Clocking in…" : "Clock in")}</ActionButton></div>
    </section>

    <nav className="profile-tabs" aria-label="Profile sections">{tabOptions.map(option => <button type="button" key={option.id} className={`profile-tab ${activeTab === option.id ? "is-active" : ""}`} aria-current={activeTab === option.id ? "page" : undefined} onClick={() => setActiveTab(option.id)}><option.icon size={15} />{option.label}</button>)}</nav>

    {activeTab === "overview" && <div className="profile-overview-layout">
      <form className="profile-identity-card surface-card" onSubmit={submitIdentity}>
        <div className="profile-section-heading"><div><span className="soft-label">Identity & account</span><h2>Personal and employment information</h2><p>Changes are retained against your authenticated FireGuard operator record.</p></div>{isEditing && <button type="submit" className="command-button" disabled={updateIdentity.isPending}><Save size={15} />{updateIdentity.isPending ? "Saving…" : "Save changes"}</button>}</div>
        <div className="profile-form-grid">
          <label><span>Full name</span><input value={identity.name} disabled={!isEditing} onChange={event => setIdentity(current => ({ ...current, name: event.target.value }))} required /></label>
          <label><span>Employee ID</span><input value={identity.employeeId} disabled={!isEditing} placeholder="Add employee ID" onChange={event => setIdentity(current => ({ ...current, employeeId: event.target.value }))} /></label>
          <label className="profile-full-field"><span>Work email</span><input value={user.email} disabled aria-label="Work email" /></label>
          <label><span>Phone number</span><input type="tel" value={identity.phone} disabled={!isEditing} placeholder="Add phone number" onChange={event => setIdentity(current => ({ ...current, phone: event.target.value }))} /></label>
          <label><span>Role title</span><input value={identity.title} disabled={!isEditing} onChange={event => setIdentity(current => ({ ...current, title: event.target.value }))} /></label>
          <label className="profile-full-field"><span>Assigned locations</span><input value={identity.locations} disabled={!isEditing} placeholder="e.g. North Yard, Central Office" onChange={event => setIdentity(current => ({ ...current, locations: event.target.value }))} /><small>Separate multiple locations with commas.</small></label>
          <label><span>Employment status</span><select value={identity.employmentStatus} disabled={!isEditing} onChange={event => setIdentity(current => ({ ...current, employmentStatus: event.target.value as typeof current.employmentStatus }))}><option value="active">Active</option><option value="on_leave">On leave</option><option value="terminated">Terminated</option></select></label>
          <label><span>Hire date</span><input type="date" value={identity.hireDate} disabled={!isEditing} onChange={event => setIdentity(current => ({ ...current, hireDate: event.target.value }))} /></label>
          <label className="profile-full-field"><span>Profile photo URL</span><input type="url" value={identity.photoUrl} disabled={!isEditing} placeholder="https://…" onChange={event => setIdentity(current => ({ ...current, photoUrl: event.target.value }))} /><small>Use a secure image URL. When blank, FireGuard uses your initials.</small></label>
        </div>
      </form>

      <aside className="profile-side-stack">
        <article className="profile-metrics-card surface-card"><SurfaceTitle title="Work snapshot" subtitle="Current operational record" /><div className="profile-metric-grid"><div><span>Hours this week</span><strong>{metrics.weeklyHours}</strong></div><div><span>Completed work</span><strong>{metrics.completedWorkOrders}</strong></div><div><span>Learning complete</span><strong>{metrics.completedLearning}</strong></div></div></article>
        <article className="profile-time-card surface-card"><SurfaceTitle title="Clock history" subtitle="Your six most recent entries" />{timeEntries.length ? <div className="profile-time-list">{timeEntries.map(entry => <div key={entry.id}><span><Clock3 size={14} />{formatDate(entry.clockedInAt, { month: "short", day: "numeric" })}</span><strong>{formatTime(entry.clockedInAt)} — {entry.clockedOutAt ? formatTime(entry.clockedOutAt) : "In progress"}</strong></div>)}</div> : <p className="profile-empty-copy">No time entries are recorded yet.</p>}</article>
      </aside>

      <section className="profile-work-card surface-card"><div className="profile-section-heading"><div><span className="soft-label">Work-related data</span><h2>Assigned upcoming work</h2><p>Service windows linked to your operator record appear here automatically.</p></div><CalendarClock size={20} color="#5aad90" /></div>{upcomingShifts.length ? <div className="profile-work-list">{upcomingShifts.map(shift => <div className="profile-work-row" key={shift.id}><div className="profile-work-date"><strong>{new Date(shift.scheduledFor).getDate()}</strong><span>{new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(shift.scheduledFor))}</span></div><div><strong>{shift.title}</strong><p>{shift.siteName} <span aria-hidden="true">·</span> {shift.workType}</p></div><span className="profile-work-time">{formatTime(shift.scheduledFor)}</span><StatusBadge tone={shift.status === "blocked" ? "risk" : shift.status === "complete" ? "good" : "neutral"}>{shift.status.replace("_", " ")}</StatusBadge></div>)}</div> : <div className="profile-empty-state"><CalendarClock size={22} /><div><strong>No upcoming assigned work</strong><p>When a manager assigns a service window to your account, it will appear here.</p></div></div>}</section>

      <section className="profile-certifications-card surface-card"><div className="profile-section-heading"><div><span className="soft-label">Training readiness</span><h2>Certifications</h2><p>Store the licences and training records that support your operational readiness.</p></div><ActionButton icon={Plus} tone="quiet" onClick={() => setCertificationDialogOpen(true)}>Add certification</ActionButton></div>{certifications.length ? <div className="profile-certification-list">{certifications.map(certification => { const state = expiryTone(certification.expiresAt); return <div className="profile-certification-row" key={certification.id}><div className="profile-certification-icon"><BadgeCheck size={18} /></div><div><strong>{certification.name}</strong><p>{certification.authority || "Issuing authority not recorded"}</p></div><div className="profile-certification-expiry"><span>Expires {formatDate(certification.expiresAt)}</span><StatusBadge tone={state.tone}>{state.label}</StatusBadge></div><button type="button" className="profile-icon-action" onClick={() => deleteCertification.mutate({ certificationId: certification.id })} aria-label={`Delete ${certification.name}`} disabled={deleteCertification.isPending}><Trash2 size={15} /></button></div>; })}</div> : <div className="profile-empty-state"><GraduationCap size={22} /><div><strong>No certifications saved</strong><p>Add a licence or completed training record and FireGuard will highlight it as it approaches expiry.</p></div></div>}</section>
    </div>}

    {activeTab === "access" && <div className="profile-access-layout">
      <section className="profile-access-card surface-card"><div className="profile-section-heading"><div><span className="soft-label">Role-based access</span><h2>Permissions and scope</h2><p>Your access is issued from your FireGuard role and updates across the workspace.</p></div><div className="profile-access-heading-actions"><StatusBadge tone="good">{permissions.role}</StatusBadge>{permissions.role === "admin" && <ActionButton tone="quiet" icon={ShieldCheck} onClick={() => setRoleDialogOpen(true)}>Change role</ActionButton>}</div></div><div className="profile-role-panel"><div className="profile-role-icon"><ShieldCheck size={21} /></div><div><span className="soft-label">Current role</span><strong>{profile.title}</strong><p>{permissions.role === "admin" ? "Administrator sessions can revise their own role. The action is recorded before the new scope takes effect." : "Role changes are managed by a FireGuard administrator to preserve operational accountability."}</p></div></div><div className="profile-grant-list">{permissions.grants.map(grant => <div key={grant}><CheckCircle2 size={15} /><span>{grant}</span></div>)}</div></section>
      <aside className="profile-side-stack"><article className="profile-pin-card surface-card"><div className="profile-section-heading"><div><span className="soft-label">Register access</span><h2>Access PIN</h2><p>A separate 4–6 digit PIN can be used for supported register and clock-in workflows.</p></div><KeyRound size={20} color="#d94a3a" /></div><div className="profile-pin-status"><span className={`profile-pin-indicator ${data.preferences.pinConfigured ? "is-set" : ""}`}><span />{data.preferences.pinConfigured ? "PIN configured" : "No PIN configured"}</span>{data.preferences.pinUpdatedAt && <small>Last updated {formatDate(data.preferences.pinUpdatedAt)}</small>}</div><ActionButton icon={FileKey2} onClick={() => setPinDialogOpen(true)}>{data.preferences.pinConfigured ? "Reset PIN" : "Set a PIN"}</ActionButton></article><article className="profile-access-note surface-card"><Sparkles size={17} /><div><strong>Access protection</strong><p>Your PIN is salted and hashed before storage. FireGuard never returns the PIN to the app after it is saved.</p></div></article></aside>
      <section className="profile-audit-card surface-card"><SurfaceTitle title="Recent profile audit trail" subtitle="Your personal access and settings changes" />{audits.length ? <div className="profile-audit-list">{audits.map(audit => <div key={audit.id}><span className="profile-audit-dot" /><div><strong>{audit.detail}</strong><p>{formatDate(audit.createdAt)} <span aria-hidden="true">·</span> {formatTime(audit.createdAt)}</p></div></div>)}</div> : <div className="profile-empty-state"><ShieldCheck size={22} /><div><strong>No profile changes recorded</strong><p>Future updates to identity, notification settings, or access PIN will appear here.</p></div></div>}</section>
    </div>}

    {activeTab === "settings" && <div className="profile-settings-layout"><section className="profile-preferences-card surface-card"><div className="profile-section-heading"><div><span className="soft-label">Personal settings</span><h2>Notification preferences</h2><p>Choose the operational prompts you want delivered through FireGuard.</p></div><BellRing size={20} color="#5aad90" /></div><PreferenceToggle label="Assignment updates" description="Tell me when service work is assigned or reassigned to me." checked={preferences.notifyAssignments} onClick={() => setPreferences(current => ({ ...current, notifyAssignments: !current.notifyAssignments }))} /><PreferenceToggle label="Exception updates" description="Tell me when an exception is assigned or requires my attention." checked={preferences.notifyExceptions} onClick={() => setPreferences(current => ({ ...current, notifyExceptions: !current.notifyExceptions }))} /><PreferenceToggle label="Learning reminders" description="Tell me about FireGuard Academy training due for my role." checked={preferences.notifyLearning} onClick={() => setPreferences(current => ({ ...current, notifyLearning: !current.notifyLearning }))} /></section><aside className="profile-language-card surface-card"><div className="profile-section-heading"><div><span className="soft-label">Language</span><h2>Display preference</h2><p>Select the interface language used by your profile settings.</p></div></div><label className="profile-language-select"><span>Preferred language</span><select value={preferences.language} onChange={event => setPreferences(current => ({ ...current, language: event.target.value as typeof current.language }))}><option value="en-US">English (United States)</option><option value="es-ES">Español (España)</option><option value="fr-FR">Français (France)</option><option value="pt-BR">Português (Brasil)</option></select></label><p className="profile-language-note">Language preference is retained in your FireGuard account and can be changed at any time.</p></aside><section className="profile-density-card surface-card"><div className="profile-section-heading"><div><span className="soft-label">Workspace layout</span><h2>Display density</h2><p>Choose how much operational information is visible at once. Text and touch targets remain readable.</p></div><Rows3 size={20} color="#5aad90" /></div><PreferenceToggle label="Compact operational layout" description="Reduce non-essential workspace spacing on larger screens to show more records and data at once." checked={preferences.compactDensity} onClick={() => setPreferences(current => ({ ...current, compactDensity: !current.compactDensity }))} /></section></div>}

    <Dialog open={isPinDialogOpen} onOpenChange={setPinDialogOpen}><DialogContent className="profile-dialog"><DialogHeader><DialogTitle>{data.preferences.pinConfigured ? "Reset your access PIN" : "Set an access PIN"}</DialogTitle><DialogDescription>Use a unique 4–6 digit code. FireGuard will store only a protected hash.</DialogDescription></DialogHeader><form className="profile-dialog-form" onSubmit={event => { event.preventDefault(); resetPin.mutate({ pin }); }}><label><span>New PIN</span><input type="password" inputMode="numeric" pattern="[0-9]{4,6}" minLength={4} maxLength={6} autoComplete="new-password" value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ""))} required /><small>Enter 4–6 numbers.</small></label><ActionButton type="submit" icon={KeyRound}>{resetPin.isPending ? "Saving…" : "Save PIN"}</ActionButton></form></DialogContent></Dialog>

    <Dialog open={isCertificationDialogOpen} onOpenChange={setCertificationDialogOpen}><DialogContent className="profile-dialog"><DialogHeader><DialogTitle>Add certification</DialogTitle><DialogDescription>Record a licence or training credential so FireGuard can monitor its expiry date.</DialogDescription></DialogHeader><form className="profile-dialog-form" onSubmit={submitCertification}><label><span>Certification name</span><input value={certificationName} onChange={event => setCertificationName(event.target.value)} placeholder="e.g. Field safety certification" minLength={2} required /></label><label><span>Issuing authority</span><input value={certificationAuthority} onChange={event => setCertificationAuthority(event.target.value)} placeholder="e.g. National Safety Board" /></label><label><span>Expiry date</span><input type="date" value={certificationExpiry} onChange={event => setCertificationExpiry(event.target.value)} required /></label><ActionButton type="submit" icon={Plus}>{addCertification.isPending ? "Adding…" : "Add certification"}</ActionButton></form></DialogContent></Dialog>

    <Dialog open={isRoleDialogOpen} onOpenChange={setRoleDialogOpen}><DialogContent className="profile-dialog"><DialogHeader><DialogTitle>Change FireGuard role</DialogTitle><DialogDescription>This changes workspace access immediately and writes a permission-change entry to the audit trail.</DialogDescription></DialogHeader><form className="profile-dialog-form" onSubmit={event => { event.preventDefault(); updateRole.mutate({ role: roleDraft }); }}><label><span>New role</span><select value={roleDraft} onChange={event => setRoleDraft(event.target.value as OperationalRole)}><option value="user">Workspace member</option><option value="field">Field operator</option><option value="reviewer">Compliance reviewer</option><option value="manager">Operations manager</option><option value="admin">FireGuard administrator</option></select></label><ActionButton type="submit" icon={ShieldCheck}>{updateRole.isPending ? "Updating…" : "Update role"}</ActionButton></form></DialogContent></Dialog>
  </div>;
}
