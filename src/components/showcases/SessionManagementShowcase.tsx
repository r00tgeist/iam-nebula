import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, CheckCircle2, XCircle, RefreshCw, LogOut, Shield, Zap, ArrowRight, RotateCcw } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const SessionManagementShowcase = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [ttl, setTtl] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [expired, setExpired] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const startSession = useCallback(() => {
    setSessionActive(true);
    setElapsed(0);
    setExpired(false);
    setRevoked(false);
    setRefreshCount(0);
  }, []);

  useEffect(() => {
    if (!sessionActive || expired || revoked) return;
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= ttl) {
          setExpired(true);
          setSessionActive(false);
          clearInterval(intervalRef.current);
        }
        return next;
      });
    }, 50); // sped up for demo
    return () => clearInterval(intervalRef.current);
  }, [sessionActive, expired, revoked, ttl]);

  const refresh = () => {
    if (!sessionActive || expired || revoked) return;
    setElapsed(0);
    setRefreshCount(prev => prev + 1);
  };

  const revokeSession = () => {
    setRevoked(true);
    setSessionActive(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setSessionActive(false);
    setElapsed(0);
    setExpired(false);
    setRevoked(false);
    setRefreshCount(0);
  };

  const remaining = Math.max(0, ttl - elapsed);
  const pct = (remaining / ttl) * 100;
  const isWarning = remaining < ttl * 0.25 && remaining > 0;

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Session Lifecycle</h2>
      <p className="text-sm text-muted-foreground mb-8">Start a session and watch the TTL countdown. Refresh to extend, or let it expire. Revoke at any time.</p>

      {/* TTL config */}
      {!sessionActive && !expired && !revoked && (
        <div className="mb-8">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Session TTL (demo speed)</p>
          <div className="flex gap-2">
            {[30, 60, 90].map(v => (
              <button key={v} onClick={() => setTtl(v)}
                className={`px-4 py-2 rounded-xl border text-xs font-mono transition-all ${ttl === v ? "border-primary/40 bg-primary/[0.04] text-primary" : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.1)]"}`}>
                {v} ticks
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session status */}
      {(sessionActive || expired || revoked) && (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Timer */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5 text-center">
              <div className="relative mx-auto h-24 w-24 mb-3">
                <svg viewBox="0 0 96 96" className="w-full h-full">
                  <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                  <motion.circle cx="48" cy="48" r="42" fill="none"
                    stroke={expired || revoked ? "hsl(349,100%,62%)" : isWarning ? "hsl(48,96%,53%)" : "hsl(187,100%,50%)"}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                    transform="rotate(-90 48 48)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-lg font-mono font-bold ${expired || revoked ? "text-destructive" : isWarning ? "text-yellow-400" : "text-primary"}`}>
                    {expired ? "0" : revoked ? "×" : remaining}
                  </span>
                  <span className="text-[8px] font-mono text-muted-foreground">ticks left</span>
                </div>
              </div>
              <p className={`text-xs font-semibold ${expired ? "text-destructive" : revoked ? "text-destructive" : sessionActive ? "text-green-400" : "text-muted-foreground"}`}>
                {expired ? "Expired" : revoked ? "Revoked" : "Active"}
              </p>
            </div>

            {/* Session info */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5 font-mono text-[11px] space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans font-medium mb-2">Session Details</p>
              <div className="flex justify-between"><span className="text-muted-foreground">sid</span><span className="text-foreground">sess_a7f2…k9x1</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">user</span><span className="text-foreground">user@example.com</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ttl</span><span className="text-foreground">{ttl} ticks</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">refreshes</span><span className="text-primary">{refreshCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">status</span>
                <span className={expired ? "text-destructive" : revoked ? "text-destructive" : "text-green-400"}>
                  {expired ? "EXPIRED" : revoked ? "REVOKED" : "ACTIVE"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Controls</p>
              <button onClick={refresh} disabled={!sessionActive}
                className={`flex items-center gap-2 w-full rounded-xl border px-4 py-3 text-xs font-medium transition-all ${sessionActive ? "border-primary/20 text-primary hover:bg-primary/5" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/30 cursor-not-allowed"}`}>
                <RefreshCw size={14} /> Refresh Token
              </button>
              <button onClick={revokeSession} disabled={!sessionActive}
                className={`flex items-center gap-2 w-full rounded-xl border px-4 py-3 text-xs font-medium transition-all ${sessionActive ? "border-destructive/20 text-destructive hover:bg-destructive/5" : "border-[rgba(255,255,255,0.04)] text-muted-foreground/30 cursor-not-allowed"}`}>
                <LogOut size={14} /> Revoke Session
              </button>
              <button onClick={reset}
                className="flex items-center gap-2 w-full rounded-xl border border-[rgba(255,255,255,0.06)] px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                <RotateCcw size={14} /> New Session
              </button>
            </div>
          </div>

          {/* Warning / expiry messages */}
          <AnimatePresence mode="wait">
            {isWarning && sessionActive && (
              <motion.div key="warning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.03] p-4">
                <p className="text-[10px] font-mono uppercase text-yellow-400 font-semibold mb-1">Session Expiring Soon</p>
                <p className="text-[11px] text-muted-foreground">Token TTL is below 25%. Click Refresh to extend, or the session will expire and require re-authentication.</p>
              </motion.div>
            )}
            {expired && (
              <motion.div key="expired" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-destructive/20 bg-destructive/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase text-destructive font-semibold mb-1">Session Expired</p>
                <p className="text-[11px] text-muted-foreground">The session TTL reached zero. The access token is no longer valid. User must re-authenticate to obtain a new session.</p>
              </motion.div>
            )}
            {revoked && (
              <motion.div key="revoked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-destructive/20 bg-destructive/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase text-destructive font-semibold mb-1">Session Revoked</p>
                <p className="text-[11px] text-muted-foreground">The session was manually terminated. The token has been added to the revocation list. Any API calls using this token will be rejected.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Start button */}
      {!sessionActive && !expired && !revoked && (
        <div className="flex justify-center">
          <motion.button onClick={startSession} className="group flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-8 py-3.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-all"
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,229,255,0.15)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Timer size={16} /> Start Session <ArrowRight size={14} />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default SessionManagementShowcase;
