"use client";

import { useState } from "react";
import { ReportStatus, ReportType } from "@prisma/client";
import { updateReportStatusAction } from "@/app/actions/admin";

interface ReportItem {
  id: string;
  type: ReportType;
  status: ReportStatus;
  reason: string;
  details: string | null;
  submitterEmail: string;
  targetEmail?: string;
  targetId?: string;
  notes?: string | null;
  createdAt: Date;
}

export default function ReportsClient({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = reports.filter((r) => {
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchStatus && matchType;
  });

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    setLoading(true);
    try {
      await updateReportStatusAction(reportId, newStatus, adminNotes);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus, notes: adminNotes } : r
        )
      );
      setNotice(`Report marked as ${newStatus}`);
      setSelectedReport(null);
      setAdminNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to update report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
          [ ADMIN / REPORTS ]
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
          Moderation & Incident Reports ({reports.filter((r) => r.status === "PENDING").length} pending)
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Triage user reports on inappropriate chat messages, disruptive participants, or academic dishonesty.
        </p>
      </div>

      {notice && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "#0e0c16", color: "#f8fafc", fontSize: 12, fontFamily: "monospace" }}
        >
          <option value="ALL">ALL STATUSES</option>
          <option value="PENDING">PENDING</option>
          <option value="REVIEWING">REVIEWING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="DISMISSED">DISMISSED</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "#0e0c16", color: "#f8fafc", fontSize: 12, fontFamily: "monospace" }}
        >
          <option value="ALL">ALL TYPES</option>
          <option value="USER">USER</option>
          <option value="ROOM">ROOM</option>
          <option value="MESSAGE">MESSAGE</option>
          <option value="CONTENT">CONTENT</option>
        </select>
      </div>

      {/* Reports Table */}
      <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>TYPE</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>REASON</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>REPORTED BY</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>TARGET</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>STATUS</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b", textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No reports in this category. Queue is clean!
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#c084fc" }}>
                      [ {r.type} ]
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>{r.reason}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{r.submitterEmail}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#94a3b8", fontSize: 12, fontFamily: "monospace" }}>{r.targetEmail || r.targetId || "N/A"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      padding: "3px 8px",
                      borderRadius: 4,
                      color: r.status === "PENDING" ? "#fb923c" : r.status === "RESOLVED" ? "#4ade80" : "#94a3b8",
                      background: r.status === "PENDING" ? "rgba(251,146,60,0.12)" : r.status === "RESOLVED" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <button
                      onClick={() => {
                        setSelectedReport(r);
                        setAdminNotes(r.notes || "");
                      }}
                      style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#c084fc", fontSize: 12, fontFamily: "monospace", cursor: "pointer" }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedReport && (
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
          onClick={() => setSelectedReport(null)}
        >
          <div
            style={{
              background: "#0c0a14",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc" }}>[ MODERATION CASE ]</p>
                <h3 style={{ fontSize: 18, color: "#f8fafc", fontWeight: 700, marginTop: 4 }}>
                  {selectedReport.reason}
                </h3>
                <p style={{ fontSize: 12, color: "#64748b" }}>From: {selectedReport.submitterEmail}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            {selectedReport.details && (
              <div style={{ padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, color: "#94a3b8" }}>
                {selectedReport.details}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 6 }}>
                INTERNAL ADMIN NOTES:
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log actions taken, evidence reviewed…"
                style={{ width: "100%", height: 80, padding: "0.6rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: 12, outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
              <button
                disabled={loading}
                onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.RESOLVED)}
                style={{ flex: 1, padding: "0.6rem", borderRadius: 8, background: "rgba(34,197,94,0.15)", border: "1px solid #4ade80", color: "#4ade80", fontSize: 12, fontFamily: "monospace", cursor: "pointer" }}
              >
                ✓ Mark Resolved
              </button>
              <button
                disabled={loading}
                onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.DISMISSED)}
                style={{ flex: 1, padding: "0.6rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, fontFamily: "monospace", cursor: "pointer" }}
              >
                Dismiss Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
