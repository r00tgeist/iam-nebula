import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, ShieldAlert, Clock, Database } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Rule { id: string; label: string; test: (pw: string) => boolean; weight: number; severity: "policy" | "advisory" }

const RULES: Rule[] = [
  { id: "length12",   label: "≥ 12 characters",                     test: pw => pw.length >= 12,                    weight: 20, severity: "policy" },
  { id: "length16",   label: "≥ 16 characters (NIST recommended)",  test: pw => pw.length >= 16,                    weight: 10, severity: "advisory" },
  { id: "upper",      label: "Contains uppercase",                  test: pw => /[A-Z]/.test(pw),                   weight: 8,  severity: "policy" },
  { id: "lower",      label: "Contains lowercase",                  test: pw => /[a-z]/.test(pw),                   weight: 8,  severity: "policy" },
  { id: "digit",      label: "Contains digit",                      test: pw => /\d/.test(pw),                      weight: 8,  severity: "policy" },
  { id: "special",    label: "Contains special character",          test: pw => /[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?~`]/.test(pw), weight: 12, severity: "policy" },
  { id: "norepeat",   label: "No 3+ repeated characters",           test: pw => !/(.)\1{2,}/.test(pw),              weight: 8,  severity: "advisory" },
  { id: "nocommon",   label: "Not on top-10K breach list",          test: pw => !COMMON.has(pw.toLowerCase()),      weight: 18, severity: "policy" },
  { id: "nosequence", label: "No keyboard / numeric sequences",     test: pw => !/(abc|bcd|cde|qwe|wer|asd|sdf|zxc|123|234|345|456|567|678|789|890|0987|9876|8765)/i.test(pw), weight: 8, severity: "advisory" },
];

// Mini-simulated breach corpus (in real life: HIBP k-anonymity API)
const COMMON = new Set([
  "password", "password1", "password123", "123456", "12345678", "qwerty", "qwerty123",
  "admin", "admin123", "letmein", "welcome", "welcome1", "iloveyou", "monkey", "dragon",
  "p@ssword", "p@ssw0rd", "passw0rd", "p@ssword1", "abc123",
]);

const PRESETS = [
  { label: "Empty",      value: "" },
  { label: "Weak",       value: "pass" },
  { label: "Breached",   value: "P@ssw0rd" },
  { label: "Medium",     value: "MyDog2024!" },
  { label: "Strong",     value: "K#9xR$mQ2!pL" },
  { label: "Passphrase", value: "correct horse battery staple" },
];

// Shannon entropy proxy from character pool size
const calcEntropy = (pw: string) => {
  if (!pw) return 0;
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw))    pool += 10;
  if (/[^a-zA-Z\d]/.test(pw)) pool += 32;
  return Math.round(pw.length * Math.log2(Math.max(pool, 1)));
};

// Time-to-crack estimate at 1e11 hashes/sec (offline GPU on bcrypt-equivalent fast hash)
const HPS = 1e11;
const formatTime = (sec: number) => {
  if (!isFinite(sec) || sec < 1) return "instant";
  const units: [number, string][] = [
    [60, "s"], [60, "min"], [24, "h"], [365, "d"], [100, "y"], [1e6, "centuries"],
  ];
  let v = sec, label = "s";
  for (const [div, l] of units) {
    if (v < div) { label = l; break; }
    v /= div; label = l;
  }
  if (v > 1e12) return "heat-death";
  if (v > 1e6)  return v.toExponential(1) + " " + label;
  return v.toFixed(v < 10 ? 1 : 0) + " " + label;
};

const PasswordPoliciesShowcase = () => {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const results = useMemo(() => RULES.map(r => ({ ...r, passed: password.length > 0 ? r.test(password) : false })), [password]);
  const score = useMemo(() => results.reduce((s, r) => s + (r.passed ? r.weight : 0), 0), [results]);
  const policyPassed = results.every(r => r.severity !== "policy" || r.passed);
  const breached = !!password && COMMON.has(password.toLowerCase());

  const entropy = calcEntropy(password);
  const guesses = Math.pow(2, entropy);
  const cracksec = guesses / HPS;

  const passedCount = results.filter(r => r.passed).length;
  const level = score >= 90 ? "Excellent" : score >= 70 ? "Strong" : score >= 45 ? "Medium" : score > 0 ? "Weak" : "—";
  const levelColor = score >= 90 ? "text-green-400" : score >= 70 ? "text-primary" : score >= 45 ? "text-yellow-400" : score > 0 ? "text-destructive" : "text-muted-foreground";
  const barColor = score >= 90 ? "bg-green-400" : score >= 70 ? "bg-primary" : score >= 45 ? "bg-yellow-400" : "bg-destructive";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Password Policy Engine</h2>
      <p className="text-sm text-muted-foreground mb-8">Real-time evaluation against organisational policy, breach corpus check (HIBP-style), entropy calculation and offline-crack-time estimation.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="mb-4">
            <div className="rounded-xl border border-primary/20 bg-[rgba(0,0,0,0.3)] px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Password</p>
                <button onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Type a password..."
                className="w-full bg-transparent text-sm text-foreground font-mono outline-none placeholder:text-muted-foreground/30"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => setPassword(p.value)}
                  className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-primary/20 hover:text-foreground transition-all">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strength bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Strength</span>
              <span className={`text-xs font-mono font-bold ${levelColor}`}>{level} ({score}/100)</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
              <motion.div className={`h-full rounded-full ${barColor}`} animate={{ width: `${score}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          {/* Cryptographic stats */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4 mb-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Database size={11} /> Cryptographic Profile</p>
            <div className="font-mono text-[11px] space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Length</span><span className="text-foreground">{password.length} chars</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Charset pool</span><span className="text-foreground">{[/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter(r => r.test(password)).length}/4 classes</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Entropy</span><span className={entropy >= 80 ? "text-green-400" : entropy >= 60 ? "text-primary" : entropy >= 40 ? "text-yellow-400" : "text-destructive"}>{entropy} bits</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Search space</span><span className="text-foreground">2^{entropy}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Crack time @ 100 GH/s</span>
                <span className={cracksec > 1e9 ? "text-green-400" : cracksec > 86400 ? "text-primary" : cracksec > 60 ? "text-yellow-400" : "text-destructive"}>
                  {formatTime(cracksec / 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Breach */}
          {breached && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-destructive/30 bg-destructive/[0.05] p-4">
              <div className="flex items-center gap-2 mb-1"><ShieldAlert size={12} className="text-destructive" /><span className="text-[10px] font-mono uppercase text-destructive font-semibold">Found in Breach Corpus</span></div>
              <p className="text-[11px] text-muted-foreground">This password appears in known data breaches. It would be rejected by HIBP/Pwned-Passwords lookups regardless of complexity score.</p>
            </motion.div>
          )}
        </div>

        {/* Rules checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Policy Rules</p>
            <span className="text-[9px] font-mono text-muted-foreground">{passedCount}/{RULES.length} passed</span>
          </div>
          <div className="space-y-1.5">
            {results.map(r => (
              <motion.div key={r.id} layout transition={spring}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all ${r.passed ? "border-green-500/15 bg-green-500/[0.02]" : password.length > 0 && r.severity === "policy" ? "border-destructive/10 bg-destructive/[0.01]" : "border-[rgba(255,255,255,0.04)]"}`}>
                {password.length === 0 ? (
                  <div className="h-3.5 w-3.5 rounded-full border border-[rgba(255,255,255,0.1)] shrink-0" />
                ) : r.passed ? (
                  <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                ) : (
                  <XCircle size={14} className={r.severity === "policy" ? "text-destructive/70 shrink-0" : "text-muted-foreground/40 shrink-0"} />
                )}
                <span className={`text-[11px] flex-1 ${r.passed ? "text-foreground" : password.length > 0 ? "text-muted-foreground/70" : "text-muted-foreground/40"}`}>{r.label}</span>
                <span className={`text-[8px] font-mono uppercase tracking-wider ${r.severity === "policy" ? "text-destructive/60" : "text-muted-foreground/40"}`}>{r.severity}</span>
                <span className="text-[9px] font-mono text-muted-foreground/40 w-7 text-right">+{r.weight}</span>
              </motion.div>
            ))}
          </div>

          {password.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`mt-4 rounded-xl border p-3 ${policyPassed && !breached ? "border-green-500/20 bg-green-500/[0.02]" : "border-yellow-500/20 bg-yellow-500/[0.03]"}`}>
              <div className="flex items-center gap-2 mb-1">
                {policyPassed && !breached
                  ? <><CheckCircle2 size={12} className="text-green-400" /><span className="text-[10px] font-mono uppercase text-green-400 font-semibold">Policy Decision: ACCEPT</span></>
                  : <><AlertTriangle size={12} className="text-yellow-400" /><span className="text-[10px] font-mono uppercase text-yellow-400 font-semibold">Policy Decision: REJECT</span></>}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {policyPassed && !breached
                  ? "All required policy rules satisfied. Password would be hashed (Argon2id, 64MB / 3 iter) and stored."
                  : breached
                    ? "Rejected: matches an entry in the breach corpus."
                    : "One or more required policy rules failed. Registration would be blocked."}
              </p>
            </motion.div>
          )}

          {/* Storage detail */}
          <div className="mt-4 rounded-xl border border-secondary/10 bg-secondary/[0.02] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={11} className="text-secondary" />
              <p className="text-[9px] font-mono uppercase tracking-wider text-secondary font-semibold">Storage / Lifecycle</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              hash = <span className="font-mono text-foreground/80">argon2id(pw, salt={password.length > 0 ? "rand(16B)" : "—"}, m=64MB, t=3)</span> · rotated only on suspected compromise (NIST SP 800-63B).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordPoliciesShowcase;
