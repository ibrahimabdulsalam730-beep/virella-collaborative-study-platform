"use client";

import { useState } from "react";

interface StudyTechnique {
  id: string;
  name: string;
  category: string;
  defaultDuration: string;
  description: string;
  activeSessions: number;
}

const TECHNIQUES: StudyTechnique[] = [
  { id: "pomodoro", name: "Pomodoro Technique", category: "Time Management", defaultDuration: "25m focus / 5m break", description: "Structured interval training for sustained cognitive stamina.", activeSessions: 14 },
  { id: "feynman", name: "Feynman Technique", category: "Deep Conceptualization", defaultDuration: "45m deep dive", description: "Explain concepts in simple language to identify mental blind spots.", activeSessions: 8 },
  { id: "active-recall", name: "Active Recall", category: "Memory Retrieval", defaultDuration: "30m testing", description: "Stimulate memory during learning rather than passive review.", activeSessions: 11 },
  { id: "spaced-repetition", name: "Spaced Repetition", category: "Long-term Memory", defaultDuration: "20m review", description: "Review intervals based on the Ebbinghaus forgetting curve.", activeSessions: 9 },
  { id: "leitner", name: "Leitner Box System", category: "Flashcards", defaultDuration: "25m flashcards", description: "Multi-tiered flashcard sorting based on mastery levels.", activeSessions: 5 },
  { id: "cornell", name: "Cornell Note-Taking", category: "Synthesized Notes", defaultDuration: "50m lecture", description: "Cues, notes, and summary split layout for high comprehension.", activeSessions: 7 },
  { id: "blurting", name: "Blurting Method", category: "Recall Sprint", defaultDuration: "15m sprint", description: "Rapid write-out of everything remembered from memory, then gap review.", activeSessions: 4 },
  { id: "interleaving", name: "Interleaving Practice", category: "Problem Solving", defaultDuration: "60m mixed session", description: "Mix different topics or problem types to train analytical categorization.", activeSessions: 6 },
  { id: "sq3r", name: "SQ3R Method", category: "Textbook Comprehension", defaultDuration: "45m structured reading", description: "Survey, Question, Read, Retrieve, Review framework for dense literature.", activeSessions: 3 },
  { id: "mind-mapping", name: "Mind Mapping", category: "Visual Synthesis", defaultDuration: "40m schematic mapping", description: "Radial visual diagrams connecting hierarchical and relational ideas.", activeSessions: 5 },
];

interface ContentItem {
  id: string;
  type: "QUIZ" | "FLASHCARD_DECK" | "NOTE";
  title: string;
  author: string;
  subject: string;
  flagCount: number;
  status: "APPROVED" | "FLAGGED" | "PENDING";
}

const INITIAL_CONTENT: ContentItem[] = [
  { id: "QZ-88", type: "QUIZ", title: "Asynchronous Concurrency in Rust & Go", author: "Dr. Alan Turing", subject: "Computer Science", flagCount: 0, status: "APPROVED" },
  { id: "FC-12", type: "FLASHCARD_DECK", title: "Biochemistry: Citric Acid Cycle Enzymes", author: "student@virella.edu", subject: "Medicine", flagCount: 2, status: "FLAGGED" },
  { id: "NT-09", type: "NOTE", title: "Linear Algebra: Eigenvalues & PCA Derivations", author: "elena@virella.edu", subject: "Mathematics", flagCount: 0, status: "APPROVED" },
  { id: "QZ-41", type: "QUIZ", title: "Distributed Consensus: Raft vs Paxos", author: "marcus@virella.edu", subject: "Computer Science", flagCount: 1, status: "PENDING" },
];

export default function ContentClient() {
  const [activeTab, setActiveTab] = useState<"TECHNIQUES" | "MODERATION">("TECHNIQUES");
  const [contentList, setContentList] = useState<ContentItem[]>(INITIAL_CONTENT);
  const [notice, setNotice] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setContentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "APPROVED", flagCount: 0 } : c))
    );
    setNotice(`Item ${id} approved.`);
  };

  const handleRemove = (id: string) => {
    if (!confirm(`Delete item ${id}?`)) return;
    setContentList((prev) => prev.filter((c) => c.id !== id));
    setNotice(`Item ${id} removed.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
          [ ADMIN / CONTENT ]
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
          Study Content & Frameworks
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Manage the 10 evidence-based study methods, review community quizzes, decks, and shared summaries.
        </p>
      </div>

      {notice && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("TECHNIQUES")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            background: activeTab === "TECHNIQUES" ? "rgba(180,240,0,0.12)" : "transparent",
            border: `1px solid ${activeTab === "TECHNIQUES" ? "#b4f000" : "transparent"}`,
            color: activeTab === "TECHNIQUES" ? "#b4f000" : "#94a3b8",
            fontSize: 12,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        >
          [ 10 STUDY TECHNIQUES ]
        </button>
        <button
          onClick={() => setActiveTab("MODERATION")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            background: activeTab === "MODERATION" ? "rgba(180,240,0,0.12)" : "transparent",
            border: `1px solid ${activeTab === "MODERATION" ? "#b4f000" : "transparent"}`,
            color: activeTab === "MODERATION" ? "#b4f000" : "#94a3b8",
            fontSize: 12,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        >
          [ CONTENT MODERATION QUEUE ({contentList.filter((c) => c.status !== "APPROVED").length}) ]
        </button>
      </div>

      {activeTab === "TECHNIQUES" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {TECHNIQUES.map((tech, i) => (
            <div
              key={tech.id}
              style={{
                background: "rgba(14,12,22,0.75)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#64748b" }}>
                  #{String(i + 1).padStart(2, "0")} • {tech.category}
                </span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#4ade80" }}>
                  {tech.activeSessions} active
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc" }}>{tech.name}</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{tech.description}</p>
              <div style={{ marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "monospace", color: "#c084fc" }}>
                <span>Duration: {tech.defaultDuration}</span>
                <span>Configured ✓</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>TYPE</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>TITLE</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>AUTHOR</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>STATUS</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: 11, fontFamily: "monospace", color: "#64748b", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {contentList.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#c084fc" }}>
                      {c.type}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>{c.title}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: 12 }}>{c.author}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: c.status === "APPROVED" ? "#4ade80" : c.status === "FLAGGED" ? "#f87171" : "#fb923c" }}>
                      ● {c.status} {c.flagCount > 0 ? `(${c.flagCount} flags)` : ""}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleApprove(c.id)}
                      style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 11, cursor: "pointer" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRemove(c.id)}
                      style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 11, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
