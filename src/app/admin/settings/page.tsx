import { requireSuperAdminRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Settings & Feature Flags — Super Admin",
  description: "Platform-level switches, capacity thresholds, and security policies",
};

export default async function AdminSettingsPage() {
  await requireSuperAdminRole();

  const settingsList = await prisma.systemSetting.findMany().catch(() => []);
  const settingsMap: Record<string, string> = {};
  for (const s of settingsList) {
    settingsMap[s.key] = s.value;
  }

  return <SettingsClient initialSettings={settingsMap} />;
}
