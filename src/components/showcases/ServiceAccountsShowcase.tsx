import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, AlertTriangle, CheckCircle2, RotateCcw, Shield, GitBranch, Activity, KeyRound } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface ServiceAccount {
  id: string;
  name: string;
  type: "api-key" | "oauth-client" | "spiffe" | "static-secret";
  owner: string;
  lastUsed: string;
  daysSinceUse: number;
  keyAge: number;
  permissions: string[];
  scopeBreadth: "narrow" | "broad" | "wildcard";
  storedIn: "vault" | "k8s-secret" | "env-var" | "code-repo";
  callsPerDay: number;
}

const ACCOUNTS: ServiceAccount[] = [
  { id: "sa1", name: "payment-service",      type: "oauth-client",  owner: "Platform",     lastUsed: "2m ago",    daysSinceUse: 0,  keyAge: 12,  permissions: ["payments:write", "ledger:read"], scopeBreadth: "narrow",  storedIn: "vault",       callsPerDay: 18420 },
  { id: "sa2", name: "ci-cd-pipeline",       type: "api-key",       owner: "DevOps",       lastUsed: "5m ago",    daysSinceUse: 0,  keyAge: 89,  permissions: ["deploy:*", "registry:push", "secrets:read"], scopeBreadth: "broad",  storedIn: "k8s-secret",  callsPerDay: 312 },
  { id: "sa3", name: "monitoring-agent",     type: "spiffe",        owner: "SRE",          lastUsed: "30s ago",   daysSinceUse: 0,  keyAge: 1,   permissions: ["metrics:read", "logs:read"], scopeBreadth: "narrow",  storedIn: "vault",       callsPerDay: 86400 },
  { id: "sa4", name: "legacy-etl-job",       type: "api-key",       owner: "Unknown",      lastUsed: "47 days",   daysSinceUse: 47, keyAge: 340, permissions: ["db:read", "db:write", "admin:*"], scopeBreadth: "wildcard", storedIn: "env-var",     callsPerDay: 0 },
  { id: "sa5", name: "slack-bot",            type: "oauth-client",  owner: "Engineering",  lastUsed: "1h ago",    daysSinceUse: 0,  keyAge: 45,  permissions: ["messages:send", "channels:read"], scopeBreadth: "narrow", storedIn: "vault",       callsPerDay: 240 },
  { id: "sa6", name: "infra-bootstrap-key",  type: "static-secret", owner: "Founders",     lastUsed: "8 months",  daysSinceUse: 245, keyAge: 720, permissions: ["*:*"], scopeBreadth: "wildcard", storedIn: "code-repo",   callsPerDay: 0 },
];

const TYPE_LABELS = { "api-key": "API Key", "oauth-client": "OAuth Client", "spiffe": "SPIFFE/mTLS", "static-secret": "Static Secret" };

interface Risk { score: number; reasons: string[]; level: "healthy" | "warning" | "critical" }

const assessRisk = (a: ServiceAccount, rotated: boolean): Risk => {
  const reasons: string[] = [];
  let score = 0;
  const age = rotated ? 0 : a.keyAge;

  if (age > 90)        { score += 30; reasons.push(`Credential age ${age}d > 90d rotation policy`); }
  else if (age > 60)   { score += 15; reasons.push(`Credential age ${age}d approaching rotation`); }
  if (a.daysSinceUse > 30) { score += 25; reasons.push(`Inactive ${a.daysSinceUse}d (candidate for revocation)`); }
  if (a.scopeBreadth === "wildcard") { score += 35; reasons.push("Wildcard scope (*:*) — violates least-privilege"); }
  else if (a.scopeBreadth === "broad") { score += 15; reasons.push("Broad scope grants more than typical use requires"); }
  if (a.storedIn === "code-repo") { score += 40; reasons.push("Secret stored in code repository — high leak risk"); }
  else if (a.storedIn === "env-var") { score += 10; reasons.push("Secret in environment variable (not vaulted)"); }
  if (a.owner === "Unknown" || a.owner === "Founders") { score += 15; reasons.push(`Owner '${a.owner}' — unclear accountability`); }
  if (a.type === "static-secret") { score += 20; reasons.push("Long-lived static secret (no auto-rotation)"); }

  const level: Risk["level"] = score >= 60 ? "critical" : score >= 25 ? "warning" : "healthy";
  return { score: Math.min(score, 100), reasons, level };
};

const STATUS_COLORS = {
  healthy:  "text-green-400 border-green-500/20 bg-green-500/10",
  warning:  "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
  critical: "text-destructive border-destructive/20 bg-destructive/10",
};

const STORE_LABEL = { vault: "HashiCorp Vault", "k8s-secret": "K8s Secret", "env-var": "Env Variable", "code-repo": "Code Repo (!)" };

const ServiceAccountsShowcase = () => {
  const [selected, setSelected] = useState<string | null>("sa4");
  const [rotated, setRotated] = useState<Set<string>>(new Set());
  const [revoked, setRevoked] = useState<Set<string>>(new Set());

  const accountsWithRisk = useMemo(() =>
    ACCOUNTS.map(a => ({ ...a, risk: assessRisk(a, rotated.has(a.id)), revoked: revoked.has(a.id) })),
    [rotated, revoked]);

  const sel = accountsWithRisk.find(a => a.id === selected);

  const stats = useMemo(() => ({
    total: accountsWithRisk.filter(a => !a.revoked).length,
    healthy:  accountsWithRisk.filter(a => !a.revoked && a.risk.level === "healthy").length,
    warning:  accountsWithRisk.filter(a => !a.revoked && a.risk.level === "warning").length,
    critical: accountsWithRisk.filter(a => !a.revoked && a.risk.level === "critical").length,
    avgAge: Math.round(accountsWithRisk.filter(a => !a.revoked).reduce((s, a) => s + (rotated.has(a.id) ? 0 : a.keyAge), 0) / Math.max(1, accountsWithRisk.filter(a => !a.revoked).length)),
    leaked: accountsWithRisk.filter(a => !a.revoked && a.storedIn === "code-repo").length,
  }), [accountsWithRisk, rotated]);

  const rotate = (id: string) => setRotated(prev => new Set([...prev, id]));
  const revoke = (id: string) => setRevoked(prev => new Set([...prev, id]));

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Service Accounts & Machine Identity</h2>
      <p className="text-sm text-muted-foreground mb-6">Non-human identities outnumber humans 45:1. Track credential age, scope breadth, storage posture, and usage patterns. Rotate or revoke before they become incidents.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Identity Fleet</p>
            <span className="text-[10px] font-mono text-muted-foreground">{stats.total} active</span>
          </div>
          <div className="space-y-2">
            {accountsWithRisk.map(a => (
              <motion.button key={a.id} onClick={() => setSelected(a.id)} layout transition={spring}
                className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all ${a.revoked ? "border-[rgba(255,255,255,0.04)] opacity-40" : selected === a.id ? "border-secondary/30 bg-secondary/[0.03]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected === a.id ? "bg-secondary/15 text-secondary" : "bg-muted/30 text-muted-foreground"}`}>
                  <Bot size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium truncate ${selected === a.id ? "text-foreground" : "text-muted-foreground"}`}>{a.name}</p>
                    {a.revoked
                      ? <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-destructive/20 text-destructive">REVOKED</span>
                      : <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${STATUS_COLORS[a.risk.level]}`}>{a.risk.level} · {a.risk.score}</span>
                    }
                    {a.scopeBreadth === "wildcard" && !a.revoked && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-destructive/30 text-destructive">*:*</span>}
                    {a.storedIn === "code-repo" && !a.revoked && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-destructive/30 text-destructive">in-repo</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 font-mono">
                    {TYPE_LABELS[a.type]} · age {rotated.has(a.id) ? 0 : a.keyAge}d · last used {a.lastUsed} · {a.callsPerDay.toLocaleString()}/day
                  </p>
                </div>
                {!a.revoked && a.risk.level === "critical" && <AlertTriangle size={14} className="text-destructive shrink-0" />}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Fleet stats */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Posture Overview</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span className="text-foreground font-mono">{stats.total}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Healthy</span><span className="text-green-400 font-mono">{stats.healthy}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Warning</span><span className="text-yellow-400 font-mono">{stats.warning}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Critical</span><span className="text-destructive font-mono">{stats.critical}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">In code repo</span><span className={stats.leaked > 0 ? "text-destructive font-mono" : "text-green-400 font-mono"}>{stats.leaked}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg cred age</span><span className="text-foreground font-mono">{stats.avgAge}d</span></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {sel && !sel.revoked && (
              <motion.div key={sel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={spring}
                className="rounded-xl border border-secondary/10 bg-secondary/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-secondary" />
                  <span className="text-sm font-semibold text-foreground">{sel.name}</span>
                </div>

                {/* Risk reasons */}
                {sel.risk.reasons.length > 0 && (
                  <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Activity size={10} className={sel.risk.level === "critical" ? "text-destructive" : sel.risk.level === "warning" ? "text-yellow-400" : "text-green-400"} />
                      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Risk Findings</p>
                    </div>
                    <ul className="space-y-1">
                      {sel.risk.reasons.map((r, i) => (
                        <li key={i} className="text-[10px] text-muted-foreground/80 flex gap-1.5">
                          <span className="text-destructive/60 shrink-0">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground">type</span><span className="text-foreground">{TYPE_LABELS[sel.type]}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">owner</span><span className="text-foreground">{sel.owner}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">stored</span><span className={sel.storedIn === "code-repo" ? "text-destructive" : sel.storedIn === "env-var" ? "text-yellow-400" : "text-foreground"}>{STORE_LABEL[sel.storedIn]}</span></div>
                </div>

                {/* Permissions */}
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Granted Scopes</p>
                  <div className="flex flex-wrap gap-1">
                    {sel.permissions.map(p => (
                      <span key={p} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${p.includes("*") ? "text-destructive border-destructive/30 bg-destructive/[0.04]" : "text-foreground/80 border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)]"}`}>{p}</span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {!rotated.has(sel.id) && sel.keyAge > 30 && (
                    <motion.button onClick={() => rotate(sel.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-secondary/10 border border-secondary/20 py-2 text-[11px] font-semibold text-secondary hover:bg-secondary/15 transition-all">
                      <RotateCcw size={11} /> Rotate
                    </motion.button>
                  )}
                  <motion.button onClick={() => revoke(sel.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 border border-destructive/20 py-2 text-[11px] font-semibold text-destructive hover:bg-destructive/15 transition-all">
                    <Shield size={11} /> Revoke
                  </motion.button>
                </div>

                {rotated.has(sel.id) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                    <CheckCircle2 size={11} /> Credential rotated. Old key invalidated.
                  </div>
                )}
              </motion.div>
            )}
            {sel && sel.revoked && (
              <motion.div key="rev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-4">
                <div className="flex items-center gap-1.5 mb-1"><Shield size={11} className="text-destructive" /><p className="text-[9px] font-mono uppercase text-destructive font-semibold">Identity Revoked</p></div>
                <p className="text-[10px] text-muted-foreground">All credentials invalidated. Calls using this identity will be rejected at the auth gateway.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ServiceAccountsShowcase;
