"use client";

import { useState } from "react";
import { updateSystemSettingAction } from "@/app/actions/admin";

interface SystemSettingRecord {
  key: string;
  value: string;
}

export default function SettingsClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [settings, setSettings] = useState<Record<string, string>>({
    signupsEnabled: initialSettings.signupsEnabled ?? "true",
    emailVerificationStrict: initialSettings.emailVerificationStrict ?? "true",
    maintenanceMode: initialSettings.maintenanceMode ?? "false",
    maxRoomCapacity: initialSettings.maxRoomCapacity ?? "25",
    cameraDefaultOff: initialSettings.cameraDefaultOff ?? "true",
    micDefaultOff: initialSettings.micDefaultOff ?? "true",
    retentionDaysAudit: initialSettings.retentionDaysAudit ?? "90",
    retentionDaysProctor: initialSettings.retentionDaysProctor ?? "30",
    allowedDomains: initialSettings.allowedDomains ?? "",
  });

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleToggle = async (key: string) => {
    const nextVal = settings[key] === "true" ? "false" : "true";
    setSavingKey(key);
    try {
      await updateSystemSettingAction(key, nextVal);
      setSettings((prev) => ({ ...prev, [key]: nextVal }));
      setNotice(`Updated ${key} to ${nextVal}`);
    } catch (err: any) {
      alert(err.message || "Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveText = async (key: string, val: string) => {
    setSavingKey(key);
    try {
      await updateSystemSettingAction(key, val);
      setSettings((prev) => ({ ...prev, [key]: val }));
      setNotice(`Updated ${key}`);
    } catch (err: any) {
      alert(err.message || "Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 860 }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#b4f000", letterSpacing: "0.12em" }}>
          [ SUPER_ADMIN / SETTINGS ]
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
          Global Platform Configuration
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          System-level governance, capacity limits, data retention policies, and real-time maintenance switches.
        </p>
      </div>

      {notice && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Security & Access */}
      <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>Authentication & Access Gating</h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Allow New User Signups</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Permit new registrations via credentials and Google OAuth.</div>
          </div>
          <button
            disabled={savingKey === "signupsEnabled"}
            onClick={() => handleToggle("signupsEnabled")}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: 9999,
              background: settings.signupsEnabled === "true" ? "rgba(180,240,0,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${settings.signupsEnabled === "true" ? "#b4f000" : "#f87171"}`,
              color: settings.signupsEnabled === "true" ? "#b4f000" : "#f87171",
              fontSize: 12,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            {settings.signupsEnabled === "true" ? "● ENABLED" : "○ DISABLED"}
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Strict Email Verification Gating</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Gate all study rooms, dashboard features, and socket sync behind confirmed inboxes.</div>
          </div>
          <button
            disabled={savingKey === "emailVerificationStrict"}
            onClick={() => handleToggle("emailVerificationStrict")}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: 9999,
              background: settings.emailVerificationStrict === "true" ? "rgba(180,240,0,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${settings.emailVerificationStrict === "true" ? "#b4f000" : "#f87171"}`,
              color: settings.emailVerificationStrict === "true" ? "#b4f000" : "#f87171",
              fontSize: 12,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            {settings.emailVerificationStrict === "true" ? "● ENFORCED" : "○ OPTIONAL"}
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Platform Maintenance Mode</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Display emergency maintenance banner and temporarily suspend room connections.</div>
          </div>
          <button
            disabled={savingKey === "maintenanceMode"}
            onClick={() => handleToggle("maintenanceMode")}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: 9999,
              background: settings.maintenanceMode === "true" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${settings.maintenanceMode === "true" ? "#f87171" : "rgba(255,255,255,0.1)"}`,
              color: settings.maintenanceMode === "true" ? "#f87171" : "#94a3b8",
              fontSize: 12,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            {settings.maintenanceMode === "true" ? "⚠ ACTIVE" : "○ NORMAL"}
          </button>
        </div>
      </div>

      {/* Audio & Video Defaults */}
      <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>Audio, Video & Capacity Defaults</h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Camera Defaults to OFF on Room Join</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Protects student privacy by keeping WebRTC cameras disabled until explicitly turned on.</div>
          </div>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#b4f000" }}>✓ LOCKED ON</span>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Microphone Defaults to MUTED on Room Join</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Prevents accidental background audio disruption upon entering active focus rooms.</div>
          </div>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#b4f000" }}>✓ LOCKED ON</span>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Max Study Room Capacity</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Maximum simultaneous participants per LiveKit WebRTC room.</div>
          </div>
          <select
            value={settings.maxRoomCapacity}
            onChange={(e) => handleSaveText("maxRoomCapacity", e.target.value)}
            style={{ padding: "0.4rem 0.8rem", borderRadius: 8, background: "#0e0c16", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", fontSize: 12, fontFamily: "monospace" }}
          >
            <option value="10">10 scholars</option>
            <option value="25">25 scholars (Recommended)</option>
            <option value="50">50 scholars</option>
            <option value="100">100 scholars (Lecture mode)</option>
          </select>
        </div>
      </div>

      {/* Data Retention */}
      <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>Data Privacy & Retention</h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Audit Log Retention Window</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Security audit log entries older than this will be archived.</div>
          </div>
          <span style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace" }}>90 Days</span>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Proctoring Snapshot Auto-Purge</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Candidate webcam snapshots from proctored exams are deleted automatically.</div>
          </div>
          <span style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace" }}>30 Days</span>
        </div>
      </div>
    </div>
  );
}
