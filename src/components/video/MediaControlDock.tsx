"use client";

import React from "react";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  ScreenShareOff,
  Hand,
  LogOut,
  Maximize2,
  Zap,
  Volume2,
} from "lucide-react";

interface MediaControlDockProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isLowBandwidth: boolean;
  isFocusLayout: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleLowBandwidth: () => void;
  onToggleFocusLayout: () => void;
  onLeaveRoom: () => void;
}

export default function MediaControlDock({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  isHandRaised,
  isLowBandwidth,
  isFocusLayout,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHand,
  onToggleLowBandwidth,
  onToggleFocusLayout,
  onLeaveRoom,
}: MediaControlDockProps) {
  return (
    <div className="flex items-center justify-center p-2">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#0a0814]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        
        {/* MICROPHONE TOGGLE */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`px-3.5 py-2 rounded-full font-mono text-xs flex items-center gap-2 transition-all active:scale-95 ${
            isMicOn
              ? "bg-[#b4f000] text-black font-semibold shadow-lg shadow-[#b4f000]/20"
              : "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
          }`}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden md:inline">{isMicOn ? "MIC ON" : "MUTED"}</span>
        </button>

        {/* CAMERA TOGGLE */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`px-3.5 py-2 rounded-full font-mono text-xs flex items-center gap-2 transition-all active:scale-95 ${
            isCameraOn
              ? "bg-[#b4f000] text-black font-semibold shadow-lg shadow-[#b4f000]/20"
              : "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
          }`}
          title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          <span className="hidden md:inline">{isCameraOn ? "CAM ON" : "CAM OFF"}</span>
        </button>

        {/* SCREEN SHARE TOGGLE */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`px-3 py-2 rounded-full font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
            isScreenSharing
              ? "bg-purple-600 text-white font-semibold shadow-lg shadow-purple-600/30 border border-purple-400/40"
              : "bg-white/[0.04] text-slate-300 border border-white/10 hover:border-white/20 hover:text-white"
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Your Screen"}
        >
          {isScreenSharing ? (
            <ScreenShareOff className="w-4 h-4 text-purple-200" />
          ) : (
            <ScreenShare className="w-4 h-4 text-slate-400" />
          )}
          <span className="hidden lg:inline">{isScreenSharing ? "SHARING" : "SCREEN"}</span>
        </button>

        {/* RAISE HAND TOGGLE */}
        <button
          type="button"
          onClick={onToggleHand}
          className={`p-2 sm:px-3 sm:py-2 rounded-full font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
            isHandRaised
              ? "bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20"
              : "bg-white/[0.04] text-slate-300 border border-white/10 hover:border-white/20 hover:text-white"
          }`}
          title={isHandRaised ? "Lower Hand" : "Raise Hand"}
        >
          <Hand className={`w-4 h-4 ${isHandRaised ? "animate-bounce" : "text-amber-400"}`} />
          <span className="hidden lg:inline">{isHandRaised ? "HAND UP" : "RAISE"}</span>
        </button>

        {/* LOW-BANDWIDTH / AUDIO ONLY TOGGLE */}
        <button
          type="button"
          onClick={onToggleLowBandwidth}
          className={`p-2 sm:px-3 sm:py-2 rounded-full font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
            isLowBandwidth
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "bg-white/[0.04] text-slate-400 border border-white/10 hover:border-white/20 hover:text-white"
          }`}
          title={isLowBandwidth ? "Low-Bandwidth Mode Active (360p / Audio Priority)" : "Enable Low-Bandwidth Mode for weak Wi-Fi/4G"}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">{isLowBandwidth ? "360P / LOW-BW" : "ADAPTIVE"}</span>
        </button>

        {/* FOCUS VIEW TOGGLE */}
        <button
          type="button"
          onClick={onToggleFocusLayout}
          className={`p-2 sm:px-3 sm:py-2 rounded-full font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
            isFocusLayout
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "bg-white/[0.04] text-slate-400 border border-white/10 hover:border-white/20 hover:text-white"
          }`}
          title={isFocusLayout ? "Disable Focus View" : "Enable Focus View"}
        >
          <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden xl:inline">FOCUS VIEW</span>
        </button>

        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* LEAVE ROOM BUTTON */}
        <button
          type="button"
          onClick={onLeaveRoom}
          className="px-3.5 py-2 rounded-full font-mono text-xs bg-red-950/40 text-red-300 border border-red-500/40 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-lg"
          title="Disconnect from Room"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">LEAVE</span>
        </button>

      </div>
    </div>
  );
}
