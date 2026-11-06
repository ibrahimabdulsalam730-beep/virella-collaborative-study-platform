"use client";

import React, { useState } from "react";
import { completeOnboardingAction } from "@/app/actions/auth";
import { useSession } from "next-auth/react";
import {
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const AVATAR_PRESETS = [
  { id: "lime", bg: "bg-[#b4f000] text-[#05050a]", label: "Lime" },
  { id: "purple", bg: "bg-purple-600 text-white", label: "Purple" },
  { id: "violet", bg: "bg-violet-500 text-white", label: "Violet" },
  { id: "emerald", bg: "bg-emerald-500 text-[#05050a]", label: "Emerald" },
  { id: "cyan", bg: "bg-cyan-400 text-[#05050a]", label: "Cyan" },
  { id: "amber", bg: "bg-amber-400 text-[#05050a]", label: "Amber" },
];

const STUDY_GOALS = [
  "STEM Exam Preparation",
  "Medical & MCAT Residency",
  "Deep Work Focus Sprints",
  "Daily Peer Accountability",
  "Feynman Technique Mastery",
  "Algorithm & Problem Sets",
];

const SUBJECTS = [
  "Computer Science & Systems",
  "Neuroscience & Physiology",
  "Calculus & Applied Math",
  "Biochemistry & Genetics",
  "Quantum & Classical Physics",
  "Data Structures & Machine Learning",
];

export default function OnboardingPage() {
  // update() patches the JWT cookie in-place so middleware sees
  // onboardingComplete=true immediately without a full re-login.
  const { data: session, update } = useSession();

  const [displayName, setDisplayName] = useState(
    session?.user?.name || "Scholar"
  );
  const [selectedAvatar, setSelectedAvatar] = useState("lime");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "Deep Work Focus Sprints",
  ]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "Computer Science & Systems",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.length > 1
          ? prev.filter((g) => g !== goal)
          : prev
        : [...prev, goal]
    );
  };

  const toggleSubject = (subj: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj)
        ? prev.length > 1
          ? prev.filter((s) => s !== subj)
          : prev
        : [...prev, subj]
    );
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "VS"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage("Please enter a display name.");
      return;
    }
    if (selectedGoals.length === 0) {
      setErrorMessage("Please select at least one study goal.");
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMessage("Please select at least one subject of focus.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await completeOnboardingAction({
        name: displayName.trim(),
        avatar: selectedAvatar,
        studyGoals: selectedGoals,
        subjects: selectedSubjects,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save profile.");
        setIsSubmitting(false);
        return;
      }

      // Step 1: Patch the JWT token so the cookie immediately reflects
      // onboardingComplete=true. This call is fast (~60ms) and prevents
      // the middleware from bouncing back to /onboarding.
      await update({ onboardingComplete: true, name: displayName.trim() });

      // Step 2: Hard navigate (full page reload) so Next.js re-reads the
      // freshly patched JWT on the server. Using router.push would race
      // against the JWT propagation.
      window.location.href = "/dashboard";
    } catch {
      setErrorMessage("Network error saving profile.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-x-hidden selection:bg-[#b4f000] selection:text-[#05050a]">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 bg-hero-grid bg-violet-radial pointer-events-none opacity-60" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-600/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full glass-panel p-8 sm:p-11 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="bracket-tag mb-2.5">[ INITIAL SETUP ]</div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-2">
            Personalize Your Scholar Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Set your peer presence badge, core learning targets, and subject tracks.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* 1. Display Name & Avatar Selection */}
          <div className="space-y-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-purple-300">
              1. Scholar Badge & Name
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              {/* Avatar Preview */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg shrink-0 transition-transform ${
                  AVATAR_PRESETS.find((a) => a.id === selectedAvatar)?.bg ||
                  "bg-[#b4f000] text-black"
                }`}
              >
                {getInitials(displayName)}
              </div>

              {/* Name Input */}
              <div className="flex-1 w-full space-y-1.5">
                <input
                  type="text"
                  required
                  placeholder="Your Name / Handle"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
                />
                <span className="text-[11px] text-slate-500 block">
                  Visible to room peers and cohort members
                </span>
              </div>
            </div>

            {/* Avatar Color Swatches */}
            <div>
              <span className="text-[11px] text-slate-400 mb-2 block">
                Choose Badge Theme:
              </span>
              <div className="flex items-center gap-2.5">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.id)}
                    className={`w-8 h-8 rounded-xl ${preset.bg} flex items-center justify-center text-xs font-bold transition-all ${
                      selectedAvatar === preset.id
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#05050a] scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {selectedAvatar === preset.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Primary Study Goals */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-purple-300">
                2. Primary Study Goals
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Select one or more
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STUDY_GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-[#b4f000]/60 bg-[#b4f000]/10 text-white font-medium shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{goal}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#b4f000] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Focus Subjects */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-purple-300">
                3. Subjects of Focus
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Select one or more
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUBJECTS.map((subj) => {
                const isSelected = selectedSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-purple-500/60 bg-purple-950/30 text-white font-medium shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{subj}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#b4f000] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill-lime w-full text-xs sm:text-sm py-4 mt-6 flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? "Finalizing Setup..." : "Complete Setup & Enter Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
