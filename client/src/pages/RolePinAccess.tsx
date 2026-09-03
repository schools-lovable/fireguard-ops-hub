import { useState } from "react";
import { useLocation } from "wouter";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const roles = ["admin", "manager", "technician", "sales", "finance"] as const;

export default function RolePinAccess() {
  const [, setLocation] = useLocation(); const [role, setRole] = useState<(typeof roles)[number]>("manager"); const [pin, setPin] = useState("");
  const login = trpc.auth.login.useMutation({ onSuccess: result => { toast.success(`${result.user.name || role} access enabled for eight hours.`); setLocation("/"); }, onError: error => toast.error(error.message) });
  return <main className="pin-access"><section className="pin-card"><div className="pin-mark"><ShieldCheck size={24} /></div><span className="soft-label">FireGuard role access</span><h1>Enter operations with a role PIN</h1><p>Choose the shared operational role approved for this session. Role access is rate-limited and expires after eight hours.</p><label>Operational role<select value={role} onChange={event => setRole(event.target.value as typeof role)}>{roles.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label>Role PIN<input value={pin} type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={12} placeholder="4–12 digits" onChange={event => setPin(event.target.value.replace(/\D/g, ""))} /></label><button type="button" className="command-button" disabled={pin.length < 4 || login.isPending} onClick={() => login.mutate({ role, pin })}><KeyRound size={15} />{login.isPending ? "Verifying access…" : "Open FireGuard"}</button><button type="button" className="pin-back" onClick={() => setLocation("/")}>Return to workspace</button></section></main>;
}
