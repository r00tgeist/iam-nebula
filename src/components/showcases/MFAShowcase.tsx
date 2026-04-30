import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, KeyRound, Smartphone, MessageSquare, Usb, ShieldCheck, ShieldAlert, Zap, ArrowRight, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Clock, Bell } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type FactorCategory = "knowledge" | "possession" | "inherence";
type FactorStatus = "pending" | "verifying" | "passed" | "failed";

interface Factor {
  id: string;
  label: string;
  category: FactorCategory;
  icon: React.ReactNode;
  desc: string;
  phishingResistant: boolean;
  replayResistant: boolean;
  weight: number;            // contribution to overall MFA strength
  failChance: number;        // probability when "real attack" toggle on
  failReason: string;        // realistic failure mode
}

const FACTORS: Factor[] = [
  { id: "password", label: "Password", category: "knowledge", icon: <KeyRound size={16} />, desc: "Stored as argon2id hash. Compared timing-safely.",
    phishingResistant: false, replayResistant: false, weight: 1, failChance: 0.55, failReason: "credential reused on a phishing page" },
  { id: "sms", label: "SMS OTP", category: "possession", icon: <MessageSquare size={16} />, desc: "Code sent to registered phone number.",
    phishingResistant: false, replayResistant: false, weight: 1, failChance: 0.4, failReason: "SIM-swap intercepted the OTP" },
  { id: "totp", label: "TOTP App", category: "possession", icon: <Smartphone size={16} />, desc: "HMAC-SHA1(seed, ⌊t/30⌋), 6 digits.",
    phishingResistant: false, replayResistant: true, weight: 2, failChance: 0.25, failReason: "real-time relay (modlishka) replayed code" },
  { id: "push", label: "Push Approval", category: "possession", icon: <Bell size={16} />, desc: "Number-matching prompt on enrolled device.",
    phishingResistant: false, replayResistant: true, weight: 2, failChance: 0.2, failReason: "MFA-fatigue spam → user tapped Approve" },
  { id: "webauthn", label: "Passkey / WebAuthn", category: "possession", icon: <Usb size={16} />, desc: "Origin-bound public-key signature on a server challenge.",
    phishingResistant: true, replayResistant: true, weight: 4, failChance: 0.0, failReason: "—" },
  { id: "biometric", label: "Biometric", category: "inherence", icon: <Fingerprint size={16} />, desc: "Local TPM/TEE template match. Raw biometric never leaves the device.",
    phishingResistant: true, replayResistant: true, weight: 3, failChance: 0.0, failReason: "—" },
];

const CATEGORY_LABEL: Record<FactorCategory, string> = {
  knowledge: "Something you know",
  possession: "Something you have",
  inherence:  "Something you are",
};

const CATEGORY_COLOR: Record<FactorCategory, string> = {
  knowledge: "text-yellow-400",
  possession: "text-primary",
  inherence: "text-secondary",
};

const MFAShowcase = () => {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["password", "totp"]));
  const [statuses, setStatuses] = useState<Record<string, FactorStatus>>({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [failedFactor, setFailedFactor] = useState<Factor | null>(null);
  const [adversary, setAdversary] = useState(false);
  const [riskSignal, setRiskSignal] = useState<"low" | "high">("low");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const enabledList = useMemo(() => FACTORS.filter(f => enabled.has(f.id)), [enabled]);

  // Distinct categories used → satisfies "true MFA" definition
  const categoriesUsed = useMemo(() => new Set(enabledList.map(f => f.category)), [enabledList]);
  const isTrueMFA = categoriesUsed.size >= 2;

  // Strength score
  const strength = useMemo(() => {
    const base = enabledList.reduce((s, f) => s + f.weight, 0);
    const phishingBonus = enabledList.some(f => f.phishingResistant) ? 3 : 0;
    return Math.min(15, base + phishingBonus);
  }, [enabledList]);

  // Effective ACR (auth context class reference)
  const acr = strength >= 10 ? "urn:mfa:phishing-resistant" : isTrueMFA ? "urn:mfa:standard" : "urn:sfa";
  const acrColor = strength >= 10 ? "text-green-400" : isTrueMFA ? "text-primary" : "text-destructive";

  // Step-up: if risk is high, require ≥1 phishing-resistant factor
  const stepUpRequired = riskSignal === "high";
  const stepUpSatisfied = enabledList.some(f => f.phishingResistant);

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    setRunning(false); setDone(false); setAllowed(false); setFailedFactor(null);
    setStatuses({});
  }, []);

  const toggle = (id: string) => {
    if (running) return;
    setEnabled(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    reset();
  };

  const start = useCallback(() => {
    if (running || enabledList.length === 0) return;
    reset();
    setRunning(true);

    let delay = 0;
    let stopped = false;

    enabledList.forEach((f, i) => {
      delay += 350;
      timeoutsRef.current.push(setTimeout(() => {
        if (stopped) return;
        setStatuses(prev => ({ ...prev, [f.id]: "verifying" }));
      }, delay));
      delay += 950;
      timeoutsRef.current.push(setTimeout(() => {
        if (stopped) return;
        const fails = adversary && Math.random() < f.failChance;
        setStatuses(prev => ({ ...prev, [f.id]: fails ? "failed" : "passed" }));
        if (fails) {
          stopped = true;
          setFailedFactor(f);
          setDone(true); setAllowed(false); setRunning(false);
        }
      }, delay));
    });

    if (!stopped) {
      delay += 500;
      timeoutsRef.current.push(setTimeout(() => {
        if (stopped) return;
        const ok = isTrueMFA && (!stepUpRequired || stepUpSatisfied);
        setDone(true); setAllowed(ok); setRunning(false);
        if (!ok && stepUpRequired && !stepUpSatisfied) {
          setFailedFactor({ ...FACTORS[0], failReason: "step-up required: phishing-resistant factor missing" } as Factor);
        }
      }, delay));
    }
  }, [running, enabledList, adversary, isTrueMFA, stepUpRequired, stepUpSatisfied, reset]);

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Multi-Factor Authentication</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Pick factors from at least two categories — knowledge / possession / inherence — to make it real MFA. Toggle the
        adversary or raise the risk signal to see how each factor stands up.
      </p>

      {/* Threat controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => { setAdversary(!adversary); reset(); }} disabled={running}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${adversary ? "border-destructive/30 bg-destructive/[0.04] text-destructive" : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.12)]"}`}>
          <ShieldAlert size={12} /> Adversary active
          <span className="text-[9px] font-mono opacity-60">{adversary ? "ON" : "OFF"}</span>
        </button>
        <button onClick={() => { setRiskSignal(riskSignal === "high" ? "low" : "high"); reset(); }} disabled={running}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${riskSignal === "high" ? "border-orange-500/30 bg-orange-500/[0.04] text-orange-400" : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.12)]"}`}>
          <AlertTriangle size={12} /> Risk signal: <span className="font-mono">{riskSignal}</span>
        </button>
        <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">acr: <span className={acrColor}>{acr}</span></span>
      </div>

      {/* Factor grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-6">
        {FACTORS.map(f => {
          const on = enabled.has(f.id);
          const status = statuses[f.id];
          return (
            <motion.button key={f.id} layout transition={spring} onClick={() => toggle(f.id)}
              disabled={running}
              className={`text-left rounded-xl border p-3 transition-all ${on ? "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)]" : "border-[rgba(255,255,255,0.04)] opacity-50 hover:opacity-80"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  status === "passed" ? "bg-green-500/15 text-green-400" :
                  status === "failed" ? "bg-destructive/15 text-destructive" :
                  status === "verifying" ? "bg-primary/15 text-primary" :
                  on ? "bg-muted/40 text-muted-foreground" : "bg-muted/20 text-muted-foreground/40"
                }`}>
                  {status === "passed" ? <CheckCircle2 size={14} /> : status === "failed" ? <XCircle size={14} /> : status === "verifying" ? (
                    <motion.div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                  ) : f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${on ? "text-foreground" : "text-muted-foreground/60"}`}>{f.label}</p>
                  <p className={`text-[9px] font-mono ${CATEGORY_COLOR[f.category]}`}>{CATEGORY_LABEL[f.category]}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-snug mb-2">{f.desc}</p>
              <div className="flex flex-wrap gap-1">
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${f.phishingResistant ? "border-green-500/20 text-green-400" : "border-[rgba(255,255,255,0.06)] text-muted-foreground/50"}`}>
                  {f.phishingResistant ? "phish-resist" : "phishable"}
                </span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${f.replayResistant ? "border-green-500/20 text-green-400" : "border-orange-500/20 text-orange-400"}`}>
                  {f.replayResistant ? "no-replay" : "replayable"}
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)] text-muted-foreground/60 ml-auto">w={f.weight}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Strength + categories */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-3">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Categories used</p>
          <div className="flex gap-1">
            {(["knowledge", "possession", "inherence"] as FactorCategory[]).map(c => (
              <span key={c} className={`flex-1 text-center text-[9px] font-mono py-1 rounded border ${categoriesUsed.has(c) ? `${CATEGORY_COLOR[c]} border-current bg-[rgba(255,255,255,0.03)]` : "border-[rgba(255,255,255,0.04)] text-muted-foreground/30"}`}>
                {c[0].toUpperCase()}
              </span>
            ))}
          </div>
          <p className={`mt-1.5 text-[10px] font-mono ${isTrueMFA ? "text-green-400" : "text-destructive"}`}>{isTrueMFA ? "true MFA ✓" : "single-factor"}</p>
        </div>
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-3">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Strength score</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-display font-bold ${acrColor}`}>{strength}</span>
            <span className="text-[10px] text-muted-foreground/60">/15</span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <motion.div className={`h-full ${strength >= 10 ? "bg-green-400" : strength >= 5 ? "bg-primary" : "bg-destructive"}`} animate={{ width: `${(strength / 15) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
        <div className={`rounded-xl border p-3 ${stepUpRequired && !stepUpSatisfied ? "border-orange-500/20 bg-orange-500/[0.04]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)]"}`}>
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Step-up policy</p>
          <p className="text-[10px] text-muted-foreground/80">
            {stepUpRequired
              ? stepUpSatisfied ? <span className="text-green-400">satisfied — phishing-resistant factor present</span>
                                : <span className="text-orange-400">requires phishing-resistant factor</span>
              : "no step-up required at low risk"}
          </p>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}
            className={`rounded-xl border px-5 py-4 mb-6 ${allowed ? "border-green-500/20 bg-green-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${allowed ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`}>
                {allowed ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-display text-sm font-bold ${allowed ? "text-green-400" : "text-destructive"}`}>
                  {allowed ? "Authentication granted" : "Authentication blocked"}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {allowed ? `All ${enabledList.length} factor(s) verified. ACR ${acr} attached to the issued ID token.` : (failedFactor ? `${failedFactor.label} → ${failedFactor.failReason}` : "Policy not satisfied.")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-center">
        {!done ? (
          <motion.button onClick={start} disabled={running || enabledList.length === 0}
            className="group flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-8 py-3.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-all disabled:opacity-50"
            whileHover={running ? {} : { scale: 1.02 }} whileTap={running ? {} : { scale: 0.98 }}>
            {running ? (<><Clock size={14} /> Verifying…</>) : (<><Zap size={16} /> Authenticate <ArrowRight size={14} /></>)}
          </motion.button>
        ) : (
          <button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default MFAShowcase;
