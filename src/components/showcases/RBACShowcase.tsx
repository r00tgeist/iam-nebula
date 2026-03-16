import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, User, ChevronRight, CheckCircle2 } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Role { id: string; label: string; color: string; permissions: string[] }
interface UserItem { id: string; name: string; department: string }

const ROLES: Role[] = [
  { id: "viewer", label: "Viewer", color: "text-green-400 border-green-500/20 bg-green-500/10", permissions: ["View dashboards", "Read documents", "Export reports"] },
  { id: "editor", label: "Editor", color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10", permissions: ["View dashboards", "Read documents", "Export reports", "Edit documents", "Upload files", "Create comments"] },
  { id: "manager", label: "Manager", color: "text-orange-400 border-orange-500/20 bg-orange-500/10", permissions: ["View dashboards", "Read documents", "Export reports", "Edit documents", "Upload files", "Create comments", "Approve requests", "Manage team members", "View audit logs"] },
  { id: "admin", label: "Admin", color: "text-destructive border-destructive/20 bg-destructive/10", permissions: ["View dashboards", "Read documents", "Export reports", "Edit documents", "Upload files", "Create comments", "Approve requests", "Manage team members", "View audit logs", "System configuration", "User management", "Billing access"] },
];

const USERS: UserItem[] = [
  { id: "u1", name: "Alex K.", department: "Engineering" },
  { id: "u2", name: "Maria P.", department: "Marketing" },
  { id: "u3", name: "Jordan L.", department: "Finance" },
  { id: "u4", name: "Sam W.", department: "Operations" },
];

const RBACShowcase = () => {
  const [assignments, setAssignments] = useState<Record<string, string>>({ u1: "editor", u2: "viewer", u3: "viewer", u4: "manager" });
  const [selectedUser, setSelectedUser] = useState<string>("u1");

  const assignRole = (userId: string, roleId: string) => {
    setAssignments(prev => ({ ...prev, [userId]: roleId }));
  };

  const selectedUserData = USERS.find(u => u.id === selectedUser)!;
  const selectedRole = ROLES.find(r => r.id === assignments[selectedUser])!;

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Role-Based Access Control</h2>
      <p className="text-sm text-muted-foreground mb-8">Assign roles to users. Permissions are inherited from the role, not set individually. Click a user, then pick their role.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users + Role assignment */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Users</p>
          <div className="space-y-2 mb-6">
            {USERS.map(u => {
              const role = ROLES.find(r => r.id === assignments[u.id])!;
              const isSelected = selectedUser === u.id;
              return (
                <motion.button key={u.id} onClick={() => setSelectedUser(u.id)} layout transition={spring}
                  className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all ${isSelected ? "border-primary/30 bg-primary/[0.03]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isSelected ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{u.name}</p>
                    <p className="text-[10px] text-muted-foreground/60">{u.department}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-1 rounded-md border ${role.color}`}>{role.label}</span>
                </motion.button>
              );
            })}
          </div>

          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Assign Role to {selectedUserData.name}</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(r => {
              const isAssigned = assignments[selectedUser] === r.id;
              return (
                <button key={r.id} onClick={() => assignRole(selectedUser, r.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${isAssigned ? `${r.color} font-semibold` : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.1)]"}`}>
                  <Shield size={14} />
                  <span className="text-xs">{r.label}</span>
                  {isAssigned && <CheckCircle2 size={12} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Effective permissions */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Effective Permissions for {selectedUserData.name}
          </p>
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedRole.color}`}>
                <Shield size={14} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedRole.label} Role</p>
                <p className="text-[10px] text-muted-foreground font-mono">{selectedRole.permissions.length} permissions inherited</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {selectedRole.permissions.map((p, i) => (
                  <motion.div key={p} initial={{ opacity: 0, x: -10, height: 0 }} animate={{ opacity: 1, x: 0, height: "auto" }} exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ ...spring, delay: i * 0.03 }}
                    className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-2">
                    <CheckCircle2 size={11} className={selectedRole.color.split(" ")[0]} />
                    <span className="text-[11px] text-muted-foreground">{p}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.02] p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold mb-1">How RBAC Works</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Permissions bind to <span className="text-foreground">roles</span>, not users. When {selectedUserData.name}'s role changes, all permissions update instantly. No per-user permission management needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACShowcase;
