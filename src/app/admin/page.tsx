import { requireAdminRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminStatCard from "@/components/admin/AdminStatCard";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Overview — Virella Study",
  description: "Platform health, system metrics, and recent administrative actions",
};

export default async function AdminOverviewPage() {
  const currentAdmin = await requireAdminRole();

  // Fetch stats safely
  const [totalUsers, totalAdmins, pendingReports, recentAudit] = await Promise.all([
    prisma.user.count({ where: { status: { not: "DELETED" } } }).catch(() => 0),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }).catch(() => 0),
    prisma.report.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.auditLog.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }).catch(() => []),
  ]);

  const newUsersToday = await prisma.user.count({
    where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
  }).catch(() => 0);

  const suspendedCount = await prisma.user.count({
    where: { status: "SUSPENDED" },
  }).catch(() => 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
            [ ADMIN / OVERVIEW ]
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
            Control Center & Governance
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Welcome back, <span style={{ color: "#f8fafc", fontWeight: 600 }}>{currentAdmin.name || currentAdmin.email}</span> ({currentAdmin.role})
          </p>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link
            href="/admin/users"
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8",
              fontSize: 12,
              fontFamily: "monospace",
              textDecoration: "none",
            }}
          >
            [ USERS ]
          </Link>
          <Link
            href="/admin/rooms"
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8",
              fontSize: 12,
              fontFamily: "monospace",
              textDecoration: "none",
            }}
          >
            [ ROOMS ]
          </Link>
          <Link
            href="/admin/reports"
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: pendingReports > 0 ? "#fb923c" : "#94a3b8",
              fontSize: 12,
              fontFamily: "monospace",
              textDecoration: "none",
            }}
          >
            [ REPORTS {pendingReports > 0 ? `(${pendingReports})` : ""} ]
          </Link>
          {currentAdmin.role === "SUPER_ADMIN" && (
            <Link
              href="/admin/settings"
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: 8,
                background: "rgba(180,240,0,0.1)",
                border: "1px solid rgba(180,240,0,0.3)",
                color: "#b4f000",
                fontSize: 12,
                fontFamily: "monospace",
                textDecoration: "none",
              }}
            >
              [ SETTINGS ]
            </Link>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        <AdminStatCard
          label="Total Scholars"
          value={totalUsers.toLocaleString()}
          icon="◉"
          delta={`${newUsersToday} new today`}
          positive
        />
        <AdminStatCard
          label="Suspended Accounts"
          value={suspendedCount}
          icon="⊘"
          accent="#f87171"
        />
        <AdminStatCard
          label="Active Admins"
          value={totalAdmins}
          icon="◆"
          accent="#c084fc"
        />
        <AdminStatCard
          label="Pending Reports"
          value={pendingReports}
          icon="⚑"
          accent={pendingReports > 0 ? "#fb923c" : "#b4f000"}
        />
      </div>

      {/* Two Column Section: Live Room Status & Recent Audit Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem" }}>
        {/* Live Audio/Video Rooms Pulse */}
        <div
          style={{
            background: "rgba(14,12,22,0.75)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#b4f000" }}>
              [ LIVE ROOMS PULSE ]
            </span>
            <Link href="/admin/rooms" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>
              Manage Rooms →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { id: "FOCUS-402", title: "Advanced Distributed Systems", technique: "Pomodoro (25/5)", users: 6, cams: 4 },
              { id: "ALGO-101", title: "Graph Algorithms & Dynamic Programming", technique: "Feynman Technique", users: 3, cams: 2 },
              { id: "NEURO-99", title: "Cognitive Neuroscience & Memory Systems", technique: "Active Recall", users: 4, cams: 1 },
            ].map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "0.85rem",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: "#f8fafc", fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace" }}>{r.technique} • {r.id}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>
                  <div>👥 {r.users} scholars</div>
                  <div style={{ color: "#4ade80" }}>📹 {r.cams} cameras</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Log */}
        <div
          style={{
            background: "rgba(14,12,22,0.75)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#c084fc", letterSpacing: "0.1em" }}>
              [ AUDIT LOG STREAM ]
            </span>
            <Link href="/admin/audit" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>
              Full Log →
            </Link>
          </div>
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 320 }}>
            {recentAudit.length === 0 ? (
              <p style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                No audit events recorded yet.
              </p>
            ) : (
              recentAudit.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: log.action.includes("FAILED") || log.action.includes("SUSPENDED")
                        ? "#f87171"
                        : "#b4f000",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.user?.name || log.user?.email || "System"}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
