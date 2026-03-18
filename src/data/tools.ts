export interface Tool {
  name: string;
  description: string;
  url: string;
  tag: "free" | "freemium" | "enterprise";
}

export const conceptTools: Record<string, Tool[]> = {
  "authn": [
    { name: "Auth0", description: "Universal authentication platform with SDKs for every framework", url: "https://auth0.com", tag: "freemium" },
    { name: "Firebase Auth", description: "Google's drop-in authentication for web and mobile", url: "https://firebase.google.com/products/auth", tag: "free" },
    { name: "Clerk", description: "Modern user authentication with pre-built UI components", url: "https://clerk.com", tag: "freemium" },
  ],
  "authz": [
    { name: "OPA (Open Policy Agent)", description: "Policy engine for cloud-native authorization", url: "https://www.openpolicyagent.org", tag: "free" },
    { name: "Cerbos", description: "Scalable authorization-as-a-service", url: "https://cerbos.dev", tag: "freemium" },
    { name: "Permit.io", description: "Full-stack permissions infrastructure", url: "https://permit.io", tag: "freemium" },
  ],
  "least-privilege": [
    { name: "AWS IAM Access Analyzer", description: "Identify overprivileged resources in AWS", url: "https://aws.amazon.com/iam/access-analyzer/", tag: "free" },
    { name: "Prisma Cloud", description: "Cloud-native least privilege enforcement", url: "https://www.paloaltonetworks.com/prisma/cloud", tag: "enterprise" },
  ],
  "rbac": [
    { name: "Azure AD Roles", description: "Microsoft's built-in RBAC for cloud infrastructure", url: "https://learn.microsoft.com/en-us/azure/role-based-access-control/", tag: "freemium" },
    { name: "Teleport", description: "Infrastructure access with built-in RBAC", url: "https://goteleport.com", tag: "freemium" },
  ],
  "mfa": [
    { name: "Duo Security", description: "Cisco's MFA solution for workforce authentication", url: "https://duo.com", tag: "freemium" },
    { name: "YubiKey", description: "Hardware security keys for phishing-resistant MFA", url: "https://www.yubico.com", tag: "freemium" },
    { name: "Authy", description: "Free TOTP authenticator app by Twilio", url: "https://authy.com", tag: "free" },
  ],
  "sso": [
    { name: "Okta", description: "Enterprise SSO and identity management platform", url: "https://www.okta.com", tag: "enterprise" },
    { name: "WorkOS", description: "SSO integration for B2B SaaS apps", url: "https://workos.com", tag: "freemium" },
    { name: "Keycloak", description: "Open-source SSO and identity brokering", url: "https://www.keycloak.org", tag: "free" },
  ],
  "password-policies": [
    { name: "1Password Business", description: "Password manager with policy enforcement", url: "https://1password.com/business", tag: "freemium" },
    { name: "Bitwarden", description: "Open-source password management", url: "https://bitwarden.com", tag: "freemium" },
  ],
  "session-management": [
    { name: "Redis", description: "High-performance session store", url: "https://redis.io", tag: "freemium" },
    { name: "NextAuth.js", description: "Session management for Next.js applications", url: "https://next-auth.js.org", tag: "free" },
  ],
  "abac": [
    { name: "AWS Cedar", description: "Amazon's policy language for ABAC", url: "https://www.cedarpolicy.com", tag: "free" },
    { name: "Axiomatics", description: "Enterprise ABAC policy platform", url: "https://axiomatics.com", tag: "enterprise" },
  ],
  "pbac": [
    { name: "OPA / Rego", description: "Industry-standard policy-as-code engine", url: "https://www.openpolicyagent.org", tag: "free" },
    { name: "Styra DAS", description: "OPA management plane for enterprise", url: "https://www.styra.com", tag: "enterprise" },
  ],
  "zero-trust": [
    { name: "Cloudflare Zero Trust", description: "Network-level zero trust with free tier", url: "https://www.cloudflare.com/zero-trust/", tag: "freemium" },
    { name: "Tailscale", description: "WireGuard-based zero trust networking", url: "https://tailscale.com", tag: "freemium" },
    { name: "Zscaler ZPA", description: "Enterprise zero trust network access", url: "https://www.zscaler.com", tag: "enterprise" },
  ],
  "pam": [
    { name: "CyberArk", description: "Leader in privileged access security", url: "https://www.cyberark.com", tag: "enterprise" },
    { name: "Delinea (Thycotic)", description: "Privileged access management suite", url: "https://delinea.com", tag: "enterprise" },
    { name: "HashiCorp Vault", description: "Secrets management and privileged access", url: "https://www.vaultproject.io", tag: "freemium" },
  ],
  "identity-federation": [
    { name: "Ping Identity", description: "Enterprise identity federation platform", url: "https://www.pingidentity.com", tag: "enterprise" },
    { name: "Shibboleth", description: "Open-source SAML federation for education", url: "https://www.shibboleth.net", tag: "free" },
  ],
  "jit-access": [
    { name: "ConductorOne", description: "Just-in-time access orchestration", url: "https://conductorone.com", tag: "freemium" },
    { name: "Opal", description: "JIT access management for cloud infrastructure", url: "https://opal.dev", tag: "freemium" },
  ],
  "machine-identity": [
    { name: "HashiCorp Vault", description: "Machine identity and secrets management", url: "https://www.vaultproject.io", tag: "freemium" },
    { name: "Venafi", description: "Machine identity management at scale", url: "https://venafi.com", tag: "enterprise" },
    { name: "SPIFFE/SPIRE", description: "Open-source workload identity framework", url: "https://spiffe.io", tag: "free" },
  ],
  "iga": [
    { name: "SailPoint", description: "Identity governance and compliance leader", url: "https://www.sailpoint.com", tag: "enterprise" },
    { name: "Saviynt", description: "Cloud-native identity governance", url: "https://saviynt.com", tag: "enterprise" },
  ],
};
