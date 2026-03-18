import { lazy, Suspense, ComponentType } from "react";

const showcaseMap: Record<string, () => Promise<{ default: ComponentType }>> = {
  "authn": () => import("./AuthNShowcase"),
  "authz": () => import("./AuthZShowcase"),
  "least-privilege": () => import("./LeastPrivilegeShowcase"),
  "rbac": () => import("./RBACShowcase"),
  "mfa": () => import("./MFAShowcase"),
  "sso": () => import("./SSOShowcase"),
  "password-policies": () => import("./PasswordPoliciesShowcase"),
  "session-management": () => import("./SessionManagementShowcase"),
  "abac": () => import("./ABACShowcase"),
  "pbac": () => import("./PBACShowcase"),
  "zero-trust": () => import("./ZeroTrustShowcase"),
  "pam": () => import("./PAMShowcase"),
  "identity-federation": () => import("./IdentityFederationShowcase"),
  "jit-access": () => import("./JITShowcase"),
  "machine-identity": () => import("./ServiceAccountsShowcase"),
  "iga": () => import("./IGAShowcase"),
};

export const hasShowcase = (conceptId: string): boolean => conceptId in showcaseMap;

const ShowcaseLoader = () => (
  <div className="glass-card p-8 flex items-center justify-center">
    <div className="flex items-center gap-3 text-muted-foreground">
      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm">Loading showcase...</span>
    </div>
  </div>
);

export const ConceptShowcase = ({ conceptId }: { conceptId: string }) => {
  const loader = showcaseMap[conceptId];
  if (!loader) return null;
  const LazyComponent = lazy(loader);
  return (
    <Suspense fallback={<ShowcaseLoader />}>
      <LazyComponent />
    </Suspense>
  );
};
