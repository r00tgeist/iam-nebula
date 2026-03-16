import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Building2, ArrowRight, CheckCircle2, RotateCcw, Zap, Shield, FileText } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Org { id: string; label: string; domain: string; protocol: string }

const ORGS: Org[] = [
  { id: "home", label: "Home Org", domain: "corp.a1.bg", protocol: "SAML 2.0" },
  { id: "partner", label: "Partner Org", domain: "partner.cloud", protocol: "OIDC" },
  { id: "saas", label: "SaaS Provider", domain: "app.saas.io", protocol: "OIDC" },
];

type FedStep = "idle" | "authn" | "assertion" | "exchange" | "access";

const IdentityFederationShowcase = () => {
  const [step, setStep] = useState<FedStep>("idle");
  const [target, setTarget] = useState<string>("partner");
  const [done, setDone] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const targetOrg = ORGS.find(o => o.id === target)!;

  const start = useCallback(() => {
    if (step !== "idle") return;
    setDone(false);
    setStep("authn");
    timeoutsRef.current = [
      setTimeout(() => setStep("assertion"), 1200),
      setTimeout(() => setStep("exchange"), 2400),
      setTimeout(() => setStep("access"), 3600),
      setTimeout(() => setDone(true), 4200),
    ];
  }, [step]);

  const reset = () => {
    timeoutsRef.current.forEach(clearTimeout);
    setStep("idle");
    setDone(false);
  };

  const stepIdx = ["idle", "authn", "assertion", "exchange", "access"].indexOf(step);

  const STEPS = [
    { id: "authn", label: "Authenticate at Home IdP", desc: "User proves identity at their home organization" },
    { id: "assertion", label: "Generate Federation Token", desc: `Home IdP creates a signed SAML assertion / OIDC token` },
    { id: "exchange", label: "Token Exchange", desc: `${targetOrg.label} validates the token and maps claims to local roles` },
    { id: "access", label: "Access Granted", desc: `User accesses ${targetOrg.label} resources without creating a new account` },
  ];

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Identity Federation</h2>
      <p className="text-sm text-muted-foreground mb-8">Authenticate once at your home org, then access partner services using federated trust — no separate accounts needed.</p>

      {/* Target selector */}
      <div className="mb-8">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Target Organization</p>
        <div className="flex gap-3">
          {ORGS.filter(o => o.id !== "home").map(o => (
            <button key={o.id} onClick={() => { if (step === "idle") setTarget(o.id); }} disabled={step !== "idle"}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${target === o.id ? "border-secondary/30 bg-secondary/[0.04]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"} ${step !== "idle" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
              <Building2 size={16} className={target === o.id ? "text-secondary" : "text-muted-foreground"} />
              <div className="text-left">
                <p className={`text-sm font-medium ${target === o.id ? "text-foreground" : "text-muted-foreground"}`}>{o.label}</p>
                <p className="text-[9px] font-mono text-muted-foreground/50">{o.domain} ({o.protocol})</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Federation flow */}
      <div className="space-y-3 mb-8">
        {STEPS.map((s, i) => {
          const isActive = stepIdx > i;
          const isCurrent = step === s.id;
          return (
            <motion.div key={s.id} layout transition={spring}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                isActive ? "border-green-500/15 bg-green-500/[0.02]" : isCurrent ? "border-secondary/20 bg-secondary/[0.02]" : "border-[rgba(255,255,255,0.06)]"
              }`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isActive ? "bg-green-500/15 text-green-400" : isCurrent ? "bg-secondary/15 text-secondary" : "bg-muted/20 text-muted-foreground/30"
              }`}>
                {isActive ? <CheckCircle2 size={16} /> : isCurrent ? (
                  <motion.div className="h-4 w-4 rounded-full border-2 border-secondary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                ) : <span className="text-xs font-mono">{i + 1}</span>}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isActive || isCurrent ? "text-foreground" : "text-muted-foreground/40"}`}>{s.label}</p>
                <p className="text-[11px] text-muted-foreground/60">{s.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust info */}
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}
          className="rounded-xl border border-secondary/10 bg-secondary/[0.02] p-4 mb-6">
          <p className="text-[10px] font-mono uppercase tracking-wider text-secondary font-semibold mb-2">Federation Details</p>
          <div className="font-mono text-[11px] space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Home IdP</span><span className="text-foreground">corp.a1.bg</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Target SP</span><span className="text-foreground">{targetOrg.domain}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Protocol</span><span className="text-foreground">{targetOrg.protocol}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Claim mapping</span><span className="text-foreground">groups → local roles</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Account created?</span><span className="text-green-400">No — JIT provisioned</span></div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-center">
        {step === "idle" && (
          <motion.button onClick={start} className="group flex items-center gap-3 rounded-xl bg-secondary/10 border border-secondary/20 px-8 py-3.5 text-sm font-semibold text-secondary hover:bg-secondary/15 transition-all"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Network size={16} /> Federate Access <ArrowRight size={14} />
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

export default IdentityFederationShowcase;
