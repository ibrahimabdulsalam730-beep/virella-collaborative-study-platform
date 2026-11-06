"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { updateUserRoleAction, forceUserLogoutAction } from "@/app/actions/admin";

interface AdminRecord {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
  twoFactorEnabled?: boolean;
}

export default function AdminsClient({
  admins,
  superAdminEmail,
}: {
  admins: AdminRecord[];
  superAdminEmail: string;
}) {
  const [list, setList] = useState<AdminRecord[]>(admins);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const isOfficialSuperAdmin = (email: string) =>
    email.toLowerCase().trim() === superAdminEmail.toLowerCase().trim();

  const handleDemote = async (target: AdminRecord) => {
    if (isOfficialSuperAdmin(target.email) || target.role === Role.SUPER_ADMIN) {
      alert("The super admin cannot be demoted, suspended, or deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to revoke admin privileges for ${target.email}?`)) return;

    setLoading(true);
    setMsg(null);
    try {
      await updateUserRoleAction(target.id, Role.INSTRUCTOR);
      setList((prev) => prev.filter((a) => a.id !== target.id));
      setMsg({ text: `Revoked admin role for ${target.email}. Role set to INSTRUCTOR.`, type: "success" });
    } catch (err: any) {
      setMsg({ text: err.message || "Failed to demote admin", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSessions = async (target: AdminRecord) => {
    setLoading(true);
    try {
      await forceUserLogoutAction(target.id);
      setMsg({ text: `Revoked all active sessions for ${target.email}`, type: "success" });
    } catch (err: any) {
      setMsg({ text: err.message || "Failed to revoke sessions", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#b4f000", letterSpacing: "0.12em" }}>
            [ SUPER_ADMIN / ADMINS ]
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
            Administrator Privileges & Access
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Manage elevated permissions, inspect 2FA security status, and oversee the platform administration roster.
          </p>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 8,
            fontSize: 13,
            background: msg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${msg.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: msg.type === "success" ? "#4ade80" : "#f87171",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Roster Table */}
      <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>ADMINISTRATOR</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>ROLE</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>2FA TOTP</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>SINCE</th>
              <th style={{ padding: "0.85rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b", textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {list.map((adm) => {
              const isSuper = isOfficialSuperAdmin(adm.email) || adm.role === Role.SUPER_ADMIN;
              return (
                <tr key={adm.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>
                      {adm.name || "Admin"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                      {adm.email} {isSuper && "👑 (Permanent Super Admin)"}
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
                        background: isSuper ? "rgba(180,240,0,0.12)" : "rgba(147,51,234,0.12)",
                        border: `1px solid ${isSuper ? "rgba(180,240,0,0.3)" : "rgba(147,51,234,0.3)"}`,
                        color: isSuper ? "#b4f000" : "#c084fc",
                      }}
                    >
                      [ {adm.role} ]
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: adm.twoFactorEnabled ? "#4ade80" : "#fb923c" }}>
                      {adm.twoFactorEnabled ? "● Enabled" : "○ Recommended"}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                    {new Date(adm.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                    {isSuper ? (
                      <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>Protected</span>
                    ) : (
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button
                          disabled={loading}
                          onClick={() => handleRevokeSessions(adm)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#94a3b8",
                            fontSize: 11,
                            fontFamily: "monospace",
                            cursor: "pointer",
                          }}
                        >
                          Revoke Sessions
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => handleDemote(adm)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#f87171",
                            fontSize: 11,
                            fontFamily: "monospace",
                            cursor: "pointer",
                          }}
                        >
                          Demote
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
