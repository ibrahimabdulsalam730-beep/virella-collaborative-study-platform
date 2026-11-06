"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Sparkles,
} from "lucide-react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <div className="w-20 h-8 rounded-full bg-white/[0.04] animate-pulse" />
        <div className="w-24 h-8 rounded-full bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  // LOGGED OUT STATE
  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-full hover:bg-white/[0.05] transition-colors"
        >
          Log in
        </Link>

        <Link
          href="/signup"
          className="btn-pill-lime text-xs py-2 px-4.5 flex items-center gap-1.5 shadow-lg"
        >
          <span>Get Started</span>
        </Link>
      </div>
    );
  }

  // LOGGED IN STATE: User Avatar Dropdown
  const user = session.user;
  const displayName = user.name || "Scholar";
  const initials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "VS";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-all group"
      >
        <span className="text-xs font-medium text-white max-w-[110px] truncate hidden sm:inline">
          {displayName}
        </span>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-[#b4f000] text-[#05050a] flex items-center justify-center font-bold text-[11px] shadow-sm">
          {initials}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-white/10 bg-[#0c0918]/95 backdrop-blur-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Header */}
          <div className="px-3 py-2.5 border-b border-white/[0.08]">
            <div className="font-semibold text-white truncate">{displayName}</div>
            <div className="text-[11px] text-slate-400 truncate font-mono">
              {user.email}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/20 text-[10px] font-mono text-purple-300">
              <Shield className="w-2.5 h-2.5 text-[#b4f000]" />
              <span>{user.role || "STUDENT"}</span>
            </div>
          </div>

          {/* Links */}
          <div className="py-1.5 space-y-0.5">
            <Link
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#b4f000]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/rooms"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Study Rooms</span>
            </Link>

            <Link
              href="/settings/account"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Account Settings</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="pt-1.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={async () => {
                setDropdownOpen(false);
                // Pass redirect:false so we can clear local state first,
                // then navigate. This ensures the Next-Auth session cookie is
                // fully removed before the next page load, guaranteeing the
                // Google account-chooser reappears on the very next click.
                await signOut({ callbackUrl: "/", redirect: true });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
