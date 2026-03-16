import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Rule { id: string; label: string; test: (pw: string) => boolean; weight: number }

const RULES: Rule[] = [
  { id: "length", label: "Minimum 12 characters", test: pw => pw.length >= 12, weight: 20 },
  { id: "upper", label: "Contains uppercase letter", test: pw => /[A-Z]/.test(pw), weight: 10 },
  { id: "lower", label: "Contains lowercase letter", test: pw => /[a-z]/.test(pw), weight: 10 },
  { id: "digit", label: "Contains number", test: pw => /\d/.test(pw), weight: 10 },
  { id: "special", label: "Contains special character", test: pw => /[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?~`]/.test(pw), weight: 15 },
  { id: "norepeat", label: "No 3+ repeated characters", test: pw => !/(.)\1{2,}/.test(pw), weight: 10 },
  { id: "nocommon", label: "Not a common password", test: pw => !["password", "123456", "qwerty", "admin", "letmein", "welcome", "password123"].includes(pw.toLowerCase()), weight: 15 },
  { id: "nosequence", label: "No sequential patterns", test: pw => !/abc|bcd|cde|123|234|345|456|567|678|789/i.test(pw), weight: 10 },
];

const PRESETS = [
  { label: "Weak", value: "pass" },
  { label: "Common", value: "password123" },
  { label: "Medium", value: "MyDog2024!" },
  { label: "Strong", value: "K#9xR$mQ2!pL" },
  { label: "Excellent", value: "c0rr3ct-h0rse-b@ttery-st@ple" },
];

const PasswordPoliciesShowcase = () => {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const results = useMemo(() => RULES.map(r => ({ ...r, passed: password.length > 0 ? r.test(password) : false })), [password]);
  const score = useMemo(() => results.reduce((s, r) => s + (r.passed ? r.weight : 0), 0), [results]);
  const passedCount = results.filter(r => r.passed).length;
  const level = score >= 90 ? "Excellent" : score >= 70 ? "Strong" : score >= 45 ? "Medium" : score > 0 ? "Weak" : "—";
  const levelColor = score >= 90 ? "text-green-400" : score >= 70 ? "text-primary" : score >= 45 ? "text-yellow-400" : score > 0 ? "text-destructive" : "text-muted-foreground";
  const barColor = score >= 90 ? "bg-green-400" : score >= 70 ? "bg-primary" : score >= 45 ? "bg-yellow-400" : "bg-destructive";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Password Policy Analyzer</h2>
      <p className="text-sm text-muted-foreground mb-8">Type a password or pick a preset. See which policy rules pass in real time.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {/* Input */}
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

          {/* Presets */}
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Strength</span>
              <span className={`text-xs font-mono font-bold ${levelColor}`}>{level} ({score}/100)</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
              <motion.div className={`h-full rounded-full ${barColor}`} animate={{ width: `${score}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-4 font-mono text-[11px] space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Length</span><span className="text-foreground">{password.length} chars</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Unique chars</span><span className="text-foreground">{new Set(password).size}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Character classes</span><span className="text-foreground">{[/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter(r => r.test(password)).length}/4</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rules passed</span><span className="text-foreground">{passedCount}/{RULES.length}</span></div>
          </div>
        </div>

        {/* Rules checklist */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Policy Rules</p>
          <div className="space-y-2">
            {results.map(r => (
              <motion.div key={r.id} layout transition={spring}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${r.passed ? "border-green-500/15 bg-green-500/[0.02]" : password.length > 0 ? "border-destructive/10 bg-destructive/[0.01]" : "border-[rgba(255,255,255,0.04)]"}`}>
                {password.length === 0 ? (
                  <div className="h-4 w-4 rounded-full border border-[rgba(255,255,255,0.1)] shrink-0" />
                ) : r.passed ? (
                  <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-destructive/60 shrink-0" />
                )}
                <span className={`text-xs ${r.passed ? "text-foreground" : password.length > 0 ? "text-muted-foreground/60" : "text-muted-foreground/40"}`}>{r.label}</span>
                <span className="text-[9px] font-mono text-muted-foreground/40 ml-auto">+{r.weight}</span>
              </motion.div>
            ))}
          </div>

          {password.length > 0 && score < 70 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-1"><AlertTriangle size={12} className="text-yellow-400" /><span className="text-[10px] font-mono uppercase text-yellow-400 font-semibold">Policy Violation</span></div>
              <p className="text-[11px] text-muted-foreground">This password does not meet the organization's minimum policy requirements (score ≥ 70). It would be rejected at registration.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordPoliciesShowcase;
