import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanEye, ShieldCheck, ShieldX, User, Laptop, MapPin, FileText, ArrowRight, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Activity, Repeat } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

// Each signal contributes a weighted score; the policy engine adds obligations
// when totals cross thresholds. Continuous re-evaluation runs every "tick"
// to model continuous adaptive trust assessment (CAEP / Risk-based access).

type Status = "pending" | "checking" | "passed" | "failed";

interface Signal {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  evaluate: (env: Env) => { score: number; ok: boolean; detail: string };
}

interface Env {
  managedDevice: boolean;
  patched: boolean;
  geo: "expected" | "anomalous";
  network: "corporate" | "trusted-vpn" | "public-wifi";
  identity: "mfa-strong" | "mfa-weak" | "password-only";
  impossibleTravel: boolean;
}

const SIGNALS: Signal[] = [
  { id: "identity", label: "Identity Verification", icon: <User size={14} />, desc: "AAL/IAL evaluation, fresh AuthN within session window",
    evaluate: e => {
      const m = e.identity === "mfa-strong" ? 0 : e.identity === "mfa-weak" ? 25 : 60;
      return { score: m, ok: m < 50, detail: `acr=${e.identity}` };
    } },
  { id: "device", label: "Device Posture", icon: <Laptop size={14} />, desc: "MDM enrollment, OS patch level, EDR healthy",
    evaluate: e => {
      const s = (e.managedDevice ? 0 : 30) + (e.patched ? 0 : 25);
      return { score: s, ok: s < 40, detail: `mdm=${e.managedDevice} · patches=${e.patched ? "current" : "missing"}` };
    } },
  { id: "network", label: "Network Context", icon: <MapPin size={14} />, desc: "IP reputation, geo, ASN, TLS posture",
    evaluate: e => {
      const s = e.network === "corporate" ? 0 : e.network === "trusted-vpn" ? 10 : 35;
      return { score: s, ok: s < 30, detail: `network=${e.network}` };
    } },
  { id: "behavior", label: "Behavioural Signals", icon: <Activity size={14} />, desc: "Geo-velocity, time-of-day, peer-group baseline",
    evaluate: e => {
      const s = (e.impossibleTravel ? 50 : 0) + (e.geo === "anomalous" ? 20 : 0);
      return { score: s, ok: s < 30, detail: `travel=${e.impossibleTravel ? "impossible" : "ok"} · geo=${e.geo}` };
    } },
  { id: "policy", label: "Policy Engine", icon: <FileText size={14} />, desc: "PDP combines signals, applies obligations",
    evaluate: () => ({ score: 0, ok: true, detail: "deny-overrides + obligations" }) },
  { id: "microseg", label: "Micro-Segmentation", icon: <ScanEye size={14} />, desc: "L7 path narrowed to one workload + mTLS only",
    evaluate: () => ({ score: 0, ok: true, detail: "destination scoped to single workload" }) },
];

const ZeroTrustShowcase = () => {
  const [env, setEnv] = useState<Env>({
    managedDevice: true, patched: true, geo: "expected", network: "trusted-vpn", identity: "mfa-strong", impossibleTravel: false,
  });
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [verdict, setVerdict] = useState<"allow" | "step-up" | "deny" | null>(null);
  const [continuous, setContinuous] = useState(false);
  const [tick, setTick] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const evaluations = useMemo(() => SIGNALS.map(s => ({ id: s.id, ...s.evaluate(env) })), [env]);
  const totalRisk = useMemo(() => evaluations.reduce((a, b) => a + b.score, 0), [evaluations]);

  const computeVerdict = useCallback((risk: number, evals: typeof evaluations): "allow" | "step-up" | "deny" => {
    const hardFail = evals.some(e => !e.ok && e.score >= 50);
    if (hardFail || risk >= 90) return "deny";
    if (risk >= 40) return "step-up";
    return "allow";
  }, []);

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    setStatuses({}); setRunning(false); setDone(false); setVerdict(null); setContinuous(false); setTick(0);
  }, []);

  const start = useCallback(() => {
    if (running) return;
    setStatuses({}); setVerdict(null); setDone(false);
    setRunning(true);
    let delay = 0;
    SIGNALS.forEach((s, i) => {
      delay += 250;
      timeoutsRef.current.push(setTimeout(() => setStatuses(p => ({ ...p, [s.id]: "checking" })), delay));
      delay += 600;
      timeoutsRef.current.push(setTimeout(() => {
        const e = SIGNALS[i].evaluate(env);
        setStatuses(p => ({ ...p, [s.id]: e.ok ? "passed" : "failed" }));
      }, delay));
    });
    delay += 400;
    timeoutsRef.current.push(setTimeout(() => {
      setVerdict(computeVerdict(totalRisk, evaluations));
      setDone(true); setRunning(false);
    }, delay));
  }, [running, env, evaluations, totalRisk, computeVerdict]);

  // Continuous mode: periodically re-score the live environment
  useEffect(() => {
    if (!continuous || !done) return;
    const id = setInterval(() => {
      setTick(t => t + 1);
      setVerdict(computeVerdict(totalRisk, evaluations));
    }, 1500);
    return () => clearInterval(id);
  }, [continuous, done, totalRisk, evaluations, computeVerdict]);

  const verdictColor = verdict === "allow" ? "text-green-400" : verdict === "step-up" ? "text-yellow-400" : verdict === "deny" ? "text-destructive" : "text-muted-foreground";
  const verdictBg = verdict === "allow" ? "border-green-500/20 bg-green-500/[0.02]" : verdict === "step-up" ? "border-yellow-500/20 bg-yellow-500/[0.02]" : verdict === "deny" ? "border-destructive/20 bg-destructive/[0.02]" : "border-[rgba(255,255,255,0.06)]";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Zero Trust Verification</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Every request — internal or external — is scored against multiple live signals. The PDP returns one of
        <span className="text-green-400"> allow</span>, <span className="text-yellow-400">step-up</span>, or
        <span className="text-destructive"> deny</span>. <span className="text-foreground">Continuous mode</span> re-evaluates the session as conditions drift.
      </p>

      {/* Environment knobs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 text-[10px]">
        {[
          { label: "Device managed?", val: env.managedDevice, set: () => setEnv({ ...env, managedDevice: !env.managedDevice }) },
          { label: "OS patched?",     val: env.patched,       set: () => setEnv({ ...env, patched: !env.patched }) },
          { label: "Impossible travel?", val: env.impossibleTravel, set: () => setEnv({ ...env, impossibleTravel: !env.impossibleTravel }), invert: true },
        ].map(k => (
          <button key={k.label} onClick={k.set}
            className={`rounded-lg border px-3 py-2 text-left transition-all ${(k.invert ? !k.val : k.val) ? "border-green-500/20 bg-green-500/[0.04]" : "border-orange-500/20 bg-orange-500/[0.04]"}`}>
            <p className="text-muted-foreground">{k.label}</p>
            <p className={`font-mono ${(k.invert ? !k.val : k.val) ? "text-green-400" : "text-orange-400"}`}>{k.val ? "yes" : "no"}</p>
          </button>
        ))}
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-2">
          <p className="text-muted-foreground mb-1">Identity</p>
          <select value={env.identity} onChange={e => setEnv({ ...env, identity: e.target.value as any })} className="w-full bg-transparent text-foreground font-mono outline-none">
            <option value="mfa-strong">mfa-strong</option><option value="mfa-weak">mfa-weak</option><option value="password-only">password-only</option>
          </select>
        </div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-2">
          <p className="text-muted-foreground mb-1">Network</p>
          <select value={env.network} onChange={e => setEnv({ ...env, network: e.target.value as any })} className="w-full bg-transparent text-foreground font-mono outline-none">
            <option value="corporate">corporate</option><option value="trusted-vpn">trusted-vpn</option><option value="public-wifi">public-wifi</option>
          </select>
        </div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-2">
          <p className="text-muted-foreground mb-1">Geo</p>
          <select value={env.geo} onChange={e => setEnv({ ...env, geo: e.target.value as any })} className="w-full bg-transparent text-foreground font-mono outline-none">
            <option value="expected">expected</option><option value="anomalous">anomalous</option>
          </select>
        </div>
      </div>

      {/* Signal list */}
      <div className="space-y-2 mb-5">
        {SIGNALS.map((cp, i) => {
          const status = statuses[cp.id] ?? "pending";
          const ev = evaluations[i];
          return (
            <motion.div key={cp.id} layout transition={spring}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                status === "passed" ? "border-green-500/15 bg-green-500/[0.02]" :
                status === "failed" ? "border-destructive/15 bg-destructive/[0.02]" :
                status === "checking" ? "border-primary/20 bg-primary/[0.02]" :
                "border-[rgba(255,255,255,0.06)]"
              }`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                status === "passed" ? "bg-green-500/15 text-green-400" :
                status === "failed" ? "bg-destructive/15 text-destructive" :
                status === "checking" ? "bg-primary/15 text-primary" :
                "bg-muted/30 text-muted-foreground/40"
              }`}>
                {status === "passed" ? <CheckCircle2 size={14} /> : status === "failed" ? <XCircle size={14} /> : status === "checking" ? (
                  <motion.div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                ) : cp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${status !== "pending" ? "text-foreground" : "text-muted-foreground/60"}`}>{cp.label}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/40">{ev.detail}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60">{cp.desc}</p>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${ev.score === 0 ? "text-green-400 bg-green-500/10" : ev.score >= 50 ? "text-destructive bg-destructive/10" : ev.score >= 25 ? "text-orange-400 bg-orange-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>
                +{ev.score}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Decision */}
      <div className={`rounded-xl border p-4 mb-5 transition-colors ${verdictBg}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${verdict === "allow" ? "bg-green-500/15" : verdict === "step-up" ? "bg-yellow-500/15" : verdict === "deny" ? "bg-destructive/15" : "bg-muted/30"}`}>
            {verdict === "allow" ? <ShieldCheck className="text-green-400" size={18} /> :
             verdict === "step-up" ? <Repeat className="text-yellow-400" size={18} /> :
             verdict === "deny" ? <ShieldX className="text-destructive" size={18} /> :
             <Activity className="text-muted-foreground" size={18} />}
          </div>
          <div className="flex-1">
            <p className={`font-display text-sm font-bold uppercase ${verdictColor}`}>{verdict ?? "awaiting evaluation"}</p>
            <p className="text-[11px] text-muted-foreground">
              risk score = <span className="text-foreground font-mono">{totalRisk}</span>
              {verdict === "step-up" && " — request additional WebAuthn challenge"}
              {verdict === "deny" && " — block + alert SOC"}
              {continuous && verdict && <span className="ml-3 text-yellow-400">tick #{tick} (re-evaluating live)</span>}
            </p>
          </div>
          {done && (
            <button onClick={() => setContinuous(c => !c)}
              className={`text-[10px] font-mono px-2 py-1 rounded border ${continuous ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" : "border-[rgba(255,255,255,0.1)] text-muted-foreground"}`}>
              <Activity size={10} className="inline mr-1" /> continuous {continuous ? "ON" : "OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        {!running && !done && (
          <motion.button onClick={start} className="group flex items-center gap-3 rounded-xl bg-secondary/10 border border-secondary/20 px-7 py-3 text-sm font-semibold text-secondary hover:bg-secondary/15 transition-all"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <ScanEye size={16} /> Verify Request <ArrowRight size={14} />
          </motion.button>
        )}
        {done && (
          <button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
            <RotateCcw size={14} /> New request
          </button>
        )}
      </div>
    </div>
  );
};

export default ZeroTrustShowcase;
