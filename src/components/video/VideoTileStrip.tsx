"use client";

import React, { useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Crown,
  Hand,
  Wifi,
  WifiOff,
  MoreVertical,
  Maximize2,
  Minimize2,
  Volume2,
  VideoOff,
  UserX,
  Camera,
} from "lucide-react";
import { Track } from "livekit-client";

export interface RoomParticipantState {
  identity: string;
  name: string;
  role: "host" | "member";
  isLocal: boolean;
  isSpeaking: boolean;
  micMuted: boolean;
  cameraOff: boolean;
  handRaised?: boolean;
  connectionQuality?: "excellent" | "good" | "poor" | "lost";
  avatarColor: string;
  videoTrack?: any;
  audioTrack?: any;
}

interface VideoTileStripProps {
  participants: RoomParticipantState[];
  isHost: boolean;
  currentUserId: string;
  focusedParticipantId: string | null;
  onSelectFocusParticipant: (id: string | null) => void;
  onHostMuteParticipant?: (participantId: string) => void;
  onHostDisableCamera?: (participantId: string) => void;
  onHostRemoveParticipant?: (participantId: string) => void;
}

function ParticipantVideoTile({
  participant,
  isHost,
  isFocused,
  onSelectFocus,
  onHostMute,
  onHostDisableCam,
  onHostRemove,
}: {
  participant: RoomParticipantState;
  isHost: boolean;
  isFocused: boolean;
  onSelectFocus: () => void;
  onHostMute?: () => void;
  onHostDisableCam?: () => void;
  onHostRemove?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Attach LiveKit VideoTrack to <video> element
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (participant.videoTrack && !participant.cameraOff) {
      if (typeof participant.videoTrack.attach === "function") {
        participant.videoTrack.attach(el);
      } else if (participant.videoTrack.mediaStreamTrack) {
        const stream = new MediaStream([participant.videoTrack.mediaStreamTrack]);
        el.srcObject = stream;
      }
    } else {
      el.srcObject = null;
    }

    return () => {
      if (participant.videoTrack && typeof participant.videoTrack.detach === "function" && el) {
        try {
          participant.videoTrack.detach(el);
        } catch {}
      }
    };
  }, [participant.videoTrack, participant.cameraOff]);

  const canManage = isHost && !participant.isLocal;

  return (
    <div
      className={`relative shrink-0 transition-all duration-300 rounded-2xl overflow-hidden bg-[#0e0a1b] border ${
        participant.isSpeaking
          ? "border-[#b4f000] ring-2 ring-[#b4f000]/40 shadow-lg shadow-[#b4f000]/20"
          : isFocused
          ? "border-purple-400 ring-1 ring-purple-400/30"
          : "border-white/10 hover:border-white/20"
      } ${
        isFocused
          ? "w-72 h-44 sm:w-80 sm:h-48"
          : "w-44 h-28 sm:w-48 sm:h-32"
      }`}
    >
      {/* VIDEO TRACK OR AVATAR FALLBACK */}
      {!participant.cameraOff && participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className={`w-full h-full object-cover ${participant.isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
          {/* Avatar circle */}
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-base font-bold text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: participant.avatarColor }}
          >
            {participant.name.charAt(0).toUpperCase()}
          </div>
          <span className="mt-2 text-[11px] font-mono text-slate-400 truncate max-w-[90%] text-center">
            {participant.name} {participant.isLocal && "(You)"}
          </span>
        </div>
      )}

      {/* TOP OVERLAYS: NAME & STATUS BADGES */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white max-w-[70%] truncate">
          {participant.role === "host" && (
            <Crown className="w-3 h-3 text-[#b4f000] shrink-0" />
          )}
          <span className="truncate">{participant.name}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Hand Raised Alert */}
          {participant.handRaised && (
            <span
              className="p-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-bounce"
              title="Hand Raised"
            >
              <Hand className="w-3 h-3" />
            </span>
          )}

          {/* Connection Quality Indicator */}
          <span
            className={`p-1 rounded-full bg-black/60 border border-white/10 text-[10px] ${
              participant.connectionQuality === "poor"
                ? "text-amber-400"
                : participant.connectionQuality === "lost"
                ? "text-rose-400"
                : "text-emerald-400"
            }`}
            title={`Connection: ${participant.connectionQuality || "good"}`}
          >
            {participant.connectionQuality === "lost" ? (
              <WifiOff className="w-3 h-3" />
            ) : (
              <Wifi className="w-3 h-3" />
            )}
          </span>
        </div>
      </div>

      {/* BOTTOM OVERLAYS: MIC STATUS & ACTIONS */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Mic Status Pill */}
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 ${
              participant.micMuted
                ? "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {participant.micMuted ? (
              <MicOff className="w-3 h-3" />
            ) : (
              <Mic className="w-3 h-3 text-[#b4f000]" />
            )}
            <span className="hidden sm:inline text-[9px]">
              {participant.micMuted ? "MUTED" : "LIVE"}
            </span>
          </span>

          {/* Camera ON indicator */}
          {!participant.cameraOff && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#b4f000]/20 text-[#b4f000] border border-[#b4f000]/30 text-[9px] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b4f000] animate-pulse" />
              <span>CAM</span>
            </span>
          )}
        </div>

        {/* Quick action buttons (Focus + Host dropdown) */}
        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            onClick={onSelectFocus}
            className="p-1 rounded-lg bg-black/60 hover:bg-black/80 text-slate-400 hover:text-white transition-colors"
            title={isFocused ? "Restore tile size" : "Enlarge speaker view"}
          >
            {isFocused ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>

          {canManage && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg bg-black/60 hover:bg-black/80 text-slate-400 hover:text-white transition-colors"
                title="Host Controls"
              >
                <MoreVertical className="w-3 h-3" />
              </button>

              {menuOpen && (
                <div className="absolute bottom-full right-0 mb-1 w-36 rounded-xl bg-[#120e24] border border-white/15 shadow-2xl p-1 z-30 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onHostMute?.();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-white/10 text-left transition-colors"
                  >
                    <MicOff className="w-3 h-3 text-rose-400" />
                    <span>Mute Member</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onHostDisableCam?.();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-white/10 text-left transition-colors"
                  >
                    <VideoOff className="w-3 h-3 text-amber-400" />
                    <span>Stop Video</span>
                  </button>

                  <div className="h-px bg-white/10 my-0.5" />

                  <button
                    type="button"
                    onClick={() => {
                      onHostRemove?.();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-rose-400 hover:bg-rose-500/10 text-left transition-colors"
                  >
                    <UserX className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VideoTileStrip({
  participants,
  isHost,
  currentUserId,
  focusedParticipantId,
  onSelectFocusParticipant,
  onHostMuteParticipant,
  onHostDisableCamera,
  onHostRemoveParticipant,
}: VideoTileStripProps) {
  if (participants.length === 0) return null;

  return (
    <div className="w-full bg-[#080612]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-2.5 mb-3">
      <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-mono text-slate-400 border-b border-white/[0.04] mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#b4f000] animate-pulse" />
          <span className="text-slate-300">
            [ STUDY STAGE VIDEO FEED ({participants.length}) ]
          </span>
        </div>

        {focusedParticipantId && (
          <button
            type="button"
            onClick={() => onSelectFocusParticipant(null)}
            className="text-[10px] text-purple-300 hover:text-white underline font-mono"
          >
            Reset Focus View
          </button>
        )}
      </div>

      {/* HORIZONTAL SCROLLABLE TILE STRIP (Capped smooth rendering) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
        {participants.map((participant) => (
          <ParticipantVideoTile
            key={participant.identity}
            participant={participant}
            isHost={isHost}
            isFocused={focusedParticipantId === participant.identity}
            onSelectFocus={() =>
              onSelectFocusParticipant(
                focusedParticipantId === participant.identity ? null : participant.identity
              )
            }
            onHostMute={() => onHostMuteParticipant?.(participant.identity)}
            onHostDisableCam={() => onHostDisableCamera?.(participant.identity)}
            onHostRemove={() => onHostRemoveParticipant?.(participant.identity)}
          />
        ))}
      </div>
    </div>
  );
}
