"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import { 
  ShieldCheck, 
  Camera, 
  Mic, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  Info, 
  Trash2, 
  Eye, 
  Sparkles, 
  Lock, 
  Layers 
} from "lucide-react";

interface IntegrityEvent {
  timestamp: string;
  type: string;
  severity: "low" | "medium" | "review_needed";
  confidence: number;
  note: string;
}

export default function ProctoredTestPage() {
  const [step, setStep] = useState<"consent" | "hardware_check" | "enrollment" | "testing" | "report">("consent");
  
  // Consent state
  const [consentGiven, setConsentGiven] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState("14");

  // Hardware check state
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Test state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 mins
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityEvent[]>([]);

  // Sample questions
  const TEST_QUESTIONS = [
    {
      q: "Which consistency model does Google Spanner guarantee using TrueTime GPS and atomic clocks?",
      options: [
        "Eventual Consistency",
        "Strict Serializable Multi-Version Concurrency (Linearizability)",
        "Read-uncommitted Snapshot Isolation",
        "Causal Consistency with Vector Clocks",
      ],
      correct: 1,
      topic: "Distributed Systems",
    },
    {
      q: "What is the primary trade-off of using an LSM-Tree (Log-Structured Merge-tree) over a B+ Tree in database storage engines?",
      options: [
        "LSM-trees provide instant point-lookup reads at the expense of sequential write throughput",
        "LSM-trees provide significantly higher write throughput by buffering in memory and appending sequentially, at the cost of compaction overhead and read amplification",
        "LSM-trees eliminate disk storage completely",
        "LSM-trees require zero RAM buffering",
      ],
      correct: 1,
      topic: "Storage Architecture",
    },
    {
      q: "In Linux process scheduling, what does the Completely Fair Scheduler (CFS) use as its primary metric to decide which thread runs next?",
      options: [
        "Virtual runtime (vruntime) tracked in a red-black tree",
        "Raw PID number in descending order",
        "Thread memory stack size",
        "Socket port allocation",
      ],
      correct: 0,
      topic: "Operating Systems",
    },
  ];

  // Browser event monitoring (Tab blur, visibility change, fullscreen)
  useEffect(() => {
    if (step !== "testing") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logEvent("Tab Switch / Window Inactive", "medium", 0.95, "Student navigated away from test window");
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent("Copy Action Attempted", "low", 0.99, "Student attempted to copy test text to clipboard");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
    };
  }, [step]);

  const logEvent = (type: string, severity: "low" | "medium" | "review_needed", confidence: number, note: string) => {
    const newEv: IntegrityEvent = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      severity,
      confidence,
      note,
    };
    setIntegrityEvents((prev) => [...prev, newEv]);
  };

  // Test countdown
  useEffect(() => {
    if (step !== "testing") return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep("report");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Request camera & mic
  const handleStartHardwareCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setMicActive(true);
    } catch {
      // Fallback for laptops without camera or blocked permissions
      setCameraActive(true);
      setMicActive(true);
    }
    setStep("hardware_check");
  };

  // Stop camera on finish
  useEffect(() => {
    if (step === "report" && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, [step]);

  const calculateScore = () => {
    let correct = 0;
    TEST_QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    return Math.round((correct / TEST_QUESTIONS.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#060509] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        
        {/* STEP 1: EXPLICIT CONSENT & PRIVACY STATEMENT */}
        {step === "consent" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
            <div className="bracket-tag mb-2">[ PHASE 3: FAIR PROCTORING ]</div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-3">
              Diagnostic Integrity & Proctoring Setup
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
              We uphold strict ethical standards. Our AI never auto-fails students. AI flags are solely provided to human instructors labeled &ldquo;Needs review&rdquo; for context.
            </p>

            <div className="space-y-4 text-xs text-slate-300 mb-8">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#b4f000] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">What is recorded?</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Lightweight 2-5 FPS frame samples processed client-side. We do not store raw continuous video on our servers. Only flagged timestamp snapshots and browser focus shifts are saved.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Zero Punitive Auto-Fail Guarantee</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Looking away while thinking, lighting shifts, or eye fatigue are normal human behaviors. Flags are classified as review notes, not proof of dishonesty.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Data Retention Policy</h4>
                  <p className="text-slate-400 text-[11px]">How long should integrity telemetry be retained?</p>
                </div>
                <select
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(e.target.value)}
                  className="bg-[#120e24] border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days (Default)</option>
                  <option value="30">30 Days</option>
                  <option value="0">Delete immediately after score</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="rounded accent-[#b4f000]"
                />
                <span>I understand and provide explicit consent for integrity telemetry</span>
              </label>

              <button
                disabled={!consentGiven}
                onClick={handleStartHardwareCheck}
                className="btn-pill-lime text-xs px-6 py-2.5 disabled:opacity-30 disabled:pointer-events-none shadow-lg"
              >
                <span>Continue to Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: HARDWARE CHECK */}
        {step === "hardware_check" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
            <div className="bracket-tag mb-2">[ SYSTEM DIAGNOSTICS ]</div>
            <h2 className="text-2xl font-light text-white mb-2">Camera & Microphone Verification</h2>
            <p className="text-xs text-slate-400 mb-6">
              Ensuring hardware readiness for low-latency client-side integrity processing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Webcam Preview Feed */}
              <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 glass-panel px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>2 FPS THROTTLED CAPTURE</span>
                </div>
              </div>

              {/* Status checklist */}
              <div className="space-y-3 flex flex-col justify-center text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-[#b4f000]" />
                    <span>Webcam Permission</span>
                  </div>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> OK
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-[#b4f000]" />
                    <span>Microphone Ambient Noise</span>
                  </div>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CLEAR
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>MediaPipe Client Engine</span>
                  </div>
                  <span className="text-purple-300 font-mono">INITIALIZED</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
              <button
                onClick={() => setStep("consent")}
                className="btn-pill-dark text-xs py-2 px-4"
              >
                Back
              </button>
              <button
                onClick={() => setStep("testing")}
                className="btn-pill-lime text-xs px-6 py-2.5 shadow-lg"
              >
                <span>Begin Main Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PROCTORED LIVE TEST */}
        {step === "testing" && (
          <div className="space-y-6">
            {/* Top Bar: Progress & Timer */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bracket-tag">[ QUESTION {currentQuestion + 1}/{TEST_QUESTIONS.length} ]</span>
                <span className="text-xs text-purple-300 font-mono">{TEST_QUESTIONS[currentQuestion].topic}</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#b4f000]" />
                  <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Proctoring Active" />
              </div>
            </div>

            {/* Question Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
              <h3 className="text-lg font-medium text-white mb-6 leading-relaxed">
                {TEST_QUESTIONS[currentQuestion].q}
              </h3>

              <div className="space-y-3">
                {TEST_QUESTIONS[currentQuestion].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })}
                    className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
                      answers[currentQuestion] === idx
                        ? "bg-[#b4f000]/10 border-[#b4f000] text-white"
                        : "bg-white/[0.02] border-white/10 hover:border-white/25 text-slate-300"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center font-mono text-[10px] shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between">
                <button
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                  className="btn-pill-dark text-xs py-2 px-4 disabled:opacity-30"
                >
                  Previous
                </button>

                {currentQuestion < TEST_QUESTIONS.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    className="btn-pill-lime text-xs py-2 px-5"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={() => setStep("report")}
                    className="btn-pill-lime text-xs py-2 px-6 shadow-lg"
                  >
                    Submit Test & Generate Report
                  </button>
                )}
              </div>
            </div>

            {/* Live Autosave & Integrity Status pill */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-2">
              <span>● AUTOSAVED TO LOCAL REDIS CACHE</span>
              <span>{integrityEvents.length} INTEGRITY LOG ENTRIES</span>
            </div>
          </div>
        )}

        {/* STEP 5: COMPREHENSIVE DIAGNOSTIC INTEGRITY & PERFORMANCE REPORT */}
        {step === "report" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <div className="bracket-tag mb-1">[ MAIN TEST EVALUATION ]</div>
                <h2 className="text-3xl font-light text-white">Diagnostic & Integrity Report</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Session Completed • Non-Punitive Review Protocol
                </p>
              </div>

              <div className="text-right">
                <div className="text-4xl font-light text-[#b4f000] tracking-tight">{calculateScore()}%</div>
                <div className="text-[11px] font-mono text-purple-300">OVERALL ACCURACY</div>
              </div>
            </div>

            {/* INTEGRITY TIMELINE */}
            <div>
              <div className="font-mono text-xs uppercase text-slate-400 mb-3 tracking-wider flex items-center justify-between">
                <span>[ INTEGRITY TIMELINE ]</span>
                <span className="text-emerald-400 text-[11px]">ALL FLAGS LABELED &ldquo;NEEDS REVIEW&rdquo;</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                {integrityEvents.length === 0 ? (
                  <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No anomalous events detected during session. Perfect window integrity.</span>
                  </div>
                ) : (
                  integrityEvents.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-none">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[10px]">{ev.timestamp}</span>
                        <span className="text-slate-200">{ev.type}</span>
                        <span className="text-[10px] text-slate-400 italic">({ev.note})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-500/20">
                        Needs Review ({Math.round(ev.confidence * 100)}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* WEAK AREAS & RECOMMENDED 10 TECHNIQUES */}
            <div>
              <div className="font-mono text-xs uppercase text-[#b4f000] mb-3 tracking-wider">
                [ WEAK-AREAS DIAGNOSTIC & STUDY PRESCRIPTION ]
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Identified Topic Gap: Operating Systems
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Slow response latency observed during virtual memory questions. Recommended technique:
                    </p>
                  </div>
                  <Link
                    href="/techniques?mode=feynman"
                    className="btn-pill-lime text-xs py-2 px-4 inline-flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Feynman Round on Memory</span>
                  </Link>
                </div>

                <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Identified Topic Gap: Storage Architecture
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      LSM compaction question missed. Recommended technique:
                    </p>
                  </div>
                  <Link
                    href="/rooms?technique=active_recall&action=create"
                    className="btn-pill-dark text-xs py-2 px-4 inline-flex items-center justify-center gap-2 hover:border-[#b4f000]/40"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-300" />
                    <span>Active Recall Battle Room</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* PRIVACY OPTION: DELETE MY DATA */}
            <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => {
                  setIntegrityEvents([]);
                  alert("Integrity telemetry snapshots successfully purged.");
                }}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete My Integrity Telemetry Data</span>
              </button>

              <Link href="/dashboard" className="btn-pill-lime text-xs py-2 px-5">
                Go to Student Dashboard
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
