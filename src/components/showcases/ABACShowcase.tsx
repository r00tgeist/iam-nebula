import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, CheckCircle2, XCircle, Shield, MapPin, Clock, Laptop, User } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Attribute { id: string; label: string; icon: React.ReactNode; options: { value: string; riskWeight: number }[] }

const ATTRIBUTES: Attribute[] = [
  { id: "role", label: "User Role", icon: <User size={14} />, options: [{ value: "Intern", riskWeight: 3 }, { value: "Employee", riskWeight: 1 }, { value: "Manager", riskWeight: 0 }, { value: "Admin", riskWeight: 0 }] },
  { id: "location", label: "Location", icon: <MapPin size={14} />, options: [{ value: "Office (HQ)", riskWeight: 0 }, { value: "VPN (Home)", riskWeight: 1 }, { value: "Public WiFi", riskWeight: 3 }, { value: "Foreign IP", riskWeight: 5 }] },
  { id: "time", label: "Access Time", icon: <Clock size={14} />, options: [{ value: "Business Hours", riskWeight: 0 }, { value: "After Hours", riskWeight: 2 }, { value: "Weekend", riskWeight: 3 }, { value: "Holiday", riskWeight: 4 }] },
  { id: "device", label: "Device Trust", icon: <Laptop size={14} />, options: [{ value: "Managed (MDM)", riskWeight: 0 }, { value: "BYOD (Enrolled)", riskWeight: 1 }, { value: "Unknown Device", riskWeight: 4 }, { value: "Jailbroken", riskWeight: 6 }] },
];

const RESOURCES = [
  { id: "public-docs", label: "Public Docs", threshold: 12 },
  { id: "internal-wiki", label: "Internal Wiki", threshold: 8 },
  { id: "customer-data", label: "Customer PII", threshold: 4 },
  { id: "prod-infra", label: "Production Infra", threshold: 2 },
];

const ABACShowcase = () => {
  const [selections, setSelections] = useState<Record<string, number>>({ role: 1, location: 0, time: 0, device: 0 });

  const totalRisk = useMemo(() => ATTRIBUTES.reduce((sum, attr) => sum + attr.options[selections[attr.id]].riskWeight, 0), [selections]);

  const decisions = useMemo(() => RESOURCES.map(r => ({ ...r, allowed: totalRisk <= r.threshold })), [totalRisk]);

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Attribute-Based Access Control</h2>
      <p className="text-sm text-muted-foreground mb-8">Adjust context attributes. Access decisions are computed dynamically — no static roles, just policy evaluation against real-time context.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Context Attributes</p>
          {ATTRIBUTES.map(attr => (
            <div key={attr.id} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-secondary">{attr.icon}</div>
                <span className="text-xs font-semibold text-foreground">{attr.label}</span>
                <span className="text-[9px] font-mono text-muted-foreground ml-auto">risk: +{attr.options[selections[attr.id]].riskWeight}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {attr.options.map((opt, i) => {
                  const selected = selections[attr.id] === i;
                  return (
                    <button key={opt.value} onClick={() => setSelections(prev => ({ ...prev, [attr.id]: i }))}
                      className={`relative rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${selected ? "border-secondary/40 bg-secondary/[0.06] text-foreground" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/60 hover:border-[rgba(255,255,255,0.1)]"}`}>
                      {selected && <motion.div layoutId={`abac-${attr.id}`} className="absolute inset-0 rounded-lg bg-secondary/[0.06] border border-secondary/30" transition={spring} />}
                      <span className="relative z-10">{opt.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Risk score */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Composite Risk Score</p>
            <div className="flex items-center justify-center mb-3">
              <motion.span className={`text-3xl font-display font-bold ${totalRisk <= 2 ? "text-green-400" : totalRisk <= 5 ? "text-yellow-400" : totalRisk <= 10 ? "text-orange-400" : "text-destructive"}`}
                key={totalRisk} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={spring}>{totalRisk}</motion.span>
              <span className="text-sm text-muted-foreground ml-2">/ 20</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
              <motion.div className={`h-full rounded-full ${totalRisk <= 2 ? "bg-green-400" : totalRisk <= 5 ? "bg-yellow-400" : totalRisk <= 10 ? "bg-orange-400" : "bg-destructive"}`}
                animate={{ width: `${(totalRisk / 20) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          {/* Resource decisions */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Access Decisions</p>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {decisions.map(d => (
                  <motion.div key={d.id} layout transition={spring}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${d.allowed ? "border-green-500/15 bg-green-500/[0.02]" : "border-destructive/15 bg-destructive/[0.02]"}`}>
                    {d.allowed ? <CheckCircle2 size={14} className="text-green-400 shrink-0" /> : <XCircle size={14} className="text-destructive shrink-0" />}
                    <span className={`text-xs font-medium ${d.allowed ? "text-foreground" : "text-muted-foreground/60"}`}>{d.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/40 ml-auto">max:{d.threshold}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="rounded-xl border border-secondary/10 bg-secondary/[0.02] p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-secondary font-semibold mb-1">ABAC vs RBAC</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              RBAC checks <span className="text-foreground">who you are</span>. ABAC checks <span className="text-foreground">who + where + when + how</span>. Same user, different context = different access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABACShowcase;
