import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, ArrowRight, RotateCcw, Zap, FileText, Database, Settings, Lock, AlertTriangle, GitBranch, Layers } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

// ─── Multi-layered policy model ──────────────────────────────────────
// Each rule has a scope, an effect (allow/deny), and a condition.
// Evaluation order: explicit DENY > explicit ALLOW > inherited > default-deny.

type Effect = "allow" | "deny";
type Scope = "role" | "resource" | "ownership" | "org";

interface Rule {
  id: string;
  scope: Scope;
  effect: Effect;
  subject: string;          // role or "*"
  action: string;           // verb or "*"
  resource: string;         // resource id or "*"
  condition?: (ctx: EvalCtx) => boolean;
  conditionLabel?: string;
  priority: number;         // higher wins on ties
}

interface EvalCtx {
  role: string;
  resource: string;
  action: string;
  isOwner: boolean;
  classification: "public" | "internal" | "confidential";
}

interface Resource {
  id: string;
  label: string;
  icon: React.ReactNode;
  classification: EvalCtx["classification"];
  ownerRole: string;
}

const RESOURCES: Resource[] = [
  { id: "docs",     label: "Public Docs",      icon: <FileText size={16} />, classification: "public",       ownerRole: "viewer" },
  { id: "db",       label: "Customer DB",      icon: <Database size={16} />, classification: "confidential", ownerRole: "editor" },
  { id: "settings", label: "Org Settings",     icon: <Settings size={16} />, classification: "confidential", ownerRole: "admin"  },
  { id: "logs",     label: "Audit Logs",       icon: <FileText size={16} />, classification: "internal",     ownerRole: "admin"  },
];

const ROLES = [
  { id: "viewer", label: "Viewer", inherits: [] as string[] },
  { id: "editor", label: "Editor", inherits: ["viewer"] },
  { id: "admin",  label: "Admin",  inherits: ["editor"] },
  { id: "auditor", label: "Auditor", inherits: [] }, // separation of duties: read-only on logs
];

const ACTIONS = ["read", "write", "delete"] as const;

// Static policy bundle (the kind a real PDP would load)
const POLICY: Rule[] = [
  // Role grants
  { id: "r1", scope: "role", effect: "allow", subject: "viewer",  action: "read",   resource: "*",        priority: 10 },
  { id: "r2", scope: "role", effect: "allow", subject: "editor",  action: "write",  resource: "*",        priority: 10 },
  { id: "r3", scope: "role", effect: "allow", subject: "admin",   action: "*",      resource: "*",        priority: 10 },
  { id: "r4", scope: "role", effect: "allow", subject: "auditor", action: "read",   resource: "logs",     priority: 10 },

  // Resource-level guards
  { id: "rs1", scope: "resource", effect: "deny",  subject: "*",       action: "delete", resource: "logs",
    conditionLabel: "audit-immutable", priority: 100 },
  { id: "rs2", scope: "resource", effect: "deny",  subject: "editor",  action: "*",      resource: "settings",
    conditionLabel: "settings need admin", priority: 90 },

  // Ownership / context
  { id: "ow1", scope: "ownership", effect: "allow", subject: "*", action: "write", resource: "*",
    condition: (c) => c.isOwner, conditionLabel: "owner override", priority: 50 },

  // Org policy: deny writes on confidential without admin role (SoD-ish)
  { id: "or1", scope: "org", effect: "deny", subject: "*", action: "write", resource: "*",
    condition: (c) => c.classification === "confidential" && c.role !== "admin",
    conditionLabel: "confidential ⇒ admin only", priority: 80 },
];

const SCOPE_COLOR: Record<Scope, string> = {
  role: "text-primary",
  resource: "text-secondary",
  ownership: "text-yellow-400",
  org: "text-orange-400",
};

const SCOPE_LABEL: Record<Scope, string> = {
  role: "ROLE",
  resource: "RES",
  ownership: "OWN",
  org: "ORG",
};

// Expand role inheritance into the effective set of role ids
const expandRoles = (roleId: string): Set<string> => {
  const out = new Set<string>([roleId]);
  const role = ROLES.find(r => r.id === roleId);
  role?.inherits.forEach(p => expandRoles(p).forEach(x => out.add(x)));
  return out;
};

const matches = (rule: Rule, ctx: EvalCtx, effectiveRoles: Set<string>) => {
  const subjOk = rule.subject === "*" || effectiveRoles.has(rule.subject);
  const actOk  = rule.action  === "*" || rule.action === ctx.action;
  const resOk  = rule.resource === "*" || rule.resource === ctx.resource;
  const condOk = rule.condition ? rule.condition(ctx) : true;
  return subjOk && actOk && resOk && condOk;
};

const AuthZShowcase = () => {
  const [role, setRole] = useState("editor");
  const [selectedResource, setSelectedResource] = useState<string>("db");
  const [selectedAction, setSelectedAction] = useState<typeof ACTIONS[number]>("write");
  const [isOwner, setIsOwner] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const resource = RESOURCES.find(r => r.id === selectedResource)!;
  const effectiveRoles = useMemo(() => expandRoles(role), [role]);

  const ctx: EvalCtx = useMemo(() => ({
    role,
    resource: selectedResource,
    action: selectedAction,
    isOwner,
    classification: resource.classification,
  }), [role, selectedResource, selectedAction, isOwner, resource]);

  // Find every rule that matches, sort deny-first then by priority desc
  const trace = useMemo(() => {
    const hit = POLICY.filter(r => matches(r, ctx, effectiveRoles));
    return [...hit].sort((a, b) => {
      if (a.effect !== b.effect) return a.effect === "deny" ? -1 : 1;
      return b.priority - a.priority;
    });
  }, [ctx, effectiveRoles]);

  const decision = useMemo(() => {
    const deny = trace.find(r => r.effect === "deny");
    if (deny) return { effect: "DENY" as const, by: deny, reason: deny.conditionLabel ?? "explicit deny" };
    const allow = trace.find(r => r.effect === "allow");
    if (allow) return { effect: "ALLOW" as const, by: allow, reason: allow.conditionLabel ?? "explicit allow" };
    return { effect: "DENY" as const, by: null, reason: "default-deny (no matching allow)" };
  }, [trace]);

  const evaluate = useCallback(() => {
    if (evaluating) return;
    setEvaluated(false);
    setEvaluating(true);
    timeoutRef.current = setTimeout(() => { setEvaluating(false); setEvaluated(true); }, 900);
  }, [evaluating]);

  const reset = () => { clearTimeout(timeoutRef.current); setEvaluated(false); setEvaluating(false); };

  const allowed = decision.effect === "ALLOW";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-bold text-foreground">Authorization Engine</h2>
        {evaluated && (
          <button onClick={reset} className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Build a request, then trace it through a real policy bundle. Multiple rule scopes — <span className="text-primary">role</span>,
        <span className="text-secondary"> resource</span>, <span className="text-yellow-400">ownership</span>,
        <span className="text-orange-400"> org</span> — combine with <span className="text-foreground">deny-overrides</span> semantics.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subject + role inheritance */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Subject</p>
            <span className="text-[9px] font-mono text-muted-foreground/60 flex items-center gap-1">
              <GitBranch size={9} /> inherits: {[...effectiveRoles].filter(r => r !== role).join(", ") || "—"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => { if (!evaluating) { setRole(r.id); setEvaluated(false); } }} disabled={evaluating}
                className={`relative rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${role === r.id ? "border-primary/40 bg-primary/[0.06] text-foreground" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/60 hover:border-[rgba(255,255,255,0.1)]"}`}>
                {role === r.id && <motion.div layoutId="authz-role" className="absolute inset-0 rounded-lg bg-primary/[0.06] border border-primary/30" transition={spring} />}
                <span className="relative z-10">{r.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.15)] p-2.5">
            <button onClick={() => { if (!evaluating) { setIsOwner(!isOwner); setEvaluated(false); } }} disabled={evaluating}
              className={`h-4 w-7 rounded-full transition-colors relative shrink-0 ${isOwner ? "bg-yellow-500/40" : "bg-muted/30"}`}>
              <motion.div className={`absolute top-0.5 h-3 w-3 rounded-full ${isOwner ? "bg-yellow-400" : "bg-muted-foreground/40"}`}
                animate={{ left: isOwner ? 14 : 2 }} transition={spring} />
            </button>
            <span className="text-[10px] text-muted-foreground">User is the <span className="text-yellow-400">owner</span> of this resource</span>
          </div>
        </div>

        {/* Resource */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Resource</p>
          <div className="space-y-1.5">
            {RESOURCES.map(r => (
              <button key={r.id} onClick={() => { if (!evaluating) { setSelectedResource(r.id); setEvaluated(false); } }} disabled={evaluating}
                className={`flex items-center gap-3 w-full rounded-lg border px-3 py-2 text-left transition-all ${selectedResource === r.id ? "border-secondary/30 bg-secondary/[0.04]" : "border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]"}`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${selectedResource === r.id ? "bg-secondary/15 text-secondary" : "bg-muted/30 text-muted-foreground"}`}>{r.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${selectedResource === r.id ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/50">class:{r.classification}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Action</p>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map(a => (
            <button key={a} onClick={() => { if (!evaluating) { setSelectedAction(a); setEvaluated(false); } }} disabled={evaluating}
              className={`relative rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all ${selectedAction === a ? "border-primary/40 text-foreground" : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.12)]"}`}>
              {selectedAction === a && <motion.div layoutId="authz-action" className="absolute inset-0 rounded-lg bg-primary/[0.06] border border-primary/30" transition={spring} />}
              <span className="relative z-10 flex items-center justify-center gap-2"><Lock size={11} /> {a}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Evaluate button */}
      {!evaluated && (
        <div className="flex justify-center mb-6">
          <motion.button onClick={evaluate} disabled={evaluating}
            className="group flex items-center gap-3 rounded-xl border bg-primary/10 border-primary/20 px-8 py-3.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-all disabled:opacity-50"
            whileHover={evaluating ? {} : { scale: 1.02 }} whileTap={evaluating ? {} : { scale: 0.98 }}>
            {evaluating ? (
              <>
                <motion.div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                Evaluating policy bundle…
              </>
            ) : (
              <><Zap size={16} /> Evaluate Request <ArrowRight size={14} /></>
            )}
          </motion.button>
        </div>
      )}

      {/* Decision + trace */}
      <AnimatePresence>
        {evaluated && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
            <div className={`rounded-xl border px-5 py-4 ${allowed ? "border-green-500/20 bg-green-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${allowed ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`}>
                  {allowed ? <ShieldCheck size={20} /> : <ShieldX size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-display text-sm font-bold ${allowed ? "text-green-400" : "text-destructive"}`}>
                    {decision.effect} — {decision.reason}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {trace.length} matching rule{trace.length !== 1 ? "s" : ""} evaluated. Deny-overrides means a single deny defeats every allow.
                  </p>
                </div>
              </div>
            </div>

            {/* Trace */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Decision Trace</span>
              </div>
              {trace.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60 font-mono">no rules matched → default-deny</p>
              ) : (
                <div className="space-y-1.5">
                  {trace.map((r, i) => {
                    const isWinner = decision.by?.id === r.id;
                    return (
                      <div key={r.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 font-mono text-[10px] ${isWinner ? (r.effect === "deny" ? "border-destructive/30 bg-destructive/[0.04]" : "border-green-500/30 bg-green-500/[0.04]") : "border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.15)]"}`}>
                        <span className="text-muted-foreground/50 w-4">{i + 1}.</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${SCOPE_COLOR[r.scope]} bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]`}>{SCOPE_LABEL[r.scope]}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${r.effect === "allow" ? "text-green-400 bg-green-500/10" : "text-destructive bg-destructive/10"}`}>{r.effect.toUpperCase()}</span>
                        <span className="text-foreground/80 truncate">{r.subject} → {r.action} → {r.resource}</span>
                        {r.conditionLabel && <span className="text-muted-foreground/60 italic ml-auto shrink-0">if {r.conditionLabel}</span>}
                        <span className="text-muted-foreground/40 shrink-0">p={r.priority}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-start gap-2 text-[10px] text-muted-foreground/70">
                <AlertTriangle size={10} className="text-yellow-400/70 shrink-0 mt-0.5" />
                <span>
                  Edge case shown: even an admin can&rsquo;t <span className="text-foreground">delete logs</span> (immutable),
                  and an editor can&rsquo;t write to <span className="text-foreground">org-confidential</span> resources unless they own the record.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthZShowcase;
