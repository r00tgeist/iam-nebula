import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileJson, CheckCircle2, XCircle, Trash2, Zap, Cpu, ShieldCheck, Database, FileText, Plus, AlertTriangle } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

// ─── A miniature OPA/Rego-style policy engine ────────────────────────
// Every rule is { effect, when(input) }. Combining algorithm: deny-overrides.

type Effect = "allow" | "deny";

interface PolicyInput {
  subject: { id: string; role: string; team: string };
  resource: { id: string; sensitivity: "low" | "medium" | "high" };
  action: string;
  context: { hour: number; ip: "office" | "vpn" | "public"; mfa: boolean };
}

interface Rule {
  id: string;
  effect: Effect;
  description: string;          // English label of intent
  rego: string;                 // Pseudo-rego representation
  when: (i: PolicyInput) => boolean;
  priority: number;
}

const POLICY: Rule[] = [
  { id: "p1", effect: "allow", description: "engineers can read low-sens resources from any network",
    rego: `allow { input.subject.role == "engineer"; input.action == "read"; input.resource.sensitivity == "low" }`,
    when: i => i.subject.role === "engineer" && i.action === "read" && i.resource.sensitivity === "low",
    priority: 10 },
  { id: "p2", effect: "allow", description: "engineers can write medium resources from office or VPN with MFA",
    rego: `allow { input.subject.role == "engineer"; input.action == "write"; input.resource.sensitivity != "high"; input.context.mfa; input.context.ip != "public" }`,
    when: i => i.subject.role === "engineer" && i.action === "write" && i.resource.sensitivity !== "high" && i.context.mfa && i.context.ip !== "public",
    priority: 20 },
  { id: "p3", effect: "allow", description: "admins are unrestricted within business hours",
    rego: `allow { input.subject.role == "admin"; input.context.hour >= 8; input.context.hour < 20 }`,
    when: i => i.subject.role === "admin" && i.context.hour >= 8 && i.context.hour < 20, priority: 30 },
  { id: "p4", effect: "deny",  description: "no high-sens access from public networks",
    rego: `deny  { input.resource.sensitivity == "high"; input.context.ip == "public" }`,
    when: i => i.resource.sensitivity === "high" && i.context.ip === "public", priority: 100 },
  { id: "p5", effect: "deny",  description: "no writes outside business hours without MFA",
    rego: `deny  { input.action == "write"; not input.context.mfa; input.context.hour < 7 or input.context.hour >= 20 }`,
    when: i => i.action === "write" && !i.context.mfa && (i.context.hour < 7 || i.context.hour >= 20), priority: 90 },
  { id: "p6", effect: "deny",  description: "interns can never delete",
    rego: `deny  { input.subject.role == "intern"; input.action == "delete" }`,
    when: i => i.subject.role === "intern" && i.action === "delete", priority: 80 },
];

const ROLES = ["engineer", "admin", "intern", "contractor"] as const;
const ACTIONS = ["read", "write", "delete"] as const;
const RESOURCES = [
  { id: "/api/logs", sensitivity: "low" as const },
  { id: "/api/users", sensitivity: "medium" as const },
  { id: "/api/billing", sensitivity: "high" as const },
];

const PBACShowcase = () => {
  const [role, setRole] = useState<typeof ROLES[number]>("engineer");
  const [action, setAction] = useState<typeof ACTIONS[number]>("read");
  const [resource, setResource] = useState(RESOURCES[0]);
  const [hour, setHour] = useState(14);
  const [ip, setIp] = useState<"office" | "vpn" | "public">("office");
  const [mfa, setMfa] = useState(true);
  const [policies, setPolicies] = useState(POLICY);

  const input: PolicyInput = useMemo(() => ({
    subject: { id: "u_42", role, team: "platform" },
    resource: { id: resource.id, sensitivity: resource.sensitivity },
    action,
    context: { hour, ip, mfa },
  }), [role, action, resource, hour, ip, mfa]);

  const trace = useMemo(() => {
    return policies.filter(p => p.when(input))
      .sort((a, b) => (a.effect === b.effect ? b.priority - a.priority : a.effect === "deny" ? -1 : 1));
  }, [policies, input]);

  const decision = useMemo(() => {
    const deny = trace.find(t => t.effect === "deny");
    if (deny) return { effect: "DENY" as const, by: deny };
    const allow = trace.find(t => t.effect === "allow");
    if (allow) return { effect: "ALLOW" as const, by: allow };
    return { effect: "DENY" as const, by: null };
  }, [trace]);

  const removePolicy = (id: string) => setPolicies(p => p.filter(x => x.id !== id));
  const restore = () => setPolicies(POLICY);

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Policy-Based Access Control</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Decisions are made by a central <span className="text-foreground">Policy Decision Point</span>. Rules are written in
        a declarative DSL (Rego-style), inputs are <span className="text-foreground">JSON facts</span>, and the combining
        algorithm is <span className="text-foreground">deny-overrides</span>.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy bundle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Policy bundle (PAP)</p>
            <button onClick={restore} className="text-[10px] font-mono text-primary hover:underline">restore</button>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {policies.map(p => {
                const fired = trace.some(t => t.id === p.id);
                return (
                  <motion.div key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={spring}
                    className={`rounded-xl border p-3 transition-all ${fired ? (p.effect === "deny" ? "border-destructive/30 bg-destructive/[0.03]" : "border-green-500/25 bg-green-500/[0.02]") : "border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)]"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${p.effect === "allow" ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`}>{p.effect.toUpperCase()}</span>
                      <span className="text-[10px] text-foreground/80 truncate flex-1">{p.description}</span>
                      <span className="text-[8px] font-mono text-muted-foreground/40">p={p.priority}</span>
                      <button onClick={() => removePolicy(p.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors"><Trash2 size={10} /></button>
                    </div>
                    <pre className="text-[9px] font-mono text-muted-foreground/60 leading-snug whitespace-pre-wrap">{p.rego}</pre>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* PEP request + decision */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileJson size={12} className="text-secondary" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">PEP → PDP request</span>
            </div>

            <div className="space-y-3 text-[11px]">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground mb-1">subject.role</p>
                <div className="flex flex-wrap gap-1">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border ${role === r ? "border-secondary/40 bg-secondary/[0.06] text-secondary" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/60 hover:border-[rgba(255,255,255,0.1)]"}`}>{r}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-mono text-muted-foreground mb-1">action</p>
                <div className="flex gap-1">
                  {ACTIONS.map(a => (
                    <button key={a} onClick={() => setAction(a)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border ${action === a ? "border-primary/40 bg-primary/[0.06] text-primary" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/60 hover:border-[rgba(255,255,255,0.1)]"}`}>{a}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-mono text-muted-foreground mb-1">resource (sensitivity)</p>
                <div className="space-y-1">
                  {RESOURCES.map(r => (
                    <button key={r.id} onClick={() => setResource(r)}
                      className={`flex items-center justify-between w-full text-[10px] font-mono px-2 py-1 rounded border ${resource.id === r.id ? "border-primary/30 bg-primary/[0.04] text-foreground" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/60 hover:border-[rgba(255,255,255,0.1)]"}`}>
                      <span>{r.id}</span>
                      <span className={r.sensitivity === "high" ? "text-destructive" : r.sensitivity === "medium" ? "text-yellow-400" : "text-green-400"}>{r.sensitivity}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground mb-1">hour ({hour}:00)</p>
                  <input type="range" min={0} max={23} value={hour} onChange={e => setHour(+e.target.value)} className="w-full accent-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground mb-1">network</p>
                  <select value={ip} onChange={e => setIp(e.target.value as any)} className="w-full text-[10px] font-mono bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)] rounded px-2 py-1 text-foreground">
                    <option value="office">office</option>
                    <option value="vpn">vpn</option>
                    <option value="public">public</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground mb-1">mfa</p>
                  <button onClick={() => setMfa(!mfa)} className={`w-full text-[10px] font-mono py-1 rounded border ${mfa ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-destructive/30 text-destructive bg-destructive/5"}`}>{mfa ? "true" : "false"}</button>
                </div>
              </div>
            </div>
          </div>

          {/* Decision panel */}
          <div className={`rounded-xl border p-4 ${decision.effect === "ALLOW" ? "border-green-500/20 bg-green-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={12} className={decision.effect === "ALLOW" ? "text-green-400" : "text-destructive"} />
              <span className={`text-sm font-display font-bold ${decision.effect === "ALLOW" ? "text-green-400" : "text-destructive"}`}>{decision.effect}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">PDP decision</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">
              {decision.by ? <>matched: <span className="text-foreground italic">{decision.by.description}</span></> : <>no policy matched → default deny</>}
            </p>
            <div className="space-y-1 font-mono text-[9px]">
              <p className="text-muted-foreground/60">decision log:</p>
              {trace.length === 0 && <p className="text-muted-foreground/40">  (no rules fired)</p>}
              {trace.map((t, i) => (
                <p key={t.id} className={`${t.effect === "deny" ? "text-destructive" : "text-green-400"} ${decision.by?.id === t.id ? "font-bold" : "opacity-70"}`}>
                  {i + 1}. {t.effect.toUpperCase()} ← {t.id} {decision.by?.id === t.id ? "← winner" : ""}
                </p>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-start gap-2">
              <AlertTriangle size={10} className="text-yellow-400/70 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground/70">
                The PDP returns a decision + obligations (audit log entry). The PEP enforces it. Policies live in version control —
                separating <span className="text-foreground">who decides</span> from <span className="text-foreground">who enforces</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PBACShowcase;
