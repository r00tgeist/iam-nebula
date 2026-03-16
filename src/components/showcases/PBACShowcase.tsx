import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileJson, CheckCircle2, XCircle, Plus, Trash2, Zap } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface PolicyRule { id: string; subject: string; action: string; resource: string; effect: "allow" | "deny"; condition?: string }

const DEFAULT_POLICIES: PolicyRule[] = [
  { id: "p1", subject: "engineers", action: "read", resource: "/api/logs", effect: "allow", condition: "weekday only" },
  { id: "p2", subject: "engineers", action: "write", resource: "/api/config", effect: "allow", condition: "with approval" },
  { id: "p3", subject: "interns", action: "read", resource: "/api/logs", effect: "deny" },
  { id: "p4", subject: "admins", action: "*", resource: "*", effect: "allow" },
  { id: "p5", subject: "*", action: "delete", resource: "/api/production", effect: "deny", condition: "always blocked" },
];

const SUBJECTS = ["engineers", "interns", "admins", "contractors"];
const ACTIONS = ["read", "write", "delete", "execute"];
const RESOURCES = ["/api/logs", "/api/config", "/api/production", "/api/users"];

const PBACShowcase = () => {
  const [policies, setPolicies] = useState<PolicyRule[]>(DEFAULT_POLICIES);
  const [testSubject, setTestSubject] = useState("engineers");
  const [testAction, setTestAction] = useState("read");
  const [testResource, setTestResource] = useState("/api/logs");
  const [evaluated, setEvaluated] = useState(false);

  const evaluation = useMemo(() => {
    const matchingPolicies = policies.filter(p => {
      const subMatch = p.subject === "*" || p.subject === testSubject;
      const actMatch = p.action === "*" || p.action === testAction;
      const resMatch = p.resource === "*" || p.resource === testResource;
      return subMatch && actMatch && resMatch;
    });
    // Deny takes precedence
    const hasDeny = matchingPolicies.some(p => p.effect === "deny");
    const hasAllow = matchingPolicies.some(p => p.effect === "allow");
    const decision = hasDeny ? "DENY" : hasAllow ? "ALLOW" : "DENY (default)";
    return { matchingPolicies, decision, allowed: !hasDeny && hasAllow };
  }, [policies, testSubject, testAction, testResource]);

  const removePolicy = (id: string) => setPolicies(prev => prev.filter(p => p.id !== id));

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Policy-Based Access Control</h2>
      <p className="text-sm text-muted-foreground mb-8">Define centralized policies. Test a request against the policy engine — deny-overrides by default.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Policy list */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Policy Rules</p>
          <div className="space-y-2 mb-4">
            <AnimatePresence mode="popLayout">
              {policies.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0 }} transition={spring}
                  className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] px-3 py-2.5">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${p.effect === "allow" ? "bg-green-500/10 text-green-400 border border-green-500/15" : "bg-destructive/10 text-destructive border border-destructive/15"}`}>
                    {p.effect.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-foreground truncate">
                      <span className="text-secondary">{p.subject}</span> → <span className="text-primary">{p.action}</span> → <span className="text-muted-foreground">{p.resource}</span>
                    </p>
                    {p.condition && <p className="text-[9px] text-muted-foreground/50 italic">{p.condition}</p>}
                  </div>
                  <button onClick={() => removePolicy(p.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"><Trash2 size={12} /></button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <button onClick={() => setPolicies(DEFAULT_POLICIES)} className="text-[10px] font-mono text-primary hover:underline">Reset to defaults</button>
        </div>

        {/* Test panel */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Policy Evaluation Test</p>
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5 space-y-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-mono mb-2">Subject</p>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => { setTestSubject(s); setEvaluated(false); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${testSubject === s ? "border-secondary/30 bg-secondary/[0.06] text-secondary" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/50 hover:border-[rgba(255,255,255,0.1)]"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono mb-2">Action</p>
              <div className="flex flex-wrap gap-1.5">
                {ACTIONS.map(a => (
                  <button key={a} onClick={() => { setTestAction(a); setEvaluated(false); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${testAction === a ? "border-primary/30 bg-primary/[0.06] text-primary" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/50 hover:border-[rgba(255,255,255,0.1)]"}`}>{a}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono mb-2">Resource</p>
              <div className="flex flex-wrap gap-1.5">
                {RESOURCES.map(r => (
                  <button key={r} onClick={() => { setTestResource(r); setEvaluated(false); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${testResource === r ? "border-primary/30 bg-primary/[0.06] text-foreground" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/50 hover:border-[rgba(255,255,255,0.1)]"}`}>{r}</button>
                ))}
              </div>
            </div>

            <motion.button onClick={() => setEvaluated(true)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary/10 border border-secondary/20 py-3 text-sm font-semibold text-secondary hover:bg-secondary/15 transition-all"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Zap size={14} /> Evaluate Policy
            </motion.button>
          </div>

          <AnimatePresence>
            {evaluated && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}
                className={`mt-4 rounded-xl border p-4 ${evaluation.allowed ? "border-green-500/20 bg-green-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {evaluation.allowed ? <CheckCircle2 size={14} className="text-green-400" /> : <XCircle size={14} className="text-destructive" />}
                  <span className={`text-sm font-bold ${evaluation.allowed ? "text-green-400" : "text-destructive"}`}>{evaluation.decision}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{evaluation.matchingPolicies.length} matching rule{evaluation.matchingPolicies.length !== 1 ? "s" : ""} found.</p>
                <div className="space-y-1 font-mono text-[10px]">
                  {evaluation.matchingPolicies.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className={p.effect === "allow" ? "text-green-400" : "text-destructive"}>{p.effect}</span>
                      <span className="text-muted-foreground">{p.subject} → {p.action} → {p.resource}</span>
                    </div>
                  ))}
                  {evaluation.matchingPolicies.length === 0 && <p className="text-muted-foreground/50">No matching policies — default deny.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PBACShowcase;
