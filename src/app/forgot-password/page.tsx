"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthCardLayout from "@/components/auth/AuthCardLayout";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Mail, ArrowRight, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your account email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await forgotPasswordAction({ email });

      if (!res.success) {
        setErrorMessage(res.error || "An error occurred. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
      if (res.devLink) {
        setDevLink(res.devLink);
      }
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      badge="[ RECOVERY ]"
      title="Reset Password"
      subtitle="Enter your email and we'll send you a single-use recovery link"
      footerLink={{
        text: "Remembered your password?",
        linkText: "Return to login",
        href: "/login",
      }}
    >
      {submitted ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#b4f000]/10 border border-[#b4f000]/30 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-[#b4f000] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 leading-relaxed">
              If an account exists with <strong className="text-white">{email}</strong>, we have dispatched a password reset link. Please check your inbox and spam folder.
            </div>
          </div>

          {/* Dev-mode helper */}
          {devLink && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
              <div className="text-[11px] font-mono text-[#b4f000] uppercase mb-1.5 flex items-center justify-between">
                <span>[ DEV TESTING LINK ]</span>
                <span className="text-slate-400 font-sans">Simulated Reset Link</span>
              </div>
              <a
                href={devLink}
                className="text-purple-300 hover:text-white underline break-all flex items-center gap-1.5"
              >
                <span>Click here to set new password</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          )}

          <div className="text-xs text-slate-400 leading-relaxed text-center">
            The link is valid for 1 hour. If you don't receive an email within 5 minutes, ensure the email address matches your registered account.
          </div>

          <Link
            href="/login"
            className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Back to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-300"
            >
              Account Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="scholar@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 mt-2 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? "Dispatching Link..." : "Send Reset Link"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </AuthCardLayout>
  );
}
