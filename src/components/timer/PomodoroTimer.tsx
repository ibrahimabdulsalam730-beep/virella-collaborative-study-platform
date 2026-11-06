"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Bell, Volume2, VolumeX, Shield, Sparkles } from "lucide-react";

export interface PomodoroState {
  phase: "focus" | "short_break" | "long_break";
  durationSeconds: number;
  startTimeMs: number | null;
  isPaused: boolean;
  remainingSecondsWhenPaused: number;
  round: number;
  totalRounds: number;
}

interface PomodoroTimerProps {
  roomId: string;
  isHost?: boolean;
  initialState?: Partial<PomodoroState>;
  onStateChangeBroadcast?: (state: PomodoroState) => void;
  externalState?: PomodoroState;
}

const DEFAULT_DURATIONS = {
  focus: 25 * 60, // 25 mins
  short_break: 5 * 60, // 5 mins
  long_break: 15 * 60, // 15 mins
};

export default function PomodoroTimer({
  roomId,
  isHost = true,
  initialState,
  onStateChangeBroadcast,
  externalState,
}: PomodoroTimerProps) {
  // Authoritative State
  const [timerState, setTimerState] = useState<PomodoroState>({
    phase: "focus",
    durationSeconds: DEFAULT_DURATIONS.focus,
    startTimeMs: null,
    isPaused: true,
    remainingSecondsWhenPaused: DEFAULT_DURATIONS.focus,
    round: 1,
    totalRounds: 4,
    ...initialState,
  });

  const [remainingDisplay, setRemainingDisplay] = useState<number>(DEFAULT_DURATIONS.focus);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const chimePlayedRef = useRef(false);

  // Synthesize pleasant bell chime
  const playChime = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High A note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio blocked by browser policy until user gesture
    }
  }, [audioEnabled]);

  // Sync external state from peers/server
  useEffect(() => {
    if (externalState) {
      setTimerState(externalState);
    }
  }, [externalState]);

  // Calculate live countdown based on server-authoritative timestamps
  useEffect(() => {
    const updateCountdown = () => {
      if (timerState.isPaused || !timerState.startTimeMs) {
        setRemainingDisplay(timerState.remainingSecondsWhenPaused);
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - timerState.startTimeMs) / 1000);
      const remaining = timerState.durationSeconds - elapsedSeconds;

      if (remaining <= 0) {
        setRemainingDisplay(0);
        if (!chimePlayedRef.current) {
          chimePlayedRef.current = true;
          playChime();
        }
      } else {
        setRemainingDisplay(remaining);
        chimePlayedRef.current = false;
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 500);
    return () => clearInterval(interval);
  }, [timerState, playChime]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // HOST CONTROLS
  const handleStartResume = () => {
    if (!isHost) return;
    const now = Date.now();
    const newState: PomodoroState = {
      ...timerState,
      isPaused: false,
      startTimeMs: now - (timerState.durationSeconds - timerState.remainingSecondsWhenPaused) * 1000,
    };
    setTimerState(newState);
    onStateChangeBroadcast?.(newState);
  };

  const handlePause = () => {
    if (!isHost) return;
    const now = Date.now();
    let currentLeft = timerState.remainingSecondsWhenPaused;
    if (timerState.startTimeMs && !timerState.isPaused) {
      const elapsed = Math.floor((now - timerState.startTimeMs) / 1000);
      currentLeft = Math.max(0, timerState.durationSeconds - elapsed);
    }

    const newState: PomodoroState = {
      ...timerState,
      isPaused: true,
      remainingSecondsWhenPaused: currentLeft,
      startTimeMs: null,
    };
    setTimerState(newState);
    onStateChangeBroadcast?.(newState);
  };

  const handleReset = () => {
    if (!isHost) return;
    const defaultSecs = DEFAULT_DURATIONS[timerState.phase];
    const newState: PomodoroState = {
      ...timerState,
      isPaused: true,
      startTimeMs: null,
      remainingSecondsWhenPaused: defaultSecs,
      durationSeconds: defaultSecs,
    };
    setTimerState(newState);
    onStateChangeBroadcast?.(newState);
  };

  const handleSkipPhase = () => {
    if (!isHost) return;
    let nextPhase: "focus" | "short_break" | "long_break" = "focus";
    let nextRound = timerState.round;

    if (timerState.phase === "focus") {
      if (timerState.round >= timerState.totalRounds) {
        nextPhase = "long_break";
      } else {
        nextPhase = "short_break";
      }
    } else {
      nextPhase = "focus";
      nextRound = timerState.phase === "long_break" ? 1 : timerState.round + 1;
    }

    const nextDur = DEFAULT_DURATIONS[nextPhase];
    const newState: PomodoroState = {
      phase: nextPhase,
      durationSeconds: nextDur,
      startTimeMs: null,
      isPaused: true,
      remainingSecondsWhenPaused: nextDur,
      round: nextRound,
      totalRounds: timerState.totalRounds,
    };
    setTimerState(newState);
    onStateChangeBroadcast?.(newState);
  };

  // Phase colors & titles
  const phaseMetadata = {
    focus: { title: "DEEP FOCUS", color: "#b4f000", badge: "bg-[#b4f000]/10 text-[#b4f000] border-[#b4f000]/30" },
    short_break: { title: "SHORT BREAK", color: "#c084fc", badge: "bg-purple-900/30 text-purple-300 border-purple-500/30" },
    long_break: { title: "LONG RECOVERY", color: "#38bdf8", badge: "bg-sky-900/30 text-sky-300 border-sky-500/30" },
  }[timerState.phase];

  // Circle progress calculation
  const progressRatio = Math.max(0, Math.min(1, remainingDisplay / timerState.durationSeconds));
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center select-none">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider border ${phaseMetadata.badge}`}>
            [ {phaseMetadata.title} ]
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Cycle {timerState.round}/{timerState.totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 flex items-center gap-1">
              <Shield className="w-3 h-3" /> HOST CONTROL
            </span>
          )}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title={audioEnabled ? "Mute chimes" : "Enable chimes"}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#b4f000]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* CIRCULAR TIMER DISPLAY */}
      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        <svg className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="88"
            cy="88"
            r={circleRadius}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Animated active progress circle */}
          <circle
            cx="88"
            cy="88"
            r={circleRadius}
            stroke={phaseMetadata.color}
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        {/* Center Digital Counter */}
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-light text-white tracking-tight font-mono">
            {formatTime(remainingDisplay)}
          </span>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5">
            {timerState.isPaused ? "PAUSED" : "RUNNING"}
          </span>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-3 mt-3">
        {isHost ? (
          <>
            {timerState.isPaused ? (
              <button
                onClick={handleStartResume}
                className="btn-pill-lime text-xs px-5 py-2 flex items-center gap-1.5 shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="btn-pill-dark text-xs px-5 py-2 flex items-center gap-1.5 border-purple-500/30 text-purple-200"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={handleSkipPhase}
              className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-300 transition-colors"
              title="Skip to next phase"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-400 transition-colors"
              title="Reset current phase"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-xs text-slate-400 font-mono italic">
            Synced with room host timer
          </div>
        )}
      </div>

      {/* Sync indicator */}
      <div className="mt-4 pt-2.5 border-t border-white/[0.06] w-full flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          SERVER AUTHORITATIVE
        </span>
        <span className="text-[#b4f000]">ZERO DRIFT</span>
      </div>
    </div>
  );
}
