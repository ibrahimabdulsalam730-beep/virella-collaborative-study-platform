"use client";

import { useState } from "react";
import Link from "next/link";

interface RoomItem {
  id: string;
  name: string;
  technique: string;
  hostName: string;
  hostEmail: string;
  memberCount: number;
  cameraCount: number;
  micCount: number;
  createdAt: string;
  status: "ACTIVE" | "CLOSED";
}

const MOCK_ROOMS: RoomItem[] = [
  {
    id: "FOCUS-402",
    name: "Advanced Distributed Systems",
    technique: "Pomodoro (25/5)",
    hostName: "Dr. Alan Turing",
    hostEmail: "instructor@virella.edu",
    memberCount: 6,
    cameraCount: 4,
    micCount: 2,
    createdAt: "20 minutes ago",
    status: "ACTIVE",
  },
  {
    id: "ALGO-101",
    name: "Graph Algorithms & Dynamic Programming",
    technique: "Feynman Technique",
    hostName: "Alex Rivera",
    hostEmail: "student@virella.edu",
    memberCount: 3,
    cameraCount: 2,
    micCount: 1,
    createdAt: "45 minutes ago",
    status: "ACTIVE",
  },
  {
    id: "NEURO-99",
    name: "Cognitive Neuroscience & Memory Systems",
    technique: "Active Recall",
    hostName: "Elena Rostova",
    hostEmail: "elena@virella.edu",
    memberCount: 4,
    cameraCount: 1,
    micCount: 0,
    createdAt: "1 hour ago",
    status: "ACTIVE",
  },
];

export default function RoomsClient() {
  const [rooms, setRooms] = useState<RoomItem[]>(MOCK_ROOMS);
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filtered = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.hostEmail.toLowerCase().includes(search.toLowerCase())
  );

  const handleCloseRoom = (roomId: string) => {
    if (!confirm(`Force close room ${roomId}? All connected members will be redirected.`)) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: "CLOSED", memberCount: 0 } : r))
    );
    setActionNotice(`Room ${roomId} was terminated.`);
    setSelectedRoom(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
          [ ADMIN / ROOMS ]
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
          Live Study Rooms ({rooms.filter((r) => r.status === "ACTIVE").length} active)
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Monitor live collaborative sessions, observe in stealth mode, and enforce room safety.
        </p>
      </div>

      {actionNotice && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 8,
            fontSize: 13,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#4ade80",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter */}
      <div style={{ maxWidth: 400 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter rooms by ID, title, or host…"
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

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
        {filtered.map((room) => (
          <div
            key={room.id}
            style={{
              background: "rgba(14,12,22,0.75)",
              border: `1px solid ${
                room.status === "ACTIVE" ? "rgba(255,255,255,0.08)" : "rgba(239,68,68,0.2)"
              }`,
              borderRadius: 12,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#b4f000", background: "rgba(180,240,0,0.08)", padding: "2px 6px", borderRadius: 4 }}>
                [ {room.id} ]
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: room.status === "ACTIVE" ? "#4ade80" : "#f87171",
                }}
              >
                ● {room.status}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 16, color: "#f8fafc", fontWeight: 600 }}>{room.name}</h3>
              <p style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace", marginTop: 2 }}>
                {room.technique}
              </p>
            </div>

            <div style={{ fontSize: 12, color: "#64748b" }}>
              Host: <span style={{ color: "#94a3b8" }}>{room.hostName}</span> ({room.hostEmail})
            </div>

            <div style={{ display: "flex", gap: "1rem", fontSize: 12, fontFamily: "monospace", color: "#94a3b8", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
              <span>👥 {room.memberCount} members</span>
              <span>📹 {room.cameraCount} cams</span>
              <span>🎙 {room.micCount} mics</span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem" }}>
              <Link
                href={`/rooms/${room.id}`}
                target="_blank"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "0.45rem",
                  borderRadius: 6,
                  background: "rgba(180,240,0,0.1)",
                  border: "1px solid rgba(180,240,0,0.25)",
                  color: "#b4f000",
                  fontSize: 11,
                  fontFamily: "monospace",
                  textDecoration: "none",
                }}
              >
                👁 Observer Join
              </Link>
              <button
                onClick={() => setSelectedRoom(room)}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  fontSize: 11,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                Moderate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Room Moderation Modal */}
      {selectedRoom && (
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
          onClick={() => setSelectedRoom(null)}
        >
          <div
            style={{
              background: "#0c0a14",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              maxWidth: 480,
              width: "100%",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc" }}>[ MODERATE ROOM ]</p>
              <h3 style={{ fontSize: 18, color: "#f8fafc", fontWeight: 700, marginTop: 4 }}>
                {selectedRoom.name} ({selectedRoom.id})
              </h3>
              <p style={{ fontSize: 12, color: "#64748b" }}>Host: {selectedRoom.hostEmail}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                onClick={() => handleCloseRoom(selectedRoom.id)}
                style={{
                  padding: "0.65rem 1rem",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  fontSize: 12,
                  fontFamily: "monospace",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                ⛔ Terminate & Force Close Room
              </button>
              <button
                onClick={() => {
                  alert(`All microphones in room ${selectedRoom.id} were muted.`);
                  setSelectedRoom(null);
                }}
                style={{
                  padding: "0.65rem 1rem",
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
                🔇 Mute All Live Participants
              </button>
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              style={{
                padding: "0.5rem",
                borderRadius: 8,
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#64748b",
                fontSize: 12,
                cursor: "pointer",
                marginTop: "0.5rem",
              }}
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
