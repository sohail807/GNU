"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Server,
  Lock,
  FileText,
  KeyRound,
  CheckCircle2,
  Building,
  UserPlus,
  Edit2,
  Sliders,
  AlertTriangle,
  Search,
  Check,
  X,
  RefreshCw,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  APP_MODULES,
  AppModule,
  HospitalRole,
  UserAccessProfile,
  INITIAL_STAFF_USERS,
  DEFAULT_ROLE_PERMISSIONS,
} from "@/lib/access-control";

export default function AdminPage() {
  const [users, setUsers] = useState<UserAccessProfile[]>(INITIAL_STAFF_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal States
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);

  // Selected User for Editing
  const [selectedUser, setSelectedUser] = useState<UserAccessProfile | null>(null);
  const [tempPermissions, setTempPermissions] = useState<Record<AppModule, boolean>>(
    {} as Record<AppModule, boolean>
  );

  // Edit User Form State
  const [editFormData, setEditFormData] = useState({
    name: "",
    department: "",
    role: "reception" as HospitalRole,
    email: "",
    phone: "",
    status: "active" as "active" | "suspended",
  });

  // Add User Form State
  const [newUserData, setNewUserData] = useState({
    username: "",
    name: "",
    role: "reception" as HospitalRole,
    department: "Outpatient Services",
    email: "",
    phone: "+974 4400 1099",
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<
    { id: number; timestamp: string; action: string; operator: string; detail: string }[]
  >([
    {
      id: 1,
      timestamp: "Today, 10:45 AM",
      action: "RBAC Re-Alignment",
      operator: "admin",
      detail: "Configured IST Access Control matrix for Doha Outpatient Clinic personas.",
    },
    {
      id: 2,
      timestamp: "Today, 09:30 AM",
      action: "Zero-Trust Session Issued",
      operator: "admin",
      detail: "Generated authorized token for demo_frontdesk1 with restricted receptionist scope.",
    },
  ]);

  // Load live users from API
  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch {
      // Keep baseline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Open Permission Matrix Modal
  const handleOpenPermissions = (u: UserAccessProfile) => {
    setSelectedUser(u);
    setTempPermissions({ ...u.permissions });
    setIsPermModalOpen(true);
  };

  // Toggle specific permission in matrix
  const handleTogglePermission = (modKey: AppModule) => {
    setTempPermissions((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    setFeedback(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_permissions",
          userId: selectedUser.id,
          username: selectedUser.username,
          permissions: tempPermissions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || users.map((u) => (u.id === selectedUser.id ? { ...u, permissions: tempPermissions } : u)));
        setFeedback(`Permissions successfully updated for ${selectedUser.name} (@${selectedUser.username}).`);
        setIsPermModalOpen(false);

        setAuditLogs((prev) => [
          {
            id: Date.now(),
            timestamp: "Just now",
            action: "Permissions Modified",
            operator: "admin",
            detail: `Updated IST Access Control module permissions for @${selectedUser.username}.`,
          },
          ...prev,
        ]);
      } else {
        setErrorMsg(data.error || "Failed to update permissions.");
      }
    } catch {
      setErrorMsg("Network error saving permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: UserAccessProfile) => {
    setSelectedUser(u);
    setEditFormData({
      name: u.name,
      department: u.department,
      role: u.role,
      email: u.email,
      phone: u.phone,
      status: u.status,
    });
    setIsEditUserModalOpen(true);
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_user",
          userId: selectedUser.id,
          ...editFormData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
        setFeedback(`Staff profile for ${editFormData.name} successfully updated.`);
        setIsEditUserModalOpen(false);
      } else {
        setErrorMsg(data.error || "Failed to update user.");
      }
    } catch {
      setErrorMsg("Network error saving user changes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add New User Submit
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_user",
          ...newUserData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
        setFeedback(`Staff member ${newUserData.name} provisioned with role ${newUserData.role.toUpperCase()}.`);
        setIsAddUserModalOpen(false);
        setNewUserData({
          username: "",
          name: "",
          role: "reception",
          department: "Outpatient Services",
          email: "",
          phone: "+974 4400 1099",
        });
      } else {
        setErrorMsg(data.error || "Failed to provision user.");
      }
    } catch {
      setErrorMsg("Network error adding user.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Action
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          userId: selectedUser.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const tempMsg = data.temporaryPassword ? ` Temporary password: ${data.temporaryPassword}` : "";
        setFeedback(`Password reset successful for @${selectedUser.username}.${tempMsg}`);
        setIsResetPwdModalOpen(false);
      } else {
        setErrorMsg(data.error || "Failed to reset password.");
      }
    } catch {
      setErrorMsg("Network error issuing password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="kicker text-[#0F766E] mb-1">SECURITY & GOVERNANCE · ADMIN CONSOLE</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            IST Access Control & Hospital User Directory
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Governance Standard: <span className="font-semibold text-slate-900">ISO 27799 / Zero-Trust Healthcare RBAC</span> ·
            Active Staff Accounts: <span className="font-mono text-emerald-700 font-bold">{users.length} Certified</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Sync Directory
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddUserModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Provision Staff User
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 font-bold px-2">✕</button>
        </div>
      )}

      {/* AUDIT STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          kicker="RBAC DIRECTORY"
          label="Provisioned Accounts"
          value={users.length}
          subtext="Full Clinical & Admin Personas"
          icon={<Users className="w-5 h-5 text-[#0F766E]" />}
        />
        <StatCard
          kicker="ACCESS CONTROL"
          label="IST RBAC Matrix"
          value="Enforced"
          subtext="Role Boundary Protection"
          icon={<Lock className="w-5 h-5 text-[#0F766E]" />}
        />
        <StatCard
          kicker="DISASTER RECOVERY"
          label="Automated Daily Mirror"
          value="100% Pass"
          subtext="Encrypted Storage Vault"
          icon={<Server className="w-5 h-5 text-[#0F766E]" />}
        />
        <StatCard
          kicker="SECURITY STATUS"
          label="Zero-Trust Auth"
          value="Active"
          subtext="Granular Module Clearance"
          icon={<KeyRound className="w-5 h-5 text-[#0F766E]" />}
        />
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff name, username, or dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0F766E]"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">Administrator</option>
            <option value="reception">Reception / Front Desk</option>
            <option value="nursing">Triage Nursing</option>
            <option value="physician">Attending Physician</option>
            <option value="lab">Diagnostic Laboratory</option>
            <option value="radiology">Digital Radiology</option>
            <option value="cashier">Outpatient Cashier</option>
            <option value="accountant">Financial Auditor</option>
          </select>
        </div>
      </div>

      {/* STAFF USER DIRECTORY TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="kicker text-[#0F766E] block mb-0.5">STAFF DIRECTORY & ACCESS CONTROL</span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Hospital Personnel & Assigned Operational Privileges ({filteredUsers.length})
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-500">
            Doha Central Hospital (Facility #02)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">UID</th>
                <th className="py-3 px-4">Staff Legal Name</th>
                <th className="py-3 px-4">Username / Login</th>
                <th className="py-3 px-4">Hospital Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">IST Module Access Clearance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredUsers.map((u) => {
                const grantedModules = Object.entries(u.permissions || {}).filter(([_, v]) => v).length;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">@{u.username}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-100 border border-slate-200 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.department}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenPermissions(u)}
                          className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                          title="Click to view & edit IST Access Control matrix"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>{grantedModules} / {APP_MODULES.length} Modules</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.status === "active" ? "green" : "red"} size="sm" dot>
                        {u.status === "active" ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEditUser(u)}
                          title="Edit User Details"
                          leftIcon={<Edit2 className="w-3 h-3" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenPermissions(u)}
                          title="Configure Access Permissions"
                          leftIcon={<Sliders className="w-3 h-3" />}
                        >
                          Access
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMINISTRATIVE AUDIT TRAIL LOGS */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="kicker text-[#0F766E] block mb-0.5">GOVERNANCE & COMPLIANCE</span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Real-Time Security & Access Control Audit Log
            </h3>
          </div>
          <Badge variant="teal" size="sm">Audit Stream Active</Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] font-mono text-slate-400">by @{log.operator}</span>
                </div>
                <div className="text-slate-600 text-[11px]">{log.detail}</div>
              </div>
              <div className="font-mono text-[10px] text-slate-400 shrink-0">{log.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: IST ACCESS CONTROL PERMISSION MATRIX */}
      <Modal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title={`IST Access Control Matrix · ${selectedUser?.name}`}
        kicker="SECURITY ACCESS PERMISSIONS"
        size="lg"
      >
        <div className="space-y-5">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">User Profile:</span>
              <span className="font-bold text-slate-900">{selectedUser?.name} (@{selectedUser?.username})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Designated Role:</span>
              <span className="font-mono text-[#0F766E] font-bold uppercase">{selectedUser?.role}</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Toggle checkboxes below to grant or revoke specific operational modules for this user. Changes take effect across navigation and route guards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-1">
            {APP_MODULES.map((mod) => {
              const isChecked = !!tempPermissions[mod.key];
              return (
                <div
                  key={mod.key}
                  onClick={() => handleTogglePermission(mod.key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                    isChecked
                      ? "bg-teal-50/70 border-teal-300 shadow-2xs"
                      : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-white rounded border border-slate-200 font-bold text-slate-600">
                        {mod.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{mod.description}</p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                      isChecked
                        ? "bg-[#0F766E] border-[#0F766E] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedUser) {
                  setTempPermissions({ ...DEFAULT_ROLE_PERMISSIONS[selectedUser.role] });
                }
              }}
            >
              Reset to Role Defaults
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsPermModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSavePermissions}
                isLoading={isLoading}
              >
                Save IST Permissions
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: EDIT USER DETAILS */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title={`Edit Staff Profile · @${selectedUser?.username}`}
        kicker="USER MANAGEMENT"
        size="md"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-4">
          <Input
            label="Staff Full Legal Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assigned Hospital Role"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as HospitalRole })}
              options={[
                { value: "admin", label: "System Administrator" },
                { value: "reception", label: "Front Desk / Receptionist" },
                { value: "nursing", label: "Triage Charge Nurse" },
                { value: "physician", label: "Attending Physician" },
                { value: "lab", label: "Laboratory Technologist" },
                { value: "radiology", label: "Radiology Specialist" },
                { value: "cashier", label: "Outpatient Billing Cashier" },
                { value: "accountant", label: "Financial Auditor / Comptroller" },
              ]}
            />

            <Select
              label="Account Status"
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as "active" | "suspended" })}
              options={[
                { value: "active", label: "Active (Operational)" },
                { value: "suspended", label: "Suspended (Locked)" },
              ]}
            />
          </div>

          <Input
            label="Department / Unit"
            value={editFormData.department}
            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Official Email"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                setIsEditUserModalOpen(false);
                setIsResetPwdModalOpen(true);
              }}
              leftIcon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
            >
              Reset Password
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                Save Profile Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: PROVISION NEW STAFF USER */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Provision New Hospital Staff Account"
        kicker="ONBOARDING REGISTRY"
        size="md"
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username (Login Handle)"
              placeholder="e.g. demo_nurse2"
              value={newUserData.username}
              onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
              required
            />
            <Select
              label="Designated Role"
              value={newUserData.role}
              onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as HospitalRole })}
              options={[
                { value: "reception", label: "Front Desk / Receptionist" },
                { value: "nursing", label: "Triage Charge Nurse" },
                { value: "physician", label: "Attending Physician" },
                { value: "lab", label: "Laboratory Technologist" },
                { value: "radiology", label: "Radiology Specialist" },
                { value: "cashier", label: "Outpatient Billing Cashier" },
                { value: "accountant", label: "Financial Auditor" },
                { value: "admin", label: "System Administrator" },
              ]}
            />
          </div>

          <Input
            label="Staff Full Legal Name"
            placeholder="e.g. Dr. Omar Al-Sulaiti, MD"
            value={newUserData.name}
            onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
            required
          />

          <Input
            label="Department / Unit"
            placeholder="e.g. Pediatric Outpatient Clinic"
            value={newUserData.department}
            onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              placeholder="name@ist-health.qa"
              type="email"
              value={newUserData.email}
              onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+974 4400 1099"
              value={newUserData.phone}
              onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              Provision Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: RESET PASSWORD */}
      <Modal
        isOpen={isResetPwdModalOpen}
        onClose={() => setIsResetPwdModalOpen(false)}
        title={`Reset Password · @${selectedUser?.username}`}
        kicker="SECURITY CREDENTIAL MANAGEMENT"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to generate a new password credential for <strong className="text-slate-900">{selectedUser?.name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Zero-Trust Policy</span>
            </div>
            <p className="text-[11px] text-amber-700">
              The user will be required to change their temporary credential on their next portal login.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsResetPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleResetPassword}
              isLoading={isLoading}
            >
              Issue Password Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
