"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import { 
  Clock, 
  Sparkles, 
  Users, 
  Repeat, 
  Award, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  BookOpen, 
  Calendar,
  Flame,
  ChevronRight
} from "lucide-react";

export default function DashboardClient({ user }: { user?: any }) {
  const [activeDeckTab, setActiveDeckTab] = useState("due");

  // Sample SM-2 flashcard deck
  const [flashcards, setFlashcards] = useState([
    {
      id: "fc_1",
      topic: "Distributed Systems",
      question: "What is the CAP theorem trade-off during network partitions?",
      answer: "In the presence of a network partition (P), a distributed data store must choose between Consistency (C) and Availability (A).",
      intervalDays: 4,
      reps: 3,
      dueToday: true,
      lastReviewed: "3 days ago",
    },
    {
      id: "fc_2",
      topic: "Operating Systems",
      question: "What is thrashing in virtual memory management?",
      answer: "A state where the CPU spends more time swapping pages in and out of backing store than executing program instructions, usually caused by working set exceeding RAM.",
      intervalDays: 1,
      reps: 1,
      dueToday: true,
      lastReviewed: "Yesterday",
    },
    {
      id: "fc_3",
      topic: "Algorithms",
      question: "What is the worst-case runtime of Quickselect?",
      answer: "O(n^2) when picking poor pivots, but O(n) expected with randomized pivots or median-of-medians.",
      intervalDays: 9,
      reps: 5,
      dueToday: false,
      lastReviewed: "5 days ago",
    },
  ]);

  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);

  const handleSM2Rating = (cardId: string, rating: number) => {
    setFlashcards((prev) =>
      prev.map((card) => {
        if (card.id === cardId) {
          // SM-2 calculation simulation
          const nextInterval = rating >= 3 ? Math.round(card.intervalDays * 1.8) : 1;
          return {
            ...card,
            intervalDays: nextInterval,
            reps: card.reps + 1,
            dueToday: false,
          };
        }
        return card;
      })
    );
    setRevealedCardId(null);
  };

  return (
    <div className="min-h-screen bg-[#060509] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        
        {/* DASHBOARD TOP HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="bracket-tag mb-1">[ SCHOLAR PROFILE ]</div>
            <h1 className="text-3xl font-light tracking-tight text-white">
              Student Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Synchronized study metrics, SM-2 retention queues, and room history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/rooms?action=create" className="btn-pill-lime text-xs px-5 py-2.5 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Launch Room</span>
            </Link>
          </div>
        </div>

        {/* 4 TELEMETRY STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>TOTAL FOCUS TIME</span>
              <Clock className="w-4 h-4 text-[#b4f000]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white">4,281</span>
              <span className="text-xs font-mono text-[#b4f000]">mins</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 font-mono">
              +340 mins this week
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>CURRENT STREAK</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white">14</span>
              <span className="text-xs font-mono text-orange-400">days</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 font-mono">
              Top 5% consistency
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>3D BONSAI MATURITY</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-light text-purple-200">Flourishing</span>
            </div>
            <div className="text-[11px] text-purple-400 mt-2 font-mono">
              Stage 5: Full Canopy Bloom
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>AVG RETENTION ACCURACY</span>
              <Award className="w-4 h-4 text-[#b4f000]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white">92.4%</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 font-mono">
              Across 360 review items
            </div>
          </div>

        </div>

        {/* TWO COLUMN WORKSPACE: SPACED REPETITION & ACTIVE ROOMS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SPACED REPETITION SM-2 DECK (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-[#b4f000]" />
                  <h3 className="text-lg font-semibold text-white">
                    Spaced Repetition Queue (SM-2)
                  </h3>
                </div>
                <span className="bracket-tag text-[10px]">
                  [ {flashcards.filter((f) => f.dueToday).length} DUE TODAY ]
                </span>
              </div>

              {/* CARD REVIEW STREAM */}
              <div className="space-y-4">
                {flashcards.map((card) => {
                  const isRevealed = revealedCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs transition-all"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 font-mono">
                        <span className="text-purple-300">[ {card.topic} ]</span>
                        <span>Interval: {card.intervalDays} days</span>
                      </div>

                      <div className="text-sm font-medium text-white mb-3">
                        {card.question}
                      </div>

                      {isRevealed ? (
                        <div className="mt-3 pt-3 border-t border-white/[0.08] animate-in fade-in duration-200">
                          <div className="text-xs text-slate-300 leading-relaxed mb-4 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                            {card.answer}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">SM-2 Quality:</span>
                            <div className="flex items-center gap-1.5">
                              {[
                                { rating: 1, label: "Hard", color: "hover:bg-rose-500/20 text-rose-300" },
                                { rating: 3, label: "Good", color: "hover:bg-purple-500/20 text-purple-300" },
                                { rating: 5, label: "Easy", color: "hover:bg-lime-500/20 text-[#b4f000]" },
                              ].map((btn) => (
                                <button
                                  key={btn.rating}
                                  onClick={() => handleSM2Rating(card.id, btn.rating)}
                                  className={`px-3 py-1 rounded-lg border border-white/10 text-[11px] font-mono transition-colors ${btn.color}`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevealedCardId(card.id)}
                          className="text-[#b4f000] hover:underline text-xs font-mono"
                        >
                          Show Answer & Rate Recall →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span>Individualized review intervals auto-scheduled</span>
              <Link href="/techniques?tab=spaced_repetition" className="text-[#b4f000] hover:underline font-mono">
                Manage All Decks
              </Link>
            </div>
          </div>

          {/* MY ACTIVE ROOMS & ACTIONS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-semibold text-white">My Active Study Cohorts</h3>
                </div>
                <Link href="/rooms" className="text-xs text-[#b4f000] font-mono hover:underline">
                  Browse All
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  { id: "SYNC-402", name: "MIT Algorithms Sprint", phase: "Focusing", members: 5 },
                  { id: "FEYN-819", name: "Neurobiology Circle", phase: "Break", members: 4 },
                ].map((room) => (
                  <div
                    key={room.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs hover:border-purple-400/30 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white mb-0.5">{room.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        #{room.id} • {room.members} scholars online
                      </div>
                    </div>
                    <Link
                      href={`/rooms/${room.id}`}
                      className="btn-pill-lime text-[11px] py-1.5 px-3.5"
                    >
                      Join
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK LAUNCH PROCTORED TEST */}
            <div className="glass-panel rounded-3xl p-6 border border-purple-500/20 bg-purple-950/20 shadow-xl flex flex-col justify-between">
              <div>
                <div className="bracket-tag text-[10px] mb-1">[ MAIN TEST EVALUATION ]</div>
                <h4 className="text-base font-semibold text-white mb-1.5">
                  Proctored Diagnostic Exam
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Take a full-length proctored diagnostic with non-punitive MediaPipe gaze monitoring and weakness diagnostic mapping.
                </p>
              </div>

              <Link
                href="/proctored-test"
                className="btn-pill-lime text-xs py-2.5 px-4 w-full text-center flex items-center justify-center gap-2"
              >
                <span>Launch Proctored Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
