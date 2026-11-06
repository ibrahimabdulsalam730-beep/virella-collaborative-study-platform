"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCardLayout from "@/components/auth/AuthCardLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import { loginAction, resendVerificationAction } from "@/app/actions/auth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Friendly Google cancel/error message
  const googleError = searchParams.get("error");
  const googleCancelled = searchParams.get("google_cancelled") === "1";
  const googleMessage =
    googleCancelled
      ? "You closed the Google sign-in window. Try again whenever you're ready."
      : googleError === "OAuthAccountNotLinked"
      ? "This Google account is linked to a different sign-in method. Sign in with your email and password instead."
      : googleError === "AccessDenied"
      ? "Google sign-in was cancelled or access was denied."
      : null;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unverified email recovery state
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setUnverifiedEmail(null);
    setResendStatus(null);

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await loginAction(formData);

      if (!res.success) {
        if (res.error === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(res.email || formData.email);
          setErrorMessage(
            "Your email address has not been verified yet. Please check your inbox or resend the verification link below."
          );
        } else {
          setErrorMessage(res.error || "Invalid email or password");
        }
        setIsSubmitting(false);
        return;
      }

      // Successful login: redirect to callback URL or dashboard
      window.location.href = callbackUrl;
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleResendForUnverified = async () => {
    if (!unverifiedEmail) return;
    try {
      setResending(true);
      const res = await resendVerificationAction(unverifiedEmail);
      if (res.success) {
        setResendStatus("Verification email sent! Please check your inbox.");
        if (res.devLink) {
          setDevLink(res.devLink);
        }
      } else {
        setResendStatus(res.error || "Failed to resend. Please try again later.");
      }
    } catch {
      setResendStatus("Network error while resending link.");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Google cancel / error friendly message */}
      {googleMessage && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{googleMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Unverified email helper card */}
      {unverifiedEmail && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-2">
          {devLink && (
            <div className="mb-2 pb-2 border-b border-purple-500/20">
              <span className="text-[10px] font-mono text-[#b4f000] block mb-1">
                [ DEV LINK ]
              </span>
              <a
                href={devLink}
                className="text-purple-300 hover:text-white underline break-all flex items-center gap-1.5"
              >
                <span>Click here to verify email now</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
          {resendStatus && (
            <div className="text-[11px] text-[#b4f000] font-mono">{resendStatus}</div>
          )}
          <button
            type="button"
            onClick={handleResendForUnverified}
            disabled={resending}
            className="text-xs text-[#b4f000] hover:underline flex items-center gap-1.5 font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
            <span>{resending ? "Sending..." : "Resend verification link"}</span>
          </button>
        </div>
      )}

      {/* Continue with Google */}
      <GoogleButton text="Continue with Google" callbackUrl={callbackUrl} />

      {/* "Or" Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <span className="relative bg-[#0b0914] px-3 font-mono text-[11px] text-slate-500 uppercase">
          or sign in with email
        </span>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-medium text-slate-300"
        >
          Email Address
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
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-white/10 bg-white/[0.03] focus:bg-white/[0.06] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-slate-300"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] text-[#b4f000] hover:underline font-mono"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-white/[0.03] focus:bg-white/[0.06] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* "Remember Me" Checkbox - custom lime-themed */}
      <div className="pt-1 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none group">
          {/* Visually hidden native checkbox for accessibility */}
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) =>
              setFormData({ ...formData, rememberMe: e.target.checked })
            }
            className="sr-only"
          />
          {/* Custom checkbox indicator */}
          <span
            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
              formData.rememberMe
                ? "bg-[#b4f000] border-[#b4f000]"
                : "bg-white/5 border-white/20 group-hover:border-white/40"
            }`}
          >
            {formData.rememberMe && (
              <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span>Remember me on this device (30 days)</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 mt-3 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span>{isSubmitting ? "Signing in..." : "Sign in to Virella"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthCardLayout
      badge="[ SIGN IN ]"
      title="Welcome Back"
      subtitle="Access your synchronized rooms, whiteboard notes, and session analytics"
      footerLink={{
        text: "Don't have an account yet?",
        linkText: "Create an account",
        href: "/signup",
      }}
    >
      <Suspense
        fallback={
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading authentication...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthCardLayout>
  );
}
