import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, KeyRound, Smartphone, ShieldCheck, ShieldX, Zap, ArrowRight, RotateCcw, CheckCircle2, Lock } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type FactorStatus = "pending" | "verifying" | "passed" | "failed";
interface Factor { id: string; label: string; type: string; icon: React.ReactNode; desc: string }

const FACTORS: Factor[] = [
  { id: "password", label: "Password", type: "Knowledge", icon: <KeyRound size={18} />, desc: "Something you know — verified against stored hash" },
  { id: "totp", label: "TOTP Code", type: "Possession", icon: <Smartphone size={18} />, desc: "Something you have — 6-digit code from authenticator app" },
  { id: "biometric", label: "Fingerprint", type: "Inherence", icon: <Fingerprint size={18} />, desc: "Something you are — biometric template comparison" },
];

const MFAShowcase = () => {
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, FactorStatus>>({ password: "pending", totp: "pending", biometric: "pending" });
  const [activeFactor, setActiveFactor] = useState(0);
  const [done, setDone] = useState(false);
  const [enabledFactors, setEnabledFactors] = useState<Set<string>>(new Set(["password", "totp"]));
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    setRunning(false);
    setDone(false);
    setActiveFactor(0);
    setStatuses({ password: "pending", totp: "pending", biometric: "pending" });
  }, []);

  const toggleFactor = (id: string) => {
    if (id === "password" || running) return; // password always required
    setEnabledFactors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const start = useCallback(() => {
    if (running) return;
    reset();
    setRunning(true);
    const enabled = FACTORS.filter(f => enabledFactors.has(f.id));
    let delay = 0;

    enabled.forEach((f, i) => {
      delay += 400;
      timeoutsRef.current.push(setTimeout(() => {
        setActiveFactor(i);
        setStatuses(prev => ({ ...prev, [f.id]: "verifying" }));
      }, delay));
      delay += 1200;
      timeoutsRef.current.push(setTimeout(() => {
        setStatuses(prev => ({ ...prev, [f.id]: "passed" }));
      }, delay));
    });
    delay += 600;
    timeoutsRef.current.push(setTimeout(() => { setDone(true); setRunning(false); }, delay));
  }, [running, enabledFactors, reset]);

  const enabledList = FACTORS.filter(f => enabledFactors.has(f.id));
  const passedCount = enabledList.filter(f => statuses[f.id] === "passed").length;
  const mfaLevel = enabledFactors.size >= 3 ? "Strong" : enabledFactors.size >= 2 ? "Standard" : "Weak (SFA)";
  const mfaColor = enabledFactors.size >= 3 ? "text-green-400" : enabledFactors.size >= 2 ? "text-primary" : "text-destructive";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Multi-Factor Authentication</h2>
      <p className="text-sm text-muted-foreground mb-8">Enable multiple factors and watch them verify in sequence. Each layer adds security depth.</p>

      {/* Factor toggles */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Authentication Factors</p>
          <span className={`text-[10px] font-mono font-bold ${mfaColor}`}>{mfaLevel} ({enabledFactors.size}FA)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FACTORS.map(f => {
            const enabled = enabledFactors.has(f.id);
            const status = statuses[f.id];
            const isPw = f.id === "password";
            return (
              <motion.div key={f.id} layout transition={spring}
                className={`relative rounded-xl border p-4 transition-all ${enabled ? "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]" : "border-[rgba(255,255,255,0.04)] bg-transparent opacity-40"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${status === "passed" ? "bg-green-500/15 text-green-400" : status === "verifying" ? "bg-primary/15 text-primary" : enabled ? "bg-muted/40 text-muted-foreground" : "bg-muted/20 text-muted-foreground/40"}`}>
                    {status === "passed" ? <CheckCircle2 size={18} /> : f.icon}
                  </div>
                  {!isPw && (
                    <button onClick={() => toggleFactor(f.id)} disabled={running}
                      className={`h-5 w-9 rounded-full transition-colors relative ${enabled ? "bg-primary/30" : "bg-muted/30"} ${running ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <motion.div className={`absolute top-0.5 h-4 w-4 rounded-full ${enabled ? "bg-primary" : "bg-muted-foreground/40"}`}
                        animate={{ left: enabled ? 18 : 2 }} transition={spring} />
                    </button>
                  )}
                  {isPw && <Lock size={12} className="text-muted-foreground/40" />}
                </div>
                <p className={`text-sm font-semibold ${enabled ? "text-foreground" : "text-muted-foreground/50"}`}>{f.label}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mb-1">{f.type} factor</p>
                <p className="text-[10px] text-muted-foreground/50">{f.desc}</p>

                {/* Status indicator */}
                {status === "verifying" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center gap-2">
                    <motion.div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    <span className="text-[10px] font-mono text-primary">Verifying...</span>
                  </motion.div>
                )}
                {status === "passed" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-400" />
                    <span className="text-[10px] font-mono text-green-400">Verified</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      {(running || done) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Verification Progress</span>
            <span className="text-[10px] font-mono text-foreground">{passedCount}/{enabledList.length} factors</span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
            <motion.div className={`h-full rounded-full ${done ? "bg-green-400" : "bg-primary"}`}
              animate={{ width: `${(passedCount / enabledList.length) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}
            className="rounded-xl border border-green-500/20 bg-green-500/[0.02] px-5 py-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 text-green-400"><ShieldCheck size={20} /></div>
              <div>
                <p className="font-display text-sm font-bold text-green-400">All Factors Verified</p>
                <p className="mt-1 text-[12px] text-muted-foreground">Identity confirmed with {enabledList.length} authentication factor{enabledList.length > 1 ? "s" : ""}. Security level: <span className={`font-bold ${mfaColor}`}>{mfaLevel}</span></p>
                <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-3 font-mono text-[10px] text-muted-foreground space-y-1">
                  <p><span className="text-primary">amr:</span> [{enabledList.map(f => `"${f.id}"`).join(", ")}]</p>
                  <p><span className="text-primary">acr:</span> {enabledFactors.size >= 3 ? "urn:mfa:strong" : enabledFactors.size >= 2 ? "urn:mfa:standard" : "urn:sfa"}</p>
                  <p><span className="text-primary">auth_time:</span> {Math.floor(Date.now() / 1000)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-center">
        {!running && !done && (
          <motion.button onClick={start} className="group flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-8 py-3.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-all"
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,229,255,0.15)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Zap size={16} /> Verify {enabledList.length} Factor{enabledList.length > 1 ? "s" : ""} <ArrowRight size={14} />
          </motion.button>
        )}
        {done && (
          <motion.button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            whileHover={{ scale: 1.02 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RotateCcw size={14} /> Reset
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default MFAShowcase;
