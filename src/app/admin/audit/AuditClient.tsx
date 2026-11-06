"use client";

import { useState } from "react";

interface AuditItem {
  id: string;
  action: string;
  userName?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  metadata?: string | null;
  createdAt: Date;
}

export default function AuditClient({ initialLogs }: { initialLogs: AuditItem[] }) {
  const [logs] = useState<AuditItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [actionCategory, setActionCategory] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(search.toLowerCase())) ||
      (l.metadata && l.metadata.toLowerCase().includes(search.toLowerCase()));

    const matchesCat =
      actionCategory === "ALL" || l.action.startsWith(actionCategory);

    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
          [ ADMIN / AUDIT LOG ]
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
          Security & Immutable Audit Trail ({filtered.length})
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Tamper-evident chronological record of privilege grants, suspensions, room actions, and authentication security events.
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action, email, or payload…"
          style={{
            flex: 1,
            minWidth: 260,
            padding: "0.5rem 0.85rem",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            color: "#f8fafc",
            fontSize: 13,
            outline: "none",
          }}
        />
        <select
          value={actionCategory}
          onChange={(e) => setActionCategory(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#0e0c16",
            color: "#f8fafc",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          <option value="ALL">ALL CATEGORIES</option>
          <option value="ADMIN_">ADMIN ACTIONS</option>
          <option value="AUTH_">AUTH & LOGIN</option>
          <option value="DATABASE_">SYSTEM & SEED</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>TIMESTAMP</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>ACTION EVENT</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>ACTOR</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>IP ADDRESS</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b", textAlign: "right" }}>PAYLOAD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No audit log entries matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: log.action.includes("FAILED") || log.action.includes("SUSPENDED") || log.action.includes("BLOCKED")
                        ? "#f87171"
                        : log.action.startsWith("ADMIN_")
                        ? "#b4f000"
                        : "#c084fc",
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: 12, color: "#f8fafc" }}>{log.userName || "System"}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{log.userEmail || "system@virella.edu"}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    {log.metadata ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}
                      >
                        Inspect Payload
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#475569" }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: "#0c0a14",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#b4f000" }}>{selectedLog.action}</span>
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{new Date(selectedLog.createdAt).toISOString()}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <pre style={{
              padding: "1rem",
              borderRadius: 8,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#38bdf8",
              fontSize: 12,
              fontFamily: "monospace",
              overflowX: "auto",
              maxHeight: 240,
            }}>
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(selectedLog.metadata || "{}"), null, 2);
                } catch {
                  return selectedLog.metadata;
                }
              })()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
