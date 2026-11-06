"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Video,
  Users,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  Ban,
  Loader2,
  Info,
} from "lucide-react";

export interface PreJoinSettings {
  videoEnabled: boolean;
  audioEnabled: boolean;
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  selectedAudioOutputDeviceId: string;
  lowBandwidthMode: boolean;
}

interface PreJoinModalProps {
  roomId: string;
  userName: string;
  userRole?: string;
  /** Optional room display metadata */
  roomName?: string;
  hostName?: string;
  memberCount?: number;
  maxMembers?: number;
  /** If true the room is closed/full — show error immediately */
  roomClosed?: boolean;
  roomFull?: boolean;
  onJoin: (settings: PreJoinSettings) => void;
  onCancel?: () => void;
}

type JoinState = "idle" | "joining" | "error";

export default function PreJoinModal({
  roomId,
  userName,
  userRole = "Scholar",
  roomName,
  hostName,
  memberCount,
  maxMembers,
  roomClosed = false,
  roomFull = false,
  onJoin,
  onCancel,
}: PreJoinModalProps) {
  const { data: session } = useSession();
  const userStatus = (session?.user as any)?.status as string | undefined;

  // Camera & Mic are OFF by default
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);

  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string>("");

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [permissionDeniedType, setPermissionDeniedType] = useState<"camera" | "mic" | "both" | null>(null);
  const [hasNoDevices, setHasNoDevices] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [deviceChangeNotice, setDeviceChangeNotice] = useState<string | null>(null);

  // Join flow state
  const [joinState, setJoinState] = useState<JoinState>("idle");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Set initial error if room is closed/full
  useEffect(() => {
    if (roomClosed) {
      setJoinState("error");
      setJoinError("This study room has been closed by the host.");
    } else if (roomFull) {
      setJoinState("error");
      setJoinError(`This room is full (${memberCount ?? "?"}/${maxMembers ?? "?"} members).`);
    }
  }, [roomClosed, roomFull, memberCount, maxMembers]);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load saved device preferences
  useEffect(() => {
    try {
      const savedCam = localStorage.getItem("virella_pref_cam");
      const savedMic = localStorage.getItem("virella_pref_mic");
      const savedSpeaker = localStorage.getItem("virella_pref_speaker");
      const savedLowBw = localStorage.getItem("virella_pref_low_bw");

      if (savedCam) setSelectedVideoDeviceId(savedCam);
      if (savedMic) setSelectedAudioDeviceId(savedMic);
      if (savedSpeaker) setSelectedAudioOutputDeviceId(savedSpeaker);
      if (savedLowBw === "true") setLowBandwidthMode(true);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  // Enumerate media devices
  const refreshDevices = useCallback(async (isChange = false) => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setHasNoDevices(true);
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      const audioOutputs = devices.filter((d) => d.kind === "audiooutput");

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
      setAudioOutputDevices(audioOutputs);
      setHasNoDevices(videoInputs.length === 0 && audioInputs.length === 0);

      // Auto-select first device if none selected
      if (!selectedVideoDeviceId && videoInputs[0]) {
        setSelectedVideoDeviceId(videoInputs[0].deviceId);
      }
      if (!selectedAudioDeviceId && audioInputs[0]) {
        setSelectedAudioDeviceId(audioInputs[0].deviceId);
      }
      if (!selectedAudioOutputDeviceId && audioOutputs[0]) {
        setSelectedAudioOutputDeviceId(audioOutputs[0].deviceId);
      }

      // On hot-plug/unplug, fall back gracefully and notify user
      if (isChange) {
        const camStillHere = videoInputs.some((d) => d.deviceId === selectedVideoDeviceId);
        const micStillHere = audioInputs.some((d) => d.deviceId === selectedAudioDeviceId);
        if (!camStillHere && videoInputs[0]) {
          setSelectedVideoDeviceId(videoInputs[0].deviceId);
          setDeviceChangeNotice("Camera device changed — switched to default.");
        } else if (!micStillHere && audioInputs[0]) {
          setSelectedAudioDeviceId(audioInputs[0].deviceId);
          setDeviceChangeNotice("Microphone device changed — switched to default.");
        }
        setTimeout(() => setDeviceChangeNotice(null), 4000);
      }
    } catch (err) {
      console.warn("Could not enumerate media devices:", err);
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId, selectedAudioOutputDeviceId]);

  // Device hotplug listener
  useEffect(() => {
    refreshDevices();
    const handler = () => refreshDevices(true);
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handler);
      return () => navigator.mediaDevices.removeEventListener("devicechange", handler);
    }
  }, []);

  // Media preview stream management
  useEffect(() => {
    let isCancelled = false;

    async function setupPreviewStream() {
      // Clean up previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevel(0);
      setPermissionError(null);
      setPermissionDeniedType(null);

      if (!videoEnabled && !audioEnabled) {
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: videoEnabled
            ? selectedVideoDeviceId
              ? { deviceId: { exact: selectedVideoDeviceId }, width: { ideal: 640 }, height: { ideal: 360 } }
              : { width: { ideal: 640 }, height: { ideal: 360 } }
            : false,
          audio: audioEnabled
            ? selectedAudioDeviceId
              ? { deviceId: { exact: selectedAudioDeviceId }, echoCancellation: true, noiseSuppression: true }
              : { echoCancellation: true, noiseSuppression: true }
            : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoPreviewRef.current && videoEnabled) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Audio level meter
        if (audioEnabled) {
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              audioContextRef.current = ctx;
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 256;
              const source = ctx.createMediaStreamSource(stream);
              source.connect(analyser);
              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const updateLevel = () => {
                if (!analyser || isCancelled) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const normalized = Math.min(100, Math.round(((sum / dataArray.length) / 128) * 100));
                setAudioLevel(normalized);
                animationFrameRef.current = requestAnimationFrame(updateLevel);
              };
              updateLevel();
            }
          }
        }

        // Re-enumerate to get full labels after permission grant
        await refreshDevices();
      } catch (err: any) {
        if (isCancelled) return;
        console.warn("Media preview error:", err);

        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          const type = videoEnabled && audioEnabled ? "both" : videoEnabled ? "camera" : "mic";
          setPermissionDeniedType(type);
          setPermissionError(
            `Permission to access your ${type === "both" ? "camera and mic" : type} was denied. You can still join — your ${type === "both" ? "camera and mic" : type} will be off.`
          );
          // Auto-turn off the denied device(s) so the user can still join
          if (type === "both" || type === "camera") setVideoEnabled(false);
          if (type === "both" || type === "mic") setAudioEnabled(false);
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setPermissionError("Selected device was not found. Join without it or select a different device.");
        } else {
          setPermissionError("Could not access camera or microphone. You can join in listen/view-only mode.");
        }
      }
    }

    setupPreviewStream();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [videoEnabled, audioEnabled, selectedVideoDeviceId, selectedAudioDeviceId]);

  // Device selection persistence helpers
  const handleSelectCam = (id: string) => {
    setSelectedVideoDeviceId(id);
    try { localStorage.setItem("virella_pref_cam", id); } catch {}
  };
  const handleSelectMic = (id: string) => {
    setSelectedAudioDeviceId(id);
    try { localStorage.setItem("virella_pref_mic", id); } catch {}
  };
  const handleSelectSpeaker = (id: string) => {
    setSelectedAudioOutputDeviceId(id);
    try { localStorage.setItem("virella_pref_speaker", id); } catch {}
  };
  const handleToggleLowBw = () => {
    const next = !lowBandwidthMode;
    setLowBandwidthMode(next);
    try { localStorage.setItem("virella_pref_low_bw", String(next)); } catch {}
  };

  // The actual join handler — stops preview tracks so the room can open the camera freshly
  const handleConfirmJoin = useCallback(() => {
    if (joinState === "joining") return;

    // Guard: suspended/banned users see a blocked message
    if (userStatus === "SUSPENDED") {
      setJoinState("error");
      setJoinError("Your account has been suspended. You cannot join study rooms. Contact support for assistance.");
      return;
    }

    setJoinState("joining");
    setJoinError(null);

    // Stop local preview tracks cleanly so LiveKit doesn't fight over the device
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      onJoin({
        videoEnabled,
        audioEnabled,
        selectedVideoDeviceId,
        selectedAudioDeviceId,
        selectedAudioOutputDeviceId,
        lowBandwidthMode,
      });
    } catch (err: any) {
      setJoinState("error");
      setJoinError(err?.message || "Failed to join. Please try again.");
    }
  }, [
    joinState,
    userStatus,
    videoEnabled,
    audioEnabled,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    selectedAudioOutputDeviceId,
    lowBandwidthMode,
    onJoin,
  ]);

  // Clean cancel — stops camera light
  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onCancel?.();
  };

  // Enter key triggers Join
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && joinState === "idle") handleConfirmJoin();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleConfirmJoin, joinState]);

  // Is this user blocked from joining?
  const isBlocked = userStatus === "SUSPENDED";
  const isRoomUnavailable = roomClosed || roomFull;

  const displayRoomName = roomName || `Study Room #${roomId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      {/* Card: flex-col so sticky footer works inside a fixed-height container */}
      <div
        className="w-full max-w-2xl bg-[#0b0816]/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >

        {/* ─── HEADER ─── */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b4f000] animate-pulse" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#b4f000]">
                [ PRE-JOIN GREEN ROOM ]
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">{displayRoomName}</div>
            </div>
          </div>
          {/* Back / Leave link */}
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>

        {/* ─── ROOM INFO BAR (host, member count) ─── */}
        {(hostName || memberCount !== undefined) && (
          <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-5 text-xs text-slate-400 shrink-0">
            {hostName && (
              <span>
                Host: <span className="text-white font-medium">{hostName}</span>
              </span>
            )}
            {memberCount !== undefined && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  <span className="text-white font-medium">{memberCount}</span>
                  {maxMembers !== undefined && (
                    <span className="text-slate-500">/{maxMembers}</span>
                  )}{" "}
                  already inside
                </span>
              </span>
            )}
            <span className="font-mono text-slate-500 text-[11px]">
              You: <span className="text-slate-300">{userName}</span>
            </span>
          </div>
        )}

        {/* ─── SCROLLABLE BODY ─── */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* CAMERA PREVIEW STAGE */}
          <div className="relative aspect-video w-full rounded-2xl bg-[#06040c] border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
            {videoEnabled ? (
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400">
                  <CameraOff className="w-7 h-7" />
                </div>
                <div className="text-xs font-mono text-slate-400">Camera off (default)</div>
              </div>
            )}

            {/* Audio level meter overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300">
                {audioEnabled ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full bg-[#b4f000] transition-all duration-75"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-emerald-400">{audioLevel}%</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] text-slate-400">Microphone off</span>
                  </>
                )}
              </div>

              {/* Quick toggle buttons */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2.5 rounded-full border transition-all ${
                    audioEnabled
                      ? "bg-[#b4f000] text-black border-[#b4f000] shadow-lg shadow-[#b4f000]/20"
                      : "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                  }`}
                  title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`p-2.5 rounded-full border transition-all ${
                    videoEnabled
                      ? "bg-[#b4f000] text-black border-[#b4f000] shadow-lg shadow-[#b4f000]/20"
                      : "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                  }`}
                  title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                  {videoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Secure WebRTC badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[#b4f000]" />
              <span>SECURE WEBRTC</span>
            </div>
          </div>

          {/* Permission/device error banner */}
          {permissionError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-200">Device Access</div>
                <div>{permissionError}</div>
                <div className="text-[11px] text-slate-400">
                  You can still join the session — camera/mic will be off.
                </div>
              </div>
            </div>
          )}

          {/* Device hot-plug notification */}
          {deviceChangeNotice && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-blue-300 text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>{deviceChangeNotice}</span>
            </div>
          )}

          {/* No devices at all — view-only mode notice */}
          {hasNoDevices && !permissionError && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3 text-purple-300 text-xs">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">No camera or microphone found</div>
                <div>You can join as a listener/viewer — you will see and hear everyone but won't be audible or visible.</div>
              </div>
            </div>
          )}

          {/* Join error (room closed / full / connection failure) */}
          {joinState === "error" && joinError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 space-y-2">
                <div className="font-semibold text-red-200">Cannot join room</div>
                <div className="text-xs leading-relaxed">{joinError}</div>
                {!isBlocked && !isRoomUnavailable && (
                  <button
                    type="button"
                    onClick={() => { setJoinState("idle"); setJoinError(null); }}
                    className="mt-1 flex items-center gap-1.5 text-xs text-red-300 hover:text-white transition-colors underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Suspended user block */}
          {isBlocked && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
              <Ban className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <div>
                <div className="font-semibold text-red-200 mb-1">Account suspended</div>
                <div>Your account has been suspended and cannot join study rooms. Please contact support.</div>
              </div>
            </div>
          )}

          {/* Device selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Camera */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Camera</span>
              </label>
              <select
                value={selectedVideoDeviceId}
                onChange={(e) => handleSelectCam(e.target.value)}
                disabled={videoDevices.length === 0}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b4f000]/60 transition-colors"
              >
                {videoDevices.length === 0 ? (
                  <option value="">No Camera Detected</option>
                ) : (
                  videoDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId} className="bg-[#120e22]">
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Microphone */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>Microphone</span>
              </label>
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => handleSelectMic(e.target.value)}
                disabled={audioDevices.length === 0}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b4f000]/60 transition-colors"
              >
                {audioDevices.length === 0 ? (
                  <option value="">No Microphone Detected</option>
                ) : (
                  audioDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId} className="bg-[#120e22]">
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Speaker output */}
            {audioOutputDevices.length > 0 && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Audio Output (Speakers)</span>
                </label>
                <select
                  value={selectedAudioOutputDeviceId}
                  onChange={(e) => handleSelectSpeaker(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b4f000]/60 transition-colors"
                >
                  {audioOutputDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId} className="bg-[#120e22]">
                      {d.label || `Speaker ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Low-bandwidth toggle */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚡</span>
              <div>
                <div className="text-xs font-medium text-white">Low-Bandwidth Mode</div>
                <div className="text-[11px] text-slate-400">
                  360p video, adaptive bitrate. Saves data on weak Wi-Fi or 4G.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleLowBw}
              className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                lowBandwidthMode
                  ? "bg-[#b4f000] text-black font-semibold border-[#b4f000]"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              {lowBandwidthMode ? "ON" : "OFF"}
            </button>
          </div>

          {/* Spacer so the sticky footer doesn't overlap the last item on short screens */}
          <div className="h-2" />
        </div>

        {/* ─── STICKY JOIN FOOTER ─── (always visible, never scrolls away) */}
        <div
          className="shrink-0 px-6 py-4 border-t border-white/[0.08] flex flex-col gap-3"
          style={{
            background: "rgba(11, 8, 22, 0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Status hint row */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span className={`flex items-center gap-1 ${videoEnabled ? "text-[#b4f000]" : "text-slate-600"}`}>
              <Camera className="w-3 h-3" />
              {videoEnabled ? "Camera on" : "Camera off"}
            </span>
            <span className="text-slate-700">·</span>
            <span className={`flex items-center gap-1 ${audioEnabled ? "text-[#b4f000]" : "text-slate-600"}`}>
              <Mic className="w-3 h-3" />
              {audioEnabled ? "Mic on" : "Mic off"}
            </span>
            {lowBandwidthMode && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-amber-400">⚡ Low-BW</span>
              </>
            )}
            <span className="ml-auto text-slate-600 text-[10px]">Enter ↵ to join</span>
          </div>

          {/* Primary Join button — always full width, always reachable */}
          <button
            id="prejoin-join-btn"
            type="button"
            onClick={handleConfirmJoin}
            disabled={joinState === "joining" || isBlocked || isRoomUnavailable}
            className="btn-pill-lime w-full py-4 text-sm font-bold flex items-center justify-center gap-2.5 shadow-xl shadow-[#b4f000]/15 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"
          >
            {joinState === "joining" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Joining...</span>
              </>
            ) : isBlocked ? (
              <>
                <Ban className="w-4 h-4" />
                <span>Account Suspended</span>
              </>
            ) : isRoomUnavailable ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>{roomClosed ? "Room Closed" : "Room Full"}</span>
              </>
            ) : (
              <>
                <span>Join Study Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
