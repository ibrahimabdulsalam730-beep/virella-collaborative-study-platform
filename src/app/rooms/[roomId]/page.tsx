"use client";

import React, { useState, use, Suspense } from "react";
import Link from "next/link";
import SharedWhiteboard from "@/components/whiteboard/SharedWhiteboard";
import PomodoroTimer from "@/components/timer/PomodoroTimer";
import InRoomChat from "@/components/chat/InRoomChat";
import PresenceList, { RoomMember, UserStatus } from "@/components/presence/PresenceList";
import PreJoinModal, { PreJoinSettings } from "@/components/video/PreJoinModal";
import LiveKitRoomWrapper from "@/components/video/LiveKitRoomWrapper";
import { useSession } from "next-auth/react";
import { 
  Check, 
  Share2, 
  Shield, 
  PenTool, 
  Clock, 
  Users, 
  MessageSquare 
} from "lucide-react";

function RoomContent({ params }: { params: Promise<{ roomId: string }> }) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.roomId;
  const { data: session } = useSession();

  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [preJoinSettings, setPreJoinSettings] = useState<PreJoinSettings>({
    videoEnabled: false,
    audioEnabled: false,
    selectedVideoDeviceId: "",
    selectedAudioDeviceId: "",
    selectedAudioOutputDeviceId: "",
    lowBandwidthMode: false,
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"whiteboard" | "timer" | "presence" | "chat">("whiteboard");
  const [selectedTechnique, setSelectedTechnique] = useState("pomodoro");

  // Current session user
  const currentUserId = session?.user?.id || "user_me";
  const currentUserName = session?.user?.name || "You (Scholar)";
  const isHost = true;

  // Active room members state
  const [members, setMembers] = useState<RoomMember[]>([
    {
      id: "user_me",
      name: "You",
      role: "host",
      status: "focusing",
      micMuted: false,
      cameraOff: true,
      avatarColor: "#b4f000",
      studyMins: 42,
    },
    {
      id: "user_aarav",
      name: "Aarav Sharma",
      role: "member",
      status: "focusing",
      micMuted: true,
      cameraOff: false,
      avatarColor: "#8b5cf6",
      studyMins: 38,
    },
    {
      id: "user_elena",
      name: "Elena Rostova",
      role: "member",
      status: "on_break",
      micMuted: true,
      cameraOff: true,
      avatarColor: "#ec4899",
      studyMins: 55,
    },
    {
      id: "user_marcus",
      name: "Marcus Chen",
      role: "member",
      status: "help_needed",
      micMuted: false,
      cameraOff: false,
      avatarColor: "#38bdf8",
      studyMins: 24,
    },
  ]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleStatusChange = (newStatus: UserStatus) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === currentUserId ? { ...m, status: newStatus } : m))
    );
  };

  const TECHNIQUES = [
    { id: "pomodoro", label: "Pomodoro Sync", icon: "⚡" },
    { id: "feynman", label: "Feynman Rounds", icon: "🧠" },
    { id: "active_recall", label: "Active Recall", icon: "⚔️" },
    { id: "mind_map", label: "Mind Maps", icon: "🗺️" },
    { id: "blurting", label: "Blurting Sprint", icon: "✍️" },
  ];

  const handleRealMicStateChange = (uid: string, isMuted: boolean) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === uid || (uid === currentUserId && m.id === "user_me")
          ? { ...m, micMuted: isMuted }
          : m
      )
    );
  };

  const handleRealCameraStateChange = (uid: string, isOff: boolean) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === uid || (uid === currentUserId && m.id === "user_me")
          ? { ...m, cameraOff: isOff }
          : m
      )
    );
  };

  const handleLeaveRoom = () => {
    window.location.href = "/rooms";
  };

  if (!hasJoinedRoom) {
    return (
      <PreJoinModal
        roomId={roomId}
        userName={currentUserName}
        userRole={isHost ? "Host Scholar" : "Scholar"}
        roomName={`Study Room #${roomId}`}
        hostName={isHost ? currentUserName : members.find((m) => m.role === "host")?.name}
        memberCount={members.length}
        maxMembers={10}
        onJoin={(settings) => {
          setPreJoinSettings(settings);
          setHasJoinedRoom(true);
        }}
        onCancel={() => {
          window.location.href = "/rooms";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060509] text-white flex flex-col">
      {/* ROOM TOP HEADER */}
      <header className="h-16 border-b border-white/[0.08] bg-[#0c0916]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        
        {/* ROOM DETAILS */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1 font-mono">
            <span>← LEAVE</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold tracking-wider text-purple-300">
              [ ROOM #{roomId.toUpperCase()} ]
            </span>
            <span className="w-2 h-2 rounded-full bg-[#b4f000] animate-pulse" />
          </div>

          <button
            onClick={handleCopyLink}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#b4f000]/40 text-xs text-slate-300 transition-all active:scale-95"
            title="Copy room invitation link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#b4f000]" />
                <span className="text-[#b4f000] font-mono text-[11px]">COPIED!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px]">INVITE LINK</span>
              </>
            )}
          </button>
        </div>

        {/* TECHNIQUE SWITCHER DROPDOWN */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.08]">
          {TECHNIQUES.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setSelectedTechnique(tech.id)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
                selectedTechnique === tech.id
                  ? "bg-[#b4f000] text-black font-semibold shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{tech.icon}</span>
              <span>{tech.label}</span>
            </button>
          ))}
        </div>

        {/* RIGHT QUICK ACTIONS */}
        <div className="flex items-center gap-2">
          <div className="glass-panel px-3 py-1 rounded-full text-xs font-mono text-[#b4f000] border border-[#b4f000]/20 hidden sm:flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>HOST SESSION</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="sm:hidden p-2 rounded-lg bg-white/5 text-slate-300"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE TAB BAR */}
      <div className="md:hidden flex items-center justify-around bg-[#0a0812] border-b border-white/[0.08] p-1">
        <button
          onClick={() => setActiveMobileTab("whiteboard")}
          className={`flex-1 py-2 text-xs font-mono flex items-center justify-center gap-1.5 rounded-lg ${
            activeMobileTab === "whiteboard" ? "bg-[#b4f000] text-black font-bold" : "text-slate-400"
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Board</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("timer")}
          className={`flex-1 py-2 text-xs font-mono flex items-center justify-center gap-1.5 rounded-lg ${
            activeMobileTab === "timer" ? "bg-[#b4f000] text-black font-bold" : "text-slate-400"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timer</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("presence")}
          className={`flex-1 py-2 text-xs font-mono flex items-center justify-center gap-1.5 rounded-lg ${
            activeMobileTab === "presence" ? "bg-[#b4f000] text-black font-bold" : "text-slate-400"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Roster</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("chat")}
          className={`flex-1 py-2 text-xs font-mono flex items-center justify-center gap-1.5 rounded-lg ${
            activeMobileTab === "chat" ? "bg-[#b4f000] text-black font-bold" : "text-slate-400"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-4rem)]">
        
        {/* LEFT / CENTER: STAGE WORKSPACE WITH VIDEO FEED & WHITEBOARD (8 cols) */}
        <div className={`lg:col-span-8 h-full flex flex-col gap-3 ${activeMobileTab !== "whiteboard" ? "hidden lg:flex" : "flex"}`}>
          <LiveKitRoomWrapper
            roomId={roomId}
            userId={currentUserId}
            userName={currentUserName}
            isHost={isHost}
            preJoinSettings={preJoinSettings}
            onRealMicStateChange={handleRealMicStateChange}
            onRealCameraStateChange={handleRealCameraStateChange}
            onLeave={handleLeaveRoom}
          />
          <div className="flex-1 min-h-[420px] flex flex-col">
            <SharedWhiteboard roomId={roomId} userId={currentUserId} userName={currentUserName} />
          </div>
        </div>

        {/* RIGHT SIDEBAR: TIMER, PRESENCE, CHAT (4 cols) */}
        <div className={`lg:col-span-4 h-full flex flex-col gap-4 overflow-y-auto ${activeMobileTab === "whiteboard" ? "hidden lg:flex" : "flex"}`}>
          
          {/* POMODORO TIMER WIDGET */}
          <div className={`${activeMobileTab !== "timer" && activeMobileTab !== "whiteboard" ? "hidden lg:block" : "block"}`}>
            <PomodoroTimer roomId={roomId} isHost={isHost} />
          </div>

          {/* PRESENCE ROSTER */}
          <div className={`flex-1 min-h-[220px] ${activeMobileTab !== "presence" && activeMobileTab !== "whiteboard" ? "hidden lg:block" : "block"}`}>
            <PresenceList
              members={members}
              currentUserId={currentUserId}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* REAL-TIME IN-ROOM CHAT */}
          <div className={`flex-1 min-h-[260px] ${activeMobileTab !== "chat" && activeMobileTab !== "whiteboard" ? "hidden lg:block" : "block"}`}>
            <InRoomChat
              roomId={roomId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isHost={isHost}
            />
          </div>

        </div>

      </main>
    </div>
  );
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060509] flex items-center justify-center text-slate-400 font-mono text-xs">Connecting to room...</div>}>
      <RoomContent params={params} />
    </Suspense>
  );
}
