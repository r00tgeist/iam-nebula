import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, MapPin, Clock, Laptop, User, Database, ShieldAlert, Code2 } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

// Subject, Resource, Environment — the canonical XACML triad
interface Attr { id: string; label: string; icon: React.ReactNode; options: { value: string; key: string; risk: number }[] }

const SUBJECT: Attr[] = [
  { id: "role", label: "Role", icon: <User size={13} />, options: [
    { value: "Intern",   key: "intern",   risk: 3 },
    { value: "Employee", key: "employee", risk: 1 },
    { value: "Manager",  key: "manager",  risk: 0 },
    { value: "Admin",    key: "admin",    risk: 0 },
  ]},
  { id: "clearance", label: "Clearance", icon: <ShieldAlert size={13} />, options: [
    { value: "Public",       key: "public",       risk: 2 },
    { value: "Internal",     key: "internal",     risk: 1 },
    { value: "Confidential", key: "confidential", risk: 0 },
    { value: "Restricted",   key: "restricted",   risk: 0 },
  ]},
];

const RESOURCE: Attr[] = [
  { id: "sensitivity", label: "Sensitivity", icon: <Database size={13} />, options: [
    { value: "Public",       key: "public",       risk: 0 },
    { value: "Internal",     key: "internal",     risk: 1 },
    { value: "Confidential", key: "confidential", risk: 3 },
    { value: "Restricted",   key: "restricted",   risk: 5 },
  ]},
];

const ENV: Attr[] = [
  { id: "location", label: "Network", icon: <MapPin size={13} />, options: [
    { value: "Office (HQ)",  key: "office",   risk: 0 },
    { value: "VPN (Home)",   key: "vpn",      risk: 1 },
    { value: "Public WiFi",  key: "public",   risk: 3 },
    { value: "Foreign IP",   key: "foreign",  risk: 5 },
  ]},
  { id: "time", label: "Time", icon: <Clock size={13} />, options: [
    { value: "Business",  key: "business", risk: 0 },
    { value: "After-hrs", key: "after",    risk: 2 },
    { value: "Weekend",   key: "weekend",  risk: 3 },
    { value: "Holiday",   key: "holiday",  risk: 4 },
  ]},
  { id: "device", label: "Device", icon: <Laptop size={13} />, options: [
    { value: "Managed (MDM)",   key: "managed",    risk: 0 },
    { value: "BYOD (Enrolled)", key: "byod",       risk: 1 },
    { value: "Unknown",         key: "unknown",    risk: 4 },
    { value: "Jailbroken",      key: "jailbroken", risk: 6 },
  ]},
];

const ALL = [...SUBJECT, ...RESOURCE, ...ENV];

interface PolicyRule { id: string; name: string; effect: "permit" | "deny"; predicate: (ctx: Ctx) => boolean; explain: string }
type Ctx = Record<string, string>;

const RULES: PolicyRule[] = [
  { id: "p1", name: "BlockJailbroken", effect: "deny",
    predicate: c => c.device === "jailbroken",
    explain: "device.posture == jailbroken → DENY" },
  { id: "p2", name: "BlockForeignAfterHours", effect: "deny",
    predicate: c => c.location === "foreign" && (c.time === "after" || c.time === "weekend" || c.time === "holiday"),
    explain: "env.location == foreign AND env.time != business → DENY" },
  { id: "p3", name: "RestrictedNeedsClearance", effect: "deny",
    predicate: c => c.sensitivity === "restricted" && !["confidential", "restricted"].includes(c.clearance),
    explain: "resource.sensitivity == restricted AND subject.clearance NOT IN {confidential, restricted} → DENY" },
  { id: "p4", name: "ConfidentialNeedsManagedDevice", effect: "deny",
    predicate: c => (c.sensitivity === "confidential" || c.sensitivity === "restricted") && c.device !== "managed",
    explain: "resource.sensitivity >= confidential AND device != managed → DENY" },
  { id: "p5", name: "InternsLimited", effect: "deny",
    predicate: c => c.role === "intern" && (c.sensitivity === "confidential" || c.sensitivity === "restricted"),
    explain: "subject.role == intern AND resource.sensitivity >= confidential → DENY" },
  { id: "p6", name: "AdminAlways", effect: "permit",
    predicate: c => c.role === "admin" && c.device === "managed" && c.location !== "foreign",
    explain: "subject.role == admin AND device == managed AND location != foreign → PERMIT" },
  { id: "p7", name: "DefaultEmployee", effect: "permit",
    predicate: c => ["manager", "employee"].includes(c.role) && c.sensitivity !== "restricted",
    explain: "subject.role IN {manager,employee} AND resource.sensitivity != restricted → PERMIT" },
];

const ABACShowcase = () => {
  const [sel, setSel] = useState<Record<string, number>>(
    Object.fromEntries(ALL.map(a => [a.id, 1]))
  );

  const ctx: Ctx = useMemo(() =>
    Object.fromEntries(ALL.map(a => [a.id, a.options[sel[a.id]].key])), [sel]);

  const risk = useMemo(() => ALL.reduce((s, a) => s + a.options[sel[a.id]].risk, 0), [sel]);

  // Deny-overrides combining (XACML default)
  const evaluation = useMemo(() => {
    const fired = RULES.filter(r => r.predicate(ctx));
    const denies = fired.filter(r => r.effect === "deny");
    const permits = fired.filter(r => r.effect === "permit");
    const decision: "Permit" | "Deny" | "NotApplicable" =
      denies.length > 0 ? "Deny" : permits.length > 0 ? "Permit" : "NotApplicable";
    return { fired, denies, permits, decision };
  }, [ctx]);

  const renderAttrGroup = (group: Attr[], label: string, color: string) => (
    <div>
      <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color }}>{label}</p>
      <div className="space-y-2">
        {group.map(attr => (
          <div key={attr.id} className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] p-3">
            <div className="flex items-center gap-2 mb-2">
              <div style={{ color }}>{attr.icon}</div>
              <span className="text-[11px] font-semibold text-foreground">{attr.label}</span>
              <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">{attr.id}=<span className="text-foreground/80">{attr.options[sel[attr.id]].key}</span></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {attr.options.map((opt, i) => {
                const selected = sel[attr.id] === i;
                return (
                  <button key={opt.key} onClick={() => setSel(p => ({ ...p, [attr.id]: i }))}
                    className={`relative rounded-md border px-2 py-1.5 text-[10px] font-medium transition-all ${selected ? "border-secondary/40 text-foreground" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/60 hover:border-[rgba(255,255,255,0.1)]"}`}>
                    {selected && <motion.div layoutId={`abac-${attr.id}`} className="absolute inset-0 rounded-md bg-secondary/[0.06] border border-secondary/30" transition={spring} />}
                    <span className="relative z-10">{opt.value}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Attribute-Based Access Control</h2>
      <p className="text-sm text-muted-foreground mb-8">A real PDP evaluates Subject + Resource + Environment attributes against a policy set. Deny-overrides combining: any matching deny wins.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {renderAttrGroup(SUBJECT,  "Subject Attributes",     "hsl(187,100%,60%)")}
          {renderAttrGroup(RESOURCE, "Resource Attributes",    "hsl(263,87%,72%)")}
          {renderAttrGroup(ENV,      "Environment Attributes", "hsl(28,90%,65%)")}
        </div>

        <div className="space-y-4">
          {/* Decision */}
          <div className={`rounded-xl border p-5 text-center ${evaluation.decision === "Permit" ? "border-green-500/20 bg-green-500/[0.03]" : evaluation.decision === "Deny" ? "border-destructive/20 bg-destructive/[0.03]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)]"}`}>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">PDP Decision</p>
            <motion.div key={evaluation.decision} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
              className={`flex items-center justify-center gap-2 ${evaluation.decision === "Permit" ? "text-green-400" : evaluation.decision === "Deny" ? "text-destructive" : "text-muted-foreground"}`}>
              {evaluation.decision === "Permit" ? <CheckCircle2 size={20} /> : evaluation.decision === "Deny" ? <XCircle size={20} /> : <span className="h-5 w-5 inline-block rounded-full border border-current opacity-40" />}
              <span className="text-2xl font-display font-bold">{evaluation.decision}</span>
            </motion.div>
            <p className="text-[10px] font-mono text-muted-foreground/60 mt-2">risk score: <span className={risk > 8 ? "text-destructive" : risk > 4 ? "text-yellow-400" : "text-green-400"}>{risk}</span> · {evaluation.fired.length} rule{evaluation.fired.length !== 1 ? "s" : ""} matched</p>
          </div>

          {/* Decision trace */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4">
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Policy Trace</p>
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {evaluation.fired.length === 0 && (
                  <motion.p layout className="text-[10px] text-muted-foreground/50 italic">No rule matched → NotApplicable (default-deny in production).</motion.p>
                )}
                {evaluation.fired.map(r => (
                  <motion.div key={r.id} layout transition={spring}
                    className={`rounded-md border px-2.5 py-1.5 text-[10px] font-mono ${r.effect === "deny" ? "border-destructive/20 bg-destructive/[0.04]" : "border-green-500/20 bg-green-500/[0.04]"}`}>
                    <div className="flex items-center justify-between">
                      <span className={r.effect === "deny" ? "text-destructive" : "text-green-400"}>{r.effect.toUpperCase()}</span>
                      <span className="text-foreground/80">{r.name}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5 break-words">{r.explain}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* PDP request payload */}
          <div className="rounded-xl border border-secondary/10 bg-secondary/[0.02] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Code2 size={11} className="text-secondary" />
              <p className="text-[9px] font-mono uppercase tracking-wider text-secondary font-semibold">PDP Request (JSON)</p>
            </div>
            <pre className="text-[9px] font-mono text-foreground/70 leading-relaxed overflow-hidden">
{`{
  "subject":  { "role":"${ctx.role}", "clearance":"${ctx.clearance}" },
  "resource": { "sensitivity":"${ctx.sensitivity}" },
  "env":      { "loc":"${ctx.location}",
                "time":"${ctx.time}",
                "device":"${ctx.device}" },
  "action":   "read"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABACShowcase;
