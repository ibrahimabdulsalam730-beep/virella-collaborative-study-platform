"use client";

import { useState } from "react";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/app/actions/admin";

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  targetRoles: string[];
  isActive: boolean;
  sentEmail: boolean;
  createdAt: Date;
}

export default function AnnounceClient({ initialList }: { initialList: AnnouncementItem[] }) {
  const [list, setList] = useState<AnnouncementItem[]>(initialList);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>(["STUDENT", "INSTRUCTOR"]);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleRole = (r: string) => {
    setTargetRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleCreate = async () => {
    if (!title || !body) return;
    setLoading(true);
    try {
      const res = await createAnnouncementAction({
        title,
        body,
        targetRoles,
        sendEmail,
      });
      setList([res.announcement as any, ...list]);
      setNotice(`Announcement "${title}" broadcasted successfully!`);
      setShowCreate(false);
      setTitle("");
      setBody("");
    } catch (err: any) {
      alert(err.message || "Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this announcement banner?")) return;
    try {
      await deleteAnnouncementAction(id);
      setList((prev) => prev.filter((a) => a.id !== id));
      setNotice("Announcement removed.");
    } catch (err: any) {
      alert(err.message || "Failed to delete announcement");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
            [ ADMIN / ANNOUNCE ]
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
            System Announcements & Banners
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Publish sticky banners across the study hub and dispatch segmented announcements to students and instructors.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: 9999,
            background: "#b4f000",
            border: "none",
            color: "#000",
            fontWeight: 600,
            fontSize: 12,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        >
          + New Announcement
        </button>
      </div>

      {notice && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Announcements List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {list.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "#64748b", fontSize: 13 }}>
            No active announcements currently published.
          </div>
        ) : (
          list.map((ann) => (
            <div
              key={ann.id}
              style={{
                background: "rgba(14,12,22,0.75)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "1.25rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 6px", borderRadius: 4, background: "rgba(180,240,0,0.1)", color: "#b4f000", border: "1px solid rgba(180,240,0,0.3)" }}>
                    ACTIVE BANNER
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                    Target: {ann.targetRoles.join(", ") || "ALL"}
                  </span>
                  {ann.sentEmail && (
                    <span style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace" }}>
                      • Email dispatched
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>{ann.title}</h3>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{ann.body}</p>
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                  Published on {new Date(ann.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDelete(ann.id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  fontSize: 11,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showCreate && (
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
          onClick={() => setShowCreate(false)}
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
              gap: "1.25rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontSize: 18, color: "#f8fafc", fontWeight: 700 }}>New Announcement</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 6 }}>TITLE</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled System Upgrade: Sunday 2 AM UTC"
                style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: 13, outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 6 }}>CONTENT BODY</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the update, affected features, or guidance for users…"
                style={{ width: "100%", height: 100, padding: "0.6rem 0.85rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: 13, outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 6 }}>TARGET AUDIENCE</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["STUDENT", "INSTRUCTOR", "ADMIN"].map((r) => {
                  const selected = targetRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        borderRadius: 6,
                        background: selected ? "rgba(180,240,0,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selected ? "#b4f000" : "rgba(255,255,255,0.08)"}`,
                        color: selected ? "#b4f000" : "#94a3b8",
                        fontSize: 11,
                        fontFamily: "monospace",
                        cursor: "pointer",
                      }}
                    >
                      {selected ? `✓ ${r}` : r}
                    </button>
                  );
                })}
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                style={{ accentColor: "#b4f000" }}
              />
              Also dispatch email notification to targeted verified accounts
            </label>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{ padding: "0.5rem 1rem", borderRadius: 8, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                disabled={loading || !title || !body}
                onClick={handleCreate}
                style={{ padding: "0.5rem 1.25rem", borderRadius: 8, background: "#b4f000", border: "none", color: "#000", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
              >
                {loading ? "Publishing…" : "Publish Banner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
