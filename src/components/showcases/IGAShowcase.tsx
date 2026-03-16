import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, UserPlus, ArrowRightLeft, UserMinus, CheckCircle2, XCircle, Shield, RotateCcw, ArrowRight, Zap } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type LifecycleEvent = "joiner" | "mover" | "leaver";
type EventStep = { label: string; desc: string };

const LIFECYCLE: Record<LifecycleEvent, { label: string; icon: React.ReactNode; color: string; steps: EventStep[] }> = {
  joiner: {
    label: "Joiner",
    icon: <UserPlus size={18} />,
    color: "text-green-400",
    steps: [
      { label: "HR Record Created", desc: "New employee added to HR system → triggers provisioning" },
      { label: "Identity Created", desc: "Active Directory account + email provisioned automatically" },
      { label: "Base Roles Assigned", desc: "Department-based birthright roles applied from policy" },
      { label: "App Access Provisioned", desc: "SSO-connected apps receive SCIM provisioning events" },
      { label: "Welcome Workflow", desc: "User receives credentials + security awareness training invite" },
    ],
  },
  mover: {
    label: "Mover",
    icon: <ArrowRightLeft size={18} />,
    color: "text-yellow-400",
    steps: [
      { label: "Role Change Detected", desc: "HR system updates department/title → triggers re-evaluation" },
      { label: "Old Roles Reviewed", desc: "IGA flags roles from previous department for review" },
      { label: "Stale Access Removed", desc: "Previous department roles automatically revoked" },
      { label: "New Roles Assigned", desc: "New department birthright roles applied from policy" },
      { label: "Certification Triggered", desc: "New manager receives access certification request" },
    ],
  },
  leaver: {
    label: "Leaver",
    icon: <UserMinus size={18} />,
    color: "text-destructive",
    steps: [
      { label: "Termination Event", desc: "HR system marks employee as terminated → triggers deprovisioning" },
      { label: "Sessions Revoked", desc: "All active sessions and tokens immediately invalidated" },
      { label: "App Access Revoked", desc: "SCIM deprovisioning sent to all connected applications" },
      { label: "Account Disabled", desc: "AD account disabled, moved to 'Former Employees' OU" },
      { label: "Data Retention Applied", desc: "Mailbox and files preserved per retention policy (90 days)" },
    ],
  },
};

const IGAShowcase = () => {
  const [event, setEvent] = useState<LifecycleEvent>("joiner");
  const [running, setRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [done, setDone] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const lifecycle = LIFECYCLE[event];

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    setCompletedSteps(0);
    setDone(false);

    lifecycle.steps.forEach((_, i) => {
      timeoutsRef.current.push(setTimeout(() => setCompletedSteps(i + 1), 600 + i * 800));
    });
    timeoutsRef.current.push(setTimeout(() => { setDone(true); setRunning(false); }, 600 + lifecycle.steps.length * 800 + 400));
  }, [running, lifecycle]);

  const reset = () => {
    timeoutsRef.current.forEach(clearTimeout);
    setRunning(false);
    setDone(false);
    setCompletedSteps(0);
  };

  // Access review section
  const [reviewItems] = useState([
    { id: "r1", user: "Jordan L.", access: "Admin panel", recommendation: "revoke", reason: "No admin activity in 90 days" },
    { id: "r2", user: "Maria P.", access: "Customer DB", recommendation: "certify", reason: "Active daily usage" },
    { id: "r3", user: "Sam W.", access: "Billing access", recommendation: "revoke", reason: "Moved from Finance to Engineering" },
  ]);
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, "certify" | "revoke">>({});

  const decide = (id: string, decision: "certify" | "revoke") => {
    setReviewDecisions(prev => ({ ...prev, [id]: decision }));
  };

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Identity Governance & Administration</h2>
      <p className="text-sm text-muted-foreground mb-8">Manage the full identity lifecycle — Joiner/Mover/Leaver — plus periodic access certifications.</p>

      {/* Event selector */}
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Lifecycle Event</p>
        <div className="flex gap-3">
          {(Object.keys(LIFECYCLE) as LifecycleEvent[]).map(e => {
            const lc = LIFECYCLE[e];
            return (
              <button key={e} onClick={() => { if (!running) { setEvent(e); reset(); } }} disabled={running}
                className={`relative flex items-center gap-2 rounded-xl border px-4 py-3 transition-all ${event === e ? "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.02)]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"} ${running ? "opacity-40 cursor-not-allowed" : ""}`}>
                {event === e && <motion.div layoutId="iga-event" className="absolute inset-0 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)]" transition={spring} />}
                <div className={`relative z-10 ${event === e ? lc.color : "text-muted-foreground"}`}>{lc.icon}</div>
                <span className={`relative z-10 text-sm font-medium ${event === e ? "text-foreground" : "text-muted-foreground"}`}>{lc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lifecycle steps */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            {lifecycle.label} Workflow
          </p>
          <div className="space-y-2">
            {lifecycle.steps.map((s, i) => {
              const completed = i < completedSteps;
              const current = i === completedSteps - 1 && running;
              return (
                <motion.div key={s.label} layout transition={spring}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    completed ? "border-green-500/15 bg-green-500/[0.02]" :
                    current ? "border-primary/20 bg-primary/[0.02]" :
                    "border-[rgba(255,255,255,0.04)]"
                  }`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    completed ? "bg-green-500/15 text-green-400" : "bg-muted/20 text-muted-foreground/30"
                  }`}>
                    {completed ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-mono">{i + 1}</span>}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${completed ? "text-foreground" : "text-muted-foreground/40"}`}>{s.label}</p>
                    <p className="text-[10px] text-muted-foreground/50">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-center mt-6">
            {!running && !done && (
              <motion.button onClick={start} className={`group flex items-center gap-3 rounded-xl border px-6 py-3 text-sm font-semibold transition-all ${
                event === "leaver" ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/15" : "bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/15"
              }`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <Zap size={14} /> Run {lifecycle.label} Workflow <ArrowRight size={14} />
              </motion.button>
            )}
            {done && (
              <motion.button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-all"
                whileHover={{ scale: 1.02 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <RotateCcw size={14} /> Reset
              </motion.button>
            )}
          </div>
        </div>

        {/* Access certification */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Access Certification Campaign</p>
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            <p className="text-[11px] text-muted-foreground mb-4">As a manager, review whether these access grants should continue or be revoked.</p>
            <div className="space-y-3">
              {reviewItems.map(item => {
                const decision = reviewDecisions[item.id];
                return (
                  <div key={item.id} className={`rounded-lg border p-3 transition-all ${decision === "certify" ? "border-green-500/15 bg-green-500/[0.02]" : decision === "revoke" ? "border-destructive/15 bg-destructive/[0.02]" : "border-[rgba(255,255,255,0.06)]"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.user}</p>
                        <p className="text-[10px] text-muted-foreground/60">{item.access}</p>
                      </div>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${item.recommendation === "revoke" ? "text-orange-400 border-orange-500/20" : "text-green-400 border-green-500/20"}`}>
                        AI: {item.recommendation}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 italic mb-2">{item.reason}</p>
                    {!decision ? (
                      <div className="flex gap-2">
                        <button onClick={() => decide(item.id, "certify")} className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-green-500/20 py-1.5 text-[10px] font-semibold text-green-400 hover:bg-green-500/5 transition-all">
                          <CheckCircle2 size={10} /> Certify
                        </button>
                        <button onClick={() => decide(item.id, "revoke")} className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-destructive/20 py-1.5 text-[10px] font-semibold text-destructive hover:bg-destructive/5 transition-all">
                          <XCircle size={10} /> Revoke
                        </button>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1.5 text-[10px] ${decision === "certify" ? "text-green-400" : "text-destructive"}`}>
                        {decision === "certify" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {decision === "certify" ? "Access certified" : "Access revoked"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {Object.keys(reviewDecisions).length === reviewItems.length && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[10px] text-green-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 size={10} /> Certification campaign complete — audit trail saved
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IGAShowcase;
