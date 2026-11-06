"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthCardLayout from "@/components/auth/AuthCardLayout";
import { verifyEmailAction, resendVerificationAction } from "@/app/actions/auth";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Mail,
  Loader2,
} from "lucide-react";

import { useSession } from "next-auth/react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const { data: session, update } = useSession();

  const [status, setStatus] = useState<"loading" | "success" | "expired" | "invalid">(
    token && email ? "loading" : "invalid"
  );
  const [resendEmail, setResendEmail] = useState(email);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("invalid");
      return;
    }

    let isMounted = true;
    verifyEmailAction(email, token).then(async (res) => {
      if (!isMounted) return;
      if (res.success) {
        setStatus("success");
        if (session) {
          await update({ emailVerified: true });
        }
        // Auto-redirect after short success feedback
        const target = callbackUrl || (session?.user ? "/dashboard" : `/login?verified=true${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
        setTimeout(() => {
          if (isMounted) {
            window.location.href = target;
          }
        }, 1800);
      } else if (res.reason === "expired") {
        setStatus("expired");
      } else {
        setStatus("invalid");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token, email, callbackUrl, session, update]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    try {
      setIsResending(true);
      setResendMessage(null);
      const res = await resendVerificationAction(resendEmail, callbackUrl);
      if (res.success) {
        setResendMessage("A fresh verification link has been sent to your email!");
      } else {
        setResendMessage(res.error || "Failed to resend. Please try again later.");
      }
    } catch {
      setResendMessage("Network error while dispatching link.");
    } finally {
      setIsResending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#b4f000] animate-spin" />
        <div className="text-sm font-medium text-white">
          Verifying your email address...
        </div>
        <p className="text-xs text-slate-400">
          Securing your session token and activating your scholar account.
        </p>
      </div>
    );
  }

  if (status === "success") {
    const nextHref = callbackUrl || (session?.user ? "/dashboard" : `/login?verified=true${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
    const isRoom = callbackUrl.includes("/rooms/");

    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#b4f000]/10 border border-[#b4f000]/30 flex items-center justify-center mx-auto text-[#b4f000] animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-light text-white mb-2">
            Email Confirmed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isRoom
              ? "Your scholar account is fully verified. Connecting you to your synchronized study room..."
              : "Your scholar account is fully active. Taking you to your dashboard..."}
          </p>
        </div>

        <Link
          href={nextHref}
          className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-lg"
        >
          <span>{isRoom ? "Enter Study Room →" : "Continue to Dashboard →"}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Expired or Invalid Token
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300">
        {status === "expired" ? (
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          {status === "expired"
            ? "This verification link has expired. Verification links are single-use and expire after 24 hours."
            : "This verification link is invalid or has already been used. Please request a new link below."}
        </div>
      </div>

      <form onSubmit={handleResend} className="space-y-3">
        <label className="block text-xs font-medium text-slate-300">
          Send a new verification email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            placeholder="scholar@university.edu"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
          />
        </div>

        {resendMessage && (
          <div className="text-xs text-[#b4f000] font-mono">{resendMessage}</div>
        )}

        <button
          type="submit"
          disabled={isResending}
          className="w-full h-11 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
          <span>{isResending ? "Dispatching..." : "Send Verification Email"}</span>
        </button>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCardLayout
      badge="[ VERIFY EMAIL ]"
      title="Email Verification"
      subtitle="Confirming your credentials for secure peer access"
      footerLink={{
        text: "Need to sign in?",
        linkText: "Return to login",
        href: "/login",
      }}
    >
      <Suspense
        fallback={
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading verification token...
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </AuthCardLayout>
  );
}
