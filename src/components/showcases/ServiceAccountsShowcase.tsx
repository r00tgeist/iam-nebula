import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Key, Clock, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Shield } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface ServiceAccount { id: string; name: string; type: "api-key" | "oauth-client" | "spiffe"; owner: string; lastUsed: string; keyAge: number; permissions: string[]; status: "healthy" | "warning" | "critical" }

const ACCOUNTS: ServiceAccount[] = [
  { id: "sa1", name: "payment-service", type: "oauth-client", owner: "Platform Team", lastUsed: "2m ago", keyAge: 12, permissions: ["payments:write", "ledger:read"], status: "healthy" },
  { id: "sa2", name: "ci-cd-pipeline", type: "api-key", owner: "DevOps", lastUsed: "5m ago", keyAge: 89, permissions: ["deploy:*", "registry:push", "secrets:read"], status: "warning" },
  { id: "sa3", name: "monitoring-agent", type: "spiffe", owner: "SRE", lastUsed: "30s ago", keyAge: 1, permissions: ["metrics:read", "logs:read"], status: "healthy" },
  { id: "sa4", name: "legacy-etl-job", type: "api-key", owner: "Unknown", lastUsed: "47 days ago", keyAge: 340, permissions: ["db:read", "db:write", "admin:*"], status: "critical" },
  { id: "sa5", name: "slack-bot", type: "oauth-client", owner: "Engineering", lastUsed: "1h ago", keyAge: 45, permissions: ["messages:send", "channels:read"], status: "healthy" },
];

const TYPE_LABELS = { "api-key": "API Key", "oauth-client": "OAuth Client", "spiffe": "SPIFFE/mTLS" };
const STATUS_COLORS = { healthy: "text-green-400 border-green-500/20 bg-green-500/10", warning: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10", critical: "text-destructive border-destructive/20 bg-destructive/10" };

const ServiceAccountsShowcase = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [rotated, setRotated] = useState<Set<string>>(new Set());

  const selectedAccount = ACCOUNTS.find(a => a.id === selected);

  const stats = useMemo(() => ({
    total: ACCOUNTS.length,
    healthy: ACCOUNTS.filter(a => a.status === "healthy").length,
    warning: ACCOUNTS.filter(a => a.status === "warning").length,
    critical: ACCOUNTS.filter(a => a.status === "critical").length,
    avgAge: Math.round(ACCOUNTS.reduce((s, a) => s + a.keyAge, 0) / ACCOUNTS.length),
  }), []);

  const rotateKey = (id: string) => setRotated(prev => new Set([...prev, id]));

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Service Accounts & Machine Identity</h2>
      <p className="text-sm text-muted-foreground mb-8">Manage non-human identities. Monitor key age, usage patterns, and permission scope. Rotate credentials before they become a risk.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Machine Identities</p>
            <span className="text-[10px] font-mono text-muted-foreground">{ACCOUNTS.length} accounts</span>
          </div>
          <div className="space-y-2">
            {ACCOUNTS.map(a => {
              const isRotated = rotated.has(a.id);
              const effectiveStatus = isRotated ? "healthy" : a.status;
              const effectiveAge = isRotated ? 0 : a.keyAge;
              return (
                <motion.button key={a.id} onClick={() => setSelected(a.id)} layout transition={spring}
                  className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all ${selected === a.id ? "border-secondary/30 bg-secondary/[0.03]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected === a.id ? "bg-secondary/15 text-secondary" : "bg-muted/30 text-muted-foreground"}`}>
                    <Bot size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${selected === a.id ? "text-foreground" : "text-muted-foreground"}`}>{a.name}</p>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${STATUS_COLORS[effectiveStatus]}`}>{effectiveStatus}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 font-mono">{TYPE_LABELS[a.type]} · key age: {effectiveAge}d · last used: {a.lastUsed}</p>
                  </div>
                  {effectiveAge > 90 && <AlertTriangle size={14} className="text-destructive shrink-0" />}
                  {effectiveAge > 60 && effectiveAge <= 90 && <AlertTriangle size={14} className="text-yellow-400 shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Fleet Overview</p>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="text-foreground font-mono">{stats.total}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Healthy</span><span className="text-green-400 font-mono">{stats.healthy}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Warning</span><span className="text-yellow-400 font-mono">{stats.warning}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Critical</span><span className="text-destructive font-mono">{stats.critical}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg key age</span><span className="text-foreground font-mono">{stats.avgAge}d</span></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedAccount && (
              <motion.div key={selectedAccount.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={spring}
                className="rounded-xl border border-secondary/10 bg-secondary/[0.02] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={14} className="text-secondary" />
                  <span className="text-sm font-semibold text-foreground">{selectedAccount.name}</span>
                </div>
                <div className="space-y-2 text-[11px] font-mono mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground">{TYPE_LABELS[selectedAccount.type]}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{selectedAccount.owner}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Key age</span><span className={`${(rotated.has(selectedAccount.id) ? 0 : selectedAccount.keyAge) > 90 ? "text-destructive" : "text-foreground"}`}>{rotated.has(selectedAccount.id) ? "0d (just rotated)" : `${selectedAccount.keyAge}d`}</span></div>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedAccount.permissions.map(p => (
                    <span key={p} className="text-[9px] font-mono px-2 py-1 rounded border border-[rgba(255,255,255,0.06)] text-muted-foreground bg-[rgba(0,0,0,0.2)]">{p}</span>
                  ))}
                </div>
                {!rotated.has(selectedAccount.id) && selectedAccount.keyAge > 30 && (
                  <motion.button onClick={() => rotateKey(selectedAccount.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary/10 border border-secondary/20 py-2 text-xs font-semibold text-secondary hover:bg-secondary/15 transition-all"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <RotateCcw size={12} /> Rotate Credential
                  </motion.button>
                )}
                {rotated.has(selectedAccount.id) && (
                  <div className="flex items-center gap-2 text-[10px] text-green-400">
                    <CheckCircle2 size={12} /> Credential rotated. Old key invalidated.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ServiceAccountsShowcase;
