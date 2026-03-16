import { useState, useCallback, useEffect, useRef } from "react";
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
  Eye,
  EyeOff,
  Hash,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type AuthMethod = "password" | "biometric" | "token";
type FlowStage = "idle" | "claiming" | "submitting" | "transmitting" | "verifying" | "result";

const STAGE_ORDER: FlowStage[] = ["idle", "claiming", "submitting", "transmitting", "verifying", "result"];
const stageIdx = (s: FlowStage) => STAGE_ORDER.indexOf(s);

// ─── Stage metadata with hover descriptions ──────────────────────────
interface StageMeta {
  id: FlowStage;
  label: string;
  icon: React.ReactNode;
  hoverTitle: string;
  hoverDesc: string;
  hoverDescByMethod?: Partial<Record<AuthMethod, string>>;
}

const STAGES: StageMeta[] = [
  {
    id: "claiming",
    label: "Identity Claim",
    icon: <User size={20} />,
    hoverTitle: "Step 1 — Identity Claim",
    hoverDesc:
      "The user declares their identity (username, email, or certificate DN). This is NOT authentication yet — it's just a claim that needs to be proven. Think of it as showing your ID card without the photo being checked.",
  },
  {
    id: "submitting",
    label: "Credential Proof",
    icon: <KeyRound size={20} />,
    hoverTitle: "Step 2 — Credential Submission",
    hoverDesc: "The user provides evidence to prove their claimed identity.",
    hoverDescByMethod: {
      password:
        "A password (knowledge factor) is submitted. The client may pre-hash it. The server will compare against the stored bcrypt/argon2 hash. Never stored in plaintext — if the DB leaks, attackers only get hashes.",
      biometric:
        "Biometric data (inherence factor) is captured by a local sensor. A mathematical template is extracted — the raw fingerprint/face data never leaves the device. The template is signed by the device's secure enclave (TPM/TEE).",
      token:
        "A TOTP code (possession factor) is read from the hardware token. The token and server share a secret seed; both compute HMAC-SHA1(seed, floor(time/30)). The 6-digit code is valid for only 30 seconds.",
    },
  },
  {
    id: "transmitting",
    label: "Secure Transport",
    icon: <Lock size={20} />,
    hoverTitle: "Step 3 — TLS Encrypted Channel",
    hoverDesc:
      "Credentials travel inside a TLS 1.3 tunnel. The handshake uses ECDHE for key exchange, providing perfect forward secrecy — even if the server's private key is later compromised, past sessions remain safe. The payload is AES-256-GCM encrypted.",
  },
  {
    id: "verifying",
    label: "Server Verification",
    icon: <Server size={20} />,
    hoverTitle: "Step 4 — Server-Side Verification",
    hoverDesc: "The authentication server validates the credential.",
    hoverDescByMethod: {
      password:
        "The server retrieves the stored hash+salt for this user, runs the same KDF (bcrypt/argon2) on the submitted password, and compares digests. Timing-safe comparison prevents side-channel attacks. Rate limiting and account lockout apply.",
      biometric:
        "The server verifies the device attestation signature, then compares the biometric template against the enrolled template using fuzzy matching (threshold-based). A match score above the configured FAR (False Accept Rate) threshold passes.",
      token:
        "The server independently computes the expected TOTP code using the shared seed and current time window. It also checks ±1 window for clock drift. Each code can only be used once (replay protection via a used-code cache).",
    },
  },
  {
    id: "result",
    label: "Access Decision",
    icon: <ShieldCheck size={20} />,
    hoverTitle: "Step 5 — Access Decision",
    hoverDesc:
      "Based on verification, the server issues a signed JWT (access token + refresh token) or returns 401. The JWT contains claims: sub, iat, exp, auth_method, and risk_score. MFA status is encoded in the amr (Authentication Methods Reference) claim.",
  },
];

// ─── Password typing mini-widget ─────────────────────────────────────
const PasswordWidget = ({ active }: { active: boolean }) => {
  const [chars, setChars] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [strength, setStrength] = useState(0);
  const password = "S3cur3_P@ss!";

  useEffect(() => {
    if (!active) { setChars(0); setStrength(0); return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setChars(i);
      setStrength(Math.min(100, Math.round((i / password.length) * 100)));
      if (i >= password.length) clearInterval(iv);
    }, 90);
    return () => clearInterval(iv);
  }, [active]);

  const display = showPw ? password.slice(0, chars) : "\u2022".repeat(chars);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.3)] px-4 py-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">Username</p>
        <p className="text-sm text-foreground font-mono">alex@a1.bg</p>
      </div>
      <div className="rounded-lg border border-primary/20 bg-[rgba(0,0,0,0.3)] px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Password</p>
          <button onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground transition-colors">
            {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-sm text-primary font-mono tracking-wider">{display}</p>
          {chars < password.length && active && (
            <motion.span className="inline-block w-[2px] h-4 bg-primary" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
          )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground font-mono">Entropy check</span>
          <span className={`font-mono font-bold ${strength >= 80 ? "text-green-400" : strength >= 50 ? "text-yellow-400" : "text-destructive"}`}>
            {strength >= 80 ? "Strong" : strength >= 50 ? "Medium" : "Weak"}
          </span>
        </div>
        <div className="h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${strength >= 80 ? "bg-green-400" : strength >= 50 ? "bg-yellow-400" : "bg-destructive"}`}
            initial={{ width: 0 }}
            animate={{ width: `${strength}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
        <Hash size={10} />
        <span className="font-mono">Client-side: SHA-256 pre-hash before transmission</span>
      </div>
    </div>
  );
};

// ─── Biometric scan mini-widget ──────────────────────────────────────
const BiometricWidget = ({ active }: { active: boolean }) => {
  const [scanPct, setScanPct] = useState(0);
  const [matchScore, setMatchScore] = useState(0);

  useEffect(() => {
    if (!active) { setScanPct(0); setMatchScore(0); return; }
    let pct = 0;
    const iv = setInterval(() => {
      pct += 2;
      setScanPct(Math.min(pct, 100));
      if (pct >= 60) setMatchScore(Math.min(Math.round((pct - 60) * 2.45), 98));
      if (pct >= 100) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [active]);

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg className="absolute inset-0" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <motion.circle
            cx="56" cy="56" r="52" fill="none"
            stroke={scanPct >= 100 ? "hsl(142, 71%, 45%)" : "hsl(187, 100%, 50%)"}
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - scanPct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 56 56)"
            transition={{ duration: 0.1 }}
          />
        </svg>
        {active && scanPct < 100 && (
          <motion.div
            className="absolute left-3 right-3 h-[1px] bg-primary/60"
            animate={{ top: ["25%", "75%", "25%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <Fingerprint size={40} className={`relative z-10 transition-colors duration-300 ${scanPct >= 100 ? "text-green-400" : active ? "text-primary" : "text-muted-foreground/30"}`} />
      </div>
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Scan Progress</span>
            <span className="text-[11px] font-mono text-primary font-bold">{scanPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <motion.div className="h-full rounded-full bg-primary" style={{ width: `${scanPct}%` }} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Match Score</span>
            <span className={`text-[11px] font-mono font-bold ${matchScore > 85 ? "text-green-400" : matchScore > 0 ? "text-yellow-400" : "text-muted-foreground/40"}`}>
              {matchScore > 0 ? `${matchScore}%` : "\u2014"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <motion.div className={`h-full rounded-full ${matchScore > 85 ? "bg-green-400" : "bg-yellow-400"}`} style={{ width: `${matchScore}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <Lock size={10} />
          <span className="font-mono">Template extracted via Secure Enclave (TEE)</span>
        </div>
        {scanPct >= 100 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[10px] text-green-400">
            <CheckCircle2 size={10} />
            <span className="font-mono">FAR threshold met (&ge; 95%)</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── TOTP hardware token mini-widget ─────────────────────────────────
const TokenWidget = ({ active }: { active: boolean }) => {
  const [code, setCode] = useState("------");
  const [countdown, setCountdown] = useState(30);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!active) { setCode("------"); setCountdown(30); setGenerated(false); return; }
    const digits = "847291";
    let i = 0;
    const genIv = setInterval(() => {
      i++;
      setCode(digits.slice(0, i) + "-".repeat(6 - i));
      if (i >= 6) { clearInterval(genIv); setGenerated(true); }
    }, 150);
    return () => clearInterval(genIv);
  }, [active]);

  useEffect(() => {
    if (!generated) return;
    const iv = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [generated]);

  const pct = (countdown / 30) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5">
        <div className="relative flex h-24 w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.4)]">
          <Smartphone size={14} className="text-muted-foreground/50 mb-1" />
          <div className="flex gap-[3px]">
            {code.split("").map((c, i) => (
              <motion.span
                key={i}
                className={`inline-flex h-6 w-4 items-center justify-center rounded text-xs font-mono font-bold ${
                  c !== "-"
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "bg-[rgba(255,255,255,0.03)] text-muted-foreground/20 border border-[rgba(255,255,255,0.04)]"
                }`}
                initial={c !== "-" ? { scale: 1.3 } : {}}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                {c !== "-" ? c : "\u00b7"}
              </motion.span>
            ))}
          </div>
          {generated && (
            <svg className="absolute -right-1 -top-1" width="18" height="18" viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="7" fill="hsl(var(--background))" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
              <motion.circle
                cx="9" cy="9" r="7" fill="none"
                stroke={countdown > 10 ? "hsl(187, 100%, 50%)" : "hsl(349, 100%, 62%)"}
                strokeWidth="1.5"
                strokeDasharray={`${2 * Math.PI * 7}`}
                strokeDashoffset={`${2 * Math.PI * 7 * (1 - pct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 9 9)"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Algorithm</p>
            <p className="text-xs font-mono text-foreground">HMAC-SHA1 (RFC 6238)</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Time Window</p>
            <p className={`text-xs font-mono font-bold ${countdown > 10 ? "text-primary" : "text-destructive"}`}>
              {generated ? `${countdown}s remaining` : "Generating..."}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Seed</p>
            <p className="text-xs font-mono text-muted-foreground/60">{"\u2022".repeat(12)}XKCD</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
        <AlertTriangle size={10} />
        <span className="font-mono">Code is single-use — replay protection enforced server-side</span>
      </div>
    </div>
  );
};

// ─── Transmission visual ─────────────────────────────────────────────
const TransmitVisual = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 rounded-xl border border-primary/10 bg-[rgba(0,0,0,0.2)] px-5 py-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Wifi size={12} className="text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">TLS 1.3 Handshake</span>
      </div>
      <div className="space-y-2 font-mono text-[11px]">
        {[
          { label: "Key Exchange", value: "ECDHE-X25519", delay: 0 },
          { label: "Cipher Suite", value: "AES-256-GCM", delay: 0.15 },
          { label: "Certificate", value: "auth.example.com (ECDSA P-256)", delay: 0.3 },
          { label: "Forward Secrecy", value: "Enabled (ephemeral keys)", delay: 0.45 },
        ].map((row) => (
          <motion.div
            key={row.label}
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: row.delay, duration: 0.3 }}
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-foreground">{row.value}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 h-1 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
        <motion.div
          className="h-full w-8 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          animate={{ x: ["-32px", "calc(100% + 32px)"] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

// ─── Verify visual ───────────────────────────────────────────────────
const VerifyVisual = ({ active, method }: { active: boolean; method: AuthMethod }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  const steps = method === "password"
    ? ["Retrieving stored hash (argon2id)", "Computing hash of submitted credential", "Timing-safe comparison"]
    : method === "biometric"
      ? ["Loading enrolled template from secure store", "Running fuzzy match algorithm", "Evaluating against FAR threshold"]
      : ["Computing expected TOTP for current window", "Checking \u00b11 window for clock drift", "Verifying code hasn't been used (replay check)"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 rounded-xl border border-primary/10 bg-[rgba(0,0,0,0.2)] px-5 py-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Server size={12} className="text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">Server-Side Operations</span>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: step > i ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
          >
            {step > i ? (
              <CheckCircle2 size={12} className="text-green-400 shrink-0" />
            ) : step === i ? (
              <motion.div
                className="h-3 w-3 shrink-0 rounded-full border-2 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <div className="h-3 w-3 shrink-0 rounded-full border border-[rgba(255,255,255,0.08)]" />
            )}
            <span className={`text-[11px] font-mono ${step > i ? "text-foreground" : "text-muted-foreground/50"}`}>{s}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════
const AuthNShowcase = () => {
  const [method, setMethod] = useState<AuthMethod>("password");
  const [stage, setStage] = useState<FlowStage>("idle");
  const [success, setSuccess] = useState(true);
  const [hoveredStage, setHoveredStage] = useState<FlowStage | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isRunning = stage !== "idle" && stage !== "result";

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setStage("idle");
    setHoveredStage(null);
  }, []);

  const startFlow = useCallback(() => {
    if (isRunning) return;
    setStage("claiming");
    setSuccess(true);
    setHoveredStage(null);

    const delays: { stage: FlowStage; ms: number }[] = [
      { stage: "submitting", ms: 1400 },
      { stage: "transmitting", ms: method === "password" ? 3200 : method === "biometric" ? 3800 : 3000 },
      { stage: "verifying", ms: method === "password" ? 4800 : method === "biometric" ? 5400 : 4600 },
      { stage: "result", ms: method === "password" ? 6600 : method === "biometric" ? 7200 : 6400 },
    ];

    timeoutsRef.current = delays.map(({ stage: s, ms }) =>
      setTimeout(() => setStage(s), ms)
    );
  }, [isRunning, method]);

  const isActive = (s: FlowStage) => stageIdx(stage) >= stageIdx(s);
  const isCurrent = (s: FlowStage) => stage === s;

  const getHoverDesc = (meta: StageMeta) => {
    if (meta.hoverDescByMethod?.[method]) return meta.hoverDescByMethod[method]!;
    return meta.hoverDesc;
  };

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-bold text-foreground">Authentication Pipeline</h2>
        {(stage === "result" || isRunning) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={reset}
            className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30"
          >
            <RotateCcw size={12} /> Reset
          </motion.button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Pick an authentication factor, then trace each step of the verification flow. Hover any stage for details.
      </p>

      {/* ── Auth Method Selector ── */}
      <div className="mb-10">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-4">Choose Factor Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { id: "password" as AuthMethod, label: "Password", factor: "Knowledge Factor", desc: "Something you know", icon: <KeyRound size={20} />, detail: "Bcrypt / Argon2 hashed" },
            { id: "biometric" as AuthMethod, label: "Biometric", factor: "Inherence Factor", desc: "Something you are", icon: <Fingerprint size={20} />, detail: "Secure enclave template" },
            { id: "token" as AuthMethod, label: "Hardware Token", factor: "Possession Factor", desc: "Something you have", icon: <Smartphone size={20} />, detail: "TOTP (RFC 6238)" },
          ]).map((m) => {
            const selected = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { if (!isRunning) setMethod(m.id); }}
                disabled={isRunning}
                className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 ${
                  selected ? "border-primary/40 bg-primary/[0.04]" : "border-[rgba(255,255,255,0.06)] bg-transparent hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.01)]"
                } ${isRunning ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {selected && <motion.div layoutId="method-indicator" className="absolute inset-0 rounded-xl glow-cyan" transition={spring} />}
                <div className="relative z-10 flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${selected ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground group-hover:text-foreground"}`}>
                    {m.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${selected ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.factor}</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/70 italic">{m.desc}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${selected ? "border-primary/20 text-primary/80 bg-primary/5" : "border-transparent text-muted-foreground/40"}`}>{m.detail}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Pipeline ── */}
      <div>
        {/* Desktop */}
        <div className="hidden md:block">
          <div className="flex items-stretch">
            {STAGES.map((node, i) => {
              const active = isActive(node.id);
              const current = isCurrent(node.id);
              const isLast = i === STAGES.length - 1;
              const nextActive = !isLast && isActive(STAGES[i + 1].id);
              const isResultDone = node.id === "result" && stage === "result";
              const isHovered = hoveredStage === node.id;

              return (
                <div key={node.id} className="flex flex-1 items-center">
                  <div
                    className="relative flex flex-col items-center w-16 shrink-0"
                    onMouseEnter={() => setHoveredStage(node.id)}
                    onMouseLeave={() => setHoveredStage(null)}
                  >
                    <motion.div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border cursor-default transition-colors duration-300 ${
                        isResultDone
                          ? success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-destructive/50 bg-destructive/10 text-destructive"
                          : active ? "border-primary/40 bg-primary/10 text-primary" : "border-[rgba(255,255,255,0.06)] bg-card/40 text-muted-foreground/40"
                      }`}
                      animate={{
                        scale: current ? 1.12 : isHovered ? 1.06 : 1,
                        boxShadow: current ? "0 0 30px rgba(0,229,255,0.2)" : isResultDone && success ? "0 0 30px rgba(34,197,94,0.2)" : isHovered && active ? "0 0 20px rgba(0,229,255,0.1)" : "none",
                      }}
                      transition={spring}
                    >
                      {isResultDone ? (success ? <ShieldCheck size={20} /> : <ShieldX size={20} />) : node.icon}
                      {current && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl border border-primary/30"
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                      )}
                    </motion.div>

                    <motion.p className={`mt-2 text-[11px] font-semibold text-center whitespace-nowrap ${active ? "text-foreground" : "text-muted-foreground/50"}`} animate={{ opacity: active ? 1 : 0.4 }}>
                      {isResultDone ? (success ? "Granted" : "Denied") : node.label}
                    </motion.p>
                    <span className={`text-[9px] font-mono ${active ? "text-primary/60" : "text-muted-foreground/20"}`}>{i + 1}/{STAGES.length}</span>

                    {/* Hover tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-3 z-50 w-72 rounded-xl border border-primary/15 bg-card/95 backdrop-blur-xl p-4 shadow-2xl pointer-events-none"
                          style={{ left: i < 2 ? 0 : i >= STAGES.length - 2 ? "auto" : "50%", right: i >= STAGES.length - 2 ? 0 : "auto", transform: i >= 2 && i < STAGES.length - 2 ? "translateX(-50%)" : "none" }}
                        >
                          <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-card/95 border-l border-t border-primary/15" />
                          <p className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold mb-1.5">{node.hoverTitle}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{getHoverDesc(node)}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className="flex-1 flex items-center px-1 -mt-6">
                      <div className="relative w-full h-[2px]">
                        <div className="absolute inset-0 rounded-full" style={{
                          background: nextActive ? "hsl(187 100% 50%)" : "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 4px, transparent 4px, transparent 8px)",
                        }} />
                        {current && stageIdx(node.id) < stageIdx("result") && (
                          <motion.div
                            className="absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"
                            animate={{ left: ["0%", "100%"] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                            style={{ boxShadow: "0 0 8px rgba(0,229,255,0.6)" }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-0">
          {STAGES.map((node, i) => {
            const active = isActive(node.id);
            const current = isCurrent(node.id);
            const isLast = i === STAGES.length - 1;
            const nextActive = !isLast && isActive(STAGES[i + 1].id);
            const isResultDone = node.id === "result" && stage === "result";

            return <MobileStageRow key={node.id} node={node} i={i} active={active} current={current} isLast={isLast} nextActive={nextActive} isResultDone={isResultDone} success={success} method={method} getHoverDesc={getHoverDesc} />;
          })}
        </div>
      </div>

      {/* ── Interactive area ── */}
      <AnimatePresence mode="wait">
        {stage === "submitting" && (
          <motion.div key="submit-widget" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="mt-8 rounded-xl border border-primary/10 bg-[rgba(0,0,0,0.15)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={11} className="text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                {method === "password" ? "Password Submission" : method === "biometric" ? "Biometric Capture" : "TOTP Generation"}
              </span>
            </div>
            {method === "password" && <PasswordWidget active />}
            {method === "biometric" && <BiometricWidget active />}
            {method === "token" && <TokenWidget active />}
          </motion.div>
        )}
        {stage === "transmitting" && <TransmitVisual key="transmit" active />}
        {stage === "verifying" && <VerifyVisual key="verify" active method={method} />}
      </AnimatePresence>

      {/* ── Result ── */}
      <AnimatePresence>
        {stage === "result" && (
          <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={spring}
            className={`mt-8 rounded-xl border px-5 py-5 ${success ? "border-green-500/20 bg-green-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${success ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`}>
                {success ? <ShieldCheck size={20} /> : <ShieldX size={20} />}
              </div>
              <div>
                <p className={`font-display text-sm font-bold ${success ? "text-green-400" : "text-destructive"}`}>
                  {success ? "Authentication Successful" : "Authentication Failed"}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                  {success
                    ? `Identity verified via ${method === "password" ? "password (knowledge factor)" : method === "biometric" ? "biometric (inherence factor)" : "hardware token (possession factor)"}. A signed JWT has been issued.`
                    : "Credential mismatch. The attempt has been logged and rate limiting applied."}
                </p>
                {success && (
                  <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-3 font-mono text-[10px] text-muted-foreground space-y-1">
                    <p><span className="text-primary">sub:</span> alex@a1.bg</p>
                    <p><span className="text-primary">amr:</span> [{method === "password" ? '"pwd"' : method === "biometric" ? '"fpt"' : '"otp"'}]</p>
                    <p><span className="text-primary">exp:</span> {Math.floor(Date.now() / 1000) + 900}</p>
                    <p><span className="text-primary">iss:</span> https://auth.example.com</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {success ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2.5 py-1 text-[10px] font-medium text-green-400 border border-green-500/10"><CheckCircle2 size={9} /> 200 OK</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary border border-primary/10">JWT Issued</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[10px] font-mono text-muted-foreground border border-border">TTL 900s</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-[10px] font-medium text-destructive border border-destructive/10"><XCircle size={9} /> 401</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[10px] font-mono text-muted-foreground border border-border">1/5 attempts</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action ── */}
      <div className="mt-8 flex justify-center">
        {stage === "idle" && (
          <motion.button onClick={startFlow} className="group relative flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-8 py-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary/15 hover:border-primary/30"
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,229,255,0.15)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Zap size={16} className="transition-transform group-hover:rotate-12" />
            Start Authentication
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        )}
        {stage === "result" && (
          <motion.button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:border-primary/20"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <RotateCcw size={14} /> Try Another Factor
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─── Mobile stage row (extracted to avoid hooks-in-map) ──────────────
const MobileStageRow = ({ node, i, active, current, isLast, nextActive, isResultDone, success, method, getHoverDesc }: {
  node: StageMeta; i: number; active: boolean; current: boolean; isLast: boolean; nextActive: boolean; isResultDone: boolean; success: boolean; method: AuthMethod; getHoverDesc: (m: StageMeta) => string;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button className="flex items-center gap-4 w-full text-left py-1" onClick={() => setExpanded(!expanded)}>
        <motion.div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            isResultDone ? (success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-destructive/50 bg-destructive/10 text-destructive")
            : active ? "border-primary/40 bg-primary/10 text-primary" : "border-[rgba(255,255,255,0.06)] bg-card/40 text-muted-foreground/40"
          }`}
          animate={{ scale: current ? 1.05 : 1 }} transition={spring}
        >
          {isResultDone ? (success ? <ShieldCheck size={16} /> : <ShieldX size={16} />) : <div className="scale-[0.82]">{node.icon}</div>}
        </motion.div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground/50"}`}>
            {isResultDone ? (success ? "Granted" : "Denied") : node.label}
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono">{i + 1}/{STAGES.length} — tap for details</p>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-14 mb-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed py-2 pr-2">{getHoverDesc(node)}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLast && (
        <div className={`ml-[21px] h-4 border-l transition-colors duration-300 ${nextActive ? "border-primary/50" : "border-[rgba(255,255,255,0.06)] border-dashed"}`} />
      )}
    </div>
  );
};

export default AuthNShowcase;
