"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useIntroPhase } from "@/components/intro/IntroController";
import { Menu, X, RotateCcw } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const { phase, navbarLogoRef, replayIntro } = useIntroPhase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Center logo is visible once logo lands in Step 2 ('treeGrow', 'siteReveal', 'done')
  const logoVisible =
    phase === "treeGrow" || phase === "siteReveal" || phase === "done";

  // Navbar chrome (links, buttons, borders, blur) reveals at Step 4 ('siteReveal', 'done')
  const chromeVisible = phase === "siteReveal" || phase === "done";

  return (
    <header
      className={`w-full sticky top-0 z-40 transition-colors duration-500 ${
        chromeVisible
          ? "border-b border-white/[0.08] bg-[#05050a]/80 backdrop-blur-xl shadow-lg shadow-black/20"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 grid grid-cols-3 items-center">
        
        {/* ─── LEFT: NAV LINKS (About, Features, Impacts, Resources) ─── */}
        <div
          className={`flex items-center gap-6 lg:gap-8 transition-all duration-500 ease-out ${
            chromeVisible
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-3 pointer-events-none"
          }`}
        >
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-300">
            <Link
              href="/#about"
              className="hover:text-white transition-colors hover:text-[#b4f000]"
            >
              About
            </Link>
            <Link
              href="/#features"
              className="hover:text-white transition-colors hover:text-[#b4f000]"
            >
              Features
            </Link>
            <Link
              href="/#impacts"
              className="hover:text-white transition-colors hover:text-[#b4f000]"
            >
              Impacts
            </Link>
            <Link
              href="/techniques"
              className="hover:text-white transition-colors hover:text-[#b4f000]"
            >
              Resources
            </Link>
          </nav>
        </div>

        {/* ─── CENTER: LOGO (Target for Step 2 Shared-Element Shrink) ─── */}
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group select-none"
            aria-label="Virella Study Home"
          >
            {/* Target element measured by getBoundingClientRect */}
            <div
              ref={navbarLogoRef}
              id="navbar-logo-target"
              className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1428] to-[#0c0818] border border-white/10 flex items-center justify-center transition-opacity duration-200 group-hover:border-[#b4f000]/50 shadow-md ${
                logoVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              {/* Crisp 8-ray asterisk logo matching the preloader */}
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                className="w-5 h-5 text-[#b4f000] fill-none group-hover:scale-110 transition-transform"
              >
                <path
                  d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>

            {/* Wordmark next to logo */}
            <div
              className={`flex items-baseline gap-1.5 transition-all duration-300 ${
                logoVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="text-lg font-bold tracking-tight text-white">
                Virella
              </span>
              <span className="text-[#b4f000] font-mono text-[11px] tracking-widest font-normal uppercase hidden sm:inline">
                [STUDY]
              </span>
            </div>
          </Link>
        </div>

        {/* ─── RIGHT: UserMenu (Log in/Get Started or Avatar Dropdown) + Replay Button ─── */}
        <div
          className={`flex items-center justify-end gap-3 transition-all duration-500 ease-out ${
            chromeVisible
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-3 pointer-events-none"
          }`}
        >
          {/* Replay Intro button */}
          <button
            onClick={replayIntro}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/[0.08] transition-colors"
            title="Replay cinematic intro sequence"
          >
            <RotateCcw className="w-3 h-3 text-[#b4f000]" />
            <span>Replay</span>
          </button>

          {/* Dynamic User Menu */}
          <UserMenu />
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && chromeVisible && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#07050e]/95 backdrop-blur-2xl px-6 py-6 space-y-4">
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-white"
          >
            About
          </Link>
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-white"
          >
            Features
          </Link>
          <Link
            href="/#impacts"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-white"
          >
            Impacts
          </Link>
          <Link
            href="/techniques"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-white"
          >
            Resources
          </Link>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                replayIntro();
              }}
              className="text-xs font-mono text-slate-400 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-[#b4f000]" />
              <span>Replay Intro</span>
            </button>
            <Link
              href="/rooms"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-[#b4f000] font-medium"
            >
              Browse Rooms →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
