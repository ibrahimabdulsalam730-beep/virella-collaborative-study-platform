"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import { 
  Users, 
  Plus, 
  ArrowRight, 
  Clock, 
  Lock, 
  Globe, 
  Sparkles, 
  Search, 
  Layers, 
  ShieldCheck 
} from "lucide-react";

interface StudyRoom {
  id: string;
  name: string;
  topic: string;
  technique: string;
  memberCount: number;
  maxMembers: number;
  pomodoroPhase: "focus" | "break";
  pomodoroLeft: string;
  isPrivate: boolean;
  hostName: string;
}

export default function RoomsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New room form state
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [newRoomTechnique, setNewRoomTechnique] = useState("Pomodoro Sync");
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);

  const [activeRooms, setActiveRooms] = useState<StudyRoom[]>([
    {
      id: "SYNC-402",
      name: "MIT 6.006 Algorithms Sprint",
      topic: "Dynamic Programming & Dijkstra Graphs",
      technique: "Pomodoro Sync",
      memberCount: 5,
      maxMembers: 8,
      pomodoroPhase: "focus",
      pomodoroLeft: "18:24",
      isPrivate: false,
      hostName: "Aarav S.",
    },
    {
      id: "FEYN-819",
      name: "Neurobiology Feynman Circle",
      topic: "Action Potentials & Synaptic Plasticity",
      technique: "Feynman Rounds",
      memberCount: 4,
      maxMembers: 6,
      pomodoroPhase: "focus",
      pomodoroLeft: "09:40",
      isPrivate: false,
      hostName: "Elena R.",
    },
    {
      id: "RECALL-221",
      name: "USMLE Step 1 Battle Room",
      topic: "Pathology & Cardiovascular Pharmacology",
      technique: "Active Recall Battles",
      memberCount: 7,
      maxMembers: 10,
      pomodoroPhase: "break",
      pomodoroLeft: "03:12",
      isPrivate: false,
      hostName: "Marcus C.",
    },
    {
      id: "MAP-550",
      name: "Quantum Computing Mind Maps",
      topic: "Bloch Spheres & Grover Search",
      technique: "Collaborative Mind Maps",
      memberCount: 3,
      maxMembers: 6,
      pomodoroPhase: "focus",
      pomodoroLeft: "22:15",
      isPrivate: false,
      hostName: "Priya V.",
    },
  ]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const generatedId = `ROOM-${Math.floor(100 + Math.random() * 900)}`;
    const newRoom: StudyRoom = {
      id: generatedId,
      name: newRoomName.trim(),
      topic: newRoomTopic.trim() || "General Mastery",
      technique: newRoomTechnique,
      memberCount: 1,
      maxMembers: 8,
      pomodoroPhase: "focus",
      pomodoroLeft: "25:00",
      isPrivate: newRoomIsPrivate,
      hostName: "You",
    };

    setActiveRooms([newRoom, ...activeRooms]);
    setShowCreateModal(false);
    // Redirect to newly created room
    window.location.href = `/rooms/${generatedId}`;
  };

  const filteredRooms = activeRooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060509] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="bracket-tag mb-1">[ COLLABORATIVE ROOMS ]</div>
            <h1 className="text-3xl font-light tracking-tight text-white">
              Active Synchronized Cohorts
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Join live rooms with synchronized Pomodoro timers, shared whiteboards, and peer technique modes.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-pill-lime text-xs px-5 py-2.5 flex items-center gap-2 shrink-0 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Room</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, cohort, or room code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Showing {filteredRooms.length} active rooms
          </span>
        </div>

        {/* ROOM CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between group"
            >
              <div>
                {/* ROOM BADGE & CODE */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-mono text-purple-300 font-semibold tracking-wider">
                    [ #{room.id} ]
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#b4f000] animate-pulse" />
                    <span className="text-[#b4f000]">
                      {room.pomodoroPhase === "focus" ? "FOCUSING" : "BREAK"} ({room.pomodoroLeft})
                    </span>
                  </div>
                </div>

                {/* ROOM TITLE & TOPIC */}
                <h3 className="text-base font-semibold text-white group-hover:text-[#b4f000] transition-colors mb-1.5">
                  {room.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {room.topic}
                </p>

                {/* TECHNIQUE CHIP */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-300 font-mono mb-4">
                  <Sparkles className="w-3 h-3 text-[#b4f000]" />
                  <span>{room.technique}</span>
                </div>
              </div>

              {/* CARD FOOTER */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>{room.memberCount}/{room.maxMembers}</span>
                  </span>
                  <span>Host: {room.hostName}</span>
                </div>

                <Link
                  href={`/rooms/${room.id}`}
                  className="btn-pill-dark text-xs py-1.5 px-3.5 group-hover:border-[#b4f000]/50 group-hover:text-white flex items-center gap-1 transition-all"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CREATE ROOM MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel bg-[#0d0b16] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="bracket-tag">[ NEW ROOM ]</div>
                  <h2 className="text-xl font-semibold text-white mt-0.5">
                    Configure Study Session
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Room Title / Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Systems Exam Prep"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Target Topic & Objectives
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Raft consensus, two-phase commit, vector clocks"
                    value={newRoomTopic}
                    onChange={(e) => setNewRoomTopic(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Study Technique Mode
                  </label>
                  <select
                    value={newRoomTechnique}
                    onChange={(e) => setNewRoomTechnique(e.target.value)}
                    className="w-full bg-[#120e22] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b4f000]/60 transition-colors"
                  >
                    <option value="Pomodoro Sync">1. Pomodoro Sync (Shared 25m/5m cycles)</option>
                    <option value="Feynman Rounds">2. Feynman Rounds (Explain & AI clarity scoring)</option>
                    <option value="Active Recall Battles">3. Active Recall Battles (Live quizzes)</option>
                    <option value="Spaced Repetition Decks">4. Spaced Repetition Decks (SM-2 shared cards)</option>
                    <option value="Collaborative Mind Maps">6. Collaborative Mind Maps (Whiteboard nodes)</option>
                    <option value="Blurting Sprint">7. Blurting Sprint (5-min memory dump)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="privateCheck"
                      checked={newRoomIsPrivate}
                      onChange={(e) => setNewRoomIsPrivate(e.target.checked)}
                      className="rounded accent-[#b4f000]"
                    />
                    <label htmlFor="privateCheck" className="text-slate-300 cursor-pointer">
                      Invite-only (Hidden from public directory)
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-pill-dark py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-pill-lime py-2 px-5 shadow-lg"
                  >
                    Launch Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
