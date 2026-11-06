"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  ConnectionState,
  RemoteParticipant,
  LocalParticipant,
  Participant,
} from "livekit-client";
import VideoTileStrip, { RoomParticipantState } from "./VideoTileStrip";
import MediaControlDock from "./MediaControlDock";
import { PreJoinSettings } from "./PreJoinModal";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface LiveKitRoomWrapperProps {
  roomId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  preJoinSettings: PreJoinSettings;
  pomodoroPhase?: "focus" | "break";
  pomodoroAutoMuteEnabled?: boolean;
  onRealMicStateChange?: (userId: string, isMuted: boolean) => void;
  onRealCameraStateChange?: (userId: string, isOff: boolean) => void;
  onLeave: () => void;
}

export default function LiveKitRoomWrapper({
  roomId,
  userId,
  userName,
  isHost,
  preJoinSettings,
  pomodoroPhase,
  pomodoroAutoMuteEnabled = false,
  onRealMicStateChange,
  onRealCameraStateChange,
  onLeave,
}: LiveKitRoomWrapperProps) {
  const [isMicOn, setIsMicOn] = useState(preJoinSettings.audioEnabled);
  const [isCameraOn, setIsCameraOn] = useState(preJoinSettings.videoEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState(preJoinSettings.lowBandwidthMode);
  const [isFocusLayout, setIsFocusLayout] = useState(false);
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [isLocalPreviewMode, setIsLocalPreviewMode] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "reconnecting" | "error">(
    "connecting"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isLocalPreviewRef = useRef(false);
  const [participants, setParticipants] = useState<RoomParticipantState[]>([]);

  // Distinct avatar colors generator
  const getAvatarColor = useCallback((id: string) => {
    const colors = ["#b4f000", "#8b5cf6", "#ec4899", "#38bdf8", "#f59e0b", "#10b981"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Sync participant list from LiveKit room instance
  const syncParticipants = useCallback(() => {
    if (isLocalPreviewRef.current) return;
    const room = roomRef.current;
    if (!room) return;

    const list: RoomParticipantState[] = [];

    // 1. Local participant
    const local = room.localParticipant;
    const localVideoTrackPublication = Array.from(local.videoTrackPublications.values())[0];
    const localAudioTrackPublication = Array.from(local.audioTrackPublications.values())[0];

    list.push({
      identity: local.identity,
      name: local.name || userName,
      role: isHost ? "host" : "member",
      isLocal: true,
      isSpeaking: local.isSpeaking,
      micMuted: !local.isMicrophoneEnabled,
      cameraOff: !local.isCameraEnabled,
      handRaised: isHandRaised,
      connectionQuality: local.connectionQuality === "poor" ? "poor" : "excellent",
      avatarColor: getAvatarColor(local.identity),
      videoTrack: localVideoTrackPublication?.track,
      audioTrack: localAudioTrackPublication?.track,
    });

    // Notify parent for presence roster sync
    onRealMicStateChange?.(userId, !local.isMicrophoneEnabled);
    onRealCameraStateChange?.(userId, !local.isCameraEnabled);

    // 2. Remote participants
    room.remoteParticipants.forEach((remote: RemoteParticipant) => {
      const videoPub = Array.from(remote.videoTrackPublications.values())[0];
      const audioPub = Array.from(remote.audioTrackPublications.values())[0];

      let meta: any = {};
      try {
        if (remote.metadata) meta = JSON.parse(remote.metadata);
      } catch {}

      const isMuted = !remote.isMicrophoneEnabled;
      const isCamOff = !remote.isCameraEnabled;

      list.push({
        identity: remote.identity,
        name: remote.name || "Scholar",
        role: meta.role === "INSTRUCTOR" ? "host" : "member",
        isLocal: false,
        isSpeaking: remote.isSpeaking,
        micMuted: isMuted,
        cameraOff: isCamOff,
        connectionQuality: remote.connectionQuality === "poor" ? "poor" : "good",
        avatarColor: getAvatarColor(remote.identity),
        videoTrack: videoPub?.track,
        audioTrack: audioPub?.track,
      });

      onRealMicStateChange?.(remote.identity, isMuted);
      onRealCameraStateChange?.(remote.identity, isCamOff);
    });

    setParticipants(list);
  }, [userName, isHost, isHandRaised, userId, getAvatarColor, onRealMicStateChange, onRealCameraStateChange]);

  // Fallback: Start standalone local preview when LiveKit cloud is not configured
  const startLocalPreview = useCallback(async () => {
    isLocalPreviewRef.current = true;
    setIsLocalPreviewMode(true);
    let stream: MediaStream | null = null;

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: preJoinSettings.videoEnabled
            ? {
                deviceId: preJoinSettings.selectedVideoDeviceId || undefined,
              }
            : false,
          audio: preJoinSettings.audioEnabled
            ? {
                deviceId: preJoinSettings.selectedAudioDeviceId || undefined,
              }
            : false,
        });
        localStreamRef.current = stream;
      }
    } catch (e) {
      console.warn("Could not access camera/mic for local preview:", e);
    }

    const videoTrack = stream?.getVideoTracks()[0]
      ? { mediaStreamTrack: stream.getVideoTracks()[0] }
      : undefined;
    const audioTrack = stream?.getAudioTracks()[0]
      ? { mediaStreamTrack: stream.getAudioTracks()[0] }
      : undefined;

    setParticipants([
      {
        identity: userId,
        name: userName,
        role: isHost ? "host" : "member",
        isLocal: true,
        isSpeaking: false,
        micMuted: !preJoinSettings.audioEnabled,
        cameraOff: !preJoinSettings.videoEnabled,
        handRaised: false,
        connectionQuality: "good",
        avatarColor: getAvatarColor(userId),
        videoTrack,
        audioTrack,
      },
    ]);

    setConnectionStatus("connected");
    setIsMicOn(preJoinSettings.audioEnabled);
    setIsCameraOn(preJoinSettings.videoEnabled);
    onRealMicStateChange?.(userId, !preJoinSettings.audioEnabled);
    onRealCameraStateChange?.(userId, !preJoinSettings.videoEnabled);
  }, [userId, userName, isHost, preJoinSettings, getAvatarColor, onRealMicStateChange, onRealCameraStateChange]);

  // Connect to LiveKit Room
  useEffect(() => {
    let isCancelled = false;

    async function initLiveKit() {
      try {
        setConnectionStatus("connecting");
        setErrorMessage(null);

        // Fetch LiveKit server token
        const res = await fetch(`/api/livekit/token?roomId=${encodeURIComponent(roomId)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Could not retrieve media access token");
        }

        const data = await res.json();
        if (isCancelled) return;

        // Gracefully switch to local preview if LiveKit is unconfigured in development
        if (data.isConfigured === false || !data.token || !data.url) {
          await startLocalPreview();
          return;
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: isLowBandwidth ? VideoPresets.h360.resolution : VideoPresets.h720.resolution,
            deviceId: preJoinSettings.selectedVideoDeviceId || undefined,
          },
          audioCaptureDefaults: {
            deviceId: preJoinSettings.selectedAudioDeviceId || undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        roomRef.current = room;

        // Register room event listeners
        room.on(RoomEvent.Connected, () => {
          if (isCancelled) return;
          setConnectionStatus("connected");
          syncParticipants();
        });

        room.on(RoomEvent.Reconnecting, () => {
          setConnectionStatus("reconnecting");
        });

        room.on(RoomEvent.Reconnected, () => {
          setConnectionStatus("connected");
          syncParticipants();
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!isCancelled && !isLocalPreviewRef.current) {
            setConnectionStatus("error");
          }
        });

        room.on(RoomEvent.ParticipantConnected, () => syncParticipants());
        room.on(RoomEvent.ParticipantDisconnected, () => syncParticipants());
        room.on(RoomEvent.TrackSubscribed, () => syncParticipants());
        room.on(RoomEvent.TrackUnsubscribed, () => syncParticipants());
        room.on(RoomEvent.TrackMuted, () => syncParticipants());
        room.on(RoomEvent.TrackUnmuted, () => syncParticipants());
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          if (isFocusLayout && speakers.length > 0) {
            setFocusedParticipantId(speakers[0].identity);
          }
          syncParticipants();
        });

        // Connect to room using server token
        try {
          await room.connect(data.url, data.token);
        } catch (connErr: any) {
          const errMsg = connErr?.message || "";
          if (errMsg.includes("invalid API key") || errMsg.includes("signal connection")) {
            console.warn("LiveKit API key is placeholder or invalid. Falling back to local preview mode.");
            await startLocalPreview();
            return;
          }
          throw connErr;
        }

        if (isCancelled) {
          room.disconnect();
          return;
        }

        // Apply pre-join preferences
        if (preJoinSettings.videoEnabled) {
          await room.localParticipant.setCameraEnabled(true);
          setIsCameraOn(true);
        }
        if (preJoinSettings.audioEnabled) {
          await room.localParticipant.setMicrophoneEnabled(true);
          setIsMicOn(true);
        }

        syncParticipants();
      } catch (err: any) {
        if (isCancelled) return;
        console.error("LiveKit connection failure:", err);
        // If connection fails due to invalid key, fall back gracefully
        if (err?.message?.includes("invalid API key")) {
          await startLocalPreview();
          return;
        }
        setConnectionStatus("error");
        setErrorMessage(
          err.message || "Failed to establish LiveKit connection. Ensure LIVEKIT_URL is reachable."
        );
      }
    }

    initLiveKit();

    return () => {
      isCancelled = true;
      if (roomRef.current) {
        try {
          roomRef.current.localParticipant.videoTrackPublications.forEach((pub) => {
            pub.track?.stop();
          });
          roomRef.current.localParticipant.audioTrackPublications.forEach((pub) => {
            pub.track?.stop();
          });
          roomRef.current.disconnect();
        } catch {}
        roomRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
    };
  }, [roomId, isLowBandwidth, preJoinSettings, syncParticipants, isFocusLayout, startLocalPreview]);

  // Pomodoro Focus Phase auto-mute integration
  useEffect(() => {
    if (pomodoroAutoMuteEnabled && pomodoroPhase === "focus" && isMicOn) {
      if (isLocalPreviewRef.current) {
        localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
        setIsMicOn(false);
        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, micMuted: true } : p)));
        onRealMicStateChange?.(userId, true);
      } else if (roomRef.current) {
        roomRef.current.localParticipant.setMicrophoneEnabled(false);
        setIsMicOn(false);
        syncParticipants();
      }
    }
  }, [pomodoroPhase, pomodoroAutoMuteEnabled, isMicOn, syncParticipants, onRealMicStateChange, userId]);

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (isLocalPreviewRef.current) {
      const nextState = !isMicOn;
      setIsMicOn(nextState);
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = nextState));
      setParticipants((prev) =>
        prev.map((p) => (p.isLocal ? { ...p, micMuted: !nextState } : p))
      );
      onRealMicStateChange?.(userId, !nextState);
      return;
    }

    const room = roomRef.current;
    if (!room) return;

    try {
      const nextState = !isMicOn;
      await room.localParticipant.setMicrophoneEnabled(nextState);
      setIsMicOn(nextState);
      syncParticipants();
    } catch (err) {
      console.error("Failed to toggle mic:", err);
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (isLocalPreviewRef.current) {
      const nextState = !isCameraOn;
      setIsCameraOn(nextState);
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = nextState));
      setParticipants((prev) =>
        prev.map((p) => (p.isLocal ? { ...p, cameraOff: !nextState } : p))
      );
      onRealCameraStateChange?.(userId, !nextState);
      return;
    }

    const room = roomRef.current;
    if (!room) return;

    try {
      const nextState = !isCameraOn;
      await room.localParticipant.setCameraEnabled(nextState);
      setIsCameraOn(nextState);
      syncParticipants();
    } catch (err) {
      console.error("Failed to toggle camera:", err);
    }
  };

  // Toggle Screen Share
  const handleToggleScreenShare = async () => {
    if (isLocalPreviewRef.current) {
      if (!isScreenSharing) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = displayStream;
          setIsScreenSharing(true);
          const screenTrack = displayStream.getVideoTracks()[0];
          setParticipants((prev) =>
            prev.map((p) =>
              p.isLocal ? { ...p, videoTrack: { mediaStreamTrack: screenTrack } } : p
            )
          );
          screenTrack.onended = () => {
            setIsScreenSharing(false);
            const origVideo = localStreamRef.current?.getVideoTracks()[0];
            setParticipants((prev) =>
              prev.map((p) =>
                p.isLocal
                  ? {
                      ...p,
                      videoTrack: origVideo ? { mediaStreamTrack: origVideo } : undefined,
                    }
                  : p
              )
            );
          };
        } catch {
          setIsScreenSharing(false);
        }
      } else {
        screenStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        const origVideo = localStreamRef.current?.getVideoTracks()[0];
        setParticipants((prev) =>
          prev.map((p) =>
            p.isLocal
              ? {
                  ...p,
                  videoTrack: origVideo ? { mediaStreamTrack: origVideo } : undefined,
                }
              : p
          )
        );
      }
      return;
    }

    const room = roomRef.current;
    if (!room) return;

    try {
      const nextState = !isScreenSharing;
      await room.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
      syncParticipants();
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
      setIsScreenSharing(false);
    }
  };

  // Toggle Hand Raised
  const handleToggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (isLocalPreviewRef.current) {
      setParticipants((prev) =>
        prev.map((p) => (p.isLocal ? { ...p, handRaised: nextState } : p))
      );
    } else {
      syncParticipants();
    }
  };

  // Toggle Low-Bandwidth Mode
  const handleToggleLowBandwidth = () => {
    setIsLowBandwidth(!isLowBandwidth);
  };

  // Toggle Focus Layout
  const handleToggleFocusLayout = () => {
    const next = !isFocusLayout;
    setIsFocusLayout(next);
    if (!next) {
      setFocusedParticipantId(null);
    }
  };

  // Host Controls
  const handleHostMute = async (participantId: string) => {
    console.log(`[Host Action] Mute requested for ${participantId}`);
  };

  const handleHostDisableCam = async (participantId: string) => {
    console.log(`[Host Action] Stop video requested for ${participantId}`);
  };

  const handleHostRemove = async (participantId: string) => {
    console.log(`[Host Action] Remove participant requested for ${participantId}`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* CONNECTION STATUS & RECONNECTING BANNER */}
      {connectionStatus === "reconnecting" && (
        <div className="w-full bg-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 text-xs font-mono text-amber-300 flex items-center justify-center gap-2 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Connection interrupted. Reconnecting without state loss...</span>
        </div>
      )}

      {isLocalPreviewMode && (
        <div className="w-full bg-[#b4f000]/10 border-b border-[#b4f000]/20 px-4 py-1.5 text-xs font-mono text-[#b4f000] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b4f000] inline-block animate-pulse" />
            <span>Local Video Preview Mode (Placeholder LiveKit keys detected in .env.local). Realtime socket, whiteboard & chat are fully live.</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Add LiveKit Cloud keys for multi-peer WebRTC</span>
        </div>
      )}

      {connectionStatus === "error" && errorMessage && (
        <div className="w-full bg-rose-500/15 border-b border-rose-500/25 px-4 py-2 text-xs font-mono text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[11px] underline hover:text-white"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* TOP VIDEO TILE STRIP */}
      {participants.length > 0 && (
        <VideoTileStrip
          participants={participants}
          isHost={isHost}
          currentUserId={userId}
          focusedParticipantId={focusedParticipantId}
          onSelectFocusParticipant={setFocusedParticipantId}
          onHostMuteParticipant={handleHostMute}
          onHostDisableCamera={handleHostDisableCam}
          onHostRemoveParticipant={handleHostRemove}
        />
      )}

      {/* FLOATING BOTTOM CONTROL DOCK */}
      <MediaControlDock
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        isLowBandwidth={isLowBandwidth}
        isFocusLayout={isFocusLayout}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHand={handleToggleHand}
        onToggleLowBandwidth={handleToggleLowBandwidth}
        onToggleFocusLayout={handleToggleFocusLayout}
        onLeaveRoom={onLeave}
      />
    </div>
  );
}
