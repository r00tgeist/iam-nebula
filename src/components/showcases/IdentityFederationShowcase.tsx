import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Building2, ArrowRight, CheckCircle2, RotateCcw, Shield, Code2, AlertTriangle, KeyRound } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Org { id: string; label: string; domain: string; protocol: "SAML 2.0" | "OIDC"; entityId: string }

const ORGS: Org[] = [
  { id: "home",    label: "Home IdP",      domain: "corp.example.com",  protocol: "SAML 2.0", entityId: "https://idp.corp.example.com" },
  { id: "partner", label: "Partner SaaS",  domain: "partner.cloud",     protocol: "OIDC",     entityId: "https://partner.cloud/oidc" },
  { id: "saas",    label: "Vendor App",    domain: "app.saas.io",       protocol: "OIDC",     entityId: "https://app.saas.io" },
  { id: "legacy",  label: "Legacy Suite",  domain: "erp.legacy.local",  protocol: "SAML 2.0", entityId: "https://erp.legacy.local/sp" },
];

type FedStep = "idle" | "discover" | "authn" | "assertion" | "exchange" | "mapping" | "access";
const ORDER: FedStep[] = ["idle", "discover", "authn", "assertion", "exchange", "mapping", "access"];

const ATTR_MAP: Record<string, { idp: string; sp: string; transform?: string }[]> = {
  "SAML 2.0": [
    { idp: "uid",                                                                   sp: "username" },
    { idp: "mail",                                                                  sp: "email" },
    { idp: "http://schemas.xmlsoap.org/claims/Group",                               sp: "roles", transform: "groups → roles[]" },
    { idp: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",          sp: "scopes" },
  ],
  "OIDC": [
    { idp: "sub",        sp: "external_id" },
    { idp: "email",      sp: "email" },
    { idp: "groups[]",   sp: "roles[]",   transform: "filter prefix=app:" },
    { idp: "given_name", sp: "first_name" },
  ],
};

const IdentityFederationShowcase = () => {
  const [step, setStep] = useState<FedStep>("idle");
  const [target, setTarget] = useState<string>("partner");
  const [scenario, setScenario] = useState<"happy" | "unsigned" | "untrusted" | "expired">("happy");
  const [done, setDone] = useState(false);
  const [failureAt, setFailureAt] = useState<FedStep | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const targetOrg = ORGS.find(o => o.id === target)!;

  const start = useCallback(() => {
    if (step !== "idle") return;
    setDone(false);
    setFailureAt(null);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Where the chosen scenario fails
    const failStep: FedStep | null =
      scenario === "unsigned"  ? "exchange" :
      scenario === "untrusted" ? "exchange" :
      scenario === "expired"   ? "mapping"  : null;

    const transitions: FedStep[] = ["discover", "authn", "assertion", "exchange", "mapping", "access"];
    let delay = 0;
    for (const s of transitions) {
      delay += 700;
      const at = delay;
      timeoutsRef.current.push(setTimeout(() => {
        if (failStep && ORDER.indexOf(s) > ORDER.indexOf(failStep)) return;
        setStep(s);
        if (failStep === s) {
          setFailureAt(s);
          setTimeout(() => setDone(true), 400);
        } else if (s === "access") {
          setTimeout(() => setDone(true), 300);
        }
      }, at));
    }
  }, [step, scenario]);

  const reset = () => {
    timeoutsRef.current.forEach(clearTimeout);
    setStep("idle");
    setDone(false);
    setFailureAt(null);
  };

  const stepIdx = ORDER.indexOf(step);

  const STEPS: { id: FedStep; label: string; desc: string }[] = useMemo(() => [
    { id: "discover",  label: "1. Service Discovery",       desc: `SP redirects to ${targetOrg.protocol === "SAML 2.0" ? "IdP-Initiated SSO endpoint" : ".well-known/openid-configuration"}` },
    { id: "authn",     label: "2. AuthN at Home IdP",       desc: "User proves identity (password + MFA) at corp.example.com" },
    { id: "assertion", label: "3. Issue Federation Token",  desc: targetOrg.protocol === "SAML 2.0" ? "IdP signs SAMLResponse with RS256, sets NotOnOrAfter (5 min)" : "IdP issues id_token (JWT) signed by JWKS key" },
    { id: "exchange",  label: "4. Token Validation at SP",  desc: "SP fetches IdP signing key, verifies signature, audience, issuer, expiry" },
    { id: "mapping",   label: "5. Claim → Role Mapping",    desc: `${targetOrg.protocol === "SAML 2.0" ? "AttributeStatement" : "id_token claims"} mapped to local SP roles` },
    { id: "access",    label: "6. Session Established",     desc: "JIT-provisioned account; SP issues local session cookie" },
  ], [targetOrg]);

  const fakeAssertion = targetOrg.protocol === "SAML 2.0"
    ? `<saml:Assertion ID="_a7f2…" IssueInstant="2026-05-15T10:21:43Z">
  <saml:Issuer>${ORGS[0].entityId}</saml:Issuer>
  <ds:Signature>…RS256…${scenario === "unsigned" ? "<MISSING>" : "valid"}</ds:Signature>
  <saml:Conditions NotOnOrAfter="${scenario === "expired" ? "2026-05-15T10:16:00Z" : "2026-05-15T10:26:43Z"}"
    AudienceRestriction="${targetOrg.entityId}"/>
  <saml:AttributeStatement>
    <Attribute Name="uid">jdoe</Attribute>
    <Attribute Name="mail">jdoe@corp.example.com</Attribute>
    <Attribute Name="groups">app:editor, app:viewer</Attribute>
  </saml:AttributeStatement>
</saml:Assertion>`
    : `{
  "iss":   "${ORGS[0].entityId}",
  "aud":   "${targetOrg.entityId}",
  "sub":   "u_8f3a91",
  "email": "jdoe@corp.example.com",
  "groups":["app:editor","app:viewer","corp:engineering"],
  "exp":   ${scenario === "expired" ? "1747300560 (passed)" : "1747304503"},
  "iat":   1747300903,
  "alg":   "${scenario === "unsigned" ? "none ⚠" : "RS256"}"
}`;

  const failureMsg: Record<string, string> = {
    unsigned:  "Assertion has no signature (alg:none). SP rejects: WS-Security violation.",
    untrusted: `SP does not trust issuer ${ORGS[0].entityId}. Federation metadata not exchanged.`,
    expired:   "Assertion NotOnOrAfter has elapsed. Replay window closed → 403.",
  };

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Identity Federation</h2>
      <p className="text-sm text-muted-foreground mb-6">Cross-domain SSO via SAML 2.0 or OIDC. Home IdP issues a signed assertion; the Service Provider validates trust, signature, freshness, and maps claims to local roles.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Target selector */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Service Provider</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ORGS.filter(o => o.id !== "home").map(o => (
              <button key={o.id} onClick={() => { if (step === "idle") setTarget(o.id); }} disabled={step !== "idle"}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all ${target === o.id ? "border-secondary/30 bg-secondary/[0.04]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"} ${step !== "idle" ? "opacity-40 cursor-not-allowed" : ""}`}>
                <Building2 size={14} className={target === o.id ? "text-secondary" : "text-muted-foreground"} />
                <div>
                  <p className={`text-xs font-medium ${target === o.id ? "text-foreground" : "text-muted-foreground"}`}>{o.label}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/50">{o.protocol}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Scenario</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { k: "happy",     label: "Happy path",         icon: <CheckCircle2 size={11} className="text-green-400"/> },
              { k: "unsigned",  label: "Unsigned token",     icon: <AlertTriangle size={11} className="text-destructive"/> },
              { k: "untrusted", label: "Untrusted issuer",   icon: <AlertTriangle size={11} className="text-destructive"/> },
              { k: "expired",   label: "Expired assertion",  icon: <AlertTriangle size={11} className="text-yellow-400"/> },
            ].map(s => (
              <button key={s.k} onClick={() => { if (step === "idle") setScenario(s.k as typeof scenario); }} disabled={step !== "idle"}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-medium transition-all ${scenario === s.k ? "border-secondary/30 bg-secondary/[0.04] text-foreground" : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.1)]"} ${step !== "idle" ? "opacity-40 cursor-not-allowed" : ""}`}>
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow */}
        <div className="lg:col-span-2 space-y-2">
          {STEPS.map(s => {
            const idx = ORDER.indexOf(s.id);
            const completed = stepIdx > idx && (failureAt ? ORDER.indexOf(failureAt) > idx : true);
            const current = step === s.id && !done;
            const failed = failureAt === s.id;
            return (
              <motion.div key={s.id} layout transition={spring}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  failed ? "border-destructive/30 bg-destructive/[0.04]" :
                  completed ? "border-green-500/15 bg-green-500/[0.02]" :
                  current ? "border-secondary/20 bg-secondary/[0.02]" :
                  "border-[rgba(255,255,255,0.06)]"
                }`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  failed ? "bg-destructive/15 text-destructive" :
                  completed ? "bg-green-500/15 text-green-400" :
                  current ? "bg-secondary/15 text-secondary" :
                  "bg-muted/20 text-muted-foreground/30"
                }`}>
                  {failed ? <AlertTriangle size={14} /> :
                   completed ? <CheckCircle2 size={14} /> :
                   current ? <motion.div className="h-3.5 w-3.5 rounded-full border-2 border-secondary border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /> :
                   <span className="text-[10px] font-mono">{idx}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${completed || current || failed ? "text-foreground" : "text-muted-foreground/40"}`}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/60">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}

          {/* Actions */}
          <div className="flex justify-center pt-3">
            {step === "idle" && (
              <motion.button onClick={start} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-secondary/10 border border-secondary/20 px-6 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/15 transition-all">
                <Network size={14} /> Federate to {targetOrg.label} <ArrowRight size={12} />
              </motion.button>
            )}
            {done && (
              <motion.button onClick={reset} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all">
                <RotateCcw size={12} /> Reset
              </motion.button>
            )}
          </div>
        </div>

        {/* Side detail */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <KeyRound size={11} className="text-secondary" />
              <p className="text-[9px] font-mono uppercase tracking-wider text-secondary font-semibold">{targetOrg.protocol === "SAML 2.0" ? "SAMLResponse" : "id_token (JWT)"}</p>
            </div>
            <pre className="text-[9px] font-mono text-foreground/70 leading-relaxed overflow-x-auto whitespace-pre">{fakeAssertion}</pre>
          </div>

          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-3">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Attribute Mapping (IdP → SP)</p>
            <div className="space-y-1">
              {ATTR_MAP[targetOrg.protocol].map(m => (
                <div key={m.idp} className="text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/70 truncate">{m.idp}</span>
                    <ArrowRight size={9} className="text-muted-foreground/40 shrink-0" />
                    <span className="text-foreground">{m.sp}</span>
                  </div>
                  {m.transform && <p className="text-[9px] text-secondary/70 italic ml-3">{m.transform}</p>}
                </div>
              ))}
            </div>
          </div>

          {failureAt && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={11} className="text-destructive" />
                <p className="text-[9px] font-mono uppercase text-destructive font-semibold">Federation Failed</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{failureMsg[scenario]}</p>
            </motion.div>
          )}

          {done && !failureAt && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-green-500/20 bg-green-500/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield size={11} className="text-green-400" />
                <p className="text-[9px] font-mono uppercase text-green-400 font-semibold">SLO Channel Open</p>
              </div>
              <p className="text-[10px] text-muted-foreground">SP registered with IdP for back-channel Single Logout. JIT-provisioned account: <span className="text-foreground font-mono">jdoe</span> (no password stored).</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentityFederationShowcase;
