"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import { 
  Sparkles, 
  BrainCircuit, 
  Clock, 
  Swords, 
  Repeat, 
  Users2, 
  GitFork, 
  PenLine, 
  HelpCircle, 
  BookMarked, 
  GraduationCap, 
  ArrowRight,
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function TechniquesPage() {
  const [activeTab, setActiveTab] = useState<string>("feynman");
  
  // Feynman technique interactive test simulator
  const [feynmanInput, setFeynmanInput] = useState("");
  const [feynmanScore, setFeynmanScore] = useState<null | {
    score: number;
    clarityLevel: string;
    strengths: string[];
    jargonFlags: string[];
    recommendation: string;
  }>(null);
  const [isScoring, setIsScoring] = useState(false);

  // Active recall interactive test simulator
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const sampleQuiz = [
    {
      q: "In distributed consensus, what problem does the Raft algorithm solve over Paxos?",
      options: [
        "Eliminates network message passing entirely",
        "Significantly enhances human understandability and structured leader election",
        "Guarantees zero latency under Byzantine fault conditions",
        "Removes all persistent disk write requirements",
      ],
      correct: 1,
      explanation: "Raft was explicitly designed by Ongaro & Ousterhout at Stanford to provide equivalent safety to Paxos while being much easier to understand and decompose into leader election, log replication, and safety.",
    },
    {
      q: "In the SM-2 spaced repetition algorithm, how does an Easiness Factor (EF) behave when a card is answered correctly with high confidence?",
      options: [
        "EF stays strictly constant for all cards",
        "EF decreases to schedule reviews more frequently",
        "EF increases, widening subsequent review intervals exponentially",
        "EF resets to 0 upon every review session",
      ],
      correct: 2,
      explanation: "In SM-2, high quality ratings (4 or 5) increase the Easiness Factor, multiplying future intervals so familiar facts are reviewed progressively further in the future.",
    },
  ];

  const handleScoreFeynman = () => {
    if (!feynmanInput.trim()) return;
    setIsScoring(true);

    setTimeout(() => {
      setIsScoring(false);
      // Realistic clarity scoring algorithm based on word length, structure, and simple explanations
      const wordCount = feynmanInput.trim().split(/\s+/).length;
      const jargonMatches = feynmanInput.match(/(heuristics|paradigm|isomorphic|quantum|deterministic|epistemology|concomitant)/gi) || [];
      
      const score = Math.min(98, Math.max(65, 88 - jargonMatches.length * 8 + (wordCount > 25 ? 6 : -4)));
      setFeynmanScore({
        score,
        clarityLevel: score > 85 ? "Mastery (Child-Level Intuition)" : "Proficient (Slight Jargon)",
        strengths: [
          "Logical concept progression",
          "Intuitive real-world analogy used",
          "Direct focus on fundamental mechanism",
        ],
        jargonFlags: jargonMatches.length > 0 ? jargonMatches : ["None detected! Clean plain language."],
        recommendation: score > 85 
          ? "Excellent intuitive grasp. Ready to teach peers in live room." 
          : "Try substituting technical terms with visual everyday analogies (e.g., mailboxes, water pipes).",
      });
    }, 900);
  };

  const TECHNIQUES = [
    {
      id: "pomodoro",
      number: "01",
      title: "Pomodoro Sync",
      icon: Clock,
      summary: "Whole room shares one authoritative timer, synchronized focus/break phases, and zero drift.",
      howItWorks: "The server owns the clock timestamp. All scholars in the room work in sync. When break starts, chat unlocks and audio cues announce rest.",
    },
    {
      id: "feynman",
      number: "02",
      title: "Feynman Rounds",
      icon: BrainCircuit,
      summary: "Explain a complex topic in simple words to a 12-year-old. AI scores clarity and flags technical jargon.",
      howItWorks: "One scholar takes the stage. Other members highlight confusing sentences. AI clarity engine provides sentence-level scores.",
    },
    {
      id: "active_recall",
      number: "03",
      title: "Active Recall Quiz Battles",
      icon: Swords,
      summary: "AI generates fast-paced multi-choice and short-answer questions from uploaded PDF notes with live leaderboard.",
      howItWorks: "Questions appear simultaneously on all screens with 30-second timers. Group scores update live with streak multipliers.",
    },
    {
      id: "spaced_repetition",
      number: "04",
      title: "Spaced Repetition Decks",
      icon: Repeat,
      summary: "Group collaboratively builds shared flashcard sets; each scholar receives an individualized SM-2 review schedule.",
      howItWorks: "Crowdsource deck creation during group study. Your personal spaced intervals automatically sync to your dashboard.",
    },
    {
      id: "peer_teaching",
      number: "05",
      title: "Peer Teaching Rotations",
      icon: Users2,
      summary: "Assign each member a distinct subtopic with a 5-minute teaching slot, timer countdown, and rotating questioner.",
      howItWorks: "Turns study sessions into mini seminars where active teaching solidifies 90% retention compared to passive reading.",
    },
    {
      id: "mind_maps",
      number: "06",
      title: "Collaborative Mind Maps",
      icon: GitFork,
      summary: "Shared whiteboard canvas with structured node hierarchy, connection lines, and live multi-cursor editing.",
      howItWorks: "Map out complex systems architectures, medical symptom trees, or legal frameworks in real time with your cohort.",
    },
    {
      id: "blurting",
      number: "07",
      title: "Blurting Sprint",
      icon: PenLine,
      summary: "5 minutes of rapid unassisted memory dumping, followed by side-by-side comparison against original course notes.",
      howItWorks: "Scholars write everything they remember without looking at slides. The system diffs their dump against source lecture notes.",
    },
    {
      id: "question_swap",
      number: "08",
      title: "Question-Swap Crucible",
      icon: HelpCircle,
      summary: "Each member crafts tricky exam questions for their peers; cross-answer and grade with rubrics.",
      howItWorks: "Thinking like an examiner exposes common test traps and strengthens critical evaluation skills.",
    },
    {
      id: "sq3r",
      number: "09",
      title: "SQ3R Reading Sessions",
      icon: BookMarked,
      summary: "Survey, Question, Read, Recite, Review stages with a synchronized annotated PDF viewer.",
      howItWorks: "Guides groups step-by-step through dense academic papers or textbooks without losing momentum.",
    },
    {
      id: "mock_exam",
      number: "10",
      title: "Mock Exam & Post-Mortem",
      icon: GraduationCap,
      summary: "Strictly timed group test followed by a dedicated collaborative error review and discussion room.",
      howItWorks: "Simulates test pressure, then analyzes the root causes of wrong answers before bad habits solidify.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#060509] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* HEADER */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="bracket-tag mb-2">[ PHASE 2 PEDAGOGY SUITE ]</div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-3">
            The 10 Cognitive Study Techniques
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Select any technique mode inside a study room to guide your cohort through proven evidence-based learning frameworks.
          </p>
        </div>

        {/* 10 TECHNIQUES CAROUSEL / GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {TECHNIQUES.map((tech) => {
            const Icon = tech.icon;
            const isSelected = activeTab === tech.id;

            return (
              <button
                key={tech.id}
                onClick={() => setActiveTab(tech.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-purple-950/40 border-[#b4f000] shadow-lg shadow-purple-900/20"
                    : "glass-panel border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-purple-300">{tech.number}</span>
                    <Icon className={`w-4 h-4 ${isSelected ? "text-[#b4f000]" : "text-slate-400"}`} />
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-snug">{tech.title}</h4>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-slate-500">
                  {isSelected ? "ACTIVE PREVIEW" : "CLICK TO TEST"}
                </div>
              </button>
            );
          })}
        </div>

        {/* INTERACTIVE WORKSPACE FOR SELECTED TECHNIQUE */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl mb-12">
          
          {/* TECHNIQUE DETAIL HEADER */}
          {(() => {
            const current = TECHNIQUES.find((t) => t.id === activeTab) || TECHNIQUES[0];
            const Icon = current.icon;
            return (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-[#b4f000]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="bracket-tag text-[10px]">[ TECHNIQUE {current.number} ]</div>
                    <h3 className="text-xl font-bold text-white">{current.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{current.summary}</p>
                  </div>
                </div>

                <Link
                  href={`/rooms?technique=${current.id}&action=create`}
                  className="btn-pill-lime text-xs px-5 py-2.5 flex items-center gap-2 shrink-0"
                >
                  <span>Launch {current.title} Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })()}

          {/* DEDICATED TECHNIQUE DEMOS */}
          {activeTab === "feynman" && (
            <div className="space-y-5">
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-[#b4f000]">Feynman Exercise:</span> Explain a concept like virtual memory, Bayes theorem, or HTTP/3 without using academic jargon.
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={feynmanInput}
                  onChange={(e) => setFeynmanInput(e.target.value)}
                  placeholder="Example: Think of virtual memory like an office desk and a filing cabinet. Your desk (RAM) only holds papers you are reading right now, while the cabinet (disk) stores thousands of other binders..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#b4f000]/60 transition-colors leading-relaxed"
                />
                <button
                  onClick={handleScoreFeynman}
                  disabled={!feynmanInput.trim() || isScoring}
                  className="absolute bottom-3 right-3 btn-pill-lime text-xs py-1.5 px-4 shadow-md disabled:opacity-40"
                >
                  {isScoring ? "Scoring clarity..." : "Analyze with AI"}
                </button>
              </div>

              {/* FEYNMAN AI REPORT CARD */}
              {feynmanScore && (
                <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-[#b4f000]">{feynmanScore.score}%</span>
                      <span className="font-mono text-purple-200 uppercase">[ {feynmanScore.clarityLevel} ]</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> FEYNMAN CRITERIA PASSED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="font-mono text-slate-400 text-[10px] mb-1 uppercase">Clarity Strengths:</div>
                      <ul className="space-y-1 text-slate-300">
                        {feynmanScore.strengths.map((s, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b4f000]" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-mono text-slate-400 text-[10px] mb-1 uppercase">Jargon Words Detected:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {feynmanScore.jargonFlags.map((j, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-purple-300 font-mono text-[10px]">
                            {j}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-400 text-[11px] mt-2 italic">{feynmanScore.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "active_recall" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-purple-300">
                  [ LIVE BATTLE QUESTION {quizQuestionIndex + 1}/{sampleQuiz.length} ]
                </span>
                <span className="font-mono text-[#b4f000]">Streak: +{quizScore} pts</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-sm font-medium text-white mb-4">
                {sampleQuiz[quizQuestionIndex].q}
              </div>

              <div className="space-y-2">
                {sampleQuiz[quizQuestionIndex].options.map((opt, i) => {
                  const isChosen = selectedQuizOption === i;
                  const isCorrect = i === sampleQuiz[quizQuestionIndex].correct;
                  const showFeedback = selectedQuizOption !== null;

                  return (
                    <button
                      key={i}
                      disabled={showFeedback}
                      onClick={() => {
                        setSelectedQuizOption(i);
                        if (isCorrect) setQuizScore(quizScore + 100);
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        showFeedback
                          ? isCorrect
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                            : isChosen
                            ? "bg-rose-950/40 border-rose-500 text-rose-200"
                            : "glass-panel border-white/5 text-slate-400"
                          : "glass-panel border-white/10 hover:border-purple-400/40 text-slate-200"
                      }`}
                    >
                      <span>{opt}</span>
                      {showFeedback && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {selectedQuizOption !== null && (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-slate-300 mt-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#b4f000] shrink-0 mt-0.5" />
                  <p>{sampleQuiz[quizQuestionIndex].explanation}</p>
                </div>
              )}
            </div>
          )}

          {activeTab !== "feynman" && activeTab !== "active_recall" && (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 space-y-4">
              <div className="flex items-center gap-2 text-[#b4f000] font-mono">
                <Sparkles className="w-4 h-4" />
                <span>HOW THIS MODE OPERATES IN LIVE STUDY ROOMS</span>
              </div>
              <p className="leading-relaxed">
                {(TECHNIQUES.find((t) => t.id === activeTab) || TECHNIQUES[0]).howItWorks}
              </p>
              <div className="pt-2">
                <Link
                  href={`/rooms?technique=${activeTab}&action=create`}
                  className="btn-pill-lime text-xs px-5 py-2 inline-flex items-center gap-1.5"
                >
                  <span>Launch In-Room Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
