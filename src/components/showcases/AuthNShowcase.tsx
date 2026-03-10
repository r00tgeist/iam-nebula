import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  KeyRound,
  Fingerprint,
  Smartphone,
  ShieldCheck,
  ShieldX,
  Server,
  ArrowRight,
  Lock,
  RotateCcw,
  Zap,
} from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type AuthMethod = "password" | "biometric" | "token";
type FlowStage = "idle" | "claiming" | "submitting" | "transmitting" | "verifying" | "result";

interface StageNode {
  id: FlowStage;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const AUTH_METHODS: { id: AuthMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "password", label: "Password", icon: <KeyRound size={18} />, desc: "Knowledge factor" },
  { id: "biometric", label: "Biometric", icon: <Fingerprint size={18} />, desc: "Inherence factor" },
  { id: "token", label: "Hardware Token", icon: <Smartphone size={18} />, desc: "Possession factor" },
];

const STAGES: StageNode[] = [
  { id: "claiming", label: "Identity Claim", sublabel: "Who are you?", icon: <User size={22} /> },
  { id: "submitting", label: "Credential", sublabel: "Prove it", icon: <KeyRound size={22} /> },
  { id: "transmitting", label: "Secure Channel", sublabel: "TLS encrypted", icon: <Lock size={22} /> },
  { id: "verifying", label: "Server Verify", sublabel: "Checking...", icon: <Server size={22} /> },
  { id: "result", label: "Decision", sublabel: "Grant or deny", icon: <ShieldCheck size={22} /> },
];

const STAGE_ORDER: FlowStage[] = ["idle", "claiming", "submitting", "transmitting", "verifying", "result"];

const stageIndex = (s: FlowStage) => STAGE_ORDER.indexOf(s);

const AuthNShowcase = () => {
  const [method, setMethod] = useState<AuthMethod>("password");
  const [stage, setStage] = useState<FlowStage>("idle");
  const [success, setSuccess] = useState(true);
  const isRunning = stage !== "idle" && stage !== "result";

  const reset = useCallback(() => {
    setStage("idle");
  }, []);

  const startFlow = useCallback(() => {
    if (isRunning) return;
    setStage("claiming");
    setSuccess(true);

    const delays = [
      { stage: "submitting" as FlowStage, ms: 1200 },
      { stage: "transmitting" as FlowStage, ms: 2400 },
      { stage: "verifying" as FlowStage, ms: 3600 },
      { stage: "result" as FlowStage, ms: 5200 },
    ];

    delays.forEach(({ stage: s, ms }) => {
      setTimeout(() => setStage(s), ms);
    });
  }, [isRunning]);

  const isStageActive = (s: FlowStage) => stageIndex(stage) >= stageIndex(s);
  const isStageCurrently = (s: FlowStage) => stage === s;

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          Interactive: Authentication Flow
        </h2>
        {stage === "result" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={reset}
            className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30"
          >
            <RotateCcw size={12} />
            Reset
          </motion.button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Select an authentication method and watch the verification pipeline in action.
      </p>

      {/* Auth Method Selector */}
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Authentication Method
        </p>
        <div className="flex flex-wrap gap-3">
          {AUTH_METHODS.map((m) => {
            const selected = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { if (stage === "idle") setMethod(m.id); }}
                disabled={isRunning}
                className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                  selected
                    ? "border-primary/50 bg-primary/5"
                    : "border-[rgba(255,255,255,0.06)] bg-transparent hover:border-[rgba(255,255,255,0.12)]"
                } ${isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {selected && (
                  <motion.div
                    layoutId="method-glow"
                    className="absolute inset-0 rounded-xl glow-cyan"
                    transition={spring}
                  />
                )}
                <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-lg ${
                  selected ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                }`}>
                  {m.icon}
                </div>
                <div className="relative z-10">
                  <p className={`text-sm font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="relative">
        {/* Desktop horizontal flow */}
        <div className="hidden md:block">
          <div className="flex items-stretch">
            {STAGES.map((node, i) => {
              const active = isStageActive(node.id);
              const current = isStageCurrently(node.id);
              const isResultNode = node.id === "result";
              const showResult = isResultNode && stage === "result";
              const isLast = i === STAGES.length - 1;
              const nextActive = !isLast && isStageActive(STAGES[i + 1].id);

              return (
                <div key={node.id} className="flex flex-1 items-center">
                  {/* Node column */}
                  <div className="flex flex-col items-center w-16 shrink-0">
                    <motion.div
                      className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors duration-300 ${
                        showResult
                          ? success
                            ? "border-green-500/50 bg-green-500/10 text-green-400"
                            : "border-destructive/50 bg-destructive/10 text-destructive"
                          : active
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-[rgba(255,255,255,0.06)] bg-card/40 text-muted-foreground"
                      }`}
                      animate={{
                        scale: current ? 1.1 : 1,
                        boxShadow: current
                          ? "0 0 30px rgba(0, 229, 255, 0.2)"
                          : showResult && success
                            ? "0 0 30px rgba(34, 197, 94, 0.2)"
                            : "none",
                      }}
                      transition={spring}
                    >
                      {showResult ? (
                        success ? <ShieldCheck size={22} /> : <ShieldX size={22} />
                      ) : (
                        node.icon
                      )}

                      {/* Pulse ring on active */}
                      {current && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl border border-primary/30"
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 1.4, opacity: 0 }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>

                    <motion.p
                      className={`mt-3 text-xs font-semibold text-center whitespace-nowrap transition-colors ${
                        active ? "text-foreground" : "text-muted-foreground"
                      }`}
                      animate={{ opacity: active ? 1 : 0.5 }}
                    >
                      {showResult ? (success ? "Authenticated" : "Denied") : node.label}
                    </motion.p>
                    <p className={`text-[10px] text-center whitespace-nowrap ${
                      active ? "text-muted-foreground" : "text-muted-foreground/50"
                    }`}>
                      {showResult
                        ? success
                          ? "Token issued"
                          : "Invalid credentials"
                        : node.sublabel}
                    </p>
                  </div>

                  {/* Connector line between nodes */}
                  {!isLast && (
                    <div className="flex-1 flex items-center px-1 -mt-8">
                      <motion.div
                        className="h-[2px] w-full rounded-full"
                        initial={false}
                        animate={{
                          background: nextActive
                            ? "linear-gradient(90deg, hsl(187 100% 50%), hsl(187 100% 50%))"
                            : "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06))",
                        }}
                        transition={{ duration: 0.4 }}
                        style={{
                          backgroundSize: nextActive ? "100% 100%" : "8px 100%",
                          backgroundRepeat: nextActive ? "no-repeat" : "repeat",
                          ...(nextActive
                            ? {}
                            : {
                                background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 4px, transparent 4px, transparent 8px)",
                              }),
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical flow */}
        <div className="md:hidden space-y-0">
          {STAGES.map((node, i) => {
            const active = isStageActive(node.id);
            const current = isStageCurrently(node.id);
            const isResultNode = node.id === "result";
            const showResult = isResultNode && stage === "result";
            const isLast = i === STAGES.length - 1;
            const nextActive = !isLast && isStageActive(STAGES[i + 1].id);

            return (
              <div key={node.id}>
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${
                      showResult
                        ? success
                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                          : "border-destructive/50 bg-destructive/10 text-destructive"
                        : active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-[rgba(255,255,255,0.06)] bg-card/40 text-muted-foreground"
                    }`}
                    animate={{ scale: current ? 1.05 : 1 }}
                    transition={spring}
                  >
                    {showResult ? (
                      success ? <ShieldCheck size={18} /> : <ShieldX size={18} />
                    ) : (
                      <div className="scale-[0.85]">{node.icon}</div>
                    )}
                  </motion.div>
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {showResult ? (success ? "Authenticated" : "Denied") : node.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {showResult
                        ? success ? "Token issued" : "Invalid credentials"
                        : node.sublabel}
                    </p>
                  </div>
                </div>
                {!isLast && (
                  <div
                    className={`ml-6 h-5 border-l transition-colors duration-300 ${
                      nextActive
                        ? "border-primary/50 border-solid"
                        : "border-[rgba(255,255,255,0.08)] border-dashed"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification detail panel */}
      <AnimatePresence mode="wait">
        {isRunning && (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-8 rounded-xl border border-primary/10 bg-primary/[0.02] px-5 py-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={12} className="text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {stage === "claiming" && "Step 1 — Identity Claim"}
                {stage === "submitting" && `Step 2 — ${method === "password" ? "Password" : method === "biometric" ? "Biometric Scan" : "Token Code"} Submission`}
                {stage === "transmitting" && "Step 3 — Encrypted Transmission"}
                {stage === "verifying" && "Step 4 — Server-Side Verification"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stage === "claiming" && "The user presents their identity claim — typically a username, email, or certificate DN. This tells the system who the requester claims to be."}
              {stage === "submitting" && method === "password" && "The user submits their password as a knowledge factor. The client hashes the credential before transmission to prevent plaintext exposure."}
              {stage === "submitting" && method === "biometric" && "Biometric data is captured locally and converted to a template. Only the mathematical template is transmitted, never raw biometric data."}
              {stage === "submitting" && method === "token" && "A one-time code is generated by the hardware token using a shared secret and time-based algorithm (TOTP/HOTP)."}
              {stage === "transmitting" && "Credentials travel over a TLS-encrypted channel. Even if intercepted, the encrypted payload is computationally infeasible to decrypt."}
              {stage === "verifying" && "The authentication server compares the submitted credential against its store. For passwords, it hashes the input and compares against the stored hash + salt."}
            </p>

            {/* Animated dots */}
            <div className="flex gap-1 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1 w-1 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result panel */}
      <AnimatePresence>
        {stage === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className={`mt-8 rounded-xl border px-5 py-5 ${
              success
                ? "border-green-500/20 bg-green-500/[0.03]"
                : "border-destructive/20 bg-destructive/[0.03]"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                success ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"
              }`}>
                {success ? <ShieldCheck size={20} /> : <ShieldX size={20} />}
              </div>
              <div>
                <p className={`font-display text-sm font-bold ${success ? "text-green-400" : "text-destructive"}`}>
                  {success ? "Authentication Successful" : "Authentication Failed"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {success
                    ? `Identity verified via ${method === "password" ? "password (knowledge factor)" : method === "biometric" ? "biometric (inherence factor)" : "hardware token (possession factor)"}. A signed JWT session token has been issued with a 15-minute expiry. The user may now proceed to the authorization layer.`
                    : "The credential did not match the stored verification data. The attempt has been logged and rate limiting has been applied to prevent brute-force attacks."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {success && (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2.5 py-1 text-[10px] font-medium text-green-400 border border-green-500/10">
                        JWT Issued
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary border border-primary/10">
                        Session Active
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-border">
                        TTL: 900s
                      </span>
                    </>
                  )}
                  {!success && (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-[10px] font-medium text-destructive border border-destructive/10">
                        401 Unauthorized
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-border">
                        Attempts: 1/5
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <div className="mt-8 flex justify-center">
        {stage === "idle" && (
          <motion.button
            onClick={startFlow}
            className="group relative flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-8 py-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary/15 hover:border-primary/30 hover:glow-cyan"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <Zap size={16} className="transition-transform group-hover:rotate-12" />
            Authenticate
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        )}
        {stage === "result" && (
          <motion.button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:border-primary/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <RotateCcw size={14} />
            Try Another Method
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default AuthNShowcase;
