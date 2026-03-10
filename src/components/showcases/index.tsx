import { lazy, Suspense } from "react";

const AuthNShowcase = lazy(() => import("./AuthNShowcase"));

// Registry: maps concept ID to its showcase component
const showcaseRegistry: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  authn: AuthNShowcase,
  // Add more as we build them:
  // authz: AuthZShowcase,
  // "zero-trust": ZeroTrustShowcase,
  // rbac: RBACShowcase,
  // etc.
};

const ShowcaseLoader = () => (
  <div className="glass-card flex items-center justify-center p-12">
    <div className="flex items-center gap-3 text-muted-foreground">
      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
      <span className="text-sm ml-2">Loading showcase...</span>
    </div>
  </div>
);

export const ConceptShowcase = ({ conceptId }: { conceptId: string }) => {
  const ShowcaseComponent = showcaseRegistry[conceptId];

  if (!ShowcaseComponent) return null;

  return (
    <Suspense fallback={<ShowcaseLoader />}>
      <ShowcaseComponent />
    </Suspense>
  );
};

export const hasShowcase = (conceptId: string): boolean => {
  return conceptId in showcaseRegistry;
};
