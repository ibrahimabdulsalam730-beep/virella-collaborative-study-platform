import { requireAdminRole } from "@/lib/session";
import AnalyticsClient from "./AnalyticsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & Platform Velocity — Admin",
  description: "Platform growth, retention, and feature engagement metrics",
};

export default async function AdminAnalyticsPage() {
  await requireAdminRole();
  return <AnalyticsClient />;
}
