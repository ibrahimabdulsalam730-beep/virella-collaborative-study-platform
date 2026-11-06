"use client";

import React from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passedCount = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  const strengthLabels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-red-500",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-[#b4f000]",
  ];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2.5">
      {/* Strength Progress Bar */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              level <= passedCount ? strengthColors[passedCount] : "bg-white/10"
            }`}
          />
        ))}
        <span className="text-[11px] font-mono text-slate-400 ml-2 w-12 text-right">
          {strengthLabels[passedCount]}
        </span>
      </div>

      {/* Checklist of Security Rules */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
        <div
          className={`flex items-center gap-1.5 ${
            hasMinLength ? "text-[#b4f000]" : "text-slate-500"
          }`}
        >
          {hasMinLength ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span>Min 8 characters</span>
        </div>

        <div
          className={`flex items-center gap-1.5 ${
            hasUpper ? "text-[#b4f000]" : "text-slate-500"
          }`}
        >
          {hasUpper ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span>1 uppercase letter</span>
        </div>

        <div
          className={`flex items-center gap-1.5 ${
            hasLower ? "text-[#b4f000]" : "text-slate-500"
          }`}
        >
          {hasLower ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span>1 lowercase letter</span>
        </div>

        <div
          className={`flex items-center gap-1.5 ${
            hasNumber ? "text-[#b4f000]" : "text-slate-500"
          }`}
        >
          {hasNumber ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span>1 number</span>
        </div>
      </div>
    </div>
  );
}
