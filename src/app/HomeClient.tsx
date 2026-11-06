"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import IntroController, { useIntroPhase } from "@/components/intro/IntroController";
import Navbar from "@/components/navigation/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import { ArrowRight, BrainCircuit, Clock, PenTool } from "lucide-react";

/**
 * Scroll-triggered fade-in observer for below-the-fold sections.
 * Triggers once when the section enters 10% of the viewport.
 */
function ScrollRevealSection({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translate3d(0, 0, 0)" : "translate3d(0, 28px, 0)",
        transition:
          "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}

/** Below-the-fold content: hidden until 'siteReveal' / 'done', with preserved layout space */
function PageBody() {
  const { phase } = useIntroPhase();
  const visible = phase === "siteReveal" || phase === "done";

  return (
    <div
      className={`transition-opacity duration-700 ease-out ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* ─── [ FEATURES ] ─── */}
      <ScrollRevealSection
        id="features"
        className="relative py-24 border-t border-b border-white/[0.08] bg-[#07050d]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="bracket-tag mb-2.5">[ FEATURES ]</div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-4">
              Turning Raw Data Into Deep Mastery
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Optimize study cycles, conquer cognitive gaps, and build permanent neural retention through synchronized group science.
            </p>
          </div>

          {/* Features Illustration */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-12 mx-auto max-w-4xl group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/features-illustration.jpg"
              alt="Virella Study platform feature cards: Pomodoro Timer, Vector Whiteboard, and Cognitive Modes illustrated"
              className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              style={{ aspectRatio: "16/9" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07050d] pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: Clock,
                title: "Server-Authoritative Pomodoro",
                desc: "The room server owns the clock timestamp. Clients calculate countdowns locally with zero time drift, automatic reconnection resilience, and shared audio cues.",
                tag: "[ 25m FOCUS / 5m REST ]",
                badge: "Synced",
              },
              {
                Icon: PenTool,
                title: "Vector Shared Whiteboard",
                desc: "Batched stroke streaming to reduce bandwidth. Freehand pen, highlighters, geometric shapes, undo/redo, PNG exports, and full offline restoration.",
                tag: "[ LOW BANDWIDTH ]",
                badge: "Batched",
              },
              {
                Icon: BrainCircuit,
                title: "10 Cognitive Session Modes",
                desc: "Switch instantly into Feynman explanation rounds with AI clarity ratings, live quiz battles, spaced repetition decks, or rapid memory blurting.",
                tag: "[ FEYNMAN + RECALL ]",
                badge: "Modular",
              },
            ].map(({ Icon, title, desc, tag, badge }) => (
              <div
                key={title}
                className="glass-panel glass-panel-hover rounded-2xl p-7 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-[#b4f000]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2.5">{title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">{desc}</p>
                </div>
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-purple-300">
                  <span>{tag}</span>
                  <span className="text-[#b4f000]">● {badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─── [ ARCHITECTURE ROADMAP / JOURNEY ] ─── */}
      <ScrollRevealSection id="impacts">
        <TimelineSection />
      </ScrollRevealSection>

      {/* ─── [ JOIN NOW ] ─── */}
      <ScrollRevealSection className="py-24 border-t border-white/[0.08] bg-gradient-to-b from-[#0a0814] to-[#060509] relative overflow-hidden">
        <div className="absolute inset-0 bg-violet-radial pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bracket-tag mb-3">[ JOIN NOW ]</div>
          <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-white mb-4">
            Get Started with Virella Study
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Take the first step toward smarter, data-driven collaborative mastery with your peers today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/rooms?action=create" className="btn-pill-lime text-sm px-8 py-4 shadow-xl">
              <span>Start Studying</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/rooms" className="btn-pill-dark text-sm px-7 py-4">
              <span>Browse Active Cohorts</span>
            </Link>
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─── FOOTER ─── */}
      <footer id="about" className="border-t border-white/[0.08] bg-[#050408] py-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#b4f000] flex items-center justify-center text-black font-bold text-xs">
                *
              </div>
              <span className="text-base font-bold text-white">Virella Study</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
              A data-driven collaborative platform designed to track, analyze, and accelerate learning mastery with clarity and precision.
            </p>
          </div>
          <div>
            <div className="font-mono text-slate-300 font-semibold mb-3 tracking-wider text-[11px]">PLATFORM</div>
            <ul className="space-y-2">
              {["Study Rooms", "Shared Whiteboard", "Pomodoro Sync"].map((t) => (
                <li key={t}>
                  <Link href="/rooms" className="hover:text-white transition-colors">{t}</Link>
                </li>
              ))}
              <li><Link href="/techniques" className="hover:text-white transition-colors">10 Techniques</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-slate-300 font-semibold mb-3 tracking-wider text-[11px]">APPLICATION</div>
            <ul className="space-y-2">
              <li><Link href="/proctored-test" className="hover:text-white transition-colors">Main Test Proctored</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Diagnostic Report</Link></li>
              <li><Link href="/techniques" className="hover:text-white transition-colors">Feynman Clarity AI</Link></li>
              <li><Link href="/techniques" className="hover:text-white transition-colors">Active Recall Battle</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-slate-300 font-semibold mb-3 tracking-wider text-[11px]">COMPLIANCE</div>
            <ul className="space-y-2">
              {["Zero Punitive Auto-Fail", "Explicit Video Consent", "GDPR & FERPA Ready", "Open Source Protocol"].map((t) => (
                <li key={t}><span className="text-slate-400">{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between text-[11px]">
          <div>© 2026 Virella Study Platform. All rights reserved.</div>
          <div className="font-mono text-slate-400 mt-2 sm:mt-0">[ NEXT.JS APP ROUTER + THREE.JS + TAILWIND CSS ]</div>
        </div>
      </footer>
    </div>
  );
}

function TimelineSection() {
  const [selectedPhase, setSelectedPhase] = useState("Phase 1");

  const TIMELINE_DATA: Record<string, { title: string; desc: string; highlight: string }> = {
    "Phase 1": {
      title: "Core Synchronized Rooms",
      desc: "Instant low-latency rooms with server-authoritative Pomodoro timers, batched vector whiteboard sync, and live presence telemetry.",
      highlight: "Zero-Drift Sync",
    },
    "Phase 2": {
      title: "10 Cognitive Study Techniques",
      desc: "Structured session modes: Feynman clarity rounds, AI-generated active recall quiz battles, collaborative mind maps, and SM-2 spaced repetition.",
      highlight: "AI Pedagogy Suite",
    },
    "Phase 3": {
      title: "Proctored Main Test & Diagnostic AI",
      desc: "Client-side MediaPipe integrity checks (gaze, multiple faces, tab shifts) generating constructive diagnostic reports without punitive auto-fails.",
      highlight: "Fair Integrity Engine",
    },
  };

  return (
    <section className="py-24 bg-[#060509] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bracket-tag mb-2.5">[ ARCHITECTURE ROADMAP ]</div>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-3">Our Journey In Mastery</h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-12 max-w-xl">
          Driven by peer collaboration, shaped by cognitive psychology, and constantly evolving to supercharge student learning.
        </p>
        <div className="flex items-center gap-6 sm:gap-12 border-b border-white/[0.1] pb-6 mb-8 overflow-x-auto">
          {["Phase 1", "Phase 2", "Phase 3"].map((k) => (
            <button
              key={k}
              onClick={() => setSelectedPhase(k)}
              className={`text-2xl sm:text-4xl font-light transition-all flex items-center gap-3 shrink-0 ${
                selectedPhase === k ? "text-[#b4f000] font-semibold scale-105" : "text-slate-600 hover:text-slate-400"
              }`}
            >
              <span>{k}</span>
              {selectedPhase === k && <span className="w-2 h-2 rounded-full bg-[#b4f000]" />}
            </button>
          ))}
        </div>
        <div className="glass-panel rounded-2xl p-8 border border-white/10 max-w-3xl">
          <div className="font-mono text-xs text-[#b4f000] mb-2 uppercase tracking-wider">
            [ {TIMELINE_DATA[selectedPhase].highlight} ]
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">{TIMELINE_DATA[selectedPhase].title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{TIMELINE_DATA[selectedPhase].desc}</p>
        </div>
      </div>
    </section>
  );
}

/** Top-level home client component */
export default function HomeClient() {
  return (
    <IntroController>
      <div className="min-h-screen bg-[#05050a] text-white flex flex-col selection:bg-[#b4f000] selection:text-[#05050a]">
        <Navbar />
        <HeroSection />
        <PageBody />
      </div>
    </IntroController>
  );
}
