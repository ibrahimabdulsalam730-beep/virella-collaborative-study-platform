"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, ShieldCheck, Zap } from "lucide-react";

interface AuthCardLayoutProps {
  badge: string; // e.g. "[ CREATE ACCOUNT ]" or "[ SIGN IN ]"
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

export default function AuthCardLayout({
  badge,
  title,
  subtitle,
  children,
  footerLink,
}: AuthCardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col justify-between selection:bg-[#b4f000] selection:text-[#05050a] relative overflow-x-hidden">
      {/* Background Gradients & Grid */}
      <div className="fixed inset-0 bg-hero-grid bg-violet-radial pointer-events-none opacity-70" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Top Simple Bar */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Small Brand Logo */}
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a1428] to-[#0d0918] border border-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#b4f000] fill-none">
              <path
                d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            Virella <span className="text-[#b4f000] font-mono text-[10px]">[STUDY]</span>
          </span>
        </Link>
      </header>

      {/* Main Container: Split on Desktop, Centered Column on Mobile */}
      <main className="relative z-10 flex-1 flex items-center justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full max-w-5xl">
          
          {/* Left Column: Form Card */}
          <div className="lg:col-span-7 flex flex-col items-center sm:items-start w-full">
            <div className="w-full max-w-md mx-auto sm:mx-0 glass-panel p-7 sm:p-9 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl">
              
              {/* Bracket Badge */}
              <div className="bracket-tag mb-3">{badge}</div>

              {/* Title & Subtitle */}
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-2">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                {subtitle}
              </p>

              {/* Form Content */}
              {children}

              {/* Footer Alternative Link */}
              {footerLink && (
                <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400">
                  <span>{footerLink.text} </span>
                  <Link
                    href={footerLink.href}
                    className="text-[#b4f000] hover:underline font-medium ml-1"
                  >
                    {footerLink.linkText}
                  </Link>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Visual Stage (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center items-center relative">
            <div className="w-full max-w-[400px] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative group">
              
              {/* Generated Illustration */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/auth-side-illustration.jpg"
                alt="Virella Study platform UI preview showing synchronized Pomodoro timer, live group sessions, and cognitive progress tracking"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ aspectRatio: "3/4" }}
              />

              {/* Overlay Gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07050e]/95 via-[#07050e]/20 to-transparent pointer-events-none" />

              {/* Floating Badge Top */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5">
                  <div className="w-4 h-4 rounded-md bg-gradient-to-br from-[#1a1428] to-[#0c0818] border border-white/15 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#b4f000] fill-none">
                      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="font-mono text-[10px] text-[#b4f000] tracking-widest uppercase">[ COGNITIVE SUITE ]</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#b4f000] animate-ping" />
              </div>

              {/* Bottom overlay info */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-sm font-light text-white leading-snug mb-3">
                  Synchronized study cohorts, live cognitive tests, and AI pedagogy.
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#b4f000]" />
                    <span>Fair Proctoring</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-[#b4f000]" />
                    <span>Zero-Drift Sync</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer Minimal Notice */}
      <footer className="relative z-10 py-6 text-center text-[11px] text-slate-500 font-mono border-t border-white/[0.05]">
        <span>© 2026 Virella Study Platform. Secure Encrypted Authentication.</span>
      </footer>
    </div>
  );
}
