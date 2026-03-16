import { useState } from "react";
import { motion } from "framer-motion";
import { Minimize2, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Permission { id: string; label: string; risk: "low" | "medium" | "high" | "critical"; needed: boolean }

const ALL_PERMISSIONS: Permission[] = [
  { id: "read-own", label: "Read own data", risk: "low", needed: true },
  { id: "write-own", label: "Write own data", risk: "low", needed: true },
  { id: "read-team", label: "Read team data", risk: "low", needed: true },
  { id: "write-team", label: "Write team data", risk: "medium", needed: false },
  { id: "read-all", label: "Read all org data", risk: "medium", needed: false },
  { id: "write-all", label: "Write all org data", risk: "high", needed: false },
  { id: "delete-data", label: "Delete records", risk: "high", needed: false },
  { id: "manage-users", label: "Manage users", risk: "high", needed: false },
  { id: "admin-settings", label: "Admin settings", risk: "critical", needed: false },
  { id: "billing", label: "Billing access", risk: "critical", needed: false },
];

const RISK_COLORS = { low: "text-green-400 bg-green-500/10 border-green-500/20", medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", high: "text-orange-400 bg-orange-500/10 border-orange-500/20", critical: "text-destructive bg-destructive/10 border-destructive/20" };
const RISK_DOT = { low: "bg-green-400", medium: "bg-yellow-400", high: "bg-orange-400", critical: "bg-destructive" };

const LeastPrivilegeShowcase = () => {
  const [granted, setGranted] = useState<Set<string>>(new Set(ALL_PERMISSIONS.filter(p => p.needed).map(p => p.id)));

  const toggle = (id: string) => {
    setGranted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const grantAll = () => setGranted(new Set(ALL_PERMISSIONS.map(p => p.id)));
  const grantMinimal = () => setGranted(new Set(ALL_PERMISSIONS.filter(p => p.needed).map(p => p.id)));

  const grantedPerms = ALL_PERMISSIONS.filter(p => granted.has(p.id));
  const excessCount = grantedPerms.filter(p => !p.needed).length;
  const riskScore = grantedPerms.reduce((s, p) => s + ({ low: 1, medium: 3, high: 7, critical: 15 }[p.risk]), 0);
  const maxRisk = ALL_PERMISSIONS.reduce((s, p) => s + ({ low: 1, medium: 3, high: 7, critical: 15 }[p.risk]), 0);
  const riskPct = Math.round((riskScore / maxRisk) * 100);
  const blastRadius = riskPct <= 15 ? "Minimal" : riskPct <= 40 ? "Moderate" : riskPct <= 70 ? "Significant" : "Critical";
  const blastColor = riskPct <= 15 ? "text-green-400" : riskPct <= 40 ? "text-yellow-400" : riskPct <= 70 ? "text-orange-400" : "text-destructive";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Least Privilege Simulator</h2>
      <p className="text-sm text-muted-foreground mb-8">Toggle permissions on/off. Green = required for the role. Watch how the blast radius grows with excess access.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permissions list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Permissions</p>
            <div className="flex gap-2">
              <button onClick={grantMinimal} className="text-[10px] font-mono text-primary hover:underline">Least Privilege</button>
              <span className="text-muted-foreground/30">|</span>
              <button onClick={grantAll} className="text-[10px] font-mono text-destructive hover:underline">Grant All</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALL_PERMISSIONS.map(p => {
              const isGranted = granted.has(p.id);
              return (
                <motion.button key={p.id} onClick={() => toggle(p.id)} layout transition={spring}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${isGranted ? "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]" : "border-[rgba(255,255,255,0.04)] bg-transparent opacity-40"}`}>
                  <div className={`h-3 w-3 rounded-full shrink-0 transition-all ${isGranted ? RISK_DOT[p.risk] : "bg-muted-foreground/20"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium truncate ${isGranted ? "text-foreground" : "text-muted-foreground"}`}>{p.label}</span>
                      {p.needed && <span className="text-[8px] font-mono text-green-400/70 border border-green-500/20 rounded px-1">NEEDED</span>}
                    </div>
                    <span className={`text-[9px] font-mono uppercase ${RISK_COLORS[p.risk].split(" ")[0]}`}>{p.risk} risk</span>
                  </div>
                  <div className={`h-5 w-9 rounded-full transition-colors relative ${isGranted ? "bg-primary/30" : "bg-muted/30"}`}>
                    <motion.div className={`absolute top-0.5 h-4 w-4 rounded-full ${isGranted ? "bg-primary" : "bg-muted-foreground/40"}`}
                      animate={{ left: isGranted ? 18 : 2 }} transition={spring} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Risk panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-4">Blast Radius</p>
            {/* Visual circle */}
            <div className="flex justify-center mb-4">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 128 128" className="w-full h-full">
                  <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                  <motion.circle cx="64" cy="64" r="58" fill="none" stroke={riskPct <= 15 ? "hsl(142,71%,45%)" : riskPct <= 40 ? "hsl(48,96%,53%)" : riskPct <= 70 ? "hsl(25,95%,53%)" : "hsl(349,100%,62%)"}
                    strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 58}`} strokeDashoffset={`${2 * Math.PI * 58 * (1 - riskPct / 100)}`}
                    transform="rotate(-90 64 64)" initial={false} animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - riskPct / 100) }} transition={{ duration: 0.5 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span className={`text-2xl font-display font-bold ${blastColor}`} key={riskPct} initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={spring}>{riskPct}%</motion.span>
                  <span className="text-[9px] text-muted-foreground font-mono">exposure</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-bold ${blastColor}`}>{blastRadius}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Granted</span><span className="text-foreground font-mono">{granted.size}/{ALL_PERMISSIONS.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Excess</span><span className={excessCount > 0 ? "text-orange-400 font-mono" : "text-green-400 font-mono"}>{excessCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk Score</span><span className="text-foreground font-mono">{riskScore}/{maxRisk}</span></div>
            </div>
          </div>

          {excessCount > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle size={12} className="text-orange-400" /><span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-semibold">Excess Access</span></div>
              <p className="text-[11px] text-muted-foreground">This user has {excessCount} permission{excessCount > 1 ? "s" : ""} beyond what's needed. Each unnecessary permission increases the blast radius if the account is compromised.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2"><CheckCircle2 size={12} className="text-green-400" /><span className="text-[10px] font-mono uppercase tracking-wider text-green-400 font-semibold">Least Privilege</span></div>
              <p className="text-[11px] text-muted-foreground">This user has only the permissions needed for their role. Blast radius is minimized.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeastPrivilegeShowcase;
