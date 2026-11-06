"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import AuthCardLayout from "@/components/auth/AuthCardLayout";
import { resendVerificationAction } from "@/app/actions/auth";
import {
  Mail,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  LogOut,
  ShieldAlert,
} from "lucide-react";

function VerifyEmailRequiredContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { data: session, update } = useSession();

  const userEmail = session?.user?.email || "";
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Cooldown interval
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Real-time polling check every 3s
  useEffect(() => {
    if (isVerified) return;

    const interval = setInterval(async () => {
      try {
        setIsChecking(true);
        const res = await fetch(`/api/auth/check-verification?ts=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verified) {
            setIsVerified(true);
            clearInterval(interval);
            // Refresh session JWT and navigate to intended destination
            await update({ emailVerified: true });
            setTimeout(() => {
              window.location.href = callbackUrl;
            }, 1200);
          }
        }
      } catch (err) {
        console.error("Polling verification error:", err);
      } finally {
        setIsChecking(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [callbackUrl, update, isVerified]);

  const handleResend = async () => {
    if (!userEmail || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setResendMessage(null);

    try {
      const res = await resendVerificationAction(userEmail, callbackUrl);
      if (res.success) {
        setResendCooldown(60);
        setResendMessage("A new verification link has been dispatched to your email!");
        if (res.devLink) {
          setDevLink(res.devLink);
        }
      } else {
        setResendMessage(res.error || "Failed to resend. Please try again later.");
      }
    } catch (err: any) {
      setResendMessage(err?.message || "Network error while dispatching link.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (isVerified) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#b4f000]/10 border border-[#b4f000]/30 flex items-center justify-center mx-auto text-[#b4f000] animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-light text-white">Email Confirmed!</h2>
        <p className="text-xs text-slate-400 font-mono">
          Redirecting to your destination...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notice Panel */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-amber-300">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
        <div className="text-xs leading-relaxed space-y-1">
          <div className="font-semibold text-amber-200">
            Email Confirmation Required
          </div>
          <div className="text-slate-300">
            Study room synchronization, whiteboard collaboration, and telemetry are locked until your email is confirmed.
          </div>
        </div>
      </div>

      {/* Target Email Box */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-slate-500">
              Account Email
            </div>
            <div className="text-xs font-mono text-white truncate">
              {userEmail || "your account email"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LISTENING</span>
        </div>
      </div>

      {/* Dev helper if link is active */}
      {devLink && (
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
          <div className="text-[11px] font-mono text-[#b4f000] uppercase mb-1.5 flex items-center justify-between">
            <span>[ DEV TESTING MODE ]</span>
            <span className="text-slate-400 font-sans">Simulated Dispatch</span>
          </div>
          <a
            href={devLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-white underline break-all flex items-center gap-1.5"
          >
            <span>Click to confirm email in new tab</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      )}

      {resendMessage && (
        <div className="text-xs text-[#b4f000] font-mono text-center">
          {resendMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className="btn-pill-lime w-full text-xs py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
          <span>
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : "Resend Confirmation Email"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-11 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] text-xs font-mono text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out / Change Account</span>
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailRequiredPage() {
  return (
    <AuthCardLayout
      badge="[ EMAIL CONFIRMATION ]"
      title="Verify Your Email"
      subtitle="Complete your scholar authentication to enter synchronized rooms"
      footerLink={{
        text: "Need assistance?",
        linkText: "Support & FAQs",
        href: "/",
      }}
    >
      <Suspense
        fallback={
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Checking verification status...
          </div>
        }
      >
        <VerifyEmailRequiredContent />
      </Suspense>
    </AuthCardLayout>
  );
}
