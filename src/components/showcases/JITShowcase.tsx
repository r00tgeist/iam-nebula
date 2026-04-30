import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Shield, AlertTriangle, RotateCcw, ArrowRight, XCircle, FileText, MessageSquare, ShieldAlert } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const ROLES = [
  { id: "db-admin",     label: "DB Admin (prod)",     risk: "high",     resources: "Production PostgreSQL — read/write", requiresApproval: true,  approvalChain: ["Engineering Mgr", "Security"] },
  { id: "k8s-deploy",   label: "K8s Deployer",        risk: "medium",   resources: "Cluster: prod-eu — apply / restart", requiresApproval: true,  approvalChain: ["SRE on-call"] },
  { id: "billing-view", label: "Billing Viewer",      risk: "low",      resources: "Stripe dashboard — read-only",       requiresApproval: false, approvalChain: [] },
];

type State = "idle" | "submitted" | "approving" | "active" | "expiring" | "expired" | "revoked" | "denied";

interface AuditEntry { ts: string; level: "info" | "warn" | "alert"; msg: string }

const JITShowcase = () => {
  const [state, setState] = useState<State>("idle");
  const [selectedRole, setSelectedRole] = useState("db-admin");
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(0);
  const [justification, setJustification] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [approvalsDone, setApprovalsDone] = useState<string[]>([]);
  const [validJustification, setValidJustification] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const role = ROLES.find(r => r.id === selectedRole)!;

  const log = useCallback((level: AuditEntry["level"], msg: string) => {
    setAudit(prev => [...prev, { ts: new Date().toLocaleTimeString().slice(0, 8), level, msg }]);
  }, []);

  const submit = useCallback(() => {
    if (!justification || justification.length < 12) {
      setValidJustification(false);
      log("warn", "Request rejected — justification too short (< 12 chars)");
      setState("denied");
      return;
    }
    setValidJustification(true);
    setState("submitted");
    setApprovalsDone([]);
    log("info", `Request opened: ${role.label} · ${duration} ticks · "${justification}"`);

    if (!role.requiresApproval) {
      timeoutsRef.current.push(setTimeout(() => {
        log("info", "Auto-approved (low-risk role)");
        activate();
      }, 700));
      return;
    }

    setState("approving");
    role.approvalChain.forEach((a, i) => {
      timeoutsRef.current.push(setTimeout(() => {
        setApprovalsDone(prev => [...prev, a]);
        log("info", `${a} → APPROVE`);
        if (i === role.approvalChain.length - 1) activate();
      }, 900 + i * 900));
    });
  }, [justification, role, duration, log]);

  const activate = () => {
    setState("active");
    setRemaining(duration);
    log("info", `Privileges granted: scope=${role.resources}`);
  };

  useEffect(() => {
    if (state !== "active" && state !== "expiring") return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (next === Math.floor(duration * 0.2)) { log("warn", "TTL below 20% — auto-expiry imminent"); setState("expiring"); }
        if (next <= 0) {
          clearInterval(intervalRef.current);
          setState("expired");
          log("alert", "TTL reached zero — privileges automatically revoked, sessions terminated");
          return 0;
        }
        return next;
      });
    }, 80);
    return () => clearInterval(intervalRef.current);
  }, [state, duration, log]);

  const revoke = () => { clearInterval(intervalRef.current); setState("revoked"); log("alert", "User-initiated revoke — privileges removed instantly"); };
  const reset = () => {
    clearInterval(intervalRef.current); timeoutsRef.current.forEach(clearTimeout);
    setState("idle"); setRemaining(0); setAudit([]); setApprovalsDone([]); setJustification(""); setValidJustification(true);
  };

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const ringColor = state === "active" ? "hsl(263,87%,66%)" : state === "expiring" ? "hsl(48,96%,53%)" : "hsl(349,100%,62%)";

  const isFinished = state === "expired" || state === "revoked" || state === "denied";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Just-In-Time Access</h2>
      <p className="text-sm text-muted-foreground mb-6">
        No standing privileges. Request → approval chain → time-bound elevation → automatic revocation. Every step recorded
        in an immutable audit log for compliance.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request panel */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Privileged role</p>
            <div className="space-y-1.5">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => { if (state === "idle") setSelectedRole(r.id); }} disabled={state !== "idle"}
                  className={`flex items-center gap-3 w-full rounded-xl border px-3 py-2 text-left transition-all ${selectedRole === r.id ? "border-secondary/30 bg-secondary/[0.04]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"} ${state !== "idle" ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <Shield size={14} className={selectedRole === r.id ? "text-secondary" : "text-muted-foreground"} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${selectedRole === r.id ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</p>
                    <p className="text-[9px] text-muted-foreground/60 truncate">{r.resources}</p>
                    <p className="text-[8px] font-mono text-muted-foreground/50">approvals: {r.approvalChain.length === 0 ? "auto" : r.approvalChain.join(" → ")}</p>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${r.risk === "high" ? "text-orange-400 border-orange-500/20" : r.risk === "medium" ? "text-yellow-400 border-yellow-500/20" : "text-green-400 border-green-500/20"}`}>{r.risk}</span>
                </button>
              ))}
            </div>
          </div>

          {state === "idle" && (
            <>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Duration (TTL)</p>
                <div className="flex gap-1.5">
                  {[30, 60, 120].map(d => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-[11px] font-mono transition-all ${duration === d ? "border-secondary/40 bg-secondary/[0.04] text-secondary" : "border-[rgba(255,255,255,0.06)] text-muted-foreground"}`}>{d} ticks</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <MessageSquare size={10} /> Justification (required)
                </p>
                <textarea value={justification} onChange={e => { setJustification(e.target.value); setValidJustification(true); }}
                  placeholder="e.g. Investigate ticket SEC-1842 — slow query on users table"
                  rows={2} className={`w-full rounded-lg bg-[rgba(0,0,0,0.3)] border px-3 py-2 text-[11px] text-foreground font-mono outline-none transition-colors ${validJustification ? "border-[rgba(255,255,255,0.06)] focus:border-secondary/40" : "border-destructive/40"}`} />
                {!validJustification && <p className="text-[10px] text-destructive mt-1">Need ≥ 12 chars. Audit log requires meaningful context.</p>}
              </div>

              <button onClick={submit} disabled={!justification}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary/10 border border-secondary/20 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/15 disabled:opacity-40 transition-all">
                <Clock size={14} /> Submit request <ArrowRight size={12} />
              </button>
            </>
          )}

          {/* approval chain */}
          {(state === "submitted" || state === "approving") && (
            <div className="rounded-xl border border-secondary/20 bg-secondary/[0.02] p-3">
              <p className="text-[10px] font-mono uppercase text-secondary font-semibold mb-2">Approval chain</p>
              <div className="space-y-1.5">
                {role.approvalChain.length === 0 ? <p className="text-[10px] text-muted-foreground/60">auto-approve</p> :
                  role.approvalChain.map(a => {
                    const done = approvalsDone.includes(a);
                    return (
                      <div key={a} className={`flex items-center gap-2 text-[10px] font-mono ${done ? "text-green-400" : "text-muted-foreground"}`}>
                        {done ? <CheckCircle2 size={10} /> : <motion.div className="h-2.5 w-2.5 rounded-full border border-secondary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />}
                        {a} {done && "→ approved"}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Status + audit panel */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4">
            {(state === "active" || state === "expiring" || state === "expired" || state === "revoked") ? (
              <>
                <div className="flex justify-center mb-3">
                  <div className="relative h-24 w-24">
                    <svg viewBox="0 0 96 96" className="w-full h-full">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                      <motion.circle cx="48" cy="48" r="42" fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`} animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - pct / 100) }} transform="rotate(-90 48 48)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-lg font-mono font-bold ${state === "active" ? "text-secondary" : state === "expiring" ? "text-yellow-400" : "text-destructive"}`}>
                        {state === "expired" ? "0" : state === "revoked" ? "×" : remaining}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground">ticks</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="text-foreground">{role.label}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                    <span className={state === "active" ? "text-green-400" : state === "expiring" ? "text-yellow-400" : "text-destructive"}>
                      {state.toUpperCase()}
                    </span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">TTL</span><span className="text-foreground">{duration}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Audit events</span><span className="text-foreground">{audit.length}</span></div>
                </div>
                {(state === "active" || state === "expiring") && (
                  <button onClick={revoke} className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 py-2 text-[11px] font-semibold text-destructive hover:bg-destructive/15">
                    <XCircle size={12} /> Revoke now
                  </button>
                )}
              </>
            ) : state === "denied" ? (
              <div className="text-center py-6">
                <ShieldAlert size={26} className="text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive font-medium">Request denied</p>
                <p className="text-[10px] text-muted-foreground/60">Insufficient justification</p>
              </div>
            ) : state === "idle" ? (
              <div className="text-center py-6">
                <Clock size={26} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active session</p>
                <p className="text-[10px] text-muted-foreground/50">Standing privileges = 0</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <motion.div className="h-5 w-5 mx-auto mb-2 rounded-full border-2 border-secondary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                <p className="text-sm text-secondary">{state === "submitted" ? "Submitting…" : "Awaiting approvals…"}</p>
              </div>
            )}
          </div>

          {/* Audit log */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={11} className="text-muted-foreground" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Immutable audit trail</span>
            </div>
            <div className="space-y-0.5 max-h-44 overflow-y-auto font-mono text-[10px] pr-1">
              {audit.length === 0 ? <p className="text-muted-foreground/40">no events yet</p> :
                audit.map((e, i) => (
                  <p key={i} className={e.level === "alert" ? "text-destructive" : e.level === "warn" ? "text-yellow-400" : "text-muted-foreground"}>
                    <span className="text-muted-foreground/50">{e.ts}</span>  {e.msg}
                  </p>
                ))}
            </div>
          </div>

          {isFinished && (
            <button onClick={reset} className="w-full flex items-center justify-center gap-2 rounded-xl bg-muted/50 border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all">
              <RotateCcw size={14} /> New request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JITShowcase;
