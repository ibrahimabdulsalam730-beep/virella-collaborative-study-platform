"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Navbar from "@/components/navigation/Navbar";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import {
  changePasswordAction,
  updateProfileAction,
  deleteAccountAction,
} from "@/app/actions/auth";
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Globe,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: session, update } = useSession();

  // Profile Edit State
  const [name, setName] = useState(session?.user?.name || "");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Active Sessions State
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // Delete Account Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Update Profile Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!name.trim()) return;

    try {
      setIsUpdatingProfile(true);
      const res = await updateProfileAction({ name: name.trim() });
      if (res.success) {
        await update({ name: name.trim() });
        setProfileMessage("Profile updated successfully!");
      } else {
        setProfileMessage(res.error || "Failed to update profile.");
      }
    } catch {
      setProfileMessage("Network error updating profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 2. Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (res.success) {
        setPasswordMessage({
          type: "success",
          text: "Password changed successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: res.error || "Failed to change password.",
        });
      }
    } catch {
      setPasswordMessage({
        type: "error",
        text: "Network error while changing password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 3. Log out of all devices
  const handleLogoutAllDevices = async () => {
    setSessionMessage("Terminating active sessions on other devices...");
    setTimeout(async () => {
      await signOut({ callbackUrl: "/" });
    }, 800);
  };

  // 4. Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    try {
      setIsDeleting(true);
      await deleteAccountAction();
      router.push("/");
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col selection:bg-[#b4f000] selection:text-[#05050a]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Heading */}
        <div className="mb-10">
          <div className="bracket-tag mb-2">[ SETTINGS ]</div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-2">
            Account &amp; Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your credentials, connected identity providers, and active scholar sessions.
          </p>
        </div>

        <div className="space-y-8">
          {/* SECTION 1: Profile Information */}
          <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
            <div className="flex items-center gap-2.5 mb-6 text-sm font-semibold text-white">
              <User className="w-4 h-4 text-[#b4f000]" />
              <span>Profile Information</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
              {profileMessage && (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
                  {profileMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={session?.user?.email || ""}
                  className="w-full h-11 px-4 rounded-xl border border-white/[0.06] bg-white/[0.01] text-sm text-slate-400 cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Email changes require verification and can be requested via support.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Assigned Scholar Role
                </label>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/20 text-xs font-mono text-purple-300 uppercase">
                  <Shield className="w-3.5 h-3.5 text-[#b4f000]" />
                  <span>{session?.user?.role || "STUDENT"}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="btn-pill-lime text-xs py-2.5 px-5 mt-2"
              >
                {isUpdatingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </section>

          {/* SECTION 2: Change Password */}
          <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
            <div className="flex items-center gap-2.5 mb-6 text-sm font-semibold text-white">
              <KeyRound className="w-4 h-4 text-[#b4f000]" />
              <span>Change Password</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              {passwordMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    passwordMessage.type === "success"
                      ? "bg-[#b4f000]/10 border-[#b4f000]/30 text-[#b4f000]"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="btn-pill-lime text-xs py-2.5 px-5 mt-2"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </section>

          {/* SECTION 3: Connected Accounts */}
          <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
            <div className="flex items-center gap-2.5 mb-6 text-sm font-semibold text-white">
              <Globe className="w-4 h-4 text-[#b4f000]" />
              <span>Connected Identity Accounts</span>
            </div>

            <div className="space-y-3 max-w-lg">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center font-bold text-xs text-white">
                    G
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Google</div>
                    <div className="text-[11px] text-slate-400">
                      Single Sign-On for synchronized cohorts
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#b4f000]">Active</span>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Email &amp; Password
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Direct credentials authentication
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#b4f000]">Enabled</span>
              </div>
            </div>
          </section>

          {/* SECTION 4: Active Sessions */}
          <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
                <LogOut className="w-4 h-4 text-[#b4f000]" />
                <span>Active Scholar Sessions</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-lg mb-5 leading-relaxed">
              If you suspect unapproved access to your account, you can terminate all other active browser sessions immediately.
            </p>

            {sessionMessage && (
              <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 max-w-lg">
                {sessionMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogoutAllDevices}
              className="btn-pill-dark text-xs py-2.5 px-4.5"
            >
              Log out of all devices
            </button>
          </section>

          {/* SECTION 5: Danger Zone (Delete Account) */}
          <section className="rounded-2xl p-6 sm:p-8 border border-red-500/20 bg-red-950/10">
            <div className="flex items-center gap-2.5 mb-2 text-sm font-semibold text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 max-w-lg leading-relaxed">
              Permanently delete your scholar account, completed study history, whiteboard room records, and session data. This action cannot be reversed.
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-300 transition-colors"
            >
              Delete Account
            </button>
          </section>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/30 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-light text-white mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This will permanently delete your account and remove all data from our servers. To confirm, please type <strong className="text-white font-mono">DELETE</strong> below.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-red-500/30 bg-black/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-400 transition-colors font-mono"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2.5 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-xs font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
