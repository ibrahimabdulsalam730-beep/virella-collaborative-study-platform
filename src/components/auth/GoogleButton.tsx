"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface GoogleButtonProps {
  text?: string;
  callbackUrl?: string;
}

export default function GoogleButton({
  text = "Continue with Google",
  callbackUrl = "/dashboard",
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  // Reset loading if user navigates back or window regains focus
  // (covers browser "back" after Google cancel without explicit error)
  useEffect(() => {
    const handleFocus = () => setLoading(false);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // redirect:true is intentional — Auth.js handles the redirect to Google.
      // The authorization `prompt: "select_account"` is set server-side in auth.ts
      // so every click always shows the Google account chooser.
      await signIn("google", {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center gap-3 text-sm font-medium text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
    >
      {/* Official Google 'G' Multi-color SVG */}
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{loading ? "Connecting to Google..." : text}</span>
    </button>
  );
}
