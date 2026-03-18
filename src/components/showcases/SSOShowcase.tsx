import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, CheckCircle2, Globe, Mail, BarChart3, MessageSquare, FileText, Calendar, Zap, ArrowRight, RotateCcw } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface App { id: string; label: string; icon: React.ReactNode; domain: string }

const APPS: App[] = [
  { id: "email", label: "Email", icon: <Mail size={18} />, domain: "mail.corp.com" },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} />, domain: "analytics.corp.com" },
  { id: "chat", label: "Team Chat", icon: <MessageSquare size={18} />, domain: "chat.corp.com" },
  { id: "docs", label: "Documents", icon: <FileText size={18} />, domain: "docs.corp.com" },
  { id: "calendar", label: "Calendar", icon: <Calendar size={18} />, domain: "cal.corp.com" },
  { id: "portal", label: "HR Portal", icon: <Globe size={18} />, domain: "hr.corp.com" },
];

const SSOShowcase = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [unlockedApps, setUnlockedApps] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = useCallback(() => {
    if (authenticating) return;
    setAuthenticating(true);
    timeoutsRef.current.push(setTimeout(() => {
      setAuthenticated(true);
      setAuthenticating(false);
      APPS.forEach((app, i) => {
        timeoutsRef.current.push(setTimeout(() => {
          setUnlockedApps(prev => new Set([...prev, app.id]));
        }, 200 + i * 250));
      });
    }, 1500));
  }, [authenticating]);

  const reset = () => {
    timeoutsRef.current.forEach(clearTimeout);
    setAuthenticated(false);
    setAuthenticating(false);
    setUnlockedApps(new Set());
  };

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Single Sign-On Flow</h2>
      <p className="text-sm text-muted-foreground mb-8">Authenticate once at the Identity Provider. Watch all connected services unlock without re-entering credentials.</p>

      {/* IdP Card */}
      <div className="flex justify-center mb-8">
        <motion.div className={`rounded-2xl border px-8 py-5 text-center transition-all ${authenticated ? "border-green-500/30 bg-green-500/[0.03]" : authenticating ? "border-primary/30 bg-primary/[0.03]" : "border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.15)]"}`}
          animate={authenticating ? { boxShadow: ["0 0 0px rgba(0,229,255,0)", "0 0 30px rgba(0,229,255,0.2)", "0 0 0px rgba(0,229,255,0)"] } : {}}
          transition={authenticating ? { duration: 1.5, repeat: Infinity } : {}}>
          <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${authenticated ? "bg-green-500/15 text-green-400" : "bg-primary/10 text-primary"}`}>
            {authenticated ? <CheckCircle2 size={24} /> : authenticating ? (
              <motion.div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
            ) : <LogIn size={24} />}
          </div>
          <p className="font-display text-sm font-bold text-foreground">Identity Provider</p>
          <p className="text-[10px] font-mono text-muted-foreground">idp.corp.com (SAML 2.0)</p>
          {authenticated && <p className="text-[10px] font-mono text-green-400 mt-1">Session: user@example.com</p>}
        </motion.div>
      </div>

      {/* Connection indicator */}
      {authenticated && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-primary">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
            SAML Assertions
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </motion.div>
      )}

      {/* Service Provider apps grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {APPS.map((app, i) => {
          const unlocked = unlockedApps.has(app.id);
          return (
            <motion.div key={app.id}
              initial={false}
              animate={unlocked ? { borderColor: "rgba(34,197,94,0.2)", backgroundColor: "rgba(34,197,94,0.02)" } : {}}
              className={`rounded-xl border p-4 text-center transition-all ${unlocked ? "" : "border-[rgba(255,255,255,0.06)]"}`}>
              <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 ${unlocked ? "bg-green-500/15 text-green-400" : "bg-muted/30 text-muted-foreground/40"}`}>
                {unlocked ? <CheckCircle2 size={18} /> : app.icon}
              </div>
              <p className={`text-xs font-medium ${unlocked ? "text-foreground" : "text-muted-foreground/50"}`}>{app.label}</p>
              <p className="text-[9px] font-mono text-muted-foreground/40">{app.domain}</p>
              {unlocked && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-[9px] font-mono text-green-400/70 mt-1">Authenticated</motion.p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      {authenticated && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-xl border border-primary/10 bg-primary/[0.02] p-4 mb-6">
          <p className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold mb-1">How SSO Works</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            One authentication event at the IdP generates a session. Each Service Provider receives a signed SAML assertion or OIDC token — no passwords are shared with individual apps. Revoking the IdP session immediately locks out all SPs.
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-center">
        {!authenticated && !authenticating && (
          <motion.button onClick={start} className="group flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-8 py-3.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-all"
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,229,255,0.15)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <LogIn size={16} /> Sign In Once <ArrowRight size={14} />
          </motion.button>
        )}
        {authenticated && (
          <motion.button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            whileHover={{ scale: 1.02 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <RotateCcw size={14} /> Sign Out (All SPs)
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default SSOShowcase;
