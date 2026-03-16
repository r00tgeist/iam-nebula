import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Play, Square, Eye, Clock, Shield, AlertTriangle, CheckCircle2, Terminal } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const COMMANDS = [
  { cmd: "sudo su - root", delay: 0, risk: "high" },
  { cmd: "cat /etc/shadow", delay: 1200, risk: "critical" },
  { cmd: "iptables -L -n", delay: 2400, risk: "medium" },
  { cmd: "systemctl restart nginx", delay: 3600, risk: "high" },
  { cmd: "SELECT * FROM users LIMIT 10;", delay: 4800, risk: "medium" },
];

const RISK_COLOR = { low: "text-green-400", medium: "text-yellow-400", high: "text-orange-400", critical: "text-destructive" };

const PAMShowcase = () => {
  const [checkedOut, setCheckedOut] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [commands, setCommands] = useState<typeof COMMANDS>([]);
  const [elapsed, setElapsed] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const checkout = useCallback(() => {
    setCheckedOut(true);
    setTimeout(() => setSessionActive(true), 800);
  }, []);

  useEffect(() => {
    if (!sessionActive) return;
    COMMANDS.forEach((c, i) => {
      timeoutsRef.current.push(setTimeout(() => setCommands(prev => [...prev, c]), c.delay));
    });
    intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => { clearInterval(intervalRef.current); timeoutsRef.current.forEach(clearTimeout); };
  }, [sessionActive]);

  const checkin = () => {
    clearInterval(intervalRef.current);
    timeoutsRef.current.forEach(clearTimeout);
    setSessionActive(false);
    setCheckedIn(true);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    timeoutsRef.current.forEach(clearTimeout);
    setCheckedOut(false);
    setSessionActive(false);
    setCommands([]);
    setElapsed(0);
    setCheckedIn(false);
  };

  const criticalCount = commands.filter(c => c.risk === "critical" || c.risk === "high").length;

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Privileged Access Management</h2>
      <p className="text-sm text-muted-foreground mb-8">Check out a privileged credential, use it in a recorded session, and check it back in. Every command is audited.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session panel */}
        <div className="lg:col-span-2">
          {!checkedOut ? (
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-8 text-center">
              <Crown size={32} className="text-secondary mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground mb-4">Root credential is vaulted. Checkout requires approval + MFA.</p>
              <motion.button onClick={checkout} className="inline-flex items-center gap-2 rounded-xl bg-secondary/10 border border-secondary/20 px-6 py-3 text-sm font-semibold text-secondary hover:bg-secondary/15 transition-all"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Crown size={16} /> Checkout Credential
              </motion.button>
            </div>
          ) : (
            <div>
              {/* Terminal */}
              <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.4)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground ml-2">root@prod-db-01 — PAM Session #{Math.floor(Math.random() * 9000 + 1000)}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {sessionActive && <motion.div className="flex items-center gap-1.5" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-[9px] font-mono text-destructive">REC</span>
                    </motion.div>}
                    <span className="text-[10px] font-mono text-muted-foreground">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
                  </div>
                </div>
                <div className="p-4 min-h-[200px] font-mono text-[12px] space-y-1">
                  <AnimatePresence>
                    {commands.map((c, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <span className="text-green-400">root@prod-db-01:~# </span>
                        <span className="text-foreground">{c.cmd}</span>
                        <span className={`ml-3 text-[9px] ${RISK_COLOR[c.risk as keyof typeof RISK_COLOR]}`}>[{c.risk}]</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {sessionActive && commands.length >= COMMANDS.length && (
                    <motion.span className="text-green-400" animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>root@prod-db-01:~# ▊</motion.span>
                  )}
                </div>
              </div>

              {/* Session controls */}
              {sessionActive && !checkedIn && (
                <motion.button onClick={checkin} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-all"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Square size={14} /> End Session & Check In
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Audit sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Session Audit</p>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={checkedIn ? "text-muted-foreground" : sessionActive ? "text-green-400" : checkedOut ? "text-yellow-400" : "text-muted-foreground/40"}>
                  {checkedIn ? "Checked In" : sessionActive ? "Active" : checkedOut ? "Checking out..." : "Idle"}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Commands</span><span className="text-foreground font-mono">{commands.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">High-risk ops</span>
                <span className={criticalCount > 0 ? "text-orange-400 font-mono" : "text-green-400 font-mono"}>{criticalCount}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="text-foreground font-mono">{elapsed}s</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Recording</span>
                <span className={sessionActive ? "text-destructive font-mono" : "text-muted-foreground/40 font-mono"}>{sessionActive ? "Active" : "—"}</span>
              </div>
            </div>
          </div>

          {criticalCount > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-1"><AlertTriangle size={12} className="text-orange-400" /><span className="text-[10px] font-mono uppercase text-orange-400 font-semibold">Alert</span></div>
              <p className="text-[11px] text-muted-foreground">{criticalCount} high/critical risk operations detected. These have been flagged for review by the security team.</p>
            </motion.div>
          )}

          {checkedIn && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={12} className="text-green-400" /><span className="text-[10px] font-mono uppercase text-green-400 font-semibold">Credential Rotated</span></div>
              <p className="text-[11px] text-muted-foreground">Password automatically rotated after check-in. The old credential is no longer valid. Full session recording saved to vault.</p>
            </motion.div>
          )}

          {checkedIn && (
            <motion.button onClick={reset} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex items-center justify-center gap-2 rounded-xl bg-muted/50 border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all">
              Reset Demo
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PAMShowcase;
