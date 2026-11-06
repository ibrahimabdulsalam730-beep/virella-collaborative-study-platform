"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthCardLayout from "@/components/auth/AuthCardLayout";
import { cancelSignupAction } from "@/app/actions/auth";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Home } from "lucide-react";

function CancelSignupContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<"loading" | "success" | "already_verified" | "invalid">(
    token && email ? "loading" : "invalid"
  );

  useEffect(() => {
    if (!token || !email) {
      setStatus("invalid");
      return;
    }

    let isMounted = true;
    cancelSignupAction(email, token).then((res) => {
      if (!isMounted) return;
      if (res.success) {
        setStatus("success");
      } else if (res.reason === "already_verified") {
        setStatus("already_verified");
      } else {
        setStatus("invalid");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token, email]);

  if (status === "loading") {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <div className="text-sm font-medium text-white">
          Cancelling registration...
        </div>
        <p className="text-xs text-slate-400">
          Removing unverified account and associated security tokens.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-light text-white mb-2">
            Account Registration Cancelled
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            The unverified account for <span className="text-white font-mono">{email}</span> has been completely deleted from our database. You will receive no further communications.
          </p>
        </div>

        <Link
          href="/"
          className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-lg"
        >
          <Home className="w-4 h-4" />
          <span>Return to Virella Home</span>
        </Link>
      </div>
    );
  }

  if (status === "already_verified") {
    return (
      <div className="space-y-6 text-center">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300 text-left">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            This account was already verified and cannot be deleted via an email cancellation link. Please sign in to manage account settings.
          </div>
        </div>

        <Link
          href="/login"
          className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2"
        >
          <span>Go to Login</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/10 flex items-start gap-3 text-slate-300 text-left">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-slate-400" />
        <div className="text-xs leading-relaxed">
          This cancellation link is invalid or the unverified account has already been purged. No action is required.
        </div>
      </div>

      <Link
        href="/"
        className="w-full h-11 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all"
      >
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
}

export default function CancelSignupPage() {
  return (
    <AuthCardLayout
      badge="[ CANCEL SIGNUP ]"
      title="Cancel Registration"
      subtitle="Safely purge unverified account data"
      footerLink={{
        text: "Want to create an account?",
        linkText: "Sign up",
        href: "/signup",
      }}
    >
      <Suspense
        fallback={
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading...
          </div>
        }
      >
        <CancelSignupContent />
      </Suspense>
    </AuthCardLayout>
  );
}
