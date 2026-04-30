import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Shield, AlertTriangle, CheckCircle2, Activity, TrendingDown, ArrowRight } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

// Each permission has: risk weight, whether the role NEEDS it, and how often
// it has been USED in the last 90 days. Real systems compute this from CloudTrail
// / Audit events to recommend "rightsizing".

interface Permission {
  id: string;
  label: string;
  risk: "low" | "medium" | "high" | "critical";
  needed: boolean;
  usage90d: number; // 0 = never used → strong revoke signal
  blastRadius: string[]; // resources affected if compromised
}

const ALL: Permission[] = [
  { id: "read-own",        label: "Read own data",        risk: "low",      needed: true,  usage90d: 412, blastRadius: ["self"] },
  { id: "write-own",       label: "Write own data",       risk: "low",      needed: true,  usage90d: 230, blastRadius: ["self"] },
  { id: "read-team",       label: "Read team data",       risk: "low",      needed: true,  usage90d: 88,  blastRadius: ["team"] },
  { id: "write-team",      label: "Write team data",      risk: "medium",   needed: false, usage90d: 6,   blastRadius: ["team"] },
  { id: "read-all",        label: "Read all org data",    risk: "medium",   needed: false, usage90d: 0,   blastRadius: ["org-readable"] },
  { id: "write-all",       label: "Write all org data",   risk: "high",     needed: false, usage90d: 0,   blastRadius: ["org-writable"] },
  { id: "delete-data",     label: "Delete records",       risk: "high",     needed: false, usage90d: 1,   blastRadius: ["mutable-state"] },
  { id: "manage-users",    label: "Manage users",         risk: "high",     needed: false, usage90d: 0,   blastRadius: ["identities"] },
  { id: "admin-settings",  label: "Admin settings",       risk: "critical", needed: false, usage90d: 0,   blastRadius: ["org-config"] },
  { id: "billing",         label: "Billing access",       risk: "critical", needed: false, usage90d: 0,   blastRadius: ["financial"] },
];

const RISK_WEIGHT = { low: 1, medium: 3, high: 7, critical: 15 } as const;
const RISK_DOT = { low: "bg-green-400", medium: "bg-yellow-400", high: "bg-orange-400", critical: "bg-destructive" };
const RISK_TEXT = { low: "text-green-400", medium: "text-yellow-400", high: "text-orange-400", critical: "text-destructive" };

const LeastPrivilegeShowcase = () => {
  const [granted, setGranted] = useState<Set<string>>(new Set(ALL.filter(p => p.needed).map(p => p.id)));

  const toggle = (id: string) =>
    setGranted(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const grantAll = () => setGranted(new Set(ALL.map(p => p.id)));
  const grantMin = () => setGranted(new Set(ALL.filter(p => p.needed).map(p => p.id)));
  // Recommendation engine: revoke everything granted but never used in 90d
  const applyRecommendation = () => setGranted(prev => {
    const next = new Set(prev);
    ALL.forEach(p => { if (next.has(p.id) && p.usage90d === 0) next.delete(p.id); });
    return next;
  });

  const grantedList = useMemo(() => ALL.filter(p => granted.has(p.id)), [granted]);
  const recommendations = useMemo(() => grantedList.filter(p => p.usage90d === 0), [grantedList]);
  const excess = useMemo(() => grantedList.filter(p => !p.needed).length, [grantedList]);
  const riskScore = useMemo(() => grantedList.reduce((s, p) => s + RISK_WEIGHT[p.risk], 0), [grantedList]);
  const maxRisk = ALL.reduce((s, p) => s + RISK_WEIGHT[p.risk], 0);
  const riskPct = Math.round((riskScore / maxRisk) * 100);
  const blastResources = useMemo(() => new Set(grantedList.flatMap(p => p.blastRadius)), [grantedList]);

  const blastLabel = riskPct <= 15 ? "Minimal" : riskPct <= 40 ? "Moderate" : riskPct <= 70 ? "Significant" : "Critical";
  const blastColor = riskPct <= 15 ? "text-green-400" : riskPct <= 40 ? "text-yellow-400" : riskPct <= 70 ? "text-orange-400" : "text-destructive";

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Least Privilege Simulator</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Real-world tools (AWS IAM Access Analyzer, GCP Recommender) compare <span className="text-foreground">granted</span> vs <span className="text-foreground">used</span>
        permissions over 90 days and recommend revocations. Permissions never used are the riskiest.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permissions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Permissions (granted vs used)</p>
            <div className="flex gap-2 text-[10px] font-mono">
              <button onClick={grantMin} className="text-primary hover:underline">least</button>
              <span className="text-muted-foreground/30">|</span>
              <button onClick={grantAll} className="text-destructive hover:underline">grant all</button>
              {recommendations.length > 0 && <>
                <span className="text-muted-foreground/30">|</span>
                <button onClick={applyRecommendation} className="text-yellow-400 hover:underline flex items-center gap-1"><TrendingDown size={9} /> apply rec</button>
              </>}
            </div>
          </div>
          <div className="space-y-1.5">
            {ALL.map(p => {
              const isGranted = granted.has(p.id);
              const recommend = isGranted && p.usage90d === 0;
              return (
                <motion.button key={p.id} onClick={() => toggle(p.id)} layout transition={spring}
                  className={`flex items-center gap-3 w-full rounded-xl border px-3 py-2.5 text-left transition-all ${recommend ? "border-yellow-500/25 bg-yellow-500/[0.03]" : isGranted ? "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]" : "border-[rgba(255,255,255,0.04)] opacity-50"}`}>
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isGranted ? RISK_DOT[p.risk] : "bg-muted-foreground/20"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium truncate ${isGranted ? "text-foreground" : "text-muted-foreground"}`}>{p.label}</span>
                      {p.needed && <span className="text-[8px] font-mono text-green-400/80 border border-green-500/20 rounded px-1">NEEDED</span>}
                      {recommend && <span className="text-[8px] font-mono text-yellow-400 border border-yellow-500/30 rounded px-1 flex items-center gap-1"><AlertTriangle size={8} />UNUSED 90d</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-mono">
                      <span className={RISK_TEXT[p.risk]}>{p.risk}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-muted-foreground/60 flex items-center gap-1"><Activity size={8} /> {p.usage90d} calls/90d</span>
                    </div>
                  </div>
                  <div className={`h-4 w-7 rounded-full transition-colors relative ${isGranted ? "bg-primary/30" : "bg-muted/30"}`}>
                    <motion.div className={`absolute top-0.5 h-3 w-3 rounded-full ${isGranted ? "bg-primary" : "bg-muted-foreground/40"}`}
                      animate={{ left: isGranted ? 14 : 2 }} transition={spring} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Risk panel */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Blast Radius</p>
            <div className="flex justify-center mb-3">
              <div className="relative h-28 w-28">
                <svg viewBox="0 0 112 112" className="w-full h-full">
                  <circle cx="56" cy="56" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                  <motion.circle cx="56" cy="56" r="50" fill="none" stroke={riskPct <= 15 ? "hsl(142,71%,45%)" : riskPct <= 40 ? "hsl(48,96%,53%)" : riskPct <= 70 ? "hsl(25,95%,53%)" : "hsl(349,100%,62%)"}
                    strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50}`} animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - riskPct / 100) }}
                    transform="rotate(-90 56 56)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span className={`text-2xl font-display font-bold ${blastColor}`} key={riskPct} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={spring}>{riskPct}%</motion.span>
                  <span className="text-[9px] font-mono text-muted-foreground">exposure</span>
                </div>
              </div>
            </div>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-bold ${blastColor}`}>{blastLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Granted</span><span className="text-foreground">{granted.size}/{ALL.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Excess</span><span className={excess > 0 ? "text-orange-400" : "text-green-400"}>{excess}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unused (90d)</span><span className={recommendations.length > 0 ? "text-yellow-400" : "text-green-400"}>{recommendations.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk score</span><span className="text-foreground">{riskScore}/{maxRisk}</span></div>
            </div>
          </div>

          {/* Affected resources */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">If compromised, attacker reaches:</p>
            <div className="flex flex-wrap gap-1">
              {[...blastResources].map(r => (
                <span key={r} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)] text-muted-foreground bg-[rgba(0,0,0,0.2)]">{r}</span>
              ))}
              {blastResources.size === 0 && <span className="text-[10px] text-muted-foreground/50">nothing — no permissions</span>}
            </div>
          </div>

          {recommendations.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle size={12} className="text-yellow-400" /><span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 font-semibold">Recommendation</span></div>
              <p className="text-[11px] text-muted-foreground mb-2">Revoke <span className="text-foreground">{recommendations.length}</span> unused permission{recommendations.length > 1 ? "s" : ""} — these have not been called in 90 days but still grow your attack surface.</p>
              <button onClick={applyRecommendation} className="w-full flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 py-1.5 text-[10px] font-semibold text-yellow-400 hover:bg-yellow-500/5">
                <ArrowRight size={11} /> Apply recommendation
              </button>
            </motion.div>
          ) : excess === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={12} className="text-green-400" /><span className="text-[10px] font-mono uppercase text-green-400 font-semibold">Right-sized</span></div>
              <p className="text-[11px] text-muted-foreground">Granted == needed && all in active use. Blast radius minimal.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-1"><AlertTriangle size={12} className="text-orange-400" /><span className="text-[10px] font-mono uppercase text-orange-400 font-semibold">Excess access</span></div>
              <p className="text-[11px] text-muted-foreground">{excess} non-essential permission{excess > 1 ? "s" : ""} granted. Used currently — but consider JIT instead of standing access.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeastPrivilegeShowcase;
