"use client";

import { useState } from "react";
import { Role, UserStatus } from "@prisma/client";
import {
  updateUserRoleAction,
  toggleUserSuspensionAction,
  forceUserLogoutAction,
  softDeleteUserAction,
  adminResetUserPasswordAction,
} from "@/app/actions/admin";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: Date | null;
  createdAt: Date;
  image: string | null;
}

export default function UsersClient({
  initialUsers,
  superAdminEmail,
  currentAdminRole,
}: {
  initialUsers: UserItem[];
  superAdminEmail: string;
  currentAdminRole: Role;
}) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New password modal state
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const isSuperAdminAccount = (u: UserItem) =>
    u.role === Role.SUPER_ADMIN || u.email.toLowerCase() === superAdminEmail.toLowerCase();

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setLoading(true);
    setMessage(null);
    try {
      await updateUserRoleAction(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }
      setMessage({ text: "User role updated successfully", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update role", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (user: UserItem) => {
    if (isSuperAdminAccount(user)) return;
    const willSuspend = user.status !== UserStatus.SUSPENDED;
    if (
      !confirm(
        `Are you sure you want to ${willSuspend ? "suspend" : "unsuspend"} ${user.email}?`
      )
    )
      return;

    setLoading(true);
    setMessage(null);
    try {
      await toggleUserSuspensionAction(user.id, willSuspend);
      const newStatus = willSuspend ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setMessage({
        text: `User ${willSuspend ? "suspended" : "unsuspended"} successfully`,
        type: "success",
      });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed action", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (user: UserItem) => {
    setLoading(true);
    setMessage(null);
    try {
      await forceUserLogoutAction(user.id);
      setMessage({ text: `Revoked all active sessions for ${user.email}`, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to revoke sessions", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (user: UserItem) => {
    if (isSuperAdminAccount(user)) return;
    if (!confirm(`Warning: Soft delete ${user.email}? User will lose access to the platform.`))
      return;

    setLoading(true);
    setMessage(null);
    try {
      await softDeleteUserAction(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: UserStatus.DELETED } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
      setMessage({ text: `Account for ${user.email} marked as deleted.`, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to delete user", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalUser || !newPassword) return;
    setLoading(true);
    try {
      await adminResetUserPasswordAction(resetModalUser.id, newPassword);
      setMessage({ text: `Password reset successfully for ${resetModalUser.email}`, type: "success" });
      setResetModalUser(null);
      setNewPassword("");
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to reset password", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: "csv" | "json") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(filteredUsers, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${Date.now()}.json`;
      a.click();
    } else {
      const headers = ["ID", "Name", "Email", "Role", "Status", "EmailVerified", "CreatedAt"];
      const rows = filteredUsers.map((u) => [
        u.id,
        `"${u.name || ""}"`,
        u.email,
        u.role,
        u.status,
        Boolean(u.emailVerified),
        new Date(u.createdAt).toISOString(),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
            [ ADMIN / USERS ]
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
            User Management ({filteredUsers.length})
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Inspect accounts, manage privileges, and review safety status.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => exportData("csv")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#94a3b8",
              fontSize: 12,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => exportData("json")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#94a3b8",
              fontSize: 12,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 8,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${
              message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
            }`,
            color: message.type === "success" ? "#4ade80" : "#f87171",
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "1rem",
          borderRadius: 12,
          background: "rgba(14,12,22,0.75)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name or email…"
            style={{
              width: "100%",
              padding: "0.5rem 0.85rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "#f8fafc",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>ROLE:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0e0c16",
              color: "#f8fafc",
              fontSize: 12,
              fontFamily: "monospace",
              outline: "none",
            }}
          >
            <option value="ALL">ALL ROLES</option>
            <option value="STUDENT">STUDENT</option>
            <option value="INSTRUCTOR">INSTRUCTOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0e0c16",
              color: "#f8fafc",
              fontSize: 12,
              fontFamily: "monospace",
              outline: "none",
            }}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DELETED">DELETED</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: "rgba(14,12,22,0.75)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>USER</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>ROLE</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>STATUS</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>VERIFIED</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>JOINED</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b", textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No users matched your query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSuper = isSuperAdminAccount(u);
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: selectedUser?.id === u.id ? "rgba(180,240,0,0.04)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: u.image || "linear-gradient(135deg, #7c3aed, #4c1d95)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>
                            {u.name || "Unnamed"}
                          </div>
                          <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          padding: "3px 8px",
                          borderRadius: 4,
                          letterSpacing: "0.08em",
                          background:
                            u.role === Role.SUPER_ADMIN
                              ? "rgba(180,240,0,0.15)"
                              : u.role === Role.ADMIN
                              ? "rgba(147,51,234,0.15)"
                              : "rgba(255,255,255,0.05)",
                          color:
                            u.role === Role.SUPER_ADMIN
                              ? "#b4f000"
                              : u.role === Role.ADMIN
                              ? "#c084fc"
                              : "#94a3b8",
                          border: `1px solid ${
                            u.role === Role.SUPER_ADMIN
                              ? "rgba(180,240,0,0.3)"
                              : u.role === Role.ADMIN
                              ? "rgba(147,51,234,0.3)"
                              : "rgba(255,255,255,0.1)"
                          }`,
                        }}
                      >
                        [ {u.role} ]
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "monospace",
                          color:
                            u.status === UserStatus.ACTIVE
                              ? "#4ade80"
                              : u.status === UserStatus.SUSPENDED
                              ? "#f87171"
                              : "#64748b",
                        }}
                      >
                        ● {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {u.emailVerified ? (
                        <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>✓ Verified</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#fb923c", fontFamily: "monospace" }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedUser(u)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#c084fc",
                          fontSize: 12,
                          fontFamily: "monospace",
                          cursor: "pointer",
                        }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail & Actions Modal */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              background: "#0c0a14",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.1em" }}>
                  [ USER DETAILS ]
                </p>
                <h3 style={{ fontSize: 18, color: "#f8fafc", fontWeight: 700, marginTop: 4 }}>
                  {selectedUser.name || "No name set"}
                </h3>
                <p style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
                  {selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {isSuperAdminAccount(selectedUser) ? (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: 8,
                  background: "rgba(180,240,0,0.08)",
                  border: "1px solid rgba(180,240,0,0.25)",
                  color: "#b4f000",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                👑 Official Super Admin account. Immutable and protected from modification.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Role Switcher */}
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 6 }}>
                    CHANGE ROLE:
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN].map((r) => {
                      const isCurrent = selectedUser.role === r;
                      return (
                        <button
                          key={r}
                          disabled={loading || isCurrent}
                          onClick={() => handleRoleChange(selectedUser.id, r)}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            borderRadius: 6,
                            background: isCurrent ? "rgba(180,240,0,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isCurrent ? "#b4f000" : "rgba(255,255,255,0.1)"}`,
                            color: isCurrent ? "#b4f000" : "#94a3b8",
                            fontSize: 11,
                            fontFamily: "monospace",
                            cursor: isCurrent ? "default" : "pointer",
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dangerous Actions */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <p style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>MANAGEMENT ACTIONS:</p>

                  <button
                    disabled={loading}
                    onClick={() => handleToggleSuspend(selectedUser)}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: 8,
                      background:
                        selectedUser.status === UserStatus.SUSPENDED
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(239,68,68,0.1)",
                      border: `1px solid ${
                        selectedUser.status === UserStatus.SUSPENDED
                          ? "rgba(34,197,94,0.3)"
                          : "rgba(239,68,68,0.3)"
                      }`,
                      color: selectedUser.status === UserStatus.SUSPENDED ? "#4ade80" : "#f87171",
                      fontSize: 12,
                      fontFamily: "monospace",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {selectedUser.status === UserStatus.SUSPENDED ? "✓ Unsuspend Account" : "⊘ Suspend Account"}
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleForceLogout(selectedUser)}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#94a3b8",
                      fontSize: 12,
                      fontFamily: "monospace",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    ⚡ Force Logout (Revoke All Sessions)
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => {
                      setResetModalUser(selectedUser);
                      setSelectedUser(null);
                    }}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#94a3b8",
                      fontSize: 12,
                      fontFamily: "monospace",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    🔑 Set New Password Directly
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleSoftDelete(selectedUser)}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: 8,
                      background: "rgba(239,68,68,0.05)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#f87171",
                      fontSize: 12,
                      fontFamily: "monospace",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    🗑 Soft Delete User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "1rem",
          }}
          onClick={() => setResetModalUser(null)}
        >
          <div
            style={{
              background: "#0c0a14",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              maxWidth: 420,
              width: "100%",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, color: "#f8fafc", fontWeight: 700 }}>
              Reset Password for {resetModalUser.email}
            </h3>
            <p style={{ fontSize: 12, color: "#64748b" }}>
              Enter a temporary or replacement password (min 8 characters):
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password…"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setResetModalUser(null)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={loading || newPassword.length < 8}
                onClick={handleResetPassword}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  background: "#b4f000",
                  border: "none",
                  color: "#000",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
