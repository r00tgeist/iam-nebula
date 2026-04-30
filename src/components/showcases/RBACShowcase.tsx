import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, User, CheckCircle2, AlertTriangle, GitBranch, Layers, XCircle } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

// ─── Hierarchy: each role inherits from listed parents ───────────────
interface Role {
  id: string;
  label: string;
  inherits: string[];
  ownPerms: string[];
  color: string;
}

const ROLES: Role[] = [
  { id: "viewer",   label: "Viewer",   inherits: [],                  ownPerms: ["docs:read"],
    color: "text-green-400 border-green-500/20 bg-green-500/10" },
  { id: "editor",   label: "Editor",   inherits: ["viewer"],          ownPerms: ["docs:write", "docs:comment"],
    color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" },
  { id: "approver", label: "Approver", inherits: ["viewer"],          ownPerms: ["docs:approve"],
    color: "text-orange-400 border-orange-500/20 bg-orange-500/10" },
  { id: "manager",  label: "Manager",  inherits: ["editor"],          ownPerms: ["team:manage", "logs:read"],
    color: "text-primary border-primary/20 bg-primary/10" },
  { id: "admin",    label: "Admin",    inherits: ["manager"],         ownPerms: ["users:manage", "settings:write", "billing:read"],
    color: "text-secondary border-secondary/20 bg-secondary/10" },
  { id: "auditor",  label: "Auditor",  inherits: [],                  ownPerms: ["logs:read", "logs:export"],
    color: "text-destructive border-destructive/20 bg-destructive/10" },
];

// SoD constraints: never assign both roles to the same person.
const SOD_CONFLICTS: [string, string, string][] = [
  ["editor",   "approver", "Same user can't author and approve"],
  ["editor",   "auditor",  "Auditors must not have write access"],
  ["admin",    "auditor",  "Admins must not audit themselves"],
];

interface UserItem { id: string; name: string; department: string }

const USERS: UserItem[] = [
  { id: "u1", name: "Alex K.",   department: "Engineering" },
  { id: "u2", name: "Maria P.",  department: "Marketing" },
  { id: "u3", name: "Jordan L.", department: "Finance" },
  { id: "u4", name: "Sam W.",    department: "Operations" },
];

// expand inheritance to compute full effective role set
const expand = (roleId: string, acc = new Set<string>()): Set<string> => {
  if (acc.has(roleId)) return acc;
  acc.add(roleId);
  const r = ROLES.find(x => x.id === roleId);
  r?.inherits.forEach(p => expand(p, acc));
  return acc;
};

const effectivePerms = (assignedRoles: Set<string>): { perm: string; from: string }[] => {
  const out = new Map<string, string>();
  assignedRoles.forEach(rid => {
    expand(rid).forEach(eid => {
      const r = ROLES.find(x => x.id === eid)!;
      r.ownPerms.forEach(p => { if (!out.has(p)) out.set(p, r.label); });
    });
  });
  return [...out].map(([perm, from]) => ({ perm, from }));
};

const findConflicts = (assigned: Set<string>): { a: string; b: string; reason: string }[] => {
  const out: { a: string; b: string; reason: string }[] = [];
  SOD_CONFLICTS.forEach(([a, b, reason]) => {
    if (assigned.has(a) && assigned.has(b)) out.push({ a, b, reason });
  });
  return out;
};

const RBACShowcase = () => {
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>({
    u1: new Set(["editor"]),
    u2: new Set(["viewer"]),
    u3: new Set(["approver", "viewer"]),
    u4: new Set(["manager"]),
  });
  const [selectedUser, setSelectedUser] = useState<string>("u1");

  const userRoles = assignments[selectedUser];
  const expandedRoles = useMemo(() => {
    const all = new Set<string>();
    userRoles.forEach(r => expand(r).forEach(x => all.add(x)));
    return all;
  }, [userRoles]);
  const perms = useMemo(() => effectivePerms(userRoles), [userRoles]);
  const conflicts = useMemo(() => findConflicts(userRoles), [userRoles]);

  const toggleRole = (uid: string, rid: string) => {
    setAssignments(prev => {
      const next = new Set(prev[uid]);
      next.has(rid) ? next.delete(rid) : next.add(rid);
      return { ...prev, [uid]: next };
    });
  };

  // Role explosion stat: total distinct (role × resource) combinations across the org
  const explosion = useMemo(() => {
    let count = 0;
    Object.values(assignments).forEach(roles => {
      const exp = new Set<string>();
      roles.forEach(r => expand(r).forEach(x => exp.add(x)));
      count += effectivePerms(roles).length;
    });
    return count;
  }, [assignments]);

  const selectedUserData = USERS.find(u => u.id === selectedUser)!;

  return (
    <div className="glass-card overflow-hidden p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Role-Based Access Control</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Roles form a <span className="text-foreground">DAG</span> — children inherit parent permissions. Multiple roles per
        user trigger <span className="text-foreground">Separation-of-Duties</span> conflicts. Watch for <span className="text-foreground">role explosion</span>
        as you stack assignments.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users + assignment */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Users</p>
          <div className="space-y-2 mb-5">
            {USERS.map(u => {
              const conflictCount = findConflicts(assignments[u.id]).length;
              return (
                <button key={u.id} onClick={() => setSelectedUser(u.id)}
                  className={`flex items-center gap-3 w-full rounded-xl border px-4 py-2.5 text-left transition-all ${selectedUser === u.id ? "border-primary/30 bg-primary/[0.03]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${selectedUser === u.id ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${selectedUser === u.id ? "text-foreground" : "text-muted-foreground"}`}>{u.name}</p>
                    <p className="text-[10px] text-muted-foreground/60">{u.department}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...assignments[u.id]].map(rid => {
                      const r = ROLES.find(x => x.id === rid)!;
                      return <span key={rid} className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${r.color}`}>{r.label}</span>;
                    })}
                    {conflictCount > 0 && <AlertTriangle size={11} className="text-destructive ml-1" />}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Assign roles to {selectedUserData.name}
          </p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {ROLES.map(r => {
              const has = assignments[selectedUser].has(r.id);
              return (
                <button key={r.id} onClick={() => toggleRole(selectedUser, r.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${has ? `${r.color} font-semibold` : "border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.1)]"}`}>
                  <Shield size={12} />
                  <span className="text-[11px]">{r.label}</span>
                  {has && <CheckCircle2 size={10} className="ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* SoD conflicts */}
          {conflicts.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-3 mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-destructive" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-destructive font-semibold">SoD Violation ({conflicts.length})</span>
              </div>
              {conflicts.map((c, i) => (
                <p key={i} className="text-[10px] text-muted-foreground"><span className="text-foreground font-mono">{c.a} ⊕ {c.b}</span> — {c.reason}</p>
              ))}
            </motion.div>
          )}
        </div>

        {/* Effective permissions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Effective permissions
            </p>
            <span className="text-[9px] font-mono text-muted-foreground/60 flex items-center gap-1">
              <GitBranch size={9} /> via inheritance
            </span>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[rgba(255,255,255,0.04)]">
              <Layers size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">Resolved chain:</span>
              <span className="text-[10px] font-mono text-foreground truncate">{[...expandedRoles].join(" ⇐ ")}</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {perms.map(({ perm, from }, i) => (
                  <motion.div key={perm} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ ...spring, delay: i * 0.02 }}
                    className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-1.5">
                    <CheckCircle2 size={10} className="text-green-400 shrink-0" />
                    <span className="text-[10px] font-mono text-foreground flex-1 truncate">{perm}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/50">via {from}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {perms.length === 0 && <p className="text-[10px] text-muted-foreground/50">No roles assigned — no permissions.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-3">
              <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Roles in chain</p>
              <p className="text-lg font-display font-bold text-foreground">{expandedRoles.size}</p>
              <p className="text-[9px] text-muted-foreground/50">{userRoles.size} direct + {expandedRoles.size - userRoles.size} inherited</p>
            </div>
            <div className={`rounded-xl border p-3 ${explosion > 25 ? "border-orange-500/20 bg-orange-500/[0.03]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)]"}`}>
              <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Org-wide assignments</p>
              <p className={`text-lg font-display font-bold ${explosion > 25 ? "text-orange-400" : "text-foreground"}`}>{explosion}</p>
              <p className="text-[9px] text-muted-foreground/50">{explosion > 25 ? "role explosion warning" : "manageable"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACShowcase;
