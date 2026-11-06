"use client";

import { useState } from "react";

interface ProctorIncident {
  id: string;
  type: "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "PHONE_DETECTED" | "TAB_SWITCH" | "FULLSCREEN_EXIT" | "COPY_PASTE";
  confidence: number;
  timestamp: string;
  snapshotUrl?: string;
}

interface TestSession {
  id: string;
  studentName: string;
  studentEmail: string;
  testTitle: string;
  score: number;
  integrityScore: number;
  status: "PASSED" | "FLAGGED_FOR_REVIEW" | "REJECTED";
  startedAt: string;
  incidents: ProctorIncident[];
}

const MOCK_SESSIONS: TestSession[] = [
  {
    id: "SESS-901",
    studentName: "Test Student",
    studentEmail: "student@virella.edu",
    testTitle: "Algorithms & Complexity Exam 1",
    score: 88,
    integrityScore: 68,
    status: "FLAGGED_FOR_REVIEW",
    startedAt: "Today at 10:30 AM",
    incidents: [
      { id: "INC-1", type: "TAB_SWITCH", confidence: 100, timestamp: "10:42:15 AM" },
      { id: "INC-2", type: "LOOKING_AWAY", confidence: 84, timestamp: "10:48:02 AM" },
      { id: "INC-3", type: "PHONE_DETECTED", confidence: 91, timestamp: "10:52:19 AM" },
    ],
  },
  {
    id: "SESS-902",
    studentName: "Devon Clark",
    studentEmail: "devon@virella.edu",
    testTitle: "Organic Chemistry Midterm",
    score: 94,
    integrityScore: 98,
    status: "PASSED",
    startedAt: "Yesterday at 2:15 PM",
    incidents: [],
  },
  {
    id: "SESS-903",
    studentName: "Maya Lin",
    studentEmail: "maya@virella.edu",
    testTitle: "Differential Equations Final",
    score: 72,
    integrityScore: 54,
    status: "FLAGGED_FOR_REVIEW",
    startedAt: "Yesterday at 4:00 PM",
    incidents: [
      { id: "INC-4", type: "MULTIPLE_FACES", confidence: 89, timestamp: "4:15:30 PM" },
      { id: "INC-5", type: "FULLSCREEN_EXIT", confidence: 100, timestamp: "4:32:11 PM" },
      { id: "INC-6", type: "COPY_PASTE", confidence: 100, timestamp: "4:41:05 PM" },
    ],
  },
];

export default function TestsClient() {
  const [sessions, setSessions] = useState<TestSession[]>(MOCK_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDecision = (sessionId: string, newStatus: "PASSED" | "REJECTED") => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
    );
    setFeedback(`Session ${sessionId} was marked as ${newStatus}.`);
    setSelectedSession(null);
  };

  const exportAuditCsv = () => {
    const headers = ["SessionID", "Student", "Email", "TestTitle", "Score", "IntegrityScore", "Status", "IncidentsCount"];
    const rows = sessions.map((s) => [
      s.id,
      `"${s.studentName}"`,
      s.studentEmail,
      `"${s.testTitle}"`,
      s.score,
      s.integrityScore,
      s.status,
      s.incidents.length,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctor-sessions-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
            [ ADMIN / TESTS & PROCTORING ]
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
            Proctoring Integrity Queue
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Review AI proctoring anomalies: phone detections, multiple faces, tab switches, and audio events.
          </p>
        </div>
        <button
          onClick={exportAuditCsv}
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
          Export CSV Report
        </button>
      </div>

      {feedback && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Sessions Table */}
      <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>SESSION</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>STUDENT</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>EXAM</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>INTEGRITY</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>STATUS</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b", textAlign: "right" }}>REVIEW</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: 12, color: "#b4f000" }}>{s.id}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ fontSize: 13, color: "#f8fafc", fontWeight: 600 }}>{s.studentName}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{s.studentEmail}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: 13, color: "#94a3b8" }}>{s.testTitle}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: s.integrityScore >= 85 ? "#4ade80" : s.integrityScore >= 60 ? "#fb923c" : "#f87171"
                  }}>
                    {s.integrityScore}%
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: s.status === "PASSED" ? "rgba(34,197,94,0.12)" : s.status === "REJECTED" ? "rgba(239,68,68,0.12)" : "rgba(251,146,60,0.12)",
                    border: `1px solid ${s.status === "PASSED" ? "rgba(34,197,94,0.3)" : s.status === "REJECTED" ? "rgba(239,68,68,0.3)" : "rgba(251,146,60,0.3)"}`,
                    color: s.status === "PASSED" ? "#4ade80" : s.status === "REJECTED" ? "#f87171" : "#fb923c",
                  }}>
                    [ {s.status} ]
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedSession(s)}
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
                    Inspect ({s.incidents.length})
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incident Review Drawer */}
      {selectedSession && (
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
          onClick={() => setSelectedSession(null)}
        >
          <div
            style={{
              background: "#0c0a14",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              maxWidth: 580,
              width: "100%",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc" }}>[ INTEGRITY INCIDENTS ]</p>
                <h3 style={{ fontSize: 18, color: "#f8fafc", fontWeight: 700, marginTop: 4 }}>
                  {selectedSession.studentName} — {selectedSession.testTitle}
                </h3>
                <p style={{ fontSize: 12, color: "#64748b" }}>Integrity Score: {selectedSession.integrityScore}%</p>
              </div>
              <button onClick={() => setSelectedSession(null)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            <div>
              <p style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 8 }}>FLAGGED EVENTS TIMELINE:</p>
              {selectedSession.incidents.length === 0 ? (
                <p style={{ color: "#4ade80", fontSize: 13, fontFamily: "monospace" }}>✓ Clean session. No anomaly alerts generated.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedSession.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      style={{
                        padding: "0.75rem",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: "#f87171", fontWeight: 700 }}>
                          ⚠ {inc.type}
                        </span>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Time: {inc.timestamp}</div>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#fb923c" }}>
                        Confidence: {inc.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => handleDecision(selectedSession.id, "PASSED")}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: 8,
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid #4ade80",
                  color: "#4ade80",
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                ✓ Approve & Validate Exam
              </button>
              <button
                onClick={() => handleDecision(selectedSession.id, "REJECTED")}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid #f87171",
                  color: "#f87171",
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                ⊘ Invalidate for Cheating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
