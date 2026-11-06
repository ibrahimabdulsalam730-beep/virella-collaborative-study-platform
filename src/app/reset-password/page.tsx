"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AuthCardLayout from "@/components/auth/AuthCardLayout";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { resetPasswordAction } from "@/app/actions/auth";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("No password reset token provided. Please request a new link.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await resetPasswordAction(token, { password, confirmPassword });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to reset password.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          Missing password reset token. Please request a new reset link.
        </div>
        <Link
          href="/forgot-password"
          className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 block shadow-lg"
        >
          Request Reset Link →
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#b4f000]/10 border border-[#b4f000]/30 flex items-center justify-center mx-auto text-[#b4f000]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-light text-white mb-2">
            Password Updated!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your password has been securely reset. You can now sign in with your new credentials.
          </p>
        </div>

        <Link
          href="/login"
          className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-lg"
        >
          <span>Sign In to Virella</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="new-password"
          className="block text-xs font-medium text-slate-300"
        >
          New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono"
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
        <PasswordStrengthMeter password={password} />
      </div>

      {/* Confirm New Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="confirm-new-password"
          className="block text-xs font-medium text-slate-300"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="confirm-new-password"
            type={showConfirmPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono"
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-pill-lime w-full text-xs sm:text-sm py-3.5 mt-2 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span>{isSubmitting ? "Updating Password..." : "Update Password"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCardLayout
      badge="[ RESET PASSWORD ]"
      title="Create New Password"
      subtitle="Enter a strong, unique password to secure your account"
      footerLink={{
        text: "Cancel and return to",
        linkText: "Sign in",
        href: "/login",
      }}
    >
      <Suspense
        fallback={
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Verifying token parameter...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthCardLayout>
  );
}
