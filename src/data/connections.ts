export interface ConnectionNode {
  id: string;
  label: string;
  icon: string;
}

export interface ConceptConnections {
  conceptId: string;
  nodes: ConnectionNode[];
}

export const connections: ConceptConnections[] = [
  {
    conceptId: "authn",
    nodes: [
      { id: "passwords", label: "Passwords", icon: "Lock" },
      { id: "biometrics", label: "Biometrics", icon: "Fingerprint" },
      { id: "oauth", label: "OAuth 2.0", icon: "ExternalLink" },
      { id: "saml", label: "SAML", icon: "FileJson" },
      { id: "mfa-conn", label: "MFA", icon: "ShieldCheck" },
      { id: "sso-conn", label: "SSO", icon: "LogIn" },
    ],
  },
  {
    conceptId: "authz",
    nodes: [
      { id: "rbac-conn", label: "RBAC", icon: "Users" },
      { id: "abac-conn", label: "ABAC", icon: "SlidersHorizontal" },
      { id: "permissions", label: "Permissions", icon: "Key" },
      { id: "policies", label: "Access Policies", icon: "FileJson" },
      { id: "scopes", label: "OAuth Scopes", icon: "Target" },
      { id: "claims", label: "Token Claims", icon: "Tag" },
    ],
  },
  {
    conceptId: "least-privilege",
    nodes: [
      { id: "access-reviews", label: "Access Reviews", icon: "ClipboardCheck" },
      { id: "jit-conn", label: "JIT Access", icon: "Clock" },
      { id: "pam-conn", label: "PAM", icon: "Crown" },
      { id: "sod", label: "Separation of Duties", icon: "Split" },
      { id: "permission-boundaries", label: "Permission Boundaries", icon: "Square" },
      { id: "blast-radius", label: "Blast Radius Reduction", icon: "Shield" },
    ],
  },
  {
    conceptId: "rbac",
    nodes: [
      { id: "user-groups", label: "User Groups", icon: "Users" },
      { id: "permission-sets", label: "Permission Sets", icon: "Key" },
      { id: "role-hierarchy", label: "Role Hierarchy", icon: "GitBranch" },
      { id: "aws-iam", label: "AWS IAM Roles", icon: "Cloud" },
      { id: "azure-ad", label: "Azure AD Roles", icon: "Cloud" },
      { id: "gcp-iam", label: "GCP IAM", icon: "Cloud" },
      { id: "sod-rbac", label: "Separation of Duties", icon: "Split" },
      { id: "access-reviews-rbac", label: "Access Reviews", icon: "ClipboardCheck" },
    ],
  },
  {
    conceptId: "mfa",
    nodes: [
      { id: "totp", label: "TOTP Codes", icon: "Smartphone" },
      { id: "hardware-keys", label: "Hardware Keys", icon: "Usb" },
      { id: "push-notif", label: "Push Notifications", icon: "Bell" },
      { id: "sms-codes", label: "SMS Codes", icon: "MessageSquare" },
      { id: "biometrics-mfa", label: "Biometrics", icon: "Fingerprint" },
      { id: "risk-based", label: "Risk-Based MFA", icon: "AlertTriangle" },
    ],
  },
  {
    conceptId: "sso",
    nodes: [
      { id: "saml-sso", label: "SAML 2.0", icon: "FileJson" },
      { id: "oidc", label: "OpenID Connect", icon: "Globe" },
      { id: "idp", label: "Identity Provider", icon: "Server" },
      { id: "sp", label: "Service Provider", icon: "Monitor" },
      { id: "session-tokens", label: "Session Tokens", icon: "Key" },
      { id: "federation-sso", label: "Federation", icon: "Network" },
    ],
  },
  {
    conceptId: "password-policies",
    nodes: [
      { id: "complexity", label: "Complexity Rules", icon: "ShieldCheck" },
      { id: "rotation", label: "Rotation Schedule", icon: "RefreshCw" },
      { id: "breach-check", label: "Breach Database", icon: "AlertTriangle" },
      { id: "password-manager", label: "Password Managers", icon: "Database" },
      { id: "passwordless", label: "Passwordless Auth", icon: "Fingerprint" },
      { id: "hash-salt", label: "Hashing & Salting", icon: "Hash" },
    ],
  },
  {
    conceptId: "session-management",
    nodes: [
      { id: "timeouts", label: "Session Timeouts", icon: "Timer" },
      { id: "jwt", label: "JWT Tokens", icon: "FileJson" },
      { id: "refresh-tokens", label: "Refresh Tokens", icon: "RefreshCw" },
      { id: "revocation", label: "Token Revocation", icon: "XCircle" },
      { id: "concurrent", label: "Concurrent Limits", icon: "Users" },
      { id: "session-fixation", label: "Fixation Prevention", icon: "Shield" },
    ],
  },
  {
    conceptId: "abac",
    nodes: [
      { id: "user-attrs", label: "User Attributes", icon: "User" },
      { id: "resource-attrs", label: "Resource Attributes", icon: "Database" },
      { id: "env-context", label: "Environment Context", icon: "Globe" },
      { id: "xacml", label: "XACML", icon: "FileJson" },
      { id: "policy-engine", label: "Policy Engine", icon: "Cpu" },
      { id: "dynamic-authz", label: "Dynamic Authorization", icon: "Zap" },
    ],
  },
  {
    conceptId: "pbac",
    nodes: [
      { id: "opa", label: "Open Policy Agent", icon: "Shield" },
      { id: "rego", label: "Rego Language", icon: "Code" },
      { id: "pdp", label: "Policy Decision Point", icon: "Cpu" },
      { id: "pep", label: "Policy Enforcement", icon: "ShieldCheck" },
      { id: "policy-repo", label: "Policy Repository", icon: "GitBranch" },
      { id: "audit-log", label: "Audit Logging", icon: "FileText" },
    ],
  },
  {
    conceptId: "zero-trust",
    nodes: [
      { id: "identity-verify", label: "Identity Verification", icon: "UserCheck" },
      { id: "device-posture", label: "Device Posture Check", icon: "Smartphone" },
      { id: "micro-seg", label: "Micro-Segmentation", icon: "Grid3x3" },
      { id: "continuous-monitor", label: "Continuous Monitoring", icon: "Activity" },
      { id: "least-priv-zt", label: "Least Privilege", icon: "Minimize2" },
      { id: "encryption", label: "Encryption in Transit", icon: "Lock" },
      { id: "sase", label: "SASE / SSE", icon: "Cloud" },
      { id: "conditional-access", label: "Conditional Access", icon: "GitBranch" },
    ],
  },
  {
    conceptId: "pam",
    nodes: [
      { id: "vault", label: "Secret Vaults", icon: "Lock" },
      { id: "session-recording", label: "Session Recording", icon: "Video" },
      { id: "credential-rotation", label: "Credential Rotation", icon: "RefreshCw" },
      { id: "breakglass", label: "Break-Glass Access", icon: "AlertTriangle" },
      { id: "admin-bastion", label: "Bastion Hosts", icon: "Server" },
      { id: "privilege-elevation", label: "Privilege Elevation", icon: "ArrowUp" },
    ],
  },
  {
    conceptId: "identity-federation",
    nodes: [
      { id: "trust-relationships", label: "Trust Relationships", icon: "Handshake" },
      { id: "saml-fed", label: "SAML Federation", icon: "FileJson" },
      { id: "oidc-fed", label: "OIDC Federation", icon: "Globe" },
      { id: "cross-domain", label: "Cross-Domain Trust", icon: "Network" },
      { id: "idp-broker", label: "IdP Brokering", icon: "Server" },
      { id: "attribute-mapping", label: "Attribute Mapping", icon: "Map" },
    ],
  },
  {
    conceptId: "jit-access",
    nodes: [
      { id: "approval-workflow", label: "Approval Workflows", icon: "CheckCircle" },
      { id: "time-bound", label: "Time-Bound Access", icon: "Timer" },
      { id: "auto-revoke", label: "Auto-Revocation", icon: "XCircle" },
      { id: "access-request", label: "Access Requests", icon: "MessageSquare" },
      { id: "audit-trail", label: "Audit Trail", icon: "FileText" },
      { id: "pam-jit", label: "PAM Integration", icon: "Crown" },
    ],
  },
  {
    conceptId: "machine-identity",
    nodes: [
      { id: "api-keys", label: "API Keys", icon: "Key" },
      { id: "certificates", label: "X.509 Certificates", icon: "Award" },
      { id: "workload-id", label: "Workload Identity", icon: "Cpu" },
      { id: "secret-mgmt", label: "Secret Management", icon: "Lock" },
      { id: "service-mesh", label: "Service Mesh", icon: "Network" },
      { id: "mtls", label: "Mutual TLS", icon: "ShieldCheck" },
    ],
  },
  {
    conceptId: "iga",
    nodes: [
      { id: "provisioning", label: "Auto-Provisioning", icon: "UserPlus" },
      { id: "deprovisioning", label: "De-Provisioning", icon: "UserMinus" },
      { id: "access-certification", label: "Access Certification", icon: "ClipboardCheck" },
      { id: "compliance", label: "Compliance Reporting", icon: "FileText" },
      { id: "lifecycle", label: "Identity Lifecycle", icon: "RefreshCw" },
      { id: "entitlement-mgmt", label: "Entitlement Mgmt", icon: "Settings" },
    ],
  },
];
