import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, ArrowRight, RotateCcw, Zap, User, FileText, Database, Settings, Lock } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Resource { id: string; label: string; icon: React.ReactNode; permissions: string[] }
interface UserRole { id: string; label: string; permissions: string[] }

const RESOURCES: Resource[] = [
  { id: "docs", label: "Documents", icon: <FileText size={16} />, permissions: ["read", "write"] },
  { id: "db", label: "Database", icon: <Database size={16} />, permissions: ["read", "write", "admin"] },
  { id: "settings", label: "Settings", icon: <Settings size={16} />, permissions: ["admin"] },
  { id: "logs", label: "Audit Logs", icon: <FileText size={16} />, permissions: ["read", "admin"] },
];

const ROLES: UserRole[] = [
  { id: "viewer", label: "Viewer", permissions: ["read"] },
  { id: "editor", label: "Editor", permissions: ["read", "write"] },
  { id: "admin", label: "Admin", permissions: ["read", "write", "admin"] },
];

const ACTIONS = ["read", "write", "admin"] as const;

const AuthZShowcase = () => {
  const [role, setRole] = useState<string>("viewer");
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [result, setResult] = useState<{ allowed: boolean; resource: string; action: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const currentRole = ROLES.find(r => r.id === role)!;

  const checkAccess = useCallback(() => {
    if (!selectedResource || !selectedAction || checking) return;
    setChecking(true);
    setResult(null);
    const resource = RESOURCES.find(r => r.id === selectedResource)!;
    const allowed = currentRole.permissions.includes(selectedAction) && resource.permissions.includes(selectedAction);

    timeoutRef.current = setTimeout(() => {
      setResult({ allowed, resource: resource.label, action: selectedAction });
      setChecking(false);
    }, 1200);
  }, [selectedResource, selectedAction, currentRole, checking]);

  const reset = () => {
    clearTimeout(timeoutRef.current);
    setResult(null);
    setChecking(false);
    setSelectedResource(null);
    setSelectedAction(null);
  };

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-bold text-foreground">Authorization Engine</h2>
        {result && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={reset} className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            <RotateCcw size={12} /> Reset
          </motion.button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-8">Select a role, resource, and action — then evaluate whether access is granted.</p>

      {/* Role selector */}
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">User Role</p>
        <div className="flex gap-2">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => { if (!checking) { setRole(r.id); setResult(null); } }} disabled={checking}
              className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${role === r.id ? "border-primary/40 bg-primary/[0.04]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"} ${checking ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
              {role === r.id && <motion.div layoutId="role-bg" className="absolute inset-0 rounded-xl glow-cyan" transition={spring} />}
              <User size={14} className={`relative z-10 ${role === r.id ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`relative z-10 font-medium ${role === r.id ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</span>
              <span className="relative z-10 text-[9px] font-mono text-muted-foreground/60 ml-1">[{r.permissions.join(", ")}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resource + Action grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Target Resource</p>
          <div className="space-y-2">
            {RESOURCES.map(r => (
              <button key={r.id} onClick={() => { if (!checking) { setSelectedResource(r.id); setResult(null); } }} disabled={checking}
                className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all ${selectedResource === r.id ? "border-primary/30 bg-primary/[0.03]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"} ${checking ? "opacity-40" : ""}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedResource === r.id ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"}`}>{r.icon}</div>
                <div>
                  <p className={`text-sm font-medium ${selectedResource === r.id ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono">requires: {r.permissions.join(" | ")}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Requested Action</p>
          <div className="space-y-2">
            {ACTIONS.map(a => (
              <button key={a} onClick={() => { if (!checking) { setSelectedAction(a); setResult(null); } }} disabled={checking}
                className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all ${selectedAction === a ? "border-secondary/30 bg-secondary/[0.03]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"} ${checking ? "opacity-40" : ""}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedAction === a ? "bg-secondary/15 text-secondary" : "bg-muted/30 text-muted-foreground"}`}>
                  <Lock size={14} />
                </div>
                <span className={`text-sm font-medium capitalize ${selectedAction === a ? "text-foreground" : "text-muted-foreground"}`}>{a}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluation */}
      <AnimatePresence mode="wait">
        {checking && (
          <motion.div key="checking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-primary/10 bg-[rgba(0,0,0,0.15)] p-5 mb-6">
            <div className="flex items-center gap-3">
              <motion.div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
              <span className="text-sm text-muted-foreground font-mono">Evaluating policy: {currentRole.label} → {selectedAction} → {RESOURCES.find(r => r.id === selectedResource)?.label}...</span>
            </div>
          </motion.div>
        )}
        {result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}
            className={`rounded-xl border px-5 py-5 mb-6 ${result.allowed ? "border-green-500/20 bg-green-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${result.allowed ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`}>
                {result.allowed ? <ShieldCheck size={20} /> : <ShieldX size={20} />}
              </div>
              <div>
                <p className={`font-display text-sm font-bold ${result.allowed ? "text-green-400" : "text-destructive"}`}>
                  {result.allowed ? "Access Granted" : "Access Denied"}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {result.allowed
                    ? `Role "${currentRole.label}" has "${result.action}" permission, and resource "${result.resource}" accepts this action.`
                    : `Role "${currentRole.label}" ${!currentRole.permissions.includes(result.action) ? `lacks "${result.action}" permission` : `cannot perform "${result.action}" on "${result.resource}"`}.`}
                </p>
                <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-3 font-mono text-[10px] text-muted-foreground space-y-1">
                  <p><span className="text-primary">decision:</span> {result.allowed ? "ALLOW" : "DENY"}</p>
                  <p><span className="text-primary">subject:</span> user (role={currentRole.label})</p>
                  <p><span className="text-primary">resource:</span> {result.resource}</p>
                  <p><span className="text-primary">action:</span> {result.action}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <div className="flex justify-center">
        {!result && !checking && (
          <motion.button onClick={checkAccess} disabled={!selectedResource || !selectedAction}
            className={`group flex items-center gap-3 rounded-xl border px-8 py-3.5 text-sm font-semibold transition-all ${selectedResource && selectedAction ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/15" : "bg-muted/20 border-border text-muted-foreground cursor-not-allowed"}`}
            whileHover={selectedResource && selectedAction ? { scale: 1.02 } : {}} whileTap={selectedResource && selectedAction ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Zap size={16} /> Evaluate Access <ArrowRight size={14} />
          </motion.button>
        )}
        {result && (
          <motion.button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            whileHover={{ scale: 1.02 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <RotateCcw size={14} /> Try Different Combination
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default AuthZShowcase;
