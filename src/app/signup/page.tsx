"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthCardLayout from "@/components/auth/AuthCardLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { signupAction, resendVerificationAction } from "@/app/actions/auth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as "STUDENT" | "INSTRUCTOR",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verification Sent State
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Real-time polling check while on "Check your inbox" screen
  useEffect(() => {
    if (!verificationSentEmail || autoVerified) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-verification?email=${encodeURIComponent(verificationSentEmail)}&ts=${Date.now()}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.verified) {
            setAutoVerified(true);
            clearInterval(interval);
            setTimeout(() => {
              window.location.href = `/login?verified=true&email=${encodeURIComponent(verificationSentEmail)}`;
            }, 1200);
          }
        }
      } catch (err) {
        console.error("Signup verification polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [verificationSentEmail, autoVerified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick checks
    if (!formData.name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!formData.agreeToTerms) {
      setErrorMessage("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await signupAction(formData);

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create account.");
        setIsSubmitting(false);
        return;
      }

      setVerificationSentEmail(res.email || formData.email);
      if (res.devLink) {
        setDevLink(res.devLink);
      }
      setResendCooldown(60);
    } catch (err) {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!verificationSentEmail || resendCooldown > 0) return;
    setResendMessage(null);

    try {
      setResendCooldown(60);
      const res = await resendVerificationAction(verificationSentEmail);
      if (res.success) {
        setResendMessage("A new verification link has been sent to your inbox!");
        if (res.devLink) {
          setDevLink(res.devLink);
        }
      } else {
        setResendMessage(res.error || "Failed to resend. Please try again later.");
      }
    } catch {
      setResendMessage("Network error while resending link.");
    }
  };

  // ─── POST-SIGNUP "CHECK YOUR INBOX" SCREEN ───
  if (verificationSentEmail) {
    if (autoVerified) {
      return (
        <AuthCardLayout
          badge="[ CONFIRMED ]"
          title="Email Confirmed!"
          subtitle="Your account is active. Taking you to login..."
        >
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#b4f000]/10 border border-[#b4f000]/30 flex items-center justify-center mx-auto text-[#b4f000] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Redirecting to sign in...
            </p>
          </div>
        </AuthCardLayout>
      );
    }

    return (
      <AuthCardLayout
        badge="[ VERIFICATION PENDING ]"
        title="Check your inbox"
        subtitle={`We sent a secure confirmation link to ${verificationSentEmail}`}
        footerLink={{
          text: "Already verified?",
          linkText: "Sign in to your account",
          href: "/login",
        }}
      >
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#b4f000]/10 border border-[#b4f000]/25 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-[#b4f000] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 leading-relaxed">
              Click the confirmation button in your email to activate your account. This screen will automatically detect when you verify.
            </div>
          </div>

          {/* Dev-mode quick access helper */}
          {devLink && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
              <div className="text-[11px] font-mono text-[#b4f000] uppercase mb-1.5 flex items-center justify-between">
                <span>[ DEV TESTING MODE ]</span>
                <span className="text-slate-400 font-sans">Simulated Email Link</span>
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

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full h-11 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
              <span>
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : "Resend verification email"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVerificationSentEmail(null);
                setDevLink(null);
                setErrorMessage(null);
              }}
              className="w-full h-11 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] text-xs font-mono text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              <span>← Change Email Address</span>
            </button>

            <Link
              href="/login"
              className="btn-pill-lime w-full text-xs text-center py-3"
            >
              Go to Login →
            </Link>
          </div>
        </div>
      </AuthCardLayout>
    );
  }

  // ─── MAIN SIGNUP FORM ───
  return (
    <AuthCardLayout
      badge="[ SIGNUP ]"
      title="Create Account"
      subtitle="Join collaborative study rooms, live sync, and cognitive pedagogy"
      footerLink={{
        text: "Already have an account?",
        linkText: "Sign in",
        href: "/login",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Continue with Google */}
        <GoogleButton text="Continue with Google" callbackUrl="/onboarding" />

        {/* "Or" Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative bg-[#0b0914] px-3 font-mono text-[11px] text-slate-500 uppercase">
            or with email
          </span>
        </div>

        {/* Role Selector: Student vs Instructor */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Account Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "STUDENT" })}
              className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                formData.role === "STUDENT"
                  ? "border-[#b4f000] bg-[#b4f000]/10 text-[#b4f000] font-semibold"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "INSTRUCTOR" })}
              className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                formData.role === "INSTRUCTOR"
                  ? "border-[#b4f000] bg-[#b4f000]/10 text-[#b4f000] font-semibold"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Instructor</span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-medium text-slate-300"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Elena Rostova"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-white/10 bg-white/[0.03] focus:bg-white/[0.06] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
            />
          </div>
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
          <label
            htmlFor="password"
            className="block text-xs font-medium text-slate-300"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
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

          {/* Live Password Strength Meter */}
          <PasswordStrengthMeter password={formData.password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium text-slate-300"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-white/[0.03] focus:bg-white/[0.06] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Terms and Privacy Checkbox */}
        <div className="pt-2 flex items-start gap-2.5">
          <input
            id="agreeToTerms"
            type="checkbox"
            required
            checked={formData.agreeToTerms}
            onChange={(e) =>
              setFormData({ ...formData, agreeToTerms: e.target.checked })
            }
            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#b4f000] focus:ring-[#b4f000] focus:ring-offset-0 focus:ring-1"
          />
          <label htmlFor="agreeToTerms" className="text-xs text-slate-400 leading-snug">
            I agree to the{" "}
            <Link href="/terms" className="text-[#b4f000] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#b4f000] hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 mt-4 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{isSubmitting ? "Creating Account..." : "Create Account"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </AuthCardLayout>
  );
}
