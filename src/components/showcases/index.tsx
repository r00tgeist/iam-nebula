import { lazy, Suspense, ComponentType } from "react";

// Lazy-load all showcases
const showcaseMap: Record<string, () => Promise<{ default: ComponentType }>> = {
  // Basic concepts
  "authn": () => import("./AuthNShowcase"),
  // Advanced concepts
  "abac": () => import("./ABACShowcase"),
  "pbac": () => import("./PBACShowcase"),
  "zero-trust": () => import("./ZeroTrustShowcase"),
  "pam": () => import("./PAMShowcase"),
  "identity-federation": () => import("./IdentityFederationShowcase"),
  "jit-access": () => import("./JITShowcase"),
  "machine-identity": () => import("./ServiceAccountsShowcase"),
  "iga": () => import("./IGAShowcase"),
};

// Check if a concept has a showcase
export const hasShowcase = (conceptId: string): boolean => conceptId in showcaseMap;

// Loading placeholder
const ShowcaseLoader = () => (
  <div className="glass-card p-8 flex items-center justify-center">
    <div className="flex items-center gap-3 text-muted-foreground">
      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm">Loading showcase...</span>
    </div>
  </div>
);

// Render showcase by concept ID
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
