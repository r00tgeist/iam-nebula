import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Shield, AlertTriangle, RotateCcw, Zap, ArrowRight, XCircle } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const JIT_ROLES = [
  { id: "db-admin", label: "Database Admin", risk: "high", resources: "Production DB (read/write)" },
  { id: "k8s-deploy", label: "K8s Deployer", risk: "medium", resources: "Cluster deploy permissions" },
  { id: "billing-view", label: "Billing Viewer", risk: "low", resources: "Billing dashboard (read-only)" },
];

type JITState = "idle" | "requesting" | "approving" | "active" | "expired" | "revoked";

const JITShowcase = () => {
  const [state, setState] = useState<JITState>("idle");
  const [selectedRole, setSelectedRole] = useState("db-admin");
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(0);
  const [justification, setJustification] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const role = JIT_ROLES.find(r => r.id === selectedRole)!;

  const request = useCallback(() => {
    setState("requesting");
    timeoutsRef.current.push(setTimeout(() => setState("approving"), 800));
    timeoutsRef.current.push(setTimeout(() => {
      setState("active");
      setRemaining(duration);
    }, 2200));
  }, [duration]);

  useEffect(() => {
    if (state !== "active") return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { setState("expired"); clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 50); // sped up for demo
    return () => clearInterval(intervalRef.current);
  }, [state]);

  const revoke = () => { clearInterval(intervalRef.current); setState("revoked"); };
  const reset = () => { clearInterval(intervalRef.current); timeoutsRef.current.forEach(clearTimeout); setState("idle"); setRemaining(0); };

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const isWarning = remaining > 0 && remaining < duration * 0.2;

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Just-In-Time Access</h2>
      <p className="text-sm text-muted-foreground mb-8">Request temporary elevated privileges. Access auto-expires — no standing permissions.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {/* Role selection */}
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Privileged Role</p>
          <div className="space-y-2 mb-6">
            {JIT_ROLES.map(r => (
              <button key={r.id} onClick={() => { if (state === "idle") setSelectedRole(r.id); }} disabled={state !== "idle"}
                className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all ${selectedRole === r.id ? "border-secondary/30 bg-secondary/[0.04]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"} ${state !== "idle" ? "opacity-40" : ""}`}>
                <Shield size={16} className={selectedRole === r.id ? "text-secondary" : "text-muted-foreground"} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${selectedRole === r.id ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</p>
                  <p className="text-[10px] text-muted-foreground/60">{r.resources}</p>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${r.risk === "high" ? "text-orange-400 border-orange-500/20" : r.risk === "medium" ? "text-yellow-400 border-yellow-500/20" : "text-green-400 border-green-500/20"}`}>{r.risk}</span>
              </button>
            ))}
          </div>

          {/* Duration */}
          {state === "idle" && (
            <div className="mb-6">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Duration</p>
              <div className="flex gap-2">
                {[30, 60, 120].map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`px-4 py-2 rounded-xl border text-xs font-mono transition-all ${duration === d ? "border-secondary/40 bg-secondary/[0.04] text-secondary" : "border-[rgba(255,255,255,0.06)] text-muted-foreground"}`}>
                    {d} ticks
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status panel */}
        <div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            {(state === "active" || state === "expired" || state === "revoked") && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="relative h-28 w-28">
                    <svg viewBox="0 0 112 112" className="w-full h-full">
                      <circle cx="56" cy="56" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                      <motion.circle cx="56" cy="56" r="50" fill="none"
                        stroke={state !== "active" ? "hsl(349,100%,62%)" : isWarning ? "hsl(48,96%,53%)" : "hsl(263,87%,66%)"}
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - pct / 100) }}
                        transform="rotate(-90 56 56)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-xl font-mono font-bold ${state !== "active" ? "text-destructive" : isWarning ? "text-yellow-400" : "text-secondary"}`}>
                        {state === "expired" ? "0" : state === "revoked" ? "×" : remaining}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground">ticks</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="text-foreground">{role.label}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                    <span className={state === "active" ? "text-green-400" : "text-destructive"}>{state === "active" ? "ELEVATED" : state === "expired" ? "EXPIRED" : "REVOKED"}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">TTL</span><span className="text-foreground">{duration} ticks</span></div>
                </div>
              </>
            )}

            {state === "idle" && (
              <div className="text-center py-6">
                <Clock size={28} className="text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active JIT session</p>
                <p className="text-[10px] text-muted-foreground/50">Select a role and request access</p>
              </div>
            )}

            {(state === "requesting" || state === "approving") && (
              <div className="text-center py-6">
                <motion.div className="h-6 w-6 mx-auto mb-3 rounded-full border-2 border-secondary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                <p className="text-sm text-secondary font-medium">{state === "requesting" ? "Submitting request..." : "Waiting for approval..."}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">{state === "approving" ? "Manager auto-approving (demo)" : "Validating justification"}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            {state === "active" && (
              <motion.button onClick={revoke} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-all">
                <XCircle size={14} /> Revoke Early
              </motion.button>
            )}
            {(state === "expired" || state === "revoked") && (
              <motion.button onClick={reset} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-muted/50 border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all">
                <RotateCcw size={14} /> New Request
              </motion.button>
            )}
          </div>

          {(state === "expired" || state === "revoked") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl border border-green-500/20 bg-green-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={12} className="text-green-400" /><span className="text-[10px] font-mono uppercase text-green-400 font-semibold">Privileges Removed</span></div>
              <p className="text-[11px] text-muted-foreground">Elevated access has been automatically revoked. User is back to base permissions. Audit log recorded.</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Start button */}
      {state === "idle" && (
        <div className="flex justify-center mt-6">
          <motion.button onClick={request} className="group flex items-center gap-3 rounded-xl bg-secondary/10 border border-secondary/20 px-8 py-3.5 text-sm font-semibold text-secondary hover:bg-secondary/15 transition-all"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Clock size={16} /> Request Elevation <ArrowRight size={14} />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default JITShowcase;
