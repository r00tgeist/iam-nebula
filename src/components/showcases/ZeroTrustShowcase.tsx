import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanEye, ShieldCheck, ShieldX, User, Laptop, MapPin, FileText, ArrowRight, RotateCcw, Zap, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Checkpoint { id: string; label: string; icon: React.ReactNode; desc: string; passRate: number }

const CHECKPOINTS: Checkpoint[] = [
  { id: "identity", label: "Identity Verification", icon: <User size={16} />, desc: "MFA + certificate check", passRate: 0.95 },
  { id: "device", label: "Device Posture", icon: <Laptop size={16} />, desc: "MDM enrollment, OS patches, AV status", passRate: 0.85 },
  { id: "network", label: "Network Context", icon: <MapPin size={16} />, desc: "IP reputation, geo-location, VPN check", passRate: 0.9 },
  { id: "policy", label: "Policy Engine", icon: <FileText size={16} />, desc: "ABAC rules + risk score evaluation", passRate: 0.88 },
  { id: "microseg", label: "Micro-Segmentation", icon: <ScanEye size={16} />, desc: "Least-privilege network path to resource", passRate: 0.92 },
];

type CpStatus = "pending" | "checking" | "passed" | "failed";

const ZeroTrustShowcase = () => {
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, CpStatus>>({});
  const [failedAt, setFailedAt] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [simulateFail, setSimulateFail] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    setRunning(false);
    setDone(false);
    setAllPassed(false);
    setFailedAt(null);
    setStatuses({});
  }, []);

  const start = useCallback(() => {
    if (running) return;
    reset();
    setRunning(true);

    const failIndex = simulateFail ? 1 + Math.floor(Math.random() * (CHECKPOINTS.length - 1)) : -1;
    let delay = 0;

    CHECKPOINTS.forEach((cp, i) => {
      delay += 300;
      timeoutsRef.current.push(setTimeout(() => setStatuses(prev => ({ ...prev, [cp.id]: "checking" })), delay));
      delay += 800 + Math.random() * 400;
      timeoutsRef.current.push(setTimeout(() => {
        const passed = i !== failIndex;
        setStatuses(prev => ({ ...prev, [cp.id]: passed ? "passed" : "failed" }));
        if (!passed) {
          setFailedAt(cp.id);
          setDone(true);
          setRunning(false);
        }
      }, delay));
      if (i === failIndex) return;
    });

    if (failIndex === -1) {
      delay += 500;
      timeoutsRef.current.push(setTimeout(() => { setDone(true); setAllPassed(true); setRunning(false); }, delay));
    }
  }, [running, simulateFail, reset]);

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Zero Trust Verification</h2>
      <p className="text-sm text-muted-foreground mb-8">Every request passes through all checkpoints. No implicit trust — even internal traffic is verified at every hop.</p>

      {/* Fail toggle */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setSimulateFail(!simulateFail)} disabled={running}
          className={`h-5 w-9 rounded-full transition-colors relative ${simulateFail ? "bg-destructive/30" : "bg-muted/30"} ${running ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
          <motion.div className={`absolute top-0.5 h-4 w-4 rounded-full ${simulateFail ? "bg-destructive" : "bg-muted-foreground/40"}`}
            animate={{ left: simulateFail ? 18 : 2 }} transition={spring} />
        </button>
        <span className="text-xs text-muted-foreground">Simulate random checkpoint failure</span>
      </div>

      {/* Checkpoints */}
      <div className="space-y-3 mb-8">
        {CHECKPOINTS.map((cp, i) => {
          const status = statuses[cp.id] || "pending";
          return (
            <motion.div key={cp.id} layout transition={spring}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                status === "passed" ? "border-green-500/15 bg-green-500/[0.02]" :
                status === "failed" ? "border-destructive/15 bg-destructive/[0.02]" :
                status === "checking" ? "border-primary/20 bg-primary/[0.02]" :
                "border-[rgba(255,255,255,0.06)]"
              }`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                status === "passed" ? "bg-green-500/15 text-green-400" :
                status === "failed" ? "bg-destructive/15 text-destructive" :
                status === "checking" ? "bg-primary/15 text-primary" :
                "bg-muted/30 text-muted-foreground/40"
              }`}>
                {status === "passed" ? <CheckCircle2 size={18} /> : status === "failed" ? <XCircle size={18} /> : status === "checking" ? (
                  <motion.div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                ) : cp.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${status !== "pending" ? "text-foreground" : "text-muted-foreground/50"}`}>{cp.label}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/40">checkpoint {i + 1}/{CHECKPOINTS.length}</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60">{cp.desc}</p>
              </div>
              {status === "passed" && <span className="text-[9px] font-mono text-green-400">PASS</span>}
              {status === "failed" && <span className="text-[9px] font-mono text-destructive">FAIL — REQUEST BLOCKED</span>}
            </motion.div>
          );
        })}
      </div>

      {/* Result */}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}
            className={`rounded-xl border p-5 mb-6 ${allPassed ? "border-green-500/20 bg-green-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${allPassed ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`}>
                {allPassed ? <ShieldCheck size={20} /> : <ShieldX size={20} />}
              </div>
              <div>
                <p className={`font-display text-sm font-bold ${allPassed ? "text-green-400" : "text-destructive"}`}>
                  {allPassed ? "All Checkpoints Passed" : "Request Denied"}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {allPassed
                    ? "The request passed every verification checkpoint. Micro-segmented access granted with continuous monitoring enabled."
                    : `Verification failed at "${CHECKPOINTS.find(c => c.id === failedAt)?.label}". No access granted — zero trust means any failure blocks the entire request.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-center">
        {!running && !done && (
          <motion.button onClick={start} className="group flex items-center gap-3 rounded-xl bg-secondary/10 border border-secondary/20 px-8 py-3.5 text-sm font-semibold text-secondary hover:bg-secondary/15 transition-all"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <ScanEye size={16} /> Verify Request <ArrowRight size={14} />
          </motion.button>
        )}
        {done && (
          <motion.button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            whileHover={{ scale: 1.02 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RotateCcw size={14} /> New Request
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ZeroTrustShowcase;
