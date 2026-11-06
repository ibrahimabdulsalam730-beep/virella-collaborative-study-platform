"use client";

import React, { useState } from "react";
import { Users, Crown, Mic, MicOff, Video, VideoOff, CircleDot, ChevronDown } from "lucide-react";

export type UserStatus = "focusing" | "on_break" | "away" | "help_needed";

export interface RoomMember {
  id: string;
  name: string;
  role: "host" | "member";
  status: UserStatus;
  micMuted: boolean;
  cameraOff: boolean;
  avatarColor: string;
  studyMins: number;
}

interface PresenceListProps {
  members: RoomMember[];
  currentUserId: string;
  onStatusChange?: (newStatus: UserStatus) => void;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
}

export default function PresenceList({
  members,
  currentUserId,
  onStatusChange,
  onToggleMic,
  onToggleCam,
}: PresenceListProps) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const STATUS_CONFIG: Record<UserStatus, { label: string; icon: string; color: string; badge: string }> = {
    focusing: { label: "Focusing", icon: "🎯", color: "#b4f000", badge: "bg-[#b4f000]/10 text-[#b4f000] border-[#b4f000]/30" },
    on_break: { label: "On Break", icon: "☕", color: "#c084fc", badge: "bg-purple-900/20 text-purple-300 border-purple-500/30" },
    away: { label: "Away", icon: "💤", color: "#94a3b8", badge: "bg-slate-800/40 text-slate-400 border-slate-700/40" },
    help_needed: { label: "Help Needed", icon: "🙋", color: "#f43f5e", badge: "bg-rose-950/30 text-rose-300 border-rose-500/40" },
  };

  const currentUser = members.find((m) => m.id === currentUserId) || members[0];

  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
            [ IN ROOM ({members.length}) ]
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      </div>

      {/* MY STATUS SELECTOR */}
      {currentUser && (
        <div className="mb-3.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[10px] font-mono uppercase text-slate-500 mb-1.5">My Status</div>
          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0e0b18] border border-white/10 text-xs text-white hover:border-purple-400/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{STATUS_CONFIG[currentUser.status]?.icon}</span>
                <span className="font-medium">{STATUS_CONFIG[currentUser.status]?.label}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {statusDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#120e22] border border-white/15 rounded-xl shadow-2xl p-1 z-30">
                {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onStatusChange?.(st);
                      setStatusDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 text-slate-200 transition-colors text-left"
                  >
                    <span>{STATUS_CONFIG[st].icon}</span>
                    <span>{STATUS_CONFIG[st].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEMBER ROSTER LIST */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {members.map((member) => {
          const stConf = STATUS_CONFIG[member.status] || STATUS_CONFIG.focusing;
          const isMe = member.id === currentUserId;

          return (
            <div
              key={member.id}
              className={`p-2.5 rounded-xl flex items-center justify-between transition-all ${
                isMe ? "bg-purple-950/20 border border-purple-500/20" : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar with status dot */}
                <div className="relative shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#0a0812]"
                    style={{ backgroundColor: stConf.color }}
                  />
                </div>

                {/* Name & Role */}
                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {member.name} {isMe && "(You)"}
                    </span>
                    {member.role === "host" && (
                      <span title="Room Host">
                        <Crown className="w-3 h-3 text-[#b4f000] shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {member.studyMins} mins focused
                  </span>
                </div>
              </div>

              {/* Status Badge & Media Mute indicators */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${stConf.badge}`}>
                  {stConf.icon} {stConf.label}
                </span>

                <div className="flex items-center gap-1 text-slate-500 pl-1">
                  {member.micMuted ? (
                    <MicOff className="w-3 h-3 text-rose-400/80" />
                  ) : (
                    <Mic className="w-3 h-3 text-emerald-400/80" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
