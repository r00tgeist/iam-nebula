import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, CheckCircle2, Globe, Mail, BarChart3, MessageSquare, FileText, Calendar, ArrowRight, RotateCcw, Lock, FileJson, Server, ShieldAlert, XCircle } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type Protocol = "saml" | "oidc";
type Phase = "idle" | "sp_redirect" | "idp_authn" | "assertion" | "validate" | "session" | "slo";

interface App { id: string; label: string; icon: React.ReactNode; domain: string; protocol: Protocol; audience: string }

const APPS: App[] = [
  { id: "email",     label: "Email",      icon: <Mail size={16} />,           domain: "mail.corp.com",      protocol: "saml", audience: "urn:mail.corp" },
  { id: "analytics", label: "Analytics",  icon: <BarChart3 size={16} />,      domain: "analytics.corp.com", protocol: "oidc", audience: "analytics-spa" },
  { id: "chat",      label: "Team Chat",  icon: <MessageSquare size={16} />,  domain: "chat.corp.com",      protocol: "oidc", audience: "chat-web" },
  { id: "docs",      label: "Documents",  icon: <FileText size={16} />,       domain: "docs.corp.com",      protocol: "saml", audience: "urn:docs.corp" },
  { id: "calendar",  label: "Calendar",   icon: <Calendar size={16} />,       protocol: "oidc", domain: "cal.corp.com", audience: "calendar-pwa" },
  { id: "portal",    label: "HR Portal",  icon: <Globe size={16} />,          domain: "hr.corp.com",        protocol: "saml", audience: "urn:hr.corp" },
];

const STAGES: { id: Phase; label: string; detail: string }[] = [
  { id: "sp_redirect", label: "SP → IdP redirect",     detail: "Browser is bounced to the IdP with a signed AuthnRequest / OIDC `state`+`nonce`+PKCE" },
  { id: "idp_authn",   label: "Primary AuthN at IdP",  detail: "User proves identity once (password + WebAuthn). Single source of truth." },
  { id: "assertion",   label: "Assertion / ID token",  detail: "IdP signs a SAMLResponse or OIDC ID token (RS256). Includes sub, aud, iat, exp, nonce, amr." },
  { id: "validate",    label: "SP signature & replay", detail: "SP fetches the IdP JWKS, verifies signature, audience, expiry and that the nonce hasn’t been seen." },
  { id: "session",     label: "Local session minted",  detail: "SP creates a short-lived cookie/session — independent of the IdP token (which is discarded)." },
];

const SSOShowcase = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [authenticated, setAuthenticated] = useState(false);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [currentApp, setCurrentApp] = useState<App>(APPS[0]);
  const [tampered, setTampered] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sessionId = useMemo(() => "sess_" + Math.random().toString(36).slice(2, 10), []);
  const nonce     = useMemo(() => Math.random().toString(36).slice(2, 14), []);

  const reset = () => {
    timeoutsRef.current.forEach(clearTimeout);
    setPhase("idle"); setAuthenticated(false); setUnlocked(new Set());
    setValidationError(null); setLoggedOut(false);
  };

  const start = useCallback(() => {
    if (phase !== "idle") return;
    setLoggedOut(false); setValidationError(null);
    const seq: Phase[] = ["sp_redirect", "idp_authn", "assertion", "validate"];
    let delay = 0;
    seq.forEach((p) => {
      delay += 700;
      timeoutsRef.current.push(setTimeout(() => setPhase(p), delay));
    });
    delay += 700;
    timeoutsRef.current.push(setTimeout(() => {
      if (tampered) {
        setValidationError("signature mismatch — assertion was modified in transit");
        setPhase("idle");
        return;
      }
      setPhase("session");
      setAuthenticated(true);
      // Subsequent SPs can trade their own short flow for a session via the same IdP cookie
      APPS.forEach((app, i) => {
        timeoutsRef.current.push(setTimeout(() => setUnlocked(prev => new Set([...prev, app.id])), 200 + i * 220));
      });
    }, delay));
  }, [phase, tampered]);

  const slo = () => {
    timeoutsRef.current.forEach(clearTimeout);
    setPhase("slo");
    setTimeout(() => {
      setUnlocked(new Set());
      setAuthenticated(false);
      setLoggedOut(true);
      setPhase("idle");
    }, 900);
  };

  const stageIdx = STAGES.findIndex(s => s.id === phase);

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Single Sign-On Flow</h2>
      <p className="text-sm text-muted-foreground mb-6">
        One AuthN at the IdP, signed assertions delivered to every SP. Toggle the adversary to tamper with the assertion in
        flight and watch the SP reject it.
      </p>

      {/* Threat toggle + protocol info */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => { setTampered(!tampered); reset(); }}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${tampered ? "border-destructive/30 bg-destructive/[0.04] text-destructive" : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.12)]"}`}>
          <ShieldAlert size={12} /> Tamper with assertion
          <span className="text-[9px] font-mono opacity-60">{tampered ? "ON" : "OFF"}</span>
        </button>
        <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">
          IdP: idp.corp.com · session={sessionId} · nonce={nonce}
        </span>
      </div>

      {/* Flow stages */}
      <div className="space-y-2 mb-6">
        {STAGES.map((s, i) => {
          const past = stageIdx > i || (authenticated && i < STAGES.length);
          const current = phase === s.id;
          return (
            <div key={s.id}
              className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${past ? "border-green-500/15 bg-green-500/[0.02]" : current ? "border-primary/20 bg-primary/[0.02]" : "border-[rgba(255,255,255,0.04)]"}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${past ? "bg-green-500/15 text-green-400" : current ? "bg-primary/15 text-primary" : "bg-muted/20 text-muted-foreground/40"}`}>
                {past ? <CheckCircle2 size={14} /> : current ? (
                  <motion.div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                ) : <span className="text-[10px] font-mono">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${past || current ? "text-foreground" : "text-muted-foreground/40"}`}>{s.label}</p>
                <p className="text-[10px] text-muted-foreground/60 leading-snug">{s.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assertion preview */}
      {(phase === "assertion" || phase === "validate" || authenticated) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.3)] p-4 mb-6 font-mono text-[10px] overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <FileJson size={12} className="text-secondary" />
            <span className="text-muted-foreground">{currentApp.protocol === "saml" ? "SAMLResponse → Assertion" : "OIDC ID Token (decoded)"}</span>
            <span className="ml-auto text-muted-foreground/40">RS256, kid=idp-2024-04</span>
          </div>
          <pre className="text-foreground/80 whitespace-pre">
{`{
  "iss":  "https://idp.corp.com",
  "sub":  "user@example.com",
  "aud":  "${currentApp.audience}",
  "iat":  ${Math.floor(Date.now()/1000)},
  "exp":  ${Math.floor(Date.now()/1000) + 600},
  "nonce":"${nonce}",
  "amr":  ["pwd","webauthn"],
  "acr":  "urn:mfa:phishing-resistant"${tampered ? ',\n  "role": "admin"  ⚠ injected by adversary' : ""}
}`}
          </pre>
        </motion.div>
      )}

      {/* Validation result */}
      <AnimatePresence>
        {validationError && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/20 bg-destructive/[0.02] p-4 mb-6 flex items-start gap-3">
            <XCircle size={18} className="text-destructive shrink-0" />
            <div>
              <p className="text-xs font-semibold text-destructive">SP rejected the assertion</p>
              <p className="text-[11px] text-muted-foreground">{validationError}. Detached signature over the canonicalised XML/JOSE protects integrity end-to-end.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected SPs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
        {APPS.map(app => {
          const ok = unlocked.has(app.id);
          return (
            <button key={app.id} onClick={() => setCurrentApp(app)}
              className={`text-left rounded-xl border p-3 transition-all ${ok ? "border-green-500/15 bg-green-500/[0.02]" : "border-[rgba(255,255,255,0.06)]"} ${currentApp.id === app.id ? "ring-1 ring-primary/30" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${ok ? "bg-green-500/15 text-green-400" : "bg-muted/30 text-muted-foreground/50"}`}>
                  {ok ? <CheckCircle2 size={13} /> : app.icon}
                </div>
                <span className={`text-xs font-medium truncate ${ok ? "text-foreground" : "text-muted-foreground/60"}`}>{app.label}</span>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/50">{app.domain}</p>
              <p className="text-[9px] font-mono text-muted-foreground/40">{app.protocol.toUpperCase()} · aud={app.audience}</p>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {!authenticated && phase === "idle" && (
          <motion.button onClick={start} className="group flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-7 py-3 text-sm font-semibold text-primary hover:bg-primary/15 transition-all"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <LogIn size={16} /> Sign in once at IdP <ArrowRight size={14} />
          </motion.button>
        )}
        {authenticated && (
          <>
            <motion.button onClick={slo} className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/15 transition-all"
              whileHover={{ scale: 1.02 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Lock size={14} /> Single Logout (SLO)
            </motion.button>
            <button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
              <RotateCcw size={14} /> Reset
            </button>
          </>
        )}
        {(loggedOut || validationError) && phase === "idle" && (
          <button onClick={reset} className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
            <RotateCcw size={14} /> Try again
          </button>
        )}
      </div>

      {loggedOut && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[11px] text-muted-foreground mt-3">
          IdP session terminated. Back-channel SLO notified every SP — all local sessions invalidated.
        </motion.p>
      )}
    </div>
  );
};

export default SSOShowcase;
